'use client';

import React, { useEffect, useRef } from 'react';
import { Bike, Check, ChevronDown, ChevronRight, Coffee, HeartHandshake, Mountain, Palette, Sparkles, Tag, Users, type LucideIcon } from 'lucide-react';

/** One icon and colour per challenge topic (questCategories); a topic added later in the admin console gets the tag icon */
const TOPIC_LOOK: Record<string, { Icon: LucideIcon; color: string }> = {
  all: { Icon: Sparkles, color: '#7C3AED' },
  cafe_food: { Icon: Coffee, color: '#B45309' },
  active_outdoor: { Icon: Bike, color: '#15803D' },
  art_learn: { Icon: Palette, color: '#BE185D' },
  wellness: { Icon: HeartHandshake, color: '#0E7490' },
  social: { Icon: Users, color: '#C2410C' },
  travel: { Icon: Mountain, color: '#1D4ED8' },
};

export interface TopicChoice {
  id: string;
  name: string;
  count: number;
}

/**
 * The topics as a row of icons with a short name and how many challenges each holds; the picked one is underlined.
 * It scrolls sideways, with an arrow on a wide screen.
 */
export function CategoryIconRow({ topics, selected, onSelect }: { topics: TopicChoice[]; selected: string; onSelect: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative border-b border-slate-200">
      <div ref={rowRef} className="flex gap-1 overflow-x-auto no-scrollbar sm:pr-12" role="group" aria-label="หมวดของชาเลนจ์">
        {topics.map((topic) => {
          const look = TOPIC_LOOK[topic.id] ?? { Icon: Tag, color: '#475569' };
          const isPicked = selected === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              aria-pressed={isPicked}
              onClick={() => onSelect(topic.id)}
              className={`group shrink-0 min-w-[84px] sm:min-w-[96px] flex flex-col items-center gap-1.5 px-2.5 pt-1.5 pb-2.5 -mb-px border-b-[3px] text-xs sm:text-[13px] font-bold transition-colors cursor-pointer ${
                isPicked ? 'border-[#7C3AED] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`w-10 h-10 rounded-xl grid place-items-center transition-transform motion-safe:group-hover:-translate-y-0.5 ${isPicked ? 'bg-[#F5F3FF]' : 'bg-slate-100'}`}>
                <look.Icon className="w-[22px] h-[22px]" style={{ color: look.color }} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap">{topic.name}</span>
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{topic.count}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => rowRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
        aria-label="หมวดถัดไป"
        className="hidden sm:grid absolute right-0 top-3 w-9 h-9 place-items-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 text-slate-900" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * A filter folded into one pill: tapping it opens a short menu. Once set away from its default the pill turns violet
 * and shows the choice in place of its name.
 */
export function FilterMenu<T extends string>({
  id,
  label,
  value,
  defaultValue,
  options,
  openId,
  setOpenId,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  defaultValue: T;
  options: { value: T; label: string; count?: number }[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onChange: (value: T) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const isSet = value !== defaultValue;
  const current = options.find((option) => option.value === value);

  // A tap anywhere else, or Escape, closes the menu
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, setOpenId]);

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setOpenId(isOpen ? null : id)}
        className={`inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full border text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
          isSet ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]' : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
        }`}
      >
        {isSet && current ? current.label : label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div role="menu" aria-label={label} className="absolute left-0 top-full mt-1.5 z-30 min-w-[220px] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5">
          {options.map((option) => {
            const isChosen = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isChosen}
                onClick={() => {
                  onChange(option.value);
                  setOpenId(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm hover:bg-slate-50 cursor-pointer ${isChosen ? 'font-bold text-[#5B21B6]' : 'font-medium text-slate-800'}`}
              >
                <Check className={`w-4 h-4 shrink-0 ${isChosen ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && <span className="text-xs font-semibold text-slate-500 tabular-nums">{option.count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
