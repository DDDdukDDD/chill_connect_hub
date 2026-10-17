'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A sideways row of cards with round arrows floating over its edges (iPad and up; phones swipe).
 * An arrow shows only when there is more to scroll that way, so a row that fits shows none.
 * The arrows sit on the middle of the first `[data-row-photo]` element, so they never cover titles.
 * `className` styles the scrolling element itself (flex, gap, snap, padding).
 */
export function ScrollRow({
  as = 'div',
  className,
  label,
  children,
}: {
  as?: 'div' | 'ul';
  className: string;
  label?: string;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    const wrap = wrapRef.current;
    if (!row || !wrap) return;
    setCanBack(row.scrollLeft > 4);
    setCanNext(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
    const photo = row.querySelector<HTMLElement>('[data-row-photo]');
    if (photo) {
      const box = photo.getBoundingClientRect();
      setArrowTop(box.top - wrap.getBoundingClientRect().top + box.height / 2);
    }
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    row.addEventListener('scroll', measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(row);
    // Cards change when a filter changes; the row keeps its size but not its scroll width
    const mutation = new MutationObserver(measure);
    mutation.observe(row, { childList: true });
    return () => {
      row.removeEventListener('scroll', measure);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [measure]);

  const scroll = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrow = (dir: 1 | -1, show: boolean) => (
    <button
      type="button"
      onClick={() => scroll(dir)}
      aria-label={dir === 1 ? 'เลื่อนดูถัดไป' : 'เลื่อนดูก่อนหน้า'}
      tabIndex={show ? 0 : -1}
      style={arrowTop !== null ? { top: arrowTop } : undefined}
      className={`hidden md:flex absolute z-10 ${arrowTop === null ? 'top-1/3' : ''} ${dir === 1 ? 'right-2' : 'left-2'} -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-slate-200 shadow-lg items-center justify-center text-slate-900 cursor-pointer hover:scale-105 transition-all ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {dir === 1 ? <ChevronRight className="w-5 h-5" aria-hidden="true" /> : <ChevronLeft className="w-5 h-5" aria-hidden="true" />}
    </button>
  );

  const Row = as;
  return (
    <div ref={wrapRef} className="relative">
      <Row ref={rowRef as React.Ref<never>} className={className} aria-label={label}>
        {children}
      </Row>
      {arrow(-1, canBack)}
      {arrow(1, canNext)}
    </div>
  );
}
