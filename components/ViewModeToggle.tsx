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
      className={`inline-flex items-center h-9 bg-slate-100/90 p-0.5 rounded-full border border-slate-200/80 shrink-0 ${className}`}
      role="group"
      aria-label="สลับมุมมองการแสดงผล"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        title="มุมมองการ์ด (Grid View)"
        aria-label="Grid View"
        className={`h-full px-2.5 sm:px-3 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
          viewMode === 'grid'
            ? 'bg-white text-slate-900 shadow-2xs font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">การ์ด</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        title="มุมมองรายการ (List View)"
        aria-label="List View"
        className={`h-full px-2.5 sm:px-3 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
          viewMode === 'list'
            ? 'bg-white text-slate-900 shadow-2xs font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">รายการ</span>
      </button>
    </div>
  );
};
