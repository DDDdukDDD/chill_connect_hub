'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * A content image that shows `fallback` when its link is bad, never a broken-image icon (DESIGN_SYSTEM.md 14.2).
 * A server-rendered image can fail before the page wakes up, so React misses its error event:
 * on mount, a finished image with no width counts as failed too (TR-002, same check as PosterPhoto).
 */
export default function FallbackImg({ src, fallback, alt = '', ...rest }: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src?: string; fallback: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const wanted = src || fallback;
  const shown = failedSrc === wanted ? fallback : wanted;

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailedSrc(wanted);
  }, [wanted]);

  // eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts
  return <img ref={ref} src={shown} alt={alt} onError={() => shown !== fallback && setFailedSrc(wanted)} {...rest} />;
}
