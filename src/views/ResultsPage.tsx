'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, ArrowRight, BarChart3 } from 'lucide-react';
import Button from '@/components/shared/Button';
import { AssessmentResult, DomainGrade, DomainResult } from '@/types';

const GRADE_CONFIG: Record<DomainGrade, { label: string; color: string; barColor: string; bg: string }> = {
  A: { label: 'Начальный', color: 'text-red-600', barColor: 'bg-red-500', bg: 'bg-red-50' },
  B: { label: 'Базовый', color: 'text-orange-600', barColor: 'bg-orange-400', bg: 'bg-orange-50' },
  C: { label: 'Средний', color: 'text-yellow-600', barColor: 'bg-yellow-400', bg: 'bg-yellow-50' },
  D: { label: 'Сильный', color: 'text-green-600', barColor: 'bg-green-500', bg: 'bg-green-50' },
};

const WEAK_DOMAIN_MESSAGES: Record<string, string> = {
  reading_en: 'Английский — основа экзамена. Начните с ежедневного чтения академических текстов.',
  logic: 'Логика тренируется быстро, но требует системного подхода. Мы подберем задачи под ваш уровень.',
  drawing_spatial: 'Пространственное мышление — навык, который развивается с практикой. Важно начать с основ.',
  math: 'Математика требует повторения базы и наработки скорости. Мы выстроим прогрессию от простого к сложному.',
  physics: 'Физика — это формулы + логика применения. Начнем с ключевых законов и типовых задач.',
  humanities: 'Гуманитарный блок — это запоминание + понимание контекста. Структурируем материал по эпохам.',
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

  const { domainResults, weakestDomains, studyPlan } = results;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="pt-12 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-3">
            Ваш результат готов
          </h1>
          <p className="text-lg text-gray-500">
            Ниже — ваш текущий уровень по каждой теме экзамена и план действий.
          </p>
        </motion.div>

        {/* Block 1: Domain Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Ваш уровень по темам
          </h2>

          <div className="space-y-4">
            {domainResults.map((dr) => {
              const config = GRADE_CONFIG[dr.grade];
              const widthPercent = ((dr.score + 1) / 4) * 100; // 0→25%, 1→50%, 2→75%, 3→100%
              return (
                <div key={dr.domain} className="flex items-center gap-4">
                  <div className="w-44 shrink-0">
                    <div className="text-sm font-semibold text-primary">{dr.domainLabel}</div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${config.barColor}`}
                      />
                    </div>
                  </div>
                  <div className={`w-20 text-right text-sm font-bold ${config.color}`}>
                    {dr.grade} — {config.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> A — Начальный</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> B — Базовый</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> C — Средний</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> D — Сильный</span>
          </div>
        </motion.div>

        {/* Block 2: Weakest Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            2 главных слабых места
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {weakestDomains.map((wd) => {
              const config = GRADE_CONFIG[wd.grade];
              return (
                <div
                  key={wd.domain}
                  className={`p-5 rounded-xl border ${config.bg} border-gray-100`}
                >
                  <div className={`text-lg font-bold ${config.color} mb-1`}>
                    {wd.domainLabel}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Уровень {wd.grade} — {config.label}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {WEAK_DOMAIN_MESSAGES[wd.domain]}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Block 3: Study Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8"
        >
          <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            Что делать дальше
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Начните с этих модулей курса в таком порядке:
          </p>

          <ol className="space-y-3">
            {studyPlan.map((sp, idx) => {
              const config = GRADE_CONFIG[sp.grade];
              const isPriority = sp.grade === 'A' || sp.grade === 'B';
              const isMaintenance = sp.grade === 'D';

              return (
                <li key={sp.domain} className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isPriority ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-primary">{sp.domainLabel}</span>
                    {isPriority && (
                      <span className="ml-2 text-xs font-bold text-red-500 uppercase">Приоритет</span>
                    )}
                    {isMaintenance && (
                      <span className="ml-2 text-xs font-bold text-green-600 uppercase">Поддержание и скорость</span>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${config.color}`}>{sp.grade}</span>
                </li>
              );
            })}
          </ol>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
    </div>
  );
};

export default ResultsPage;
