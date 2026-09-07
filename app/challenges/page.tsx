'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  Users, 
  Target, 
  ArrowRight, 
  Crown, 
  Compass, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Zap, 
  MapPin, 
  Camera, 
  Ticket, 
  Filter,
  Medal,
  Clock,
  AlertCircle,
  X,
  ShieldCheck,
  Check,
  Sprout,
  ChevronDown,
  PlusCircle,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { BrandLogo } from '@/components/BrandLogo';
import { ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { getStoredUserXp } from '@/data/rewardsData';

// Extended Quest Interface with Date, Duration & Image
export interface QuestWithDuration extends ChallengeQuest {
  startDate: string;
  endDate: string;
  daysRemaining: number;
  image?: string;
}

// Extended Catalog of Official & Community Quests with rich gamification metadata
const ALL_QUESTS: QuestWithDuration[] = [
  ...COMMUNITY_PUBLIC_QUESTS.map((q) => ({
    ...q,
    startDate: (q as any).startDate || '1 มี.ค. 2026',
    endDate: (q as any).endDate || '31 มี.ค. 2026',
    daysRemaining: (q as any).daysRemaining !== undefined ? (q as any).daysRemaining : 10,
    image: q.image,
  })),
  {
    id: 'quest-off-3',
    title: 'Bookworm Expo 2026: ตะลุยงานสัปดาห์หนังสือแห่งชาติ',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    category: 'learn',
    badgeLabel: 'Master Reader',
    badgeIcon: '📚',
    completedCountInfo: '0/1 งาน',
    progressPercent: 0,
    current: '0',
    total: '1',
    visibility: 'public',
    creatorName: 'ทีมงาน Chill & Connect',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    participantsCount: 412,
    rewardPoints: 200,
    isOfficial: true,
    targetGoal: 'เข้าร่วมงานสัปดาห์หนังสือ ณ ศูนย์ฯ สิริกิติ์ และแบ่งปันหนังสือเล่มโปรดลงคอมมูนิตี้',
    objective: 'สนับสนุนวัฒนธรรมการอ่านหนังสือ พบปะนักเขียน และแลกเปลี่ยนมุมมองความคิดสร้างสรรค์กับเพื่อนหนอนหนังสือ',
    steps: [
      'เดินทางไปร่วมงานสัปดาห์หนังสือแห่งชาติ ณ ศูนย์การประชุมแห่งชาติสิริกิติ์',
      'ถ่ายภาพหนังสือเล่มโปรดที่คุณได้จากงาน แล้วโพสต์ลง Moments',
      'รับเหรียญ Master Reader ทันทีเมื่อโพสต์ได้รับการยืนยัน'
    ],
    verificationMethod: '📸 ถ่ายภาพหนังสือเล่มใหม่พร้อมเช็คอินพิกัด QSNCC',
    rewardsText: '🏅 เหรียญตรา "Master Reader" + ⚡ 200 XP + 🎁 ส่วนลดร้านหนังสือพาร์ทเนอร์ 10%',
    startDate: '26 มี.ค. 2026',
    endDate: '6 เม.ย. 2026',
    daysRemaining: 16,
  },
  {
    id: 'quest-off-4',
    title: 'Sound Bath & Zen Healing: สัมผัสความสงบผ่อนคลาย',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    category: 'heal',
    badgeLabel: 'Zen Inner Peace',
    badgeIcon: '🧘',
    completedCountInfo: '0/3 ครั้ง',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'ทีมงาน Chill & Connect',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    participantsCount: 198,
    rewardPoints: 280,
    isOfficial: true,
    targetGoal: 'เข้าร่วมกิจกรรมบำบัดด้วยคลื่นเสียงหรือฝึกสมาธิกลุ่มครบ 3 ครั้ง',
    objective: 'ผ่อนคลายสมองจากความเหนื่อยล้า บำบัดความเครียดด้วยคลื่นเสียง Tibetan Bowls และปรับสมดุลจิตใจ',
    steps: [
      'ลงทะเบียนกิจกรรม Sound Bath หรือ Yoga Therapy ผ่านระบบ',
      'เข้าร่วมกิจกรรมและปล่อยวางความกังวลเต็มเวลา',
      'สะสมการเข้าร่วมครบ 3 ครั้ง'
    ],
    verificationMethod: '🎟️ การสแกน E-Ticket หรือการยืนยันการเข้าร่วมจากผู้จัดกิจกรรม',
    rewardsText: '🏅 เหรียญตรา "Zen Inner Peace" + ⚡ 280 XP + 🎁 เซ็ตชาสมุนไพรออร์แกนิก',
    startDate: '10 มี.ค. 2026',
    endDate: '10 เม.ย. 2026',
    daysRemaining: 20,
  },
];

// Top 5 Weekly Leaderboard Hunters
const WEEKLY_LEADERBOARD = [
  {
    rank: 1,
    name: 'คุณนนท์ (Nont Runner)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    level: 14,
    xp: 2450,
    badges: 12,
    tag: '⚡ สายสปีด วิ่งครบ 3 สวน',
  },
  {
    rank: 2,
    name: 'คุณแพรว (Praew Zen)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    level: 12,
    xp: 1980,
    badges: 9,
    tag: '🌿 Sound Bath & Yoga Lover',
  },
  {
    rank: 3,
    name: 'คุณเต้ (Tae Cafe Hunter)',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    level: 11,
    xp: 1720,
    badges: 8,
    tag: '☕ เช็คอินคาเฟ่ครบ 10 แห่ง',
  },
  {
    rank: 4,
    name: 'คุณมายด์ (Mild Art)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    level: 9,
    xp: 1350,
    badges: 6,
    tag: '🎨 เวิร์กช็อปเซรามิก & วาดรูป',
  },
  {
    rank: 5,
    name: 'คุณกอล์ฟ (Golf HYROX)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    level: 8,
    xp: 1180,
    badges: 5,
    tag: '🔥 HYROX Training Finisher',
  },
];

export default function ChallengesDiscoveryPage() {
  const [activeTab, setActiveTab] = useState('challenges');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'official' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);



  // User XP State
  const [userXp, setUserXp] = useState<number>(450);

  // Joined Quest state
  const [joinedQuestIds, setJoinedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserXp(getStoredUserXp());
    }
    if (isLoggedIn) {
      setJoinedQuestIds(['comm-quest-1', 'comm-quest-2']);
    } else {
      setJoinedQuestIds([]);
    }
  }, [isLoggedIn]);

  const userLevel = Math.max(1, Math.floor(userXp / 150) + 1);
  
  // Confirmation Modal states
  const [questToJoin, setQuestToJoin] = useState<QuestWithDuration | null>(null);
  const [questToCancel, setQuestToCancel] = useState<QuestWithDuration | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmJoin = () => {
    if (questToJoin && !joinedQuestIds.includes(questToJoin.id)) {
      setJoinedQuestIds((prev) => [...prev, questToJoin.id]);
      showToast(`🎉 รับภารกิจ "${questToJoin.title}" สำเร็จ! สามารถดูได้ใน "ฮับของฉัน"`);
      setQuestToJoin(null);
    }
  };

  const handleConfirmCancel = () => {
    if (questToCancel) {
      setJoinedQuestIds((prev) => prev.filter((id) => id !== questToCancel.id));
      showToast(`ยกเลิกภารกิจ "${questToCancel.title}" เรียบร้อยแล้ว`);
      setQuestToCancel(null);
    }
  };

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return ALL_QUESTS.filter((quest) => {
      // Category match
      if (selectedCategory !== 'all' && quest.category !== selectedCategory) {
        return false;
      }
      // Type match (Official vs Community)
      if (selectedType === 'official' && !quest.isOfficial) {
        return false;
      }
      if (selectedType === 'community' && quest.isOfficial) {
        return false;
      }
      // Search query match
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const text = `${quest.title} ${quest.targetGoal} ${quest.badgeLabel} ${quest.creatorName}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setIsRequireMembershipOpen(true);
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 space-y-3 sm:space-y-4 w-full">
        
        {/* 1. Unified Compact Hero with Integrated Spotlight Quest (Single Clean Banner) */}
        <section className="relative rounded-2xl bg-white p-4 sm:p-5 shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
            
            {/* Left Side (7 Cols): Hero Headline, Description & Actions */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  พิชิตเป้าหมายวันว่าง <span className="text-[#7C3AED]">สะสมเหรียญรางวัล</span>
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal max-w-xl">
                  รับภารกิจ ออกไปวิ่ง เช็คอินคาเฟ่ หรือฮีลใจ สะสมเหรียญรางวัล Badges และส่งหลักฐานเพื่อรับแต้ม XP พิเศษเมื่อทำสำเร็จ
                </p>
              </div>

              {/* Action Buttons & Status */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setIsRequireMembershipOpen(true);
                    } else {
                      setIsCreateEventModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>สร้างชาเลนจ์ใหม่</span>
                </button>

                <Link
                  href="/rewards"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Gift className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>ศูนย์ของรางวัล</span>
                </Link>

                {/* Logged in vs Guest Status Hook */}
                {isLoggedIn ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs">
                      <span>Lv.{userLevel}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-purple-700 font-mono">{userXp} XP</span>
                    </span>
                    {joinedQuestIds.length > 0 && (
                      <Link
                        href="/myhub?tab=quests_rewards"
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200/80 hover:bg-purple-100 transition-colors shadow-2xs"
                      >
                        <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                        <span>กำลังทำ {joinedQuestIds.length} ภารกิจ (My Hub ↗)</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200/80 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>เข้าสู่ระบบสะสมแต้มก้อนแรก +100 XP ฟรี</span>
                    <ArrowRight className="w-3 h-3 text-purple-600" />
                  </button>
                )}
              </div>

              {/* Editorial Meta */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                <span className="font-semibold text-slate-600">{ALL_QUESTS.length} ภารกิจเปิดรับ</span>
                <span>•</span>
                <span>1,400+ ผู้เข้าร่วม</span>
                <span>•</span>
                <span>อัปเดตแต้มรายสัปดาห์</span>
              </div>
            </div>

            {/* Right Side (5 Cols): Embedded Spotlight Card (Compact Flagship Highlight) */}
            {ALL_QUESTS[0] && (
              <div className="lg:col-span-5 bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-slate-50/60 p-3 sm:p-3.5 rounded-xl border border-purple-200/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300/80 text-[10.5px]">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                      <span>ภารกิจเรือธง</span>
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>เหลือ 4 วัน</span>
                    </span>
                  </div>
                  <span className="font-black text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-200 text-[10.5px]">
                    +{ALL_QUESTS[0].rewardPoints} XP
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 line-clamp-1">
                    {ALL_QUESTS[0].title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {ALL_QUESTS[0].targetGoal}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-purple-100/80 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-600 truncate max-w-[140px]">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-700 text-[11px]">เหรียญ {ALL_QUESTS[0].badgeLabel}</span>
                  </div>

                  {joinedQuestIds.includes(ALL_QUESTS[0].id) ? (
                    <Link
                      href="/myhub?tab=quests_rewards"
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>กำลังทำ ↗</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoggedIn) {
                          setIsRequireMembershipOpen(true);
                        } else {
                          setQuestToJoin(ALL_QUESTS[0]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-white" />
                      <span>รับภารกิจ</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* 2. Main Content Container */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 sm:space-y-5">
          
          {/* Category Tabs & Search Bar Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-slate-50/90 p-1.5 sm:p-2 rounded-xl border border-slate-200/70">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'move', label: 'สายแอคทีฟ' },
                { id: 'heal', label: 'สายฮีลใจ' },
                { id: 'chill', label: 'สายชิลล์' },
                { id: 'learn', label: 'สายเรียนรู้' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 border border-purple-300/70 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Type Selector (Official vs Community) & Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200/80 shrink-0">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === 'all' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedType('official')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === 'official' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทางการ
                </button>
                <button
                  onClick={() => setSelectedType('community')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === 'community' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ชุมชน
                </button>
              </div>

              {/* Compact Search */}
              <div className="relative flex-1 md:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาภารกิจ..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>

          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
            
            {/* Left: Quests Grid */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    คลังภารกิจ
                  </h2>
                  <span className="text-xs text-slate-400">({filteredQuests.length})</span>
                </div>
              </div>

              {filteredQuests.length === 0 ? (
                <div className="bg-slate-50/80 rounded-2xl p-6 text-center border border-dashed border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700">ไม่พบภารกิจที่ตรงกับเงื่อนไข</p>
                  <p className="text-xs text-slate-400">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูใหม่อีกครั้ง</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#7C3AED] font-bold hover:underline cursor-pointer pt-1"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredQuests.map((quest) => {
                    const isJoined = joinedQuestIds.includes(quest.id);
                    const isUrgent = quest.daysRemaining <= 5;

                    return (
                      <div
                        key={quest.id}
                        onClick={() => setQuestToJoin(quest)}
                        className={`group/card bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-2xs hover:shadow-xl hover:border-purple-300/80 hover:-translate-y-0.5 cursor-pointer ${
                          isJoined 
                            ? 'border-purple-300 bg-purple-50/15 ring-1 ring-purple-200' 
                            : 'border-slate-200/80'
                        }`}
                      >
                        {/* Official Quest Top Accent Stripe */}
                        {quest.isOfficial && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-400 to-purple-400" />
                        )}

                        {/* 1. Top Badges Row: Official/Community + XP Token (CHILL/MOVE/HEAL removed) */}
                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {quest.isOfficial ? (
                              <span
                                title="ชาเลนจ์ทางการที่จัดทำโดย Chill & Connect Hub"
                                className="text-[10px] font-black text-purple-900 bg-purple-100/90 px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-300/80"
                              >
                                <Crown className="w-2.5 h-2.5 text-purple-700 fill-purple-500" />
                                <span>Official</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                ชุมชน
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-black text-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 shadow-2xs">
                            <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                            <span>+{quest.rewardPoints} XP</span>
                          </span>
                        </div>

                        {/* 2. Full Inner Image Banner with Floating Glass Medal Badge */}
                        <div className="relative h-28 sm:h-32 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group-hover/card:border-purple-300/50 transition-colors">
                          <img
                            src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                            alt={quest.title}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Ambient Dark Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                          {/* Bottom-Left Floating Glass Medal Badge */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-white bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-md truncate max-w-full">
                              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">เหรียญ {quest.badgeLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Title & Target Description */}
                        <div className="space-y-1 flex-1">
                          <h3
                            title={quest.title}
                            className="font-black text-xs sm:text-[13px] text-slate-900 group-hover/card:text-purple-700 transition-colors leading-snug line-clamp-1"
                          >
                            {quest.title}
                          </h3>
                          <p
                            title={quest.targetGoal}
                            className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium"
                          >
                            {quest.targetGoal}
                          </p>
                        </div>

                        {/* 4. Duration & Attendees */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>{quest.startDate} - {quest.endDate}</span>
                          <span className={isUrgent ? 'text-rose-600 font-semibold' : ''}>
                            เหลือ {quest.daysRemaining} วัน
                          </span>
                        </div>

                        {/* 5. Footer Meta & Action Bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                            <img
                              src={quest.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                              alt={quest.creatorName || ''}
                              className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <span className="truncate text-slate-700 font-medium">{quest.creatorName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isJoined ? (
                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Link
                                  href="/myhub?tab=quests_rewards"
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer group/btn"
                                  title="ไปที่ My Hub เพื่อส่งรูปถ่ายยืนยันภารกิจ"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>กำลังทำ</span>
                                  <ArrowRight className="w-3 h-3 opacity-75 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Link>
                                
                                <button
                                  type="button"
                                  onClick={() => setQuestToCancel(quest)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="ยกเลิกภารกิจนี้"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isLoggedIn) {
                                    setIsRequireMembershipOpen(true);
                                  } else {
                                    setQuestToJoin(quest);
                                  }
                                }}
                                className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                              >
                                <span>{quest.participantsCount} คน</span>
                                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Weekly Leaderboard Sidebar */}
            <div className="space-y-3">
              
              {/* Leaderboard Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">Top 5 ประจำสัปดาห์</h3>
                    <p className="text-[10px] text-slate-400">อัปเดตแต้ม XP ทุกวันอาทิตย์ เวลา 23:59 น.</p>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                    Weekly XP
                  </span>
                </div>

                {/* Top 5 List */}
                <div className="space-y-1.5 pt-0.5">
                  {WEEKLY_LEADERBOARD.map((user) => (
                    <div
                      key={user.rank}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 hover:bg-slate-50 transition-colors border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Rank Badge */}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          user.rank === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300/80'
                            : user.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : user.rank === 3
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}>
                          {user.rank}
                        </span>

                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Lv.{user.level} • {user.badges} เหรียญ
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-purple-700 font-mono shrink-0 pl-1">
                        {user.xp} XP
                      </span>
                    </div>
                  ))}
                </div>

                {/* Personal Rank / Guest Conversion Box */}
                {isLoggedIn ? (
                  <div className="mt-2.5 p-2 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                        #14
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-purple-950 truncate">อันดับของคุณ (สัปดาห์นี้)</p>
                        <p className="text-[10px] text-purple-700 truncate">Lv.{userLevel} • ขาดอีก 120 XP ติด Top 10</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-800 font-mono shrink-0 pl-1">{userXp} XP</span>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsAuthModalOpen(true)}
                    className="mt-2.5 p-2.5 rounded-xl bg-purple-50/70 border border-dashed border-purple-200 text-center cursor-pointer hover:bg-purple-100/70 transition-colors group/guestRank shadow-2xs"
                  >
                    <p className="text-[11px] font-bold text-purple-900 group-hover/guestRank:text-purple-950">
                      👤 เข้าสู่ระบบเพื่อดูอันดับของคุณ
                    </p>
                    <p className="text-[10px] text-purple-600">
                      สะสม XP จากภารกิจและเริ่มไต่แรงก์สัปดาห์นี้
                    </p>
                  </div>
                )}
              </div>

              {/* XP Rewards Bridge Card (Soft Clean Style matching Leaderboard) */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Gift className="w-3.5 h-3.5 text-purple-600" />
                    <span>แลกรับสิทธิ์ด้วย XP</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                    ศูนย์ของรางวัล
                  </span>
                </div>

                {/* XP Status: Personalized for Member vs General for Guest */}
                {isLoggedIn ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] bg-purple-50/70 px-2.5 py-1 rounded-lg border border-purple-100">
                      <span className="text-slate-600">แต้มสะสมของคุณ:</span>
                      <span className="font-bold text-purple-700 font-mono">{userXp} XP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      {userXp >= 500
                        ? '🎉 คุณมีแต้มเพียงพอแลกกาแฟ Specialty ฟรี 1 แก้วได้แล้ว!'
                        : `สะสมอีกเพียง ${Math.max(0, 500 - userXp)} XP จะแลกกาแฟ Specialty ฟรีแก้วแรกได้!`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    สะสมแต้มจากการทำภารกิจ นำมาแลกรับเครื่องดื่มฟรี ส่วนลดงานแฟร์ หรือคูปองเวิร์กช็อป
                  </p>
                )}

                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">☕</span>
                      <span className="text-slate-700 text-[11px] font-medium truncate">กาแฟ Specialty ฟรี 1 แก้ว</span>
                    </div>
                    <span className="text-purple-700 font-bold text-[11px] shrink-0 font-mono pl-1">500 XP</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">🎟️</span>
                      <span className="text-slate-700 text-[11px] font-medium truncate">ส่วนลดงานแฟร์ 100 บาท</span>
                    </div>
                    <span className="text-purple-700 font-bold text-[11px] shrink-0 font-mono pl-1">300 XP</span>
                  </div>
                </div>

                <Link
                  href="/rewards"
                  className="w-full py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <span>สำรวจศูนย์ของรางวัล</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* 🏆 Full Gamification Join Quest Detail Modal */}
      <JoinChallengeModal
        isOpen={!!questToJoin}
        onClose={() => setQuestToJoin(null)}
        quest={questToJoin}
        onConfirmJoin={() => {
          if (!isLoggedIn) {
            setIsRequireMembershipOpen(true);
            return;
          }
          if (questToJoin) {
            handleConfirmJoin();
          }
        }}
        isAlreadyJoined={questToJoin ? joinedQuestIds.includes(questToJoin.id) : false}
      />

      {/* 🛡️ 4. POPUP 2: Confirm Cancel Quest Modal (Double Confirm) */}
      {questToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-rose-200 text-center space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-base text-[#1E293B]">
                ยืนยันยกเลิกภารกิจ?
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                คุณต้องการยกเลิกภารกิจ <strong className="text-[#1E293B]">"{questToCancel.title}"</strong> ใช่หรือไม่?
              </p>
              <p className="text-[11px] text-slate-400">
                คุณสามารถกลับมารับภารกิจนี้ใหม่ได้ตลอดก่อนหมดเขต
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuestToCancel(null)}
                className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ไม่ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/25 active:scale-95 cursor-pointer"
              >
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Create Challenge Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        initialType="challenge"
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          showToast(`สร้างชาเลนจ์ "${newEvent.title}" เรียบร้อยแล้ว! ⚡`);
        }}
      />

      {/* Free Membership Required Modal */}
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle="เพื่อรับภารกิจและสร้างชาเลนจ์"
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ! สามารถรับภารกิจและสะสมแต้มได้แล้ว 🎉');
        }}
      />

      {/* Logout Modal */}
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
