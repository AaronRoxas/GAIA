/**
 * Analytics Hooks using React Query
 * 
 * Provides React Query-powered hooks for analytics data:
 * - useHazardStats: Cached hazard statistics
 * - useHazardTrends: Cached trend data with configurable time range
 * - useRegionStats: Cached region statistics
 * - useHazardDistribution: Cached hazard type distribution
 * - useRecentAlerts: Cached recent alerts with configurable limit
 * 
 * Benefits:
 * - 5-minute cache for all analytics data
 * - Automatic request deduplication
 * - Background refetch on stale data
 * - Built-in loading/error states
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { queryKeys } from '../lib/queryClient';
import { analyticsApi } from '../lib/analyticsApi';
import type {
  HazardStats,
  HazardTrend,
  RegionStats,
  HazardTypeDistribution,
  SourceBreakdown,
  RecentAlert,
  ConfidenceByTypeMetric,
  FalsePositiveRateMetric,
  SourceAccuracyMetric,
  ProcessingRateMetric,
  DuplicateDetectionMetric,
  SystemHealthMetric,
} from '../lib/analyticsApi';

type QueryLike = {
  state: {
    data: unknown;
  };
};

function serializeForSignature(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeForSignature(item, seen)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${key}:${serializeForSignature(item, seen)}`).join(',')}}`;
  }

  return `${typeof value}:${String(value)}`;
}
/**
 * Track whether the page is visible so polling can pause when the tab is hidden.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true;
    }

    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const updateVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('pageshow', updateVisibility);
    window.addEventListener('focus', updateVisibility);

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('pageshow', updateVisibility);
      window.removeEventListener('focus', updateVisibility);
    };
  }, []);

  return isVisible;
}

/**
 * Adaptive refetch interval that pauses in background tabs and backs off when
 * the query payload stays unchanged between fetches.
 */
export function useAdaptiveRefetchInterval({
  enabled,
  baseInterval,
  maxInterval,
  backoffMultiplier = 1.5,
}: {
  enabled: boolean;
  baseInterval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
}) {
  const currentIntervalRef = useRef(baseInterval);
  const lastSignatureRef = useRef<string | null>(null);
  const resolvedMaxInterval = maxInterval ?? Math.max(baseInterval * 6, baseInterval);

  useEffect(() => {
    currentIntervalRef.current = baseInterval;
    lastSignatureRef.current = null;
  }, [baseInterval, enabled]);

  return useCallback((query: QueryLike) => {
    if (!enabled) {
      return false;
    }

    const signature = serializeForSignature(query.state.data);

    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      currentIntervalRef.current = baseInterval;
      return baseInterval;
    }

    currentIntervalRef.current = Math.min(
      resolvedMaxInterval,
      Math.max(baseInterval, Math.round(currentIntervalRef.current * backoffMultiplier)),
    );

    return currentIntervalRef.current;
  }, [backoffMultiplier, baseInterval, enabled, resolvedMaxInterval]);
}

/**
 * Fetch hazard statistics (total, active, resolved, unverified, avg confidence)
 * Cached for 5 minutes, automatically refetches when stale
 */
export function useHazardStats() {
  return useQuery<HazardStats, Error>({
    queryKey: queryKeys.analytics.stats(),
    queryFn: () => analyticsApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2, // Retry twice on failure
  });
}

/**
 * Fetch hazard trends over time (last N days)
 * 
 * @param days - Number of days to retrieve (7-90), default 30
 */
