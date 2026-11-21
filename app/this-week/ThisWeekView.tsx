'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trophy, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { Toast } from '@/components/Toast';
import { MeetupTile } from '@/components/MeetupTile';
import { FairTile } from '@/components/FairTile';
import { ChallengeTile } from '@/components/ChallengeTile';
import { SpotTile } from '@/components/SpotTile';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { ScrollRow } from '@/components/ScrollRow';
import { PillarTabs } from '@/components/discover/PillarTabs';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { useAuth } from '@/lib/useAuth';
import { useMyRewards } from '@/lib/useMyRewards';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { ALL_PROVINCES, discoverHref, eventInProvince } from '@/lib/discoverMatch';
import { avatarImage } from '@/lib/optimizedImage';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { nameInitial } from '@/lib/displayName';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { WeekDay } from '@/lib/thisWeek';
import { LATER_SHOWN, THIN_WEEK_EMPTY_DAYS, THIN_WEEK_ITEMS, WEEK_PLACES, WEEK_QUESTS } from '@/lib/thisWeekRules';
import type { LifestyleSpotItem } from '@/data/spotsData';
import type { WeekFriendItem } from '@/lib/thisWeekFriends';

type Item = { kind: 'tee' | 'fair'; event: EventItem };

/** The same tile size as the 2/3/4/6 grids of the other กิจกรรม pages, in a row that slides (as on the landing) */
const TILE = 'w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start';
const ROW = 'flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0 pb-1';
/** Challenge rows: room above and to the sides for the XP sticker over the photo's corner (the row clips what sticks
 *  out), the same padding as ChallengePicks on the landing */
const QUEST_ROW = 'flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:-mx-3 sm:px-3 sm:scroll-px-3 pt-4 pb-3';
const PROVINCE_KEY = 'this-week-province';
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/**
 * สัปดาห์นี้ (owner 2026-11-19): the next 7 days as a schedule. The job: "I have a free day: what is on, and who is
 * going" answered at a glance. Friends first (the strongest reason to go), a day strip to jump to the free day, then
 * one row per day mixing ตี้ and อีเวนต์ in time order; days in a row with nothing fold into one "ยังไม่มีกิจกรรม" line.
 * อีเวนต์ already running sit once in "กำลังจัดอยู่", challenges (no date) close the page as something for any free day.
 * Since BE-449 (owner 2026-11-21) this page is what is on and My Hub is what the member is doing: the member's own
 * challenges and plans moved out, and what they joined, run or saved is only marked on the tiles and the day strip.
 */
