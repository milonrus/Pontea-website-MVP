import {
  CanonicalRoadmapOutput,
  CheckpointPartMetrics,
  CheckpointResult,
  ConfigSummary,
  CourseSection,
  ExamPart,
  ExamPartSummaryItem,
  ExercisePriority,
  GeneratedMode,
  NameCategory,
  RoadmapConfig,
  RoadmapGenerationResult,
  RoadmapGeneratorInput,
  RoadmapWarning,
  SprintCheckpointByPart,
  SprintItem,
  SprintPracticeBlock,
  SprintOutput
} from './types';
import {
  allocateByLargestRemainder,
  classifySubmoduleName,
  clamp,
  deepMergeConfig,
  fixedPartOrderIndex,
  getCategoryRank,
  normalizeSharesWithBounds,
  normalizeTitle,
  roundHalfUp,
  roundMinutes,
  stableSortBy
} from './helpers';
import {
  DEFAULT_ROADMAP_CONFIG,
  EXAM_PART_ORDER,
  SECTION_TO_EXAM_PART_DEFAULT
} from './defaults';
import { validateRoadmapInput } from './validators';

interface BaseSubmodule {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionOrder: number;
  examPart: ExamPart;
  sectionLevel: number;
  name: string;
  jsonIndex: number;
  category: NameCategory;
  categoryRank: number;
  learnMinFull: number;
  untimedItemsFull: number;
  questionsFull: number;
  costPerQMin: number;
  totalMinFull: number;
}

interface BaseSection {
  id: string;
  title: string;
  normalizedTitle: string;
  sectionOrder: number;
  examPart: ExamPart;
  level: number;
  subjectMultiplier: number;
  submodules: BaseSubmodule[];
  sectionLearnFull: number;
  sectionPracticeFull: number;
  sectionQuestionsFull: number;
  sectionTotalFull: number;
}

interface SelectionResult {
  selectedLearnBySubmoduleId: Record<string, number>;
  selectedQBySubmoduleId: Record<string, number>;
  minimalInfeasible: boolean;
  notes: string[];
}

interface SubmoduleState {
  id: string;
  name: string;
  category: NameCategory;
  categoryRank: number;
  jsonIndex: number;

  learnMinTotalSelected: number;
  learnMinRemaining: number;
  untimedItemsTotalSelected: number;
  untimedItemsRemaining: number;

  questionsTotalSelected: number;
  questionsRemainingUnique: number;
  questionsRemainingRetake: number;
  questionsInitialSelected: number;

  costPerQMin: number;
  sectionTitle: string;
  sectionOrder: number;
  examPart: ExamPart;
  lastScheduledSprint?: number;
  lastRetakeSprint?: number;
  wrongRateEstimate: number;
}

interface SectionState {
  id: string;
  title: string;
  normalizedTitle: string;
  sectionOrder: number;
  examPart: ExamPart;
  level: number;
  submodules: SubmoduleState[];
  costPerQMin: number;
  sectionTotalFull: number;
  initialSelectedTotalMin: number;
}

interface PartState {
  examPart: ExamPart;
  sections: SectionState[];
  partLevel: number;
  active: boolean;
  requiredFullMin: number;
}

interface PlanningContext {
  config: RoadmapConfig;
  warnings: RoadmapWarning[];
  parts: Record<ExamPart, PartState>;
  sectionsById: Record<string, SectionState>;
  remByPartStart: Record<ExamPart, number>;
  perfEmaByPart: Partial<Record<ExamPart, number>>;
  startedSubmoduleIds: Set<string>;
}

interface SprintSkeleton {
  sprintNumber: number;
  sprintWeeks: number;
  isLastSprint: boolean;
  weekStartIndex: number;
  weekEndIndex: number;
  availableMinutes: number;
  planningMinutes: number;
  bufferMinutes: number;
  isFinalPhase: boolean;
}

interface FeasibilityData {
  availableMinutesTotal: number;
  availableMinutesPlanning: number;
  requiredMinutesFullCoverage: number;
  requiredByPartFull: Record<ExamPart, number>;
  timeInfeasible: boolean;
  capInfeasible: boolean;
  capInfeasibleByPart: Record<ExamPart, boolean>;
  maxMinutesAllowedByCapByPart: Record<ExamPart, number>;
  shortfallDueToCapByPart: Record<ExamPart, number>;
  overallInfeasible: boolean;
  policyFeasible: boolean;
  notes: string[];
}

interface CheckpointMetricLookup {
  [sprintNumber: number]: Partial<Record<ExamPart, Partial<CheckpointPartMetrics>>>;
}

interface ParseCheckpointHistoryResult {
  lookup: CheckpointMetricLookup;
}

interface SprintItemRuntime {
  exam_part: ExamPart;
  section_title: string;
  submodule_name: string;
  submodule_id: string;
  category: NameCategory;
  planned_learning_minutes: number;
  planned_untimed_items: number;
  planned_practice_questions_unique: number;
  planned_practice_questions_retake: number;
  practice_minutes_est: number;
  total_minutes_est: number;
  new_started_this_sprint?: boolean;
  is_partial: boolean;
  remaining_after_sprint: {
    learning_minutes_remaining: number;
    questions_remaining_unique: number;
  };
}

const PART_DISPLAY_ORDER = EXAM_PART_ORDER;

function resolveExamPart(sectionTitle: string, config: RoadmapConfig): ExamPart | null {
  const normalized = normalizeTitle(sectionTitle);

  const overrideEntry = Object.entries(config.SECTION_TO_EXAM_PART_OVERRIDE).find(
    ([key]) => normalizeTitle(key) === normalized
  );
  if (overrideEntry) {
    return overrideEntry[1];
  }

  return SECTION_TO_EXAM_PART_DEFAULT[normalized] ?? null;
}

function getSubjectMultiplier(sectionTitle: string, config: RoadmapConfig): number {
  const normalized = normalizeTitle(sectionTitle);
  const entry = Object.entries(config.SUBJECT_MULTIPLIER_BY_SECTION_TITLE).find(
    ([key]) => normalizeTitle(key) === normalized
  );
  return entry ? entry[1] : 1;
}

function getLevelForSection(
  sectionTitle: string,
  levelsBySectionNormalized: Record<string, number>,
  config: RoadmapConfig,
  warnings: RoadmapWarning[]
): number {
  const normalized = normalizeTitle(sectionTitle);
  const value = levelsBySectionNormalized[normalized];

  if (value === undefined) {
    warnings.push({
      type: 'missing_level_for_section',
      section_title: sectionTitle,
      used_level: config.DEFAULT_LEVEL_IF_MISSING
    });
    return config.DEFAULT_LEVEL_IF_MISSING;
  }

  return value;
}

function normalizeLevels(
  inputLevels: Record<string, number>,
  knownSections: string[],
  config: RoadmapConfig,
  warnings: RoadmapWarning[]
): Record<string, number> {
  const normalized: Record<string, number> = {};
  const known = new Set(knownSections.map((title) => normalizeTitle(title)));

  Object.entries(inputLevels || {}).forEach(([title, level]) => {
    const key = normalizeTitle(title);
    normalized[key] = level;

    if (!known.has(key) && config.IGNORE_UNKNOWN_LEVEL_KEYS) {
      warnings.push({
        type: 'unknown_level_key_ignored',
        section_title: title
      });
    }
  });

  return normalized;
}

function computeGap(level: number, targetLevel: number): number {
  const denominator = Math.max(1, targetLevel - 1);
  return clamp((targetLevel - level) / denominator, 0, 1);
}

function isWeakPartLevel(level: number): boolean {
  return level <= 2;
}

function isStrongPartLevel(level: number): boolean {
  return level >= 4;
}

function isHighLevelV4(config: RoadmapConfig): boolean {
  return config.ROADMAP_STRATEGY_MODE === 'high_level_v4';
}

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

function formatQuestionsRange(totalQuestions: number): string | undefined {
  if (totalQuestions <= 0) return undefined;
  const width = totalQuestions < 12 ? 2 : totalQuestions < 30 ? 4 : Math.max(5, Math.round(totalQuestions * 0.15));
  const low = Math.max(0, totalQuestions - width);
  const high = totalQuestions + width;
  return `${low}-${high}`;
}

function deriveExercisePriority(item: {
  planned_learning_minutes: number;
  planned_practice_questions_unique: number;
  planned_practice_questions_retake: number;
}): ExercisePriority {
  const qTotal = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
  if (item.planned_learning_minutes >= 60 || item.planned_practice_questions_unique >= 40 || qTotal >= 80) {
    return 'high';
  }
  if (item.planned_learning_minutes > 0 || qTotal >= 20) {
    return 'medium';
  }
  return 'low';
}

function buildBaseSections(
  sections: CourseSection[],
  levelsBySection: Record<string, number>,
  config: RoadmapConfig,
  warnings: RoadmapWarning[]
): BaseSection[] {
  const baseSections: BaseSection[] = [];

  sections.forEach((section, sectionIndex) => {
    const examPart = resolveExamPart(section.title, config);
    if (!examPart) {
      warnings.push({
        type: 'unmapped_section_excluded',
        section_title: section.title
      });
      return;
    }

    const level = getLevelForSection(section.title, levelsBySection, config, warnings);
    const subjectMultiplier = getSubjectMultiplier(section.title, config);
    const levelMultiplier = config.LEVEL_TIME_MULTIPLIER[String(level) as '1' | '2' | '3' | '4' | '5'];
    const costPerQMin =
      config.BASE_MIN_PER_QUESTION *
      subjectMultiplier *
      levelMultiplier *
      (1 + config.PRACTICE_REVIEW_OVERHEAD_PCT);

    const submodules = section.submodules.map((submodule, submoduleIndex) => {
      const untimedItems = submodule.stats.untimed_text_items || 0;
      const learnMin =
        (submodule.stats.lessons_video_minutes || 0) +
        (submodule.stats.timed_text_minutes || 0) +
        untimedItems * config.UNTIMED_TEXT_MIN_PER_ITEM;
      const questionsTotal = submodule.stats.questions_total || 0;
      const practiceMin = questionsTotal * costPerQMin;
      const totalMin = learnMin + practiceMin;
      const category = classifySubmoduleName(submodule.name, config.NAME_CATEGORY_PATTERNS);

      return {
        id: `${sectionIndex}:${submoduleIndex}`,
        sectionId: `${sectionIndex}`,
        sectionTitle: section.title,
        sectionOrder: sectionIndex,
        examPart,
        sectionLevel: level,
        name: submodule.name,
        jsonIndex: submoduleIndex,
        category,
        categoryRank: getCategoryRank(category),
        learnMinFull: learnMin,
        untimedItemsFull: untimedItems,
        questionsFull: questionsTotal,
        costPerQMin,
        totalMinFull: totalMin
      } as BaseSubmodule;
    });

    const orderedSubmodules = stableSortBy(submodules, (a, b) => a.jsonIndex - b.jsonIndex);

    const sectionLearn = orderedSubmodules.reduce((acc, submodule) => acc + submodule.learnMinFull, 0);
    const sectionPractice = orderedSubmodules.reduce(
      (acc, submodule) => acc + submodule.questionsFull * submodule.costPerQMin,
      0
    );
    const sectionQuestions = orderedSubmodules.reduce((acc, submodule) => acc + submodule.questionsFull, 0);
    const sectionTotal = sectionLearn + sectionPractice;

    if (sectionTotal === 0 && sectionQuestions === 0) {
      warnings.push({
        type: 'empty_section',
        section_title: section.title
      });
    }

    baseSections.push({
      id: `${sectionIndex}`,
      title: section.title,
      normalizedTitle: normalizeTitle(section.title),
      sectionOrder: sectionIndex,
      examPart,
      level,
      subjectMultiplier,
      submodules: orderedSubmodules,
      sectionLearnFull: sectionLearn,
      sectionPracticeFull: sectionPractice,
      sectionQuestionsFull: sectionQuestions,
      sectionTotalFull: sectionTotal
    });
  });

  return baseSections;
}

function getInitialSelection(baseSections: BaseSection[]): SelectionResult {
  const selectedLearnBySubmoduleId: Record<string, number> = {};
  const selectedQBySubmoduleId: Record<string, number> = {};

  baseSections.forEach((section) => {
    section.submodules.forEach((submodule) => {
      selectedLearnBySubmoduleId[submodule.id] = submodule.learnMinFull;
      selectedQBySubmoduleId[submodule.id] = submodule.questionsFull;
    });
  });

  return {
    selectedLearnBySubmoduleId,
    selectedQBySubmoduleId,
    minimalInfeasible: false,
    notes: []
  };
}

function calculateSelectedMinutes(
  baseSections: BaseSection[],
  selectedLearnBySubmoduleId: Record<string, number>,
  selectedQBySubmoduleId: Record<string, number>
): number {
  let total = 0;
  baseSections.forEach((section) => {
    section.submodules.forEach((submodule) => {
      total += selectedLearnBySubmoduleId[submodule.id] || 0;
      total += (selectedQBySubmoduleId[submodule.id] || 0) * submodule.costPerQMin;
    });
  });
  return total;
}

function selectMinimalBacklog(
  baseSections: BaseSection[],
  config: RoadmapConfig,
  availablePlanningMinutes: number
): SelectionResult {
  const selectedLearnBySubmoduleId: Record<string, number> = {};
  const selectedQBySubmoduleId: Record<string, number> = {};

  baseSections.forEach((section) => {
    section.submodules.forEach((submodule) => {
      selectedLearnBySubmoduleId[submodule.id] = 0;
      selectedQBySubmoduleId[submodule.id] = 0;
    });
  });

  const addLearn = (submoduleId: string, minutes: number) => {
    selectedLearnBySubmoduleId[submoduleId] =
      (selectedLearnBySubmoduleId[submoduleId] || 0) + Math.max(0, minutes);
  };
  const addQ = (submoduleId: string, q: number) => {
    selectedQBySubmoduleId[submoduleId] =
      (selectedQBySubmoduleId[submoduleId] || 0) + Math.max(0, Math.floor(q));
  };

  // Mandatory: low-level sections must include minimum learning in strict JSON order.
  baseSections.forEach((section) => {
    if (section.level > config.LOW_LEVEL_THRESHOLD) return;

    let needed = config.MIN_LOW_LEVEL_LEARNING_MIN;
    section.submodules.forEach((submodule) => {
      if (needed <= 0) return;
      const already = selectedLearnBySubmoduleId[submodule.id] || 0;
      const available = Math.max(0, submodule.learnMinFull - already);
      const add = Math.min(available, needed);
      if (add > 0) {
        addLearn(submodule.id, add);
        needed -= add;
      }
    });
  });

  // Mandatory: ensure minimum unique practice per part in strict JSON order.
  EXAM_PART_ORDER.forEach((part) => {
    const inPart = baseSections.filter((section) => section.examPart === part);
    if (inPart.length === 0) return;

    const current = inPart
      .flatMap((section) => section.submodules)
      .reduce((acc, submodule) => acc + (selectedQBySubmoduleId[submodule.id] || 0), 0);

    let needed = Math.max(0, config.MIN_PART_PRACTICE_QUESTIONS_TOTAL - current);
    if (needed <= 0) return;

    const candidates = stableSortBy(
      inPart.flatMap((section) => section.submodules),
      (a, b) => {
        if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
        return a.jsonIndex - b.jsonIndex;
      }
    );

    candidates.forEach((candidate) => {
      if (needed <= 0) return;
      const already = selectedQBySubmoduleId[candidate.id] || 0;
      const available = Math.max(0, candidate.questionsFull - already);
      const add = Math.min(available, needed);
      if (add > 0) {
        addQ(candidate.id, add);
        needed -= add;
      }
    });
  });

  let selectedMinutes = calculateSelectedMinutes(
    baseSections,
    selectedLearnBySubmoduleId,
    selectedQBySubmoduleId
  );

  const notes: string[] = [];
  let minimalInfeasible = false;

  if (selectedMinutes > availablePlanningMinutes) {
    minimalInfeasible = true;
    notes.push('Mandatory minimal set exceeds available planning capacity.');
  }

  if (!minimalInfeasible) {
    const roiCandidates = stableSortBy(
      baseSections.flatMap((section) => section.submodules),
      (a, b) => {
        const sectionA = baseSections.find((section) => section.id === a.sectionId)!;
        const sectionB = baseSections.find((section) => section.id === b.sectionId)!;

        const densityA = a.questionsFull / Math.max(a.totalMinFull, 1);
        const densityB = b.questionsFull / Math.max(b.totalMinFull, 1);
        const gapA = computeGap(sectionA.level, config.TARGET_LEVEL_FOR_GAP);
        const gapB = computeGap(sectionB.level, config.TARGET_LEVEL_FOR_GAP);

        const roiA = 0.6 * densityA + 0.4 * gapA;
        const roiB = 0.6 * densityB + 0.4 * gapB;

        if (roiB !== roiA) return roiB - roiA;
        if (gapB !== gapA) return gapB - gapA;
        if (b.questionsFull !== a.questionsFull) return b.questionsFull - a.questionsFull;
        if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
        return a.jsonIndex - b.jsonIndex;
      }
    );

    roiCandidates.forEach((candidate) => {
      const remainingCapacity = availablePlanningMinutes - selectedMinutes;
      if (remainingCapacity <= 0) return;

      const selectedLearn = selectedLearnBySubmoduleId[candidate.id] || 0;
      const selectedQ = selectedQBySubmoduleId[candidate.id] || 0;

      const addLearnFull = Math.max(0, candidate.learnMinFull - selectedLearn);
      const addQFull = Math.max(0, candidate.questionsFull - selectedQ);
      if (addLearnFull <= 0 && addQFull <= 0) return;

      const fullMinutes = addLearnFull + addQFull * candidate.costPerQMin;

      if (selectedMinutes + fullMinutes <= availablePlanningMinutes) {
        addLearn(candidate.id, addLearnFull);
        addQ(candidate.id, addQFull);
        selectedMinutes += fullMinutes;
        return;
      }

      if (addQFull > 0) {
        const partialQ = Math.min(addQFull, Math.floor(remainingCapacity / candidate.costPerQMin));
        if (partialQ > 0) {
          addQ(candidate.id, partialQ);
          selectedMinutes += partialQ * candidate.costPerQMin;
        }
      }
    });
  }

  return {
    selectedLearnBySubmoduleId,
    selectedQBySubmoduleId,
    minimalInfeasible,
    notes
  };
}

