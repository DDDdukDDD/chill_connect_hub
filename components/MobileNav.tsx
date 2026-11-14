'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarHeart, Camera, Footprints, Home, Zap } from 'lucide-react';
import { useMemberSession } from '@/lib/useMemberSession';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** A detail page's own bar (when, save, share, the main button), stacked above the menu so both stay in reach.
   *  It shows once the page's own buttons ([data-hero-actions]) have scrolled away, so the two never sit on one screen. Pages with a bar mark their buttons; without the mark the bar stays hidden */
  actionBar?: React.ReactNode;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  actionBar,
}) => {
  const { isLoggedIn } = useMemberSession();
  const [heroActionsGone, setHeroActionsGone] = useState(false);
  useEffect(() => {
    if (!actionBar) return;
    const target = document.querySelector('[data-hero-actions]');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHeroActionsGone(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [Boolean(actionBar)]); // eslint-disable-line react-hooks/exhaustive-deps -- only whether there is a bar matters

  const navItems = [
    // Home is the member's live feed (and the visitor's landing), so it stays one tap away
    { id: 'home', label: 'หน้าหลัก', href: '/', icon: Home },
    { id: 'explore', label: 'กิจกรรม', href: '/community', icon: Footprints },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    // My Hub is personal: a visitor who is not signed in has nothing there
    ...(isLoggedIn ? [{ id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: CalendarHeart }] : []),
  ];

  return (
    // Every width below the top bar's links (xl), so no screen is left without a menu (owner 2026-11-01)
    // z-40, under dialogs and sheets (z-50): at z-50 it covered the moment composer's โพสต์ button on phones.
    // On short screens (a phone or folded phone turned sideways, 416 high) icon and label sit side by side, so the bar takes ~45 px, not ~70
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-40 xl:hidden">
      {actionBar && (
        <div
          aria-hidden={!heroActionsGone}
          inert={!heroActionsGone}
          className={`max-w-md mx-auto mb-2 px-3 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ${
            heroActionsGone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {actionBar}
        </div>
      )}
      <div className="bg-white/95 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl backdrop-saturate-150 text-slate-900 rounded-3xl p-1.5 [@media(max-height:500px)]:p-1 border border-white/60 shadow-[0_8px_32px_rgba(15,23,42,0.18)] flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-1.5 items-center justify-center py-2 [@media(max-height:500px)]:py-1.5 px-3 rounded-2xl transition-all duration-200 relative select-none cursor-pointer ${
                isActive
                  ? 'bg-white/80 text-slate-900 font-bold scale-105 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-[#2563EB] stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 [@media(max-height:500px)]:mt-0 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
