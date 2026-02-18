-- Ensure EUR prepayment requests are linked to clients the same way as EUR invoices.
-- Keep tariff updates only for eur_application (foundation/advanced).
-- Idempotent by design.

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
     AND NEW.plan_id IN ('foundation', 'advanced') THEN
    UPDATE leads
    SET tariff = NEW.plan_id, updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_assign_client_pricing_leads ON public.eur_requests;

CREATE TRIGGER trg_crm_assign_client_pricing_leads
BEFORE INSERT ON public.eur_requests
FOR EACH ROW
EXECUTE FUNCTION public.trg_crm_assign_client_pricing_leads();

ALTER TABLE IF EXISTS public.eur_requests
  DROP CONSTRAINT IF EXISTS eur_requests_client_id_required_for_scoped_types_check,
  DROP CONSTRAINT IF EXISTS pricing_leads_client_id_required_for_scoped_types_check;

DO $$
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'eur_requests_client_id_required_for_scoped_types_v2_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_client_id_required_for_scoped_types_v2_check
      CHECK (
        lead_type NOT IN ('eur_application', 'eur_prepayment_application')
        OR client_id IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;

WITH rows_without_client AS (
  SELECT
    er.id,
    crm_resolve_or_create_client(
      NULLIF(btrim(concat_ws(' ', er.first_name, er.last_name)), ''),
      er.phone,
      er.email,
      'eur_requests',
      er.id
    ) AS resolved_client_id
  FROM public.eur_requests er
  WHERE er.lead_type IN ('eur_application', 'eur_prepayment_application')
    AND er.client_id IS NULL
)
UPDATE public.eur_requests er
SET
  client_id = rows_without_client.resolved_client_id,
  updated_at = NOW()
FROM rows_without_client
WHERE er.id = rows_without_client.id
  AND rows_without_client.resolved_client_id IS NOT NULL;
