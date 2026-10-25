'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogIn, 
  LogOut, 
  PlusCircle, 
  Menu, 
  X, 
  Compass, 
  Camera, 
  Ticket, 
  Zap,
  ChevronRight,
  Gift,
  Search,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { AuthModal } from './AuthModal';
import { BrandLogo } from './BrandLogo';
import { SiteSearch } from './discover/SiteSearch';
import { NotificationBell } from './NotificationBell';
import { useActivitySync } from '@/lib/useMyActivity';

// The create dialog loads only when someone opens it from the profile menu
const CreateEventModal = dynamic(() => import('./CreateEventModal').then((m) => m.CreateEventModal), { ssr: false });

const MENU_ROW = 'flex items-center gap-2.5 min-h-10 px-3 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn?: (status: boolean) => void;
  onOpenLogin?: () => void;
  onOpenLogout?: () => void;
  /** @deprecated The profile menu's สร้างกิจกรรม opens its own type chooser on every page; pages keep their own create buttons */
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
  onOpenSignup,
  searchSlot,
  showMenuOnMobile = false,
  userName = '',
  isAuthReady,
}) => {
  const { userProfile, handleSetRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isOwnSignupOpen, setIsOwnSignupOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  // XP for the "แลกของรางวัล" row, read when the menu opens (not on every page load)
  const [menuXp, setMenuXp] = useState<number | null>(null);
  const toggleProfileMenu = () => {
    const opening = !isProfileDropdownOpen;
    setIsProfileDropdownOpen(opening);
    if (!opening) return;
    fetch('/api/rewards', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMenuXp(typeof data?.points?.balance === 'number' ? data.points.balance : null))
      .catch(() => undefined);
  };
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
    // ค้นพบ = meetups, fairs and places (/community, /events, /spots); the logo goes home
    { id: 'explore', label: 'ค้นพบ', href: '/community', icon: Compass },
    { id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera },
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    // About sits in the footer of this menu
    { id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: Ticket },
  ];

  // Wide screens: the three public sections sit in the top bar for everyone (the drawer keeps them too).
  // Not below xl: at 1024px they squeeze the search box's word field away.
  const pathname = usePathname() ?? '';
  const topLinks = [
    { label: 'ค้นพบ', href: '/community', match: ['/community', '/events', '/spots'] },
    { label: 'โมเมนต์', href: '/moments', match: ['/moments'] },
    { label: 'ชาเลนจ์', href: '/challenges', match: ['/challenges'] },
  ];
  const isOn = (paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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

          <nav aria-label="เมนูหลัก" className="hidden xl:flex items-center gap-1 shrink-0">
            {topLinks.map((link) => {
              const on = isOn(link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={on ? 'page' : undefined}
                  className={`relative px-3 py-2 text-[15px] rounded-lg transition-colors ${
                    on ? 'font-semibold text-slate-900' : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                  {on && <span className="absolute left-3 right-3 -bottom-[13px] h-0.5 rounded-full bg-slate-900" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>

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
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="เมนูโปรไฟล์"
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center shrink-0 ${
                    isProfileDropdownOpen ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-white ring-1 ring-slate-200 hover:ring-slate-300'
                  }`}
                >
                  <img
                    src={userProfile.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Profile menu: who I am (opens my profile), then my places, then log out (owner 2026-10-25) */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-up origin-top-right">
                    <Link
                      href="/profile?id=me"
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="mx-2 px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <img src={userProfile.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-sm text-slate-900 truncate">{userProfile.name || userName}</span>
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-slate-500">
                          ดูโปรไฟล์ของฉัน
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      </span>
                    </Link>

                    <div className="mt-1 pt-1 border-t border-slate-100 px-2 text-sm font-semibold text-slate-700">
                      <Link
                        href="/myhub"
                        onClick={() => {
                          setActiveTab('myhub');
                          setIsProfileDropdownOpen(false);
                        }}
                        className={MENU_ROW}
                      >
                        <Ticket className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        มายฮับ
                      </Link>
                      {/* Creating lives here, not in the top bar, so the bar stays calm; it offers all four kinds */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsCreateOpen(true);
                        }}
                        className={`${MENU_ROW} w-full cursor-pointer`}
                      >
                        <PlusCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        สร้างกิจกรรม
                      </button>
                      <Link
                        href="/rewards"
                        onClick={() => {
                          setActiveTab('rewards');
                          setIsProfileDropdownOpen(false);
                        }}
                        className={MENU_ROW}
                      >
                        <Gift className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        <span className="flex-1">แลกของรางวัล</span>
                        {menuXp !== null && <span className="text-xs font-bold text-slate-500 tabular-nums">{menuXp.toLocaleString()} XP</span>}
                      </Link>
                      <Link
                        href="/profile/settings"
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileDropdownOpen(false);
                        }}
                        className={MENU_ROW}
                      >
                        <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        ตั้งค่าบัญชี
                      </Link>
                    </div>

                    <div className="mt-1 pt-1 border-t border-slate-100 px-2">
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
                        className={`${MENU_ROW} w-full cursor-pointer text-sm font-semibold text-slate-600`}
                      >
                        <LogOut className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        ออกจากระบบ
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
                  onClick={() => (onOpenSignup ? onOpenSignup() : setIsOwnSignupOpen(true))}
                  className="rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white px-3.5 sm:px-5 py-2 text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  สมัครฟรี
                </button>
              </>
            )}

            {/* Universal Luxury Hamburger / Menu Button (Active on Mobile, iPad, and Desktop).
                Members only (owner 2026-10-19): for visitors, log in and sign up are the top bar's only actions, on every page.
                Below desktop width the floating bottom bar does its job, so it shows there only when a page has no bar; from xl the
                top bar holds ค้นพบ / โมเมนต์ / ชาเลนจ์ and the profile menu holds มายฮับ, so the button goes (owner 2026-10-25). */}
            {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`${showMenuOnMobile ? 'flex xl:hidden' : 'hidden lg:flex xl:hidden'} items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer select-none group shrink-0`}
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

      {/* สร้างกิจกรรม: the chooser of all four kinds, then the new page once it is live */}
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateSuccess={(created) => router.push(`/${created.eventType === 'public_venue' ? 'events' : 'community'}/${encodeURIComponent(created.id)}`)}
      />

      {/* Pages that do not pass onOpenSignup still get the sign-up screen, not the log-in one */}
      <AuthModal isOpen={isOwnSignupOpen} onClose={() => setIsOwnSignupOpen(false)} onLoginSuccess={() => setIsLoggedIn?.(true)} initialMode="signup" />
    </>
  );
};

