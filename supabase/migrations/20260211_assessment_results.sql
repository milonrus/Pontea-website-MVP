CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  answers JSONB NOT NULL,
  domain_results JSONB NOT NULL,
  weakest_domains JSONB NOT NULL,
  study_plan JSONB NOT NULL,
  roadmap_output JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_share_token
  ON assessment_results(share_token);

CREATE INDEX IF NOT EXISTS idx_assessment_results_email
  ON assessment_results(email);

-- RLS (table accessed via service role key, but enable for safety)
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
