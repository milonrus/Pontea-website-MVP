'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import ResultsSprintCarousel from '@/components/results/ResultsSprintCarousel';
import LevelResultsShowcase from '@/components/results/LevelResultsShowcase';
import Pricing from '@/components/landing/Pricing';
import { AssessmentResult } from '@/types';
import type { CanonicalRoadmapOutput, ExamPart } from '@/lib/roadmap-generator/types';
import { AssessmentLocale } from '@/data/assessmentQuestions';

/* ── countdown helper ────────────────────────────────────────── */

const EXAM_DATE = new Date(2026, 6, 20); // July 20, 2026

const getWeeksUntilExam = (): number => {
  const now = new Date();
  const diff = EXAM_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
};

/* ── focus recommendation from sprint 1 ────────────────────── */

const EXAM_PART_LABEL_BY_LOCALE: Record<AssessmentLocale, Record<ExamPart, string>> = {
  en: {
    READING: 'Reading',
    LOGIC: 'Logic',
    DRAWING: 'Drawing',
    MATH_PHYSICS: 'Math and Physics',
    GENERAL_KNOWLEDGE: 'Culture and History',
  },
  ru: {
    READING: 'Чтении',
    LOGIC: 'Логике',
    DRAWING: 'Черчении',
    MATH_PHYSICS: 'Математике и Физике',
    GENERAL_KNOWLEDGE: 'Культуре и Истории',
  },
};

function buildFocusRecommendation(
  roadmap: CanonicalRoadmapOutput | undefined,
  locale: AssessmentLocale
): string | undefined {
  if (!roadmap?.sprints?.[0]) return undefined;

  const sprint = roadmap.sprints[0];
  const parts = sprint.focus_exam_parts_ranked?.slice(0, 2);
  if (!parts || parts.length === 0) return undefined;

  const labels = parts.map((p) => EXAM_PART_LABEL_BY_LOCALE[locale][p]).filter(Boolean);
  if (labels.length === 0) return undefined;

  if (locale === 'en') {
    const joined = labels.length > 1
      ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
      : labels[0];
    const tail = labels.length === 1
      ? 'This is the top focus for sprint one.'
      : 'These are the top focuses for sprint one.';
    return `Focus now on ${joined}. ${tail}`;
  }

  const joined = labels.length === 2 && (labels[0].includes(' и ') || labels[1].includes(' и '))
    ? `${labels[0]}, а также ${labels[1]}`
    : labels.join(' и ');
  const tail = labels.length === 1
    ? 'Это приоритет первого спринта.'
    : 'Это приоритеты первого спринта.';
  return `Сейчас сфокусируйся на ${joined}. ${tail}`;
}

/* ── component ───────────────────────────────────────────────── */

interface ResultsPageProps {
  initialResults?: AssessmentResult;
  locale?: AssessmentLocale;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ initialResults, locale = 'ru' }) => {
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult | null>(initialResults ?? null);
  const weeksLeft = getWeeksUntilExam();
  const localePrefix = locale === 'en' ? '/en' : '/ru';
  const t = locale === 'en'
    ? {
        levelHeading: 'Your level',
        planHeading: 'Your personal preparation plan',
        planHint: 'Swipe right to see your full roadmap ->',
        emptyPlan: 'Complete the assessment to get your personal roadmap',
        tagline: 'Architecture Entrance Prep',
        methodology: 'Methodology',
        home: 'Home',
        assessment: 'Assessment',
      }
    : {
        levelHeading: 'Твой уровень',
        planHeading: 'Твой персональный план подготовки',
        planHint: 'Листайте вправо, чтобы увидеть весь план →',
        emptyPlan: 'Пройдите оценку, чтобы получить персональный план',
        tagline: 'Подготовка к архитектурным экзаменам',
        methodology: 'Методология',
        home: 'Главная',
        assessment: 'Оценка уровня',
      };

  useEffect(() => {
    if (initialResults) return;
    const data = localStorage.getItem('pontea_results_v2');
    if (!data) {
      router.replace(`${localePrefix}/assessment`);
      return;
    }
    setResults(JSON.parse(data));
  }, [router, initialResults, localePrefix]);

  if (!results) return null;

  const { roadmapOutput } = results;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header locale={locale} />

      <main className="flex-1 pt-28 pb-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Section 1: Level Results */}
        <div className="mb-16">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-6">
            {t.levelHeading}
          </h1>
          <LevelResultsShowcase
            domainResults={results.domainResults}
            weeksUntilExam={weeksLeft}
            focusRecommendation={buildFocusRecommendation(roadmapOutput, locale)}
            locale={locale}
          />
        </div>

        {/* Section 2: Sprint Carousel */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            {t.planHeading}
          </h2>

          {roadmapOutput ? (
            <>
              <p className="text-sm text-gray-400 mb-5">
                {t.planHint}
              </p>
              <ResultsSprintCarousel roadmapOutput={roadmapOutput} locale={locale} />
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400">
                {t.emptyPlan}
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Pricing */}
        <div className="mb-12">
          <Pricing locale={locale} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-display font-bold mb-2">PONTEA</div>
              <p className="text-blue-200 text-sm">{t.tagline}</p>
            </div>
            <div className="flex gap-8 text-sm text-blue-200">
              <Link href={localePrefix} className="hover:text-white transition-colors">{t.methodology}</Link>
              <Link href={localePrefix} className="hover:text-white transition-colors">{t.home}</Link>
              <Link href={`${localePrefix}/assessment`} className="hover:text-white transition-colors">{t.assessment}</Link>
            </div>
            <div className="text-xs text-blue-300">
              &copy; 2026 Pontea School.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
