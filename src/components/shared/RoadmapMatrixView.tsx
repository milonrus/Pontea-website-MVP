import React from 'react';
import type { SprintItem, CanonicalRoadmapOutput } from '@/lib/roadmap-generator/types';

const SECTION_ORDER = [
  'Text Comprehension',
  'Logical reasoning',
  'Drawing & Representation',
  'Math',
  'Physics',
  'General culture',
  'History',
  'History of Art & Architecture',
];

const SECTION_LABELS: Record<string, string> = {
  'Text Comprehension': 'Чтение',
  'Logical reasoning': 'Логика',
  'Drawing & Representation': 'Черчение',
  'Math': 'Математика',
  'Physics': 'Физика',
  'General culture': 'Общая культура',
  'History': 'История',
  'History of Art & Architecture': 'Ист. искусства',
};

const SECTION_COLORS: Record<string, string> = {
  'Text Comprehension': '#1d4ed8',
  'Logical reasoning': '#0f766e',
  'Drawing & Representation': '#b45309',
  'Math': '#7c3aed',
  'Physics': '#a855f7',
  'General culture': '#b91c1c',
  'History': '#dc2626',
  'History of Art & Architecture': '#ef4444',
};

const SECTION_BG: Record<string, string> = {
  'Text Comprehension': 'bg-blue-50',
  'Logical reasoning': 'bg-teal-50',
  'Drawing & Representation': 'bg-amber-50',
  'Math': 'bg-violet-50',
  'Physics': 'bg-purple-50',
  'General culture': 'bg-red-50',
  'History': 'bg-rose-50',
  'History of Art & Architecture': 'bg-pink-50',
};

interface RoadmapMatrixViewProps {
  roadmap: CanonicalRoadmapOutput;
}

const RoadmapMatrixView: React.FC<RoadmapMatrixViewProps> = ({ roadmap }) => {
  const { sprints } = roadmap;
  const sprintCount = sprints.length;

  // Collect which sections actually appear in the data
  const activeSectionsSet = new Set<string>();
  for (const s of sprints) {
    for (const item of s.items) activeSectionsSet.add(item.section_title);
  }
  const activeSections = SECTION_ORDER.filter((s) => activeSectionsSet.has(s));

  // Build lookup: sectionTitle → sprintNumber → items[]
  const lookup = new Map<string, Map<number, SprintItem[]>>();
  for (const sec of activeSections) lookup.set(sec, new Map());
  for (const s of sprints) {
    for (const item of s.items) {
      const secMap = lookup.get(item.section_title);
      if (!secMap) continue;
      const existing = secMap.get(s.sprint_number) ?? [];
      existing.push(item);
      secMap.set(s.sprint_number, existing);
    }
  }

  const totalRows = activeSections.length + 2;
  const COL_W = 280;

  return (
    <div
      className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="bg-gray-200"
        style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${sprintCount}, ${COL_W}px)`,
          gap: '1px',
          minWidth: 140 + sprintCount * COL_W + sprintCount,
        }}
      >
        {/* ── ROW 0: Header ─────────────────────────────── */}
        <div
          className="bg-gray-50 px-3 py-3 flex items-end"
          style={{ gridColumn: 1, gridRow: 1, position: 'sticky', left: 0, zIndex: 20 }}
        >
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Subject</span>
        </div>
        {sprints.map((s, i) => (
          <div
            key={`hdr-${s.sprint_number}`}
            className="bg-gray-50 px-3 py-3 text-center"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <div className="text-sm font-bold text-primary">Sprint {s.sprint_number}</div>
            <div className="text-[11px] text-gray-500">
              wk {s.week_start_index}–{s.week_end_index}
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              {(s.totals.planned_utilization_pct * 100).toFixed(0)}% util
            </div>
          </div>
        ))}

        {/* ── ROWS 1..N: Sections (row-first) ────────────── */}
        {activeSections.map((section, secIdx) => {
          const rowNum = secIdx + 2;
          const secMap = lookup.get(section)!;
          const color = SECTION_COLORS[section] ?? '#64748b';
          const bg = SECTION_BG[section] ?? 'bg-gray-50';
          const label = SECTION_LABELS[section] ?? section;

          return (
            <React.Fragment key={section}>
              {/* Row label (sticky) */}
              <div
                className={`${bg} px-3 py-3 flex items-center`}
                style={{
                  gridColumn: 1,
                  gridRow: rowNum,
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>{label}</span>
              </div>

              {/* Content cells across all sprints */}
              {sprints.map((s, i) => {
                const items = secMap.get(s.sprint_number) ?? [];
                return (
                  <div
                    key={`cell-${section}-${s.sprint_number}`}
                    className="bg-white px-3 py-2.5"
                    style={{ gridColumn: i + 2, gridRow: rowNum }}
                  >
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[36px]">
                        <span className="text-gray-300 text-xs">—</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item, ii) => {
                          const hours = (item.total_minutes_est / 60).toFixed(1);
                          const questions =
                            item.planned_practice_questions_unique + item.planned_practice_questions_retake;
                          return (
                            <div key={ii} className="text-[11px] leading-tight">
                              <div className="font-medium text-gray-800 truncate" title={item.submodule_name}>
                                {item.submodule_name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                                <span>{hours}h</span>
                                {questions > 0 && (
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                    style={{ backgroundColor: `${color}15`, color }}
                                  >
                                    {questions}q
                                  </span>
                                )}
                                {item.exercise_priority === 'high' && (
                                  <span className="text-[10px] font-bold text-red-500">!</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* ── LAST ROW: Footer ──────────────────────────── */}
        <div
          className="bg-gray-50 px-3 py-2"
          style={{ gridColumn: 1, gridRow: totalRows, position: 'sticky', left: 0, zIndex: 10 }}
        >
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
        </div>
        {sprints.map((s, i) => {
          const totalH = (s.totals.planned_minutes_sum / 60).toFixed(1);
          return (
            <div
              key={`ftr-${s.sprint_number}`}
              className="bg-gray-50 px-3 py-2 text-center"
              style={{ gridColumn: i + 2, gridRow: totalRows }}
            >
              <span className="text-xs font-bold text-primary">{totalH}h</span>
              {s.totals.unused_minutes > 0 && (
                <span className="ml-1.5 text-[10px] text-gray-400">
                  (+{(s.totals.unused_minutes / 60).toFixed(1)}h flex)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapMatrixView;
