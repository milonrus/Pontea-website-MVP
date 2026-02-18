-- CRM v4: breaking field rename + schema cleanup for lead entities.
--
-- Breaking changes:
-- - leads: canonical_phone_e164 -> phone, canonical_email -> email, status -> lifecycle_status
-- - eur_requests/consultation_requests: status -> webhook_status
-- - Drop unused tracking/consent/messenger/duplicate columns (see ALTER TABLE blocks)
-- - Drop crm_client_timeline_v / crm_clients_overview_v views

-- 0) Safety snapshots for dropped columns.
DO $$
BEGIN
  IF to_regclass('public.backup_20260220_eur_requests_removed_cols') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE public.backup_20260220_eur_requests_removed_cols AS
      SELECT
        id,
        messenger_type,
        messenger_handle,
        consent_personal_data,
        consent_marketing,
        consent_offer,
        cta_label,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        is_duplicate,
        duplicate_of,
        created_at,
        updated_at
      FROM public.eur_requests
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.backup_20260220_consultation_requests_removed_cols') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE public.backup_20260220_consultation_requests_removed_cols AS
      SELECT
        id,
        currency,
        payer_type,
        messenger_type,
        messenger_handle,
        contract_country,
        contract_city,
        contract_postal_code,
        contract_address,
        consent_offer,
        consent_personal_data,
        consent_marketing,
        cta_label,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        is_duplicate,
        duplicate_of,
        created_at,
        updated_at
      FROM public.consultation_requests
    $sql$;
  END IF;
END $$;

-- 1) Drop obsolete CRM aggregate views.
DROP VIEW IF EXISTS public.crm_client_timeline_v;
DROP VIEW IF EXISTS public.crm_clients_overview_v;

-- 2) Column renames.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'canonical_phone_e164'
  ) THEN
    ALTER TABLE public.leads
      RENAME COLUMN canonical_phone_e164 TO phone;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'canonical_email'
  ) THEN
    ALTER TABLE public.leads
      RENAME COLUMN canonical_email TO email;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.leads
      RENAME COLUMN status TO lifecycle_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.eur_requests
      RENAME COLUMN status TO webhook_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultation_requests'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.consultation_requests
      RENAME COLUMN status TO webhook_status;
  END IF;
END $$;

COMMENT ON COLUMN public.leads.lifecycle_status IS
  'Technical identity lifecycle status for CRM dedup/merge (active, placeholder, merged).';

COMMENT ON COLUMN public.eur_requests.webhook_status IS
  'Technical webhook delivery status (captured, webhook_delivered, failed_webhook).';

COMMENT ON COLUMN public.consultation_requests.webhook_status IS
  'Technical webhook delivery status (captured, webhook_delivered, failed_webhook).';

-- 3) Drop unused columns.
ALTER TABLE public.eur_requests
  DROP COLUMN IF EXISTS messenger_type,
  DROP COLUMN IF EXISTS messenger_handle,
  DROP COLUMN IF EXISTS consent_personal_data,
  DROP COLUMN IF EXISTS consent_marketing,
  DROP COLUMN IF EXISTS consent_offer,
  DROP COLUMN IF EXISTS cta_label,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS is_duplicate,
  DROP COLUMN IF EXISTS duplicate_of;

ALTER TABLE public.consultation_requests
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS payer_type,
  DROP COLUMN IF EXISTS messenger_type,
  DROP COLUMN IF EXISTS messenger_handle,
  DROP COLUMN IF EXISTS contract_country,
  DROP COLUMN IF EXISTS contract_city,
  DROP COLUMN IF EXISTS contract_postal_code,
  DROP COLUMN IF EXISTS contract_address,
  DROP COLUMN IF EXISTS consent_offer,
  DROP COLUMN IF EXISTS consent_personal_data,
  DROP COLUMN IF EXISTS consent_marketing,
  DROP COLUMN IF EXISTS cta_label,
  DROP COLUMN IF EXISTS referrer,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_term,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS is_duplicate,
  DROP COLUMN IF EXISTS duplicate_of;

