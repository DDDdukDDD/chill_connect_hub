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
import { Pagination } from '@/components/Pagination';
import { ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { getStoredUserXp, setStoredUserXp } from '@/data/rewardsData';
import { fetchAllContentPages } from '@/lib/contentClient';

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


export default function ChallengesDiscoveryPage() {
  const [activeTab, setActiveTab] = useState('challenges');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'official' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn, userProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 18;
  const [questList, setQuestList] = useState<QuestWithDuration[]>(ALL_QUESTS);

  useEffect(() => {
    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (!isActive) return;
        const existingTitles = new Set(ALL_QUESTS.map((quest) => quest.title.trim().toLowerCase()));
        const additions = quests
          .filter((quest) => !existingTitles.has(quest.title.trim().toLowerCase()))
          .map((quest) => ({
            ...quest,
            startDate: quest.startDate || '',
            endDate: quest.endDate || '',
            daysRemaining: quest.daysRemaining ?? 0,
            image: quest.badgeCoverImg,
          }));
        setQuestList([...ALL_QUESTS, ...additions]);
      })
      .catch((error) => console.warn('Using default challenge catalog fallback:', error));

    return () => {
      isActive = false;
    };
  }, []);

  // User XP State
  const [userXp, setUserXp] = useState<number>(() => getStoredUserXp());

  // Joined Quest state synchronized with localStorage ('cch_my_challenges')
  const [joinedQuestIds, setJoinedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserXp(getStoredUserXp());
    }

    if (isLoggedIn) {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('cch_my_challenges');
          if (raw) {
            const parsed: ChallengeQuest[] = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setJoinedQuestIds(parsed.map((q) => q.id));
              return;
            }
          }
          // Default initial challenges synced with MOCK_CHALLENGES
          const initial = MOCK_CHALLENGES;
          localStorage.setItem('cch_my_challenges', JSON.stringify(initial));
          setJoinedQuestIds(initial.map((q) => q.id));
        } catch (e) {
          console.error('Error syncing challenges with localStorage:', e);
          setJoinedQuestIds(['1', '2', 'comm-quest-1', 'comm-quest-2']);
        }
      }
    } else {
      setJoinedQuestIds([]);
    }
  }, [isLoggedIn]);

  // Deep-linking: Support opening quest modal from URL (e.g. /challenges?quest=comm-quest-1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const questId = params.get('quest');
    if (questId && questList.length > 0) {
      const matched = questList.find((q) => q.id === questId);
      if (matched) {
        setQuestToJoin(matched);
      }
    }
  }, [questList]);

  // Confirmation Modal states
  const [questToJoin, setQuestToJoin] = useState<QuestWithDuration | null>(null);
  const [questToCancel, setQuestToCancel] = useState<QuestWithDuration | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmJoin = (targetQuest?: QuestWithDuration | ChallengeQuest | null) => {
    const quest = targetQuest || questToJoin;
    if (!quest) return;

    const questToAdd: ChallengeQuest = {
      id: quest.id,
      title: quest.title,
      iconName: quest.iconName || 'Trophy',
      progressPercent: quest.progressPercent || 0,
      current: quest.current || '0',
      total: quest.total || '3',
      badgeLabel: quest.badgeLabel,
      badgeIcon: quest.badgeIcon || '🏅',
      completedCountInfo: quest.completedCountInfo || `0/${quest.total || '3'} ครั้ง`,
      category: quest.category,
      targetGoal: quest.targetGoal,
      objective: quest.objective,
      steps: quest.steps,
      verificationMethod: quest.verificationMethod,
      rewardsText: quest.rewardsText,
      participantsCount: (quest.participantsCount || 0) + 1,
      rewardPoints: quest.rewardPoints || 250,
      isOfficial: quest.isOfficial,
      badgeCoverImg: (quest as any).image || quest.badgeCoverImg,
      startDate: (quest as any).startDate,
      endDate: (quest as any).endDate,
      daysRemaining: (quest as any).daysRemaining,
    };

    setJoinedQuestIds((prev) => Array.from(new Set([...prev, quest.id])));

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cch_my_challenges');
        let currentList: ChallengeQuest[] = raw ? JSON.parse(raw) : [...MOCK_CHALLENGES];
        if (!currentList.some((q) => q.id === quest.id || q.title.trim() === quest.title.trim())) {
          currentList = [questToAdd, ...currentList];
          localStorage.setItem('cch_my_challenges', JSON.stringify(currentList));
        }
      } catch (e) {
        console.error('Error saving quest to cch_my_challenges:', e);
      }
    }

    showToast(`🎉 รับภารกิจ "${quest.title}" สำเร็จ! สามารถดูและส่งความคืบหน้าได้ใน "ฮับของฉัน"`);
    setQuestToJoin(null);
  };

  const handleConfirmCancel = (targetQuest?: QuestWithDuration | ChallengeQuest | null) => {
    const quest = targetQuest || questToCancel;
    if (!quest) return;

    setJoinedQuestIds((prev) => prev.filter((id) => id !== quest.id));

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cch_my_challenges');
        if (raw) {
          const currentList: ChallengeQuest[] = JSON.parse(raw);
          const filtered = currentList.filter((q) => q.id !== quest.id && q.title.trim() !== quest.title.trim());
          localStorage.setItem('cch_my_challenges', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('Error updating cch_my_challenges on cancel:', e);
      }
    }

    showToast(`ยกเลิกภารกิจ "${quest.title}" เรียบร้อยแล้ว`);
    setQuestToCancel(null);
    if (questToJoin?.id === quest.id) {
      setQuestToJoin(null);
    }
  };

  const handleSubmitProgress = (quest: ChallengeQuest, newCurrent: number) => {
    const targetTotal = parseInt(quest.total || '3', 10) || 3;
    const isDone = newCurrent >= targetTotal;
    const progressPercent = Math.min(100, Math.round((newCurrent / targetTotal) * 100));

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cch_my_challenges');
        if (raw) {
          const currentList: ChallengeQuest[] = JSON.parse(raw);
          const updated = currentList.map((q) => {
            if (q.id === quest.id || q.title.trim() === quest.title.trim()) {
              return {
                ...q,
                current: String(newCurrent),
                progressPercent,
                completedCountInfo: isDone ? `ทำสำเร็จครบ ${targetTotal}/${targetTotal} แล้ว!` : `ทำสำเร็จแล้ว ${newCurrent}/${targetTotal}`,
              };
            }
            return q;
          });
          localStorage.setItem('cch_my_challenges', JSON.stringify(updated));
        }
        
        // If completed, award XP!
        if (isDone && quest.rewardPoints) {
          const currentXp = getStoredUserXp();
          const nextXp = currentXp + quest.rewardPoints;
          setStoredUserXp(nextXp);
          setUserXp(nextXp);
        }
      } catch (e) {
        console.error('Error saving progress to cch_my_challenges:', e);
      }
    }
  };

  // Check if currently viewed quest is completed
  const isQuestCompleted = useMemo(() => {
    if (!questToJoin) return false;
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('cch_my_challenges');
        if (raw) {
          const list: ChallengeQuest[] = JSON.parse(raw);
          const found = list.find((q) => q.id === questToJoin.id || q.title.trim() === questToJoin.title.trim());
          if (found) {
            return (found.progressPercent ?? 0) >= 100 || (parseInt(found.current || '0', 10) >= parseInt(found.total || '3', 10));
          }
        }
      }
    } catch (e) {
      console.error('Error checking isQuestCompleted:', e);
    }
    return false;
  }, [questToJoin, joinedQuestIds]);

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return questList.filter((quest) => {
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
  }, [questList, selectedCategory, selectedType, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredQuests.length / itemsPerPage);
  const paginatedQuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuests, currentPage, itemsPerPage]);

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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-2.5 pb-28 sm:pt-4 sm:pb-12 space-y-3 sm:space-y-4 w-full">
        

        {/* 1. Header Hero Banner */}
        <section className="relative rounded-2xl bg-white p-4 sm:p-5 shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                ภารกิจไลฟ์สไตล์ & ชาเลนจ์
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal max-w-xl">
                รับภารกิจและออกไปทำกิจกรรมสนุกๆ รับแต้ม XP แลกของรางวัล
              </p>
            </div>

            {/* Action Status */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isLoggedIn ? (
                joinedQuestIds.length > 0 && (
                  <Link
                    href="/myhub?tab=quests_rewards"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200/80 hover:bg-purple-100 transition-colors shadow-2xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-500" />
                    <span>กำลังทำ {joinedQuestIds.length} ภารกิจ</span>
                    <ArrowRight className="w-3 h-3 text-purple-600" />
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200/80 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>เข้าสู่ระบบสะสมแต้มก้อนแรก +100 XP ฟรี</span>
                  <ArrowRight className="w-3 h-3 text-purple-600" />
                </button>
              )}

              {/* Create Challenge CTA */}
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    setIsRequireMembershipOpen(true);
                    return;
                  }
                  setIsCreateEventModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer leading-none"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-300" />
                <span>+ สร้างชาเลนจ์ใหม่</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Standalone Rewards Micro-Incentive Strip */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-slate-50 border border-purple-100/90 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              <strong className="text-purple-900 font-bold">แลกของรางวัล:</strong> สะสมแต้ม XP จากภารกิจ แลกรับกาแฟ Specialty ฟรี, เวิร์กช็อป และสิทธิพิเศษไลฟ์สไตล์
            </p>
          </div>

          <Link
            href="/rewards"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer leading-none"
          >
            <span>สำรวจของรางวัล</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
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
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
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
                  onClick={() => {
                    setSelectedType('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === 'all' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => {
                    setSelectedType('official');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === 'official' ? 'bg-[#7C3AED] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทางการ
                </button>
                <button
                  onClick={() => {
                    setSelectedType('community');
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ค้นหาภารกิจ..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>

          </div>

          {/* Quests Main Section (Full Width) */}
          <div id="catalog-section" className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  คลังภารกิจ
                </h2>
                <span className="text-xs text-slate-400">
                  ({filteredQuests.length} ภารกิจ{totalPages > 1 ? ` • หน้า ${currentPage}/${totalPages}` : ''})
                </span>
              </div>
            </div>

              {filteredQuests.length === 0 ? (
                <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
                        ไม่พบภารกิจที่ตรงกับเงื่อนไข
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูใหม่อีกครั้ง
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
                  >
                    <span>ดูภารกิจทั้งหมด</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedQuests.map((quest) => {
                    const isJoined = joinedQuestIds.includes(quest.id);
                    const isUrgent = quest.daysRemaining <= 5;

                    return (
                      <div key={quest.id}>
                        <div
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
                        <div className="relative h-[135px] sm:h-[154px] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group-hover/card:border-purple-300/50 transition-colors">
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
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span className="text-slate-400">{quest.startDate} - {quest.endDate}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{quest.participantsCount} คน</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className={isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                              เหลือ {quest.daysRemaining} วัน
                            </span>
                          </div>
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
                                className="text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                              >
                                <span>รับภารกิจ</span>
                                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                {/* Pagination */}
                {filteredQuests.length > itemsPerPage && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                      totalItems={filteredQuests.length}
                      itemsPerPage={itemsPerPage}
                      itemUnit="ภารกิจ"
                      scrollTargetId="catalog-section"
                    />
                  </div>
                )}
              </>
            )}
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
        onConfirmJoin={(q) => {
          if (!isLoggedIn) {
            setIsRequireMembershipOpen(true);
            return;
          }
          handleConfirmJoin(q || questToJoin);
        }}
        isAlreadyJoined={questToJoin ? joinedQuestIds.includes(questToJoin.id) : false}
        onCancelQuest={(q) => handleConfirmCancel(q || questToJoin)}
        onSubmitProgress={(q, newCurrent) => handleSubmitProgress(q, newCurrent)}
        isCompleted={isQuestCompleted}
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
                onClick={() => handleConfirmCancel()}
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
          const newQuest: QuestWithDuration = {
            id: newEvent.id,
            title: newEvent.title,
            iconName: 'Trophy',
            progressPercent: 0,
            current: '0',
            total: '3',
            badgeLabel: 'New Quest',
            badgeIcon: '🏅',
            completedCountInfo: '0/3 ครั้ง',
            category: (newEvent.category as any) || 'chill',
            targetGoal: newEvent.description || newEvent.title,
            objective: newEvent.description,
            steps: newEvent.rules || ['เช็คอินถ่ายภาพหรือส่งหลักฐาน', 'ทำภารกิจตามกติกาให้ครบ'],
            verificationMethod: 'อัปโหลดรูปถ่ายหรือเช็คอินพิกัด',
            rewardsText: newEvent.badgeText || '+250 XP',
            participantsCount: 1,
            rewardPoints: 250,
            isOfficial: false,
            badgeCoverImg: newEvent.image,
            image: newEvent.image,
            startDate: newEvent.date?.split(' - ')[0] || '',
            endDate: newEvent.date?.split(' - ')[1] || '',
            daysRemaining: 14,
            creatorName: userProfile.name || 'ฉัน',
            creatorAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          };

          setQuestList((prev) => [newQuest, ...prev]);
          setJoinedQuestIds((prev) => Array.from(new Set([newQuest.id, ...prev])));

          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('cch_my_challenges');
              const list: ChallengeQuest[] = raw ? JSON.parse(raw) : [];
              localStorage.setItem('cch_my_challenges', JSON.stringify([newQuest, ...list]));
            } catch (e) {
              console.error('Error saving new challenge:', e);
            }
          }

          setIsCreateEventModalOpen(false);
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
