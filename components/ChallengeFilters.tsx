'use client';

import React, { useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

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
