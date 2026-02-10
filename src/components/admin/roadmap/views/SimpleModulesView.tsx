import React from 'react';
import { GraduationCap } from 'lucide-react';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

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
  'Text Comprehension': 'TEXT COMP.',
  'Logical reasoning': 'LOGIC',
  'Drawing & Representation': 'DRAWING',
  'Math': 'MATH',
  'Physics': 'PHYSICS',
  'General culture': 'GEN. CULTURE',
  'History': 'HISTORY',
  'History of Art & Architecture': 'ART HISTORY'
};

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

const SimpleModulesView: React.FC<VisualRoadmapViewProps> = ({ roadmap }) => {
  const orderedSubjects = buildOrderedSubjects(roadmap);
  const subjectRows = orderedSubjects.length > 0 ? orderedSubjects : SUBJECT_ORDER;

  return (
    <div className="space-y-4 text-slate-900">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h4 className="text-xl font-semibold text-indigo-600 md:text-2xl">Study Roadmap</h4>
        </div>
        <p className="text-sm font-medium text-slate-500 md:text-base">{roadmap.snapshot.weeksToExam}-Week Intensive Plan</p>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-4 md:flex md:min-w-max md:gap-4 md:space-y-0">
          {roadmap.sprints.map((sprint) => {
            const modulesBySubject = buildSubjectGroups(sprint);
            const hasAnyModules = Array.from(modulesBySubject.values()).some((modules) => modules.length > 0);

            return (
              <article
                key={`simple-modules-sprint-${sprint.sprintNumber}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:w-[540px] md:min-w-[540px]"
              >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <h5 className="text-2xl font-semibold leading-none text-slate-800">Спринт {sprint.sprintNumber}</h5>
                  <span className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-500">
                    нед. {sprint.weekStartIndex}-{sprint.weekEndIndex}
                  </span>
                </header>

                <div className="divide-y divide-slate-200">
                  {!hasAnyModules ? (
                    <p className="px-5 py-4 text-sm text-slate-500">No module assignments in this sprint.</p>
                  ) : (
                    subjectRows.map((subject) => {
                      const modules = modulesBySubject.get(subject) ?? [];
                      const isEmpty = modules.length === 0;

                      return (
                        <div
                          key={`${sprint.sprintNumber}-${subject}`}
                          className="grid grid-cols-[170px_minmax(0,1fr)]"
                        >
                          <div className="border-r border-slate-200 bg-slate-50 px-4 py-4">
                            <span
                              className={`text-sm font-semibold uppercase tracking-wide ${
                                isEmpty ? 'text-slate-300' : 'text-slate-700'
                              }`}
                            >
                              {SUBJECT_LABELS[subject] ?? subject.toUpperCase()}
                            </span>
                          </div>

                          <div className={`px-4 py-4 ${isEmpty ? 'text-slate-300' : 'text-slate-800'}`}>
                            {isEmpty ? (
                              <p className="text-base font-medium">-</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {modules.map((module) => (
                                  <li
                                    key={`${sprint.sprintNumber}-${subject}-${module.name}`}
                                    className="flex items-start justify-between gap-2 text-base leading-[1.35]"
                                  >
                                    <span>{module.name}</span>
                                    {module.count > 1 && (
                                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                        ×{module.count}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
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
