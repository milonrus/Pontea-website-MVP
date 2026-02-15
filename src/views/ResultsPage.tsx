'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import ResultsSprintCarousel from '@/components/results/ResultsSprintCarousel';
import LevelResultsShowcase from '@/components/results/LevelResultsShowcase';
import PricingRu from '@/components/landing/pricing-ru/PricingRu';
import { AssessmentResult } from '@/types';
import type { CanonicalRoadmapOutput, ExamPart } from '@/lib/roadmap-generator/types';

/* ── countdown helper ────────────────────────────────────────── */

const EXAM_DATE = new Date(2026, 6, 20); // July 20, 2026

const getWeeksUntilExam = (): number => {
  const now = new Date();
  const diff = EXAM_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
};

/* ── focus recommendation from sprint 1 ────────────────────── */

const EXAM_PART_LABEL_RU: Record<ExamPart, string> = {
  READING: 'Чтении',
  LOGIC: 'Логике',
  DRAWING: 'Черчении',
  MATH_PHYSICS: 'Математике и Физике',
  GENERAL_KNOWLEDGE: 'Культуре и Истории',
};

function buildFocusRecommendation(roadmap: CanonicalRoadmapOutput | undefined): string | undefined {
  if (!roadmap?.sprints?.[0]) return undefined;

  const sprint = roadmap.sprints[0];
  const parts = sprint.focus_exam_parts_ranked?.slice(0, 2);
  if (!parts || parts.length === 0) return undefined;

  const labels = parts.map((p) => EXAM_PART_LABEL_RU[p]).filter(Boolean);
  if (labels.length === 0) return undefined;

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
}

const ResultsPage: React.FC<ResultsPageProps> = ({ initialResults }) => {
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult | null>(initialResults ?? null);
  const weeksLeft = getWeeksUntilExam();

  useEffect(() => {
    if (initialResults) return;
    const data = localStorage.getItem('pontea_results_v2');
    if (!data) {
      router.replace('/ru/assessment');
      return;
    }
    setResults(JSON.parse(data));
  }, [router, initialResults]);

  if (!results) return null;

  const { roadmapOutput } = results;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Section 1: Level Results */}
        <div className="mb-16">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-6">
            Твой уровень
          </h1>
          <LevelResultsShowcase domainResults={results.domainResults} weeksUntilExam={weeksLeft} focusRecommendation={buildFocusRecommendation(roadmapOutput)} />
        </div>

        {/* Section 2: Sprint Carousel */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            Твой персональный план подготовки
          </h2>

          {roadmapOutput ? (
            <>
              <p className="text-sm text-gray-400 mb-5">
                Листайте вправо, чтобы увидеть весь план →
              </p>
              <ResultsSprintCarousel roadmapOutput={roadmapOutput} />
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400">
                Пройдите оценку, чтобы получить персональный план
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Pricing */}
        <div className="mb-12">
          <PricingRu />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-display font-bold mb-2">PONTEA</div>
              <p className="text-blue-200 text-sm">Architecture Entrance Prep</p>
            </div>
            <div className="flex gap-8 text-sm text-blue-200">
              <Link href="/ru" className="hover:text-white transition-colors">Methodology</Link>
              <Link href="/ru" className="hover:text-white transition-colors">Home</Link>
              <Link href="/ru/assessment" className="hover:text-white transition-colors">Assessment</Link>
            </div>
            <div className="text-xs text-blue-300">
              &copy; 2024 Pontea School.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
