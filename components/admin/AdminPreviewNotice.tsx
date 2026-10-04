import React from 'react';
import { FlaskConical } from 'lucide-react';

/**
 * Banner for admin modules whose content is sample data with no backend yet.
 * Keeps prototype screens visible for design review without passing them off as live.
 */
export function AdminPreviewNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70">
      <FlaskConical size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-bold text-amber-800">ข้อมูลตัวอย่าง · ยังไม่เชื่อมต่อระบบจริง</p>
        <p className="text-[11px] sm:text-xs font-semibold text-amber-700/80 mt-0.5">{children}</p>
      </div>
    </div>
  );
}
