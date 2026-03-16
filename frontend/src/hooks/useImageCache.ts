import { useState, useEffect, useRef } from 'react';

/**
 * useImageCache
 *
 * Caches images in the browser's Cache Storage API so they survive page refreshes
 * without hitting the network again.
 *
 * - First visit:  fetch → store in "gaia-images-v1" cache → return Object URL
 * - Subsequent:   match from cache → return Object URL (no network request)
 * - Fallback:     if Cache Storage is unavailable, returns the original `src`
 *
 * The Object URL created for each image is automatically revoked when the hook
 * is unmounted or `src` changes, preventing memory leaks.
 *
 * @param src  The image URL to cache (absolute or root-relative path)
 * @returns    `{ cachedSrc, loading }` — use `cachedSrc` as the img `src` attribute
 */

const CACHE_NAME = 'gaia-images-v1';

/** Paths/prefixes that should never be routed through the image cache. */
const SKIP_PREFIXES = ['data:', 'blob:'];

const shouldSkip = (src: string): boolean => SKIP_PREFIXES.some(p => src.startsWith(p));


export interface UseImageCacheResult {
  cachedSrc: string | undefined;
  loading: boolean;
}

export function useImageCache(src: string | undefined): UseImageCacheResult {
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(src);
  const [loading, setLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setCachedSrc(undefined);
      return;
    }

    // Don't process data/blob URIs — they're already in-memory
    if (shouldSkip(src)) {
      setCachedSrc(src);
      return;
    }

    // Cache Storage not available (e.g. file:// or some private browsing modes)
    if (!('caches' in window)) {
      setCachedSrc(src);
      return;
    }

    let cancelled = false;

    const revokePrevious = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    setLoading(true);

    const load = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(src);

        const blob = cached
          ? await cached.blob()
          : await (async () => {
              const res = await fetch(src);
              if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${src}`);
              // Store a clone so we can still read the body
              await cache.put(src, res.clone());
              return res.blob();
            })();

        if (cancelled) return;

        revokePrevious();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setCachedSrc(url);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useImageCache] falling back to original src:', src, err);
        }
        if (!cancelled) setCachedSrc(src);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      revokePrevious();
    };
  }, [src]);

  return { cachedSrc, loading };
}

/**
 * Preload a list of image URLs into the Cache Storage so they are ready before
 * the user navigates to the page that needs them.
 *
 * Safe to call multiple times — already-cached entries are skipped.
 */
export async function preloadImages(urls: string[]): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(
      urls.map(async url => {
        if (shouldSkip(url)) return;
        const existing = await cache.match(url);
        if (!existing) {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        }
      })
    );
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[preloadImages] failed:', err);
    }
  }
}
