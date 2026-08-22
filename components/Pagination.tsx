'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 24,
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-[#E8E2D8] mt-8">
      {/* Information text */}
      <div className="text-xs sm:text-sm text-[#64748B] font-medium text-center sm:text-left">
        แสดง <span className="font-bold text-[#1E293B]">{startItem} - {endItem}</span> จากทั้งหมด{' '}
        <span className="font-bold text-[#1E293B]">{totalItems}</span> กิจกรรม{' '}
        <span className="text-slate-400 font-normal">({currentPage}/{totalPages} หน้า)</span>
      </div>

      {/* Google-style Page Buttons Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 transition-all ${
            currentPage === 1
              ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
              : 'text-[#475569] bg-white border border-[#E8E2D8] hover:bg-slate-50 hover:text-[#1E293B] active:scale-95 cursor-pointer shadow-2xs'
          }`}
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </button>

        {/* Page Number Chips */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-9 flex items-center justify-center text-xs text-slate-400 font-bold"
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
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#4A7C59] text-white shadow-sm ring-2 ring-[#4A7C59]/20'
                    : 'bg-white text-[#475569] border border-[#E8E2D8] hover:bg-slate-100 hover:text-[#1E293B] active:scale-95'
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
          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 transition-all ${
            currentPage === totalPages
              ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
              : 'text-[#475569] bg-white border border-[#E8E2D8] hover:bg-slate-50 hover:text-[#1E293B] active:scale-95 cursor-pointer shadow-2xs'
          }`}
          title="หน้าถัดไป"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
