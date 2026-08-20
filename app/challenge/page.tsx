'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { ETicketModal } from '@/components/ETicketModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { MOCK_CHALLENGES, MOCK_EVENTS, ChallengeQuest, EventItem } from '@/data/mockData';
import ReviewModal, { ReviewSubmitData } from '@/components/ReviewModal';
import {
  Award,
  Coffee,
  Footprints,
  Users,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Trophy,
  Target,
  Zap,
  Sprout,
  ShieldCheck,
  KeyRound,
  LogIn,
  Ticket,
  Calendar,
  MapPin,
  MessageCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  Star,
  Gift,
  QrCode,
  ShoppingBag,
  Trash2,
  Crown,
} from 'lucide-react';

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
  {
    id: 'rec-3',
    title: 'Board Game Master 3 Matches',
    category: 'chill',
    iconName: 'Target',
    targetGoal: 'เข้าร่วมเล่นบอร์ดเกมครบ 3 ครั้ง',
    badgeLabel: 'Board Game Club',
    rewardPoints: 150,
    participantsCount: 64,
  },
  {
    id: 'rec-4',
    title: 'Handmade Craft & Pottery Creator',
    category: 'learn',
    iconName: 'Zap',
    targetGoal: 'สร้างสรรค์งานคราฟต์ด้วยมือ 2 ชิ้น',
    badgeLabel: 'Craft Master',
    rewardPoints: 200,
    participantsCount: 45,
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
  },
];

