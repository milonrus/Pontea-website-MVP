import { CanonicalRoadmapOutput, ExamPart, SprintCheckpointByPart, SprintItem, SprintOutput } from '@/lib/roadmap-generator/types';

export type RoadmapViewMode =
  | 'results_matrix'
  | 'rhythm_heatboard'
  | 'simple_modules'
  | 'command_center'
  | 'clean_sprint';

export type VisualPhaseId = 'launch' | 'build' | 'focus' | 'final';

export interface VisualCheckpoint {
  examPart: ExamPart;
  type: 'single' | 'mixed' | 'time_drill';
  label: string;
  detail: string;
  targetText: string;
  questions: number;
}

export interface VisualHeroModule {
  examPart: ExamPart;
  sectionTitle: string;
  submoduleName: string;
  chunkLabel?: string;
  totalMinutes: number;
  questionCount: number;
  questionRange?: string;
  isRetakeOnly: boolean;
}

export interface VisualSprint {
  sprintNumber: number;
  weekStartIndex: number;
  weekEndIndex: number;
  weekLabel: string;
  phaseId: VisualPhaseId;
  phaseLabel: string;
  goal: string;
  goalShort: string;
  focusExamParts: ExamPart[];
  focusTop: ExamPart[];
  plannedMinutes: number;
  plannedHours: number;
  utilizationPct: number;
  flexMinutes: number;
  flexHours: number;
  workload: 'high' | 'medium' | 'light';
  checkpoint: VisualCheckpoint;
  heroModule: VisualHeroModule | null;
  isFlexSprint: boolean;
  itemCount: number;
  partMinutes: Record<ExamPart, number>;
  source: SprintOutput;
}

export interface VisualPhase {
  id: VisualPhaseId;
  label: string;
  subtitle: string;
  sprints: VisualSprint[];
  plannedMinutes: number;
  plannedHours: number;
  flexMinutes: number;
  flexHours: number;
  dominantExamParts: ExamPart[];
}

export interface VisualSnapshot {
  weeksToExam: number;
  hoursPerWeek: number;
  sprintCount: number;
  feasible: boolean;
  feasibleLabel: string;
  totalPlannedMinutes: number;
  totalPlannedHours: number;
  flexMinutes: number;
  flexHours: number;
}

export interface VisualRoadmap {
  source: CanonicalRoadmapOutput;
  examParts: ExamPart[];
  sprints: VisualSprint[];
  phases: VisualPhase[];
  snapshot: VisualSnapshot;
  maxPartMinutesInSprint: number;
}

export type CheckpointPicker = SprintCheckpointByPart | null;
export type HeroItemPicker = SprintItem | null;
