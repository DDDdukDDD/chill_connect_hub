'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, X, Zap } from 'lucide-react';
import { ALL_PROVINCES, ONLINE, discoverHref, type DiscoverCounts, type DiscoverKind } from '@/lib/discoverMatch';
import { useDiscoverCounts } from '@/lib/useDiscoverCounts';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

/** The three ค้นพบ pages, in tab order, with their pillar colors (DESIGN_SYSTEM.md) */
const KINDS: { kind: DiscoverKind; label: string; dot: string; marker: string }[] = [
  { kind: 'meetups', label: 'มีตอัป', dot: 'bg-[#F26430]', marker: 'bg-[#F26430]/30' },
  { kind: 'fairs', label: 'งานแฟร์', dot: 'bg-[#2B527A]', marker: 'bg-[#2B527A]/20' },
  { kind: 'spots', label: 'ที่เที่ยว', dot: 'bg-[#4A7C59]', marker: 'bg-[#4A7C59]/25' },
];

/** A picked filter wears its pillar's soft tint, border and dark text (DESIGN_SYSTEM.md, filters inside a pillar page) */
const PICKED: Record<DiscoverKind, string> = {
  meetups: 'bg-[#FFF4EE] border-[#F26430] text-[#D04A1B]',
  fairs: 'bg-[#EEF4FA] border-[#2B527A] text-[#1F3D5C]',
  spots: 'bg-[#EBF3ED] border-[#4A7C59] text-[#2D5A3C]',
};

const PILL =
  'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer';

/** Classes for a filter pill on a ค้นพบ page */
export const filterPillClass = (kind: DiscoverKind, picked: boolean) =>
  `${PILL} ${picked ? `${PICKED[kind]} font-semibold` : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'}`;

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
      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" aria-hidden="true" />
    </span>
  );
}

/** The page heading in a friend's voice, saying where (like Meetup's "Events near Bangkok"); each page names itself for search */
const titleOf = (kind: DiscoverKind, province: string) => {
  const base = kind === 'meetups' ? 'กิจกรรมออกไปใช้ชีวิต' : kind === 'fairs' ? 'งานแฟร์ งานวิ่ง งานคอน' : 'ที่เที่ยว ที่ชิล';
  if (province === ONLINE && kind === 'meetups') return 'กิจกรรมออนไลน์';
  return province && province !== ALL_PROVINCES && province !== ONLINE ? `${base} ใน ${province}` : `${base} ทั่วไทย`;
};

type Props = {
  kind: DiscoverKind;
  query: string;
  onQueryChange: (query: string) => void;
  province: string;
  onProvinceChange: (province: string) => void;
  /** The counts the server page made for the address it was opened with */
  initialCounts?: { query: string; province: string; counts: DiscoverCounts };
  /** The page's "create" button, at the end of the tabs row (e.g. "ตั้งตี้เอง") */
  action?: React.ReactNode;
  /** How the list is shown (sort, card or list), beside the title */
  tools?: React.ReactNode;
  /** A row right under the heading, before the filters (the destination circles on /spots) */
  lead?: React.ReactNode;
  /** How many the page shows ("พบ 57 ตี้"), a quiet line under the title */
  summary?: React.ReactNode;
  /** The page's own filter pills */
  children?: React.ReactNode;
};

/**
 * The top of the ค้นพบ pages (/community, /fairs, /spots): the search on phones, the three kinds as pills with
 * how many the search finds, the title, the search word, matching challenges, then the page's filters.
 * Wide screens get the search in the top bar instead (Navbar `searchSlot`).
 */
export function DiscoverHeader({ kind, query, onQueryChange, province, onProvinceChange, initialCounts, action, tools, lead, summary, children }: Props) {
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
        compact
        className="md:hidden"
      />

      <div className="flex items-center gap-3">
        <nav aria-label="ประเภท" className="flex-1 min-w-0 flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar -ml-4 pl-4 sm:ml-0 sm:pl-0">
          {KINDS.map((item) => {
            const isHere = item.kind === kind;
            const count = counts?.[item.kind];
            return (
              <Link
                key={item.kind}
                href={discoverHref(item.kind, query, province)}
                aria-current={isHere ? 'page' : undefined}
                className={`group relative isolate inline-flex items-center gap-1.5 h-10 text-[15px] sm:text-base whitespace-nowrap shrink-0 transition-colors ${
                  isHere ? 'font-bold text-slate-900' : 'font-medium text-slate-500 hover:text-slate-900'
                }`}
              >
                {/* The current page gets a highlighter stroke in its pillar color, a little tilted like a hand-drawn mark */}
                <span
                  className={`absolute -inset-x-1.5 bottom-2 h-3 -z-10 rounded-full -rotate-2 transition-transform origin-left ${
                    isHere ? `${item.marker} scale-x-100` : `${item.marker} scale-x-0 group-hover:scale-x-50`
                  }`}
                  aria-hidden="true"
                />
                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
                <span>{item.label}</span>
                {count !== undefined && <span className={`text-xs font-medium tabular-nums ${isHere ? 'text-slate-600' : 'text-slate-400'}`}>{count.toLocaleString()}</span>}
              </Link>
            );
          })}
        </nav>
        {/* On phones the three tabs need the whole row, so the button moves to the row under them */}
        {action && <div className="hidden sm:block shrink-0">{action}</div>}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{titleOf(kind, province)}</h1>


      {word && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-slate-100 text-slate-800 font-semibold">
            “{word}”
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="ล้างคำค้นหา"
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </span>
          {(counts?.challenges ?? 0) > 0 && (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
              <span>
                ชาเลนจ์ที่ตรงกับ “{word}” {counts!.challenges} อัน
              </span>
              <Link href={`/challenges?q=${encodeURIComponent(word)}`} className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                ดูชาเลนจ์ →
              </Link>
            </span>
          )}
        </div>
      )}

      {lead}

      {/* Phones: how many and how they are shown, with the create button, on one short row */}
      <div className="sm:hidden flex items-center justify-between gap-3">
        {summary && <div className="min-w-0 text-sm text-slate-500 font-medium truncate">{summary}</div>}
        <div className="shrink-0 flex items-center gap-2">
          {tools}
          {action}
        </div>
      </div>

      {/* Filters on the left; how many and how they are shown on the right (wide screens) */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">{children}</div>
        {(summary || tools) && (
          <div className="hidden sm:flex shrink-0 items-center gap-3 min-h-9">
            {summary && <div className="text-sm text-slate-500 font-medium whitespace-nowrap">{summary}</div>}
            {tools}
          </div>
        )}
      </div>
    </div>
  );
}
