-- =============================================
-- Supabase Cleanup: Remove Old Tables
-- =============================================
-- Run this AFTER backing up any data you want to keep!
-- This removes the old exercise system tables

-- =============================================
-- STEP 1: Drop old exercise-related tables
-- =============================================

-- Drop old exercise tables (order matters due to foreign keys)
DROP TABLE IF EXISTS exercise_responses CASCADE;
DROP TABLE IF EXISTS exercise_sets CASCADE;

-- Drop old student_progress if not needed (the new system tracks progress differently)
DROP TABLE IF EXISTS student_progress CASCADE;

-- =============================================
-- STEP 2: Verify remaining tables
-- =============================================
-- After running this, you should have:
--
-- CORE TABLES (keep these):
--   - users
--   - subjects
--   - topics
--   - questions
--   - question_reports
--
-- NEW TEST/PRACTICE TABLES:
--   - test_templates
--   - test_sections
--   - test_attempts
--   - attempt_questions
--   - attempt_sections
--   - practice_sessions
--   - practice_answers

-- =============================================
-- STEP 3: Verify with this query
-- =============================================
-- Run this to see all your tables:
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
