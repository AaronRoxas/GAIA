/**
 * TimeWindowFilter Component
 *
 * Simplified time window filter with preset buttons only.
 * Filters hazards by time window: "All Time", "Last 24h", "Last 7 Days", "Last 30 Days"
 *
 * Module: FP-03
 * Change: simplified-time-window-filter
 *
 * Design System: AGAILA brand (navy primary, steel blue secondary, orange accent)
 * Typography: Lato (primary), Inter (secondary)
 * Animation: Smooth transitions (200ms), respects prefers-reduced-motion
 *
 * Features:
 * - Simple preset buttons with consistent styling
 * - Clear active state and hover states
 * - WCAG 2.1 AA accessible
 * - No calendar picker (simplified UX for MVP)
 * - Timezone handling (Philippine Time GMT+8)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz/tz';
import { tzOffset } from '@date-fns/tz/tzOffset';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import type { TimeWindow, CustomDateRange } from '../../hooks/useHazardFilters';

const MANILA_TZ = 'Asia/Manila';

function formatInManila(value: Date, pattern: string): string {
  return format(value, pattern, { in: tz(MANILA_TZ) });
}

function manilaWallClockToUtc(dateString: string, endOfDay = false): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  const wallClockTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offsetMinutes = tzOffset(MANILA_TZ, new Date(wallClockTimestamp));
  return new Date(wallClockTimestamp - offsetMinutes * 60 * 1000);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PresetOption {
  value: TimeWindow;
  label: string;
}

export interface TimeWindowFilterProps {
  timeWindow: TimeWindow;
  customDateRange?: CustomDateRange;
  onTimeWindowChange: (window: TimeWindow, customRange?: CustomDateRange) => void;
  disabled?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Preset time window options for quick filtering */
const PRESET_OPTIONS: PresetOption[] = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time window for display in active badge
 */
function formatTimeWindow(window: TimeWindow, customRange?: CustomDateRange): string {
  switch (window) {
    case '24h':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case 'custom':
      if (customRange) {
        return `${formatInManila(customRange.start, 'MMM d')} - ${formatInManila(customRange.end, 'MMM d')}`;
      }
      return 'Custom range';
    case 'all':
    default:
      return 'All time';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TimeWindowFilter({
  timeWindow,
  customDateRange,
  onTimeWindowChange,
  disabled = false,
}: TimeWindowFilterProps) {
  const [showCustomRange, setShowCustomRange] = useState(timeWindow === 'custom');
  const [startDate, setStartDate] = useState<string>(
    customDateRange ? formatInManila(customDateRange.start, 'yyyy-MM-dd') : ''
  );
  const [endDate, setEndDate] = useState<string>(
    customDateRange ? formatInManila(customDateRange.end, 'yyyy-MM-dd') : ''
  );
  const [dateError, setDateError] = useState<string>('');
  // Track previous time window to restore on cancel
  const prevTimeWindowRef = useRef<TimeWindow | null>(null);

  // Update date inputs when customDateRange prop changes
  useEffect(() => {
    if (customDateRange) {
      setStartDate(formatInManila(customDateRange.start, 'yyyy-MM-dd'));
      setEndDate(formatInManila(customDateRange.end, 'yyyy-MM-dd'));
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [customDateRange]);

  /**
   * Handle preset button click
   */
  const handlePresetClick = (preset: TimeWindow) => {
    if (preset === 'custom') {
      // Save current time window before opening custom range
      prevTimeWindowRef.current = timeWindow;
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      onTimeWindowChange(preset);
    }
  };

  /**
   * Handle custom date range submission
   */
  const handleCustomRangeSubmit = () => {
    setDateError('');
    if (!startDate || !endDate) {
      setDateError('Both start and end dates are required');
      return;
    }
    
    // Convert Manila wall-clock dates to UTC timestamps.
    const startDateObj = manilaWallClockToUtc(startDate, false);
    const endDateObj = manilaWallClockToUtc(endDate, true);
    
    if (startDateObj.getTime() > endDateObj.getTime()) {
      setDateError('Start date must be before end date');
      return;
    }
    
    const customRange: CustomDateRange = {
      start: startDateObj,
      end: endDateObj,
    };
    onTimeWindowChange('custom', customRange);
    setShowCustomRange(false);
  };

  /**
   * Handle custom range cancel - restore previous selection
   */
  const handleCustomRangeCancel = () => {
    setShowCustomRange(false);
    // Restore previous time window or fallback to 'all'
    if (prevTimeWindowRef.current && prevTimeWindowRef.current !== 'custom') {
      onTimeWindowChange(prevTimeWindowRef.current);
    } else {
      onTimeWindowChange('all');
    }
  };

  return (
    <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-lato">
                Time Window
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-inter">Filter hazards by date range</p>
            </div>
            {timeWindow !== 'all' && (
              <button
                onClick={() => handlePresetClick('all')}
                disabled={disabled}
                className="
                  text-xs font-medium px-2.5 py-1 rounded-md
                  transition-all duration-200
                  text-slate-600 hover:text-orange-700 hover:bg-orange-50
                  disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                "
                aria-label="Clear time window filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Selection Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">
              {formatTimeWindow(timeWindow, customDateRange)}
            </span>
          </div>
        </div>

        {/* Preset Buttons - Design System Aligned */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_OPTIONS.map((option) => {
            const isActive = timeWindow === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handlePresetClick(option.value)}
                disabled={disabled}
                aria-pressed={isActive}
                className={cn(
                  'px-3 py-2.5 rounded-lg border-2 transition-all',
                  'text-sm font-medium',
                  isActive
                    ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50',
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Input */}
        {showCustomRange && (
          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Select Custom Date Range
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="startDate" className="text-xs font-medium text-slate-600 block mb-1">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={disabled}
                  className={cn(
                    'w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-100'
                  )}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="text-xs font-medium text-slate-600 block mb-1">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={disabled}
                  className={cn(
                    'w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-100'
                  )}
                />
              </div>
            </div>
            {dateError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2" role="alert">
                {dateError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCustomRangeSubmit}
                disabled={!startDate || !endDate || disabled}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors',
                  'bg-orange-600 text-white hover:bg-orange-700',
                  'disabled:bg-slate-300 disabled:cursor-not-allowed'
                )}
              >
                Apply
              </button>
              <button
                onClick={handleCustomRangeCancel}
                disabled={disabled}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors',
                  'bg-slate-200 text-slate-700 hover:bg-slate-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Philippine Time Note */}
        <div className="text-xs bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1">
          <p className="font-semibold text-slate-900">Philippine Time (GMT+8)</p>
          <p className="text-slate-600">
            All times displayed and filtered in Philippine Time.
          </p>
        </div>
      </div>
    </Card>
  );
}