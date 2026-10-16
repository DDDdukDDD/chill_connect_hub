'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import Link from 'next/link';
import { MapPin, CheckCircle2, LayoutGrid } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { BrandLogo } from '@/components/BrandLogo';
import { EventGrid } from '@/components/EventGrid';
import { SpotCard, SpotCardSkeleton } from '@/components/SpotCard';
import { ChallengePicks } from '@/components/ChallengePicks';
import { FriendsMomentsWall } from '@/components/FriendsMomentsWall';
import { OpenMeetupTiles } from '@/components/OpenMeetupTiles';
import { MemberLiveHome } from '@/components/home/MemberLiveHome';
import { LiveJoinsLine } from '@/components/home/LiveActivity';
import { MomentSearchRow } from '@/components/home/MomentSearchRow';
import { SearchPanel } from '@/components/home/SearchPanel';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem, ChallengeQuest } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMyRewards } from '@/lib/useMyRewards';
import { useMyActivity } from '@/lib/useMyActivity';
import { useMemberSession } from '@/lib/useMemberSession';
import { REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { usePublishedSpots, getCachedSpotSearchText, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import { getCommunityEventCategory, MASTER_77_PROVINCES, type SpotVibeId } from '@/data/masterHub';
import { matchSearchQuery } from '@/lib/searchUtils';
import { isTradeEvent } from '@/lib/highlights';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { TOP_DESTINATIONS } from '@/components/TopDestinationsRail';

const ROW_SIZE = 5;
const CONTAINER = 'max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8';

// Order of the vibes in the places row: what the audience looks for on a day off comes first
const VIBE_ORDER: SpotVibeId[] = ['cafe_slowbar', 'nature_camping', 'art_creative', 'sea_island', 'mountain_mist', 'wellness_retreat', 'oldtown_culture'];


// Photos for the hero collage and the join block (local files, shown on /spots too)
// Province picker in the hero search box: popular ones first, then all 77 (names as stored on events and places)
const POPULAR_PROVINCES = ['กรุงเทพฯ', 'เชียงใหม่', 'ชลบุรี', 'ภูเก็ต', 'นครราชสีมา', 'กาญจนบุรี'];
const OTHER_PROVINCES = MASTER_77_PROVINCES.filter((p) => !POPULAR_PROVINCES.includes(p));
const isBangkok = (p: string) => p === 'กรุงเทพฯ' || p === 'กรุงเทพมหานคร';
const isSameProvince = (a: string | undefined, b: string) => !!a && (a === b || (isBangkok(a) && isBangkok(b)));

const HERO_PHOTOS = ['/event-board-games.png', '/hero-bkk-community-golden.jpg', '/event-city-run.png'];

// Short names for the reason under a suggested meetup ("เพราะคุณชอบสายคาเฟ่")
const CATEGORY_SHORT: Record<string, string> = {
  running_fitness: 'สายวิ่ง',
  wellness_mind: 'สายฮีลใจ',
  cafe_social: 'สายคาเฟ่',
  boardgames_party: 'สายบอร์ดเกม',
  arts_crafts: 'สายศิลปะ',
  travel_outdoor: 'สายเที่ยว',
  tech_skills: 'สายเรียนรู้',
  pets_family: 'สายสัตว์เลี้ยง',
};

// White label pinned to a hero collage photo; the numbers tell the loop in order
const HERO_LABEL = 'absolute z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white pl-1.5 pr-3 py-1 text-xs lg:text-sm font-semibold text-slate-900 shadow-md';
const HERO_STEPS = ['หากิจกรรมที่ใช่', 'ไปกับเพื่อนใหม่', 'แบ่งปันเรื่องราว'];

// Searches offered in the header search window
const QUICK_SEARCHES = ['คาเฟ่', 'วิ่ง', 'บอร์ดเกม', 'เดินป่า', 'ทะเล'];

// Small round photos standing in for the people, beside the live line and in the sign-up band
const photoFaces = (size: string, ring: string) => (
  <span className="flex -space-x-2 shrink-0" aria-hidden="true">
    {HERO_PHOTOS.map((src) => (
      <img key={src} src={src} alt="" className={`${size} rounded-full object-cover border-2 ${ring}`} />
    ))}
  </span>
);

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FAIR_KIND_LABEL = { fair: 'งานแฟร์', run: 'งานวิ่ง', concert: 'คอนเสิร์ต' } as const;

// Provinces shown in "สายเที่ยว สายชิล ไปไหนดี?"
const DESTINATION_IDS = ['bkk', 'chiangmai', 'chonburi', 'khaoyai', 'krabi', 'nan'];

// The kinds named in the home page fair heading, and how many fairs that row shows
const FAIR_ROW_KINDS = ['fair', 'run', 'concert'] as const;
const FAIR_ROW_SHOWN = 4;
const fairKind = (e: EventItem): (typeof FAIR_ROW_KINDS)[number] => {
  const text = `${e.title} ${e.tag}`;
  if (/วิ่ง|มาราธอน|เทรล|marathon|run|trail/i.test(text)) return 'run';
  if (/คอนเสิร์ต|ดนตรีสด|concert|live music/i.test(text)) return 'concert';
  return 'fair';
};

const eventSearchText = (e: EventItem) =>
  `${e.title} ${e.description} ${e.tag} ${e.location} ${e.hostName || ''} ${e.province || ''}`.toLowerCase();

// "12 ต.ค. – 18 ต.ค." for a fair, years left out
const fairDates = (e: EventItem) => {
  const short = (d: string) => d.replace(/\s*\d{4}$/, '');
  return e.endDate && e.endDate !== e.date ? `${short(e.date)} – ${short(e.endDate)}` : short(e.date);
};

// Each kind, soonest first; ended events never show on the homepage
const upcomingByDate = (events: EventItem[], type: 'community' | 'public_venue') =>
  events
    .filter((e) => (e.eventType || 'community') === type && !isEventEnded(e))
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));

