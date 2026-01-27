'use client';

import React from 'react';
import Button from '@/components/shared/Button';
import { ArrowLeft, ArrowRight, CheckCircle, Lock } from 'lucide-react';

interface NavigationProps {
  currentIndex: number;
  totalQuestions: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLastQuestion: boolean;
  isSubmitted?: boolean;
  selectedAnswer?: string | null;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onFinish: () => void;
  className?: string;
  // Section-aware props
  currentSectionIndex?: number;
  totalSections?: number;
  isLastQuestionInSection?: boolean;
  completedSections?: number[];
  onAdvanceSection?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentIndex,
  totalQuestions,
  canGoBack = true,
  canGoForward = true,
  isLastQuestion,
  isSubmitted = false,
  selectedAnswer,
  isLoading = false,
  onPrevious,
  onNext,
  onSubmit,
  onFinish,
  className = '',
  currentSectionIndex,
  totalSections,
  isLastQuestionInSection = false,
  completedSections = [],
  onAdvanceSection
}) => {
  const hasAnswer = selectedAnswer !== null && selectedAnswer !== undefined;
  const showSectionInfo = currentSectionIndex !== undefined && totalSections !== undefined;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Previous Button */}
      <div className="flex-1">
        {canGoBack && currentIndex > 0 && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
      </div>

      {/* Question Indicator */}
      <div className="flex-1 flex flex-col items-center">
        <span className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {totalQuestions}
        </span>
        {showSectionInfo && (
          <span className="text-xs text-gray-400">
            Section {currentSectionIndex + 1} of {totalSections}
          </span>
        )}
      </div>

      {/* Next/Submit/Finish Button */}
      <div className="flex-1 flex justify-end">
        {!isSubmitted ? (
          <Button
            onClick={onSubmit}
            disabled={!hasAnswer || isLoading}
            isLoading={isLoading}
          >
            Submit Answer
          </Button>
        ) : isLastQuestion ? (
          <Button
            onClick={onFinish}
            className="group"
            disabled={isLoading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finish Test
          </Button>
        ) : isLastQuestionInSection && onAdvanceSection ? (
          <Button
            onClick={onAdvanceSection}
            className="group"
            disabled={isLoading}
          >
            Next Section
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="group"
            disabled={!canGoForward || isLoading}
          >
            Next Question
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
};

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  onNavigate: (index: number) => void;
  className?: string;
  // Section-aware props
  sectionBoundaries?: number[]; // Start indices of each section
  currentSectionIndex?: number;
  completedSections?: number[];
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  onNavigate,
  className = '',
  sectionBoundaries = [],
  currentSectionIndex,
  completedSections = []
}) => {
  // Helper to determine which section a question belongs to
  const getQuestionSection = (questionIndex: number): number => {
    if (sectionBoundaries.length === 0) return 0;
    for (let i = sectionBoundaries.length - 1; i >= 0; i--) {
      if (questionIndex >= sectionBoundaries[i]) return i;
    }
    return 0;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isAnswered = answeredQuestions.has(i);
        const isCurrent = currentIndex === i;
        const questionSection = getQuestionSection(i);
        const isInCompletedSection = completedSections.includes(questionSection);
        const isInCurrentSection = currentSectionIndex === undefined || questionSection === currentSectionIndex;
        const isLocked = isInCompletedSection && !isCurrent;
        const isSectionStart = sectionBoundaries.includes(i);
        // Unanswered in current section gets special styling
        const isUnansweredInCurrentSection = !isAnswered && isInCurrentSection && !isCurrent;

        return (
          <React.Fragment key={i}>
            {/* Section divider */}
            {isSectionStart && i !== 0 && (
              <div className="w-px h-8 bg-gray-300 mx-1" />
            )}
            <button
              onClick={() => !isLocked && onNavigate(i)}
              disabled={isLocked}
              title={isLocked ? 'Section completed - cannot navigate back' : isUnansweredInCurrentSection ? 'Unanswered question' : undefined}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                text-sm font-medium transition-all relative
                ${isLocked
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isCurrent
                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                    : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : isUnansweredInCurrentSection
                        ? 'bg-amber-50 text-amber-700 border-2 border-amber-300 hover:bg-amber-100'
                        : isInCurrentSection
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400'
                }
              `}
            >
              {isLocked ? (
                <Lock className="w-3 h-3" />
              ) : (
                i + 1
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Navigation;
