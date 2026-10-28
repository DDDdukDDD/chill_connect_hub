'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SpotCardSkeleton } from '@/components/SpotCard';
import { useAuth } from '@/lib/useAuth';
import type { DiscoverKind } from '@/lib/discoverMatch';

const TABS: { kind: DiscoverKind; label: string; dot: string; marker: string }[] = [
  { kind: 'meetups', label: 'ตี้', dot: 'bg-[#F26430]', marker: 'bg-[#F26430]/30' },
  { kind: 'fairs', label: 'อีเวนต์', dot: 'bg-[#2B527A]', marker: 'bg-[#2B527A]/20' },
  { kind: 'spots', label: 'ที่เที่ยว', dot: 'bg-[#4A7C59]', marker: 'bg-[#4A7C59]/25' },
];

const noop = () => {};

/**
 * What a ค้นพบ tab shows the moment it is tapped, while its server page renders (app/{community,events,spots}/loading.tsx):
 * the real top bar and tab row with the new tab already marked, then grey tiles in the page's own grid. Without it the
 * old page stayed frozen until the new one arrived, which felt slow on phones (2026-10-28).
 */
export function DiscoverLoading({ kind }: { kind: DiscoverKind }) {
  const { isLoggedIn, isAuthReady } = useAuth();
  const bar = 'rounded-full bg-slate-100 animate-pulse';

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar activeTab="explore" setActiveTab={noop} isLoggedIn={isLoggedIn} isAuthReady={isAuthReady} />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-12 space-y-6" aria-busy="true">
        <div className="space-y-4">
          <div className="flex gap-5 sm:gap-7">
            {TABS.map((tab) => {
              const isHere = tab.kind === kind;
              return (
                <span key={tab.kind} className={`relative isolate inline-flex items-center gap-1.5 h-10 text-[15px] sm:text-base whitespace-nowrap ${isHere ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                  {isHere && <span className={`absolute -inset-x-1.5 bottom-2 h-3 -z-10 rounded-full -rotate-2 ${tab.marker}`} aria-hidden="true" />}
                  <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} aria-hidden="true" />
                  {tab.label}
                </span>
              );
            })}
          </div>
          <div className={`h-8 w-2/3 max-w-md ${bar}`} />
          <div className="flex gap-2">
            {[96, 80, 112].map((w) => (
              <div key={w} className={`h-9 ${bar}`} style={{ width: w }} />
            ))}
          </div>
        </div>

        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-slate-100 animate-pulse" />
              <div className={`h-3 w-16 ${bar}`} />
            </div>
          ))}
        </div>

        {kind === 'spots' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SpotCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          // The ตี้ and อีเวนต์ tiles: a square photo and two short lines, in the 2 / 3 / 4 / 6 grid
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <li key={i}>
                <div className="aspect-square rounded-3xl bg-slate-100 animate-pulse" />
                <div className={`mt-3 h-4 w-4/5 ${bar}`} />
                <div className={`mt-2 h-3 w-3/5 ${bar}`} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <MobileNav activeTab="explore" setActiveTab={noop} />
    </div>
  );
}
