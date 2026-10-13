'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MySubmissions } from '@/components/MySubmissions';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { useAuth } from '@/lib/useAuth';
import { ETicketModal } from '@/components/ETicketModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { TipHostModal } from '@/components/TipHostModal';
import { SpotBuddyGatheringModal, SpotBuddyPostItem } from '@/components/SpotBuddyGatheringModal';
import { ChallengeQuest, EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { syncMyChallenges, useMyRewards, withRealProgress } from '@/lib/useMyRewards';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMemberSession } from '@/lib/useMemberSession';
import { nameInitial, tidyDisplayName } from '@/lib/displayName';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { BrandLogo } from '@/components/BrandLogo';
import { LifestyleSpotItem } from '@/data/spotsData';
import { useSpotCatalog, getCachedSpotVibeCategory } from '@/lib/usePublishedSpots';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { formatSpotBadgePrice } from '@/components/SpotCard';
import {
  Users,
  Trophy,
  Gift,
  Calendar,
  MapPin,
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Crown,
  AlertTriangle,
  Flame,
  Coffee,
  Footprints,
  Medal,
  QrCode,
  CalendarDays,
  Check,
  Tag,
  BookOpen,
  Star,
  Compass,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  CheckCircle2,
  ListFilter,
  Award,
  Zap,
  LogIn,
  MoreHorizontal,
  Copy,
  ExternalLink,
  ShieldCheck,
  User,
  Share2,
  Ticket,
  Layers,
  Camera,
  X,
  AlertCircle,
  Search,
} from 'lucide-react';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

import {
  RewardShopItem,
  REWARD_SHOP_ITEMS,
} from '@/data/rewardsData';

