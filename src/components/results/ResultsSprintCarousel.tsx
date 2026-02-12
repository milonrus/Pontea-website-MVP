'use client';

import React, { useMemo } from 'react';
import { CanonicalRoadmapOutput } from '@/lib/roadmap-generator/types';
import { buildVisualRoadmapModel } from '@/components/admin/roadmap/model';
import { VisualRoadmap } from '@/components/admin/roadmap/types';

/* ── Russian subject config ──────────────────────────────────── */

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

const SUBJECT_LABELS_RU: Record<string, string> = {
  'Text Comprehension': 'Чтение',
  'Logical reasoning': 'Логика',
  'Drawing & Representation': 'Черчение',
  'Math': 'Математика',
  'Physics': 'Физика',
  'General culture': 'Культура',
  'History': 'История',
  'History of Art & Architecture': 'История искусств'
};

const SUBJECT_COLOR: Record<string, string> = {
  'Text Comprehension': '#5e9480',
  'Logical reasoning': '#6090a8',
  'Drawing & Representation': '#b87860',
  'Math': '#6080b8',
  'Physics': '#8670b0',
  'General culture': '#b89058',
  'History': '#c07070',
  'History of Art & Architecture': '#947858'
};

/* ── helpers ─────────────────────────────────────────────────── */

interface ModuleRow {
  name: string;
  count: number;
}

const subjectIdx = (s: string): number => {
  const i = SUBJECT_ORDER.indexOf(s);
  return i === -1 ? SUBJECT_ORDER.length : i;
};

const buildOrderedSubjects = (roadmap: VisualRoadmap): string[] => {
  const seen = new Set<string>();
  for (const sprint of roadmap.sprints) {
    for (const item of sprint.source.items) {
      const t = item.section_title?.trim();
      if (t) seen.add(t);
    }
  }
  const known = Array.from(seen)
    .filter((s) => SUBJECT_ORDER.includes(s))
    .sort((a, b) => subjectIdx(a) - subjectIdx(b));
  const unknown = Array.from(seen)
    .filter((s) => !SUBJECT_ORDER.includes(s))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
};

const buildSubjectGroups = (
  sprint: VisualRoadmap['sprints'][number]
): Map<string, ModuleRow[]> => {
  const bySubject = new Map<string, Map<string, ModuleRow>>();

  for (const item of sprint.source.items) {
    const subject = item.section_title?.trim() || 'Other';
    const name = item.submodule_name?.trim() || 'Без названия';
    const key = name.toLowerCase();

    if (!bySubject.has(subject)) bySubject.set(subject, new Map());
    const modules = bySubject.get(subject)!;
    const existing = modules.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      modules.set(key, { name, count: 1 });
    }
  }

  const result = new Map<string, ModuleRow[]>();
  for (const [subject, modules] of bySubject.entries()) {
    result.set(subject, Array.from(modules.values()));
  }
  return result;
};

/* ── component ───────────────────────────────────────────────── */

interface ResultsSprintCarouselProps {
  roadmapOutput: CanonicalRoadmapOutput;
}

const ResultsSprintCarousel: React.FC<ResultsSprintCarouselProps> = ({ roadmapOutput }) => {
  const roadmap = useMemo(() => buildVisualRoadmapModel(roadmapOutput), [roadmapOutput]);
  const allSubjects = useMemo(() => buildOrderedSubjects(roadmap), [roadmap]);

  return (
    <div className="relative">
      <div
        className="overflow-x-auto pb-4 scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity'
        }}
      >
        <div className="flex gap-5 px-1 py-1 min-w-max">
          {roadmap.sprints.map((sprint) => {
            const groups = buildSubjectGroups(sprint);
            const activeSubjects = allSubjects.filter(
              (s) => (groups.get(s)?.length ?? 0) > 0
            );

            return (
              <div
                key={sprint.sprintNumber}
                className="w-[280px] min-w-[280px] flex-shrink-0 rounded-2xl bg-white shadow-sm border border-slate-200/60"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* sprint header */}
                <div className="px-4 pt-4 pb-3">
                  <span className="block text-[15px] font-bold text-slate-900">
                    Спринт {sprint.sprintNumber}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Недели {sprint.weekStartIndex}–{sprint.weekEndIndex}
                  </span>
                </div>

                {/* subject groups with colored left border */}
                <div className="px-4 pb-4 space-y-2.5">
                  {activeSubjects.map((subject) => {
                    const modules = groups.get(subject) ?? [];
                    const color = SUBJECT_COLOR[subject] ?? '#94a3b8';

                    return (
                      <div
                        key={subject}
                        className="border-l-2 pl-3"
                        style={{ borderColor: color }}
                      >
                        <span
                          className="text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color }}
                        >
                          {SUBJECT_LABELS_RU[subject] ?? subject}
                        </span>
                        <ul className="mt-0.5">
                          {modules.map((mod) => (
                            <li
                              key={mod.name}
                              className="text-[13px] leading-[1.45] text-slate-700"
                            >
                              {mod.name}
                              {mod.count > 1 && (
                                <span className="ml-1 text-[11px] font-semibold text-slate-400">
                                  &times;{mod.count}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  {activeSubjects.length === 0 && (
                    <p className="text-[13px] text-slate-400 italic">Нет модулей</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* right-edge fade gradient for scroll affordance */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 to-transparent md:hidden" />
    </div>
  );
};

export default ResultsSprintCarousel;
