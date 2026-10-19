'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * The search box on /challenges: the same shape as the site search (word | blue button), without a province
 * (challenges have none). It filters the list as you type, so it searches challenges in place instead of opening ค้นพบ.
 * Computers get it in the top bar (Navbar `searchSlot`), phones at the top of the page.
 */
export function ChallengeSearch({ query, onQueryChange, idPrefix, className = '' }: { query: string; onQueryChange: (q: string) => void; idPrefix: string; className?: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
      }}
      className={`flex items-center h-11 w-full rounded-full border border-slate-300 bg-white pl-4 pr-1 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-colors ${className}`}
    >
      <label htmlFor={`${idPrefix}-q`} className="sr-only">ค้นหาชาเลนจ์</label>
      <input
        ref={inputRef}
        id={`${idPrefix}-q`}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="ค้นหาชาเลนจ์ เช่น คาเฟ่ วิ่ง ไหว้พระ"
        className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button type="button" onClick={() => onQueryChange('')} aria-label="ล้างคำค้นหา" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 cursor-pointer">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      <button type="submit" aria-label="ค้นหา" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm cursor-pointer">
        <Search className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </form>
  );
}
