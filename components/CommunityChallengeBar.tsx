'use client';

import React, { useState, useRef } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';

interface CommunityChallengeBarProps {
  onJoinQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onOpenCreateModal?: () => void;
}

export const COMMUNITY_PUBLIC_QUESTS: ChallengeQuest[] = [
  {
    id: 'comm-quest-1',
    title: 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์',
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
];

export const CommunityChallengeBar: React.FC<CommunityChallengeBarProps> = ({
  onJoinQuest,
  joinedQuestTitles = ['Cafe Hunter 5', 'Step Count 30Days', 'Offline 3 Hours'],
  onOpenCreateModal,
}) => {
  const [joinedList, setJoinedList] = useState<string[]>(joinedQuestTitles);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleOpenDetailModal = (quest: ChallengeQuest) => {
    setSelectedQuestForModal(quest);
  };

  const handleConfirmJoinModal = (quest: ChallengeQuest) => {
    setJoinedList((prev) => [...prev, quest.title]);
    if (onJoinQuest) {
      onJoinQuest(quest.title);
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
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
    <section className="my-6 sm:my-8 bg-white/90 backdrop-blur-xs rounded-3xl p-5 sm:p-7 border border-[#E8E2D8] shadow-xs space-y-5 relative group">
      
      {/* Header Strip (Calm Forest Green & Gold Gamification Branding) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2E583C] to-[#4A7C59] flex items-center justify-center text-white shadow-2xs shrink-0">
            <Trophy className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1E293B] tracking-tight truncate flex items-center gap-1.5">
              <span>ชาเลนจ์ & ภารกิจท้าทาย</span>
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md hidden sm:inline-block">
                Quests
              </span>
            </h2>
            <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
              พิชิตภารกิจสนุกๆ รับเหรียญตราเกียรติยศ และแต้ม XP พิเศษ
            </p>
          </div>
        </div>

        {/* Right Actions: View All */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/challenges"
            className="bg-[#1E293B] hover:bg-[#4A7C59] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Carousel Container with Floating Center Left/Right Buttons */}
      <div className="relative">
        
        {/* Floating Left Button */}
        <button
          onClick={handlePrev}
          className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนซ้าย"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Floating Right Button */}
        <button
          onClick={handleNext}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนขวา"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Horizontal Scrollable Cards (Clean White, Generous Bottom Padding) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-5 pt-1.5 -mx-1 px-1"
        >
          {COMMUNITY_PUBLIC_QUESTS.map((quest) => {
            const isJoined = joinedList.includes(quest.title);

            return (
              <div
                key={quest.id}
                onClick={() => handleOpenDetailModal(quest)}
                className={`w-[310px] sm:w-[340px] md:w-[360px] shrink-0 bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-300 flex flex-col justify-between space-y-3.5 shadow-2xs hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group/card cursor-pointer ${
                  quest.isOfficial
                    ? 'border-slate-200/90 hover:border-[#4A7C59]/40'
                    : 'border-slate-200/90 hover:border-[#4A7C59]/40'
                }`}
              >
                {/* Official Quest Top Accent Stripe */}
                {quest.isOfficial && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4A7C59] via-emerald-400 to-amber-400" />
                )}

                {/* Top Row: Category Tag / Official Tag + XP Pill */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-0.5 rounded-md">
                      {getCategoryLabel(quest.category)}
                    </span>
                    {quest.isOfficial ? (
                      <span
                        title="ชาเลนจ์ทางการที่จัดทำโดย Chill & Connect Hub"
                        className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300/80"
                      >
                        <Crown className="w-3 h-3 text-amber-700 fill-amber-500" />
                        <span>Official</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        👥 ชุมชน
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>+{quest.rewardPoints} XP</span>
                  </span>
                </div>

                {/* Title & 3D Badge Avatar Content */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F4F7F4] border border-[#DDE7DF] flex items-center justify-center shrink-0 shadow-2xs group-hover/card:scale-110 transition-transform text-2xl">
                      {quest.badgeIcon || (quest.iconName === 'Flame' ? '🔥' : quest.iconName === 'Coffee' ? '☕' : quest.iconName === 'Footprints' ? '👟' : '🏅')}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3
                        title={quest.title}
                        className="font-black text-xs sm:text-sm text-[#1E293B] group-hover/card:text-[#4A7C59] transition-colors leading-snug break-words"
                      >
                        {quest.title}
                      </h3>
                      <p
                        title={quest.targetGoal}
                        className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium pt-0.5"
                      >
                        {quest.targetGoal}
                      </p>
                    </div>
                  </div>

                  {/* Clean Reward Badge Block */}
                  <div className="bg-[#F8FAF8] border border-emerald-200/70 p-2 rounded-xl flex items-center gap-2 text-[11px] font-bold text-slate-800">
                    <Award className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <span className="truncate">เหรียญ: {quest.badgeLabel}</span>
                  </div>
                </div>

                {/* Clean Bottom Strip: Creator + Participants Count & Micro-CTA */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                    <img
                      src={quest.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={quest.creatorName || ''}
                      className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="truncate text-slate-700 font-medium">{quest.creatorName}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isJoined ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>กำลังทำ</span>
                      </span>
                    ) : (
                      <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>{quest.participantsCount} คน</span>
                      </span>
                    )}

                    <span className="text-[#4A7C59] font-bold text-[11px] flex items-center gap-0.5 group-hover/card:translate-x-0.5 transition-transform">
                      <span>ดูรายละเอียด</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Detail & Confirmation Modal */}
      <JoinChallengeModal
        isOpen={Boolean(selectedQuestForModal)}
        onClose={() => setSelectedQuestForModal(null)}
        quest={selectedQuestForModal}
        onConfirmJoin={handleConfirmJoinModal}
      />

    </section>
  );
};
