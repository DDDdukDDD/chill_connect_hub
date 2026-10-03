import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationState {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

/** Compact pager for server-paginated admin lists. Renders nothing for a single page. */
export function AdminPagination({
  pagination,
  onPageChange,
  isLoading = false,
}: {
  pagination: AdminPaginationState | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, totalCount, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  const buttonClass =
    'flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-between gap-3 pt-1">
      <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tabular-nums">
        {from}–{to} จาก {totalCount} รายการ
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={buttonClass} disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={13} />
          ก่อนหน้า
        </button>
        <span className="text-xs font-bold text-slate-700 tabular-nums">
          {page} / {totalPages}
        </span>
        <button type="button" className={buttonClass} disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)}>
          ถัดไป
          <ChevronRight size={13} />
        </button>
      </div>
    </nav>
  );
}
