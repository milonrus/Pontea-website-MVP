"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  OptionId,
  AssessmentAnswer,
  AssessmentOption,
  MicroCheckQuestion,
  SelfAssessmentQuestion,
  DomainResult,
} from '@/types';
import type { CanonicalRoadmapOutput } from '@/lib/roadmap-generator/types';
import {
  AssessmentLocale,
  TOTAL_QUESTIONS,
  getAssessmentQuestions,
} from '@/data/assessmentQuestions';
import {
  getDifficultyForScore,
  computeDomainResults,
  getWeakestDomains,
  generateStudyPlan,
  domainResultsToLevelsBySection,
} from '@/lib/assessment/scoring';
import { generateRoadmaps } from '@/lib/roadmap-generator/engine';
import courseFixture from '@/data/roadmap-course-overview.json';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import PostQuizEmailForm, {
  AssessmentContactSubmission,
} from './PostQuizEmailForm';

type Step = 'quiz' | 'contact' | 'submitting';
const RESULTS_STORAGE_KEY = 'pontea_results_v2';

interface ComputedResults {
  answers: AssessmentAnswer[];
  domainResults: DomainResult[];
  weakestDomains: DomainResult[];
  studyPlan: DomainResult[];
  roadmapOutput?: CanonicalRoadmapOutput;
}

function getResolvedQuestion(
  index: number,
  answers: AssessmentAnswer[],
  questions: ReturnType<typeof getAssessmentQuestions>
): {
  questionId: string;
  prompt: string;
  options: AssessmentOption[];
  label?: string;
  correctOptionId?: OptionId;
} {
  const qDef = questions[index];

  if (qDef.type === 'self_assessment') {
    const q = qDef as SelfAssessmentQuestion;
    return { questionId: q.id, prompt: q.prompt, options: q.options };
  }

  const q = qDef as MicroCheckQuestion;
  // Look up the self-assessment answer for the same domain
  const selfAnswer = answers.find(
    (a) => a.domain === q.domain && a.type === 'self_assessment'
  );
  const selfScore = selfAnswer?.selfAssessmentScore ?? 3;
  const difficulty = getDifficultyForScore(selfScore);
  const variant = q.variants.find((v) => v.difficulty === difficulty) ?? q.variants[0];

  return {
    questionId: q.id,
    prompt: variant.prompt,
    options: variant.options,
    label: q.label,
    correctOptionId: variant.correctOptionId,
  };
}

interface AssessmentFlowProps {
  locale?: AssessmentLocale;
}

const AssessmentFlow: React.FC<AssessmentFlowProps> = ({ locale = 'ru' }) => {
  const router = useRouter();
  const localePrefix = locale === 'en' ? '' : '/ru';
  const [step, setStep] = useState<Step>('quiz');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<OptionId | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const [computedResults, setComputedResults] = useState<ComputedResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assessmentQuestions = useMemo(() => getAssessmentQuestions(locale), [locale]);

  const resolved = step === 'quiz'
    ? getResolvedQuestion(currentIndex, answers, assessmentQuestions)
    : null;

  const handleSelect = (optionId: OptionId) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (selectedOptionId === null || !resolved) return;

    const qDef = assessmentQuestions[currentIndex];
    const timeMs = Date.now() - questionStartTime;

    const answer: AssessmentAnswer = {
      questionId: qDef.id,
      domain: qDef.domain,
      selectedOptionId,
      timeMs,
      type: qDef.type,
    };

    if (qDef.type === 'self_assessment') {
      const option = (qDef as SelfAssessmentQuestion).options.find(
        (o) => o.id === selectedOptionId
      );
      answer.selfAssessmentScore = option?.score ?? 3;
    } else {
      answer.microCheckCorrect = selectedOptionId === resolved.correctOptionId;
      const selfAnswer = answers.find(
        (a) => a.domain === qDef.domain && a.type === 'self_assessment'
      );
      answer.microCheckDifficulty = getDifficultyForScore(
        selfAnswer?.selfAssessmentScore ?? 3
      );
    }

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const nextIndex = currentIndex + 1;
    if (nextIndex < TOTAL_QUESTIONS) {
      setCurrentIndex(nextIndex);
      setSelectedOptionId(null);
      setQuestionStartTime(Date.now());
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: AssessmentAnswer[]) => {
    const domainResults = computeDomainResults(finalAnswers, locale);
    const weakestDomains = getWeakestDomains(domainResults);
    const studyPlan = generateStudyPlan(domainResults);

    let roadmapOutput: CanonicalRoadmapOutput | undefined;
    try {
      const levels_by_section = domainResultsToLevelsBySection(domainResults);
      const result = generateRoadmaps({
        weeks_to_exam: 20,
        levels_by_section,
        course_modular_overview: courseFixture.course_modular_overview,
      });
      roadmapOutput = result.roadmaps[0];
    } catch (e) {
      console.error('Failed to generate roadmap:', e);
    }

    setComputedResults({
      answers: finalAnswers,
      domainResults,
      weakestDomains,
      studyPlan,
      roadmapOutput,
    });
    setStep('contact');
  };

  const handleContactSubmit = async (contact: AssessmentContactSubmission) => {
    if (!computedResults) return;

    setIsSubmitting(true);
    setStep('submitting');

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          consentPersonalData: contact.consentPersonalData,
          consentAt: contact.consentAt,
          answers: computedResults.answers,
          domainResults: computedResults.domainResults,
          weakestDomains: computedResults.weakestDomains,
          studyPlan: computedResults.studyPlan,
          roadmapOutput: computedResults.roadmapOutput,
        }),
      });

      if (res.ok) {
        const { token } = await res.json();
        router.push(`${localePrefix}/results/${token}/`);
      } else {
        // Fallback: save to localStorage and redirect to old route
        saveFallback(contact);
      }
    } catch {
      // Fallback: save to localStorage and redirect to old route
      saveFallback(contact);
    }
  };

  const saveFallback = (contact: AssessmentContactSubmission) => {
    if (!computedResults) return;
    const result = {
      version: 3,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      consentPersonalData: contact.consentPersonalData,
      consentAt: contact.consentAt,
      answers: computedResults.answers,
      domainResults: computedResults.domainResults,
      weakestDomains: computedResults.weakestDomains,
      studyPlan: computedResults.studyPlan,
      roadmapOutput: computedResults.roadmapOutput,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(result));
    router.push(`${localePrefix}/results/`);
  };

  if (step === 'contact' && computedResults) {
    return <PostQuizEmailForm onSubmit={handleContactSubmit} isLoading={isSubmitting} locale={locale} />;
  }

  if (step === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">
          {locale === 'en' ? 'Saving your results...' : 'Сохраняем ваши результаты...'}
        </p>
      </div>
    );
  }

  if (step === 'quiz' && resolved) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <ProgressBar current={currentIndex + 1} total={TOTAL_QUESTIONS} locale={locale} />
          <QuestionCard
            questionId={resolved.questionId}
            prompt={resolved.prompt}
            options={resolved.options}
            label={resolved.label}
            selectedOptionId={selectedOptionId}
            onSelect={handleSelect}
            onNext={handleNext}
            currentNumber={currentIndex + 1}
            isLastQuestion={currentIndex === TOTAL_QUESTIONS - 1}
            locale={locale}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {locale === 'en' ? 'Loading...' : 'Загрузка...'}
    </div>
  );
};

export default AssessmentFlow;
