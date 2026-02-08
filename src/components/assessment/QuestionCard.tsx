import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { OptionId, AssessmentOption } from '@/types';
import Button from '@/components/shared/Button';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';

interface QuestionCardProps {
  questionId: string;
  prompt: string;
  options: AssessmentOption[];
  label?: string;
  selectedOptionId: OptionId | null;
  onSelect: (optionId: OptionId) => void;
  onNext: () => void;
  currentNumber: number;
  isLastQuestion: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  prompt,
  options,
  label,
  selectedOptionId,
  onSelect,
  onNext,
  currentNumber,
  isLastQuestion,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedOptionId !== null) {
        if (e.code === 'Space' || e.code === 'ArrowRight') {
          e.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOptionId, onNext]);

  return (
    <motion.div
      key={questionId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
          Вопрос {currentNumber}
        </span>
      </div>

      {label && (
        <p className="text-sm text-gray-400 italic mb-2">{label}</p>
      )}

      <h3 className="text-lg md:text-xl font-bold text-primary mb-4 leading-snug">
        <LaTeXRenderer text={prompt} />
      </h3>

      <div className="space-y-2 mb-4">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const hasSelection = selectedOptionId !== null;

          let buttonClass =
            'border-gray-200 hover:border-accent hover:bg-yellow-50';
          if (isSelected) {
            buttonClass = 'border-accent bg-accent/10 ring-1 ring-accent';
          } else if (hasSelection) {
            buttonClass = 'border-gray-100 text-gray-400 opacity-60';
          }

          return (
            <button
              key={option.id}
              onClick={() => !hasSelection && onSelect(option.id)}
              disabled={hasSelection}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 group flex items-center ${buttonClass}`}
            >
              <span
                className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center mr-3 shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-accent text-primary'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-accent group-hover:text-primary'
                }`}
              >
                {option.id.toUpperCase()}
              </span>
              <span className="text-sm font-medium flex-1"><LaTeXRenderer text={option.text} /></span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedOptionId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-between items-center pt-3 border-t border-gray-100"
          >
            <span className="text-xs text-gray-400 italic hidden sm:block">
              Space или стрелка вправо
            </span>
            <Button onClick={onNext} className="group ml-auto">
              {isLastQuestion ? 'Завершить' : 'Далее'}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionCard;
