-- Hotfix for CRM review/merge flows after initial CRM migration was already applied.
-- 1) linked_existing should not force conflicting phone/email onto target client.
-- 2) merge should update secondary->merged before assigning canonical values on primary.

CREATE OR REPLACE FUNCTION crm_merge_clients(
  primary_client_id UUID,
  secondary_client_id UUID,
  note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_primary clients%ROWTYPE;
  v_secondary clients%ROWTYPE;
  v_contact RECORD;
  v_primary_phone TEXT;
  v_primary_email TEXT;
BEGIN
  IF primary_client_id IS NULL OR secondary_client_id IS NULL THEN
    RAISE EXCEPTION 'primary_client_id and secondary_client_id are required';
  END IF;

  IF primary_client_id = secondary_client_id THEN
    RETURN primary_client_id;
  END IF;

  SELECT * INTO v_primary
  FROM clients
  WHERE id = primary_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Primary client not found: %', primary_client_id;
  END IF;

  SELECT * INTO v_secondary
  FROM clients
  WHERE id = secondary_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Secondary client not found: %', secondary_client_id;
  END IF;

  UPDATE assessment_results
  SET client_id = primary_client_id
  WHERE client_id = secondary_client_id;

  UPDATE pricing_leads
  SET client_id = primary_client_id
  WHERE client_id = secondary_client_id;

  FOR v_contact IN
    SELECT *
    FROM client_contacts
    WHERE client_id = secondary_client_id
  LOOP
    INSERT INTO client_contacts (
      id,
      client_id,
      contact_type,
      contact_value,
      is_primary,
      first_seen_at,
      last_seen_at,
      source_table,
      source_row_id,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      primary_client_id,
      v_contact.contact_type,
      v_contact.contact_value,
      v_contact.is_primary,
      v_contact.first_seen_at,
      v_contact.last_seen_at,
      v_contact.source_table,
      v_contact.source_row_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (contact_type, contact_value)
    DO UPDATE SET
      client_id = primary_client_id,
      is_primary = (client_contacts.is_primary OR EXCLUDED.is_primary),
      first_seen_at = LEAST(client_contacts.first_seen_at, EXCLUDED.first_seen_at),
      last_seen_at = GREATEST(client_contacts.last_seen_at, EXCLUDED.last_seen_at),
      source_table = EXCLUDED.source_table,
      source_row_id = EXCLUDED.source_row_id,
      updated_at = NOW()
    WHERE client_contacts.client_id IN (primary_client_id, secondary_client_id);
  END LOOP;

  DELETE FROM client_contacts
  WHERE client_id = secondary_client_id;

  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY contact_type
        ORDER BY last_seen_at DESC, updated_at DESC, created_at DESC, id DESC
      ) AS rn
    FROM client_contacts
    WHERE client_id = primary_client_id
  )
  UPDATE client_contacts cc
  SET
    is_primary = (ranked.rn = 1),
    updated_at = NOW()
  FROM ranked
  WHERE cc.id = ranked.id;

  SELECT contact_value INTO v_primary_phone
  FROM client_contacts
  WHERE client_id = primary_client_id
    AND contact_type = 'phone'
    AND is_primary = TRUE
  LIMIT 1;

  SELECT contact_value INTO v_primary_email
  FROM client_contacts
  WHERE client_id = primary_client_id
    AND contact_type = 'email'
    AND is_primary = TRUE
  LIMIT 1;

  UPDATE clients
  SET
    status = 'merged',
    merged_into_client_id = primary_client_id,
    canonical_phone_e164 = NULL,
    canonical_email = NULL,
    updated_at = NOW()
  WHERE id = secondary_client_id;

  UPDATE clients
  SET
    status = 'active',
    full_name = COALESCE(clients.full_name, v_secondary.full_name),
    canonical_phone_e164 = v_primary_phone,
    canonical_email = v_primary_email,
    last_seen_at = GREATEST(clients.last_seen_at, v_secondary.last_seen_at, NOW()),
    updated_at = NOW()
  WHERE id = primary_client_id;

  UPDATE client_link_reviews
  SET candidate_client_ids = (
    SELECT ARRAY(
      SELECT DISTINCT
        CASE
          WHEN candidate_id = secondary_client_id THEN primary_client_id
          ELSE candidate_id
        END
      FROM unnest(candidate_client_ids) AS candidate_id
      ORDER BY 1
    )
  )
  WHERE secondary_client_id = ANY(candidate_client_ids);

  UPDATE client_link_reviews
  SET placeholder_client_id = primary_client_id
  WHERE placeholder_client_id = secondary_client_id
    AND status = 'open';

  RETURN primary_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION crm_resolve_client_link_review(
  review_id UUID,
  action TEXT,
  target_client_id UUID DEFAULT NULL,
  note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_review client_link_reviews%ROWTYPE;
  v_action TEXT := NULLIF(lower(btrim(action)), '');
  v_candidate_id UUID;
  v_resolved_client_id UUID;
BEGIN
  IF v_action NOT IN ('linked_existing', 'merged_clients', 'kept_placeholder') THEN
    RAISE EXCEPTION 'Unsupported action: %', action;
  END IF;

  SELECT * INTO v_review
  FROM client_link_reviews
  WHERE id = review_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found: %', review_id;
  END IF;

  IF v_review.status <> 'open' THEN
    RAISE EXCEPTION 'Review is not open: %', review_id;
  END IF;

  IF v_action = 'kept_placeholder' THEN
    v_resolved_client_id := v_review.placeholder_client_id;
  ELSIF v_action = 'linked_existing' THEN
    IF target_client_id IS NULL THEN
      RAISE EXCEPTION 'target_client_id is required for linked_existing';
    END IF;

    IF v_review.placeholder_client_id <> target_client_id THEN
      PERFORM crm_merge_clients(target_client_id, v_review.placeholder_client_id, note);
    END IF;

    IF v_review.source_table = 'assessment_results' THEN
      UPDATE assessment_results
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    ELSIF v_review.source_table = 'pricing_leads' THEN
      UPDATE pricing_leads
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    END IF;

    -- Do not force incoming phone/email onto target in linked_existing mode.
    PERFORM crm_apply_client_identity(
      target_client_id,
      v_review.incoming_name,
      NULL,
      NULL,
      v_review.source_table,
      v_review.source_row_id
    );

    v_resolved_client_id := target_client_id;
  ELSE
    IF target_client_id IS NULL THEN
      RAISE EXCEPTION 'target_client_id is required for merged_clients';
    END IF;

    IF v_review.candidate_client_ids IS NOT NULL THEN
      FOREACH v_candidate_id IN ARRAY v_review.candidate_client_ids
      LOOP
        IF v_candidate_id IS NOT NULL AND v_candidate_id <> target_client_id THEN
          PERFORM crm_merge_clients(target_client_id, v_candidate_id, note);
        END IF;
      END LOOP;
    END IF;

    IF v_review.placeholder_client_id <> target_client_id THEN
      PERFORM crm_merge_clients(target_client_id, v_review.placeholder_client_id, note);
    END IF;

    IF v_review.source_table = 'assessment_results' THEN
      UPDATE assessment_results
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    ELSIF v_review.source_table = 'pricing_leads' THEN
      UPDATE pricing_leads
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    END IF;

    PERFORM crm_apply_client_identity(
      target_client_id,
      v_review.incoming_name,
      v_review.incoming_phone_e164,
      v_review.incoming_email_normalized,
      v_review.source_table,
      v_review.source_row_id
    );

    v_resolved_client_id := target_client_id;
  END IF;

  UPDATE client_link_reviews
  SET
    status = 'resolved',
    resolution = v_action,
    resolved_client_id = v_resolved_client_id,
    resolution_note = note,
    resolved_at = NOW()
  WHERE id = review_id;

  RETURN v_resolved_client_id;
END;
$$;
