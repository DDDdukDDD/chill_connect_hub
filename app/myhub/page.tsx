'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { useAuth } from '@/lib/useAuth';
import { VerifyQuestModal } from '@/components/VerifyQuestModal';
import { ETicketModal } from '@/components/ETicketModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { TipHostModal } from '@/components/TipHostModal';
import { EventDetailModal } from '@/components/EventDetailModal';
import { SpotBuddyGatheringModal, SpotBuddyPostItem } from '@/components/SpotBuddyGatheringModal';
import { MOCK_CHALLENGES, ChallengeQuest, EventItem, MOCK_EVENTS } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import { BrandLogo } from '@/components/BrandLogo';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
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
  getStoredUserXp,
  setStoredUserXp,
  getStoredRedeemedRewardIds,
  setStoredRedeemedRewardIds,
} from '@/data/rewardsData';

export default function MyHubPage() {
  const [activeNavTab, setActiveNavTab] = useState('myhub');

  // 4 Core Lifestyle Tabs aligned with Platform Architecture
  const [activeSubTab, setActiveSubTab] = useState<'community' | 'fairs' | 'scrapbook' | 'quests_rewards'>('community');

  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [myChallenges, setMyChallenges] = useState<ChallengeQuest[]>(MOCK_CHALLENGES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Travel Scrapbook state
  const [savedSpotIds, setSavedSpotIds] = useState<string[]>([]);

  // User XP & Rewards
  const [userXp, setUserXp] = useState<number>(450);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>([]);
  const [checkedInTicketIds, setCheckedInTicketIds] = useState<string[]>([]);

  // Joined Events & Sub-activities
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [joinedSubActivities, setJoinedSubActivities] = useState<Record<string, any>>({});

  // Main Dual Mode: Master Calendar by default as requested
  const [hubMainMode, setHubMainMode] = useState<'categories' | 'calendar'>('calendar');
  // User Created Events (Host)
  const [userCreatedEvents, setUserCreatedEvents] = useState<EventItem[]>([]);
  // Master Calendar Category Layer Filter
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState<'all' | 'community' | 'fairs' | 'spots' | 'quests'>('all');
  // View Mode: Cards List vs Calendar
  const [hubViewMode, setHubViewMode] = useState<'list' | 'calendar'>('list');
  // Upcoming vs Past Filter
  const [eventViewMode, setEventViewMode] = useState<'upcoming' | 'past'>('upcoming');

  // Calendar Navigation State
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(7); // 0 = Jan, 7 = Aug
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);

  // Modals State
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
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
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState(false);
  const [selectedQuestForVerifyModal, setSelectedQuestForVerifyModal] = useState<ChallengeQuest | null>(null);

  // Spot Buddy Gathering Modal from Scrapbook
  const [isSpotBuddyModalOpen, setIsSpotBuddyModalOpen] = useState(false);
  const [selectedSpotForBuddy, setSelectedSpotForBuddy] = useState<LifestyleSpotItem | null>(null);

  // Card Context Menu Active ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sync data from localStorage on mount & deep-linking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Sync Joined Events & Sub-activities
      const storedJoinedIds: string[] = JSON.parse(localStorage.getItem('joined_event_ids') || '[]');
      const storedFairSubIds: string[] = JSON.parse(localStorage.getItem('joined_fair_sub_ids') || '[]');
      const allJoinedIds = Array.from(new Set([...storedJoinedIds, ...storedFairSubIds]));
      setJoinedEventIds(allJoinedIds);

      const storedSubs = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
      setJoinedSubActivities(storedSubs);

      // 1.1 Sync User Created Events (Host)
      const storedCreated: EventItem[] = JSON.parse(localStorage.getItem('user_created_events') || '[]');
      if (Array.isArray(storedCreated)) {
        setUserCreatedEvents(storedCreated);
      }

      // 2. Sync Saved Spots (Scrapbook)
      const storedFavSpots = JSON.parse(localStorage.getItem('favorite_spots') || '[]');
      if (Array.isArray(storedFavSpots)) {
        setSavedSpotIds(storedFavSpots);
      }

      // 3. Sync Favorites
      const storedFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(storedFavs)) {
        setFavorites(storedFavs);
      }

      // 4. Sync User XP & Redeemed Rewards
      setUserXp(getStoredUserXp());
      setRedeemedRewardIds(getStoredRedeemedRewardIds());

      // 5. Handle URL Query Params
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'calendar') {
        setHubMainMode('calendar');
      } else if (tabParam === 'community' || tabParam === 'fairs' || tabParam === 'scrapbook' || tabParam === 'quests_rewards') {
        setHubMainMode('categories');
        setActiveSubTab(tabParam);
      } else if (tabParam === 'quests' || tabParam === 'rewards') {
        setHubMainMode('categories');
        setActiveSubTab('quests_rewards');
      }

      const typeParam = params.get('type');
      if (typeParam === 'public_venue') {
        setActiveSubTab('fairs');
      } else if (typeParam === 'community') {
        setActiveSubTab('community');
      }

      // Auto open chat if deep-linked
      const chatSubId = params.get('chatSubId');
      const eventId = params.get('eventId');
      if (chatSubId && eventId) {
        setTimeout(() => {
          const matched = MOCK_EVENTS.find((e) => e.id === eventId);
          if (matched) {
            setChatTargetEvent(matched);
            setIsChatModalOpen(true);
          }
        }, 350);
      }
    } catch (e) {
      console.error('Error syncing localStorage in MyHub:', e);
    }
  }, []);

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

    // 1. From MOCK_EVENTS matching joinedEventIds
    MOCK_EVENTS.forEach((e) => {
      if (joinedEventIds.includes(e.id) && !addedIds.has(e.id)) {
        list.push(e);
        addedIds.add(e.id);
      }
    });

    // 2. From joinedSubActivities (custom sub-groups or buddy trips)
    Object.values(joinedSubActivities).forEach((sub: any) => {
      if (!addedIds.has(sub.eventId)) {
        list.push({
          id: sub.eventId,
          title: sub.eventTitle || 'กิจกรรมที่คุณเข้าร่วม',
          category: sub.category || (sub.eventType === 'community' ? 'heal' : 'chill'),
          tag: sub.tag || (sub.eventType === 'community' ? 'กิจกรรมคอมมูนิตี้' : 'งานมหกรรม & ชวนเพื่อน'),
          date: sub.eventDate || '28 มี.ค. 2026',
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
          createdAtTimestamp: Date.now(),
        });
        addedIds.add(sub.eventId);
      }
    });

    // 3. From active quests / challenges (Gamified Lifestyle Quests)
    const questDeadlineDays = [20, 25, 28, 31];
    const questStartDays = [1, 1, 5, 10];
    myChallenges.forEach((q, idx) => {
      const questId = `quest-${q.id}`;
      if (!addedIds.has(questId)) {
        const targetDay = questDeadlineDays[idx % questDeadlineDays.length];
        const startDay = questStartDays[idx % questStartDays.length];
        const questRangeDate = `${startDay} - ${targetDay} ส.ค. 2026`;
        const deadlineDate = `${targetDay} ส.ค. 2026`;

        list.push({
          id: questId,
          title: q.title || 'เควสต์กิจกรรม',
          category: q.category || 'chill',
          tag: q.badgeLabel || 'เควสต์ & ชาเลนจ์',
          date: questRangeDate,
          time: 'ตลอดวัน (ภารกิจต่อเนื่อง)',
          location: q.targetGoal || 'เช็คอินตามพิกัดเป้าหมาย',
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          price: `+${q.rewardPoints} XP`,
          description: q.objective || q.targetGoal || 'รายละเอียดภารกิจประจำเดือน',
          hostName: 'ระบบชาเลนจ์ทางการ',
          hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          eventType: 'challenge' as any,
          participantsCount: q.participantsCount || 300,
          maxParticipants: 1000,
          createdAtTimestamp: Date.now(),
          // Quest Span Metadata for Option C
          questStartDay: startDay,
          questDeadlineDay: targetDay,
          deadlineDate: deadlineDate,
        } as any);
        addedIds.add(questId);
      }
    });

    return list;
  }, [joinedEventIds, joinedSubActivities, myChallenges, userCreatedEvents]);

  // Separate Community Meetups vs Fairs
  const communityEvents = useMemo(() => {
    return allJoinedEvents.filter((e) => e.eventType !== 'public_venue' && (e.eventType as any) !== 'challenge');
  }, [allJoinedEvents]);

  const expoEvents = useMemo(() => {
    return allJoinedEvents.filter((e) => e.eventType === 'public_venue' && (e.eventType as any) !== 'challenge');
  }, [allJoinedEvents]);

  // Filtered lists based on Upcoming vs Past
  const filteredCommunityEvents = useMemo(() => {
    return communityEvents.filter((ev) => {
      const isEnded = isEventEnded(ev);
      if (eventViewMode === 'upcoming' && isEnded) return false;
      if (eventViewMode === 'past' && !isEnded) return false;
      if (selectedCalDay !== null) {
        const dStr = ev.date || '';
        if (!dStr.includes(selectedCalDay.toString())) return false;
      }
      return true;
    });
  }, [communityEvents, eventViewMode, selectedCalDay]);

  const filteredExpoEvents = useMemo(() => {
    return expoEvents.filter((ev) => {
      const isEnded = isEventEnded(ev);
      if (eventViewMode === 'upcoming' && isEnded) return false;
      if (eventViewMode === 'past' && !isEnded) return false;
      if (selectedCalDay !== null) {
        const dStr = ev.date || '';
        if (!dStr.includes(selectedCalDay.toString())) return false;
      }
      return true;
    });
  }, [expoEvents, eventViewMode, selectedCalDay]);

  // Saved Lifestyle Spots for Scrapbook
  const savedSpotsList: LifestyleSpotItem[] = useMemo(() => {
    return MOCK_SPOTS.filter((s) => savedSpotIds.includes(s.id));
  }, [savedSpotIds]);

  const handleRemoveFromScrapbook = (spotId: string, spotTitle: string) => {
    const updated = savedSpotIds.filter((id) => id !== spotId);
    setSavedSpotIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorite_spots', JSON.stringify(updated));
    }
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

  const isEventInCalMonth = (ev: EventItem, monthIdx: number, year: number) => {
    const monthShort = THAI_MONTH_SHORT[monthIdx];
    const monthFull = THAI_MONTH_NAMES[monthIdx];
    const dateStr = ev.date || '';
    if (dateStr.includes(monthShort) || dateStr.includes(monthFull)) return true;
    if (ev.createdAtTimestamp) {
      const d = new Date(ev.createdAtTimestamp);
      if (d.getFullYear() === year && d.getMonth() === monthIdx) return true;
    }
    return monthIdx === 7 && year === 2026 && dateStr.includes('ส.ค.');
  };

  // Cancel Event / Remove from MyHub
  const handleConfirmCancel = (ticketId: string, _reason: string) => {
    if (!cancelTargetEvent) return;
    const targetId = cancelTargetEvent.id;

    // Update state
    setJoinedEventIds((prev) => prev.filter((id) => id !== targetId));

    if (typeof window !== 'undefined') {
      try {
        const currentJoinedIds: string[] = JSON.parse(localStorage.getItem('joined_event_ids') || '[]');
        localStorage.setItem('joined_event_ids', JSON.stringify(currentJoinedIds.filter((id) => id !== targetId)));

        const currentFairIds: string[] = JSON.parse(localStorage.getItem('joined_fair_sub_ids') || '[]');
        localStorage.setItem('joined_fair_sub_ids', JSON.stringify(currentFairIds.filter((id) => id !== targetId)));

        const storedSubs = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
        delete storedSubs[targetId];
        localStorage.setItem('joinedSubActivities', JSON.stringify(storedSubs));
        setJoinedSubActivities(storedSubs);
      } catch (e) {
        console.error(e);
      }
    }

    showToast(
      cancelTargetEvent.eventType === 'public_venue'
        ? `✔️ ลบ "${cancelTargetEvent.title}" ออกจากนัดหมายแล้ว`
        : `✔️ ยกเลิกตั๋ว ${ticketId} สำเร็จ (คืนที่นั่งให้เพื่อนสมาชิกแล้ว)`
    );
    setIsCancelModalOpen(false);
  };

  const handleCheckIn = (ticketId: string) => {
    if (!checkedInTicketIds.includes(ticketId)) {
      setCheckedInTicketIds((prev) => [...prev, ticketId]);
      setUserXp((prev) => prev + 50);
      showToast('เช็คอินสำเร็จ! คุณได้รับ +50 XP และปลดล็อกความคืบหน้า Badge แล้ว');
    }
  };

  const handleVerifySuccess = (questId: string) => {
    setMyChallenges((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const currentCount = parseInt(q.current || '0', 10) + 1;
          const totalCount = parseInt(q.total || '3', 10) || 3;
          const newPercent = Math.min(100, Math.round((currentCount / totalCount) * 100));
          return {
            ...q,
            current: currentCount.toString(),
            completedCountInfo: `${currentCount}/${totalCount} ${q.completedCountInfo.includes('คาเฟ่') ? 'คาเฟ่' : q.completedCountInfo.includes('วัน') ? 'วัน' : q.completedCountInfo.includes('สวน') ? 'สวน' : 'ครั้ง'}`,
            progressPercent: newPercent,
          };
        }
        return q;
      })
    );
    setUserXp((prev) => prev + 50);
    showToast(`ยืนยันหลักฐานสำเร็จ! ความคืบหน้าเพิ่มขึ้น +50 XP`);
  };

  // Helper to copy voucher code
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
        btnBg: 'bg-[#EEF4FA]',
        btnHover: 'hover:bg-[#DEEBF7]',
        btnText: 'text-[#2B527A]',
        btnBorder: 'border-[#B8D1E8]/70',
        passLabel: 'Expo Pass',
      };
    }
    if ((ev as any).eventType === 'challenge' || ev.id.startsWith('quest-')) {
      return {
        pillar: 'quests' as const,
        label: 'เควสต์ & ชาเลนจ์',
        dotColor: 'bg-[#7C3AED]',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
        cardHover: 'hover:border-purple-300',
        titleHover: 'group-hover:text-purple-700',
        btnBg: 'bg-purple-50',
        btnHover: 'hover:bg-purple-100',
        btnText: 'text-purple-700',
        btnBorder: 'border-purple-200/80',
        passLabel: 'Quest Pass',
      };
    }
    if (joinedSubActivities[ev.id]?.subTitle || ev.id.startsWith('spot-') || ev.title.includes('ทริป') || ev.title.includes('ชวนเที่ยว')) {
      return {
        pillar: 'spots' as const,
        label: 'ทริปพิกัดเที่ยว',
        dotColor: 'bg-[#F26430]',
        badgeBg: 'bg-[#FEF3EE]',
        badgeText: 'text-[#D04A1B]',
        badgeBorder: 'border-[#FCD5C5]',
        cardHover: 'hover:border-[#FCD5C5]',
        titleHover: 'group-hover:text-[#D04A1B]',
        btnBg: 'bg-[#FEF3EE]',
        btnHover: 'hover:bg-[#FDE6DB]',
        btnText: 'text-[#D04A1B]',
        btnBorder: 'border-[#FCD5C5]/70',
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
      btnBg: 'bg-[#EBF3ED]',
      btnHover: 'hover:bg-[#DCECE0]',
      btnText: 'text-[#2D5A3C]',
      btnBorder: 'border-[#A3CEB0]/70',
      passLabel: 'E-Ticket',
    };
  };

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
    if ((ev as any).eventType === 'challenge' || ev.id.startsWith('quest-')) {
      const qStart = (ev as any).questStartDay || 1;
      const qEnd = (ev as any).questDeadlineDay || 31;

      if (filterMode === 'quests') {
        // When user explicitly inspects Quests, highlight all days within the span [qStart, qEnd]
        return day >= qStart && day <= qEnd;
      }
      // In all other modes (e.g. 'all'), ONLY show on the deadline day to prevent calendar clutter
      return day === qEnd;
    }

    const dStr = ev.date || '';

    // Range match e.g. "22 - 26 ส.ค. 2026" or "10-12 ส.ค."
    const rangeMatch = dStr.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (!isNaN(start) && !isNaN(end) && day >= start && day <= end) {
        return true;
      }
    }

    // Number boundaries match
    const numbers = dStr.match(/\b\d{1,2}\b/g);
    if (numbers) {
      for (const numStr of numbers) {
        const n = parseInt(numStr, 10);
        if (n === day) return true;
      }
    }

    return dStr.includes(` ${day} `) || dStr.startsWith(`${day} `) || dStr.includes(`${day}`);
  };

  // Master Calendar filtered dataset
  const filteredMasterEvents = useMemo(() => {
    if (calendarCategoryFilter === 'all') return allJoinedEvents;
    return allJoinedEvents.filter((ev) => {
      const meta = getEventPillarMeta(ev);
      return meta.pillar === calendarCategoryFilter;
    });
  }, [allJoinedEvents, calendarCategoryFilter, joinedSubActivities]);

  const masterCategoryCounts = useMemo(() => {
    let community = 0;
    let fairs = 0;
    let spots = 0;
    let quests = 0;
    allJoinedEvents.forEach((ev) => {
      const meta = getEventPillarMeta(ev);
      if (meta.pillar === 'fairs') fairs++;
      else if (meta.pillar === 'spots') spots++;
      else if (meta.pillar === 'quests') quests++;
      else community++;
    });
    return { all: allJoinedEvents.length, community, fairs, spots, quests };
  }, [allJoinedEvents, joinedSubActivities]);

  // Find ongoing quests for selected day when in 'all' view
  const ongoingQuestsForSelectedDay = useMemo(() => {
    if (selectedCalDay === null || calendarCategoryFilter !== 'all') return [];
    return allJoinedEvents.filter((ev) => {
      if ((ev as any).eventType !== 'challenge' && !ev.id.startsWith('quest-')) return false;
      const qStart = (ev as any).questStartDay || 1;
      const qEnd = (ev as any).questDeadlineDay || 31;
      return selectedCalDay >= qStart && selectedCalDay < qEnd;
    });
  }, [allJoinedEvents, selectedCalDay, calendarCategoryFilter]);

  // Daily agenda events
  const dailyAgendaEvents = useMemo(() => {
    if (selectedCalDay !== null) {
      return filteredMasterEvents.filter((ev) => isEventOnDay(ev, selectedCalDay, calMonth, calYear, calendarCategoryFilter));
    }
    // If no day selected, return all events in this month
    return filteredMasterEvents.filter((ev) => isEventInCalMonth(ev, calMonth, calYear));
  }, [filteredMasterEvents, selectedCalDay, calMonth, calYear, calendarCategoryFilter]);

  // Helper to render Master Schedule Calendar (Unified Multi-Category Life Calendar)
  const renderMasterCalendarView = () => {
    const activeRing = 'ring-2 ring-slate-900 bg-slate-50/80';

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 shadow-2xs space-y-5">
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
                  setCalMonth(7);
                  setSelectedCalDay(22);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer"
              >
                วันนี้
              </button>

              {selectedCalDay !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedCalDay(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  แสดงทุกวันในเดือนนี้
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
                <span>ทริปพิกัด ({masterCategoryCounts.spots})</span>
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
                <span>เควสต์ ({masterCategoryCounts.quests})</span>
              </button>
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
                    โหมดช่วงเวลาภารกิจ (Active Quest Span View)
                  </span>
                  <span className="text-[11.5px] text-purple-800/80 block truncate">
                    ไฮไลต์ช่วงระยะเวลาที่เควสต์เปิดรับส่ง (1 - 31 ส.ค.) และเน้นจุดสีม่วงเข้มในวันเดดไลน์ส่งหลักฐาน
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarCategoryFilter('all')}
                className="text-xs font-bold text-purple-700 hover:text-purple-950 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs shrink-0 cursor-pointer transition-all self-start sm:self-auto"
              >
                ← มุมมองรวมทั้งหมด
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
              <span>ทริปพิกัดเที่ยว</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>{calendarCategoryFilter === 'quests' ? 'เดดไลน์เควสต์' : 'เควสต์ & ชาเลนจ์'}</span>
            </span>
            {calendarCategoryFilter === 'quests' && (
              <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                <span className="w-3.5 h-1.5 rounded-sm bg-purple-200 border border-purple-300" />
                <span>ช่วงทำภารกิจ</span>
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
                <div key={`empty-start-${i}`} className="bg-slate-50/60 min-h-[75px] sm:min-h-[95px] p-1 opacity-40" />
              ))}

              {[...Array(daysInMonth)].map((_, idx) => {
                const day = idx + 1;
                const isToday = calMonth === 7 && calYear === 2026 && day === 22;
                const isSelected = selectedCalDay === day;
                const eventsOnDay = filteredMasterEvents.filter((ev) => isEventOnDay(ev, day, calMonth, calYear, calendarCategoryFilter));

                const hasCommunity = eventsOnDay.some((ev) => getEventPillarMeta(ev).pillar === 'community');
                const hasFairs = eventsOnDay.some((ev) => getEventPillarMeta(ev).pillar === 'fairs');
                const hasSpots = eventsOnDay.some((ev) => getEventPillarMeta(ev).pillar === 'spots');
                const hasQuests = eventsOnDay.some((ev) => getEventPillarMeta(ev).pillar === 'quests');
                const isQuestMode = calendarCategoryFilter === 'quests';
                const isQuestDeadlineDay = eventsOnDay.some((ev) => (ev as any).questDeadlineDay === day);
                const isQuestSpan = isQuestMode && hasQuests;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedCalDay(isSelected ? null : day)}
                    className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer hover:bg-slate-50/90 ${
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
                          ? 'bg-[#2D5A3C] text-white shadow-2xs'
                          : isQuestDeadlineDay && isQuestMode
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : eventsOnDay.length > 0
                          ? 'text-slate-900 font-black'
                          : 'text-slate-400'
                      }`}>
                        {day}
                      </span>

                      {/* Multi-category Dots */}
                      <div className="flex items-center gap-1">
                        {hasCommunity && <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C]" title="ตี้คอมมูนิตี้" />}
                        {hasFairs && <span className="w-1.5 h-1.5 rounded-full bg-[#2B527A]" title="งานแฟร์" />}
                        {hasSpots && <span className="w-1.5 h-1.5 rounded-full bg-[#F26430]" title="ทริปพิกัดเที่ยว" />}
                        {hasQuests && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isQuestDeadlineDay
                                ? 'bg-[#7C3AED] ring-1 ring-purple-600'
                                : isQuestMode
                                ? 'bg-purple-400'
                                : 'bg-[#7C3AED]'
                            }`}
                            title={isQuestDeadlineDay ? '🚨 กำหนดส่งเควสต์วันสุดท้าย' : 'ช่วงทำเควสต์'}
                          />
                        )}
                      </div>
                    </div>

                    {/* Desktop Mini-Pill Badges */}
                    <div className="space-y-1 mt-1 hidden sm:block">
                      {eventsOnDay.slice(0, 2).map((ev) => {
                        const meta = getEventPillarMeta(ev);
                        const isQuest = meta.pillar === 'quests';
                        const isDeadline = (ev as any).questDeadlineDay === day;
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate ${
                              isQuest && isDeadline
                                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs font-black'
                                : isQuest
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`
                            }`}
                            title={ev.title}
                          >
                            {isQuest && isDeadline ? `🚨 เดดไลน์: ${ev.title}` : isQuest ? `⚡ ${ev.title}` : ev.title}
                          </div>
                        );
                      })}
                      {eventsOnDay.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 block text-right">
                          +{eventsOnDay.length - 2} อื่นๆ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {[...Array(endDayOffset)].map((_, i) => (
                <div key={`empty-end-${i}`} className="bg-slate-50/60 min-h-[75px] sm:min-h-[95px] p-1 opacity-40" />
              ))}
            </div>
          </div>

          {/* Interactive Daily Agenda Sheet */}
          <div className="pt-5 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2D5A3C]" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {selectedCalDay !== null
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
                      วันนี้อยู่ในช่วงภารกิจ {ongoingQuestsForSelectedDay.length} เควสต์ ({ongoingQuestsForSelectedDay.map((q) => q.title).join(', ')})
                    </span>
                    <span className="text-[11px] text-purple-700 font-medium block">
                      ยังไม่ถึงกำหนดส่งวันสุดท้าย สามารถทำภารกิจและส่งหลักฐานล่วงหน้าได้
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarCategoryFilter('quests')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  <span>เปิดดูตารางเควสต์</span>
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

                  return (
                    <div
                      key={ev.id}
                      className={`group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1`}
                    >
                      {/* Card Image Banner */}
                      <div
                        onClick={() => setDetailModalEvent(ev)}
                        className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                      >
                        <img
                          src={ev.image || fallbackImg}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                        {/* Top-Left Badges: Pillar Tag + Host Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                            {meta.label}
                          </span>
                          {(ev.isHost || userCreatedEvents.some((u) => u.id === ev.id)) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                              👑 โฮสต์
                            </span>
                          )}
                        </div>

                        {/* Top-Right Badge: Urgent Due Date for Quests only */}
                        {meta.pillar === 'quests' && (ev as any).questDeadlineDay === selectedCalDay && (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs animate-pulse">
                              🚨 เดดไลน์วันนี้
                            </span>
                          </div>
                        )}
                      </div>

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
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                {ev.price || '+50 XP'}
                              </span>
                            ) : ev.price ? (
                              <span
                                className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
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
                          <h3
                            onClick={() => setDetailModalEvent(ev)}
                            className={`font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${meta.titleHover} transition-colors leading-[1.3] tracking-tight cursor-pointer`}
                            title={ev.title}
                          >
                            {ev.title}
                          </h3>

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
                                  if (q) setSelectedQuestForVerifyModal(q);
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ส่งหลักฐาน</span>
                              </button>
                              <Link
                                href="/challenges"
                                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                title="ดูรายละเอียดภารกิจทั้งหมดในหน้าชาเลนจ์"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">ดูเควสต์</span>
                              </Link>
                            </>
                          ) : (
                            <>
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

                              {ev.eventType !== 'public_venue' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatTargetEvent(ev);
                                    setIsChatModalOpen(true);
                                  }}
                                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                  title="เปิดห้องแชทกลุ่ม"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>แชท</span>
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
                            </>
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
              showToast('🔒 กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรมหรือเปิดตี้ใหม่');
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
          <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 animate-fade-in">
            {/* Teaser Header */}
            <div className="text-center space-y-2.5 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                มายฮับส่วนตัว (My Hub)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                ศูนย์รวมกิจกรรม นัดหมาย  สมุดบันทึกพิกัดเที่ยว และกระเป๋าแต้มสะสม
              </p>
            </div>

            {/* 4 Feature Showcase Infographic Cards (Clean White Editorial with Brand Organic Accents) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Pillar 1: Digital E-Ticket & Group Chat (Forest Green) */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#4A7C59]/40 hover:shadow-xs transition-all duration-300">
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
                  <span className="text-[10.5px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-md border border-[#A3CEB0]/50">
                    ยืนยันที่นั่งแล้ว
                  </span>
                </div>
              </div>

              {/* Pillar 2: Master Lifestyle Calendar (Slate Blue) */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#2B527A]/40 hover:shadow-xs transition-all duration-300">
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
                      รวมนัดหมายทุกไลฟ์สไตล์ไว้ในตารางเดียว ทั้งตี้คอมมูนิตี้ งานมหกรรมเอ็กซ์โป และเควสต์ประจำสัปดาห์ ไม่พลาดทุกทริปและเวลาพักผ่อน
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#2B527A] text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#2B527A]" />
                    <span>ซิงก์นัดหมายทุกประเภท</span>
                  </span>
                  <span className="text-[10.5px] font-bold text-[#2B527A] bg-[#F0F4F8] px-2 py-0.5 rounded-md border border-[#CBD5E1]/50">
                    4 หมวดหมู่ในที่เดียว
                  </span>
                </div>
              </div>

              {/* Pillar 3: Travel Scrapbook & Buddy (Warm Amber) */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#F26430]/40 hover:shadow-xs transition-all duration-300">
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
                  <span className="text-[10.5px] font-bold text-[#F26430] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#FED7AA]/50">
                    ชวนเพื่อน 1-Click
                  </span>
                </div>
              </div>

              {/* Pillar 4: Explorer Quests & Rewards (Royal Violet) */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#7C3AED]/40 hover:shadow-xs transition-all duration-300">
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
                      สะสมแต้ม XP จากภารกิจเช็คอินและร่วมกิจกรรม เลื่อนระดับ Explorer แลกรับส่วนลด Specialty Coffee สิทธิ์เล่นบอร์ดเกมฟรี และของรางวัลสุดพรีเมียม
                    </p>
                  </div>
                </div>

                {/* Micro Visual Badge */}
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#7C3AED] text-[11px]">
                    <Gift className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>กระเป๋าแต้มสะสม XP</span>
                  </span>
                  <span className="text-[10.5px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#DDD6FE]/50">
                    แลกของรางวัลฟรี
                  </span>
                </div>
              </div>

            </div>

            {/* 3-Step Infographic Journey Strip (Soft Organic Tints) */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
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
                className="w-full sm:flex-1 h-12 rounded-2xl bg-[#4A7C59] hover:bg-[#386144] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-[#4A7C59] whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>เข้าสู่ระบบสมาชิก</span>
              </button>
              <Link
                href="/onboarding"
                className="w-full sm:flex-1 h-12 rounded-2xl bg-[#EBF3ED] hover:bg-[#DCEDE0] text-[#2D5A3C] border border-[#A3CEB0] font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#4A7C59] shrink-0" />
                <span>สมัครสมาชิกใหม่ (ฟรี)</span>
              </Link>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/"
                className="text-xs font-bold text-slate-400 hover:text-[#4A7C59] transition-colors"
              >
                ← กลับไปสำรวจกิจกรรมในหน้าแรก
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. MEMBER KEYCARD PASSPORT (Clean Minimal White Header)                   */}
            {/* ========================================================================= */}
            <section className="bg-white border-b border-slate-200/80 pt-6 pb-6 sm:pt-8 sm:pb-8">
              <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl p-5 sm:p-7 text-slate-900 border border-slate-200/90 shadow-2xs relative overflow-hidden">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* User Identity Info */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 truncate">
                          มายฮับส่วนตัว (My Hub)
                        </h1>
                        <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0] flex items-center gap-1.5 shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A3C]" />
                          <span>Verified Explorer</span>
                        </span>
                        <Link
                          href="/challenges"
                          className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="ดูระดับแรงก์และชาเลนจ์ทั้งหมด"
                        >
                          <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                          <span>Level 4 Explorer</span>
                        </Link>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
                        ศูนย์รวมกิจกรรม นัดหมาย  สมุดบันทึกพิกัดเที่ยว และกระเป๋าแต้มสะสม
                      </p>

                      {/* XP Progress Bar to Next Level */}
                      <div className="flex items-center gap-2.5 pt-0.5 max-w-md">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (userXp / 1000) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-500 shrink-0">
                          {userXp}/1,000 XP สู่ <strong className="text-purple-700">Lv.5 Trailblazer</strong>
                        </span>
                      </div>
                    </div>

                    {/* Passport Metrics */}
                    <div className="flex items-center self-stretch lg:self-auto">
                      {/* Metric Chips */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 w-full sm:w-auto">
                        <div className="px-3 py-1.5 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">นัดหมาย</span>
                          <span className="text-base sm:text-lg font-black text-slate-900">
                            {communityEvents.length + expoEvents.length}
                          </span>
                        </div>
                        <div className="px-3 py-1.5 text-center border-x border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">พิกัดเซฟ</span>
                          <span className="text-base sm:text-lg font-black text-slate-900">
                            {savedSpotsList.length}
                          </span>
                        </div>
                        <Link
                          href="/rewards"
                          className="px-3 py-1.5 text-center group/xp hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="ไปที่ศูนย์ของรางวัลเพื่อแลกสิทธิพิเศษ"
                        >
                          <span className="text-[10px] uppercase font-bold text-slate-400 group-hover/xp:text-amber-700 block">แต้มสะสม</span>
                          <span className="text-base sm:text-lg font-black text-slate-900 group-hover/xp:text-[#D04A1B]">
                            {userXp}
                          </span>
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Master View Switcher (Top-Level Dual Mode) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-slate-200/80 mt-6">
                  {/* Dual Mode Switcher */}
                  <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setHubMainMode('categories')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        hubMainMode === 'categories'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className={`w-4 h-4 ${hubMainMode === 'categories' ? 'text-slate-900' : 'text-slate-400'}`} />
                      <span>แยกตามหมวดหมู่</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHubMainMode('calendar')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        hubMainMode === 'calendar'
                          ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarDays className={`w-4 h-4 ${hubMainMode === 'calendar' ? 'text-[#2D5A3C]' : 'text-slate-400'}`} />
                      <span>ปฏิทินรวมกิจกรรม ({allJoinedEvents.length})</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    {hubMainMode === 'calendar' ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#2D5A3C]" />
                        <span>ปฏิทินรวมนัดหมายทุกประเภทในที่เดียว</span>
                      </>
                    ) : (
                      <span>เลือกดูตั๋วและบริหารจัดการตามประเภท</span>
                    )}
                  </div>
                </div>

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
                      <span>ตี้กิจกรรมคอมมูนิตี้ ({communityEvents.length})</span>
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
                      <span>งานแฟร์ & นิทรรศการ ({expoEvents.length})</span>
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
                      <span>เควสต์ & แต้มสะสม ({myChallenges.length})</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 2. MAIN CONTENT AREA                                                      */}
            {/* ========================================================================= */}
            <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {hubMainMode === 'calendar' ? (
                renderMasterCalendarView()
              ) : (
                <>

              {/* ============================================================= */}
              {/* TAB 1: 👥 COMMUNITY MEETUPS (Digital Boarding Pass Style)     */}
              {/* ============================================================= */}
              {activeSubTab === 'community' && (
                <div className="space-y-6">
                  {/* Smart Control Bar */}
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEventViewMode('upcoming')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'upcoming'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        กำลังจะมาถึง ({communityEvents.filter((e) => !isEventEnded(e)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventViewMode('past')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'past'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        กิจกรรมที่ผ่านมา ({communityEvents.filter((e) => isEventEnded(e)).length})
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      <span>แสดง {filteredCommunityEvents.length} ตี้</span>
                    </div>
                  </div>

                  {filteredCommunityEvents.length === 0 ? (
                    /* Clean Empty State */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200/90 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-2xs border border-slate-200/70">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900">
                          {eventViewMode === 'upcoming' ? 'ยังไม่มีตี้กิจกรรมที่คุณเข้าร่วม' : 'ไม่มีประวัติกิจกรรมที่ผ่านมา'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          หาเพื่อนใหม่ วิ่ง บอร์ดเกม เวิร์กช็อป ตี้กาแฟ ในคอมมูนิตี้ที่ปลอดภัยไร้แรงกดดัน
                        </p>
                      </div>
                      <Link
                        href="/community"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>สำรวจกิจกรรมคอมมูนิตี้</span>
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

                        return (
                          <div
                            key={event.id}
                            className={`group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1`}
                          >
                            {/* Card Image */}
                            <div
                              onClick={() => setDetailModalEvent(event)}
                              className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                            >
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                              {/* Host status badge if user is host */}
                              {(event.isHost || userCreatedEvents.some((u) => u.id === event.id)) && (
                                <div className="absolute top-2.5 left-2.5 z-10">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                    👑 โฮสต์
                                  </span>
                                </div>
                              )}
                            </div>

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
                                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
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
                                <h3
                                  onClick={() => setDetailModalEvent(event)}
                                  className={`font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] ${moodTheme.titleHover} transition-colors leading-[1.3] tracking-tight cursor-pointer`}
                                  title={event.title}
                                >
                                  {event.title}
                                </h3>

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

                              {/* Action Buttons Area */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTicketEvent(event);
                                      setSelectedTicketId(ticketId);
                                      setIsETicketModalOpen(true);
                                    }}
                                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#1E3F29] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                  >
                                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                                    <span>ดูบัตร</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatTargetEvent(event);
                                      setIsChatModalOpen(true);
                                    }}
                                    className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EBF3ED] text-slate-700 hover:text-[#2D5A3C] border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                    title="เปิดห้องแชตกลุ่ม"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                    <span>แชต</span>
                                  </button>
                                </div>

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
                                      className="absolute right-0 bottom-full mb-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setDetailModalEvent(event);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>ดูรายละเอียดงาน</span>
                                      </button>
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
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEventViewMode('upcoming')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'upcoming'
                            ? 'bg-[#2B527A] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        กำลังจะมาถึง ({expoEvents.filter((e) => !isEventEnded(e)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventViewMode('past')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'past'
                            ? 'bg-[#1E3B59] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        งานที่ผ่านไปแล้ว ({expoEvents.filter((e) => isEventEnded(e)).length})
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      <span>แสดง {filteredExpoEvents.length} งาน</span>
                    </div>
                  </div>

                  {filteredExpoEvents.length === 0 ? (
                    /* Clean Empty State */
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200/90 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl bg-[#EEF4FA] text-[#2B527A] flex items-center justify-center mx-auto shadow-2xs border border-[#B8D1E8]/70">
                        <Calendar className="w-7 h-7 text-[#2B527A]" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900">
                          {eventViewMode === 'upcoming' ? 'ยังไม่มีงานแฟร์ที่คุณบันทึกนัดไว้' : 'ไม่มีประวัติงานแฟร์ที่ผ่านมา'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          อัปเดตงานอีเวนต์ใหญ่ นิทรรศการ งานหนังสือ เทศกาลกาแฟ และเอ็กซ์โปทั่วประเทศ
                        </p>
                      </div>
                      <Link
                        href="/fairs"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#2B527A] hover:bg-[#1E3B59] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>สำรวจงานแฟร์ & นิทรรศการ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    /* Fairs Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {filteredExpoEvents.map((event, idx) => {
                        const ticketId = `CCH-FAIR-${(idx + 201).toString().padStart(4, '0')}`;
                        const isMenuOpen = activeMenuId === event.id;

                        return (
                          <div
                            key={event.id}
                            className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1"
                          >
                            {/* Card Image */}
                            <div
                              onClick={() => setDetailModalEvent(event)}
                              className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                            >
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold bg-[#EEF4FA]/95 backdrop-blur-md text-[#2B527A] border border-[#B8D1E8] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-[#2B527A] stroke-[2.5]" />
                                  <span>บันทึกแล้ว</span>
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-[#2B527A] font-bold bg-[#EEF4FA] border border-[#B8D1E8]/70 px-2 py-0.5 rounded-md truncate">
                                    {event.venueTag || 'ศูนย์นิทรรศการ'}
                                  </span>
                                  {event.price && (
                                    <span
                                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                        event.price.includes('ฟรี')
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                      }`}
                                    >
                                      {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                                    </span>
                                  )}
                                </div>

                                <h3
                                  onClick={() => setDetailModalEvent(event)}
                                  className="font-bold text-[13px] sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem] group-hover:text-[#2B527A] transition-colors leading-[1.3] tracking-tight cursor-pointer"
                                  title={event.title}
                                >
                                  {event.title}
                                </h3>

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

                              {/* Action Buttons */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                                <Link
                                  href={`/fairs/${encodeURIComponent(event.id)}`}
                                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2B527A] hover:bg-[#1E3B59] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
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
                                      className="absolute right-0 bottom-full mb-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in"
                                    >
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
                                        <span>นำออกจากนัดหมาย</span>
                                      </button>
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EBF3ED] hover:bg-[#DCECE0] text-[#2D5A3C] text-xs font-bold border border-[#A3CEB0]/60 transition-all cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>สำรวจพิกัดเพิ่ม</span>
                    </Link>
                  </div>

                  {/* Spots Grid or Empty State */}
                  {savedSpotsList.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200/90 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl bg-[#EBF3ED] text-[#2D5A3C] flex items-center justify-center mx-auto shadow-2xs border border-[#A3CEB0]/60">
                        <Compass className="w-7 h-7 text-[#2D5A3C]" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900">
                          ยังไม่มีพิกัดในสมุดบันทึกสถานที่เที่ยว
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          เมื่อคุณพบสถานที่ท่องเที่ยวหรือจุดฮีลใจที่น่าสนใจในหน้าพิกัดเที่ยว ให้กดปุ่มบันทึกลงสมุด เพื่อรวบรวมไว้ที่นี่
                        </p>
                      </div>
                      <Link
                        href="/spots"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#2D5A3C] hover:bg-[#1E3F29] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>สำรวจพิกัดเที่ยว 77 จังหวัด</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {savedSpotsList.map((spotItem) => (
                        <div
                          key={spotItem.id}
                          className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1"
                        >
                          {/* Spot Image */}
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={resolveSpotImage(spotItem)}
                              alt={spotItem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                            {/* Top-Left: Saved Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-[#EBF3ED]/95 backdrop-blur-md text-[#2D5A3C] border border-[#A3CEB0] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-[#2D5A3C]" />
                                <span>บันทึกแล้ว</span>
                              </span>
                            </div>

                            {/* Bottom-Right: Rating */}
                            <div className="absolute bottom-2 right-2.5 z-10">
                              <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
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
                                  className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
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
                              <button
                                type="button"
                                onClick={() => handleOpenSpotBuddy(spotItem)}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#1E3F29] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate active:scale-95"
                                title="เปิดตี้ชวนเพื่อนไปที่นี่"
                              >
                                <Users className="w-3.5 h-3.5 shrink-0" />
                                <span>ชวนเพื่อนไป</span>
                              </button>

                              <Link
                                href={`/spots/${encodeURIComponent(spotItem.id)}`}
                                className="py-1.5 px-2.5 rounded-xl bg-[#EBF3ED] hover:bg-[#DCECE0] text-[#2D5A3C] border border-[#A3CEB0]/60 text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 shadow-2xs"
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
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                        <Trophy className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <span>ภารกิจที่คุณกำลังทำอยู่ (Active Quests)</span>
                          <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200/80">
                            {myChallenges.length} ภารกิจ
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          สะสมแต้ม XP และปลดล็อกเข็มกลัดเกียรติยศลงบนโปรไฟล์ของคุณ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/challenges"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-slate-500" />
                        <span>สำรวจเควสต์เพิ่ม</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsCreateChallengeModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>สร้างชาเลนจ์ใหม่</span>
                      </button>
                    </div>
                  </div>

                  {/* Quests Grid (Matched with Discovery Aesthetics) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                    {myChallenges.map((quest) => {
                      const isCompleted = quest.progressPercent >= 100;
                      const isUrgent = (quest.daysRemaining || 10) <= 5;
                      
                      // Category theme helper
                      const getCatTheme = (cat?: string) => {
                        switch (cat) {
                          case 'move':
                            return { label: 'Move', bg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'text-rose-700' };
                          case 'heal':
                            return { label: 'Heal', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-700' };
                          case 'learn':
                            return { label: 'Learn', bg: 'bg-sky-50 text-sky-800 border-sky-200', text: 'text-sky-700' };
                          case 'chill':
                          default:
                            return { label: 'Chill', bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-800' };
                        }
                      };
                      const catTheme = getCatTheme(quest.category);

                      return (
                        <div
                          key={quest.id}
                          className={`group/card bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-2xs hover:shadow-xs hover:-translate-y-0.5 ${
                            isCompleted
                              ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-emerald-50/10'
                              : 'border-slate-200/90 hover:border-purple-300'
                          }`}
                        >
                          {/* Top Row: Icon + Badges & XP */}
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0 group-hover/card:scale-105 transition-transform shadow-2xs">
                              {quest.badgeIcon || (quest.iconName === 'Flame' ? '🔥' : quest.iconName === 'Coffee' ? '☕' : quest.iconName === 'Footprints' ? '👟' : '🏅')}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catTheme.bg}`}>
                                  {catTheme.label}
                                </span>
                                {quest.isOfficial ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                    Official
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                                    ชุมชน
                                  </span>
                                )}
                                <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md flex items-center gap-0.5 ml-auto shadow-2xs">
                                  <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
                                  <span>+{quest.rewardPoints} XP</span>
                                </span>
                              </div>

                              <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover/card:text-purple-700 transition-colors leading-snug line-clamp-1">
                                {quest.title}
                              </h5>
                            </div>
                          </div>

                          {/* Goal Box */}
                          <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="truncate">เหรียญ: {quest.badgeLabel}</span>
                            </div>
                            <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11.5px]">
                              {quest.targetGoal}
                            </p>
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
                                  isCompleted ? 'bg-emerald-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                }`}
                                style={{ width: `${quest.progressPercent}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-medium">
                              <span>{quest.startDate} - {quest.endDate}</span>
                              <span className={isUrgent ? 'text-rose-600 font-bold' : ''}>
                                เหลืออีก {quest.daysRemaining || 10} วัน
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2.5 border-t border-slate-100 mt-auto">
                            {isCompleted ? (
                              <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold py-2.5 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>สำเร็จภารกิจแล้ว</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedQuestForVerifyModal(quest)}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-200" />
                                <span>ส่งหลักฐานเช็คอิน</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

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
                          คุณมีแต้มสะสม <strong className="text-[#D04A1B] font-black">{userXp} XP</strong> พร้อมแลกรับสิทธิพิเศษจากพาร์ทเนอร์ทางการในหน้าศูนย์ของรางวัล
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
                        <div className="bg-white rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-2">
                          <p className="text-xs text-slate-500">
                            ยังไม่มีคูปองที่แลกไว้ สามารถนำแต้ม {userXp} XP ไปแลกรับส่วนลดคาเฟ่หรือตั๋วบอร์ดเกมได้ทันที
                          </p>
                          <Link
                            href="/rewards"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#D04A1B] hover:underline"
                          >
                            <span>เลือกดูของรางวัลทั้งหมด</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id)).map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-[#D04A1B] bg-[#FEF3EE] px-2 py-0.5 rounded-md border border-[#FCD5C5]/70">
                                  {item.discountValue}
                                </span>
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {item.title}
                                </h5>
                                <p className="text-[11px] text-[#2D5A3C] font-semibold flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  <span className="truncate">{item.partner}</span>
                                </p>
                              </div>

                              <div className="bg-[#EBF3ED]/70 rounded-xl border border-dashed border-[#A3CEB0] p-2 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                                  {item.voucherCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyVoucher(item.voucherCode)}
                                  className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#2D5A3C] border border-[#A3CEB0] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
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

      {/* 1. Event Detail Modal */}
      <EventDetailModal
        event={detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        isFavorite={detailModalEvent ? favorites.includes(detailModalEvent.id) : false}
        onToggleFavorite={(id) => {
          setFavorites((prev) =>
            prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
          );
        }}
        isJoined={true}
        isLoggedIn={isLoggedIn}
        onJoinSuccess={() => {}}
        onLeaveSuccess={(id) => {
          setJoinedEventIds((prev) => prev.filter((eId) => eId !== id));
          setDetailModalEvent(null);
          showToast('✔️ ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อยแล้ว');
        }}
      />

      {/* 2. E-Ticket Modal */}
      <ETicketModal
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        event={selectedTicketEvent}
        ticketId={selectedTicketId}
        isCheckedIn={checkedInTicketIds.includes(selectedTicketId)}
        onCheckIn={(tId) => {
          handleCheckIn(tId);
          setIsETicketModalOpen(false);
        }}
      />

      {/* 3. Group Chat Modal */}
      <GroupChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        event={chatTargetEvent}
      />

      {/* 4. Cancel Ticket Modal */}
      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        event={cancelTargetEvent}
        ticketId={cancelTargetTicketId}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* 5. Tip Host Modal */}
      <TipHostModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        event={tipTargetEvent}
        onTipSubmit={(_rating, _review, amount) => {
          setUserXp((prev) => prev + 20);
          showToast(`☕ ส่งทิป ฿${amount} ให้ ${tipTargetEvent?.hostName} เรียบร้อยแล้ว! ได้รับ +20 XP 🌟`);
          setIsTipModalOpen(false);
        }}
      />

      {/* 6. Quest Verify Modal */}
      <VerifyQuestModal
        isOpen={!!selectedQuestForVerifyModal}
        onClose={() => setSelectedQuestForVerifyModal(null)}
        quest={selectedQuestForVerifyModal}
        onVerificationSuccess={handleVerifySuccess}
      />

      {/* 7. Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onCreateSuccess={(newQuest) => {
          setMyChallenges([newQuest, ...myChallenges]);
          showToast(`🎉 สร้างชาเลนจ์ "${newQuest.title}" สำเร็จ!`);
        }}
      />

      {/* 8. Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          setUserCreatedEvents((prev) => [newEvent, ...prev]);
          setJoinedEventIds((prev) => [newEvent.id, ...prev]);
          showToast(`🎉 สร้างกิจกรรม "${newEvent.title}" สำเร็จ!`);
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
          showToast(`🎉 เปิดตี้ชวนเพื่อนไป "${newTrip.title}" เรียบร้อยแล้ว!`);
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
