ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS consent_personal_data BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assessment_results_phone
  ON assessment_results(phone);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessment_results_phone_e164_check'
  ) THEN
    ALTER TABLE assessment_results
      ADD CONSTRAINT assessment_results_phone_e164_check
      CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$');
  END IF;
END $$;
