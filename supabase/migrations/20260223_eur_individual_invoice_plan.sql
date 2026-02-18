-- Allow EUR invoice applications for the Individual plan (plan_id = mentorship).
-- Keep EUR prepayment flow unchanged.
-- Idempotent by design.

DO $$
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.eur_requests
    DROP CONSTRAINT IF EXISTS eur_requests_plan_id_v2_check,
    DROP CONSTRAINT IF EXISTS eur_requests_flow_v2_check,
    DROP CONSTRAINT IF EXISTS pricing_leads_plan_id_v2_check,
    DROP CONSTRAINT IF EXISTS pricing_leads_flow_v2_check;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_plan_id_v3_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_plan_id_v3_check
      CHECK (plan_id IN ('foundation', 'advanced', 'mentorship', 'universal')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_flow_v3_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_flow_v3_check
      CHECK (
        (lead_type = 'eur_application' AND plan_id IN ('foundation', 'advanced', 'mentorship') AND currency = 'EUR')
        OR
        (lead_type = 'eur_prepayment_application' AND plan_id = 'universal' AND currency = 'EUR')
      ) NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_crm_assign_client_pricing_leads()
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

  IF NEW.lead_type IN ('eur_application', 'eur_prepayment_application')
     AND NEW.client_id IS NULL THEN
    NEW.client_id := crm_resolve_or_create_client(
      NULLIF(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), ''),
      NEW.phone,
      NEW.email,
      'eur_requests',
      NEW.id
    );
  END IF;

  IF NEW.client_id IS NOT NULL
     AND NEW.lead_type = 'eur_application'
     AND NEW.plan_id IN ('foundation', 'advanced', 'mentorship') THEN
    UPDATE leads
    SET
      tariff = CASE
        WHEN NEW.plan_id = 'mentorship' THEN 'individual'
        ELSE NEW.plan_id
      END,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE leads AS l
SET tariff = 'individual',
    updated_at = NOW()
FROM public.eur_requests AS er
WHERE er.client_id = l.id
  AND er.lead_type = 'eur_application'
  AND er.plan_id = 'mentorship'
  AND l.tariff IS DISTINCT FROM 'individual';
