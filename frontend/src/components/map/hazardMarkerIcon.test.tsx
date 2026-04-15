/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getHazardMarkerIcon, clearMarkerIconCache, getMarkerIconCacheStats } from './hazardMarkerIcon';

describe('getHazardMarkerIcon', () => {
  beforeEach(() => {
    clearMarkerIconCache();
  });

  afterEach(() => {
    clearMarkerIconCache();
  });

  it('creates a marker icon with SVG for flood hazard', () => {
    const icon = getHazardMarkerIcon('flood', 'low');
    expect(icon.options.html).toContain('<svg');
    expect(icon.options.html).toContain('flood');
    expect(icon.options.className).toBe('hazard-marker-icon');
    expect(icon.options.iconSize).toEqual([24, 24]);
  });

  it('creates marker icons for all hazard types', () => {
    const hazardTypes = ['flood', 'typhoon', 'landslide', 'earthquake', 'volcanic_eruption', 
                        'storm_surge', 'tsunami', 'fire', 'drought', 'heat_wave', 'heavy_rain', 'other'];
    
    hazardTypes.forEach(type => {
      const icon = getHazardMarkerIcon(type, 'low');
      expect(icon.options.html).toContain('<svg');
      expect(icon.options.iconSize).toEqual([24, 24]);
      expect(icon.options.iconAnchor).toEqual([12, 12]);
    });
  });

  it('applies different severity rings', () => {
    const critical = getHazardMarkerIcon('flood', 'critical');
    const high = getHazardMarkerIcon('flood', 'high');
    const low = getHazardMarkerIcon('flood', 'low');

    expect(critical.options.html).toContain('rgba(220,38,38,0.35)'); // Red ring
    expect(high.options.html).toContain('rgba(245,158,11,0.35)');    // Amber ring
    expect(low.options.html).toContain('rgba(15,23,42,0.12)');       // Grey ring
  });

  it('returns cached icon for same hazard/severity combination', () => {
    const a = getHazardMarkerIcon('flood', 'high');
    const b = getHazardMarkerIcon('flood', 'high');
    expect(a).toBe(b); // Same object reference from cache
  });

  it('creates different icons for different severity levels', () => {
    const high = getHazardMarkerIcon('flood', 'high');
    const low = getHazardMarkerIcon('flood', 'low');
    expect(high).not.toBe(low);
  });

  it('normalizes hazard type case', () => {
    const upper = getHazardMarkerIcon('FLOOD', 'low');
    const lower = getHazardMarkerIcon('flood', 'low');
    expect(upper).toBe(lower);
  });

  it('falls back to "other" for unknown hazard types', () => {
    const icon = getHazardMarkerIcon('unknown_hazard', 'low');
    expect(icon.options.html).toContain('<svg');
    expect(icon.options.html).toContain('exclamation'); // Other uses exclamation icon
  });

  it('tracks cache statistics correctly', () => {
    expect(getMarkerIconCacheStats().size).toBe(0);
    
    getHazardMarkerIcon('flood', 'low');
    expect(getMarkerIconCacheStats().size).toBe(1);
    
    getHazardMarkerIcon('typhoon', 'high');
    expect(getMarkerIconCacheStats().size).toBe(2);
    
    // Same key should not increase cache size
    getHazardMarkerIcon('flood', 'low');
    expect(getMarkerIconCacheStats().size).toBe(2);
  });

  it('evicts cache entries when limit is exceeded', () => {
    const stats = getMarkerIconCacheStats();
    const maxSize = stats.maxSize; // Should be 200
    
    // Fill cache to near capacity
    for (let i = 0; i < maxSize - 10; i++) {
      const typeIndex = i % 12;
      const severityIndex = Math.floor(i / 12) % 3;
      const severity = ['low', 'high', 'critical'][severityIndex];
      const types = ['flood', 'typhoon', 'landslide', 'earthquake', 'volcanic_eruption', 
                     'storm_surge', 'tsunami', 'fire', 'drought', 'heat_wave', 'heavy_rain', 'other'];
      getHazardMarkerIcon(types[typeIndex], severity);
    }
    
    const before = getMarkerIconCacheStats().size;
    expect(before).toBeLessThan(maxSize);
    
    // Add more to trigger eviction
    for (let i = 0; i < 20; i++) {
      getHazardMarkerIcon('flood', i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'high' : 'low');
    }
    
    const after = getMarkerIconCacheStats().size;
    expect(after).toBeLessThanOrEqual(maxSize);
  });
});