// A date saved as "2026-10-12" reads like the rest of the page: "12 ต.ค. 2569"
function thaiShortDate(date?: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!iso) return date ?? '';
  return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MyHubContent() {
  const searchParams = useSearchParams();
  const [activeNavTab, setActiveNavTab] = useState('myhub');

  // 4 Core Lifestyle Tabs aligned with Platform Architecture
  const [activeSubTab, setActiveSubTab] = useState<'community' | 'trips' | 'fairs' | 'scrapbook' | 'quests_rewards'>('community');

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [storedChallenges, setMyChallenges] = useState<ChallengeQuest[]>([]);
  // Points, redeemed rewards and the progress of challenges that count visits come from the account (GET /api/rewards)
  const myRewards = useMyRewards(isLoggedIn);
  const userXp = myRewards.balance;
  const redeemedRewardIds = myRewards.redeemedRewardIds;
  const myChallenges = useMemo(() => withRealProgress(storedChallenges, myRewards.quests), [storedChallenges, myRewards.quests]);
  // The list is the challenges joined on the account, with the catalog's current details (GET /api/quests)
  const [questCatalog, setQuestCatalog] = useState<ChallengeQuest[] | null>(null);
  // Joined, still running and not finished: shown at the top so the member lands on what is left to do
  const doingChallenges = useMemo(
    () =>
      myRewards.quests.flatMap((progress) => {
        const quest = questCatalog?.find((entry) => entry.id === progress.questId);
        const isRunning = quest && quest.status !== 'ended' && (quest.daysRemaining === undefined || quest.daysRemaining > 0);
        return progress.joined && !progress.completed && isRunning ? [{ ...progress, daysRemaining: quest.daysRemaining }] : [];
      }),
    [myRewards.quests, questCatalog]
  );
  useEffect(() => {
    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (isActive) setQuestCatalog(quests);
      })
      .catch((error) => console.warn('Could not load challenges:', error));
    return () => {
      isActive = false;
    };
  }, []);
  useEffect(() => {
    if (!isLoggedIn) setMyChallenges([]);
    else if (myRewards.isLoaded && questCatalog) setMyChallenges(syncMyChallenges(myRewards.joinedQuestIds, questCatalog));
  }, [isLoggedIn, myRewards.isLoaded, myRewards.joinedQuestIds, questCatalog]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Travel Scrapbook state & quick filters
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);
  const [scrapbookSearch, setScrapbookSearch] = useState('');
  const [scrapbookVibeFilter, setScrapbookVibeFilter] = useState<string>('all');

  const [checkedInTicketIds, setCheckedInTicketIds] = useState<string[]>([]);

  // Joined Events & Sub-activities
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [joinedSubActivities, setJoinedSubActivities] = useState<Record<string, any>>({});

  // Main Dual Mode: Master Calendar by default as requested
  const [hubMainMode, setHubMainMode] = useState<'categories' | 'calendar' | 'hosting'>('calendar');
  // User Created Events (Host)
  const [userCreatedEvents, setUserCreatedEvents] = useState<EventItem[]>([]);
  // Master Calendar Category Layer Filter
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState<'all' | 'community' | 'fairs' | 'spots' | 'quests' | 'hosting'>('all');
  // View Mode: Cards List vs Calendar
  const [hubViewMode, setHubViewMode] = useState<'list' | 'calendar'>('list');
  // Upcoming vs Past Filter
  const [eventViewMode, setEventViewMode] = useState<'all' | 'upcoming' | 'past'>('all');
  // Past Events Sub-filter: all vs attended vs not_attended (missed or cancelled)
  const [pastSubFilter, setPastSubFilter] = useState<'all' | 'attended' | 'not_attended'>('all');
  // Past Events Tracking Lists: cancelled, missed, reviewed
  const [cancelledEventIds, setCancelledEventIds] = useState<string[]>([]);
  const [missedEventIds, setMissedEventIds] = useState<string[]>([]);
  const [reviewedEventIds, setReviewedEventIds] = useState<string[]>([]);

  // Calendar Navigation State
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(9); // 0 = Jan, 9 = Oct (October 2026)
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const [calendarTimeScope, setCalendarTimeScope] = useState<'month' | 'all'>('month');

  // Modals State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<EventItem | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('CCH-2026-0089');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTargetEvent, setChatTargetEvent] = useState<EventItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetEvent, setCancelTargetEvent] = useState<EventItem | null>(null);
  const [cancelTargetTicketId, setCancelTargetTicketId] = useState<string>('');
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTargetEvent, setTipTargetEvent] = useState<EventItem | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const router = useRouter();
  const [questStatusFilter, setQuestStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'expired'>('all');

  // Spot Buddy Gathering Modal from Scrapbook
  const [isSpotBuddyModalOpen, setIsSpotBuddyModalOpen] = useState(false);
  const [selectedSpotForBuddy, setSelectedSpotForBuddy] = useState<LifestyleSpotItem | null>(null);

  // Card Context Menu Active ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sync data from localStorage on mount & deep-linking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Joined, hosted, cancelled and saved items come from the account (see the effect below).
      // Still kept in this browser only: what the member marked as missed or already reviewed, and fair sub-groups.
      const storedMissed: string[] = JSON.parse(localStorage.getItem('myhub_missed_event_ids') || '[]');
      if (Array.isArray(storedMissed)) setMissedEventIds(storedMissed);
      const storedReviewed: string[] = JSON.parse(localStorage.getItem('myhub_reviewed_event_ids') || '[]');
      if (Array.isArray(storedReviewed)) setReviewedEventIds(storedReviewed);
      // Fair meet-up groups moved to the account; the old browser copy is dropped
      localStorage.removeItem('joinedSubActivities');
      localStorage.removeItem('joined_fair_sub_ids');



    } catch (e) {
      console.error('Error syncing localStorage in MyHub:', e);
    }
  }, []);

  // The account is the source of truth for what the member joined, hosts, cancelled and saved
  const activity = useMyActivity();
  const hubMember = useMemberSession().member;
  const hubName = tidyDisplayName(hubMember?.displayName ?? '');
  useEffect(() => {
    setJoinedEventIds([...activity.joinedIds, ...activity.cancelled.map((e) => e.id)]);
    setCancelledEventIds(activity.cancelled.map((e) => e.id));
    setUserCreatedEvents(activity.hosted);
    setSavedSpotIds(activity.savedSpotIds);
    setFavorites(activity.savedEventIds);
    setReviewedEventIds((prev) => Array.from(new Set([...prev, ...((activity as { reviewedEventIds?: string[] }).reviewedEventIds ?? [])])));
  }, [activity]);

  // On a phone the list of appointments is more useful than a month grid, so it opens first (a ?tab= link still wins)
  useEffect(() => {
    if (window.innerWidth < 640 && !searchParams.get('tab') && !searchParams.get('type')) setHubMainMode('categories');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  // Development only: fills or clears sample activity for the signed-in account (POST / DELETE /api/dev/demo)
  const [isDemoBusy, setIsDemoBusy] = useState(false);
  const runDemo = async (method: 'POST' | 'DELETE') => {
    setIsDemoBusy(true);
    const json = await fetch('/api/dev/demo', { method }).then((res) => res.json()).catch(() => null);
    setIsDemoBusy(false);
    if (!json?.success) return showToast(json?.message || 'ทำรายการไม่สำเร็จ');
    handleSetIsLoggedIn(true);
    await activityActions.refresh();
    showToast(method === 'POST' ? 'เติมข้อมูลตัวอย่างแล้ว' : 'ลบกิจกรรมตัวอย่างแล้ว');
  };

  // Host check-in: the people who joined one of the member's events
  type HostParticipant = { userId: string; userName: string; userAvatar: string; checkedInAt?: string; isHost: boolean };
  const [checkInEvent, setCheckInEvent] = useState<EventItem | null>(null);
  const [checkInList, setCheckInList] = useState<HostParticipant[] | null>(null);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInNote, setCheckInNote] = useState<{ ok: boolean; text: string } | null>(null);
  const loadCheckInList = async (eventId: string) => {
    const json = await fetch(`/api/events/${encodeURIComponent(eventId)}/participants`, { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
    setCheckInList(json?.participants ?? []);
  };
  const openCheckIn = (ev: EventItem) => {
    setCheckInEvent(ev);
    setCheckInList(null);
    setCheckInCode('');
    setCheckInNote(null);
    void loadCheckInList(ev.id);
  };
  const sendCheckIn = async (body: { action: 'check_in' | 'undo'; code?: string; userId?: string }) => {
    if (!checkInEvent) return;
    const res = await fetch(`/api/events/${encodeURIComponent(checkInEvent.id)}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) return setCheckInNote({ ok: false, text: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ' });
    setCheckInNote({ ok: true, text: body.action === 'undo' ? `ยกเลิกเช็กอินของ ${json.participant.userName} แล้ว` : `เช็กอิน ${json.participant.userName} แล้ว` });
    setCheckInCode('');
    void loadCheckInList(checkInEvent.id);
  };

  // 5. Reactive synchronization with URL Query Params (?tab=..., ?type=..., ?chatSubId=...)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'calendar') {
      setHubMainMode('calendar');
    } else if (
      tabParam === 'community' ||
      tabParam === 'fairs' ||
      tabParam === 'scrapbook' ||
      tabParam === 'quests_rewards'
    ) {
      setHubMainMode('categories');
      setActiveSubTab(tabParam);
    } else if (tabParam === 'quests' || tabParam === 'rewards') {
      setHubMainMode('categories');
      setActiveSubTab('quests_rewards');
    }

    const typeParam = searchParams.get('type');
    if (typeParam === 'public_venue') {
      setHubMainMode('categories');
      setActiveSubTab('fairs');
    } else if (typeParam === 'community') {
      setHubMainMode('categories');
      setActiveSubTab('community');
    }

    // Auto open chat if deep-linked
    const chatSubId = searchParams.get('chatSubId');
    const eventId = searchParams.get('eventId');
    if (chatSubId && eventId) {
      setTimeout(() => {
        const matched = [...activity.joined, ...activity.hosted].find((e) => e.id === eventId);
        if (matched) {
          setChatTargetEvent(matched);
          setIsChatModalOpen(true);
        }
      }, 350);
    }
  }, [searchParams]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [activeMenuId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build resolved list of joined events
  const allJoinedEvents: EventItem[] = useMemo(() => {
    const list: EventItem[] = [];
    const addedIds = new Set<string>();

    // 0. From userCreatedEvents (Events created by current user as Host)
    userCreatedEvents.forEach((e) => {
      if (!addedIds.has(e.id)) {
        list.push({
          ...e,
          isHost: true as any,
          badgeText: e.badgeText || 'เปิดรับสมัคร',
        });
        addedIds.add(e.id);
      }
    });

    // 1. Events the member joined (and ones they cancelled, kept as history), from the account
    [...activity.joined, ...activity.cancelled].forEach((e) => {
      if (!addedIds.has(e.id)) {
        list.push(e);
        addedIds.add(e.id);
      }
    });

    // 2. Fair sub-groups and buddy trips, still kept in this browser (plain event joins come from the account)
    Object.values(joinedSubActivities).forEach((sub: any) => {
      if (sub.id !== sub.eventId && !addedIds.has(sub.eventId)) {
        list.push({
          id: sub.eventId,
          title: sub.eventTitle || 'กิจกรรมที่คุณเข้าร่วม',
          category: sub.category || (sub.eventType === 'community' ? 'heal' : 'chill'),
          tag: sub.tag || (sub.eventType === 'community' ? 'กิจกรรมคอมมูนิตี้' : 'งานมหกรรม & ชวนเพื่อน'),
          date: sub.eventDate || '28 มี.ค. 2569',
          time: sub.eventTime || '10:00 - 20:00 น.',
          location: sub.eventLocation || 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
          image: sub.eventImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
          price: sub.eventPrice || 'เข้าชมฟรี!',
          description: sub.description || `กิจกรรมที่คุณลงทะเบียนเข้าร่วม: ${sub.subTitle || sub.eventTitle}`,
          hostName: sub.creatorName || 'โฮสต์ผู้จัด',
          hostAvatar: sub.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          eventType: sub.eventType || 'public_venue',
          participantsCount: sub.participantsCount || 4,
          maxParticipants: sub.maxParticipants || 10,
          createdAtTimestamp: 1726000000000,
        });
        addedIds.add(sub.eventId);
      }
    });

    // 3. From active quests / challenges (Gamified Lifestyle Quests)
    // A challenge sits on its own dates; one without an end date has no place on a calendar
    myChallenges.forEach((q) => {
      const questId = `quest-${q.id}`;
      const questEndTs = q.endDate ? parseEventEndDateToTimestamp(q.endDate) : 0;
      if (!addedIds.has(questId) && Number.isFinite(questEndTs) && questEndTs > 0) {
        const startTs = q.startDate ? parseEventDateToTimestamp(q.startDate) : 0;
        const questStartTs = Number.isFinite(startTs) && startTs > 0 ? startTs : 0;
        const questRangeDate = q.startDate ? `${q.startDate} - ${q.endDate}` : `ถึง ${q.endDate}`;

        list.push({
          id: questId,
          title: q.title || 'ชาเลนจ์กิจกรรม',
          category: q.category || 'chill',
          tag: q.badgeLabel || 'ชาเลนจ์',
          date: questRangeDate,
          time: 'ตลอดวัน (ชาเลนจ์ต่อเนื่อง)',
          location: q.targetGoal || 'เช็คอินตามพิกัดเป้าหมาย',
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          price: `+${q.rewardPoints} XP`,
          description: q.objective || q.targetGoal || 'รายละเอียดชาเลนจ์ประจำเดือน',
          hostName: 'ระบบชาเลนจ์ทางการ',
          hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          eventType: 'challenge' as any,
          participantsCount: q.participantsCount || 300,
          maxParticipants: 1000,
          createdAtTimestamp: 1788278059344,
          questStartTs,
          questEndTs,
          deadlineDate: q.endDate,
        } as any);
        addedIds.add(questId);
      }
    });

    return list;
  }, [activity.joined, activity.cancelled, joinedSubActivities, myChallenges, userCreatedEvents]);

  // Events the member runs live under "งานที่จัด"; the lists and the numbers are about what they go to as a guest
  const hostedIdSet = useMemo(() => new Set(userCreatedEvents.map((e) => e.id)), [userCreatedEvents]);
  const guestEvents = useMemo(() => allJoinedEvents.filter((e) => !hostedIdSet.has(e.id)), [allJoinedEvents, hostedIdSet]);
  // A buddy trip is an event tied to a place: told from the data, never from words in its title
  const isTripEvent = (e: EventItem) => Boolean(e.spotId || joinedSubActivities[e.id]?.subTitle || e.id.startsWith('spot-'));

  // Meetups and buddy trips share one list block; the open tab decides which of the two it shows
  const allMeetupEvents = useMemo(() => {
    return guestEvents.filter((e) => e.eventType !== 'public_venue' && (e.eventType as any) !== 'challenge');
  }, [guestEvents]);
  const tripCount = allMeetupEvents.filter(isTripEvent).length;
  const communityCount = allMeetupEvents.length - tripCount;
  const communityEvents = useMemo(() => {
    return allMeetupEvents.filter((e) => isTripEvent(e) === (activeSubTab === 'trips'));
  }, [allMeetupEvents, activeSubTab, joinedSubActivities]);

  const expoEvents = useMemo(() => {
    return guestEvents.filter((e) => e.eventType === 'public_venue' && (e.eventType as any) !== 'challenge');
  }, [guestEvents]);

  // Attendance Status Resolver: 'upcoming' | 'attended' | 'cancelled' | 'missed'
  const getEventAttendanceStatus = (ev: EventItem): 'upcoming' | 'attended' | 'cancelled' | 'missed' => {
    if (cancelledEventIds.includes(ev.id)) return 'cancelled';
    const ended = isEventEnded(ev);
    if (!ended) return 'upcoming';
    const record = ev as EventItem & { checkedInAt?: string; hasHostCheckIn?: boolean; isHost?: boolean };
    if (record.hasHostCheckIn && !record.isHost) return record.checkedInAt ? 'attended' : 'missed';
    if (missedEventIds.includes(ev.id)) return 'missed';
    return 'attended';
  };

  const pastCommunityEvents = useMemo(() => {
    return communityEvents.filter((e) => getEventAttendanceStatus(e) !== 'upcoming');
  }, [communityEvents, cancelledEventIds, missedEventIds]);

  const upcomingCommunityEvents = useMemo(() => {
    return communityEvents.filter((e) => getEventAttendanceStatus(e) === 'upcoming');
  }, [communityEvents, cancelledEventIds]);

  const pastExpoEvents = useMemo(() => {
    return expoEvents.filter((e) => getEventAttendanceStatus(e) !== 'upcoming');
  }, [expoEvents, cancelledEventIds, missedEventIds]);

  const upcomingExpoEvents = useMemo(() => {
    return expoEvents.filter((e) => getEventAttendanceStatus(e) === 'upcoming');
  }, [expoEvents, cancelledEventIds]);

  // Total counts for Passport Header Metrics (Lifecycle: Upcoming -> Attended -> XP)
  const upcomingEventsTotalCount = useMemo(() => {
    return allMeetupEvents.filter((e) => getEventAttendanceStatus(e) === 'upcoming').length + upcomingExpoEvents.length;
  }, [allMeetupEvents, upcomingExpoEvents, cancelledEventIds]);

  const attendedEventsTotalCount = useMemo(() => {
    const attendedComm = allMeetupEvents.filter((e) => getEventAttendanceStatus(e) === 'attended').length;
    const attendedExpo = expoEvents.filter((e) => getEventAttendanceStatus(e) === 'attended').length;
    return attendedComm + attendedExpo;
  }, [allMeetupEvents, expoEvents, cancelledEventIds, missedEventIds]);

  // The box at the top is for events still to run, nearest first; a finished one lives in the past list
  const hostedUpcoming = useMemo(
    () => activity.hosted.filter((e) => !isEventEnded(e)).sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date)),
    [activity.hosted],
  );

  // Quick Navigation Handlers for Metric Cards
  const handleQuickFilterUpcoming = () => {
    setHubMainMode('categories');
    setEventViewMode('upcoming');
    if (activeSubTab !== 'community' && activeSubTab !== 'fairs') {
      setActiveSubTab('community');
    }
    const el = document.getElementById('hub-content-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickFilterAttended = () => {
    setHubMainMode('categories');
    setEventViewMode('past');
    setPastSubFilter('attended');
    if (activeSubTab !== 'community' && activeSubTab !== 'fairs') {
      setActiveSubTab('community');
    }
    const el = document.getElementById('hub-content-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // What is coming comes first, nearest date on top; what has passed follows, latest first
  const byNearestDate = (a: EventItem, b: EventItem) => {
    const aUpcoming = getEventAttendanceStatus(a) === 'upcoming';
    const bUpcoming = getEventAttendanceStatus(b) === 'upcoming';
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    const diff = parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date);
    return aUpcoming ? diff : -diff;
  };

  // Filtered lists based on All vs Upcoming vs Past + Sub-filter
  const filteredCommunityEvents = useMemo(() => {
    return communityEvents.filter((ev) => {
      const status = getEventAttendanceStatus(ev);
      if (eventViewMode === 'upcoming') {
        return status === 'upcoming';
      }
      if (eventViewMode === 'past') {
        if (status === 'upcoming') return false;
        if (pastSubFilter === 'attended' && status !== 'attended') return false;
        if (pastSubFilter === 'not_attended' && status === 'attended') return false;
        return true;
      }
      return true;
    }).sort(byNearestDate);
  }, [communityEvents, eventViewMode, pastSubFilter, cancelledEventIds, missedEventIds]);

  const filteredExpoEvents = useMemo(() => {
    return expoEvents.filter((ev) => {
      const status = getEventAttendanceStatus(ev);
      if (eventViewMode === 'upcoming') {
        return status === 'upcoming';
      }
      if (eventViewMode === 'past') {
        if (status === 'upcoming') return false;
        if (pastSubFilter === 'attended' && status !== 'attended') return false;
        if (pastSubFilter === 'not_attended' && status === 'attended') return false;
        return true;
      }
      return true;
    }).sort(byNearestDate);
  }, [expoEvents, eventViewMode, pastSubFilter, cancelledEventIds, missedEventIds]);

  // Live catalog (published spots + bundled ones saved earlier)
  const spotCatalog = useSpotCatalog();

  // Saved Lifestyle Spots for Scrapbook (Filterable by search and vibe)
  const savedSpotsList: LifestyleSpotItem[] = useMemo(() => {
    let list = spotCatalog.filter((s) => savedSpotIds.includes(s.id));
    if (scrapbookSearch.trim()) {
      const q = scrapbookSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q)
      );
    }
    if (scrapbookVibeFilter !== 'all') {
      list = list.filter((s) => (getCachedSpotVibeCategory(s) as string) === scrapbookVibeFilter || (s.category as string) === scrapbookVibeFilter);
    }
    return list;
  }, [savedSpotIds, scrapbookSearch, scrapbookVibeFilter, spotCatalog]);

  const handleRemoveFromScrapbook = async (spotId: string, spotTitle: string) => {
    if (!(await activityActions.setSaved('spot', spotId, false))) return showToast('นำออกไม่สำเร็จ ลองอีกครั้งนะ');
    showToast(`นำ "${spotTitle}" ออกจากสมุดบันทึกสถานที่เที่ยวแล้ว`);
  };

  // Trigger Spot Buddy Gathering from Scrapbook
  const handleOpenSpotBuddy = (spot: LifestyleSpotItem) => {
    setSelectedSpotForBuddy(spot);
    setIsSpotBuddyModalOpen(true);
  };

  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const startDayOffset = useMemo(() => {
    const day = new Date(calYear, calMonth, 1).getDay();
    return (day + 6) % 7;
  }, [calYear, calMonth]);

  const totalGridCells = useMemo(() => {
    const total = startDayOffset + daysInMonth;
    return total > 35 ? 42 : 35;
  }, [startDayOffset, daysInMonth]);

  const endDayOffset = useMemo(() => {
    return totalGridCells - (startDayOffset + daysInMonth);
  }, [totalGridCells, startDayOffset, daysInMonth]);

  const isQuestEntry = (ev: EventItem) => (ev as any).eventType === 'challenge' || ev.id.startsWith('quest-');
  // The days of one month a challenge runs through, and its last day when that falls in the month
  const questSpanInMonth = (ev: EventItem, monthIdx: number, year: number): { start: number; end: number; deadline: number | null } | null => {
    const { questStartTs = 0, questEndTs = 0 } = ev as EventItem & { questStartTs?: number; questEndTs?: number };
    const monthStart = new Date(year, monthIdx, 1).getTime();
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const monthEnd = new Date(year, monthIdx, lastDay, 23, 59, 59).getTime();
    if (!questEndTs || questEndTs < monthStart || questStartTs > monthEnd) return null;
    const endsHere = questEndTs <= monthEnd;
    return {
      start: questStartTs > monthStart ? new Date(questStartTs).getDate() : 1,
      end: endsHere ? new Date(questEndTs).getDate() : lastDay,
      deadline: endsHere ? new Date(questEndTs).getDate() : null,
    };
  };

  const isEventInCalMonth = (ev: EventItem, monthIdx: number, year: number) => {
    if (isQuestEntry(ev)) return questSpanInMonth(ev, monthIdx, year) !== null;
    const monthShort = THAI_MONTH_SHORT[monthIdx];
    const monthFull = THAI_MONTH_NAMES[monthIdx];
    const dateStr = ev.date || '';
    if (dateStr.includes(monthShort) || dateStr.includes(monthFull)) return true;
    if (ev.createdAtTimestamp) {
      const d = new Date(ev.createdAtTimestamp);
      if (d.getFullYear() === year && d.getMonth() === monthIdx) return true;
    }
    return false;
  };

  // Cancel Event (Marks as cancelled in history rather than wiping out)
  const handleConfirmCancel = async (ticketId: string, _reason: string) => {
    if (!cancelTargetEvent) return;
    const result = await activityActions.leave(cancelTargetEvent.id);
    if (!result.ok) {
      showToast(result.message);
      setIsCancelModalOpen(false);
      return;
    }

    showToast(
      cancelTargetEvent.eventType === 'public_venue'
        ? `ยกเลิกการเข้าร่วม "${cancelTargetEvent.title}" เรียบร้อย (ย้ายไปยังประวัติที่ยกเลิก)`
        : `ยกเลิกตั๋ว ${ticketId} สำเร็จ (คืนที่นั่งให้เพื่อนสมาชิกแล้ว)`
    );
    setIsCancelModalOpen(false);
  };

  // Permanent Remove from history
  const handlePermanentRemove = async (eventId: string, title: string) => {
    // A past event still on the list is left first, then taken out of the history
    if (activity.joinedIds.includes(eventId)) {
      const left = await activityActions.leave(eventId);
      if (!left.ok) return showToast(left.message);
    }
    await activityActions.forgetCancelled(eventId);
    setMissedEventIds((prev) => prev.filter((id) => id !== eventId));
    showToast(`ลบ "${title}" ออกจากประวัติเรียบร้อยแล้ว`);
  };

  // Mark as Missed (User did not attend)
  const handleMarkMissed = (eventId: string, title: string) => {
    setMissedEventIds((prev) => {
      const updated = Array.from(new Set([...prev, eventId]));
      if (typeof window !== 'undefined') {
        localStorage.setItem('myhub_missed_event_ids', JSON.stringify(updated));
      }
      return updated;
    });
    showToast(`บันทึกสถานะว่าไม่ได้ไปร่วม "${title}" แล้ว`);
  };

  // Mark as Attended (User did attend)
  const handleMarkAttended = (eventId: string, title: string) => {
    setMissedEventIds((prev) => {
      const updated = prev.filter((id) => id !== eventId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('myhub_missed_event_ids', JSON.stringify(updated));
      }
      return updated;
    });
    setCancelledEventIds((prev) => {
      const updated = prev.filter((id) => id !== eventId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('myhub_cancelled_event_ids', JSON.stringify(updated));
      }
      return updated;
    });
    showToast(`บันทึกสถานะว่าได้เข้าร่วม "${title}" สำเร็จแล้ว`);
  };

  // Helper to persist and update Challenges/Quests
  const updateChallenges = (updater: (prev: ChallengeQuest[]) => ChallengeQuest[]) => {
    setMyChallenges((prev) => {
      const updated = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cch_my_challenges', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving challenges to localStorage:', e);
        }
      }
      return updated;
    });
  };

  const handleCheckIn = (ticketId: string) => {
    if (!checkedInTicketIds.includes(ticketId)) {
      setCheckedInTicketIds((prev) => [...prev, ticketId]);
      showToast('ลองเช็กอินแล้ว XP จริงจะได้เมื่อโฮสต์เช็กอินให้ที่งาน');
    } else {
      setCheckedInTicketIds((prev) => prev.filter((id) => id !== ticketId));
      showToast('ยกเลิกการจำลองเช็คอินแล้ว');
    }
  };


  const handleCopyVoucher = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`คัดลอกรหัส "${code}" เรียบร้อยแล้ว!`);
    }
  };

  // Helper to categorize event pillar and styling
  const getEventPillarMeta = (ev: EventItem) => {
    if (ev.eventType === 'public_venue') {
      return {
        pillar: 'fairs' as const,
        label: 'งานแฟร์ & นิทรรศการ',
        dotColor: 'bg-[#2B527A]',
        badgeBg: 'bg-[#EEF4FA]',
        badgeText: 'text-[#2B527A]',
        badgeBorder: 'border-[#B8D1E8]',
        cardHover: 'hover:border-[#B8D1E8]',
        titleHover: 'group-hover:text-[#2B527A]',
        btnBg: 'bg-slate-900',
        btnHover: 'hover:bg-slate-800',
        btnText: 'text-white',
        btnBorder: 'border-slate-900',
        passLabel: 'Expo Pass',
      };
    }
    if ((ev as any).eventType === 'challenge' || ev.id.startsWith('quest-')) {
      return {
        pillar: 'quests' as const,
        label: 'ชาเลนจ์',
        dotColor: 'bg-[#7C3AED]',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
        cardHover: 'hover:border-purple-300',
        titleHover: 'group-hover:text-purple-700',
        btnBg: 'bg-slate-900',
        btnHover: 'hover:bg-slate-800',
        btnText: 'text-white',
        btnBorder: 'border-slate-900',
        passLabel: 'Quest Pass',
      };
    }
    if (isTripEvent(ev)) {
      return {
        pillar: 'spots' as const,
        label: 'ทริปชวนเพื่อน',
        dotColor: 'bg-[#F26430]',
        badgeBg: 'bg-[#FEF3EE]',
        badgeText: 'text-[#D04A1B]',
        badgeBorder: 'border-[#FCD5C5]',
        cardHover: 'hover:border-[#FCD5C5]',
        titleHover: 'group-hover:text-[#D04A1B]',
        btnBg: 'bg-slate-900',
        btnHover: 'hover:bg-slate-800',
        btnText: 'text-white',
        btnBorder: 'border-slate-900',
        passLabel: 'Buddy Pass',
      };
    }
    return {
      pillar: 'community' as const,
      label: 'ตี้คอมมูนิตี้',
      dotColor: 'bg-[#2D5A3C]',
      badgeBg: 'bg-[#EBF3ED]',
      badgeText: 'text-[#2D5A3C]',
      badgeBorder: 'border-[#A3CEB0]',
      cardHover: 'hover:border-[#A3CEB0]',
      titleHover: 'group-hover:text-[#2D5A3C]',
      btnBg: 'bg-slate-900',
      btnHover: 'hover:bg-slate-800',
      btnText: 'text-white',
      btnBorder: 'border-slate-900',
      passLabel: 'E-Ticket',
    };
  };

  // On the calendar an event the member runs is its own group, whatever kind of event it is
  const calGroupOf = (ev: EventItem) => (hostedIdSet.has(ev.id) ? ('hosting' as const) : getEventPillarMeta(ev).pillar);
  const startTimeOf = (ev: EventItem) => /\d{1,2}[:.]\d{2}/.exec(ev.time ?? '')?.[0].replace('.', ':').padStart(5, '0') ?? '';

  const getCommunityMoodTheme = (category?: string) => {
    switch (category) {
      case 'heal':
        return {
          label: 'ฮีลใจ & ธรรมชาติ',
          badge: 'bg-emerald-50/95 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          border: 'hover:border-emerald-300',
          titleHover: 'group-hover:text-emerald-800',
        };
      case 'move':
        return {
          label: 'ฟิต & ออกกำลัง',
          badge: 'bg-rose-50/95 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          border: 'hover:border-rose-300',
          titleHover: 'group-hover:text-rose-700',
        };
      case 'learn':
        return {
          label: 'เวิร์กช็อป & เรียนรู้',
          badge: 'bg-sky-50/95 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          border: 'hover:border-sky-300',
          titleHover: 'group-hover:text-sky-700',
        };
      case 'chill':
      default:
        return {
          label: 'จิบกาแฟ & ชิลล์',
          badge: 'bg-amber-50/95 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          border: 'hover:border-amber-300',
          titleHover: 'group-hover:text-amber-800',
        };
    }
  };

  const THAI_DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  const getDayOfWeekName = (year: number, monthIdx: number, day: number) => {
    const d = new Date(year, monthIdx, day);
    return THAI_DAY_NAMES[d.getDay()];
  };

  const isEventOnDay = (ev: EventItem, day: number, monthIdx: number, year: number, filterMode: string = 'all'): boolean => {
    if (!isEventInCalMonth(ev, monthIdx, year)) return false;

    // Quests Span Handling for Option C (Filter-Activated Span)
    if (isQuestEntry(ev)) {
      const span = questSpanInMonth(ev, monthIdx, year);
      if (!span) return false;
      // When user explicitly inspects Quests, highlight all days within the span
      if (filterMode === 'quests') return day >= span.start && day <= span.end;
      // In all other modes (e.g. 'all'), ONLY show on the deadline day to prevent calendar clutter
      return day === span.deadline;
    }

    // The day is inside the event when it falls between the event's first and last date
    // (the old check matched any digit of the date text, so "18 ต.ค. 2569" also showed on the 1st, 2nd, 6th and 8th)
    if (!ev.date || !/[0-9]/.test(ev.date)) return false;
    const dayStart = new Date(year, monthIdx, day, 0, 0, 0).getTime();
    const dayEnd = new Date(year, monthIdx, day, 23, 59, 59).getTime();
    return parseEventDateToTimestamp(ev.date) <= dayEnd && parseEventEndDateToTimestamp(ev.date) >= dayStart;
  };

  // Active scope events for current calendar view (either selected day, or the current month, or all-time)
  const scopedCalendarEvents = useMemo(() => {
    if (calendarTimeScope === 'all') {
      return allJoinedEvents;
    }
    if (selectedCalDay !== null) {
      return allJoinedEvents.filter((ev) => isEventOnDay(ev, selectedCalDay, calMonth, calYear, 'all'));
    }
    return allJoinedEvents.filter((ev) => isEventInCalMonth(ev, calMonth, calYear));
  }, [allJoinedEvents, calendarTimeScope, selectedCalDay, calMonth, calYear]);

  // Master Category Counts strictly matching the active calendar scope
  const masterCategoryCounts = useMemo(() => {
    let community = 0;
    let fairs = 0;
    let spots = 0;
    let quests = 0;
    let hosting = 0;
    scopedCalendarEvents.forEach((ev) => {
      const group = calGroupOf(ev);
      if (group === 'hosting') hosting++;
      else if (group === 'fairs') fairs++;
      else if (group === 'spots') spots++;
      else if (group === 'quests') quests++;
      else community++;
    });
    return { all: scopedCalendarEvents.length, community, fairs, spots, quests, hosting };
  }, [scopedCalendarEvents, hostedIdSet]);

  // Master Calendar filtered dataset (used for calendar day cells and dots)
  const filteredMasterEvents = useMemo(() => {
    if (calendarCategoryFilter === 'all') return allJoinedEvents;
    return allJoinedEvents.filter((ev) => calGroupOf(ev) === calendarCategoryFilter);
  }, [allJoinedEvents, calendarCategoryFilter, hostedIdSet]);

  // Find ongoing quests for selected day when in 'all' view
  const ongoingQuestsForSelectedDay = useMemo(() => {
    if (selectedCalDay === null || calendarCategoryFilter !== 'all') return [];
    return allJoinedEvents.filter((ev) => {
      if (!isQuestEntry(ev)) return false;
      const span = questSpanInMonth(ev, calMonth, calYear);
      return span !== null && selectedCalDay >= span.start && selectedCalDay <= span.end && selectedCalDay !== span.deadline;
    });
  }, [allJoinedEvents, selectedCalDay, calendarCategoryFilter, calMonth, calYear]);

  // Daily agenda events: exactly equals scopedCalendarEvents filtered by category
  const dailyAgendaEvents = useMemo(() => {
    if (calendarCategoryFilter === 'all') return scopedCalendarEvents;
    return scopedCalendarEvents.filter((ev) => calGroupOf(ev) === calendarCategoryFilter);
  }, [scopedCalendarEvents, calendarCategoryFilter, hostedIdSet]);

  // Helper to render Master Schedule Calendar (Unified Multi-Category Life Calendar)
  // The host's side of My Hub: what is still to run (who is coming, check-in, team chat) and what has been run
  const renderHostingView = () => {
    const pastHosted = activity.hosted.filter((e) => isEventEnded(e)).sort((a, b) => parseEventDateToTimestamp(b.date) - parseEventDateToTimestamp(a.date));
    const quietButton = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap';
    const row = (ev: EventItem, ended: boolean) => (
      <li key={ev.id} className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev.image} alt="" className={`w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 ${ended ? 'grayscale opacity-80' : ''}`} />
        <div className="min-w-0 flex-1 basis-40">
          <Link href={`/community/${encodeURIComponent(ev.id)}`} className="block text-sm font-bold text-slate-900 truncate hover:underline">{ev.title}</Link>
          <p className="text-xs font-medium text-slate-600 mt-0.5 truncate tabular-nums">{[thaiShortDate(ev.date), ev.time].filter(Boolean).join(' · ')}</p>
          <p className="text-xs font-medium text-slate-500 truncate">{ev.location}</p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-slate-600 tabular-nums">
          <span className="text-sm font-extrabold text-slate-900">{ev.participantsCount ?? 0}</span>/{ev.maxParticipants ?? 0} คน
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {ev.approvalStatus !== 'approved' ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap">
              {ev.approvalStatus === 'rejected' ? 'ไม่ผ่านการตรวจ' : 'รอทีมงานตรวจ'}
            </span>
          ) : ended ? (
            <button type="button" onClick={() => openCheckIn(ev)} className={quietButton}>
              <Users className="w-4 h-4" aria-hidden="true" />
              รายชื่อคนที่มา
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setChatTargetEvent(ev);
                  setIsChatModalOpen(true);
                }}
                className={quietButton}
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                แชตลูกทีม
              </button>
              <button type="button" onClick={() => openCheckIn(ev)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap">
                <Users className="w-4 h-4" aria-hidden="true" />
                รายชื่อและเช็กอิน
              </button>
            </>
          )}
        </div>
      </li>
    );
    return (
      <div className="space-y-4">
        <section aria-label="งานที่กำลังจะถึง" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
            งานที่กำลังจะถึง <span className="text-slate-500 font-bold tabular-nums">({hostedUpcoming.length})</span>
          </h2>
          {hostedUpcoming.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-100">{hostedUpcoming.map((ev) => row(ev, false))}</ul>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-600">ตอนนี้ยังไม่มีงานที่รอจัด</p>
          )}
        </section>
        {pastHosted.length > 0 && (
          <section aria-label="งานที่จัดไปแล้ว" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              งานที่จัดไปแล้ว <span className="text-slate-500 font-bold tabular-nums">({pastHosted.length})</span>
            </h2>
            <ul className="mt-3 divide-y divide-slate-100">{pastHosted.map((ev) => row(ev, true))}</ul>
          </section>
        )}
      </div>
    );
  };

  const renderMasterCalendarView = () => {
    const activeRing = 'ring-2 ring-slate-900 bg-slate-50/80';

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          {/* Header Controls: Month Navigator & Category Filter Chips */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            {/* Month & Year Navigator */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear((p) => p - 1);
                    } else {
                      setCalMonth((p) => p - 1);
                    }
                    setSelectedCalDay(null);
                    setCalendarTimeScope('month');
                  }}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-slate-600" />
                  <span>
                    {THAI_MONTH_NAMES[calMonth]} {calYear + 543}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear((p) => p + 1);
                    } else {
                      setCalMonth((p) => p + 1);
                    }
                    setSelectedCalDay(null);
                    setCalendarTimeScope('month');
                  }}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Today Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setCalYear(2026);
                  setCalMonth(8);
                  setSelectedCalDay(26);
                  setCalendarTimeScope('month');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer"
              >
                วันนี้
              </button>

              {/* Scope Switcher: Month vs All-Time */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarTimeScope('month');
                    setSelectedCalDay(null);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calendarTimeScope === 'month' && selectedCalDay === null
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เดือนนี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarTimeScope('all');
                    setSelectedCalDay(null);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calendarTimeScope === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ตลอดทั้งปี ({allJoinedEvents.length})
                </button>
              </div>

              {selectedCalDay !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedCalDay(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>แสดงทุกวันในเดือนนี้</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips (Pill Toggles) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  calendarCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({masterCategoryCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('community')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  calendarCategoryFilter === 'community'
                    ? 'bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0] shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#2D5A3C]" />
                <span>คอมมูนิตี้ ({masterCategoryCounts.community})</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('fairs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  calendarCategoryFilter === 'fairs'
                    ? 'bg-[#EEF4FA] text-[#2B527A] border border-[#B8D1E8] shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#2B527A]" />
                <span>งานแฟร์ ({masterCategoryCounts.fairs})</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('spots')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  calendarCategoryFilter === 'spots'
                    ? 'bg-[#FEF3EE] text-[#D04A1B] border border-[#FCD5C5] shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#F26430]" />
                <span>ทริปชวนเพื่อน ({masterCategoryCounts.spots})</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('quests')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  calendarCategoryFilter === 'quests'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>ชาเลนจ์ ({masterCategoryCounts.quests})</span>
              </button>

              {hostedIdSet.size > 0 && (
                <button
                  type="button"
                  onClick={() => setCalendarCategoryFilter('hosting')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    calendarCategoryFilter === 'hosting'
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-500" aria-hidden="true" />
                  <span>งานที่จัด ({masterCategoryCounts.hosting})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quest Span Mode Informational Banner */}
          {calendarCategoryFilter === 'quests' && (
            <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950 animate-fade-in shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold block">
                    ช่วงเวลาของชาเลนจ์ที่คุณทำอยู่
                  </span>
                  <span className="text-[11.5px] text-purple-800/80 block truncate">
                    แถบสีม่วงคือวันที่ชาเลนจ์ยังเปิดอยู่ จุดสีม่วงเข้มคือวันสุดท้าย
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('all')}
                className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 cursor-pointer transition-all self-start sm:self-auto inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>มุมมองรวมทั้งหมด</span>
              </button>
            </div>
          )}

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
            <span className="text-slate-400 font-semibold">หมวดหมู่:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D5A3C]" />
              <span>ตี้คอมมูนิตี้</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2B527A]" />
              <span>งานมหกรรม & แฟร์</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F26430]" />
              <span>ทริปชวนเพื่อน</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>{calendarCategoryFilter === 'quests' ? 'วันสุดท้ายของชาเลนจ์' : 'ชาเลนจ์'}</span>
            </span>
            {hostedIdSet.size > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>งานที่จัด</span>
              </span>
            )}
            {calendarCategoryFilter === 'quests' && (
              <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                <span className="w-3.5 h-1.5 rounded-sm bg-purple-200 border border-purple-300" />
                <span>ช่วงทำชาเลนจ์</span>
              </span>
            )}
          </div>

          {/* Weekday Header */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-7 bg-slate-50 text-center text-[11px] sm:text-xs font-bold text-slate-600 border-b border-slate-200/90 py-2.5">
              <span>จันทร์</span>
              <span>อังคาร</span>
              <span>พุธ</span>
              <span>พฤหัสฯ</span>
              <span>ศุกร์</span>
              <span className="text-slate-800 font-bold">เสาร์</span>
              <span className="text-slate-800 font-bold">อาทิตย์</span>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 bg-slate-100 gap-px">
              {[...Array(startDayOffset)].map((_, i) => (
                <div key={`empty-start-${i}`} className="bg-slate-50/60 min-h-[64px] sm:min-h-[70px] p-1 opacity-40" />
              ))}

              {[...Array(daysInMonth)].map((_, idx) => {
                const day = idx + 1;
                const todayDate = new Date();
                const isToday = calMonth === todayDate.getMonth() && calYear === todayDate.getFullYear() && day === todayDate.getDate();
                const isSelected = selectedCalDay === day;
                const eventsOnDay = filteredMasterEvents.filter((ev) => isEventOnDay(ev, day, calMonth, calYear, calendarCategoryFilter));

                const hasCommunity = eventsOnDay.some((ev) => calGroupOf(ev) === 'community');
                const hasFairs = eventsOnDay.some((ev) => calGroupOf(ev) === 'fairs');
                const hasSpots = eventsOnDay.some((ev) => calGroupOf(ev) === 'spots');
                const hasQuests = eventsOnDay.some((ev) => calGroupOf(ev) === 'quests');
                const isQuestMode = calendarCategoryFilter === 'quests';
                const isQuestDeadlineDay = eventsOnDay.some((ev) => questSpanInMonth(ev, calMonth, calYear)?.deadline === day);
                const isQuestSpan = isQuestMode && hasQuests;
                // Earliest first; a challenge has no hour, so it comes last
                const dayEvents = [...eventsOnDay].sort((a, b) => (startTimeOf(a) || '99').localeCompare(startTimeOf(b) || '99'));

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedCalDay(isSelected ? null : day)}
                    className={`min-h-[64px] sm:min-h-[70px] p-1.5 sm:p-2 flex flex-col transition-all cursor-pointer hover:bg-slate-50/90 ${
                      isSelected
                        ? activeRing
                        : isToday
                        ? 'ring-2 ring-emerald-500/50 bg-emerald-50/20'
                        : isQuestSpan
                        ? isQuestDeadlineDay
                          ? 'bg-purple-100/60 border-b-2 border-purple-500'
                          : 'bg-purple-50/40 border-b-2 border-purple-200'
                        : 'bg-white'
                    }`}
                  >
                    {/* Day Number and Multi-category Dots */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : isToday
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : isQuestDeadlineDay && isQuestMode
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : eventsOnDay.length > 0
                          ? 'text-slate-900 font-black'
                          : 'text-slate-400'
                      }`}>
                        {day}
                      </span>

                      {/* Multi-category Dots */}
                      <div className="flex items-center gap-1">
                        {eventsOnDay.some((ev) => calGroupOf(ev) === 'hosting') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="งานที่จัด" />}
                        {hasCommunity && <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C]" title="ตี้คอมมูนิตี้" />}
                        {hasFairs && <span className="w-1.5 h-1.5 rounded-full bg-[#2B527A]" title="งานแฟร์" />}
                        {hasSpots && <span className="w-1.5 h-1.5 rounded-full bg-[#F26430]" title="ทริปชวนเพื่อน" />}
                        {hasQuests && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isQuestDeadlineDay
                                ? 'bg-[#7C3AED] ring-1 ring-purple-600'
                                : isQuestMode
                                ? 'bg-purple-400'
                                : 'bg-[#7C3AED]'
                            }`}
                            title={isQuestDeadlineDay ? 'กำหนดส่งชาเลนจ์วันสุดท้าย' : 'ช่วงทำชาเลนจ์'}
                          />
                        )}
                        {/* On a phone there is no room for names, so a busy day says how many */}
                        {eventsOnDay.length > 1 && <span className="sm:hidden text-[11px] font-bold text-slate-700 tabular-nums leading-none">{eventsOnDay.length}</span>}
                      </div>
                    </div>

                    {/* Up to four events show in full, in time order, and the week grows to fit them; a fuller day shows three and how many more */}
                    <div className="space-y-0.5 mt-1 hidden sm:block">
                      {(dayEvents.length > 4 ? dayEvents.slice(0, 3) : dayEvents).map((ev) => {
                        const meta = getEventPillarMeta(ev);
                        const isQuest = meta.pillar === 'quests';
                        const isHosting = calGroupOf(ev) === 'hosting';
                        const isDeadline = questSpanInMonth(ev, calMonth, calYear)?.deadline === day;
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-center gap-1 text-[11px] font-semibold leading-[18px] px-1.5 rounded-md border ${
                              isHosting
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : isQuest && isDeadline
                                ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                                : isQuest
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`
                            }`}
                            title={[startTimeOf(ev), ev.title].filter(Boolean).join(' ')}
                          >
                            {isHosting && <Crown className="w-3 h-3 shrink-0 text-amber-500" aria-hidden="true" />}
                            {!isQuest && startTimeOf(ev) && <span className="shrink-0 font-bold tabular-nums">{startTimeOf(ev)}</span>}
                            <span className="min-w-0 truncate">{isQuest && isDeadline ? `วันสุดท้าย: ${ev.title}` : ev.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 4 && (
                        <span className="block px-1.5 text-[11px] font-bold text-slate-600 leading-[18px]">
                          อีก {dayEvents.length - 3} รายการ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {[...Array(endDayOffset)].map((_, i) => (
                <div key={`empty-end-${i}`} className="bg-slate-50/60 min-h-[64px] sm:min-h-[70px] p-1 opacity-40" />
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Daily Agenda Sheet (Full Canvas Width matching Category view) */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2D5A3C]" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {calendarTimeScope === 'all'
                    ? 'กำหนดการทั้งหมดตลอดทั้งปี'
                    : selectedCalDay !== null
                    ? `กำหนดการวัน${getDayOfWeekName(calYear, calMonth, selectedCalDay)}ที่ ${selectedCalDay} ${THAI_MONTH_NAMES[calMonth]} ${calYear + 543}`
                    : `กำหนดการทั้งหมดในเดือน${THAI_MONTH_NAMES[calMonth]} ${calYear + 543}`}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {dailyAgendaEvents.length} กิจกรรม
                </span>
              </div>

              {selectedCalDay !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedCalDay(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  แสดงทุกวันในเดือนนี้
                </button>
              )}
            </div>

            {/* Ongoing Quests Notification Banner in 'all' view when day selected */}
            {calendarCategoryFilter === 'all' && ongoingQuestsForSelectedDay.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2.5 text-purple-900 font-bold min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                    <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="block truncate">
                      วันนี้อยู่ในช่วงชาเลนจ์ {ongoingQuestsForSelectedDay.length} ชาเลนจ์ ({ongoingQuestsForSelectedDay.map((q) => q.title).join(', ')})
                    </span>
                    <span className="text-[11px] text-purple-700 font-medium block">
                      ยังไม่ถึงกำหนดส่งวันสุดท้าย สามารถทำชาเลนจ์และส่งหลักฐานล่วงหน้าได้
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarCategoryFilter('quests')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  <span>เปิดดูตารางชาเลนจ์</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {dailyAgendaEvents.length === 0 ? (
              <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-dashed border-slate-200 text-center space-y-3 max-w-lg mx-auto">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center mx-auto border border-slate-200 shadow-2xs">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {selectedCalDay !== null ? 'ไม่มีกำหนดการในวันที่เลือก' : 'ยังไม่มีกำหนดการในเดือนนี้'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    {selectedCalDay !== null
                      ? 'วันว่างของคุณ สามารถพักผ่อนให้เต็มที่ หรือค้นหากิจกรรมคอมมูนิตี้และงานแฟร์ใหม่ๆ'
                      : 'เข้าร่วมตี้เพื่อนใหม่ หรือบันทึกงานแฟร์ที่คุณสนใจเพื่อจัดตารางชีวิต'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>หากิจกรรม</span>
                  </Link>
                  <Link
                    href="/fairs"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ดูงานแฟร์</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                {dailyAgendaEvents.map((ev, idx) => {
                  const meta = getEventPillarMeta(ev);
                  const ticketId = ev.eventType === 'public_venue'
                    ? `CCH-FAIR-${(idx + 201).toString().padStart(4, '0')}`
                    : `CCH-2026-${(idx + 101).toString().padStart(4, '0')}`;
                  const fallbackImg = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80';
                  const status = getEventAttendanceStatus(ev);
                  const isCancelled = status === 'cancelled';
                  const isMissed = status === 'missed';
                  const isAttended = status === 'attended';
                  const isReviewed = reviewedEventIds.includes(ev.id);
                  const isHost = Boolean(ev.isHost || userCreatedEvents.some((u) => u.id === ev.id));
                  const isMenuOpen = activeMenuId === `cal-${ev.id}`;

                  return (
                    <div
                      key={ev.id}
                      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1 shadow-2xs hover:shadow-md ${
                        isCancelled
                          ? 'opacity-85 hover:opacity-100 border-rose-200/70 bg-rose-50/15'
                          : isMissed
                          ? 'border-amber-200/70 bg-amber-50/10'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Image Banner */}
                      <Link
                        href={
                          meta.pillar === 'quests'
                            ? '/challenges'
                            : ev.eventType === 'public_venue' || meta.pillar === 'fairs'
                            ? `/fairs/${encodeURIComponent(ev.id)}`
                            : `/community/${encodeURIComponent(ev.id)}`
                        }
                        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0 block cursor-pointer"
                        title={`ดูรายละเอียด ${ev.title}`}
                      >
                        <img
                          src={ev.image || fallbackImg}
                          alt={ev.title}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isCancelled ? 'grayscale-40' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60" />

                        {/* Top-Left Badges: Status or Pillar Tag + Host Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          {meta.pillar === 'quests' ? (
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                              {meta.label}
                            </span>
                          ) : isCancelled ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                              <X className="w-3 h-3 stroke-[2.5]" />
                              <span>ยกเลิก</span>
                            </span>
                          ) : isMissed ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>ไม่ได้ไปร่วม</span>
                            </span>
                          ) : isAttended ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>เข้าร่วมแล้ว</span>
                            </span>
                          ) : (
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                              {meta.label}
                            </span>
                          )}

                          {(ev.isHost || userCreatedEvents.some((u) => u.id === ev.id)) && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs inline-flex items-center gap-1">
                              <Crown className="w-3 h-3 text-white" />
                              <span>โฮสต์</span>
                            </span>
                          )}
                        </div>

                        {/* Top-Right Badge: Urgent Due Date for Quests only */}
                        {meta.pillar === 'quests' && questSpanInMonth(ev, calMonth, calYear)?.deadline === selectedCalDay && (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs animate-pulse inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-white" />
                              <span>เดดไลน์วันนี้</span>
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Card Body */}
                      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                        <div className="space-y-1.5">
                          {/* Top Row: Host Info + Ticket ID */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <img
                                src={ev.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                alt={ev.hostName || 'Host'}
                                className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span className="text-[11px] font-medium text-slate-500 truncate">
                                {ev.hostName || 'ระบบกิจกรรม'}
                              </span>
                            </div>
                            {meta.pillar === 'quests' ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                {ev.price || '+50 XP'}
                              </span>
                            ) : ev.price ? (
                              <span
                                className={`text-[11px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                  ev.price.includes('ฟรี')
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                }`}
                              >
                                {ev.price.includes('ฟรี') ? 'ฟรี' : ev.price.replace(/\s*\([^)]*\)/g, '').trim()}
                              </span>
                            ) : null}
                          </div>

                          {/* Title */}
                          <Link
                            href={
                              meta.pillar === 'quests'
                                ? '/challenges'
                                : ev.eventType === 'public_venue' || meta.pillar === 'fairs'
                                ? `/fairs/${encodeURIComponent(ev.id)}`
                                : `/community/${encodeURIComponent(ev.id)}`
                            }
                            className="block group/title"
                          >
                            <h3
                              className={`font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${meta.titleHover} transition-colors leading-[1.3] tracking-tight cursor-pointer`}
                              title={ev.title}
                            >
                              {ev.title}
                            </h3>
                          </Link>

                          {/* Meta: Date & Location */}
                          <div className="space-y-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{ev.date} • {ev.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-600 font-medium" title={ev.location}>
                                {ev.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Area */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                          {meta.pillar === 'quests' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const rawQuestId = ev.id.replace('quest-', '');
                                  const q = myChallenges.find((item) => item.id === rawQuestId) || myChallenges[0];
                                  if (q) router.push(`/challenges/${encodeURIComponent(q.id)}`);
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ส่งหลักฐาน</span>
                              </button>
                              <Link
                                href="/challenges"
                                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                title="ดูรายละเอียดชาเลนจ์ทั้งหมดในหน้าชาเลนจ์"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ดูชาเลนจ์</span>
                              </Link>
                            </>
                          ) : isCancelled ? (
                            /* Cancelled Event: Link to fullpage + restore button */
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <Link
                                href={
                                  ev.eventType === 'public_venue' || meta.pillar === 'fairs'
                                    ? `/fairs/${encodeURIComponent(ev.id)}`
                                    : `/community/${encodeURIComponent(ev.id)}`
                                }
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                <span>ดูข้อมูลงาน</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleMarkAttended(ev.id, ev.title)}
                                className="py-1.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                title="เปลี่ยนสถานะเป็นไปร่วมจริง"
                              >
                                <span>ไปร่วมจริง</span>
                              </button>
                            </div>
                          ) : isMissed ? (
                            /* Missed Event: View moments + restore button */
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <Link
                                href="/moments"
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate active:scale-95"
                                title="ดูภาพบรรยากาศจากเพื่อนคนอื่นในคอมมูนิตี้"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>ดูบรรยากาศ</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleMarkAttended(ev.id, ev.title)}
                                className="py-1.5 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                title="คลิกหากคุณได้ไปร่วมจริง เพื่อเปิดให้แชร์โมเมนต์"
                              >
                                <span>ฉันไปร่วมจริง</span>
                              </button>
                            </div>
                          ) : isAttended ? (
                            /* Attended Event: Share Moment + Review/Info */
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <Link
                                href={`/moments?createForEvent=${encodeURIComponent(ev.id)}&eventTitle=${encodeURIComponent(ev.title)}&location=${encodeURIComponent(ev.location)}&image=${encodeURIComponent(ev.image || '')}`}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                title="แชร์ภาพและความรู้สึก"
                              >
                                <Camera className="w-3.5 h-3.5 shrink-0" />
                                <span>แชร์โมเมนต์</span>
                              </Link>

                              {isHost ? (
                                <button
                                  type="button"
                                  onClick={() => openCheckIn(ev)}
                                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>รายชื่อ</span>
                                </button>
                              ) : ev.eventType !== 'public_venue' ? (
                                isReviewed ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="py-1.5 px-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center justify-center gap-1 shrink-0 cursor-default"
                                    title="คุณได้รีวิวและให้คะแนนแล้ว (+50 XP เรียบร้อย)"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>รีวิวแล้ว</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTipTargetEvent(ev);
                                      setIsTipModalOpen(true);
                                    }}
                                    className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                    title="ให้คะแนนและรีวิวโฮสต์ รับ +50 XP"
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500" />
                                    <span>รีวิวโฮสต์</span>
                                  </button>
                                )
                              ) : (
                                <Link
                                  href={`/fairs/${encodeURIComponent(ev.id)}`}
                                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EEF4FA] text-[#2B527A] border border-slate-200 hover:border-[#B8D1E8] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                  title="ดูข้อมูลงาน"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-[#2B527A]" />
                                  <span>ข้อมูลงาน</span>
                                </Link>
                              )}
                            </div>
                          ) : (
                            /* Upcoming Event */
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {isHost ? (
                                <Link
                                  href={`/community/${encodeURIComponent(ev.id)}`}
                                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                  title="ไปที่หน้ารายละเอียดเพื่อดูแลตี้และตรวจสอบสมาชิก"
                                >
                                  <Crown className="w-3.5 h-3.5 shrink-0 text-white" />
                                  <span>จัดการตี้</span>
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTicketEvent(ev);
                                    setSelectedTicketId(ticketId);
                                    setIsETicketModalOpen(true);
                                  }}
                                  className={`flex-1 py-1.5 px-2.5 rounded-xl ${meta.btnBg} ${meta.btnHover} ${meta.btnText} border ${meta.btnBorder} text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95`}
                                >
                                  <Ticket className={`w-3.5 h-3.5 ${meta.btnText}`} />
                                  <span>ดูบัตร</span>
                                </button>
                              )}

                              {ev.eventType !== 'public_venue' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatTargetEvent(ev);
                                    setIsChatModalOpen(true);
                                  }}
                                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                  title={isHost ? 'เปิดห้องแชตคุยกับลูกทีม' : 'เปิดห้องแชทกลุ่ม'}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{isHost ? 'แชตลูกทีม' : 'แชต'}</span>
                                </button>
                              ) : (
                                <Link
                                  href={`/fairs/${encodeURIComponent(ev.id)}`}
                                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EEF4FA] text-[#2B527A] border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                  title="ดูรายละเอียดงานแฟร์"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">งานแฟร์</span>
                                </Link>
                              )}
                            </div>
                          )}

                          {/* Context Menu Button for Calendar Cards */}
                          {meta.pillar !== 'quests' && (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(isMenuOpen ? null : `cal-${ev.id}`);
                                }}
                                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="ตัวเลือกเพิ่มเติม"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in text-slate-700"
                                >
                                  <Link
                                    href={
                                      ev.eventType === 'public_venue' || meta.pillar === 'fairs'
                                        ? `/fairs/${encodeURIComponent(ev.id)}`
                                        : `/community/${encodeURIComponent(ev.id)}`
                                    }
                                    onClick={() => setActiveMenuId(null)}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    <span>ดูรายละเอียดงาน</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      showToast(`คัดลอกลิงก์กิจกรรม ${ev.title} แล้ว!`);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>แชร์นัดหมาย</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  {isAttended ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleMarkMissed(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        <span>แจ้งว่าไม่ได้ไปร่วมจริง</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handlePermanentRemove(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>ลบออกจากประวัติ</span>
                                      </button>
                                    </>
                                  ) : isMissed ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleMarkAttended(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>เปลี่ยนเป็นเข้าร่วมสำเร็จ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handlePermanentRemove(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>ลบออกจากประวัติ</span>
                                      </button>
                                    </>
                                  ) : isCancelled ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleMarkAttended(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>กู้คืนเป็นไปร่วมงาน</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handlePermanentRemove(ev.id, ev.title);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        <span>ลบออกจากประวัติถาวร</span>
                                      </button>
                                    </>
                                  ) : isHost ? (
                                    <Link
                                      href={`/community/${encodeURIComponent(ev.id)}`}
                                      onClick={() => setActiveMenuId(null)}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                                      <span>จัดการและปิดรับสมัคร</span>
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setCancelTargetEvent(ev);
                                        setCancelTargetTicketId(ticketId);
                                        setIsCancelModalOpen(true);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>ยกเลิกการเข้าร่วม</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans pb-24 md:pb-16 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeNavTab}
          setActiveTab={setActiveNavTab}
          isLoggedIn={isLoggedIn}
          isAuthReady={isAuthReady}
          setIsLoggedIn={handleSetIsLoggedIn}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
          onOpenCreateEvent={() => {
            if (!isLoggedIn) {
              setIsAuthModalOpen(true);
              showToast('กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรมหรือเปิดตี้ใหม่');
            } else {
              setIsCreateEventModalOpen(true);
            }
          }}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md animate-bounce-short border border-white/20 flex items-center gap-2 max-w-[90vw] text-center">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Guest Guard: Requires Login (Global Showcase Teaser) */}
        {!isLoggedIn ? (
          <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
            {/* Teaser Header */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                มายฮับส่วนตัว (My Hub: Personal Lifestyle Hub)
              </h2>
            </div>

            {/* 4 Feature Showcase Infographic Cards (Clean White Editorial with Brand Organic Accents) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Pillar 1: Digital E-Ticket & Group Chat (Forest Green) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-[#4A7C59]/40 hover:shadow-xs transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF3ED] text-[#2D5A3C] flex items-center justify-center border border-[#A3CEB0]/60 shadow-2xs">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0]/60 shadow-2xs">
                      ✦ ตั๋วดิจิทัล & แชตกลุ่ม
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Digital E-Ticket & Group Chat
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      บัตรกิจกรรมพร้อม QR Code สแกนเข้างานหรือเช็คอินกับโฮสต์ เข้าถึงง่ายไม่ต้องค้นหาในอีเมล พร้อมห้องแชตกลุ่มสำหรับประสานงานกับเพื่อนร่วมตี้ทันที
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#2D5A3C] text-[11px]">
                    <QrCode className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>Boarding Pass #CCH-2026</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-md border border-[#A3CEB0]/50">
                    ยืนยันที่นั่งแล้ว
                  </span>
                </div>
              </div>

              {/* Pillar 2: Master Lifestyle Calendar (Slate Blue) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-[#2B527A]/40 hover:shadow-xs transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0F4F8] text-[#2B527A] flex items-center justify-center border border-[#CBD5E1]/60 shadow-2xs">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F0F4F8] text-[#2B527A] border border-[#CBD5E1]/60 shadow-2xs">
                      ✦ ปฏิทินรวมนัดหมาย
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Master Lifestyle Calendar
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      รวมนัดหมายทุกไลฟ์สไตล์ไว้ในตารางเดียว ทั้งตี้คอมมูนิตี้ งานมหกรรมเอ็กซ์โป และชาเลนจ์ประจำสัปดาห์ ไม่พลาดทุกทริปและเวลาพักผ่อน
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#2B527A] text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#2B527A]" />
                    <span>ซิงก์นัดหมายทุกประเภท</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#2B527A] bg-[#F0F4F8] px-2 py-0.5 rounded-md border border-[#CBD5E1]/50">
                    4 หมวดหมู่ในที่เดียว
                  </span>
                </div>
              </div>

              {/* Pillar 3: Travel Scrapbook & Buddy (Warm Amber) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-[#F26430]/40 hover:shadow-xs transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#F26430] flex items-center justify-center border border-[#FED7AA]/60 shadow-2xs">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FFF7ED] text-[#F26430] border border-[#FED7AA]/60 shadow-2xs">
                      ✦ 77 จังหวัดทั่วไทย
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Travel Scrapbook & Buddy
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      ปักหมุดพิกัดฮีลใจ คาเฟ่สโลว์บาร์ และจุดชมวิวที่อยากไป บันทึกเป็นสมุดท่องเที่ยวส่วนตัว พร้อมกดปุ่มเปิดตี้ชวนเพื่อนไปเที่ยวด้วยกันในคลิกเดียว
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#F26430] text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                    <span>ปักหมุด & เปิดตี้ชวนเที่ยว</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#F26430] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#FED7AA]/50">
                    ชวนเพื่อน 1-Click
                  </span>
                </div>
              </div>

              {/* Pillar 4: Explorer Quests & Rewards (Royal Violet) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-[#7C3AED]/40 hover:shadow-xs transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]/60 shadow-2xs">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]/60 shadow-2xs">
                      ✦ แต้มสะสม & สิทธิพิเศษ
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Explorer Quests & Rewards
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      สะสม XP จากชาเลนจ์เช็คอินและร่วมกิจกรรม เลื่อนระดับ Explorer แลกรับส่วนลด Specialty Coffee สิทธิ์เล่นบอร์ดเกมฟรี และของรางวัลสุดพรีเมียม
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#7C3AED] text-[11px]">
                    <Gift className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>กระเป๋าแต้มสะสม XP</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#DDD6FE]/50">
                    แลกของรางวัลฟรี
                  </span>
                </div>
              </div>

            </div>

            {/* 3-Step Infographic Journey Strip (Soft Organic Tints) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                3 ขั้นตอนง่ายๆ ในการเริ่มต้นใช้งาน My Hub
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/90 space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2.5 py-0.5 rounded-md border border-[#A3CEB0]/60 inline-block">
                      ขั้นตอนที่ 1
                    </span>
                    <h5 className="font-extrabold text-sm sm:text-base text-slate-900">สำรวจ & ปักหมุดที่ชอบ</h5>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      ค้นหากิจกรรมคอมมูนิตี้ งานแฟร์ หรือเซฟพิกัดเที่ยว 77 จังหวัด
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/90 space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#2B527A] bg-[#F0F4F8] px-2.5 py-0.5 rounded-md border border-[#CBD5E1]/60 inline-block">
                      ขั้นตอนที่ 2
                    </span>
                    <h5 className="font-extrabold text-sm sm:text-base text-slate-900">รับตั๋ว & รวมตี้ในแชต</h5>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      ระบบออก E-Ticket และนัดหมายลงปฏิทินส่วนตัวให้อัตโนมัติ
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/90 space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2.5 py-0.5 rounded-md border border-[#DDD6FE]/60 inline-block">
                      ขั้นตอนที่ 3
                    </span>
                    <h5 className="font-extrabold text-sm sm:text-base text-slate-900">เช็คอิน & แลกรางวัล</h5>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      ร่วมกิจกรรมจริง รับแต้มสะสม XP แลกสิทธิพิเศษมากมาย
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs (Equal Size & Balanced Alignment) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-lg mx-auto w-full">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:flex-1 h-12 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#2563EB] whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>เข้าสู่ระบบสมาชิก</span>
              </button>
              <Link
                href="/onboarding"
                className="w-full sm:flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>สมัครสมาชิกใหม่ (ฟรี)</span>
              </Link>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/"
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับไปสำรวจกิจกรรมในหน้าแรก</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. MEMBER KEYCARD PASSPORT (Clean Minimal White Header)                   */}
            {/* ========================================================================= */}
            <section className="bg-white border-b border-slate-200/80 pt-3 pb-3 sm:pt-4 sm:pb-4">
              <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Who this hub belongs to, and three real numbers from the account (levels and points return with the challenges work) */}
                {/* One row: name, the numbers, and the calendar or list switch */}
                <div className="text-slate-900">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div className="flex items-center gap-3 min-w-0 basis-full lg:basis-auto lg:flex-1">
                      {hubMember?.avatarUrl ? (
                        <img src={hubMember.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 text-base font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                          {nameInitial(hubName)}
                        </span>
                      )}
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">มายฮับของ{hubName ? ` ${hubName}` : 'คุณ'}</h1>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {[
                        { label: 'นัดหมาย', value: upcomingEventsTotalCount, onClick: handleQuickFilterUpcoming, active: hubMainMode === 'categories' && eventViewMode === 'upcoming' },
                        { label: 'เคยเข้าร่วม', value: attendedEventsTotalCount, onClick: handleQuickFilterAttended, active: hubMainMode === 'categories' && eventViewMode === 'past' },
                        { label: 'ที่เที่ยวที่บันทึก', value: savedSpotIds.length, onClick: () => { setHubMainMode('categories'); setActiveSubTab('scrapbook'); }, active: hubMainMode === 'categories' && activeSubTab === 'scrapbook' },
                      ].map((metric) => (
                        <button
                          key={metric.label}
                          type="button"
                          onClick={metric.onClick}
                          aria-pressed={metric.active}
                          className={`shrink-0 inline-flex items-baseline gap-1.5 h-9 px-3 rounded-full cursor-pointer border transition-colors ${metric.active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className={`text-sm font-extrabold tabular-nums leading-9 ${metric.active ? 'text-white' : 'text-slate-900'}`}>{metric.value}</span>
                          <span className={`text-xs font-semibold whitespace-nowrap leading-9 ${metric.active ? 'text-slate-200' : 'text-slate-600'}`}>{metric.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/90 lg:ml-auto" role="group" aria-label="มุมมอง">
                      {([
                        { mode: 'calendar', label: 'ปฏิทิน', Icon: CalendarDays },
                        { mode: 'categories', label: 'รายการ', Icon: Layers },
                        // Only for a member who runs events; a guest never sees it
                        ...(activity.hosted.length > 0 ? [{ mode: 'hosting', label: 'งานที่จัด', Icon: Crown } as const] : []),
                      ] as const).map(({ mode, label, Icon }) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={hubMainMode === mode}
                          onClick={() => {
                            setHubMainMode(mode);
                            if (mode === 'categories') setSelectedCalDay(null);
                          }}
                          className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${hubMainMode === mode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          <Icon className={`w-4 h-4 ${hubMainMode === mode ? 'text-slate-900' : 'text-slate-400'}`} aria-hidden="true" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* What the member is in the middle of: challenges under way and events they run, side by side on a wide screen */}
                {(doingChallenges.length > 0 || hostedUpcoming.length > 0) && (
                <div className={`mt-4 grid grid-cols-1 gap-3 items-start ${doingChallenges.length > 0 && hostedUpcoming.length > 0 ? 'lg:grid-cols-2' : ''}`}>

                {/* Challenges the member is doing: how far they are, how long is left, and the way back to each */}
                {doingChallenges.length > 0 && (
                  <section aria-label="ชาเลนจ์ที่ทำอยู่" className="bg-white rounded-2xl px-4 py-3 border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xs font-bold text-slate-500">ชาเลนจ์ที่ทำอยู่</h2>
                      {doingChallenges.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setHubMainMode('categories');
                            setActiveSubTab('quests_rewards');
                          }}
                          className="text-xs sm:text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          ดูทั้งหมด <span className="tabular-nums">({doingChallenges.length})</span>
                        </button>
                      )}
                    </div>
                    <ul className="mt-1.5 divide-y divide-slate-100">
                      {doingChallenges.slice(0, 2).map((challenge) => (
                        <li key={challenge.questId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-sm font-bold text-slate-900 truncate">{challenge.title}</p>
                            <div className="h-1.5 rounded-full bg-[#F5F3FF] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={challenge.total} aria-valuenow={challenge.current}>
                              <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.round((challenge.current / challenge.total) * 100)}%` }} />
                            </div>
                            <p className="text-xs font-medium text-slate-500 tabular-nums">
                              ไปแล้ว {challenge.current} จาก {challenge.total}
                              {challenge.daysRemaining !== undefined ? ` · เหลือ ${challenge.daysRemaining} วัน` : ''}
                            </p>
                          </div>
                          <Link
                            href={`/challenges/${encodeURIComponent(challenge.questId)}`}
                            className="shrink-0 inline-flex items-center h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
                          >
                            ไปต่อ
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Events the member runs: who is coming, and check-in at the meeting point */}
                {hostedUpcoming.length > 0 && (
                  <section aria-label="กิจกรรมที่คุณจัด" className="bg-white rounded-2xl px-4 py-3 border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xs font-bold text-slate-500">งานถัดไปที่คุณจัด</h2>
                      <button type="button" onClick={() => setHubMainMode('hosting')} className="text-xs sm:text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                        งานที่จัดทั้งหมด <span className="tabular-nums">({activity.hosted.length})</span>
                      </button>
                    </div>
                    <ul className="mt-1.5 divide-y divide-slate-100">
                      {hostedUpcoming.slice(0, 1).map((ev) => (
                        <li key={ev.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 truncate tabular-nums">
                              {[thaiShortDate(ev.date), ev.time].filter(Boolean).join(' · ')} · {ev.participantsCount ?? 0}/{ev.maxParticipants ?? 0} คน
                            </p>
                          </div>
                          {ev.approvalStatus === 'approved' ? (
                            <button type="button" onClick={() => openCheckIn(ev)} className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap">
                              <Users className="w-4 h-4" aria-hidden="true" />
                              <span className="sm:hidden">เช็กอิน</span>
                              <span className="hidden sm:inline">รายชื่อและเช็กอิน</span>
                            </button>
                          ) : (
                            <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap">
                              {ev.approvalStatus === 'rejected' ? 'ไม่ผ่านการตรวจ' : 'รอทีมงานตรวจ'}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                </div>
                )}

                {/* Places and challenge ideas sent to staff */}
                <MySubmissions />

                {/* Development only: sample activity for this account, so every feature can be seen with one login */}
                {process.env.NODE_ENV !== 'production' && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500" role="note">
                    <span>โหมดพัฒนา · ข้อมูลตัวอย่างของบัญชีนี้</span>
                    <button type="button" disabled={isDemoBusy} onClick={() => void runDemo('POST')} className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline disabled:text-slate-400 cursor-pointer">
                      {isDemoBusy ? 'กำลังทำ…' : 'เติม'}
                    </button>
                    <button type="button" disabled={isDemoBusy} onClick={() => void runDemo('DELETE')} className="font-bold text-slate-600 hover:text-slate-900 hover:underline disabled:text-slate-400 cursor-pointer">
                      ลบ
                    </button>
                  </p>
                )}

                {/* Sub Tabs Navigation: Unified Minimal Clean Styling (Visible in categories mode) */}
                {hubMainMode === 'categories' && (
                  <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar">
                    {/* Tab 1: Community Meetups */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('community')}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeSubTab === 'community'
                          ? 'bg-[#FFF4EE] text-[#F26430] border border-orange-200 shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <Users className={`w-4 h-4 ${activeSubTab === 'community' ? 'text-[#F26430]' : 'text-slate-400'}`} />
                      <span>ตี้กิจกรรมคอมมูนิตี้ ({communityCount})</span>
                    </button>

                    {/* Buddy trips: the same group the calendar shows */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('trips')}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeSubTab === 'trips'
                          ? 'bg-[#FEF3EE] text-[#D04A1B] border border-[#FCD5C5] shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 ${activeSubTab === 'trips' ? 'text-[#D04A1B]' : 'text-slate-400'}`} />
                      <span>ทริปชวนเพื่อน ({tripCount})</span>
                    </button>

                    {/* Tab 2: Fairs & Expos */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('fairs')}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeSubTab === 'fairs'
                          ? 'bg-[#EEF4FA] text-[#2B527A] border border-blue-200 shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <Calendar className={`w-4 h-4 ${activeSubTab === 'fairs' ? 'text-[#2B527A]' : 'text-slate-400'}`} />
                      <span>งานแฟร์ & นิทรรศการ ({eventViewMode === 'all' ? expoEvents.length : filteredExpoEvents.length})</span>
                    </button>

                    {/* Tab 3: Travel Scrapbook */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('scrapbook')}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeSubTab === 'scrapbook'
                          ? 'bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0] shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <BookOpen className={`w-4 h-4 ${activeSubTab === 'scrapbook' ? 'text-[#2D5A3C]' : 'text-slate-400'}`} />
                      <span>สมุดบันทึกพิกัดเที่ยว ({savedSpotsList.length})</span>
                    </button>

                    {/* Tab 4: Quests & Rewards */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('quests_rewards')}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeSubTab === 'quests_rewards'
                          ? 'bg-[#F5F3FF] text-[#7C3AED] border border-purple-200 shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <Trophy className={`w-4 h-4 ${activeSubTab === 'quests_rewards' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                      <span>ชาเลนจ์ & XP ({myChallenges.length})</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 2. MAIN CONTENT AREA                                                      */}
            {/* ========================================================================= */}
            <main id="hub-content-section" className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {hubMainMode === 'calendar' ? (
                renderMasterCalendarView()
              ) : hubMainMode === 'hosting' ? (
                renderHostingView()
              ) : (
                <>

              {/* ============================================================= */}
              {/* TAB 1: 👥 COMMUNITY MEETUPS (Digital Boarding Pass Style)     */}
              {/* ============================================================= */}
              {(activeSubTab === 'community' || activeSubTab === 'trips') && (
                <div className="space-y-6">
                  {/* Smart Control Bar */}
                  <div className="space-y-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEventViewMode('all')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'all'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          ทั้งหมด ({communityEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventViewMode('upcoming')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'upcoming'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          กำลังจะมาถึง ({upcomingCommunityEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventViewMode('past')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'past'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          กิจกรรมที่ผ่านมา ({pastCommunityEvents.length})
                        </button>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        <span>แสดง {filteredCommunityEvents.length} {activeSubTab === 'trips' ? 'ทริป' : 'ตี้'}</span>
                      </div>
                    </div>

                    {/* Sub-filters for Past Events: Attended vs Not Attended / Cancelled */}
                    {eventViewMode === 'past' && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 animate-fade-in">
                        <span className="text-[11px] text-slate-400 font-bold mr-1">แยกตามสถานะจริง:</span>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('all')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pastSubFilter === 'all'
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ทั้งหมดที่ผ่านมา ({pastCommunityEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('attended')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            pastSubFilter === 'attended'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>เข้าร่วมสำเร็จแล้ว ({pastCommunityEvents.filter((e) => getEventAttendanceStatus(e) === 'attended').length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('not_attended')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            pastSubFilter === 'not_attended'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>ไม่ได้ไป / ยกเลิก ({pastCommunityEvents.filter((e) => getEventAttendanceStatus(e) !== 'attended').length})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredCommunityEvents.length === 0 ? (
                    /* Clean Empty State */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200/90 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-2xs border border-slate-200/70">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900">
                          {eventViewMode === 'all'
                            ? activeSubTab === 'trips' ? 'ยังไม่มีทริปชวนเพื่อนในมายฮับของคุณ' : 'ยังไม่มีตี้ในมายฮับของคุณ'
                            : eventViewMode === 'upcoming'
                            ? 'ยังไม่มีตี้กิจกรรมที่คุณเข้าร่วม'
                            : pastSubFilter === 'attended'
                            ? 'ยังไม่มีกิจกรรมที่เข้าร่วมสำเร็จ'
                            : pastSubFilter === 'not_attended'
                            ? 'ไม่มีรายการที่ยกเลิกหรือไม่ไปเข้าร่วม'
                            : 'ไม่มีประวัติกิจกรรมที่ผ่านมา'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {activeSubTab === 'trips' ? 'เปิดดูที่เที่ยวที่ชอบ แล้วชวนเพื่อนไปด้วยกันได้จากหน้านั้นเลย' : 'หาเพื่อนใหม่ วิ่ง บอร์ดเกม เวิร์กช็อป ตี้กาแฟ ในคอมมูนิตี้ที่ปลอดภัยไร้แรงกดดัน'}
                        </p>
                      </div>
                      <Link
                        href={activeSubTab === 'trips' ? '/spots' : '/community'}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>{activeSubTab === 'trips' ? 'ดูที่เที่ยว' : 'สำรวจกิจกรรมคอมมูนิตี้'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    /* Community Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {filteredCommunityEvents.map((event, idx) => {
                        const ticketId = `CCH-2026-${(idx + 101).toString().padStart(4, '0')}`;
                        const isMenuOpen = activeMenuId === event.id;
                        const moodTheme = getCommunityMoodTheme(event.category);
                        const status = getEventAttendanceStatus(event);
                        const isCancelled = status === 'cancelled';
                        const isMissed = status === 'missed';
                        const isAttended = status === 'attended';
                        const isReviewed = reviewedEventIds.includes(event.id);
                        const isHost = Boolean(event.isHost || userCreatedEvents.some((u) => u.id === event.id));

                        return (
                          <div
                            key={event.id}
                            className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1 shadow-2xs hover:shadow-md ${
                              isCancelled
                                ? 'opacity-85 hover:opacity-100 border-rose-200/70 bg-rose-50/15'
                                : isMissed
                                ? 'border-amber-200/70 bg-amber-50/10'
                                : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            {/* Card Image */}
                            <Link
                              href={`/community/${encodeURIComponent(event.id)}`}
                              className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0 block cursor-pointer"
                              title={`ดูรายละเอียด ${event.title}`}
                            >
                              <img
                                src={event.image}
                                alt={event.title}
                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                                  isCancelled ? 'grayscale-40' : ''
                                }`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60" />

                              {/* Status Badges */}
                              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                                {isCancelled ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                    <span>ยกเลิกการเข้าร่วม</span>
                                  </span>
                                ) : isMissed ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>ไม่ได้ไปเข้าร่วม</span>
                                  </span>
                                ) : isAttended ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>เข้าร่วมสำเร็จแล้ว</span>
                                  </span>
                                ) : null}

                                {/* Host status badge if user is host */}
                                {(event.isHost || userCreatedEvents.some((u) => u.id === event.id)) && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs inline-flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-white" />
                                    <span>โฮสต์</span>
                                  </span>
                                )}
                              </div>
                            </Link>

                            {/* Card Body */}
                            <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                              <div className="space-y-1.5">
                                {/* Host Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <img
                                      src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                      alt={event.hostName}
                                      className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <span className="text-[11px] font-medium text-slate-500 truncate">
                                      {event.hostName}
                                    </span>
                                  </div>
                                  {event.price && (
                                    <span
                                      className={`text-[11px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                        event.price.includes('ฟรี')
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                      }`}
                                    >
                                      {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <Link
                                  href={`/community/${encodeURIComponent(event.id)}`}
                                  className="block group/title"
                                >
                                  <h3
                                    className={`font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${moodTheme.titleHover} transition-colors leading-[1.3] tracking-tight cursor-pointer`}
                                    title={event.title}
                                  >
                                    {event.title}
                                  </h3>
                                </Link>

                                {/* Meta Info */}
                                <div className="space-y-1 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{event.date} • {event.time}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate text-slate-600 font-medium" title={event.location}>
                                      {event.location}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Area: Dynamically changes based on attendance */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                                {isCancelled ? (
                                  /* Cancelled State: Link to fullpage */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href={`/community/${encodeURIComponent(event.id)}`}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                      <span>ดูข้อมูลงาน</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttended(event.id, event.title)}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                      title="เปลี่ยนสถานะเป็นไปร่วมจริง"
                                    >
                                      <span>ไปร่วมจริง</span>
                                    </button>
                                  </div>
                                ) : isMissed ? (
                                  /* Missed State: NO review, can view others' moments */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href="/moments"
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate active:scale-95"
                                      title="ดูภาพบรรยากาศจากเพื่อนคนอื่นในคอมมูนิตี้"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>ดูบรรยากาศ</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttended(event.id, event.title)}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                      title="คลิกหากคุณได้ไปร่วมจริง เพื่อเปิดให้รีวิวและแชร์โมเมนต์"
                                    >
                                      <span>ฉันไปร่วมจริง</span>
                                    </button>
                                  </div>
                                ) : isAttended ? (
                                  /* Attended State: Share Moments + Review & Rate Host (+50 XP) */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href={`/moments?createForEvent=${encodeURIComponent(event.id)}&eventTitle=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}&image=${encodeURIComponent(event.image)}`}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                      title="แชร์รูปภาพและโมเมนต์ความประทับใจลงคอมมูนิตี้"
                                    >
                                      <Camera className="w-3.5 h-3.5 shrink-0" />
                                      <span>แชร์โมเมนต์</span>
                                    </Link>

                                    {isHost ? (
                                      /* The host looks back at who came; a host does not review themselves */
                                      <button
                                        type="button"
                                        onClick={() => openCheckIn(event)}
                                        className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                      >
                                        <Users className="w-3.5 h-3.5" />
                                        <span>รายชื่อ</span>
                                      </button>
                                    ) : isReviewed ? (
                                      <button
                                        type="button"
                                        disabled
                                        className="py-1.5 px-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center justify-center gap-1 shrink-0 cursor-default"
                                        title="คุณได้รีวิวและให้คะแนนแล้ว (+50 XP เรียบร้อย)"
                                      >
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span>รีวิวแล้ว</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTipTargetEvent(event);
                                          setIsTipModalOpen(true);
                                        }}
                                        className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                        title="ให้คะแนนและรีวิวโฮสต์ รับ +50 XP"
                                      >
                                        <Star className="w-3.5 h-3.5 text-amber-500" />
                                        <span>รีวิวโฮสต์</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  /* Upcoming State: Normal E-Ticket + Chat OR Host Management */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    {isHost ? (
                                      <Link
                                        href={`/community/${encodeURIComponent(event.id)}`}
                                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                        title="ไปที่หน้ารายละเอียดกิจกรรมเพื่อดูแลตี้และตรวจสอบสมาชิก"
                                      >
                                        <Crown className="w-3.5 h-3.5 shrink-0 text-white" />
                                        <span>จัดการตี้</span>
                                      </Link>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedTicketEvent(event);
                                          setSelectedTicketId(ticketId);
                                          setIsETicketModalOpen(true);
                                        }}
                                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                      >
                                        <QrCode className="w-3.5 h-3.5 shrink-0" />
                                        <span>ดูบัตร</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChatTargetEvent(event);
                                        setIsChatModalOpen(true);
                                      }}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EBF3ED] text-slate-700 hover:text-[#2D5A3C] border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                      title={isHost ? 'เปิดห้องแชตคุยกับลูกทีม' : 'เปิดห้องแชตกลุ่ม'}
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{isHost ? 'แชตลูกทีม' : 'แชต'}</span>
                                    </button>
                                  </div>
                                )}

                                {/* Context Menu Button */}
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(isMenuOpen ? null : event.id);
                                    }}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="ตัวเลือกเพิ่มเติม"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {isMenuOpen && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in"
                                    >
                                      <Link
                                        href={`/community/${encodeURIComponent(event.id)}`}
                                        onClick={() => setActiveMenuId(null)}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>ดูรายละเอียดงาน</span>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          showToast(`คัดลอกลิงก์กิจกรรม ${event.title} แล้ว!`);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>แชร์นัดหมาย</span>
                                      </button>

                                      <div className="my-1 border-t border-slate-100" />

                                      {/* Context actions depending on attendance status */}
                                      {isAttended ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkMissed(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                            <span>แจ้งว่าไม่ได้ไปร่วมจริง</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>ลบออกจากประวัติ</span>
                                          </button>
                                        </>
                                      ) : isMissed ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkAttended(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>เปลี่ยนเป็นเข้าร่วมสำเร็จ</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>ลบออกจากประวัติ</span>
                                          </button>
                                        </>
                                      ) : isCancelled ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkAttended(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>กู้คืนเป็นไปร่วมงาน</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            <span>ลบออกจากประวัติถาวร</span>
                                          </button>
                                        </>
                                      ) : isHost ? (
                                        <Link
                                          href={`/community/${encodeURIComponent(event.id)}`}
                                          onClick={() => setActiveMenuId(null)}
                                          className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                                          <span>จัดการและปิดรับสมัคร</span>
                                        </Link>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setCancelTargetEvent(event);
                                            setCancelTargetTicketId(ticketId);
                                            setIsCancelModalOpen(true);
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                          <span>ยกเลิกการเข้าร่วม</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: 🏛️ FAIRS & EXPOS                                       */}
              {/* ============================================================= */}
              {activeSubTab === 'fairs' && (
                <div className="space-y-6">
                  {/* Smart Control Bar */}
                  <div className="space-y-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEventViewMode('all')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'all'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          ทั้งหมด ({expoEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventViewMode('upcoming')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'upcoming'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          กำลังจะมาถึง ({upcomingExpoEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventViewMode('past')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            eventViewMode === 'past'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          งานที่ผ่านไปแล้ว ({pastExpoEvents.length})
                        </button>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        <span>แสดง {filteredExpoEvents.length} งาน</span>
                      </div>
                    </div>

                    {/* Sub-filters for Past Fairs: Attended vs Not Attended / Cancelled */}
                    {eventViewMode === 'past' && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 animate-fade-in">
                        <span className="text-[11px] text-slate-400 font-bold mr-1">แยกตามสถานะจริง:</span>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('all')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pastSubFilter === 'all'
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ทั้งหมดที่ผ่านมา ({pastExpoEvents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('attended')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            pastSubFilter === 'attended'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ไปร่วมงานแล้ว ({pastExpoEvents.filter((e) => getEventAttendanceStatus(e) === 'attended').length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPastSubFilter('not_attended')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            pastSubFilter === 'not_attended'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>ไม่ได้ไป / ยกเลิก ({pastExpoEvents.filter((e) => getEventAttendanceStatus(e) !== 'attended').length})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredExpoEvents.length === 0 ? (
                    /* Clean Compact Empty State */
                    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                          <Calendar className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {eventViewMode === 'all'
                              ? 'ยังไม่มีงานแฟร์ในมายฮับของคุณ'
                              : eventViewMode === 'upcoming'
                              ? 'ยังไม่มีงานแฟร์ที่คุณบันทึกนัดไว้'
                              : pastSubFilter === 'attended'
                              ? 'ยังไม่มีงานแฟร์ที่ไปร่วมงานแล้ว'
                              : pastSubFilter === 'not_attended'
                              ? 'ไม่มีรายการที่ยกเลิกหรือไม่ไปเข้าร่วม'
                              : 'ไม่มีประวัติงานแฟร์ที่ผ่านมา'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            อัปเดตงานอีเวนต์ใหญ่ นิทรรศการ งานหนังสือ เทศกาลกาแฟ และเอ็กซ์โปทั่วประเทศ
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/fairs"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
                      >
                        <span>สำรวจงานแฟร์</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    /* Fairs Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {filteredExpoEvents.map((event, idx) => {
                        const ticketId = `CCH-FAIR-${(idx + 201).toString().padStart(4, '0')}`;
                        const isMenuOpen = activeMenuId === event.id;
                        const status = getEventAttendanceStatus(event);
                        const isCancelled = status === 'cancelled';
                        const isMissed = status === 'missed';
                        const isAttended = status === 'attended';

                        return (
                          <div
                            key={event.id}
                            className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1 shadow-2xs hover:shadow-md ${
                              isCancelled
                                ? 'opacity-85 hover:opacity-100 border-rose-200/70 bg-rose-50/15'
                                : isMissed
                                ? 'border-amber-200/70 bg-amber-50/10'
                                : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            {/* Card Image */}
                            <Link
                              href={`/fairs/${encodeURIComponent(event.id)}`}
                              className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0 block cursor-pointer"
                              title={`ดูรายละเอียด ${event.title}`}
                            >
                              <img
                                src={event.image}
                                alt={event.title}
                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                                  isCancelled ? 'grayscale-40' : ''
                                }`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60" />

                              {/* Status Badges */}
                              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                                {isCancelled ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                    <span>ยกเลิกการเข้าร่วม</span>
                                  </span>
                                ) : isMissed ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>ไม่ได้ไปเข้าร่วม</span>
                                  </span>
                                ) : isAttended ? (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/95 text-white shadow-xs backdrop-blur-md inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>ไปร่วมงานแล้ว</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold bg-[#EEF4FA]/95 backdrop-blur-md text-[#2B527A] border border-[#B8D1E8] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 text-[#2B527A] stroke-[2.5]" />
                                    <span>บันทึกแล้ว</span>
                                  </span>
                                )}
                              </div>
                            </Link>

                            {/* Card Body */}
                            <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-[#2B527A] font-bold bg-[#EEF4FA] border border-[#B8D1E8]/70 px-2 py-0.5 rounded-md truncate">
                                    {event.venueTag || 'ศูนย์นิทรรศการ'}
                                  </span>
                                  {event.price && (
                                    <span
                                      className={`text-[11px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                        event.price.includes('ฟรี')
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                      }`}
                                    >
                                      {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                                    </span>
                                  )}
                                </div>

                                <Link
                                  href={`/fairs/${encodeURIComponent(event.id)}`}
                                  className="block group/title"
                                >
                                  <h3
                                    className="font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] group-hover:text-[#2B527A] transition-colors leading-[1.3] tracking-tight cursor-pointer"
                                    title={event.title}
                                  >
                                    {event.title}
                                  </h3>
                                </Link>

                                <div className="space-y-1 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{event.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate text-slate-600 font-medium" title={event.location}>
                                      {event.location}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Dynamically changes based on attendance */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                                {isCancelled ? (
                                  /* Cancelled State: NO share moment */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href={`/fairs/${encodeURIComponent(event.id)}`}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                      <span>ดูข้อมูลงาน</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttended(event.id, event.title)}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                      title="เปลี่ยนสถานะเป็นไปร่วมจริง"
                                    >
                                      <span>ไปร่วมจริง</span>
                                    </button>
                                  </div>
                                ) : isMissed ? (
                                  /* Missed State: NO share moment */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href="/moments"
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate active:scale-95"
                                      title="ดูภาพบรรยากาศจากเพื่อนคนอื่นในคอมมูนิตี้"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>ดูบรรยากาศ</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAttended(event.id, event.title)}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                                      title="คลิกหากคุณได้ไปร่วมจริง เพื่อเปิดให้แชร์โมเมนต์"
                                    >
                                      <span>ฉันไปร่วมจริง</span>
                                    </button>
                                  </div>
                                ) : isAttended ? (
                                  /* Attended State: Share Moments + View Details */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href={`/moments?createForEvent=${encodeURIComponent(event.id)}&eventTitle=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}&image=${encodeURIComponent(event.image)}`}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                      title="แชร์รูปภาพและโมเมนต์ความประทับใจลงคอมมูนิตี้"
                                    >
                                      <Camera className="w-3.5 h-3.5 shrink-0" />
                                      <span>แชร์โมเมนต์</span>
                                    </Link>

                                    <Link
                                      href={`/fairs/${encodeURIComponent(event.id)}`}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EEF4FA] text-[#2B527A] border border-slate-200 hover:border-[#B8D1E8] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                      title="ดูข้อมูลงาน"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-[#2B527A]" />
                                      <span>ข้อมูลงาน</span>
                                    </Link>
                                  </div>
                                ) : (
                                  /* Upcoming State */
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <Link
                                      href={`/fairs/${encodeURIComponent(event.id)}`}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                    >
                                      <span>ดูข้อมูลงาน</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChatTargetEvent(event);
                                        setIsChatModalOpen(true);
                                      }}
                                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EEF4FA] text-[#2B527A] border border-slate-200 hover:border-[#B8D1E8] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                      title="ชวนเพื่อนเดินงาน"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-[#2B527A]" />
                                      <span>แชต</span>
                                    </button>
                                  </div>
                                )}

                                {/* Context Menu Button */}
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(isMenuOpen ? null : event.id);
                                    }}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="ตัวเลือกเพิ่มเติม"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {isMenuOpen && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in"
                                    >
                                      <Link
                                        href={`/fairs/${encodeURIComponent(event.id)}`}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>ดูข้อมูลงาน</span>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          showToast(`คัดลอกลิงก์ ${event.title} แล้ว!`);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>แชร์งานอีเวนต์</span>
                                      </button>

                                      <div className="my-1 border-t border-slate-100" />

                                      {/* Context actions depending on attendance status */}
                                      {isAttended ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkMissed(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                            <span>แจ้งว่าไม่ได้ไปร่วมจริง</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>นำออกจากประวัติ</span>
                                          </button>
                                        </>
                                      ) : isMissed ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkAttended(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>เปลี่ยนเป็นไปร่วมงานแล้ว</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>นำออกจากประวัติ</span>
                                          </button>
                                        </>
                                      ) : isCancelled ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handleMarkAttended(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>กู้คืนเป็นไปร่วมงาน</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              handlePermanentRemove(event.id, event.title);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            <span>ลบออกจากประวัติถาวร</span>
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setCancelTargetEvent(event);
                                            setCancelTargetTicketId(ticketId);
                                            setIsCancelModalOpen(true);
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                          <span>ยกเลิกการเข้าร่วม</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: 🌲 TRAVEL SCRAPBOOK                                     */}
              {/* ============================================================= */}
              {activeSubTab === 'scrapbook' && (
                <div className="space-y-6">
                  {/* Scrapbook Header Banner */}
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="space-y-0.5">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#2D5A3C]" />
                        <span>สมุดบันทึกพิกัดเที่ยว 77 จังหวัด ({savedSpotsList.length} แห่ง)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        พิกัดจุดฮีลใจและคาเฟ่ที่คุณปักหมุดไว้ สามารถกดปุ่ม &ldquo;ชวนเพื่อนไปที่นี่&rdquo; เพื่อเปิดตี้ได้ทันที
                      </p>
                    </div>

                    <Link
                      href="/spots"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>สำรวจพิกัดเพิ่ม</span>
                    </Link>
                  </div>

                  {/* Search & Vibe Filters (Shown when user has saved spots) */}
                  {savedSpotIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                      {/* Search Input */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="ค้นหาชื่อพิกัด, จังหวัด, อำเภอ..."
                          value={scrapbookSearch}
                          onChange={(e) => setScrapbookSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5A3C]/20 focus:border-[#2D5A3C] transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        {scrapbookSearch && (
                          <button
                            type="button"
                            onClick={() => setScrapbookSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Vibe Chips (Horizontal Scrollable) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                        {[
                          { id: 'all', label: 'ทั้งหมด' },
                          { id: 'cafe_slowbar', label: 'คาเฟ่' },
                          { id: 'nature_camping', label: 'ธรรมชาติ' },
                          { id: 'mountain_mist', label: 'ขุนเขา' },
                          { id: 'sea_island', label: 'ทะเล' },
                          { id: 'art_creative', label: 'ศิลปะ' },
                          { id: 'oldtown_culture', label: 'ย่านเก่า' },
                        ].map((vibe) => {
                          const active = scrapbookVibeFilter === vibe.id;
                          return (
                            <button
                              key={vibe.id}
                              type="button"
                              onClick={() => setScrapbookVibeFilter(vibe.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs cursor-pointer ${
                                active
                                  ? 'bg-slate-900 text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {vibe.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Spots Grid or Empty State */}
                  {savedSpotIds.length === 0 ? (
                    /* Initial Empty State */
                    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                          <Compass className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            ยังไม่มีพิกัดในสมุดบันทึกสถานที่เที่ยว
                          </h4>
                          <p className="text-xs text-slate-500">
                            เมื่อคุณพบสถานที่ท่องเที่ยวหรือจุดฮีลใจที่น่าสนใจ ให้กดปุ่มบันทึกลงสมุดเพื่อรวบรวมไว้ที่นี่
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/spots"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
                      >
                        <span>สำรวจพิกัด 77 จังหวัด</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : savedSpotsList.length === 0 ? (
                    /* Search / Filter Empty State */
                    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            ไม่พบพิกัดที่ตรงกับเงื่อนไขการค้นหา
                          </h4>
                          <p className="text-xs text-slate-500">
                            ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูสถานที่ทั้งหมดในสมุดบันทึก
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScrapbookSearch('');
                          setScrapbookVibeFilter('all');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
                      >
                        <span>ล้างตัวกรอง</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {savedSpotsList.map((spotItem) => (
                        <div
                          key={spotItem.id}
                          className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1"
                        >
                          {/* Spot Image */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={resolveSpotImage(spotItem)}
                              alt={spotItem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                            {/* Top-Left: Saved Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                              <span className="text-[11px] font-bold bg-[#EBF3ED]/95 backdrop-blur-md text-[#2D5A3C] border border-[#A3CEB0] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-[#2D5A3C]" />
                                <span>บันทึกแล้ว</span>
                              </span>
                            </div>

                            {/* Bottom-Right: Rating */}
                            <div className="absolute bottom-2 right-2.5 z-10">
                              <span className="text-[11px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{spotItem.rating}</span>
                              </span>
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="flex items-center gap-1 text-[#2D5A3C] font-semibold truncate">
                                  <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                                  <span className="truncate">{spotItem.district}, {spotItem.province}</span>
                                </span>
                                <span
                                  className={`text-[11px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                    spotItem.price.includes('ฟรี')
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {formatSpotBadgePrice(spotItem.price)}
                                </span>
                              </div>

                              <Link
                                href={`/spots/${encodeURIComponent(spotItem.id)}`}
                                className="font-bold text-[13px] sm:text-sm text-slate-900 group-hover:text-[#2D5A3C] transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] leading-[1.3] tracking-tight block"
                                title={spotItem.title}
                              >
                                {spotItem.title}
                              </Link>

                              <div className="space-y-1 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{spotItem.openHours}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Open Spot & Spot Buddy Gathering */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs mt-auto">
                              {/* Only places staff opened for meet-ups (the server refuses the others) */}
                              {spotItem.meetupAllowed && spotItem.category !== 'bar' && <button
                                type="button"
                                onClick={() => handleOpenSpotBuddy(spotItem)}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                title="เปิดตี้ชวนเพื่อนไปที่นี่"
                              >
                                <Users className="w-3.5 h-3.5 shrink-0" />
                                <span>ชวนเพื่อนไป</span>
                              </button>}

                              <Link
                                href={`/spots/${encodeURIComponent(spotItem.id)}`}
                                className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 shadow-2xs"
                                title="เปิดดูพิกัดสถานที่"
                              >
                                <span>ดูพิกัด</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromScrapbook(spotItem.id, spotItem.title)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                title="นำออกจากสมุดบันทึก"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 4: ⚡ QUESTS & REWARDS (Gamified Lifestyle Locker)       */}
              {/* ============================================================= */}
              {activeSubTab === 'quests_rewards' && (
                <div className="space-y-8">
                  {/* Section 1: Active Quests Header Bar */}
                  {(() => {
                    const inProgressQuests = myChallenges.filter((q) => q.progressPercent < 100 && (q as any).status !== 'ended' && ((q as any).daysRemaining === undefined || (q as any).daysRemaining > 0));
                    const completedQuests = myChallenges.filter((q) => q.progressPercent >= 100);
                    const expiredQuests = myChallenges.filter((q) => q.progressPercent < 100 && ((q as any).status === 'ended' || ((q as any).daysRemaining !== undefined && (q as any).daysRemaining <= 0)));

                    const filteredMyChallenges = myChallenges.filter((q) => {
                      const isDone = q.progressPercent >= 100;
                      const isEnded = (q as any).status === 'ended' || ((q as any).daysRemaining !== undefined && (q as any).daysRemaining <= 0);
                      if (questStatusFilter === 'in_progress') return !isDone && !isEnded;
                      if (questStatusFilter === 'completed') return isDone;
                      if (questStatusFilter === 'expired') return !isDone && isEnded;
                      return true;
                    });

                    return (
                      <>
                        {myRewards.finished.length > 0 && (
                          <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3" aria-labelledby="my-badges-title">
                            <h4 id="my-badges-title" className="text-sm sm:text-base font-extrabold text-slate-900">
                              เหรียญของคุณ <span className="tabular-nums">({myRewards.finished.length})</span>
                            </h4>
                            <ul className="space-y-2">
                              {myRewards.finished.map((done) => (
                                <li key={done.questId}>
                                  <Link href={`/challenges/${encodeURIComponent(done.questId)}`} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <span className="w-10 h-10 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                                      <Award className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-extrabold text-slate-900 truncate">{done.badgeLabel}</span>
                                      <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{done.title}</span>
                                      {done.voucherCode && (
                                        <span className="block mt-1 text-xs sm:text-sm font-bold text-slate-800 tabular-nums break-all">
                                          รหัสรางวัล {done.voucherCode} {done.voucherUsedAt ? '(ใช้แล้ว)' : ''}
                                        </span>
                                      )}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                              <Trophy className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <span>ชาเลนจ์ของคุณ</span>
                                <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200/80">
                                  {myChallenges.length} ชาเลนจ์
                                </span>
                              </h4>
                              <p className="text-xs text-slate-500">
                                สะสม XP และปลดล็อกเข็มกลัดเกียรติยศลงบนโปรไฟล์ของคุณ
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Filter Chips */}
                            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setQuestStatusFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  questStatusFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                ทั้งหมด ({myChallenges.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuestStatusFilter('in_progress')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  questStatusFilter === 'in_progress'
                                    ? 'bg-white text-purple-700 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                กำลังทำ ({inProgressQuests.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuestStatusFilter('completed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  questStatusFilter === 'completed'
                                    ? 'bg-white text-emerald-700 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                พิชิตแล้ว ({completedQuests.length})
                              </button>
                              {expiredQuests.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setQuestStatusFilter('expired')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    questStatusFilter === 'expired'
                                      ? 'bg-white text-slate-700 shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  หมดเวลา ({expiredQuests.length})
                                </button>
                              )}
                            </div>

                            <Link
                              href="/challenges"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Compass className="w-3.5 h-3.5 text-slate-500" />
                              <span>สำรวจเพิ่ม</span>
                            </Link>
                          </div>
                        </div>

                        {/* Quests Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                          {filteredMyChallenges.length === 0 ? (
                            <div className="col-span-full bg-slate-50/80 rounded-2xl p-8 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
                              ไม่มีชาเลนจ์ในหมวดหมู่นี้
                            </div>
                          ) : (
                            filteredMyChallenges.map((quest) => {
                              const isCompleted = quest.progressPercent >= 100;
                              const isEnded = !isCompleted && ((quest as any).status === 'ended' || ((quest as any).daysRemaining !== undefined && (quest as any).daysRemaining <= 0));
                              const isUrgent = !isCompleted && !isEnded && (quest.daysRemaining || 10) <= 5;
                              const brandReward = getQuestBrandReward(quest);
                              
                              // Category theme helper
                              const getCatTheme = (cat?: string) => {
                                switch (cat) {
                                  case 'move':
                                    return { label: 'Move', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
                                  case 'heal':
                                    return { label: 'Heal', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                                  case 'learn':
                                    return { label: 'Learn', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
                                  case 'chill':
                                  default:
                                    return { label: 'Chill', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
                                }
                              };
                              const catTheme = getCatTheme(quest.category);

                              return (
                                <div
                                  key={quest.id}
                                  className={`group/card bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-2xs hover:shadow-xs hover:-translate-y-0.5 ${
                                    isCompleted
                                      ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-emerald-50/10'
                                      : isEnded
                                      ? 'border-slate-200 bg-slate-50/50 opacity-85'
                                      : 'border-slate-200/90 hover:border-purple-300'
                                  }`}
                                >
                                  {/* Top Row: Icon + Badges & XP */}
                                  <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover/card:scale-105 transition-transform shadow-2xs">
                                      {quest.iconName === 'Flame' ? (
                                        <Flame className="w-5 h-5 text-rose-500" />
                                      ) : quest.iconName === 'Coffee' ? (
                                        <Coffee className="w-5 h-5 text-amber-600" />
                                      ) : quest.iconName === 'Footprints' ? (
                                        <Footprints className="w-5 h-5 text-indigo-500" />
                                      ) : (
                                        <Medal className="w-5 h-5 text-purple-600" />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catTheme.bg}`}>
                                          {catTheme.label}
                                        </span>
                                        {brandReward.type === 'brand_partner' ? (
                                          <span 
                                            title={`ชาเลนจ์พาร์ทเนอร์ทางการ: ${brandReward.partnerName}`}
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-950 border border-amber-200 shrink-0 truncate max-w-[140px] inline-flex items-center gap-1"
                                          >
                                            <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500 shrink-0" />
                                            <span className="truncate">{brandReward.partnerName}</span>
                                          </span>
                                        ) : (
                                          <span 
                                            title="ชาเลนจ์กิจกรรมกลางของ Chill & Connect Hub"
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 shrink-0 truncate max-w-[calc(100%-65px)] inline-flex items-center gap-1"
                                          >
                                            <Crown className="w-2.5 h-2.5 text-purple-700 fill-purple-500 shrink-0" />
                                            <span className="truncate">Chill & Connect</span>
                                          </span>
                                        )}
                                        <span className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md flex items-center gap-0.5 ml-auto shadow-2xs">
                                          <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
                                          <span>+{quest.rewardPoints} XP</span>
                                        </span>
                                      </div>

                                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover/card:text-purple-700 transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                                        {quest.title}
                                      </h5>
                                    </div>
                                  </div>

                                  {/* Goal Box & Brand Privilege Pill */}
                                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                                      <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      <span className="truncate">เหรียญ: {quest.badgeLabel}</span>
                                    </div>
                                    <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11.5px] min-h-[2rem]">
                                      {quest.targetGoal}
                                    </p>

                                    {/* Reward Privilege Pill: Brand Exclusive vs Hub Universal Points */}
                                    {brandReward.type === 'brand_partner' ? (
                                      <div 
                                        title={`สิทธิพิเศษเฉพาะแบรนด์ ${brandReward.partnerName}: ${brandReward.title}`}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-[11px] font-bold shadow-2xs mt-1"
                                      >
                                        <Ticket className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span className="truncate">{brandReward.title}</span>
                                      </div>
                                    ) : (
                                      <div 
                                        title="รับแต้มสะสมพิเศษเพื่อนำไปเลือกแลกของรางวัลในศูนย์กลาง (/rewards)"
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-purple-50/90 border border-purple-200/90 text-purple-950 text-[11px] font-bold shadow-2xs mt-1"
                                      >
                                        <Gift className="w-3 h-3 text-purple-600 shrink-0" />
                                        <span className="truncate">สะสม XP แลกของรางวัลที่ชอบ</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Progress & Duration */}
                                  <div className="space-y-2 pt-0.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                      <span className="text-[11px] text-slate-500">ความคืบหน้า</span>
                                      <span className="text-[11px] font-bold text-purple-700">
                                        {quest.completedCountInfo} ({quest.progressPercent}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/80">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          isCompleted ? 'bg-emerald-600' : isEnded ? 'bg-slate-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                        }`}
                                        style={{ width: `${quest.progressPercent}%` }}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-medium">
                                      <span>{quest.startDate} - {quest.endDate}</span>
                                      {isEnded ? (
                                        <span className="text-slate-400 font-medium">ปิดรับแล้ว</span>
                                      ) : (
                                        <span className={isUrgent ? 'text-rose-600 font-bold' : ''}>
                                          เหลืออีก {quest.daysRemaining || 10} วัน
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <div className="pt-2.5 border-t border-slate-100 mt-auto">
                                    {isCompleted ? (
                                      brandReward.type === 'brand_partner' ? (
                                        <button
                                          type="button"
                                          onClick={() => router.push(`/challenges/${encodeURIComponent(quest.id)}`)}
                                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                                        >
                                          <Ticket className="w-3.5 h-3.5 text-white" />
                                          <span>ดูบัตรกำนัล & QR Code</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => router.push(`/challenges/${encodeURIComponent(quest.id)}`)}
                                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                                        >
                                          <Trophy className="w-3.5 h-3.5 text-amber-300" />
                                          <span>ดูความสำเร็จ & แลกรางวัล</span>
                                        </button>
                                      )
                                    ) : isEnded ? (
                                      <button
                                        type="button"
                                        disabled
                                        className="w-full bg-slate-100 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-200 cursor-not-allowed"
                                      >
                                        ชาเลนจ์สิ้นสุดระยะเวลาแล้ว
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/challenges/${encodeURIComponent(quest.id)}`)}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                                      >
                                        <span>ดูว่าไปที่ไหนต่อ</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {/* Section 2: Rewards Catalog Gateway & Active Voucher Locker */}
                  <div className="space-y-5 pt-4">
                    {/* Gateway Banner to /rewards */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-5 sm:p-6 rounded-3xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#F26430] text-white shadow-2xs">
                            Rewards & Perks
                          </span>
                          <span className="text-xs text-slate-500 font-bold">ศูนย์ของรางวัล & สิทธิพิเศษคอมมูนิตี้</span>
                        </div>
                        <h4 className="font-black text-sm sm:text-base text-slate-900">
                          แลกรับส่วนลดคาเฟ่ บอร์ดเกม และของขวัญพิเศษ
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          คุณมี <strong className="text-[#D04A1B] font-black">{userXp} XP</strong> พร้อมแลกรับสิทธิพิเศษจากพาร์ทเนอร์ทางการในหน้าศูนย์ของรางวัล
                        </p>
                      </div>

                      <Link
                        href="/rewards"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs shrink-0 active:scale-95 cursor-pointer"
                      >
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span>เปิดศูนย์ของรางวัล</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Active Vouchers Locker */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-[#2D5A3C]" />
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">
                            คลังคูปองที่แลกแล้วของคุณ ({redeemedRewardIds.length} ใบ)
                          </h4>
                        </div>
                        <Link
                          href="/rewards?tab=my_vouchers"
                          className="text-xs font-bold text-[#2D5A3C] hover:underline flex items-center gap-1"
                        >
                          <span>จัดการคูปองทั้งหมด</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {redeemedRewardIds.length === 0 ? (
                        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            ยังไม่มีคูปองที่แลกไว้ นำ {userXp} XP ไปแลกรับส่วนลดคาเฟ่หรือตั๋วบอร์ดเกมได้ทันที
                          </p>
                          <Link
                            href="/rewards"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs shrink-0"
                          >
                            <span>ดูของรางวัล</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          {REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id)).map((item) => (
                            <div
                              key={item.id}
                              className="w-full sm:w-auto sm:max-w-[270px] min-h-[105px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between gap-2.5"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold text-[#D04A1B] bg-[#FEF3EE] px-2 py-0.5 rounded-md border border-[#FCD5C5]/70">
                                    {item.discountValue}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    ถึง {item.validUntil}
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {item.title}
                                </h5>
                                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-semibold">
                                  <span className="flex items-center gap-1 truncate">
                                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.partner}</span>
                                  </span>
                                  <Link
                                    href={item.category === 'cafe' ? '/spots?vibe=cafe_slowbar' : '/community?category=chill'}
                                    className="text-[11px] font-bold text-[#2D5A3C] hover:underline flex items-center gap-0.5 shrink-0"
                                    title="ดูพิกัดร้านที่ร่วมรายการ"
                                  >
                                    <span>ดูพิกัด</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                              </div>

                              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-2 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                                  {item.voucherCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyVoucher(item.voucherCode)}
                                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>คัดลอก</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                </>
              )}
            </main>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">
          Lifestyle Discovery & Community Platform ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ
        </p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={0}
      />

      {/* ============================================================= */}
      {/* MODALS                                                        */}
      {/* ============================================================= */}

      {/* 1. E-Ticket Modal */}
      <ETicketModal
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        event={selectedTicketEvent}
        ticketId={selectedTicketId}
        isCheckedIn={checkedInTicketIds.includes(selectedTicketId)}
        onCheckIn={(tId) => {
          handleCheckIn(tId);
        }}
        onOpenCancel={(ev, tId) => {
          setCancelTargetEvent(ev);
          setCancelTargetTicketId(tId);
          setIsCancelModalOpen(true);
        }}
        onOpenChat={(ev) => {
          setChatTargetEvent(ev);
          setIsChatModalOpen(true);
        }}
      />

      {/* 2. Group Chat Modal */}
      <GroupChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        event={chatTargetEvent}
      />

      {/* 3. Cancel Ticket Modal */}
      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        event={cancelTargetEvent}
        ticketId={cancelTargetTicketId}
        onConfirmCancel={handleConfirmCancel}
      />

      {checkInEvent && (
        <DialogShell onClose={() => setCheckInEvent(null)} title="รายชื่อและเช็กอิน" subtitle={checkInEvent.title} size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (checkInCode.trim()) void sendCheckIn({ action: 'check_in', code: checkInCode });
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="check-in-code" className="sr-only">รหัสบัตรของผู้เข้าร่วม</label>
            <input
              id="check-in-code"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="รหัสบัตร 6 ตัว"
              autoComplete="off"
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-2xl px-4 py-3 font-mono text-base tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
            />
            <button type="submit" disabled={checkInCode.trim().length < 6} className={dialogButton.primary}>เช็กอิน</button>
          </form>
          {checkInNote && (
            <p role="status" className={`mt-3 p-3 rounded-2xl border text-sm font-bold ${checkInNote.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>{checkInNote.text}</p>
          )}
          <div className="mt-5">
            <p className="text-xs font-bold text-slate-500">
              {checkInList === null ? 'กำลังโหลดรายชื่อ…' : `ผู้เข้าร่วม ${checkInList.length} คน · เช็กอินแล้ว ${checkInList.filter((p) => p.checkedInAt).length} คน`}
            </p>
            <ul className="mt-2 divide-y divide-slate-100 max-h-[45vh] overflow-y-auto">
              {(checkInList ?? []).map((p) => (
                <li key={p.userId} className="py-2.5 flex items-center justify-between gap-3">
                  <Link href={`/profile?id=${p.userId}`} className="flex items-center gap-2.5 min-w-0">
                    {p.userAvatar ? (
                      <img src={p.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">{nameInitial(p.userName)}</span>
                    )}
                    <span className="text-sm font-semibold text-slate-900 truncate">{tidyDisplayName(p.userName)}{p.isHost ? ' (คุณ)' : ''}</span>
                  </Link>
                  {p.isHost ? (
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">คนจัด</span>
                  ) : p.checkedInAt ? (
                    <button type="button" onClick={() => void sendCheckIn({ action: 'undo', userId: p.userId })} className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer whitespace-nowrap" title="แตะเพื่อยกเลิกเช็กอิน">
                      เช็กอินแล้ว
                    </button>
                  ) : (
                    <button type="button" onClick={() => void sendCheckIn({ action: 'check_in', userId: p.userId })} className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer whitespace-nowrap">
                      เช็กอิน
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </DialogShell>
      )}

      {/* 4. Tip Host Modal */}
      <TipHostModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        event={tipTargetEvent}
        onTipSubmit={(_rating, _review, amount) => {
          if (tipTargetEvent) {
            setReviewedEventIds((prev) => {
              const updated = Array.from(new Set([...prev, tipTargetEvent.id]));
              if (typeof window !== 'undefined') {
                localStorage.setItem('myhub_reviewed_event_ids', JSON.stringify(updated));
              }
              return updated;
            });
          }
          void activityActions.refresh();
          showToast(
            amount > 0
              ? `ส่งรีวิวและทิป ฿${amount} ให้ ${tipTargetEvent?.hostName} สำเร็จ ได้รับ +50 XP! ⭐`
              : `ส่งรีวิวและให้คะแนน ${tipTargetEvent?.hostName} เรียบร้อยแล้ว ได้รับ +50 XP! ⭐`
          );
          setIsTipModalOpen(false);
        }}
      />



      {/* 8. Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          setUserCreatedEvents((prev) => [newEvent, ...prev]);
          setJoinedEventIds((prev) => [newEvent.id, ...prev]);
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จ`);
          }
        }}
      />

      {/* 9. Spot Buddy Gathering Modal (Integrated from Scrapbook) */}
      <SpotBuddyGatheringModal
        isOpen={isSpotBuddyModalOpen}
        onClose={() => {
          setIsSpotBuddyModalOpen(false);
          setSelectedSpotForBuddy(null);
        }}
        spotTitle={selectedSpotForBuddy?.title || ''}
        spotLocation={selectedSpotForBuddy ? `${selectedSpotForBuddy.district}, ${selectedSpotForBuddy.province}` : ''}
        spotImage={selectedSpotForBuddy ? resolveSpotImage(selectedSpotForBuddy) : ''}
        spotId={selectedSpotForBuddy?.id}
        spotProvince={selectedSpotForBuddy?.province}
        spotDistrict={selectedSpotForBuddy?.district}
        mode="spot"
        onSuccess={(newTrip: SpotBuddyPostItem) => {
          const newEventId = newTrip.id;
          const updatedSubs = {
            ...joinedSubActivities,
            [newEventId]: {
              eventId: newEventId,
              eventTitle: newTrip.title,
              eventDate: newTrip.date,
              eventTime: newTrip.time,
              eventLocation: newTrip.meetingPoint,
              eventImage: newTrip.image,
              eventPrice: newTrip.price,
              creatorName: newTrip.hostName,
              creatorAvatar: newTrip.hostAvatar,
              subTitle: newTrip.title,
              meetupPoint: newTrip.meetingPoint,
              eventType: 'community',
              category: 'heal',
              participantsCount: 1,
              maxParticipants: newTrip.maxParticipants,
            },
          };
          setJoinedSubActivities(updatedSubs);
          setJoinedEventIds((prev) => [newEventId, ...prev]);

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('joined_event_ids', JSON.stringify([newEventId, ...joinedEventIds]));
              localStorage.setItem('joinedSubActivities', JSON.stringify(updatedSubs));
            } catch (e) {
              console.error(e);
            }
          }

          setIsSpotBuddyModalOpen(false);
          setSelectedSpotForBuddy(null);
          setActiveSubTab('community');
          showToast(`เปิดตี้ชวนเพื่อนไป "${newTrip.title}" เรียบร้อยแล้ว`);
        }}
      />

      {/* 10. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับครับ!');
        }}
      />

      {/* 11. Logout Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />
    </div>
  );
}

export default function MyHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MyHubContent />
    </Suspense>
  );
}
