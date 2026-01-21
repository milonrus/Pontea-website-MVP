import { Timestamp } from 'firebase/firestore';

// --- USER & AUTH ---
export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  settings: {
    showResultAfterEach: boolean;
  };
}

// --- CONTENT HIERARCHY ---
export interface SubjectModel {
  id: string;
  name: string;
  description?: string;
  order: number;
  createdAt: Timestamp;
  questionCount?: number;
}

export interface TopicModel {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
  questionCount?: number;
}

// --- QUESTIONS ---
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type OptionId = 'a' | 'b' | 'c' | 'd';

export interface QuestionOption {
  id: OptionId;
  text: string;
}

export interface QuestionStats {
  totalAttempts: number;
  totalTimeSpent: number;
  correctCount: number;
}

export interface QuestionModel {
  id: string;
  subjectId: string;
  topicId: string;
  tags: string[];
  difficulty: QuestionDifficulty;
  questionText: string;
  questionImageUrl?: string | null;
  options: QuestionOption[];
  correctAnswer: OptionId;
  explanation: string;
  explanationImageUrl?: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  stats: QuestionStats;
}

// --- BULK IMPORT ---
export interface ParsedQuestion {
  rowNumber: number;
  data: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  isValid: boolean;
  errors: string[];
}

// --- EXERCISES ---
export type ExerciseStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ExerciseFilters {
  subjectId?: string;
  topicId?: string;
  difficulty?: QuestionDifficulty;
  count: number;
}

export interface ExerciseSet {
  id: string;
  studentId: string;
  title?: string;
  filters: ExerciseFilters;
  questionIds: string[];
  currentIndex: number;
  status: ExerciseStatus;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  correctCount: number;
  totalQuestions: number;
  totalTimeSpent: number;
}

export interface ExerciseResponse {
  questionId: string;
  selectedAnswer: OptionId;
  isCorrect: boolean;
  timeSpent: number;
  answeredAt: Timestamp;
}

// --- PROGRESS ---
export interface SubjectStats {
  attempted: number;
  correct: number;
  timeSpent: number;
}

export interface StudentProgress {
  id: string;
  masteredQuestionIds: string[];
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalTimeSpent: number;
  lastActivityAt: Timestamp;
  subjectStats: Record<string, SubjectStats>;
}

// --- QUESTION REPORTS ---
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface QuestionReport {
  id: string;
  questionId: string;
  questionText: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  status: ReportStatus;
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

// --- LEGACY TYPES (Keep until refactor complete) ---
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Category = string;
export type KnowledgeLevel = string;
export interface Question { id: string; [key:string]: any }
export interface UserInfo { name: string; email: string; targetUniversity: string; }
export interface QuestionResult { [key:string]: any }
export interface PlanTier { name: string; price: number; features: string[]; missingFeatures: string[]; recommended?: boolean; }
