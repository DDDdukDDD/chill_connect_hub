'use client';

import React, { useState } from 'react';
import { X, Sparkles, Trophy, Target, Zap, ShieldCheck, Crown, PlusCircle } from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';

export interface CustomChallengeData {
  title: string;
  category: 'move' | 'heal' | 'chill' | 'learn';
  targetGoal: string;
  badgeLabel: string;
  iconName: string;
  totalCount: number;
  rewardPoints: number;
  isOfficial?: boolean;
}

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (quest: ChallengeQuest) => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess,
}) => {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'move' | 'heal' | 'chill' | 'learn'>('chill');
  const [targetGoal, setTargetGoal] = useState('');
  const [badgeLabel, setBadgeLabel] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [totalCount, setTotalCount] = useState<number>(3);
  const [rewardPoints, setRewardPoints] = useState<number>(150);
  const [isOfficial, setIsOfficial] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !badgeLabel.trim()) return;

    const newQuest: ChallengeQuest = {
      id: `quest-custom-${Date.now()}`,
      title: title.trim(),
      badgeLabel: badgeLabel.trim(),
      iconName: iconName,
      current: '0',
      total: totalCount.toString(),
      completedCountInfo: `0/${totalCount} ครั้ง`,
      progressPercent: 0,
      category: category,
      visibility: visibility,
      creatorName: 'คุณ (Member)',
      participantsCount: 1,
      rewardPoints: rewardPoints,
      targetGoal: targetGoal.trim() || `ทำเป้าหมาย "${title.trim()}" ให้สำเร็จครบ ${totalCount} ครั้ง`,
      isOfficial: isOfficial,
    };

    onCreateSuccess(newQuest);
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

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
              สร้างชาเลนจ์ & ภารกิจใหม่
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ตั้งเป้าหมายกิจกรรมยามว่างของคุณ หรือเปิดภารกิจให้เพื่อนๆ ใน Hub ร่วมสนุก
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Public vs Private Visibility Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ระดับการเผยแพร่ (Visibility) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  visibility === 'public'
                    ? 'bg-emerald-50/80 border-[#4A7C59] ring-2 ring-[#4A7C59]/20 text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-[#4A7C59] flex items-center gap-1.5">
                    <span>🌐 สาธารณะ (Public)</span>
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    visibility === 'public' ? 'border-[#4A7C59] bg-[#4A7C59]' : 'border-slate-300'
                  }`}>
                    {visibility === 'public' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  ชวนเพื่อนๆ ร่วมทำได้ และแสดงในแถบชาเลนจ์หน้าแรก
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  visibility === 'private'
                    ? 'bg-slate-100 border-slate-600 ring-2 ring-slate-400/20 text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                    <span>🔒 ส่วนตัว (Private)</span>
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    visibility === 'private' ? 'border-slate-700 bg-slate-700' : 'border-slate-300'
                  }`}>
                    {visibility === 'private' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  เป้าหมายส่วนตัว แสดงเฉพาะในหน้ากิจกรรมของคุณ
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ชื่อเป้าหมายชาเลนจ์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น วิ่งรับลมเช้าสวนลุมพินี 5 ครั้ง, อ่านหนังสือจบ 2 เล่ม..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] focus:border-[#4A7C59] outline-none"
              required
            />
          </div>

          {/* Category & Icon Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">หมวดหมู่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none bg-white font-medium"
              >
                <option value="move">🏃 ขยับกาย (Move)</option>
                <option value="heal">🌿 ฮีลใจ (Heal)</option>
                <option value="chill">☕ ชิลล์ (Chill)</option>
                <option value="learn">🎨 สร้างสรรค์ (Learn)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">ไอคอนสัญลักษณ์</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none bg-white font-medium"
              >
                <option value="Sparkles">✨ ประกายดาว (Sparkles)</option>
                <option value="Flame">🔥 เปลวไฟ (Flame)</option>
                <option value="Target">🎯 เป้าหมาย (Target)</option>
                <option value="Zap">⚡ สายฟ้าพลังงาน (Zap)</option>
                <option value="Coffee">☕ กาแฟ (Coffee)</option>
                <option value="Footprints">👣 รอยเท้า (Footprints)</option>
              </select>
            </div>
          </div>

          {/* Badge Label & Target Count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                ชื่อเหรียญรางวัล (Badge) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="เช่น Coffee Lover, Zen Spirit"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">เป้าหมาย (จำนวนครั้ง)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={totalCount}
                onChange={(e) => setTotalCount(parseInt(e.target.value) || 1)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none"
                required
              />
            </div>
          </div>

          {/* Target Goal Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">คำอธิบายรายละเอียดภารกิจ</label>
            <textarea
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="ระบุสิ่งที่ต้องทำ เช่น เข้าร่วมเวิร์กช็อป 2 ครั้งภายใน 30 วัน..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างชาเลนจ์ทันที (+{rewardPoints} XP)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
