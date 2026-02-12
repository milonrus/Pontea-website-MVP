import {
  CanonicalRoadmapOutput,
  ExamPart,
  SprintCheckpointByPart,
  SprintItem,
  SprintOutput
} from '@/lib/roadmap-generator/types';
import {
  VisualCheckpoint,
  VisualHeroModule,
  VisualPhase,
  VisualPhaseId,
  VisualRoadmap,
  VisualSprint
} from '@/components/admin/roadmap/types';

export const ROADMAP_PHASES: Array<{ id: VisualPhaseId; label: string; subtitle: string }> = [
  {
    id: 'launch',
    label: 'Launch',
    subtitle: 'Build confidence with broad foundations and starter checkpoints.'
  },
  {
    id: 'build',
    label: 'Build',
    subtitle: 'Deepen heavier subjects and convert theory into timed practice.'
  },
  {
    id: 'focus',
    label: 'Focus',
    subtitle: 'Concentrate effort where remaining gaps are most visible.'
  },
  {
    id: 'final',
    label: 'Final',
    subtitle: 'Polish with mixed sets, retakes, and exam-day pacing.'
  }
];

const FALLBACK_EXAM_PART_ORDER: ExamPart[] = [
  'READING',
  'LOGIC',
  'DRAWING',
  'MATH_PHYSICS',
  'GENERAL_KNOWLEDGE'
];

const toOneDecimal = (value: number) => Number(value.toFixed(1));

const toHours = (minutes: number): number => toOneDecimal(minutes / 60);

const summarizeGoal = (goal: string): string => {
  const text = goal.trim();
  if (!text) return 'Keep momentum with balanced practice.';
  const firstSentence = text.split('. ')[0]?.trim();
  const candidate = firstSentence && firstSentence.length > 0 ? firstSentence : text;
  if (candidate.length <= 135) return candidate;
  return `${candidate.slice(0, 132).trimEnd()}...`;
};

const formatExamPart = (part: ExamPart): string =>
  part
    .split('_')
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');

const derivePhaseId = (sprintNumber: number, totalSprints: number): VisualPhaseId => {
  if (totalSprints >= 10) {
    if (sprintNumber <= 3) return 'launch';
    if (sprintNumber <= 6) return 'build';
    if (sprintNumber <= 8) return 'focus';
    return 'final';
  }

  if (totalSprints <= 1) return 'final';

  const q1 = Math.max(1, Math.ceil(totalSprints * 0.3));
  const q2 = Math.max(q1 + 1, Math.ceil(totalSprints * 0.6));
  const q3 = Math.max(q2 + 1, Math.ceil(totalSprints * 0.8));

  if (sprintNumber <= q1) return 'launch';
  if (sprintNumber <= q2) return 'build';
  if (sprintNumber <= q3) return 'focus';
  return 'final';
};

const phaseMetaById = ROADMAP_PHASES.reduce(
  (acc, phase) => {
    acc[phase.id] = phase;
    return acc;
  },
  {} as Record<VisualPhaseId, (typeof ROADMAP_PHASES)[number]>
);

const isCoreItem = (item: SprintItem): boolean =>
  item.planned_learning_minutes > 0 ||
  item.planned_practice_questions_unique > 0 ||
  (item.planned_untimed_items || 0) > 0;

const pickCheckpoint = (sprint: SprintOutput, fallbackPart: ExamPart): VisualCheckpoint => {
  const checkpoints = sprint.checkpoint?.definition_by_part || [];
  const preferred =
    checkpoints.find((checkpoint) => checkpoint.checkpoint_type !== 'time_drill' && checkpoint.checkpoint_questions > 0) ||
    checkpoints.find((checkpoint) => checkpoint.checkpoint_questions > 0) ||
    checkpoints[0] ||
    null;

  if (!preferred) {
    return {
      examPart: fallbackPart,
      type: 'time_drill',
      label: `${formatExamPart(fallbackPart)} pulse check`,
      detail: 'Timed drill',
      targetText: 'Target: 70% accuracy',
      questions: 0
    };
  }

  const type = preferred.checkpoint_type || 'single';
  const questionLabel = preferred.checkpoint_questions > 0 ? `${preferred.checkpoint_questions}Q` : 'Timed drill';

  let detail = '';
  if (type === 'time_drill') {
    detail = `${preferred.timed_drill_minutes || 25} min timed drill`;
  } else if (type === 'mixed') {
    const mixedSize = preferred.source_items_mixed?.length || 0;
    detail = mixedSize > 1 ? `${questionLabel} mixed set across ${mixedSize} modules` : `${questionLabel} mixed set`;
  } else {
    detail = `${questionLabel} from ${preferred.source_item.submodule_name}`;
  }

  return {
    examPart: preferred.exam_part,
    type,
    label: `${formatExamPart(preferred.exam_part)} checkpoint`,
    detail,
    targetText: `Target: ${Math.round(preferred.target_metrics.accuracy * 100)}% at ${preferred.target_metrics.avg_time_per_question_min} min/Q`,
    questions: preferred.checkpoint_questions
  };
};