export default function ThisWeekView({ days, label, byDay, ongoing, quests, places: allPlaces, later, regions }: {
  days: WeekDay[];
  label: string;
  byDay: Record<string, Item[]>;
  ongoing: EventItem[];
  /** Every open challenge, most people first */
  quests: ChallengeQuest[];
  /** "ที่น่าไปวันว่าง" for all of Thailand */
  places: LifestyleSpotItem[];
  /** "เร็วๆ นี้": ตี้ and อีเวนต์ after the 7 days, soonest first (BE-450) */
  later: Item[];
  /** Province → region, for "ใกล้ๆ" */
  regions: Record<string, string>;
}) {
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn, member } = useAuth();
  // "ชาเลนจ์ที่คุณทำอยู่": the member's joined, unfinished challenges with how far they are (GET /api/rewards)
  const rewards = useMyRewards(isLoggedIn);
  const progress = useMemo(() => new Map(rewards.quests.filter((q) => q.joined && !q.completed).map((q) => [q.questId, q])), [rewards.quests]);
  const myQuests = useMemo(() => quests.filter((quest) => progress.has(quest.id)), [quests, progress]);
  const popularQuests = useMemo(() => quests.filter((quest) => !progress.has(quest.id)).slice(0, WEEK_QUESTS), [quests, progress]);
  const [inviteFor, setInviteFor] = useState<LifestyleSpotItem | null>(null);
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // The browser's clock for "วันนี้" on the tiles; none in the server HTML, as the tiles ask
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  // Province: the provinces that have something this week, most first; the member's own when it has something
  const provinces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of [...Object.values(byDay).flat().map((item) => item.event), ...ongoing]) {
      const key = event.province || '';
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [byDay, ongoing]);
  // The server renders before it knows the member, so the first render shows every province like the server HTML;
  // the remembered or own province applies once the page is up (a mismatch otherwise, seen on dev 2026-11-19)
  const [provinceReady, setProvinceReady] = useState(false);
  const [pickedProvince, setPickedProvince] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROVINCE_KEY);
      if (stored) setPickedProvince(stored);
    } catch {
      // No storage: start from the default below
    }
    setProvinceReady(true);
  }, []);
  // The province is the search box's (top bar, or above the tabs on phones), as on the other กิจกรรม pages; a member
  // starts in their own when it has something this week
  const ownProvince = member?.province && provinces.includes(member.province) ? member.province : null;
  const province = !provinceReady ? ALL_PROVINCES : pickedProvince ?? ownProvince ?? ALL_PROVINCES;
  const router = useRouter();
  const [query, setQuery] = useState('');
  // The schedule has no word filter: a search opens the ตี้ list with the word and province
  const search = () => {
    if (query.trim()) router.push(discoverHref('meetups', query, province));
  };
  // "ที่น่าไปวันว่าง": the server's six for all of Thailand, asked again for a picked province (same list as /spots)
  const [provincePlaces, setProvincePlaces] = useState<{ province: string; items: LifestyleSpotItem[] } | null>(null);
  useEffect(() => {
    if (province === ALL_PROVINCES) return;
    let active = true;
    fetch(`/api/spots?limit=${WEEK_PLACES}&hasImageOnly=true&province=${encodeURIComponent(province)}`)
      .then((res) => res.json())
      .then((json) => active && setProvincePlaces({ province, items: Array.isArray(json?.spots) ? json.spots : [] }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [province]);
  const places = province === ALL_PROVINCES ? allPlaces : provincePlaces?.province === province ? provincePlaces.items : [];
  const inviteTo = (spot: LifestyleSpotItem) => (isLoggedIn ? setInviteFor(spot) : setIsAuthModalOpen(true));

  const searchBox = (idPrefix: string, compact: boolean, className = '') => (
    <DiscoverSearch idPrefix={idPrefix} kind="meetups" query={query} onQueryChange={setQuery} province={province} onProvinceChange={pickProvince} onSubmit={search} compact={compact} className={className} />
  );
  const pickProvince = (value: string) => {
    setPickedProvince(value);
    try {
      localStorage.setItem(PROVINCE_KEY, value);
    } catch {
      // Remembered for this visit only
    }
  };
  const inProvince = (event: EventItem) => province === ALL_PROVINCES || eventInProvince(event, province);
  const shownByDay = useMemo(
    () => Object.fromEntries(days.map((day) => [day.iso, (byDay[day.iso] ?? []).filter((item) => inProvince(item.event))])),
    [days, byDay, province] // eslint-disable-line react-hooks/exhaustive-deps -- inProvince reads province
  );
  const shownOngoing = useMemo(() => ongoing.filter(inProvince), [ongoing, province]); // eslint-disable-line react-hooks/exhaustive-deps -- inProvince reads province
  // Days in a row with nothing fold into one block (owner 2026-11-21)
  const weekBlocks = useMemo(() => {
    const blocks: { empty: boolean; days: WeekDay[] }[] = [];
    for (const day of days) {
      const empty = shownByDay[day.iso].length === 0;
      const last = blocks[blocks.length - 1];
      if (empty && last?.empty) last.days.push(day);
      else blocks.push({ empty, days: [day] });
    }
    return blocks;
  }, [days, shownByDay]);

  // What the member goes to, runs or saved, from the account (lib/useMyActivity.ts), marked on the tiles (BE-449)
  const activity = useMyActivity();
  const joinedIds = useMemo(() => new Set(isLoggedIn ? activity.joinedIds : []), [isLoggedIn, activity.joinedIds]);
  const hostedIds = useMemo(() => new Set(isLoggedIn ? activity.hosted.map((event) => event.id) : []), [isLoggedIn, activity.hosted]);
  const savedIds = useMemo(() => new Set(isLoggedIn ? activity.savedEventIds : []), [isLoggedIn, activity.savedEventIds]);
  const isMine = (id: string) => joinedIds.has(id) || hostedIds.has(id);
  const toggleSave = (eventId: string) => {
    if (!isLoggedIn) return setIsAuthModalOpen(true);
    void activityActions.setSaved('event', eventId, !savedIds.has(eventId));
  };

  // A thin week (BE-450, owner 2026-11-21): a schedule of mostly empty days tells a visitor the place is dead, while
  // there are places and challenges for any day and more further ahead. The page then shows one row for the week,
  // "เร็วๆ นี้", places and challenges, and nearby provinces; a full week keeps the day-by-day schedule
  const weekItems = useMemo(() => days.flatMap((day) => shownByDay[day.iso].map((item) => ({ ...item, day }))), [days, shownByDay]);
  const emptyDays = days.filter((day) => shownByDay[day.iso].length === 0).length;
  const thin = weekItems.length < THIN_WEEK_ITEMS || emptyDays >= THIN_WEEK_EMPTY_DAYS;
  const shownLater = useMemo(() => later.filter((item) => inProvince(item.event)).slice(0, LATER_SHOWN), [later, province]); // eslint-disable-line react-hooks/exhaustive-deps -- inProvince reads province
  const regionOf = (name?: string) => (name ? regions[name] ?? regions[name === 'กรุงเทพฯ' ? 'กรุงเทพมหานคร' : name === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : name] : undefined);
  // "ใกล้ๆ": a picked province with a thin week also shows its region's other provinces, or all of Thailand
  const nearby = useMemo(() => {
    if (!thin || province === ALL_PROVINCES) return null;
    const elsewhere = [...days.flatMap((day) => byDay[day.iso] ?? []), ...later].filter((item) => !inProvince(item.event));
    const region = regionOf(province);
    const close = region ? elsewhere.filter((item) => regionOf(item.event.province) === region) : [];
    const items = close.length ? close : elsewhere;
    return { title: close.length ? `ใกล้ๆ ใน${region}` : 'ที่อื่นทั่วประเทศ', items: items.slice(0, LATER_SHOWN) };
  }, [thin, province, days, byDay, later]); // eslint-disable-line react-hooks/exhaustive-deps -- inProvince and regionOf read province and regions
  const createHref = (iso?: string) => `/community?create=1${iso ? `&date=${iso}` : ''}${province !== ALL_PROVINCES ? `&province=${encodeURIComponent(province)}` : ''}`;

  /**
   * One ตี้ or อีเวนต์ tile with its kind over it, in its pillar's color as the tabs above (owner 2026-11-19); `when` adds
   * the day where the row is not one day's. What the member goes to or saved is marked (BE-449): "ร่วมแล้ว" as on every
   * ตี้ list, "คุณจัด" for their own, a filled heart for a saved one.
   */
  const eventTile = (item: Item, when?: string) => {
    const id = item.event.id;
    return (
      <li key={id} className={TILE}>
        <span className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${item.kind === 'tee' ? 'text-[#C2410C]' : 'text-[#2B527A]'}`}>
          <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${item.kind === 'tee' ? 'bg-[#F26430]' : 'bg-[#2B527A]'}`} aria-hidden="true" />
          <span className="truncate">{item.kind === 'tee' ? 'ตี้' : 'อีเวนต์'}{when ? ` · ${when}` : ''}</span>
        </span>
        {item.kind === 'tee' ? (
          <MeetupTile event={item.event} now={now} isJoined={joinedIds.has(id) && !hostedIds.has(id)} badge={hostedIds.has(id) ? 'คุณจัด' : undefined} isSaved={savedIds.has(id)} onToggleSave={toggleSave} />
        ) : (
          <FairTile event={item.event} now={now} isSaved={savedIds.has(id)} onToggleSave={toggleSave} />
        )}
      </li>
    );
  };
  /** "ส. 6 ธ.ค." for a tile further ahead, from the event's own date */
  const laterWhen = (event: EventItem) => {
    const at = new Date(parseEventDateToTimestamp(event.date));
    return Number.isFinite(at.getTime()) && at.getTime() > 0 ? `${WEEKDAYS_SHORT[at.getDay()]} ${at.getDate()} ${THAI_MONTHS[at.getMonth()]}` : '';
  };

  const ongoingSection = shownOngoing.length > 0 && (
    <section aria-labelledby="this-week-ongoing" className="space-y-3">
      <SectionHead id="this-week-ongoing" title="อีเวนต์ที่กำลังจัดอยู่" href="/events" more="ดูอีเวนต์ทั้งหมด" />
      <ScrollRow as="ul" className={ROW} label="อีเวนต์ที่กำลังจัดอยู่">
        {shownOngoing.map((event) => (
          <li key={event.id} className={TILE}>
            <FairTile event={event} now={now} isSaved={savedIds.has(event.id)} onToggleSave={toggleSave} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
  const placesSection = places.length > 0 && (
    <section aria-labelledby="this-week-places" className="space-y-3">
      <SectionHead id="this-week-places" title="ที่น่าไปวันว่าง" href="/spots" more="ดูที่เที่ยวทั้งหมด" />
      <ScrollRow as="ul" className={ROW} label="ที่น่าไปวันว่าง">
        {places.map((spot) => (
          <li key={spot.id} className={`${TILE} space-y-2`}>
            <SpotTile spot={spot} />
            {/* A place has no date: the step is to pick a day with friends ("ไปกัน" plans) */}
            <button
              type="button"
              onClick={() => inviteTo(spot)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-[13px] font-semibold text-slate-800 cursor-pointer"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              ชวนไป
            </button>
          </li>
        ))}
      </ScrollRow>
    </section>
  );
  const questsSection = popularQuests.length > 0 && (
    <section aria-labelledby="this-week-challenges" className="space-y-3">
      <SectionHead id="this-week-challenges" title="ชาเลนจ์ยอดนิยม" href="/challenges" more="ดูชาเลนจ์ทั้งหมด" />
      <ScrollRow as="ul" className={QUEST_ROW} label="ชาเลนจ์ยอดนิยม">
        {popularQuests.map((quest, index) => (
          <li key={quest.id} className={TILE}>
            <ChallengeTile quest={quest} index={index} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
  const laterSection = shownLater.length > 0 && (
    <section aria-labelledby="this-week-later" className="space-y-3">
      <SectionHead id="this-week-later" title="เร็วๆ นี้" href="/community" more="ดูตี้ทั้งหมด" />
      <ScrollRow as="ul" className={ROW} label="เร็วๆ นี้">
        {shownLater.map((item) => eventTile(item, laterWhen(item.event)))}
      </ScrollRow>
    </section>
  );
  const nearbySection = nearby && nearby.items.length > 0 && (
    <section aria-labelledby="this-week-nearby" className="space-y-3">
      <SectionHead id="this-week-nearby" title={nearby.title} href="/community" more="ดูตี้ทั้งหมด" />
      <ScrollRow as="ul" className={ROW} label={nearby.title}>
        {nearby.items.map((item) => eventTile(item, [item.event.province, laterWhen(item.event)].filter(Boolean).join(' · ')))}
      </ScrollRow>
    </section>
  );

  const [loadedFriends, setFriends] = useState<WeekFriendItem[]>([]);
  const friends = isLoggedIn ? loadedFriends : [];
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    fetch('/api/this-week/friends', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setFriends(Array.isArray(json?.items) ? json.items : []))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        searchSlot={searchBox('week-top', false)}
      />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 xl:pb-12">
        {searchBox('week-phone', true, 'md:hidden mb-4')}
        <div className="flex items-center gap-3">
          <PillarTabs current="week" />
        </div>

        <div className="mt-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{province === ALL_PROVINCES ? 'สัปดาห์นี้ไปไหนดี' : `สัปดาห์นี้ไปไหนดี ใน${province}`}</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">{label}</p>
        </div>

        {/* The day strip: tap a free day to jump to it; it stays under the top bar while the schedule scrolls. Left out
            on a thin week, where a row of "ยังไม่มี" was the emptiest thing on the page (BE-450) */}
        {!thin && (
        <nav
          aria-label="เลือกวัน"
          className="sticky z-30 top-[calc(4rem+env(safe-area-inset-top))] sm:top-[calc(4.25rem+env(safe-area-inset-top))] -mx-4 px-4 sm:mx-0 sm:px-0 mt-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-100"
        >
          <ol className="flex gap-2 overflow-x-auto no-scrollbar">
            {days.map((day) => {
              const count = shownByDay[day.iso].length;
              const going = shownByDay[day.iso].some((item) => isMine(item.event.id));
              const label = (
                <>
                  <span className={`text-[13px] font-semibold leading-tight ${day.weekend ? 'text-[#C2410C]' : count ? 'text-slate-900' : ''}`}>{day.short}</span>
                  {/* "ว่าง" read as "you are free"; the day simply has nothing yet (owner 2026-11-21) */}
                  <span className="text-[11px] leading-tight text-slate-500 tabular-nums">{count ? `${count} อย่าง` : 'ยังไม่มี'}</span>
                  {/* A day the member already goes to something (BE-449) */}
                  {going && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F26430]" aria-hidden="true" />}
                </>
              );
              const box = 'relative flex flex-col items-center justify-center min-w-[64px] h-14 px-3 rounded-2xl border';
              return (
                <li key={day.iso} className="shrink-0">
                  {count ? (
                    <a href={`#day-${day.iso}`} aria-label={going ? `${day.short} ${count} อย่าง มีที่คุณไปด้วย` : undefined} className={`${box} border-slate-200 bg-white hover:border-slate-400 transition-colors`}>
                      {label}
                    </a>
                  ) : (
                    // Nothing to jump to: an empty day is a plain chip, not a link to a blank line
                    <span className={`${box} border-transparent bg-slate-50 text-slate-500`}>{label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        )}

        <div className="mt-6 space-y-10">
          {friends.length > 0 && <FriendsSection items={friends} />}

          {/* The member's own challenges live in My Hub (BE-449, owner 2026-11-21): here one line says they are waiting */}
          {myQuests.length > 0 && (
            <Link href="/myhub?tab=quests" className="group flex items-center gap-3 rounded-2xl bg-[#F5F3FF] px-4 py-3 max-w-2xl">
              <Trophy className="w-5 h-5 shrink-0 text-[#7C3AED]" aria-hidden="true" />
              <span className="flex-1 min-w-0 text-sm text-slate-800">
                คุณมีชาเลนจ์ที่ทำอยู่ <b className="font-semibold">{myQuests.length} อย่าง</b> ออกไปสัปดาห์นี้แล้วนับได้เลย
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] group-hover:underline whitespace-nowrap">
                ดูใน MyHub
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
          )}

          {thin ? (
            <>
              {/* The whole week in one row; each tile says its day */}
              <section aria-labelledby="this-week-all" className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="this-week-all" className="text-lg sm:text-xl font-bold text-slate-900">
                    {weekItems.length ? `7 วันนี้มี ${weekItems.length} อย่าง` : '7 วันนี้'}
                  </h2>
                  <Link href={createHref()} className="shrink-0 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                    ตั้งตี้เอง
                  </Link>
                </div>
                {/* Said plainly when a picked province has little, before showing what is near (BE-450) */}
                {province !== ALL_PROVINCES && (
                  <p className="text-sm text-slate-600">
                    {weekItems.length ? `ใน${province}ยังมีไม่มาก ` : `ใน${province}ยังไม่มีตี้หรืออีเวนต์ 7 วันนี้ `}
                    ด้านล่างมีที่เที่ยว ชาเลนจ์{nearby?.items.length ? ` และ${nearby.title.replace(/^ที่อื่น/, 'กิจกรรม')}` : ''}ให้เลือก
                  </p>
                )}
                {weekItems.length > 0 ? (
                  <ScrollRow as="ul" className={ROW} label="7 วันนี้">
                    {weekItems.map((item) => eventTile(item, item.day.name))}
                  </ScrollRow>
                ) : (
                  province === ALL_PROVINCES && <p className="text-sm text-slate-500">ยังไม่มีตี้หรืออีเวนต์ 7 วันนี้</p>
                )}
              </section>
              {ongoingSection}
              {laterSection}
              {placesSection}
              {questsSection}
              {nearbySection}
            </>
          ) : (
            <>
          {weekBlocks.map((block) => {
            if (block.empty) {
              // Days in a row with nothing fold into one line (owner 2026-11-21), so a quiet week stays short; a day
              // with nothing invites to make a ตี้ on it, the form opening on that day (BE-450, owner 2026-11-21)
              const range = block.days.length === 1 ? block.days[0].name : `${block.days[0].name} – ${block.days[block.days.length - 1].name}`;
              return (
                <section key={block.days[0].iso} aria-labelledby={`h-${block.days[0].iso}`} className="flex flex-wrap items-baseline gap-x-2">
                  <h2 id={`h-${block.days[0].iso}`} className="text-base font-semibold text-slate-500">{range}</h2>
                  <p className="text-sm text-slate-500">ยังไม่มีกิจกรรม</p>
                  <Link href={createHref(block.days[0].iso)} className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                    {block.days.length === 1 ? 'ตั้งตี้วันนั้น' : `ตั้งตี้${/^(วันนี้|พรุ่งนี้)$/.test(block.days[0].name) ? block.days[0].name : `วัน${block.days[0].name}`}`}
                  </Link>
                </section>
              );
            }
            const day = block.days[0];
            const items = shownByDay[day.iso];
            const tees = items.filter((item) => item.kind === 'tee').length;
            const fairs = items.length - tees;
            return (
              <section key={day.iso} id={`day-${day.iso}`} aria-labelledby={`h-${day.iso}`} className="scroll-mt-40 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id={`h-${day.iso}`} className={`text-lg sm:text-xl font-bold ${day.weekend ? 'text-[#C2410C]' : 'text-slate-900'}`}>{day.heading}</h2>
                  {items.length > 0 && (
                    <span className="shrink-0 text-sm text-slate-500">
                      {[tees ? `${tees} ตี้` : '', fairs ? `${fairs} อีเวนต์` : ''].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
                <ScrollRow as="ul" className={ROW} label={`สิ่งที่มี${day.name}`}>
                  {items.map((item) => eventTile(item))}
                </ScrollRow>
              </section>
            );
          })}
              {ongoingSection}
              {placesSection}
              {questsSection}
            </>
          )}

          <CreateNudge />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          setIsAuthModalOpen(false);
          setToast(`ยินดีต้อนรับ ${name}`);
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
        }}
      />
      {inviteFor && (
        <InviteSheet
          target={{ type: 'spot', id: inviteFor.id }}
          place={inviteFor.title}
          onClose={() => setInviteFor(null)}
          onDone={(message) => {
            setInviteFor(null);
            setToast(message);
          }}
        />
      )}
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} />
      <Toast message={toast} />
    </div>
  );
}

function SectionHead({ id, title, href, more }: { id: string; title: string; href: string; more: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
      <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
        {more}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

/** "เพื่อนๆ จะไปกัน": ตี้ people the member follows joined (lib/thisWeekFriends.ts); the member's own plans are in My Hub */
function FriendsSection({ items }: { items: WeekFriendItem[] }) {
  return (
    <section aria-labelledby="this-week-friends" className="space-y-1">
      <h2 id="this-week-friends" className="text-lg sm:text-xl font-bold text-slate-900">เพื่อนๆ จะไปกัน</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
        {items.map((item) => (
          <li key={`${item.kind}:${item.id}`}>
            <Link href={item.href} className="group flex items-center gap-3 py-3 border-b border-slate-100">
              <span className="flex shrink-0" aria-hidden="true">
                {item.people.map((person, i) =>
                  person.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
                    <img key={person.id} src={avatarImage(person.avatar)} alt="" className={`w-9 h-9 rounded-full object-cover border-2 border-white bg-slate-100 ${i ? '-ml-3' : ''}`} />
                  ) : (
                    <span key={person.id} className={`w-9 h-9 rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center ${i ? '-ml-3' : ''}`}>{nameInitial(person.name)}</span>
                  )
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-slate-800 leading-snug">
                  <b className="font-semibold">{item.people.map((p) => p.name).join(item.more === 0 && item.people.length === 2 ? ' และ ' : ' ')}</b>
                  {item.more > 0 ? ` และอีก ${item.more} คน` : ''} ไป <span className="group-hover:underline">{item.title}</span>
                </span>
                <span className="block mt-0.5 text-xs text-slate-500">{item.when}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** When nothing fits: make a ตี้ (the pillar's orange create button, DESIGN_SYSTEM exception) or pick a place to go with friends */
function CreateNudge() {
  return (
    <section className="max-w-2xl rounded-3xl bg-[#FFF8F1] p-5 sm:p-6 space-y-3">
      <h2 className="text-base font-bold text-slate-900">ยังไม่เจอที่ชอบ?</h2>
      <p className="text-sm text-slate-600 leading-relaxed">ตั้งตี้เองแล้วชวนเพื่อนมาด้วย หรือเลือกที่ที่อยากไปแล้วกด &quot;ชวนไป&quot; ให้แก๊ง</p>
      <div className="flex flex-wrap gap-2.5">
        <Link href="/community?create=1" className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-sm font-bold shadow-sm">
          <Plus className="w-4 h-4" aria-hidden="true" />
          ตั้งตี้เอง
        </Link>
        <Link href="/spots" className="inline-flex items-center h-11 px-5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-semibold">
          หาที่ไปกับเพื่อน
        </Link>
      </div>
    </section>
  );
}
