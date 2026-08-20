'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, UserCheck, HelpCircle } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface CancelTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  ticketId: string;
  onConfirmCancel: (ticketId: string, reason: string) => void;
}

const CANCEL_REASONS = [
  { id: 'urgent_work', label: '💼 ติดงานด่วน / มีธุระกะทันหัน' },
  { id: 'sick', label: '🤒 สุขภาพไม่พร้อม / พักผ่อนไม่เพียงพอ' },
  { id: 'wrong_date', label: '📅 ลงทะเบียนผิดวัน / เวลา' },
  { id: 'travel_plan', label: '🚗 การเดินทางไม่สะดวก / เปลี่ยนแผน' },
  { id: 'other', label: '📝 อื่นๆ' },
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
    const finalReason = selectedReason === '📝 อื่นๆ' && customNote.trim() ? customNote.trim() : selectedReason;
    onConfirmCancel(ticketId, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#1E293B]">
              ยกเลิกการเข้าร่วมกิจกรรม
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ตั๋วหมายเลข: <strong className="text-slate-800 font-mono">{ticketId}</strong>
            </p>
          </div>
        </div>

        {/* Event Summary Box */}
        <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D8] space-y-1">
          <span className="text-[10px] font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-md">
            #{event.tag}
          </span>
          <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1">
            {event.title}
          </h4>
          <p className="text-[11px] text-slate-500">
            📅 {event.date} • {event.time} | 📍 {event.location}
          </p>
        </div>

        {/* Reason Selector Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              กรุณาระบุเหตุผลในการยกเลิก <span className="text-rose-500">*</span>
            </label>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    selectedReason === r.label
                      ? 'bg-rose-50/70 border-rose-400 text-rose-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === r.label}
                    onChange={() => setSelectedReason(r.label)}
                    className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            {selectedReason === '📝 อื่นๆ' && (
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="พิมพ์ระบุเหตุผลสั้นๆ..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
                rows={2}
                required
              />
            )}
          </div>

          {/* Friendly Community Notice */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>การคืนที่นั่งเพื่อเพื่อนสมาชิก</span>
            </p>
            <p className="text-slate-500 leading-relaxed">
              ระบบจะคืนโควตาที่นั่งให้เพื่อนสมาชิกคนอื่นที่สนใจ และส่งข้อความแจ้งเตือนไปยังโฮสต์อย่างสุภาพ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              ยืนยันการยกเลิกตั๋ว
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