const mapHeroItem = (item: SprintItem | null): VisualHeroModule | null => {
  if (!item) return null;

  const questionCount = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
  return {
    examPart: item.exam_part,
    sectionTitle: item.section_title,
    submoduleName: item.submodule_name,
    chunkLabel: item.module_chunk_label,
    totalMinutes: item.total_minutes_est,
    questionCount,
    questionRange: item.planned_practice_questions_range,
    isRetakeOnly:
      item.planned_practice_questions_retake > 0 &&
      item.planned_practice_questions_unique === 0 &&
      item.planned_learning_minutes === 0
  };
};

const pickHeroItem = (items: SprintItem[]): SprintItem | null => {
  if (items.length === 0) return null;

  const sorted = items
    .slice()
    .sort((a, b) => {
      const coreDelta = Number(isCoreItem(b)) - Number(isCoreItem(a));
      if (coreDelta !== 0) return coreDelta;

      if (b.total_minutes_est !== a.total_minutes_est) {
        return b.total_minutes_est - a.total_minutes_est;
      }

      const bQuestions = b.planned_practice_questions_unique + b.planned_practice_questions_retake;
      const aQuestions = a.planned_practice_questions_unique + a.planned_practice_questions_retake;
      return bQuestions - aQuestions;
    });

  return sorted[0] || null;
};

const deriveWorkload = (sprint: SprintOutput): 'high' | 'medium' | 'light' => {
  if (sprint.totals.planned_utilization_pct >= 0.8 || sprint.totals.planned_minutes_sum >= 1200) return 'high';
  if (sprint.totals.planned_utilization_pct >= 0.5 || sprint.totals.planned_minutes_sum >= 700) return 'medium';
  return 'light';
};

const buildPartMinutes = (sprint: SprintOutput, examParts: ExamPart[]): Record<ExamPart, number> => {
  const source = sprint.part_executed_minutes || sprint.part_budgets_minutes || ({} as Record<ExamPart, number>);

  return examParts.reduce((acc, part) => {
    acc[part] = source[part] || 0;
    return acc;
  }, {} as Record<ExamPart, number>);
};

const buildVisualSprint = (sprint: SprintOutput, totalSprints: number, examParts: ExamPart[]): VisualSprint => {
  const phaseId = derivePhaseId(sprint.sprint_number, totalSprints);
  const phaseMeta = phaseMetaById[phaseId];
  const heroItem = pickHeroItem(sprint.items);
  const fallbackPart = sprint.focus_exam_parts_ranked[0] || examParts[0] || 'READING';

  const hasCoreWork = sprint.items.some(isCoreItem);
  const isFlexSprint = !hasCoreWork;

  return {
    sprintNumber: sprint.sprint_number,
    weekStartIndex: sprint.week_start_index,
    weekEndIndex: sprint.week_end_index,
    weekLabel: `Weeks ${sprint.week_start_index}-${sprint.week_end_index}`,
    phaseId,
    phaseLabel: phaseMeta.label,
    goal: sprint.sprint_goal,
    goalShort: summarizeGoal(sprint.sprint_goal),
    focusExamParts: sprint.focus_exam_parts_ranked,
    focusTop: sprint.focus_exam_parts_ranked.slice(0, 2),
    plannedMinutes: sprint.totals.planned_minutes_sum,
    plannedHours: toHours(sprint.totals.planned_minutes_sum),
    utilizationPct: sprint.totals.planned_utilization_pct,
    flexMinutes: sprint.totals.unused_minutes,
    flexHours: toHours(sprint.totals.unused_minutes),
    workload: deriveWorkload(sprint),
    checkpoint: pickCheckpoint(sprint, fallbackPart),
    heroModule: mapHeroItem(heroItem),
    isFlexSprint,
    itemCount: sprint.items.length,
    partMinutes: buildPartMinutes(sprint, examParts),
    source: sprint
  };
};

const pickDominantExamParts = (sprints: VisualSprint[], examParts: ExamPart[]): ExamPart[] => {
  const totals = examParts.reduce(
    (acc, part) => {
      acc[part] = 0;
      return acc;
    },
    {} as Record<ExamPart, number>
  );

  sprints.forEach((sprint) => {
    examParts.forEach((part) => {
      totals[part] += sprint.partMinutes[part] || 0;
    });
  });

  return examParts.slice().sort((a, b) => totals[b] - totals[a]).slice(0, 2);
};

