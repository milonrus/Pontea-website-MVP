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

interface SectionConfig {
  index: number;
  name?: string;
  questionStartIndex: number;
  questionEndIndex: number;
  timeLimitSeconds?: number;
}

interface UseTestSessionOptions {
  attemptId: string;
  userId: string;
  autoSubmitOnExpiry?: boolean;
  autoAdvanceOnSectionExpiry?: boolean;
  sections?: SectionConfig[];  // Optional - will be loaded from resume API if not provided
  onSectionExpiry?: (sectionIndex: number) => void;
  onTestExpiry?: () => void;
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
  completedSections: number[];
  sections: SectionConfig[];

  // Timer
  timeInfo: TimeInfo | null;
  sectionTimeInfo: TimeInfo | null;

  // Actions
  selectAnswer: (questionId: string, answer: OptionId | null) => Promise<boolean>;
  goToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  advanceSection: () => Promise<void>;
  completeTest: () => Promise<ScoreResult | null>;

  // Computed
  currentQuestion: QuestionModel | null;
  progress: { answered: number; total: number; percentage: number };
  isLastQuestion: boolean;
  isLastQuestionInSection: boolean;
  currentSectionConfig: SectionConfig | null;
  sectionBoundaries: number[];
  getUnansweredQuestionsInSection: (sectionIndex: number) => number[];
}

const SYNC_INTERVAL_MS = 30000; // 30 seconds
const TAB_VISIBILITY_SYNC_DELAY_MS = 1000;

