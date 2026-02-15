DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessment_results_phone_e164_check'
  ) THEN
    ALTER TABLE assessment_results
      DROP CONSTRAINT assessment_results_phone_e164_check;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessment_results_phone_starts_with_plus_check'
  ) THEN
    ALTER TABLE assessment_results
      DROP CONSTRAINT assessment_results_phone_starts_with_plus_check;
  END IF;
END $$;

ALTER TABLE assessment_results
  ADD CONSTRAINT assessment_results_phone_starts_with_plus_check
  CHECK (phone IS NULL OR phone ~ '^\+.+$');
