'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  Award,
  Zap,
  Coffee,
  Footprints,
  Flame,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';

interface CommunityChallengeBarProps {
  onJoinQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onOpenCreateModal?: () => void;
}

export const COMMUNITY_PUBLIC_QUESTS: (ChallengeQuest & { image?: string })[] = [
  {
    id: 'comm-quest-1',
    title: 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    iconName: 'Coffee',
    category: 'chill',
    badgeLabel: 'Coffee Explorer',
    badgeIcon: '☕',
    completedCountInfo: '0/3 ร้าน',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'Admin ทีมงาน Hub',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    participantsCount: 235,
    rewardPoints: 300,
    isOfficial: true,
    targetGoal: 'เช็คอินคาเฟ่พาร์ทเนอร์ครบ 3 ร้านใน 14 วัน พร้อมถ่ายรูปแก้วกาแฟลง Moments',
    objective: 'สนับสนุนร้านกาแฟ Specialty ในย่านอารีย์ และสร้างแรงบันดาลใจให้เพื่อนๆ ออกไปสัมผัสบรรยากาศคาเฟ่คราฟต์',
    steps: [
      'เลือกร้านกาแฟพาร์ทเนอร์ย่านอารีย์ในระบบ',
      'สั่งเครื่องดื่มและถ่ายภาพเช็คอินโมเมนต์',
      'สะสมครบ 3 ร้านเพื่อรับเหรียญและคะแนน XP'
    ],
    verificationMethod: '📸 ถ่ายรูปภาพแก้วกาแฟหรือหน้าร้านคู่กับการเช็คอิน GPS',
    rewardsText: '🏅 เหรียญเกียรติยศ "Coffee Explorer" บนหน้าโปรไฟล์ + ⚡ 300 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    id: 'comm-quest-2',
    title: 'BMA Park Run: วิ่งสะสม 3 สวนสาธารณะ',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
    iconName: 'Footprints',
    category: 'move',
    badgeLabel: 'BMA Park Champion',
    badgeIcon: '🏃‍♂️',
    completedCountInfo: '0/3 สวน',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'Admin ทีมงาน Hub',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    participantsCount: 310,
    rewardPoints: 350,
    isOfficial: true,
    targetGoal: 'วิ่งสะสมระยะทางครบ 3 สวนสาธารณะ กทม. (สวนเบญฯ, สวนลุมฯ, สวนรถไฟ)',
    objective: 'กระตุ้นการออกกำลังกายกลางแจ้ง สูดอากาศบริสุทธิ์ในสวนสาธารณะ และสร้างสุขภาพที่แข็งแรง',
    steps: [
      'ไปวิ่งออกกำลังกาย ณ สวนสาธารณะที่ร่วมรายการ',
      'กดเช็คอินพิกัด GPS ผ่านแอปเมื่อเริ่มหรือจบการวิ่ง',
      'วิ่งครบทั้ง 3 สวนเพื่อปลดล็อกเหรียญ'
    ],
    verificationMethod: '📍 ระบบตรวจสอบพิกัด GPS อัตโนมัติในรัศมีสวนสาธารณะ',
    rewardsText: '🏅 เหรียญตรา "BMA Park Champion" สีทอง + ⚡ 350 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    id: 'comm-quest-3',
    title: 'HYROX 10K Running & Workout Prep',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    iconName: 'Flame',
    category: 'move',
    badgeLabel: 'HYROX Warrior',
    badgeIcon: '🔥',
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
    targetGoal: 'วิ่งและออกกำลังกายกลุ่มครบ 4 ครั้งใน 14 วัน เตรียมความพร้อมสู่สนามแข่ง',
    objective: 'ฝึกความอดทนของกล้ามเนื้อและระบบหัวใจร่วมกับคอมมูนิตี้สายฟิตเนส',
    steps: [
      'เข้าร่วมคลาสซ้อม HYROX Community Bootcamp',
      'ฝึกซ้อมแต่ละสถานีตามโปรแกรมของโค้ช',
      'บันทึกสถิติครบ 4 ครั้ง'
    ],
    verificationMethod: '🏋️‍♂️ การยืนยันจากโค้ชผู้จัดกิจกรรม',
    rewardsText: '🏅 เหรียญ "HYROX Warrior" + ⚡ 250 XP',
    startDate: '5 มี.ค. 2026',
    endDate: '28 มี.ค. 2026',
    daysRemaining: 7,
  },
  {
    id: 'comm-quest-4',
    title: 'Morning Yoga 7 Days: ฮีลใจรับอรุณ',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    category: 'heal',
    badgeLabel: 'Yoga Spirit',
    badgeIcon: '🧘',
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
    targetGoal: 'เล่นโยคะยามเช้าหรือฝึกสมาธิต่อเนื่อง 7 วัน เพื่อความสดชื่นและสมดุลจิตใจ',
    objective: 'ปรับสมดุลร่างกายและจิตใจ เริ่มต้นวันใหม่ด้วยสมาธิและความผ่อนคลาย',
    steps: [
      'เล่นโยคะหรือฝึกสมาธิอย่างน้อย 15 นาทีในตอนเช้า',
      'บันทึกการทำกิจกรรมรายวันในแอป',
      'สะสมต่อเนื่องครบ 7 วัน'
    ],
    verificationMethod: '📱 การกดบันทึกเช็คอินรายวันผ่านแอป',
    rewardsText: '🏅 เหรียญ "Yoga Spirit" + ⚡ 200 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '20 มี.ค. 2026',
    daysRemaining: 5,
  },
  {
    id: 'comm-quest-5',
    title: 'Digital Detox 3 Hours: วันหยุดไร้จอมือถือ',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    category: 'chill',
    badgeLabel: 'Mindful Soul',
    badgeIcon: '📵',
    completedCountInfo: '0/3 ชม.',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'K. Ploy',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    participantsCount: 95,
    rewardPoints: 180,
    isOfficial: false,
    targetGoal: 'พักสายตา วางจอมือถือ และเข้าร่วมกิจกรรมพบปะเพื่อนออฟไลน์ 3 ชม.',
    objective: 'ลดความเครียดจากการเสพสื่อดิจิทัล และเปิดรับบทสนทนาจริงกับผู้คนรอบข้าง',
    steps: [
      'เข้าร่วมกิจกรรมออฟไลน์ เช่น บอร์ดเกม งานคราฟต์ หรือเวิร์กช็อป',
      'เปิดโหมดไม่รบกวนตลอดช่วงกิจกรรม 3 ชั่วโมง',
      'ให้โฮสต์สแกนยืนยันการเข้าร่วม'
    ],
    verificationMethod: '🤝 การยืนยันแบบ Peer-to-Peer จากโฮสต์ผู้จัดงาน',
    rewardsText: '🏅 เหรียญ "Mindful Soul" + ⚡ 180 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    id: 'comm-quest-6',
    title: 'Bangkok Art Gallery Walk: ชม 3 แกลเลอรีริมน้ำ',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    category: 'chill',
    badgeLabel: 'Art Collector',
    badgeIcon: '🎨',
    completedCountInfo: '0/3 แห่ง',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'River City Art Club',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    participantsCount: 168,
    rewardPoints: 280,
    isOfficial: true,
    targetGoal: 'เสพงานศิลปะและเช็คอินแกลเลอรีหรือมิวเซียมศิลปะริมแม่น้ำเจ้าพระยาครบ 3 แห่ง',
    objective: 'สนับสนุนวงการศิลปะไทย และสร้างแรงบันดาลใจทางความคิดสร้างสรรค์',
    steps: [
      'เยี่ยมชมแกลเลอรีย่านเจริญกรุง-ตลาดน้อย-คลองสาน',
      'ถ่ายภาพงานนิทรรศการลง Moments',
      'เช็คอินครบ 3 แห่งเพื่อรับเข็มกลัด'
    ],
    verificationMethod: '📸 ภาพถ่ายนิทรรศการคู่กับการเช็คอิน GPS',
    rewardsText: '🏅 เหรียญ "Art Collector" + ⚡ 280 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
  {
    id: 'comm-quest-7',
    title: 'Board Game Master: เล่นครบ 3 บอร์ดเกมใหม่',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
    iconName: 'Award',
    category: 'chill',
    badgeLabel: 'Game Strategist',
    badgeIcon: '🎲',
    completedCountInfo: '0/3 เกม',
    progressPercent: 0,
    current: '0',
    total: '3',
    visibility: 'public',
    creatorName: 'Boardgame Addict',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    participantsCount: 114,
    rewardPoints: 220,
    isOfficial: false,
    targetGoal: 'ทดลองเล่นบอร์ดเกมประเภทวางแผนหรือปาร์ตี้เกมที่ไม่เคยเล่นมาก่อนครบ 3 เกม',
    objective: 'เปิดประสบการณ์การเล่นเกมใหม่ๆ ฝึกกระบวนการคิด และสร้างมิตรภาพผ่านโต๊ะบอร์ดเกม',
    steps: [
      'เข้าร่วมตี้บอร์ดเกมคาเฟ่หรืออีเวนต์คอมมูนิตี้',
      'ร่วมเล่นเกมจนจบกระดานและบันทึกคะแนน',
      'สะสมครบ 3 เกม'
    ],
    verificationMethod: '🎲 ถ่ายรูปกระดานเกมหลังจบการเล่น',
    rewardsText: '🏅 เหรียญ "Game Strategist" + ⚡ 220 XP',
    startDate: '1 มี.ค. 2026',
    endDate: '31 มี.ค. 2026',
    daysRemaining: 10,
  },
];

export const CommunityChallengeBar: React.FC<CommunityChallengeBarProps> = ({
  onJoinQuest,
  joinedQuestTitles = ['Cafe Hunter 5', 'Step Count 30Days', 'Offline 3 Hours'],
  onOpenCreateModal,
}) => {
  const [joinedList, setJoinedList] = useState<string[]>(joinedQuestTitles);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), COMMUNITY_PUBLIC_QUESTS.length - 1));
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      // Scroll by 1 card step for smooth, granular exploration of all 7 cards
      const scrollAmount = cardWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 350);
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const firstCard = scrollContainerRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 320;
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 350);
    }
  };

  const [questProgressMap, setQuestProgressMap] = useState<Record<string, number>>({});
  const [completedList, setCompletedList] = useState<string[]>([]);

  const handleOpenDetailModal = (quest: ChallengeQuest) => {
    setSelectedQuestForModal(quest);
  };

  const handleConfirmJoinModal = (quest: ChallengeQuest) => {
    if (!joinedList.includes(quest.title)) {
      setJoinedList((prev) => [...prev, quest.title]);
      setQuestProgressMap((prev) => ({ ...prev, [quest.title]: prev[quest.title] || 1 }));
      if (onJoinQuest) {
        onJoinQuest(quest.title);
      }
    }
  };

  const handleCancelQuestModal = (quest: ChallengeQuest) => {
    setJoinedList((prev) => prev.filter((t) => t !== quest.title));
    setQuestProgressMap((prev) => {
      const next = { ...prev };
      delete next[quest.title];
      return next;
    });
    setCompletedList((prev) => prev.filter((t) => t !== quest.title));
  };

  const handleSubmitProgressModal = (quest: ChallengeQuest, newCurrent: number) => {
    setQuestProgressMap((prev) => ({ ...prev, [quest.title]: newCurrent }));
    const targetTotal = parseInt(quest.total || '3', 10) || 3;
    if (newCurrent >= targetTotal && !completedList.includes(quest.title)) {
      setCompletedList((prev) => [...prev, quest.title]);
    }
  };

  const getCategoryLabel = (catId?: string) => {
    switch (catId) {
      case 'move':
        return '🏃 Move';
      case 'heal':
        return '🌱 Heal';
      case 'learn':
        return '🎨 Learn';
      case 'chill':
      default:
        return '☕ Chill';
    }
  };

  return (
    <section className="my-8 sm:my-10 space-y-4 relative">
      
      {/* Header Strip: ⚡ Editorial Section 04 Banner (Royal Amber & Gold) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-amber-50/70 via-orange-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-amber-200/70 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-900 flex items-center justify-center text-xs font-black shrink-0 border border-amber-500/30">
              04
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>ชาเลนจ์ & ภารกิจท้าทาย</span>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/80">
                Quests & Badges
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
            ร่วมภารกิจเพื่อสะสมเหรียญ Badge พิเศษ หรือ EXP ประจำตัวเพื่อปลดล็อกสิทธิพิเศษ
          </p>
        </div>

        {/* Right Actions: Clean Glassmorphic Pill Link */}
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-200/90 hover:border-amber-600 rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
        >
          <span>ดูภารกิจทั้งหมด ({COMMUNITY_PUBLIC_QUESTS.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Scrollable Carousel (Manual Swipe / Scroll / Floating Center Arrows, No Auto Slide) */}
      <div className="relative group/carousel">
        
        {/* Floating Left Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          className={`absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          title="เลื่อนไปทางซ้าย"
          aria-label="Previous challenge"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          className={`absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          title="เลื่อนไปทางขวา"
          aria-label="Next challenge"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 -mx-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {COMMUNITY_PUBLIC_QUESTS.map((quest) => {
            const isJoined = joinedList.includes(quest.title);
            const isDone = completedList.includes(quest.title);
            const targetTotal = parseInt(quest.total || '3', 10) || 3;
            const currentProg = questProgressMap[quest.title] || (isJoined ? 1 : 0);

            return (
              <div
                key={quest.id}
                onClick={() => handleOpenDetailModal(quest)}
                className="w-[80vw] sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.75rem)] shrink-0 snap-start bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs hover:shadow-xl hover:border-[#4A7C59]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden group/card cursor-pointer"
              >
                {/* Official Quest Top Accent Stripe */}
                {quest.isOfficial && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4A7C59] via-emerald-400 to-amber-400" />
                )}

                {/* 1. Top Badges Row: Category + Official/Community + XP Token */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-md">
                      {getCategoryLabel(quest.category)}
                    </span>
                    {quest.isOfficial ? (
                      <span
                        title="ชาเลนจ์ทางการที่จัดทำโดย Chill & Connect Hub"
                        className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-300/80"
                      >
                        <Crown className="w-2.5 h-2.5 text-amber-700 fill-amber-500" />
                        <span>Official</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        👥 ชุมชน
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-black text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 shadow-2xs">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>+{quest.rewardPoints} XP</span>
                  </span>
                </div>

                {/* 2. Full Inner Image Banner with Floating Glass Badge */}
                <div className="relative h-28 sm:h-32 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group-hover/card:border-[#4A7C59]/40 transition-colors">
                  <img
                    src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                    alt={quest.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Ambient Dark Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Bottom-Left Floating Glass Medal Badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-md truncate max-w-full">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">เหรียญ {quest.badgeLabel}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Title & Target Description */}
                <div className="space-y-1 flex-1">
                  <h3
                    title={quest.title}
                    className="font-black text-xs sm:text-[13px] text-slate-900 group-hover/card:text-[#4A7C59] transition-colors leading-snug line-clamp-1"
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

                {/* 4. Meta Row: Creator & Participant count + Status Indicator (Clean, No Button) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                    <img
                      src={quest.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={quest.creatorName || ''}
                      className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="truncate text-slate-700 font-medium">{quest.creatorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                        <Trophy className="w-3 h-3" />
                        <span>พิชิตแล้ว</span>
                      </span>
                    ) : isJoined ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{currentProg}/{targetTotal}</span>
                      </span>
                    ) : (
                      <span className="font-bold text-slate-600 flex items-center gap-1 text-[10.5px]">
                        <Users className="w-3 h-3 text-[#4A7C59]" />
                        <span>{quest.participantsCount} คน</span>
                      </span>
                    )}

                    <div className="w-6 h-6 rounded-full bg-slate-50 group-hover/card:bg-[#4A7C59] flex items-center justify-center text-slate-400 group-hover/card:text-white transition-colors shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Pagination Dots Indicator for all 7 Quests */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {COMMUNITY_PUBLIC_QUESTS.map((quest, idx) => (
            <button
              key={quest.id}
              type="button"
              onClick={() => scrollToCard(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-6 bg-[#4A7C59]'
                  : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`ไปยังภารกิจที่ ${idx + 1}: ${quest.title}`}
              aria-label={`Go to quest ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Detail & Confirmation Modal */}
      <JoinChallengeModal
        isOpen={Boolean(selectedQuestForModal)}
        onClose={() => setSelectedQuestForModal(null)}
        quest={selectedQuestForModal}
        onConfirmJoin={handleConfirmJoinModal}
        isAlreadyJoined={selectedQuestForModal ? joinedList.includes(selectedQuestForModal.title) : false}
        onCancelQuest={handleCancelQuestModal}
        onSubmitProgress={handleSubmitProgressModal}
        isCompleted={selectedQuestForModal ? completedList.includes(selectedQuestForModal.title) : false}
      />

    </section>
  );
};
