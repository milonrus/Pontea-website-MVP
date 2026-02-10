import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpenText, Clock3, Layers3, ListChecks } from 'lucide-react';

interface CourseOverviewPanelProps {
  courseText: string;
  parseError?: string;
}

interface RawSubmoduleStats {
  lessons_video_minutes?: unknown;
  timed_text_minutes?: unknown;
  untimed_text_items?: unknown;
  questions_total?: unknown;
  total_time_minutes?: unknown;
  [key: string]: unknown;
}

interface RawSubmodule {
  name?: unknown;
  stats?: RawSubmoduleStats;
  [key: string]: unknown;
}

interface RawSection {
  title?: unknown;
  submodules?: unknown;
  [key: string]: unknown;
}

interface CourseOverviewShape {
  sections: RawSection[];
}

interface OverviewSubmoduleRow {
  name: string;
  videoMinutes: number;
  timedTextMinutes: number;
  untimedItems: number;
  questionsTotal: number;
  totalMinutes: number;
}

interface OverviewSection {
  title: string;
  submoduleCount: number;
  questionsTotal: number;
  totalMinutes: number;
  rows: OverviewSubmoduleRow[];
}

const parseFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toNonNegative = (value: unknown): number => {
  const parsed = parseFiniteNumber(value);
  if (parsed === null) return 0;
  return Math.max(0, parsed);
};

