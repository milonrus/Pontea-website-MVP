import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatExamPartLabel } from '@/components/admin/roadmap/model';
import { VisualRoadmapViewProps } from '@/components/admin/roadmap/views/types';

interface SubjectBucket {
  subject: string;
  examPartLabel: string;
  modules: string[];
}

const bucketSprintSubjects = (
  sprint: VisualRoadmapViewProps['roadmap']['sprints'][number]
): SubjectBucket[] => {
  const map = new Map<string, SubjectBucket>();

  sprint.source.items.forEach((item) => {
    const key = `${item.section_title}::${item.exam_part}`;
    const label = item.module_chunk_label
      ? `${item.submodule_name} (${item.module_chunk_label})`
      : item.submodule_name;

    if (!map.has(key)) {
      map.set(key, {
        subject: item.section_title,
        examPartLabel: formatExamPartLabel(item.exam_part),
        modules: [label]
      });
      return;
    }

    const bucket = map.get(key)!;
    if (!bucket.modules.includes(label)) {
      bucket.modules.push(label);
    }
  });

  return Array.from(map.values());
};

const MinimalModulesView: React.FC<VisualRoadmapViewProps> = ({ roadmap }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">
          Sprint module map
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Minimal view: only subjects and modules per sprint.
        </p>
      </div>

      <div className="space-y-3">
        {roadmap.sprints.map((sprint, sprintIndex) => {
          const subjects = bucketSprintSubjects(sprint);

          return (
            <motion.article
              key={sprint.sprintNumber}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: sprintIndex * 0.015 }}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-slate-900">
                  Sprint {sprint.sprintNumber}
                </p>
                <p className="text-xs text-slate-500">
                  {sprint.weekLabel}
                </p>
              </div>

              {subjects.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  Flex Sprint: optional review, retakes, and recovery time.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {subjects.map((bucket) => (
                    <section key={`${sprint.sprintNumber}-${bucket.subject}-${bucket.examPartLabel}`}>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h5 className="text-sm font-semibold text-slate-900">{bucket.subject}</h5>
                        <span className="text-[11px] uppercase tracking-[0.1em] text-slate-500">
                          {bucket.examPartLabel}
                        </span>
                      </div>

                      <ul className="mt-1 space-y-1">
                        {bucket.modules.map((module) => (
                          <li key={`${bucket.subject}-${module}`} className="text-sm text-slate-700">
                            • {module}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
};

export default MinimalModulesView;