export default function ChallengePage() {
  const [activeNavTab, setActiveNavTab] = useState('challenge');
  const [activeSubTab, setActiveSubTab] = useState<'joined_events' | 'quests' | 'rewards'>('joined_events');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [myChallenges, setMyChallenges] = useState<ChallengeQuest[]>(MOCK_CHALLENGES);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'move' | 'heal' | 'chill' | 'learn'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sub-filter for Events (Upcoming vs Past)
  const [eventViewMode, setEventViewMode] = useState<'upcoming' | 'past'>('upcoming');
  const [userXp, setUserXp] = useState<number>(450);
  const [isReviewerBadgeUnlocked, setIsReviewerBadgeUnlocked] = useState<boolean>(false);
  const [isVipBadgeUnlocked, setIsVipBadgeUnlocked] = useState<boolean>(false);

  // E-Ticket Modal State
  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<EventItem | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('CCH-2026-0001');
  const [checkedInTicketIds, setCheckedInTicketIds] = useState<string[]>([]);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>([]);

  // Cancel Ticket Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetEvent, setCancelTargetEvent] = useState<EventItem | null>(null);
  const [cancelTargetTicketId, setCancelTargetTicketId] = useState<string>('');

  // Group Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTargetEvent, setChatTargetEvent] = useState<EventItem | null>(null);

  // Create Custom Challenge Modal State
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);
  const [reviewTargetEvent, setReviewTargetEvent] = useState<EventItem | null>(null);
  const [reviewedEventIds, setReviewedEventIds] = useState<string[]>(['1']);

  // Mock joined events list for current logged-in user
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([
    MOCK_EVENTS[0], // สัปดาห์หนังสือแห่งชาติ
    MOCK_EVENTS[2], // BITEC Pop Culture & Anime Expo
    MOCK_EVENTS[3] || MOCK_EVENTS[0], // IMPACT Home Crafts
  ]);

  // Mock past completed events
  const [pastEvents, setPastEvents] = useState<EventItem[]>([
    MOCK_EVENTS[4] || MOCK_EVENTS[1], // HYROX Bootcamp
    MOCK_EVENTS[5] || MOCK_EVENTS[2], // Sound Bath Meditation
  ]);

  // Sync login status across pages with localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLoginState = localStorage.getItem('isLoggedIn');
      if (savedLoginState === 'false') {
        setIsLoggedIn(false);
      } else {
        localStorage.setItem('isLoggedIn', 'true');
      }
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-[#4A7C59]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-500" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-emerald-300" />;
      case 'Target':
        return <Target className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#F26430]" />;
      default:
        return <Award className="w-5 h-5 text-[#F26430]" />;
    }
  };

  const handleJoinRecommended = (recItem: RecommendedChallenge) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }

    const isAlreadyIn = myChallenges.some((q) => q.title === recItem.title);
    if (isAlreadyIn) {
      showToast(`คุณทำชาเลนจ์ "${recItem.title}" อยู่แล้ว!`);
      return;
    }

    const newQuest: ChallengeQuest = {
      id: `quest-${Date.now()}`,
      title: recItem.title,
      badgeLabel: recItem.badgeLabel,
      iconName: recItem.iconName,
      current: '0',
      total: '1',
      completedCountInfo: '0/1 ครั้ง',
      progressPercent: 10,
    };

    setMyChallenges([newQuest, ...myChallenges]);
    showToast(`รับชาเลนจ์ "${recItem.title}" สำเร็จ! ลุยเลย 🔥`);
  };

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

  // Redeem Reward
  const handleRedeemReward = (item: RewardShopItem) => {
    if (userXp < item.costXp) {
      showToast(`แต้ม XP ไม่เพียงพอ (ต้องการ ${item.costXp} XP, ปัจจุบันมี ${userXp} XP)`);
      return;
    }

    setUserXp((prev) => prev - item.costXp);
    setRedeemedRewardIds((prev) => [...prev, item.id]);
    setIsVipBadgeUnlocked(true);
    showToast(`🎉 แลก "${item.title}" สำเร็จ! ได้รับเหรียญ 🏆 VIP Collector เพิ่ม และรหัสคูปอง: ${item.voucherCode}`);
  };

  const handleOpenReviewModal = (event: EventItem) => {
    setReviewTargetEvent(event);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitSuccess = (data: ReviewSubmitData) => {
    setReviewedEventIds((prev) => [...prev, data.eventId]);
    setUserXp((prev) => prev + 50);
    setIsReviewerBadgeUnlocked(true);
    showToast('รีวิวสำเร็จ! ได้รับ +50 XP และปลดล็อกเหรียญนักรีวิวฮีลใจ 🌟');
  };

  const handleCreateQuestSuccess = (newQuest: ChallengeQuest) => {
    setMyChallenges([newQuest, ...myChallenges]);
    setUserXp((prev) => prev + 25);
    showToast(`🎉 สร้างชาเลนจ์ "${newQuest.title}" สำเร็จ! ได้รับ +25 XP ลุยให้สำเร็จเลย!`);
  };

  const filteredRecommended = selectedCategory === 'all'
    ? RECOMMENDED_CHALLENGES
    : RECOMMENDED_CHALLENGES.filter((item) => item.category === selectedCategory);

  // Schema.org Structured Data for Personal Activities Hub
  const challengeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'กิจกรรมที่เข้าร่วม & ตั๋ว E-Ticket | Chill & Connect Hub',
    description: 'เปลี่ยนวันว่างให้มีความหมาย ออกมาแชร์รอยยิ้มกับสังคมที่เป็นมิตร ไม่ต้องกลัวเหงาแม้มาคนเดียว พร้อมรับสิทธิ์เข้าร่วมกิจกรรมและของขวัญสุดพิเศษ',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(challengeSchema) }}
      />

      {/* Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={(status) => {
          handleSetIsLoggedIn(status);
          showToast(status ? 'เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ 🎉' : 'ออกจากระบบแล้ว');
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Ultra-Slim & Clean Header Banner */}
        <section className="bg-[#1E293B] text-white py-4 sm:py-5 border-b border-slate-700/60">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Left: Clean Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                  กิจกรรมที่เข้าร่วม & ตั๋ว E-Ticket
                </h1>
                <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  My Hub
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed max-w-2xl">
                เปลี่ยนวันว่างให้มีความหมาย ออกมาแชร์รอยยิ้มกับสังคมที่เป็นมิตร ไม่ต้องกลัวเหงาแม้มาคนเดียว พร้อมรับสิทธิ์เข้าร่วมกิจกรรมและของขวัญสุดพิเศษ
              </p>
            </div>

            {/* Right: Compact Gamification Stats Pill */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl shrink-0 text-xs text-white">
                <span className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lv.3 ({userXp}/600 XP)</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold text-[11px]">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{joinedEvents.length} ตั๋ว</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{3 + (isReviewerBadgeUnlocked ? 1 : 0) + (isVipBadgeUnlocked ? 1 : 0)} Badges</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* REQUIRE LOGIN GUARD */}
          {!isLoggedIn ? (
            /* Locked Guest Screen */
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#E8E2D8] text-center max-w-2xl mx-auto space-y-6 my-6">
              <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto text-[#4A7C59] shadow-inner">
                <Lock className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                  🔒 เข้าสู่ระบบเพื่อดูกิจกรรม & ตั๋วของคุณ
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto leading-relaxed">
                  เข้าสู่ระบบเพื่อจัดการตั๋ว E-Ticket QR Code ที่เข้าร่วม ดูแชตกลุ่มเพื่อนๆ และสะสมความสำเร็จ Badges แลกของรางวัล
                </p>
              </div>

              {/* Benefits Preview List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2 pb-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🎟️</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">จัดการตั๋ว E-Ticket</h4>
                  <p className="text-[11px] text-[#64748B]">ดูวันเวลา สถานที่ และ QR Code สแกนเข้างาน</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">💬</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">แชตกลุ่มเพื่อนร่วมงาน</h4>
                  <p className="text-[11px] text-[#64748B]">นัดแนะจุดนัดพบกับเพื่อนในกลุ่ม</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🏆</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">สะสม Badges & แลกของ</h4>
                  <p className="text-[11px] text-[#64748B]">ปลดล็อกตราเกียรติยศและคูปองส่วนลดคาเฟ่</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#4A7C59]/30 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <KeyRound className="w-5 h-5" />
                  <span>เข้าสู่ระบบเพื่อดูกิจกรรมของฉัน ➔</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged-In User Dashboard */
            <>
              {/* Top Sub-Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-4 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveSubTab('joined_events')}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'joined_events'
                      ? 'bg-[#4A7C59] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>ตั๋วของฉัน & กิจกรรมที่เข้าร่วม ({joinedEvents.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('quests')}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'quests'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>ชาเลนจ์ & เหรียญสะสม Badges</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('rewards')}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'rewards'
                      ? 'bg-[#F26430] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Gift className="w-4 h-4 text-white" />
                  <span>ร้านค้าแลกของรางวัล ({userXp} XP)</span>
                </button>
              </div>

              {/* VIEW 1: 🎟️ กิจกรรมที่เข้าร่วม (My Joined Events & Tickets) */}
              {activeSubTab === 'joined_events' && (
                <section className="space-y-6 animate-fade-in">
                  
                  {/* Header & Sub-filter Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-[#4A7C59]" />
                        <span>ตั๋วกิจกรรมของคุณ</span>
                      </h2>
                      <p className="text-xs text-[#64748B] font-medium mt-0.5">
                        คลิกที่การ์ดหรือปุ่ม เพื่อเปิดดูตั๋ว E-Ticket QR Code แชตคุยกับเพื่อนในตี้ หรือยกเลิกเพื่อคืนที่นั่ง
                      </p>
                    </div>

                    {/* Upcoming vs Past Toggle */}
                    <div className="flex items-center p-1 bg-white border border-[#E8E2D8] rounded-2xl shadow-2xs shrink-0">
                      <button
                        onClick={() => setEventViewMode('upcoming')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'upcoming'
                            ? 'bg-[#4A7C59] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🎟️ ตั๋วที่กำลังจะถึง ({joinedEvents.length})
                      </button>
                      <button
                        onClick={() => setEventViewMode('past')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'past'
                            ? 'bg-[#F26430] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⭐ ประวัติกิจกรรม & รีวิว ({pastEvents.length})
                      </button>
                    </div>
                  </div>

                  {/* 1. UPCOMING EVENTS WITH E-TICKET QR CODE, GROUP CHAT & CANCEL BUTTON */}
                  {eventViewMode === 'upcoming' && (
                    <div className="space-y-4">
                      {joinedEvents.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-3">
                          <p className="text-3xl">🎟️</p>
                          <h4 className="font-extrabold text-base text-slate-800">คุณยังไม่มีตั๋วกิจกรรมที่กำลังจะถึง</h4>
                          <p className="text-xs text-slate-500">ลองเลือกดูกิจกรรมที่น่าสนใจแล้วกดเข้าร่วมได้เลย!</p>
                          <Link
                            href="/"
                            className="inline-block bg-[#4A7C59] hover:bg-[#3B6347] text-white px-5 py-2 rounded-full text-xs font-bold transition-colors"
                          >
                            ค้นหากิจกรรม ➔
                          </Link>
                        </div>
                      ) : (
                        joinedEvents.map((event, idx) => {
                          const ticketId = `CCH-2026-${(idx + 1).toString().padStart(4, '0')}`;
                          const isChecked = checkedInTicketIds.includes(ticketId);

                          return (
                            <div
                              key={event.id}
                              className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#4A7C59]/80 ring-2 ring-[#4A7C59]/10 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden group"
                            >
                              {/* Left: Event Thumbnail & Details */}
                              <div
                                onClick={() => handleOpenTicket(event, idx)}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 cursor-pointer"
                              >
                                <div className="relative aspect-video sm:aspect-square w-full sm:w-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                  <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <span className="absolute top-2 left-2 bg-[#4A7C59] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                                    🟢 ตั๋วพร้อมใช้งาน
                                  </span>
                                </div>

                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-0.5 rounded-full border border-[#4A7C59]/20">
                                      #{event.tag}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono font-bold">
                                      Ticket #{ticketId}
                                    </span>
                                    {isChecked && (
                                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        ✔️ เช็คอินแล้ว
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B] group-hover:text-[#4A7C59] transition-colors">
                                    {event.title}
                                  </h3>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#64748B]">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4 text-[#4A7C59] shrink-0" />
                                      <span>{event.date} • {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-4 h-4 text-[#F26430] shrink-0" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Actions (View Ticket QR, Group Chat, Cancel) */}
                              <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                <button
                                  onClick={() => handleOpenTicket(event, idx)}
                                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#1E293B] to-slate-800 hover:from-black hover:to-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                  <QrCode className="w-4 h-4 text-emerald-400" />
                                  <span>ดูตั๋ว E-Ticket (QR)</span>
                                </button>

                                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleOpenGroupChat(event)}
                                    className="flex-1 sm:flex-none bg-[#EBF3ED] hover:bg-[#D6E8DC] text-[#4A7C59] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>แชตกลุ่ม</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenCancelTicket(event, ticketId)}
                                    className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="ยกเลิกตั๋ว / คืนที่นั่ง"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>ยกเลิก</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 2. PAST COMPLETED EVENTS (With 15s Quick Review Button) */}
                  {eventViewMode === 'past' && (
                    <div className="space-y-4">
                      {pastEvents.map((event) => {
                        const isReviewed = reviewedEventIds.includes(event.id);

                        return (
                          <div
                            key={`past-${event.id}`}
                            className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                              <div className="relative aspect-video sm:aspect-square w-full sm:w-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                <img
                                  src={event.image}
                                  alt={event.title}
                                  className="w-full h-full object-cover grayscale-[20%]"
                                />
                                <span className="absolute top-2 left-2 bg-slate-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                                  ✓ จัดเสร็จสิ้นแล้ว
                                </span>
                              </div>

                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                    ผู้จัด: {event.hostName}
                                  </span>
                                  {event.hostHostedCount && event.hostHostedCount >= 20 && (
                                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      👑 โฮสต์ยอดเยี่ยม ({event.hostHostedCount}+ กิจกรรม)
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
                                  {event.title}
                                </h3>

                                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{event.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Review Action Area */}
                            <div className="flex items-center justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                              {isReviewed ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>คุณรีวิวแล้ว (รับ +50 XP แล้ว ⭐)</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenReviewModal(event)}
                                  className="w-full sm:w-auto bg-[#F26430] hover:bg-[#E05320] text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                                >
                                  <Star className="w-4 h-4 fill-white" />
                                  <span>ให้คะแนนความประทับใจ (+50 XP)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </section>
              )}

              {/* VIEW 2: 🏆 ชาเลนจ์ & เหรียญสะสม (Gamification Quests & Badges) */}
              {activeSubTab === 'quests' && (
                <div className="space-y-12 animate-fade-in">
                  
                  {/* Badges Collection Showcase */}
                  <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-amber-500" />
                          <span>คลังเหรียญเกียรติยศ Badges ของคุณ</span>
                        </h2>
                        <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                          ปลดล็อกเหรียญจากการเข้าร่วมกิจกรรมจริง เช็คอินหน้างาน เขียนรีวิว และแลกของรางวัล
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        ปลดล็อกแล้ว {3 + (isReviewerBadgeUnlocked ? 1 : 0) + (isVipBadgeUnlocked ? 1 : 0)}/8 เหรียญ
                      </span>
                    </div>

                    {/* Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-300 text-center space-y-2 relative shadow-xs">
                        <span className="text-3xl">🏃</span>
                        <h4 className="font-extrabold text-xs text-slate-800">HYROX Runner</h4>
                        <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-300 text-center space-y-2 relative shadow-xs">
                        <span className="text-3xl">🧘</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Zen Master</h4>
                        <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-300 text-center space-y-2 relative shadow-xs">
                        <span className="text-3xl">☕</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Coffee Explorer</h4>
                        <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border text-center space-y-2 relative shadow-xs ${
                        isReviewerBadgeUnlocked
                          ? 'bg-[#FAF7F2] border-amber-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}>
                        <span className="text-3xl">⭐</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Community Reviewer</h4>
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isReviewerBadgeUnlocked ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                        }`}>
                          {isReviewerBadgeUnlocked ? '✓ ปลดล็อกแล้ว' : '🔒 ล็อกอยู่ (เขียนรีวิว)'}
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border text-center space-y-2 relative shadow-xs ${
                        isVipBadgeUnlocked
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 ring-2 ring-amber-400/20'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}>
                        <span className="text-3xl">👑</span>
                        <h4 className="font-extrabold text-xs text-slate-800">VIP Collector</h4>
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isVipBadgeUnlocked ? 'text-amber-800 bg-amber-100' : 'text-slate-500 bg-slate-100'
                        }`}>
                          {isVipBadgeUnlocked ? '✓ ปลดล็อกแล้ว' : '🔒 ล็อกอยู่ (แลกของรางวัล)'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Active Quests (With Create Custom Quest Button) */}
                  <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                          <Zap className="w-6 h-6 text-[#F26430]" />
                          <span>ชาเลนจ์ที่คุณกำลังทำอยู่ ({myChallenges.length} รายการ)</span>
                        </h2>
                        <p className="text-xs text-[#64748B] font-medium mt-0.5">
                          ทำภารกิจให้ครบเพื่อปลดล็อก Badge และรับแต้ม XP สะสม
                        </p>
                      </div>

                      <button
                        onClick={() => setIsCreateChallengeModalOpen(true)}
                        className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>➕ สร้างชาเลนจ์ของคุณเอง</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {myChallenges.map((quest, idx) => (
                        <div
                          key={quest.id}
                          className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-[280px]">
                            <span className="text-base font-bold text-[#94A3B8] w-5 text-center shrink-0">
                              {idx + 1}
                            </span>

                            <div className="w-11 h-11 bg-[#FAF7F2] border border-[#E2DCD2] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                              {getIcon(quest.iconName)}
                            </div>

                            <div>
                              <h4 className="font-bold text-base text-[#1E293B]">
                                {quest.title}
                              </h4>
                              <span className="text-xs text-[#F26430] font-semibold">
                                🏅 {quest.badgeLabel}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="flex-1 max-w-md space-y-1.5">
                            <div className="flex justify-between text-xs text-[#64748B]">
                              <span>ความคืบหน้า</span>
                              <span className="font-bold text-[#1E293B]">
                                {quest.completedCountInfo} ({quest.progressPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#E8E2D8] h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#4A7C59] h-full rounded-full transition-all duration-500"
                                style={{ width: `${quest.progressPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end">
                            <span className="bg-[#EBF3ED] text-[#4A7C59] px-3 py-1 rounded-full text-xs font-bold border border-[#4A7C59]/20">
                              กำลังทำอยู่ 🏃
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recommended Quests (Featuring Official Hub Quests) */}
                  <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-amber-500" />
                          <span>ชาเลนจ์แนะนำ & ภารกิจ Official ประจำสัปดาห์</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                          เลือกทำภารกิจเพื่อเริ่มสะสมแต้มและเหรียญรางวัลพิเศษ
                        </p>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {[
                          { id: 'all', label: 'ทั้งหมด' },
                          { id: 'move', label: '🏃 ขยับกาย' },
                          { id: 'heal', label: '🌿 ฮีลใจ' },
                          { id: 'chill', label: '☕ ชิลล์' },
                          { id: 'learn', label: '🎨 สร้างสรรค์' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id as any)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              selectedCategory === cat.id
                                ? 'bg-[#1E293B] text-white shadow-xs'
                                : 'bg-white text-[#475569] border border-[#E8E2D8] hover:bg-slate-100'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRecommended.map((rec) => (
                        <div
                          key={rec.id}
                          className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                            rec.isOfficial
                              ? 'border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20'
                              : 'border-[#E8E2D8]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                                rec.isOfficial
                                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                                  : 'bg-amber-50 border-amber-200'
                              }`}>
                                {getIcon(rec.iconName)}
                              </div>
                              <div className="space-y-1">
                                {rec.isOfficial && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    <span>Chill & Connect Official</span>
                                  </span>
                                )}
                                <h4 className="font-extrabold text-sm sm:text-base text-[#1E293B]">{rec.title}</h4>
                                <p className="text-xs text-[#64748B]">{rec.targetGoal}</p>
                              </div>
                            </div>

                            <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-full shrink-0 border border-amber-300 shadow-2xs">
                              +{rec.rewardPoints} XP
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">
                              👥 มีผู้เข้าร่วมแล้ว {rec.participantsCount} คน
                            </span>
                            <button
                              onClick={() => handleJoinRecommended(rec)}
                              className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>รับชาเลนจ์</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              )}

              {/* VIEW 3: 🎁 ร้านค้าแลกของรางวัล (XP Reward Store) */}
              {activeSubTab === 'rewards' && (
                <section className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-[#F26430]" />
                        <span>ร้านค้าแลกของรางวัล (Rewards Store)</span>
                      </h2>
                      <p className="text-xs text-[#64748B] font-medium mt-0.5">
                        นำแต้ม XP จากการเข้าร่วมกิจกรรมและเขียนรีวิว มาแลกคูปองส่วนลดและของที่ระลึก
                      </p>
                    </div>

                    <div className="bg-[#FAF7F2] border border-[#E8E2D8] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>แต้มคงเหลือของคุณ: <strong className="text-[#F26430] text-sm">{userXp} XP</strong></span>
                    </div>
                  </div>

                  {/* Rewards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {REWARD_SHOP_ITEMS.map((item) => {
                      const isRedeemed = redeemedRewardIds.includes(item.id);
                      const canAfford = userXp >= item.costXp;

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-5"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-4xl">{item.icon}</span>
                              <span className="text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                {item.costXp} XP
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-extrabold text-[#4A7C59] uppercase tracking-wider">
                                {item.category}
                              </span>
                              <h3 className="font-extrabold text-base text-slate-800 mt-0.5">
                                {item.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <p className="text-[11px] text-slate-400 font-medium">
                              พาร์ทเนอร์: <strong>{item.partner}</strong>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            {isRedeemed ? (
                              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center space-y-1">
                                <span className="text-[10px] font-extrabold text-emerald-800">
                                  ✓ แลกสำเร็จแล้ว! รหัสคูปอง:
                                </span>
                                <p className="font-mono font-black text-xs text-emerald-700 bg-white py-1 px-2 rounded-lg border border-emerald-200">
                                  {item.voucherCode}
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRedeemReward(item)}
                                disabled={!canAfford}
                                className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  canAfford
                                    ? 'bg-[#F26430] hover:bg-[#E05320] text-white shadow-md active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>{canAfford ? `แลกของรางวัล (${item.costXp} XP)` : 'แต้ม XP ไม่พอ'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            </>
          )}

        </div>

      </main>

      {/* Interactive E-Ticket Modal */}
      <ETicketModal
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        event={selectedTicketEvent}
        ticketId={selectedTicketId}
        isCheckedIn={checkedInTicketIds.includes(selectedTicketId)}
        onCheckIn={handleCheckIn}
        onOpenChat={(ev) => handleOpenGroupChat(ev)}
        onOpenCancel={(ev, tId) => handleOpenCancelTicket(ev, tId)}
      />

      {/* Interactive Group Chat Modal */}
      <GroupChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        event={chatTargetEvent}
      />

      {/* Cancel Ticket Modal */}
      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        event={cancelTargetEvent}
        ticketId={cancelTargetTicketId}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Create Custom Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onCreateSuccess={handleCreateQuestSuccess}
      />

      {/* Mobile Nav */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          setIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          setIsLoggedIn(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Review Modal */}
      {reviewTargetEvent && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewTargetEvent(null);
          }}
          eventId={reviewTargetEvent.id}
          eventTitle={reviewTargetEvent.title}
          hostName={reviewTargetEvent.hostName}
          hostAvatar={reviewTargetEvent.hostAvatar}
          onSubmitSuccess={handleReviewSubmitSuccess}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setJoinedEvents((prev) => [newEvent, ...prev]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
