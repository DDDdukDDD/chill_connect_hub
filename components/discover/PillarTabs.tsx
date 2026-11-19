'use client';

import React from 'react';
import Link from 'next/link';
import { discoverHref, type DiscoverCounts, type DiscoverKind } from '@/lib/discoverMatch';

/** The three ค้นพบ pages, in tab order, with their pillar colors (DESIGN_SYSTEM.md) */
const KINDS: { kind: DiscoverKind; label: string; dot: string; marker: string }[] = [
  { kind: 'meetups', label: 'ตี้', dot: 'bg-[#F26430]', marker: 'bg-[#F26430]/30' },
  { kind: 'fairs', label: 'อีเวนต์', dot: 'bg-[#2B527A]', marker: 'bg-[#2B527A]/20' },
  { kind: 'spots', label: 'ที่เที่ยว', dot: 'bg-[#4A7C59]', marker: 'bg-[#4A7C59]/25' },
];

/**
 * The row of กิจกรรม tabs: "สัปดาห์นี้" first (owner 2026-11-19: the first view, the next 7 days by day), then the three
 * ค้นพบ pages with how many the search finds. Shared by DiscoverHeader and /this-week.
 */
export function PillarTabs({ current, counts, query = '', province = '', prefetchOthers }: {
  current: DiscoverKind | 'week';
  counts?: Partial<DiscoverCounts> | null;
  query?: string;
  province?: string;
  /** Prefetch the other tabs (DiscoverHeader passes false while the search word is still changing) */
  prefetchOthers?: boolean;
}) {
  const tabs = [
    { key: 'week' as const, label: 'สัปดาห์นี้', href: '/this-week', dot: 'bg-slate-900', marker: 'bg-[#F26430]/30', count: undefined },
    ...KINDS.map((item) => ({ key: item.kind, label: item.label, href: discoverHref(item.kind, query, province), dot: item.dot, marker: item.marker, count: counts?.[item.kind] })),
  ];
  return (
    <nav aria-label="ประเภท" className="flex-1 min-w-0 flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar -ml-4 pl-4 sm:ml-0 sm:pl-0">
      {tabs.map((tab) => {
        const isHere = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            prefetch={isHere ? false : prefetchOthers === false ? undefined : true}
            aria-current={isHere ? 'page' : undefined}
            className={`group relative isolate inline-flex items-center gap-1.5 h-10 text-[15px] sm:text-base whitespace-nowrap shrink-0 transition-colors ${
              isHere ? 'font-bold text-slate-900' : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
          >
            {/* The current page gets a highlighter stroke in its pillar color, a little tilted like a hand-drawn mark */}
            <span
              className={`absolute -inset-x-1.5 bottom-2 h-3 -z-10 rounded-full -rotate-2 transition-transform origin-left ${
                isHere ? `${tab.marker} scale-x-100` : `${tab.marker} scale-x-0 group-hover:scale-x-50`
              }`}
              aria-hidden="true"
            />
            <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.count !== undefined && <span className={`text-xs font-medium tabular-nums ${isHere ? 'text-slate-600' : 'text-slate-500'}`}>{tab.count.toLocaleString()}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
