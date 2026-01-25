'use client';

import React from 'react';
import { QuestionModel } from '@/types';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';
import { Flag } from 'lucide-react';

interface QuestionDisplayProps {
  question: QuestionModel;
  questionNumber: number;
  totalQuestions: number;
  onReportClick?: () => void;
  className?: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onReportClick,
  className = ''
}) => {
  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getDifficultyStyles(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>
        {onReportClick && (
          <button
            onClick={onReportClick}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Report Question"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question Text */}
      <div className="prose max-w-none mb-8">
        <LaTeXRenderer
          text={question.questionText}
          className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed"
        />
      </div>

      {/* Question Image */}
      {question.questionImageUrl && (
        <div className="mb-6">
          <img
            src={question.questionImageUrl}
            alt="Question illustration"
            className="max-w-full h-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
