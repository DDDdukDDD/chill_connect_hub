'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Camera, Ticket, Info, Zap } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  favoritesCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount = 0,
}) => {
  const navItems = [
    { id: 'explore', label: 'ค้นพบ', href: '/', icon: Compass },
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: Ticket },
    { id: 'about', label: 'เกี่ยวกับเรา', href: '/about', icon: Info },
  ];

  return (
    <div className="fixed bottom-3 left-4 right-4 z-50 md:hidden">
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
                  ? 'bg-white/15 text-white font-black scale-105 shadow-inner'
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
