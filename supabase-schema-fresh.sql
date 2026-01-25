-- =============================================
-- Supabase Fresh Schema for Arched/Pontea
-- =============================================
-- This is a complete fresh schema.
-- WARNING: This will DROP all existing tables!
-- Only use this for a fresh start.

-- =============================================
-- DROP ALL EXISTING TABLES
-- =============================================
DROP TABLE IF EXISTS exercise_responses CASCADE;
DROP TABLE IF EXISTS exercise_sets CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS question_reports CASCADE;
DROP TABLE IF EXISTS practice_answers CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS attempt_sections CASCADE;
DROP TABLE IF EXISTS attempt_questions CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS test_sections CASCADE;
DROP TABLE IF EXISTS test_templates CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. USERS (profiles)
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  settings JSONB DEFAULT '{"showResultAfterEach": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. SUBJECTS
-- =============================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. TOPICS
-- =============================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. QUESTIONS
-- =============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT DEFAULT '',
  explanation_image_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"totalAttempts": 0, "correctCount": 0, "totalTimeSpent": 0}'
);

-- =============================================
-- 5. QUESTION REPORTS
-- =============================================
CREATE TABLE question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =============================================
-- 6. TEST TEMPLATES
-- =============================================
CREATE TABLE test_templates (
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
-- 7. TEST SECTIONS
-- =============================================
CREATE TABLE test_sections (
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
-- 8. TEST ATTEMPTS
-- =============================================
CREATE TABLE test_attempts (
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
-- 9. ATTEMPT QUESTIONS
-- =============================================
CREATE TABLE attempt_questions (
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
-- 10. ATTEMPT SECTIONS
-- =============================================
CREATE TABLE attempt_sections (
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
-- 11. PRACTICE SESSIONS
-- =============================================
CREATE TABLE practice_sessions (
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
-- 12. PRACTICE ANSWERS
-- =============================================
CREATE TABLE practice_answers (
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
-- INDEXES
-- =============================================
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_status ON test_attempts(status);
CREATE INDEX idx_test_attempts_template_id ON test_attempts(template_id);
CREATE INDEX idx_attempt_questions_attempt_id ON attempt_questions(attempt_id);
CREATE INDEX idx_attempt_sections_attempt_id ON attempt_sections(attempt_id);
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_answers_session_id ON practice_answers(session_id);
CREATE INDEX idx_test_sections_template_id ON test_sections(template_id);
CREATE INDEX idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX idx_question_reports_status ON question_reports(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_answers ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- SUBJECTS policies (public read)
CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- TOPICS policies (public read)
CREATE POLICY "Anyone can read topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON topics FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- QUESTIONS policies
CREATE POLICY "Anyone can read active questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can read all questions" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- QUESTION_REPORTS policies
CREATE POLICY "Users can create reports" ON question_reports FOR INSERT WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Users can view own reports" ON question_reports FOR SELECT USING (reported_by = auth.uid());
CREATE POLICY "Admins can manage reports" ON question_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- TEST_TEMPLATES policies
CREATE POLICY "Anyone can read active test templates" ON test_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage test templates" ON test_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- TEST_SECTIONS policies
CREATE POLICY "Anyone can read test sections" ON test_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage test sections" ON test_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- TEST_ATTEMPTS policies
CREATE POLICY "Users can view own test attempts" ON test_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own test attempts" ON test_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own test attempts" ON test_attempts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all test attempts" ON test_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ATTEMPT_QUESTIONS policies
CREATE POLICY "Users can manage own attempt questions" ON attempt_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_questions.attempt_id AND test_attempts.user_id = auth.uid())
);
CREATE POLICY "Admins can view all attempt questions" ON attempt_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ATTEMPT_SECTIONS policies
CREATE POLICY "Users can manage own attempt sections" ON attempt_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_sections.attempt_id AND test_attempts.user_id = auth.uid())
);

-- PRACTICE_SESSIONS policies
CREATE POLICY "Users can view own practice sessions" ON practice_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own practice sessions" ON practice_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own practice sessions" ON practice_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all practice sessions" ON practice_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- PRACTICE_ANSWERS policies
CREATE POLICY "Users can manage own practice answers" ON practice_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM practice_sessions WHERE practice_sessions.id = practice_answers.session_id AND practice_sessions.user_id = auth.uid())
);

-- =============================================
-- SEED DATA: Default subjects
-- =============================================
INSERT INTO subjects (name, description, "order") VALUES
  ('Mathematics', 'Mathematical reasoning and problem solving', 1),
  ('Physics', 'Physical sciences and mechanics', 2),
  ('Logic', 'Logical reasoning and deduction', 3),
  ('History', 'Architectural history and theory', 4),
  ('Drawing', 'Technical drawing and visualization', 5)
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE!
-- =============================================
-- Verify with: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