-- 4) CRM functions updated for renamed columns.
CREATE OR REPLACE FUNCTION crm_apply_client_identity(
  p_client_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_source_table TEXT,
  p_source_row_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_name TEXT := NULLIF(btrim(p_name), '');
  v_phone TEXT := NULLIF(btrim(p_phone), '');
  v_email TEXT := crm_normalize_email(p_email);
  v_primary_phone TEXT;
  v_primary_email TEXT;
BEGIN
  IF v_phone IS NOT NULL THEN
    UPDATE client_contacts
    SET is_primary = FALSE, updated_at = NOW()
    WHERE client_id = p_client_id
      AND contact_type = 'phone'
      AND is_primary = TRUE
      AND contact_value <> v_phone;

    PERFORM crm_upsert_client_contact(
      p_client_id,
      'phone',
      v_phone,
      TRUE,
      p_source_table,
      p_source_row_id
    );
  END IF;

  IF v_email IS NOT NULL THEN
    UPDATE client_contacts
    SET is_primary = FALSE, updated_at = NOW()
    WHERE client_id = p_client_id
      AND contact_type = 'email'
      AND is_primary = TRUE
      AND contact_value <> v_email;

    PERFORM crm_upsert_client_contact(
      p_client_id,
      'email',
      v_email,
      TRUE,
      p_source_table,
      p_source_row_id
    );
  END IF;

  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY contact_type
        ORDER BY last_seen_at DESC, updated_at DESC, created_at DESC, id DESC
      ) AS rn
    FROM client_contacts
    WHERE client_id = p_client_id
  )
  UPDATE client_contacts cc
  SET
    is_primary = (ranked.rn = 1),
    updated_at = NOW()
  FROM ranked
  WHERE cc.id = ranked.id
    AND cc.is_primary IS DISTINCT FROM (ranked.rn = 1);

  SELECT contact_value INTO v_primary_phone
  FROM client_contacts
  WHERE client_id = p_client_id
    AND contact_type = 'phone'
    AND is_primary = TRUE
  LIMIT 1;

  SELECT contact_value INTO v_primary_email
  FROM client_contacts
  WHERE client_id = p_client_id
    AND contact_type = 'email'
    AND is_primary = TRUE
  LIMIT 1;

  UPDATE leads
  SET
    full_name = COALESCE(v_name, full_name),
    phone = v_primary_phone,
    email = v_primary_email,
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION crm_resolve_or_create_client(
  p_incoming_name TEXT,
  p_incoming_phone TEXT,
  p_incoming_email TEXT,
  p_source_table TEXT,
  p_source_row_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_source_table TEXT := CASE
    WHEN p_source_table = 'pricing_leads' THEN 'eur_requests'
    WHEN p_source_table = 'consultation_leads' THEN 'consultation_requests'
    ELSE p_source_table
  END;
  v_name TEXT := NULLIF(btrim(p_incoming_name), '');
  v_phone TEXT := NULLIF(btrim(p_incoming_phone), '');
  v_email TEXT := crm_normalize_email(p_incoming_email);
  v_existing_placeholder UUID;
  v_candidate_client_ids UUID[];
  v_candidate_count INTEGER := 0;
  v_client_id UUID;
BEGIN
  IF v_source_table NOT IN ('assessment_results', 'eur_requests', 'consultation_requests') THEN
    RAISE EXCEPTION 'Unsupported source_table: %', p_source_table;
  END IF;

  IF p_source_row_id IS NULL THEN
    RAISE EXCEPTION 'source_row_id must not be NULL';
  END IF;

  SELECT placeholder_client_id INTO v_existing_placeholder
  FROM client_link_reviews
  WHERE source_table = v_source_table
    AND source_row_id = p_source_row_id
  LIMIT 1;

  IF v_existing_placeholder IS NOT NULL THEN
    RETURN v_existing_placeholder;
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT candidate_id
    FROM (
      SELECT c.id AS candidate_id
      FROM leads c
      WHERE c.lifecycle_status IN ('active', 'placeholder')
        AND (
          (v_phone IS NOT NULL AND c.phone = v_phone)
          OR
          (v_email IS NOT NULL AND c.email = v_email)
        )
      UNION
      SELECT cc.client_id AS candidate_id
      FROM client_contacts cc
      JOIN leads c2
        ON c2.id = cc.client_id
      WHERE c2.lifecycle_status IN ('active', 'placeholder')
        AND (
          (v_phone IS NOT NULL AND cc.contact_type = 'phone' AND cc.contact_value = v_phone)
          OR
          (v_email IS NOT NULL AND cc.contact_type = 'email' AND cc.contact_value = v_email)
        )
    ) candidates
  ) INTO v_candidate_client_ids;

  v_candidate_count := COALESCE(array_length(v_candidate_client_ids, 1), 0);

  IF v_candidate_count = 0 THEN
    INSERT INTO leads (
      id,
      full_name,
      phone,
      email,
      lifecycle_status,
      first_seen_at,
      last_seen_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_name,
      v_phone,
      v_email,
      'active',
      NOW(),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_client_id;

    PERFORM crm_apply_client_identity(
      v_client_id,
      v_name,
      v_phone,
      v_email,
      v_source_table,
      p_source_row_id
    );

    RETURN v_client_id;
  END IF;

  IF v_candidate_count = 1 THEN
    v_client_id := v_candidate_client_ids[1];

    PERFORM crm_apply_client_identity(
      v_client_id,
      v_name,
      v_phone,
      v_email,
      v_source_table,
      p_source_row_id
    );

    RETURN v_client_id;
  END IF;

  INSERT INTO leads (
    id,
    full_name,
    phone,
    email,
    lifecycle_status,
    first_seen_at,
    last_seen_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_name,
    v_phone,
    v_email,
    'placeholder',
    NOW(),
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_client_id;

  INSERT INTO client_link_reviews (
    id,
    source_table,
    source_row_id,
    placeholder_client_id,
    incoming_name,
    incoming_phone_e164,
    incoming_email_normalized,
    candidate_client_ids,
    status,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_source_table,
    p_source_row_id,
    v_client_id,
    v_name,
    v_phone,
    v_email,
    v_candidate_client_ids,
    'open',
    NOW()
  );

  RETURN v_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION crm_merge_clients(
  primary_client_id UUID,
  secondary_client_id UUID,
  note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_primary leads%ROWTYPE;
  v_secondary leads%ROWTYPE;
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
  FROM leads
  WHERE id = primary_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Primary client not found: %', primary_client_id;
  END IF;

  SELECT * INTO v_secondary
  FROM leads
  WHERE id = secondary_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Secondary client not found: %', secondary_client_id;
  END IF;

  UPDATE assessment_results
  SET client_id = primary_client_id
  WHERE client_id = secondary_client_id;

  UPDATE eur_requests
  SET client_id = primary_client_id
  WHERE client_id = secondary_client_id;

  UPDATE consultation_requests
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

  UPDATE leads
  SET
    lifecycle_status = 'merged',
    merged_into_client_id = primary_client_id,
    phone = NULL,
    email = NULL,
    updated_at = NOW()
  WHERE id = secondary_client_id;

  UPDATE leads
  SET
    lifecycle_status = 'active',
    full_name = COALESCE(leads.full_name, v_secondary.full_name),
    phone = v_primary_phone,
    email = v_primary_email,
    crm_status = COALESCE(leads.crm_status, v_secondary.crm_status),
    tariff = COALESCE(leads.tariff, v_secondary.tariff),
    last_seen_at = GREATEST(leads.last_seen_at, v_secondary.last_seen_at, NOW()),
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
  v_plan_id TEXT;
  v_lead_type TEXT;
  v_source_table TEXT;
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

  v_source_table := CASE
    WHEN v_review.source_table = 'pricing_leads' THEN 'eur_requests'
    WHEN v_review.source_table = 'consultation_leads' THEN 'consultation_requests'
    ELSE v_review.source_table
  END;

  IF v_source_table <> v_review.source_table THEN
    UPDATE client_link_reviews
    SET source_table = v_source_table
    WHERE id = review_id;

    v_review.source_table := v_source_table;
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
    ELSIF v_review.source_table = 'eur_requests' THEN
      UPDATE eur_requests
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    ELSIF v_review.source_table = 'consultation_requests' THEN
      UPDATE consultation_requests
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    END IF;

    -- In linked_existing mode we intentionally do not force incoming
    -- phone/email onto target to avoid stealing contacts from another
    -- active candidate client.
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
    ELSIF v_review.source_table = 'eur_requests' THEN
      UPDATE eur_requests
      SET client_id = target_client_id
      WHERE id = v_review.source_row_id;
    ELSIF v_review.source_table = 'consultation_requests' THEN
      UPDATE consultation_requests
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

  -- Tariff: last write wins based on the source row.
  IF v_review.source_table = 'eur_requests' THEN
    SELECT plan_id, lead_type INTO v_plan_id, v_lead_type
    FROM eur_requests
    WHERE id = v_review.source_row_id;

    IF v_lead_type = 'eur_application' AND v_plan_id IN ('foundation', 'advanced') THEN
      UPDATE leads
      SET tariff = v_plan_id, updated_at = NOW()
      WHERE id = v_resolved_client_id;
    END IF;
  ELSIF v_review.source_table = 'consultation_requests' THEN
    UPDATE leads
    SET tariff = 'individual', updated_at = NOW()
    WHERE id = v_resolved_client_id;
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

CREATE OR REPLACE FUNCTION trg_crm_assign_client_pricing_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.crm_status IS NULL THEN
    NEW.crm_status := 'new';
  END IF;

  IF NEW.lead_type = 'eur_application'
     AND NEW.client_id IS NULL THEN
    NEW.client_id := crm_resolve_or_create_client(
      NULLIF(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), ''),
      NEW.phone,
      NEW.email,
      'eur_requests',
      NEW.id
    );
  END IF;

  IF NEW.client_id IS NOT NULL AND NEW.lead_type = 'eur_application'
     AND NEW.plan_id IN ('foundation', 'advanced') THEN
    UPDATE leads
    SET tariff = NEW.plan_id, updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_pricing_leads ON eur_requests;

CREATE TRIGGER trg_crm_assign_client_pricing_leads
BEFORE INSERT ON eur_requests
FOR EACH ROW
EXECUTE FUNCTION trg_crm_assign_client_pricing_leads();

CREATE OR REPLACE FUNCTION trg_crm_assign_client_consultation_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.crm_status IS NULL THEN
    NEW.crm_status := 'new';
  END IF;

  IF NEW.client_id IS NULL THEN
    NEW.client_id := crm_resolve_or_create_client(
      NULLIF(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), ''),
      NEW.phone,
      NEW.email,
      'consultation_requests',
      NEW.id
    );
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    UPDATE leads
    SET tariff = 'individual', updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_consultation_leads ON consultation_requests;

CREATE TRIGGER trg_crm_assign_client_consultation_leads
BEFORE INSERT ON consultation_requests
FOR EACH ROW
EXECUTE FUNCTION trg_crm_assign_client_consultation_leads();
