"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Button from '@/components/shared/Button';
import CourseOverviewPanel from '@/components/admin/roadmap/CourseOverviewPanel';
import { buildVisualRoadmapModel, formatExamPartLabel } from '@/components/admin/roadmap/model';
import { getRoadmapTheme, ROADMAP_VIEW_OPTIONS } from '@/components/admin/roadmap/themes';
import { RoadmapViewMode } from '@/components/admin/roadmap/types';
import {
  CleanSprintView,
  CommandCenterRoadmapView,
  RhythmHeatboardView,
  SimpleModulesView
} from '@/components/admin/roadmap/views';
import RoadmapMatrixView from '@/components/shared/RoadmapMatrixView';
import { SnapshotStrip } from '@/components/admin/roadmap/views/shared';
import {
  ROADMAP_PLAYGROUND_SEED_TEXT,
  ROADMAP_PLAYGROUND_STORAGE_KEY
} from '@/data/roadmap-playground-seed';
import { generateRoadmaps } from '@/lib/roadmap-generator/engine';
import { CanonicalRoadmapOutput, RoadmapGenerationResult } from '@/lib/roadmap-generator/types';
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Download,
  FlaskConical,
  Play,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

type ParseErrors = {
  core?: string;
  levels?: string;
  course?: string;
  config?: string;
  checkpoint?: string;
};

const DEPRECATED_SUBMODULE_PREFIXES = ['intro references'];

const badgeClassByMode: Record<string, string> = {
  full: 'bg-green-100 text-green-700 border-green-200',
  full_attempt: 'bg-amber-100 text-amber-700 border-amber-200',
  minimal: 'bg-blue-100 text-blue-700 border-blue-200'
};

const ROADMAP_PLAYGROUND_VIEW_MODE_STORAGE_KEY = 'roadmap-playground-view-mode-v1';

const sanitizeCourseText = (source: string): string => {
  if (!source.trim()) return source;

  try {
    const parsed = JSON.parse(source);
    const hasWrapper =
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      'course_modular_overview' in parsed;
    const overview = hasWrapper ? parsed.course_modular_overview : parsed;

    if (
      overview === null ||
      typeof overview !== 'object' ||
      Array.isArray(overview) ||
      !Array.isArray(overview.sections)
    ) {
      return source;
    }

    let changed = false;
    const sanitizedSections = overview.sections.map((section: any) => {
      if (!section || typeof section !== 'object' || !Array.isArray(section.submodules)) return section;
      const filtered = section.submodules.filter((submodule: any) => {
        const name = typeof submodule?.name === 'string' ? submodule.name.trim().toLowerCase() : '';
        const shouldRemove = DEPRECATED_SUBMODULE_PREFIXES.some((prefix) => name.startsWith(prefix));
        if (shouldRemove) changed = true;
        return !shouldRemove;
      });
      if (filtered.length === section.submodules.length) return section;
      return {
        ...section,
        submodules: filtered
      };
    });

    if (!changed) return source;

    const sanitizedOverview = {
      ...overview,
      sections: sanitizedSections
    };

    const payload = hasWrapper
      ? {
          ...parsed,
          course_modular_overview: sanitizedOverview
        }
      : sanitizedOverview;

    return JSON.stringify(payload, null, 2);
  } catch {
    return source;
  }
};

