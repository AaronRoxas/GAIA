/**
 * Centralized Hazard Icon Registry
 *
 * This module provides a single source of truth for all hazard-related icons
 * used throughout the GAIA application. Centralizing icons:
 * - Improves performance by ensuring consistent imports
 * - Ensures semantic consistency (each hazard has contextually appropriate icon)
 * - Makes updates easier (change in one place, reflects everywhere)
 * - Supports accessibility with proper labels
 *
 * Module: GV-01, FP-01
 * Change: improve-hazard-icons
 *
 * Icon Selection Rationale:
 * - Flood: Droplets (water drops representing flooding)
 * - Typhoon: CloudLightning (storm with lightning, representing typhoon power)
 * - Landslide: MountainSnow (mountain with debris/material sliding)
 * - Earthquake: Vibrate (seismic waves/shaking motion)
 * - Volcanic Eruption: Volcano custom icon (volcano with eruption)
 * - Storm Surge: Waves (rising water waves)
 * - Tsunami: TriangleAlert with wave (large destructive wave alert)
 * - Fire: Flame (fire/flames)
 * - Drought: SunDim (intense sun causing dry conditions)
 * - Heat Wave: ThermometerSun (high temperature)
 * - Heavy Rain: CloudRain (rain clouds)
 * - Other: ShieldAlert (general hazard/warning)
 */

import React from 'react';
import {
  Droplets,
  CloudLightning,
  MountainSnow,
  Flame,
  Waves,
  CloudRain,
  SunDim,
  ThermometerSun,
  ShieldAlert,
  type LucideIcon,
  type LucideProps,
  Activity,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HazardIconConfig {
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Primary color for the hazard type (hex) */
  color: string;
  /** Background color for badges/chips (with opacity) */
  bgColor: string;
  /** Human-readable label */
  label: string;
  /** Accessible description for screen readers */
  ariaLabel: string;
  /** Icon keywords for search/filtering */
  keywords: string[];
}

export type HazardType =
  | 'flood'
  | 'typhoon'
  | 'landslide'
  | 'earthquake'
  | 'volcanic_eruption'
  | 'storm_surge'
  | 'tsunami'
  | 'fire'
  | 'drought'
  | 'heat_wave'
  | 'heavy_rain'
  | 'other';

// ============================================================================
// CUSTOM ICONS (for hazards without perfect Lucide matches)
// ============================================================================

/**
 * Custom Volcano Icon
 * Represents volcanic eruption with mountain and eruption plume
 */
export const VolcanoIcon: React.FC<LucideProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Mountain base */}
    <path d="M3 21h18l-6-9-3 4.5L9 12l-6 9z" />
    {/* Eruption crater */}
    <path d="M9 6c0-1.5 1.5-3 3-3s3 1.5 3 3" />
    {/* Lava/smoke plumes */}
    <path d="M10 6v-1" />
    <path d="M12 4v-2" />
    <path d="M14 6v-1" />
    {/* Eruption particles */}
    <circle cx="8" cy="4" r="0.5" fill={color} />
    <circle cx="16" cy="3" r="0.5" fill={color} />
  </svg>
);

/**
 * Custom Tsunami Icon
 * Represents large destructive ocean wave
 */
export const TsunamiIcon: React.FC<LucideProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Large wave */}
    <path d="M2 16c2-2 4-4 6-4s4 2 6 2 4-2 6-2 2 2 2 2" />
    {/* Medium wave */}
    <path d="M2 12c1.5-1.5 3-3 4.5-3s3 1.5 4.5 1.5 3-1.5 4.5-1.5 3 1.5 4.5 1.5c.5 0 1-.25 1.5-.5" />
    {/* Towering wave crest */}
    <path d="M4 8c2-3 4-6 8-6 3 0 5 2 7 4" />
    {/* Wave spray */}
    <path d="M18 5c.5-1 1-2 2-2" />
    <path d="M20 8c.5-.5 1-1 2-1" />
    {/* Ground line */}
    <path d="M2 20h20" />
  </svg>
);

/**
 * Custom Earthquake Icon
 * Represents seismic activity with vibration waves
 */
