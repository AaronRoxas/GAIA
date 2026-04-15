/**
 * MapSkeleton Component
 * 
 * Loading skeleton for map data with accessibility support
 * Shows placeholder content while hazard data is being fetched
 * 
 * Module: GV-02 (Dynamic Markers)
 */

import React from 'react';

interface MapSkeletonProps {
  count?: number;
  variant?: 'compact' | 'full';
}

/**
 * Skeleton loader for hazard list items in sidebar
 */
export const HazardListSkeleton: React.FC<MapSkeletonProps> = ({ count = 5, variant = 'compact' }) => {
  return (
    <div 
      className="space-y-3 p-4"
      role="status"
      aria-label="Loading hazards"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="p-3 rounded-lg bg-gray-100 animate-pulse border border-gray-200"
        >
          {variant === 'full' ? (
            <>
              {/* Header skeleton */}
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="h-6 w-12 bg-gray-300 rounded-full ml-2 shrink-0"></div>
              </div>
              {/* Details skeleton */}
              <div className="space-y-2 text-sm">
                <div className="h-3 bg-gray-300 rounded w-48"></div>
                <div className="h-3 bg-gray-300 rounded w-40"></div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-2">
                <div className="h-4 bg-gray-300 rounded flex-1 mr-2"></div>
                <div className="h-6 w-12 bg-gray-300 rounded-full shrink-0"></div>
              </div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for filter panel controls
 */
export const FilterPanelSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-4 p-4"
      role="status"
      aria-label="Loading filters"
      aria-busy="true"
    >
      {/* Filter section skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Label */}
          <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
          
          {/* Filter options */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div 
                key={j}
                className="flex items-center space-x-2 animate-pulse"
              >
                <div className="h-4 w-4 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for map controls area
 */
export const MapControlsSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-3 p-4"
      role="status"
      aria-label="Loading map controls"
      aria-busy="true"
    >
      {/* Legend skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center gap-2 animate-pulse"
          >
            <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Controls skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-2 bg-gray-100 rounded animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-6 w-11 bg-gray-300 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for sidebar search box
 */
export const SearchBoxSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-2 p-4"
      role="status"
      aria-label="Loading search box"
      aria-busy="true"
    >
      <div className="h-10 bg-gray-300 rounded-lg animate-pulse"></div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div 
            key={i}
            className="h-8 bg-gray-200 rounded animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for hazard count card
 */
export const HazardCountSkeleton: React.FC = () => {
  return (
    <div 
      className="p-3 sm:p-4 rounded-lg bg-gray-100 border border-gray-200 animate-pulse"
      role="status"
      aria-label="Loading hazard count"
      aria-busy="true"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-300 rounded w-16"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="h-6 w-12 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for full sidebar
 */
export const SidebarSkeleton: React.FC = () => {
  return (
    <div 
      className="flex flex-col h-full space-y-4"
      role="status"
      aria-label="Loading sidebar"
      aria-busy="true"
    >
      {/* Search box */}
      <SearchBoxSkeleton />
      
      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Filter panel - takes flex space */}
      <div className="flex-1 overflow-hidden">
        <FilterPanelSkeleton />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Hazard count */}
      <HazardCountSkeleton />
    </div>
  );
};

/**
 * Skeleton loader for map controls floating panel
 */
export const FloatingControlsSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-3"
    >
      {/* Clustering toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-6 w-11 bg-gray-300 rounded-full"></div>
      </div>

      {/* Heatmap toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-6 w-11 bg-gray-300 rounded-full"></div>
      </div>

      {/* Settings link */}
      <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
    </div>
  );
};
