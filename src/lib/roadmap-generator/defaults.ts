import { ExamPart, NameCategoryPattern, RoadmapConfig } from './types';

export const EXAM_PART_ORDER: ExamPart[] = [
  'READING',
  'LOGIC',
  'DRAWING',
  'MATH_PHYSICS',
  'GENERAL_KNOWLEDGE'
];

export const SECTION_TO_EXAM_PART_DEFAULT: Record<string, ExamPart> = {
  'text comprehension': 'READING',
  'logical reasoning': 'LOGIC',
  'drawing & representation': 'DRAWING',
  math: 'MATH_PHYSICS',
  physics: 'MATH_PHYSICS',
  'general culture': 'GENERAL_KNOWLEDGE',
  history: 'GENERAL_KNOWLEDGE',
  'history of art & architecture': 'GENERAL_KNOWLEDGE'
};

export const NAME_CATEGORY_PATTERNS_DEFAULT: NameCategoryPattern[] = [
  {
    category: 'EXAM_PRACTICE',
    patterns: ['old exam', 'old exams', 'practice test', 'practice tests', 'mock', 'real exam']
  },
  {
    category: 'PRACTICE_REVISION',
    patterns: ['practice & revision', 'practice and revision', 'revision', 'practice']
  },
  {
    category: 'INTRO',
    patterns: ['intro', 'overview', 'method', 'guidance', 'terminology', 'references']
  },
  {
    category: 'ADVANCED_HINT',
    patterns: ['part 2', 'final', 'systems', 'advanced', 'ii', 'iii']
  },
  {
    category: 'MISC',
    patterns: ['misc', 'misplaced']
  }
];

export const NAME_CATEGORY_RANK: Record<string, number> = {
  INTRO: 1,
  CORE: 2,
  ADVANCED_HINT: 3,
  PRACTICE_REVISION: 4,
  EXAM_PRACTICE: 5,
  MISC: 6
};

export const DEFAULT_ROADMAP_CONFIG: RoadmapConfig = {
  SECTION_ORDER_MODE: 'json_strict',
  ROADMAP_STRATEGY_MODE: 'high_level_v4',
  HOURS_ROUNDING_STEP: 0.1,
  MAX_OPTIMAL_HOURS_PER_WEEK: 80,
  USE_INPUT_HOURS_IF_PROVIDED: false,
  ENFORCE_FILL_TO_PLAN_IN_V3: false,
  RETAKES_ONLY_AFTER_CORE_COMPLETE: true,
  RETAKES_GLOBAL_CORE_PROGRESS_PCT: 0.9,
  RETAKES_FINAL_PHASE_ONLY: true,
  HIGH_LEVEL_REVIEW_BUFFER_PCT: 0.12,

  UNTIMED_TEXT_MIN_PER_ITEM: 8,
  BASE_MIN_PER_QUESTION: 2.5,
  PRACTICE_REVIEW_OVERHEAD_PCT: 0.2,
  SPRINT_BUFFER_PCT: 0.05,

  SUBJECT_MULTIPLIER_BY_SECTION_TITLE: {
    'text comprehension': 1.1,
    'logical reasoning': 1.0,
    'drawing & representation': 1.3,
    math: 1.4,
    physics: 1.5,
    'general culture': 1.0,
    history: 1.0,
    'history of art & architecture': 1.0
  },

  LEVEL_TIME_MULTIPLIER: {
    '1': 1.8,
    '2': 1.55,
    '3': 1.3,
    '4': 1.1,
    '5': 1.0
  },

  LEVEL_LEARNING_SHARE: {
    '1': 0.7,
    '2': 0.6,
    '3': 0.5,
    '4': 0.35,
    '5': 0.2
  },

  LEVEL_PRACTICE_SHARE: {
    '1': 0.3,
    '2': 0.4,
    '3': 0.5,
    '4': 0.65,
    '5': 0.8
  },

  BASELINE_PART_SHARE: 0.2,
  TARGET_LEVEL_FOR_GAP: 4,
  ALLOC_GAP_WEIGHT: 0.25,
  ALLOC_BACKLOG_WEIGHT: 0.25,
  MIN_PART_SHARE: 0.12,
  MAX_PART_SHARE: 0.3,
  MAX_SHARE_CHANGE_PER_SPRINT: 0.05,

  FINAL_PRACTICE_WEEKS: 3,
  FINAL_PHASE_LEARNING_MULTIPLIER: 0.5,
  ALLOW_NEW_LEARNING_IN_FINAL_PHASE: true,

  NAME_CATEGORY_PATTERNS: NAME_CATEGORY_PATTERNS_DEFAULT,

  DEFAULT_LEVEL_IF_MISSING: 3,
  IGNORE_UNKNOWN_LEVEL_KEYS: true,
  MINUTES_ROUNDING: 'nearest_5',

  PART_LEVEL_COMBINE_METHOD: 'workload_weighted',
  SECTION_TO_EXAM_PART_OVERRIDE: {},

  PRACTICE_UNLOCK_PCT: 1,
  ENABLE_RETAKES: true,
  RETAKE_MIN_GAP_SPRINTS: 2,
  RETAKE_SHARE_AFTER_UNIQUE_DONE: 1.0,
  WRONG_RATE_DEFAULT: 0.5,

  TARGET_ACCURACY: 0.7,
  TARGET_TIME_PER_Q_BY_PART: {
    READING: 2.0,
    LOGIC: 2.0,
    DRAWING: 2.5,
    MATH_PHYSICS: 2.5,
    GENERAL_KNOWLEDGE: 2.0
  },
  ADAPT_W_ACCURACY: 0.7,
  ADAPT_W_TIME: 0.3,
  PERFORMANCE_EMA_ALPHA: 0.5,
  ADAPT_STEP: 0.04,
  ADAPT_ONLY_ON_OK_CONFIDENCE: true,

  CHECKPOINT_SAMPLE_QUESTIONS_PER_PART: 15,
  CHECKPOINT_MIN_QUESTIONS_PER_PART: 15,
  CHECKPOINT_PREFERRED_Q: 25,
  CHECKPOINT_MIX_MAX_SUBMODULES: 3,

  LOW_LEVEL_THRESHOLD: 2,
  MIN_LOW_LEVEL_LEARNING_MIN: 120,
  MIN_PART_PRACTICE_QUESTIONS_TOTAL: 40,

  MAX_UNUSED_PCT: 0.02,
  REDISTRIBUTION_QUANTUM_MIN: 15,
  MIN_ITEM_TOTAL_MIN: 20,
  MIN_LEARNING_BLOCK_MIN: 20,
  MIN_PRACTICE_BLOCK_Q: 8,
  MIN_PART_PRESENCE_MIN: 45,
  PREFER_UNSPLIT_MODULES: true,
  UNSPLIT_MODULE_MAX_MIN: 180,
  HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT: 1.0,
  HISTORY_ART_ALLOW_INTRO_SCAFFOLDING: true,
  MAX_MODULE_CHUNKS: 2,
  MIN_CHUNK_MIN: 45,
  MIN_SECTION_SHARE_WITHIN_PART: {
    MATH_PHYSICS: 0.35,
    GENERAL_KNOWLEDGE: 0.25
  }
};

export const LEVELS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];
