// --- USER & AUTH ---
export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
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
  createdAt: string;
  questionCount?: number;
}

export interface TopicModel {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  createdAt: string;
  questionCount?: number;
}

// --- QUESTIONS ---
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type OptionId = 'a' | 'b' | 'c' | 'd' | 'e';

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
  topicId: string | null;
  tags: string[];
  difficulty: QuestionDifficulty;
  questionText: string;
  questionImageUrl?: string | null;
  options: QuestionOption[];
  correctAnswer: OptionId;
  explanation: string;
  explanationImageUrl?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  stats: QuestionStats;
}

// --- BULK IMPORT (CSV) ---
export interface ParsedQuestion {
  rowNumber: number;
  data: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  isValid: boolean;
  errors: string[];
  sourceFormat?: 'pontea' | 'learnworlds';
  metadata?: {
    originalGroup?: string;
    questionType?: string;
  };
}

export interface CSVImportConfig {
  format: 'pontea' | 'learnworlds';
  defaultSubjectId?: string;
  defaultTopicId?: string | null;
  detectDifficulty?: boolean;
}

// --- BULK IMAGE IMPORT ---
export type ImageParseStatus = 'pending' | 'parsing' | 'success' | 'error';

export interface ImageParseItem {
  id: string;
  file: File;
  dataUrl: string;
  status: ImageParseStatus;
  error?: string;
  parsedQuestion?: ParsedImageQuestion;
}

export interface ParsedImageQuestion {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  // Metadata fields (can be auto-detected or user-assigned)
  subjectId?: string;
  topicId?: string | null;
  difficulty?: QuestionDifficulty;
  // Auto-detection tracking flags
  isSubjectAutoDetected?: boolean;
  isDifficultyAutoDetected?: boolean;
}

export interface BulkParseRequest {
  images: Array<{
    id: string;
    dataUrl: string;
  }>;
}

export interface BulkParseResult {
  id: string;
  success: boolean;
  question?: ParsedImageQuestion;
  error?: string;
}

export interface BulkParseResponse {
  results: BulkParseResult[];
}

// --- SSE STREAMING TYPES ---
export interface SSEStartEvent {
  sessionId: string;
  totalImages: number;
  concurrency: number;
}

export interface SSEProgressEvent {
  id: string;
  status: 'parsing' | 'success' | 'error';
  question?: ParsedImageQuestion;
  error?: string;
  completed: number;
  total: number;
}

export interface SSECompleteEvent {
  successCount: number;
  errorCount: number;
  results: BulkParseResult[];
}

export interface SSEErrorEvent {
  message: string;
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
  startedAt: string;
  completedAt?: string;
  correctCount: number;
  totalQuestions: number;
  totalTimeSpent: number;
}

export interface ExerciseResponse {
  questionId: string;
  selectedAnswer: OptionId;
  isCorrect: boolean;
  timeSpent: number;
  answeredAt: string;
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
  lastActivityAt: string;
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
  createdAt: string;
  resolvedAt?: string;
}

// --- TEST TEMPLATES (Admin-configurable test structures) ---
export interface TestTemplate {
  id: string;
  name: string;
  description?: string;
  totalTimeMinutes: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  sections?: TestSection[];
}

export interface TestSection {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  timeLimitMinutes?: number;
  questionCount: number;
  subjectId?: string;
  difficultyDistribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  orderIndex: number;
}

// --- TEST ATTEMPTS (User test sessions with server state) ---
export type TestAttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'timed_out';

export interface TestAttempt {
  id: string;
  userId: string;
  templateId?: string;
  filters?: ExerciseFilters;
  status: TestAttemptStatus;
  startedAt: string;
  completedAt?: string;
  serverStartTime: string;
  timeLimitSeconds?: number;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  score?: number;
  percentageScore?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  totalTimeSpent?: number;
}

export interface AttemptQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  sectionIndex?: number;
  selectedAnswer?: OptionId;
  isCorrect?: boolean;
  timeSpent: number;
  answeredAt?: string;
}

export interface AttemptSection {
  id: string;
  attemptId: string;
  sectionIndex: number;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed';
  timeLimitSeconds?: number;
}

// --- PRACTICE SESSIONS ---
export type PracticeSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface PracticeSession {
  id: string;
  userId: string;
  filters: ExerciseFilters;
  questionIds: string[];
  currentIndex: number;
  status: PracticeSessionStatus;
  startedAt: string;
  completedAt?: string;
  correctCount: number;
  totalTimeSpent: number;
}

export interface PracticeAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedAnswer?: OptionId;
  isCorrect?: boolean;
  timeSpent: number;
  answeredAt: string;
}

// --- SERVER SYNC ---
export interface ServerSyncResponse {
  serverTime: string;
  remainingTime?: number;
  sectionRemainingTime?: number;
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
  status?: TestAttemptStatus;
  completedSections?: number[];
}

// --- SCORING ---
export interface ScoreResult {
  raw: number;
  percentage: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
}

// --- LEGACY TYPES (Keep until refactor complete) ---
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Category = string;
export type KnowledgeLevel = string;
export interface Question { id: string; [key:string]: any }
export interface UserInfo { name: string; email: string; targetUniversity: string; }
export interface QuestionResult { [key:string]: any }
export interface PlanTier { name: string; price: number; features: string[]; missingFeatures: string[]; recommended?: boolean; }
