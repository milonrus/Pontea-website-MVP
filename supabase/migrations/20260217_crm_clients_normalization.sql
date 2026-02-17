-- CRM normalization: central clients table + links from assessment and VIP/EUR leads.
-- No historical backfill in this phase.

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  canonical_phone_e164 TEXT,
  canonical_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'placeholder', 'merged')
  ),
  merged_into_client_id UUID REFERENCES clients(id),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_active_phone
  ON clients(canonical_phone_e164)
  WHERE status = 'active' AND canonical_phone_e164 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_active_email
  ON clients(canonical_email)
  WHERE status = 'active' AND canonical_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_status
  ON clients(status);

CREATE INDEX IF NOT EXISTS idx_clients_last_seen
  ON clients(last_seen_at DESC);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (
    contact_type IN ('phone', 'email')
  ),
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_table TEXT NOT NULL CHECK (
    source_table IN ('assessment_results', 'pricing_leads')
  ),
  source_row_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_contacts_type_value
  ON client_contacts(contact_type, contact_value);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_type_last_seen
  ON client_contacts(client_id, contact_type, last_seen_at DESC);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS client_link_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL CHECK (
    source_table IN ('assessment_results', 'pricing_leads')
  ),
  source_row_id UUID NOT NULL,
  placeholder_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  incoming_name TEXT,
  incoming_phone_e164 TEXT,
  incoming_email_normalized TEXT,
  candidate_client_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'resolved', 'dismissed')
  ),
  resolution TEXT CHECK (
    resolution IN ('linked_existing', 'merged_clients', 'kept_placeholder')
  ),
  resolved_client_id UUID REFERENCES clients(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_link_reviews_source
  ON client_link_reviews(source_table, source_row_id);

CREATE INDEX IF NOT EXISTS idx_client_link_reviews_status_created
  ON client_link_reviews(status, created_at DESC);

ALTER TABLE client_link_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS assessment_results
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

ALTER TABLE IF EXISTS pricing_leads
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

CREATE INDEX IF NOT EXISTS idx_assessment_results_client_id
  ON assessment_results(client_id);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_client_id
  ON pricing_leads(client_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessment_results_client_id_required_check'
  ) THEN
    ALTER TABLE assessment_results
      ADD CONSTRAINT assessment_results_client_id_required_check
      CHECK (client_id IS NOT NULL) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_client_id_required_for_scoped_types_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_client_id_required_for_scoped_types_check
      CHECK (lead_type = 'rub_intent' OR client_id IS NOT NULL) NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION crm_normalize_email(input_email TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT NULLIF(lower(btrim(input_email)), '');
$$;

CREATE OR REPLACE FUNCTION crm_upsert_client_contact(
  p_client_id UUID,
  p_contact_type TEXT,
  p_contact_value TEXT,
  p_is_primary BOOLEAN,
  p_source_table TEXT,
  p_source_row_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_value TEXT;
  v_existing_owner UUID;
BEGIN
  IF p_contact_type NOT IN ('phone', 'email') THEN
    RAISE EXCEPTION 'Unsupported contact_type: %', p_contact_type;
  END IF;

  IF p_contact_type = 'email' THEN
    v_normalized_value := crm_normalize_email(p_contact_value);
  ELSE
    v_normalized_value := NULLIF(btrim(p_contact_value), '');
  END IF;

  IF v_normalized_value IS NULL THEN
    RETURN;
  END IF;

  SELECT client_id INTO v_existing_owner
  FROM client_contacts
  WHERE contact_type = p_contact_type
    AND contact_value = v_normalized_value
  LIMIT 1;

  IF v_existing_owner IS NOT NULL AND v_existing_owner <> p_client_id THEN
    RAISE EXCEPTION 'Contact %/% already belongs to another client %',
      p_contact_type,
      v_normalized_value,
      v_existing_owner;
  END IF;

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
    p_client_id,
    p_contact_type,
    v_normalized_value,
    p_is_primary,
    NOW(),
    NOW(),
    p_source_table,
    p_source_row_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (contact_type, contact_value)
  DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    last_seen_at = NOW(),
    source_table = EXCLUDED.source_table,
    source_row_id = EXCLUDED.source_row_id,
    updated_at = NOW();
END;
$$;

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

  UPDATE clients
  SET
    full_name = COALESCE(v_name, full_name),
    canonical_phone_e164 = v_primary_phone,
    canonical_email = v_primary_email,
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
  v_name TEXT := NULLIF(btrim(p_incoming_name), '');
  v_phone TEXT := NULLIF(btrim(p_incoming_phone), '');
  v_email TEXT := crm_normalize_email(p_incoming_email);
  v_existing_placeholder UUID;
  v_candidate_client_ids UUID[];
  v_candidate_count INTEGER := 0;
  v_client_id UUID;
BEGIN
  IF p_source_table NOT IN ('assessment_results', 'pricing_leads') THEN
    RAISE EXCEPTION 'Unsupported source_table: %', p_source_table;
  END IF;

  IF p_source_row_id IS NULL THEN
    RAISE EXCEPTION 'source_row_id must not be NULL';
  END IF;

  SELECT placeholder_client_id INTO v_existing_placeholder
  FROM client_link_reviews
  WHERE source_table = p_source_table
    AND source_row_id = p_source_row_id
  LIMIT 1;

  IF v_existing_placeholder IS NOT NULL THEN
    RETURN v_existing_placeholder;
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT candidate_id
    FROM (
      SELECT c.id AS candidate_id
      FROM clients c
      WHERE c.status IN ('active', 'placeholder')
        AND (
          (v_phone IS NOT NULL AND c.canonical_phone_e164 = v_phone)
          OR
          (v_email IS NOT NULL AND c.canonical_email = v_email)
        )
      UNION
      SELECT cc.client_id AS candidate_id
      FROM client_contacts cc
      JOIN clients c2
        ON c2.id = cc.client_id
      WHERE c2.status IN ('active', 'placeholder')
        AND (
          (v_phone IS NOT NULL AND cc.contact_type = 'phone' AND cc.contact_value = v_phone)
          OR
          (v_email IS NOT NULL AND cc.contact_type = 'email' AND cc.contact_value = v_email)
        )
    ) candidates
  ) INTO v_candidate_client_ids;

  v_candidate_count := COALESCE(array_length(v_candidate_client_ids, 1), 0);

  IF v_candidate_count = 0 THEN
    INSERT INTO clients (
      id,
      full_name,
      canonical_phone_e164,
      canonical_email,
      status,
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
      p_source_table,
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
      p_source_table,
      p_source_row_id
    );

    RETURN v_client_id;
  END IF;

  INSERT INTO clients (
    id,
    full_name,
    canonical_phone_e164,
    canonical_email,
    status,
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
    p_source_table,
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

CREATE OR REPLACE FUNCTION trg_crm_assign_client_assessment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.client_id IS NULL THEN
    NEW.client_id := crm_resolve_or_create_client(
      NEW.name,
      NEW.phone,
      NEW.email,
      'assessment_results',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_assessment ON assessment_results;

CREATE TRIGGER trg_crm_assign_client_assessment
BEFORE INSERT ON assessment_results
FOR EACH ROW
EXECUTE FUNCTION trg_crm_assign_client_assessment();

CREATE OR REPLACE FUNCTION trg_crm_assign_client_pricing_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.lead_type IN ('eur_application', 'mentorship_application')
     AND NEW.client_id IS NULL THEN
    NEW.client_id := crm_resolve_or_create_client(
      NULLIF(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), ''),
      NEW.phone,
      NEW.email,
      'pricing_leads',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_pricing_leads ON pricing_leads;

CREATE TRIGGER trg_crm_assign_client_pricing_leads
BEFORE INSERT ON pricing_leads
FOR EACH ROW
EXECUTE FUNCTION trg_crm_assign_client_pricing_leads();

CREATE OR REPLACE VIEW crm_client_timeline_v AS
SELECT
  ar.client_id,
  'assessment'::TEXT AS event_type,
  'assessment_results'::TEXT AS source_table,
  ar.id AS source_id,
  COALESCE(ar.submitted_at, ar.created_at) AS occurred_at,
  NULL::TEXT AS lead_type,
  NULL::TEXT AS lead_status,
  NULL::BIGINT AS invoice_order_number
FROM assessment_results ar
WHERE ar.client_id IS NOT NULL

UNION ALL

SELECT
  pl.client_id,
  'pricing_lead'::TEXT AS event_type,
  'pricing_leads'::TEXT AS source_table,
  pl.id AS source_id,
  pl.created_at AS occurred_at,
  pl.lead_type,
  pl.status AS lead_status,
  pl.invoice_order_number
FROM pricing_leads pl
WHERE pl.client_id IS NOT NULL
  AND pl.lead_type IN ('eur_application', 'mentorship_application');

CREATE OR REPLACE VIEW crm_clients_overview_v AS
WITH assessment_counts AS (
  SELECT
    client_id,
    COUNT(*)::INTEGER AS assessments_count,
    MAX(COALESCE(submitted_at, created_at)) AS last_assessment_at
  FROM assessment_results
  WHERE client_id IS NOT NULL
  GROUP BY client_id
),
pricing_counts AS (
  SELECT
    client_id,
    COUNT(*) FILTER (WHERE lead_type = 'mentorship_application')::INTEGER AS vip_count,
    COUNT(*) FILTER (WHERE lead_type = 'eur_application')::INTEGER AS eur_count,
    MAX(created_at) AS last_pricing_at
  FROM pricing_leads
  WHERE client_id IS NOT NULL
    AND lead_type IN ('eur_application', 'mentorship_application')
  GROUP BY client_id
),
open_reviews AS (
  SELECT
    placeholder_client_id AS client_id,
    COUNT(*)::INTEGER AS open_reviews_count
  FROM client_link_reviews
  WHERE status = 'open'
  GROUP BY placeholder_client_id
)
SELECT
  c.id AS client_id,
  c.full_name,
  c.canonical_phone_e164,
  c.canonical_email,
  c.status,
  c.first_seen_at,
  c.last_seen_at,
  COALESCE(ac.assessments_count, 0) AS assessments_count,
  COALESCE(pc.vip_count, 0) AS vip_count,
  COALESCE(pc.eur_count, 0) AS eur_count,
  COALESCE(orv.open_reviews_count, 0) AS open_reviews_count,
  GREATEST(
    c.last_seen_at,
    COALESCE(ac.last_assessment_at, '-infinity'::timestamptz),
    COALESCE(pc.last_pricing_at, '-infinity'::timestamptz)
  ) AS last_activity_at
FROM clients c
LEFT JOIN assessment_counts ac
  ON ac.client_id = c.id
LEFT JOIN pricing_counts pc
  ON pc.client_id = c.id
LEFT JOIN open_reviews orv
  ON orv.client_id = c.id;
