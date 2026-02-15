ALTER TABLE IF EXISTS pricing_leads
  ADD COLUMN IF NOT EXISTS contract_country TEXT,
  ADD COLUMN IF NOT EXISTS contract_city TEXT,
  ADD COLUMN IF NOT EXISTS contract_address TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_eur_contract_fields_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_eur_contract_fields_check
      CHECK (
        lead_type <> 'eur_application'
        OR (
          length(btrim(coalesce(contract_country, ''))) > 0
          AND length(btrim(coalesce(contract_city, ''))) > 0
          AND length(btrim(coalesce(contract_address, ''))) > 0
        )
      ) NOT VALID;
  END IF;
END $$;
