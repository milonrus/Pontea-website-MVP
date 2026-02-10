import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Waves } from 'lucide-react';
import { formatExamPartLabel } from '@/components/admin/roadmap/model';
import { EXAM_PART_COLORS } from '@/components/admin/roadmap/themes';
import { SprintDetailsPanel } from '@/components/admin/roadmap/views/shared';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

const MetroMapView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const prefersReducedMotion = useReducedMotion();

  const selectedSprint = roadmap.sprints.find((sprint) => sprint.sprintNumber === expandedSprint) || null;

  return (
    <div className="space-y-4 text-slate-100">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-900 bg-slate-950/70 p-4">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.16) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 inline-flex items-center gap-2">
            <Waves className="h-4 w-4" />
            Metro map
          </h4>
          <p className="text-xs text-cyan-100/85">Tap stations to reveal sprint details</p>
        </div>

        <div className="relative z-10 overflow-x-auto [scrollbar-width:thin]">
          <div
            className="grid min-w-[820px] gap-2"
            style={{
              gridTemplateColumns: `196px repeat(${roadmap.sprints.length}, minmax(62px, 1fr))`
            }}
          >
            <div />
            {roadmap.sprints.map((sprint) => (
              <button
                key={`head-${sprint.sprintNumber}`}
                type="button"
                onClick={() => onToggleSprint(sprint.sprintNumber)}
                className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  expandedSprint === sprint.sprintNumber
                    ? 'border-cyan-300 bg-cyan-300/25 text-cyan-100'
                    : 'border-cyan-950 bg-slate-900/80 text-cyan-200 hover:bg-slate-800'
                }`}
              >
                S{sprint.sprintNumber}
                <span className="mt-0.5 block text-[10px] font-normal text-cyan-100/70">
                  {sprint.weekStartIndex}-{sprint.weekEndIndex}
                </span>
              </button>
            ))}

            {roadmap.examParts.map((part, rowIndex) => {
              const color = EXAM_PART_COLORS[part];

              return (
                <React.Fragment key={part}>
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-950 bg-slate-900/70 px-3 py-2 text-xs text-cyan-100">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                    <span>{formatExamPartLabel(part)}</span>
                  </div>

                  {roadmap.sprints.map((sprint, sprintIndex) => {
                    const raw = sprint.partMinutes[part] || 0;
                    const intensity = raw / roadmap.maxPartMinutesInSprint;
                    const size = 14 + Math.round(intensity * 16);
                    const isActive = expandedSprint === sprint.sprintNumber;

                    return (
                      <motion.button
                        key={`${part}-${sprint.sprintNumber}`}
                        type="button"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                        transition={{ duration: 0.24, delay: rowIndex * 0.02 + sprintIndex * 0.015 }}
                        className={`relative flex h-12 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                          isActive
                            ? 'border-cyan-300 bg-cyan-300/16'
                            : 'border-cyan-950 bg-slate-900/65 hover:border-cyan-700'
                        }`}
                        onClick={() => onToggleSprint(sprint.sprintNumber)}
                        aria-label={`Sprint ${sprint.sprintNumber}, ${formatExamPartLabel(part)} ${raw} minutes`}
                      >
                        {sprintIndex < roadmap.sprints.length - 1 && (
                          <span
                            className="pointer-events-none absolute left-[56%] top-1/2 h-[2px] w-[56%] -translate-y-1/2"
                            style={{
                              background: `linear-gradient(90deg, ${color}dd 0%, ${color}26 100%)`
                            }}
                          />
                        )}
                        <span
                          className="relative inline-flex items-center justify-center rounded-full border border-white/50 text-[10px] font-semibold text-slate-900"
                          style={{
                            width: size,
                            height: size,
                            boxShadow: `0 0 18px ${color}`,
                            backgroundColor: `${color}${Math.max(54, Math.round(70 + intensity * 70)).toString(16).padStart(2, '0')}`
                          }}
                        >
                          {raw > 0 ? Math.round(raw / 10) : '-'}
                        </span>
                      </motion.button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSprint && (
        <article className="rounded-2xl border border-cyan-900 bg-slate-950/75 p-4 text-cyan-50">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Sprint {selectedSprint.sprintNumber} station</p>
              <p className="text-xs text-cyan-100/80">{selectedSprint.weekLabel} • {selectedSprint.goalShort}</p>
            </div>
            <span className="rounded-full border border-cyan-800 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
              {selectedSprint.isFlexSprint ? 'Flex Sprint' : selectedSprint.workload}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-cyan-100/85">
            {selectedSprint.focusTop.map((part) => (
              <span key={`${selectedSprint.sprintNumber}-${part}`} className="rounded-full border border-cyan-800 px-2 py-0.5">
                {formatExamPartLabel(part)}
              </span>
            ))}
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{selectedSprint.checkpoint.detail}</span>
          </div>

          <SprintDetailsPanel
            sprint={selectedSprint}
            expanded={expandedSprint === selectedSprint.sprintNumber}
            onToggle={() => onToggleSprint(selectedSprint.sprintNumber)}
            buttonClassName="text-cyan-100"
            panelClassName="border-cyan-900 bg-slate-900/90"
          />
        </article>
      )}
    </div>
  );
};

export default MetroMapView;
