/**
 * Analytics API Client
 * 
 * Provides methods to fetch analytics and statistics from the backend
 * All methods return cached data via React Query hooks in useAnalytics.ts
 * 
 * Module: AAM-01 (Advanced Analytics Module)
 */

import { apiRequest } from './api';

const ANALYTICS_BASE_PATH = '/api/v1/analytics';

export interface HazardStats {
  total_hazards: number;
  active_hazards: number;
  resolved_hazards: number;
  unverified_reports: number;
  avg_confidence: number;
  avg_time_to_action: number | null;
}

export interface HazardTrend {
  date: string;
  volcanic_eruption: number;
  earthquake: number;
  flood: number;
  landslide: number;
  fire: number;
  storm_surge: number;
  total: number;
}

export interface RegionStats {
  region: string;
  total_count: number;
  active_count: number;
  resolved_count: number;
}

export interface HazardTypeDistribution {
  hazard_type: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdown {
  source_type: 'rss' | 'citizen_report';
  count: number;
  percentage: number;
  avg_confidence: number;
}

export interface RecentAlert {
  id: string;
  hazard_type: string;
  location_name: string;
  admin_division?: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  source_type: 'rss' | 'citizen_report';
  status: 'active' | 'resolved' | 'archived';
  confidence_score: number;
  detected_at: string;
}

/**
 * Analytics API client - provides methods to fetch various analytics data
 */
export const analyticsApi = {
  /**
   * Get overall hazard statistics
   */
  async getStats(): Promise<HazardStats> {
    return apiRequest<HazardStats>(`${ANALYTICS_BASE_PATH}/stats`);
  },

  /**
   * Get hazard trends over time
   * @param days Number of days to retrieve (7-90)
   */
  async getTrends(days: number = 30): Promise<HazardTrend[]> {
    return apiRequest<HazardTrend[]>(`${ANALYTICS_BASE_PATH}/trends?days=${days}`);
  },

  /**
   * Get statistics by administrative region
   */
  async getRegionStats(): Promise<RegionStats[]> {
    return apiRequest<RegionStats[]>(`${ANALYTICS_BASE_PATH}/regions`);
  },

  /**
   * Get hazard type distribution (count and percentage)
   */
  async getDistribution(): Promise<HazardTypeDistribution[]> {
    return apiRequest<HazardTypeDistribution[]>(`${ANALYTICS_BASE_PATH}/distribution`);
  },

  /**
   * Get breakdown by source type (RSS vs citizen reports)
   */
  async getSourceBreakdown(): Promise<SourceBreakdown[]> {
    return apiRequest<SourceBreakdown[]>(`${ANALYTICS_BASE_PATH}/source-breakdown`);
  },

  /**
   * Get recent hazard alerts
   * @param limit Number of alerts to retrieve
   */
  async getRecentAlerts(limit: number = 10): Promise<RecentAlert[]> {
    return apiRequest<RecentAlert[]>(`${ANALYTICS_BASE_PATH}/recent-alerts?limit=${limit}`);
  },
};
