'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut, 
  PlusCircle, 
  Ticket, 
  ChevronRight,
  Gift,
  Search,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { AuthModal } from './AuthModal';
import { BrandLogo } from './BrandLogo';
import { BrandWordmark } from './BrandWordmark';
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
  userName?: string;
  isAuthReady?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  isLoggedIn,
  setIsLoggedIn,
  onOpenLogin,
  onOpenLogout,
  onOpenSignup,
  searchSlot,
  userName = '',
  isAuthReady,
}) => {
  const { userProfile, handleSetRole } = useAuth();
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

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Wide screens: the three public sections sit in the top bar for everyone; below that the floating bottom bar has them (components/MobileNav.tsx).
  // Not below xl: at 1024px they squeeze the search box's word field away.
  const pathname = usePathname() ?? '';
  // หน้าแรก first for everyone: a member's live feed (owner 2026-10-29), and for a visitor the landing, not only via the logo
  // (owner 2026-11-01). Shown before the session is known too, so the bar does not shift when it loads.
  const topLinks = [
    { label: 'หน้าแรก', href: '/', match: ['/'] },
    { label: 'กิจกรรม', href: '/community', match: ['/community', '/events', '/spots'] },
    // ชาเลนจ์ before โมเมนต์ (owner 2026-11-01)
    { label: 'ชาเลนจ์', href: '/challenges', match: ['/challenges'] },
    { label: 'โมเมนต์', href: '/moments', match: ['/moments'] },
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
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform duration-300" />
            {/* Guests see the name too, so a first visit learns it (owner 2026-10-31); only below 360px does the logo stand alone,
                leaving room for เข้าสู่ระบบ and สมัครฟรี, the name staying for screen readers */}
            <BrandWordmark sizeClass="text-base min-[400px]:text-xl sm:text-[22px]" tagline taglineClass="hidden sm:block" className={isLoggedIn ? '' : 'max-[359px]:sr-only'} />
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

          </div>

        </div>
      </header>

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

