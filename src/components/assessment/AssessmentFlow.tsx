"use client";

import React, { useState } from 'react';
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
  ALL_ASSESSMENT_QUESTIONS,
  TOTAL_QUESTIONS,
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
  answers: AssessmentAnswer[]
): {
  questionId: string;
  prompt: string;
  options: AssessmentOption[];
  label?: string;
  correctOptionId?: OptionId;
} {
  const qDef = ALL_ASSESSMENT_QUESTIONS[index];

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

const AssessmentFlow: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>('quiz');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<OptionId | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const [computedResults, setComputedResults] = useState<ComputedResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolved = step === 'quiz' ? getResolvedQuestion(currentIndex, answers) : null;

  const handleSelect = (optionId: OptionId) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (selectedOptionId === null || !resolved) return;

    const qDef = ALL_ASSESSMENT_QUESTIONS[currentIndex];
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
    const domainResults = computeDomainResults(finalAnswers);
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
        router.push(`/ru/results/${token}`);
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
    router.push('/ru/results');
  };

  if (step === 'contact' && computedResults) {
    return <PostQuizEmailForm onSubmit={handleContactSubmit} isLoading={isSubmitting} />;
  }

  if (step === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Сохраняем ваши результаты...</p>
      </div>
    );
  }

  if (step === 'quiz' && resolved) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <ProgressBar current={currentIndex + 1} total={TOTAL_QUESTIONS} />
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      Загрузка...
    </div>
  );
};

export default AssessmentFlow;
