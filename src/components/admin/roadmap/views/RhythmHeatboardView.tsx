import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { formatExamPartLabel } from '@/components/admin/roadmap/model';
import { EXAM_PART_COLORS, PHASE_ACCENTS } from '@/components/admin/roadmap/themes';
import { SprintDetailsPanel } from '@/components/admin/roadmap/views/shared';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

const hexToRgba = (hex: string, alpha: number): string => {
  const value = hex.replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((char) => `${char}${char}`).join('') : value;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const RhythmHeatboardView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const prefersReducedMotion = useReducedMotion();
  const selectedSprint = roadmap.sprints.find((sprint) => sprint.sprintNumber === expandedSprint) || null;

  return (
    <div className="space-y-4 text-amber-950">
      <div className="relative overflow-hidden rounded-[28px] border border-amber-300 bg-amber-50/70 p-4">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(45deg, rgba(120,53,15,0.12) 25%, transparent 25%, transparent 50%, rgba(120,53,15,0.12) 50%, rgba(120,53,15,0.12) 75%, transparent 75%, transparent)', backgroundSize: '18px 18px' }} />
        <div className="pointer-events-none absolute -right-10 top-2 h-44 w-44 rounded-full bg-orange-300/30 blur-2xl" />

        <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm uppercase tracking-[0.2em]">Rhythm heatboard</h4>
          <p className="text-xs text-amber-900/80">Read weekly intensity at a glance</p>
        </div>

        <div className="relative z-10 overflow-x-auto [scrollbar-width:thin]">
          <div
            className="grid min-w-[780px] gap-2"
            style={{ gridTemplateColumns: `172px repeat(${roadmap.sprints.length}, minmax(58px, 1fr))` }}
          >
            <div className="rounded-xl border border-amber-300 bg-amber-100/70 px-3 py-2 text-xs">
              Exam part
            </div>
            {roadmap.sprints.map((sprint) => (
              <button
                key={`header-${sprint.sprintNumber}`}
                type="button"
                onClick={() => onToggleSprint(sprint.sprintNumber)}
                className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  expandedSprint === sprint.sprintNumber
                    ? 'border-orange-500 bg-orange-200 text-orange-950'
                    : 'border-amber-300 bg-amber-100/70 text-amber-900 hover:bg-amber-100'
                }`}
              >
                S{sprint.sprintNumber}
              </button>
            ))}

            {roadmap.examParts.map((part, rowIndex) => {
              const partColor = EXAM_PART_COLORS[part];

              return (
                <React.Fragment key={part}>
                  <div className="rounded-xl border border-amber-300 bg-white/75 px-3 py-2 text-xs font-semibold text-amber-900">
                    {formatExamPartLabel(part)}
                  </div>

                  {roadmap.sprints.map((sprint, sprintIndex) => {
                    const minutes = sprint.partMinutes[part] || 0;
                    const intensity = minutes / roadmap.maxPartMinutesInSprint;
                    const alpha = 0.16 + intensity * 0.74;
                    const isSelected = expandedSprint === sprint.sprintNumber;

                    return (
                      <motion.button
                        key={`${part}-${sprint.sprintNumber}`}
                        type="button"
                        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: rowIndex * 0.02 + sprintIndex * 0.01 }}
                        onClick={() => onToggleSprint(sprint.sprintNumber)}
                        className={`rounded-xl border px-1 py-2 text-center text-[11px] font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                          isSelected ? 'border-orange-500 shadow-[0_6px_20px_-12px_rgba(154,52,18,0.8)]' : 'border-amber-300'
                        }`}
                        style={{
                          background: `linear-gradient(180deg, ${hexToRgba(partColor, alpha)} 0%, ${hexToRgba('#fff7ed', 0.96)} 100%)`,
                          color: '#431407'
                        }}
                        aria-label={`Sprint ${sprint.sprintNumber}, ${formatExamPartLabel(part)}, ${minutes} minutes`}
                      >
                        <span className="block">{minutes}</span>
                      </motion.button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-3 flex flex-wrap gap-2">
          {roadmap.phases.map((phase) => (
            <span
              key={phase.id}
              className="rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: `${PHASE_ACCENTS[phase.id]}8a`,
                backgroundColor: `${PHASE_ACCENTS[phase.id]}24`,
                color: '#7c2d12'
              }}
            >
              {phase.label}: S{phase.sprints[0]?.sprintNumber}-S{phase.sprints[phase.sprints.length - 1]?.sprintNumber}
            </span>
          ))}
        </div>
      </div>

      {selectedSprint && (
        <article className="rounded-2xl border border-amber-300 bg-amber-50/85 p-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-950">
            <TrendingUp className="h-4 w-4" />
            Sprint {selectedSprint.sprintNumber} intensity readout
          </p>
          <p className="mt-1 text-xs text-amber-900">{selectedSprint.goalShort}</p>

          <SprintDetailsPanel
            sprint={selectedSprint}
            expanded={expandedSprint === selectedSprint.sprintNumber}
            onToggle={() => onToggleSprint(selectedSprint.sprintNumber)}
            buttonClassName="text-amber-950"
            panelClassName="border-amber-300 bg-white/75"
          />
        </article>
      )}
    </div>
  );
};

export default RhythmHeatboardView;
