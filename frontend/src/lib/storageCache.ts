/**
 * storageCache
 *
 * A thin localStorage wrapper with TTL support for caching JSON-serialisable data
 * (API responses, GeoJSON boundaries, etc.) across page refreshes.
 *
 * Keys are namespaced under the "gaia:cache:" prefix so they are easy to identify
 * and clear selectively without touching Supabase auth keys.
 */

const PREFIX = 'gaia:cache:';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const TTL = {
  /** 10 minutes — suitable for semi-static API payloads */
  SHORT: 10 * 60 * 1000,
  /** 1 hour — suitable for GeoJSON boundaries, config data */
  MEDIUM: 60 * 60 * 1000,
  /** 24 hours — suitable for rarely-changing reference data */
  LONG: 24 * 60 * 60 * 1000,
} as const;

const key = (raw: string): string => PREFIX + raw;

export const storageCache = {
  /**
   * Return the cached value for `cacheKey` if it exists and has not expired.
   * Returns `null` on miss, expiry, or any parse error.
   */
  get<T>(cacheKey: string): T | null {
    try {
      const raw = localStorage.getItem(key(cacheKey));
      if (!raw) return null;

      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (typeof entry.expiresAt !== 'number') {
        localStorage.removeItem(key(cacheKey));
        return null;
      }
      
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key(cacheKey));
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Persist `data` under `cacheKey` with an expiry of `ttlMs` milliseconds.
   * Silently ignores QuotaExceededError so the app never crashes on full storage.
   */
  set<T>(cacheKey: string, data: T, ttlMs: number = TTL.MEDIUM): void {
    try {
      const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
      localStorage.setItem(key(cacheKey), JSON.stringify(entry));
    } catch (e) {
      // QuotaExceededError or SecurityError in private browsing — fail silently
      if (process.env.NODE_ENV === 'development') {
        console.warn('[storageCache] write failed:', e);
      }
    }
  },

  /** Remove a single cached entry. */
  del(cacheKey: string): void {
    try {
      localStorage.removeItem(key(cacheKey));
    } catch {
      // ignore
    }
  },

  /**
   * Remove all entries whose TTL has passed.
   * Call this once on app startup to prevent stale data accumulation.
   */
  clearExpired(): void {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith(PREFIX)) continue;
        try {
          const raw = localStorage.getItem(k);
          if (!raw) { toRemove.push(k); continue; }
          const entry = JSON.parse(raw) as CacheEntry<unknown>;
          if (Date.now() > entry.expiresAt) toRemove.push(k);
        } catch {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },

  /**
   * Remove every `gaia:cache:` entry regardless of expiry.
   * Useful for "clear cache" admin actions.
   */
  clearAll(): void {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
