'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Camera, Home, Ticket, Zap } from 'lucide-react';
import { useMemberSession } from '@/lib/useMemberSession';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  favoritesCount?: number;
  /** A detail page's own bar (when, save, share, the main button), stacked above the menu so both stay in reach.
   *  It shows once the page's own buttons ([data-hero-actions]) have scrolled away, so the two never sit on one screen. Pages with a bar mark their buttons; without the mark the bar stays hidden */
  actionBar?: React.ReactNode;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount = 0,
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
    { id: 'home', label: 'หน้าแรก', href: '/', icon: Home },
    { id: 'explore', label: 'กิจกรรม', href: '/community', icon: Compass },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    // My Hub is personal: a visitor who is not signed in has nothing there
    ...(isLoggedIn ? [{ id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: Ticket }] : []),
  ];

  return (
    // z-40, under dialogs and sheets (z-50): at z-50 it covered the moment composer's โพสต์ button on phones
    <div className="fixed bottom-3 left-4 right-4 z-40 lg:hidden">
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
      <div className="bg-slate-900/90 backdrop-blur-2xl text-white rounded-3xl p-1.5 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 relative select-none cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white font-bold scale-105 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'explore' && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#F26430] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