const RoadmapPlaygroundPage: React.FC = () => {
  const [weeksToExam, setWeeksToExam] = useState(ROADMAP_PLAYGROUND_SEED_TEXT.weeks_to_exam);
  const [useManualHours, setUseManualHours] = useState(false);
  const [manualHoursPerWeek, setManualHoursPerWeek] = useState(
    ROADMAP_PLAYGROUND_SEED_TEXT.hours_per_week
  );
  const [levelsBySectionText, setLevelsBySectionText] = useState(
    ROADMAP_PLAYGROUND_SEED_TEXT.levels_by_section
  );
  const [courseText, setCourseText] = useState(ROADMAP_PLAYGROUND_SEED_TEXT.course_modular_overview);
  const [configText, setConfigText] = useState(ROADMAP_PLAYGROUND_SEED_TEXT.config_overrides);
  const [checkpointText, setCheckpointText] = useState(ROADMAP_PLAYGROUND_SEED_TEXT.checkpoint_history);

  const [result, setResult] = useState<RoadmapGenerationResult | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseErrors>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [determinismOk, setDeterminismOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedRoadmapIndex, setCopiedRoadmapIndex] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadedRoadmapIndex, setDownloadedRoadmapIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<RoadmapViewMode>('results_matrix');
  const [expandedSprintByRoadmap, setExpandedSprintByRoadmap] = useState<
    Record<number, number | null>
  >({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROADMAP_PLAYGROUND_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setWeeksToExam(parsed.weeksToExam ?? ROADMAP_PLAYGROUND_SEED_TEXT.weeks_to_exam);
      setUseManualHours(Boolean(parsed.useManualHours));
      setManualHoursPerWeek(
        parsed.manualHoursPerWeek ?? ROADMAP_PLAYGROUND_SEED_TEXT.hours_per_week
      );
      setLevelsBySectionText(parsed.levelsBySectionText ?? ROADMAP_PLAYGROUND_SEED_TEXT.levels_by_section);
      const storedCourseText = parsed.courseText ?? ROADMAP_PLAYGROUND_SEED_TEXT.course_modular_overview;
      setCourseText(sanitizeCourseText(storedCourseText));
      setConfigText(parsed.configText ?? ROADMAP_PLAYGROUND_SEED_TEXT.config_overrides);
      setCheckpointText(parsed.checkpointText ?? ROADMAP_PLAYGROUND_SEED_TEXT.checkpoint_history);
    } catch {
      // Keep defaults if storage is invalid.
    }
  }, []);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(ROADMAP_PLAYGROUND_VIEW_MODE_STORAGE_KEY);
      if (!savedMode) return;
      const parsed = JSON.parse(savedMode);
      if (typeof parsed?.mode === 'string') {
        const valid = ROADMAP_VIEW_OPTIONS.some((option) => option.mode === parsed.mode);
        if (valid) {
          setViewMode(parsed.mode as RoadmapViewMode);
        }
      }
    } catch {
      // Ignore invalid local storage payload for view mode.
    }
  }, []);

  useEffect(() => {
    const payload = {
      weeksToExam,
      useManualHours,
      manualHoursPerWeek,
      levelsBySectionText,
      courseText,
      configText,
      checkpointText
    };

    localStorage.setItem(ROADMAP_PLAYGROUND_STORAGE_KEY, JSON.stringify(payload));
  }, [
    weeksToExam,
    useManualHours,
    manualHoursPerWeek,
    levelsBySectionText,
    courseText,
    configText,
    checkpointText
  ]);

  useEffect(() => {
    localStorage.setItem(
      ROADMAP_PLAYGROUND_VIEW_MODE_STORAGE_KEY,
      JSON.stringify({ mode: viewMode })
    );
  }, [viewMode]);

  const totalRoadmaps = result?.roadmaps.length ?? 0;

  const handleReset = () => {
    setWeeksToExam(ROADMAP_PLAYGROUND_SEED_TEXT.weeks_to_exam);
    setUseManualHours(false);
    setManualHoursPerWeek(ROADMAP_PLAYGROUND_SEED_TEXT.hours_per_week);
    setLevelsBySectionText(ROADMAP_PLAYGROUND_SEED_TEXT.levels_by_section);
    setCourseText(ROADMAP_PLAYGROUND_SEED_TEXT.course_modular_overview);
    setConfigText(ROADMAP_PLAYGROUND_SEED_TEXT.config_overrides);
    setCheckpointText(ROADMAP_PLAYGROUND_SEED_TEXT.checkpoint_history);
    setParseErrors({});
    setRunError(null);
    setResult(null);
    setDeterminismOk(null);
    setViewMode('results_matrix');
    setExpandedSprintByRoadmap({});
  };

  const parseInput = () => {
    const errors: ParseErrors = {};
    setRunError(null);

    const weeks = Number(weeksToExam);
    const manualHours = Number(manualHoursPerWeek);

    if (!Number.isFinite(weeks)) {
      errors.core = 'weeks_to_exam must be a numeric value.';
    }
    if (useManualHours && (!Number.isFinite(manualHours) || manualHours <= 0)) {
      errors.core = 'manual hours_per_week must be a numeric value > 0.';
    }

    let levelsBySection: Record<string, number> = {};
    let courseParsed: any;
    let configOverrides: any;
    let checkpointHistory: any;

    try {
      levelsBySection = JSON.parse(levelsBySectionText);
    } catch (error: any) {
      errors.levels = `Invalid levels_by_section JSON: ${error.message}`;
    }

    try {
      const raw = JSON.parse(courseText);
      courseParsed = raw.course_modular_overview ? raw.course_modular_overview : raw;
      if (!courseParsed || !Array.isArray(courseParsed.sections)) {
        errors.course = 'course_modular_overview must contain a sections array.';
      }
    } catch (error: any) {
      errors.course = `Invalid course JSON: ${error.message}`;
    }

    try {
      configOverrides = JSON.parse(configText);
    } catch (error: any) {
      errors.config = `Invalid config_overrides JSON: ${error.message}`;
    }

    try {
      checkpointHistory = JSON.parse(checkpointText);
      if (!Array.isArray(checkpointHistory)) {
        errors.checkpoint = 'checkpoint_history must be an array.';
      }
    } catch (error: any) {
      errors.checkpoint = `Invalid checkpoint_history JSON: ${error.message}`;
    }

    setParseErrors(errors);

    if (Object.keys(errors).length > 0) {
      return null;
    }

    const parsed: any = {
      weeks_to_exam: weeks,
      levels_by_section: levelsBySection,
      course_modular_overview: courseParsed,
      checkpoint_history: checkpointHistory,
      config_overrides: configOverrides
    };

    if (useManualHours) {
      parsed.hours_per_week = manualHours;
      parsed.config_overrides = {
        ...(parsed.config_overrides || {}),
        USE_INPUT_HOURS_IF_PROVIDED: true
      };
    }

    return parsed;
  };

  const handleRun = () => {
    const parsedInput = parseInput();
    if (!parsedInput) return;

    try {
      const first = generateRoadmaps(parsedInput);
      const second = generateRoadmaps(parsedInput);

      const determinism = JSON.stringify(first.roadmaps) === JSON.stringify(second.roadmaps);
      setDeterminismOk(determinism);

      setResult(first);
      setExpandedSprintByRoadmap({});
      setRunError(null);
    } catch (error: any) {
      setRunError(error.message || 'Failed to generate roadmap.');
      setResult(null);
    }
  };

  const handleCopyOutput = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(JSON.stringify(result.roadmaps, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyRoadmap = async (roadmap: CanonicalRoadmapOutput, index: number) => {
    await navigator.clipboard.writeText(JSON.stringify(roadmap, null, 2));
    setCopiedRoadmapIndex(index);
    setTimeout(() => setCopiedRoadmapIndex(null), 1500);
  };

  const downloadJson = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOutput = () => {
    if (!result) return;

    downloadJson('roadmaps-output.json', result.roadmaps);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  };

  const handleDownloadRoadmap = (roadmap: CanonicalRoadmapOutput, index: number) => {
    downloadJson(`roadmap-${index + 1}-${roadmap.metadata.generated_mode}.json`, roadmap);
    setDownloadedRoadmapIndex(index);
    setTimeout(() => setDownloadedRoadmapIndex(null), 1500);
  };

  const toggleSprintDetails = (roadmapIndex: number, sprintNumber: number) => {
    setExpandedSprintByRoadmap((prev) => ({
      ...prev,
      [roadmapIndex]: prev[roadmapIndex] === sprintNumber ? null : sprintNumber
    }));
  };

  const renderRoadmapVisualView = (
    mode: RoadmapViewMode,
    roadmapIndex: number,
    roadmap: CanonicalRoadmapOutput,
    visualRoadmap: ReturnType<typeof buildVisualRoadmapModel>
  ) => {
    const expandedSprint = expandedSprintByRoadmap[roadmapIndex] ?? null;
    const sharedProps = {
      roadmap: visualRoadmap,
      expandedSprint,
      onToggleSprint: (sprintNumber: number) => toggleSprintDetails(roadmapIndex, sprintNumber)
    };

    if (mode === 'rhythm_heatboard') return <RhythmHeatboardView {...sharedProps} />;
    if (mode === 'simple_modules') return <SimpleModulesView {...sharedProps} />;
    if (mode === 'command_center') return <CommandCenterRoadmapView {...sharedProps} />;
    if (mode === 'clean_sprint') return <CleanSprintView {...sharedProps} />;
    return <RoadmapMatrixView roadmap={roadmap} />;
  };

  const renderRoadmapCard = (roadmap: CanonicalRoadmapOutput, index: number) => {
    const generationMode = roadmap.metadata.generated_mode;
    const theme = getRoadmapTheme(viewMode);
    const visualRoadmap = buildVisualRoadmapModel(roadmap);
    const feasibility = roadmap.metadata.feasibility;
    const isDarkTheme = false;
    const isSimpleModules = viewMode === 'simple_modules';
    const titleTextClass = isDarkTheme ? 'text-cyan-100' : 'text-slate-900';
    const bodyTextClass = isDarkTheme ? 'text-cyan-100/85' : 'text-slate-700';
    const subtlePanelClass = isDarkTheme
      ? 'border-cyan-900/80 bg-slate-950/60'
      : 'border-white/70 bg-white/65';
    const summaryTextClass = isDarkTheme ? 'text-cyan-100 marker:text-cyan-300' : 'text-slate-800 marker:text-slate-500';
    const secondaryTableClass = isDarkTheme
      ? 'border-cyan-900 bg-slate-950/70 text-cyan-100'
      : 'border-slate-200 bg-white text-slate-700';
    const displayedHoursPerWeek = roadmap.metadata.optimal_hours_per_week ?? roadmap.metadata.hours_per_week;

    return (
      <section
        key={`${generationMode}-${index}`}
        className={`${theme.wrapperClass} ${theme.bodyClass} p-5`}
        style={theme.style}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className={`${theme.headingClass} text-xl font-semibold ${titleTextClass}`}>
              Roadmap #{index + 1}
            </h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                badgeClassByMode[generationMode] || 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {generationMode}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chipClass}`}>
              View: {theme.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCopyRoadmap(roadmap, index)}>
              <Clipboard className="w-4 h-4 mr-2" />
              {copiedRoadmapIndex === index ? 'Copied' : 'Copy Raw JSON'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownloadRoadmap(roadmap, index)}>
              <Download className="w-4 h-4 mr-2" />
              {downloadedRoadmapIndex === index ? 'Downloaded' : 'Download Raw JSON'}
            </Button>
          </div>
        </div>

        <p className={`${theme.bodyClass} mt-2 text-sm ${bodyTextClass}`}>{theme.subtitle}</p>
        {!isSimpleModules && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 ${secondaryTableClass}`}>
              Optimal hours/week: {displayedHoursPerWeek.toFixed(1)}h
            </span>
            {roadmap.metadata.manual_hours_override_applied && (
              <span className={`rounded-full border px-2.5 py-1 ${secondaryTableClass}`}>
                Manual override active
              </span>
            )}
          </div>
        )}

        {!isSimpleModules && (
          <div className="mt-4">
            <SnapshotStrip roadmap={visualRoadmap} metricClassName="border-white/65" />
          </div>
        )}

        {!isSimpleModules && feasibility.notes.length > 0 && (
          <div className={`mt-3 rounded-2xl p-3 text-xs ${theme.cardClass}`}>
            <p className={`font-semibold ${titleTextClass}`}>Feasibility notes</p>
            <div className={`mt-1 space-y-1 ${bodyTextClass}`}>
              {feasibility.notes.map((note, noteIndex) => (
                <p key={`${generationMode}-note-${noteIndex}`}>{note}</p>
              ))}
            </div>
          </div>
        )}

        <div className={`mt-4 rounded-2xl border p-3 backdrop-blur ${subtlePanelClass}`}>
          <p className={`${theme.headingClass} mb-2 text-sm font-semibold ${titleTextClass}`}>
            Visualization mode
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {ROADMAP_VIEW_OPTIONS.map((option) => (
              <button
                key={option.mode}
                type="button"
                onClick={() => setViewMode(option.mode)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  viewMode === option.mode
                    ? isDarkTheme
                      ? 'border-cyan-300 bg-cyan-300/22 text-cyan-100'
                      : 'border-slate-900 bg-slate-900 text-white'
                    : isDarkTheme
                      ? 'border-cyan-900 bg-slate-900/70 text-cyan-100/85 hover:bg-slate-800/80'
                      : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                <span className="block">{option.title}</span>
                <span
                  className={`mt-1 block text-[11px] font-normal ${
                    viewMode === option.mode ? 'opacity-90' : isDarkTheme ? 'text-cyan-200/80' : 'text-slate-500'
                  }`}
                >
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-4 rounded-2xl p-3 ${theme.cardClass}`}>
          {renderRoadmapVisualView(viewMode, index, roadmap, visualRoadmap)}
        </div>

        {!isSimpleModules && (
          <details className={`group mt-4 rounded-2xl border p-3 ${subtlePanelClass}`}>
            <summary className={`cursor-pointer text-sm font-semibold ${summaryTextClass}`}>
              Technical breakdown (collapsed by default)
            </summary>
            <div className="mt-3 space-y-4 text-xs">
              <div>
                <p className={`font-semibold ${titleTextClass}`}>Exam parts summary</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {roadmap.exam_parts_summary.map((part) => (
                    <div key={part.exam_part} className={`rounded-xl border p-2.5 ${secondaryTableClass}`}>
                      <p className={`font-semibold ${titleTextClass}`}>{formatExamPartLabel(part.exam_part)}</p>
                      <p className={`mt-1 ${bodyTextClass}`}>Level: {part.part_level}</p>
                      <p className={bodyTextClass}>Required: {part.required_minutes_full} min</p>
                      <p className={bodyTextClass}>Allocated: {part.allocated_minutes_plan} min</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className={`font-semibold ${titleTextClass}`}>Sprint diagnostics</p>
                <div className="mt-2 overflow-x-auto">
                  <table className={`min-w-full overflow-hidden rounded-xl border text-xs ${secondaryTableClass}`}>
                    <thead className={isDarkTheme ? 'bg-slate-900/80 text-cyan-100' : 'bg-slate-100 text-slate-700'}>
                      <tr>
                        <th className="px-2 py-2 text-left">Sprint</th>
                        <th className="px-2 py-2 text-left">Weeks</th>
                        <th className="px-2 py-2 text-right">Planned (min)</th>
                        <th className="px-2 py-2 text-right">Utilization</th>
                        <th className="px-2 py-2 text-right">Flex Time</th>
                        <th className="px-2 py-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody className={isDarkTheme ? 'bg-slate-950/60' : 'bg-white'}>
                      {roadmap.sprints.map((sprint) => (
                        <tr
                          key={sprint.sprint_number}
                          className={
                            isDarkTheme
                              ? 'border-t border-cyan-900/70 text-cyan-100/90'
                              : 'border-t border-slate-100 text-slate-700'
                          }
                        >
                          <td className="px-2 py-2 font-medium">S{sprint.sprint_number}</td>
                          <td className="px-2 py-2">
                            {sprint.week_start_index}-{sprint.week_end_index}
                          </td>
                          <td className="px-2 py-2 text-right">{sprint.totals.planned_minutes_sum}</td>
                          <td className="px-2 py-2 text-right">
                            {(sprint.totals.planned_utilization_pct * 100).toFixed(1)}%
                          </td>
                          <td className="px-2 py-2 text-right">{sprint.totals.unused_minutes}</td>
                          <td className="px-2 py-2">{sprint.totals.unused_reason || 'n/a'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className={`font-semibold ${titleTextClass}`}>High-level sprint module flow</p>
                <div className="mt-2 space-y-3">
                  {roadmap.sprints.map((sprint) => (
                    <div
                      key={`flow-${sprint.sprint_number}`}
                      className={`rounded-xl border p-2.5 ${secondaryTableClass}`}
                    >
                      <p className={`mb-2 text-[11px] font-semibold ${titleTextClass}`}>
                        Sprint {sprint.sprint_number} ({sprint.week_start_index}-{sprint.week_end_index})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className={isDarkTheme ? 'text-cyan-200/90' : 'text-slate-600'}>
                            <tr>
                              <th className="px-2 py-1 text-left">Module</th>
                              <th className="px-2 py-1 text-right">Est. hours</th>
                              <th className="px-2 py-1 text-left">Questions</th>
                              <th className="px-2 py-1 text-left">Priority</th>
                              <th className="px-2 py-1 text-left">Chunk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sprint.items.map((item, itemIndex) => (
                              <tr
                                key={`flow-item-${sprint.sprint_number}-${itemIndex}`}
                                className={
                                  isDarkTheme
                                    ? 'border-t border-cyan-900/60 text-cyan-100/90'
                                    : 'border-t border-slate-200 text-slate-700'
                                }
                              >
                                <td className="px-2 py-1">
                                  {item.section_title}
                                  {' -> '}
                                  {item.submodule_name}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {(item.total_minutes_est / 60).toFixed(1)}
                                </td>
                                <td className="px-2 py-1">
                                  {item.planned_practice_questions_range ||
                                    String(
                                      item.planned_practice_questions_unique +
                                        item.planned_practice_questions_retake
                                    )}
                                </td>
                                <td className="px-2 py-1">{item.exercise_priority || 'n/a'}</td>
                                <td className="px-2 py-1">{item.module_chunk_label || 'n/a'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(sprint.practice_blocks || []).length > 0 && (
                        <div className="mt-2 space-y-1 text-[11px]">
                          <p className={`font-semibold ${titleTextClass}`}>Practice blocks</p>
                          {sprint.practice_blocks!.map((block, blockIndex) => (
                            <p key={`flow-block-${sprint.sprint_number}-${blockIndex}`} className={bodyTextClass}>
                              {block.block_type}: {block.questions_range} questions ({block.target_parts.join(', ')})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        )}

        <details className="group mt-3 rounded-2xl border border-slate-900/80 bg-slate-950/95 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-100 marker:text-slate-300">
            Raw JSON (collapsed by default)
          </summary>
          <pre className="mt-3 max-h-[520px] overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(roadmap, null, 2)}
          </pre>
        </details>
      </section>
    );
  };

  const parseErrorCount = useMemo(() => Object.keys(parseErrors).length, [parseErrors]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Roadmap Playground
          </h1>
          <p className="text-gray-500">
            Configure the deterministic sprint roadmap algorithm and inspect canonical output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyOutput} disabled={!result}>
            <Clipboard className="w-4 h-4 mr-2" />
            {copied ? 'Copied' : 'Copy All JSON'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadOutput} disabled={!result}>
            <Download className="w-4 h-4 mr-2" />
            {downloaded ? 'Downloaded' : 'Download All JSON'}
          </Button>
          <Button size="sm" onClick={handleRun}>
            <Play className="w-4 h-4 mr-2" />
            Run Generator
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Core Inputs</h2>
          <div className="space-y-3">
            <label className="text-sm text-gray-700">
              Weeks to exam
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={weeksToExam}
                onChange={(e) => setWeeksToExam(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useManualHours}
                onChange={(e) => setUseManualHours(e.target.checked)}
              />
              Use manual hours override (debug)
            </label>
            {useManualHours && (
              <label className="text-sm text-gray-700">
                Manual hours per week
                <input
                  type="number"
                  min={0.1}
                  step="0.1"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={manualHoursPerWeek}
                  onChange={(e) => setManualHoursPerWeek(e.target.value)}
                />
              </label>
            )}
          </div>
          {parseErrors.core && <p className="text-xs text-red-600 mt-2">{parseErrors.core}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Levels By Section</h2>
          <textarea
            className="w-full h-48 p-3 font-mono text-xs border border-gray-300 rounded-lg"
            value={levelsBySectionText}
            onChange={(e) => setLevelsBySectionText(e.target.value)}
          />
          {parseErrors.levels && <p className="text-xs text-red-600 mt-2">{parseErrors.levels}</p>}
        </div>

        <div className="space-y-4">
          <CourseOverviewPanel courseText={courseText} parseError={parseErrors.course} />

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Course JSON</h2>
            <textarea
              className="w-full h-64 p-3 font-mono text-xs border border-gray-300 rounded-lg"
              value={courseText}
              onChange={(e) => setCourseText(e.target.value)}
            />
            {parseErrors.course && <p className="text-xs text-red-600 mt-2">{parseErrors.course}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Config Overrides</h2>
            <textarea
              className="w-full h-64 p-3 font-mono text-xs border border-gray-300 rounded-lg"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
            />
            {parseErrors.config && <p className="text-xs text-red-600 mt-2">{parseErrors.config}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Checkpoint History</h2>
            <textarea
              className="w-full h-32 p-3 font-mono text-xs border border-gray-300 rounded-lg"
              value={checkpointText}
              onChange={(e) => setCheckpointText(e.target.value)}
            />
            {parseErrors.checkpoint && (
              <p className="text-xs text-red-600 mt-2">{parseErrors.checkpoint}</p>
            )}
          </div>
        </div>
      </div>

      {parseErrorCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Resolve JSON/input errors before running the generator.
        </div>
      )}

      {runError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {runError}
        </div>
      )}

      {determinismOk !== null && (
        <div
          className={`rounded-xl border p-4 text-sm flex items-center gap-2 ${
            determinismOk
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {determinismOk ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              Determinism check passed (two consecutive runs produced identical JSON).
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              Determinism check failed (output changed between two consecutive runs).
            </>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Generated roadmaps: <span className="font-semibold text-gray-900">{totalRoadmaps}</span>
            </p>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Generation successful
            </div>
          </div>
          {result.roadmaps.map(renderRoadmapCard)}
        </div>
      )}
    </div>
  );
};

export default RoadmapPlaygroundPage;
