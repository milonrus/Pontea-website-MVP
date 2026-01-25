'use client';

import React from 'react';
import { QuestionOption, OptionId } from '@/types';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnswerOptionsProps {
  options: QuestionOption[];
  selectedAnswer?: OptionId | null;
  correctAnswer?: OptionId;
  isSubmitted?: boolean;
  disabled?: boolean;
  onSelect: (optionId: OptionId) => void;
  className?: string;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  isSubmitted = false,
  disabled = false,
  onSelect,
  className = ''
}) => {
  const getOptionStyles = (optionId: OptionId) => {
    const isSelected = selectedAnswer === optionId;
    const isCorrect = correctAnswer === optionId;
    const isWrong = isSelected && correctAnswer && !isCorrect;

    if (isSubmitted) {
      if (isCorrect) {
        return 'border-green-500 bg-green-50 text-green-800';
      }
      if (isWrong) {
        return 'border-red-500 bg-red-50 text-red-800';
      }
      return 'border-gray-100 opacity-50';
    }

    if (isSelected) {
      return 'border-primary bg-blue-50 ring-1 ring-primary';
    }

    return 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {options.map((option) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = correctAnswer === option.id;
        const isWrong = isSelected && correctAnswer && !isCorrect;

        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled || isSubmitted}
            className={`
              w-full text-left p-4 rounded-xl border-2 transition-all
              flex items-center group
              ${getOptionStyles(option.id)}
              ${disabled || isSubmitted ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {/* Option Letter */}
            <span
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                text-sm font-bold mr-4 flex-shrink-0
                ${isSelected || (isSubmitted && isCorrect)
                  ? 'bg-white shadow-sm'
                  : 'bg-gray-100'
                }
              `}
            >
              {option.id.toUpperCase()}
            </span>

            {/* Option Text */}
            <div className="flex-1">
              <LaTeXRenderer text={option.text} />
            </div>

            {/* Result Icons */}
            {isSubmitted && isCorrect && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
            )}
            {isSubmitted && isWrong && (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AnswerOptions;
