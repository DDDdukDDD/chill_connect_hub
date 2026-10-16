'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

/**
 * Search window opened from the header bar (the "/" key opens it too; mount it only while open): words, a province, and a few
 * searches people make often. `onSearch` gets both; an empty search clears the results.
 */
export function SearchPanel({
  onClose,
  initialQuery,
  initialProvince,
  popularProvinces,
  otherProvinces,
  quickSearches,
  onSearch,
}: {
  onClose: () => void;
  initialQuery: string;
  initialProvince: string;
  popularProvinces: string[];
  otherProvinces: string[];
  quickSearches: string[];
  onSearch: (query: string, province: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [province, setProvince] = useState(initialProvince);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opens on the search already on the page, with the cursor in the box
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/35 flex justify-center items-start px-4 pt-20 sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="ค้นหา" className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-4 space-y-4">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-900 cursor-pointer">
            ปิด
          </button>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query.trim(), province);
          }}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pl-4"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาตี้ ที่เที่ยว หรืองาน"
            aria-label="ค้นหา"
            className="flex-1 min-w-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-hidden [&::-webkit-search-cancel-button]:hidden"
          />
          <span className="w-px h-6 bg-slate-200 shrink-0" aria-hidden="true" />
          <label className="flex items-center gap-1 shrink-0 cursor-pointer">
            <MapPin className="w-4 h-4 text-[#F26430] shrink-0" aria-hidden="true" />
            <span className="sr-only">จังหวัด</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="max-w-[96px] sm:max-w-[132px] truncate bg-transparent text-sm font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">ทุกจังหวัด</option>
              <optgroup label="ยอดนิยม">
                {popularProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label="จังหวัดอื่นๆ">
                {otherProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            </select>
          </label>
          <button
            type="submit"
            className="h-10 px-4 sm:px-5 shrink-0 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
          >
            ค้นหา
          </button>
        </form>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">คนค้นกันบ่อย</p>
          <div className="flex flex-wrap gap-2">
            {quickSearches.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => {
                  setQuery(word);
                  inputRef.current?.focus();
                }}
                className="h-8 px-3 rounded-full border border-slate-200 hover:border-slate-400 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
