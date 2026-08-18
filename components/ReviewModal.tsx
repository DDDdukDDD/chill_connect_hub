'use client';

import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2, Award } from 'lucide-react';

export interface ReviewSubmitData {
  eventId: string;
  rating: number;
  tags: string[];
  comment: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  hostName: string;
  hostAvatar?: string;
  onSubmitSuccess: (data: ReviewSubmitData) => void;
}

const QUICK_TAG_OPTIONS = [
  '🌿 บรรยากาศฮีลใจ',
  '🤝 ไปคนเดียวไม่เกร็ง',
  '☕ โฮสต์ดูแลดีมาก',
  '✨ อยากให้จัดซ้ำอีก',
  '🔥 สนุกมาก ได้เหงื่อ',
  '🎯 ตรงต่อเวลา',
  '🎨 ได้ความรู้ใหม่',
  '💬 เพื่อนๆ เป็นกันเอง',
];

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: 'ควรปรับปรุง', emoji: '😕', color: 'text-rose-500' },
  2: { text: 'พอใช้ได้', emoji: '🙂', color: 'text-amber-500' },
  3: { text: 'ดี เป็นกันเอง', emoji: '😊', color: 'text-yellow-500' },
  4: { text: 'ประทับใจมาก', emoji: '😄', color: 'text-emerald-500' },
  5: { text: 'ยอดเยี่ยมที่สุด! ชอบมาก', emoji: '🌟', color: 'text-[#F26430]' },
};

export default function ReviewModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  hostName,
  hostAvatar,
  onSubmitSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['🌿 บรรยากาศฮีลใจ', '🤝 ไปคนเดียวไม่เกร็ง']);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSubmitSuccess({
          eventId,
          rating,
          tags: selectedTags,
          comment,
        });
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 600);
  };

  const currentRatingInfo = RATING_LABELS[hoverRating || rating] || RATING_LABELS[5];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-lg">
              ⭐
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B]">
                ให้คะแนนความประทับใจ
              </h3>
              <p className="text-xs text-[#64748B] line-clamp-1 font-medium">
                {eventTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🎉
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-lg text-[#1E293B]">ขอบคุณสำหรับรีวิว!</h4>
              <p className="text-xs text-[#64748B]">
                ความคิดเห็นของคุณช่วยให้ชุมชนนี้น่าอยู่และอบอุ่นยิ่งขึ้น
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black">
              <Award className="w-4 h-4 text-amber-500" />
              <span>+50 XP & ปลดล็อกเหรียญนักรีวิวฮีลใจ ✨</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
            
            {/* Host info teaser */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <img
                  src={hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={hostName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-[#1E293B] block">
                    ผู้จัด: {hostName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    รีวิวเพื่อส่งกำลังใจให้โฮสต์
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#4A7C59] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ร่วมงานแล้ว
              </span>
            </div>

            {/* 1. Star Rating Selector */}
            <div className="text-center space-y-2 py-2">
              <p className="text-xs font-bold text-slate-600">
                ให้คะแนนกิจกรรมและโฮสต์โดยรวม:
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`star-${star}`}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 active:scale-95 transition-all cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300 hover:text-amber-200'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <div className="h-6 flex items-center justify-center">
                <span className={`text-xs font-extrabold flex items-center gap-1.5 ${currentRatingInfo.color}`}>
                  <span>{currentRatingInfo.emoji}</span>
                  <span>{currentRatingInfo.text}</span>
                </span>
              </div>
            </div>

            {/* 2. Quick Tags Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1E293B]">
                ประทับใจจุดไหนบ้าง? (เลือกได้หลายข้อ)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Short Feedback Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1E293B]">
                ความรู้สึกเพิ่มเติม (ไม่บังคับ):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="บอกเล่าความประทับใจ บรรยากาศ หรือสิ่งที่อยากขอบคุณโฮสต์และเพื่อนๆ..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#F26430] text-xs font-medium text-[#1E293B] p-3 rounded-2xl focus:outline-none transition-colors resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Reward Teaser */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5 text-amber-900 text-xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              <span className="font-medium text-[11px] leading-tight">
                ส่งรีวิวแล้วรับทันที <strong className="font-extrabold text-amber-700">+50 XP</strong> เพื่อสะสมเลเวลและปลดล็อกเหรียญตรา
              </span>
            </div>

            {/* Action Footer */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors"
              >
                ไว้ทีหลัง
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-2.5 rounded-xl bg-[#F26430] hover:bg-[#E05320] text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ส่งรีวิว & รับ 50 XP ✨</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
