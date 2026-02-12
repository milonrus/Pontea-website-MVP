import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Compass, Gauge, Sparkles, TimerReset, Trophy } from 'lucide-react';
import { VisualRoadmap, VisualSprint } from '@/components/admin/roadmap/types';
import { formatExamPartLabel, formatWorkloadLabel, summarizeHero } from '@/components/admin/roadmap/model';

interface SnapshotStripProps {
  roadmap: VisualRoadmap;
  className?: string;
  metricClassName?: string;
}

interface SprintDetailsPanelProps {
  sprint: VisualSprint;
  expanded: boolean;
  onToggle: () => void;
  buttonClassName?: string;
  panelClassName?: string;
}

const formatPct = (value: number): string => `${Math.round(value * 100)}%`;

export const SnapshotStrip: React.FC<SnapshotStripProps> = ({
  roadmap,
  className = '',
  metricClassName = ''
}) => {
  const prefersReducedMotion = useReducedMotion();

  const metrics = [
    {
      label: 'Timeline',
      value: `${roadmap.snapshot.weeksToExam} weeks`,
      note: `${roadmap.snapshot.sprintCount} sprints`,
      icon: Compass,
      gradient: 'linear-gradient(140deg, #f97316 0%, #f59e0b 100%)'
    },
    {
      label: 'Weekly rhythm',
      value: `${roadmap.snapshot.hoursPerWeek.toFixed(1)} h/week`,
      note: 'Average plan cadence',
      icon: Gauge,
      gradient: 'linear-gradient(140deg, #0284c7 0%, #22d3ee 100%)'
    },
    {
      label: 'Plan effort',
      value: `${roadmap.snapshot.totalPlannedHours.toFixed(1)} hours`,
      note: 'Total planned study time',
      icon: Trophy,
      gradient: 'linear-gradient(140deg, #7c3aed 0%, #c026d3 100%)'
    },
    {
      label: 'Feasibility',
      value: roadmap.snapshot.feasibleLabel,
      note: roadmap.snapshot.feasible ? 'Constraints look healthy' : 'Constraints need a tune-up',
      icon: Sparkles,
      gradient: roadmap.snapshot.feasible
        ? 'linear-gradient(140deg, #059669 0%, #34d399 100%)'
        : 'linear-gradient(140deg, #b91c1c 0%, #ef4444 100%)'
    },
    {
      label: 'Flex Time',
      value: `${roadmap.snapshot.flexHours.toFixed(1)} hours`,
      note: 'Optional review / rest / retake space',
      icon: TimerReset,
      gradient: 'linear-gradient(140deg, #334155 0%, #64748b 100%)'
    }
  ];

  return (
    <div className={`grid grid-cols-2 gap-2 md:grid-cols-5 ${className}`}>
      {metrics.map((metric, metricIndex) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: metricIndex * 0.03 }}
            className={`rounded-2xl border border-white/50 bg-white/70 p-3 backdrop-blur ${metricClassName}`}
          >
            <span
              className="mb-2 block h-1.5 w-12 rounded-full"
              style={{ background: metric.gradient }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {metric.label}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">{metric.value}</p>
            <p className="text-xs text-slate-600">{metric.note}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export const SprintDetailsPanel: React.FC<SprintDetailsPanelProps> = ({
  sprint,
  expanded,
  onToggle,
  buttonClassName = '',
  panelClassName = ''
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div>
      <button
        type="button"
        className={`mt-3 inline-flex items-center rounded-full border border-current/35 bg-white/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonClassName}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide details' : 'More details'}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8, height: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, height: 'auto' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`mt-3 overflow-hidden rounded-2xl border p-3 text-xs ${panelClassName}`}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Checkpoint</p>
                <p className="mt-1 font-semibold text-slate-900">{sprint.checkpoint.label}</p>
                <p className="text-slate-700">{sprint.checkpoint.detail}</p>
                <p className="text-slate-600">{sprint.checkpoint.targetText}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Hero module</p>
                <p className="mt-1 text-slate-800">{summarizeHero(sprint.heroModule)}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sprint stats</p>
                <p className="mt-1 text-slate-800">Workload: {formatWorkloadLabel(sprint.workload)}</p>
                <p className="text-slate-700">Utilization: {formatPct(sprint.utilizationPct)}</p>
                <p className="text-slate-700">Flex Time: {sprint.flexHours.toFixed(1)}h</p>
                <p className="text-slate-700">Focus: {sprint.focusTop.map(formatExamPartLabel).join(' + ')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