const toCount = (value: unknown): number => Math.round(toNonNegative(value));

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const toSectionId = (title: string): string =>
  `course-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const parseCourseOverview = (
  source: string
): { overview: CourseOverviewShape | null; error: string | null } => {
  if (!source.trim()) {
    return { overview: null, error: 'Course JSON is empty.' };
  }

  try {
    const parsed = JSON.parse(source);
    const overviewCandidate =
      parsed && typeof parsed === 'object' && 'course_modular_overview' in parsed
        ? (parsed as { course_modular_overview?: unknown }).course_modular_overview
        : parsed;

    if (
      !overviewCandidate ||
      typeof overviewCandidate !== 'object' ||
      !Array.isArray((overviewCandidate as { sections?: unknown[] }).sections)
    ) {
      return {
        overview: null,
        error: 'Course JSON must be an object with a `sections` array.'
      };
    }

    return {
      overview: {
        sections: (overviewCandidate as { sections: RawSection[] }).sections
      },
      error: null
    };
  } catch (error: any) {
    return {
      overview: null,
      error: `Invalid course JSON: ${error?.message || 'Unknown parsing error'}`
    };
  }
};

const CourseOverviewPanel: React.FC<CourseOverviewPanelProps> = ({ courseText, parseError }) => {
  const [activeSectionTitle, setActiveSectionTitle] = useState<string>('');

  const parseResult = useMemo(() => parseCourseOverview(courseText), [courseText]);

  const sections = useMemo<OverviewSection[]>(() => {
    if (!parseResult.overview) return [];

    return parseResult.overview.sections
      .filter((section) => typeof section.title === 'string' && section.title.trim().length > 0)
      .map((section) => {
        const submodules = Array.isArray(section.submodules) ? (section.submodules as RawSubmodule[]) : [];

        const rows: OverviewSubmoduleRow[] = submodules.map((submodule, index) => {
          const stats = submodule.stats || {};
          const videoMinutes = toNonNegative(stats.lessons_video_minutes);
          const timedTextMinutes = toNonNegative(stats.timed_text_minutes);
          const untimedItems = toCount(stats.untimed_text_items);
          const questionsTotal = toCount(stats.questions_total);

          const explicitTotalMinutes = parseFiniteNumber(stats.total_time_minutes);
          const totalMinutes =
            explicitTotalMinutes !== null ? Math.max(0, explicitTotalMinutes) : videoMinutes + timedTextMinutes;

          return {
            name:
              typeof submodule.name === 'string' && submodule.name.trim().length > 0
                ? submodule.name
                : `Submodule ${index + 1}`,
            videoMinutes,
            timedTextMinutes,
            untimedItems,
            questionsTotal,
            totalMinutes
          };
        });

        const questionsTotal = rows.reduce((sum, row) => sum + row.questionsTotal, 0);
        const totalMinutes = rows.reduce((sum, row) => sum + row.totalMinutes, 0);

        return {
          title: section.title as string,
          submoduleCount: rows.length,
          questionsTotal,
          totalMinutes,
          rows
        };
      });
  }, [parseResult.overview]);

  useEffect(() => {
    if (sections.length === 0) {
      if (activeSectionTitle) setActiveSectionTitle('');
      return;
    }

    const activeStillPresent = sections.some((section) => section.title === activeSectionTitle);
    if (!activeStillPresent) {
      setActiveSectionTitle(sections[0].title);
    }
  }, [sections, activeSectionTitle]);

  const selectedSection = useMemo(
    () => sections.find((section) => section.title === activeSectionTitle) ?? null,
    [sections, activeSectionTitle]
  );

  const totals = useMemo(() => {
    const sectionCount = sections.length;
    const submoduleCount = sections.reduce((sum, section) => sum + section.submoduleCount, 0);
    const questionsTotal = sections.reduce((sum, section) => sum + section.questionsTotal, 0);
    const totalMinutes = sections.reduce((sum, section) => sum + section.totalMinutes, 0);

    return {
      sectionCount,
      submoduleCount,
      questionsTotal,
      totalMinutes
    };
  }, [sections]);

  const displayError = parseResult.error ? parseError || parseResult.error : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-200/30 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-amber-200/30 blur-2xl" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Course JSON Overview</h2>
            <p className="text-xs text-slate-600">
              Switch sections like Math and Physics to inspect structure and workload.
            </p>
          </div>
          <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600">
            Live from Course JSON
          </span>
        </div>

        {displayError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{displayError}</p>
          </div>
        )}

        {!displayError && sections.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
            No sections were found in `course_modular_overview.sections`.
          </div>
        )}

        {!displayError && sections.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                  <Layers3 className="h-3.5 w-3.5" />
                  Sections
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{totals.sectionCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                  <BookOpenText className="h-3.5 w-3.5" />
                  Submodules
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{totals.submoduleCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  Questions
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{totals.questionsTotal}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  Total Minutes
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(totals.totalMinutes)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div
                role="tablist"
                aria-label="Course sections"
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
              >
                {sections.map((section) => {
                  const tabId = toSectionId(section.title);
                  const isActive = selectedSection?.title === section.title;

                  return (
                    <button
                      key={section.title}
                      type="button"
                      role="tab"
                      id={`${tabId}-tab`}
                      aria-selected={isActive}
                      aria-controls={`${tabId}-panel`}
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-100 text-cyan-900'
                          : 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100'
                      }`}
                      onClick={() => setActiveSectionTitle(section.title)}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </div>

              {selectedSection && (
                <div
                  role="tabpanel"
                  id={`${toSectionId(selectedSection.title)}-panel`}
                  aria-labelledby={`${toSectionId(selectedSection.title)}-tab`}
                  className="rounded-xl border border-slate-200 bg-white/90 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {selectedSection.submoduleCount} submodules
                    </span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {selectedSection.questionsTotal} questions
                    </span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {formatNumber(selectedSection.totalMinutes)} minutes
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Submodule</th>
                          <th className="px-3 py-2 text-right font-semibold">Video (min)</th>
                          <th className="px-3 py-2 text-right font-semibold">Timed text (min)</th>
                          <th className="px-3 py-2 text-right font-semibold">Untimed</th>
                          <th className="px-3 py-2 text-right font-semibold">Questions</th>
                          <th className="px-3 py-2 text-right font-semibold">Total (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSection.rows.map((row, index) => (
                          <tr key={`${row.name}-${index}`} className="border-t border-slate-100 hover:bg-slate-50/70">
                            <td className="px-3 py-2 text-slate-800">{row.name}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.videoMinutes)}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.timedTextMinutes)}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{row.untimedItems}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{row.questionsTotal}</td>
                            <td className="px-3 py-2 text-right font-medium text-slate-900">
                              {formatNumber(row.totalMinutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CourseOverviewPanel;
