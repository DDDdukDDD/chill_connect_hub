'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Trophy,
  Gift,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { COMMUNITY_PUBLIC_QUESTS } from '@/components/CommunityChallengeBar';
import { ChallengeQuest } from '@/data/mockData';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';

interface DailyQuestXPStripProps {
  onJoinQuest?: (questTitle: string) => void;
  joinedQuestTitles?: string[];
  onCancelQuest?: (questTitle: string) => void;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

interface StripItem {
  id: string;
  type: 'quest' | 'tip';
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  subtitle?: string;
  xp?: number;
  participantsCount?: number;
  questData?: ChallengeQuest;
  linkUrl: string;
  linkLabel: string;
}

export const DailyQuestXPStrip: React.FC<DailyQuestXPStripProps> = ({
  onJoinQuest,
  joinedQuestTitles = [],
  onCancelQuest,
  isLoggedIn = false,
  onOpenLogin,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedQuestForModal, setSelectedQuestForModal] = useState<ChallengeQuest | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Curated blend of Quests and Inspiring XP/Rewards Tips
  const stripItems: StripItem[] = [
    {
      id: 'item-quest-1',
      type: 'quest',
      tag: 'เควสต์แนะนำ',
      tagColor: 'text-purple-900',
      tagBg: 'bg-purple-100/90 border-purple-200',
      title: COMMUNITY_PUBLIC_QUESTS[0]?.title || 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์',
      xp: COMMUNITY_PUBLIC_QUESTS[0]?.rewardPoints || 300,
      participantsCount: COMMUNITY_PUBLIC_QUESTS[0]?.participantsCount || 235,
      questData: COMMUNITY_PUBLIC_QUESTS[0],
      linkUrl: '/challenges',
      linkLabel: 'ดูภารกิจทั้งหมด',
    },
    {
      id: 'item-tip-1',
      type: 'tip',
      tag: 'ระบบสะสม XP',
      tagColor: 'text-emerald-900',
      tagBg: 'bg-[#EBF3ED] border-emerald-200',
      title: 'ยิ่งออกไปใช้ชีวิต ยิ่งได้แต้ม: เช็คอินสถานที่และทำภารกิจเพื่อสะสม XP ปลดล็อกเหรียญตราบนโปรไฟล์',
      linkUrl: '/challenges',
      linkLabel: 'ดูวิธีเก็บ XP',
    },
    {
      id: 'item-quest-2',
      type: 'quest',
      tag: 'เควสต์แนะนำ',
      tagColor: 'text-purple-900',
      tagBg: 'bg-purple-100/90 border-purple-200',
      title: COMMUNITY_PUBLIC_QUESTS[1]?.title || 'BMA Park Run: วิ่งสะสม 3 สวนสาธารณะ',
      xp: COMMUNITY_PUBLIC_QUESTS[1]?.rewardPoints || 350,
      participantsCount: COMMUNITY_PUBLIC_QUESTS[1]?.participantsCount || 310,
      questData: COMMUNITY_PUBLIC_QUESTS[1],
      linkUrl: '/challenges',
      linkLabel: 'ดูภารกิจทั้งหมด',
    },
    {
      id: 'item-tip-2',
      type: 'tip',
      tag: 'แลกของรางวัล',
      tagColor: 'text-amber-900',
      tagBg: 'bg-amber-100/90 border-amber-200',
      title: 'แต้ม XP มีค่า: สะสมคะแนนนำไปแลกรับของรางวัล ส่วนลดคาเฟ่ และสิทธิพิเศษใน Rewards Hub',
      linkUrl: '/rewards',
      linkLabel: 'สำรวจ Rewards Hub',
    },
    {
      id: 'item-quest-3',
      type: 'quest',
      tag: 'เควสต์แนะนำ',
      tagColor: 'text-purple-900',
      tagBg: 'bg-purple-100/90 border-purple-200',
      title: COMMUNITY_PUBLIC_QUESTS[2]?.title || 'Art Gallery Hop: ชมนิทรรศการศิลปะ 2 แห่ง',
      xp: COMMUNITY_PUBLIC_QUESTS[2]?.rewardPoints || 250,
      participantsCount: COMMUNITY_PUBLIC_QUESTS[2]?.participantsCount || 180,
      questData: COMMUNITY_PUBLIC_QUESTS[2],
      linkUrl: '/challenges',
      linkLabel: 'ดูภารกิจทั้งหมด',
    },
    {
      id: 'item-tip-3',
      type: 'tip',
      tag: 'คอมมูนิตี้ไลฟ์สไตล์',
      tagColor: 'text-orange-950',
      tagBg: 'bg-orange-100/90 border-orange-200',
      title: 'ชวนเพื่อนลุยเควสต์: ทุกภารกิจทำเดี่ยวก็ได้ หรือจะชวนเพื่อนในคอมมูนิตี้ไปลุยด้วยกันก็สนุกคูณสอง',
      linkUrl: '/community',
      linkLabel: 'หาเพื่อนร่วมก๊วน',
    },
  ];

  const currentItem = stripItems[currentIndex] || stripItems[0];
  const isQuestJoined = currentItem.questData
    ? joinedQuestTitles.includes(currentItem.questData.title)
    : false;

  // Auto-cycle smoothly every 7 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stripItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, stripItems.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + stripItems.length) % stripItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % stripItems.length);
  };

