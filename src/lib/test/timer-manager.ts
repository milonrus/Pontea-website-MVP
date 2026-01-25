/**
 * Timer Manager - Server-authoritative time management
 *
 * Handles server time synchronization, drift calculation, and
 * remaining time computation with the server as the source of truth.
 */

export interface TimerState {
  serverStartTime: number;      // Server-reported start time (ms since epoch)
  localStartTime: number;       // Local time when we received server start (for drift calculation)
  timeLimitMs: number;          // Total time limit in milliseconds
  serverOffset: number;         // Offset between local and server time (positive = local ahead)
  lastSyncTime: number;         // Last time we synced with server
  isPaused: boolean;
  pausedAtMs?: number;          // Server time when paused
}

export interface TimeInfo {
  remainingMs: number;          // Remaining time in milliseconds
  elapsedMs: number;            // Elapsed time in milliseconds
  percentComplete: number;      // 0-100
  isExpired: boolean;
  formatted: string;            // Human-readable remaining time (MM:SS)
}

const SYNC_INTERVAL_MS = 30000;  // Sync every 30 seconds
const MAX_DRIFT_MS = 5000;       // Maximum acceptable drift before force-sync

/**
 * Calculate server offset from a sync response
 */
export function calculateServerOffset(
  serverTimeIso: string,
  requestSentAt: number,
  responseReceivedAt: number
): number {
  const serverTime = new Date(serverTimeIso).getTime();
  // Estimate the time the server generated the response (midpoint of round-trip)
  const networkLatency = (responseReceivedAt - requestSentAt) / 2;
  const estimatedServerTimeAtReceive = serverTime + networkLatency;
  // Offset is how much the local clock differs from server
  return responseReceivedAt - estimatedServerTimeAtReceive;
}

/**
 * Create initial timer state from server start response
 */
export function createTimerState(
  serverStartTimeIso: string,
  timeLimitSeconds: number,
  serverOffset: number = 0
): TimerState {
  const serverStartTime = new Date(serverStartTimeIso).getTime();
  return {
    serverStartTime,
    localStartTime: Date.now(),
    timeLimitMs: timeLimitSeconds * 1000,
    serverOffset,
    lastSyncTime: Date.now(),
    isPaused: false
  };
}

/**
 * Update timer state with sync response
 */
export function updateTimerFromSync(
  currentState: TimerState,
  remainingMs: number,
  newServerOffset: number
): TimerState {
  return {
    ...currentState,
    serverOffset: newServerOffset,
    lastSyncTime: Date.now(),
    // Recalculate start time based on remaining time
    serverStartTime: Date.now() - newServerOffset - (currentState.timeLimitMs - remainingMs)
  };
}

/**
 * Get current time info accounting for server offset
 */
export function getTimeInfo(state: TimerState): TimeInfo {
  if (state.isPaused && state.pausedAtMs !== undefined) {
    const elapsedMs = state.pausedAtMs - state.serverStartTime;
    const remainingMs = Math.max(0, state.timeLimitMs - elapsedMs);
    return formatTimeInfo(elapsedMs, remainingMs, state.timeLimitMs);
  }

  // Convert local time to server time
  const currentServerTime = Date.now() - state.serverOffset;
  const elapsedMs = currentServerTime - state.serverStartTime;
  const remainingMs = Math.max(0, state.timeLimitMs - elapsedMs);

  return formatTimeInfo(elapsedMs, remainingMs, state.timeLimitMs);
}

function formatTimeInfo(elapsedMs: number, remainingMs: number, totalMs: number): TimeInfo {
  const isExpired = remainingMs <= 0;
  const percentComplete = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;

  // Format remaining time as MM:SS
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    remainingMs,
    elapsedMs,
    percentComplete,
    isExpired,
    formatted
  };
}

/**
 * Check if a sync is needed
 */
export function needsSync(state: TimerState): boolean {
  const timeSinceLastSync = Date.now() - state.lastSyncTime;
  return timeSinceLastSync >= SYNC_INTERVAL_MS;
}

/**
 * Check if drift exceeds threshold
 */
export function exceedsDriftThreshold(
  localRemaining: number,
  serverRemaining: number
): boolean {
  return Math.abs(localRemaining - serverRemaining) > MAX_DRIFT_MS;
}

/**
 * Format milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
