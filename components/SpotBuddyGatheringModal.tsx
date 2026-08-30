'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Users,
  Shield,
  Clock,
  Bold,
  Italic,
  List,
  Check,
  AlertCircle,
} from 'lucide-react';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';
import { useAuth } from '@/lib/useAuth';
import { RichTextEditor, stripHtmlToPlainText } from './RichTextEditor';

export interface SpotBuddyPostItem {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  hostBadge?: string;
  date: string;
  time: string;
  participantsCount: number;
  maxParticipants: number;
  description: string;
  tag: string;
  meetingPoint?: string;
  targetGender?: 'all' | 'female_only' | 'male_only';
  targetAge?: string;
  whatToBring?: string[];
  subActivities?: Array<{ title: string; time?: string }>;
}

interface SpotBuddyGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotTitle: string;
  spotLocation: string;
  spotImage?: string;
  onSuccess: (newTrip: SpotBuddyPostItem) => void;
}

const WHAT_TO_BRING_SUGGESTIONS = [
  'ขวดน้ำดื่มส่วนตัว',
  'รองเท้าวิ่ง / ผ้าใบ',
  'กล้องถ่ายรูป',
  'เสื่อปิกนิก',
  'หมวก / แว่นกันแดด',
  'สมุดสเก็ตช์ภาพ',
  'พาวเวอร์แบงก์',
  'ร่มพับ',
];

const AGE_SUGGESTIONS = ['ไม่จำกัดอายุ', '18 - 25 ปี', '20 - 35 ปี', '25 - 40 ปี', '30 ปีขึ้นไป'];

