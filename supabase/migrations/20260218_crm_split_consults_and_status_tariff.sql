-- CRM v2:
-- - Split consultation leads into a dedicated table (consultation_leads)
-- - Keep pricing_leads for EUR invoices only (eur_application)
-- - Disable rub_intent writes (guarded at API + DB)
-- - Add minimal CRM statuses (manual updates only) and client tariff
-- - Update CRM linking functions/triggers/views to include consultation_leads

-- NOTE:
-- A previous migration (CRM v1) added a NOT VALID CHECK on pricing_leads:
--   CHECK (lead_type = 'rub_intent' OR client_id IS NOT NULL)
-- While NOT VALID skips validating existing rows at creation time, it is still enforced on UPDATE.
-- This migration deletes/moves rows from pricing_leads, which can trigger UPDATEs via
-- foreign keys (e.g. duplicate_of ON DELETE SET NULL) and fail on historical rows with NULL client_id.
-- We drop the old constraint and rely on INSERT triggers for client linking going forward.
ALTER TABLE pricing_leads
  DROP CONSTRAINT IF EXISTS pricing_leads_client_id_required_for_scoped_types_check;

-- 1) clients: minimal CRM status + tariff
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS crm_status TEXT;

ALTER TABLE clients
  ALTER COLUMN crm_status SET DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_crm_status_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_crm_status_check
      CHECK (crm_status IN ('new', 'in_progress', 'won', 'lost'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_crm_status_required_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_crm_status_required_check
      CHECK (crm_status IS NOT NULL) NOT VALID;
  END IF;
END $$;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tariff TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_tariff_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_tariff_check
      CHECK (tariff IN ('foundation', 'advanced', 'individual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_crm_status
  ON clients(crm_status);

CREATE INDEX IF NOT EXISTS idx_clients_tariff
  ON clients(tariff);

-- Backfill: existing clients start at 'new' (manual changes can be made later).
UPDATE clients
SET crm_status = 'new'
WHERE crm_status IS NULL
  AND status IN ('active', 'placeholder');

-- 2) pricing_leads: CRM status (technical status remains for webhooks)
ALTER TABLE pricing_leads
  ADD COLUMN IF NOT EXISTS crm_status TEXT;

ALTER TABLE pricing_leads
  ALTER COLUMN crm_status SET DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_crm_status_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_crm_status_check
      CHECK (crm_status IN ('new', 'in_progress', 'closed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_crm_status_required_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_crm_status_required_check
      CHECK (crm_status IS NOT NULL) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pricing_leads_crm_status
  ON pricing_leads(crm_status);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_crm_status_created_at
  ON pricing_leads(crm_status, created_at DESC);

-- Backfill: historical EUR rows may predate invoice_order_number trigger.
-- Any UPDATE touching them would fail under pricing_leads_eur_invoice_order_number_check,
-- so we assign missing invoice_order_number values first.
DO $$
DECLARE
  v_base BIGINT;
  v_max_assigned BIGINT;
BEGIN
  IF to_regclass('public.invoice_order_counter') IS NOT NULL THEN
    -- Ensure counter row exists (required by assign_invoice_order_number()).
    INSERT INTO invoice_order_counter (singleton, last_value)
    VALUES (true, 100199)
    ON CONFLICT (singleton) DO NOTHING;

    SELECT GREATEST(
      COALESCE((
        SELECT MAX(invoice_order_number)
        FROM pricing_leads
        WHERE lead_type = 'eur_application'
          AND invoice_order_number IS NOT NULL
      ), 0),
      COALESCE((
        SELECT last_value
        FROM invoice_order_counter
        WHERE singleton = true
      ), 0)
    ) INTO v_base;

    WITH missing AS (
      SELECT
        id,
        v_base + ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS new_order
      FROM pricing_leads
      WHERE lead_type = 'eur_application'
        AND invoice_order_number IS NULL
    ),
    upd AS (
      UPDATE pricing_leads pl
      SET invoice_order_number = m.new_order,
          updated_at = NOW()
      FROM missing m
      WHERE pl.id = m.id
      RETURNING m.new_order
    )
    SELECT MAX(new_order) INTO v_max_assigned FROM upd;

    IF v_max_assigned IS NOT NULL THEN
      UPDATE invoice_order_counter
      SET last_value = GREATEST(last_value, v_max_assigned)
      WHERE singleton = true;
    END IF;
  END IF;
END $$;

-- Backfill: existing leads start at 'new'.
UPDATE pricing_leads
SET crm_status = 'new'
WHERE crm_status IS NULL;

-- 3) Split consultations into consultation_leads (schema mirrors pricing_leads for webhook compatibility)
CREATE TABLE IF NOT EXISTS consultation_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL DEFAULT 'mentorship_application' CHECK (
    lead_type IN ('mentorship_application')
  ),
  status TEXT NOT NULL DEFAULT 'captured' CHECK (
    status IN ('captured', 'webhook_delivered', 'failed_webhook')
  ),
  crm_status TEXT NOT NULL DEFAULT 'new' CHECK (
    crm_status IN ('new', 'in_progress', 'closed')
  ),
  plan_id TEXT NOT NULL DEFAULT 'mentorship' CHECK (
    plan_id IN ('mentorship')
  ),
  currency TEXT CHECK (currency IS NULL),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  payer_type TEXT CHECK (payer_type IN ('individual', 'legal_entity')),
  messenger_type TEXT CHECK (messenger_type IN ('telegram', 'whatsapp')),
  messenger_handle TEXT,
  comment TEXT,
  contract_country TEXT,
  contract_city TEXT,
  contract_postal_code TEXT,
  contract_address TEXT,
  consent_offer BOOLEAN NOT NULL DEFAULT false,
  consent_personal_data BOOLEAN NOT NULL DEFAULT false,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  cta_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of UUID REFERENCES consultation_leads(id) ON DELETE SET NULL,
  webhook_attempts INTEGER NOT NULL DEFAULT 0,
  webhook_last_error TEXT,
  webhook_delivered_at TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_leads_created_at
  ON consultation_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_leads_phone_created
  ON consultation_leads(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_leads_status
  ON consultation_leads(status);

CREATE INDEX IF NOT EXISTS idx_consultation_leads_crm_status
  ON consultation_leads(crm_status);

CREATE INDEX IF NOT EXISTS idx_consultation_leads_client_id
  ON consultation_leads(client_id);

ALTER TABLE consultation_leads ENABLE ROW LEVEL SECURITY;

-- 4) Allow CRM contact/review records to reference consultation_leads as a source_table.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'client_contacts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%source_table%'
  LOOP
    EXECUTE format('ALTER TABLE client_contacts DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE client_contacts
  ADD CONSTRAINT client_contacts_source_table_check
  CHECK (source_table IN ('assessment_results', 'pricing_leads', 'consultation_leads'));

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'client_link_reviews'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%source_table%'
  LOOP
    EXECUTE format('ALTER TABLE client_link_reviews DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE client_link_reviews
  ADD CONSTRAINT client_link_reviews_source_table_check
  CHECK (source_table IN ('assessment_results', 'pricing_leads', 'consultation_leads'));

-- 5) Move historical consultations out of pricing_leads (use same UUIDs to keep reviews/contacts mappable)
INSERT INTO consultation_leads (
  id,
  lead_type,
  status,
  crm_status,
  plan_id,
  currency,
  first_name,
  last_name,
  email,
  phone,
  payer_type,
  messenger_type,
  messenger_handle,
  comment,
  contract_country,
  contract_city,
  contract_postal_code,
  contract_address,
  consent_offer,
  consent_personal_data,
  consent_marketing,
  cta_label,
  page_path,
  referrer,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  is_duplicate,
  duplicate_of,
  webhook_attempts,
  webhook_last_error,
  webhook_delivered_at,
  client_id,
  created_at,
  updated_at
)
SELECT
  pl.id,
  'mentorship_application'::TEXT,
  pl.status,
  COALESCE(pl.crm_status, 'new')::TEXT,
  'mentorship'::TEXT,
  NULL::TEXT,
  pl.first_name,
  pl.last_name,
  pl.email,
  pl.phone,
  pl.payer_type,
  pl.messenger_type,
  pl.messenger_handle,
  pl.comment,
  pl.contract_country,
  pl.contract_city,
  pl.contract_postal_code,
  pl.contract_address,
  pl.consent_offer,
  pl.consent_personal_data,
  pl.consent_marketing,
  pl.cta_label,
  pl.page_path,
  pl.referrer,
  pl.utm_source,
  pl.utm_medium,
  pl.utm_campaign,
  pl.utm_term,
  pl.utm_content,
  pl.is_duplicate,
  CASE WHEN dup.lead_type = 'mentorship_application' THEN pl.duplicate_of ELSE NULL END,
  pl.webhook_attempts,
  pl.webhook_last_error,
  pl.webhook_delivered_at,
  pl.client_id,
  pl.created_at,
  pl.updated_at
FROM pricing_leads pl
LEFT JOIN pricing_leads dup
  ON dup.id = pl.duplicate_of
WHERE pl.lead_type = 'mentorship_application'
ORDER BY pl.created_at ASC
ON CONFLICT (id) DO NOTHING;

-- Update CRM audit tables to point to consultation_leads for moved rows.
UPDATE client_contacts cc
SET
  source_table = 'consultation_leads',
  updated_at = NOW()
WHERE cc.source_table = 'pricing_leads'
  AND cc.source_row_id IN (
    SELECT id FROM consultation_leads
  );

UPDATE client_link_reviews clr
SET
  source_table = 'consultation_leads'
WHERE clr.source_table = 'pricing_leads'
  AND clr.source_row_id IN (
    SELECT id FROM consultation_leads
  );

-- Cleanup: remove moved consultations from pricing_leads.
DELETE FROM pricing_leads
WHERE lead_type = 'mentorship_application';

-- 6) Guard: pricing_leads should accept only EUR invoices going forward.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_only_eur_application_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_only_eur_application_check
      CHECK (lead_type = 'eur_application') NOT VALID;
  END IF;
END $$;

-- Guard: new consultations must have client_id (historical rows may be NULL).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consultation_leads_client_id_required_check'
  ) THEN
    ALTER TABLE consultation_leads
      ADD CONSTRAINT consultation_leads_client_id_required_check
      CHECK (client_id IS NOT NULL) NOT VALID;
  END IF;
END $$;

-- Backfill: client tariff from most recent known EUR/consultation event (if still NULL).
WITH events AS (
  SELECT
    client_id,
    created_at,
    plan_id::TEXT AS tariff
  FROM pricing_leads
  WHERE client_id IS NOT NULL
    AND lead_type = 'eur_application'
    AND plan_id IN ('foundation', 'advanced')
  UNION ALL
  SELECT
    client_id,
    created_at,
    'individual'::TEXT AS tariff
  FROM consultation_leads
  WHERE client_id IS NOT NULL
),
ranked AS (
  SELECT
    client_id,
    tariff,
    ROW_NUMBER() OVER (
      PARTITION BY client_id
      ORDER BY created_at DESC
    ) AS rn
  FROM events
)
UPDATE clients c
SET tariff = ranked.tariff
FROM ranked
WHERE ranked.rn = 1
  AND ranked.client_id = c.id
  AND c.tariff IS NULL;

-- 7) CRM functions: extend to consultation_leads and keep hotfix behavior.
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
  IF p_source_table NOT IN ('assessment_results', 'pricing_leads', 'consultation_leads') THEN
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

  UPDATE consultation_leads
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
    crm_status = COALESCE(clients.crm_status, v_secondary.crm_status),
    tariff = COALESCE(clients.tariff, v_secondary.tariff),
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
  v_plan_id TEXT;
  v_lead_type TEXT;
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
    ELSIF v_review.source_table = 'consultation_leads' THEN
      UPDATE consultation_leads
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
    ELSIF v_review.source_table = 'consultation_leads' THEN
      UPDATE consultation_leads
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
  IF v_review.source_table = 'pricing_leads' THEN
    SELECT plan_id, lead_type INTO v_plan_id, v_lead_type
    FROM pricing_leads
    WHERE id = v_review.source_row_id;

    IF v_lead_type = 'eur_application' AND v_plan_id IN ('foundation', 'advanced') THEN
      UPDATE clients
      SET tariff = v_plan_id, updated_at = NOW()
      WHERE id = v_resolved_client_id;
    END IF;
  ELSIF v_review.source_table = 'consultation_leads' THEN
    UPDATE clients
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

-- 8) Triggers: assign client_id + default CRM status + set tariff for invoice/consultation flows
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
      'pricing_leads',
      NEW.id
    );
  END IF;

  IF NEW.client_id IS NOT NULL AND NEW.lead_type = 'eur_application'
     AND NEW.plan_id IN ('foundation', 'advanced') THEN
    UPDATE clients
    SET tariff = NEW.plan_id, updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_pricing_leads ON pricing_leads;