function buildPartsFromSelection(
  baseSections: BaseSection[],
  selection: SelectionResult,
  config: RoadmapConfig,
  requiredByPartFull: Record<ExamPart, number>
): PlanningContext {
  const warnings: RoadmapWarning[] = [];

  const sections = baseSections.map((baseSection) => {
    const submodules: SubmoduleState[] = baseSection.submodules.map((baseSubmodule) => {
      const selectedLearn = selection.selectedLearnBySubmoduleId[baseSubmodule.id] || 0;
      const selectedQ = selection.selectedQBySubmoduleId[baseSubmodule.id] || 0;
      const selectedUntimed =
        baseSubmodule.learnMinFull > 0
          ? Math.min(
              baseSubmodule.untimedItemsFull,
              Math.max(
                0,
                roundHalfUp(
                  (selectedLearn / Math.max(baseSubmodule.learnMinFull, 0.000001)) *
                    baseSubmodule.untimedItemsFull
                )
              )
            )
          : 0;

      return {
        id: baseSubmodule.id,
        name: baseSubmodule.name,
        category: baseSubmodule.category,
        categoryRank: baseSubmodule.categoryRank,
        jsonIndex: baseSubmodule.jsonIndex,

        learnMinTotalSelected: selectedLearn,
        learnMinRemaining: selectedLearn,
        untimedItemsTotalSelected: selectedUntimed,
        untimedItemsRemaining: selectedUntimed,

        questionsTotalSelected: selectedQ,
        questionsRemainingUnique: selectedQ,
        questionsRemainingRetake: 0,
        questionsInitialSelected: selectedQ,

        costPerQMin: baseSubmodule.costPerQMin,
        sectionTitle: baseSection.title,
        sectionOrder: baseSection.sectionOrder,
        examPart: baseSection.examPart,
        wrongRateEstimate: config.WRONG_RATE_DEFAULT
      };
    });

    const initialSelectedTotalMin = submodules.reduce(
      (acc, submodule) =>
        acc +
        submodule.learnMinTotalSelected +
        submodule.questionsTotalSelected * submodule.costPerQMin,
      0
    );

    return {
      id: baseSection.id,
      title: baseSection.title,
      normalizedTitle: baseSection.normalizedTitle,
      sectionOrder: baseSection.sectionOrder,
      examPart: baseSection.examPart,
      level: baseSection.level,
      submodules,
      costPerQMin: baseSection.submodules[0]?.costPerQMin ?? 0,
      sectionTotalFull: baseSection.sectionTotalFull,
      initialSelectedTotalMin
    } as SectionState;
  });

  const sectionsById: Record<string, SectionState> = {};
  sections.forEach((section) => {
    sectionsById[section.id] = section;
  });

  const parts: Record<ExamPart, PartState> = {
    READING: {
      examPart: 'READING',
      sections: [],
      partLevel: 5,
      active: false,
      requiredFullMin: requiredByPartFull.READING
    },
    LOGIC: {
      examPart: 'LOGIC',
      sections: [],
      partLevel: 5,
      active: false,
      requiredFullMin: requiredByPartFull.LOGIC
    },
    DRAWING: {
      examPart: 'DRAWING',
      sections: [],
      partLevel: 5,
      active: false,
      requiredFullMin: requiredByPartFull.DRAWING
    },
    MATH_PHYSICS: {
      examPart: 'MATH_PHYSICS',
      sections: [],
      partLevel: 5,
      active: false,
      requiredFullMin: requiredByPartFull.MATH_PHYSICS
    },
    GENERAL_KNOWLEDGE: {
      examPart: 'GENERAL_KNOWLEDGE',
      sections: [],
      partLevel: 5,
      active: false,
      requiredFullMin: requiredByPartFull.GENERAL_KNOWLEDGE
    }
  };

  sections.forEach((section) => {
    parts[section.examPart].sections.push(section);
  });

  PART_DISPLAY_ORDER.forEach((part) => {
    const state = parts[part];
    if (state.sections.length === 0) {
      state.partLevel = 5;
      state.active = false;
      return;
    }

    state.active = state.sections.some((section) => section.initialSelectedTotalMin > 0);

    if (config.PART_LEVEL_COMBINE_METHOD === 'equal_weighted') {
      const average =
        state.sections.reduce((acc, section) => acc + section.level, 0) /
        state.sections.length;
      state.partLevel = roundHalfUp(average);
      return;
    }

    const weightedNumerator = state.sections.reduce(
      (acc, section) => acc + section.level * section.sectionTotalFull,
      0
    );
    const weightedDenominator = state.sections.reduce(
      (acc, section) => acc + section.sectionTotalFull,
      0
    );

    if (weightedDenominator <= 0) {
      const average =
        state.sections.reduce((acc, section) => acc + section.level, 0) /
        state.sections.length;
      state.partLevel = roundHalfUp(average);
    } else {
      state.partLevel = roundHalfUp(weightedNumerator / weightedDenominator);
    }
  });

  const remByPartStart = getRemainingByPart(parts);

  return {
    config,
    warnings,
    parts,
    sectionsById,
    remByPartStart,
    perfEmaByPart: {},
    startedSubmoduleIds: new Set<string>()
  };
}

function getRemainingSectionMinutes(section: SectionState): number {
  return section.submodules.reduce(
    (acc, submodule) =>
      acc +
      submodule.learnMinRemaining +
      submodule.questionsRemainingUnique * submodule.costPerQMin +
      submodule.questionsRemainingRetake * submodule.costPerQMin,
    0
  );
}

function getRemainingSectionCoreMinutes(section: SectionState): number {
  return section.submodules.reduce(
    (acc, submodule) =>
      acc + submodule.learnMinRemaining + submodule.questionsRemainingUnique * submodule.costPerQMin,
    0
  );
}

function getRemainingByPart(parts: Record<ExamPart, PartState>): Record<ExamPart, number> {
  const remaining: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    remaining[part] = parts[part].sections.reduce(
      (acc, section) => acc + getRemainingSectionMinutes(section),
      0
    );
  });

  return remaining;
}

function getRemainingCoreByPart(parts: Record<ExamPart, PartState>): Record<ExamPart, number> {
  const remaining: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    remaining[part] = parts[part].sections.reduce(
      (acc, section) => acc + getRemainingSectionCoreMinutes(section),
      0
    );
  });

  return remaining;
}

function buildSprintSkeletons(
  weeksToExam: number,
  hoursPerWeek: number,
  config: RoadmapConfig
): SprintSkeleton[] {
  const fullSprints = Math.floor(weeksToExam / 2);
  const hasLastShort = weeksToExam % 2 === 1;
  const totalSprints = fullSprints + (hasLastShort ? 1 : 0);

  const finalPhaseSprints = config.FINAL_PRACTICE_WEEKS <= 0
    ? 0
    : Math.ceil(config.FINAL_PRACTICE_WEEKS / 2);

  const skeletons: SprintSkeleton[] = [];

  let weekCursor = 1;
  for (let sprintNumber = 1; sprintNumber <= totalSprints; sprintNumber += 1) {
    const sprintWeeks = sprintNumber <= fullSprints ? 2 : 1;
    const availableMinutes = sprintWeeks * hoursPerWeek * 60;
    const planningMinutes = Math.floor(availableMinutes * (1 - config.SPRINT_BUFFER_PCT));
    const bufferMinutes = availableMinutes - planningMinutes;

    const sprintFromEnd = totalSprints - sprintNumber + 1;
    const isFinalPhase = finalPhaseSprints > 0 && sprintFromEnd <= finalPhaseSprints;

    skeletons.push({
      sprintNumber,
      sprintWeeks,
      isLastSprint: sprintNumber === totalSprints,
      weekStartIndex: weekCursor,
      weekEndIndex: weekCursor + sprintWeeks - 1,
      availableMinutes,
      planningMinutes,
      bufferMinutes,
      isFinalPhase
    });

    weekCursor += sprintWeeks;
  }

  return skeletons;
}

function computeFeasibility(
  weeksToExam: number,
  hoursPerWeek: number,
  config: RoadmapConfig,
  requiredByPartFull: Record<ExamPart, number>,
  requiredMinutesFullCoverage: number,
  sprintSkeletons: SprintSkeleton[]
): FeasibilityData {
  const availableMinutesTotal = weeksToExam * hoursPerWeek * 60;
  const availableMinutesPlanning = sprintSkeletons.reduce((acc, sprint) => acc + sprint.planningMinutes, 0);
  const strictCapScope = config.ENFORCE_FILL_TO_PLAN_IN_V3;

  const timeInfeasible = requiredMinutesFullCoverage > availableMinutesPlanning;

  const capInfeasibleByPart: Record<ExamPart, boolean> = {
    READING: false,
    LOGIC: false,
    DRAWING: false,
    MATH_PHYSICS: false,
    GENERAL_KNOWLEDGE: false
  };
  const maxMinutesAllowedByCapByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };
  const shortfallDueToCapByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    const maxByCap = config.MAX_PART_SHARE * availableMinutesPlanning;
    maxMinutesAllowedByCapByPart[part] = maxByCap;
    capInfeasibleByPart[part] = strictCapScope ? requiredByPartFull[part] > maxByCap : false;
    shortfallDueToCapByPart[part] = strictCapScope
      ? Math.max(0, requiredByPartFull[part] - maxByCap)
      : 0;
  });

  const capInfeasible = PART_DISPLAY_ORDER.some((part) => capInfeasibleByPart[part]);

  // Backward-compatible overall flag is mapped to time infeasibility only.
  const overallInfeasible = timeInfeasible;
  const policyFeasible = true;

  const notes: string[] = [];
  if (timeInfeasible) {
    notes.push('Overall available planning time is below full coverage requirement.');
  }
  if (capInfeasible) {
    notes.push('Part-level share caps prevent full coverage for at least one exam part.');
  }
  if (!strictCapScope) {
    notes.push('High-level mode: MAX_PART_SHARE is soft during core redistribution.');
  }
  if (!timeInfeasible && !capInfeasible) {
    notes.push('Full coverage is feasible under current constraints.');
  }
  return {
    availableMinutesTotal,
    availableMinutesPlanning,
    requiredMinutesFullCoverage,
    requiredByPartFull,
    timeInfeasible,
    capInfeasible,
    capInfeasibleByPart,
    maxMinutesAllowedByCapByPart,
    shortfallDueToCapByPart,
    overallInfeasible,
    policyFeasible,
    notes
  };
}

function parseCheckpointHistory(checkpointHistory?: CheckpointResult[]): ParseCheckpointHistoryResult {
  const lookup: CheckpointMetricLookup = {};

  (checkpointHistory || []).forEach((entry: any) => {
    const sprintNumber = Number(entry.sprint_number);
    if (!Number.isFinite(sprintNumber)) return;

    if (!lookup[sprintNumber]) {
      lookup[sprintNumber] = {};
    }

    if (entry.results_by_part && typeof entry.results_by_part === 'object') {
      Object.entries(entry.results_by_part).forEach(([part, metrics]) => {
        if (PART_DISPLAY_ORDER.includes(part as ExamPart)) {
          lookup[sprintNumber][part as ExamPart] = metrics as Partial<CheckpointPartMetrics>;
        }
      });
      return;
    }

    // Backward-compatible flat shape: { sprint_number, exam_part, accuracy, ... }
    if (entry.exam_part && PART_DISPLAY_ORDER.includes(entry.exam_part as ExamPart)) {
      lookup[sprintNumber][entry.exam_part as ExamPart] = {
        accuracy: entry.accuracy,
        avg_time_per_question_min: entry.avg_time_per_question_min ?? null,
        completion_rate: entry.completion_rate,
        confidence: entry.confidence,
        checkpoint_questions: entry.checkpoint_questions
      };
    }
  });

  return { lookup };
}

function computePartPriorityScores(
  parts: Record<ExamPart, PartState>,
  remByPart: Record<ExamPart, number>,
  config: RoadmapConfig
): {
  priority: Record<ExamPart, number>;
  backlogShare: Record<ExamPart, number>;
  gapByPart: Record<ExamPart, number>;
} {
  const totalRem = PART_DISPLAY_ORDER.reduce((acc, part) => acc + remByPart[part], 0);
  const maxRem = PART_DISPLAY_ORDER.reduce((acc, part) => Math.max(acc, remByPart[part]), 0);

  const backlogShare: Record<ExamPart, number> = {
    READING: totalRem > 0 ? remByPart.READING / totalRem : 0,
    LOGIC: totalRem > 0 ? remByPart.LOGIC / totalRem : 0,
    DRAWING: totalRem > 0 ? remByPart.DRAWING / totalRem : 0,
    MATH_PHYSICS: totalRem > 0 ? remByPart.MATH_PHYSICS / totalRem : 0,
    GENERAL_KNOWLEDGE: totalRem > 0 ? remByPart.GENERAL_KNOWLEDGE / totalRem : 0
  };

  const gapByPart: Record<ExamPart, number> = {
    READING: computeGap(parts.READING.partLevel, config.TARGET_LEVEL_FOR_GAP),
    LOGIC: computeGap(parts.LOGIC.partLevel, config.TARGET_LEVEL_FOR_GAP),
    DRAWING: computeGap(parts.DRAWING.partLevel, config.TARGET_LEVEL_FOR_GAP),
    MATH_PHYSICS: computeGap(parts.MATH_PHYSICS.partLevel, config.TARGET_LEVEL_FOR_GAP),
    GENERAL_KNOWLEDGE: computeGap(parts.GENERAL_KNOWLEDGE.partLevel, config.TARGET_LEVEL_FOR_GAP)
  };

  const priority: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  if (isHighLevelV4(config)) {
    const weakBacklogExists = PART_DISPLAY_ORDER.some(
      (part) => remByPart[part] > 1e-9 && isWeakPartLevel(parts[part].partLevel)
    );

    PART_DISPLAY_ORDER.forEach((part) => {
      if (remByPart[part] <= 1e-9) {
        priority[part] = 0;
        return;
      }
      const gapNorm = gapByPart[part];
      const backlogNorm = maxRem > 0 ? remByPart[part] / maxRem : 0;
      let score = 0.65 * gapNorm + 0.35 * backlogNorm;

      if (weakBacklogExists && isStrongPartLevel(parts[part].partLevel)) {
        score *= 0.15;
      }

      priority[part] = score;
    });
  } else {
    PART_DISPLAY_ORDER.forEach((part) => {
      priority[part] = gapByPart[part] + backlogShare[part];
    });
  }

  return { priority, backlogShare, gapByPart };
}