export const SpotBuddyGatheringModal: React.FC<SpotBuddyGatheringModalProps> = ({
  isOpen,
  onClose,
  spotTitle,
  spotLocation,
  spotImage,
  onSuccess,
}) => {
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [dateType, setDateType] = useState('เสาร์นี้ 30 ส.ค.');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('10:00');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [targetAge, setTargetAge] = useState<string>('ไม่จำกัดอายุ');
  const [vibeTag, setVibeTag] = useState<string>('☕ ชิลล์ & กาแฟ');
  const [description, setDescription] = useState('');
  const [whatToBringList, setWhatToBringList] = useState<string[]>(['ขวดน้ำดื่มส่วนตัว', 'รอยยิ้ม & เป็นกันเอง']);
  const [isSafetyAccepted, setIsSafetyAccepted] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(`ชวนไปเที่ยว & จิบกาแฟที่ ${spotTitle}`);
      setMeetingPoint(`หน้าร้าน / จุดนัดพบหลัก ${spotTitle}`);
      setDescription(`นัดเจอพูดคุยบรรยากาศสบายๆ ที่ ${spotTitle} ใครมาคนเดียวไม่ต้องเกร็ง ยินดีต้อนรับทุกคนครับ ✨`);
      setIsSafetyAccepted(false);
    }
  }, [isOpen, spotTitle]);

  if (!isOpen) return null;

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.substring(start, end) || 'ข้อความ';
    const updated = description.substring(0, start) + prefix + selected + suffix + description.substring(end);
    setDescription(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const toggleBringItem = (item: string) => {
    setWhatToBringList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('กรุณาระบุชื่อหัวข้อทริปชวนเที่ยว');
      return;
    }
    if (!meetingPoint.trim()) {
      setErrorMessage('กรุณาระบุจุดนัดพบที่ชัดเจน');
      return;
    }
    const plainDesc = stripHtmlToPlainText(description);
    if (!plainDesc || plainDesc.length < 10) {
      setErrorMessage('กรุณาระบุรายละเอียดหรือคำแนะนำอย่างน้อย 10 ตัวอักษร');
      return;
    }
    if (!isSafetyAccepted) {
      setErrorMessage('กรุณากดยืนยันและยอมรับข้อกำหนดความปลอดภัยของคอมมูนิตี้');
      return;
    }

    const newTrip: SpotBuddyPostItem = {
      id: `spot-buddy-${Date.now()}`,
      title: title.trim(),
      hostName: userProfile.name || 'ฉันเอง',
      hostAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      hostBadge: userProfile.badgeLabel || 'สมาชิก',
      date: dateType,
      time: `${startTime} - ${endTime} น.`,
      participantsCount: 1,
      maxParticipants: maxParticipants || 4,
      description: description.trim(),
      tag: vibeTag,
      meetingPoint: meetingPoint.trim(),
      targetGender: targetGender,
      targetAge: targetAge,
      whatToBring: whatToBringList,
    };

    onSuccess(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] max-w-2xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative animate-scale-up border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#F26430] bg-[#FFF4EE] px-3 py-1 rounded-full border border-[#FCD9C6]">
              <Users className="w-3.5 h-3.5" />
              <span>เปิดห้องชวนเพื่อนเที่ยวเฉพาะสถานที่</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              โพสต์ชวนเพื่อนไป {spotTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>{spotLocation}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                หัวข้อชวนเที่ยว <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-bold ${title.length > 50 ? 'text-orange-600' : 'text-slate-400'}`}>
                {title.length}/60 ตัวอักษร
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เสาร์นี้ไปจิบกาแฟดริป + ถ่ายรูปมุมสวยด้วยกัน"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:border-[#F26430] outline-none"
            />
          </div>

          {/* Date & Time Settings */}
          <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
            <h4 className="text-xs font-black text-orange-950 flex items-center gap-1.5 border-b border-orange-200/60 pb-2">
              <Clock className="w-3.5 h-3.5 text-[#F26430]" />
              <span>วันและเวลานัดหมาย</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">วันที่นัดหมาย</label>
                <select
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="เสาร์นี้ 30 ส.ค.">เสาร์นี้ 30 ส.ค.</option>
                  <option value="อาทิตย์นี้ 31 ส.ค.">อาทิตย์นี้ 31 ส.ค.</option>
                  <option value="เสาร์หน้า 6 ก.ย.">เสาร์หน้า 6 ก.ย.</option>
                  <option value="อาทิตย์หน้า 7 ก.ย.">อาทิตย์หน้า 7 ก.ย.</option>
                  <option value="วันธรรมดาเย็น">วันธรรมดาเย็น (หลังเลิกงาน)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">เวลาเริ่ม</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">จุดนัดพบที่ชัดเจน</label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="เช่น หน้าร้าน / ลานจอดรถ / จุดจำหน่ายตั๋ว"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Participant Settings */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <Shield className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>การตั้งค่าผู้เข้าร่วม</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">จำนวนที่เปิดรับ (คน)</label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">เพศที่เปิดรับ</label>
                <select
                  value={targetGender}
                  onChange={(e) => setTargetGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="all">ทุกเพศ</option>
                  <option value="female_only">เฉพาะผู้หญิง</option>
                  <option value="male_only">เฉพาะผู้ชาย</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">สไตล์ Vibe</label>
                <select
                  value={vibeTag}
                  onChange={(e) => setVibeTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="☕ สายชิลจิบกาแฟ">☕ สายชิลจิบกาแฟ</option>
                  <option value="🤍 Introvert Friendly">🤍 Introvert Friendly</option>
                  <option value="📸 ถ่ายรูป & เดินเล่น">📸 ถ่ายรูป & เดินเล่น</option>
                  <option value="🏃 วิ่งเช้า & ออกกำลัง">🏃 วิ่งเช้า & ออกกำลัง</option>
                  <option value="🎨 เสพศิลป์ & ชมนิทรรศการ">🎨 เสพศิลป์ & ชมนิทรรศการ</option>
                </select>
              </div>
            </div>

            {/* Age Suggestions */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-600 block">ช่วงอายุที่แนะนำ</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AGE_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTargetAge(sug)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      targetAge === sug
                        ? 'bg-[#4A7C59] text-white border-[#4A7C59] font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description & Rich Text Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              รายละเอียด & แผนการเที่ยว (พิมพ์ตัวหนาหรือรายการได้ทันที)
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="เล่าบรรยากาศ แผนการเที่ยว หรือคำแนะนำสำหรับเพื่อนๆ ที่จะร่วมทริป..."
              templateLabel="ใช้เทมเพลตชวนเที่ยว"
              onApplyTemplate={() => {
                setDescription(`<p><strong>บรรยากาศ & จุดเด่น:</strong></p>
<p>นัดเจอพูดคุยบรรยากาศสบายๆ ที่ ${spotTitle} ใครมาคนเดียวไม่ต้องเกร็ง ยินดีต้อนรับทุกคนครับ</p>
<p><strong>แผนเที่ยวคร่าวๆ:</strong></p>
<ul>
  <li>${startTime} น. - เจอกันที่ ${meetingPoint || 'จุดนัดพบ'}</li>
  <li>ร่วมทำกิจกรรมและถ่ายรูปตามอัธยาศัย</li>
  <li>แวะจิบกาแฟพูดคุยก่อนแยกย้าย</li>
</ul>`);
              }}
              minHeight="130px"
            />
          </div>

          {/* What to bring */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">สิ่งที่ควรเตรียมมา</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {WHAT_TO_BRING_SUGGESTIONS.map((item) => {
                const isSelected = whatToBringList.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleBringItem(item)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-50 text-[#2D5A3C] border-emerald-300 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safety Consent */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-1 text-xs text-emerald-950 font-medium">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={isSafetyAccepted}
                onChange={(e) => setIsSafetyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#4A7C59] focus:ring-[#4A7C59] border-emerald-300 cursor-pointer"
              />
              <span className="leading-relaxed">
                ข้าพเจ้ายินยอมปฏิบัติตาม{' '}
                <button
                  type="button"
                  onClick={() => setIsSafetyModalOpen(true)}
                  className="font-black text-[#4A7C59] underline hover:text-[#3B6347]"
                >
                  แนวทางความปลอดภัยชุมชน
                </button>{' '}
                และนัดพบในพื้นที่สาธารณะเท่านั้น
              </span>
            </label>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isSafetyAccepted}
              className={`px-7 py-2.5 rounded-full font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isSafetyAccepted
                  ? 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-orange-500/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>โพสต์ชวนเพื่อนเที่ยว</span>
            </button>
          </div>
        </form>

        {/* Safety Guidelines Modal */}
        <SafetyGuidelinesModal
          isOpen={isSafetyModalOpen}
          onClose={() => {
            setIsSafetyModalOpen(false);
            setIsSafetyAccepted(true);
          }}
        />
      </div>
    </div>
  );
};
