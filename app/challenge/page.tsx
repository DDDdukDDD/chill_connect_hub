'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
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
  Star
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
}

const RECOMMENDED_CHALLENGES: RecommendedChallenge[] = [
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

export default function ChallengePage() {
  const [activeNavTab, setActiveNavTab] = useState('challenge');
  const [activeSubTab, setActiveSubTab] = useState<'joined_events' | 'quests'>('joined_events');
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

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
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
    setTimeout(() => setToastMessage(null), 3000);
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
      id: `joined-${Date.now()}`,
      title: recItem.title,
      iconName: recItem.iconName,
      progressPercent: 10,
      current: '1',
      total: recItem.targetGoal.match(/\d+/)?.[0] || '5',
      badgeLabel: recItem.badgeLabel,
      completedCountInfo: `ทำสำเร็จแล้ว 1/${recItem.targetGoal.match(/\d+/)?.[0] || '5'}`,
    };

    setMyChallenges([newQuest, ...myChallenges]);
    showToast(`เข้าร่วมชาเลนจ์ "${recItem.title}" เรียบร้อยแล้ว! 🎯`);
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

  const filteredRecommended = selectedCategory === 'all'
    ? RECOMMENDED_CHALLENGES
    : RECOMMENDED_CHALLENGES.filter((item) => item.category === selectedCategory);

  // Schema.org Structured Data for Personal Activities Hub
  const challengeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'กิจกรรมที่เข้าร่วม & ชาเลนจ์สะสมเหรียญรางวัล | Chill & Connect Hub',
    description: 'จัดการตั๋วกิจกรรมยามว่างที่คุณลงทะเบียนไว้ พร้อมสะสมเหรียญรางวัล Badges และภารกิจฮีลใจ',
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
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Dedicated Hero Header Banner */}
        <section className="bg-[#1E293B] text-white py-10 sm:py-14 relative overflow-hidden border-b border-slate-700/60">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-500/30">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personal Activities & Rewards Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                กิจกรรมที่เข้าร่วม & ชาเลนจ์
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                จัดการตั๋วกิจกรรมยามว่างที่คุณลงทะเบียนไว้ พร้อมสะสมเหรียญรางวัล Badges และภารกิจฮีลใจ
              </p>
            </div>

            {/* User Stats Card */}
            {isLoggedIn && (
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 shrink-0 space-y-2 text-center md:text-right">
                <p className="text-xs text-slate-400">สถานะกิจกรรมส่วนบุคคล</p>
                <div className="flex items-center justify-center md:justify-end gap-3 text-white font-bold text-sm">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Ticket className="w-4 h-4" />
                    <span>{joinedEvents.length} กิจกรรม</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Trophy className="w-4 h-4" />
                    <span>4 Badges</span>
                  </span>
                </div>
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
                  🔒 เข้าสู่ระบบเพื่อดูกิจกรรมของคุณ
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto leading-relaxed">
                  เข้าสู่ระบบเพื่อจัดการตั๋วกิจกรรมที่เข้าร่วม ดูแชตกลุ่มเพื่อนๆ และสะสมความสำเร็จ Badges เกียรติยศ
                </p>
              </div>

              {/* Benefits Preview List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2 pb-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🎟️</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">จัดการตั๋วกิจกรรม</h4>
                  <p className="text-[11px] text-[#64748B]">ดูวันเวลา สถานที่ และ QR Code ตั๋ว</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">💬</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">แชตกลุ่มเพื่อนร่วมงาน</h4>
                  <p className="text-[11px] text-[#64748B]">นัดแนะจุดนัดพบกับเพื่อนในกลุ่ม</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🏆</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">สะสม Badges</h4>
                  <p className="text-[11px] text-[#64748B]">ปลดล็อกตราเกียรติยศภารกิจยามว่าง</p>
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
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-4">
                <button
                  onClick={() => setActiveSubTab('joined_events')}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                    activeSubTab === 'joined_events'
                      ? 'bg-[#4A7C59] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>กิจกรรมที่เข้าร่วม ({joinedEvents.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('quests')}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                    activeSubTab === 'quests'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'bg-white text-[#475569] hover:bg-slate-100 border border-[#E8E2D8]'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>ชาเลนจ์ & เหรียญสะสม ({myChallenges.length})</span>
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
                        <span>กิจกรรมของคุณ</span>
                      </h2>
                      <p className="text-xs text-[#64748B] font-medium mt-0.5">
                        ตรวจสอบกำหนดการ ตั๋วเข้างาน และรีวิวให้คะแนนความประทับใจหลังจบกิจกรรม
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
                        🎟️ กำลังจะถึง ({joinedEvents.length})
                      </button>
                      <button
                        onClick={() => setEventViewMode('past')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventViewMode === 'past'
                            ? 'bg-[#F26430] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⭐ กิจกรรมที่ผ่านมา & รีวิว ({pastEvents.length})
                      </button>
                    </div>
                  </div>

                  {/* 1. UPCOMING EVENTS */}
                  {eventViewMode === 'upcoming' && (
                    <div className="space-y-4">
                      {joinedEvents.map((event, idx) => (
                        <div
                          key={event.id}
                          className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#4A7C59] ring-2 ring-[#4A7C59]/10 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                        >
                          {/* Left: Event Thumbnail & Details */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            <div className="relative aspect-video sm:aspect-square w-full sm:w-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 bg-[#4A7C59] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                                🟢 ยืนยันแล้ว
                              </span>
                            </div>

                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-0.5 rounded-full border border-[#4A7C59]/20">
                                  #{event.tag}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  Ticket #CCH-2026{idx + 1}
                                </span>
                              </div>

                              <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B] hover:text-[#4A7C59] transition-colors">
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

                          {/* Right: Actions (View Ticket, Group Chat) */}
                          <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <button
                              onClick={() => showToast(`เปิดแชตกลุ่ม "${event.title}" สำเร็จ 💬`)}
                              className="flex-1 sm:flex-none bg-[#EBF3ED] hover:bg-[#D6E8DC] text-[#4A7C59] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>แชตกลุ่มกิจกรรม</span>
                            </button>

                            <button
                              onClick={() => showToast(`ตั๋วกิจกรรม #CCH-2026${idx + 1} พร้อมใช้งาน ✔️`)}
                              className="flex-1 sm:flex-none bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Ticket className="w-4 h-4 text-emerald-400" />
                              <span>ดู E-Ticket QR</span>
                            </button>
                          </div>
                        </div>
                      ))}
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
                  
                  {/* Active Quests */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                        <Zap className="w-6 h-6 text-[#F26430]" />
                        <span>ชาเลนจ์ที่คุณกำลังทำอยู่ ({myChallenges.length} รายการ)</span>
                      </h2>
                      <span className="text-xs text-[#64748B] font-semibold">อัปเดตอัตโนมัติ</span>
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

                  {/* Recommended Quests */}
                  <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-amber-500" />
                          <span>ชาเลนจ์แนะนำประจำสัปดาห์</span>
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
                          className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                                {getIcon(rec.iconName)}
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-[#1E293B]">{rec.title}</h4>
                                <p className="text-xs text-[#64748B] mt-0.5">{rec.targetGoal}</p>
                              </div>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                              +{rec.rewardPoints} Pts
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

            </>
          )}

        </div>

      </main>

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