CREATE TRIGGER trg_crm_assign_client_pricing_leads
BEFORE INSERT ON pricing_leads
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
      'consultation_leads',
      NEW.id
    );
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET tariff = 'individual', updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_consultation_leads ON consultation_leads;

CREATE TRIGGER trg_crm_assign_client_consultation_leads
BEFORE INSERT ON consultation_leads
FOR EACH ROW
EXECUTE FUNCTION trg_crm_assign_client_consultation_leads();

-- 9) CRM views: timeline + overview (use pricing_leads=EUR only, consultation_leads=VIP)
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
  'invoice'::TEXT AS event_type,
  'pricing_leads'::TEXT AS source_table,
  pl.id AS source_id,
  pl.created_at AS occurred_at,
  pl.lead_type,
  pl.status AS lead_status,
  pl.invoice_order_number
FROM pricing_leads pl
WHERE pl.client_id IS NOT NULL
  AND pl.lead_type = 'eur_application'

UNION ALL

SELECT
  cl.client_id,
  'consultation'::TEXT AS event_type,
  'consultation_leads'::TEXT AS source_table,
  cl.id AS source_id,
  cl.created_at AS occurred_at,
  cl.lead_type,
  cl.status AS lead_status,
  NULL::BIGINT AS invoice_order_number
