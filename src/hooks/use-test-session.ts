'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  TestAttempt,
  AttemptQuestion,
  QuestionModel,
  OptionId,
  ServerSyncResponse,
  ScoreResult
} from '@/types';
import {
  createTimerState,
  updateTimerFromSync,
  getTimeInfo,
  needsSync,
  exceedsDriftThreshold,
  calculateServerOffset,
  TimerState,
  TimeInfo
} from '@/lib/test/timer-manager';
import { calculateScore } from '@/lib/test/scoring';

interface UseTestSessionOptions {
  attemptId: string;
  userId: string;
  autoSubmitOnExpiry?: boolean;
}

interface UseTestSessionReturn {
  // State
  attempt: TestAttempt | null;
  questions: QuestionModel[];
  answers: Map<string, AttemptQuestion>;
  currentQuestionIndex: number;
  currentSectionIndex: number;
  loading: boolean;
  error: string | null;

  // Timer
  timeInfo: TimeInfo | null;

  // Actions
  selectAnswer: (questionId: string, answer: OptionId) => Promise<void>;
  goToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  advanceSection: () => Promise<void>;
  completeTest: () => Promise<ScoreResult | null>;

  // Computed
  currentQuestion: QuestionModel | null;
  progress: { answered: number; total: number; percentage: number };
  isLastQuestion: boolean;
}

const SYNC_INTERVAL_MS = 30000; // 30 seconds
const TAB_VISIBILITY_SYNC_DELAY_MS = 1000;

export function useTestSession({
  attemptId,
  userId,
  autoSubmitOnExpiry = true
}: UseTestSessionOptions): UseTestSessionReturn {
  const router = useRouter();

  // Core state
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [answers, setAnswers] = useState<Map<string, AttemptQuestion>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);

  // Refs for intervals and cleanup
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Get auth token for API calls
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const token = await getAuthToken();
      const requestSentAt = Date.now();

      const response = await fetch(`/api/test/sync?attemptId=${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseReceivedAt = Date.now();
      const data: ServerSyncResponse = await response.json();

      if (!isMountedRef.current) return;

      if (data.serverTime) {
        const serverOffset = calculateServerOffset(
          data.serverTime,
          requestSentAt,
          responseReceivedAt
        );

        if (data.remainingTime !== undefined && timerState) {
          // Check for significant drift
          const localTimeInfo = getTimeInfo(timerState);
          if (exceedsDriftThreshold(localTimeInfo.remainingMs, data.remainingTime)) {
            // Force update from server time
            setTimerState(prev =>
              prev ? updateTimerFromSync(prev, data.remainingTime!, serverOffset) : prev
            );
          }
        }

        // Update indices if server reports different position
        if (data.currentSectionIndex !== undefined) {
          setCurrentSectionIndex(data.currentSectionIndex);
        }
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
        }

        // Handle completed/expired status
        if (data.status === 'completed' || data.status === 'timed_out') {
          router.push(`/test/${attemptId}/results`);
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, [attemptId, timerState, router]);

  // Initialize session
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getAuthToken();
        const requestSentAt = Date.now();

        const response = await fetch(`/api/test/resume?attemptId=${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const responseReceivedAt = Date.now();
        const data = await response.json();

        if (!isMountedRef.current) return;

        if (!response.ok) {
          setError(data.error || 'Failed to load test session');
          setLoading(false);
          return;
        }

        setAttempt(data.attempt);
        setCurrentSectionIndex(data.attempt.current_section_index || 0);
        setCurrentQuestionIndex(data.attempt.current_question_index || 0);

        // Load existing answers
        const answersMap = new Map<string, AttemptQuestion>();
        data.questions?.forEach((q: AttemptQuestion) => {
          answersMap.set(q.questionId, q);
        });
        setAnswers(answersMap);

        // Initialize timer if there's a time limit
        if (data.remainingTime !== undefined && data.attempt.time_limit_seconds) {
          const serverOffset = calculateServerOffset(
            data.serverTime,
            requestSentAt,
            responseReceivedAt
          );
          const state = createTimerState(
            data.attempt.server_start_time,
            data.attempt.time_limit_seconds,
            serverOffset
          );
          setTimerState(state);
        }

        // Load questions (you may want to fetch these from a separate endpoint)
        // For now, we'll fetch from the existing exercise service
        const questionIds = data.attempt.question_ids || [];
        if (questionIds.length > 0) {
          const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);

          if (questionsData) {
            // Sort to match original order
            const sorted = questionIds.map((id: string) =>
              questionsData.find(q => q.id === id)
            ).filter(Boolean);
            setQuestions(sorted);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Initialize error:', err);
        setError('Failed to initialize test session');
        setLoading(false);
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
    };
  }, [attemptId]);

  // Timer update interval
  useEffect(() => {
    if (!timerState) return;

    const updateTimer = () => {
      const info = getTimeInfo(timerState);
      setTimeInfo(info);

      // Auto-submit on expiry
      if (info.isExpired && autoSubmitOnExpiry) {
        completeTest();
      }
    };

    updateTimer(); // Initial update
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState, autoSubmitOnExpiry]);

  // Sync interval
  useEffect(() => {
    if (!timerState) return;

    syncIntervalRef.current = setInterval(() => {
      if (needsSync(timerState)) {
        syncWithServer();
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [timerState, syncWithServer]);

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-sync when tab becomes visible
        setTimeout(syncWithServer, TAB_VISIBILITY_SYNC_DELAY_MS);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncWithServer]);

  // Actions
  const selectAnswer = async (questionId: string, selectedAnswer: OptionId) => {
    try {
      const token = await getAuthToken();
      const startTime = answers.get(questionId)?.timeSpent || 0;

      const response = await fetch('/api/test/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          questionId,
          selectedAnswer,
          timeSpent: startTime + (timeInfo?.elapsedMs || 0) / 1000
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAnswers(prev => {
          const newMap = new Map(prev);
          newMap.set(questionId, {
            id: '',
            attemptId,
            questionId,
            selectedAnswer,
            isCorrect: data.isCorrect,
            timeSpent: startTime,
            answeredAt: new Date().toISOString()
          });
          return newMap;
        });
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const advanceSection = async () => {
    try {
      const token = await getAuthToken();

      const response = await fetch('/api/test/next-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ attemptId })
      });

      if (response.ok) {
        setCurrentSectionIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      }
    } catch (err) {
      console.error('Section advance error:', err);
    }
  };

  const completeTest = async (): Promise<ScoreResult | null> => {
    try {
      const token = await getAuthToken();

      const response = await fetch('/api/test/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ attemptId })
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/test/${attemptId}/results`);
        return data.score;
      }

      return null;
    } catch (err) {
      console.error('Complete test error:', err);
      return null;
    }
  };

  // Computed values
  const currentQuestion = questions[currentQuestionIndex] || null;
  const answeredCount = answers.size;
  const totalQuestions = questions.length;
  const progress = {
    answered: answeredCount,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
  };
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return {
    attempt,
    questions,
    answers,
    currentQuestionIndex,
    currentSectionIndex,
    loading,
    error,
    timeInfo,
    selectAnswer,
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    advanceSection,
    completeTest,
    currentQuestion,
    progress,
    isLastQuestion
  };
}
