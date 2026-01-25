-- =============================================
-- Supabase Migration v2: Test/Practice System
-- =============================================
-- Run this in your Supabase SQL Editor
-- This adds tables for the new test and practice architecture

-- =============================================
-- 1. TEST TEMPLATES (Admin-configurable test structures)
-- =============================================
CREATE TABLE IF NOT EXISTS test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_time_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. TEST SECTIONS (Section definitions per template)
-- =============================================
CREATE TABLE IF NOT EXISTS test_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES test_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  question_count INTEGER NOT NULL DEFAULT 10,
  subject_id UUID REFERENCES subjects(id),
  difficulty_distribution JSONB DEFAULT '{"easy": 30, "medium": 50, "hard": 20}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. TEST ATTEMPTS (User test sessions with server state)
-- =============================================
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES test_templates(id),
  filters JSONB DEFAULT '{}',
  question_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  server_start_time TIMESTAMPTZ DEFAULT now(),
  time_limit_seconds INTEGER,
  current_section_index INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  score DECIMAL(10,2),
  percentage_score INTEGER,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. ATTEMPT QUESTIONS (Questions assigned to attempt)
-- =============================================
CREATE TABLE IF NOT EXISTS attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  section_index INTEGER,
  selected_answer TEXT CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  time_spent INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- =============================================
-- 5. ATTEMPT SECTIONS (Section progress tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS attempt_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, section_index)
);

-- =============================================
-- 6. PRACTICE SESSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filters JSONB DEFAULT '{}',
  question_ids UUID[] DEFAULT '{}',
  current_index INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  correct_count INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 7. PRACTICE ANSWERS
-- =============================================
CREATE TABLE IF NOT EXISTS practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_answer TEXT CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  time_spent INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_template_id ON test_attempts(template_id);
CREATE INDEX IF NOT EXISTS idx_attempt_questions_attempt_id ON attempt_questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_sections_attempt_id ON attempt_sections(attempt_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_session_id ON practice_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_test_sections_template_id ON test_sections(template_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_answers ENABLE ROW LEVEL SECURITY;

-- Test Templates: Anyone can read active templates, only admins can modify
CREATE POLICY "Anyone can read active test templates"
  ON test_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage test templates"
  ON test_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Test Sections: Anyone can read, only admins can modify
CREATE POLICY "Anyone can read test sections"
  ON test_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage test sections"
  ON test_sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Test Attempts: Users can manage their own attempts
CREATE POLICY "Users can view own test attempts"
  ON test_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own test attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own test attempts"
  ON test_attempts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all test attempts"
  ON test_attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Attempt Questions: Users can manage questions in their attempts
CREATE POLICY "Users can manage own attempt questions"
  ON attempt_questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_questions.attempt_id AND test_attempts.user_id = auth.uid())
  );

-- Attempt Sections: Users can manage sections in their attempts
CREATE POLICY "Users can manage own attempt sections"
  ON attempt_sections FOR ALL
  USING (
    EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_sections.attempt_id AND test_attempts.user_id = auth.uid())
  );

-- Practice Sessions: Users can manage their own sessions
CREATE POLICY "Users can view own practice sessions"
  ON practice_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own practice sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all practice sessions"
  ON practice_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Practice Answers: Users can manage answers in their sessions
CREATE POLICY "Users can manage own practice answers"
  ON practice_answers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM practice_sessions WHERE practice_sessions.id = practice_answers.session_id AND practice_sessions.user_id = auth.uid())
  );

-- =============================================
-- MIGRATION: Map existing exercise data (optional)
-- =============================================
-- If you want to migrate existing exercise_sets to practice_sessions:
--
-- INSERT INTO practice_sessions (id, user_id, filters, question_ids, current_index, status, started_at, completed_at, correct_count, total_time_spent)
-- SELECT
--   id,
--   student_id as user_id,
--   filters,
--   question_ids,
--   current_index,
--   status,
--   started_at,
--   completed_at,
--   correct_count,
--   total_time_spent
-- FROM exercise_sets;
--
-- INSERT INTO practice_answers (session_id, question_id, selected_answer, is_correct, time_spent, answered_at)
-- SELECT
--   set_id as session_id,
--   question_id,
--   selected_answer,
--   is_correct,
--   time_spent,
--   answered_at
-- FROM exercise_responses;

-- =============================================
-- Done!
-- =============================================
-- After running this migration:
-- 1. Test that tables were created: SELECT * FROM test_templates LIMIT 1;
-- 2. Create a test template in the admin interface
-- 3. Test the practice and test flows
