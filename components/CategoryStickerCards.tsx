'use client';

import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { ScrollRow } from '@/components/ScrollRow';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { meetupCategoryIcon } from '@/components/icons/CategoryIcons';

type CategoryCard = {
  id: string;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderBottom: string;
  sticker: string;
  count: number;
};

/**
 * "ทั้งหมด" plus the community categories, each with how many it holds.
 * `hideEmpty` leaves out categories with nothing in them (the challenge page has a few per category).
 */
export function communityCategoryCards(allCount: number, countOf: (categoryId: string) => number, hideEmpty = false): CategoryCard[] {
  const categories = COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    // The drawn icon pack (owner 2026-10-28); a category added in admin without a drawing keeps its line icon
    Icon: meetupCategoryIcon(cat.id) ?? cat.icon,
    iconBg: cat.colorScheme.iconBg,
    iconColor: cat.colorScheme.iconColor,
    borderBottom: cat.colorScheme.borderBottom,
    sticker: cat.colorScheme.activeBg,
    count: countOf(cat.id),
  }));
  return [
    { id: 'all', name: 'ทั้งหมด', Icon: meetupCategoryIcon('all') ?? LayoutGrid, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', borderBottom: 'border-b-slate-300', sticker: 'bg-slate-500 text-white', count: allCount },
    ...(hideEmpty ? categories.filter((c) => c.count > 0) : categories),
  ];
}

/**
 * The playful category cards from the landing ("ดูตี้ตามสายที่ชอบ"): a tilted icon tile, the name,
 * and the count as a sticker on the corner. One row that slides (phones swipe, iPad and up get arrows).
 * `countUnit` finishes the label read aloud, e.g. "ตี้เปิดรับ" or "ชาเลนจ์".
 * `fadeEmpty` fades cards with nothing behind them (the landing; onboarding shows every card the same).
 */
export function CategoryStickerCards({
  cards,
  selectedId,
  onSelect,
  label,
  countUnit,
  fadeEmpty = false,
}: {
  cards: CategoryCard[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  countUnit: string;
  fadeEmpty?: boolean;
}) {
  return (
    <ScrollRow label={label} className="flex gap-2.5 md:gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 pt-3 pb-2 md:mx-0 md:px-1 md:scroll-px-1">
      {cards.map(({ id, name, Icon, iconBg, iconColor, borderBottom, sticker, count }, i) => {
        const isPicked = selectedId === id;
        const isDimmed = !isPicked && (selectedId !== 'all' || (fadeEmpty && id !== 'all' && count === 0));
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isPicked}
            onClick={() => onSelect(id)}
            aria-label={count > 0 ? `${name} ${count} ${countUnit}` : name}
            data-row-photo={i === 0 ? '' : undefined}
            className={`group relative w-24 shrink-0 md:w-32 lg:w-36 snap-start flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 ${borderBottom} px-1 py-3 sm:py-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 ${isPicked ? 'bg-slate-50 border-x-slate-200 border-t-slate-200 -translate-y-1 shadow-lg' : 'bg-white border-x-slate-100 border-t-slate-100'} ${isDimmed ? 'opacity-60 hover:opacity-100' : ''}`}
          >
            {/* The count sits on the corner like a sticker, so the card keeps its size */}
            {count > 0 && (
              <span className={`absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full border-2 border-white text-[11px] font-bold flex items-center justify-center shadow-sm rotate-12 group-hover:rotate-0 transition-transform ${sticker}`} aria-hidden="true">
                {count}
              </span>
            )}
            <span className={`w-11 h-11 md:w-[54px] md:h-[54px] rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} ${isPicked ? 'scale-110' : i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
              <Icon className="w-7 h-7 md:w-9 md:h-9" aria-hidden="true" />
            </span>
            {/* Break only at the ampersand, never inside a Thai word */}
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-tight">
              {name.split(' & ').map((part, j, all) => (
                <span key={part} className="block whitespace-nowrap">
                  {part}
                  {j < all.length - 1 ? ' &' : ''}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </ScrollRow>
  );
}
