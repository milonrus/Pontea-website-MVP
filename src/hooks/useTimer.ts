import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createTimerState,
  updateTimerFromSync,
  getTimeInfo,
  calculateServerOffset,
  TimerState,
  TimeInfo
} from '@/lib/test/timer-manager';

interface UseTimerReturn {
  seconds: number;
  formatted: string;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
}

// Server-synced countdown timer options
interface UseCountdownTimerOptions {
  totalSeconds: number;
  serverStartTime?: string;
  onExpire?: () => void;
  autoStart?: boolean;
}

interface UseCountdownTimerReturn {
  remainingSeconds: number;
  formatted: string;
  isRunning: boolean;
  isExpired: boolean;
  percentComplete: number;
  start: () => void;
  pause: () => void;
  syncWithServer: (serverTime: string, remainingMs: number) => void;
}

export const useTimer = (autoStart: boolean = false): UseTimerReturn => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
  }, []);
  const restart = useCallback(() => {
    setSeconds(0);
    setIsRunning(true);
  }, []);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    seconds,
    formatted: formatTime(seconds),
    isRunning,
    start,
    pause,
    reset,
    restart
  };
};

export default useTimer;

/**
 * Server-synced countdown timer hook
 * Used for timed tests with server-authoritative time
 */
export const useCountdownTimer = ({
  totalSeconds,
  serverStartTime,
  onExpire,
  autoStart = false
}: UseCountdownTimerOptions): UseCountdownTimerReturn => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  // Initialize timer state
  useEffect(() => {
    if (serverStartTime) {
      const state = createTimerState(serverStartTime, totalSeconds, 0);
      setTimerState(state);
      if (autoStart) {
        setIsRunning(true);
      }
    } else {
      // Local-only timer
      const state = createTimerState(new Date().toISOString(), totalSeconds, 0);
      setTimerState(state);
    }
  }, [totalSeconds, serverStartTime, autoStart]);

  // Update timer every second
  useEffect(() => {
    if (!timerState || !isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const info = getTimeInfo(timerState);
      setTimeInfo(info);

      // Handle expiry
      if (info.isExpired && !expiredRef.current) {
        expiredRef.current = true;
        setIsRunning(false);
        onExpire?.();
      }
    };

    updateTimer(); // Initial update
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, isRunning, onExpire]);

  const start = useCallback(() => {
    setIsRunning(true);
    expiredRef.current = false;
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const syncWithServer = useCallback((serverTime: string, remainingMs: number) => {
    if (!timerState) return;

    const serverOffset = calculateServerOffset(
      serverTime,
      Date.now() - 50, // Approximate request time
      Date.now()
    );

    setTimerState(prev =>
      prev ? updateTimerFromSync(prev, remainingMs, serverOffset) : prev
    );
  }, [timerState]);

  const remainingSeconds = Math.ceil((timeInfo?.remainingMs || 0) / 1000);
  const formatted = timeInfo?.formatted || '00:00';
  const isExpired = timeInfo?.isExpired || false;
  const percentComplete = timeInfo?.percentComplete || 0;

  return {
    remainingSeconds,
    formatted,
    isRunning,
    isExpired,
    percentComplete,
    start,
    pause,
    syncWithServer
  };
};