export function useHazardTrends(days: number = 30) {
  return useQuery<HazardTrend[], Error>({
    queryKey: queryKeys.analytics.trends(days),
    queryFn: () => analyticsApi.getTrends(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch hazard statistics by administrative region
 * Includes hazard count, active count, and average severity per region
 */
export function useRegionStats() {
  return useQuery<RegionStats[], Error>({
    queryKey: queryKeys.analytics.regions(),
    queryFn: () => analyticsApi.getRegionStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch hazard type distribution (count and percentage per type)
 * Useful for pie charts and distribution visualizations
 */
export function useHazardDistribution() {
  return useQuery<HazardTypeDistribution[], Error>({
    queryKey: queryKeys.analytics.distribution(),
    queryFn: () => analyticsApi.getDistribution(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

export function useSourceBreakdown() {
  return useQuery<SourceBreakdown[], Error>({
    queryKey: queryKeys.analytics.sourceBreakdown(),
    queryFn: () => analyticsApi.getSourceBreakdown(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch recent hazard alerts
 * 
 * @param limit - Number of alerts to retrieve (default 10)
 */
export function useRecentAlerts(limit: number = 10) {
  const isVisible = usePageVisibility();
  const refetchInterval = useAdaptiveRefetchInterval({
    enabled: isVisible,
    baseInterval: 2 * 60 * 1000,
    maxInterval: 10 * 60 * 1000,
    backoffMultiplier: 1.5,
  });

  return useQuery<RecentAlert[], Error>({
    queryKey: queryKeys.analytics.recentAlerts(limit),
    queryFn: () => analyticsApi.getRecentAlerts(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - alerts are more time-sensitive
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval,
  });
}

// ============================================================================
// AI/ML Quality Metrics Hooks (New)
// ============================================================================

/**
 * Fetch average confidence score by hazard type
 * Shows which hazard types have better model confidence
 */
export function useConfidenceByType() {
  return useQuery<ConfidenceByTypeMetric[], Error>({
    queryKey: queryKeys.analytics.confidenceByType(),
    queryFn: () => analyticsApi.getConfidenceByType(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch false positive rate from citizen reports
 * Measures validation quality - ratio of rejected to verified reports
 */
export function useFalsePositiveRate() {
  return useQuery<FalsePositiveRateMetric, Error>({
    queryKey: queryKeys.analytics.falsePositiveRate(),
    queryFn: () => analyticsApi.getFalsePositiveRate(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch accuracy comparison between RSS and citizen reports
 * Shows which source type has better reliability
 */
export function useSourceAccuracy() {
  return useQuery<SourceAccuracyMetric, Error>({
    queryKey: queryKeys.analytics.sourceAccuracy(),
    queryFn: () => analyticsApi.getSourceAccuracy(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch hazard processing/detection rate
 * Shows system throughput - hazards detected per hour
 */
export function useProcessingRate() {
  const isVisible = usePageVisibility();
  const refetchInterval = useAdaptiveRefetchInterval({
    enabled: isVisible,
    baseInterval: 2 * 60 * 1000,
    maxInterval: 10 * 60 * 1000,
    backoffMultiplier: 1.5,
  });

  return useQuery<ProcessingRateMetric, Error>({
    queryKey: queryKeys.analytics.processingRate(),
    queryFn: () => analyticsApi.getProcessingRate(),
    staleTime: 1 * 60 * 1000, // 1 minute - more real-time
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval,
  });
}

/**
 * Fetch duplicate detection rate
 * Shows effectiveness of duplicate detection
 */
export function useDuplicateRate() {
  return useQuery<DuplicateDetectionMetric, Error>({
    queryKey: queryKeys.analytics.duplicateRate(),
    queryFn: () => analyticsApi.getDuplicateRate(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch system health and performance metrics
 * Overall system status including response time and reliability
 */
export function useSystemHealth() {
  const isVisible = usePageVisibility();
  const refetchInterval = useAdaptiveRefetchInterval({
    enabled: isVisible,
    baseInterval: 60 * 1000,
    maxInterval: 5 * 60 * 1000,
    backoffMultiplier: 1.5,
  });

  return useQuery<SystemHealthMetric, Error>({
    queryKey: queryKeys.analytics.systemHealth(),
    queryFn: () => analyticsApi.getSystemHealth(),
    staleTime: 30 * 1000, // 30 seconds - real-time system status
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval,
  });
}

/**
 * Invalidate all analytics queries
 * Useful after manual data refresh or real-time updates
 */
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
  };
}