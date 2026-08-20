'use client';

import React, { useState } from 'react';
import { X, Star, Heart, DollarSign, Sparkles, CheckCircle2, ShieldCheck, Gift } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface TipHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onTipSubmit: (rating: number, reviewText: string, tipAmount: number) => void;
}

const TIP_PRESETS = [0, 20, 50, 100, 200];

export const TipHostModal: React.FC<TipHostModalProps> = ({
  isOpen,
  onClose,
  event,
  onTipSubmit,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<number>(50);
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const [customTipValue, setCustomTipValue] = useState<string>('');

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTip = isCustomTip ? (parseFloat(customTipValue) || 0) : selectedTip;
    onTipSubmit(rating, reviewText, finalTip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Host Avatar & Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="relative">
            <img
              src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={event.hostName}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              โฮสต์
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">ให้คะแนน & ส่งกำลังใจให้โฮสต์</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
              {event.hostName}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">
              กิจกรรม: {event.title}
            </p>
          </div>
        </div>

        {/* Rating & Review Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Star Rating */}
          <div className="text-center space-y-2 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8]">
            <p className="text-xs font-bold text-slate-700">ระดับความประทับใจที่คุณได้รับ</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold text-amber-800">
              {rating === 5 && '🌟 ประทับใจมากที่สุด! สนุกและอบอุ่นมาก'}
              {rating === 4 && '😊 ประทับใจมาก กิจกรรมดี'}
              {rating === 3 && '👍 ปานกลาง พอใช้ได้'}
              {rating <= 2 && '🙏 ควรปรับปรุง'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              เขียนความประทับใจถึงโฮสต์และกิจกรรม
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="เล่าบรรยากาศ ความเป็นกันเองของโฮสต์ เพื่อเป็นกำลังใจและช่วยให้เพื่อนคนอื่นตัดสินใจ..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none"
            />
          </div>

          {/* Host Tipping Engine */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>ให้ทิปโฮสต์เพื่อสนับสนุน (Tip Creator)</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                เข้ากระเป๋าโฮสต์ 100%
              </span>
            </div>

            {/* Tip Presets */}
            <div className="grid grid-cols-5 gap-2">
              {TIP_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedTip(amt);
                    setIsCustomTip(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    !isCustomTip && selectedTip === amt
                      ? 'bg-[#F26430] text-white shadow-xs ring-2 ring-[#F26430]/30'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {amt === 0 ? 'ไม่ให้' : `฿${amt}`}
                </button>
              ))}
            </div>

            {/* Custom Tip Option */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomTip(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isCustomTip
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ระบุจำนวนเงินเอง
              </button>

              {isCustomTip && (
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={customTipValue}
                  onChange={(e) => setCustomTipValue(e.target.value)}
                  placeholder="ใส่จำนวนเงิน (บาท)..."
                  className="w-full text-xs p-1.5 px-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-400 outline-none"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Reward Bonus Note for Reviewer */}
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>โบนัสของคุณ: ได้รับ +50 XP สะสมทันที!</span>
            </span>
            <span className="font-extrabold text-emerald-700">✓ Review & Earn</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              ไว้คราวหลัง
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#F26430] to-orange-500 hover:from-[#E05320] hover:to-orange-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>ส่งรีวิว & ทิปโฮสต์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