function computePartShares(
  context: PlanningContext,
  remByPart: Record<ExamPart, number>,
  checkpointLookup: CheckpointMetricLookup,
  sprintNumber: number,
  isFinalPhase: boolean
): {
  shares: Record<ExamPart, number>;
  priority: Record<ExamPart, number>;
  gapByPart: Record<ExamPart, number>;
} {
  const { config, parts } = context;
  const { priority, backlogShare, gapByPart } = computePartPriorityScores(parts, remByPart, config);

  const mappedParts = PART_DISPLAY_ORDER.filter((part) => parts[part].sections.length > 0);

  if (isHighLevelV4(config)) {
    const activeCoreParts = mappedParts.filter((part) => remByPart[part] > 1e-9);
    const activeParts = activeCoreParts.length > 0 ? activeCoreParts : mappedParts;

    const shareRaw: Record<ExamPart, number> = {
      READING: 0,
      LOGIC: 0,
      DRAWING: 0,
      MATH_PHYSICS: 0,
      GENERAL_KNOWLEDGE: 0
    };

    activeParts.forEach((part) => {
      shareRaw[part] = Math.max(priority[part], 0.0001);
    });

    const shares = normalizeSharesWithBounds(
      shareRaw,
      activeParts,
      0,
      1,
      PART_DISPLAY_ORDER
    );

    return { shares, priority, gapByPart };
  }

  let activeParts = mappedParts;
  if (!config.ENFORCE_FILL_TO_PLAN_IN_V3 && !isFinalPhase) {
    const withBacklog = mappedParts.filter((part) => remByPart[part] > 1e-9);
    if (withBacklog.length > 0) {
      activeParts = withBacklog;
    }
  }

  if (!config.ENFORCE_FILL_TO_PLAN_IN_V3 && !isFinalPhase) {
    const weakBacklogParts = activeParts.filter(
      (part) => remByPart[part] > 1e-9 && isWeakPartLevel(parts[part].partLevel)
    );

    const shareRawHighLevel: Record<ExamPart, number> = {
      READING: 0,
      LOGIC: 0,
      DRAWING: 0,
      MATH_PHYSICS: 0,
      GENERAL_KNOWLEDGE: 0
    };

    PART_DISPLAY_ORDER.forEach((part) => {
      if (!activeParts.includes(part)) {
        shareRawHighLevel[part] = 0;
        return;
      }

      const backlog = Math.max(0, remByPart[part]);
      const gap = gapByPart[part];
      let score = backlog * (1 + 2.5 * gap);

      if (
        weakBacklogParts.length > 0 &&
        !weakBacklogParts.includes(part) &&
        isStrongPartLevel(parts[part].partLevel)
      ) {
        score *= 0.35;
      }

      shareRawHighLevel[part] = score;
    });

    const highLevelShares = normalizeSharesWithBounds(
      shareRawHighLevel,
      activeParts,
      0,
      1,
      PART_DISPLAY_ORDER
    );

    return { shares: highLevelShares, priority, gapByPart };
  }

  const meanGap =
    activeParts.length > 0
      ? activeParts.reduce((acc, part) => acc + gapByPart[part], 0) / activeParts.length
      : 0;

  const shareRaw: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    if (!activeParts.includes(part)) {
      shareRaw[part] = 0;
      return;
    }

    shareRaw[part] =
      config.BASELINE_PART_SHARE +
      config.ALLOC_GAP_WEIGHT * (gapByPart[part] - meanGap) +
      config.ALLOC_BACKLOG_WEIGHT * (backlogShare[part] - config.BASELINE_PART_SHARE);
  });

  const enableCheckpointAdaptation = false;
  if (enableCheckpointAdaptation && sprintNumber > 1) {
    const previous = checkpointLookup[sprintNumber - 1] || {};

    PART_DISPLAY_ORDER.forEach((part) => {
      const metrics = previous[part];
      if (!metrics || metrics.accuracy === undefined || metrics.accuracy === null) return;
      if (
        config.ADAPT_ONLY_ON_OK_CONFIDENCE &&
        (metrics.confidence === 'low_sample' ||
          ((metrics.checkpoint_questions ?? Infinity) < config.CHECKPOINT_MIN_QUESTIONS_PER_PART))
      ) {
        return;
      }

      const accuracy = clamp(metrics.accuracy, 0, 1);
      const avgTime = metrics.avg_time_per_question_min;

      const accScore = clamp(accuracy / config.TARGET_ACCURACY, 0, 1.25);

      let perf = 0;
      if (avgTime === null || avgTime === undefined || avgTime <= 0) {
        perf = accScore;
      } else {
        const timeScore = clamp(config.TARGET_TIME_PER_Q_BY_PART[part] / avgTime, 0, 1.25);
        perf = config.ADAPT_W_ACCURACY * accScore + config.ADAPT_W_TIME * timeScore;
      }

      const previousEma = context.perfEmaByPart[part];
      const ema =
        previousEma === undefined
          ? perf
          : config.PERFORMANCE_EMA_ALPHA * perf +
            (1 - config.PERFORMANCE_EMA_ALPHA) * previousEma;

      context.perfEmaByPart[part] = ema;

      let delta = 0;
      if (ema < 1.0) {
        delta = config.ADAPT_STEP * (1 - ema);
      } else if (ema > 1.1) {
        delta = -config.ADAPT_STEP * (ema - 1.1);
      }

      delta = clamp(
        delta,
        -config.MAX_SHARE_CHANGE_PER_SPRINT,
        config.MAX_SHARE_CHANGE_PER_SPRINT
      );

      shareRaw[part] += delta;
    });
  }

  const shares = normalizeSharesWithBounds(
    shareRaw,
    activeParts,
    config.MIN_PART_SHARE,
    config.MAX_PART_SHARE,
    PART_DISPLAY_ORDER
  );

  return { shares, priority, gapByPart };
}

function isHistoryArtCoreLocked(
  part: PartState,
  section: SectionState,
  submodule: SubmoduleState | null,
  config: RoadmapConfig
): boolean {
  if (part.examPart !== 'GENERAL_KNOWLEDGE') return false;
  if (section.normalizedTitle !== 'history of art & architecture') return false;
  if (!submodule) return false;

  const historySection = part.sections.find(
    (candidate) => candidate.normalizedTitle === 'history'
  );
  if (!historySection) return false;

  const historyTotal = Math.max(
    historySection.initialSelectedTotalMin,
    historySection.sectionTotalFull
  );
  const historyRemainingCore = getRemainingSectionCoreMinutes(historySection);
  const historyProgress = historyTotal > 0 ? 1 - historyRemainingCore / historyTotal : 1;
  if (
    historyRemainingCore > 0 &&
    historyProgress + 1e-9 < config.HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT
  ) {
    if (!config.HISTORY_ART_ALLOW_INTRO_SCAFFOLDING) {
      return true;
    }
    const introScaffolding = submodule.category === 'INTRO';
    return !introScaffolding;
  }

  return false;
}

function isTemporarilyLockedSection(
  part: PartState,
  section: SectionState,
  config: RoadmapConfig
): boolean {
  const current = getCurrentSubmoduleInJsonOrder(section);
  return isHistoryArtCoreLocked(part, section, current, config);
}

function getRemainingCoreMinutesForSubmodule(submodule: SubmoduleState): number {
  return (
    submodule.learnMinRemaining +
    submodule.questionsRemainingUnique * submodule.costPerQMin
  );
}

function shouldDeferSmallModuleSplit(
  submodule: SubmoduleState,
  sectionBudgetRemaining: number,
  config: RoadmapConfig,
  allowCompletionSplit: boolean
): boolean {
  if (allowCompletionSplit) return false;
  if (!config.PREFER_UNSPLIT_MODULES) return false;
  if (sectionBudgetRemaining <= 0) return false;

  const remainingCoreMin = getRemainingCoreMinutesForSubmodule(submodule);
  if (remainingCoreMin <= 0) return false;
  if (remainingCoreMin > config.UNSPLIT_MODULE_MAX_MIN) return false;
  if (sectionBudgetRemaining + 1e-9 < remainingCoreMin) return true;
  const minimumMeaningfulBudget = Math.max(
    config.MIN_ITEM_TOTAL_MIN,
    config.MIN_LEARNING_BLOCK_MIN,
    config.MIN_CHUNK_MIN
  );
  return sectionBudgetRemaining + 1e-9 < minimumMeaningfulBudget;
}

function allocateMinutesAcrossSections(
  part: PartState,
  partBudget: number,
  config: RoadmapConfig
): Record<string, number> {
  if (part.sections.length === 0 || partBudget <= 0) {
    return {};
  }

  if (part.sections.length === 1) {
    return { [part.sections[0].id]: partBudget };
  }

  const remBySection = part.sections.map((section) => ({
    section,
    rem: getRemainingSectionMinutes(section)
  }));

  const historySection =
    part.examPart === 'GENERAL_KNOWLEDGE'
      ? part.sections.find((section) => section.normalizedTitle === 'history')
      : undefined;
  const historyIncompleteInsideGK = Boolean(
    historySection && getRemainingSectionCoreMinutes(historySection) > 0
  );

  const lockedSectionIds = new Set<string>();
  part.sections.forEach((section) => {
    if (isTemporarilyLockedSection(part, section, config)) {
      lockedSectionIds.add(section.id);
    }
  });

  const remSum = remBySection.reduce((acc, entry) => {
    return acc + (lockedSectionIds.has(entry.section.id) ? 0 : entry.rem);
  }, 0);

  const exactShare: Record<string, number> = {};
  const tieScore: Record<string, number> = {};
  const activeSectionIds = remBySection
    .filter((entry) => entry.rem > 0 && !lockedSectionIds.has(entry.section.id))
    .map((entry) => entry.section.id);

  remBySection.forEach(({ section, rem }) => {
    if (lockedSectionIds.has(section.id)) {
      tieScore[section.id] = 0;
      exactShare[section.id] = 0;
      return;
    }
    const gap = computeGap(section.level, config.TARGET_LEVEL_FOR_GAP);
    const remShare = remSum > 0 ? rem / remSum : 0;
    let need = 0.5 * gap + 0.5 * remShare;

    if (historyIncompleteInsideGK && part.examPart === 'GENERAL_KNOWLEDGE') {
      if (section.normalizedTitle === 'history') {
        need *= 3.0;
      } else if (section.normalizedTitle === 'general culture') {
        need *= 1.2;
      } else if (section.normalizedTitle === 'history of art & architecture') {
        const current = getCurrentSubmoduleInJsonOrder(section);
        const introScaffolding =
          config.HISTORY_ART_ALLOW_INTRO_SCAFFOLDING && current?.category === 'INTRO';
        need *= introScaffolding ? 0.25 : 0;
      }
    }

    tieScore[section.id] = need;
    exactShare[section.id] = need;
  });

  const totalNeed = Object.values(exactShare).reduce((acc, value) => acc + value, 0);
  if (totalNeed <= 0) {
    part.sections.forEach((section) => {
      exactShare[section.id] = 1 / part.sections.length;
    });
  } else {
    Object.keys(exactShare).forEach((sectionId) => {
      exactShare[sectionId] = exactShare[sectionId] / totalNeed;
    });
  }

  const minFloor = config.MIN_SECTION_SHARE_WITHIN_PART[part.examPart] ?? 0;
  if (activeSectionIds.length > 1 && minFloor > 0) {
    const boundedFloor = Math.min(minFloor, 1 / activeSectionIds.length);
    const floorTotal = boundedFloor * activeSectionIds.length;
    const remainderShare = Math.max(0, 1 - floorTotal);
    const activeNeedSum = activeSectionIds.reduce((acc, sectionId) => acc + exactShare[sectionId], 0);

    const nextShare: Record<string, number> = {};
    part.sections.forEach((section) => {
      if (!activeSectionIds.includes(section.id)) {
        nextShare[section.id] = 0;
        return;
      }

      const needNorm = activeNeedSum > 0 ? exactShare[section.id] / activeNeedSum : 1 / activeSectionIds.length;
      nextShare[section.id] = boundedFloor + remainderShare * needNorm;
    });

    Object.keys(nextShare).forEach((sectionId) => {
      exactShare[sectionId] = nextShare[sectionId];
    });
  }

  const exactMinutes: Record<string, number> = {};
  Object.keys(exactShare).forEach((sectionId) => {
    exactMinutes[sectionId] = exactShare[sectionId] * partBudget;
  });

  const order = part.sections
    .slice()
    .sort((a, b) => a.sectionOrder - b.sectionOrder)
    .map((section) => section.id);

  return allocateByLargestRemainder(exactMinutes, partBudget, tieScore, order);
}

function isPracticeEligible(submodule: SubmoduleState, config: RoadmapConfig): boolean {
  if (submodule.questionsRemainingUnique <= 0) {
    return false;
  }

  if (submodule.learnMinTotalSelected <= 0) {
    return true;
  }

  const progress = 1 - submodule.learnMinRemaining / submodule.learnMinTotalSelected;
  return progress >= config.PRACTICE_UNLOCK_PCT;
}

function hasCoreWorkRemaining(submodule: SubmoduleState): boolean {
  return submodule.learnMinRemaining > 0 || submodule.questionsRemainingUnique > 0;
}

function getCurrentSubmoduleInJsonOrder(section: SectionState): SubmoduleState | null {
  const ordered = section.submodules.slice().sort((a, b) => a.jsonIndex - b.jsonIndex);
  for (const submodule of ordered) {
    if (hasCoreWorkRemaining(submodule)) {
      return submodule;
    }
  }
  return null;
}

function buildSprintGoal(
  executedByPart: Record<ExamPart, number>,
  newStartedSubmodules: string[],
  maintenanceLabel: string
): string {
  const rankedByExecuted = PART_DISPLAY_ORDER.slice().sort((a, b) => {
    if (executedByPart[b] !== executedByPart[a]) return executedByPart[b] - executedByPart[a];
    return fixedPartOrderIndex(a) - fixedPartOrderIndex(b);
  });

  const top2 = rankedByExecuted.slice(0, 2).join(' & ');
  const focusA = newStartedSubmodules[0] || 'carry-over focus modules';
  const focusB = newStartedSubmodules[1] || 'timed mixed sets';
  return `Advance ${top2} with emphasis on ${focusA} and ${focusB}. Maintain timed practice across remaining parts via ${maintenanceLabel}.`;
}

