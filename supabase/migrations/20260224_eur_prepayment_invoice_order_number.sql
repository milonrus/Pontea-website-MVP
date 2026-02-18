-- Issue invoice_order_number for EUR prepayment requests as well.
-- Keeps a single shared sequence for eur_application + eur_prepayment_application.
-- Idempotent by design.

ALTER TABLE IF EXISTS public.eur_requests
  ADD COLUMN IF NOT EXISTS invoice_order_number BIGINT;

CREATE TABLE IF NOT EXISTS public.invoice_order_counter (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton = true),
  last_value BIGINT NOT NULL
);

INSERT INTO public.invoice_order_counter (singleton, last_value)
VALUES (true, 100199)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.assign_invoice_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_value BIGINT;
BEGIN
  IF NEW.lead_type IN ('eur_application', 'eur_prepayment_application') THEN
    IF NEW.invoice_order_number IS NULL THEN
      UPDATE public.invoice_order_counter
      SET last_value = last_value + 1
      WHERE singleton = true
      RETURNING last_value INTO next_value;

      IF next_value IS NULL THEN
        RAISE EXCEPTION 'invoice_order_counter is not initialized';
      END IF;

      NEW.invoice_order_number := next_value;
    END IF;
  ELSE
    NEW.invoice_order_number := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_invoice_order_number ON public.eur_requests;

CREATE TRIGGER trg_assign_invoice_order_number
BEFORE INSERT ON public.eur_requests
FOR EACH ROW
EXECUTE FUNCTION public.assign_invoice_order_number();

ALTER TABLE IF EXISTS public.eur_requests
  DROP CONSTRAINT IF EXISTS pricing_leads_eur_invoice_order_number_check,
  DROP CONSTRAINT IF EXISTS eur_requests_eur_invoice_order_number_check,
  DROP CONSTRAINT IF EXISTS eur_requests_invoice_order_number_v2_check;

DO $$
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'eur_requests_invoice_order_number_v3_check'
  ) THEN
    ALTER TABLE public.eur_requests
      ADD CONSTRAINT eur_requests_invoice_order_number_v3_check
      CHECK (
        lead_type NOT IN ('eur_application', 'eur_prepayment_application')
        OR invoice_order_number IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;

DO $$
DECLARE
  base_value BIGINT;
  max_assigned BIGINT;
BEGIN
  IF to_regclass('public.eur_requests') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.invoice_order_counter (singleton, last_value)
  VALUES (true, 100199)
  ON CONFLICT (singleton) DO NOTHING;

  SELECT GREATEST(
    COALESCE((
      SELECT MAX(invoice_order_number)
      FROM public.eur_requests
      WHERE lead_type IN ('eur_application', 'eur_prepayment_application')
        AND invoice_order_number IS NOT NULL
    ), 0),
    COALESCE((
      SELECT last_value
      FROM public.invoice_order_counter
      WHERE singleton = true
    ), 0)
  ) INTO base_value;

  WITH missing AS (
    SELECT
      id,
      base_value + ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS new_order
    FROM public.eur_requests
    WHERE lead_type IN ('eur_application', 'eur_prepayment_application')
      AND invoice_order_number IS NULL
  ),
  upd AS (
    UPDATE public.eur_requests er
    SET
      invoice_order_number = missing.new_order,
      updated_at = NOW()
    FROM missing
    WHERE er.id = missing.id
    RETURNING missing.new_order
  )
  SELECT MAX(new_order) INTO max_assigned FROM upd;

  IF max_assigned IS NOT NULL THEN
    UPDATE public.invoice_order_counter
    SET last_value = GREATEST(last_value, max_assigned)
    WHERE singleton = true;
  END IF;
END $$;

DROP INDEX IF EXISTS uq_pricing_leads_invoice_order_number_eur;
DROP INDEX IF EXISTS uq_eur_requests_invoice_order_number_eur;

CREATE UNIQUE INDEX IF NOT EXISTS uq_eur_requests_invoice_order_number_v3
  ON public.eur_requests(invoice_order_number)
  WHERE lead_type IN ('eur_application', 'eur_prepayment_application')
    AND invoice_order_number IS NOT NULL;
