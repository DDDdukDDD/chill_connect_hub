'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  Trophy,
  Zap,
  Calendar,
  Clock,
  Users,
  Camera,
  MapPin,
  QrCode,
  AlertTriangle,
  UploadCloud,
  Check,
  Share2,
  Crown,
  Ticket,
  Gift,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';

export interface QuestRewardProfile {
  type: 'brand_partner' | 'hub_central';
  title: string;
  partnerName: string;
  voucherCodePrefix?: string;
  exclusiveNotice?: string;
  terms?: string;
  hubRewardNote?: string;
}

export type BrandVoucherReward = QuestRewardProfile;

export function getQuestBrandReward(quest: any): QuestRewardProfile {
  if (quest?.brandReward) return quest.brandReward;

  const id = quest?.id || '';
  const title = quest?.title || '';

  // 1. Brand Partner Quest: Ari Specialty Coffee Club
  if (id === 'comm-quest-1' || title.includes('Coffee') || title.includes('กาแฟ') || title.includes('อารีย์')) {
    return {
      type: 'brand_partner',
      title: 'ฟรี Signature Cold Brew 1 แก้ว (มูลค่า 140.-)',
      partnerName: 'Ari Specialty Coffee Club',
      voucherCodePrefix: 'ARI-BREW-',
      exclusiveNotice: 'สิทธิ์เฉพาะหน้าร้าน Ari Specialty Coffee Club ทุกสาขาเท่านั้น (แบรนด์อื่นไม่สามารถใช้ได้)',
      terms: 'แสดง QR Code หน้าร้านก่อนสั่งเครื่องดื่ม จำกัด 1 สิทธิ์/ท่าน มีอายุ 30 วันหลังพิชิตภารกิจ',
    };
  }

  // 2. Brand Partner Quest: BMA Sports Hub
  if (id === 'comm-quest-2' || title.includes('Park Run') || title.includes('สวน')) {
    return {
      type: 'brand_partner',
      title: 'สิทธิ์วิ่งฟรี BMA City Mini Marathon 2026 พร้อมเสื้อ Finisher',
      partnerName: 'BMA Sports Hub (สำนักการกีฬา กทม.)',
      voucherCodePrefix: 'BMA-RUN-',
      exclusiveNotice: 'สิทธิ์เฉพาะงานวิ่งในสังกัด BMA Sports กรุงเทพมหานครเท่านั้น',
      terms: 'ใช้รหัสลงทะเบียนผ่านเว็บไซต์งานวิ่ง BMA Marathon ภายในวันที่กำหนด',
    };
  }

  // 3. Brand Partner Quest: HYROX Thailand
  if (id === 'comm-quest-3' || title.includes('HYROX')) {
    return {
      type: 'brand_partner',
      title: 'ส่วนลด 20% อุปกรณ์ซ้อม HYROX Official Training Gear',
      partnerName: 'HYROX Thailand',
      voucherCodePrefix: 'HYROX-GEAR-',
      exclusiveNotice: 'สิทธิ์เฉพาะช่องทาง Official Store ของ HYROX Thailand เท่านั้น',
      terms: 'กรอกรหัสส่วนลดตอน Checkout หรือแสดงบาร์โค้ดที่ Pop-up Store',
    };
  }

  // 4. Hub Central Challenge: Morning Yoga (กิจกรรมกลางของ Hub)
  if (id === 'comm-quest-4' || title.includes('Yoga') || title.includes('โยคะ')) {
    return {
      type: 'hub_central',
      title: 'แต้มสะสมอิสระ + ปลดล็อกของรางวัลใน Hub Rewards',
      partnerName: 'Chill & Connect Hub',
      hubRewardNote: 'รับแต้ม Boosted XP ก้อนใหญ่สำหรับยกระดับเลเวลบัญชี และนำแต้มไปเลือกแลกของรางวัลในศูนย์กลาง (/rewards) ได้อย่างอิสระตามใจชอบ',
      terms: 'สามารถนำแต้ม XP สะสมไปแลกรับของรางวัลที่ร่วมรายการในหน้าศูนย์ของรางวัล (/rewards) ได้ทันที',
    };
  }

  // 5. Hub Central Challenge: Digital Detox (กิจกรรมกลางของ Hub)
  if (id === 'comm-quest-5' || title.includes('Detox') || title.includes('มือถือ')) {
    return {
      type: 'hub_central',
      title: 'แต้มสะสมอิสระ + ปลดล็อกของรางวัลใน Hub Rewards',
      partnerName: 'Chill & Connect Hub',
      hubRewardNote: 'รับแต้มพิเศษอัปเลเวลโปรไฟล์ พร้อมสิทธิ์เลือกแลกเซ็ตชาหรือเครื่องดื่มฟรีในคลังของรางวัลกลาง',
      terms: 'นำแต้ม XP ที่ได้รับไปแลกรับสิทธิ์ที่หน้าศูนย์ของรางวัล (/rewards)',
    };
  }

  // 6. Brand Partner Quest: River City Bangkok
  if (id === 'comm-quest-6' || title.includes('Gallery') || title.includes('ศิลปะ') || title.includes('แกลเลอรี')) {
    return {
      type: 'brand_partner',
      title: 'บัตรเข้าชม Exclusive Art Exhibition ฟรี 1 ใบ (มูลค่า 350.-)',
      partnerName: 'River City Bangkok',
      voucherCodePrefix: 'RCB-ART-',
      exclusiveNotice: 'สิทธิ์เฉพาะที่ริเวอร์ ซิตี้ แบงค็อก (River City Bangkok) เท่านั้น',
      terms: 'ยื่นรับบัตรเข้าชมนิทรรศการพิเศษได้ที่เคาน์เตอร์ Information ริเวอร์ ซิตี้ แบงค็อก',
    };
  }

  // 7. Brand Partner Quest: Thailand Board Game Club
  if (id === 'comm-quest-7' || title.includes('Board Game') || title.includes('บอร์ดเกม')) {
    return {
      type: 'brand_partner',
      title: 'ฟรี ชั่วโมงเล่นบอร์ดเกม 2 ชั่วโมง หรือส่วนลดซื้อบอร์ดเกม 15%',
      partnerName: 'Thailand Board Game Club',
      voucherCodePrefix: 'TBG-PLAY-',
      exclusiveNotice: 'ใช้ได้เฉพาะร้านบอร์ดเกมคาเฟ่ในเครือ Thailand Board Game Club เท่านั้น',
      terms: 'แสดงหน้าบัตรก่อนเริ่มเปิดโต๊ะเล่นเกม',
    };
  }

  // 8. Brand Partner Quest: PUBAT Bookworm (งานสัปดาห์หนังสือแห่งชาติ)
  if (id === 'quest-off-3' || title.includes('Book') || title.includes('หนังสือ')) {
    return {
      type: 'brand_partner',
      title: 'คูปองเงินสด 100 บาท ใช้ซื้อหนังสือในงานสัปดาห์หนังสือแห่งชาติ QSNCC',
      partnerName: 'PUBAT Thailand (สมาคมผู้จัดพิมพ์ฯ)',
      voucherCodePrefix: 'PUBAT-BOOK-',
      exclusiveNotice: 'ใช้ได้เฉพาะบูธหนังสือที่ร่วมรายการ ณ ศูนย์ฯ สิริกิติ์ (QSNCC) เท่านั้น',
      terms: 'แสดงบาร์โค้ดต่อพนักงานแคชเชียร์ก่อนชำระเงิน',
    };
  }

  // 9. Hub Central Challenge: Sound Bath & Zen Inner Peace (กิจกรรมกลางของ Hub)
  if (id === 'quest-off-4' || title.includes('Sound Bath') || title.includes('สมาธิ')) {
    return {
      type: 'hub_central',
      title: 'เหรียญตราทองเกียรติยศ + แต้มสะสมอิสระ Hub Rewards',
      partnerName: 'Chill & Connect Hub',
      hubRewardNote: 'ปลดล็อกเหรียญทอง Zen Inner Peace ลงบนโปรไฟล์ และรับแต้มสะสมเลือกของรางวัลในศูนย์กลาง',
      terms: 'นำแต้ม XP ไปแลกรับสิทธิ์เวิร์กช็อปหรือของพรีเมียมในศูนย์ของรางวัล',
    };
  }

  // Fallback: Hub Central Challenge
  return {
    type: 'hub_central',
    title: 'แต้มสะสมอิสระ + ปลดล็อกของรางวัลใน Hub Rewards',
    partnerName: 'Chill & Connect Hub',
    hubRewardNote: 'ภารกิจกิจกรรมกลางของระบบ รับแต้มสะสมอิสระเพื่อนำไปเลือกแลกของรางวัลในหน้า /rewards',
    terms: 'นำแต้ม XP ไปเลือกของรางวัลที่ต้องการได้ตลอดเวลา',
  };
}

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: ChallengeQuest | null;
  onConfirmJoin?: (quest: ChallengeQuest) => void;
  isAlreadyJoined?: boolean;
  onCancelQuest?: (quest: ChallengeQuest) => void;
  onSubmitProgress?: (quest: ChallengeQuest, newCurrent: number) => void;
  isCompleted?: boolean;
}

