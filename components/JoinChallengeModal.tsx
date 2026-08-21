'use client';

import React from 'react';
import {
  X,
  Trophy,
  Zap,
  Award,
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  Footprints,
  Coffee,
  Sparkles,
  Flame,
  Camera,
  MapPin,
  QrCode,
  Crown
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: ChallengeQuest | null;
  onConfirmJoin: (quest: ChallengeQuest) => void;
}

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  isOpen,
  onClose,
  quest,
  onConfirmJoin,
}) => {
  if (!isOpen || !quest) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-6 h-6 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-6 h-6 text-[#4A7C59]" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-rose-500" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      default:
        return <Trophy className="w-6 h-6 text-[#4A7C59]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Quest Icon & Title */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
            {getIcon(quest.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-md">
                {quest.category === 'move' ? 'ขยับกาย' : quest.category === 'heal' ? 'ฮีลใจ' : quest.category === 'learn' ? 'สร้างสรรค์' : 'ชิลล์'}
              </span>
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                <span>+{quest.rewardPoints || 250} XP</span>
              </span>
              {quest.isOfficial && (
                <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-800" />
                  <span>Official</span>
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B] mt-1 line-clamp-2">
              {quest.title}
            </h3>
          </div>
        </div>

        {/* Quest Goal & Reward Showcase */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">เป้าหมายของภารกิจ:</span>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed">
              {quest.targetGoal || `ทำภารกิจให้สำเร็จครบ ${quest.total || 3} ครั้ง`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D8] text-xs">
            <div className="flex items-center gap-1.5 text-[#F26430] font-bold">
              <Award className="w-4 h-4 shrink-0" />
              <span>เหรียญ: {quest.badgeLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Users className="w-4 h-4 text-[#4A7C59] shrink-0" />
              <span>{quest.participantsCount || 100}+ คนกำลังทำอยู่</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmJoin(quest);
              onClose();
            }}
            className="flex-1 bg-[#F26430] hover:bg-[#d95322] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Footprints className="w-4 h-4 text-orange-200" />
            <span>เข้าร่วมภารกิจนี้ (+{quest.rewardPoints || 250} XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
