'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { VerifyQuestModal } from '@/components/VerifyQuestModal';
import { ETicketModal } from '@/components/ETicketModal';
import { CancelTicketModal } from '@/components/CancelTicketModal';
import { GroupChatModal } from '@/components/GroupChatModal';
import { TipHostModal } from '@/components/TipHostModal';
import { HostGuestScannerModal } from '@/components/HostGuestScannerModal';
import { MOCK_CHALLENGES, MOCK_EVENTS, ChallengeQuest, EventItem } from '@/data/mockData';
import {
  Award,
  Coffee,
  Footprints,
  Users,
  User,
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
  Wallet,
  DollarSign,
  Heart,
  TrendingUp,
  UserCheck,
  Bot,
  SlidersHorizontal,
  CreditCard,
  Building,
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
  const [activeSubTab, setActiveSubTab] = useState<'joined_events' | 'host_studio' | 'quests' | 'rewards'>('joined_events');
  
  // Quick Persona / Role Switcher (Member vs Host)
  const [currentRole, setCurrentRole] = useState<'member' | 'host'>('member');

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

  // Host Revenue & Wallet State
  const [hostTicketRevenue, setHostTicketRevenue] = useState<number>(4350);
  const [hostTipsRevenue, setHostTipsRevenue] = useState<number>(520);
  const [isHostBountyClaimed, setIsHostBountyClaimed] = useState<boolean>(false);

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
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Tip Host & Review Modal State
  const [isTipHostModalOpen, setIsTipHostModalOpen] = useState<boolean>(false);
  const [tipTargetEvent, setTipTargetEvent] = useState<EventItem | null>(null);
  const [reviewedEventIds, setReviewedEventIds] = useState<string[]>(['1']);

  // Host Door Scanner Modal State
  const [isHostScannerOpen, setIsHostScannerOpen] = useState<boolean>(false);
  const [scannerTargetEvent, setScannerTargetEvent] = useState<EventItem | null>(null);

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

  // Mock events hosted by current user (Host view)
  const [myHostedEvents, setMyHostedEvents] = useState<EventItem[]>([
    {
      id: 'host-event-1',
      title: '🎲 Board Game Night & Specialty Drip Coffee (นัดเล่นบอร์ดเกม & กาแฟดริป)',
      category: 'chill',
      tag: 'บอร์ดเกม',
      date: 'เสาร์ 23 ส.ค. 2026',
      time: '14:00 - 18:00 น.',
      location: 'Siam Board Game Lounge, ปทุมวัน',
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
      price: '฿250',
      description: 'นัดเล่นบอร์ดเกมสนุกๆ ผ่อนคลายพร้อมชิมกาแฟดริป',
      hostName: 'คุณ (Superhost)',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 8,
      maxParticipants: 10,
      createdAtTimestamp: Date.now(),
    },
    {
      id: 'host-event-2',
      title: '🧘 Sunset Yoga & Sound Bath in the Park (โยคะยามเย็น สวนลุมพินี)',
      category: 'heal',
      tag: 'โยคะฮีลใจ',
      date: 'อาทิตย์ 24 ส.ค. 2026',
      time: '17:00 - 18:30 น.',
      location: 'ศาลาแปดเหลี่ยม สวนลุมพินี',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      price: '฿150',
      description: 'โยคะผ่อนคลายกล้ามเนื้อยามเย็นรับลมสบายๆ',
      hostName: 'คุณ (Superhost)',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 10,
      maxParticipants: 10,
      createdAtTimestamp: Date.now(),
    },
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

  // Selected quest for join confirmation modal
  const [selectedQuestForJoinModal, setSelectedQuestForJoinModal] = useState<ChallengeQuest | null>(null);

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

    const targetQuest: ChallengeQuest = {
      id: `quest-${Date.now()}`,
      title: recItem.title,
      badgeLabel: recItem.badgeLabel,
      iconName: recItem.iconName,
      current: '0',
      total: '3',
      completedCountInfo: '0/3 ครั้ง',
      progressPercent: 0,
      category: recItem.category,
      participantsCount: recItem.participantsCount,
      rewardPoints: recItem.rewardPoints,
      targetGoal: recItem.targetGoal,
      isOfficial: recItem.isOfficial,
    };

    setSelectedQuestForJoinModal(targetQuest);
  };

  // Quest Verification Modal State
  const [selectedQuestForVerifyModal, setSelectedQuestForVerifyModal] = useState<ChallengeQuest | null>(null);

  const handleConfirmJoinQuest = (quest: ChallengeQuest) => {
    setMyChallenges([quest, ...myChallenges]);
    setUserXp((prev) => prev + 15);
    showToast(`🎉 รับภารกิจ "${quest.title}" สำเร็จ! เริ่มต้นสะสมความคืบหน้าได้เลย 🔥`);
  };

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

  // Open Tip Host Modal
  const handleOpenTipHostModal = (event: EventItem) => {
    setTipTargetEvent(event);
    setIsTipHostModalOpen(true);
  };

  // Handle Tip Submit
  const handleTipSubmit = (rating: number, reviewText: string, tipAmount: number) => {
    if (tipTargetEvent) {
      setReviewedEventIds((prev) => [...prev, tipTargetEvent.id]);
      setUserXp((prev) => prev + 50);
      setIsReviewerBadgeUnlocked(true);

      if (tipAmount > 0) {
        setHostTipsRevenue((prev) => prev + tipAmount);
        showToast(`💖 ส่งรีวิว ${rating} ดาว และมอบทิป ฿${tipAmount} ให้โฮสต์ ${tipTargetEvent.hostName} เรียบร้อย! (+50 XP)`);
      } else {
        showToast(`⭐ ส่งรีวิว ${rating} ดาวสำเร็จ! ได้รับ +50 XP สะสม`);
      }
    }
  };

  // Claim Host Bounty
  const handleClaimHostBounty = () => {
    if (!isHostBountyClaimed) {
      setIsHostBountyClaimed(true);
      setHostTicketRevenue((prev) => prev + 500);
      showToast('🎉 ยินดีด้วย! รับเงินสนับสนุนโฮสต์ ฿500 เข้ากระเป๋าเรียบร้อยแล้ว');
    }
  };

  // Simulate Withdrawal
  const handleWithdrawEarnings = () => {
    const total = hostTicketRevenue + hostTipsRevenue;
    if (total <= 0) {
      showToast('ไม่มียอดเงินคงเหลือสำหรับถอน');
      return;
    }
    showToast(`💳 โอนเงินรายได้ ฿${total.toLocaleString()} เข้าบัญชีธนาคารพร้อมเพย์ของคุณเรียบร้อย!`);
    setHostTicketRevenue(0);
    setHostTipsRevenue(0);
  };

  // Open Door Scanner
  const handleOpenDoorScanner = (event: EventItem) => {
    setScannerTargetEvent(event);
    setIsHostScannerOpen(true);
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

  const handleCreateQuestSuccess = (newQuest: ChallengeQuest) => {
    setMyChallenges([newQuest, ...myChallenges]);
    setUserXp((prev) => prev + 25);
    showToast(`🎉 สร้างชาเลนจ์ "${newQuest.title}" สำเร็จ! ได้รับ +25 XP ลุยให้สำเร็จเลย!`);
  };

  const filteredRecommended = selectedCategory === 'all'
    ? RECOMMENDED_CHALLENGES
    : RECOMMENDED_CHALLENGES.filter((item) => item.category === selectedCategory);

  // Switch role handler (Member vs Host)
  const handleSelectRole = (role: 'member' | 'host') => {
    setCurrentRole(role);
    if (role === 'host') {
      setActiveSubTab('host_studio');
      showToast('👑 สลับเป็นมุมมอง "โฮสต์ / ครีเอเตอร์ผู้จัดกิจกรรม"');
    } else {
      setActiveSubTab('joined_events');
      showToast('👤 สลับเป็นมุมมอง "สมาชิกทั่วไป"');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
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
        
        {/* Slim Header Banner + Interactive Role Switcher */}
        <section className="bg-[#1E293B] text-white py-4 sm:py-5 border-b border-slate-700/60">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left: Title & Subtitle */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                    {currentRole === 'host' ? '👑 สตูดิโอโฮสต์สร้างรายได้ (Creator & Host Hub)' : 'กิจกรรมที่เข้าร่วม & ตั๋ว E-Ticket'}
                  </h1>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    currentRole === 'host'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {currentRole === 'host' ? '👑 Host Mode' : '👤 Member Mode'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed max-w-2xl">
                  {currentRole === 'host'
                    ? 'จัดการกิจกรรมของคุณ ตรวจตั๋วหน้างาน รับเงินค่าตั๋วและทิป พร้อมปลดล็อกภารกิจเงินสนับสนุนจากระบบ'
                    : 'เปลี่ยนวันว่างให้มีความหมาย ออกมาแชร์รอยยิ้มกับสังคมที่เป็นมิตร ไม่ต้องกลัวเหงาแม้มาคนเดียว พร้อมรับสิทธิ์และของขวัญ'}
                </p>
              </div>

              {/* Right: Quick Role Switcher Bar (Member vs Host) */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-700/90 rounded-2xl shrink-0">
                <span className="text-[10px] font-bold text-slate-400 px-2 hidden sm:inline">สลับบทบาท:</span>
                
                <button
                  onClick={() => handleSelectRole('member')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentRole === 'member'
                      ? 'bg-[#4A7C59] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>สมาชิกทั่วไป</span>
                </button>

                <button
                  onClick={() => handleSelectRole('host')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentRole === 'host'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>โฮสต์ผู้จัด</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
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
                  เข้าสู่ระบบเพื่อจัดการตั๋ว E-Ticket QR Code ดูแชตกลุ่ม และสร้างรายได้จากการเป็นโฮสต์
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#4A7C59]/30 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <KeyRound className="w-5 h-5" />
                  <span>เข้าสู่ระบบทันที ➔</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged-In User Dashboard */
            <>
              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3 overflow-x-auto no-scrollbar">
                
                {/* 1. Attendee Sub-Tab */}
                <button
                  onClick={() => setActiveSubTab('joined_events')}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'joined_events'
                      ? 'bg-[#4A7C59] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>ตั๋วของฉัน ({joinedEvents.length})</span>
                </button>

                {/* 2. Host Studio Sub-Tab (Visible ONLY when currentRole === 'host') */}
                {currentRole === 'host' && (
                  <button
                    onClick={() => setActiveSubTab('host_studio')}
                    className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      activeSubTab === 'host_studio'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                        : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>สตูดิโอโฮสต์สร้างรายได้</span>
                  </button>
                )}

                {/* 3. Quests Sub-Tab */}
                <button
                  onClick={() => setActiveSubTab('quests')}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'quests'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>ชาเลนจ์ & Badges</span>
                </button>

                {/* 4. Rewards Store Sub-Tab */}
                <button
                  onClick={() => setActiveSubTab('rewards')}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeSubTab === 'rewards'
                      ? 'bg-[#F26430] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Gift className="w-4 h-4 text-white" />
                  <span>ร้านค้าแลกรางวัล ({userXp} XP)</span>
                </button>
              </div>

              {/* ========================================================================= */}
              {/* TAB 1: ตั๋วของฉัน & ผู้เข้าร่วม (Attendee Journey) */}
              {/* ========================================================================= */}
              {activeSubTab === 'joined_events' && (
                <section className="space-y-6 animate-fade-in">
                  
                  {/* Active Streak Tracker Banner */}
                  <div className="bg-gradient-to-r from-[#1E293B] to-slate-800 text-white rounded-3xl p-5 border border-slate-700/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 text-center sm:text-left">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-[#F26430] flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                        🔥
                      </div>
                      <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <h3 className="font-black text-base text-white">
                            Active Lifestyle Streak: 3 สัปดาห์ต่อเนื่อง!
                          </h3>
                          <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full">
                            XP Boost x2
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          คุณออกมาร่วมกิจกรรมสม่ำเสมอ รับโบนัสแต้ม XP คูณสองเมื่อเช็คอินสัปดาห์นี้
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-2 rounded-2xl border border-slate-700 text-xs text-white shrink-0 font-bold">
                      <span>🟢 สัปดาห์ 1</span>
                      <span className="text-slate-500">➔</span>
                      <span>🟢 สัปดาห์ 2</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-amber-400">🔥 สัปดาห์ 3 (Active)</span>
                    </div>
                  </div>

                  {/* Header & Sub-filter Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#4A7C59]" />
                        <span>ตั๋วกิจกรรมของคุณ</span>
                      </h2>
                      <p className="text-xs text-[#64748B] font-medium mt-0.5">
                        ดูตั๋ว QR Code แชตกลุ่มเพื่อนร่วมงาน หรือเขียนรีวิวพร้อมให้ทิปโฮสต์
                      </p>
                    </div>

                    {/* Upcoming vs Past Toggle */}
                    <div className="flex items-center p-1 bg-white border border-[#E8E2D8] rounded-2xl shadow-2xs shrink-0">
                      <button
                        onClick={() => setEventViewMode('upcoming')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          eventViewMode === 'upcoming'
                            ? 'bg-[#4A7C59] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>ตั๋วที่กำลังจะถึง ({joinedEvents.length})</span>
                      </button>
                      <button
                        onClick={() => setEventViewMode('past')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          eventViewMode === 'past'
                            ? 'bg-[#F26430] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>ประวัติ & ทิปโฮสต์ ({pastEvents.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. UPCOMING EVENTS */}
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

                              {/* Right: Actions (Mobile Responsive Stack: Prominent Full-Width Ticket Button + Balanced Sub-Row) */}
                              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                <button
                                  onClick={() => handleOpenTicket(event, idx)}
                                  className="w-full sm:w-auto bg-gradient-to-r from-[#1E293B] to-slate-800 hover:from-black hover:to-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                                >
                                  <QrCode className="w-4 h-4 text-emerald-400" />
                                  <span>ดูตั๋ว E-Ticket (QR Code)</span>
                                </button>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleOpenGroupChat(event)}
                                    className="flex-1 sm:flex-none bg-[#EBF3ED] hover:bg-[#D6E8DC] text-[#4A7C59] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>แชตกลุ่ม</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenCancelTicket(event, ticketId)}
                                    className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
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

                  {/* 2. PAST EVENTS (With Tip Host & Review Button) */}
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
                                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    👑 โฮสต์ยอดเยี่ยม
                                  </span>
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

                            {/* Tip Host & Review Action */}
                            <div className="flex items-center justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                              {isReviewed ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>รีวิวและส่งกำลังใจให้โฮสต์แล้ว (รับ +50 XP) ⭐</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenTipHostModal(event)}
                                  className="w-full sm:w-auto bg-gradient-to-r from-[#F26430] to-orange-500 hover:from-[#E05320] hover:to-orange-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                  <Heart className="w-4 h-4 fill-white" />
                                  <span>ให้คะแนน & ทิปโฮสต์ (+50 XP)</span>
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

              {/* ========================================================================= */}
              {/* TAB 2: 👑 สตูดิโอโฮสต์สร้างรายได้ (Host & Creator Studio) */}
              {/* ========================================================================= */}
              {activeSubTab === 'host_studio' && (
                <section className="space-y-6 animate-fade-in">
                  
                  {/* Host Wallet & Revenue Overview Card */}
                  <div className="bg-gradient-to-br from-[#1E293B] via-slate-900 to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
                          👑
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-extrabold text-xl sm:text-2xl text-white">
                              กระเป๋าเงินโฮสต์ (Creator Wallet)
                            </h2>
                            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                              ⭐ Superhost Gold
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            รายได้จากการขายตั๋วกิจกรรม และเงินทิปสนับสนุนจากผู้เข้าร่วม
                          </p>
                        </div>
                      </div>

                      {/* Withdraw Button */}
                      <button
                        onClick={handleWithdrawEarnings}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>ถอนเงินเข้าบัญชี (Withdraw)</span>
                      </button>
                    </div>

                    {/* Financial Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">รายได้รวมสุทธิ</span>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                          ฿{(hostTicketRevenue + hostTipsRevenue).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold block">พร้อมโอนเข้าบัญชีทันที</span>
                      </div>

                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">ยอดขายตั๋วกิจกรรม</span>
                        <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                          ฿{hostTicketRevenue.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block">จาก 18 ที่นั่งที่ขายได้</span>
                      </div>

                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">เงินทิปจากสมาชิก (Tips)</span>
                        <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">
                          ฿{hostTipsRevenue.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-rose-300 block">💖 12 คนให้กำลังใจ</span>
                      </div>

                      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">คะแนนรีวิวโฮสต์</span>
                        <div className="text-xl sm:text-2xl font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Star className="w-5 h-5 fill-amber-300" />
                          <span>4.95 / 5.0</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">จาก 48 รีวิวผู้ร่วมงานจริง</span>
                      </div>
                    </div>
                  </div>

                  {/* Host Bounties & Subsidy Campaign (Platform Grants) */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                          <Gift className="w-5 h-5 text-[#F26430]" />
                          <span>ภารกิจสนับสนุนเงินโฮสต์ (Host Bounties & Grants)</span>
                        </h3>
                        <p className="text-xs text-[#64748B]">
                          งบประมาณอุดหนุนจาก Chill & Connect Hub เพื่อช่วยค่าสถานที่และอุปกรณ์ให้ผู้จัด
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        แคมเปญเดือนนี้
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bounty 1: Host 3 Meetups */}
                      <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/50 to-orange-50/50 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                              💰 งบสนับสนุน ฿500
                            </span>
                            <span className="text-xs font-bold text-emerald-700">ความคืบหน้า: 2/2 ครั้ง (ครบแล้ว!)</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800">
                            จัดกิจกรรมชุมชนครบ 2 ครั้งในเดือนนี้
                          </h4>
                          <p className="text-xs text-slate-500">
                            ช่วยอุดหนุนค่าสถานที่ ค่าสนาม หรือค่ากาแฟต้อนรับลูกตี้
                          </p>
                        </div>

                        <div>
                          {isHostBountyClaimed ? (
                            <div className="w-full bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl text-center border border-emerald-200">
                              ✓ รับเงินสนับสนุน ฿500 เรียบร้อยแล้ว
                            </div>
                          ) : (
                            <button
                              onClick={handleClaimHostBounty}
                              className="w-full bg-gradient-to-r from-amber-500 to-[#F26430] hover:from-amber-600 hover:to-[#E05320] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Gift className="w-4 h-4" />
                              <span>กดรับเงินสนับสนุน ฿500 เข้ากระเป๋า</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bounty 2: 5-Star Reviews */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                              ⭐ สิทธิพิเศษ Superhost
                            </span>
                            <span className="text-xs font-bold text-slate-500">48/10 รีวิว (สำเร็จแล้ว)</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800">
                            ได้รับรีวิว 5 ดาวครบ 10 คนขึ้นไป
                          </h4>
                          <p className="text-xs text-slate-500">
                            ปลดล็อกเหรียญตรา Superhost และได้รับการปักหมุดโปรโมทหน้าแรกฟรี
                          </p>
                        </div>

                        <div className="w-full bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl text-center">
                          ✓ ปลดล็อกสิทธิพิเศษ Superhost แล้ว
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Hosted Events List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-lg text-[#1E293B] flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#4A7C59]" />
                          <span>กิจกรรมที่คุณเป็นผู้จัด ({myHostedEvents.length} รายการ)</span>
                        </h3>
                        <p className="text-xs text-[#64748B]">
                          สแกนตรวจตั๋วผู้เข้าร่วมหน้างาน หรือส่งข้อความแจ้งเตือนลูกตี้
                        </p>
                      </div>

                      <button
                        onClick={() => setIsCreateEventModalOpen(true)}
                        className="bg-[#4A7C59] hover:bg-[#3B6347] text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>สร้างกิจกรรมใหม่</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myHostedEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="flex gap-4">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-24 h-24 rounded-2xl object-cover shrink-0"
                            />
                            <div className="space-y-1 min-w-0">
                              <span className="text-[10px] font-black text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-md">
                                #{event.tag}
                              </span>
                              <h4 className="font-extrabold text-sm text-[#1E293B] line-clamp-2">
                                {event.title}
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#4A7C59]" />
                                <span>{event.date}</span>
                              </p>
                            </div>
                          </div>

                          {/* Attendance & Revenue Mini Strip */}
                          <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] flex items-center justify-between text-xs font-bold">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-normal">ยอดลงทะเบียน</span>
                              <span className="text-slate-800 font-extrabold">{event.participantsCount}/{event.maxParticipants} คน</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-normal">ราคาตั๋ว</span>
                              <span className="text-[#F26430] font-extrabold">{event.price}/คน</span>
                            </div>
                          </div>

                          {/* Host Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleOpenDoorScanner(event)}
                              className="flex-1 bg-[#1E293B] hover:bg-black text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ตรวจตั๋วหน้างาน</span>
                            </button>

                            <button
                              onClick={() => handleOpenGroupChat(event)}
                              className="bg-[#EBF3ED] hover:bg-[#D6E8DC] text-[#4A7C59] font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="เปิดแชตกลุ่มลูกตี้"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>แชต</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </section>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: ชาเลนจ์ & เหรียญสะสม (Gamification Quests & Badges) */}
              {/* ========================================================================= */}
              {activeSubTab === 'quests' && (
                <div className="space-y-10 animate-fade-in">
                  
                  {/* Badges Collection Showcase */}
                  <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <span>คลังเหรียญเกียรติยศ Badges ของคุณ</span>
                        </h2>
                        <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                          ปลดล็อกเหรียญจากการเข้าร่วมกิจกรรม เช็คอินหน้างาน เขียนรีวิว และแลกของรางวัล
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        ปลดล็อกแล้ว {3 + (isReviewerBadgeUnlocked ? 1 : 0) + (isVipBadgeUnlocked ? 1 : 0)}/8 เหรียญ
                      </span>
                    </div>

                    {/* Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                      <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-amber-300 text-center space-y-1.5 relative shadow-xs">
                        <span className="text-2xl">🏃</span>
                        <h4 className="font-extrabold text-xs text-slate-800">HYROX Runner</h4>
                        <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-amber-300 text-center space-y-1.5 relative shadow-xs">
                        <span className="text-2xl">🧘</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Zen Master</h4>
                        <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-amber-300 text-center space-y-1.5 relative shadow-xs">
                        <span className="text-2xl">☕</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Coffee Explorer</h4>
                        <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full inline-block">
                          ✓ ปลดล็อกแล้ว
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border text-center space-y-1.5 relative shadow-xs ${
                        isReviewerBadgeUnlocked
                          ? 'bg-[#FAF7F2] border-amber-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}>
                        <span className="text-2xl">⭐</span>
                        <h4 className="font-extrabold text-xs text-slate-800">Community Reviewer</h4>
                        <p className={`text-[9px] font-bold px-2 py-0.2 rounded-full inline-block ${
                          isReviewerBadgeUnlocked ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                        }`}>
                          {isReviewerBadgeUnlocked ? '✓ ปลดล็อกแล้ว' : '🔒 ล็อกอยู่'}
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border text-center space-y-1.5 relative shadow-xs ${
                        isVipBadgeUnlocked
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 ring-2 ring-amber-400/20'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}>
                        <span className="text-2xl">👑</span>
                        <h4 className="font-extrabold text-xs text-slate-800">VIP Collector</h4>
                        <p className={`text-[9px] font-bold px-2 py-0.2 rounded-full inline-block ${
                          isVipBadgeUnlocked ? 'text-amber-800 bg-amber-100' : 'text-slate-500 bg-slate-100'
                        }`}>
                          {isVipBadgeUnlocked ? '✓ ปลดล็อกแล้ว' : '🔒 ล็อกอยู่'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Active Quests */}
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#F26430]" />
                          <span>ชาเลนจ์ที่คุณกำลังทำอยู่ ({myChallenges.length} รายการ)</span>
                        </h2>
                      </div>

                      <button
                        onClick={() => setIsCreateChallengeModalOpen(true)}
                        className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>สร้างชาเลนจ์ของคุณเอง</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {myChallenges.map((quest, idx) => (
                        <div
                          key={quest.id}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                        >
                          {/* Left Column: Index, Icon, Title & Badge (Fixed 5 columns on desktop) */}
                          <div className="md:col-span-5 flex items-center gap-3.5 min-w-0">
                            <span className="text-sm font-bold text-[#94A3B8] w-5 text-center shrink-0">
                              {idx + 1}
                            </span>

                            <div className="w-10 h-10 bg-[#FAF7F2] border border-[#E2DCD2] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                              {getIcon(quest.iconName)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm sm:text-base text-[#1E293B] truncate" title={quest.title}>
                                {quest.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-[#F26430] font-semibold mt-0.5">
                                <Award className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{quest.badgeLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Center Column: Progress Bar (Fixed 4 columns on desktop - 100% Perfectly Aligned) */}
                          <div className="md:col-span-4 space-y-1.5 min-w-0">
                            <div className="flex justify-between text-xs text-[#64748B]">
                              <span className="font-medium">ความคืบหน้า</span>
                              <span className="font-bold text-[#1E293B]">
                                {quest.completedCountInfo} ({quest.progressPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#4A7C59] h-full rounded-full transition-all duration-500"
                                style={{ width: `${quest.progressPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Right Column: Verify Proof & Check-in Action Button (Fixed 3 columns on desktop) */}
                          <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-2 shrink-0">
                            {quest.progressPercent >= 100 ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>สำเร็จแล้ว 🏆</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedQuestForVerifyModal(quest)}
                                className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-[#4A7C59] hover:from-emerald-500 hover:to-[#3B6347] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                title="ส่งภาพถ่าย หรือเช็คอินพิกัด GPS เพื่อยืนยันความคืบหน้า"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>ส่งหลักฐานยืนยัน</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recommended & Official Quests */}
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          <span>ชาเลนจ์แนะนำ & ภารกิจ Official ประจำสัปดาห์</span>
                        </h2>
                      </div>

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

              {/* ========================================================================= */}
              {/* TAB 4: 🎁 ร้านค้าแลกของรางวัล & พาร์ทเนอร์ (Rewards Store) */}
              {/* ========================================================================= */}
              {activeSubTab === 'rewards' && (
                <section className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#F26430]" />
                        <span>ร้านค้าแลกของรางวัล & คูปองพาร์ทเนอร์</span>
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

      {/* Tip Host Modal */}
      <TipHostModal
        isOpen={isTipHostModalOpen}
        onClose={() => setIsTipHostModalOpen(false)}
        event={tipTargetEvent}
        onTipSubmit={handleTipSubmit}
      />

      {/* Host Guest Door Scanner Modal */}
      <HostGuestScannerModal
        isOpen={isHostScannerOpen}
        onClose={() => setIsHostScannerOpen(false)}
        event={scannerTargetEvent}
      />

      {/* Create Custom Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onCreateSuccess={handleCreateQuestSuccess}
      />

      {/* Join Challenge Confirmation Modal */}
      <JoinChallengeModal
        isOpen={Boolean(selectedQuestForJoinModal)}
        onClose={() => setSelectedQuestForJoinModal(null)}
        quest={selectedQuestForJoinModal}
        onConfirmJoin={handleConfirmJoinQuest}
      />

      {/* Verify Quest Proof Modal */}
      <VerifyQuestModal
        isOpen={Boolean(selectedQuestForVerifyModal)}
        onClose={() => setSelectedQuestForVerifyModal(null)}
        quest={selectedQuestForVerifyModal}
        onVerificationSuccess={handleVerifySuccess}
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

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setMyHostedEvents((prev) => [newEvent, ...prev]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" ในฐานะโฮสต์สำเร็จเรียบร้อย! 🎉`);
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
