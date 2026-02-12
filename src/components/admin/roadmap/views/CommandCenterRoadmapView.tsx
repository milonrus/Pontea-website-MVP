import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarRange, Gauge, Layers3, Sparkles, Target } from 'lucide-react';
import { formatExamPartLabel, formatWorkloadLabel } from '@/components/admin/roadmap/model';
import { PHASE_ACCENTS } from '@/components/admin/roadmap/themes';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';
import { VisualSprint } from '@/components/admin/roadmap/types';

const SUBJECT_ORDER = [
  'Text Comprehension',
  'Logical reasoning',
  'Drawing & Representation',
  'Math',
  'Physics',
  'General culture',
  'History',
  'History of Art & Architecture'
];

const SUBJECT_LABELS: Record<string, string> = {
  'Text Comprehension': 'Text',
  'Logical reasoning': 'Logic',
  'Drawing & Representation': 'Drawing',
  'Math': 'Math',
  'Physics': 'Physics',
  'General culture': 'Gen. Culture',
  'History': 'History',
  'History of Art & Architecture': 'Art History'
};

interface ModuleSummary {
  name: string;
  count: number;
  questions: number;
}

const subjectOrderIndex = (subject: string): number => {
  const knownIndex = SUBJECT_ORDER.indexOf(subject);
  return knownIndex === -1 ? SUBJECT_ORDER.length : knownIndex;
};

const buildOrderedSubjects = (roadmap: VisualRoadmapViewProps['roadmap']): string[] => {
  const activeSubjectsSet = new Set<string>();

  for (const sprint of roadmap.sprints) {
    for (const item of sprint.source.items) {
      if (typeof item.section_title !== 'string' || item.section_title.trim().length === 0) continue;
      activeSubjectsSet.add(item.section_title.trim());
    }
  }

  const activeSubjects = Array.from(activeSubjectsSet);
  const known = activeSubjects
    .filter((subject) => SUBJECT_ORDER.includes(subject))
    .sort((a, b) => subjectOrderIndex(a) - subjectOrderIndex(b));
  const unknown = activeSubjects
    .filter((subject) => !SUBJECT_ORDER.includes(subject))
    .sort((a, b) => a.localeCompare(b));

  return [...known, ...unknown];
};

const buildSubjectModules = (sprint: VisualSprint): Map<string, ModuleSummary[]> => {
  const bySubject = new Map<string, Map<string, ModuleSummary>>();

  for (const item of sprint.source.items) {
    const subject =
      typeof item.section_title === 'string' && item.section_title.trim().length > 0
        ? item.section_title.trim()
        : 'Other';
    const moduleName =
      typeof item.submodule_name === 'string' && item.submodule_name.trim().length > 0
        ? item.submodule_name.trim()
        : 'Untitled module';
    const moduleKey = moduleName.toLocaleLowerCase();

    if (!bySubject.has(subject)) {
      bySubject.set(subject, new Map<string, ModuleSummary>());
    }

    const modules = bySubject.get(subject)!;
    const existing = modules.get(moduleKey);
    const questionCount = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
    if (existing) {
      existing.count += 1;
      existing.questions += questionCount;
      continue;
    }

    modules.set(moduleKey, {
      name: moduleName,
      count: 1,
      questions: questionCount
    });
  }

  const result = new Map<string, ModuleSummary[]>();
  for (const [subject, modules] of bySubject.entries()) {
    result.set(subject, Array.from(modules.values()));
  }

  return result;
};

const workloadBadgeClass = (workload: VisualSprint['workload']): string => {
  if (workload === 'high') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (workload === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const CommandCenterRoadmapView: React.FC<VisualRoadmapViewProps> = ({
  roadmap,
  expandedSprint,
  onToggleSprint
}) => {
  const prefersReducedMotion = useReducedMotion();

  const orderedSubjects = useMemo(() => buildOrderedSubjects(roadmap), [roadmap]);
  const subjectRows = orderedSubjects.length > 0 ? orderedSubjects : SUBJECT_ORDER;

  const activeSprint = useMemo(() => {
    if (roadmap.sprints.length === 0) return null;
    if (expandedSprint === null) return roadmap.sprints[0];
    return roadmap.sprints.find((sprint) => sprint.sprintNumber === expandedSprint) || roadmap.sprints[0];
  }, [roadmap.sprints, expandedSprint]);

  const activeIndex = activeSprint
    ? roadmap.sprints.findIndex((sprint) => sprint.sprintNumber === activeSprint.sprintNumber)
    : -1;
  const nextSprint = activeIndex >= 0 ? roadmap.sprints[activeIndex + 1] || null : null;

  const activeModulesBySubject = useMemo(
    () => (activeSprint ? buildSubjectModules(activeSprint) : new Map<string, ModuleSummary[]>()),
    [activeSprint]
  );

  const nextPreviewModules = useMemo(() => {
    if (!nextSprint) return [] as string[];
    const bySubject = buildSubjectModules(nextSprint);
    const flat = Array.from(bySubject.values()).flat();
    return flat
      .sort((a, b) => b.questions - a.questions || b.count - a.count)
      .slice(0, 3)
      .map((module) => module.name);
  }, [nextSprint]);

  if (!activeSprint) {
    return (
      <div className="rounded-2xl border border-cyan-100 bg-white p-4 text-sm text-slate-600">
        Roadmap has no sprints to visualize.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-cyan-950">
      <section className="relative overflow-hidden rounded-[28px] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Roadmap Command Center</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
                Track sprint execution with a fast, high-signal study board
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-200 bg-white/90 px-3 py-2">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Timeline
                </p>
                <p className="text-sm font-semibold text-slate-900">{roadmap.snapshot.weeksToExam} weeks</p>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-white/90 px-3 py-2">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                  <Gauge className="h-3.5 w-3.5" />
                  Cadence
                </p>
                <p className="text-sm font-semibold text-slate-900">{roadmap.snapshot.hoursPerWeek.toFixed(1)} h/week</p>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 col-span-2 sm:col-span-1">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Status
                </p>
                <p className="text-sm font-semibold text-slate-900">{roadmap.snapshot.feasibleLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {roadmap.phases.map((phase) => {
              const start = phase.sprints[0]?.sprintNumber;
              const end = phase.sprints[phase.sprints.length - 1]?.sprintNumber;
              const isActive =
                activeSprint.sprintNumber >= (start || 0) && activeSprint.sprintNumber <= (end || 0);
              const accent = PHASE_ACCENTS[phase.id];

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => start && onToggleSprint(start)}
                  className={`min-h-[44px] rounded-2xl border px-3 py-2 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-50 text-cyan-950'
                      : 'border-cyan-200 bg-white/90 text-slate-700 hover:bg-white'
                  }`}
                  style={{ boxShadow: isActive ? `inset 0 0 0 1px ${accent}55` : undefined }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.13em]" style={{ color: isActive ? accent : undefined }}>
                    {phase.label}
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    S{start}-S{end}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-cyan-100 bg-white p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            <Layers3 className="h-4 w-4" />
            Sprint Navigator
          </p>
          <div className="mt-3 space-y-2">
            {roadmap.sprints.map((sprint, sprintIndex) => {
              const selected = sprint.sprintNumber === activeSprint.sprintNumber;
              return (
                <motion.button
                  key={`command-sprint-${sprint.sprintNumber}`}
                  type="button"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: sprintIndex * 0.015 }}
                  onClick={() => onToggleSprint(sprint.sprintNumber)}
                  className={`min-h-[52px] w-full rounded-xl border px-3 py-2 text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                    selected
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Sprint {sprint.sprintNumber}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${workloadBadgeClass(sprint.workload)}`}>
                      {formatWorkloadLabel(sprint.workload)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">wk {sprint.weekStartIndex}-{sprint.weekEndIndex}</p>
                </motion.button>
              );
            })}
          </div>
        </aside>

        <article className="rounded-2xl border border-cyan-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Active Sprint
              </p>
              <h5 className="mt-1 text-xl font-semibold text-slate-900">
                Sprint {activeSprint.sprintNumber} · wk {activeSprint.weekStartIndex}-{activeSprint.weekEndIndex}
              </h5>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{activeSprint.goalShort}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSprint.focusTop.map((part) => (
                <span
                  key={`focus-${part}`}
                  className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800"
                >
                  {formatExamPartLabel(part)}
                </span>
              ))}
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {activeSprint.checkpoint.questions > 0 ? `${activeSprint.checkpoint.questions}Q checkpoint` : 'Timed checkpoint'}
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {subjectRows.map((subject, rowIndex) => {
              const modules = activeModulesBySubject.get(subject) || [];
              const isEmpty = modules.length === 0;

              return (
                <motion.div
                  key={`command-row-${subject}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 3 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: rowIndex * 0.012 }}
                  className="grid grid-cols-[132px_minmax(0,1fr)] border-t border-slate-200 first:border-t-0"
                >
                  <div className="border-r border-slate-200 bg-slate-50 px-3 py-3">
                    <span className={`text-xs font-semibold uppercase tracking-[0.1em] ${isEmpty ? 'text-slate-300' : 'text-slate-700'}`}>
                      {SUBJECT_LABELS[subject] || subject}
                    </span>
                  </div>
                  <div className={`px-3 py-3 ${isEmpty ? 'text-slate-300' : 'text-slate-800'}`}>
                    {isEmpty ? (
                      <span className="text-sm">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {modules.map((module) => (
                          <span
                            key={`command-module-${subject}-${module.name}`}
                            className="inline-flex min-h-[30px] items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs text-cyan-900"
                          >
                            <span>{module.name}</span>
                            {module.count > 1 && <span className="font-semibold">×{module.count}</span>}
                            {module.questions > 0 && (
                              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                                {module.questions}Q
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {nextSprint && (
            <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-cyan-700">
                Next Sprint Preview
                <ArrowRight className="h-3.5 w-3.5" />
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Sprint {nextSprint.sprintNumber} · wk {nextSprint.weekStartIndex}-{nextSprint.weekEndIndex}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{nextSprint.goalShort}</p>
              {nextPreviewModules.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {nextPreviewModules.map((module) => (
                    <span
                      key={`next-preview-module-${module}`}
                      className="inline-flex items-center rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-medium text-cyan-800"
                    >
                      {module}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default CommandCenterRoadmapView;
