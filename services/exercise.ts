import { supabase } from '../supabase';
import { ExerciseFilters, ExerciseSet, QuestionModel, OptionId, ExerciseResponse } from '../types';

const mapQuestion = (row: any): QuestionModel => ({
  id: row.id,
  subjectId: row.subject_id,
  topicId: row.topic_id,
  tags: row.tags || [],
  difficulty: row.difficulty,
  questionText: row.question_text,
  questionImageUrl: row.question_image_url ?? null,
  options: row.options || [],
  correctAnswer: row.correct_answer,
  explanation: row.explanation,
  explanationImageUrl: row.explanation_image_url ?? null,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  isActive: row.is_active,
  stats: row.stats || { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 }
});

const mapExerciseSet = (row: any): ExerciseSet => ({
  id: row.id,
  studentId: row.student_id,
  title: row.title ?? undefined,
  filters: row.filters || {},
  questionIds: row.question_ids || [],
  currentIndex: row.current_index ?? 0,
  status: row.status,
  startedAt: row.started_at,
  completedAt: row.completed_at ?? undefined,
  correctCount: row.correct_count ?? 0,
  totalQuestions: row.total_questions ?? 0,
  totalTimeSpent: row.total_time_spent ?? 0
});

const mapExerciseResponse = (row: any): ExerciseResponse => ({
  questionId: row.question_id,
  selectedAnswer: row.selected_answer,
  isCorrect: row.is_correct,
  timeSpent: row.time_spent,
  answeredAt: row.answered_at
});

export const generateExerciseSet = async (
  userId: string,
  filters: ExerciseFilters
): Promise<{ id: string; questions: QuestionModel[] }> => {
  const { data: progressData, error: progressError } = await supabase
    .from('student_progress')
    .select('mastered_question_ids')
    .eq('id', userId)
    .single();

  if (progressError && progressError.code !== 'PGRST116') {
    throw progressError;
  }

  const masteredIds: string[] = progressData?.mastered_question_ids || [];

  let query = supabase.from('questions').select('*').eq('is_active', true);

  if (filters.subjectId && filters.subjectId !== 'all') {
    query = query.eq('subject_id', filters.subjectId);
  }
  if (filters.topicId && filters.topicId !== 'all') {
    query = query.eq('topic_id', filters.topicId);
  }
  if (filters.difficulty && (filters.difficulty as any) !== 'any') {
    query = query.eq('difficulty', filters.difficulty);
  }

  const { data: questionRows, error } = await query;
  if (error) throw error;

  let candidates = (questionRows || []).map(mapQuestion);
  candidates = candidates.filter(q => !masteredIds.includes(q.id));

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, filters.count);

  if (selected.length === 0) {
    throw new Error('No available questions found for these filters.');
  }

  const cleanFilters = {
    subjectId: filters.subjectId,
    count: filters.count,
    ...(filters.difficulty && { difficulty: filters.difficulty })
  };

  const now = new Date().toISOString();

  const { data: insertData, error: insertError } = await supabase
    .from('exercise_sets')
    .insert({
      student_id: userId,
      filters: cleanFilters,
      question_ids: selected.map(q => q.id),
      current_index: 0,
      status: 'in_progress',
      started_at: now,
      correct_count: 0,
      total_questions: selected.length,
      total_time_spent: 0
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  return { id: insertData.id, questions: selected };
};

export const getExerciseSet = async (id: string): Promise<ExerciseSet | null> => {
  const { data, error } = await supabase.from('exercise_sets').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapExerciseSet(data) : null;
};

export const getQuestionsByIds = async (ids: string[]): Promise<QuestionModel[]> => {
  if (ids.length === 0) return [];

  const { data, error } = await supabase.from('questions').select('*').in('id', ids);
  if (error) throw error;

  const mapped = (data || []).map(mapQuestion);
  const mapById = new Map(mapped.map(q => [q.id, q]));
  return ids.map(id => mapById.get(id)).filter(Boolean) as QuestionModel[];
};

export const submitAnswer = async (
  userId: string,
  setId: string,
  questionId: string,
  selectedAnswer: OptionId,
  timeSpent: number,
  isCorrect: boolean
) => {
  const { error } = await supabase.rpc('submit_answer', {
    user_id: userId,
    set_id: setId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    time_spent: timeSpent,
    is_correct: isCorrect
  });

  if (error) throw error;
};

export const completeExercise = async (setId: string) => {
  const { error } = await supabase
    .from('exercise_sets')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', setId);

  if (error) throw error;
};

export const getExerciseHistory = async (userId: string): Promise<ExerciseSet[]> => {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('student_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapExerciseSet);
};

export const getExerciseResponses = async (setId: string): Promise<ExerciseResponse[]> => {
  const { data, error } = await supabase
    .from('exercise_responses')
    .select('*')
    .eq('exercise_set_id', setId)
    .order('answered_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapExerciseResponse);
};

export const getExerciseSetsForStudent = async (studentId: string): Promise<ExerciseSet[]> => {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapExerciseSet);
};

export const abandonExercise = async (setId: string) => {
  const { error } = await supabase
    .from('exercise_sets')
    .update({ status: 'abandoned' })
    .eq('id', setId);

  if (error) throw error;
};
