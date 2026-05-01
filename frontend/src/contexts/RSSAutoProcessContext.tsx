/**
 * RSS Auto-Processing Context
 * 
 * Provides system-wide automatic RSS feed processing that continues
 * regardless of which view/tab the user is currently on.
 * 
 * Features:
 * - Automatic processing every 20 minutes
 * - Non-blocking background processing
 * - Overlap prevention (skips if already processing)
 * - Pause/Resume control
 * - Persists across view navigation
 * 
 * Usage:
 * - Wrap app with <RSSAutoProcessProvider>
 * - Use useRSSAutoProcess() hook to access state/controls
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { rssQueryKeys } from '../hooks/useRSS';
import { useRssSchedule } from '../hooks/useRssSchedule';

// Configuration
const AUTO_PROCESS_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000; // 1 second

// Use relative API paths to avoid editor TS issues with `process` in the frontend context
const RSS_API_BASE = `/api/v1/admin/rss`;

interface RSSAutoProcessContextValue {
  isEnabled: boolean;
  isProcessing: boolean;
  countdown: string;
  nextRunTime: Date | null;
  toggle: () => void;
  processNow: () => Promise<void>;
  isScheduleUpdating?: boolean;
}

const RSSAutoProcessContext = createContext<RSSAutoProcessContextValue | null>(null);

export function RSSAutoProcessProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // State
  const [isEnabled, setIsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const { schedule, setSchedule, isUpdating } = useRssSchedule();
  
  // Refs for intervals
  const autoProcessIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const nextRunTimeRef = useRef<Date | null>(null);

  /**
   * Format remaining time as MM:SS or HH:MM:SS
   */
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Process feeds via API (non-blocking, backend handles in background)
   */
  const processFeeds = useCallback(async (): Promise<void> => {
    // Skip if already processing
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch(`${RSS_API_BASE}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `HTTP error! status: ${response.status}`,
        }));
        throw new Error(errorData.detail || 'Processing request failed');
      }

      const data = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.feeds() });
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.logs() });
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.statistics() });
      
      toast.success(`Processing ${data.feeds_count} feeds in background`);
    } catch (error) {
      console.error('[RSS Auto-Process] Failed:', error);
      toast.error(`Auto-processing failed: ${(error as Error).message}`);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [queryClient]);

  /**
   * Schedule next auto-process run
   */
  const scheduleNextRun = useCallback(() => {
    const next = new Date(Date.now() + AUTO_PROCESS_INTERVAL_MS);
    nextRunTimeRef.current = next;
    setNextRunTime(next);
    // Persist next run to backend so Celery and other clients can sync
    // Use debounced setter from useRssSchedule to avoid duplicate POSTs
    try {
      setSchedule(next.toISOString());
    } catch (e) {
      // swallow errors silently; server persistence is best-effort
    }
    return next;
  }, [setSchedule]);

  /**
   * Update countdown display
   */
  const updateCountdown = useCallback(() => {
    const currentNextRunTime = nextRunTimeRef.current;

    if (!currentNextRunTime) {
      setCountdown('');
      return;
    }
    
    const remaining = currentNextRunTime.getTime() - Date.now();
    if (remaining <= 0) {
      setCountdown('Processing...');
    } else {
      setCountdown(formatCountdown(remaining));
    }
  }, [formatCountdown]);

  /**
   * Start auto-processing interval
   */
  const startAutoProcessing = useCallback(() => {
    // Clear any existing intervals
    if (autoProcessIntervalRef.current) {
      clearInterval(autoProcessIntervalRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Schedule first run
    scheduleNextRun();

    // Set up the processing interval
    autoProcessIntervalRef.current = setInterval(() => {
      processFeeds();
      scheduleNextRun();
    }, AUTO_PROCESS_INTERVAL_MS);

    // Set up countdown update interval
    countdownIntervalRef.current = setInterval(() => {
      updateCountdown();
    }, COUNTDOWN_UPDATE_INTERVAL_MS);

    // Initial countdown update
    updateCountdown();
  }, [processFeeds, scheduleNextRun, updateCountdown]);

  /**
   * Stop auto-processing interval
   */
  const stopAutoProcessing = useCallback(() => {
    if (autoProcessIntervalRef.current) {
      window.clearInterval(autoProcessIntervalRef.current);
      autoProcessIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    nextRunTimeRef.current = null;
    setNextRunTime(null);
    setCountdown('');
    // Clear persisted schedule on server (debounced)
    try {
      setSchedule(null);
    } catch (e) {
      // swallow - non-fatal
    }
  }, [setSchedule]);

  // Align frontend timer with backend schedule when schedule is loaded/refetched
  useEffect(() => {
    if (schedule && typeof schedule === 'string') {
      const next = new Date(schedule);
      if (!isNaN(next.getTime())) {
        nextRunTimeRef.current = next;
        setNextRunTime(next);
      }
    }
  }, [schedule]);
  /**
   * Toggle auto-processing on/off
   */
  const toggle = useCallback(() => {
    if (isEnabled) {
      stopAutoProcessing();
      setIsEnabled(false);
      toast.info('RSS auto-processing paused');
    } else {
      setIsEnabled(true);
      startAutoProcessing();
      toast.success('RSS auto-processing resumed (every 20 minutes)');
    }
  }, [isEnabled, startAutoProcessing, stopAutoProcessing]);

  /**
   * Manual process now (resets timer)
   */
  const processNow = useCallback(async () => {
    await processFeeds();
    // Reset timer after manual processing
    if (isEnabled) {
      scheduleNextRun();
    }
  }, [processFeeds, isEnabled, scheduleNextRun]);

  // Initialize auto-processing on mount
  useEffect(() => {
    if (isEnabled) {
      startAutoProcessing();
    }

    // Cleanup on unmount
    return () => {
      if (autoProcessIntervalRef.current) {
        window.clearInterval(autoProcessIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isEnabled, startAutoProcessing]);

  // Update countdown when nextRunTime changes
  useEffect(() => {
    updateCountdown();
  }, [nextRunTime, updateCountdown]);

  const value: RSSAutoProcessContextValue = {
    isEnabled,
    isProcessing,
    countdown,
    nextRunTime,
    toggle,
    processNow,
    isScheduleUpdating: isUpdating,
  };

  return (
    <RSSAutoProcessContext.Provider value={value}>
      {children}
    </RSSAutoProcessContext.Provider>
  );
}

/**
 * Hook to access RSS auto-processing state and controls
 */
export function useRSSAutoProcess(): RSSAutoProcessContextValue {
  const context = useContext(RSSAutoProcessContext);
  if (!context) {
    throw new Error('useRSSAutoProcess must be used within RSSAutoProcessProvider');
  }
  return context;
}

