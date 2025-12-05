/**
 * Map Controls Component
 * 
 * Custom control panel for toggling map features:
 * - Marker clustering (GV-03)
 * - Heatmap overlay (GV-04)
 * - Heatmap settings
 * 
 * Module: GV-03, GV-04
 * Change: add-advanced-map-features
 * 
 * Accessibility Features (WCAG 2.1):
 * - ARIA labels and roles for all interactive elements
 * - Keyboard navigation support
 * - High contrast focus indicators
 * - Screen reader announcements for state changes
 * - Reduced motion support
 */

import React, { useState } from 'react';
import { Layers, Map as MapIcon, Settings, X, Info } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface MapControlsProps {
  clusteringEnabled: boolean;
  onToggleClustering: (enabled: boolean) => void;
  heatmapEnabled: boolean;
  onToggleHeatmap: (enabled: boolean) => void;
  currentZoom: number;
  heatmapMaxZoom: number;
  heatmapRadius?: number;
  heatmapBlur?: number;
  onHeatmapSettingsChange?: (settings: { radius?: number; blur?: number; maxZoom?: number }) => void;
}

export function MapControls({
  clusteringEnabled,
  onToggleClustering,
  heatmapEnabled,
  onToggleHeatmap,
  currentZoom,
  heatmapMaxZoom,
  heatmapRadius = 25,
  heatmapBlur = 15,
  onHeatmapSettingsChange,
}: MapControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [localRadius, setLocalRadius] = useState(heatmapRadius);
  const [localBlur, setLocalBlur] = useState(heatmapBlur);
  const [localMaxZoom, setLocalMaxZoom] = useState(heatmapMaxZoom);
  
  const isHeatmapAutoDisabled = currentZoom > heatmapMaxZoom;

  // Handle slider changes with immediate update
  const handleRadiusChange = (value: number) => {
    setLocalRadius(value);
    onHeatmapSettingsChange?.({ radius: value });
  };

  const handleBlurChange = (value: number) => {
    setLocalBlur(value);
    onHeatmapSettingsChange?.({ blur: value });
  };

  const handleMaxZoomChange = (value: number) => {
    setLocalMaxZoom(value);
    onHeatmapSettingsChange?.({ maxZoom: value });
  };

  return (
    <div 
      className="absolute top-44 sm:top-48 right-3 sm:right-4 z-[1000] flex flex-col gap-2 sm:gap-3"
      role="region"
      aria-label="Map visualization controls"
    >
      {/* Main Controls Card */}
      <Card className="p-3 sm:p-4 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 w-[180px] sm:w-[200px]">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Clustering Toggle */}
          <div className="flex items-center justify-between gap-2 sm:gap-3" data-tour="cluster-section">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Layers className="w-4 h-4 text-blue-600" aria-hidden="true" />
              </div>
              <span id="clustering-label" className="text-xs sm:text-sm font-medium text-gray-700">
                Clustering
              </span>
            </div>
            <button
              type="button"
              data-tour="cluster-toggle"
              onClick={() => onToggleClustering(!clusteringEnabled)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 motion-reduce:transition-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${clusteringEnabled ? 'bg-blue-600' : 'bg-gray-300'}
              `}
              role="switch"
              aria-checked={clusteringEnabled}
              aria-labelledby="clustering-label"
              aria-describedby="clustering-desc"
            >
              <span className="sr-only">
                {clusteringEnabled ? 'Disable clustering' : 'Enable clustering'}
              </span>
              <span
                aria-hidden="true"
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none
                  ${clusteringEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          <span id="clustering-desc" className="sr-only">
            Groups nearby hazard markers together for better visibility
          </span>

          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between gap-2 sm:gap-3" data-tour="heatmap-section">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${isHeatmapAutoDisabled ? 'bg-gray-100' : 'bg-orange-50'}`}>
                <MapIcon 
                  className={`w-4 h-4 ${isHeatmapAutoDisabled ? 'text-gray-400' : 'text-orange-600'}`} 
                  aria-hidden="true" 
                />
              </div>
              <div className="flex flex-col">
                <span id="heatmap-label" className="text-xs sm:text-sm font-medium text-gray-700">
                  Heatmap
                </span>
                {isHeatmapAutoDisabled && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    Zoom out to enable
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              data-tour="heatmap-toggle"
              onClick={() => onToggleHeatmap(!heatmapEnabled)}
              disabled={isHeatmapAutoDisabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 motion-reduce:transition-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${heatmapEnabled && !isHeatmapAutoDisabled ? 'bg-blue-600' : 'bg-gray-300'}
                ${isHeatmapAutoDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              role="switch"
              aria-checked={heatmapEnabled && !isHeatmapAutoDisabled}
              aria-labelledby="heatmap-label"
              aria-describedby="heatmap-desc"
              aria-disabled={isHeatmapAutoDisabled}
            >
              <span className="sr-only">
                {heatmapEnabled ? 'Disable heatmap' : 'Enable heatmap'}
              </span>
              <span
                aria-hidden="true"
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none
                  ${heatmapEnabled && !isHeatmapAutoDisabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          <span id="heatmap-desc" className="sr-only">
            Shows hazard density visualization. Auto-disables when zoomed in for clarity.
          </span>

          {/* Divider */}
          <div className="h-px bg-gray-200" role="separator" aria-hidden="true" />

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors py-1 px-2 -mx-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-tour="heatmap-settings"
            aria-expanded={showSettings}
            aria-controls="heatmap-settings-panel"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span>Settings</span>
            </div>
            {showSettings ? (
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <span className="text-[10px] text-gray-400">▸</span>
            )}
          </button>
        </div>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card 
          id="heatmap-settings-panel" 
          className="p-4 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 w-[220px] sm:w-[260px]"
          role="dialog"
          aria-label="Heatmap settings"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Heatmap Settings</h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close settings"
            >
              <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 text-sm">
            {/* Radius Slider */}
            <div>
              <label htmlFor="heatmap-radius" className="flex items-center justify-between text-gray-600 mb-2">
                <span>Radius</span>
                <Badge variant="secondary" className="text-xs font-mono">{localRadius}px</Badge>
              </label>
              <input
                id="heatmap-radius"
                type="range"
                min="10"
                max="50"
                value={localRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-valuenow={localRadius}
                aria-valuemin={10}
                aria-valuemax={50}
                aria-valuetext={`${localRadius} pixels`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1" aria-hidden="true">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>

            {/* Blur Slider */}
            <div>
              <label htmlFor="heatmap-blur" className="flex items-center justify-between text-gray-600 mb-2">
                <span>Blur</span>
                <Badge variant="secondary" className="text-xs font-mono">{localBlur}px</Badge>
              </label>
              <input
                id="heatmap-blur"
                type="range"
                min="5"
                max="30"
                value={localBlur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-valuenow={localBlur}
                aria-valuemin={5}
                aria-valuemax={30}
                aria-valuetext={`${localBlur} pixels blur`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1" aria-hidden="true">
                <span>Sharp</span>
                <span>Soft</span>
              </div>
            </div>

            {/* Max Zoom Slider */}
            <div>
              <label htmlFor="heatmap-maxzoom" className="flex items-center justify-between text-gray-600 mb-2">
                <span>Max Zoom</span>
                <Badge variant="secondary" className="text-xs font-mono">Level {localMaxZoom}</Badge>
              </label>
              <input
                id="heatmap-maxzoom"
                type="range"
                min="8"
                max="15"
                value={localMaxZoom}
                onChange={(e) => handleMaxZoomChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-valuenow={localMaxZoom}
                aria-valuemin={8}
                aria-valuemax={15}
                aria-valuetext={`Zoom level ${localMaxZoom}`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1" aria-hidden="true">
                <span>8</span>
                <span>15</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-md">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p>Changes apply immediately. Settings are saved in your browser.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