export function useTestSession({
  attemptId,
  userId,
  autoSubmitOnExpiry = true,
  autoAdvanceOnSectionExpiry = true,
  sections: propSections = [],
  onSectionExpiry,
  onTestExpiry
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
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  // Sections state - initialized from props but can be updated from resume API
  const [sections, setSections] = useState<SectionConfig[]>(propSections);

  // Timer state (overall test)
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);

  // Section timer state
  const [sectionTimerState, setSectionTimerState] = useState<TimerState | null>(null);
  const [sectionTimeInfo, setSectionTimeInfo] = useState<TimeInfo | null>(null);

  // Refs for intervals and cleanup
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const sectionExpiryCalledRef = useRef<Set<number>>(new Set());
  const currentQuestionIdRef = useRef<string | null>(null);
  const questionStartAtRef = useRef<number>(Date.now());
  const questionBaseTimeRef = useRef<number>(0);

  // Refs for callbacks to avoid stale closures in effects
  const onSectionExpiryRef = useRef(onSectionExpiry);
  const onTestExpiryRef = useRef(onTestExpiry);

  // Keep refs updated
  onSectionExpiryRef.current = onSectionExpiry;
  onTestExpiryRef.current = onTestExpiry;

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
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data.serverTime) {
        const serverOffset = calculateServerOffset(
          data.serverTime,
          requestSentAt,
          responseReceivedAt
        );

        // Update overall timer
        if (data.remainingTime !== undefined && timerState) {
          const localTimeInfo = getTimeInfo(timerState);
          if (exceedsDriftThreshold(localTimeInfo.remainingMs, data.remainingTime)) {
            setTimerState(prev =>
              prev ? updateTimerFromSync(prev, data.remainingTime!, serverOffset) : prev
            );
          }
        }

        // Update section timer
        if (data.sectionRemainingTime !== undefined && sectionTimerState) {
          const localSectionTimeInfo = getTimeInfo(sectionTimerState);
          if (exceedsDriftThreshold(localSectionTimeInfo.remainingMs, data.sectionRemainingTime)) {
            setSectionTimerState(prev =>
              prev ? updateTimerFromSync(prev, data.sectionRemainingTime!, serverOffset) : prev
            );
          }
        }

        // Update indices if server reports different position
        if (data.currentSectionIndex !== undefined) {
          setCurrentSectionIndex(prev =>
            data.currentSectionIndex > prev ? data.currentSectionIndex : prev
          );
        }
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(prev =>
            data.currentQuestionIndex > prev ? data.currentQuestionIndex : prev
          );
        }

        // Update completed sections
        if (data.completedSections) {
          setCompletedSections(data.completedSections);
        }

        // Handle completed/expired status
        if (data.status === 'completed' || data.status === 'timed_out') {
          router.push(`/test/${attemptId}/results`);
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, [attemptId, timerState, sectionTimerState, router]);

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

        // Initialize overall timer if there's a time limit
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

        // Initialize section timer if there's section timing
        if (data.sectionRemainingTime !== undefined && data.currentSectionTimeLimit) {
          const serverOffset = calculateServerOffset(
            data.serverTime,
            requestSentAt,
            responseReceivedAt
          );
          // Find the current section's started_at
          const currentSection = data.sections?.find(
            (s: any) => s.section_index === (data.attempt.current_section_index || 0)
          );
          if (currentSection?.started_at) {
            const sectionState = createTimerState(
              currentSection.started_at,
              data.currentSectionTimeLimit,
              serverOffset
            );
            setSectionTimerState(sectionState);
          }
        }

        // Initialize completed sections
        if (data.completedSections) {
          setCompletedSections(data.completedSections);
        }

        // Initialize sections from resume API (if available and no prop sections)
        if (data.sectionConfig && data.sectionConfig.length > 0) {
          setSections(data.sectionConfig);
        }

        // Load questions
        const questionIds = data.attempt.question_ids || [];
        if (questionIds.length > 0) {
          const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);

          if (questionsData) {
            // Sort to match original order and transform to QuestionModel
            const sorted = questionIds.map((id: string) => {
              const q = questionsData.find((q: any) => q.id === id);
              if (!q) return null;
              return {
                id: q.id,
                subjectId: q.subject_id,
                topicId: q.topic_id,
                tags: q.tags || [],
                difficulty: q.difficulty,
                questionText: q.question_text,
                questionImageUrl: q.question_image_url,
                options: q.options,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                explanationImageUrl: q.explanation_image_url,
                createdBy: q.created_by,
                createdAt: q.created_at,
                updatedAt: q.updated_at,
                isActive: q.is_active,
                stats: q.stats || { totalAttempts: 0, correctCount: 0, totalTimeSpent: 0 }
              } as QuestionModel;
            }).filter(Boolean) as QuestionModel[];
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

  // Track per-question timing based on when the question becomes active
  useEffect(() => {
    const questionId = questions[currentQuestionIndex]?.id ?? null;
    if (!questionId || questionId === currentQuestionIdRef.current) return;

    currentQuestionIdRef.current = questionId;
    questionBaseTimeRef.current = answers.get(questionId)?.timeSpent || 0;
    questionStartAtRef.current = Date.now();
  }, [currentQuestionIndex, questions]);

  // Overall timer update interval
  useEffect(() => {
    if (!timerState) return;

    const updateTimer = () => {
      const info = getTimeInfo(timerState);
      setTimeInfo(info);

      // Auto-submit on expiry
      if (info.isExpired && autoSubmitOnExpiry) {
        onTestExpiryRef.current?.();
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

  // Ref for currentSectionIndex to avoid stale closure in interval
  const currentSectionIndexRef = useRef(currentSectionIndex);
  currentSectionIndexRef.current = currentSectionIndex;

  // Section timer update interval
  useEffect(() => {
    if (!sectionTimerState) return;

    // Initial update - only update display, don't auto-advance
    const info = getTimeInfo(sectionTimerState);
    setSectionTimeInfo(info);

    // Interval callback - update display AND handle auto-advance
    const updateSectionTimer = () => {
      const currentInfo = getTimeInfo(sectionTimerState);
      setSectionTimeInfo(currentInfo);

      // Auto-advance on section expiry (only in interval, not initial call)
      if (currentInfo.isExpired && autoAdvanceOnSectionExpiry) {
        const sectionIdx = currentSectionIndexRef.current;
        // Prevent calling multiple times for the same section
        if (!sectionExpiryCalledRef.current.has(sectionIdx)) {
          sectionExpiryCalledRef.current.add(sectionIdx);
          onSectionExpiryRef.current?.(sectionIdx);
          advanceSection();
        }
      }
    };

    sectionTimerIntervalRef.current = setInterval(updateSectionTimer, 1000);

    return () => {
      if (sectionTimerIntervalRef.current) {
        clearInterval(sectionTimerIntervalRef.current);
      }
    };
  }, [sectionTimerState, autoAdvanceOnSectionExpiry]);

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
  const selectAnswer = async (questionId: string, selectedAnswer: OptionId | null): Promise<boolean> => {
    const previousAnswer = answers.get(questionId);
    try {
      const token = await getAuthToken();
      const baseTime = previousAnswer?.timeSpent || 0;
      const elapsedSeconds = questionId === currentQuestionIdRef.current
        ? Math.max(0, Math.round((Date.now() - questionStartAtRef.current) / 1000))
        : 0;
      const totalTimeSpent = baseTime + elapsedSeconds;
      const questionIndex = questions.findIndex(q => q.id === questionId);
      const questionSection = previousAnswer?.sectionIndex
        ?? (questionIndex !== -1 ? getQuestionSection(questionIndex) : getQuestionSection(currentQuestionIndex));

      // Optimistically update local state so navigation doesn't lose selection
      setAnswers(prev => {
        const newMap = new Map(prev);
        newMap.set(questionId, {
          id: previousAnswer?.id || '',
          attemptId,
          questionId,
          selectedAnswer,
          isCorrect: previousAnswer?.isCorrect,
          timeSpent: totalTimeSpent,
          answeredAt: new Date().toISOString(),
          sectionIndex: questionSection
        });
        return newMap;
      });

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
          timeSpent: totalTimeSpent,
          questionSectionIndex: questionSection
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAnswers(prev => {
          const newMap = new Map(prev);
          newMap.set(questionId, {
            id: previousAnswer?.id || '',
            attemptId,
            questionId,
            selectedAnswer,
            isCorrect: data.isCorrect,
            timeSpent: totalTimeSpent,
            answeredAt: new Date().toISOString(),
            sectionIndex: questionSection
          });
          return newMap;
        });
        return true;
      } else if (response.status === 400 && data.error?.includes('section')) {
        // Section is locked, show error
        setError(data.error);
        setAnswers(prev => {
          const newMap = new Map(prev);
          if (previousAnswer) {
            newMap.set(questionId, previousAnswer);
          } else {
            newMap.delete(questionId);
          }
          return newMap;
        });
        return false;
      } else if (!response.ok) {
        setAnswers(prev => {
          const newMap = new Map(prev);
          if (previousAnswer) {
            newMap.set(questionId, previousAnswer);
          } else {
            newMap.delete(questionId);
          }
          return newMap;
        });
        return false;
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      setAnswers(prev => {
        const newMap = new Map(prev);
        if (previousAnswer) {
          newMap.set(questionId, previousAnswer);
        } else {
          newMap.delete(questionId);
        }
        return newMap;
      });
      return false;
    }
    return false;
  };

  const updatePosition = useCallback(async (questionIndex: number) => {
    try {
      const token = await getAuthToken();
      await fetch('/api/test/position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          currentQuestionIndex: questionIndex,
          currentSectionIndex
        })
      });
    } catch (err) {
      console.error('Position update error:', err);
    }
  }, [attemptId, currentSectionIndex]);

  // Helper to get which section a question belongs to
  const getQuestionSection = useCallback((questionIndex: number): number => {
    if (sections.length === 0) return 0;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (questionIndex >= sections[i].questionStartIndex) return i;
    }
    return 0;
  }, [sections]);

  // Check if navigation to a question is allowed (section locking)
  const canNavigateToQuestion = useCallback((targetIndex: number): boolean => {
    const targetSection = getQuestionSection(targetIndex);
    // Can't navigate to completed sections
    if (completedSections.includes(targetSection)) {
      return false;
    }
    // Can't navigate to future sections
    if (targetSection > currentSectionIndex) {
      return false;
    }
    return true;
  }, [getQuestionSection, completedSections, currentSectionIndex]);

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length && canNavigateToQuestion(index)) {
      setCurrentQuestionIndex(index);
      void updatePosition(index);
    }
  };

  const goToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length && canNavigateToQuestion(nextIndex)) {
      setCurrentQuestionIndex(nextIndex);
      void updatePosition(nextIndex);
    }
  };

  const goToPreviousQuestion = () => {
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0 && canNavigateToQuestion(prevIndex)) {
      setCurrentQuestionIndex(prevIndex);
      void updatePosition(prevIndex);
    }
  };

  const advanceSection = async () => {
    try {
      const token = await getAuthToken();
      const nextSectionIndex = currentSectionIndex + 1;
      const nextSectionConfig = sections.find(s => s.index === nextSectionIndex);

      const response = await fetch('/api/test/next-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          sectionTimeLimit: nextSectionConfig?.timeLimitSeconds
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update completed sections
        setCompletedSections(prev => [...prev, currentSectionIndex]);

        // Move to next section
        setCurrentSectionIndex(nextSectionIndex);

        // Move to first question of new section
        if (nextSectionConfig) {
          setCurrentQuestionIndex(nextSectionConfig.questionStartIndex);
        } else {
          setCurrentQuestionIndex(0);
        }

        // Reset section timer for new section
        if (data.sectionRemainingTime !== undefined && nextSectionConfig?.timeLimitSeconds) {
          const serverOffset = calculateServerOffset(
            data.serverTime,
            Date.now(),
            Date.now()
          );
          const newSectionState = createTimerState(
            data.serverTime,
            nextSectionConfig.timeLimitSeconds,
            serverOffset
          );
          setSectionTimerState(newSectionState);
        } else {
          setSectionTimerState(null);
          setSectionTimeInfo(null);
        }
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
  const answeredCount = Array.from(answers.values()).filter(
    answer => answer.selectedAnswer !== null && answer.selectedAnswer !== undefined
  ).length;
  const totalQuestions = questions.length;
  const progress = {
    answered: answeredCount,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
  };
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Section-related computed values
  const currentSectionConfig = sections.find(s => s.index === currentSectionIndex) || null;
  const isLastQuestionInSection = currentSectionConfig
    ? currentQuestionIndex === currentSectionConfig.questionEndIndex
    : false;
  const sectionBoundaries = sections.map(s => s.questionStartIndex);

  // Get unanswered question indices in a given section (for warning modal)
  const getUnansweredQuestionsInSection = useCallback((sectionIndex: number): number[] => {
    const section = sections.find(s => s.index === sectionIndex);
    if (!section) return [];

    const unanswered: number[] = [];
    for (let i = section.questionStartIndex; i <= section.questionEndIndex; i++) {
      const answer = answers.get(questions[i]?.id);
      if (!answer || answer.selectedAnswer === null || answer.selectedAnswer === undefined) {
        unanswered.push(i); // 0-based index
      }
    }
    return unanswered;
  }, [sections, answers, questions]);

  return {
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
    currentSectionConfig,
    sectionBoundaries,
    getUnansweredQuestionsInSection
  };
}