const buildPhases = (sprints: VisualSprint[], examParts: ExamPart[]): VisualPhase[] => {
  return ROADMAP_PHASES.map((phase) => {
    const phaseSprints = sprints.filter((sprint) => sprint.phaseId === phase.id);
    const plannedMinutes = phaseSprints.reduce((acc, sprint) => acc + sprint.plannedMinutes, 0);
    const flexMinutes = phaseSprints.reduce((acc, sprint) => acc + sprint.flexMinutes, 0);

    return {
      id: phase.id,
      label: phase.label,
      subtitle: phase.subtitle,
      sprints: phaseSprints,
      plannedMinutes,
      plannedHours: toHours(plannedMinutes),
      flexMinutes,
      flexHours: toHours(flexMinutes),
      dominantExamParts: pickDominantExamParts(phaseSprints, examParts)
    };
  }).filter((phase) => phase.sprints.length > 0);
};

const resolveExamPartOrder = (roadmap: CanonicalRoadmapOutput): ExamPart[] => {
  const fromSummary = roadmap.exam_parts_summary.map((part) => part.exam_part);
  if (fromSummary.length > 0) return fromSummary;

  const fromSprints = roadmap.sprints[0]?.focus_exam_parts_ranked || [];
  if (fromSprints.length > 0) return fromSprints;

  return FALLBACK_EXAM_PART_ORDER;
};

export const buildVisualRoadmapModel = (roadmap: CanonicalRoadmapOutput): VisualRoadmap => {
  const examParts = resolveExamPartOrder(roadmap);
  const sprints = roadmap.sprints.map((sprint) => buildVisualSprint(sprint, roadmap.sprints.length, examParts));
  const totalPlannedMinutes = sprints.reduce((acc, sprint) => acc + sprint.plannedMinutes, 0);

  const flexMinutes =
    roadmap.metadata.unused_minutes_total ?? sprints.reduce((acc, sprint) => acc + sprint.flexMinutes, 0);

  const feasible = !roadmap.metadata.feasibility.overall_infeasible && roadmap.metadata.feasibility.policy_feasible;

  const maxPartMinutesInSprint = Math.max(
    1,
    ...sprints.flatMap((sprint) => examParts.map((part) => sprint.partMinutes[part] || 0))
  );

  return {
    source: roadmap,
    examParts,
    sprints,
    phases: buildPhases(sprints, examParts),
    snapshot: {
      weeksToExam: roadmap.metadata.weeks_to_exam,
      hoursPerWeek: roadmap.metadata.optimal_hours_per_week ?? roadmap.metadata.hours_per_week,
      sprintCount: roadmap.sprints.length,
      feasible,
      feasibleLabel: feasible ? 'Feasible plan' : 'Needs adjustment',
      totalPlannedMinutes,
      totalPlannedHours: toHours(totalPlannedMinutes),
      flexMinutes,
      flexHours: toHours(flexMinutes)
    },
    maxPartMinutesInSprint
  };
};

export const formatExamPartLabel = formatExamPart;

export const formatWorkloadLabel = (workload: VisualSprint['workload']): string => {
  if (workload === 'high') return 'High intensity';
  if (workload === 'medium') return 'Steady pace';
  return 'Light rhythm';
};

export const pickSprintCardTone = (workload: VisualSprint['workload']): string => {
  if (workload === 'high') return 'var(--roadmap-tone-strong)';
  if (workload === 'medium') return 'var(--roadmap-tone-mid)';
  return 'var(--roadmap-tone-soft)';
};

export const summarizeHero = (hero: VisualHeroModule | null): string => {
  if (!hero) return 'Flex sprint: optional review and rest space.';

  const questionText = hero.questionRange || (hero.questionCount > 0 ? `${hero.questionCount}` : '');
  const questionPart = questionText ? `, ${questionText}Q` : '';
  const chunkPart = hero.chunkLabel ? `, ${hero.chunkLabel}` : '';
  const retakePart = hero.isRetakeOnly ? ', retake focus' : '';
  return `${hero.sectionTitle} - ${hero.submoduleName} (${hero.totalMinutes} min${questionPart}${chunkPart}${retakePart})`;
};

export const checkpointSourceText = (checkpoint: SprintCheckpointByPart): string => {
  const type = checkpoint.checkpoint_type || 'single';
  if (type === 'time_drill') return `${checkpoint.timed_drill_minutes || 25} min timed drill`;

  if (type === 'mixed') {
    const mixedCount = checkpoint.source_items_mixed?.length || 0;
    return mixedCount > 1
      ? `${checkpoint.checkpoint_questions}Q mixed checkpoint across ${mixedCount} modules`
      : `${checkpoint.checkpoint_questions}Q mixed checkpoint`;
  }

  return `${checkpoint.checkpoint_questions}Q from ${checkpoint.source_item.submodule_name}`;
};
