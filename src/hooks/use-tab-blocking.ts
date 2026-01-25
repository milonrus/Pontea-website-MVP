'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTabBlockingOptions {
  attemptId: string;
  enabled?: boolean;
}

interface UseTabBlockingReturn {
  isBlocked: boolean;
  otherTabActive: boolean;
  dismissBlock: () => void;
}

const CHANNEL_PREFIX = 'pontea-test-session-';
const HEARTBEAT_INTERVAL_MS = 2000;
const HEARTBEAT_TIMEOUT_MS = 5000;

/**
 * Hook to prevent multiple tabs from running the same test simultaneously.
 * Uses BroadcastChannel API for cross-tab communication and sessionStorage
 * for tab identification.
 */
export function useTabBlocking({
  attemptId,
  enabled = true
}: UseTabBlockingOptions): UseTabBlockingReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const [otherTabActive, setOtherTabActive] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const sessionTokenRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const isMasterRef = useRef<boolean>(false);

  // Generate or retrieve session token for this tab
  const getSessionToken = useCallback(() => {
    const storageKey = `pontea-tab-${attemptId}`;
    let token = sessionStorage.getItem(storageKey);

    if (!token) {
      token = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(storageKey, token);
    }

    return token;
  }, [attemptId]);

  // Dismiss the block (close this tab's claim to the session)
  const dismissBlock = useCallback(() => {
    setIsBlocked(false);
    setOtherTabActive(false);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }

    const channelName = `${CHANNEL_PREFIX}${attemptId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    sessionTokenRef.current = getSessionToken();

    // Message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, token, timestamp } = event.data;

      if (token === sessionTokenRef.current) {
        // Ignore our own messages
        return;
      }

      switch (type) {
        case 'heartbeat':
          // Another tab is active
          lastHeartbeatRef.current = Date.now();

          if (!isMasterRef.current) {
            // We arrived after another tab, we're blocked
            setIsBlocked(true);
            setOtherTabActive(true);
          } else {
            // We were here first, notify the other tab they're blocked
            channel.postMessage({
              type: 'master-claim',
              token: sessionTokenRef.current,
              timestamp: Date.now()
            });
          }
          break;

        case 'master-claim':
          // Another tab is claiming master status
          if (timestamp < (sessionTokenRef.current.split('-')[0] || 0)) {
            // They were here first (lower timestamp = earlier)
            isMasterRef.current = false;
            setIsBlocked(true);
            setOtherTabActive(true);
          }
          break;

        case 'tab-closing':
          // Another tab is closing, we can become master
          setOtherTabActive(false);
          setIsBlocked(false);
          isMasterRef.current = true;
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    // Claim master status on mount
    isMasterRef.current = true;

    // Send initial presence announcement
    channel.postMessage({
      type: 'heartbeat',
      token: sessionTokenRef.current,
      timestamp: Date.now()
    });

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      channel.postMessage({
        type: 'heartbeat',
        token: sessionTokenRef.current,
        timestamp: Date.now()
      });

      // Check if other tab has gone silent
      if (otherTabActive && Date.now() - lastHeartbeatRef.current > HEARTBEAT_TIMEOUT_MS) {
        setOtherTabActive(false);
        setIsBlocked(false);
        isMasterRef.current = true;
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      // Notify other tabs we're leaving
      channel.postMessage({
        type: 'tab-closing',
        token: sessionTokenRef.current,
        timestamp: Date.now()
      });

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [attemptId, enabled, getSessionToken, otherTabActive]);

  return {
    isBlocked,
    otherTabActive,
    dismissBlock
  };
}

export default useTabBlocking;