export const EarthquakeIcon: React.FC<LucideProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Seismograph line */}
    <path d="M2 12h3l2-4 2 8 2-6 2 4 2-2 2 3 2-1h3" />
    {/* Ground crack
    <path d="M8 18l2-2 1 3 2-4 1 3 2-2" />
    Vibration waves left
    <path d="M4 8c-1-1-1-2 0-3" />
    <path d="M6 6c-1-1-1-2 0-3" />
    Vibration waves right
    <path d="M20 8c1-1 1-2 0-3" />
    <path d="M18 6c1-1 1-2 0-3" /> */}
  </svg>
);

// ============================================================================
// HAZARD ICON REGISTRY
// ============================================================================

/**
 * Master registry of all hazard types with their icons and metadata.
 * This is the single source of truth for hazard visualization.
 */
export const HAZARD_ICON_REGISTRY: Record<HazardType, HazardIconConfig> = {
  flood: {
    icon: Droplets,
    color: '#3b82f6', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.15)',
    label: 'Flood',
    ariaLabel: 'Flood hazard indicator',
    keywords: ['water', 'flooding', 'overflow', 'inundation', 'deluge'],
  },
  typhoon: {
    icon: CloudLightning,
    color: '#6366f1', // indigo-500
    bgColor: 'rgba(99, 102, 241, 0.15)',
    label: 'Typhoon',
    ariaLabel: 'Typhoon hazard indicator',
    keywords: ['storm', 'hurricane', 'cyclone', 'tropical storm', 'bagyo', 'wind'],
  },
  landslide: {
    icon: MountainSnow,
    color: '#a855f7', // purple-500
    bgColor: 'rgba(168, 85, 247, 0.15)',
    label: 'Landslide',
    ariaLabel: 'Landslide hazard indicator',
    keywords: ['mudslide', 'debris flow', 'rockfall', 'slope failure', 'erosion'],
  },
  earthquake: {
    icon: Activity, 
    color: '#ef4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.15)',
    label: 'Earthquake',
    ariaLabel: 'Earthquake hazard indicator',
    keywords: ['seismic', 'tremor', 'quake', 'lindol', 'temblor', 'shaking'],
  },
  volcanic_eruption: {
    icon: Flame, // Will use VolcanoIcon in render functions
    color: '#dc2626', // red-600
    bgColor: 'rgba(220, 38, 38, 0.15)',
    label: 'Volcanic Eruption',
    ariaLabel: 'Volcanic eruption hazard indicator',
    keywords: ['volcano', 'lava', 'ash', 'magma', 'pyroclastic', 'bulkan'],
  },
  storm_surge: {
    icon: Waves,
    color: '#0891b2', // cyan-600
    bgColor: 'rgba(8, 145, 178, 0.15)',
    label: 'Storm Surge',
    ariaLabel: 'Storm surge hazard indicator',
    keywords: ['coastal flooding', 'tidal surge', 'wave surge', 'daluyong'],
  },
  tsunami: {
    icon: Waves, // Will use TsunamiIcon in render functions
    color: '#06b6d4', // cyan-500
    bgColor: 'rgba(6, 182, 212, 0.15)',
    label: 'Tsunami',
    ariaLabel: 'Tsunami hazard indicator',
    keywords: ['tidal wave', 'seismic wave', 'ocean wave', 'coastal disaster'],
  },
  fire: {
    icon: Flame,
    color: '#f97316', // orange-500
    bgColor: 'rgba(249, 115, 22, 0.15)',
    label: 'Fire',
    ariaLabel: 'Fire hazard indicator',
    keywords: ['wildfire', 'blaze', 'forest fire', 'sunog', 'conflagration'],
  },
  drought: {
    icon: SunDim, // Changed from Sun to SunDim for drought context
    color: '#eab308', // yellow-500
    bgColor: 'rgba(234, 179, 8, 0.15)',
    label: 'Drought',
    ariaLabel: 'Drought hazard indicator',
    keywords: ['dry spell', 'water shortage', 'arid', 'tagtuyot', 'el niño'],
  },
  heat_wave: {
    icon: ThermometerSun, // Changed from Thermometer for clearer context
    color: '#f59e0b', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Heat Wave',
    ariaLabel: 'Heat wave hazard indicator',
    keywords: ['extreme heat', 'high temperature', 'heat index', 'init'],
  },
  heavy_rain: {
    icon: CloudRain,
    color: '#0ea5e9', // sky-500
    bgColor: 'rgba(14, 165, 233, 0.15)',
    label: 'Heavy Rain',
    ariaLabel: 'Heavy rain hazard indicator',
    keywords: ['rainfall', 'downpour', 'precipitation', 'ulan', 'monsoon'],
  },
  other: {
    icon: ShieldAlert, // Changed from AlertTriangle for better hazard context
    color: '#64748b', // slate-500
    bgColor: 'rgba(100, 116, 139, 0.15)',
    label: 'Other Hazards',
    ariaLabel: 'Other hazard indicator',
    keywords: ['miscellaneous', 'unclassified', 'iba pa', 'general'],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get icon configuration for a hazard type.
 * Falls back to 'other' if the type is unknown.
 */
export function getHazardIcon(type: string): HazardIconConfig {
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_') as HazardType;
  return HAZARD_ICON_REGISTRY[normalizedType] || HAZARD_ICON_REGISTRY.other;
}

/**
 * Get all hazard types as an array.
 */
export function getAllHazardTypes(): HazardType[] {
  return Object.keys(HAZARD_ICON_REGISTRY) as HazardType[];
}

/**
 * Get hazard labels as a Record for dropdowns/selects.
 */
export function getHazardLabels(): Record<string, string> {
  return Object.entries(HAZARD_ICON_REGISTRY).reduce(
    (acc, [key, config]) => {
      acc[key] = config.label;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Search hazards by keyword.
 */
export function searchHazardsByKeyword(keyword: string): HazardType[] {
  const lowerKeyword = keyword.toLowerCase();
  return getAllHazardTypes().filter((type) => {
    const config = HAZARD_ICON_REGISTRY[type];
    return (
      config.label.toLowerCase().includes(lowerKeyword) ||
      config.keywords.some((kw) => kw.toLowerCase().includes(lowerKeyword))
    );
  });
}

// ============================================================================
// ICON COMPONENTS (with custom icons for specific hazards)
// ============================================================================

interface HazardIconProps extends Omit<LucideProps, 'ref'> {
  /** The hazard type to render */
  hazardType: string;
  /** Whether to use the hazard's defined color */
  useHazardColor?: boolean;
}

/**
 * Renders the appropriate icon for a hazard type.
 * Uses custom icons for volcano, tsunami, and earthquake when available.
 */
export const HazardIcon: React.FC<HazardIconProps> = ({
  hazardType,
  useHazardColor = false,
  size = 16,
  className,
  ...props
}) => {
  const config = getHazardIcon(hazardType);
  const iconColor = useHazardColor ? config.color : props.color || 'currentColor';

  // Use custom icons for specific hazard types
  const normalizedType = hazardType.toLowerCase().replace(/\s+/g, '_');

  switch (normalizedType) {
    case 'volcanic_eruption':
      return (
        <VolcanoIcon
          size={size}
          color={iconColor}
          className={className}
          aria-label={config.ariaLabel}
          {...props}
        />
      );
    case 'tsunami':
      return (
        <TsunamiIcon
          size={size}
          color={iconColor}
          className={className}
          aria-label={config.ariaLabel}
          {...props}
        />
      );
    case 'earthquake':
      return (
        <EarthquakeIcon
          size={size}
          color={iconColor}
          className={className}
          aria-label={config.ariaLabel}
          {...props}
        />
      );
    default: {
      const IconComponent = config.icon;
      return (
        <IconComponent
          size={size}
          color={iconColor}
          className={className}
          aria-label={config.ariaLabel}
          {...props}
        />
      );
    }
  }
};

/**
 * Renders a hazard badge with icon and label.
 */
interface HazardBadgeProps {
  hazardType: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HazardBadge: React.FC<HazardBadgeProps> = ({
  hazardType,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const config = getHazardIcon(hazardType);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
      role="status"
      aria-label={config.ariaLabel}
    >
      <HazardIcon hazardType={hazardType} size={iconSizes[size]} useHazardColor />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

// ============================================================================
// EXPORTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

/**
 * Legacy hazard icons mapping (for existing components).
 * @deprecated Use HAZARD_ICON_REGISTRY or getHazardIcon() instead.
 */
export const HAZARD_ICONS = Object.entries(HAZARD_ICON_REGISTRY).reduce(
  (acc, [key, config]) => {
    acc[key] = { icon: config.icon, color: config.color };
    return acc;
  },
  {} as Record<string, { icon: LucideIcon; color: string }>
);

/**
 * Legacy hazard labels mapping.
 * @deprecated Use HAZARD_ICON_REGISTRY or getHazardLabels() instead.
 */
export const HAZARD_LABELS = getHazardLabels();

export default HAZARD_ICON_REGISTRY;
