'use client';

import React, { useState, useMemo } from 'react';
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
  Check
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';

// Extended Quest Interface with Date & Duration
export interface QuestWithDuration extends ChallengeQuest {
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

// Extended Catalog of Official & Community Quests
const ALL_QUESTS: QuestWithDuration[] = [
  {
    ...MOCK_CHALLENGES[0],
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    ...MOCK_CHALLENGES[1],
    startDate: '15 มี.ค. 2026',
    endDate: '15 เม.ย. 2026',
    daysRemaining: 25,
  },
  {
    id: 'quest-off-1',
    title: '3 Parks Bangkok Runner: วิ่ง 3 สวนสาธารณะกรุงเทพฯ',
    iconName: 'Flame',
    category: 'move',
    targetGoal: 'วิ่งสะสมระยะทาง ณ สวนลุมพินี, สวนเบญจกิติ, และสวนรถไฟ (เช็คอินพิกัด GPS จริง)',
    badgeLabel: 'City Runner Master',
    completedCountInfo: '0/3 สวน',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'Chill & Connect Official',
    creatorAvatar: '/favicon.ico',
    participantsCount: 342,
    rewardPoints: 350,
    isOfficial: true,
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    id: 'quest-off-2',
    title: 'Ari Specialty Coffee Hop: แวะ 5 คาเฟ่คราฟต์ย่านอารีย์',
    iconName: 'Sparkles',
    category: 'chill',
    targetGoal: 'ลิ้มลองกาแฟ Specialty หรือ Matcha 5 ร้านพาร์ทเนอร์ พร้อมถ่ายภาพเช็คอินโมเมนต์',
    badgeLabel: 'Coffee Connoisseur',
    completedCountInfo: '0/5 ร้าน',
    progressPercent: 0,
    current: '0',
    total: '5',
    visibility: 'public',
    creatorName: 'Chill & Connect Official',
    creatorAvatar: '/favicon.ico',
    participantsCount: 289,
    rewardPoints: 300,
    isOfficial: true,
    startDate: '1 มี.ค. 2026',
    endDate: '25 มี.ค. 2026',
    daysRemaining: 4,
  },
  {
    id: 'quest-off-3',
    title: 'Bookworm Expo 2026: ตะลุยงานสัปดาห์หนังสือแห่งชาติ',
    iconName: 'Sparkles',
    category: 'learn',
    targetGoal: 'เข้าร่วมงานสัปดาห์หนังสือ ณ ศูนย์ฯ สิริกิติ์ และอ่านหนังสือจบอย่างน้อย 1 เล่ม',
    badgeLabel: 'Master Reader',
    completedCountInfo: '0/1 งาน',
    progressPercent: 0,
    current: '0',
    total: '1',
    visibility: 'public',
    creatorName: 'Chill & Connect Official',
    creatorAvatar: '/favicon.ico',
    participantsCount: 412,
    rewardPoints: 200,
    isOfficial: true,
    startDate: '26 มี.ค. 2026',
    endDate: '6 เม.ย. 2026',
    daysRemaining: 16,
  },
  {
    id: 'quest-off-4',
    title: 'Sound Bath & Zen Healing: สัมผัสความสงบ 3 สัปดาห์',
    iconName: 'Sparkles',
    category: 'heal',
    targetGoal: 'เข้าร่วมกิจกรรมบำบัดด้วยคลื่นเสียงหรือฝึกสมาธิกลุ่มครบ 3 ครั้ง',
    badgeLabel: 'Zen Inner Peace',
    completedCountInfo: '0/3 ครั้ง',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'Chill & Connect Official',
    creatorAvatar: '/favicon.ico',
    participantsCount: 198,
    rewardPoints: 280,
    isOfficial: true,
    startDate: '10 มี.ค. 2026',
    endDate: '10 เม.ย. 2026',
    daysRemaining: 20,
  },
  {
    id: 'comm-quest-3',
    title: 'HYROX 10K Workout Prep: เทรนนิ่งกลุ่ม 4 ครั้ง',
    iconName: 'Flame',
    category: 'move',
    targetGoal: 'วิ่งและออกกำลังกายกลุ่มเตรียมแข่ง HYROX ครบ 4 ครั้ง',
    badgeLabel: 'HYROX Warrior',
    completedCountInfo: '0/4 ครั้ง',
    progressPercent: 0,
    current: '0',
    total: '4',
    visibility: 'public',
    creatorName: 'Coach Mark',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    participantsCount: 142,
    rewardPoints: 250,
    isOfficial: false,
    startDate: '5 มี.ค. 2026',
    endDate: '28 มี.ค. 2026',
    daysRemaining: 7,
  },
  {
    id: 'comm-quest-4',
    title: 'Morning Yoga 7 Days: ฮีลใจรับอรุณ',
    iconName: 'Sparkles',
    category: 'heal',
    targetGoal: 'เล่นโยคะยามเช้าหรือฝึกสมาธิต่อเนื่อง 7 วัน',
    badgeLabel: 'Yoga Spirit',
    completedCountInfo: '0/7 วัน',
    progressPercent: 0,
    current: '0',
    total: '7',
    visibility: 'public',
    creatorName: 'K. Mindy',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    participantsCount: 189,
    rewardPoints: 200,
    isOfficial: false,
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
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
  
  // Joined Quest state
  const [joinedQuestIds, setJoinedQuestIds] = useState<string[]>(['comm-quest-1', 'comm-quest-2']);
  
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={true}
        setIsLoggedIn={() => {}}
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
        
        {/* 🌟 1. Ultra-Compact Brand-Tone Hero Banner (Mobile & iPad Friendly) */}
        <section className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-white to-amber-50/40 p-4 sm:p-5 md:p-6 shadow-2xs border border-[#E8E2D8] overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-1.5 sm:space-y-2">
            
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#1E293B] tracking-tight leading-tight">
              พิชิตเป้าหมายวันว่าง <span className="text-[#F26430]">สะสมเหรียญรางวัล</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
              รับภารกิจ ออกไปวิ่ง เช็คอินคาเฟ่ หรือฮีลใจ สะสมเหรียญรางวัล Badges และส่งหลักฐานเพื่อรับแต้ม XP พิเศษเมื่อทำสำเร็จ!
            </p>

            {/* Quick Info Badges (Compact & Responsive) */}
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>{ALL_QUESTS.length} ภารกิจ</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <Users className="w-3 h-3 text-emerald-600" />
                <span>1,400+ ผู้เข้าร่วม</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span>Leaderboard ประจำสัปดาห์</span>
              </span>
            </div>

          </div>
        </section>

        {/* 📦 5. Container Block ครอบคลังกิจกรรมและ Leaderboard ทั้งหมด */}
        <section className="bg-white/80 backdrop-blur-xs rounded-3xl p-4 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-5">
          
          {/* Category Tabs & Search Bar Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FAF7F2] p-2.5 sm:p-3 rounded-2xl border border-[#E8E2D8]">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: '🌟 ทั้งหมด' },
                { id: 'move', label: '🏃 สายขยับกาย' },
                { id: 'heal', label: '🌿 สายฮีลใจ' },
                { id: 'chill', label: '☕ สายชิลล์ & คาเฟ่' },
                { id: 'learn', label: '🎨 สายสร้างสรรค์' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Type Selector (Official vs Community) & Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedType === 'all' ? 'bg-[#1E293B] text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedType('official')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedType === 'official' ? 'bg-[#4A7C59] text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  🌟 ทางการ
                </button>
                <button
                  onClick={() => setSelectedType('community')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedType === 'community' ? 'bg-[#F26430] text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  👥 ชุมชน
                </button>
              </div>

              {/* Compact Search */}
              <div className="relative flex-1 md:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชาเลนจ์..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                />
              </div>
            </div>

          </div>

          {/* 2-Column Layout: Quests Grid (Left 68%) & Weekly Leaderboard (Right 32%) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
            
            {/* Left: Quests Grid */}
            <div className="lg:col-span-2 space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1E293B] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>คลังภารกิจที่เปิดรับสมัคร</span>
                  <span className="text-xs font-semibold text-slate-400">({filteredQuests.length})</span>
                </h2>
              </div>

              {filteredQuests.length === 0 ? (
                <div className="bg-[#FAF7F2] rounded-3xl p-10 text-center border border-[#E8E2D8] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-400 flex items-center justify-center mx-auto text-xl shadow-xs">
                    🔍
                  </div>
                  <h3 className="font-extrabold text-sm text-[#1E293B]">ไม่พบภารกิจที่ตรงกับเงื่อนไข</h3>
                  <p className="text-xs text-slate-500">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูใหม่อีกครั้ง</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#F26430] font-bold hover:underline"
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
                        className={`group/card bg-white rounded-3xl p-4 sm:p-4.5 border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs hover:shadow-md ${
                          isJoined 
                            ? 'border-emerald-300 ring-2 ring-emerald-500/10 bg-emerald-50/15' 
                            : 'border-[#E8E2D8] hover:border-orange-300'
                        }`}
                      >
                        {/* Top Accent Stripe for Official Quests */}
                        {quest.isOfficial && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                        )}

                        {/* Top Row: Category Icon + Badge Label + Official Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
                              quest.category === 'move'
                                ? 'bg-gradient-to-br from-rose-500 to-orange-500'
                                : quest.category === 'heal'
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                : quest.category === 'chill'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {quest.iconName === 'Flame' ? (
                                <Flame className="w-4 h-4" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </span>

                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#4A7C59] block">
                                {quest.category === 'move' ? 'Move' : quest.category === 'heal' ? 'Heal' : quest.category === 'chill' ? 'Chill' : 'Learn'}
                              </span>
                              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{quest.badgeLabel}</span>
                              </span>
                            </div>
                          </div>

                          {quest.isOfficial ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shrink-0 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>ทางการ</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                              👥 ชุมชน
                            </span>
                          )}
                        </div>

                        {/* Title & Goal */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-xs sm:text-sm text-[#1E293B] group-hover/card:text-[#F26430] transition-colors leading-snug">
                            {quest.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {quest.targetGoal}
                          </p>
                        </div>

                        {/* ⏰ 2. ระยะเวลาเริ่ม - สิ้นสุด และเวลานับถอยหลัง */}
                        <div className="flex items-center justify-between text-[10px] font-bold py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-1 text-slate-500 font-mono">
                            <span>📅 {quest.startDate} - {quest.endDate}</span>
                          </span>
                          <span className={`flex items-center gap-1 font-bold ${
                            isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-600'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>เหลือ {quest.daysRemaining} วัน</span>
                          </span>
                        </div>

                        {/* 🏃 3. Bottom Action Bar: State when Joined vs Not Joined */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600">
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              +{quest.rewardPoints} XP
                            </span>
                            <span className="text-slate-400 font-normal">
                              👥 {quest.participantsCount}
                            </span>
                          </div>

                          {isJoined ? (
                            /* State when quest is already active */
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                href="/challenge"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                title="ไปที่ฮับเพื่อส่งหลักฐานเช็คอิน"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>กำลังทำ (ดูฮับ)</span>
                              </Link>
                              
                              <button
                                type="button"
                                onClick={() => setQuestToCancel(quest)}
                                className="text-slate-400 hover:text-rose-600 text-[11px] p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                                title="ยกเลิกภารกิจนี้"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            /* State when quest is available to join */
                            <button
                              type="button"
                              onClick={() => setQuestToJoin(quest)}
                              className="bg-[#F26430] hover:bg-[#D95322] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full transition-all shadow-2xs shadow-[#F26430]/25 flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                            >
                              <span>รับภารกิจ</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Weekly Leaderboard Sidebar */}
            <div className="space-y-4">
              
              {/* Leaderboard Card */}
              <div className="bg-[#FAF7F2] rounded-3xl p-4.5 border border-[#E8E2D8] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#1E293B]">Top 5 ประจำสัปดาห์</h3>
                      <p className="text-[10px] text-slate-400">อัปเดตแต้ม XP ทุกวันอาทิตย์</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    Weekly XP
                  </span>
                </div>

                {/* Top 5 List */}
                <div className="space-y-2 pt-1">
                  {WEEKLY_LEADERBOARD.map((user) => (
                    <div
                      key={user.rank}
                      className="flex items-center justify-between p-2 rounded-2xl bg-white hover:bg-amber-50/40 transition-colors border border-slate-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Rank Medal */}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          user.rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : user.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : user.rank === 3
                            ? 'bg-amber-600/30 text-amber-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {user.rank}
                        </span>

                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />

                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#1E293B] truncate">
                            {user.name}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            Lv.{user.level} • {user.badges} เหรียญ
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-black text-[#F26430] font-mono shrink-0 pl-1">
                        {user.xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* 🛡️ 4. POPUP 1: Confirm Join Quest Modal (Double Confirm) */}
      {questToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-[#E8E2D8] text-center space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
              <Trophy className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-base text-[#1E293B]">
                ยืนยันการรับภารกิจ?
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                คุณกำลังจะรับภารกิจ: <br />
                <strong className="text-[#1E293B]">{questToJoin.title}</strong>
              </p>

              {/* Goal & Rules Summary */}
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] text-left space-y-1.5 text-xs">
                <p className="text-slate-600">
                  🎯 <strong>เป้าหมาย:</strong> {questToJoin.targetGoal}
                </p>
                <p className="text-slate-600 font-mono text-[11px]">
                  📅 <strong>ระยะเวลา:</strong> {questToJoin.startDate} - {questToJoin.endDate} (เหลือ {questToJoin.daysRemaining} วัน)
                </p>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
                  <span>รางวัลเมื่อทำสำเร็จ:</span>
                  <span>+{questToJoin.rewardPoints} XP • เหรียญ {questToJoin.badgeLabel}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                *ระบบจะมอบแต้ม XP และเหรียญรางวัลให้เมื่อทำภารกิจสำเร็จครบ {questToJoin.total} ครั้ง
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuestToJoin(null)}
                className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmJoin}
                className="w-full py-2.5 rounded-full bg-[#F26430] hover:bg-[#D95322] text-white text-xs font-extrabold shadow-md shadow-[#F26430]/25 active:scale-95 cursor-pointer"
              >
                ยืนยันรับภารกิจ 🎉
              </button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
}
