'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, type LucideIcon } from 'lucide-react';
import type { DiscoverKind } from '@/lib/discoverMatch';

type Category = { id: string; name: string; icon: LucideIcon; colorScheme: { iconColor: string } };

type Props = {
  /** The ค้นพบ pages, and /challenges (same tabs, violet) */
  kind: DiscoverKind | 'challenges';
  categories: Category[];
  /** How many each category holds under the other filters; an empty one is left out unless it is picked */
  counts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The member's own สาย (from onboarding): shown first, with a small dot */
  mineIds?: string[];
};

/** The picked tab: the pillar's dark text over a line in the pillar color (DESIGN_SYSTEM.md, selected state) */
const PICKED: Record<Props['kind'], string> = {
  meetups: 'border-[#F26430] text-[#D04A1B]',
  fairs: 'border-[#2B527A] text-[#1F3D5C]',
  spots: 'border-[#4A7C59] text-[#2D5A3C]',
  challenges: 'border-[#7C3AED] text-[#5B21B6]',
};

/**
 * The categories of a ค้นพบ page as one quiet row of icon tabs (Meetup's Find page): an icon over a short name,
 * a line under the picked one, no boxes. Scrolls sideways; wide screens get arrows when there is more.
 */
export function DiscoverCategoryTabs({ kind, categories, counts, selectedId, onSelect, mineIds = [] }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({ left: row.scrollLeft > 4, right: row.scrollLeft + row.clientWidth < row.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [measure, categories, counts]);

  const scrollBy = (direction: 1 | -1) => rowRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });

  const tabs = [
    { id: null, name: 'ทั้งหมด', Icon: Compass, iconColor: 'text-slate-700', count: counts.all },
    ...categories
      .filter((cat) => (counts[cat.id] ?? 0) > 0 || cat.id === selectedId)
      .sort((a, b) => Number(mineIds.includes(b.id)) - Number(mineIds.includes(a.id)))
      .map((cat) => ({ id: cat.id, name: cat.name, Icon: cat.icon, iconColor: cat.colorScheme.iconColor, count: counts[cat.id] ?? 0 })),
  ];

  const arrow = 'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 cursor-pointer';

  return (
    <div className="relative border-b border-slate-200">
      {/* relative: the sr-only "สายของคุณ" labels are absolute; without it they escape the scroll row and widen the page on phones */}
      <div ref={rowRef} onScroll={measure} role="tablist" aria-label="หมวด" className="relative flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ id, name, Icon, iconColor, count }) => {
          const isPicked = id === selectedId;
          const isMine = id !== null && mineIds.includes(id);
          return (
            <button
              key={id ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isPicked}
              onClick={() => onSelect(isPicked ? null : id)}
              title={`${name}${count !== undefined ? ` (${count.toLocaleString()})` : ''}${isMine ? ' · สายของคุณ' : ''}`}
              className={`group shrink-0 min-w-[72px] flex flex-col items-center gap-1.5 px-2.5 pt-1 pb-2.5 border-b-2 -mb-px text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isPicked ? `${PICKED[kind]} font-bold` : 'border-transparent text-slate-600 font-medium hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="relative">
                <Icon className={`w-6 h-6 transition-transform group-hover:-translate-y-0.5 ${iconColor}`} strokeWidth={1.75} aria-hidden="true" />
                {isMine && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#F26430] ring-2 ring-white" aria-hidden="true" />}
              </span>
              <span>{name}{isMine && <span className="sr-only"> สายของคุณ</span>}</span>
            </button>
          );
        })}
      </div>
      {edges.left && (
        <button type="button" onClick={() => scrollBy(-1)} aria-label="หมวดก่อนหน้า" className={`${arrow} -left-4`}>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      {edges.right && (
        <button type="button" onClick={() => scrollBy(1)} aria-label="หมวดถัดไป" className={`${arrow} -right-4`}>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
