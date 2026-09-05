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
  const [verificationMethod, setVerificationMethod] = useState<'photo' | 'gps' | 'ticket'>('gps');
  const [targetLocations, setTargetLocations] = useState<string>('สวนลุมพินี, สวนเบญจกิติ, สวนรถไฟ');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !badgeLabel.trim()) return;

    const generatedSteps = [
      `ทำกิจกรรมตามเป้าหมาย "${title.trim()}" ในแต่ละรอบ`,
      verificationMethod === 'gps'
        ? `เช็คอินพิกัด GPS ณ ${targetLocations || 'สถานที่เป้าหมาย'}`
        : verificationMethod === 'photo'
        ? 'ถ่ายภาพโมเมนต์และอัปโหลดเพื่อบันทึกความคืบหน้า'
        : 'สแกนบัตรหรือ QR Code เพื่อยืนยันการเข้าร่วม',
      `สะสมความคืบหน้าครบ ${totalCount} ครั้งเพื่อปลดล็อกเหรียญและรับคะแนน XP`,
    ];

    const getBadgeEmoji = (icon: string) => {
      switch (icon) {
        case 'Flame': return '🔥';
        case 'Target': return '🎯';
        case 'Zap': return '⚡';
        case 'Coffee': return '☕';
        case 'Footprints': return '🏃‍♂️';
        default: return '🏅';
      }
    };

    const newQuest: ChallengeQuest = {
      id: `quest-custom-${Date.now()}`,
      title: title.trim(),
      badgeLabel: badgeLabel.trim(),
      badgeIcon: getBadgeEmoji(iconName),
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
      targetGoal: targetGoal.trim() 
        ? `${targetGoal.trim()}${verificationMethod === 'gps' && targetLocations ? ` (เป้าหมาย: ${targetLocations})` : ''}`
        : `ทำเป้าหมาย "${title.trim()}" ให้สำเร็จครบ ${totalCount} ครั้ง${verificationMethod === 'gps' && targetLocations ? ` (เป้าหมาย: ${targetLocations})` : ''}`,
      objective: targetGoal.trim() || `มุ่งมั่นทำเป้าหมาย "${title.trim()}" ให้สำเร็จครบ ${totalCount} ครั้ง เพื่อสร้างวินัยและสุขภาพที่ดี`,
      steps: generatedSteps,
      verificationMethod: verificationMethod === 'gps' 
        ? `ระบบตรวจสอบพิกัด GPS อัตโนมัติ (สถานที่: ${targetLocations || 'สถานที่เป้าหมาย'})`
        : verificationMethod === 'photo'
        ? 'ส่งภาพถ่ายโมเมนต์ความประทับใจเพื่อยืนยันผล'
        : 'สแกน QR Code จากผู้จัดหรือร้านค้าพาร์ทเนอร์',
      rewardsText: `เหรียญตราเกียรติยศ "${badgeLabel.trim()}" บนหน้าโปรไฟล์ พร้อมรับคะแนนสะสม ${rewardPoints} XP`,
      startDate: '1 มี.ค. 2026',
      endDate: '31 มี.ค. 2026',
      daysRemaining: 15,
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
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
              สร้างชาเลนจ์ & ภารกิจใหม่
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
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
                    ? 'bg-purple-50/80 border-[#7C3AED] ring-2 ring-purple-100 text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#7C3AED]">
                    สาธารณะ (Public)
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    visibility === 'public' ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-slate-300'
                  }`}>
                    {visibility === 'public' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
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
                  <span className="font-extrabold text-xs text-slate-800">
                    ส่วนตัว (Private)
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    visibility === 'private' ? 'border-slate-700 bg-slate-700' : 'border-slate-300'
                  }`}>
                    {visibility === 'private' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
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
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none"
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
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none bg-white font-medium"
              >
                <option value="move">ขยับกาย (Move)</option>
                <option value="heal">ฮีลใจ (Heal)</option>
                <option value="chill">ชิลล์ (Chill)</option>
                <option value="learn">สร้างสรรค์ (Learn)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">สัญลักษณ์รางวัล</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none bg-white font-medium"
              >
                <option value="Sparkles">เหรียญเกียรติยศ (Sparkles)</option>
                <option value="Flame">เปลวไฟ (Flame)</option>
                <option value="Target">เป้าหมาย (Target)</option>
                <option value="Zap">สายฟ้าพลังงาน (Zap)</option>
                <option value="Coffee">กาแฟ (Coffee)</option>
                <option value="Footprints">รอยเท้า (Footprints)</option>
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
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none"
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
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none"
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
              placeholder="ระบุสิ่งที่ต้องทำ เช่น วิ่งสะสมครบ 3 สวนสาธารณะในกทม. หรือเข้าร่วมเวิร์กช็อป..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none"
            />
          </div>

          {/* Verification Method Selector (GPS, Photo Proof, Ticket) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 block">
              รูปแบบการตรวจสอบความคืบหน้า (Verification Method)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gps', label: 'พิกัด GPS จริง', desc: 'เช็คอินสถานที่จริง' },
                { id: 'photo', label: 'ภาพถ่ายโมเมนต์', desc: 'อัปโหลดรูปลง Hub' },
                { id: 'ticket', label: 'สแกนตั๋วงาน', desc: 'เชื่อมตั๋วในระบบ' },
              ].map((method) => {
                const isSelected = verificationMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setVerificationMethod(method.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-[#7C3AED] ring-2 ring-purple-100 text-purple-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-[11px] block">{method.label}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{method.desc}</span>
                  </button>
                );
              })}
            </div>

            {verificationMethod === 'gps' && (
              <div className="pt-1 animate-fade-in">
                <label className="text-[11px] font-bold text-slate-600 block">
                  พิกัด/สถานที่เป้าหมายสำหรับเช็คอิน:
                </label>
                <input
                  type="text"
                  value={targetLocations}
                  onChange={(e) => setTargetLocations(e.target.value)}
                  placeholder="เช่น สวนลุมพินี, สวนเบญจกิติ, สวนวชิรเบญจทัศ (สวนรถไฟ)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-purple-100 focus:border-[#7C3AED] outline-none"
                />
              </div>
            )}
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
              className="flex-1 bg-gradient-to-r from-[#581C87] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
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
