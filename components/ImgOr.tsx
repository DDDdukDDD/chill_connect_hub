'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * An image that becomes `fallback` (initials, an icon) when its link is bad, never a broken-image icon
 * (DESIGN_SYSTEM.md 14.2). FallbackImg is the same for a fallback picture; this one is for a fallback element.
 * An image that failed before the page woke up is caught on mount (finished, no width), as in FallbackImg (TR-002).
 */
export default function ImgOr({ src, fallback, alt = '', ...rest }: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src?: string; fallback: React.ReactNode }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = ref.current;
    if (src && img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailedSrc(src);
  }, [src]);

  if (!src || failedSrc === src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element -- member avatars and covers come from many hosts
  return <img ref={ref} src={src} alt={alt} onError={() => setFailedSrc(src)} {...rest} />;
}
