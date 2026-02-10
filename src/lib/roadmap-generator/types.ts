export type ExamPart =
  | 'READING'
  | 'LOGIC'
  | 'DRAWING'
  | 'MATH_PHYSICS'
  | 'GENERAL_KNOWLEDGE';

export type GeneratedMode = 'full' | 'full_attempt' | 'minimal';

export type PartLevelCombineMethod = 'workload_weighted' | 'equal_weighted';
export type SectionOrderMode = 'json_strict';
export type RoadmapStrategyMode = 'high_level_v4' | 'legacy_v3';

export type MinutesRoundingMode =
  | 'none'
  | 'ceil'
  | 'floor'
  | 'nearest_1'
  | 'nearest_5'
  | 'nearest_15';

export type NameCategory =
  | 'EXAM_PRACTICE'
  | 'PRACTICE_REVISION'
  | 'INTRO'
  | 'ADVANCED_HINT'
  | 'MISC'
  | 'CORE';

export type ExercisePriority = 'low' | 'medium' | 'high';

export interface SubmoduleStats {
  lessons_video_minutes: number;
  timed_text_minutes: number;
  untimed_text_items: number;
  questions_total: number;
  [key: string]: unknown;
}

export interface CourseSubmodule {
  name: string;
  stats: SubmoduleStats;
}

export interface CourseSection {
  section_id?: number;
  title: string;
  submodules: CourseSubmodule[];
  [key: string]: unknown;
}

export interface CourseModularOverview {
  sections: CourseSection[];
  [key: string]: unknown;
}

export interface CheckpointPartMetrics {
  accuracy: number;
  avg_time_per_question_min: number | null;
  completion_rate: number;
  confidence?: 'ok' | 'low_sample';
  checkpoint_questions?: number;
}

export interface CheckpointResult {
  sprint_number: number;
  results_by_part: Partial<Record<ExamPart, Partial<CheckpointPartMetrics>>>;
}

export interface NameCategoryPattern {
  category: NameCategory;
  patterns: string[];
}

export interface RoadmapConfig {
  SECTION_ORDER_MODE: SectionOrderMode;
  ROADMAP_STRATEGY_MODE: RoadmapStrategyMode;
  HOURS_ROUNDING_STEP: number;
  MAX_OPTIMAL_HOURS_PER_WEEK: number;
  USE_INPUT_HOURS_IF_PROVIDED: boolean;
  ENFORCE_FILL_TO_PLAN_IN_V3: boolean;
  RETAKES_ONLY_AFTER_CORE_COMPLETE: boolean;
  RETAKES_GLOBAL_CORE_PROGRESS_PCT: number;
  RETAKES_FINAL_PHASE_ONLY: boolean;
  HIGH_LEVEL_REVIEW_BUFFER_PCT: number;

  UNTIMED_TEXT_MIN_PER_ITEM: number;
  BASE_MIN_PER_QUESTION: number;
  PRACTICE_REVIEW_OVERHEAD_PCT: number;
  SPRINT_BUFFER_PCT: number;

  SUBJECT_MULTIPLIER_BY_SECTION_TITLE: Record<string, number>;

  LEVEL_TIME_MULTIPLIER: Record<'1' | '2' | '3' | '4' | '5', number>;
  LEVEL_LEARNING_SHARE: Record<'1' | '2' | '3' | '4' | '5', number>;
  LEVEL_PRACTICE_SHARE: Record<'1' | '2' | '3' | '4' | '5', number>;

  BASELINE_PART_SHARE: number;
  TARGET_LEVEL_FOR_GAP: number;
  ALLOC_GAP_WEIGHT: number;
  ALLOC_BACKLOG_WEIGHT: number;
  MIN_PART_SHARE: number;
  MAX_PART_SHARE: number;
  MAX_SHARE_CHANGE_PER_SPRINT: number;

  FINAL_PRACTICE_WEEKS: number;
  FINAL_PHASE_LEARNING_MULTIPLIER: number;
  ALLOW_NEW_LEARNING_IN_FINAL_PHASE: boolean;

  NAME_CATEGORY_PATTERNS: NameCategoryPattern[];

  DEFAULT_LEVEL_IF_MISSING: number;
  IGNORE_UNKNOWN_LEVEL_KEYS: boolean;
  MINUTES_ROUNDING: MinutesRoundingMode;

  PART_LEVEL_COMBINE_METHOD: PartLevelCombineMethod;
  SECTION_TO_EXAM_PART_OVERRIDE: Record<string, ExamPart>;

  PRACTICE_UNLOCK_PCT: number;
  ENABLE_RETAKES: boolean;
  RETAKE_MIN_GAP_SPRINTS: number;
  RETAKE_SHARE_AFTER_UNIQUE_DONE: number;
  WRONG_RATE_DEFAULT: number;

