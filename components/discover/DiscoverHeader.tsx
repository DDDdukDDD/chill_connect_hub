'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, X, Zap } from 'lucide-react';
import { ALL_PROVINCES, ONLINE, discoverHref, type DiscoverCounts, type DiscoverKind } from '@/lib/discoverMatch';
import { useDiscoverCounts } from '@/lib/useDiscoverCounts';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

/** The three ค้นพบ pages, in tab order, with their pillar colors (DESIGN_SYSTEM.md) */
const KINDS: { kind: DiscoverKind; label: string; dot: string }[] = [
  { kind: 'meetups', label: 'มีตอัป', dot: 'bg-[#F26430]' },
  { kind: 'fairs', label: 'งานแฟร์', dot: 'bg-[#2B527A]' },
  { kind: 'spots', label: 'ที่เที่ยว', dot: 'bg-[#4A7C59]' },
];

/** A picked filter wears its pillar's soft tint, border and dark text (DESIGN_SYSTEM.md, filters inside a pillar page) */
const PICKED: Record<DiscoverKind, string> = {
  meetups: 'bg-[#FFF4EE] border-[#F26430] text-[#D04A1B]',
  fairs: 'bg-[#EEF4FA] border-[#2B527A] text-[#1F3D5C]',
  spots: 'bg-[#EBF3ED] border-[#4A7C59] text-[#2D5A3C]',
};

const PILL = 'inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-full border text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer';

/** Classes for a filter pill on a ค้นพบ page */
export const filterPillClass = (kind: DiscoverKind, picked: boolean) =>
  `${PILL} ${picked ? PICKED[kind] : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`;

/** A dropdown filter drawn as a pill; it shows as picked when its value is not `emptyValue` */
export function FilterSelect({
  kind,
  label,
  value,
  emptyValue,
  onChange,
  children,
}: {
  kind: DiscoverKind;
  label: string;
  value: string;
  emptyValue: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative shrink-0">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${filterPillClass(kind, value !== emptyValue)} max-w-[13rem] truncate appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20`}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" aria-hidden="true" />
    </span>
  );
}

const titleOf = (kind: DiscoverKind, province: string) => {
  const base = kind === 'meetups' ? 'มีตอัป' : kind === 'fairs' ? 'งานแฟร์และอีเวนต์' : 'ที่เที่ยว';
  if (province === ONLINE && kind === 'meetups') return 'มีตอัปออนไลน์';
  return province && province !== ALL_PROVINCES && province !== ONLINE ? `${base}ใน ${province}` : base;
};

type Props = {
  kind: DiscoverKind;
  query: string;
  onQueryChange: (query: string) => void;
  province: string;
  onProvinceChange: (province: string) => void;
  /** The counts the server page made for the address it was opened with */
  initialCounts?: { query: string; province: string; counts: DiscoverCounts };
  /** One quiet action beside the title (e.g. "ตั้งตี้เอง") */
  action?: React.ReactNode;
  /** The page's own filter pills */
  children?: React.ReactNode;
};

/**
 * The top of the ค้นพบ pages (/community, /fairs, /spots): the search on phones, the three kinds as pills with
 * how many the search finds, the title, the search word, matching challenges, then the page's filters.
 * Wide screens get the search in the top bar instead (Navbar `searchSlot`).
 */
export function DiscoverHeader({ kind, query, onQueryChange, province, onProvinceChange, initialCounts, action, children }: Props) {
  const counts = useDiscoverCounts(initialCounts, query, province);
  const word = query.trim();

  return (
    <div className="space-y-4">
      <DiscoverSearch
        idPrefix="discover-phone"
        kind={kind}
        query={query}
        onQueryChange={onQueryChange}
        province={province}
        onProvinceChange={onProvinceChange}
        className="md:hidden"
      />

      <nav aria-label="ประเภท" className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {KINDS.map((item) => {
          const isHere = item.kind === kind;
          const count = counts?.[item.kind];
          return (
            <Link
              key={item.kind}
              href={discoverHref(item.kind, query, province)}
              aria-current={isHere ? 'page' : undefined}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors ${
                isHere ? 'bg-slate-100 font-bold text-slate-900' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${item.dot}`} aria-hidden="true" />
              <span>{item.label}</span>
              {count !== undefined && <span className="text-xs font-semibold text-slate-500 tabular-nums">{count.toLocaleString()}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-start sm:items-end justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{titleOf(kind, province)}</h1>
          {word && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-slate-100 text-slate-800 font-semibold">
                “{word}”
                <button type="button" onClick={() => onQueryChange('')} aria-label="ล้างคำค้นหา" className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 cursor-pointer">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
              {(counts?.challenges ?? 0) > 0 && (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
                  <span>ชาเลนจ์ที่ตรงกับ “{word}” {counts!.challenges} อัน</span>
                  <Link href={`/challenges?q=${encodeURIComponent(word)}`} className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                    ดูชาเลนจ์ →
                  </Link>
                </span>
              )}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children}
    </div>
  );
}
