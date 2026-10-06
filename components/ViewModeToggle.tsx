'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Editorial Segmented Control for switching between Grid View and List View.
 * Adheres to Global Luxury UI standards with frosted slate pill styling.
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shrink-0 ${className}`}
      role="group"
      aria-label="สลับมุมมองการแสดงผล"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        title="มุมมองการ์ด (Grid View)"
        aria-label="Grid View"
        className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          viewMode === 'grid'
            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">การ์ด</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        title="มุมมองรายการ (List View)"
        aria-label="List View"
        className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          viewMode === 'list'
            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">รายการ</span>
      </button>
    </div>
  );
};
