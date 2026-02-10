import React from 'react';
import { CalendarCheck2, Layers2, TimerReset } from 'lucide-react';
import { formatExamPartLabel, summarizeHero } from '@/components/admin/roadmap/model';
import { PHASE_ACCENTS } from '@/components/admin/roadmap/themes';
import { SprintDetailsPanel } from '@/components/admin/roadmap/views/shared';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';
import { VisualSprint } from '@/components/admin/roadmap/types';

interface BoardColumn {
  id: 'now' | 'next' | 'later' | 'flex';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  sprints: VisualSprint[];
  cardTone: string;
}

const stickyRotation = (sprintNumber: number): string => {
  const mod = sprintNumber % 3;
  if (mod === 0) return '-0.8deg';
  if (mod === 1) return '0.9deg';
  return '-0.25deg';
};

const SprintCard: React.FC<{
  sprint: VisualSprint;
  expanded: boolean;
  onToggle: () => void;
  cardTone: string;
}> = ({ sprint, expanded, onToggle, cardTone }) => {
  const phaseAccent = PHASE_ACCENTS[sprint.phaseId];

  return (
    <article
      className="relative rounded-2xl border p-3 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.6)]"
      style={{
        borderColor: '#a7f3d0',
        background: cardTone,
        transform: `rotate(${stickyRotation(sprint.sprintNumber)})`
      }}
    >
      <span className="pointer-events-none absolute -top-2 left-4 h-4 w-8 rounded-full bg-emerald-200/75" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-emerald-950">Sprint {sprint.sprintNumber}</p>
          <p className="text-xs text-emerald-800">{sprint.weekLabel} • {sprint.plannedHours.toFixed(1)}h</p>
        </div>
        <span
          className="rounded-full px-2 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: `${phaseAccent}24`, color: '#065f46' }}
        >
          {sprint.phaseLabel}
        </span>
      </div>

      <p className="mt-2 text-sm text-emerald-950">{sprint.goalShort}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {sprint.focusTop.map((part) => (
          <span
            key={`${sprint.sprintNumber}-${part}`}
            className="rounded-full border border-emerald-300 bg-emerald-100/75 px-2 py-1 text-[11px] font-semibold text-emerald-900"
          >
            {formatExamPartLabel(part)}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-emerald-900">Checkpoint: {sprint.checkpoint.detail}</p>
      <p className="mt-1 text-xs text-emerald-800">{summarizeHero(sprint.heroModule)}</p>

      <SprintDetailsPanel
        sprint={sprint}
        expanded={expanded}
        onToggle={onToggle}
        buttonClassName="text-emerald-950"
        panelClassName="border-emerald-300 bg-white/80"
      />
    </article>
  );
};

const NowNextFlexBoardView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const flexSprints = roadmap.sprints.filter((sprint) => sprint.isFlexSprint);
  const flexSprintIds = new Set(flexSprints.map((sprint) => sprint.sprintNumber));

  const nonFlexByPhase = roadmap.phases.map((phase) => ({
    ...phase,
    sprints: phase.sprints.filter((sprint) => !flexSprintIds.has(sprint.sprintNumber))
  }));

  const columns: BoardColumn[] = [
    {
      id: 'now',
      title: 'Now',
      subtitle: nonFlexByPhase[0]?.label || 'Current priority',
      icon: CalendarCheck2,
      sprints: nonFlexByPhase[0]?.sprints || [],
      cardTone: 'linear-gradient(160deg, #dcfce7 0%, #bbf7d0 100%)'
    },
    {
      id: 'next',
      title: 'Next',
      subtitle: nonFlexByPhase[1]?.label || 'Upcoming focus',
      icon: Layers2,
      sprints: nonFlexByPhase[1]?.sprints || [],
      cardTone: 'linear-gradient(160deg, #ecfccb 0%, #d9f99d 100%)'
    },
    {
      id: 'later',
      title: 'Later',
      subtitle: 'Focus + Final phases',
      icon: Layers2,
      sprints: nonFlexByPhase.slice(2).flatMap((phase) => phase.sprints),
      cardTone: 'linear-gradient(160deg, #fef9c3 0%, #fde68a 100%)'
    },
    {
      id: 'flex',
      title: 'Flex',
      subtitle: 'Optional review / rest / retakes',
      icon: TimerReset,
      sprints: flexSprints,
      cardTone: 'linear-gradient(160deg, #e0f2fe 0%, #bae6fd 100%)'
    }
  ];

  return (
    <div className="space-y-4 text-emerald-950">
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-300 bg-emerald-50/70 p-3">
        <div className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(#047857 0.7px, transparent 0.7px)', backgroundSize: '8px 8px' }} />
        <div className="pointer-events-none absolute -left-8 top-0 h-40 w-40 rounded-full bg-emerald-300/30 blur-2xl" />

        <div className="relative z-10 grid gap-3 lg:grid-cols-4">
          {columns.map((column) => {
            const Icon = column.icon;

            return (
              <section
                key={column.id}
                className="rounded-[24px] border border-emerald-300 bg-white/60 p-3 backdrop-blur"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
                      <Icon className="h-4 w-4" />
                      {column.title}
                    </h4>
                    <p className="text-xs text-emerald-800">{column.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                    {column.sprints.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {column.sprints.length === 0 && (
                    <div className="rounded-xl border border-dashed border-emerald-400 bg-white/65 p-3 text-xs text-emerald-800">
                      No sprints in this lane.
                    </div>
                  )}

                  {column.sprints.map((sprint) => (
                    <SprintCard
                      key={sprint.sprintNumber}
                      sprint={sprint}
                      expanded={expandedSprint === sprint.sprintNumber}
                      onToggle={() => onToggleSprint(sprint.sprintNumber)}
                      cardTone={column.cardTone}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NowNextFlexBoardView;