function cleanEmojiPrefix(text: string): string {
  if (!text) return '';
  // Remove leading emojis, symbols, and whitespace
  return text.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s*•\-_]+/u, '').trim();
}

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  isOpen,
  onClose,
  quest,
  onConfirmJoin,
  isAlreadyJoined = false,
  onCancelQuest,
  onSubmitProgress,
  isCompleted = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const brandReward = useMemo(() => quest ? getQuestBrandReward(quest) : null, [quest]);

  // Journey States
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitProof, setShowSubmitProof] = useState(false);
  const [selectedProofType, setSelectedProofType] = useState<'gps' | 'photo' | 'host'>('gps');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

  // Local simulated progress
  const targetTotal = quest ? (parseInt(quest.total || '3', 10) || 3) : 3;
  const [currentProgress, setCurrentProgress] = useState(
    quest ? (parseInt(quest.current || '0', 10) || (isAlreadyJoined ? 1 : 0)) : 0
  );
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (quest) {
      setShowCancelConfirm(false);
      setShowSubmitProof(false);
      setPhotoPreview(null);
      setProofNote('');
      setSubmitSuccessMessage(null);
      const parsedCurrent = parseInt(quest.current || '0', 10) || (isAlreadyJoined ? 1 : 0);
      setCurrentProgress(parsedCurrent);
      setLocalCompleted(isCompleted || parsedCurrent >= targetTotal);
    }
  }, [quest, isAlreadyJoined, isCompleted, targetTotal]);

  if (!isOpen || !quest || !mounted) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/challenges?quest=${quest.id}`;
      if (navigator.share) {
        navigator.share({
          title: quest.title,
          text: quest.targetGoal || quest.title,
          url: shareUrl,
        }).catch(() => { });
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
        return 'ขยับกาย & สปอร์ต';
      case 'heal':
        return 'ฮีลใจ & ธรรมชาติ';
      case 'learn':
        return 'เรียนรู้ & เวิร์กช็อป';
      case 'chill':
      default:
        return 'คาเฟ่ & ชิลล์';
    }
  };

  const handleSimulateSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const nextCount = Math.min(targetTotal, currentProgress + 1);
      setCurrentProgress(nextCount);

      if (nextCount >= targetTotal) {
        setLocalCompleted(true);
        setSubmitSuccessMessage(`ยินดีด้วย! คุณพิชิตภารกิจครบ ${targetTotal}/${targetTotal} และปลดล็อกเหรียญ "${quest.badgeLabel}" สำเร็จแล้ว!`);
      } else {
        setSubmitSuccessMessage(`บันทึกหลักฐานสำเร็จ! ความคืบหน้าสะสมเป็น ${nextCount}/${targetTotal}`);
      }

      if (onSubmitProgress) {
        onSubmitProgress(quest, nextCount);
      }

      setTimeout(() => {
        setShowSubmitProof(false);
        setSubmitSuccessMessage(null);
      }, 2000);
    }, 900);
  };

  const handleConfirmCancel = () => {
    if (onCancelQuest) {
      onCancelQuest(quest);
    }
    setShowCancelConfirm(false);
    onClose();
  };

  const progressPercent = Math.min(100, Math.round((currentProgress / targetTotal) * 100));
  const cleanedVerification = cleanEmojiPrefix(quest.verificationMethod || 'ระบบตรวจสอบพิกัด GPS อัตโนมัติ หรือส่งภาพถ่ายคู่กับกิจกรรมเพื่อยืนยัน');

  const formattedRewardsNote = (() => {
    if (!quest.rewardsText) {
      return 'เมื่อพิชิตภารกิจสำเร็จ ระบบจะมอบเหรียญตราประจำภารกิจและสะสมคะแนน XP เข้าสู่โปรไฟล์ของคุณโดยอัตโนมัติ';
    }
    const stripped = cleanEmojiPrefix(quest.rewardsText);
    if (stripped.includes('+') && (stripped.includes('XP') || stripped.includes('xp'))) {
      return 'เมื่อพิชิตภารกิจสำเร็จ ระบบจะมอบเหรียญตราประจำภารกิจและสะสมคะแนน XP เข้าสู่โปรไฟล์ของคุณโดยอัตโนมัติ';
    }
    return stripped;
  })();

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto flex items-center justify-center p-3.5 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in font-sans">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 my-auto max-h-[92vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header: Royal Violet Signature */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#2E1065] via-[#4C1D95] to-[#7C3AED] text-white shrink-0 overflow-hidden">
          {/* Subtle Ambient Glow Shapes */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-36 h-36 bg-violet-300/15 rounded-full blur-xl pointer-events-none" />

          {/* Top Controls: Category Pill, Official Tag & Close Button */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-2xs">
                {getCategoryLabel(quest.category)}
              </span>

              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Official Quest</span>
              </span>

              {/* Status Badge */}
              {localCompleted ? (
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-300 text-amber-950 shadow-xs flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>พิชิตภารกิจแล้ว</span>
                </span>
              ) : isAlreadyJoined ? (
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-300 text-purple-950 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse" />
                  <span>กำลังทำภารกิจ</span>
                </span>
              ) : null}
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
              {quest.badgeIcon || '⚡'}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-2xs">
                {quest.title}
              </h2>

              {/* Clean Integrated Metadata Strip */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-white/90 font-medium">
                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20 font-bold text-amber-200">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>+{quest.rewardPoints || 300} XP</span>
                </span>

                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  <Calendar className="w-3.5 h-3.5 text-purple-200" />
                  <span>{quest.startDate || '1 มี.ค.'} - {quest.endDate || '31 มี.ค. 2026'}</span>
                </span>

                {quest.daysRemaining !== undefined && (
                  <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-purple-200" />
                    <span>เหลือ {quest.daysRemaining} วัน</span>
                  </span>
                )}

                <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  <Users className="w-3.5 h-3.5 text-purple-200" />
                  <span>{quest.participantsCount || 150}+ คนร่วมทำ</span>
                </span>
              </div>
            </div>
          </div>

          {/* Real-time In-Progress Ribbon (When Already Joined) */}
          {(isAlreadyJoined || localCompleted) && (
            <div className="mt-4 p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>ความคืบหน้าของคุณ</span>
                <span className="font-extrabold text-amber-200">
                  {currentProgress} / {targetTotal} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-amber-300 via-purple-200 to-white rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">

          {/* 🎉 Unlocked Brand Voucher Pass (When Completed - Brand Partner Quest) */}
          {(localCompleted || isCompleted) && brandReward && brandReward.type === 'brand_partner' && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 via-purple-50/40 to-amber-50/60 rounded-3xl border-2 border-amber-300 shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                    🎟️
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                      Brand Privilege Unlocked
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      คุณได้รับสิทธิพิเศษจาก {brandReward.partnerName}
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
                  ✓ พร้อมใช้งาน
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">รางวัลสิทธิ์พิเศษของคุณ:</span>
                    <h5 className="font-black text-xs sm:text-sm text-slate-900">
                      {brandReward.title}
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                    {brandReward.partnerName}
                  </span>
                </div>
                
                {/* Voucher Code & QR simulation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">รหัสสิทธิ์สำหรับใช้หน้าร้าน:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-[#7C3AED] tracking-wider select-all">
                      {brandReward.voucherCodePrefix || 'CCH-'}88492
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>แสดงสิทธิ์</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[10.5px] text-amber-900 font-medium leading-relaxed">
                  <strong>🔒 ข้อกำหนดการใช้สิทธิ์:</strong> {brandReward.exclusiveNotice}
                </div>
              </div>
            </div>
          )}

          {/* 🏆 Unlocked Hub Central Achievement Pass (When Completed - Hub Central Challenge) */}
          {(localCompleted || isCompleted) && brandReward && brandReward.type === 'hub_central' && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50 via-indigo-50/40 to-emerald-50/30 rounded-3xl border-2 border-purple-300 shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    🏆
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 bg-purple-200/80 px-2 py-0.5 rounded-md">
                      Hub Official Achievement
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      คุณพิชิตภารกิจกลางของระบบสำเร็จ!
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
                  ✓ สำเร็จเรียบร้อย
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-purple-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">รางวัลความสำเร็จของคุณ:</span>
                    <h5 className="font-black text-xs sm:text-sm text-purple-950">
                      {brandReward.title}
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    Chill & Connect Hub
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {brandReward.hubRewardNote || 'คุณได้รับคะแนน XP ก้อนใหญ่เรียบร้อยแล้ว! สามารถนำแต้มสะสมทั้งหมดในบัญชีไปเลือกแลกรับของรางวัลที่ชอบในศูนย์ของรางวัลกลางได้ทันที'}
                </p>

                <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                  <Link
                    href="/rewards"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>ไปเลือกของรางวัลใน Rewards Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    +{quest.rewardPoints || 300} XP ได้รับแล้ว
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submission Sheet Mode */}
          {showSubmitProof ? (
            <div className="p-5 rounded-3xl bg-purple-50/40 border border-purple-100 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#7C3AED]" />
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    ส่งหลักฐานความคืบหน้าภารกิจ (ครั้งที่ {currentProgress + 1}/{targetTotal})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubmitProof(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ย้อนกลับ
                </button>
              </div>

              {/* Success Message Banner */}
              {submitSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccessMessage}</span>
                </div>
              )}

              {/* Select Submission Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">เลือกรูปแบบการส่งหลักฐาน:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProofType('gps')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${selectedProofType === 'gps'
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px]">พิกัด GPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProofType('photo')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${selectedProofType === 'photo'
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[11px]">รูปภาพโมเมนต์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProofType('host')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${selectedProofType === 'host'
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px]">สแกน QR</span>
                  </button>
                </div>
              </div>

              {/* Method Details */}
              {selectedProofType === 'gps' && (
                <div className="p-3.5 bg-white rounded-2xl border border-purple-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <MapPin className="w-4 h-4 text-[#7C3AED]" />
                    <span>ระบบตรวจสอบพิกัด GPS อัตโนมัติ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    ระบบจะตรวจสอบว่าคุณอยู่ในรัศมีของสถานที่พาร์ทเนอร์หรือสวนสาธารณะที่ระบุในเงื่อนไขภารกิจ
                  </p>
                </div>
              )}

              {selectedProofType === 'photo' && (
                <div className="p-3.5 bg-white rounded-2xl border border-purple-100 space-y-3">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#7C3AED] transition-colors cursor-pointer bg-slate-50">
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-700 block">คลิกเพื่อเลือกภาพถ่ายหลักฐาน</span>
                    <span className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="เขียนบันทึกความรู้สึกหรือเล่าโมเมนต์สั้นๆ..."
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              )}

              {selectedProofType === 'host' && (
                <div className="p-4 bg-white rounded-2xl border border-purple-100 text-center space-y-2">
                  <div className="w-24 h-24 mx-auto bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">รหัสตรวจสอบ: QUEST-PASS-{quest.id.toUpperCase()}</p>
                  <p className="text-[11px] text-slate-500">ยื่น QR Code นี้ให้โฮสต์ผู้จัดงานหรือผู้ดูแลกิจกรรมเพื่อสแกนยืนยัน</p>
                </div>
              )}

              {/* Action Buttons in Submission */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitProof(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSimulateSubmit}
                  className="px-6 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmitting ? (
                    <span>กำลังตรวจสอบ...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ยืนยันและส่งผล ({currentProgress + 1}/{targetTotal})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : showCancelConfirm ? (
            /* Cancel Quest Confirmation Box */
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <h4 className="font-extrabold text-sm sm:text-base">
                  คุณต้องการยกเลิกภารกิจ &ldquo;{quest.title}&rdquo; ใช่หรือไม่?
                </h4>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed font-medium pl-7">
                ความคืบหน้าที่สะสมไว้ ({currentProgress}/{targetTotal}) จะถูกรีเซ็ต แต่คุณสามารถกลับมารับภารกิจนี้ใหม่ได้ตลอดเวลาจนกว่าจะหมดเวลาของภารกิจ
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  ทำภารกิจต่อ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  ยืนยันขอยกเลิก
                </button>
              </div>
            </div>
          ) : (
            /* Normal Quest Details View */
            <>
              {/* Section 1: Objective & Purpose */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  วัตถุประสงค์ของภารกิจ
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {quest.objective || quest.targetGoal || 'ส่งเสริมการออกไปใช้ชีวิต ทำกิจกรรมสร้างสรรค์ และสร้างแรงบันดาลใจร่วมกับเพื่อนๆ ในคอมมูนิตี้'}
                </p>
              </div>

              {/* Section 2: Step-by-Step Instructions & Conditions */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ขั้นตอนและเงื่อนไขการทำภารกิจ
                  </h4>
                  <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {quest.steps?.length || 3} ขั้นตอน
                  </span>
                </div>

                <div className="space-y-2">
                  {(quest.steps && quest.steps.length > 0 ? quest.steps : [
                    'ตรวจสอบพิกัดหรือเงื่อนไขของกิจกรรมที่เข้าร่วม',
                    'ทำกิจกรรมตามเป้าหมายที่กำหนดให้ครบถ้วน',
                    'ส่งหลักฐานเพื่อรับเหรียญรางวัลและคะแนน XP'
                  ]).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Verification Method */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  วิธีการตรวจสอบและส่งหลักฐาน
                </h4>
                <div className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed bg-purple-50/60 p-3 rounded-xl border border-purple-200/70">
                  {cleanedVerification}
                </div>
              </div>

              {/* Section 4: Rewards & Perks */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-amber-50/20 border border-purple-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ของรางวัลเมื่อทำสำเร็จ
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    Reward Unlocks
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  <div className="p-3 bg-white rounded-xl border border-purple-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center text-xl shrink-0 border border-purple-100">
                      {quest.badgeIcon || '🏅'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 block">เหรียญตราเกียรติยศ</span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate block">{quest.badgeLabel}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
                      <Zap className="w-5 h-5 text-amber-600 fill-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 block">แต้มและคะแนน XP ส่วนกลาง</span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800">+{quest.rewardPoints || 300} XP Points</span>
                    </div>
                  </div>
                </div>

                {/* 3. Brand-Exclusive Privilege Block (Strava / Nike Model - Brand Partner Quest) */}
                {brandReward && brandReward.type === 'brand_partner' && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/5 rounded-2xl border border-amber-300/80 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          🎟️
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          สิทธิพิเศษเฉพาะแบรนด์พาร์ทเนอร์ (Brand-Exclusive Privilege)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        {brandReward.partnerName}
                      </span>
                    </div>

                    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 space-y-1">
                      <h5 className="font-black text-xs sm:text-sm text-slate-900">
                        {brandReward.title}
                      </h5>
                      <p className="text-[11px] text-amber-900 font-semibold flex items-center gap-1">
                        <span>🔒</span>
                        <span>{brandReward.exclusiveNotice}</span>
                      </p>
                      {brandReward.terms && (
                        <p className="text-[10.5px] text-slate-500 pt-0.5">
                          เงื่อนไข: {brandReward.terms}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Universal Hub Rewards Block (For Central Platform Challenges) */}
                {brandReward && brandReward.type === 'hub_central' && (
                  <div className="p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/5 rounded-2xl border border-purple-300/80 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          🎁
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          สิทธิ์แลกของรางวัลศูนย์กลาง (Universal Hub Rewards)
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-300/80 flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3 h-3 text-purple-700 shrink-0" />
                        <span>Official Hub Challenge • กิจกรรมกลาง</span>
                      </span>
                    </div>

                    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-purple-200/80 space-y-1">
                      <h5 className="font-black text-xs sm:text-sm text-purple-950">
                        {brandReward.title}
                      </h5>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {brandReward.hubRewardNote}
                      </p>
                      <div className="pt-1 flex items-center gap-1.5 text-[10.5px] text-purple-800 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>อิสระเต็มที่: นำแต้มไปเลือกของรางวัลใดก็ได้ในหน้ารวม /rewards ไม่ติดเงื่อนไขแบรนด์</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] sm:text-xs text-slate-600 font-medium pt-0.5 leading-relaxed">
                  {formattedRewardsNote}
                </p>
              </div>
            </>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title="แชร์ภารกิจให้เพื่อนๆ"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-purple-700 font-extrabold">คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>แชร์ภารกิจ</span>
              </>
            )}
          </button>

          {/* Action Buttons depending on State */}
          <div className="flex items-center gap-2">
            {localCompleted ? (
              brandReward?.type === 'brand_partner' ? (
                <Link
                  href="/myhub?tab=quests_rewards"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>ดูบัตรกำนัลใน MyHub</span>
                </Link>
              ) : (
                <Link
                  href="/rewards"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-amber-300" />
                  <span>เปิดศูนย์ของรางวัล (/rewards)</span>
                </Link>
              )
            ) : isAlreadyJoined ? (
              <div className="flex items-center gap-2">
                {/* Abandon / Cancel Button */}
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  title="ยกเลิกการทำภารกิจนี้"
                >
                  <span>ยกเลิกภารกิจ</span>
                </button>

                {/* Primary CTA: Submit Proof / Progress */}
                <button
                  type="button"
                  onClick={() => setShowSubmitProof(true)}
                  className="px-5 sm:px-7 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-purple-200" />
                  <span>ส่งผล / บันทึกความคืบหน้า</span>
                </button>
              </div>
            ) : (
              /* Not Joined Yet */
              <button
                type="button"
                onClick={() => {
                  onConfirmJoin?.(quest);
                  onClose();
                }}
                className="px-7 sm:px-9 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
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
