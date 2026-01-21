import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  seconds: number;
  formatted: string;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
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
