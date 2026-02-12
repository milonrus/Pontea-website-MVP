import { normalizeTitle } from './helpers';
import { RoadmapConfig, RoadmapGeneratorInput, ValidationResult } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function validateShareTable(
  table: Record<'1' | '2' | '3' | '4' | '5', number>,
  label: string,
  result: ValidationResult
): void {
  (['1', '2', '3', '4', '5'] as const).forEach((key) => {
    const val = table[key];
    if (!isFiniteNumber(val) || !inRange(val, 0, 1)) {
      result.errors.push(`${label}[${key}] must be in [0..1]`);
    }
  });
}

export function validateRoadmapInput(
  input: RoadmapGeneratorInput,
  config: RoadmapConfig
): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };

  if (!Number.isInteger(input.weeks_to_exam) || input.weeks_to_exam < 1) {
    result.errors.push('weeks_to_exam must be an integer >= 1');
  }

  if (
    input.hours_per_week !== undefined &&
    (!isFiniteNumber(input.hours_per_week) || input.hours_per_week <= 0)
  ) {
    result.errors.push('hours_per_week must be > 0 when provided');
  }

  if (!input.course_modular_overview || !Array.isArray(input.course_modular_overview.sections)) {
    result.errors.push('course_modular_overview.sections must be an array');
    return result;
  }

  const knownSections = new Set(
    input.course_modular_overview.sections.map((section) => normalizeTitle(section.title))
  );

  Object.entries(input.levels_by_section || {}).forEach(([key, level]) => {
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      result.errors.push(`levels_by_section[${key}] must be an integer in [1..5]`);
    }
    if (!knownSections.has(normalizeTitle(key)) && !config.IGNORE_UNKNOWN_LEVEL_KEYS) {
      result.errors.push(`Unknown section key in levels_by_section: ${key}`);
    }
  });

  input.course_modular_overview.sections.forEach((section) => {
    if (!Array.isArray(section.submodules)) {
      result.errors.push(`Section '${section.title}' has invalid submodules array`);
      return;
    }

    section.submodules.forEach((submodule) => {
      const stats = submodule.stats;
      if (!stats) {
        result.errors.push(`Submodule '${submodule.name}' in '${section.title}' is missing stats`);
        return;
      }

      const numericFields: Array<[string, number]> = [
        ['lessons_video_minutes', stats.lessons_video_minutes],
        ['timed_text_minutes', stats.timed_text_minutes],
        ['untimed_text_items', stats.untimed_text_items],
        ['questions_total', stats.questions_total]
      ];

      numericFields.forEach(([field, value]) => {
        if (!isFiniteNumber(value)) {
          result.errors.push(
            `Submodule '${submodule.name}' in '${section.title}' has non-numeric ${field}`
          );
        } else if (value < 0) {
          result.errors.push(
            `Submodule '${submodule.name}' in '${section.title}' has negative ${field}`
          );
        }
      });
    });
  });

  if (config.MIN_PART_SHARE * 5 > 1) {
    result.errors.push('Config error: MIN_PART_SHARE * 5 must be <= 1');
  }
  if (config.MAX_PART_SHARE < config.BASELINE_PART_SHARE) {
    result.errors.push('Config error: MAX_PART_SHARE must be >= BASELINE_PART_SHARE');
  }
  if (config.MIN_PART_SHARE > config.BASELINE_PART_SHARE) {
    result.errors.push('Config error: MIN_PART_SHARE must be <= BASELINE_PART_SHARE');
  }

  if (config.SECTION_ORDER_MODE !== 'json_strict') {
    result.errors.push('SECTION_ORDER_MODE must be "json_strict"');
  }
  if (config.ROADMAP_STRATEGY_MODE !== 'high_level_v4' && config.ROADMAP_STRATEGY_MODE !== 'legacy_v3') {
    result.errors.push('ROADMAP_STRATEGY_MODE must be "high_level_v4" or "legacy_v3"');
  }
  if (!inRange(config.HOURS_ROUNDING_STEP, 0.1, 2)) {
    result.errors.push('HOURS_ROUNDING_STEP must be in [0.1..2]');
  }
  if (!inRange(config.MAX_OPTIMAL_HOURS_PER_WEEK, 1, 120)) {
    result.errors.push('MAX_OPTIMAL_HOURS_PER_WEEK must be in [1..120]');
  }
  if (typeof config.USE_INPUT_HOURS_IF_PROVIDED !== 'boolean') {
    result.errors.push('USE_INPUT_HOURS_IF_PROVIDED must be a boolean');
  }
  if (typeof config.ENFORCE_FILL_TO_PLAN_IN_V3 !== 'boolean') {
    result.errors.push('ENFORCE_FILL_TO_PLAN_IN_V3 must be a boolean');
  }
  if (typeof config.RETAKES_ONLY_AFTER_CORE_COMPLETE !== 'boolean') {
    result.errors.push('RETAKES_ONLY_AFTER_CORE_COMPLETE must be a boolean');
  }
  if (!inRange(config.RETAKES_GLOBAL_CORE_PROGRESS_PCT, 0, 1)) {
    result.errors.push('RETAKES_GLOBAL_CORE_PROGRESS_PCT must be in [0..1]');
  }
  if (typeof config.RETAKES_FINAL_PHASE_ONLY !== 'boolean') {
    result.errors.push('RETAKES_FINAL_PHASE_ONLY must be a boolean');
  }
  if (!inRange(config.HIGH_LEVEL_REVIEW_BUFFER_PCT, 0, 0.5)) {
    result.errors.push('HIGH_LEVEL_REVIEW_BUFFER_PCT must be in [0..0.5]');
  }

  if (!inRange(config.UNTIMED_TEXT_MIN_PER_ITEM, 1, 30)) {
    result.errors.push('UNTIMED_TEXT_MIN_PER_ITEM must be in [1..30]');
  }
  if (!inRange(config.BASE_MIN_PER_QUESTION, 1, 5)) {
    result.errors.push('BASE_MIN_PER_QUESTION must be in [1..5]');
  }
  if (!inRange(config.PRACTICE_REVIEW_OVERHEAD_PCT, 0, 1)) {
    result.errors.push('PRACTICE_REVIEW_OVERHEAD_PCT must be in [0..1]');
  }
  if (!inRange(config.SPRINT_BUFFER_PCT, 0, 0.25)) {
    result.errors.push('SPRINT_BUFFER_PCT must be in [0..0.25]');
  }

  validateShareTable(config.LEVEL_LEARNING_SHARE, 'LEVEL_LEARNING_SHARE', result);
  validateShareTable(config.LEVEL_PRACTICE_SHARE, 'LEVEL_PRACTICE_SHARE', result);

  (['1', '2', '3', '4', '5'] as const).forEach((key) => {
    const learn = config.LEVEL_LEARNING_SHARE[key];
    const practice = config.LEVEL_PRACTICE_SHARE[key];
    if (Math.abs(learn + practice - 1) > 1e-6) {
      result.errors.push(`LEVEL_LEARNING_SHARE[${key}] + LEVEL_PRACTICE_SHARE[${key}] must equal 1`);
    }
  });

  Object.entries(config.SUBJECT_MULTIPLIER_BY_SECTION_TITLE).forEach(([key, value]) => {
    if (!isFiniteNumber(value) || !inRange(value, 0.5, 3.0)) {
      result.errors.push(`SUBJECT_MULTIPLIER_BY_SECTION_TITLE['${key}'] must be in [0.5..3.0]`);
    }
  });

  if (!inRange(config.TARGET_LEVEL_FOR_GAP, 2, 5)) {
    result.errors.push('TARGET_LEVEL_FOR_GAP must be in [2..5]');
  }

  if (!inRange(config.ALLOC_GAP_WEIGHT, 0, 1)) {
    result.errors.push('ALLOC_GAP_WEIGHT must be in [0..1]');
  }
  if (!inRange(config.ALLOC_BACKLOG_WEIGHT, 0, 1)) {
    result.errors.push('ALLOC_BACKLOG_WEIGHT must be in [0..1]');
  }
  if (!inRange(config.MIN_PART_SHARE, 0, 0.2)) {
    result.errors.push('MIN_PART_SHARE must be in [0..0.20]');
  }
  if (!inRange(config.MAX_PART_SHARE, 0.2, 0.6)) {
    result.errors.push('MAX_PART_SHARE must be in [0.20..0.60]');
  }
  if (!inRange(config.MAX_SHARE_CHANGE_PER_SPRINT, 0, 0.2)) {
    result.errors.push('MAX_SHARE_CHANGE_PER_SPRINT must be in [0..0.20]');
  }

  if (!inRange(config.FINAL_PRACTICE_WEEKS, 0, 8)) {
    result.errors.push('FINAL_PRACTICE_WEEKS must be in [0..8]');
  }
  if (!inRange(config.FINAL_PHASE_LEARNING_MULTIPLIER, 0, 1)) {
    result.errors.push('FINAL_PHASE_LEARNING_MULTIPLIER must be in [0..1]');
  }
  if (!inRange(config.PRACTICE_UNLOCK_PCT, 0, 1)) {
    result.errors.push('PRACTICE_UNLOCK_PCT must be in [0..1]');
  }
  if (!Number.isInteger(config.RETAKE_MIN_GAP_SPRINTS) || config.RETAKE_MIN_GAP_SPRINTS < 0) {
    result.errors.push('RETAKE_MIN_GAP_SPRINTS must be an integer >= 0');
  }
  if (!inRange(config.RETAKE_SHARE_AFTER_UNIQUE_DONE, 0, 1)) {
    result.errors.push('RETAKE_SHARE_AFTER_UNIQUE_DONE must be in [0..1]');
  }
  if (!inRange(config.WRONG_RATE_DEFAULT, 0, 1)) {
    result.errors.push('WRONG_RATE_DEFAULT must be in [0..1]');
  }

  if (!inRange(config.CHECKPOINT_SAMPLE_QUESTIONS_PER_PART, 5, 40)) {
    result.errors.push('CHECKPOINT_SAMPLE_QUESTIONS_PER_PART must be in [5..40]');
  }
  if (!inRange(config.CHECKPOINT_MIN_QUESTIONS_PER_PART, 3, 20)) {
    result.errors.push('CHECKPOINT_MIN_QUESTIONS_PER_PART must be in [3..20]');
  }
  if (!inRange(config.CHECKPOINT_PREFERRED_Q, 10, 50)) {
    result.errors.push('CHECKPOINT_PREFERRED_Q must be in [10..50]');
  }
  if (!Number.isInteger(config.CHECKPOINT_MIX_MAX_SUBMODULES) || !inRange(config.CHECKPOINT_MIX_MAX_SUBMODULES, 1, 5)) {
    result.errors.push('CHECKPOINT_MIX_MAX_SUBMODULES must be an integer in [1..5]');
  }

  if (!inRange(config.MIN_LOW_LEVEL_LEARNING_MIN, 60, 240)) {
    result.errors.push('MIN_LOW_LEVEL_LEARNING_MIN must be in [60..240]');
  }
  if (!inRange(config.MIN_PART_PRACTICE_QUESTIONS_TOTAL, 10, 100)) {
    result.errors.push('MIN_PART_PRACTICE_QUESTIONS_TOTAL must be in [10..100]');
  }
  if (!inRange(config.MAX_UNUSED_PCT, 0, 0.2)) {
    result.errors.push('MAX_UNUSED_PCT must be in [0..0.20]');
  }
  if (!inRange(config.REDISTRIBUTION_QUANTUM_MIN, 5, 60)) {
    result.errors.push('REDISTRIBUTION_QUANTUM_MIN must be in [5..60]');
  }
  if (!inRange(config.MIN_ITEM_TOTAL_MIN, 5, 90)) {
    result.errors.push('MIN_ITEM_TOTAL_MIN must be in [5..90]');
  }
  if (!inRange(config.MIN_LEARNING_BLOCK_MIN, 5, 90)) {
    result.errors.push('MIN_LEARNING_BLOCK_MIN must be in [5..90]');
  }
  if (!inRange(config.MIN_PRACTICE_BLOCK_Q, 1, 30)) {
    result.errors.push('MIN_PRACTICE_BLOCK_Q must be in [1..30]');
  }
  if (!inRange(config.MIN_PART_PRESENCE_MIN, 0, 180)) {
    result.errors.push('MIN_PART_PRESENCE_MIN must be in [0..180]');
  }
  if (typeof config.PREFER_UNSPLIT_MODULES !== 'boolean') {
    result.errors.push('PREFER_UNSPLIT_MODULES must be a boolean');
  }
  if (!inRange(config.UNSPLIT_MODULE_MAX_MIN, 30, 600)) {
    result.errors.push('UNSPLIT_MODULE_MAX_MIN must be in [30..600]');
  }
  if (!inRange(config.HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT, 0, 1)) {
    result.errors.push('HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT must be in [0..1]');
  }
  if (typeof config.HISTORY_ART_ALLOW_INTRO_SCAFFOLDING !== 'boolean') {
    result.errors.push('HISTORY_ART_ALLOW_INTRO_SCAFFOLDING must be a boolean');
  }
  if (!Number.isInteger(config.MAX_MODULE_CHUNKS) || !inRange(config.MAX_MODULE_CHUNKS, 1, 8)) {
    result.errors.push('MAX_MODULE_CHUNKS must be an integer in [1..8]');
  }
  if (!inRange(config.MIN_CHUNK_MIN, 15, 240)) {
    result.errors.push('MIN_CHUNK_MIN must be in [15..240]');
  }

  if (config.MIN_SECTION_SHARE_WITHIN_PART) {
    Object.entries(config.MIN_SECTION_SHARE_WITHIN_PART).forEach(([part, value]) => {
      if (!isFiniteNumber(value) || !inRange(value, 0, 0.5)) {
        result.errors.push(`MIN_SECTION_SHARE_WITHIN_PART['${part}'] must be in [0..0.5]`);
      }
    });
  }

  return result;
}
