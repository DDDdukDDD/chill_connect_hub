'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import { ALL_PROVINCES, ONLINE, type DiscoverKind } from '@/lib/discoverMatch';

const POPULAR_PROVINCES = ['กรุงเทพฯ', 'นนทบุรี', 'เชียงใหม่', 'ชลบุรี', 'ภูเก็ต'];

type Props = {
  kind: DiscoverKind;
  query: string;
  onQueryChange: (query: string) => void;
  province: string;
  onProvinceChange: (province: string) => void;
  /** Tells the two copies (top bar, phone) apart for their labels */
  idPrefix: string;
  /** The narrow phone copy: a short hint for this page so it is not cut off */
  compact?: boolean;
  /** Runs on Enter or the search button (pages outside ค้นพบ open it); the list pages filter while typing instead */
  onSubmit?: () => void;
  className?: string;
};

const SHORT_PLACEHOLDER: Record<DiscoverKind, string> = { meetups: 'ค้นหาตี้', fairs: 'ค้นหางานแฟร์', spots: 'ค้นหาที่เที่ยว' };

/**
 * The ค้นพบ search: word | province | search button, one rounded box. In the top bar on wide screens and
 * above the tabs on phones. The list filters while typing; the button only closes the phone keyboard.
 */
export function DiscoverSearch({ kind, query, onQueryChange, province, onProvinceChange, idPrefix, compact = false, onSubmit, className = '' }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
        onSubmit?.();
      }}
      className={`flex items-center h-11 w-full rounded-full border border-slate-300 bg-white pl-4 pr-1 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-colors ${className}`}
    >
      <label htmlFor={`${idPrefix}-q`} className="sr-only">ค้นหา</label>
      <input
        ref={inputRef}
        id={`${idPrefix}-q`}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={compact ? SHORT_PLACEHOLDER[kind] : 'ค้นหาตี้ งานแฟร์ ที่เที่ยว'}
        className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button type="button" onClick={() => onQueryChange('')} aria-label="ล้างคำค้นหา" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 cursor-pointer">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      <span aria-hidden="true" className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
      <label htmlFor={`${idPrefix}-province`} className="sr-only">จังหวัด</label>
      <select
        id={`${idPrefix}-province`}
        value={province}
        onChange={(e) => onProvinceChange(e.target.value)}
        className="max-w-[9.5rem] bg-transparent text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer truncate mr-1"
      >
        <option value={ALL_PROVINCES}>ทั่วประเทศ</option>
        {kind === 'meetups' && <option value={ONLINE}>ออนไลน์</option>}
        {/* A place picked elsewhere (e.g. a destination card) that is not in the lists below */}
        {province !== ALL_PROVINCES && province !== ONLINE && !POPULAR_PROVINCES.includes(province) && !ALL_THAI_PROVINCES.includes(province) && (
          <option value={province}>{province}</option>
        )}
        <optgroup label="จังหวัดยอดนิยม">
          {POPULAR_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </optgroup>
        <optgroup label="77 จังหวัด">
          {ALL_THAI_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </optgroup>
      </select>
      <button type="submit" aria-label="ค้นหา" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm cursor-pointer">
        <Search className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </form>
  );
}
