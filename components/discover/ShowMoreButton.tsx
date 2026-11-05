'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  /** How many are on screen now */
  shown: number;
  /** How many match the filters */
  total: number;
  onClick: () => void;
};

// Batches that load by themselves before the button has to be pressed, so the footer stays reachable (owner 2026-11-05)
const AUTO_BATCHES = 3;
// Starts loading this far before the button comes into view, so scrolling does not stop
const AUTO_MARGIN = '400px 0px';

/**
 * "Show more" under a ค้นพบ list (Meetup-style), in place of page numbers. The list keeps growing in place, so nobody
 * loses their spot. It grows by itself while scrolling, up to AUTO_BATCHES; a press gives AUTO_BATCHES more. The button
 * is always there for keyboards, and hides once everything is shown.
 */
export function ShowMoreButton({ shown, total, onClick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const autoUsed = useRef(0);
  const before = useRef({ shown, total });
  const showMore = useRef(onClick);
  useEffect(() => {
    showMore.current = onClick;
  }, [onClick]);

  useEffect(() => {
    // Other filters: a new list, so it starts counting again
    if (shown < before.current.shown || total !== before.current.total) autoUsed.current = 0;
    before.current = { shown, total };
    if (shown >= total || autoUsed.current >= AUTO_BATCHES || !box.current) return;
    // One load per batch: a new watcher starts once the list has grown. A failed load stops here and the button stays
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        autoUsed.current += 1;
        showMore.current();
      },
      { rootMargin: AUTO_MARGIN }
    );
    watcher.observe(box.current);
    return () => watcher.disconnect();
  }, [shown, total]);

  if (shown >= total) return null;
  return (
    <div ref={box} className="flex justify-center pt-4">
      <button
        type="button"
        onClick={() => {
          autoUsed.current = 0;
          onClick();
        }}
        className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:border-slate-900 cursor-pointer active:scale-95 transition-all"
      >
        <span>แสดงเพิ่มเติม</span>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
