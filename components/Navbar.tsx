'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, LogIn, User, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  setIsLoggedIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E2D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Brand Logo & Name */}
        <Link 
          href="/"
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#4A7C59] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-[#1E293B] font-sans">
                Chill & Connect Hub
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-medium tracking-wide">
              ฮีลใจ & เชื่อมต่อ ฮับ
            </p>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: 'explore', label: 'ค้นหากิจกรรม', href: '/' },
            { id: 'moments', label: 'โมเมนต์โซเชียล 📸', href: '/moments' },
            { id: 'challenge', label: 'ชาเลนจ์ 🏆', href: '/challenge' },
            { id: 'about', label: 'เกี่ยวกับเรา', href: '/about' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`text-sm font-medium transition-all relative py-1 flex items-center gap-1 ${
                  isActive
                    ? 'text-[#4A7C59] font-bold'
                    : 'text-[#475569] hover:text-[#1E293B]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A7C59] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Login Toggle */}
        <div className="flex items-center gap-3">
          
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#EBF3ED] border-2 border-[#4A7C59] overflow-hidden flex items-center justify-center shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <button 
                onClick={() => setIsLoggedIn(false)}
                className="rounded-full bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="คลิกเพื่อจำลองการออกจากระบบ"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>คุณส้ม (Member)</span>
                <LogOut className="w-3 h-3 text-slate-400 ml-1" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoggedIn(true)}
              className="rounded-full bg-[#1E293B] hover:bg-[#0F172A] text-white px-5 py-2 text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95"
              title="คลิกเพื่อจำลองการเข้าสู่ระบบ"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>login</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