function buildCheckpointDefinition(
  sprintItems: SprintItemRuntime[],
  partBudgets: Record<ExamPart, number>,
  config: RoadmapConfig
): SprintCheckpointByPart[] {
  const result: SprintCheckpointByPart[] = [];

  PART_DISPLAY_ORDER.forEach((part) => {
    const partPracticeItems = sprintItems.filter(
      (item) =>
        item.exam_part === part &&
        (item.planned_practice_questions_unique > 0 || item.planned_practice_questions_retake > 0)
    );

    if (partPracticeItems.length === 0) {
      if ((partBudgets[part] || 0) <= 0) {
        return;
      }
      const fallbackMinutes = Math.max(0, Math.min(config.CHECKPOINT_PREFERRED_Q, partBudgets[part] || 0));
      result.push({
        exam_part: part,
        source_item: {
          section_title: 'N/A',
          submodule_name: 'Timed drill fallback'
        },
        checkpoint_type: 'time_drill',
        timed_drill_minutes: fallbackMinutes,
        checkpoint_questions: 0,
        target_metrics: {
          accuracy: config.TARGET_ACCURACY,
          avg_time_per_question_min: config.TARGET_TIME_PER_Q_BY_PART[part]
        },
        confidence: 'low_sample'
      });
      return;
    }

    const qScheduled = partPracticeItems.reduce(
      (acc, item) => acc + item.planned_practice_questions_unique + item.planned_practice_questions_retake,
      0
    );
    const preferredQ = config.CHECKPOINT_PREFERRED_Q || config.CHECKPOINT_SAMPLE_QUESTIONS_PER_PART;
    const minQ = Math.max(config.CHECKPOINT_MIN_QUESTIONS_PER_PART, 15);

    const singlePreferred = partPracticeItems.find((item) => {
      const totalQ = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
      return totalQ >= minQ;
    });

    if (singlePreferred) {
      const totalQ =
        singlePreferred.planned_practice_questions_unique +
        singlePreferred.planned_practice_questions_retake;
      const checkpointQuestions = Math.min(preferredQ, totalQ);
      const confidence: 'ok' | 'low_sample' = checkpointQuestions < minQ ? 'low_sample' : 'ok';

      result.push({
        exam_part: part,
        source_item: {
          section_title: singlePreferred.section_title,
          submodule_name: singlePreferred.submodule_name
        },
        checkpoint_type: 'single',
        checkpoint_questions: checkpointQuestions,
        target_metrics: {
          accuracy: config.TARGET_ACCURACY,
          avg_time_per_question_min: config.TARGET_TIME_PER_Q_BY_PART[part]
        },
        confidence
      });
      return;
    }

    const mixedCandidates = partPracticeItems
      .slice()
      .sort((a, b) => {
        const qa = a.planned_practice_questions_unique + a.planned_practice_questions_retake;
        const qb = b.planned_practice_questions_unique + b.planned_practice_questions_retake;
        if (qb !== qa) return qb - qa;
        if (a.section_title !== b.section_title) {
          return a.section_title.localeCompare(b.section_title);
        }
        return a.submodule_name.localeCompare(b.submodule_name);
      })
      .slice(0, config.CHECKPOINT_MIX_MAX_SUBMODULES);

    const targetQ = Math.min(preferredQ, qScheduled);
    const totalCandidateQ = mixedCandidates.reduce(
      (acc, item) => acc + item.planned_practice_questions_unique + item.planned_practice_questions_retake,
      0
    );

    const mixedSource = mixedCandidates.map((item, idx) => {
      const totalQ =
        item.planned_practice_questions_unique + item.planned_practice_questions_retake;
      const proportional = totalCandidateQ > 0 ? (totalQ / totalCandidateQ) * targetQ : 0;
      const baseQ = Math.floor(proportional);
      return {
        idx,
        section_title: item.section_title,
        submodule_name: item.submodule_name,
        questions: Math.min(totalQ, baseQ)
      };
    });

    let assignedQ = mixedSource.reduce((acc, item) => acc + item.questions, 0);
    let remainingQ = Math.max(0, targetQ - assignedQ);

    mixedSource
      .slice()
      .sort((a, b) => {
        if (b.questions !== a.questions) return b.questions - a.questions;
        if (a.section_title !== b.section_title) return a.section_title.localeCompare(b.section_title);
        return a.submodule_name.localeCompare(b.submodule_name);
      })
      .forEach((item) => {
        if (remainingQ <= 0) return;
        item.questions += 1;
        remainingQ -= 1;
      });

    assignedQ = mixedSource.reduce((acc, item) => acc + item.questions, 0);
    const checkpointQuestions = Math.min(targetQ, assignedQ);
    const confidence: 'ok' | 'low_sample' = checkpointQuestions < minQ ? 'low_sample' : 'ok';

    result.push({
      exam_part: part,
      source_item: {
        section_title: mixedSource[0]?.section_title || partPracticeItems[0].section_title,
        submodule_name: mixedSource[0]?.submodule_name || partPracticeItems[0].submodule_name
      },
      source_items_mixed: mixedSource
        .filter((item) => item.questions > 0)
        .map((item) => ({
          section_title: item.section_title,
          submodule_name: item.submodule_name,
          questions: item.questions
        })),
      checkpoint_type: 'mixed',
      checkpoint_questions: checkpointQuestions,
      target_metrics: {
        accuracy: config.TARGET_ACCURACY,
        avg_time_per_question_min: config.TARGET_TIME_PER_Q_BY_PART[part]
      },
      confidence
    });
  });

  return result;
}

