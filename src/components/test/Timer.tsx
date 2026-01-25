'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { TimeInfo } from '@/lib/test/timer-manager';

interface TimerProps {
  timeInfo: TimeInfo | null;
  showWarning?: boolean;
  warningThresholdSeconds?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  timeInfo,
  showWarning = true,
  warningThresholdSeconds = 300, // 5 minutes
  size = 'md',
  className = ''
}) => {
  if (!timeInfo) {
    return null;
  }

  const { remainingMs, formatted, isExpired, percentComplete } = timeInfo;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isWarning = showWarning && remainingSeconds <= warningThresholdSeconds && !isExpired;
  const isCritical = remainingSeconds <= 60 && !isExpired;

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-lg font-mono font-bold
        ${sizeClasses[size]}
        ${isExpired
          ? 'bg-red-100 text-red-700'
          : isCritical
            ? 'bg-red-100 text-red-600 animate-pulse'
            : isWarning
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-primary/10 text-primary'
        }
        ${className}
      `}
    >
      {isCritical ? (
        <AlertTriangle className={`${iconSizes[size]} animate-bounce`} />
      ) : (
        <Clock className={iconSizes[size]} />
      )}
      <span>{isExpired ? "Time's Up!" : formatted}</span>
    </div>
  );
};

interface TimerProgressBarProps {
  timeInfo: TimeInfo | null;
  className?: string;
}

export const TimerProgressBar: React.FC<TimerProgressBarProps> = ({
  timeInfo,
  className = ''
}) => {
  if (!timeInfo) {
    return null;
  }

  const { percentComplete, isExpired } = timeInfo;

  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-1000 ${
          isExpired
            ? 'bg-red-500'
            : percentComplete > 80
              ? 'bg-yellow-500'
              : 'bg-primary'
        }`}
        style={{ width: `${Math.min(100, percentComplete)}%` }}
      />
    </div>
  );
};

export default Timer;
