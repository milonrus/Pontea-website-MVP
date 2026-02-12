import { VisualRoadmap } from '@/components/admin/roadmap/types';

export interface VisualRoadmapViewProps {
  roadmap: VisualRoadmap;
  expandedSprint: number | null;
  onToggleSprint: (sprintNumber: number) => void;
}
