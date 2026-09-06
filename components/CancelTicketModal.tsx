'use client';

import React, { useState } from 'react';
import { X, CalendarX, UserCheck, Calendar, Clock } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 sm:p-7 space-y-5 text-[#1E293B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
            <CalendarX className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              ยกเลิกการเข้าร่วมกิจกรรม
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              รหัสตั๋ว: <span className="font-mono font-bold text-slate-800">{ticketId}</span>
            </p>
          </div>
        </div>

        {/* Event Summary Box (Clean Slate) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
          <span className="text-[10.5px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-md border border-[#C5DCCB] inline-block">
            {event.tag || 'กิจกรรมคอมมูนิตี้'}
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
            {event.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{event.date}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{event.time}</span>
            </span>
          </div>
        </div>

        {/* Reason Selector Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              เหตุผลในการยกเลิก <span className="text-rose-500">*</span>
            </label>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === r.label
                      ? 'bg-[#EBF3ED] border-[#A3CEB0] text-[#2D5A3C] font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === r.label}
                    onChange={() => setSelectedReason(r.label)}
                    className="accent-[#4A7C59] w-4 h-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'อื่นๆ' && (
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="ระบุเหตุผลเพิ่มเติมสั้นๆ..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] outline-none"
                rows={2}
                required
              />
            )}
          </div>

          {/* Friendly Community Notice */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>การคืนสิทธิ์ที่นั่ง</span>
            </p>
            <p className="text-slate-500 leading-relaxed">
              ระบบจะคืนสิทธิ์ที่นั่งให้กับเพื่อนสมาชิกคนอื่น และส่งการแจ้งเตือนไปยังโฮสต์ผู้จัดงานอย่างสุภาพ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer active:scale-98"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              ยืนยันการยกเลิกตั๋ว
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
