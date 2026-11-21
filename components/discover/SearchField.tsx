'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

/** The plain search box (no province) of the phone search screen and /search: icon, word, clear */
export function SearchField({ id, value, onChange, onSubmit, onKeyDown, autoFocus = false, className = '' }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={`flex items-center min-w-0 h-11 rounded-full border border-slate-300 bg-white pl-4 pr-1 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 ${className}`}
    >
      <Search className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">ค้นหา</label>
      <input
        id={id}
        data-autofocus={autoFocus || undefined}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="ค้นหากิจกรรม คน #แท็ก"
        // 16px: iPhone zooms the page into a smaller field
        className="h-full flex-1 min-w-0 ml-2 bg-transparent text-base font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="ล้างคำค้นหา" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 cursor-pointer">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
