ALTER TABLE IF EXISTS pricing_leads
  ADD COLUMN IF NOT EXISTS contract_postal_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_eur_contract_postal_code_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_eur_contract_postal_code_check
      CHECK (
        lead_type <> 'eur_application'
        OR length(btrim(coalesce(contract_postal_code, ''))) > 0
      ) NOT VALID;
  END IF;
END $$;