  const handleItemClick = () => {
    if (currentItem.type === 'quest' && currentItem.questData) {
      setSelectedQuestForModal(currentItem.questData);
    }
  };

  return (
    <>
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-amber-50/60 border border-purple-200/70 shadow-2xs hover:shadow-xs transition-all duration-200"
      >
        {/* Subtle Top Accent Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-400 opacity-60" />

        <div className="p-2 sm:p-2.5 px-3 sm:px-4 flex items-center justify-between gap-3">
          {/* Left: Tag & Content */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            {/* Rotating Message & Quest Details */}
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
              {/* Category Tag & XP badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] sm:text-[11px] font-black border px-2 py-0.5 rounded-md uppercase tracking-wider ${currentItem.tagColor} ${currentItem.tagBg}`}
                >
                  {currentItem.tag}
                </span>

                {currentItem.type === 'quest' && currentItem.xp && (
                  <span className="text-[10px] sm:text-[11px] font-black text-amber-900 bg-amber-100/90 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <span>+{currentItem.xp} XP</span>
                  </span>
                )}
              </div>

              {/* Main Text Content */}
              {currentItem.type === 'quest' ? (
                <button
                  type="button"
                  onClick={handleItemClick}
                  className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-purple-700 transition-colors truncate cursor-pointer group flex items-center gap-1.5"
                  title="คลิกเพื่อดูเงื่อนไขภารกิจ"
                >
                  <span className="truncate">{currentItem.title}</span>
                  {isQuestJoined ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md shrink-0">
                      เข้าร่วมแล้ว
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:inline" />
                  )}
                </button>
              ) : (
                <Link
                  href={currentItem.linkUrl}
                  className="text-left font-medium text-xs sm:text-sm text-slate-700 hover:text-slate-950 transition-colors truncate group flex items-center gap-1.5"
                  title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
                >
                  <span className="truncate">{currentItem.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:inline" />
                </Link>
              )}

              {/* Participant count on large screen */}
              {currentItem.participantsCount && (
                <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 font-medium shrink-0">
                  <Users className="w-3 h-3 text-slate-300" />
                  <span>{currentItem.participantsCount} คน</span>
                </div>
              )}
            </div>

            {/* Next / Prev Stepper */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                title="ก่อนหน้า"
              >
                <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                title="ถัดไป"
              >
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Clean Single Direct Link */}
          <div className="flex items-center shrink-0">
            <Link
              href={currentItem.linkUrl}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-700 hover:text-purple-800 transition-colors whitespace-nowrap group px-1 py-1"
            >
              <span className="hidden sm:inline">{currentItem.linkLabel}</span>
              <span className="sm:hidden">ดูทั้งหมด</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-purple-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quest Detail Modal (Opens when user clicks on a quest) */}
      <JoinChallengeModal
        isOpen={Boolean(selectedQuestForModal)}
        onClose={() => setSelectedQuestForModal(null)}
        quest={selectedQuestForModal}
        onConfirmJoin={(q) => {
          if (!isLoggedIn) {
            if (onOpenLogin) onOpenLogin();
            return;
          }
          if (onJoinQuest) onJoinQuest(q.title);
        }}
        isAlreadyJoined={
          selectedQuestForModal
            ? (joinedQuestTitles || []).includes(selectedQuestForModal.title)
            : false
        }
        onCancelQuest={(q) => {
          if (onCancelQuest) onCancelQuest(q.title);
        }}
      />
    </>
  );
};
