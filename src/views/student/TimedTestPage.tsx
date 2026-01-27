'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTestSession } from '@/hooks/use-test-session';
import { useTabBlocking } from '@/hooks/use-tab-blocking';
import { Timer, TimerProgressBar } from '@/components/test/Timer';
import { Navigation, QuestionNavigator } from '@/components/test/Navigation';
import { QuestionDisplay } from '@/components/test/QuestionDisplay';
import { AnswerOptions } from '@/components/test/AnswerOptions';
import Button from '@/components/shared/Button';
import ReportQuestionModal from '@/components/student/ReportQuestionModal';
import SectionCompletionWarning from '@/components/test/SectionCompletionWarning';
import { OptionId } from '@/types';
import { Loader2, AlertTriangle, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TimedTestPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const attemptId = Array.isArray(params?.attemptId)
    ? params.attemptId[0]
    : params?.attemptId || '';

  // Tab blocking
  const { isBlocked, otherTabActive } = useTabBlocking({
    attemptId,
    enabled: !!attemptId
  });

  // Section expiry notification
  const [sectionExpiryNotification, setSectionExpiryNotification] = useState<string | null>(null);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Section completion warning modal
  const [showSectionWarning, setShowSectionWarning] = useState(false);
  const [unansweredInSection, setUnansweredInSection] = useState<number[]>([]);

  // Loading answer submission
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveRequestIdRef = useRef(0);

  // Test session hook
  const {
    attempt,
    questions,
    answers,
    currentQuestionIndex,
    currentSectionIndex,
    loading,
    error,
    completedSections,
    sections,
    timeInfo,
    sectionTimeInfo,
    selectAnswer,
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    advanceSection,
    completeTest,
    currentQuestion,
    progress,
    isLastQuestion,
    isLastQuestionInSection,
    sectionBoundaries,
    getUnansweredQuestionsInSection
  } = useTestSession({
    attemptId,
    userId: currentUser?.id || '',
    autoSubmitOnExpiry: true,
    autoAdvanceOnSectionExpiry: true,
    onSectionExpiry: (sectionIndex) => {
      const sectionName = sections.find(s => s.index === sectionIndex)?.name || `Section ${sectionIndex + 1}`;
      setSectionExpiryNotification(`${sectionName} time expired. Moving to next section...`);
      setTimeout(() => setSectionExpiryNotification(null), 3000);
    },
    onTestExpiry: () => {
      setSectionExpiryNotification("Time's up! Submitting your test...");
    }
  });

  // Track selected answer for current question (local state before submission)
  const [selectedAnswer, setSelectedAnswer] = useState<OptionId | null>(null);
  const selectedAnswerRef = useRef<OptionId | null>(null);

  // Reset selected answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.get(currentQuestion.id);
      const nextAnswer = existingAnswer?.selectedAnswer ?? null;
      setSelectedAnswer(nextAnswer);
      selectedAnswerRef.current = nextAnswer;
      setSaveStatus('idle');
    }
  }, [currentQuestion?.id]);

  // Keep UI selection in sync with saved answers without resetting save status
  useEffect(() => {
    if (!currentQuestion) return;
    const savedAnswer = answers.get(currentQuestion.id)?.selectedAnswer ?? null;
    if (savedAnswer !== selectedAnswerRef.current) {
      setSelectedAnswer(savedAnswer);
      selectedAnswerRef.current = savedAnswer;
    }
  }, [answers, currentQuestion]);

  const showSavedStatus = () => {
    setSaveStatus('saved');
  };

  const persistAnswer = async (questionId: string, optionId: OptionId | null) => {
    const requestId = ++saveRequestIdRef.current;
    setSaveStatus('saving');
    const ok = await selectAnswer(questionId, optionId);
    if (saveRequestIdRef.current !== requestId) return ok;
    if (ok) {
      showSavedStatus();
    } else {
      setSaveStatus('error');
    }
    return ok;
  };

  // Handle answer selection (or deselection if optionId is null)
  const handleSelectAnswer = async (optionId: OptionId | null) => {
    setSelectedAnswer(optionId);
    selectedAnswerRef.current = optionId;
    if (currentQuestion) {
      void persistAnswer(currentQuestion.id, optionId);
    }
  };

  // Handle answer submission (saves to server, no immediate feedback)
  // Can be null to unselect/clear an answer
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    // Only submit if the answer has changed from what's saved
    const existingAnswer = answers.get(currentQuestion.id);
    const pendingAnswer = selectedAnswerRef.current;
    if (existingAnswer?.selectedAnswer === pendingAnswer) return;

    setSubmittingAnswer(true);
    try {
      await persistAnswer(currentQuestion.id, pendingAnswer);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle next question
  const handleNext = async () => {
    // Submit current answer state first if it has changed (including deselections)
    if (currentQuestion) {
      await handleSubmitAnswer();
    }
    goToNextQuestion();
  };

  // Handle previous question
  const handlePrevious = () => {
    goToPreviousQuestion();
  };

  // Handle section advance (with warning for unanswered questions)
  const handleAdvanceSection = async () => {
    // Submit current answer state first if it has changed (including deselections)
    if (currentQuestion) {
      await handleSubmitAnswer();
    }

    // Check for unanswered questions in current section
    const unanswered = getUnansweredQuestionsInSection(currentSectionIndex);
    if (unanswered.length > 0) {
      setUnansweredInSection(unanswered.map(idx => idx + 1)); // Convert to 1-based
      setShowSectionWarning(true);
    } else {
      await advanceSection();
    }
  };

  // Handle test completion
  const handleFinish = async () => {
    // Submit current answer state first if it has changed (including deselections)
    if (currentQuestion) {
      await handleSubmitAnswer();
    }
    await completeTest();
  };

  // Get answered question indices for navigator
  const answeredQuestions = useMemo(() => {
    const indices = new Set<number>();
    answers.forEach((answer, questionId) => {
      if (answer.selectedAnswer === null || answer.selectedAnswer === undefined) return;
      const idx = questions.findIndex(q => q.id === questionId);
      if (idx !== -1) indices.add(idx);
    });
    return indices;
  }, [answers, questions]);

  // Check if current question has been answered
  const isSavingAnswer = saveStatus === 'saving' || submittingAnswer;
  const isAnswerSaved = saveStatus === 'saved';
  const isSaveError = saveStatus === 'error';

  // Tab blocking overlay
  if (isBlocked && otherTabActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Already Open</h2>
          <p className="text-gray-600 mb-6">
            This test is already open in another tab. Please close this tab and continue in the original tab to prevent any issues with your submission.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // No question loaded
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No questions available</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentSectionName = sections.find(s => s.index === currentSectionIndex)?.name || `Section ${currentSectionIndex + 1}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 fixed top-0 w-full z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Section info */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">{currentSectionName}</div>
              <div className="text-xs text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          {/* Timers */}
          <div className="flex items-center gap-3">
            {sectionTimeInfo && (
              <Timer
                timeInfo={sectionTimeInfo}
                size="sm"
                label="Section"
                warningThresholdSeconds={60}
              />
            )}
            {timeInfo && (
              <Timer
                timeInfo={timeInfo}
                size="md"
                label="Total"
                warningThresholdSeconds={300}
              />
            )}
          </div>

          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                router.push('/dashboard');
              }
            }}
          >
            Exit
          </Button>
        </div>

        {/* Timer progress bar */}
        {timeInfo && <TimerProgressBar timeInfo={timeInfo} className="mt-2" />}
      </header>

      {/* Section expiry notification */}
      <AnimatePresence>
        {sectionExpiryNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30"
          >
            <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{sectionExpiryNotification}</span>
              <button onClick={() => setSectionExpiryNotification(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 pt-24 pb-32 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{progress.answered} of {progress.total} answered</span>
              <span>{progress.percentage}% complete</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Question display */}
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onReportClick={() => setShowReportModal(true)}
            className="mb-6"
          />

          {/* Answer options - no feedback shown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <AnswerOptions
              options={currentQuestion.options}
              selectedAnswer={selectedAnswer}
              isSubmitted={false} // Never show feedback in timed mode
              onSelect={handleSelectAnswer}
            />

            {/* Answer status indicator */}
            {(isSavingAnswer || isAnswerSaved || isSaveError) && (
              <div
                className={`mt-4 text-sm flex items-center gap-2 ${
                  isSaveError ? 'text-red-600' : isSavingAnswer ? 'text-amber-600' : 'text-green-600'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSaveError ? 'bg-red-500' : isSavingAnswer ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                />
                {isSaveError ? 'Failed to save' : isSavingAnswer ? 'Saving answer...' : 'Answer saved'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-3 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex-none w-fit max-w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 overflow-x-auto">
              <QuestionNavigator
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answeredQuestions={answeredQuestions}
                onNavigate={goToQuestion}
                sectionBoundaries={sectionBoundaries}
                currentSectionIndex={currentSectionIndex}
                completedSections={completedSections}
                className="flex-nowrap items-center min-w-max"
              />
            </div>
            <div className="shrink-0">
              <Navigation
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                canGoBack={currentQuestionIndex > 0 && !completedSections.includes(currentSectionIndex - 1)}
                canGoForward={true}
                isLastQuestion={isLastQuestion}
                isSubmitted={true} // Always allow navigation in timed mode
                selectedAnswer={selectedAnswer}
                isLoading={submittingAnswer}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmitAnswer}
                onFinish={handleFinish}
                buttonSize="sm"
                showProgress={false}
                alignRight={true}
                currentSectionIndex={currentSectionIndex}
                totalSections={sections.length || 1}
                isLastQuestionInSection={isLastQuestionInSection}
                completedSections={completedSections}
                onAdvanceSection={handleAdvanceSection}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section completion warning modal */}
      <SectionCompletionWarning
        isOpen={showSectionWarning}
        onClose={() => setShowSectionWarning(false)}
        sectionName={sections.find(s => s.index === currentSectionIndex)?.name || `Section ${currentSectionIndex + 1}`}
        unansweredQuestions={unansweredInSection}
        onContinue={async () => {
          await advanceSection();
        }}
      />

      {/* Report question modal */}
      <ReportQuestionModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        question={currentQuestion}
      />
    </div>
  );
};

export default TimedTestPage;
