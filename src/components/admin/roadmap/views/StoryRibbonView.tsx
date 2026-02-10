import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, Sparkles } from 'lucide-react';
import { formatExamPartLabel, pickSprintCardTone, summarizeHero } from '@/components/admin/roadmap/model';
import { PHASE_ACCENTS } from '@/components/admin/roadmap/themes';
import { SprintDetailsPanel } from '@/components/admin/roadmap/views/shared';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

const StoryRibbonView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-amber-200/80 bg-white/65 p-4">
        <div className="pointer-events-none absolute -left-8 top-4 h-44 w-44 rounded-full bg-orange-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-cyan-300/20 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(194,65,12,0.24) 0 2px, transparent 2px 40px), linear-gradient(0deg, rgba(30,41,59,0.08) 0 1px, transparent 1px 34px)'
          }}
        />

        <div className="relative z-10 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {roadmap.phases.map((phase, phaseIndex) => {
            const accent = PHASE_ACCENTS[phase.id];

            return (
              <motion.section
                key={phase.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16, rotate: -0.4 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.34, delay: phaseIndex * 0.05, ease: 'easeOut' }}
                className="min-w-[295px] max-w-[380px] flex-1 rounded-[26px] border border-white/70 bg-white/84 p-4 shadow-[0_22px_48px_-32px_rgba(15,23,42,0.45)] backdrop-blur"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{phase.label}</p>
                    <h4 className="text-[1.15rem] font-semibold leading-tight text-slate-900">
                      S{phase.sprints[0]?.sprintNumber}-S{phase.sprints[phase.sprints.length - 1]?.sprintNumber}
                    </h4>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: `${accent}66`,
                      background: `linear-gradient(135deg, ${accent}35 0%, #ffffff 100%)`,
                      color: '#0f172a'
                    }}
                  >
                    {phase.plannedHours.toFixed(1)}h
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600">{phase.subtitle}</p>

                <div className="mt-4 space-y-3">
                  {phase.sprints.map((sprint, sprintIndex) => {
                    const isExpanded = expandedSprint === sprint.sprintNumber;
                    const isFlex = sprint.isFlexSprint;

                    return (
                      <article
                        key={sprint.sprintNumber}
                        className="rounded-2xl border border-white/85 p-3"
                        style={{
                          backgroundColor: `${pickSprintCardTone(sprint.workload)}45`,
                          transform: `rotate(${sprintIndex % 2 === 0 ? '-0.35deg' : '0.35deg'})`
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Sprint {sprint.sprintNumber}</p>
                            <p className="text-xs text-slate-600">
                              {sprint.weekLabel} • {sprint.plannedHours.toFixed(1)}h
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {isFlex ? 'Flex Sprint' : sprint.workload}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-slate-800">{sprint.goalShort}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {sprint.focusTop.map((part) => (
                            <span
                              key={`${sprint.sprintNumber}-${part}`}
                              className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-700"
                            >
                              {formatExamPartLabel(part)}
                            </span>
                          ))}
                        </div>

                        <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-slate-800">
                          <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{sprint.checkpoint.detail}</span>
                        </p>
                        <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-slate-700">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{summarizeHero(sprint.heroModule)}</span>
                        </p>

                        <SprintDetailsPanel
                          sprint={sprint}
                          expanded={isExpanded}
                          onToggle={() => onToggleSprint(sprint.sprintNumber)}
                          buttonClassName="text-slate-800"
                          panelClassName="border-white/80 bg-white/80"
                        />
                      </article>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoryRibbonView;
