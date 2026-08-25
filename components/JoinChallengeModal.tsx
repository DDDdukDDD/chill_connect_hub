'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Clock,
  Gift,
  Target,
  Share2,
  Check,
  Crown
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: ChallengeQuest | null;
  onConfirmJoin: (quest: ChallengeQuest) => void;
  isAlreadyJoined?: boolean;
}

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  isOpen,
  onClose,
  quest,
  onConfirmJoin,
  isAlreadyJoined = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !quest || !mounted) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/challenges?quest=${quest.id}`;
      if (navigator.share) {
        navigator.share({
          title: quest.title,
          text: quest.targetGoal || quest.title,
          url: shareUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'move':
        return '🏃‍♂️ ขยับกาย / ออกกำลังกาย';
      case 'heal':
        return '🌱 ฮีลใจ / ธรรมชาติ & พักผ่อน';
      case 'learn':
        return '🎨 เรียนรู้ / งานคราฟต์ & เวิร์กช็อป';
      case 'chill':
      default:
        return '☕ ชิลล์ / พบปะเพื่อน & คาเฟ่';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto flex items-center justify-center p-3.5 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 my-auto max-h-[92vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Calm Forest Green Gradient & Integrated Temporal Context) */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#21432E] via-[#2E583C] to-[#4A7C59] text-white shrink-0 overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Controls: Category Pill, Official Tag & Close Button */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-2xs">
                {getCategoryLabel(quest.category)}
              </span>
              {quest.isOfficial ? (
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Official Quest</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20">
                  👥 ชุมชนสร้างสรรค์
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quest Icon & Title */}
          <div className="mt-4 flex items-start gap-3.5 sm:gap-4 relative z-10">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/95 text-slate-900 shadow-md flex items-center justify-center shrink-0 border border-white/80 text-2xl sm:text-3xl">
              {quest.badgeIcon || (quest.iconName === 'Flame' ? '🔥' : quest.iconName === 'Coffee' ? '☕' : quest.iconName === 'Footprints' ? '👟' : '🏅')}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-2xs">
                {quest.title}
              </h2>

              {/* Integrated Temporal Strip & Highlights (Point 2 & Point 5) */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-white/90 font-medium">
                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20 font-bold">
                  <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
                  <span>+{quest.rewardPoints || 300} XP</span>
                </span>

                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{quest.startDate || '1 มี.ค.'} - {quest.endDate || '31 มี.ค. 2026'}</span>
                </span>

                {quest.daysRemaining !== undefined && (
                  <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-emerald-200" />
                    <span>เหลือ {quest.daysRemaining} วัน</span>
                  </span>
                )}

                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  <Users className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{quest.participantsCount || 150}+ คนร่วมทำ</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body (Clear 4 Real-World Standardized Sections) */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">
          
          {/* 🎯 Section 1: Objective & Purpose */}
          <div className="p-4 rounded-2xl bg-[#F4F7F4] border border-[#DDE7DF] space-y-1.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#4A7C59] shrink-0" />
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                วัตถุประสงค์ & ที่มาของภารกิจ
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-6 font-medium">
              {quest.objective || quest.targetGoal || 'ส่งเสริมการออกไปใช้ชีวิต ทำกิจกรรมสร้างสรรค์ และสร้างแรงบันดาลใจร่วมกับเพื่อนๆ ในคอมมูนิตี้'}
            </p>
          </div>

          {/* 📜 Section 2: Step-by-Step Instructions & Conditions */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <span>ขั้นตอนและเงื่อนไขการทำภารกิจ</span>
            </h4>

            <div className="space-y-2 pl-2 sm:pl-3">
              {(quest.steps && quest.steps.length > 0 ? quest.steps : [
                'ตรวจสอบพิกัดหรือเงื่อนไขของกิจกรรมที่เข้าร่วม',
                'ทำกิจกรรมตามเป้าหมายที่กำหนดให้ครบถ้วน',
                'ส่งหลักฐานเพื่อรับเหรียญรางวัลและคะแนน XP'
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 🔍 Section 3: Verification Method */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4A7C59] shrink-0" />
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                วิธีการตรวจสอบและส่งหลักฐาน (Verification)
              </h4>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed bg-[#EBF5EE] p-3 rounded-xl border border-emerald-200">
              {quest.verificationMethod || '📍 เช็คอินพิกัด GPS จริง หรือ 📸 ถ่ายรูปภาพบรรยากาศคู่กับกิจกรรมเพื่อยืนยันความคืบหน้า'}
            </div>
          </div>

          {/* 🎁 Section 4: Rewards & Perks */}
          <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#4A7C59] shrink-0" />
                <span>ของรางวัล & สิทธิประโยชน์เมื่อทำสำเร็จ</span>
              </h4>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Reward Unlocks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-white rounded-xl border border-emerald-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl shrink-0 border border-emerald-100">
                  {quest.badgeIcon || '🏅'}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">เหรียญตราเกียรติยศ</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">{quest.badgeLabel}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
                  <Zap className="w-5 h-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">แต้มและคะแนน XP</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">+{quest.rewardPoints || 300} XP Points</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 font-medium pl-1">
              ✨ {quest.rewardsText || `เหรียญเกียรติยศ "${quest.badgeLabel}" จะปรากฏบนหน้าโปรไฟล์ของคุณ และสามารถนำแต้มไปแลกรับของรางวัลได้ใน MyHub`}
            </p>
          </div>

        </div>

        {/* Modal Bottom Action Footer (Clean & Focused - Point 1 & Point 5) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title="แชร์ภารกิจให้เพื่อนๆ"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span className="text-[#4A7C59] font-extrabold">คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>แชร์ภารกิจ</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {isAlreadyJoined ? (
              <span className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-300 select-none shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>คุณรับภารกิจนี้แล้ว (กำลังทำ)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onConfirmJoin(quest);
                  onClose();
                }}
                className="px-7 sm:px-9 py-2.5 rounded-xl bg-[#4A7C59] hover:bg-[#3D684A] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Footprints className="w-4 h-4 text-emerald-200" />
                <span>รับภารกิจท้าทายนี้</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