// Same test the server applies in lib/social/spotTrips.ts (spotAllowsMeetups)
const allowsMeetups = (spot: LifestyleSpotItem) =>
  spot.meetupAllowed === true && spot.category !== 'bar' && spot.publicationStatus !== 'draft';

function JourneyContent() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isEventsLoaded, setIsEventsLoaded] = useState(false);
  const [questList, setQuestList] = useState<ChallengeQuest[]>([]);
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(false);
  const { spots: liveSpots, isLoaded: isSpotsLoaded } = usePublishedSpots();
  const spotsList = useMemo(() => (liveSpots.length > 0 ? liveSpots : isSpotsLoaded ? MOCK_SPOTS : []), [liveSpots, isSpotsLoaded]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const query = useDeferredValue(searchQuery.trim());
  // Province picked at the end of the hero search box; empty means every province
  const [province, setProvince] = useState('');
  const searching = Boolean(query || province);
  const inProvince = (p?: string) => !province || isSameProvince(p, province);

  // Landing page: the header search window, and the two filters over the meetup row
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [meetupCategory, setMeetupCategory] = useState('all');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // Joined challenges and their progress come from the account, as on /challenges
  const myRewards = useMyRewards(isLoggedIn);
  // Signed in, the page is the member's own home (greeting, what is next, picks for them) instead of the landing page
  const isMember = isAuthReady && isLoggedIn;
  const sessionMember = useMemberSession().member;
  const activity = useMyActivity();
  const [now] = useState(() => Date.now());
  const [likedCategories, setLikedCategories] = useState<string[]>([]);
  useEffect(() => {
    if (!isMember) return;
    let alive = true;
    fetch('/api/auth/member/preferences', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive) setLikedCategories(json?.preferences?.interests?.communityCategories ?? []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isMember]);

  // "/" opens the search window on the landing page, as on most sites
  useEffect(() => {
    if (isMember) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== '/' || /INPUT|SELECT|TEXTAREA/.test(target?.tagName ?? '') || target?.isContentEditable) return;
      e.preventDefault();
      setIsSearchOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMember]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with runtime DB and localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('favorite_events');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
      const storedSpotFavs = localStorage.getItem('favorite_spots');
      if (storedSpotFavs) setFavoriteSpots(JSON.parse(storedSpotFavs));
    } catch {}

    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (isActive) setQuestList(quests);
      })
      .catch((err) => console.warn('Journey challenges:', err))
      .finally(() => {
        if (isActive) setIsQuestsLoaded(true);
      });

    fetchAllContentPages<EventItem>('/api/events', 'events')
      .then((events) => {
        if (isActive) setEventsList(events.length > 0 ? events : MOCK_EVENTS);
      })
      .catch((err) => {
        console.warn('Journey events fallback:', err);
        if (isActive) setEventsList(MOCK_EVENTS);
      })
      .finally(() => {
        if (isActive) setIsEventsLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const triggerMembershipPrompt = (actionTitle: string) => {
    setMembershipActionTitle(actionTitle);
    setIsRequireMembershipOpen(true);
  };

  const openCreateMeetup = () => {
    if (!isLoggedIn) triggerMembershipPrompt('เพื่อตั้งตี้ใหม่');
    else setIsCreateEventModalOpen(true);
  };

  const toggleFavoriteEvent = (eventId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกกิจกรรมนี้ไว้ในรายการโปรด');
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      const updated = isFav ? prev.filter((id) => id !== eventId) : [...prev, eventId];
      showToast(isFav ? 'ลบออกจากรายการโปรดแล้ว' : 'เพิ่มเข้ารายการโปรดแล้ว');
      try {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
      return;
    }
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      const updated = isFav ? prev.filter((id) => id !== spotId) : [...prev, spotId];
      showToast(isFav ? 'ลบสถานที่ออกจากรายการโปรดแล้ว' : 'บันทึกสถานที่โปรดแล้ว');
      try {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const communityEvents = useMemo(() => upcomingByDate(eventsList, 'community'), [eventsList]);
  const fairEvents = useMemo(() => upcomingByDate(eventsList, 'public_venue'), [eventsList]);

  const rankedSpots = useMemo(
    () =>
      [...spotsList].sort((a, b) => {
        const scoreA = (a.popularity || 0) + (a.rating > 0 ? a.rating * 200 : 0);
        const scoreB = (b.popularity || 0) + (b.rating > 0 ? b.rating * 200 : 0);
        return scoreB - scoreA;
      }),
    [spotsList]
  );

  // One place per vibe in turn, places open for meet-ups first
  const featuredSpots = useMemo(() => {
    const byVibe = new Map<SpotVibeId, LifestyleSpotItem[]>(VIBE_ORDER.map((vibe) => [vibe, []]));
    for (const spot of rankedSpots) byVibe.get(getCachedSpotVibeCategory(spot))?.push(spot);
    const queues = VIBE_ORDER.map((vibe) => {
      const list = byVibe.get(vibe) || [];
      return [...list.filter(allowsMeetups), ...list.filter((s) => !allowsMeetups(s))];
    });
    const picked: LifestyleSpotItem[] = [];
    for (let round = 0; picked.length < ROW_SIZE && queues.some((q) => q.length > round); round++) {
      for (const queue of queues) {
        if (queue[round] && picked.length < ROW_SIZE) picked.push(queue[round]);
      }
    }
    return picked;
  }, [rankedSpots]);

  // One search box covers meetups, places and fairs; the full pages keep the detailed filters
  const spotRow = useMemo(
    () =>
      searching
        ? rankedSpots.filter((s) => inProvince(s.province) && (!query || matchSearchQuery(getCachedSpotSearchText(s), query))).slice(0, ROW_SIZE)
        : featuredSpots,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rankedSpots, featuredSpots, query, province]
  );
  const communityRow = useMemo(
    () =>
      communityEvents
        .filter((e) => e.participantsCount < e.maxParticipants)
        .filter((e) => inProvince(e.province) && (!query || matchSearchQuery(eventSearchText(e), query)))
        .slice(0, ROW_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [communityEvents, query, province]
  );
  const fairRow = useMemo(() => {
    const matched = fairEvents
      .filter((e) => inProvince(e.province) && (!query || matchSearchQuery(eventSearchText(e), query)))
      // Trade shows stay listed on /fairs but go last here (the sort keeps the date order within each group)
      .sort((a, b) => Number(isTradeEvent(a)) - Number(isTradeEvent(b)));
    if (searching) return matched.slice(0, ROW_SIZE);
    // The heading promises "งานแฟร์ งานวิ่ง งานคอน", so the row starts with the soonest of each kind, then fills by date
    const firsts = FAIR_ROW_KINDS.map((kind) => matched.find((e) => fairKind(e) === kind)).filter((e): e is EventItem => !!e);
    const picked = [...firsts, ...matched.filter((e) => !firsts.includes(e))].slice(0, FAIR_ROW_SHOWN);
    return matched.filter((e) => picked.includes(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fairEvents, query, province]);

  // Member home: the next meetup or fair they go to or host, and the challenge in progress that closes first
  const nextEvent = useMemo(
    () =>
      [...activity.joined, ...activity.hosted]
        .filter((e) => !isEventEnded(e))
        .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date))[0] ?? null,
    [activity.joined, activity.hosted]
  );
  const challengeNow = useMemo(() => {
    const doing = myRewards.quests.flatMap((progress) => {
      const quest = questList.find((q) => q.id === progress.questId);
      if (!progress.joined || progress.completed || !quest) return [];
      if (quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0)) return [];
      return [{ quest, progress }];
    });
    return doing.sort((a, b) => (a.quest.daysRemaining ?? 999) - (b.quest.daysRemaining ?? 999))[0] ?? null;
  }, [myRewards.quests, questList]);
  const redeemable = REWARD_SHOP_ITEMS.filter((item) => !myRewards.redeemedRewardIds.includes(item.id) && item.costXp <= myRewards.balance).length;

  // Member home: open meetups they have not joined, the categories they picked at onboarding first, each with its reason
  const memberMeetups = useMemo(() => {
    const mine = new Set([...activity.joinedIds, ...activity.hosted.map((e) => e.id)]);
    const open = communityEvents.filter((e) => e.participantsCount < e.maxParticipants && !mine.has(e.id));
    const liked = open.filter((e) => likedCategories.includes(getCommunityEventCategory(e)));
    const row = [...liked, ...open.filter((e) => !liked.includes(e))].slice(0, ROW_SIZE);
    const reasons: Record<string, string> = {};
    for (const event of row) {
      const cat = COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === getCommunityEventCategory(event));
      if (cat && likedCategories.includes(cat.id)) reasons[event.id] = `เพราะคุณชอบ${CATEGORY_SHORT[cat.id] ?? cat.name}`;
    }
    return { row, reasons };
  }, [communityEvents, activity.joinedIds, activity.hosted, likedCategories]);

  // Member home: running challenges the member has not joined, the ones most people are doing first
  const othersQuests = useMemo(
    () =>
      questList
        .filter((q) => q.status !== 'ended' && (q.daysRemaining === undefined || q.daysRemaining > 0) && !myRewards.joinedQuestIds.includes(q.id))
        .sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0)),
    [questList, myRewards.joinedQuestIds]
  );

  // Landing page: open meetups (seats left), counted per category card, and the row the cards filter
  const openMeetups = useMemo(() => communityEvents.filter((e) => e.participantsCount < e.maxParticipants), [communityEvents]);
  const categoryCards = useMemo(
    () => [
      { id: 'all', name: 'ทั้งหมด', Icon: LayoutGrid, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', borderBottom: 'border-b-slate-300', sticker: 'bg-slate-500 text-white', count: openMeetups.length },
      ...COMMUNITY_LIFESTYLE_CATEGORIES.map((cat) => ({
        id: cat.id,
        name: cat.name,
        Icon: cat.icon,
        iconBg: cat.colorScheme.iconBg,
        iconColor: cat.colorScheme.iconColor,
        borderBottom: cat.colorScheme.borderBottom,
        sticker: cat.colorScheme.activeBg,
        count: openMeetups.filter((e) => getCommunityEventCategory(e) === cat.id).length,
      })),
    ],
    [openMeetups]
  );
  const landingMeetups = useMemo(
    () => openMeetups.filter((e) => meetupCategory === 'all' || getCommunityEventCategory(e) === meetupCategory).slice(0, ROW_SIZE),
    [openMeetups, meetupCategory]
  );
  const meetupsHref = (() => {
    const params = new URLSearchParams();
    if (meetupCategory !== 'all') params.set('category', meetupCategory);
    return params.size ? `/community?${params}` : '/community';
  })();

  const destinations = DESTINATION_IDS.flatMap((id) => TOP_DESTINATIONS.filter((d) => d.id === id));

  const withQuery = (path: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (province) params.set('province', province);
    return params.size ? `${path}?${params}` : path;
  };

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });

  const heroStep = (i: number) => (
    <>
      <span className="w-5 h-5 shrink-0 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
      {HERO_STEPS[i]}
    </>
  );

  // Every section opens the same way: a heading and an ink "ดูทั้งหมด →"
  const sectionHead = (title: string, href: string, extra?: React.ReactNode, linkLabel: React.ReactNode = 'ดูทั้งหมด') => (
    <div className="flex items-center justify-between gap-3">
      <h2 className="min-w-0 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <div className="flex items-center gap-3 shrink-0">
        {extra}
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:underline underline-offset-4 whitespace-nowrap">
          {linkLabel}
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );

  const rowSkeleton = (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: ROW_SIZE }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-slate-100" />
      ))}
    </div>
  );

  const eventRow = (events: EventItem[]) =>
    !isEventsLoaded ? (
      rowSkeleton
    ) : (
      <EventGrid
        events={events}
        responsiveLimit={{ mobile: 4, desktop: ROW_SIZE }}
        columns={5}
        layout="carousel"
        onSelectEvent={() => { }}
        favorites={isLoggedIn ? favorites : []}
        toggleFavorite={toggleFavoriteEvent}
        onResetFilters={() => setSearchQuery('')}
      />
    );

  const spotCards = !isSpotsLoaded ? (
    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: ROW_SIZE }).map((_, i) => (
        <SpotCardSkeleton key={i} />
      ))}
    </div>
  ) : spotRow.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
      ไม่พบที่เที่ยวที่ตรงกับคำค้นหา
    </p>
  ) : (
    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {spotRow.map((spot) => (
        // On phones the row scrolls sideways, like the event rows
        <div key={spot.id} className="h-full w-[62%] shrink-0 snap-start sm:w-auto">
          <SpotCard spot={spot} isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)} onToggleFavorite={toggleFavoriteSpot} />
        </div>
      ))}
    </div>
  );


  // A search shows its matches in three rows; the story of the page comes back when it is cleared
  const searchResults = (
    <div className="space-y-10 sm:space-y-14">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600 min-w-0 truncate">
          ผลการค้นหา <strong className="font-bold text-slate-900">{[query, province].filter(Boolean).join(' · ')}</strong>
        </p>
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setProvince(''); }}
          className="shrink-0 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
        >
          ล้างคำค้นหา
        </button>
      </div>
      <section className="space-y-4">
        {sectionHead('ตี้ที่เปิดรับอยู่', withQuery('/community'))}
        {eventRow(communityRow)}
      </section>
      <section className="space-y-4">
        {sectionHead('ที่เที่ยว', withQuery('/spots'))}
        {spotCards}
      </section>
      <section className="space-y-4">
        {sectionHead('งานแฟร์ & นิทรรศการ', withQuery('/fairs'))}
        {eventRow(fairRow)}
      </section>
      <section className="space-y-4">
        {sectionHead('โมเมนต์', '/moments')}
        <MomentSearchRow query={query || province} />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => openAuth('login')}
        onOpenSignup={() => openAuth('signup')}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={openCreateMeetup}
        onOpenSearch={isMember ? undefined : () => setIsSearchOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-slate-700 animate-slide-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 pb-28 sm:pb-16">
        {isMember ? (
          <MemberLiveHome
            name={sessionMember?.displayName ?? 'เพื่อน'}
            avatar={sessionMember?.avatarUrl}
            now={now}
            xp={myRewards.balance}
            badges={myRewards.finished.length}
            redeemable={redeemable}
            nextEvent={nextEvent}
            challenge={challengeNow}
            challengesDoing={myRewards.quests.filter((p) => p.joined && !p.completed).length}
            savedCount={favorites.length + favoriteSpots.length}
            likedCategories={likedCategories}
            isLoaded={activity.isLoaded && myRewards.isLoaded && isQuestsLoaded}
            meetups={memberMeetups.row}
            reasons={memberMeetups.reasons}
            isEventsLoaded={isEventsLoaded}
            quests={othersQuests}
            fairs={fairRow}
            fairWhen={fairDates}
            spots={featuredSpots}
            isSpotsLoaded={isSpotsLoaded}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={query ? searchResults : null}
          />
        ) : (
          /* 1. Hero: the collage tells the loop in three numbered steps, the words say what the site is, one orange button */
          <section className="relative overflow-hidden bg-[#FFF8F1]">
            <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#FFE7D6]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-40 -right-28 w-80 h-80 rounded-full bg-[#E3EDFF]" aria-hidden="true" />
            <div className={`relative ${CONTAINER} pt-5 pb-7 md:py-10 grid md:grid-cols-[1fr_1.05fr] gap-5 md:gap-10 items-center`}>
              <div className="relative h-[210px] md:h-[260px] lg:h-[300px] w-full max-w-[340px] md:max-w-[500px] mx-auto" aria-hidden="true">
                <figure className="absolute left-[3%] top-[6%] w-[46%] h-[80%]">
                  <img src={HERO_PHOTOS[0]} alt="" className="-rotate-3 w-full h-full object-cover rounded-[1.75rem] lg:rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 left-1/2 -translate-x-1/2`}>{heroStep(0)}</span>
                </figure>
                <figure className="absolute right-[8%] top-0 w-[36%] aspect-square">
                  <img src={HERO_PHOTOS[1]} alt="" className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} top-[10%] -left-[40%]`}>{heroStep(1)}</span>
                </figure>
                <figure className="absolute right-0 bottom-[2%] w-[44%] h-[44%]">
                  <img src={HERO_PHOTOS[2]} alt="" className="rotate-3 w-full h-full object-cover rounded-[1.75rem] lg:rounded-[2rem] shadow-lg border-4 border-white" />
                  <span className={`${HERO_LABEL} -bottom-3 right-3.5`}>{heroStep(2)}</span>
                </figure>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-[29px] leading-[1.3] sm:text-[36px] lg:text-[44px] lg:leading-[1.22] font-bold text-slate-900 tracking-tight">
                  คอมมูนิตี้ของคน
                  <br />
                  ชอบ<span className="text-[#F26430]">ออกไปใช้ชีวิต</span>
                </h1>
                <p className="mt-3 text-[15px] sm:text-lg lg:text-xl font-semibold text-slate-700">
                  พบเจอมิตรภาพใหม่ <span className="whitespace-nowrap">ส่งต่อความประทับใจ</span>
                </p>
                <button
                  type="button"
                  onClick={() => scrollToId('journey-meetups')}
                  className="mt-5 lg:mt-6 w-full sm:w-auto h-13 px-8 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-base lg:text-[17px] font-semibold shadow-[0_8px_20px_rgba(242,100,48,0.28)] whitespace-nowrap cursor-pointer transition-colors"
                >
                  ดูตี้ที่เปิดรับอยู่
                </button>
                {/* Signs of life without names, and the one thing a visitor worries about first */}
                <div className="mt-5 lg:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-[13px] sm:text-sm text-slate-700">
                  <LiveJoinsLine faces={photoFaces('w-6 h-6', 'border-[#FFF8F1]')} />
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-700" aria-hidden="true" />
                    สมัครฟรี ไม่มีค่าใช้จ่าย
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Members get their own home above (MemberLiveHome); the rest is the landing page for visitors.
            A search from the header window shows its matches in place of the landing sections. */}
        {!isMember && searching && (
          <div id="journey-top" className={`${CONTAINER} pt-8 sm:pt-12 scroll-mt-20`}>
            {searchResults}
          </div>
        )}

        {!isMember && !searching && (
          <>
            <div id="journey-top" className={`${CONTAINER} pt-8 sm:pt-12 space-y-12 sm:space-y-16 scroll-mt-20`}>
              {/* 2. Meetups, picked by the category cards; company is offered, never required */}
              <section id="journey-meetups" className="space-y-4 scroll-mt-24">
                {sectionHead('เลือกกิจกรรมตามสายที่ชอบ', meetupsHref)}

                {/* The category cards filter the row right below; a phone scrolls them sideways */}
                <div role="group" aria-label="เลือกสาย" className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pt-3 pb-2 md:grid md:grid-cols-5 lg:grid-cols-9 md:gap-3 md:mx-0 md:px-0 md:overflow-visible">
                  {categoryCards.map(({ id, name, Icon, iconBg, iconColor, borderBottom, sticker, count }, i) => {
                    const isPicked = meetupCategory === id;
                    const isDimmed = meetupCategory !== 'all' && !isPicked;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={isPicked}
                        onClick={() => setMeetupCategory(id)}
                        aria-label={count > 0 ? `${name} ${count} ตี้เปิดรับ` : name}
                        className={`group relative w-24 shrink-0 md:w-auto flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 ${borderBottom} px-1 py-3 sm:py-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 ${isPicked ? 'bg-slate-50 border-x-slate-200 border-t-slate-200 -translate-y-1 shadow-lg' : 'bg-white border-x-slate-100 border-t-slate-100'} ${isDimmed ? 'opacity-60 hover:opacity-100' : ''}`}
                      >
                        {/* The count sits on the corner like a sticker, so the card keeps its size */}
                        {count > 0 && (
                          <span className={`absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full border-2 border-white text-[11px] font-bold flex items-center justify-center shadow-sm rotate-12 group-hover:rotate-0 transition-transform ${sticker}`} aria-hidden="true">
                            {count}
                          </span>
                        )}
                        <span className={`w-11 h-11 md:w-[54px] md:h-[54px] rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} ${isPicked ? 'scale-110' : i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 md:w-7 md:h-7" aria-hidden="true" />
                        </span>
                        {/* Break only at the ampersand, never inside a Thai word */}
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-tight">
                          {name.split(' & ').map((part, j, all) => (
                            <span key={part} className="block whitespace-nowrap">
                              {part}
                              {j < all.length - 1 ? ' &' : ''}
                            </span>
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isEventsLoaded && landingMeetups.length === 0 && (
                  <p className="text-sm text-slate-500">ยังไม่มีตี้แบบนี้ เปิดตี้แรกเองเลยไหม?</p>
                )}
                <OpenMeetupTiles
                  events={landingMeetups}
                  isLoaded={isEventsLoaded}
                  onCreate={openCreateMeetup}
                  savedIds={isLoggedIn ? favorites : []}
                  onToggleSave={toggleFavoriteEvent}
                />
              </section>

              {/* 3. A reason to go */}
              <section id="journey-challenges" className="space-y-4 scroll-mt-24">
                {sectionHead('ชาเลนจ์สนุก แนะนำสำหรับคุณ', '/challenges')}
                <ChallengePicks
                  quests={questList}
                  joinedIds={isLoggedIn ? myRewards.joinedQuestIds : []}
                  isLoaded={isQuestsLoaded}
                />
              </section>
            </div>

            {/* 4. Signed out only: the invitation to join, an open band across the page after the meetups and challenges */}
            {isAuthReady && !isLoggedIn && (
              <section className="mt-12 sm:mt-16 relative overflow-hidden bg-[#FFF8F1]">
                <div className="pointer-events-none absolute -right-16 -top-24 w-64 h-64 rounded-full bg-[#FFE7D6]" aria-hidden="true" />
                <div className={`relative ${CONTAINER} py-6 sm:py-7 grid md:grid-cols-[1fr_auto] gap-4 md:gap-10 items-center text-center md:text-left`}>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span className="hidden sm:block">{photoFaces('w-10 h-10', 'border-[#FFF8F1]')}</span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">สุดสัปดาห์นี้ ออกไปด้วยกันไหม?</h2>
                      <p className="mt-1 text-sm sm:text-[15px] text-slate-700">สมัครฟรี เข้าร่วมตี้ เก็บ XP แลกของรางวัล และแบ่งปันเรื่องราวของคุณ</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row-reverse items-center gap-2 md:gap-5">
                    <button
                      type="button"
                      onClick={() => openAuth('signup')}
                      className="w-full md:w-auto h-11 px-7 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-base font-semibold shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                    >
                      สมัครสมาชิกฟรี
                    </button>
                    <p className="text-[13px] text-slate-500">
                      มีบัญชีแล้ว?{' '}
                      <button type="button" onClick={() => openAuth('login')} className="font-semibold text-slate-900 underline underline-offset-2 cursor-pointer">
                        เข้าสู่ระบบ
                      </button>
                    </p>
                  </div>
                </div>
              </section>
            )}

            <div className={`${CONTAINER} pt-12 sm:pt-16 space-y-12 sm:space-y-16`}>
              {/* 5. Proof that people went, which makes the next person go */}
              <section id="journey-moments" className="space-y-4 scroll-mt-24">
                {sectionHead('เพื่อน & โมเมนต์', '/moments')}
                <FriendsMomentsWall />
              </section>

              {/* 6. Support: provinces to explore */}
              <section className="space-y-4">
                {sectionHead('สายเที่ยว สายชิล ไปไหนดี?', '/spots')}
                {/* Same size and row as the challenge picks: square photos, scrolling sideways until all six fit */}
                <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0">
                  {destinations.map((d) => (
                    <Link
                      key={d.id}
                      href={`/spots?province=${encodeURIComponent(d.provinceKey)}`}
                      className="group relative w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-5*24px)/6)] shrink-0 snap-start aspect-square rounded-3xl overflow-hidden bg-slate-200"
                    >
                      <img src={d.imageUrl} alt={d.nameTh} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-white text-sm sm:text-base font-bold leading-tight">{d.nameTh}</p>
                        <p className="text-white/80 text-[11px] sm:text-xs font-medium line-clamp-2 mt-0.5">{d.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/spots" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap transition-colors">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    ที่เที่ยวทั้งหมด{isSpotsLoaded ? ` ${spotsList.length.toLocaleString()} แห่ง` : ''}
                  </Link>
                </div>
              </section>

              {/* 7. Fairs, runs and concerts as a dated list, soonest first (trade shows last) */}
              {isEventsLoaded && fairRow.length > 0 && (
                <section className="space-y-4">
                  {sectionHead('งานแฟร์ งานวิ่ง งานคอน ช่วงนี้', '/fairs', undefined, <>ดูทั้งหมด<span className="hidden sm:inline"> {fairEvents.length.toLocaleString()} งาน</span></>)}
                  <div className="grid md:grid-cols-2 md:gap-x-10">
                    {fairRow.slice(0, FAIR_ROW_SHOWN).map((fair) => {
                      const start = new Date(parseEventDateToTimestamp(fair.date));
                      const isOn = start.getTime() <= now;
                      return (
                        <Link key={fair.id} href={`/fairs/${encodeURIComponent(fair.id)}`} className="group flex items-center gap-3.5 py-3 border-t border-slate-200">
                          <span className="w-12 shrink-0 text-center leading-tight text-[#2B527A]">
                            <span className="block text-[22px] font-bold">{start.getDate()}</span>
                            <span className="text-xs font-semibold">{THAI_MONTHS[start.getMonth()]}</span>
                          </span>
                          <img src={fair.image} alt="" loading="lazy" className="hidden sm:block w-32 h-[88px] shrink-0 rounded-xl object-cover bg-slate-200" />
                          <span className="flex-1 min-w-0 grid">
                            <span className="font-semibold text-slate-900 leading-snug truncate group-hover:underline">{fair.title}</span>
                            <span className="text-[13px] text-slate-500 truncate">
                              {/* Phones: the status leads the second line, so the title keeps the full width */}
                              <span className={`sm:hidden font-semibold ${isOn ? 'text-rose-600' : 'text-[#2B527A]'}`}>{isOn ? 'กำลังจัดอยู่' : 'เร็วๆ นี้'} · </span>
                              {FAIR_KIND_LABEL[fairKind(fair)]} · {fairDates(fair)} · {fair.location}
                            </span>
                          </span>
                          {/* A quiet status: a small dot and words, not a filled chip */}
                          <span className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${isOn ? 'text-rose-600' : 'text-[#2B527A]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-rose-500' : 'bg-[#2B527A]/50'}`} aria-hidden="true" />
                            {isOn ? 'กำลังจัดอยู่' : 'เร็วๆ นี้'}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        <div className={CONTAINER}>
          <footer className="border-t border-slate-200 pt-8 pb-4 text-center text-xs text-slate-500 space-y-2 mt-12 sm:mt-16 mb-16 md:mb-0">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
              <BrandLogo size="xs" />
              <span>Chill & Connect Hub</span>
            </div>
            <p className="font-medium text-slate-600">ทำให้ทุกการออกไปใช้ชีวิตมีความหมาย</p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-500 pt-1 flex-wrap">
              <Link href="/about" className="hover:text-slate-800 hover:underline">เกี่ยวกับเรา</Link>
              <span className="text-slate-300">•</span>
              <Link href="/safety" className="hover:text-slate-800 hover:underline">คู่มือความปลอดภัย</Link>
              <span className="text-slate-300">•</span>
              <Link href="/legal" className="hover:text-slate-800 hover:underline">ข้อตกลงการใช้งาน</Link>
              <span className="text-slate-300">•</span>
              <Link href="/legal?tab=privacy" className="hover:text-slate-800 hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </div>
            {isAuthReady && !isLoggedIn && (
              <p className="text-[13px] text-slate-500">
                พร้อมออกไปเมื่อไหร่{' '}
                <button type="button" onClick={() => openAuth('signup')} className="font-semibold text-slate-900 underline underline-offset-2 cursor-pointer">
                  สมัครฟรีได้เลย
                </button>
              </p>
            )}
            <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
          </footer>
        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={favorites.length} />

      {/* Global Modals */}
      {isSearchOpen && (
      <SearchPanel
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchQuery}
        initialProvince={province}
        popularProvinces={POPULAR_PROVINCES}
        otherProvinces={OTHER_PROVINCES}
        quickSearches={QUICK_SEARCHES}
        onSearch={(q, p) => {
          setSearchQuery(q);
          setProvince(p);
          setIsSearchOpen(false);
          requestAnimationFrame(() => scrollToId(q || p ? 'journey-top' : 'journey-meetups'));
        }}
      />
      )}

      <AuthModal
        key={authMode}
        initialMode={authMode}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          setIsAuthModalOpen(false);
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับมา');
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          setEventsList((prev) => [newEvent, ...prev]);
          setIsCreateEventModalOpen(false);
          showToast('ตั้งตี้ใหม่สำเร็จ');
        }}
        initialType="community"
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    }>
      <JourneyContent />
    </Suspense>
  );
}
