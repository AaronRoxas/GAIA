/**
 * Hazard Info Panel Component
 * 
 * Slide-in right panel for displaying detailed hazard information.
 * Replaces modal popups for cleaner, less intrusive UX.
 * 
 * Features:
 * - Smooth fade animation (always in DOM, opacity hidden)
 * - Quick stats display (severity, confidence, location)
 * - Action buttons (zoom to, view source)
 * - Close button with keyboard support (Esc)
 * - Responsive design (responsive width on mobile)
 * - Accessibility: Focus trap, ARIA labels, keyboard navigation
 * 
 * Module: GV-02 (Dynamic Markers)
 * Design: Minimalist + Flat design (Eleken guidelines)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, faTimes, faMapPin, faExclamationTriangle, faChartLine, faEye, faExternalLinkAlt, faClock, faFire, faHouseChimneyCrack, faHouseFloodWater, faHurricane, faHillRockslide, faVolcano, faSunPlantWilt, faHouseFloodWaterCircleArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface HazardInfoPanelProps {
  hazard: {
    id: string;
    hazard_type: string;
    severity: string;
    location_name: string;
    latitude: number;
    longitude: number;
    confidence_score: number;
    source_type: string;
    validated: boolean;
    created_at: string;
    source_content?: string;
    source_url?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onZoomTo?: (lat: number, lon: number) => void;
}

// const severityConfig = {
//   critical: { color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', label: 'Critical' },
//   severe: { color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', label: 'Severe' },
//   moderate: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', label: 'Moderate' },
//   minor: { color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', label: 'Minor' },
//   unknown: { color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-50', label: 'Unknown' },
// };

const hazardTypeIcons: Record<string, IconDefinition> = {
  flood: faHouseFloodWater,
  earthquake: faHouseChimneyCrack,
  typhoon: faHurricane,
  landslide: faHillRockslide,
  volcanic_eruption: faVolcano,
  storm_surge: faHouseFloodWaterCircleArrowRight,
  drought: faSunPlantWilt,
  wildfire: faFire,
};

export function HazardInfoPanel({
  hazard,
  isOpen,
  onClose,
  onZoomTo,
}: HazardInfoPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Handle close with animation delay
  const handleClose = useCallback(() => {
    // Clear any existing timeout to prevent duplicate timers
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  }, [onClose]);

  // Cleanup timeout on unmount or when closing
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isClosing, handleClose]);

  // Save previous focus when panel opens/closes
  useEffect(() => {
    if (isOpen && document.activeElement && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Implement focus trap - only depends on isOpen to avoid resetting focus when hazard changes
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    // Get all focusable elements in the panel
    const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first focusable element when the panel opens
    if (firstElement) {
      firstElement.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (focusableElements.length > 0) {
      const element = panelRef.current;
      if (element) {
        element.addEventListener('keydown', handleKeyDown);
      }
      
      // Restore focus when panel closes
      return () => {
        if (element) {
          element.removeEventListener('keydown', handleKeyDown);
        }
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }

    // If no focusable elements, just restore focus on close
    if (previousFocusRef.current) {
      return () => {
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  // No overflow handling needed - panel is absolutely positioned and doesn't affect body layout
  // The backdrop overlay prevents interaction with content behind the panel

  // const severity = hazard ? (severityConfig[hazard.severity as keyof typeof severityConfig] || severityConfig.unknown) : severityConfig.unknown;
  const confidencePercentage = hazard ? Math.round(hazard.confidence_score * 100) : 0;
  const createdDate = hazard ? new Date(hazard.created_at) : new Date();
  const formattedTime = createdDate.toLocaleTimeString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style>{`
        .hazard-panel {
          transition: opacity 0.3s ease;
          will-change: opacity;
        }

        .hazard-panel-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .hazard-panel-hidden {
          opacity: 0;
          pointer-events: none;
        }

        .hazard-backdrop {
          transition: opacity 0.3s ease;
          will-change: opacity;
        }

        .hazard-backdrop-visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .hazard-backdrop-hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .hazard-panel,
          .hazard-backdrop {
            transition: none;
          }
        }
      `}</style>

      {/* Backdrop overlay - always in DOM (purely decorative, close handled by panel button) */}
      <div
        onClick={isOpen && !isClosing ? handleClose : undefined}
        className={`
          absolute inset-0 z-[1999] cursor-pointer hazard-backdrop
          ${isOpen && !isClosing ? 'hazard-backdrop-visible bg-black/30' : 'hazard-backdrop-hidden bg-transparent'}
        `}
        aria-hidden="true"
      />
    

      {/* Info Panel - opacity fade (hidden with opacity, visible with opacity-100) */}
      <aside
        ref={panelRef}
        className={cn(
          'absolute inset-y-0 right-0 z-[2000] flex w-full flex-col shadow-2xl hazard-panel sm:w-96',
          'border-l border-border bg-card text-card-foreground',
          isOpen && !isClosing ? 'hazard-panel-visible' : 'hazard-panel-hidden'
        )}
        role="complementary"
        aria-label="Hazard details"
        aria-hidden={!isOpen || isClosing}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-muted/70 to-muted/40 p-6 dark:from-muted/50 dark:to-muted/25">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <FontAwesomeIcon 
                  icon={hazard ? (hazardTypeIcons[hazard.hazard_type] || faExclamationTriangle) : faExclamationTriangle} 
                  className="text-lg text-foreground/80"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold capitalize text-foreground">
                  {hazard ? hazard.hazard_type.replace(/_/g, ' ') : 'No hazard selected'}
                </h2>
                {/* <p className="text-sm text-gray-600 mt-1">{hazard ? hazard.location_name : 'No hazard selected'}</p> */}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Close panel"
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hazard ? (
            <>
              {/* Severity Badge */}
              {/* <div className={`${severity.bgLight} rounded-lg p-4`}>
                <div className="flex items-center gap-3">
                  <div className={`${severity.color} p-2 rounded-lg flex items-center justify-center w-8 h-8`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-sm" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Severity Level</p>
                    <p className={`${severity.textColor} font-bold text-lg`}>{severity.label}</p>
                  </div>
                </div>
              </div> */}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {/* Confidence Score */}
                <Card className="border-border bg-muted/40 p-3 text-center dark:bg-muted/25">
                  <div className="mb-2 flex items-center justify-center">
                    <FontAwesomeIcon icon={faChartLine} className="text-sm text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{confidencePercentage}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Confidence</p>
                </Card>

                {/* Coordinates */}
                <Card className="border-border bg-muted/40 p-3 text-center dark:bg-muted/25">
                  <div className="mb-2 flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapPin} className="text-sm text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-xs text-foreground">
                    {hazard.latitude.toFixed(3)}, <br /> {hazard.longitude.toFixed(3)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Location</p>
                </Card>

                {/* Validation Status */}
                <Card className="border-border bg-muted/40 p-3 text-center dark:bg-muted/25">
                  <div className="mb-2 flex items-center justify-center">
                    <FontAwesomeIcon 
                      icon={faEye} 
                      className={cn('text-sm', hazard.validated ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground')} 
                      aria-hidden="true" 
                    />
                  </div>
                  <p className="text-xs font-bold uppercase text-foreground">{hazard.validated ? 'Valid' : 'Pending'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status</p>
                </Card>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source Type</p>
                  <p className="mt-1 text-sm capitalize text-foreground">{hazard.source_type}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-sm text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reported</p>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{formattedTime}</p>
                </div>

                {hazard.source_content && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source Content</p>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{hazard.source_content}</p>
                  </div>
                )}
              </div>

              {/* Information Note */}
              <div
                className={cn(
                  'rounded-lg border p-3',
                  'border-primary/20 bg-gradient-to-br from-secondary/[0.12] via-primary/[0.05] to-card',
                  'dark:border-primary/40 dark:from-primary/20 dark:via-primary/10 dark:to-secondary/10'
                )}
              >
                <p className="text-xs leading-relaxed text-foreground/90 dark:text-blue-100/90">
                  <strong className="text-foreground">Confidence Score:</strong> This indicates how confident the AI model is about this classification. Higher scores mean more reliable predictions.
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>No hazard selected</p>
            </div>
          )}
        </div>

        {/* Actions Footer - Always Visible */}
        <div className="flex-shrink-0 space-y-2 border-t border-border bg-muted/50 p-6 dark:bg-muted/30">
          <Button
            onClick={() => hazard && onZoomTo?.(hazard.latitude, hazard.longitude)}
            disabled={!hazard}
            className="w-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            size="sm"
            title='Zoom to the selected pin location'
          >
            <FontAwesomeIcon icon={faMapPin} className="mr-2 text-sm" aria-hidden="true" />
            Zoom to Location
          </Button>

          {hazard?.source_url?.trim() && (
            <Button
              onClick={() => {
                if (hazard.source_url?.trim()) {
                  window.open(hazard.source_url, '_blank', 'noopener,noreferrer');
                }
              }}
              variant="outline"
              className="w-full border-primary/35 text-foreground hover:bg-primary/10 dark:border-primary/50 dark:hover:bg-primary/15"
              size="sm"
              title="Open original source in new tab"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2 text-sm" aria-hidden="true" />
              View Full Source
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}