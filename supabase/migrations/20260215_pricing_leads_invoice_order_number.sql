ALTER TABLE IF EXISTS pricing_leads
  ADD COLUMN IF NOT EXISTS invoice_order_number BIGINT;

CREATE TABLE IF NOT EXISTS invoice_order_counter (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton = true),
  last_value BIGINT NOT NULL
);

INSERT INTO invoice_order_counter (singleton, last_value)
VALUES (true, 100199)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION assign_invoice_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_value BIGINT;
BEGIN
  IF NEW.lead_type = 'eur_application' THEN
    IF NEW.invoice_order_number IS NULL THEN
      UPDATE invoice_order_counter
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

DROP TRIGGER IF EXISTS trg_assign_invoice_order_number ON pricing_leads;

CREATE TRIGGER trg_assign_invoice_order_number
BEFORE INSERT ON pricing_leads
FOR EACH ROW
EXECUTE FUNCTION assign_invoice_order_number();

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_leads_invoice_order_number_eur
  ON pricing_leads(invoice_order_number)
  WHERE lead_type = 'eur_application' AND invoice_order_number IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_eur_invoice_order_number_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_eur_invoice_order_number_check
      CHECK (lead_type <> 'eur_application' OR invoice_order_number IS NOT NULL) NOT VALID;
  END IF;
END $$;
