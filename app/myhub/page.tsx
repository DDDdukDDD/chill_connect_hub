'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import { VerifyQuestModal } from '@/components/VerifyQuestModal';
import { ETicketModal } from '@/components/ETicketModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { TipHostModal } from '@/components/TipHostModal';
import { EventDetailModal } from '@/components/EventDetailModal';
import { MOCK_CHALLENGES, ChallengeQuest, EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import {
  Award,
  Coffee,
  Footprints,
  Users,
  Flame,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Trophy,
  Target,
  Zap,
  Sprout,
  Ticket,
  Calendar,
  MapPin,
  MessageCircle,
  Clock,
  ArrowRight,
  Gift,
  QrCode,
  Crown,
  CalendarDays,
  ListFilter,
  Check,
  Tag,
  ChevronUp,
  Lock,
} from 'lucide-react';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

interface RecommendedChallenge {
  id: string;
  title: string;
  category: 'move' | 'heal' | 'chill' | 'learn';
  iconName: string;
  targetGoal: string;
  badgeLabel: string;
  rewardPoints: number;
  participantsCount: number;
  isOfficial?: boolean;
}

const RECOMMENDED_CHALLENGES: RecommendedChallenge[] = [
  {
    id: 'rec-official-1',
    title: 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่ย่านอารีย์',
    category: 'chill',
    iconName: 'Coffee',
    targetGoal: 'เช็คอินคาเฟ่พาร์ทเนอร์ครบ 3 ร้านใน 14 วัน',
    badgeLabel: 'Coffee Explorer',
    rewardPoints: 300,
    participantsCount: 235,
    isOfficial: true,
  },
  {
    id: 'rec-official-2',
    title: 'BMA Park Run: วิ่งสะสมระยะ 3 สวนสาธารณะ กทม.',
    category: 'move',
    iconName: 'Footprints',
    targetGoal: 'วิ่งสะสมระยะทางครบ 3 สวนสาธารณะในกรุงเทพฯ',
    badgeLabel: 'BMA Park Champion',
    rewardPoints: 350,
    participantsCount: 310,
    isOfficial: true,
  },
  {
    id: 'rec-official-3',
    title: 'SET Wealth Builder: ฟังเสวนาการเงิน & ลงทุน 2 ครั้ง',
    category: 'learn',
    iconName: 'Zap',
    targetGoal: 'เข้าร่วมฟังสัมมนาการเงินหรือห้องสมุดมารวย 2 ครั้ง',
    badgeLabel: 'Smart Investor',
    rewardPoints: 400,
    participantsCount: 180,
    isOfficial: true,
  },
  {
    id: 'rec-1',
    title: 'HYROX 10K Running Prep',
    category: 'move',
    iconName: 'Flame',
    targetGoal: 'วิ่งสะสมระยะทางครบ 10 กม. ใน 14 วัน',
    badgeLabel: 'HYROX Runner',
    rewardPoints: 250,
    participantsCount: 142,
  },
  {
    id: 'rec-2',
    title: 'Morning Yoga 7 Days Challenge',
    category: 'heal',
    iconName: 'Sparkles',
    targetGoal: 'เล่นโยคะยามเช้าต่อเนื่อง 7 วัน',
    badgeLabel: 'Yoga Spirit',
    rewardPoints: 180,
    participantsCount: 89,
  },
];

interface RewardShopItem {
  id: string;
  title: string;
  category: string;
  costXp: number;
  icon: string;
  description: string;
  partner: string;
  voucherCode: string;
  stockCount: number;
}

const REWARD_SHOP_ITEMS: RewardShopItem[] = [
  {
    id: 'reward-1',
    title: 'คูปองส่วนลด ฿50 เครื่องดื่ม Specialty Coffee',
    category: 'คาเฟ่ & เครื่องดื่ม',
    costXp: 150,
    icon: '☕',
    description: 'ใช้เป็นส่วนลดเครื่องดื่มทุกเมนูที่คาเฟ่พาร์ทเนอร์ย่านอารีย์และทองหล่อ',
    partner: 'Ari & Thonglor Specialty Cafes',
    voucherCode: 'CHILL50-ARI-889',
    stockCount: 18,
  },
  {
    id: 'reward-2',
    title: 'ตั๋วทดลองเล่นบอร์ดเกมฟรี 1 วัน (มูลค่า ฿150)',
    category: 'บอร์ดเกม & ชิลล์',
    costXp: 250,
    icon: '🎲',
    description: 'เข้าเล่นบอร์ดเกมไม่อั้นตลอดวัน ที่ร้านบอร์ดเกมพาร์ทเนอร์สยามสแควร์',
    partner: 'Siam Board Game Lounge',
    voucherCode: 'BG-FREEPASS-2026',
    stockCount: 12,
  },
  {
    id: 'reward-3',
    title: 'เสื้อยืดลิมิเต็ด Chill & Connect Edition',
    category: 'ของที่ระลึกคอมมูนิตี้',
    costXp: 500,
    icon: '🎽',
    description: 'เสื้อยืดผ้าคอตตอนพรีเมียม 100% สกรีนลายพิเศษสำหรับสมาชิก Hub',
    partner: 'Chill & Connect Official Store',
    voucherCode: 'TSHIRT-VIP-GOLD',
    stockCount: 5,
  },
  {
    id: 'reward-4',
    title: 'คูปองส่วนลด ฿100 บัตรวิ่งมาราธอน & City Run',
    category: 'วิ่ง & สุขภาพ',
    costXp: 300,
    icon: '🏃',
    description: 'ส่วนลดค่าสมัครกิจกรรมวิ่งและงานมินิมาราธอนที่ร่วมรายการ',
    partner: 'Bangkok Active Marathon',
    voucherCode: 'RUN100-ACTIVE',
    stockCount: 20,
  },
];

export default function MyHubPage() {
  const [activeNavTab, setActiveNavTab] = useState('myhub');
  const [activeSubTab, setActiveSubTab] = useState<'joined_events' | 'quests' | 'rewards'>('joined_events');
  
  // Member vs Host Persona
  const [currentRole, setCurrentRole] = useState<'member' | 'host'>('member');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [myChallenges, setMyChallenges] = useState<ChallengeQuest[]>(MOCK_CHALLENGES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Mode: Calendar vs List
  const [hubViewMode, setHubViewMode] = useState<'list' | 'calendar'>('list');
  // Event Type Filter in MyHub: all | public_venue | community
  const [joinedTypeFilter, setJoinedTypeFilter] = useState<'all' | 'public_venue' | 'community'>('all');
  
  // Calendar Navigation State
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(7); // 0 = Jan, 7 = Aug
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);

  // Sub-filter for Events (Upcoming vs Past)
  const [eventViewMode, setEventViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [userXp, setUserXp] = useState<number>(450);

  // Event Detail Modal State
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['joined-expo-1', 'joined-community-1']);

  // E-Ticket Modal State
  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<EventItem | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('CCH-2026-0089');

  // Group Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTargetEvent, setChatTargetEvent] = useState<EventItem | null>(null);

  // Cancel Ticket Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetEvent, setCancelTargetEvent] = useState<EventItem | null>(null);
  const [cancelTargetTicketId, setCancelTargetTicketId] = useState<string>('');

  // Tip Host Modal State
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTargetEvent, setTipTargetEvent] = useState<EventItem | null>(null);

  // Create Event Modal State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState(false);

  // Check-in tracking
  const [checkedInTicketIds, setCheckedInTicketIds] = useState<string[]>([]);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>([]);

  // Selected quest for verify
  const [selectedQuestForVerifyModal, setSelectedQuestForVerifyModal] = useState<ChallengeQuest | null>(null);

  // Sub-activities synced from localStorage
  const [joinedSubActivities, setJoinedSubActivities] = useState<Record<string, any>>({});

  // Seed Joined Events (Expos + Community)
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([
    {
      id: 'joined-expo-1',
      title: 'ไทยเที่ยวไทย ครั้งที่ 71 @ ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
      category: 'chill',
      tag: 'มหกรรมท่องเที่ยว',
      date: '22 - 25 ส.ค. 2026',
      time: '10:00 - 21:00 น.',
      location: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC Exhibition Hall 5-6)',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      price: 'เข้าชมฟรี!',
      description: 'มหกรรมท่องเที่ยวไทยที่ยิ่งใหญ่ที่สุดแห่งปี ดีลโรงแรม ที่พัก แพ็กเกจท่องเที่ยวลดสูงสุด 70% ชวนเพื่อนๆ และครอบครัวมาเลือกแพ็กเกจเที่ยวสบายกระเป๋า',
      hostName: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
      hostAvatar: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=120&q=80',
      eventType: 'public_venue',
      venueTag: 'qsncc',
      externalUrl: 'https://www.qsncc.com/th/event-calendar',
      participantsCount: 840,
      maxParticipants: 5000,
      createdAtTimestamp: Date.now() - 3600000,
    },
    {
      id: 'joined-community-1',
      title: 'City Sunset Run & Recovery Stretch (วิ่งรับลมยามเย็น สวนเบญจกิติ)',
      category: 'move',
      tag: 'วิ่งชมวิวเมือง',
      date: 'เสาร์ 23 ส.ค. 2026',
      time: '17:30 - 19:30 น.',
      location: 'ลานหน้าอาคารกระจก สวนเบญจกิติ (เชื่อมต่อ BTS อโศก / MRT ศูนย์ฯ สิริกิติ์)',
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      price: 'ฟรี!',
      description: 'วิ่งรับลมสบายๆ ระยะทาง 5 กม. เพซ 6.30 - 7.00 พร้อมคูลดาวน์และยืดเหยียดกล้ามเนื้อ เหมาะสำหรับทั้งมือใหม่และนักวิ่งเพื่อสุขภาพ',
      hostName: 'โค้ชกานต์ (City Runners)',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 16,
      maxParticipants: 20,
      createdAtTimestamp: Date.now() - 7200000,
    },
    {
      id: 'joined-community-2',
      title: 'Specialty Coffee Slow Bar & คุยภาษาอังกฤษชิลล์ๆ ย่านอารีย์',
      category: 'chill',
      tag: 'กาแฟดริป & สนทนา',
      date: 'อาทิตย์ 24 ส.ค. 2026',
      time: '14:00 - 16:30 น.',
      location: 'Ari Slow Bar Lab ซอยอารีย์ 4 ฝั่งเหนือ',
      image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
      price: '฿150 (รวมเครื่องดื่ม 1 แก้ว)',
      description: 'ลิ้มลองเมล็ดกาแฟ Specialty Single Origin พร้อมนั่งคุยแลกเปลี่ยนประสบการณ์เป็นกันเอง ไม่เกร็ง ฝึกภาษาและทำความรู้จักเพื่อนใหม่',
      hostName: 'คุณมายด์ & ทีมบาริสต้า',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 8,
      maxParticipants: 10,
      createdAtTimestamp: Date.now() - 14400000,
    },
  ]);

  // Sync login status and joined sub-activities across pages
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSubs = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
        setJoinedSubActivities(storedSubs);

        const subList = Object.values(storedSubs) as any[];
        if (subList.length > 0) {
          setJoinedEvents((prev) => {
            const existingIds = prev.map((e) => e.id);
            const newEventsToAdd: EventItem[] = [];
            for (const sub of subList) {
              if (!existingIds.includes(sub.eventId)) {
                newEventsToAdd.push({
                  id: sub.eventId,
                  title: sub.eventTitle,
                  category: 'chill',
                  tag: 'งานมหกรรม & ชวนเพื่อน',
                  date: sub.eventDate || '28 มี.ค. 2026',
                  time: sub.eventTime || '10:00 - 20:00 น.',
                  location: sub.eventLocation || 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
                  image: sub.eventImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
                  price: sub.eventPrice || 'เข้าชมฟรี!',
                  description: `กิจกรรมและกลุ่มชวนเพื่อนที่คุณลงทะเบียนเข้าร่วม: ${sub.subTitle}`,
                  hostName: sub.creatorName || 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
                  hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                  eventType: sub.eventType || 'public_venue',
                  participantsCount: 4,
                  maxParticipants: 10,
                  createdAtTimestamp: Date.now(),
                });
              }
            }
            return newEventsToAdd.length > 0 ? [...prev, ...newEventsToAdd] : prev;
          });
        }

        // Deep-linking: auto open chat if ?chatSubId in URL
        const params = new URLSearchParams(window.location.search);
        const chatSubId = params.get('chatSubId');
        const eventId = params.get('eventId');
        if (chatSubId && eventId) {
          setTimeout(() => {
            setJoinedEvents((currentEvents) => {
              const matched = currentEvents.find((e) => e.id === eventId);
              if (matched) {
                setChatTargetEvent(matched);
                setIsChatModalOpen(true);
              }
              return currentEvents;
            });
          }, 350);
        }
      } catch (e) {
        console.log('Error reading joinedSubActivities in MyHub:', e);
      }
    }
  }, []);



  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Calendar Month Navigation Handlers
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
    setSelectedCalDay(null);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
    setSelectedCalDay(null);
  };

  const handleTodayMonth = () => {
    setCalYear(2026);
    setCalMonth(7); // Aug 2026
    setSelectedCalDay(22);
  };

  // Dynamic Days in Month Calculation
  const daysInMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  // Monday-first Starting Day Offset (0: Mon, 1: Tue, ..., 6: Sun)
  const startDayOffset = useMemo(() => {
    const day = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
    return (day + 6) % 7;
  }, [calYear, calMonth]);

  // Dynamic Total Calendar Cells (35 or 42)
  const totalGridCells = useMemo(() => {
    const total = startDayOffset + daysInMonth;
    return total > 35 ? 42 : 35;
  }, [startDayOffset, daysInMonth]);

  const endDayOffset = useMemo(() => {
    return totalGridCells - (startDayOffset + daysInMonth);
  }, [totalGridCells, startDayOffset, daysInMonth]);

  // Check if an event matches a specific calendar month & year
  const isEventInCalMonth = (ev: EventItem, monthIdx: number, year: number) => {
    const monthShort = THAI_MONTH_SHORT[monthIdx];
    const monthFull = THAI_MONTH_NAMES[monthIdx];
    const dateStr = ev.date || '';
    if (dateStr.includes(monthShort) || dateStr.includes(monthFull)) {
      return true;
    }
    if (ev.createdAtTimestamp) {
      const d = new Date(ev.createdAtTimestamp);
      if (d.getFullYear() === year && d.getMonth() === monthIdx) return true;
    }
    // Default mock check for Aug 2026
    return monthIdx === 7 && year === 2026 && dateStr.includes('ส.ค.');
  };

  // Find Days with Bookings in the selected month
  const bookedDaysInCurrentMonth = useMemo(() => {
    const bookedSet = new Set<number>();
    joinedEvents.forEach((ev) => {
      if (isEventInCalMonth(ev, calMonth, calYear)) {
        const dStr = ev.date || '';
        for (let day = 1; day <= daysInMonth; day++) {
          if (dStr.includes(day.toString())) {
            bookedSet.add(day);
          }
        }
      }
    });
    return Array.from(bookedSet);
  }, [joinedEvents, calMonth, calYear, daysInMonth]);

  // Filtered Events based on View Mode & Category & Date
  const filteredEvents = useMemo(() => {
    return joinedEvents.filter((ev) => {
      const isEnded = isEventEnded(ev);
      if (eventViewMode === 'upcoming' && isEnded) return false;
      if (eventViewMode === 'past' && !isEnded) return false;

      if (joinedTypeFilter !== 'all' && ev.eventType !== joinedTypeFilter) return false;

      if (selectedCalDay !== null) {
        const dStr = ev.date || '';
        const hasDay = dStr.includes(selectedCalDay.toString());
        if (!hasDay) return false;
      }

      return true;
    });
  }, [joinedEvents, eventViewMode, joinedTypeFilter, selectedCalDay]);

  // Separate Expos vs Community
  const expoEvents = useMemo(() => filteredEvents.filter((e) => e.eventType === 'public_venue'), [filteredEvents]);
  const communityEvents = useMemo(() => filteredEvents.filter((e) => e.eventType !== 'public_venue'), [filteredEvents]);

  // Open E-Ticket Modal
  const handleOpenTicket = (event: EventItem, idx: number) => {
    const tId = `CCH-2026-${(idx + 1).toString().padStart(4, '0')}`;
    setSelectedTicketEvent(event);
    setSelectedTicketId(tId);
    setIsETicketModalOpen(true);
  };

  // Open Group Chat Modal
  const handleOpenGroupChat = (event: EventItem) => {
    setChatTargetEvent(event);
    setIsChatModalOpen(true);
  };

  // Open Cancel Ticket Modal
  const handleOpenCancelTicket = (event: EventItem, ticketId: string) => {
    setCancelTargetEvent(event);
    setCancelTargetTicketId(ticketId);
    setIsCancelModalOpen(true);
  };

  // Confirm Cancel Ticket
  const handleConfirmCancel = (ticketId: string, reason: string) => {
    if (cancelTargetEvent) {
      setJoinedEvents((prev) => prev.filter((ev) => ev.id !== cancelTargetEvent.id));
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
          delete stored[cancelTargetEvent.id];
          localStorage.setItem('joinedSubActivities', JSON.stringify(stored));
          setJoinedSubActivities(stored);
        } catch (e) {
          console.log(e);
        }
      }
      showToast(`✔️ ยกเลิกตั๋ว ${ticketId} สำเร็จ (เหตุผล: ${reason}) ระบบได้คืนที่นั่งให้เพื่อนสมาชิกแล้ว`);
    }
  };

  // Simulate Check-in
  const handleCheckIn = (ticketId: string) => {
    if (!checkedInTicketIds.includes(ticketId)) {
      setCheckedInTicketIds((prev) => [...prev, ticketId]);
      setUserXp((prev) => prev + 50);
      showToast('🎉 เช็คอินสำเร็จ! คุณได้รับ +50 XP และปลดล็อกความคืบหน้า Badge แล้ว!');
    }
  };

  // Quest Verification Handler
  const handleVerifySuccess = (questId: string, proofData: any) => {
    setMyChallenges((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const currentCount = parseInt(q.current || '0') + 1;
          const totalCount = parseInt(q.total || '3') || 3;
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
    showToast(`✅ ยืนยันหลักฐานสำเร็จ! ความคืบหน้าเพิ่มขึ้น +50 XP (${proofData.type === 'photo' ? 'รูปถ่าย 📸' : proofData.type === 'gps' ? 'พิกัด GPS 📍' : 'ตั๋ว QR 🎟️'})`);
  };

  // Helper to render Event Card
  const renderEventCard = (event: EventItem, idx: number) => {
    const isPublic = event.eventType === 'public_venue';
    const ticketId = `CCH-2026-${(idx + 89).toString().padStart(4, '0')}`;
    const subInfo = joinedSubActivities[event.id];

    return (
      <div
        key={event.id}
        onClick={() => setDetailModalEvent(event)}
        className="group bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#4A7C59]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer relative"
      >
        {/* Image Container */}
        <div className="relative aspect-video sm:aspect-video lg:h-32 xl:h-34 2xl:h-36 w-full overflow-hidden bg-slate-100 shrink-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

          {/* Hover Hint Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border flex items-center gap-1 bg-white/95 text-[#1E293B] border-white/50">
              🔍 คลิกดูรายละเอียด
            </span>
          </div>

          {/* Status Badge on Image */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm flex items-center gap-1">
              <span>{isPublic ? 'บันทึกนัดแล้ว' : 'เข้าร่วมแล้ว'}</span>
            </span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
          <div className="space-y-1.5">
            {/* Top Row: Host Info + Price */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={event.hostName}
                  className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  {event.hostName}
                </span>
              </div>

              {event.price && (
                <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                  event.price.includes('ฟรี')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-orange-50 text-[#F26430] border-orange-200'
                }`}>
                  {event.price.includes('ฟรี') ? 'ฟรี' : event.price.replace(/\s*\([^)]*\)/g, '').trim()}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-xs sm:text-sm lg:text-[13px] xl:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
              {event.title}
            </h3>

            {/* Meta Info */}
            <div className="space-y-1 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                <span className="truncate">{event.date} • {event.time}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                <span className="truncate" title={event.location}>{event.location}</span>
              </div>
            </div>

            {/* Joined Sub-Activity Group Details in MyHub */}
            {subInfo && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 text-xs text-[#1E293B] space-y-1 mt-1 text-left">
                <p className="font-bold text-[#4A7C59] flex items-center gap-1.5 min-w-0">
                  <span>🎯</span>
                  <span className="truncate">กลุ่มที่คุณเข้าร่วม: <strong>"{subInfo.subTitle}"</strong></span>
                </p>
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span>จัดโดย <strong className="text-[#1E293B]">{subInfo.creatorName}</strong></span>
                  <span>•</span>
                  <span>⏰ {subInfo.subTime}</span>
                  {subInfo.meetupPoint && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-medium">📍 {subInfo.meetupPoint}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Area: Type Badge (Left) + Actions (Right) */}
          <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 mt-auto">
            <span className={`text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
              isPublic
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span>{isPublic ? '🏛️ อีเวนต์ & งานแฟร์' : '🌿 Chill & Connect Community'}</span>
            </span>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
              {!isPublic && (
                <button
                  type="button"
                  onClick={() => handleOpenTicket(event, idx + 89)}
                  className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="โชว์ตั๋ว QR Code สำหรับเช็คอิน"
                >
                  <QrCode className="w-3 h-3" />
                  <span>ตั๋ว QR</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenGroupChat(event)}
                className="bg-white hover:bg-slate-50 text-[#1E293B] border border-emerald-300 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                title="เปิดห้องแชตคุยกับโฮสต์และเพื่อนๆ ในกลุ่ม"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>💬 คุยกับโฮสต์ ({subInfo?.creatorName || event.hostName})</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCancelTicket(event, ticketId)}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                title={isPublic ? 'ลบออกจากตาราง' : 'ยกเลิกการเข้าร่วม'}
              >
                ✕ {isPublic ? 'ลบ' : 'ยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render Challenge & Quest Card (Unified Proportions)
  const renderQuestCard = (quest: ChallengeQuest) => {
    const isCompleted = quest.progressPercent >= 100;
    const categoryColors = {
      move: 'from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-200',
      heal: 'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200',
      chill: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
      learn: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200',
    };
    const colorStyle = categoryColors[quest.category as keyof typeof categoryColors] || categoryColors.chill;

    return (
      <div
        key={quest.id}
        className="group bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#4A7C59]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 relative justify-between"
      >
        {/* Top Header Banner */}
        <div className={`p-3.5 bg-gradient-to-r ${colorStyle} border-b flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-6 h-6 rounded-full bg-white shadow-2xs flex items-center justify-center text-xs shrink-0 font-bold">
              🏅
            </span>
            <span className="text-xs font-extrabold truncate text-slate-800">
              {quest.badgeLabel}
            </span>
          </div>

          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white/90 text-[#F26430] shadow-2xs border border-orange-200 shrink-0">
            +{quest.rewardPoints} XP
          </span>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-3">
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
              {quest.title}
            </h4>
            <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
              {quest.targetGoal}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-[11px] text-slate-500">ความคืบหน้า</span>
              <span className="text-[11px] font-black text-emerald-700">
                {quest.completedCountInfo} ({quest.progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-[#4A7C59]'
                }`}
                style={{ width: `${quest.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-slate-100 mt-auto">
            {isCompleted ? (
              <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-extrabold py-2 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>สำเร็จภารกิจแล้ว (รับตราแล้ว)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedQuestForVerifyModal(quest)}
                className="w-full bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ส่งหลักฐานเช็คอิน</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper to render Reward Shop Card (Unified Proportions)
  const renderRewardCard = (item: RewardShopItem) => {
    const isRedeemed = redeemedRewardIds.includes(item.id);
    const canAfford = userXp >= item.costXp;

    return (
      <div
        key={item.id}
        className="group bg-white rounded-2xl border border-[#E8E2D8] hover:border-amber-400/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 relative justify-between"
      >
        {/* Top Header Pattern */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-amber-200/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[11px] font-bold text-slate-700 px-2 py-0.5 bg-white/80 rounded-md border border-amber-200/60">
              {item.category}
            </span>
          </div>

          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#F26430] text-white shadow-2xs">
            {item.costXp} XP
          </span>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-3">
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#F26430] transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
              {item.description}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4A7C59]">
              <Tag className="w-3 h-3 text-[#4A7C59]" />
              <span className="truncate">{item.partner}</span>
            </div>
          </div>

          {/* Action Bottom */}
          <div className="pt-2 border-t border-slate-100 mt-auto">
            {isRedeemed ? (
              <div className="w-full bg-emerald-50 text-emerald-800 text-[11px] font-bold py-2 px-2.5 rounded-xl border border-emerald-200 text-center truncate">
                ✓ รหัส: <strong>{item.voucherCode}</strong>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => {
                  if (canAfford) {
                    setUserXp((prev) => prev - item.costXp);
                    setRedeemedRewardIds((prev) => [...prev, item.id]);
                    showToast(`🎉 แลกรางวัล "${item.title}" สำเร็จ! รหัสคูปอง: ${item.voucherCode}`);
                  }
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  canAfford
                    ? 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-2xs active:scale-98 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{canAfford ? 'แลกรับรางวัล' : `ต้องการอีก ${item.costXp - userXp} XP`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] font-sans pb-24 md:pb-16 flex flex-col justify-between">
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
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md animate-bounce-short border border-white/20 flex items-center gap-2 max-w-[90vw] text-center">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {!isLoggedIn ? (
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-fade-in flex flex-col justify-center items-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-[#4A7C59] flex items-center justify-center shadow-lg border border-emerald-200">
              <Lock className="w-10 h-10 text-[#4A7C59]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                เข้าสู่ระบบเพื่อเปิดกระเป๋า MyHub
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                จัดการตั๋ว E-Ticket กิจกรรมที่คุณเข้าร่วม, เข้าห้องแชตนัดพบเพื่อนร่วมตี้, และสะสมแต้มแลกของรางวัลสุดพิเศษ
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-3 px-6 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔑 เข้าสู่ระบบสมาชิก</span>
              </button>
              <Link
                href="/onboarding"
                className="w-full bg-white hover:bg-slate-50 text-[#4A7C59] border-2 border-[#4A7C59] py-3 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✨ สมัครสมาชิกใหม่</span>
              </Link>
            </div>

            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors pt-2"
            >
              ← กลับไปสำรวจกิจกรรมในหน้าแรก
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Banner Header of MyHub */}
            <div className="bg-white border-b border-slate-200/90 pt-6 pb-6 sm:pt-8 sm:pb-8">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Profile & Hub Title */}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight truncate">
                      มายฮับส่วนตัว (My Hub)
                    </h1>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span>⚡ Level 4 Explorer</span>
                      <span>•</span>
                      <span className="text-[#F26430] font-black">💎 {userXp} XP</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B] truncate">
                    ตารางกิจกรรม, ตั๋วดิจิทัล, และความคืบหน้าชาเลนจ์ของคุณ
                  </p>
                </div>
              </div>

              {/* Persona Switcher (Member vs Host Studio) */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-[#E8E2D8] shadow-2xs self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentRole('member')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'member'
                      ? 'bg-[#4A7C59] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>มุมมองผู้เข้าร่วม ({joinedEvents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentRole('host')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'host'
                      ? 'bg-[#F26430] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>สตูดิโอผู้จัด (Host)</span>
                </button>
              </div>

            </div>

            {/* Sub Tabs Navigation (Tickets & Calendar / Quests / Rewards) */}
            <div className="flex items-center gap-2 pt-6 overflow-x-auto no-scrollbar border-t border-[#E8E2D8]/60 mt-5">
              <button
                type="button"
                onClick={() => setActiveSubTab('joined_events')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'joined_events'
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-white text-[#64748B] hover:text-[#1E293B] border border-[#E8E2D8]'
                }`}
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>ตารางนัด & ตั๋วของฉัน ({joinedEvents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('quests')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'quests'
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-white text-[#64748B] hover:text-[#1E293B] border border-[#E8E2D8]'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>ชาเลนจ์ & เควสต์ ({myChallenges.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('rewards')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'rewards'
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-white text-[#64748B] hover:text-[#1E293B] border border-[#E8E2D8]'
                }`}
              >
                <Gift className="w-4 h-4 text-rose-400" />
                <span>ร้านแลกรางวัล</span>
              </button>
            </div>

          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* TAB 1: JOINED EVENTS & SCHEDULE */}
          {activeSubTab === 'joined_events' && (
            <div className="space-y-6">

              {/* 📅 Top Control Bar: Month Navigation + Mode Switcher */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  
                  {/* Month Navigation Title with Prev / Next */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                        title="เดือนก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="px-3 py-1 text-xs sm:text-sm font-black text-[#1E293B] flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-[#4A7C59]" />
                        <span>{THAI_MONTH_NAMES[calMonth]} {calYear}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                        title="เดือนถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTodayMonth}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      เดือนปัจจุบัน
                    </button>
                  </div>

                  {/* View Mode Toggle: Calendar vs List */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setHubViewMode('list')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        hubViewMode === 'list' ? 'bg-white text-[#1E293B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5 text-[#4A7C59]" />
                      <span>การ์ดแยกหมวด</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHubViewMode('calendar')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        hubViewMode === 'calendar' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>ปฏิทินเต็ม</span>
                    </button>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 📅 FULL MONTH CALENDAR VIEW (When 'calendar' is active) */}
                {/* ------------------------------------------------------------- */}
                {hubViewMode === 'calendar' ? (
                  <div className="pt-2 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-wrap gap-2">
                      <span>ตารางปฏิทิน: {THAI_MONTH_NAMES[calMonth]} {calYear}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sky-800">
                          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                          <span>อีเวนต์ & งานแฟร์</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-800">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                          <span>กิจกรรมชุมชน</span>
                        </span>
                      </div>
                    </div>

                    {/* Month Grid: Mon-Sun */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      {/* Weekday Header */}
                      <div className="grid grid-cols-7 bg-slate-100/90 text-center text-[11px] sm:text-xs font-extrabold text-slate-600 border-b border-slate-200 py-2">
                        <span>จันทร์</span>
                        <span>อังคาร</span>
                        <span>พุธ</span>
                        <span>พฤหัสฯ</span>
                        <span>ศุกร์</span>
                        <span className="text-amber-700">เสาร์</span>
                        <span className="text-rose-700">อาทิตย์</span>
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-cols-7 bg-slate-100 gap-px">
                        {/* Empty days before 1st of the month */}
                        {[...Array(startDayOffset)].map((_, i) => (
                          <div key={`empty-start-${i}`} className="bg-slate-50 min-h-[70px] sm:min-h-[90px] p-1 opacity-40" />
                        ))}

                        {/* Days 1 to daysInMonth */}
                        {[...Array(daysInMonth)].map((_, idx) => {
                          const day = idx + 1;
                          const isToday = calMonth === 7 && calYear === 2026 && day === 22;
                          const hasBookings = bookedDaysInCurrentMonth.includes(day);

                          // Find events occurring on this day
                          const dayEvents = joinedEvents.filter((ev) => {
                            if (!isEventInCalMonth(ev, calMonth, calYear)) return false;
                            return (ev.date || '').includes(day.toString());
                          });

                          return (
                            <div
                              key={`day-${day}`}
                              className={`bg-white min-h-[70px] sm:min-h-[90px] p-1 sm:p-1.5 flex flex-col justify-between transition-colors ${
                                isToday ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] sm:text-xs font-black px-1.5 py-0.5 rounded-full ${
                                  isToday
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : hasBookings
                                    ? 'text-slate-900 font-extrabold'
                                    : 'text-slate-400'
                                }`}>
                                  {day}
                                </span>
                                {isToday && (
                                  <span className="text-[9px] font-bold text-amber-700 sm:inline hidden">วันนี้</span>
                                )}
                              </div>

                              {/* Event Chips inside Day Cell */}
                              <div className="space-y-1 mt-1">
                                {dayEvents.map((ev) => {
                                  const isPub = ev.eventType === 'public_venue';
                                  return (
                                    <button
                                      key={ev.id}
                                      type="button"
                                      onClick={() => setDetailModalEvent(ev)}
                                      className={`w-full text-left text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border truncate shadow-2xs cursor-pointer active:scale-95 transition-transform ${
                                        isPub
                                          ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300'
                                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                                      }`}
                                      title={ev.title}
                                    >
                                      {isPub ? '🏛️ ' : '🏡 '}
                                      {ev.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty days to complete calendar grid */}
                        {[...Array(endDayOffset)].map((_, i) => (
                          <div key={`empty-end-${i}`} className="bg-slate-50 min-h-[70px] sm:min-h-[90px] p-1 opacity-40" />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Horizontal Date Picker Slider (For Quick Date Filtering) */
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 pt-1">
                    {[...Array(Math.min(12, daysInMonth))].map((_, i) => {
                      const day = (calMonth === 7 && calYear === 2026) ? i + 20 : i + 1;
                      if (day > daysInMonth) return null;

                      const isBooked = bookedDaysInCurrentMonth.includes(day);
                      const isToday = calMonth === 7 && calYear === 2026 && day === 22;
                      const isSelected = selectedCalDay === day;

                      return (
                        <button
                          key={`date-chip-${day}`}
                          type="button"
                          onClick={() => setSelectedCalDay(isSelected ? null : day)}
                          className={`p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                            isSelected
                              ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-md scale-105 z-10'
                              : isToday
                              ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-extrabold'
                              : isBooked
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                              : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-[10px] font-medium opacity-80">{THAI_MONTH_SHORT[calMonth]}</span>
                          <span className="text-sm sm:text-base font-black">{day}</span>
                          {isToday && (
                            <span className={`text-[8px] font-bold px-1 rounded-sm mt-0.5 ${isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'}`}>
                              วันนี้
                            </span>
                          )}
                          {isBooked && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F26430] absolute top-1.5 right-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCalDay && (
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">
                      กรองเฉพาะวันที่: <strong>{selectedCalDay} {THAI_MONTH_NAMES[calMonth]} {calYear}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCalDay(null)}
                      className="text-[#F26430] font-bold hover:underline cursor-pointer"
                    >
                      ล้างตัวกรองวันที่
                    </button>
                  </div>
                )}
              </div>

              {/* Sub Category Switcher & Upcoming Toggle */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E8E2D8] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setJoinedTypeFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      joinedTypeFilter === 'all' ? 'bg-[#1E293B] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ทั้งหมด ({joinedEvents.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setJoinedTypeFilter('public_venue')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      joinedTypeFilter === 'public_venue' ? 'bg-sky-700 text-white shadow-2xs' : 'text-sky-700 hover:bg-sky-50'
                    }`}
                  >
                    <span>🏛️ อีเวนต์ & งานแฟร์ ({joinedEvents.filter((e) => e.eventType === 'public_venue').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJoinedTypeFilter('community')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      joinedTypeFilter === 'community' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span>🌿 Chill & Connect Community ({joinedEvents.filter((e) => e.eventType !== 'public_venue').length})</span>
                  </button>
                </div>

                {/* Upcoming vs Past Toggle */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setEventViewMode('upcoming')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      eventViewMode === 'upcoming' ? 'bg-[#4A7C59] text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    กำลังจะมาถึง
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventViewMode('past')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      eventViewMode === 'past' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    กิจกรรมที่ผ่านมา
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* ZONE 1: 🏛️ PUBLIC VENUE EXPOS & FAIRS */}
              {/* ------------------------------------------------------------- */}
              {(joinedTypeFilter === 'all' || joinedTypeFilter === 'public_venue') && expoEvents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-sky-200/80 pb-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500" />
                    <h3 className="font-black text-sm sm:text-base text-sky-950">
                      🏛️ อีเวนต์ & งานแฟร์ที่บันทึกไว้ (Expos & Public Fairs)
                    </h3>
                    <span className="text-xs text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-bold">
                      {expoEvents.length} รายการ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {expoEvents.map((event, idx) => renderEventCard(event, idx))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ZONE 2: 🌿 CHILL & CONNECT COMMUNITY */}
              {/* ------------------------------------------------------------- */}
              {(joinedTypeFilter === 'all' || joinedTypeFilter === 'community') && communityEvents.length > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                    <h3 className="font-black text-sm sm:text-base text-emerald-950">
                      🌿 Chill & Connect Community & ตั๋วเข้าร่วม (E-Tickets)
                    </h3>
                    <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      {communityEvents.length} ตั๋ว
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {communityEvents.map((event, idx) => renderEventCard(event, idx))}
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 && (
                <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-[#E8E2D8]">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#1E293B]">
                    ไม่พบกิจกรรมในเงื่อนไขที่คุณเลือก
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    ลองเปลี่ยนวันที่ หรือค้นหากิจกรรมใหม่ๆ แล้วกดบันทึกลงตารางนัดได้เลย
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 bg-[#F26430] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#F26430]/25"
                  >
                    <span>สำรวจกิจกรรมทั้งหมด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: QUESTS & CHALLENGES (Unified Proportions & Rich Layout) */}
          {activeSubTab === 'quests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="space-y-0.5">
                  <h3 className="font-black text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>ภารกิจและชาเลนจ์สะสมเหรียญรางวัล</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    ทำกิจกรรมตามเงื่อนไขเพื่อรับแต้ม XP และปลดล็อกเข็มกลัดเกียรติยศ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateChallengeModalOpen(true)}
                  className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>สร้างชาเลนจ์ใหม่</span>
                </button>
              </div>

              {/* Active User Quests (Same responsive 4-column grid as events) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h4 className="font-black text-sm sm:text-base text-[#1E293B]">
                    ภารกิจที่คุณกำลังทำอยู่ (Active Quests)
                  </h4>
                  <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                    {myChallenges.length} ภารกิจ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {myChallenges.map((quest) => renderQuestCard(quest))}
                </div>
              </div>

              {/* Recommended Community Challenges Section */}
              <div className="space-y-3 pt-6 border-t border-[#E8E2D8]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-sm sm:text-base text-[#1E293B]">
                      ชาเลนจ์แนะนำยอดนิยมประจำสัปดาห์
                    </h4>
                  </div>
                  <Link
                    href="/challenges"
                    className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1"
                  >
                    <span>ดูชาเลนจ์ทั้งหมด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {RECOMMENDED_CHALLENGES.map((rec) => (
                    <div
                      key={rec.id}
                      className="group bg-white rounded-2xl border border-[#E8E2D8] hover:border-emerald-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden transform hover:-translate-y-1 relative"
                    >
                      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {rec.isOfficial ? '👑 Official' : '👥 Community'}
                        </span>
                        <span className="text-xs font-black text-[#F26430]">
                          +{rec.rewardPoints} XP
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2.5">
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs sm:text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59]">
                            {rec.title}
                          </h5>
                          <p className="text-xs text-[#64748B] line-clamp-2">
                            {rec.targetGoal}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>🏅 {rec.badgeLabel}</span>
                          <span>👥 {rec.participantsCount} คนเข้าร่วม</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 mt-auto">
                          <Link
                            href="/challenges"
                            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>เข้าร่วมชาเลนจ์</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REWARDS SHOP (Unified Proportions & Clean Header) */}
          {activeSubTab === 'rewards' && (
            <div className="space-y-6">
              {/* Points Wallet Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-[#F26430] rounded-3xl p-5 sm:p-6 text-white shadow-md flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-100">กระเป๋าแต้มสะสมของคุณ</p>
                  <h3 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                    <span>{userXp} XP</span>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                      ⚡ Level 4 Explorer
                    </span>
                  </h3>
                  <p className="text-xs text-amber-100">ทำภารกิจหรือเช็คอินกิจกรรมเพื่อสะสมแต้มแลกของรางวัลสุดพิเศษ</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <Gift className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Reward Items Grid (Same responsive 4-column grid as events) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-orange-200/80 pb-2">
                  <span className="w-3 h-3 rounded-full bg-[#F26430]" />
                  <h4 className="font-black text-sm sm:text-base text-[#1E293B]">
                    ของรางวัลและส่วนลดพิเศษ (Rewards Catalog)
                  </h4>
                  <span className="text-xs text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full font-bold">
                    {REWARD_SHOP_ITEMS.length} รายการ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {REWARD_SHOP_ITEMS.map((item) => renderRewardCard(item))}
                </div>
              </div>
            </div>
          )}

        </main>
        </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={0}
      />

      {/* MODALS */}
      {/* 0. Event Detail Modal */}
      <EventDetailModal
        event={detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        isFavorite={detailModalEvent ? favorites.includes(detailModalEvent.id) : false}
        onToggleFavorite={toggleFavorite}
        isJoined={true}
        isLoggedIn={isLoggedIn}
        onJoinSuccess={() => {}}
        onLeaveSuccess={(id) => {
          setJoinedEvents((prev) => prev.filter((e) => e.id !== id));
          setDetailModalEvent(null);
          showToast('✔️ ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อยแล้ว');
        }}
      />

      {/* 1. E-Ticket Modal */}
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

      {/* 4. Tip Host Modal */}
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

      {/* 5. Quest Verify Modal */}
      <VerifyQuestModal
        isOpen={!!selectedQuestForVerifyModal}
        onClose={() => setSelectedQuestForVerifyModal(null)}
        quest={selectedQuestForVerifyModal}
        onVerificationSuccess={handleVerifySuccess}
      />

      {/* 6. Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onCreateSuccess={(newQuest) => {
          setMyChallenges([newQuest, ...myChallenges]);
          showToast(`🎉 สร้างชาเลนจ์ "${newQuest.title}" สำเร็จ!`);
        }}
      />

      {/* 7. Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          setJoinedEvents([newEvent, ...joinedEvents]);
          showToast(`🎉 สร้างกิจกรรม "${newEvent.title}" สำเร็จ!`);
        }}
      />

      {/* 8. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับครับ!');
        }}
      />

      {/* 9. Logout Modal */}
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
