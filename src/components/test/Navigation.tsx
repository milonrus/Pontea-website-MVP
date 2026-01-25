'use client';

import React from 'react';
import Button from '@/components/shared/Button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

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
  className = ''
}) => {
  const hasAnswer = selectedAnswer !== null && selectedAnswer !== undefined;

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
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {totalQuestions}
        </span>
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
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  onNavigate,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isAnswered = answeredQuestions.has(i);
        const isCurrent = currentIndex === i;

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              text-sm font-medium transition-all
              ${isCurrent
                ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                : isAnswered
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
