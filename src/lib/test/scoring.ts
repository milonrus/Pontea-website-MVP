/**
 * Scoring Module - Test and Practice scoring calculations
 *
 * Scoring rules:
 * - Correct answer: +1 point
 * - Incorrect answer: -0.25 points
 * - Unanswered: 0 points
 */

import { AttemptQuestion, ScoreResult } from '@/types';

export const SCORING_RULES = {
  CORRECT: 1,
  INCORRECT: -0.25,
  UNANSWERED: 0
} as const;

/**
 * Calculate score from a list of attempt questions
 */
export function calculateScore(
  answers: AttemptQuestion[],
  totalQuestions: number
): ScoreResult {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  answers.forEach(answer => {
    if (answer.selectedAnswer === undefined || answer.selectedAnswer === null) {
      unanswered++;
    } else if (answer.isCorrect) {
      correct++;
    } else {
      incorrect++;
    }
  });

  // Account for questions not in answers array (completely unanswered)
  const answeredCount = answers.length;
  unanswered += Math.max(0, totalQuestions - answeredCount);

  const rawScore =
    (correct * SCORING_RULES.CORRECT) +
    (incorrect * SCORING_RULES.INCORRECT) +
    (unanswered * SCORING_RULES.UNANSWERED);

  // Calculate percentage based on maximum possible score
  const maxScore = totalQuestions * SCORING_RULES.CORRECT;
  const percentage = maxScore > 0
    ? Math.max(0, Math.round((rawScore / maxScore) * 100))
    : 0;

  return {
    raw: rawScore,
    percentage,
    correct,
    incorrect,
    unanswered,
    total: totalQuestions
  };
}

/**
 * Calculate score for practice mode (simpler +1/0 scoring)
 */
export function calculatePracticeScore(
  correct: number,
  total: number
): { percentage: number; correct: number; total: number } {
  return {
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    correct,
    total
  };
}

/**
 * Get grade/performance level based on percentage
 */
export function getPerformanceLevel(percentage: number): {
  level: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  label: string;
  color: string;
} {
  if (percentage >= 90) {
    return { level: 'excellent', label: 'Excellent', color: 'green' };
  } else if (percentage >= 75) {
    return { level: 'good', label: 'Good', color: 'blue' };
  } else if (percentage >= 60) {
    return { level: 'average', label: 'Average', color: 'yellow' };
  } else if (percentage >= 40) {
    return { level: 'below_average', label: 'Below Average', color: 'orange' };
  } else {
    return { level: 'needs_improvement', label: 'Needs Improvement', color: 'red' };
  }
}

/**
 * Calculate time-based bonus (optional for timed tests)
 */
export function calculateTimeBonus(
  timeSpentSeconds: number,
  timeLimitSeconds: number,
  correctAnswers: number
): number {
  if (timeLimitSeconds <= 0 || correctAnswers === 0) return 0;

  // Bonus for finishing early (up to 10% of score)
  const timeRatio = timeSpentSeconds / timeLimitSeconds;
  if (timeRatio >= 1) return 0; // No bonus if time exceeded or equal

  const timeRemaining = 1 - timeRatio;
  const bonusMultiplier = Math.min(0.1, timeRemaining * 0.2); // Max 10% bonus

  return Math.round(correctAnswers * bonusMultiplier * 100) / 100;
}

/**
 * Format score for display
 */
export function formatScore(score: ScoreResult): string {
  return `${score.correct}/${score.total} (${score.percentage}%)`;
}

/**
 * Get feedback message based on score
 */
export function getScoreFeedback(score: ScoreResult): string {
  const { percentage } = score;

  if (percentage >= 90) {
    return "Outstanding performance! You've mastered this material.";
  } else if (percentage >= 75) {
    return "Great job! You have a solid understanding of the concepts.";
  } else if (percentage >= 60) {
    return "Good effort! Review the questions you missed to improve.";
  } else if (percentage >= 40) {
    return "Keep practicing! Focus on the areas where you struggled.";
  } else {
    return "Don't give up! Review the material and try again.";
  }
}