  TARGET_ACCURACY: number;
  TARGET_TIME_PER_Q_BY_PART: Record<ExamPart, number>;
  ADAPT_W_ACCURACY: number;
  ADAPT_W_TIME: number;
  PERFORMANCE_EMA_ALPHA: number;
  ADAPT_STEP: number;
  ADAPT_ONLY_ON_OK_CONFIDENCE: boolean;

  CHECKPOINT_SAMPLE_QUESTIONS_PER_PART: number;
  CHECKPOINT_MIN_QUESTIONS_PER_PART: number;
  CHECKPOINT_PREFERRED_Q: number;
  CHECKPOINT_MIX_MAX_SUBMODULES: number;

  LOW_LEVEL_THRESHOLD: number;
  MIN_LOW_LEVEL_LEARNING_MIN: number;
  MIN_PART_PRACTICE_QUESTIONS_TOTAL: number;
  MAX_UNUSED_PCT: number;
  REDISTRIBUTION_QUANTUM_MIN: number;
  MIN_ITEM_TOTAL_MIN: number;
  MIN_LEARNING_BLOCK_MIN: number;
  MIN_PRACTICE_BLOCK_Q: number;
  MIN_PART_PRESENCE_MIN: number;
  MIN_SECTION_SHARE_WITHIN_PART: Partial<Record<ExamPart, number>>;
  PREFER_UNSPLIT_MODULES: boolean;
  UNSPLIT_MODULE_MAX_MIN: number;
  HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT: number;
  HISTORY_ART_ALLOW_INTRO_SCAFFOLDING: boolean;
  MAX_MODULE_CHUNKS: number;
  MIN_CHUNK_MIN: number;
}

export interface RoadmapGeneratorInput {
  weeks_to_exam: number;
  hours_per_week?: number;
  levels_by_section: Record<string, number>;
  course_modular_overview: CourseModularOverview;
  checkpoint_history?: CheckpointResult[];
  config_overrides?: Partial<RoadmapConfig>;
}

export interface RoadmapWarning {
  type: string;
  section_title?: string;
  used_level?: number;
  message?: string;
}

export interface FeasibilitySummary {
  available_minutes_total: number;
  available_minutes_planning: number;
  required_minutes_full_coverage: number;
  cap_scope?: 'all_minutes';
  cap_infeasible: boolean;
  overall_infeasible: boolean;
  time_infeasible: boolean;
  cap_infeasible_by_part: Record<ExamPart, boolean>;
  max_minutes_allowed_by_cap_by_part: Record<ExamPart, number>;
  shortfall_due_to_cap_by_part: Record<ExamPart, number>;
  policy_feasible: boolean;
  notes: string[];
}

export interface ConfigSummary {
  SECTION_ORDER_MODE?: SectionOrderMode;
  ROADMAP_STRATEGY_MODE?: RoadmapStrategyMode;
  UNTIMED_TEXT_MIN_PER_ITEM: number;
  BASE_MIN_PER_QUESTION: number;
  PRACTICE_REVIEW_OVERHEAD_PCT: number;
  SPRINT_BUFFER_PCT: number;
  LEVEL_TIME_MULTIPLIER: Record<'1' | '2' | '3' | '4' | '5', number>;
  LEVEL_LEARNING_SHARE: Record<'1' | '2' | '3' | '4' | '5', number>;
  allocation: {
    BASELINE_PART_SHARE: number;
    ALLOC_GAP_WEIGHT: number;
    ALLOC_BACKLOG_WEIGHT: number;
    MIN_PART_SHARE: number;
    MAX_PART_SHARE: number;
    MAX_SHARE_CHANGE_PER_SPRINT: number;
  };
  final_phase: {
    FINAL_PRACTICE_WEEKS: number;
    FINAL_PHASE_LEARNING_MULTIPLIER: number;
    ALLOW_NEW_LEARNING_IN_FINAL_PHASE: boolean;
  };
  fill_policy: {
    MAX_UNUSED_PCT: number;
    REDISTRIBUTION_QUANTUM_MIN: number;
    ENABLE_RETAKES: boolean;
  };
  chunking: {
    MIN_ITEM_TOTAL_MIN: number;
    MIN_LEARNING_BLOCK_MIN: number;
    MIN_PRACTICE_BLOCK_Q: number;
    PREFER_UNSPLIT_MODULES?: boolean;
    UNSPLIT_MODULE_MAX_MIN?: number;
    MAX_MODULE_CHUNKS?: number;
    MIN_CHUNK_MIN?: number;
  };
  section_priority?: {
    HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT?: number;
    HISTORY_ART_ALLOW_INTRO_SCAFFOLDING?: boolean;
  };
  checkpoint: {
    CHECKPOINT_PREFERRED_Q: number;
    CHECKPOINT_MIN_QUESTIONS_PER_PART: number;
  };
  hours_policy: {
    HOURS_ROUNDING_STEP: number;
    MAX_OPTIMAL_HOURS_PER_WEEK: number;
    USE_INPUT_HOURS_IF_PROVIDED: boolean;
    ENFORCE_FILL_TO_PLAN_IN_V3: boolean;
    RETAKES_ONLY_AFTER_CORE_COMPLETE: boolean;
    RETAKES_GLOBAL_CORE_PROGRESS_PCT?: number;
    RETAKES_FINAL_PHASE_ONLY?: boolean;
    HIGH_LEVEL_REVIEW_BUFFER_PCT?: number;
  };
}

