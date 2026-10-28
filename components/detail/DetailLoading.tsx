'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { useAuth } from '@/lib/useAuth';

const noop = () => {};

/**
 * What a ตี้, อีเวนต์ or place page shows the moment it is opened, while the server renders it
 * (app/{community,events,spots}/[id]/loading.tsx): the top bar, then grey blocks in the DetailHero layout.
 * It also keeps the list's own loading screen from showing on a detail page.
 */
export function DetailLoading() {
  const { isLoggedIn, isAuthReady } = useAuth();
  const bar = 'rounded-full bg-slate-100 animate-pulse';

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar activeTab="explore" setActiveTab={noop} isLoggedIn={isLoggedIn} isAuthReady={isAuthReady} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-16" aria-busy="true">
        <div className={`h-4 w-28 ${bar}`} />
        <section className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-center">
          <div className="aspect-[16/10] rounded-3xl bg-slate-100 animate-pulse" />
          <div className="space-y-4">
            <div className={`h-9 w-11/12 ${bar}`} />
            <div className={`h-9 w-2/3 ${bar}`} />
            <div className={`h-5 w-1/2 ${bar}`} />
            <div className={`h-4 w-3/4 ${bar}`} />
            <div className={`h-4 w-3/5 ${bar}`} />
            <div className="flex gap-3 pt-2">
              <div className={`h-11 w-36 ${bar}`} />
              <div className={`h-11 w-28 ${bar}`} />
            </div>
          </div>
        </section>
      </main>
      <MobileNav activeTab="explore" setActiveTab={noop} />
    </div>
  );
}
