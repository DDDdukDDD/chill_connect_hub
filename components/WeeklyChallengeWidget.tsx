'use client';

import React, { useState } from 'react';
import { MOCK_CHALLENGES, ChallengeQuest } from '@/data/mockData';
import { Coffee, Footprints, Users, Flame, Zap, Trophy, ChevronRight, Award, Clock } from 'lucide-react';
import { JoinChallengeModal } from './JoinChallengeModal';
import { RequireMembershipModal } from './RequireMembershipModal';

export const WeeklyChallengeWidget: React.FC = () => {
  const [selectedQuest, setSelectedQuest] = useState<ChallengeQuest | null>(null);
  const [joinedQuestIds, setJoinedQuestIds] = useState<string[]>(['1']);
  const [isRequireModalOpen, setIsRequireModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmJoin = (quest: ChallengeQuest) => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('isLoggedIn');
      if (savedAuth !== 'true') {
        setIsRequireModalOpen(true);
        return;
      }
    }
    if (!joinedQuestIds.includes(quest.id)) {
      setJoinedQuestIds([...joinedQuestIds, quest.id]);
      showToast(`🎉 รับภารกิจ "${quest.title}" เรียบร้อยแล้ว!`);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-emerald-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-300" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] text-white rounded-3xl p-5 sm:p-7 md:p-9 shadow-2xl overflow-hidden border border-slate-700/70 my-8 sm:my-10 relative">
      {/* Subtle Glow Shapes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F26430]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-slate-700/60 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-black bg-gradient-to-r from-[#F26430] to-amber-500 text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Gamification Quests
            </span>
            <span className="text-xs text-slate-400 font-medium">ซีซั่นมีนาคม 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>ชาเลนจ์ & ภารกิจท้าทาย</span>
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm sm:text-right">
          พิชิตภารกิจ รับเหรียญตราเกียรติยศ และแต้ม Connect Points!
        </p>
      </div>

      {/* Row-by-Row Vertical Quest List */}
      <div className="space-y-3.5 pt-5 sm:pt-6 relative z-10">
        {MOCK_CHALLENGES.map((quest, idx) => {
          const isJoined = joinedQuestIds.includes(quest.id);

          return (
            <div
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className="bg-slate-800/70 hover:bg-slate-800 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 hover:border-amber-400/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Left: Number, 3D Badge Icon, Title & Badge */}
              <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
                <span className="text-sm font-black text-slate-500 w-5 text-center shrink-0">
                  #{idx + 1}
                </span>

                {/* 3D Emoji Avatar Badge */}
                <div className="w-11 h-11 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform text-xl">
                  {quest.badgeIcon || getIcon(quest.iconName)}
                </div>

                {/* Title, Badge & XP */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                    {quest.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{quest.badgeLabel}</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-950/60 px-2 py-0.2 rounded-md border border-emerald-500/20">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>+{quest.rewardPoints || 300} XP</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Progress Bar */}
              <div className="flex-1 w-full space-y-1.5 px-0 md:px-4">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span className="text-[11px] text-slate-400 font-medium">{quest.completedCountInfo}</span>
                  <span className="text-amber-300 font-bold">{quest.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quest.iconName === 'Flame'
                        ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                        : quest.iconName === 'Coffee'
                        ? 'bg-gradient-to-r from-[#F26430] to-orange-400'
                        : quest.iconName === 'Footprints'
                        ? 'bg-gradient-to-r from-[#4A7C59] to-emerald-400'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${quest.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Right: CTA Button */}
              <div className="shrink-0 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedQuest(quest);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400/90 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer ml-auto"
                >
                  <span>ดูรายละเอียด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quest Detail Modal */}
      {selectedQuest && (
        <JoinChallengeModal
          isOpen={!!selectedQuest}
          onClose={() => setSelectedQuest(null)}
          quest={selectedQuest}
          onConfirmJoin={handleConfirmJoin}
          isAlreadyJoined={joinedQuestIds.includes(selectedQuest.id)}
        />
      )}

      {/* Free Membership Modal */}
      <RequireMembershipModal
        isOpen={isRequireModalOpen}
        onClose={() => setIsRequireModalOpen(false)}
        onOpenLogin={() => {
          setIsRequireModalOpen(false);
          window.location.href = '/onboarding';
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
};

