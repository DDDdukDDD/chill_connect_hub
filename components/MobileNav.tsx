'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Camera, Ticket, Info } from 'lucide-react';

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
    { id: 'explore', label: 'ค้นหา', href: '/', icon: Compass },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'challenge', label: 'ฮับของฉัน', href: '/challenge', icon: Ticket },
    { id: 'about', label: 'เกี่ยวกับ', href: '/about', icon: Info },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-[#E8E2D8] shadow-2xl px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-[#4A7C59] font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'explore' && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#F26430] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#4A7C59] rounded-full mt-0.5 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
