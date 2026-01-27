import { supabase } from '@/lib/supabase/client';
import {
  SubjectModel,
  TopicModel,
  QuestionModel,
  QuestionReport,
  UserProfile,
  StudentProgress,
  UserRole
} from '@/types';

const mapSubject = (row: any): SubjectModel => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  order: row.order,
  createdAt: row.created_at,
  questionCount: row.question_count ?? undefined
});

const mapTopic = (row: any): TopicModel => ({
  id: row.id,
  subjectId: row.subject_id,
  name: row.name,
  order: row.order,
  createdAt: row.created_at,
  questionCount: row.question_count ?? undefined
});

const mapQuestion = (row: any): QuestionModel => ({
  id: row.id,
  subjectId: row.subject_id,
  topicId: row.topic_id ?? null,
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

const mapReport = (row: any): QuestionReport => ({
  id: row.id,
  questionId: row.question_id,
  questionText: row.question_text,
  reportedBy: row.reported_by,
  reporterName: row.reporter_name,
  reason: row.reason,
  status: row.status,
  adminNotes: row.admin_notes ?? undefined,
  reviewedBy: row.reviewed_by ?? undefined,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at ?? undefined
});

const mapUser = (row: any): UserProfile => ({
  uid: row.id,
  email: row.email,
  displayName: row.display_name || 'Student',
  role: row.role,
  createdAt: row.created_at,
  settings: row.settings || { showResultAfterEach: false }
});

const mapStudentProgress = (row: any): StudentProgress => ({
  id: row.id,
  masteredQuestionIds: row.mastered_question_ids || [],
  totalQuestionsAttempted: row.total_questions_attempted || 0,
  totalCorrect: row.total_correct || 0,
  totalTimeSpent: row.total_time_spent || 0,
  lastActivityAt: row.last_activity_at,
  subjectStats: row.subject_stats || {}
});

const mapQuestionUpdate = (data: Partial<QuestionModel>) => {
  const update: Record<string, any> = {};

  if (data.subjectId !== undefined) update.subject_id = data.subjectId;
  if (data.topicId !== undefined) update.topic_id = data.topicId;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.difficulty !== undefined) update.difficulty = data.difficulty;
  if (data.questionText !== undefined) update.question_text = data.questionText;
  if (data.questionImageUrl !== undefined) update.question_image_url = data.questionImageUrl;
  if (data.options !== undefined) update.options = data.options;
  if (data.correctAnswer !== undefined) update.correct_answer = data.correctAnswer;
  if (data.explanation !== undefined) update.explanation = data.explanation;
  if (data.explanationImageUrl !== undefined) update.explanation_image_url = data.explanationImageUrl;
  if (data.createdBy !== undefined) update.created_by = data.createdBy;
  if (data.isActive !== undefined) update.is_active = data.isActive;
  if (data.stats !== undefined) update.stats = data.stats;

  update.updated_at = new Date().toISOString();

  return update;
};

// --- SUBJECTS ---
export const getSubjects = async (): Promise<SubjectModel[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapSubject);
};

export const createSubject = async (data: Omit<SubjectModel, 'id' | 'createdAt'>) => {
  const { error } = await supabase.from('subjects').insert({
    name: data.name,
    description: data.description ?? null,
    order: data.order,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
};

// --- TOPICS ---
export const getTopics = async (subjectId: string): Promise<TopicModel[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapTopic);
};

export const createTopic = async (data: Omit<TopicModel, 'id' | 'createdAt'>) => {
  const { error } = await supabase.from('topics').insert({
    subject_id: data.subjectId,
    name: data.name,
    order: data.order,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
};

// --- QUESTIONS ---
export const getQuestions = async (limitCount = 50): Promise<QuestionModel[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return (data || []).map(mapQuestion);
};

export const getQuestion = async (id: string): Promise<QuestionModel | null> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data ? mapQuestion(data) : null;
};

export const createQuestion = async (
  data: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
) => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('questions').insert({
    subject_id: data.subjectId,
    topic_id: data.topicId ?? null,
    tags: data.tags,
    difficulty: data.difficulty,
    question_text: data.questionText,
    question_image_url: data.questionImageUrl ?? null,
    options: data.options,
    correct_answer: data.correctAnswer,
    explanation: data.explanation,
    explanation_image_url: data.explanationImageUrl ?? null,
    created_by: data.createdBy,
    is_active: data.isActive,
    stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 },
    created_at: now,
    updated_at: now
  });

  if (error) throw error;
};

export const updateQuestion = async (id: string, data: Partial<QuestionModel>) => {
  const { error } = await supabase
    .from('questions')
    .update(mapQuestionUpdate(data))
    .eq('id', id);

  if (error) throw error;
};

export const deleteQuestion = async (id: string) => {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
};

