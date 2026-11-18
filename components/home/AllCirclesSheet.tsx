'use client';

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CircleItem } from '@/lib/social/circles';
import { useDialogBehavior } from '@/components/auth/DialogShell';

/**
 * "ดูทั้งหมด" at the end of the Circles row (Circles at scale, owner 2026-11-18): every Circle in the same order as the
 * row, drawn the same way, in a grid. A tap opens that Circle in the viewer, where swiping goes on through all of them.
 */
export function AllCirclesSheet({ items, render, onClose }: { items: CircleItem[]; render: (item: CircleItem, index: number) => React.ReactNode; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose, { focusField: false });
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100002] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-circles-title"
        tabIndex={-1}
        className="w-full sm:max-w-[520px] max-h-[85vh] bg-white rounded-t-[28px] sm:rounded-[28px] flex flex-col focus:outline-hidden"
      >
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 id="all-circles-title" className="text-base font-bold text-slate-900">Circles ทั้งหมด <span className="text-slate-500 font-medium tabular-nums">{items.length}</span></h2>
          <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] justify-items-center gap-x-2 gap-y-4 overflow-y-auto px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {items.map((item, index) => render(item, index))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
