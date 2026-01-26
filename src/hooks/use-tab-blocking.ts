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

interface MasterTabInfo {
  token: string;
  registeredAt: number;
  lastHeartbeat: number;
}

type ChannelMessage =
  | { type: 'heartbeat'; token: string }
  | { type: 'tab-closing'; token: string }
  | { type: 'master-claimed'; token: string };

const STORAGE_PREFIX = 'pontea-test-master-';
const CHANNEL_PREFIX = 'pontea-test-session-';
const HEARTBEAT_INTERVAL_MS = 2000;
const HEARTBEAT_TIMEOUT_MS = 6000; // 3 missed heartbeats

/**
 * Hook to prevent multiple tabs from running the same test simultaneously.
 * Uses localStorage as source of truth for master tab identification and
 * BroadcastChannel for real-time cross-tab communication.
 */
export function useTabBlocking({
  attemptId,
  enabled = true
}: UseTabBlockingOptions): UseTabBlockingReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const [otherTabActive, setOtherTabActive] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabTokenRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMasterRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  const storageKey = `${STORAGE_PREFIX}${attemptId}`;

  // Generate unique token for this tab (stable across re-renders)
  const getTabToken = useCallback(() => {
    if (!tabTokenRef.current) {
      tabTokenRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    return tabTokenRef.current;
  }, []);

  // Read master info from localStorage
  const getMasterInfo = useCallback((): MasterTabInfo | null => {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) return null;
      return JSON.parse(data) as MasterTabInfo;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Write master info to localStorage
  const setMasterInfo = useCallback((info: MasterTabInfo) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(info));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [storageKey]);

  // Clear master info from localStorage
  const clearMasterInfo = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  // Check if a master tab is alive (heartbeat not timed out)
  const isMasterAlive = useCallback((info: MasterTabInfo): boolean => {
    return Date.now() - info.lastHeartbeat < HEARTBEAT_TIMEOUT_MS;
  }, []);

  // Attempt to claim master status with atomic read-verify pattern
  const tryClaimMaster = useCallback((): boolean => {
    const token = getTabToken();
    const now = Date.now();
    const existingMaster = getMasterInfo();

    // If there's an existing master that's alive and not us, we can't claim
    if (existingMaster && existingMaster.token !== token && isMasterAlive(existingMaster)) {
      return false;
    }

    // Either no master, dead master, or we are the master - claim it
    const newInfo: MasterTabInfo = {
      token,
      registeredAt: existingMaster?.token === token ? existingMaster.registeredAt : now,
      lastHeartbeat: now
    };

    setMasterInfo(newInfo);

    // Verify we actually got it (atomic check)
    const verifyInfo = getMasterInfo();
    if (verifyInfo && verifyInfo.token === token) {
      return true;
    }

    return false;
  }, [getTabToken, getMasterInfo, setMasterInfo, isMasterAlive]);

  // Dismiss the block
  const dismissBlock = useCallback(() => {
    setIsBlocked(false);
    setOtherTabActive(false);

    // Notify other tabs via channel
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'tab-closing',
        token: tabTokenRef.current
      } as ChannelMessage);
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // Prevent React Strict Mode double-initialization
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    const token = getTabToken();

    // Set up BroadcastChannel if available
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(`${CHANNEL_PREFIX}${attemptId}`);
      channelRef.current = channel;
    }

    // Handle messages from other tabs
    const handleMessage = (event: MessageEvent<ChannelMessage>) => {
      const { type, token: messageToken } = event.data;

      if (messageToken === token) {
        return; // Ignore our own messages
      }

      switch (type) {
        case 'heartbeat':
          // Another tab is master, ensure we're blocked
          if (!isMasterRef.current) {
            setIsBlocked(true);
            setOtherTabActive(true);
          }
          break;

        case 'tab-closing':
          // Master tab is leaving, try to take over
          if (!isMasterRef.current) {
            // Small delay to handle race conditions
            setTimeout(() => {
              if (tryClaimMaster()) {
                isMasterRef.current = true;
                setIsBlocked(false);
                setOtherTabActive(false);
                // Announce we're the new master
                channel?.postMessage({
                  type: 'master-claimed',
                  token
                } as ChannelMessage);
              }
            }, 100);
          }
          break;

        case 'master-claimed':
          // Another tab claimed master, ensure we're blocked
          if (!isMasterRef.current) {
            setIsBlocked(true);
            setOtherTabActive(true);
          }
          break;
      }
    };

    if (channel) {
      channel.addEventListener('message', handleMessage);
    }

    // Initial master election
    if (tryClaimMaster()) {
      isMasterRef.current = true;
      setIsBlocked(false);
      setOtherTabActive(false);

      // Announce we're master
      channel?.postMessage({
        type: 'master-claimed',
        token
      } as ChannelMessage);
    } else {
      isMasterRef.current = false;
      setIsBlocked(true);
      setOtherTabActive(true);
    }

    // Heartbeat interval - master updates localStorage, blocked tabs check for dead master
    heartbeatIntervalRef.current = setInterval(() => {
      if (isMasterRef.current) {
        // Master: update heartbeat in localStorage and broadcast
        const currentInfo = getMasterInfo();
        if (currentInfo && currentInfo.token === token) {
          setMasterInfo({
            ...currentInfo,
            lastHeartbeat: Date.now()
          });
          channel?.postMessage({
            type: 'heartbeat',
            token
          } as ChannelMessage);
        } else {
          // We lost master status somehow, try to reclaim
          if (tryClaimMaster()) {
            channel?.postMessage({
              type: 'master-claimed',
              token
            } as ChannelMessage);
          } else {
            isMasterRef.current = false;
            setIsBlocked(true);
            setOtherTabActive(true);
          }
        }
      } else {
        // Blocked tab: check if master is dead
        const masterInfo = getMasterInfo();
        if (!masterInfo || !isMasterAlive(masterInfo)) {
          // Master is dead, try to take over
          if (tryClaimMaster()) {
            isMasterRef.current = true;
            setIsBlocked(false);
            setOtherTabActive(false);
            channel?.postMessage({
              type: 'master-claimed',
              token
            } as ChannelMessage);
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Handle page close/refresh - clean up master status
    const handleBeforeUnload = () => {
      if (isMasterRef.current) {
        // Clear our master status so other tabs can take over immediately
        const currentInfo = getMasterInfo();
        if (currentInfo && currentInfo.token === token) {
          clearMasterInfo();
        }

        // Notify other tabs
        channel?.postMessage({
          type: 'tab-closing',
          token
        } as ChannelMessage);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      isInitializedRef.current = false;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Clean up master status if we're the master
      if (isMasterRef.current) {
        const currentInfo = getMasterInfo();
        if (currentInfo && currentInfo.token === token) {
          clearMasterInfo();
        }
        channel?.postMessage({
          type: 'tab-closing',
          token
        } as ChannelMessage);
      }

      if (channel) {
        channel.removeEventListener('message', handleMessage);
        channel.close();
        channelRef.current = null;
      }
    };
  }, [attemptId, enabled, getTabToken, getMasterInfo, setMasterInfo, clearMasterInfo, isMasterAlive, tryClaimMaster]);

  return {
    isBlocked,
    otherTabActive,
    dismissBlock
  };
}

export default useTabBlocking;
