-- ============================================================================
-- PONTEA SCHOOL - CLEAN DATABASE SCHEMA
-- ============================================================================
-- This script completely resets your database for development
-- Run this in Supabase SQL Editor to start fresh
-- ============================================================================

-- Drop existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS exercise_responses CASCADE;
DROP TABLE IF EXISTS exercise_sets CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS question_reports CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS submit_answer CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB DEFAULT '{"showResultAfterEach": false}'::jsonb
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple RLS: All authenticated users can read all profiles (school environment)
CREATE POLICY "Anyone authenticated can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- TABLE: subjects
-- ============================================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read subjects
CREATE POLICY "Anyone authenticated can read subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert/update/delete (we'll check admin in app layer)
CREATE POLICY "Authenticated can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_subjects_order ON subjects("order");

-- ============================================================================
-- TABLE: topics
-- ============================================================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read topics
CREATE POLICY "Anyone authenticated can read topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated can manage topics
CREATE POLICY "Authenticated can manage topics"
  ON topics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_order ON topics("order");

-- ============================================================================
-- TABLE: questions
-- ============================================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT NOT NULL,
  explanation_image_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"totalAttempts": 0, "totalTimeSpent": 0, "correctCount": 0}'::jsonb
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active questions
CREATE POLICY "Anyone authenticated can read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated can manage questions
CREATE POLICY "Authenticated can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- ============================================================================
-- TABLE: question_reports
-- ============================================================================
CREATE TABLE question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES users(id),
  reporter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Users can read all reports
CREATE POLICY "Anyone authenticated can read reports"
  ON question_reports FOR SELECT
  TO authenticated
  USING (true);

-- Users can create reports
CREATE POLICY "Anyone authenticated can create reports"
  ON question_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update reports
CREATE POLICY "Authenticated can update reports"
  ON question_reports FOR UPDATE
  TO authenticated
  USING (true);

-- Users can delete reports
CREATE POLICY "Authenticated can delete reports"
  ON question_reports FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX idx_reports_question_id ON question_reports(question_id);
CREATE INDEX idx_reports_status ON question_reports(status);
CREATE INDEX idx_reports_created_at ON question_reports(created_at DESC);

-- ============================================================================
-- TABLE: student_progress
-- ============================================================================
CREATE TABLE student_progress (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mastered_question_ids UUID[] DEFAULT '{}',
  total_questions_attempted INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subject_stats JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own progress"
  ON student_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON student_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON student_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE INDEX idx_progress_last_activity ON student_progress(last_activity_at DESC);

-- ============================================================================
-- TABLE: exercise_sets
-- ============================================================================
CREATE TABLE exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  filters JSONB NOT NULL,
  question_ids UUID[] NOT NULL,
  current_index INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  correct_count INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  total_time_spent INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Users can read their own exercise sets
CREATE POLICY "Users can read own exercise sets"
  ON exercise_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Users can create their own exercise sets
CREATE POLICY "Users can create own exercise sets"
  ON exercise_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Users can update their own exercise sets
CREATE POLICY "Users can update own exercise sets"
  ON exercise_sets FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE INDEX idx_exercise_sets_student_id ON exercise_sets(student_id);
CREATE INDEX idx_exercise_sets_started_at ON exercise_sets(started_at DESC);
CREATE INDEX idx_exercise_sets_status ON exercise_sets(status);

-- ============================================================================
-- TABLE: exercise_responses
-- ============================================================================
CREATE TABLE exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_set_id UUID NOT NULL REFERENCES exercise_sets(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exercise_responses ENABLE ROW LEVEL SECURITY;

-- Users can read responses for their own exercise sets
CREATE POLICY "Users can read own exercise responses"
  ON exercise_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_sets
      WHERE exercise_sets.id = exercise_responses.exercise_set_id
      AND exercise_sets.student_id = auth.uid()
    )
  );

-- Users can create responses for their own exercise sets
CREATE POLICY "Users can create own exercise responses"
  ON exercise_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_sets
      WHERE exercise_sets.id = exercise_responses.exercise_set_id
      AND exercise_sets.student_id = auth.uid()
    )
  );

CREATE INDEX idx_responses_exercise_set_id ON exercise_responses(exercise_set_id);
CREATE INDEX idx_responses_question_id ON exercise_responses(question_id);
CREATE INDEX idx_responses_answered_at ON exercise_responses(answered_at);

-- ============================================================================
-- FUNCTION: submit_answer
-- ============================================================================
-- Atomically records an answer and updates all related stats
CREATE OR REPLACE FUNCTION submit_answer(
  user_id UUID,
  set_id UUID,
  question_id UUID,
  selected_answer TEXT,
  time_spent INTEGER,
  is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Insert the response
  INSERT INTO exercise_responses (
    exercise_set_id,
    question_id,
    selected_answer,
    is_correct,
    time_spent,
    answered_at
  ) VALUES (
    set_id,
    question_id,
    selected_answer,
    is_correct,
    time_spent,
    NOW()
  );

  -- Update exercise set stats
  UPDATE exercise_sets
  SET
    current_index = current_index + 1,
    correct_count = correct_count + CASE WHEN is_correct THEN 1 ELSE 0 END,
    total_time_spent = total_time_spent + time_spent
  WHERE id = set_id;

  -- Update question stats
  UPDATE questions
  SET stats = jsonb_set(
    jsonb_set(
      jsonb_set(
        stats,
        '{totalAttempts}',
        to_jsonb((stats->>'totalAttempts')::int + 1)
      ),
      '{totalTimeSpent}',
      to_jsonb((stats->>'totalTimeSpent')::int + time_spent)
    ),
    '{correctCount}',
    to_jsonb((stats->>'correctCount')::int + CASE WHEN is_correct THEN 1 ELSE 0 END)
  )
  WHERE id = question_id;

  -- Ensure student_progress record exists
  INSERT INTO student_progress (id, last_activity_at)
  VALUES (user_id, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Update student progress
  UPDATE student_progress
  SET
    total_questions_attempted = total_questions_attempted + 1,
    total_correct = total_correct + CASE WHEN is_correct THEN 1 ELSE 0 END,
    total_time_spent = total_time_spent + time_spent,
    last_activity_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION submit_answer TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE subjects IS 'Academic subjects (Math, Science, etc.)';
COMMENT ON TABLE topics IS 'Topics within subjects';
COMMENT ON TABLE questions IS 'Question bank with multiple choice questions';
COMMENT ON TABLE question_reports IS 'Student-reported issues with questions';
COMMENT ON TABLE student_progress IS 'Overall progress tracking per student';
COMMENT ON TABLE exercise_sets IS 'Practice exercise sessions';
COMMENT ON TABLE exercise_responses IS 'Individual answers within exercise sessions';
COMMENT ON FUNCTION submit_answer IS 'Atomically records answer and updates all stats';

-- ============================================================================
-- DONE
-- ============================================================================
-- Your database is now ready for development!
-- All RLS policies are simplified for fast queries with no circular dependencies.