export const batchCreateQuestions = async (
  questions: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt'>[]
) => {
  const now = new Date().toISOString();
  const rows = questions.map(q => ({
    subject_id: q.subjectId,
    topic_id: q.topicId ?? null,
    tags: q.tags,
    difficulty: q.difficulty,
    question_text: q.questionText,
    question_image_url: q.questionImageUrl ?? null,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    explanation_image_url: q.explanationImageUrl ?? null,
    created_by: q.createdBy,
    is_active: q.isActive,
    stats: q.stats,
    created_at: now,
    updated_at: now
  }));

  console.log('Attempting to insert questions:', {
    count: rows.length,
    sample: rows[0]
  });

  // Log each question's options and correctAnswer for debugging
  rows.forEach((row, idx) => {
    console.log(`Question ${idx}:`, {
      text: row.question_text?.substring(0, 50),
      correctAnswer: row.correct_answer,
      optionsCount: row.options?.length,
      optionIds: row.options?.map((o: any) => o.id),
      fullOptions: JSON.stringify(row.options)
    });
  });

  const { error } = await supabase.from('questions').insert(rows);
  if (error) {
    console.error('Supabase insert error:', error);
    console.error('Failed row sample:', rows[0]);
    throw new Error(`Failed to insert questions: ${error.message}`);
  }
};

// --- EXTENDED SUBJECT CRUD ---
export const updateSubject = async (id: string, data: Partial<SubjectModel>) => {
  const update: Record<string, any> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description ?? null;
  if (data.order !== undefined) update.order = data.order;

  const { error } = await supabase.from('subjects').update(update).eq('id', id);
  if (error) throw error;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
};

// --- EXTENDED TOPIC CRUD ---
export const getAllTopics = async (): Promise<TopicModel[]> => {
  const { data, error } = await supabase.from('topics').select('*').order('order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTopic);
};

export const updateTopic = async (id: string, data: Partial<TopicModel>) => {
  const update: Record<string, any> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.order !== undefined) update.order = data.order;
  if (data.subjectId !== undefined) update.subject_id = data.subjectId;

  const { error } = await supabase.from('topics').update(update).eq('id', id);
  if (error) throw error;
};

export const deleteTopic = async (id: string) => {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
};

// --- QUESTION REPORTS ---
export const getReports = async (status?: string): Promise<QuestionReport[]> => {
  let query = supabase.from('question_reports').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapReport);
};

export const createReport = async (data: Omit<QuestionReport, 'id' | 'createdAt'>) => {
  const { error } = await supabase.from('question_reports').insert({
    question_id: data.questionId,
    question_text: data.questionText,
    reported_by: data.reportedBy,
    reporter_name: data.reporterName,
    reason: data.reason,
    status: data.status,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
};

export const updateReport = async (id: string, data: Partial<QuestionReport>) => {
  const updateData: Record<string, any> = {};

  if (data.status !== undefined) updateData.status = data.status;
  if (data.adminNotes !== undefined) updateData.admin_notes = data.adminNotes;
  if (data.reviewedBy !== undefined) updateData.reviewed_by = data.reviewedBy;
  if (data.reason !== undefined) updateData.reason = data.reason;

  if (data.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('question_reports').update(updateData).eq('id', id);
  if (error) throw error;
};

export const deleteReport = async (id: string) => {
  const { error } = await supabase.from('question_reports').delete().eq('id', id);
  if (error) throw error;
};

export const getReportCounts = async () => {
  const reports = await getReports();
  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };
};

// --- USERS / STUDENTS ---
export const getStudents = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapUser);
};

export const getUser = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapUser(data) : null;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  const update: Record<string, any> = {};
  if (data.displayName !== undefined) update.display_name = data.displayName;
  if (data.role !== undefined) update.role = data.role;
  if (data.settings !== undefined) update.settings = data.settings;

  const { error } = await supabase.from('users').update(update).eq('id', uid);
  if (error) throw error;
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  const { error } = await supabase.rpc('admin_update_user_role', {
    target_user_id: uid,
    new_role: role
  });
  if (error) throw error;
};

// --- STUDENT PROGRESS ---
export const getStudentProgress = async (userId: string): Promise<StudentProgress | null> => {
  const { data, error } = await supabase.from('student_progress').select('*').eq('id', userId).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapStudentProgress(data) : null;
};

export const getAllStudentProgress = async (): Promise<StudentProgress[]> => {
  const { data, error } = await supabase.from('student_progress').select('*');
  if (error) throw error;
  return (data || []).map(mapStudentProgress);
};

// --- STATS HELPERS ---
export const getQuestionCount = async (): Promise<number> => {
  const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

export const getStudentCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  if (error) throw error;
  return count || 0;
};

export const getQuestionsAddedThisWeek = async (): Promise<number> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  if (error) throw error;
  return count || 0;
};
