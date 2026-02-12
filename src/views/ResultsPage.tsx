'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, MessageCircle } from 'lucide-react';
import Button from '@/components/shared/Button';
import Header from '@/components/shared/Header';
import PaymentModal from '@/components/shared/PaymentModal';
import ResultsSprintCarousel from '@/components/results/ResultsSprintCarousel';
import LevelResultsShowcase from '@/components/results/LevelResultsShowcase';
import { AssessmentResult, PlanTier } from '@/types';
import type { CanonicalRoadmapOutput, ExamPart } from '@/lib/roadmap-generator/types';

/* ── pricing data (reused from Pricing.tsx) ──────────────────── */

const TIERS: PlanTier[] = [
  {
    name: 'База',
    price: 690,
    priceRub: 75000,
    features: ['Конспекты теории (250+ страниц)', '1000+ тренировочных вопросов', 'Пробные экзамены'],
    missingFeatures: ['Видеолекции', 'Живые семинары', 'Отслеживание прогресса', 'Чат с поддержкой', 'Индивидуальные занятия 1-на-1'],
  },
  {
    name: 'Полный курс',
    price: 1190,
    priceRub: 130000,
    recommended: true,
    features: ['Конспекты теории (250+ страниц)', '1000+ тренировочных вопросов', 'Пробные экзамены', '40+ часов видеолекций', 'Еженедельные живые семинары', 'Мониторинг прогресса', 'Групповой чат поддержки'],
    missingFeatures: ['Персональная программа подготовки', 'Индивидуальные занятия 1-на-1'],
  },
  {
    name: 'VIP',
    price: 2750,
    priceRub: 300000,
    features: ['Все из тарифа «Полный курс»', 'Персональная программа подготовки', 'Индивидуальные занятия с преподавателями 1-на-1', '3 консультации с основателями', 'Приоритетная поддержка'],
    missingFeatures: [],
  }
];

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
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-6">
            Твой уровень
          </h2>
          <LevelResultsShowcase domainResults={results.domainResults} weeksUntilExam={weeksLeft} focusRecommendation={buildFocusRecommendation(roadmapOutput)} />
        </motion.div>

        {/* Section 2: Sprint Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-16"
        >
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
        </motion.div>

        {/* Section 3: Pricing */}
        <motion.div
          id="pricing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center mb-10">
            Получи доступ к платформе и начинай готовиться уже сейчас!
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`
                  relative bg-white rounded-2xl p-8 transition-all duration-300
                  ${tier.recommended ? 'border-2 border-accent shadow-xl scale-105 z-10' : 'border border-gray-200 shadow-sm hover:shadow-lg'}
                `}
              >
                {tier.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-primary font-bold px-6 py-1.5 rounded-full text-sm whitespace-nowrap">
                    Самый популярный
                  </div>
                )}

                <h3 className="text-2xl font-display font-bold text-primary mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">€{tier.price}</span>
                    <span className="text-sm text-gray-400">или</span>
                    <span className="text-lg font-bold text-green-600">€{Math.round(tier.price / 6)}/мес</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽ · рассрочка на 6 мес
                  </div>
                </div>

                <Button
                  variant={tier.recommended ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => setSelectedTier(tier)}
                  className="mb-8"
                >
                  {tier.recommended ? 'Начать подготовку' : 'Выбрать'}
                </Button>

                <div className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  {tier.missingFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-50">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-xl mx-auto mt-12">
            <Link
              href="/consultation"
              className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-primary">Нужна помощь с выбором или оплатой?</div>
                <div className="text-xs text-gray-500">Запишись на бесплатную консультацию</div>
              </div>
              <span className="text-primary text-lg flex-shrink-0">&rarr;</span>
            </Link>
          </div>
        </motion.div>
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
              <Link href="/methodology" className="hover:text-white transition-colors">Methodology</Link>
              <Link href="/ru" className="hover:text-white transition-colors">Home</Link>
              <Link href="/ru/assessment" className="hover:text-white transition-colors">Assessment</Link>
            </div>
            <div className="text-xs text-blue-300">
              &copy; 2024 Pontea School.
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          isOpen={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          tierName={selectedTier.name}
          price={selectedTier.price}
        />
      )}
    </div>
  );
};

export default ResultsPage;
