'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';

interface FeedbackProps {
  isCorrect: boolean;
  explanation: string;
  explanationImageUrl?: string | null;
  showExplanation?: boolean;
  className?: string;
}

export const Feedback: React.FC<FeedbackProps> = ({
  isCorrect,
  explanation,
  explanationImageUrl,
  showExplanation = true,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      {/* Result Banner */}
      <div
        className={`
          p-4 rounded-xl mb-4 flex items-center gap-3
          ${isCorrect
            ? 'bg-green-50 border border-green-100'
            : 'bg-red-50 border border-red-100'
          }
        `}
      >
        {isCorrect ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-800">Correct!</p>
              <p className="text-sm text-green-600">Great job! Keep it up.</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">Incorrect</p>
              <p className="text-sm text-red-600">Review the explanation below.</p>
            </div>
          </>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && (explanation || explanationImageUrl) && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-gray-900">Explanation</h4>
          </div>
          {explanation && (
            <div className="text-sm text-gray-700 leading-relaxed prose max-w-none">
              <LaTeXRenderer text={explanation} />
            </div>
          )}
          {explanationImageUrl && (
            <img
              src={explanationImageUrl}
              alt="Explanation illustration"
              className="mt-4 max-w-full h-auto rounded-lg border border-gray-200"
            />
          )}
        </div>
      )}
    </motion.div>
  );
};

interface PracticeResultsSummaryProps {
  totalQuestions: number;
  correctCount: number;
  timeSpent: number;
  onRestart?: () => void;
  onExit?: () => void;
}

export const PracticeResultsSummary: React.FC<PracticeResultsSummaryProps> = ({
  totalQuestions,
  correctCount,
  timeSpent,
  onRestart,
  onExit
}) => {
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Excellent work!';
    if (percentage >= 80) return 'Great job!';
    if (percentage >= 70) return 'Good effort!';
    if (percentage >= 60) return 'Keep practicing!';
    return 'Review the material and try again.';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center"
    >
      <div className="mb-6">
        <div className={`text-6xl font-bold ${getPerformanceColor()}`}>
          {percentage}%
        </div>
        <p className="text-gray-500 mt-2">{getPerformanceMessage()}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-900">{correctCount}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-900">{totalQuestions - correctCount}</p>
          <p className="text-xs text-gray-500">Incorrect</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-900">{formatTime(timeSpent)}</p>
          <p className="text-xs text-gray-500">Time</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Practice Again
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Feedback;
