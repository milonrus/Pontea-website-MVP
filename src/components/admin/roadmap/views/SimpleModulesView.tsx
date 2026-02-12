import React, { useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';
import { PHASE_ACCENTS } from '@/components/admin/roadmap/themes';

/* ── subject config ──────────────────────────────────────────── */

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
  'Text Comprehension': 'TEXT',
  'Logical reasoning': 'LOGIC',
  'Drawing & Representation': 'DRAWING',
  'Math': 'MATH',
  'Physics': 'PHYSICS',
  'General culture': 'CULTURE',
  'History': 'HISTORY',
  'History of Art & Architecture': 'ART HISTORY'
};

const SUBJECT_DOT_COLOR: Record<string, string> = {
  'Text Comprehension': '#2563eb',
  'Logical reasoning': '#0d9488',
  'Drawing & Representation': '#d97706',
  'Math': '#7c3aed',
  'Physics': '#9333ea',
  'General culture': '#dc2626',
  'History': '#e11d48',
  'History of Art & Architecture': '#ea580c'
};

/* ── helpers ─────────────────────────────────────────────────── */

interface ModuleRow {
  name: string;
  count: number;
}

const subjectOrderIndex = (subject: string): number => {
  const knownIndex = SUBJECT_ORDER.indexOf(subject);
  return knownIndex === -1 ? SUBJECT_ORDER.length : knownIndex;
};

const buildOrderedSubjects = (roadmap: VisualRoadmapViewProps['roadmap']): string[] => {
  const activeSubjectsSet = new Set<string>();

  for (const sprint of roadmap.sprints) {
    for (const item of sprint.source.items) {
      if (typeof item.section_title === 'string' && item.section_title.trim().length > 0) {
        activeSubjectsSet.add(item.section_title.trim());
      }
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

const buildSubjectGroups = (
  sprint: VisualRoadmapViewProps['roadmap']['sprints'][number]
): Map<string, ModuleRow[]> => {
  const bySubject = new Map<string, Map<string, ModuleRow>>();

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
      bySubject.set(subject, new Map<string, ModuleRow>());
    }

    const modules = bySubject.get(subject)!;
    const existing = modules.get(moduleKey);
    if (existing) {
      existing.count += 1;
      continue;
    }

    modules.set(moduleKey, {
      name: moduleName,
      count: 1
    });
  }

  const result = new Map<string, ModuleRow[]>();
  for (const [subject, modules] of bySubject.entries()) {
    result.set(subject, Array.from(modules.values()));
  }

  return result;
};

/* ── row height calculation ───────────────────────────────────
 *  Each module line: 13px font × 1.375 (leading-snug) ≈ 18px
 *  Gap between lines: space-y-1 = 4px
 *  Cell padding: py-3 = 12px top + 12px bottom = 24px
 *  For N modules: 24 + N×18 + (N-1)×4 = 20 + 22×N
 *  Empty rows get the height of 1 module line.
 * ─────────────────────────────────────────────────────────── */

const ROW_LINE_HEIGHT = 22; // 18px text + 4px gap
const ROW_PADDING = 24;     // py-3 top + bottom

const rowMinHeight = (maxModules: number): number => {
  const n = Math.max(1, maxModules);
  return ROW_PADDING + n * ROW_LINE_HEIGHT - 4; // subtract last gap
};

/* ── component ───────────────────────────────────────────────── */

const SimpleModulesView: React.FC<VisualRoadmapViewProps> = ({ roadmap }) => {
  const orderedSubjects = buildOrderedSubjects(roadmap);
  const subjectRows = orderedSubjects.length > 0 ? orderedSubjects : SUBJECT_ORDER;

  // Pre-compute max module count per subject across all sprints
  const maxModulesPerSubject = useMemo(() => {
    const maxMap = new Map<string, number>();
    for (const subject of subjectRows) {
      maxMap.set(subject, 0);
    }
    for (const sprint of roadmap.sprints) {
      const groups = buildSubjectGroups(sprint);
      for (const [subject, modules] of groups.entries()) {
        const current = maxMap.get(subject) ?? 0;
        if (modules.length > current) {
          maxMap.set(subject, modules.length);
        }
      }
    }
    return maxMap;
  }, [roadmap.sprints, subjectRows]);

  return (
    <div className="space-y-4 text-slate-900">
      {/* header */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
        <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h4 className="text-xl font-semibold text-indigo-600 md:text-2xl">Study Roadmap</h4>
        </div>
        <p className="text-sm font-medium text-slate-500 md:text-base">
          {roadmap.snapshot.weeksToExam}-Week Intensive Plan
        </p>
      </section>

      {/* scrollable sprint strip */}
      <div
        className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex min-w-max gap-4">
          {roadmap.sprints.map((sprint) => {
            const modulesBySubject = buildSubjectGroups(sprint);
            const phaseAccent = PHASE_ACCENTS[sprint.phaseId];

            return (
              <article
                key={`simple-modules-sprint-${sprint.sprintNumber}`}
                className="w-[460px] min-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* phase accent bar */}
                <div className="h-1" style={{ backgroundColor: phaseAccent }} />

                {/* sprint header */}
                <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <h5 className="text-xl font-bold leading-none text-slate-800">
                      Sprint {sprint.sprintNumber}
                    </h5>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: phaseAccent }}
                    >
                      {sprint.phaseLabel}
                    </span>
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    w. {sprint.weekStartIndex}\u2013{sprint.weekEndIndex}
                  </span>
                </header>

                {/* sprint goal */}
                {sprint.goalShort && (
                  <div className="border-b border-slate-100 px-5 py-2.5">
                    <p className="truncate text-[13px] leading-snug text-slate-400">
                      {sprint.goalShort}
                    </p>
                  </div>
                )}

                {/* subject rows — always all subjects, fixed height per row */}
                <div className="divide-y divide-slate-100">
                  {subjectRows.map((subject) => {
                    const modules = modulesBySubject.get(subject) ?? [];
                    const isEmpty = modules.length === 0;
                    const dotColor = SUBJECT_DOT_COLOR[subject] || '#64748b';
                    const fixedHeight = rowMinHeight(maxModulesPerSubject.get(subject) ?? 1);

                    return (
                      <div
                        key={`${sprint.sprintNumber}-${subject}`}
                        className="grid grid-cols-[140px_minmax(0,1fr)]"
                        style={{ minHeight: fixedHeight }}
                      >
                        {/* subject label */}
                        <div className="flex items-start gap-2 border-r border-slate-100 bg-slate-50/70 px-4 py-3">
                          <span
                            className="mt-[5px] inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                            style={{ backgroundColor: isEmpty ? '#cbd5e1' : dotColor }}
                          />
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${
                              isEmpty ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {SUBJECT_LABELS[subject] ?? subject.toUpperCase()}
                          </span>
                        </div>

                        {/* module list */}
                        <div className="px-4 py-3">
                          {isEmpty ? (
                            <span className="text-[13px] text-slate-300">&mdash;</span>
                          ) : (
                            <ul className="space-y-1">
                              {modules.map((module) => (
                                <li
                                  key={`${sprint.sprintNumber}-${subject}-${module.name}`}
                                  className="flex items-baseline justify-between gap-2 text-[13px] leading-snug text-slate-700"
                                >
                                  <span className="min-w-0">{module.name}</span>
                                  {module.count > 1 && (
                                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                                      &times;{module.count}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimpleModulesView;