FROM consultation_leads cl
WHERE cl.client_id IS NOT NULL
  AND cl.lead_type = 'mentorship_application';

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
eur_counts AS (
  SELECT
    client_id,
    COUNT(*)::INTEGER AS eur_count,
    MAX(created_at) AS last_eur_at
  FROM pricing_leads
  WHERE client_id IS NOT NULL
    AND lead_type = 'eur_application'
  GROUP BY client_id
),
consultation_counts AS (
  SELECT
    client_id,
    COUNT(*)::INTEGER AS vip_count,
    MAX(created_at) AS last_vip_at
  FROM consultation_leads
  WHERE client_id IS NOT NULL
    AND lead_type = 'mentorship_application'
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
  COALESCE(cc.vip_count, 0) AS vip_count,
  COALESCE(ec.eur_count, 0) AS eur_count,
  COALESCE(orv.open_reviews_count, 0) AS open_reviews_count,
  GREATEST(
    c.last_seen_at,
    COALESCE(ac.last_assessment_at, '-infinity'::timestamptz),
    COALESCE(ec.last_eur_at, '-infinity'::timestamptz),
    COALESCE(cc.last_vip_at, '-infinity'::timestamptz)
  ) AS last_activity_at,
  c.crm_status,
  c.tariff
FROM clients c
LEFT JOIN assessment_counts ac
  ON ac.client_id = c.id
LEFT JOIN eur_counts ec
  ON ec.client_id = c.id
LEFT JOIN consultation_counts cc
  ON cc.client_id = c.id
LEFT JOIN open_reviews orv
  ON orv.client_id = c.id;
