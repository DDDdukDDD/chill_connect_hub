'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  /** How many are on screen now */
  shown: number;
  /** How many match the filters */
  total: number;
  onClick: () => void;
};

/**
 * One "show more" button under a ค้นพบ list (Meetup-style), in place of page numbers.
 * The list keeps growing in place, so nobody loses their spot; it hides once everything is shown.
 */
export function ShowMoreButton({ shown, total, onClick }: Props) {
  if (shown >= total) return null;
  return (
    <div className="flex justify-center pt-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:border-slate-900 cursor-pointer active:scale-95 transition-all"
      >
        <span>แสดงเพิ่มเติม</span>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
