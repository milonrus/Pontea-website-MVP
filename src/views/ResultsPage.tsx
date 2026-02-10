'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, ArrowRight } from 'lucide-react';
import Button from '@/components/shared/Button';
import Header from '@/components/shared/Header';
import { AssessmentResult, DomainGrade } from '@/types';
import RoadmapMatrixView from '@/components/shared/RoadmapMatrixView';

const GRADE_CONFIG: Record<DomainGrade, { label: string; color: string; barColor: string; bg: string }> = {
  A: { label: 'Начальный', color: 'text-red-600', barColor: 'bg-red-500', bg: 'bg-red-50' },
  B: { label: 'Базовый', color: 'text-orange-600', barColor: 'bg-orange-400', bg: 'bg-orange-50' },
  C: { label: 'Средний', color: 'text-yellow-600', barColor: 'bg-yellow-400', bg: 'bg-yellow-50' },
  D: { label: 'Продвинутый', color: 'text-blue-600', barColor: 'bg-blue-400', bg: 'bg-blue-50' },
  E: { label: 'Сильный', color: 'text-green-600', barColor: 'bg-green-500', bg: 'bg-green-50' },
};

interface ResultsPageProps {
  initialResults?: AssessmentResult;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ initialResults }) => {
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResult | null>(initialResults ?? null);

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

  const { domainResults, roadmapOutput } = results;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-16 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-3">
            Ваш результат готов
          </h1>
          <p className="text-lg text-gray-500">
            Ниже — ваш текущий уровень по каждой теме экзамена.
          </p>
        </motion.div>

        {/* Block 1: Domain Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Ваш уровень по темам
          </h2>

          <div className="space-y-4">
            {domainResults.map((dr) => {
              const config = GRADE_CONFIG[dr.grade];
              const widthPercent = (dr.score / 5) * 100;
              return (
                <div key={dr.domain} className="flex items-center gap-4">
                  <div className="w-44 shrink-0">
                    <div className="text-sm font-semibold text-primary">{dr.domainLabel}</div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${config.barColor}`}
                      />
                    </div>
                  </div>
                  <div className={`w-28 text-right text-sm font-bold ${config.color}`}>
                    {dr.grade} — {config.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> A — Начальный</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> B — Базовый</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> C — Средний</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> D — Продвинутый</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> E — Сильный</span>
          </div>
        </motion.div>

        {/* Roadmap Matrix View */}
        {roadmapOutput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-primary mb-2">
              Ваш план подготовки по спринтам
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Прокрутите вправо, чтобы увидеть все спринты →
            </p>
            <RoadmapMatrixView roadmap={roadmapOutput} />
          </motion.div>
        )}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button size="lg" fullWidth className="shadow-lg shadow-accent/20 group">
            Получить полный план
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" fullWidth>
            Записаться на консультацию
          </Button>
        </motion.div>
      </main>

      {/* Footer — matches landing page */}
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
    </div>
  );
};

export default ResultsPage;
