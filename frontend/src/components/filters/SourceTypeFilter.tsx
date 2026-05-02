/**
 * SourceTypeFilter Component
 *
 * Production-grade source type filter with unified checkbox pattern.
 * Filters hazards by source type (RSS feeds, verified and unverified citizen reports).
 * Hides "Citizen Report - Unverified" option from unauthenticated users.
 *
 * Module: FP-04
 * Change: unified-filter-pattern
 *
 * Design System: AGAILA brand (navy primary, steel blue secondary, orange accent)
 * Typography: Lato (primary), Inter (secondary)
 * Animation: Smooth transitions (200ms), staggered reveals, respects prefers-reduced-motion
 *
 * Features:
 * - Custom checkbox styling with animated state transitions
 * - Grid layout with consistent spacing and hover effects
 * - "Select All" / "Deselect All" toggle with icon feedback
 * - Source count badges with dynamic styling
 * - Icon visualization for each source type
 * - Authentication-aware: unverified option only for authenticated users
 * - Staggered animation on reveal
 * - WCAG 2.1 AA accessibility
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, UserCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import type { SourceType } from '../../hooks/useHazardFilters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SourceTypeFilterProps {
  selectedSources: SourceType[];
  onSourcesChange: (sources: SourceType[]) => void;
  sourceCounts?: Record<SourceType, number>;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SOURCE_OPTIONS = [
  {
    value: 'rss_feed' as SourceType,
    label: 'News Feed',
    icon: Newspaper,
    color: '#005A9C', // Steel blue
    requiresAuth: false,
  },
  {
    value: 'citizen_verified' as SourceType,
    label: 'Citizen - Verified',
    icon: UserCheck,
    color: '#10b981', // Green
    requiresAuth: false,
  },
  {
    value: 'citizen_unverified' as SourceType,
    label: 'Citizen - Unverified',
    icon: ShieldAlert,
    color: '#f59e0b', // Amber
    requiresAuth: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SourceTypeFilter({
  selectedSources,
  onSourcesChange,
  sourceCounts = {} as Record<SourceType, number>,
  disabled = false,
}: SourceTypeFilterProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Check user authentication status on mount and listen for auth changes
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!user);
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth state changes (e.g., login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // STATE DERIVATIONS
  // ============================================================================

  // Available sources depend on authentication status
  const availableSources = SOURCE_OPTIONS.filter(
    opt => !opt.requiresAuth || isAuthenticated
  ).map(opt => opt.value);
  
  const allSelected = availableSources.every(source => selectedSources.includes(source));
  const noneSelected = selectedSources.length === 0;
  const totalCount = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);

  // ============================================================================
  // HELPER: Determine visual state of a source type item
  // ============================================================================

  /**
   * Returns the visual state of a source type checkbox based on:
   * - Whether this source is selected
   * - Whether any sources are selected (neutral state when none selected)
   *
   * States:
   * - 'selected': This source is actively checked
   * - 'neutral': No sources selected (show all are visible)
   * - 'deselected': Some sources selected but not this one
   */
  const getItemState = (sourceIsSelected: boolean) => {
    if (sourceIsSelected) return 'selected';
    if (noneSelected) return 'neutral';
    return 'deselected';
  };

  // ============================================================================
  // HELPER: Get background class for item container based on state
  // ============================================================================

  const getItemBackgroundClass = (state: 'selected' | 'neutral' | 'deselected') => {
    switch (state) {
      case 'selected':
        return 'border-secondary-400 bg-gradient-to-br from-secondary-50 to-secondary-50/30 shadow-sm dark:border-secondary/55 dark:from-secondary/20 dark:to-secondary/10 dark:shadow-none';
      case 'neutral':
        return 'border-secondary-200 bg-secondary-50 hover:border-secondary-300 dark:border-secondary/35 dark:bg-secondary/15 dark:hover:border-secondary/55';
      case 'deselected':
        return 'border-border bg-muted/50 hover:bg-muted/70 dark:bg-muted/20 dark:hover:bg-muted/35';
    }
  };

  // ============================================================================
  // HELPER: Get checkbox background class based on state
  // ============================================================================

  const getCheckboxClass = (state: 'selected' | 'neutral' | 'deselected') => {
    switch (state) {
      case 'selected':
        // Navy primary when checked
        return 'bg-primary-600 border-primary-600';
      case 'neutral':
        // Steel blue when neutral (no selection)
        return 'bg-secondary-200 border-secondary-300';
      case 'deselected':
        return 'border-border bg-background group-hover:border-secondary/55 dark:bg-muted dark:group-hover:border-secondary/45';
    }
  };

  // ============================================================================
  // HELPER: Get icon container styles based on state
  // ============================================================================

  const getIconStyles = (state: 'selected' | 'neutral' | 'deselected', color: string) => {
    const baseScale = state === 'selected' ? 'scale-110' : 'scale-100';
    const hoverScale = state === 'deselected' ? 'group-hover:scale-105' : '';
    
    let backgroundColor: string;
    let iconColor: string;

    if (state === 'neutral') {
      backgroundColor = 'transparent';
      iconColor = 'currentColor';
    } else if (state === 'selected') {
      // Color-coded for selected state
      backgroundColor = `${color}30`;
      iconColor = color;
    } else {
      // Subtle gray for deselected
      backgroundColor = `${color}15`;
      iconColor = '#9ca3af';
    }

    return {
      scaleClass: `${baseScale} ${hoverScale}`,
      backgroundColor,
      iconColor,
    };
  };

  // ============================================================================
  // HELPER: Get label text class based on state
  // ============================================================================

  const getLabelClass = (state: 'selected' | 'neutral' | 'deselected') => {
    switch (state) {
      case 'selected':
        return 'text-foreground font-semibold font-lato';
      case 'neutral':
        return 'text-foreground font-lato';
      case 'deselected':
        return 'text-muted-foreground group-hover:text-foreground font-lato';
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Toggle all available source types
   */
  const handleToggleAll = () => {
    if (allSelected) {
      // Deselect all when all are selected
      onSourcesChange([]);
    } else {
      // Select all available (respects auth)
      onSourcesChange(availableSources);
    }
  };

  /**
   * Toggle individual source type
   */
  const handleToggleSource = (source: SourceType) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter(s => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="p-5 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .source-item {
          animation: slideInDown 0.25s ease-out forwards;
        }

        .source-item:nth-child(1) { animation-delay: 0ms; }
        .source-item:nth-child(2) { animation-delay: 40ms; }
        .source-item:nth-child(3) { animation-delay: 80ms; }

        @media (prefers-reduced-motion: reduce) {
          .source-item {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="space-y-4">
        {/* Header with Select All */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground font-lato">Source Type</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-inter">Filter by information source</p>
          </div>
          {!isCheckingAuth && (
            <button
              onClick={handleToggleAll}
              disabled={disabled}
              className="
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                rounded-md transition-all duration-200
                text-muted-foreground hover:bg-muted hover:text-foreground
                disabled:text-muted-foreground/50 disabled:bg-transparent disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              "
              aria-label={allSelected ? 'Deselect all source types' : 'Select all source types'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {allSelected ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                )}
              </svg>
              <span>{allSelected ? 'Clear' : 'All'}</span>
            </button>
          )}
        </div>

        {/* Summary Badge - Shows selection count when not all are visible */}
        {!noneSelected && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/15 rounded-lg border border-secondary/25 dark:bg-secondary/10 dark:border-secondary/30">
            <Badge variant="secondary" className="font-semibold bg-secondary/25 text-secondary-900 dark:bg-secondary/30 dark:text-blue-100">
              {selectedSources.length} / {availableSources.length}
            </Badge>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-muted-foreground font-inter">
                {totalCount} hazard{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Source Type Grid - Aligned with HazardTypeFilter pattern */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2.5">
          {SOURCE_OPTIONS.map((option) => {
            // Hide unverified option from unauthenticated users
            if (option.requiresAuth && !isAuthenticated) {
              return null;
            }

            const Icon = option.icon;
            const count = sourceCounts[option.value] || 0;
            const sourceIsSelected = selectedSources.includes(option.value);
            const state = getItemState(sourceIsSelected);
            const itemBgClass = getItemBackgroundClass(state);
            const checkboxClass = getCheckboxClass(state);
            const iconStyles = getIconStyles(state, option.color);
            const labelClass = getLabelClass(state);
            
            return (
              <label
                key={option.value}
                className="source-item"
              >
                <div
                  className={`
                    group relative flex items-start gap-3 p-3.5 rounded-lg
                    border-2 transition-all duration-200 cursor-pointer
                    ${itemBgClass}
                    ${disabled || isCheckingAuth ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:shadow-sm'}
                    focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background
                  `}
                >
                  {/* Hidden Checkbox Input */}
                  <input
                    type="checkbox"
                    checked={sourceIsSelected}
                    onChange={() => handleToggleSource(option.value)}
                    disabled={disabled || isCheckingAuth}
                    className="sr-only"
                  />
                  
                  {/* Custom Checkbox Visual */}
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center
                        transition-all duration-200
                        ${checkboxClass}
                      `}
                    >
                      {sourceIsSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {state === 'neutral' && !sourceIsSelected && (
                        <svg
                          className="w-3 h-3 text-muted-foreground"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Icon and Label Row */}
                    <div className="flex items-center gap-3 mb-1">
                      {/* Icon with Dynamic Background */}
                      <div 
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 transition-all duration-200',
                          iconStyles.scaleClass,
                          state === 'neutral' &&
                            'bg-secondary-100 text-secondary-700 dark:bg-secondary/40 dark:text-sky-200'
                        )}
                        style={
                          state === 'neutral'
                            ? undefined
                            : {
                                backgroundColor: iconStyles.backgroundColor,
                                color: iconStyles.iconColor,
                              }
                        }
                      >
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      
                      {/* Label and Count */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-sm font-medium transition-colors duration-200 ${labelClass}`}>
                          {option.label}
                        </span>
                        
                        {/* Count Badge - Dynamic styling */}
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 transition-all duration-200 border ${
                            count > 0
                              ? 'font-semibold shadow-sm bg-gradient-to-br from-primary/12 to-secondary/12 text-primary border-primary/25 dark:from-primary/90 dark:to-secondary/80 dark:text-primary-foreground dark:border-primary/40'
                              : 'font-normal text-muted-foreground border-border bg-transparent'
                          }`}
                        >
                          {count}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Loading State - Show while checking authentication */}
        {isCheckingAuth && (
          <div className="text-center py-3 px-3 bg-muted/40 rounded-lg border border-border animate-pulse">
            <p className="text-xs text-muted-foreground font-medium font-inter">
              Checking authentication status...
            </p>
          </div>
        )}

        {/* Authentication Info - Show when user is not authenticated */}
        {!isCheckingAuth && !isAuthenticated && (
          <div className="
            text-xs bg-amber-500/10 rounded-lg p-3.5 
            border border-amber-500/35 dark:bg-amber-950/35 dark:border-amber-800 flex items-start gap-3 shadow-sm
          ">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 flex-none" />
            <div>
              <p className="font-semibold text-amber-950 dark:text-amber-100 mb-1">Limited Access</p>
              <p className="text-amber-900 dark:text-amber-200/90 leading-relaxed">
                Sign in to view unverified citizen reports.
              </p>
            </div>
          </div>
        )}

        {/* No Selection Message - Show when all sources are deselected */}
        {noneSelected && !isCheckingAuth && (
          <div className="text-center py-4 px-3 bg-muted/40 rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">All source types are visible</p>
            <p className="text-xs text-muted-foreground mt-1.5 font-inter">
              Select specific sources to filter the map
            </p>
          </div>
        )}

        {/* Info Note - About source types */}
        <div className="text-xs bg-muted/40 rounded-lg p-3 border border-border space-y-1.5">
          <p className="font-semibold text-foreground">About Source Types</p>
          <p className="text-muted-foreground leading-relaxed">
            Unverified citizen reports require manual validation by authorities. Verified sources include official news feeds and confirmed citizen reports.
          </p>
        </div>
      </div>
    </Card>
  );
}