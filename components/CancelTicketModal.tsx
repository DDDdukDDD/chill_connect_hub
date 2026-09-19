'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface CancelTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  ticketId: string;
  onConfirmCancel: (ticketId: string, reason: string) => void;
}

const CANCEL_REASONS = [
  { id: 'urgent_work', label: 'ติดภารกิจด่วน / มีธุระกะทันหัน' },
  { id: 'sick', label: 'ปัญหาสุขภาพ / พักผ่อนไม่เพียงพอ' },
  { id: 'wrong_date', label: 'ลงทะเบียนผิดวันหรือเวลา' },
  { id: 'travel_plan', label: 'การเดินทางไม่สะดวก / มีการเปลี่ยนแผน' },
  { id: 'other', label: 'อื่นๆ' },
];

const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  isOpen,
  onClose,
  event,
  ticketId,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0].label);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'อื่นๆ' && customNote.trim() ? customNote.trim() : selectedReason;
    onConfirmCancel(ticketId, finalReason);
    onClose();
  };

  const cancellationText =
    event.cancellationPolicy === 'free_anytime'
      ? 'ยกเลิกฟรีตลอดเวลา'
      : event.cancellationPolicy === 'free_48h'
      ? 'ยกเลิกฟรีก่อน 48 ชม.'
      : event.cancellationPolicy === 'chat_notice'
      ? 'แจ้งในกลุ่มแชท'
      : 'ยกเลิกฟรีก่อน 24 ชม.';

  return (
    <div
      className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-200/90 animate-scale-up p-6 sm:p-7 space-y-5 text-[#1E293B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Editorial Header */}
        <div className="space-y-1 pr-8 text-left">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">
            ยกเลิกการเข้าร่วมกิจกรรม
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            รหัสตั๋ว <span className="font-mono font-bold text-slate-700">{ticketId}</span>
          </p>
        </div>

        {/* Clean Event Summary (No noisy badges or icons) */}
        <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-100 space-y-1 text-left">
          <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
            {cleanText(event.title)}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {event.date} • {event.time} • {cancellationText}
          </p>
        </div>

        {/* Reason Selector Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              เหตุผลในการยกเลิก <span className="text-rose-500">*</span>
            </label>

            {/* Seamless List (No inner cramped scrollbar) */}
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((r) => {
                const isSelected = selectedReason === r.label;
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-50 border-slate-800 text-slate-900 font-bold ring-1 ring-slate-800/15'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      checked={isSelected}
                      onChange={() => setSelectedReason(r.label)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-slate-800 bg-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-slate-900" />}
                    </span>
                    <span>{r.label}</span>
                  </label>
                );
              })}
            </div>

            {selectedReason === 'อื่นๆ' && (
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="ระบุเหตุผลเพิ่มเติมสั้นๆ..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-800 outline-none transition-all mt-1"
                rows={2}
                required
              />
            )}
          </div>

          {/* Minimal Notice (No icons) */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed font-medium">
            <span className="font-bold text-slate-700 block mb-0.5">การคืนสิทธิ์ที่นั่ง</span>
            ระบบจะคืนสิทธิ์ที่นั่งให้กับเพื่อนสมาชิกคนอื่น และส่งการแจ้งเตือนไปยังโฮสต์ผู้จัดงานโดยอัตโนมัติ
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 rounded-2xl transition-all cursor-pointer active:scale-98"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3 rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              ยืนยันการยกเลิกตั๋ว
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
