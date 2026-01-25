-- Migration: Add test templates and template sections tables
-- Created: 2026-01-25

-- Test Templates table
CREATE TABLE IF NOT EXISTS test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  time_limit_seconds INTEGER,  -- Overall test time limit
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Sections table
CREATE TABLE IF NOT EXISTS template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES test_templates(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  time_limit_seconds INTEGER,  -- Per-section time limit
  question_ids UUID[] NOT NULL DEFAULT '{}',  -- Fixed questions for this section
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, section_index)
);

-- Add template_id reference to test_attempts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_attempts' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE test_attempts ADD COLUMN template_id UUID REFERENCES test_templates(id);
  END IF;
END $$;

-- Add section_name to attempt_sections if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attempt_sections' AND column_name = 'name'
  ) THEN
    ALTER TABLE attempt_sections ADD COLUMN name TEXT;
  END IF;
END $$;

-- Add question_count to attempt_sections if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attempt_sections' AND column_name = 'question_count'
  ) THEN
    ALTER TABLE attempt_sections ADD COLUMN question_count INTEGER;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_templates_is_active ON test_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_test_templates_created_by ON test_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_template_sections_template_id ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_template_id ON test_attempts(template_id);

-- RLS Policies for test_templates
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with templates
CREATE POLICY "Admins can manage templates" ON test_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can read active templates
CREATE POLICY "Students can read active templates" ON test_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for template_sections
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;

-- Admins can manage sections
CREATE POLICY "Admins can manage template sections" ON template_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can read sections of active templates
CREATE POLICY "Students can read template sections" ON template_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_templates WHERE id = template_id AND is_active = true
    )
  );

-- Updated_at trigger for test_templates
CREATE OR REPLACE FUNCTION update_test_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS test_templates_updated_at ON test_templates;
CREATE TRIGGER test_templates_updated_at
  BEFORE UPDATE ON test_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_test_templates_updated_at();
