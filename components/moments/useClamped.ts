'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Whether text under a line clamp is really cut off, measured on the screen it is on (owner 2026-11-10: a caption
 * that fits in its two lines gets no "ดูเพิ่มเติม"). Counting characters cannot tell: Thai, emoji and screen
 * width all change where lines break. Measured while `active` (the clamp is on); the last answer stays after, so
 * a "ย่อ" button can still show once the text is open.
 */
export function useClamped<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  const [clamped, setClamped] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    // A ResizeObserver reports once on observe (before paint), then on every width change
    const observer = new ResizeObserver(() => setClamped(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);
  return [ref, clamped] as const;
}