function scheduleSprint(
  context: PlanningContext,
  skeleton: SprintSkeleton,
  checkpointLookup: CheckpointMetricLookup
): {
  sprint: SprintOutput;
  consumedByPart: Record<ExamPart, number>;
  policyFeasibleForSprint: boolean;
  unusedMinutes: number;
} {
  const { config, parts } = context;
  const softCoreCapMode = isHighLevelV4(config) && !config.ENFORCE_FILL_TO_PLAN_IN_V3;

  const remByPartStart = getRemainingByPart(parts);
  const { shares, priority } = computePartShares(
    context,
    remByPartStart,
    checkpointLookup,
    skeleton.sprintNumber,
    skeleton.isFinalPhase
  );

  const activeParts = PART_DISPLAY_ORDER.filter((part) => parts[part].sections.length > 0);
  const exactBudgets: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  activeParts.forEach((part) => {
    exactBudgets[part] = shares[part] * skeleton.planningMinutes;
  });

  const allocatedActive = allocateByLargestRemainder(
    activeParts.reduce((acc, part) => {
      acc[part] = exactBudgets[part];
      return acc;
    }, {} as Record<ExamPart, number>),
    skeleton.planningMinutes,
    priority,
    PART_DISPLAY_ORDER
  );

  const partBudgets: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    partBudgets[part] = allocatedActive[part] || 0;
  });
  const partBudgetsPrimary: Record<ExamPart, number> = { ...partBudgets };

  const partCapBySprint: Record<ExamPart, number> = {
    READING: Math.floor(config.MAX_PART_SHARE * skeleton.planningMinutes),
    LOGIC: Math.floor(config.MAX_PART_SHARE * skeleton.planningMinutes),
    DRAWING: Math.floor(config.MAX_PART_SHARE * skeleton.planningMinutes),
    MATH_PHYSICS: Math.floor(config.MAX_PART_SHARE * skeleton.planningMinutes),
    GENERAL_KNOWLEDGE: Math.floor(config.MAX_PART_SHARE * skeleton.planningMinutes)
  };

  const runtimeItemMap = new Map<string, SprintItemRuntime>();
  const consumedByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  const getPartHeadroom = (part: ExamPart): number =>
    Math.max(0, partCapBySprint[part] - consumedByPart[part]);

  const consumedPrimaryByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };
  const reallocationReasonByPart: Partial<Record<ExamPart, string>> = {};
  const primaryUnusedByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };
  const newStartedSubmodules: string[] = [];

  const upsertRuntimeItem = (part: ExamPart, section: SectionState, submodule: SubmoduleState) => {
    const key = submodule.id;
    const existing = runtimeItemMap.get(key);
    if (existing) {
      return existing;
    }

    const created: SprintItemRuntime = {
      exam_part: part,
      section_title: section.title,
      submodule_name: submodule.name,
      submodule_id: submodule.id,
      category: submodule.category,
      planned_learning_minutes: 0,
      planned_untimed_items: 0,
      planned_practice_questions_unique: 0,
      planned_practice_questions_retake: 0,
      practice_minutes_est: 0,
      total_minutes_est: 0,
      is_partial: true,
      remaining_after_sprint: {
        learning_minutes_remaining: submodule.learnMinRemaining,
        questions_remaining_unique: submodule.questionsRemainingUnique
      }
    };
    runtimeItemMap.set(key, created);
    return created;
  };

  const markSubmoduleStarted = (submodule: SubmoduleState) => {
    if (context.startedSubmoduleIds.has(submodule.id)) return;
    context.startedSubmoduleIds.add(submodule.id);
    newStartedSubmodules.push(`${submodule.sectionTitle} -> ${submodule.name}`);
  };

  const addLearning = (
    part: ExamPart,
    section: SectionState,
    submodule: SubmoduleState,
    minutes: number,
    untimedItems: number
  ) => {
    if (minutes <= 0) return 0;
    const item = upsertRuntimeItem(part, section, submodule);
    item.planned_learning_minutes += minutes;
    item.planned_untimed_items += Math.max(0, untimedItems);
    item.total_minutes_est += minutes;
    submodule.lastScheduledSprint = skeleton.sprintNumber;
    markSubmoduleStarted(submodule);
    item.is_partial = submodule.learnMinRemaining > 0 || submodule.questionsRemainingUnique > 0;
    item.remaining_after_sprint.learning_minutes_remaining = submodule.learnMinRemaining;
    item.remaining_after_sprint.questions_remaining_unique = submodule.questionsRemainingUnique;
    return minutes;
  };

  const addPractice = (
    part: ExamPart,
    section: SectionState,
    submodule: SubmoduleState,
    uniqueQ: number,
    retakeQ: number
  ) => {
    const qTotal = uniqueQ + retakeQ;
    if (qTotal <= 0) return 0;

    const minutes = qTotal * submodule.costPerQMin;
    const item = upsertRuntimeItem(part, section, submodule);
    item.planned_practice_questions_unique += uniqueQ;
    item.planned_practice_questions_retake += retakeQ;
    item.practice_minutes_est += minutes;
    item.total_minutes_est += minutes;
    submodule.lastScheduledSprint = skeleton.sprintNumber;
    if (retakeQ > 0) {
      submodule.lastRetakeSprint = skeleton.sprintNumber;
    }
    markSubmoduleStarted(submodule);
    item.is_partial = submodule.learnMinRemaining > 0 || submodule.questionsRemainingUnique > 0;
    item.remaining_after_sprint.learning_minutes_remaining = submodule.learnMinRemaining;
    item.remaining_after_sprint.questions_remaining_unique = submodule.questionsRemainingUnique;
    return minutes;
  };

  const isCoreCoverageCompleteNow = () => {
    const remCore = getRemainingCoreByPart(parts);
    return PART_DISPLAY_ORDER.every((part) => remCore[part] <= 1e-9);
  };

  const getGlobalCoreProgressNow = () => {
    const remCore = getRemainingCoreByPart(parts);
    const initialCoreTotal = PART_DISPLAY_ORDER.reduce(
      (acc, part) => acc + context.remByPartStart[part],
      0
    );
    const remainingCoreTotal = PART_DISPLAY_ORDER.reduce((acc, part) => acc + remCore[part], 0);
    if (initialCoreTotal <= 1e-9) return 1;
    return clamp(1 - remainingCoreTotal / initialCoreTotal, 0, 1);
  };

  const canUseRetake = (submodule: SubmoduleState, _phase: 'primary' | 'redistribution') => {
    if (!config.ENABLE_RETAKES) return false;
    if (submodule.questionsInitialSelected <= 0) return false;
    if (isHighLevelV4(config) && config.RETAKES_FINAL_PHASE_ONLY && !skeleton.isFinalPhase) {
      return false;
    }
    if (
      isHighLevelV4(config) &&
      getGlobalCoreProgressNow() + 1e-9 < config.RETAKES_GLOBAL_CORE_PROGRESS_PCT
    ) {
      return false;
    }
    if (config.RETAKES_ONLY_AFTER_CORE_COMPLETE && !isCoreCoverageCompleteNow()) return false;
    // Unique-first invariant: retakes are allowed only after unique questions are exhausted.
    if (submodule.questionsRemainingUnique > 0) return false;
    if (
      submodule.lastRetakeSprint !== undefined &&
      submodule.lastRetakeSprint !== skeleton.sprintNumber &&
      skeleton.sprintNumber - submodule.lastRetakeSprint < config.RETAKE_MIN_GAP_SPRINTS
    ) {
      return false;
    }
    return true;
  };

  const tryAllocateLearning = (
    part: ExamPart,
    section: SectionState,
    submodule: SubmoduleState,
    availableBudget: number
  ) => {
    if (availableBudget <= 0)
      return {
        consumedMinutes: 0,
        consumedUntimedItems: 0
      };
    if (submodule.learnMinRemaining <= 0)
      return {
        consumedMinutes: 0,
        consumedUntimedItems: 0
      };
    if (skeleton.isFinalPhase && !config.ALLOW_NEW_LEARNING_IN_FINAL_PHASE)
      return {
        consumedMinutes: 0,
        consumedUntimedItems: 0
      };

    const desired = Math.min(availableBudget, submodule.learnMinRemaining);
    const isFinishing = desired >= submodule.learnMinRemaining - 1e-9;
    if (desired < config.MIN_LEARNING_BLOCK_MIN && !isFinishing) {
      return {
        consumedMinutes: 0,
        consumedUntimedItems: 0
      };
    }

    const untimedMinutesRemaining =
      submodule.untimedItemsRemaining * config.UNTIMED_TEXT_MIN_PER_ITEM;
    const nonUntimedRemaining = Math.max(0, submodule.learnMinRemaining - untimedMinutesRemaining);
    const consumeNonUntimed = Math.min(desired, nonUntimedRemaining);
    let untimedMinutesBudget = Math.max(0, desired - consumeNonUntimed);
    let consumedUntimedItems = 0;

    if (untimedMinutesBudget > 0 && submodule.untimedItemsRemaining > 0) {
      if (isFinishing || untimedMinutesBudget + 1e-9 >= untimedMinutesRemaining) {
        consumedUntimedItems = submodule.untimedItemsRemaining;
      } else {
        consumedUntimedItems = Math.floor(
          untimedMinutesBudget / Math.max(config.UNTIMED_TEXT_MIN_PER_ITEM, 0.000001)
        );
      }
      consumedUntimedItems = Math.min(consumedUntimedItems, submodule.untimedItemsRemaining);
      untimedMinutesBudget = consumedUntimedItems * config.UNTIMED_TEXT_MIN_PER_ITEM;
    } else {
      untimedMinutesBudget = 0;
    }

    const actualConsumed = consumeNonUntimed + untimedMinutesBudget;
    if (actualConsumed <= 0) {
      return {
        consumedMinutes: 0,
        consumedUntimedItems: 0
      };
    }

    submodule.learnMinRemaining = Math.max(0, submodule.learnMinRemaining - actualConsumed);
    submodule.untimedItemsRemaining = Math.max(0, submodule.untimedItemsRemaining - consumedUntimedItems);

    const consumedMinutes = addLearning(
      part,
      section,
      submodule,
      actualConsumed,
      consumedUntimedItems
    );
    return {
      consumedMinutes,
      consumedUntimedItems
    };
  };

  const allocatePracticeOnSubmodule = (
    part: ExamPart,
    section: SectionState,
    submodule: SubmoduleState,
    budget: number,
    phase: 'primary' | 'redistribution'
  ) => {
    let remaining = budget;
    let consumed = 0;

    if (remaining <= 0) return consumed;

    if (isPracticeEligible(submodule, config)) {
      const maxQ = Math.floor(remaining / submodule.costPerQMin);
      if (maxQ > 0) {
        const uniqueRemainingMin = submodule.questionsRemainingUnique * submodule.costPerQMin;
        const coreRemainingMin = getRemainingCoreMinutesForSubmodule(submodule);
        if (
          config.PREFER_UNSPLIT_MODULES &&
          submodule.questionsRemainingUnique > 0 &&
          coreRemainingMin > 0 &&
          coreRemainingMin <= config.UNSPLIT_MODULE_MAX_MIN &&
          !skeleton.isLastSprint &&
          remaining + 1e-9 < uniqueRemainingMin
        ) {
          return consumed;
        }

        let qUnique = Math.min(maxQ, submodule.questionsRemainingUnique);
        if (qUnique > 0) {
          const exhaustingUnique = qUnique === submodule.questionsRemainingUnique;
          if (
            qUnique < config.MIN_PRACTICE_BLOCK_Q &&
            !exhaustingUnique &&
            maxQ >= config.MIN_PRACTICE_BLOCK_Q
          ) {
            qUnique = 0;
          }
        }

        if (qUnique > 0) {
          submodule.questionsRemainingUnique -= qUnique;
          const minutes = addPractice(part, section, submodule, qUnique, 0);
          consumed += minutes;
          remaining = Math.max(0, remaining - minutes);
        }
      }
    }

    if (remaining <= 0 || !canUseRetake(submodule, phase)) {
      return consumed;
    }

    const maxRetakeQ = Math.floor(remaining / submodule.costPerQMin);
    if (maxRetakeQ <= 0) {
      return consumed;
    }

    let qRetake = maxRetakeQ;
    if (phase === 'primary' && submodule.questionsRemainingUnique > 0) {
      qRetake = Math.floor(maxRetakeQ * config.RETAKE_SHARE_AFTER_UNIQUE_DONE);
    }
    if (qRetake <= 0) {
      return consumed;
    }
    if (qRetake < config.MIN_PRACTICE_BLOCK_Q && maxRetakeQ >= config.MIN_PRACTICE_BLOCK_Q) {
      return consumed;
    }

    const minutes = addPractice(part, section, submodule, 0, qRetake);
    consumed += minutes;
    return consumed;
  };

  const getRetakeCandidateWhenCoreComplete = (
    section: SectionState,
    phase: 'primary' | 'redistribution'
  ): SubmoduleState | null => {
    if (!config.ENABLE_RETAKES) return null;

    const candidates = section.submodules
      .slice()
      .sort((a, b) => {
        if (b.wrongRateEstimate !== a.wrongRateEstimate) {
          return b.wrongRateEstimate - a.wrongRateEstimate;
        }
        if (b.questionsInitialSelected !== a.questionsInitialSelected) {
          return b.questionsInitialSelected - a.questionsInitialSelected;
        }
        return a.jsonIndex - b.jsonIndex;
      })
      .filter((submodule) => canUseRetake(submodule, phase));

    return candidates[0] || null;
  };

  const allocateSectionBudget = (
    part: ExamPart,
    section: SectionState,
    sectionBudget: number,
    phase: 'primary' | 'redistribution'
  ) => {
    if (sectionBudget <= 0) return 0;

    let consumed = 0;

    if (phase === 'primary') {
      let learnShare = config.LEVEL_LEARNING_SHARE[String(section.level) as '1' | '2' | '3' | '4' | '5'];
      if (skeleton.isFinalPhase) {
        learnShare *= config.FINAL_PHASE_LEARNING_MULTIPLIER;
      }
      learnShare = clamp(learnShare, 0, 1);

      let learnBudget = Math.floor(sectionBudget * learnShare);
      let practiceBudget = sectionBudget - learnBudget;

      while (learnBudget > 0 || practiceBudget > 0) {
        const current = getCurrentSubmoduleInJsonOrder(section);
        if (current) {
          const partState = parts[part];
          if (isHistoryArtCoreLocked(partState, section, current, config)) {
            break;
          }
          const remainingSectionBudget = learnBudget + practiceBudget;
          if (
            shouldDeferSmallModuleSplit(
              current,
              remainingSectionBudget,
              config,
              skeleton.isLastSprint
            )
          ) {
            break;
          }

          const remainingCoreMin = getRemainingCoreMinutesForSubmodule(current);
          const canForceUnsplitCompletion =
            config.PREFER_UNSPLIT_MODULES &&
            remainingCoreMin > 0 &&
            remainingCoreMin <= config.UNSPLIT_MODULE_MAX_MIN &&
            remainingSectionBudget + 1e-9 >= remainingCoreMin;

          if (canForceUnsplitCompletion) {
            let mergedBudget = remainingSectionBudget;
            let progressedMerged = false;

            if (mergedBudget > 0) {
              const learningResult = tryAllocateLearning(part, section, current, mergedBudget);
              if (learningResult.consumedMinutes > 0) {
                consumed += learningResult.consumedMinutes;
                mergedBudget = Math.max(0, mergedBudget - learningResult.consumedMinutes);
                progressedMerged = true;
              }
            }

            if (mergedBudget > 0) {
              const practiceUsed = allocatePracticeOnSubmodule(
                part,
                section,
                current,
                mergedBudget,
                'primary'
              );
              if (practiceUsed > 0) {
                consumed += practiceUsed;
                mergedBudget = Math.max(0, mergedBudget - practiceUsed);
                progressedMerged = true;
              }
            }

            if (progressedMerged) {
              const spent = Math.max(0, remainingSectionBudget - mergedBudget);
              const spendFromLearn = Math.min(learnBudget, spent);
              learnBudget = Math.max(0, learnBudget - spendFromLearn);
              practiceBudget = Math.max(0, practiceBudget - (spent - spendFromLearn));
              continue;
            }
          }

          let progressed = false;

          if (learnBudget > 0) {
            const learningResult = tryAllocateLearning(part, section, current, learnBudget);
            if (learningResult.consumedMinutes > 0) {
              consumed += learningResult.consumedMinutes;
              learnBudget = Math.max(0, learnBudget - learningResult.consumedMinutes);
              progressed = true;
            }
          }

          if (practiceBudget > 0) {
            const practiceUsed = allocatePracticeOnSubmodule(
              part,
              section,
              current,
              practiceBudget,
              'primary'
            );
            if (practiceUsed > 0) {
              consumed += practiceUsed;
              practiceBudget = Math.max(0, practiceBudget - practiceUsed);
              progressed = true;
            }
          }

          if (!progressed) {
            break;
          }
          continue;
        }

        if (practiceBudget > 0) {
          const retakeCandidate = getRetakeCandidateWhenCoreComplete(section, 'primary');
          if (!retakeCandidate) {
            break;
          }
          const retakeUsed = allocatePracticeOnSubmodule(
            part,
            section,
            retakeCandidate,
            practiceBudget,
            'primary'
          );
          if (retakeUsed <= 0) {
            break;
          }
          consumed += retakeUsed;
          practiceBudget = Math.max(0, practiceBudget - retakeUsed);
          continue;
        }

        break;
      }

      return consumed;
    }

    // Redistribution phase: stay in strict JSON order.
    let remainingBudget = sectionBudget;

    while (remainingBudget > 0) {
      const current = getCurrentSubmoduleInJsonOrder(section);
      if (current) {
        const partState = parts[part];
        if (isHistoryArtCoreLocked(partState, section, current, config)) {
          break;
        }
        if (
          shouldDeferSmallModuleSplit(
            current,
            remainingBudget,
            config,
            skeleton.isLastSprint
          )
        ) {
          break;
        }

        let progressed = false;

        const practiceUsed = allocatePracticeOnSubmodule(
          part,
          section,
          current,
          remainingBudget,
          'redistribution'
        );
        if (practiceUsed > 0) {
          consumed += practiceUsed;
          remainingBudget = Math.max(0, remainingBudget - practiceUsed);
          progressed = true;
        }

        if (remainingBudget > 0) {
          const learningResult = tryAllocateLearning(part, section, current, remainingBudget);
          if (learningResult.consumedMinutes > 0) {
            consumed += learningResult.consumedMinutes;
            remainingBudget = Math.max(0, remainingBudget - learningResult.consumedMinutes);
            progressed = true;
          }
        }

        if (!progressed) {
          break;
        }
        continue;
      }

      const retakeCandidate = getRetakeCandidateWhenCoreComplete(section, 'redistribution');
      if (!retakeCandidate) {
        break;
      }
      const retakeUsed = allocatePracticeOnSubmodule(
        part,
        section,
        retakeCandidate,
        remainingBudget,
        'redistribution'
      );
      if (retakeUsed <= 0) {
        break;
      }
      consumed += retakeUsed;
      remainingBudget = Math.max(0, remainingBudget - retakeUsed);
    }

    return consumed;
  };

  const allocatePartBudget = (
    part: ExamPart,
    requestedBudget: number,
    phase: 'primary' | 'redistribution'
  ) => {
    if (requestedBudget <= 0) return 0;
    const partState = parts[part];
    if (!partState || partState.sections.length === 0) return 0;

    const bypassCapForCoreWork =
      isHighLevelV4(config) &&
      !config.ENFORCE_FILL_TO_PLAN_IN_V3 &&
      canScheduleCoreForPart(part);
    const budgetAfterCap = bypassCapForCoreWork
      ? requestedBudget
      : Math.min(requestedBudget, getPartHeadroom(part));
    const cappedBudget = Math.floor(budgetAfterCap);
    if (cappedBudget <= 0) return 0;

    const sectionBudgets = allocateMinutesAcrossSections(partState, cappedBudget, config);
    let consumed = 0;

    partState.sections
      .slice()
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
      .forEach((section) => {
        if (isTemporarilyLockedSection(partState, section, config)) return;
        const sectionBudget = sectionBudgets[section.id] || 0;
        if (sectionBudget <= 0) return;
        consumed += allocateSectionBudget(part, section, sectionBudget, phase);
      });

    return consumed;
  };

  const canScheduleCoreForSection = (part: ExamPart, section: SectionState): boolean => {
    const current = getCurrentSubmoduleInJsonOrder(section);
    if (!current) return false;
    if (isHistoryArtCoreLocked(parts[part], section, current, config)) return false;

    const canLearn =
      current.learnMinRemaining > 0 &&
      (!skeleton.isFinalPhase || config.ALLOW_NEW_LEARNING_IN_FINAL_PHASE);
    const canPracticeUnique = isPracticeEligible(current, config);
    return canLearn || canPracticeUnique;
  };

  const canScheduleMoreForSection = (part: ExamPart, section: SectionState): boolean => {
    const current = getCurrentSubmoduleInJsonOrder(section);
    if (current) {
      if (isHistoryArtCoreLocked(parts[part], section, current, config)) return false;
      const canLearn =
        current.learnMinRemaining > 0 &&
        (!skeleton.isFinalPhase || config.ALLOW_NEW_LEARNING_IN_FINAL_PHASE);
      const canPracticeUnique = isPracticeEligible(current, config);
      const canRetakeCurrent = canUseRetake(current, 'redistribution');
      return canLearn || canPracticeUnique || canRetakeCurrent;
    }

    return getRetakeCandidateWhenCoreComplete(section, 'redistribution') !== null;
  };

  const canScheduleCoreForPart = (part: ExamPart): boolean => {
    const partState = parts[part];
    if (!partState || partState.sections.length === 0) return false;
    return partState.sections.some(
      (section) =>
        !isTemporarilyLockedSection(partState, section, config) &&
        canScheduleCoreForSection(part, section)
    );
  };

  const canScheduleMoreForPart = (part: ExamPart): boolean => {
    const partState = parts[part];
    if (!partState || partState.sections.length === 0) return false;
    return partState.sections.some(
      (section) =>
        !isTemporarilyLockedSection(partState, section, config) &&
        canScheduleMoreForSection(part, section)
    );
  };

  PART_DISPLAY_ORDER.forEach((part) => {
    const budget = partBudgets[part];
    if (budget <= 0) return;

    const consumed = allocatePartBudget(part, budget, 'primary');
    consumedPrimaryByPart[part] = consumed;
    consumedByPart[part] += consumed;
    primaryUnusedByPart[part] = Math.max(0, budget - consumed);

    if (primaryUnusedByPart[part] > 0) {
      reallocationReasonByPart[part] = 'primary_budget_underfilled_reallocated_via_phase_c';
    }
  });

  let totalConsumed = PART_DISPLAY_ORDER.reduce((acc, part) => acc + consumedByPart[part], 0);

  // Ensure presence for parts with meaningful budget; if empty, try maintenance practice.
  PART_DISPLAY_ORDER.forEach((part) => {
    const budget = partBudgets[part];
    if (budget < config.MIN_PART_PRESENCE_MIN) return;
    if (consumedByPart[part] > 0) return;
    if (!config.ENFORCE_FILL_TO_PLAN_IN_V3 && !canScheduleCoreForPart(part)) return;

    const slack = Math.max(0, skeleton.planningMinutes - totalConsumed);
    if (slack <= 0) return;
    const presenceBudget = Math.min(
      slack,
      Math.max(config.REDISTRIBUTION_QUANTUM_MIN, config.MIN_ITEM_TOTAL_MIN)
    );

    const consumedPresence = allocatePartBudget(part, presenceBudget, 'redistribution');
    if (consumedPresence > 0) {
      consumedByPart[part] += consumedPresence;
      totalConsumed += consumedPresence;
      reallocationReasonByPart[part] = 'presence_maintenance_practice';
    } else {
      reallocationReasonByPart[part] =
        canScheduleMoreForPart(part) && getPartHeadroom(part) < 1
          ? 'reallocated_cap_limited_for_part'
          : 'reallocated_no_eligible_work_for_part';
    }
  });

  const checkpointPrev = checkpointLookup[skeleton.sprintNumber - 1] || {};
  const checkpointPerfScore = (part: ExamPart) => {
    const metrics = checkpointPrev[part];
    if (!metrics || metrics.accuracy === undefined || metrics.accuracy === null) return 1;
    if (
      config.ADAPT_ONLY_ON_OK_CONFIDENCE &&
      metrics.confidence === 'low_sample'
    ) {
      return 1;
    }
    const accScore = clamp(metrics.accuracy / config.TARGET_ACCURACY, 0, 1.25);
    if (metrics.avg_time_per_question_min === null || metrics.avg_time_per_question_min === undefined) {
      return accScore;
    }
    const timeScore = clamp(
      config.TARGET_TIME_PER_Q_BY_PART[part] / Math.max(metrics.avg_time_per_question_min, 0.001),
      0,
      1.25
    );
    return config.ADAPT_W_ACCURACY * accScore + config.ADAPT_W_TIME * timeScore;
  };

  const enforceFillTarget = config.ENFORCE_FILL_TO_PLAN_IN_V3;
  const targetPlanned = enforceFillTarget
    ? skeleton.planningMinutes * (1 - config.MAX_UNUSED_PCT)
    : 0;
  let redistributionBlockedByNoEligibleCore = false;
  let redistributionBlockedByNoEligibleFill = false;

  const buildBudgetCandidates = (
    part: ExamPart,
    slack: number,
    quantum: number,
    ignoreCap: boolean
  ): number[] => {
    const budgetSlack = ignoreCap
      ? Math.floor(slack)
      : Math.floor(Math.min(slack, getPartHeadroom(part)));
    if (budgetSlack <= 0) return [];

    const costCandidates = parts[part].sections.flatMap((section) =>
      section.submodules.map((submodule) => submodule.costPerQMin)
    );
    const minCostPerQuestion =
      costCandidates.length > 0 ? Math.min(...costCandidates) : config.BASE_MIN_PER_QUESTION;
    const sectionCount = Math.max(1, parts[part].sections.length);

    return [
      quantum,
      Math.max(quantum, config.MIN_ITEM_TOTAL_MIN),
      Math.max(quantum, config.MIN_LEARNING_BLOCK_MIN),
      Math.max(quantum, config.MIN_LEARNING_BLOCK_MIN * sectionCount),
      Math.max(quantum, Math.ceil(config.MIN_PRACTICE_BLOCK_Q * minCostPerQuestion)),
      budgetSlack
    ]
      .map((value) => Math.floor(Math.min(value, budgetSlack)))
      .filter((value) => value > 0)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a - b);
  };

  // Phase C1: always redistribute slack to remaining core coverage work first.
  while (true) {
    const slack = Math.max(0, skeleton.planningMinutes - totalConsumed);
    if (slack <= 0) break;

    const quantum = Math.min(config.REDISTRIBUTION_QUANTUM_MIN, slack);
    const remCoreNow = getRemainingCoreByPart(parts);
    const shareSoFar = PART_DISPLAY_ORDER.reduce((acc, part) => {
      acc[part] = totalConsumed > 0 ? consumedByPart[part] / totalConsumed : 0;
      return acc;
    }, {} as Record<ExamPart, number>);

    const corePartsWithBacklog = PART_DISPLAY_ORDER.filter((part) => remCoreNow[part] > 0);
    if (corePartsWithBacklog.length === 0) {
      break;
    }

    const weakestPartLevel = corePartsWithBacklog.reduce((lowest, part) => {
      return Math.min(lowest, parts[part].partLevel);
    }, Number.POSITIVE_INFINITY);

    const weakestBacklogParts = corePartsWithBacklog.filter(
      (part) => parts[part].partLevel === weakestPartLevel
    );
    const weakestSchedulableParts = weakestBacklogParts.filter((part) =>
      canScheduleCoreForPart(part)
    );
    const weakestSchedulableWithHeadroom = softCoreCapMode
      ? weakestSchedulableParts
      : weakestSchedulableParts.filter((part) => getPartHeadroom(part) >= 1);

    // Weak-part protection: if weakest parts still have schedulable core work but are cap-blocked,
    // do not leak redistribution into stronger parts during this sprint.
    if (
      !softCoreCapMode &&
      weakestSchedulableParts.length > 0 &&
      weakestSchedulableWithHeadroom.length === 0
    ) {
      redistributionBlockedByNoEligibleCore = true;
      break;
    }

    const eligibleCoreParts = (
      weakestSchedulableWithHeadroom.length > 0
        ? weakestSchedulableWithHeadroom
        : PART_DISPLAY_ORDER
    ).filter((part) => {
      if (!softCoreCapMode && getPartHeadroom(part) < 1) return false;
      if (remCoreNow[part] <= 0) return false;
      return canScheduleCoreForPart(part);
    });

    if (eligibleCoreParts.length === 0) {
      redistributionBlockedByNoEligibleCore = true;
      break;
    }

    const ranked = eligibleCoreParts.slice().sort((a, b) => {
      if (remCoreNow[b] !== remCoreNow[a]) return remCoreNow[b] - remCoreNow[a];
      const perfA = checkpointPerfScore(a);
      const perfB = checkpointPerfScore(b);
      if (perfA !== perfB) return perfA - perfB;
      if (shareSoFar[a] !== shareSoFar[b]) return shareSoFar[a] - shareSoFar[b];
      return fixedPartOrderIndex(a) - fixedPartOrderIndex(b);
    });

    let allocated = false;
    for (const part of ranked) {
      const budgetCandidates = buildBudgetCandidates(part, slack, quantum, softCoreCapMode);
      for (const budget of budgetCandidates) {
        const consumed = allocatePartBudget(part, budget, 'redistribution');
        if (consumed > 0) {
          consumedByPart[part] += consumed;
          totalConsumed += consumed;
          allocated = true;
          break;
        }
      }
      if (allocated) break;
    }

    if (!allocated) {
      redistributionBlockedByNoEligibleCore = true;
      break;
    }
  }

  // Phase C2: optional fill-to-plan redistribution, mainly via maintenance/retakes.
  if (enforceFillTarget) {
    while (totalConsumed + 1e-9 < targetPlanned) {
      const slack = Math.max(0, skeleton.planningMinutes - totalConsumed);
      if (slack <= 0) break;

      const quantum = Math.min(config.REDISTRIBUTION_QUANTUM_MIN, slack);
      const remNow = getRemainingByPart(parts);
      const shareSoFar = PART_DISPLAY_ORDER.reduce((acc, part) => {
        acc[part] = totalConsumed > 0 ? consumedByPart[part] / totalConsumed : 0;
        return acc;
      }, {} as Record<ExamPart, number>);

      const eligibleParts = PART_DISPLAY_ORDER.filter((part) => {
        if (getPartHeadroom(part) < 1) return false;
        return canScheduleMoreForPart(part);
      });

      if (eligibleParts.length === 0) {
        redistributionBlockedByNoEligibleFill = true;
        break;
      }

      const ranked = eligibleParts.slice().sort((a, b) => {
        if (remNow[b] !== remNow[a]) return remNow[b] - remNow[a];
        const perfA = checkpointPerfScore(a);
        const perfB = checkpointPerfScore(b);
        if (perfA !== perfB) return perfA - perfB;
        if (shareSoFar[a] !== shareSoFar[b]) return shareSoFar[a] - shareSoFar[b];
        return fixedPartOrderIndex(a) - fixedPartOrderIndex(b);
      });

      let allocated = false;
      for (const part of ranked) {
        const budgetCandidates = buildBudgetCandidates(part, slack, quantum, false);
        for (const budget of budgetCandidates) {
          const consumed = allocatePartBudget(part, budget, 'redistribution');
          if (consumed > 0) {
            consumedByPart[part] += consumed;
            totalConsumed += consumed;
            allocated = true;
            break;
          }
        }
        if (allocated) break;
      }

      if (!allocated) {
        redistributionBlockedByNoEligibleFill = true;
        break;
      }
    }
  }

  const sprintItemsRuntime = PART_DISPLAY_ORDER.flatMap((part) => {
    const sections = parts[part].sections.slice().sort((a, b) => a.sectionOrder - b.sectionOrder);
    return sections.flatMap((section) => {
      const orderedSubmodules = section.submodules.slice().sort((a, b) => a.jsonIndex - b.jsonIndex);

      return orderedSubmodules
        .map((submodule) => runtimeItemMap.get(submodule.id))
        .filter((item): item is SprintItemRuntime => !!item)
        .filter(
          (item) =>
            item.total_minutes_est > 0 &&
            (item.planned_learning_minutes > 0 ||
              item.planned_practice_questions_unique > 0 ||
              item.planned_practice_questions_retake > 0) &&
            (item.total_minutes_est >= config.MIN_ITEM_TOTAL_MIN ||
              (item.planned_learning_minutes > 0 &&
                item.planned_practice_questions_unique === 0 &&
                item.planned_practice_questions_retake === 0 &&
                item.remaining_after_sprint.learning_minutes_remaining === 0))
        );
    });
  });

  const checkpoint = buildCheckpointDefinition(sprintItemsRuntime, partBudgets, config);

  totalConsumed = Object.values(consumedByPart).reduce((acc, value) => acc + value, 0);
  const plannedMinutesSum = Math.min(skeleton.planningMinutes, Math.floor(totalConsumed));
  const slack = Math.max(0, skeleton.planningMinutes - plannedMinutesSum);
  const remainingCoreByPart = getRemainingCoreByPart(parts);
  const remainingCoreTotal = PART_DISPLAY_ORDER.reduce(
    (acc, part) => acc + remainingCoreByPart[part],
    0
  );
  const coverageComplete = remainingCoreTotal <= 1e-9;
  const workExistsWithoutCap = PART_DISPLAY_ORDER.some((part) => canScheduleMoreForPart(part));
  const coreWorkExistsWithoutCap = PART_DISPLAY_ORDER.some((part) => canScheduleCoreForPart(part));
  const capHeadroomTotal = PART_DISPLAY_ORDER.reduce((acc, part) => {
    if (!canScheduleMoreForPart(part)) return acc;
    if (softCoreCapMode && canScheduleCoreForPart(part)) return acc + skeleton.planningMinutes;
    return acc + getPartHeadroom(part);
  }, 0);
  const maxAchievableWithCurrentCaps = totalConsumed + capHeadroomTotal;
  const capLimited = enforceFillTarget
    ? !coverageComplete &&
      workExistsWithoutCap &&
      maxAchievableWithCurrentCaps + 1e-9 < targetPlanned
    : false;
  const hasHeadroomAndWork = PART_DISPLAY_ORDER.some((part) => {
    if (!canScheduleMoreForPart(part)) return false;
    if (softCoreCapMode && canScheduleCoreForPart(part)) return true;
    return getPartHeadroom(part) >= 1;
  });
  const hasHeadroomAndCoreWork = PART_DISPLAY_ORDER.some((part) => {
    if (!canScheduleCoreForPart(part)) return false;
    if (softCoreCapMode) return true;
    return getPartHeadroom(part) >= 1;
  });
  const remainingSchedulableWork = hasHeadroomAndWork && !redistributionBlockedByNoEligibleFill;
  const remainingSchedulableCoreWork =
    hasHeadroomAndCoreWork && !redistributionBlockedByNoEligibleCore;
  const targetMet = enforceFillTarget ? totalConsumed + 1e-9 >= targetPlanned : false;
  const utilizationMeetsFillThreshold =
    totalConsumed + 1e-9 >= skeleton.planningMinutes * (1 - config.MAX_UNUSED_PCT);

  let unusedReason: 'target_met' | 'coverage_complete' | 'no_eligible_work' | 'cap_limited' | undefined;
  if (enforceFillTarget) {
    if (targetMet) {
      unusedReason = 'target_met';
    } else if (coverageComplete) {
      unusedReason = 'coverage_complete';
    } else if (capLimited) {
      unusedReason = 'cap_limited';
    } else if (!remainingSchedulableWork) {
      unusedReason =
        workExistsWithoutCap && !hasHeadroomAndWork ? 'cap_limited' : 'no_eligible_work';
    }
  } else if (utilizationMeetsFillThreshold) {
    unusedReason = 'target_met';
  } else if (coverageComplete) {
    unusedReason = 'coverage_complete';
  } else if (!remainingSchedulableCoreWork) {
    unusedReason =
      coreWorkExistsWithoutCap && !hasHeadroomAndCoreWork ? 'cap_limited' : 'no_eligible_work';
  }

  const utilizationPct = skeleton.planningMinutes > 0
    ? Number((plannedMinutesSum / skeleton.planningMinutes).toFixed(4))
    : 0;
  const policyFeasibleForSprint = enforceFillTarget
    ? targetMet || coverageComplete || capLimited || !remainingSchedulableWork
    : true;

  const totalPrimaryUnused = PART_DISPLAY_ORDER.reduce(
    (acc, part) => acc + primaryUnusedByPart[part],
    0
  );
  const unusedMinutesByPart =
    totalPrimaryUnused > 0
      ? allocateByLargestRemainder(
          PART_DISPLAY_ORDER.reduce((acc, part) => {
            acc[part] = (primaryUnusedByPart[part] / totalPrimaryUnused) * slack;
            return acc;
          }, {} as Record<ExamPart, number>),
          slack,
          undefined,
          PART_DISPLAY_ORDER
        )
      : {
          READING: 0,
          LOGIC: 0,
          DRAWING: 0,
          MATH_PHYSICS: 0,
          GENERAL_KNOWLEDGE: 0
        };

  const maintenanceLabel = sprintItemsRuntime.some(
    (item) => item.planned_practice_questions_retake > 0
  )
    ? 'retake sets'
    : 'mixed checkpoints';
  const practiceBlocksUnlocked =
    !isHighLevelV4(config) ||
    ((!config.RETAKES_FINAL_PHASE_ONLY || skeleton.isFinalPhase) &&
      getGlobalCoreProgressNow() + 1e-9 >= config.RETAKES_GLOBAL_CORE_PROGRESS_PCT);

  const sprintGoal =
    coverageComplete && sprintItemsRuntime.length === 0
      ? 'Coverage complete: no additional core items are scheduled in this sprint; keep the buffer for light review.'
      : buildSprintGoal(consumedByPart, newStartedSubmodules, maintenanceLabel);

  const focusExamPartsRanked = PART_DISPLAY_ORDER.slice().sort((a, b) => {
    if (consumedByPart[b] !== consumedByPart[a]) return consumedByPart[b] - consumedByPart[a];
    if (partBudgets[b] !== partBudgets[a]) return partBudgets[b] - partBudgets[a];
    if (priority[b] !== priority[a]) return priority[b] - priority[a];
    return fixedPartOrderIndex(a) - fixedPartOrderIndex(b);
  });

  const focusOrderByPart = focusExamPartsRanked.reduce((acc, part, index) => {
    acc[part] = index;
    return acc;
  }, {} as Record<ExamPart, number>);
  const submodulePositionById = new Map<string, { sectionOrder: number; jsonIndex: number }>();
  PART_DISPLAY_ORDER.forEach((part) => {
    parts[part].sections.forEach((section) => {
      section.submodules.forEach((submodule) => {
        submodulePositionById.set(submodule.id, {
          sectionOrder: section.sectionOrder,
          jsonIndex: submodule.jsonIndex
        });
      });
    });
  });
  const orderedSprintItemsRuntime = sprintItemsRuntime.slice().sort((a, b) => {
    const partDelta =
      (focusOrderByPart[a.exam_part] ?? PART_DISPLAY_ORDER.length) -
      (focusOrderByPart[b.exam_part] ?? PART_DISPLAY_ORDER.length);
    if (partDelta !== 0) return partDelta;
    const posA = submodulePositionById.get(a.submodule_id) ?? {
      sectionOrder: Number.MAX_SAFE_INTEGER,
      jsonIndex: Number.MAX_SAFE_INTEGER
    };
    const posB = submodulePositionById.get(b.submodule_id) ?? {
      sectionOrder: Number.MAX_SAFE_INTEGER,
      jsonIndex: Number.MAX_SAFE_INTEGER
    };
    if (posA.sectionOrder !== posB.sectionOrder) {
      return posA.sectionOrder - posB.sectionOrder;
    }
    if (posA.jsonIndex !== posB.jsonIndex) {
      return posA.jsonIndex - posB.jsonIndex;
    }
    return a.submodule_name.localeCompare(b.submodule_name);
  });

  const sprintItems: SprintItem[] = orderedSprintItemsRuntime.map((item): SprintItem => {
    const questionTotal = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
    return {
      exam_part: item.exam_part,
      section_title: item.section_title,
      submodule_name: item.submodule_name,
      planned_learning_minutes: roundMinutes(item.planned_learning_minutes, config.MINUTES_ROUNDING),
      planned_untimed_items: item.planned_untimed_items,
      planned_practice_questions_unique: item.planned_practice_questions_unique,
      planned_practice_questions_retake: item.planned_practice_questions_retake,
      planned_practice_questions_range: formatQuestionsRange(questionTotal),
      exercise_priority: deriveExercisePriority(item),
      practice_minutes_est: roundMinutes(item.practice_minutes_est, config.MINUTES_ROUNDING),
      total_minutes_est: roundMinutes(item.total_minutes_est, config.MINUTES_ROUNDING),
      is_partial: item.is_partial,
      remaining_after_sprint: {
        learning_minutes_remaining: roundMinutes(
          item.remaining_after_sprint.learning_minutes_remaining,
          config.MINUTES_ROUNDING
        ),
        questions_remaining_unique: item.remaining_after_sprint.questions_remaining_unique
      }
    };
  });

  const sprintOutput: SprintOutput = {
    sprint_number: skeleton.sprintNumber,
    week_start_index: skeleton.weekStartIndex,
    week_end_index: skeleton.weekEndIndex,
    sprint_weeks: skeleton.sprintWeeks,
    available_minutes: skeleton.availableMinutes,
    planning_minutes: skeleton.planningMinutes,
    buffer_minutes: skeleton.bufferMinutes,

    sprint_goal: sprintGoal,
    focus_exam_parts_ranked: focusExamPartsRanked,
    part_budgets_minutes: {
      READING: roundMinutes(consumedByPart.READING, config.MINUTES_ROUNDING),
      LOGIC: roundMinutes(consumedByPart.LOGIC, config.MINUTES_ROUNDING),
      DRAWING: roundMinutes(consumedByPart.DRAWING, config.MINUTES_ROUNDING),
      MATH_PHYSICS: roundMinutes(consumedByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
      GENERAL_KNOWLEDGE: roundMinutes(consumedByPart.GENERAL_KNOWLEDGE, config.MINUTES_ROUNDING)
    },
    part_budgets_primary_minutes: partBudgetsPrimary,

    items: sprintItems,

    checkpoint: {
      definition_by_part: checkpoint,
      adaptation_rule_reference: 'disabled_in_v3_optimal_hours_mode'
    },

    totals: {
      planned_minutes_sum: plannedMinutesSum,
      slack_minutes_unfilled: slack,
      planned_utilization_pct: utilizationPct,
      unused_minutes: slack,
      unused_reason: unusedReason,
      fill_target_minutes: enforceFillTarget ? Math.floor(targetPlanned) : undefined
    },
    part_executed_minutes: {
      READING: roundMinutes(consumedByPart.READING, config.MINUTES_ROUNDING),
      LOGIC: roundMinutes(consumedByPart.LOGIC, config.MINUTES_ROUNDING),
      DRAWING: roundMinutes(consumedByPart.DRAWING, config.MINUTES_ROUNDING),
      MATH_PHYSICS: roundMinutes(consumedByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
      GENERAL_KNOWLEDGE: roundMinutes(consumedByPart.GENERAL_KNOWLEDGE, config.MINUTES_ROUNDING)
    },
    reallocation_reason_by_part: reallocationReasonByPart,
    unused_minutes_by_part: {
      READING: roundMinutes(unusedMinutesByPart.READING, config.MINUTES_ROUNDING),
      LOGIC: roundMinutes(unusedMinutesByPart.LOGIC, config.MINUTES_ROUNDING),
      DRAWING: roundMinutes(unusedMinutesByPart.DRAWING, config.MINUTES_ROUNDING),
      MATH_PHYSICS: roundMinutes(unusedMinutesByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
      GENERAL_KNOWLEDGE: roundMinutes(unusedMinutesByPart.GENERAL_KNOWLEDGE, config.MINUTES_ROUNDING)
    }
  };

  sprintOutput.practice_blocks = practiceBlocksUnlocked ? buildPracticeBlocks(sprintOutput) : [];

  return {
    sprint: sprintOutput,
    consumedByPart,
    policyFeasibleForSprint,
    unusedMinutes: slack
  };
}

function buildConfigSummary(config: RoadmapConfig): ConfigSummary {
  return {
    SECTION_ORDER_MODE: config.SECTION_ORDER_MODE,
    ROADMAP_STRATEGY_MODE: config.ROADMAP_STRATEGY_MODE,
    UNTIMED_TEXT_MIN_PER_ITEM: config.UNTIMED_TEXT_MIN_PER_ITEM,
    BASE_MIN_PER_QUESTION: config.BASE_MIN_PER_QUESTION,
    PRACTICE_REVIEW_OVERHEAD_PCT: config.PRACTICE_REVIEW_OVERHEAD_PCT,
    SPRINT_BUFFER_PCT: config.SPRINT_BUFFER_PCT,
    LEVEL_TIME_MULTIPLIER: config.LEVEL_TIME_MULTIPLIER,
    LEVEL_LEARNING_SHARE: config.LEVEL_LEARNING_SHARE,
    allocation: {
      BASELINE_PART_SHARE: config.BASELINE_PART_SHARE,
      ALLOC_GAP_WEIGHT: config.ALLOC_GAP_WEIGHT,
      ALLOC_BACKLOG_WEIGHT: config.ALLOC_BACKLOG_WEIGHT,
      MIN_PART_SHARE: config.MIN_PART_SHARE,
      MAX_PART_SHARE: config.MAX_PART_SHARE,
      MAX_SHARE_CHANGE_PER_SPRINT: config.MAX_SHARE_CHANGE_PER_SPRINT
    },
    final_phase: {
      FINAL_PRACTICE_WEEKS: config.FINAL_PRACTICE_WEEKS,
      FINAL_PHASE_LEARNING_MULTIPLIER: config.FINAL_PHASE_LEARNING_MULTIPLIER,
      ALLOW_NEW_LEARNING_IN_FINAL_PHASE: config.ALLOW_NEW_LEARNING_IN_FINAL_PHASE
    },
    fill_policy: {
      MAX_UNUSED_PCT: config.MAX_UNUSED_PCT,
      REDISTRIBUTION_QUANTUM_MIN: config.REDISTRIBUTION_QUANTUM_MIN,
      ENABLE_RETAKES: config.ENABLE_RETAKES
    },
    chunking: {
      MIN_ITEM_TOTAL_MIN: config.MIN_ITEM_TOTAL_MIN,
      MIN_LEARNING_BLOCK_MIN: config.MIN_LEARNING_BLOCK_MIN,
      MIN_PRACTICE_BLOCK_Q: config.MIN_PRACTICE_BLOCK_Q,
      PREFER_UNSPLIT_MODULES: config.PREFER_UNSPLIT_MODULES,
      UNSPLIT_MODULE_MAX_MIN: config.UNSPLIT_MODULE_MAX_MIN,
      MAX_MODULE_CHUNKS: config.MAX_MODULE_CHUNKS,
      MIN_CHUNK_MIN: config.MIN_CHUNK_MIN
    },
    section_priority: {
      HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT: config.HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT,
      HISTORY_ART_ALLOW_INTRO_SCAFFOLDING: config.HISTORY_ART_ALLOW_INTRO_SCAFFOLDING
    },
    checkpoint: {
      CHECKPOINT_PREFERRED_Q: config.CHECKPOINT_PREFERRED_Q,
      CHECKPOINT_MIN_QUESTIONS_PER_PART: config.CHECKPOINT_MIN_QUESTIONS_PER_PART
    },
    hours_policy: {
      HOURS_ROUNDING_STEP: config.HOURS_ROUNDING_STEP,
      MAX_OPTIMAL_HOURS_PER_WEEK: config.MAX_OPTIMAL_HOURS_PER_WEEK,
      USE_INPUT_HOURS_IF_PROVIDED: config.USE_INPUT_HOURS_IF_PROVIDED,
      ENFORCE_FILL_TO_PLAN_IN_V3: config.ENFORCE_FILL_TO_PLAN_IN_V3,
      RETAKES_ONLY_AFTER_CORE_COMPLETE: config.RETAKES_ONLY_AFTER_CORE_COMPLETE,
      RETAKES_GLOBAL_CORE_PROGRESS_PCT: config.RETAKES_GLOBAL_CORE_PROGRESS_PCT,
      RETAKES_FINAL_PHASE_ONLY: config.RETAKES_FINAL_PHASE_ONLY,
      HIGH_LEVEL_REVIEW_BUFFER_PCT: config.HIGH_LEVEL_REVIEW_BUFFER_PCT
    }
  };
}

function buildFocusReason(
  part: ExamPart,
  context: PlanningContext,
  initialRemByPart: Record<ExamPart, number>,
  config: RoadmapConfig,
  sprintSkeletons: SprintSkeleton[]
): string[] {
  const reasons: string[] = [];
  const partState = context.parts[part];
  const gap = computeGap(partState.partLevel, config.TARGET_LEVEL_FOR_GAP);
  if (gap > 0.5) {
    reasons.push('low_level_gap');
  }

  const totalRem = PART_DISPLAY_ORDER.reduce((acc, p) => acc + initialRemByPart[p], 0);
  const backlogShare = totalRem > 0 ? initialRemByPart[part] / totalRem : 0;
  if (backlogShare > config.BASELINE_PART_SHARE) {
    reasons.push('large_backlog');
  }

  if (sprintSkeletons.some((sprint) => sprint.isFinalPhase)) {
    reasons.push('final_phase_practice');
  }

  return reasons;
}

function formatHoursRu(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

function isRemainingEffectivelyZero(
  remainingByPart: Record<ExamPart, number>,
  config: RoadmapConfig
): boolean {
  return PART_DISPLAY_ORDER.every(
    (part) => roundMinutes(remainingByPart[part], config.MINUTES_ROUNDING) === 0
  );
}

function applyModuleChunkLabels(sprints: SprintOutput[], config: RoadmapConfig): void {
  const byModule = new Map<string, SprintItem[]>();

  sprints.forEach((sprint) => {
    sprint.items.forEach((item) => {
      const key = `${normalizeTitle(item.section_title)}::${normalizeTitle(item.submodule_name)}`;
      const items = byModule.get(key) || [];
      items.push(item);
      byModule.set(key, items);
    });
  });

  byModule.forEach((items) => {
    const coreProgressItems = items.filter((item) => {
      if (item.is_partial) return true;
      if (item.planned_learning_minutes > 0) return true;
      if (item.planned_practice_questions_unique > 0) return true;
      return (
        item.remaining_after_sprint.learning_minutes_remaining > 0 ||
        item.remaining_after_sprint.questions_remaining_unique > 0
      );
    });

    if (coreProgressItems.length <= 1) return;

    let chunkCount = Math.max(
      1,
      Math.min(coreProgressItems.length, Math.max(1, config.MAX_MODULE_CHUNKS))
    );

    const buildGroups = (count: number): Array<{ totalMin: number; items: SprintItem[] }> => {
      const groups = Array.from({ length: count }, () => ({ totalMin: 0, items: [] as SprintItem[] }));
      coreProgressItems.forEach((item, index) => {
        const groupIndex = Math.floor((index * count) / coreProgressItems.length);
        groups[groupIndex].totalMin += item.total_minutes_est;
        groups[groupIndex].items.push(item);
      });
      return groups;
    };

    while (chunkCount > 1) {
      const groups = buildGroups(chunkCount);
      const hasTinyChunk = groups.some(
        (group) => group.items.length > 0 && group.totalMin + 1e-9 < config.MIN_CHUNK_MIN
      );
      if (!hasTinyChunk) {
        break;
      }
      chunkCount -= 1;
    }

    if (chunkCount <= 1) return;

    coreProgressItems.forEach((item, index) => {
      const chunkIndex = Math.floor((index * chunkCount) / coreProgressItems.length);
      item.module_chunk_label = `part ${chunkIndex + 1}/${chunkCount}`;
    });
  });
}

function buildPracticeBlocks(sprint: SprintOutput): SprintPracticeBlock[] {
  const practiced = sprint.items
    .map((item) => {
      const qTotal = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
      return { item, qTotal };
    })
    .filter((entry) => entry.qTotal > 0)
    .sort((a, b) => {
      if (b.qTotal !== a.qTotal) return b.qTotal - a.qTotal;
      if (a.item.section_title !== b.item.section_title) {
        return a.item.section_title.localeCompare(b.item.section_title);
      }
      return a.item.submodule_name.localeCompare(b.item.submodule_name);
    });

  if (practiced.length === 0) return [];

  const totalQ = practiced.reduce((acc, entry) => acc + entry.qTotal, 0);
  const totalRetakeQ = practiced.reduce(
    (acc, entry) => acc + entry.item.planned_practice_questions_retake,
    0
  );
  const highPriority = practiced.filter((entry) => entry.item.exercise_priority === 'high');

  const collectParts = (entries: Array<{ item: SprintItem; qTotal: number }>): ExamPart[] => {
    const seen = new Set<ExamPart>();
    const parts: ExamPart[] = [];
    entries.forEach((entry) => {
      if (seen.has(entry.item.exam_part)) return;
      seen.add(entry.item.exam_part);
      parts.push(entry.item.exam_part);
    });
    return parts.slice(0, 3);
  };

  const collectModules = (entries: Array<{ item: SprintItem; qTotal: number }>): string[] =>
    entries
      .slice(0, 4)
      .map((entry) => `${entry.item.section_title} -> ${entry.item.submodule_name}`);

  const blocks: SprintPracticeBlock[] = [];
  if (highPriority.length > 0) {
    blocks.push({
      block_type: 'weak_area_review',
      target_parts: collectParts(highPriority),
      source_modules: collectModules(highPriority),
      questions_range:
        formatQuestionsRange(highPriority.reduce((acc, entry) => acc + entry.qTotal, 0)) || '8-16'
    });
  }

  if (totalQ >= 10) {
    blocks.push({
      block_type: 'exam_10q',
      target_parts: collectParts(practiced),
      source_modules: collectModules(practiced),
      questions_range: `${Math.min(10, totalQ)}-${Math.min(20, totalQ)}`
    });
  }

  if (totalRetakeQ >= 40 || totalQ >= 60) {
    const maxQ = Math.min(70, totalQ);
    const minQ = Math.min(45, maxQ);
    if (maxQ >= minQ) {
      blocks.push({
        block_type: 'full_mock_50q',
        target_parts: collectParts(practiced),
        source_modules: collectModules(practiced),
        questions_range: `${minQ}-${maxQ}`
      });
    }
  }

  return blocks;
}

function buildSprintSummaryRu(sprint: SprintOutput): string {
  const lines: string[] = [];
  lines.push(`Sprint ${sprint.sprint_number} Что изучаем (≈${formatHoursRu(sprint.totals.planned_minutes_sum)} ч):`);
  lines.push('');

  if (sprint.items.length === 0) {
    lines.push('  План завершен: новых модулей в этом спринте нет.');
    lines.push('');
    lines.push('Практика: ~0 вопросов, ~0 untimed items.');
    return lines.join('\n');
  }

  let totalQuestions = 0;
  let totalUntimed = 0;

  sprint.items.forEach((item) => {
    const qTotal = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
    totalQuestions += qTotal;
    totalUntimed += item.planned_untimed_items || 0;
    const questionText = item.planned_practice_questions_range
      ? `${item.planned_practice_questions_range} questions`
      : `${qTotal} questions`;
    const chunkLabel = item.module_chunk_label ? ` — ${item.module_chunk_label}` : '';
    const untimedLabel = (item.planned_untimed_items || 0) > 0 ? `, ${item.planned_untimed_items} untimed` : '';
    lines.push(
      `  ${item.section_title} → ${item.submodule_name}${chunkLabel} — ≈${formatHoursRu(item.total_minutes_est)} ч (${questionText}${untimedLabel})`
    );
  });

  const totalQuestionRange = formatQuestionsRange(totalQuestions) || `${totalQuestions}`;
  lines.push('');
  lines.push(`Практика: ~${totalQuestionRange} вопросов, ~${totalUntimed} untimed items.`);

  if ((sprint.practice_blocks || []).length > 0) {
    lines.push('');
    lines.push('Блоки практики:');
    sprint.practice_blocks!.forEach((block) => {
      const parts = block.target_parts.join(', ');
      lines.push(`  ${block.block_type} — ${block.questions_range} questions (${parts})`);
    });
  }
  return lines.join('\n');
}

function generateRoadmapForMode(
  mode: GeneratedMode,
  baseSections: BaseSection[],
  selection: SelectionResult,
  config: RoadmapConfig,
  input: RoadmapGeneratorInput,
  hoursPerWeekUsed: number,
  optimalHoursPerWeek: number,
  manualHoursOverrideApplied: boolean,
  requiredMinutesDueToCapProfile: number,
  sprintSkeletons: SprintSkeleton[],
  feasibility: FeasibilityData,
  requiredByPartFull: Record<ExamPart, number>,
  baseWarnings: RoadmapWarning[]
): CanonicalRoadmapOutput {
  const context = buildPartsFromSelection(baseSections, selection, config, requiredByPartFull);
  const checkpointLookup = parseCheckpointHistory(input.checkpoint_history).lookup;

  const sprints: SprintOutput[] = [];
  const allocatedByPart: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };
  const unusedMinutesBySprint: number[] = [];
  let policyFeasible = feasibility.policyFeasible;

  const initialRemByPart = getRemainingByPart(context.parts);

  sprintSkeletons.forEach((skeleton) => {
    const { sprint, consumedByPart, policyFeasibleForSprint, unusedMinutes } = scheduleSprint(
      context,
      skeleton,
      checkpointLookup
    );
    sprints.push(sprint);
    unusedMinutesBySprint.push(unusedMinutes);
    if (!policyFeasibleForSprint) {
      policyFeasible = false;
    }

    PART_DISPLAY_ORDER.forEach((part) => {
      allocatedByPart[part] += consumedByPart[part];
    });
  });

  applyModuleChunkLabels(sprints, config);
  sprints.forEach((sprint) => {
    sprint.sprint_summary_ru = buildSprintSummaryRu(sprint);
  });

  const remainingByPart = getRemainingByPart(context.parts);
  const remainingCoreTotal = PART_DISPLAY_ORDER.reduce(
    (acc, part) => acc + remainingByPart[part],
    0
  );
  const coverageComplete =
    remainingCoreTotal <= 1e-9 || isRemainingEffectivelyZero(remainingByPart, config);
  if (coverageComplete) {
    policyFeasible = true;
  }

  const warnings = [...baseWarnings, ...context.warnings];

  if (mode === 'minimal' && selection.minimalInfeasible) {
    warnings.push({ type: 'minimal_infeasible', message: 'Mandatory minimal set exceeds capacity.' });
  }

  const allocatedTotal = PART_DISPLAY_ORDER.reduce((acc, part) => acc + allocatedByPart[part], 0);

  const examPartSummary: ExamPartSummaryItem[] = PART_DISPLAY_ORDER.map((part) => {
    const mappedSections = context.parts[part].sections.map((section) => section.title);
    const allocatedMinutesPlan = roundMinutes(allocatedByPart[part], config.MINUTES_ROUNDING);
    const allocatedShareAvg =
      feasibility.availableMinutesPlanning > 0
        ? allocatedByPart[part] / feasibility.availableMinutesPlanning
        : 0;

    return {
      exam_part: part,
      mapped_sections: mappedSections,
      part_level: context.parts[part].partLevel,
      required_minutes_full: roundMinutes(requiredByPartFull[part], config.MINUTES_ROUNDING),
      allocated_minutes_plan: allocatedMinutesPlan,
      allocated_share_avg: Number(allocatedShareAvg.toFixed(4)),
      focus_reason: buildFocusReason(part, context, initialRemByPart, config, sprintSkeletons)
    };
  });

  let feasibilityNotes = [...feasibility.notes, ...selection.notes];
  if (manualHoursOverrideApplied) {
    feasibilityNotes.push(
      `Manual hours override is active; schedule uses ${hoursPerWeekUsed.toFixed(1)} h/week instead of derived optimal.`
    );
  }
  const unusedMinutesTotal = unusedMinutesBySprint.reduce((acc, value) => acc + value, 0);
  const completedEarly = coverageComplete && unusedMinutesTotal > 0;
  const optimalHoursReported = manualHoursOverrideApplied
    ? Number(optimalHoursPerWeek.toFixed(1))
    : Number(hoursPerWeekUsed.toFixed(1));

  if (!config.ENFORCE_FILL_TO_PLAN_IN_V3 && coverageComplete) {
    feasibilityNotes = feasibilityNotes.filter(
      (note) => !/(infeasible|prevent full coverage|unable to)/i.test(note)
    );
  }

  if (!policyFeasible && config.ENFORCE_FILL_TO_PLAN_IN_V3) {
    feasibilityNotes.push('Could not fully satisfy fill-to-plan invariant with remaining schedulable work.');
  } else if (completedEarly) {
    feasibilityNotes.push('Coverage completed early; remaining unused minutes are intentional.');
  }

  const output: CanonicalRoadmapOutput = {
    metadata: {
      weeks_to_exam: input.weeks_to_exam,
      hours_per_week: hoursPerWeekUsed,
      optimal_hours_per_week: optimalHoursReported,
      optimal_hours_source: 'derived_from_material_and_caps',
      manual_hours_override_applied: manualHoursOverrideApplied,
      required_core_minutes_total: roundMinutes(
        feasibility.requiredMinutesFullCoverage,
        config.MINUTES_ROUNDING
      ),
      required_minutes_due_to_cap_profile: roundMinutes(
        requiredMinutesDueToCapProfile,
        config.MINUTES_ROUNDING
      ),
      final_hours_rounding_step: config.HOURS_ROUNDING_STEP,
      sprint_length_weeks_default: 2,
      generated_mode: mode,
      feasibility: {
        available_minutes_total: roundMinutes(feasibility.availableMinutesTotal, config.MINUTES_ROUNDING),
        available_minutes_planning: roundMinutes(
          feasibility.availableMinutesPlanning,
          config.MINUTES_ROUNDING
        ),
        required_minutes_full_coverage: roundMinutes(
          feasibility.requiredMinutesFullCoverage,
          config.MINUTES_ROUNDING
        ),
        cap_scope: 'all_minutes',
        cap_infeasible: feasibility.capInfeasible,
        overall_infeasible: feasibility.timeInfeasible,
        time_infeasible: feasibility.timeInfeasible,
        cap_infeasible_by_part: {
          READING: feasibility.capInfeasibleByPart.READING,
          LOGIC: feasibility.capInfeasibleByPart.LOGIC,
          DRAWING: feasibility.capInfeasibleByPart.DRAWING,
          MATH_PHYSICS: feasibility.capInfeasibleByPart.MATH_PHYSICS,
          GENERAL_KNOWLEDGE: feasibility.capInfeasibleByPart.GENERAL_KNOWLEDGE
        },
        max_minutes_allowed_by_cap_by_part: {
          READING: roundMinutes(feasibility.maxMinutesAllowedByCapByPart.READING, config.MINUTES_ROUNDING),
          LOGIC: roundMinutes(feasibility.maxMinutesAllowedByCapByPart.LOGIC, config.MINUTES_ROUNDING),
          DRAWING: roundMinutes(feasibility.maxMinutesAllowedByCapByPart.DRAWING, config.MINUTES_ROUNDING),
          MATH_PHYSICS: roundMinutes(feasibility.maxMinutesAllowedByCapByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
          GENERAL_KNOWLEDGE: roundMinutes(feasibility.maxMinutesAllowedByCapByPart.GENERAL_KNOWLEDGE, config.MINUTES_ROUNDING)
        },
        shortfall_due_to_cap_by_part: {
          READING: roundMinutes(feasibility.shortfallDueToCapByPart.READING, config.MINUTES_ROUNDING),
          LOGIC: roundMinutes(feasibility.shortfallDueToCapByPart.LOGIC, config.MINUTES_ROUNDING),
          DRAWING: roundMinutes(feasibility.shortfallDueToCapByPart.DRAWING, config.MINUTES_ROUNDING),
          MATH_PHYSICS: roundMinutes(feasibility.shortfallDueToCapByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
          GENERAL_KNOWLEDGE: roundMinutes(feasibility.shortfallDueToCapByPart.GENERAL_KNOWLEDGE, config.MINUTES_ROUNDING)
        },
        policy_feasible: policyFeasible,
        notes: feasibilityNotes
      },
      config_used: buildConfigSummary(config),
      warnings,
      unused_minutes_total: roundMinutes(unusedMinutesTotal, config.MINUTES_ROUNDING),
      unused_minutes_by_sprint: unusedMinutesBySprint.map((value) =>
        roundMinutes(value, config.MINUTES_ROUNDING)
      )
    },

    exam_parts_summary: examPartSummary,
    sprints,

    end_state: {
      remaining_backlog_minutes_by_exam_part: {
        READING: roundMinutes(remainingByPart.READING, config.MINUTES_ROUNDING),
        LOGIC: roundMinutes(remainingByPart.LOGIC, config.MINUTES_ROUNDING),
        DRAWING: roundMinutes(remainingByPart.DRAWING, config.MINUTES_ROUNDING),
        MATH_PHYSICS: roundMinutes(remainingByPart.MATH_PHYSICS, config.MINUTES_ROUNDING),
        GENERAL_KNOWLEDGE: roundMinutes(
          remainingByPart.GENERAL_KNOWLEDGE,
          config.MINUTES_ROUNDING
        )
      }
    }
  };

  // Ensure deterministic key ordering in warnings with repeated values.
  output.metadata.warnings = stableSortBy(output.metadata.warnings, (a, b) => {
    const aType = a.type || '';
    const bType = b.type || '';
    if (aType !== bType) return aType.localeCompare(bType);
    const aSection = a.section_title || '';
    const bSection = b.section_title || '';
    return aSection.localeCompare(bSection);
  });

  // Keep numbers from floating drift concise in summary fields.
  output.exam_parts_summary = output.exam_parts_summary.map((summary) => ({
    ...summary,
    allocated_share_avg: Number(summary.allocated_share_avg.toFixed(4)),
    allocated_minutes_plan:
      allocatedTotal > 0 ? summary.allocated_minutes_plan : summary.allocated_minutes_plan
  }));

  return output;
}

export function generateRoadmaps(input: RoadmapGeneratorInput): RoadmapGenerationResult {
  const warnings: RoadmapWarning[] = [];
  const config = deepMergeConfig(DEFAULT_ROADMAP_CONFIG, input.config_overrides);

  const validation = validateRoadmapInput(input, config);
  if (validation.errors.length > 0) {
    throw new Error(`Roadmap generator validation failed: ${validation.errors.join('; ')}`);
  }
  warnings.push(...validation.warnings);

  const knownSections = input.course_modular_overview.sections.map((section) => section.title);
  const normalizedLevels = normalizeLevels(input.levels_by_section, knownSections, config, warnings);

  const baseSections = buildBaseSections(
    input.course_modular_overview.sections,
    normalizedLevels,
    config,
    warnings
  );

  const requiredByPartFull: Record<ExamPart, number> = {
    READING: 0,
    LOGIC: 0,
    DRAWING: 0,
    MATH_PHYSICS: 0,
    GENERAL_KNOWLEDGE: 0
  };

  baseSections.forEach((section) => {
    requiredByPartFull[section.examPart] += section.sectionTotalFull;
  });

  const requiredMinutesFullCoverage = PART_DISPLAY_ORDER.reduce(
    (acc, part) => acc + requiredByPartFull[part],
    0
  );

  const requiredMinutesDueToCapProfile = PART_DISPLAY_ORDER.reduce((acc, part) => {
    if (requiredByPartFull[part] <= 0) return acc;
    return Math.max(acc, requiredByPartFull[part] / Math.max(config.MAX_PART_SHARE, 0.000001));
  }, 0);
  const highLevelNonFillMode = isHighLevelV4(config) && !config.ENFORCE_FILL_TO_PLAN_IN_V3;
  const requiredPlanningMinutes = highLevelNonFillMode
    ? requiredMinutesFullCoverage * (1 + config.HIGH_LEVEL_REVIEW_BUFFER_PCT)
    : config.ENFORCE_FILL_TO_PLAN_IN_V3
      ? Math.max(requiredMinutesFullCoverage, requiredMinutesDueToCapProfile)
      : requiredMinutesFullCoverage;

  const denominator =
    input.weeks_to_exam * 60 * Math.max(1 - config.SPRINT_BUFFER_PCT, 0.000001);
  const optimalHoursRaw = denominator > 0 ? requiredPlanningMinutes / denominator : 0;
  const optimalHoursPerWeek = ceilToStep(
    optimalHoursRaw,
    Math.max(config.HOURS_ROUNDING_STEP, 0.1)
  );

  const manualHoursOverrideApplied =
    config.USE_INPUT_HOURS_IF_PROVIDED &&
    input.hours_per_week !== undefined &&
    Number.isFinite(input.hours_per_week) &&
    input.hours_per_week > 0;

  let hoursPerWeekUsed = manualHoursOverrideApplied ? input.hours_per_week! : optimalHoursPerWeek;
  hoursPerWeekUsed = ceilToStep(hoursPerWeekUsed, Math.max(config.HOURS_ROUNDING_STEP, 0.1));

  const fullSelection = getInitialSelection(baseSections);
  const runAtHours = (hours: number): CanonicalRoadmapOutput => {
    const sprintSkeletons = buildSprintSkeletons(input.weeks_to_exam, hours, config);
    const feasibility = computeFeasibility(
      input.weeks_to_exam,
      hours,
      config,
      requiredByPartFull,
      requiredMinutesFullCoverage,
      sprintSkeletons
    );

    return generateRoadmapForMode(
      'full',
      baseSections,
      fullSelection,
      config,
      input,
      hours,
      optimalHoursPerWeek,
      manualHoursOverrideApplied,
      requiredMinutesDueToCapProfile,
      sprintSkeletons,
      feasibility,
      requiredByPartFull,
      warnings
    );
  };

  const getRemainingCoreMinutes = (roadmapOutput: CanonicalRoadmapOutput): number =>
    PART_DISPLAY_ORDER.reduce(
      (acc, part) => acc + roadmapOutput.end_state.remaining_backlog_minutes_by_exam_part[part],
      0
    );

  const hasExcessiveEarlyUnused = (roadmapOutput: CanonicalRoadmapOutput): boolean => {
    if (roadmapOutput.sprints.length === 0) return false;
    const earlyCount = Math.max(1, Math.ceil(roadmapOutput.sprints.length / 2));
    const earlySprints = roadmapOutput.sprints.slice(0, earlyCount);
    const avgUnusedRatio =
      earlySprints.reduce(
        (acc, sprint) => acc + sprint.totals.unused_minutes / Math.max(sprint.planning_minutes, 1),
        0
      ) / earlySprints.length;
    return avgUnusedRatio > 0.18;
  };

  let roadmap: CanonicalRoadmapOutput | null = runAtHours(hoursPerWeekUsed);
  let safetyCounter = 0;

  while (!manualHoursOverrideApplied && getRemainingCoreMinutes(roadmap) > 0 && safetyCounter < 500) {
    safetyCounter += 1;
    hoursPerWeekUsed = ceilToStep(
      hoursPerWeekUsed + config.HOURS_ROUNDING_STEP,
      Math.max(config.HOURS_ROUNDING_STEP, 0.1)
    );

    if (hoursPerWeekUsed > config.MAX_OPTIMAL_HOURS_PER_WEEK) {
      throw new Error(
        `Unable to generate full-coverage roadmap within safety bound ${config.MAX_OPTIMAL_HOURS_PER_WEEK}h/week.`
      );
    }

    roadmap = runAtHours(hoursPerWeekUsed);
  }

  if (!manualHoursOverrideApplied && roadmap && getRemainingCoreMinutes(roadmap) > 0) {
    throw new Error(
      `Unable to generate full-coverage roadmap within safety bound ${config.MAX_OPTIMAL_HOURS_PER_WEEK}h/week.`
    );
  }

  if (!manualHoursOverrideApplied && isHighLevelV4(config) && roadmap && getRemainingCoreMinutes(roadmap) <= 0) {
    if (hasExcessiveEarlyUnused(roadmap)) {
      while (true) {
        const nextHours = ceilToStep(
          hoursPerWeekUsed - config.HOURS_ROUNDING_STEP,
          Math.max(config.HOURS_ROUNDING_STEP, 0.1)
        );
        if (nextHours <= 0 || nextHours >= hoursPerWeekUsed) break;
        const candidate = runAtHours(nextHours);
        if (getRemainingCoreMinutes(candidate) > 0) break;
        hoursPerWeekUsed = nextHours;
        roadmap = candidate;
      }
    }
  }

  if (!roadmap) {
    throw new Error('Roadmap generation failed: no roadmap produced.');
  }

  return {
    roadmaps: [roadmap],
    effective_config: config
  };
}
