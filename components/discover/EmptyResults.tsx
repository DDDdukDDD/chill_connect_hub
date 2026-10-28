import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

/**
 * "Nothing matches" under a list's filters, with a button that clears them. Its own file so a list page shows it
 * without loading components/EventGrid.tsx and its animation library (~120 KB, 2026-10-28).
 */
export function EmptyResults({ isFavoritesOnly = false, onReset }: { isFavoritesOnly?: boolean; onReset?: () => void }) {
  return (
    <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
            {isFavoritesOnly ? 'ยังไม่มีรายการโปรดที่บันทึกไว้' : 'ยังไม่พบกิจกรรมที่ตรงกับเงื่อนไขนี้'}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {isFavoritesOnly ? 'กดปุ่มหัวใจ ❤️ ที่การ์ดเพื่อบันทึกกิจกรรมที่คุณสนใจ' : 'ลองปรับคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูกิจกรรมที่เปิดรับทั้งหมด'}
          </p>
        </div>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>รีเซ็ตตัวกรอง</span>
        </button>
      )}
    </div>
  );
}
