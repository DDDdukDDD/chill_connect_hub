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
  PlusCircle,
  ShieldCheck,
  Crown,
  Eye
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
    targetGoal: 'เช็คอินคาเฟ่พาร์ทเนอร์ครบ 3 ร้านใน 14 วัน',
    badgeLabel: 'Coffee Explorer',
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
  },
  {
    id: 'comm-quest-2',
    title: 'BMA Park Run: วิ่งสะสม 3 สวนสาธารณะ',
    iconName: 'Footprints',
    category: 'move',
    targetGoal: 'วิ่งสะสมระยะทางครบ 3 สวนสาธารณะ กทม.',
    badgeLabel: 'BMA Park Champion',
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
  },
  {
    id: 'comm-quest-3',
    title: 'HYROX 10K Running & Workout Prep',
    iconName: 'Flame',
    category: 'move',
    targetGoal: 'วิ่งและออกกำลังกายกลุ่มครบ 4 ครั้งใน 14 วัน',
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
  },
  {
    id: 'comm-quest-5',
    title: 'Digital Detox 3 Hours: วันหยุดไร้จอมือถือ',
    iconName: 'Sparkles',
    category: 'chill',
    targetGoal: 'พักสายตาและเข้าร่วมกิจกรรมออฟไลน์ 3 ชม.',
    badgeLabel: 'Zen Master',
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-[#4A7C59]" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Trophy className="w-4 h-4 text-[#4A7C59]" />;
    }
  };

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

  return (
    <section className="my-8 space-y-3 relative group">
      
      {/* Header Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-[#F26430] flex items-center justify-center text-white shadow-2xs shrink-0">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1E293B] tracking-tight truncate flex items-center gap-1.5">
              <span>ชาเลนจ์ & ภารกิจท้าทาย</span>
              <span className="text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md hidden sm:inline-block">
                Quests
              </span>
            </h2>
          </div>
        </div>

        {/* Right Actions: Create Challenge & View All */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="bg-white hover:bg-slate-50 text-[#4A7C59] border border-[#4A7C59]/30 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">สร้างชาเลนจ์</span>
            </button>
          )}

          <Link
            href="/challenge"
            className="bg-[#1E293B] hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>ทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Carousel Container with Floating Center Left/Right Buttons */}
      <div className="relative">
        
        {/* Floating Left Button */}
        <button
          onClick={handlePrev}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนซ้าย"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Floating Right Button */}
        <button
          onClick={handleNext}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนขวา"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Horizontal Scrollable Cards (Proportional size matching Main Cards) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-0.5 -mx-1 px-1"
        >
          {COMMUNITY_PUBLIC_QUESTS.map((quest) => {
            const isJoined = joinedList.includes(quest.title);

            return (
              <div
                key={quest.id}
                onClick={() => handleOpenDetailModal(quest)}
                className={`w-[280px] sm:w-[310px] md:w-[320px] shrink-0 bg-white rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-2xs hover:shadow-md relative overflow-hidden group cursor-pointer ${
                  quest.isOfficial
                    ? 'border-amber-300/80 ring-1 ring-amber-400/20 bg-gradient-to-b from-amber-50/20 via-white to-white'
                    : 'border-[#E8E2D8]'
                }`}
              >
                {/* Top Row: Official Tag (with Tooltip) or Category Tag + XP Pill */}
                <div className="flex items-center justify-between gap-1.5">
                  {quest.isOfficial ? (
                    <span
                      title="ชาเลนจ์ทางการที่จัดทำและรับรองโดยทีมงาน Chill & Connect Hub"
                      className="text-[10px] font-black text-amber-900 bg-gradient-to-r from-amber-200 to-amber-300 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs cursor-help"
                    >
                      <Crown className="w-3 h-3 text-amber-800" />
                      <span>Official</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {quest.category === 'move' ? 'ขยับกาย' : quest.category === 'heal' ? 'ฮีลใจ' : quest.category === 'learn' ? 'สร้างสรรค์' : 'ชิลล์'}
                    </span>
                  )}

                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>+{quest.rewardPoints} XP</span>
                  </span>
                </div>

                {/* Title & Goal Content */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
                      {getIcon(quest.iconName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        title={quest.title}
                        className="font-extrabold text-sm sm:text-base text-[#1E293B] group-hover:text-[#F26430] transition-colors line-clamp-1 leading-snug"
                      >
                        {quest.title}
                      </h3>
                      <p
                        title={quest.targetGoal}
                        className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed"
                      >
                        {quest.targetGoal}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#F26430] font-bold pt-1">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{quest.badgeLabel}</span>
                  </div>
                </div>

                {/* Bottom Strip: Creator + Action Button */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <img
                        src={quest.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={quest.creatorName || ''}
                        className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <span className="truncate text-slate-700 font-medium">{quest.creatorName}</span>
                    </div>

                    <span className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3 text-[#4A7C59]" />
                      <span>{quest.participantsCount} คน</span>
                    </span>
                  </div>

                  {/* Clean Action Button (Coral Orange #F26430) */}
                  {isJoined ? (
                    <div className="w-full bg-emerald-50 text-[#4A7C59] border border-emerald-200/80 py-2 rounded-xl text-center text-xs font-extrabold flex items-center justify-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>กำลังทำภารกิจ</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailModal(quest);
                      }}
                      className="w-full bg-[#F26430] hover:bg-[#d95322] text-white font-extrabold text-xs py-2 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-200" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  )}
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
