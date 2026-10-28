'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * A photo that fills its frame, except a poster: one taller than `posterFrom` (height / width) is shown whole over a
 * blurred copy of itself, so the text on it is never cut (owner 2026-10-27). The frame must be `relative` with a size.
 * The server HTML fills the frame; the browser switches to the whole poster once it knows the image's shape.
 */
export function PosterPhoto({
  src,
  alt = '',
  posterFrom = 1.1,
  dim = false,
  zoom = false,
  className = '',
  onClick,
  fetchPriority,
}: {
  src: string;
  alt?: string;
  posterFrom?: number;
  /** Ended: grey and faded */
  dim?: boolean;
  /** Grows a little on the tile's hover (needs a `group` parent) */
  zoom?: boolean;
  className?: string;
  onClick?: () => void;
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [isPoster, setIsPoster] = useState(false);
  const measure = (img: HTMLImageElement) => img.naturalWidth > 0 && setIsPoster(img.naturalHeight / img.naturalWidth >= posterFrom);
  // A cached image may finish before the page wakes up, so its load event is missed
  useEffect(() => {
    if (ref.current?.complete) measure(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const tone = dim ? 'grayscale opacity-80' : '';
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts */}
      {isPoster && <img src={src} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover scale-110 blur-xl ${tone}`} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={fetchPriority === 'high' ? undefined : 'lazy'}
        fetchPriority={fetchPriority}
        onLoad={(e) => measure(e.currentTarget)}
        onClick={onClick}
        className={`absolute inset-0 h-full w-full ${isPoster ? 'object-contain' : 'object-cover'} ${zoom ? 'transition-transform duration-500 group-hover:scale-105' : ''} ${tone} ${className}`}
      />
    </>
  );
}
