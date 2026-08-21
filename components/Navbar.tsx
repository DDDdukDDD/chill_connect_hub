'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  LogIn, 
  User, 
  LogOut, 
  PlusCircle, 
  Menu, 
  X, 
  Compass, 
  Camera, 
  Ticket, 
  Info,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Heart,
  Bot,
  Zap
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  onOpenLogin?: () => void;
  onOpenLogout?: () => void;
  onOpenCreateEvent?: () => void;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  setIsLoggedIn,
  onOpenLogin,
  onOpenLogout,
  onOpenCreateEvent,
  userName = 'Jirathitigorn Maneekord',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'explore', label: 'ค้นหากิจกรรม', href: '/', icon: Compass },
    { id: 'challenges', label: 'ชาเลนจ์ & ภารกิจ', href: '/challenges', icon: Zap },
    { id: 'moments', label: 'โมเมนต์โซเชียล', href: '/moments', icon: Camera },
    { id: 'challenge', label: 'ฮับของฉัน', href: '/challenge', icon: Ticket },
    { id: 'about', label: 'เกี่ยวกับเรา', href: '/about', icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8] transition-all">
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Left: Brand Logo & Name */}
          <Link 
            href="/"
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#4A7C59] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Sprout className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-[#1E293B] font-sans">
                  Chill & Connect Hub
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#64748B] font-medium tracking-wide">
                ฮีลใจ & เชื่อมต่อ ฮับ
              </p>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links (Visible on Large Screens) */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium transition-all relative py-1.5 flex items-center gap-1.5 ${
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop User Avatar & Profile Dropdown (Facebook/Google Style) */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Trigger Button (Clean Avatar Only - No Text) */}
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0 ${
                    isProfileDropdownOpen
                      ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 scale-105'
                      : 'border-[#4A7C59]/80 hover:border-[#4A7C59] hover:ring-2 hover:ring-[#4A7C59]/10'
                  }`}
                  title="คลิกเพื่อเปิดเมนูโปรไฟล์"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                </button>

                {/* Profile Dropdown Menu (Floating Card) */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] py-2.5 z-50 animate-scale-up origin-top-right">
                    
                    {/* User Profile Header Card */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70 mx-2 rounded-xl">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#EBF3ED] border-2 border-[#4A7C59] shrink-0 shadow-xs">
                        <img 
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                          alt={userName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-[#1E293B] truncate" title={userName}>
                          {userName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-[#4A7C59] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>สมาชิก Chill & Connect</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Links */}
                    <div className="py-1.5 px-2 space-y-0.5 text-xs font-semibold text-[#334155]">
                      <Link
                        href="/challenge"
                        onClick={() => {
                          setActiveTab('challenge');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-[#4A7C59]" />
                        <span>กิจกรรมและตั๋วของฉัน</span>
                      </Link>

                      <Link
                        href="/moments?tab=mine"
                        onClick={() => {
                          setActiveTab('moments');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Camera className="w-4 h-4 text-[#F26430]" />
                          <span>โมเมนต์ของฉัน (ความทรงจำ)</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">ส่วนตัว</span>
                      </Link>

                      {onOpenCreateEvent && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            onOpenCreateEvent();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#4A7C59] transition-colors text-left"
                        >
                          <PlusCircle className="w-4 h-4 text-[#4A7C59]" />
                          <span>สร้างกิจกรรม / เปิดตี้ใหม่</span>
                        </button>
                      )}

                      <Link
                        href="/admin"
                        target="_blank"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bot className="w-4 h-4 text-emerald-600" />
                          <span>Event Bot & AI Panel</span>
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">Admin</span>
                      </Link>
                    </div>

                    {/* Divider & Logout Button */}
                    <div className="pt-1.5 mt-1 border-t border-slate-100 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          if (onOpenLogout) {
                            onOpenLogout();
                          } else {
                            setIsLoggedIn(false);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>ออกจากระบบ (Log out)</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => onOpenLogin ? onOpenLogin() : setIsLoggedIn(true)}
                className="hidden lg:flex rounded-full bg-[#1E293B] hover:bg-[#0F172A] text-white px-5 py-2 text-xs font-semibold transition-all shadow-sm items-center gap-2 active:scale-95 cursor-pointer"
                title="คลิกเพื่อเข้าสู่ระบบ / สมัครสมาชิก"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}

            {/* Mobile / iPad: Hamburger Menu Button (ปุ่ม 3 ขีด ☰) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-2xl bg-white border border-[#E8E2D8] text-[#1E293B] flex items-center justify-center shadow-2xs hover:bg-slate-50 active:scale-95 cursor-pointer"
              title="เปิดเมนูนำทาง"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>

        </div>
      </header>

      {/* Slide-out Mobile & Tablet Hamburger Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content Panel */}
          <div className="relative w-[300px] sm:w-[340px] bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-slide-left border-l border-[#E8E2D8] overflow-y-auto">
            
            {/* Top Drawer Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4A7C59] flex items-center justify-center text-white">
                    <Sprout className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-base text-[#1E293B]">เมนูหลัก</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90"
                  title="ปิดเมนู"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Status Card */}
              {isLoggedIn ? (
                <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-2xs flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#EBF3ED] border-2 border-[#4A7C59] overflow-hidden shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-extrabold text-[#1E293B] truncate" title={userName}>{userName}</p>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    </div>
                    <p className="text-xs text-[#4A7C59] font-semibold">● สมาชิก Chill & Connect</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center space-y-2">
                  <p className="text-xs text-amber-800 font-medium">เข้าสู่ระบบเพื่อบันทึกและจัดการกิจกรรม</p>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenLogin) onOpenLogin();
                      else setIsLoggedIn(true);
                    }}
                    className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-2 mb-2">
                  การนำทาง
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#4A7C59] text-white shadow-xs'
                          : 'text-[#334155] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Create Event CTA Button in Drawer */}
              {onOpenCreateEvent && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCreateEvent();
                    }}
                    className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-3 rounded-2xl text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>จัดกิจกรรมใหม่ ➕</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Drawer Logout / Auth CTA */}
            {isLoggedIn && (
              <div className="pt-6 border-t border-[#E8E2D8]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenLogout) onOpenLogout();
                    else setIsLoggedIn(false);
                  }}
                  className="w-full bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

