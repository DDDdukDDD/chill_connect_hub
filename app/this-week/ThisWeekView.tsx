'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Users } from 'lucide-react';
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
import { ALL_PROVINCES, discoverHref, eventInProvince } from '@/lib/discoverMatch';
import { avatarImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';
import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { WeekDay } from '@/lib/thisWeek';
import { WEEK_PLACES, WEEK_QUESTS } from '@/lib/thisWeekRules';
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

/**
 * สัปดาห์นี้ (owner 2026-11-19): the next 7 days as a schedule. The job: "I have a free day: what is on, and who is
 * going" answered at a glance. Friends first (the strongest reason to go), a day strip to jump to the free day, then
 * one row per day mixing ตี้ and อีเวนต์ in time order; empty days fold to one line that offers to make a ตี้. อีเวนต์
 * already running sit once in "กำลังจัดอยู่", challenges (no date) close the page as something for any free day.
 */
export default function ThisWeekView({ days, label, byDay, ongoing, quests, places: allPlaces }: {
  days: WeekDay[];
  label: string;
  byDay: Record<string, Item[]>;
  ongoing: EventItem[];
  /** Every open challenge, most people first */
  quests: ChallengeQuest[];
  /** "ที่น่าไปวันว่าง" for all of Thailand */
  places: LifestyleSpotItem[];
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

        {/* The day strip: tap a free day to jump to it; it stays under the top bar while the schedule scrolls */}
        <nav
          aria-label="เลือกวัน"
          className="sticky z-30 top-[calc(4rem+env(safe-area-inset-top))] sm:top-[calc(4.25rem+env(safe-area-inset-top))] -mx-4 px-4 sm:mx-0 sm:px-0 mt-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-100"
        >
          <ol className="flex gap-2 overflow-x-auto no-scrollbar">
            {days.map((day) => {
              const count = shownByDay[day.iso].length;
              return (
                <li key={day.iso} className="shrink-0">
                  <a
                    href={`#day-${day.iso}`}
                    className={`flex flex-col items-center justify-center min-w-[64px] h-14 px-3 rounded-2xl border transition-colors ${
                      count ? 'border-slate-200 bg-white hover:border-slate-400' : 'border-transparent bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className={`text-[13px] font-semibold leading-tight ${day.weekend ? 'text-[#C2410C]' : count ? 'text-slate-900' : ''}`}>{day.short}</span>
                    <span className="text-[11px] leading-tight text-slate-500 tabular-nums">{count ? `${count} อย่าง` : 'ว่าง'}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 space-y-10">
          {friends.length > 0 && <FriendsSection items={friends} />}

          {/* The member's own unfinished challenges: this week's to-do, a strong personal reason to go out (owner 2026-11-19) */}
          {myQuests.length > 0 && (
            <section aria-labelledby="this-week-mine" className="space-y-3">
              <SectionHead id="this-week-mine" title="ชาเลนจ์ที่คุณทำอยู่" href="/myhub" more="ดูของฉันทั้งหมด" />
              <ScrollRow as="ul" className={QUEST_ROW} label="ชาเลนจ์ที่คุณทำอยู่">
                {myQuests.map((quest, index) => (
                  <li key={quest.id} className={TILE}>
                    <ChallengeTile quest={quest} index={index} mine={progress.get(quest.id)} />
                  </li>
                ))}
              </ScrollRow>
            </section>
          )}

          {days.map((day) => {
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
                {items.length > 0 ? (
                  <ScrollRow as="ul" className={ROW} label={`สิ่งที่มี${day.name}`}>
                    {items.map((item) => (
                      <li key={item.event.id} className={TILE}>
                        {/* ตี้ and อีเวนต์ share a day row, so each says which it is, in its pillar's color as the tabs above (owner 2026-11-19) */}
                        <span className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${item.kind === 'tee' ? 'text-[#C2410C]' : 'text-[#2B527A]'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.kind === 'tee' ? 'bg-[#F26430]' : 'bg-[#2B527A]'}`} aria-hidden="true" />
                          {item.kind === 'tee' ? 'ตี้' : 'อีเวนต์'}
                        </span>
                        {item.kind === 'tee' ? <MeetupTile event={item.event} now={now} /> : <FairTile event={item.event} now={now} />}
                      </li>
                    ))}
                  </ScrollRow>
                ) : (
                  // Just the fact (owner 2026-11-19): making a ตี้ is offered once, in "ยังไม่เจอที่ชอบ?" at the end
                  <p className="text-sm text-slate-500">ยังไม่มีตี้{day.name === 'วันนี้' ? 'วันนี้' : `วัน${day.name}`}</p>
                )}
              </section>
            );
          })}

          {shownOngoing.length > 0 && (
            <section aria-labelledby="this-week-ongoing" className="space-y-3">
              <SectionHead id="this-week-ongoing" title="อีเวนต์ที่กำลังจัดอยู่" href="/events" more="ดูอีเวนต์ทั้งหมด" />
              <ScrollRow as="ul" className={ROW} label="อีเวนต์ที่กำลังจัดอยู่">
                {shownOngoing.map((event) => (
                  <li key={event.id} className={TILE}>
                    <FairTile event={event} now={now} />
                  </li>
                ))}
              </ScrollRow>
            </section>
          )}

          {places.length > 0 && (
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
          )}

          {popularQuests.length > 0 && (
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

/** "เพื่อนๆ จะไปกัน": ตี้ people the member follows joined, and the member's own "ไปกัน" plans (lib/thisWeekFriends.ts) */
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
                  {item.more > 0 ? ` และอีก ${item.more} คน` : ''} {item.kind === 'plan' ? 'ไปกันกับคุณ' : 'ไป'} <span className="group-hover:underline">{item.title}</span>
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
