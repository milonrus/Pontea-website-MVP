'use client';

import React from 'react';

import { DomainResult } from '@/types';
import { AssessmentLocale } from '@/data/assessmentQuestions';

/* ── Domain colors (matches sprint carousel) ───────────────── */

const DOMAIN_COLOR: Record<string, string> = {
  reading_en: '#5e9480',
  logic: '#6090a8',
  drawing_spatial: '#b87860',
  math: '#6080b8',
  physics: '#8670b0',
  humanities: '#b89058',
};

const DOMAIN_LABEL_BY_LOCALE: Record<AssessmentLocale, Record<string, string>> = {
  en: {
    reading_en: 'Reading',
    logic: 'Logic',
    drawing_spatial: 'Drawing',
    math: 'Mathematics',
    physics: 'Physics',
    humanities: 'History and Culture',
  },
  ru: {
    reading_en: 'Чтение',
    logic: 'Логика',
    drawing_spatial: 'Черчение',
    math: 'Математика',
    physics: 'Физика',
    humanities: 'История и культура',
  },
};

const getLabel = (d: DomainResult, locale: AssessmentLocale) =>
  DOMAIN_LABEL_BY_LOCALE[locale][d.domain] ?? d.domainLabel;

const pluralWeeksRu = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'неделя';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'недели';
  return 'недель';
};

const pluralWeeksEn = (n: number): string => (n === 1 ? 'week' : 'weeks');

/* ══════════════════════════════════════════════════════════════
   Radar Chart + Score Cards
   ══════════════════════════════════════════════════════════════ */

interface LevelResultsShowcaseProps {
  domainResults: DomainResult[];
  weeksUntilExam?: number;
  focusRecommendation?: string;
  locale?: AssessmentLocale;
}

const LevelResultsShowcase: React.FC<LevelResultsShowcaseProps> = ({
  domainResults,
  weeksUntilExam,
  focusRecommendation,
  locale = 'ru',
}) => {
  if (!domainResults || domainResults.length === 0) return null;

  const cx = 150, cy = 150, R = 110;
  const n = domainResults.length;

  const pointOnAxis = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [1, 2, 3, 4, 5];

  const dataPoints = domainResults.map((d, i) => pointOnAxis(i, (d.score / 5) * R));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-8">
      {/* Action + Countdown card */}
      {weeksUntilExam != null && (
        <div className="flex-shrink-0 w-64 rounded-2xl bg-white shadow-sm border border-slate-200/60 p-6 flex flex-col items-center justify-center text-center">
          {/* Countdown */}
          <p className="text-sm text-slate-500">
            {locale === 'en' ? 'Time left until exam' : 'До экзамена осталось'}
          </p>
          <span className="text-6xl font-bold font-display text-primary mt-2 leading-none">
            {weeksUntilExam}
          </span>
          <p className="text-lg font-semibold text-primary mt-1">
            {locale === 'en' ? pluralWeeksEn(weeksUntilExam) : pluralWeeksRu(weeksUntilExam)}
          </p>

          {/* Motivational text */}
          <p className={`text-xs mt-4 leading-relaxed max-w-[200px] ${focusRecommendation ? 'text-slate-600' : 'text-slate-400'}`}>
            {focusRecommendation ?? (locale === 'en'
              ? 'We prepared a detailed plan for your current level. Start preparing now.'
              : 'Мы составили детальный план под твой уровень знаний. Начни готовиться уже сейчас.')}
          </p>

          {/* CTA */}
          <a
            href="#pricing"
            className="mt-5 w-full py-3 rounded-xl bg-accent text-primary text-sm font-semibold hover:bg-accent/90 transition-colors text-center cursor-pointer"
          >
            {locale === 'en' ? 'Start Preparing' : 'Начать подготовку'}
          </a>
        </div>
      )}

      {/* Radar SVG */}
      <div className="flex-shrink-0">
        <svg width={300} height={300} viewBox="0 0 300 300" className="drop-shadow-sm">
          {/* Grid rings */}
          {gridLevels.map((level) => {
            const r = (level / 5) * R;
            const pts = Array.from({ length: n }, (_, i) => pointOnAxis(i, r));
            return (
              <polygon
                key={level}
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}

          {/* Axis lines */}
          {domainResults.map((_, i) => {
            const p = pointOnAxis(i, R);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth={1} />;
          })}

          {/* Data polygon */}
          <polygon
            points={polygon}
            fill="rgba(37, 99, 235, 0.15)"
            stroke="#2563eb"
            strokeWidth={2}
          />

          {/* Data points */}
          {dataPoints.map((p, i) => {
            const domainClr = DOMAIN_COLOR[domainResults[i].domain] ?? '#94a3b8';
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={domainClr}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}

          {/* Labels */}
          {domainResults.map((d, i) => {
            const labelR = R + 24;
            const p = pointOnAxis(i, labelR);
            const domainClr = DOMAIN_COLOR[d.domain] ?? '#64748b';
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-semibold"
                fill={domainClr}
              >
                {getLabel(d, locale).split(' / ')[0].split(' ')[0]}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Compact score list */}
      <div className="max-w-sm w-full rounded-2xl bg-white shadow-sm border border-slate-200/60 divide-y divide-slate-100 overflow-hidden">
        {domainResults.map((d, i) => {
          const clr = DOMAIN_COLOR[d.domain] ?? '#94a3b8';
          return (
            <div
              key={d.domain}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: clr }} />
              <span className="text-sm font-medium text-slate-700">{getLabel(d, locale)}</span>
              <div className="flex gap-1.5 items-center ml-auto">
                {[1, 2, 3, 4, 5].map((dot) => (
                  <div
                    key={dot}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dot <= d.score ? '#01278b' : '#e2e8f0' }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelResultsShowcase;
