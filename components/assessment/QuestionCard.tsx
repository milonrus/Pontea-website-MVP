import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Question } from '../../types';
import Button from '../shared/Button';

interface QuestionCardProps {
  question: Question;
  onAnswer: (index: number) => void;
  onNext: () => void;
  currentNumber: number;
  isFeedbackMode: boolean;
  selectedAnswer: number | null;
  isLastQuestion: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswer, 
  onNext,
  currentNumber,
  isFeedbackMode,
  selectedAnswer,
  isLastQuestion
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFeedbackMode) {
        // Allow Space or Right Arrow to proceed
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowRight' || e.key === 'ArrowRight') {
          e.preventDefault();
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedbackMode, onNext]);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {question.category} • {question.difficulty}
        </span>
        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
          Question {currentNumber}
        </span>
      </div>

      {question.passage && (
        <div className="mb-8 p-5 bg-gray-50 rounded-xl border-l-4 border-accent text-gray-700 text-sm md:text-base leading-relaxed">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Read the passage</div>
          {question.passage}
        </div>
      )}

      <h3 className="text-xl md:text-2xl font-bold text-primary mb-8 leading-relaxed">
        {question.text}
      </h3>

      <div className="space-y-3 mb-8">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === question.correctAnswer;
          
          let buttonClass = "border-gray-200 hover:border-accent hover:bg-yellow-50";
          let icon = null;

          if (isFeedbackMode) {
            if (isCorrect) {
              buttonClass = "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500";
              icon = <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />;
            } else if (isSelected) {
              buttonClass = "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500";
              icon = <XCircle className="w-5 h-5 text-red-600 ml-auto" />;
            } else {
              buttonClass = "border-gray-100 text-gray-400 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => !isFeedbackMode && onAnswer(idx)}
              disabled={isFeedbackMode}
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-200 group flex items-center
                ${buttonClass}
              `}
            >
              <span className={`
                w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center mr-4 transition-colors
                ${isFeedbackMode && isCorrect ? 'bg-green-200 text-green-800' : 
                  isFeedbackMode && isSelected ? 'bg-red-200 text-red-800' : 
                  'bg-gray-100 text-gray-500 group-hover:bg-accent group-hover:text-primary'}
              `}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-lg font-medium flex-1">
                {option}
              </span>
              {icon}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {isFeedbackMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-between items-center pt-4 border-t border-gray-100"
          >
             <span className="text-xs text-gray-400 italic hidden sm:block">
               Press Space or Right Arrow to continue
             </span>
            <Button onClick={onNext} className="group ml-auto">
              {isLastQuestion ? 'See Results' : 'Next Question'}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionCard;