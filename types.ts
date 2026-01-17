export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// The 5 Official Domains
export type Category = 
  | 'Reading Comprehension' 
  | 'Logical Reasoning' 
  | 'Knowledge & History' 
  | 'Drawing & Representation' 
  | 'Math & Physics';

// Knowledge Levels
export type KnowledgeLevel = 'KL0' | 'KL1.1' | 'KL1.2' | 'KL2.1' | 'KL2.2' | 'KL3.1' | 'KL3.2';

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  passage?: string; // For Reading Comp
}

export interface UserInfo {
  name: string;
  email: string;
  targetUniversity: string;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  difficulty: Difficulty;
  category: Category;
  timeTaken: number; // milliseconds
}

export interface AssessmentState {
  currentQuestionIndex: number;
  history: QuestionResult[];
  isFinished: boolean;
}

export interface PlanTier {
  name: string;
  price: number;
  features: string[];
  missingFeatures: string[];
  recommended?: boolean;
}

export interface DomainResult {
  category: Category;
  correct: number;
  total: number;
  level: KnowledgeLevel;
}
