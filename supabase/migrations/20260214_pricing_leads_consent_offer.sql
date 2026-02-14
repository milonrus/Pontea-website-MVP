ALTER TABLE IF EXISTS pricing_leads
  ADD COLUMN IF NOT EXISTS consent_offer BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pricing_leads_eur_offer_check'
  ) THEN
    ALTER TABLE pricing_leads
      ADD CONSTRAINT pricing_leads_eur_offer_check
      CHECK (lead_type <> 'eur_application' OR consent_offer = true) NOT VALID;
  END IF;
END $$;
