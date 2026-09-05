'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, Lock, Flag, ShieldCheck } from 'lucide-react';

interface ReportSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle: string;
  targetHostName?: string;
  onReportSubmitted?: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  {
    id: 'investment_mlm',
    title: 'ชักชวนลงทุน / ขายตรง / งานออนไลน์',
    desc: 'มีการชวนทำธุรกิจลูกโซ่ คริปโต หรือหารายได้เสริมแอบแฝง',
    icon: '💼',
  },
  {
    id: 'harassment',
    title: 'คุกคาม / วาจาไม่เหมาะสม / ไม่ปลอดภัย',
    desc: 'แสดงพฤติกรรมคุกคามทางเพศ ใช้คำพูดหยาบคาย หรือละเมิดความเป็นส่วนตัว',
    icon: '⚠️',
  },
  {
    id: 'unsafe_location',
    title: 'นัดพบในสถานที่ลับตาคน / นอกงาน',
    desc: 'ระบุจุดนัดพบในมุมอับ รถยนต์ส่วนตัว หรือนอกพื้นที่สาธารณะของงาน',
    icon: '📍',
  },
  {
    id: 'fake_or_spam',
    title: 'กลุ่มสแปม / ไม่มาตามนัด / ตั้งกลุ่มหลอก',
    desc: 'ข้อมูลเท็จ ไม่มีเจตนามาทำกิจกรรมจริง หรือตั้งกลุ่มรบกวนผู้อื่น',
    icon: '❌',
  },
  {
    id: 'other',
    title: 'สาเหตุอื่นๆ',
    desc: 'พฤติกรรมอื่นๆ ที่ไม่เป็นไปตามแนวทางความปลอดภัยของคอมมูนิตี้',
    icon: '❓',
  },
];

export const ReportSafetyModal: React.FC<ReportSafetyModalProps> = ({
  isOpen,
  onClose,
  targetTitle,
  targetHostName,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('investment_mlm');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (onReportSubmitted) {
      const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      onReportSubmitted(reasonObj?.title || selectedReason, details);
    }
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      setDetails('');
      setSelectedReason('investment_mlm');
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-rose-100 text-left space-y-4 animate-scale-up relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          title="ปิด"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-[#1E293B]">
              ได้รับรายงานความปลอดภัยแล้ว
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              ขอบคุณที่ช่วยดูแลความปลอดภัยของคอมมูนิตี้ ทีมงาน Trust & Safety จะทำการตรวจสอบข้อมูลทันทีครับ 🛡️
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="text-base font-extrabold text-[#1E293B]">
                  รายงานความไม่ปลอดภัย
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  กลุ่ม: <span className="font-semibold text-slate-700">&ldquo;{targetTitle}&rdquo;</span>
                  {targetHostName && <span> (โฮสต์: {targetHostName})</span>}
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Box */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>รายงานนี้เป็นความลับ 100%:</strong> ผู้ถูกรายงานจะไม่ทราบว่าใครเป็นผู้ส่งข้อมูล และระบบจะนำไปประเมินความปลอดภัยทันที
              </span>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                เลือกเหตุผลที่รายงาน <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedReason === r.id
                        ? 'border-rose-400 bg-rose-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E293B]">
                        <span>{r.icon}</span>
                        <span>{r.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {r.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="ระบุข้อความหรือพฤติกรรมที่พบเห็นเพื่อช่วยให้ทีมงานตรวจสอบได้เร็วยิ่งขึ้น..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>ส่งรายงานความปลอดภัย</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
