-- Store requested EUR amount in CRM for invoice and prepayment requests.
-- Idempotent by design.

ALTER TABLE IF EXISTS public.eur_requests
  ADD COLUMN IF NOT EXISTS requested_amount_eur INTEGER;

COMMENT ON COLUMN public.eur_requests.requested_amount_eur IS
  'Requested amount in EUR submitted by the user for invoicing.';

DO $$
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  -- Backfill historical EUR requests with their default plan price.
  UPDATE public.eur_requests
  SET requested_amount_eur = CASE plan_id
    WHEN 'foundation' THEN 790
    WHEN 'advanced' THEN 1390
    WHEN 'mentorship' THEN 3190
    WHEN 'universal' THEN 100
    ELSE requested_amount_eur
  END
  WHERE requested_amount_eur IS NULL
    AND lead_type IN ('eur_application', 'eur_prepayment_application');

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_requested_amount_eur_non_negative_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_requested_amount_eur_non_negative_check
      CHECK (requested_amount_eur IS NULL OR requested_amount_eur >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eur_requests_requested_amount_eur_required_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_requested_amount_eur_required_check
      CHECK (
        lead_type NOT IN ('eur_application', 'eur_prepayment_application')
        OR requested_amount_eur IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;
