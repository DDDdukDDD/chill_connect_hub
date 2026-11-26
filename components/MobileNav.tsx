'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarHeart, Camera, Footprints, Home, Plus, Zap } from 'lucide-react';
import { useMemberSession } from '@/lib/useMemberSession';
import { COMPOSE_HREF, onComposeLinkClick, onHomeLinkClick } from '@/lib/homeAgain';
import type { CreationEntityType } from './CreateEventModal';

// The posting form for ＋ away from Home loads on the first tap
const QuickCompose = dynamic(() => import('./moments/QuickCompose'), { ssr: false });
// The create form for ＋ on the กิจกรรม and ชาเลนจ์ lists, also on the first tap
const CreateEventModal = dynamic(() => import('./CreateEventModal').then((m) => m.CreateEventModal), { ssr: false });

/**
 * What ＋ makes on each list page (owner 2026-11-26): what that page lists, not a moment. `type` undefined opens the
 * chooser of all four kinds. Detail pages and the rest post a moment, as before.
 */
const CREATE_ON: Record<string, { type?: CreationEntityType; label: string }> = {
  '/this-week': { label: 'สร้างกิจกรรม' },
  '/community': { type: 'community', label: 'ตั้งตี้' },
  '/events': { type: 'fair', label: 'เพิ่มอีเวนต์' },
  '/spots': { type: 'spot', label: 'แนะนำสถานที่' },
  '/challenges': { type: 'challenge', label: 'สร้างชาเลนจ์' },
};

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** A detail page's own bar (when, save, share, the main button), stacked above the menu so both stay in reach.
   *  It shows once the page's own buttons ([data-hero-actions]) have scrolled away, so the two never sit on one screen. Pages with a bar mark their buttons; without the mark the bar stays hidden */
  actionBar?: React.ReactNode;
  /** The page's own ＋ (My Hub: a moment from an activity that ended); wins over CREATE_ON and the moment form */
  compose?: { label: string; onOpen: () => void };
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  actionBar,
  compose,
}) => {
  const { isLoggedIn } = useMemberSession();
  const router = useRouter();
  const createHere = CREATE_ON[usePathname() ?? ''];
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // ＋ away from Home: each tap opens a fresh form over the page (owner 2026-11-26); Home opens its own (onComposeLinkClick)
  const [composeKey, setComposeKey] = useState<number | null>(null);
  const [heroActionsGone, setHeroActionsGone] = useState(false);
  useEffect(() => {
    if (!actionBar) return;
    const target = document.querySelector('[data-hero-actions]');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHeroActionsGone(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [Boolean(actionBar)]); // eslint-disable-line react-hooks/exhaustive-deps -- only whether there is a bar matters

  // Members (owner 2026-11-26): หน้าหลัก | กิจกรรม | ＋ | ชาเลนจ์ | มายฮับ. ＋ posts a moment, except on the lists in
  // CREATE_ON (it creates what the page lists) and on My Hub (`compose`); โมเมนต์ moved into Home as its โมเมนต์ mode. Visitors keep หน้าหลัก · กิจกรรม · โมเมนต์ · ชาเลนจ์ until the landing is decided
  const navItems = [
    // Home is the member's live feed (and the visitor's landing), so it stays one tap away
    { id: 'home', label: 'หน้าหลัก', href: '/', icon: Home },
    { id: 'explore', label: 'กิจกรรม', href: '/this-week', icon: Footprints },
    ...(isLoggedIn ? [{ id: 'compose', label: compose?.label ?? createHere?.label ?? 'โพสต์โมเมนต์', href: COMPOSE_HREF, icon: Plus }] : [{ id: 'moments', label: 'โมเมนต์', href: '/moments', icon: Camera }]),
    { id: 'challenges', label: 'ชาเลนจ์', href: '/challenges', icon: Zap },
    // My Hub is personal: a visitor who is not signed in has nothing there
    ...(isLoggedIn ? [{ id: 'myhub', label: 'มายฮับ', href: '/myhub', icon: CalendarHeart }] : []),
  ];

  return (
    <>
    {/* Outside the bar: the bar is z-40 and hidden from xl, the form is a z-50 dialog */}
    {composeKey !== null && <QuickCompose key={composeKey} />}
    {createHere && (
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialType={createHere.type}
        // Live at once (a ตี้, an อีเวนต์ by an organiser): its page. What waits for staff says so in the form itself
        onCreateSuccess={(created) => router.push(`/${created.eventType === 'public_venue' ? 'events' : 'community'}/${encodeURIComponent(created.id)}`)}
      />
    )}
    {/* Every width below the top bar's links (xl), so no screen is left without a menu (owner 2026-11-01)
        z-40, under dialogs and sheets (z-50): at z-50 it covered the moment composer's โพสต์ button on phones.
        On short screens (a phone or folded phone turned sideways, 416 high) icon and label sit side by side, so the bar takes ~45 px, not ~70 */}
    <div className="fixed bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)_-_0.75rem))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-40 xl:hidden">
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
      <div className="bg-white/95 supports-[backdrop-filter]:bg-white/70 backdrop-blur-2xl backdrop-saturate-150 text-slate-900 rounded-3xl p-1 border border-white/60 shadow-[0_8px_32px_rgba(15,23,42,0.18)] flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          if (item.id === 'compose') {
            return (
              // The one dark round button in the bar: posting is the main thing a member does here
              <Link
                key={item.id}
                href={item.href}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  if (compose) {
                    event.preventDefault();
                    return compose.onOpen();
                  }
                  if (createHere) {
                    event.preventDefault();
                    return setIsCreateOpen(true);
                  }
                  if (window.location.pathname === '/') return onComposeLinkClick(event);
                  event.preventDefault();
                  setComposeKey(Date.now());
                }}
                aria-label={item.label}
                title={item.label}
                className="mx-1 w-10 h-10 [@media(max-height:500px)]:w-9 [@media(max-height:500px)]:h-9 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform select-none cursor-pointer"
              >
                <Icon className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              </Link>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(event) => {
                setActiveTab(item.id);
                if (item.href === '/') onHomeLinkClick(event);
              }}
              className={`flex flex-col [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-1.5 items-center justify-center py-1.5 [@media(max-height:500px)]:py-1 px-3 rounded-2xl transition-all duration-200 relative select-none cursor-pointer ${
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
    </>
  );
};
