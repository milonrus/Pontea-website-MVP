-- Allow EUR prepayment requests in eur_requests without breaking existing EUR invoice flow.
-- Idempotent by design.

ALTER TABLE IF EXISTS public.eur_requests
  DROP CONSTRAINT IF EXISTS pricing_leads_only_eur_application_check,
  DROP CONSTRAINT IF EXISTS eur_requests_only_eur_application_check,
  DROP CONSTRAINT IF EXISTS pricing_leads_lead_type_check,
  DROP CONSTRAINT IF EXISTS eur_requests_lead_type_check,
  DROP CONSTRAINT IF EXISTS pricing_leads_plan_id_check,
  DROP CONSTRAINT IF EXISTS eur_requests_plan_id_check,
  DROP CONSTRAINT IF EXISTS pricing_leads_flow_check,
  DROP CONSTRAINT IF EXISTS eur_requests_flow_check,
  DROP CONSTRAINT IF EXISTS pricing_leads_eur_invoice_order_number_check,
  DROP CONSTRAINT IF EXISTS eur_requests_eur_invoice_order_number_check;

DO $$
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_lead_type_v2_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_lead_type_v2_check
      CHECK (lead_type IN ('eur_application', 'eur_prepayment_application')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_plan_id_v2_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_plan_id_v2_check
      CHECK (plan_id IN ('foundation', 'advanced', 'universal')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_flow_v2_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_flow_v2_check
      CHECK (
        (lead_type = 'eur_application' AND plan_id IN ('foundation', 'advanced') AND currency = 'EUR')
        OR
        (lead_type = 'eur_prepayment_application' AND plan_id = 'universal' AND currency = 'EUR')
      ) NOT VALID;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'invoice_order_number'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_invoice_order_number_v2_check'
    ) THEN
      ALTER TABLE public.eur_requests
        ADD CONSTRAINT eur_requests_invoice_order_number_v2_check
        CHECK (lead_type <> 'eur_application' OR invoice_order_number IS NOT NULL) NOT VALID;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'contract_country'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'contract_city'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'contract_address'
  ) THEN
    ALTER TABLE public.eur_requests
      DROP CONSTRAINT IF EXISTS pricing_leads_eur_contract_fields_check,
      DROP CONSTRAINT IF EXISTS eur_requests_eur_contract_fields_check;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_contract_fields_v2_check'
    ) THEN
      ALTER TABLE public.eur_requests
        ADD CONSTRAINT eur_requests_contract_fields_v2_check
        CHECK (
          lead_type NOT IN ('eur_application', 'eur_prepayment_application')
          OR (
            length(btrim(coalesce(contract_country, ''))) > 0
            AND length(btrim(coalesce(contract_city, ''))) > 0
            AND length(btrim(coalesce(contract_address, ''))) > 0
          )
        ) NOT VALID;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'eur_requests'
      AND column_name = 'contract_postal_code'
  ) THEN
    ALTER TABLE public.eur_requests
      DROP CONSTRAINT IF EXISTS pricing_leads_eur_contract_postal_code_check,
      DROP CONSTRAINT IF EXISTS eur_requests_eur_contract_postal_code_check;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_contract_postal_code_v2_check'
    ) THEN
      ALTER TABLE public.eur_requests
        ADD CONSTRAINT eur_requests_contract_postal_code_v2_check
        CHECK (
          lead_type NOT IN ('eur_application', 'eur_prepayment_application')
          OR length(btrim(coalesce(contract_postal_code, ''))) > 0
        ) NOT VALID;
    END IF;
  END IF;
END $$;
