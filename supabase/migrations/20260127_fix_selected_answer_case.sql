-- Normalize selected_answer values to lowercase and enforce lowercase-only constraint
BEGIN;

UPDATE attempt_questions
SET selected_answer = lower(selected_answer)
WHERE selected_answer IS NOT NULL;

UPDATE practice_answers
SET selected_answer = lower(selected_answer)
WHERE selected_answer IS NOT NULL;

ALTER TABLE attempt_questions
  DROP CONSTRAINT IF EXISTS attempt_questions_selected_answer_check;

ALTER TABLE attempt_questions
  ADD CONSTRAINT attempt_questions_selected_answer_check
  CHECK (selected_answer IS NULL OR selected_answer IN ('a', 'b', 'c', 'd', 'e'));

ALTER TABLE practice_answers
  DROP CONSTRAINT IF EXISTS practice_answers_selected_answer_check;

ALTER TABLE practice_answers
  ADD CONSTRAINT practice_answers_selected_answer_check
  CHECK (selected_answer IS NULL OR selected_answer IN ('a', 'b', 'c', 'd', 'e'));

COMMIT;
