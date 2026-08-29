'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
  itemUnit?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 24,
  itemUnit = 'กิจกรรม',
}) => {
  if (totalPages <= 1) return null;

  // Handle smooth scroll up to the filter bar & first card of the new page
  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);

    // Smooth scroll up to the catalog section and filter bar
    if (typeof window !== 'undefined') {
      const el = document.getElementById('catalog-section');
      if (el) {
        const yOffset = -75; // Leave comfortable space for sticky navbar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }
  };

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 pb-1 border-t border-slate-200/70 mt-6">
      {/* Information text */}
      <div className="text-[11px] sm:text-xs text-[#64748B] font-medium text-center sm:text-left">
        แสดง <span className="font-bold text-[#1E293B]">{startItem} - {endItem}</span> จาก{' '}
        <span className="font-bold text-[#1E293B]">{totalItems}</span> {itemUnit}{' '}
        <span className="text-slate-400 font-normal">({currentPage}/{totalPages} หน้า)</span>
      </div>

      {/* Google-style Compact Page Buttons Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Previous Button */}
        <button
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
            currentPage === 1
              ? 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
              : 'text-[#475569] bg-white border border-slate-200/90 hover:bg-slate-50 hover:text-[#1E293B] active:scale-95 cursor-pointer shadow-2xs'
          }`}
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">ก่อนหน้า</span>
        </button>

        {/* Page Number Chips */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-[11px] text-slate-400 font-bold"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageSelect(pageNum)}
                className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#4A7C59] text-white shadow-xs ring-1 ring-[#4A7C59]/30'
                    : 'bg-white text-[#475569] border border-slate-200/90 hover:bg-slate-50 hover:text-[#1E293B] active:scale-95'
                }`}
                title={`ไปหน้าที่ ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
            currentPage === totalPages
              ? 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
              : 'text-[#475569] bg-white border border-slate-200/90 hover:bg-slate-50 hover:text-[#1E293B] active:scale-95 cursor-pointer shadow-2xs'
          }`}
          title="หน้าถัดไป"
        >
          <span className="hidden sm:inline text-[11px]">ถัดไป</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
