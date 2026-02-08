// --- QUESTIONS (shared primitives) ---
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type OptionId = 'a' | 'b' | 'c' | 'd' | 'e';

// --- ADAPTIVE ASSESSMENT (v2) ---
export type AssessmentDomain = 'reading_en' | 'logic' | 'drawing_spatial' | 'math' | 'physics' | 'humanities';
export type DomainGrade = 'A' | 'B' | 'C' | 'D';

export interface AssessmentOption {
  id: OptionId;
  text: string;
  score?: number; // only on self-assessment options (0-3)
}

export interface SelfAssessmentQuestion {
  id: string;
  type: 'self_assessment';
  domain: AssessmentDomain;
  prompt: string;
  options: AssessmentOption[];
}

export interface MicroCheckVariant {
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: OptionId;
}

export interface MicroCheckQuestion {
  id: string;
  type: 'micro_check';
  domain: AssessmentDomain;
  label: string;
  variants: MicroCheckVariant[];
}

export type AssessmentQuestionDef = SelfAssessmentQuestion | MicroCheckQuestion;

export interface AssessmentAnswer {
  questionId: string;
  domain: AssessmentDomain;
  selectedOptionId: OptionId;
  timeMs: number;
  type: 'self_assessment' | 'micro_check';
  selfAssessmentScore?: number;       // 0-3, for self-assessment
  microCheckCorrect?: boolean;         // for micro-check
  microCheckDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface DomainResult {
  domain: AssessmentDomain;
  domainLabel: string;
  score: number;  // 0-3
  grade: DomainGrade;
  selfAssessmentScore: number;
  microCheckAdjustment?: number;
}

export interface AssessmentResult {
  version: number;
  userInfo?: UserInfo;
  email?: string;
  answers: AssessmentAnswer[];
  domainResults: DomainResult[];
  weakestDomains: DomainResult[];
  studyPlan: DomainResult[];
  submittedAt: string;
}

// --- LEGACY TYPES (Keep until refactor complete) ---
export interface UserInfo { name: string; email: string; targetUniversity: string; }
export interface PlanTier { name: string; price: number; priceRub: number; features: string[]; missingFeatures: string[]; recommended?: boolean; }