export interface ExamPartSummaryItem {
  exam_part: ExamPart;
  mapped_sections: string[];
  part_level: number;
  required_minutes_full: number;
  allocated_minutes_plan: number;
  allocated_share_avg: number;
  focus_reason: string[];
}

export interface SprintItem {
  exam_part: ExamPart;
  section_title: string;
  submodule_name: string;
  module_chunk_label?: string;

  planned_learning_minutes: number;
  planned_untimed_items?: number;
  planned_practice_questions_unique: number;
  planned_practice_questions_retake: number;
  planned_practice_questions_range?: string;
  exercise_priority?: ExercisePriority;

  practice_minutes_est: number;
  total_minutes_est: number;

  is_partial: boolean;
  remaining_after_sprint: {
    learning_minutes_remaining: number;
    questions_remaining_unique: number;
  };
}

export interface SprintPracticeBlock {
  block_type: 'exam_10q' | 'full_mock_50q' | 'weak_area_review';
  target_parts: ExamPart[];
  source_modules: string[];
  questions_range: string;
}

export interface SprintCheckpointByPart {
  exam_part: ExamPart;
  source_item: {
    section_title: string;
    submodule_name: string;
  };
  source_items_mixed?: Array<{
    section_title: string;
    submodule_name: string;
    questions: number;
  }>;
  checkpoint_type?: 'single' | 'mixed' | 'time_drill';
  timed_drill_minutes?: number;
  checkpoint_questions: number;
  target_metrics: {
    accuracy: number;
    avg_time_per_question_min: number;
  };
  confidence: 'ok' | 'low_sample';
}

export interface SprintOutput {
  sprint_number: number;
  week_start_index: number;
  week_end_index: number;
  sprint_weeks: number;
  available_minutes: number;
  planning_minutes: number;
  buffer_minutes: number;

  sprint_goal: string;
  sprint_summary_ru?: string;
  focus_exam_parts_ranked: ExamPart[];
  part_budgets_minutes: Record<ExamPart, number>;
  part_budgets_primary_minutes?: Record<ExamPart, number>;

  items: SprintItem[];
  practice_blocks?: SprintPracticeBlock[];

  checkpoint: {
    definition_by_part: SprintCheckpointByPart[];
    adaptation_rule_reference: string;
  };

  totals: {
    planned_minutes_sum: number;
    slack_minutes_unfilled: number;
    planned_utilization_pct: number;
    unused_minutes: number;
    unused_reason?: 'target_met' | 'coverage_complete' | 'no_eligible_work' | 'cap_limited';
    fill_target_minutes?: number;
  };
  part_executed_minutes?: Record<ExamPart, number>;
  reallocation_reason_by_part?: Partial<Record<ExamPart, string>>;
  unused_minutes_by_part?: Record<ExamPart, number>;
}

export interface CanonicalRoadmapOutput {
  metadata: {
    weeks_to_exam: number;
    hours_per_week: number;
    optimal_hours_per_week?: number;
    optimal_hours_source?: 'derived_from_material_and_caps';
    manual_hours_override_applied?: boolean;
    required_core_minutes_total?: number;
    required_minutes_due_to_cap_profile?: number;
    final_hours_rounding_step?: number;
    sprint_length_weeks_default: number;
    generated_mode: GeneratedMode;
    feasibility: FeasibilitySummary;
    config_used: ConfigSummary;
    warnings: RoadmapWarning[];
    unused_minutes_total?: number;
    unused_minutes_by_sprint?: number[];
  };
  exam_parts_summary: ExamPartSummaryItem[];
  sprints: SprintOutput[];
  end_state: {
    remaining_backlog_minutes_by_exam_part: Record<ExamPart, number>;
  };
}

export interface RoadmapGenerationResult {
  roadmaps: CanonicalRoadmapOutput[];
  effective_config: RoadmapConfig;
}

export interface ValidationResult {
  errors: string[];
  warnings: RoadmapWarning[];
}
