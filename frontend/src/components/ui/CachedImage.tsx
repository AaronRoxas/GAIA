import React from 'react';
import { useImageCache } from '../../hooks/useImageCache';

/**
 * CachedImage
 *
 * A drop-in replacement for `<img>` that transparently caches the image in the
 * browser's Cache Storage API on first load.  Subsequent page visits serve the
 * image from the local cache without a network request.
 *
 * Props are identical to a standard `<img>` element with two additions:
 *  - `cache`       — set to `false` to opt out of caching (default: `true`)
 *  - `fallbackSrc` — shown while the image is loading or on error
 *
 * Usage:
 *  ```tsx
 *  <CachedImage src="/assets/img/background.webp" alt="" className="w-full" />
 *  ```
 */

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Set to false to bypass the cache and use a plain <img> instead. Default: true */
  cache?: boolean;
  /** Shown while loading or if the primary src fails to load. */
  fallbackSrc?: string;
}

export const CachedImage = React.forwardRef<HTMLImageElement, CachedImageProps>(
  ({ src, cache = true, fallbackSrc, onError, ...rest }, ref) => {
    const { cachedSrc } = useImageCache(cache ? src : undefined);

    // Determine the effective src: cached blob URL, original, or fallback
    const effectiveSrc = cache ? (cachedSrc ?? fallbackSrc ?? src) : src;

    const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
      if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
        e.currentTarget.src = fallbackSrc;
      }
      onError?.(e);
    };

    return (
      <img
        ref={ref}
        src={effectiveSrc}
        loading="lazy"
        onError={handleError}
        {...rest}
      />
    );
  }
);

CachedImage.displayName = 'CachedImage';
