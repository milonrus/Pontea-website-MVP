import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';
import { formatExamPartLabel, summarizeHero } from '@/components/admin/roadmap/model';
import { PHASE_ACCENTS } from '@/components/admin/roadmap/themes';
import { SprintDetailsPanel } from '@/components/admin/roadmap/views/shared';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

const PosterCarouselView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeSprintNumber, setActiveSprintNumber] = useState<number>(roadmap.sprints[0]?.sprintNumber || 1);

  useEffect(() => {
    if (expandedSprint) {
      setActiveSprintNumber(expandedSprint);
    }
  }, [expandedSprint]);

  const activeIndex = useMemo(
    () => roadmap.sprints.findIndex((sprint) => sprint.sprintNumber === activeSprintNumber),
    [roadmap.sprints, activeSprintNumber]
  );

  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const sprint = roadmap.sprints[safeIndex];
  const accent = PHASE_ACCENTS[sprint.phaseId];

  const goTo = (index: number) => {
    const next = roadmap.sprints[index];
    if (!next) return;
    setActiveSprintNumber(next.sprintNumber);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-rose-300/80 bg-white/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-400 bg-white text-rose-950 transition-colors hover:bg-rose-50 disabled:opacity-40"
            aria-label="Previous sprint"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-800">Poster carousel</p>
            <p className="text-sm font-semibold text-rose-900">
              Sprint {sprint.sprintNumber} of {roadmap.sprints.length}
            </p>
          </div>

          <button
            type="button"
            onClick={() => goTo(Math.min(roadmap.sprints.length - 1, safeIndex + 1))}
            disabled={safeIndex >= roadmap.sprints.length - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-400 bg-white text-rose-950 transition-colors hover:bg-rose-50 disabled:opacity-40"
            aria-label="Next sprint"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {roadmap.sprints.map((item) => (
            <button
              key={item.sprintNumber}
              type="button"
              onClick={() =>
                goTo(roadmap.sprints.findIndex((entry) => entry.sprintNumber === item.sprintNumber))
              }
              className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${
                item.sprintNumber === sprint.sprintNumber
                  ? 'border-rose-500 bg-rose-200 text-rose-950'
                  : 'border-rose-300 bg-white text-rose-800'
              }`}
            >
              S{item.sprintNumber}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={sprint.sprintNumber}
          initial={prefersReducedMotion ? false : { opacity: 0, x: 26 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -26 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[30px] border border-rose-200/80 p-6 shadow-[0_32px_88px_-44px_rgba(136,19,55,0.6)]"
          style={{
            background: `radial-gradient(560px 260px at 78% 8%, ${accent}58 0%, transparent 68%), radial-gradient(720px 340px at 0% 100%, ${accent}20 0%, transparent 62%), linear-gradient(155deg, #fff1f2 0%, #ffe4e6 42%, #fff7ed 100%)`
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#7f1d1d 0.6px, transparent 0.6px)', backgroundSize: '6px 6px' }} />
          <div className="absolute -left-10 top-3 rotate-[-90deg] text-[11px] uppercase tracking-[0.34em] text-rose-900/70">
            Pontea Editorial Lab
          </div>
          <div className="absolute right-2 top-3 text-[5.2rem] font-semibold leading-none text-rose-900/12">
            {String(sprint.sprintNumber).padStart(2, '0')}
          </div>

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-800">{sprint.phaseLabel}</p>
            <h4 className="mt-2 max-w-3xl text-[2.8rem] font-semibold leading-[0.95] text-rose-950 md:text-[3.6rem]">
              Sprint {sprint.sprintNumber}
            </h4>
            <p className="mt-2 text-sm text-rose-900">
              {sprint.weekLabel} • {sprint.plannedHours.toFixed(1)}h • {sprint.isFlexSprint ? 'Flex Sprint' : sprint.workload}
            </p>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-rose-950">{sprint.goalShort}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {sprint.focusTop.map((part) => (
                <span
                  key={`${sprint.sprintNumber}-${part}`}
                  className="rounded-full border border-rose-400 bg-white/75 px-3 py-1 text-xs font-semibold text-rose-950"
                >
                  {formatExamPartLabel(part)}
                </span>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-rose-300 bg-white/70 p-3 text-sm text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <p className="font-semibold uppercase tracking-[0.12em] text-[11px]">Hero module</p>
              <p className="mt-1">{summarizeHero(sprint.heroModule)}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" />
                {sprint.checkpoint.detail}
              </p>
            </div>

            <SprintDetailsPanel
              sprint={sprint}
              expanded={expandedSprint === sprint.sprintNumber}
              onToggle={() => onToggleSprint(sprint.sprintNumber)}
              buttonClassName="text-rose-950"
              panelClassName="border-rose-300 bg-white/80"
            />
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
};

export default PosterCarouselView;
