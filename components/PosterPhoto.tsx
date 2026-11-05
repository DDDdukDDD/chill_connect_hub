'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * A photo that fills its frame, except a poster: one taller than `posterFrom` (height / width) is shown whole over a
 * blurred copy of itself, so the text on it is never cut (owner 2026-10-27). The frame must be `relative` with a size.
 * The server HTML fills the frame; the browser switches to the whole poster once it knows the image's shape.
 */
const PHOTO_STAND_IN = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';

export function PosterPhoto({
  src,
  alt = '',
  posterFrom = 1.1,
  zoom = false,
  className = '',
  onClick,
  fetchPriority,
}: {
  src: string;
  alt?: string;
  posterFrom?: number;
  /** Grows a little on the tile's hover (needs a `group` parent) */
  zoom?: boolean;
  className?: string;
  onClick?: () => void;
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [isPoster, setIsPoster] = useState(false);
  // A link that has gone bad shows the stand-in photo, never a broken image (DESIGN_SYSTEM.md 14.2)
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shown = failedSrc === src ? PHOTO_STAND_IN : src;
  const measure = (img: HTMLImageElement) => img.naturalWidth > 0 && setIsPoster(img.naturalHeight / img.naturalWidth >= posterFrom);
  // A cached image may finish before the page wakes up, so its load event is missed
  useEffect(() => {
    if (ref.current?.complete) measure(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts */}
      {isPoster && <img src={shown} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl" />}
      {/* eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts */}
      <img
        ref={ref}
        src={shown}
        alt={alt}
        onError={() => setFailedSrc(src)}
        loading={fetchPriority === 'high' ? undefined : 'lazy'}
        fetchPriority={fetchPriority}
        onLoad={(e) => measure(e.currentTarget)}
        onClick={onClick}
        className={`absolute inset-0 h-full w-full ${isPoster ? 'object-contain' : 'object-cover'} ${zoom ? 'transition-transform duration-500 group-hover:scale-105' : ''} ${className}`}
      />
    </>
  );
}
