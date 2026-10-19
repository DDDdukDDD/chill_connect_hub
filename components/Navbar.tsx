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
  Zap,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Heart,
  Bot,
  Gift,
  Search
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { BrandLogo } from './BrandLogo';
import { SiteSearch } from './discover/SiteSearch';
import { NotificationBell } from './NotificationBell';
import { useActivitySync } from '@/lib/useMyActivity';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn?: (status: boolean) => void;
  onOpenLogin?: () => void;
  onOpenLogout?: () => void;
  onOpenCreateEvent?: () => void;
  /** Sign-up button for visitors; without it the button opens the login window */
  onOpenSignup?: () => void;
  /** The ค้นพบ pages' own search box, in place of the site search (same look and place) */
  searchSlot?: React.ReactNode;
  /** Pages without the floating bottom bar keep the menu button on phones and tablets */
  showMenuOnMobile?: boolean;
  userName?: string;
  isAuthReady?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  setIsLoggedIn,
  onOpenLogin,
  onOpenLogout,
  onOpenCreateEvent,
  onOpenSignup,
  searchSlot,
  showMenuOnMobile = false,
  userName = '',
  isAuthReady,
}) => {
  const { userProfile, handleSetRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  // Joined events and saved places come from the account (see lib/useMyActivity.ts)
  useActivitySync();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown or drawer when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    // ค้นพบ = meetups, fairs and places (/community, /fairs, /spots); the logo goes home
    { id: 'explore', label: 'ค้นพบ', href: '/community', icon: Compass },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    // About sits in the footer of this menu
    { id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: Ticket },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300 shadow-2xs">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-17 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Logo & Name */}
          <Link 
            href="/"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group py-1 min-w-0"
          >
            <BrandLogo size="md" className="group-hover:scale-105 group-hover:shadow-md transition-all duration-300" />
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-sm min-[400px]:text-lg sm:text-[19px] tracking-tight text-[#0F172A] font-sans leading-none truncate">
                Chill & Connect Hub
              </span>
              <p className="hidden sm:block text-[11px] text-slate-500 font-medium tracking-normal leading-none mt-1.5">
                Curated Lifestyle & Meaningful Activities
              </p>
            </div>
          </Link>

          {/* Search: the same box in the same place on every page. The ค้นพบ pages bring theirs (it filters while typing);
              everywhere else Enter opens ค้นพบ. */}
          <div className="hidden md:flex flex-1 min-w-0 max-w-[480px] ml-2 lg:ml-8 mr-auto">{searchSlot ?? <SiteSearch />}</div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Phones: the search lives at the top of ค้นพบ */}
            {!searchSlot && (
              <Link
                href="/community"
                aria-label="ค้นหา"
                className="md:hidden w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-800 active:scale-95"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}

            {/* Notifications (renders only for a signed-in member) */}
            {isAuthReady && isLoggedIn && <NotificationBell />}

            {/* Desktop User Avatar & Profile Dropdown (Facebook/Google Style) */}
            {!isAuthReady ? (
              <>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 animate-pulse border-2 border-slate-100 lg:hidden shrink-0"></div>
                <div className="hidden lg:block w-[110px] h-9 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
              </>
            ) : isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Trigger Button (Clean Avatar Only - No Text) */}
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center shrink-0 ${
                    isProfileDropdownOpen
                      ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 scale-105'
                      : 'border-[#4A7C59]/80 hover:border-[#4A7C59] hover:ring-2 hover:ring-[#4A7C59]/10'
                  }`}
                  title="คลิกเพื่อเปิดเมนูโปรไฟล์"
                >
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name || userName}
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
                          src={userProfile.avatar}
                          alt={userProfile.name || userName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-[#1E293B] truncate" title={userProfile.name || userName}>
                          {userProfile.name || userName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-[#4A7C59] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>{userProfile.badgeLabel || 'สมาชิก Chill & Connect'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Links */}
                    <div className="py-1.5 px-2 space-y-0.5 text-xs font-semibold text-[#334155]">
                      {/* Creating lives here, not in the top bar, so the bar stays calm */}
                      {onOpenCreateEvent && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            onOpenCreateEvent();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4 text-[#2563EB]" />
                          <span>สร้างกิจกรรม</span>
                        </button>
                      )}
                      <Link
                        href="/profile?id=me"
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#4A7C59]" />
                        <span>โปรไฟล์ส่วนตัวของฉัน</span>
                      </Link>

                      <Link
                        href="/rewards"
                        onClick={() => {
                          setActiveTab('rewards');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                      >
                        <Gift className="w-4 h-4 text-[#F26430]" />
                        <span>ของรางวัล & สิทธิพิเศษ</span>
                      </Link>

                      <Link
                        href="/legal?tab=privacy"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                        <span>ข้อมูลและความเป็นส่วนตัว</span>
                      </Link>

                    </div>

                    {/* Divider, Logout Button & Dev Role Switcher */}
                    <div className="pt-1.5 mt-1 border-t border-slate-100 px-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          if (onOpenLogout) {
                            onOpenLogout();
                          } else if (setIsLoggedIn) {
                            setIsLoggedIn(false);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Visitors: log in as a quiet link, sign up as the orange button (no menu below desktop width to hide it in) */}
                <button
                  type="button"
                  onClick={() => onOpenLogin ? onOpenLogin() : setIsLoggedIn?.(true)}
                  className="block px-1 py-2 text-[13px] sm:text-sm font-semibold text-slate-900 hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => (onOpenSignup ? onOpenSignup() : onOpenLogin ? onOpenLogin() : setIsLoggedIn?.(true))}
                  className="rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white px-3.5 sm:px-5 py-2 text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  สมัครฟรี
                </button>
              </>
            )}

            {/* Universal Luxury Hamburger / Menu Button (Active on Mobile, iPad, and Desktop).
                Members only (owner 2026-10-19): for visitors, log in and sign up are the top bar's only actions, on every page.
                Below desktop width the floating bottom bar does its job, so it shows there only when a page has no bar. */}
            {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`${showMenuOnMobile ? 'flex' : 'hidden lg:flex'} items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer select-none group shrink-0`}
              title="เปิดเมนูนำทาง"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-4.5 h-4.5 text-slate-700 group-hover:text-slate-900 transition-colors" />
              <span className="hidden sm:inline text-xs font-bold text-slate-700 group-hover:text-slate-900">
                เมนู
              </span>
            </button>
            )}

          </div>

        </div>
      </header>

      {/* Slide-out Universal Luxury Drawer (Active across all screen sizes: Mobile, Tablet & Desktop) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content Panel */}
          <div className="relative w-[300px] sm:w-[340px] md:w-[360px] bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-slide-left border-l border-slate-200 overflow-y-auto">
            
            {/* Top Drawer Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <BrandLogo size="sm" />
                  <span className="font-bold text-base text-[#1E293B]">เมนูหลัก</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90"
                  title="ปิดเมนู"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Login CTA only when guest */}
              {!isLoggedIn && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center space-y-2">
                  <p className="text-xs text-amber-800 font-medium">เข้าสู่ระบบเพื่อบันทึกและจัดการกิจกรรม</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenLogin) onOpenLogin();
                      else setIsLoggedIn?.(true);
                    }}
                    className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
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
                          ? 'bg-slate-900 text-white shadow-xs font-bold'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/90'
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
            </div>

            {/* Minimal Brand Footer */}
            <div className="pt-4 mt-6 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500 font-medium mb-1.5">
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">เกี่ยวกับเรา</Link>
                {' · '}
                <Link href="/legal" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">ข้อตกลงการใช้งาน</Link>
                {' · '}
                <Link href="/legal?tab=privacy" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">นโยบายความเป็นส่วนตัว</Link>
              </p>
              <p className="text-[11px] text-slate-400 font-medium">© 2026 Chill & Connect Hub</p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

