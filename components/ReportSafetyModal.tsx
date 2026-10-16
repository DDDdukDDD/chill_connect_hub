'use client';

import React, { useId, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { DialogShell, dialogButton } from './auth/DialogShell';

interface ReportSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'community' | 'fair' | 'spot' | 'review' | 'chat_message';
  targetId: string;
  targetTitle: string;
  /** A part of the target the report is about, such as a meet-up group inside a fair */
  subject?: string;
  onReportSubmitted?: (reason: string, details: string) => void;
}

// The same ids as CONTENT_REPORT_REASONS in lib/social/contentReports.ts
const REASONS: Array<{ id: string; title: string; text: string; places?: boolean }> = [
  { id: 'investment_mlm', title: 'ชวนลงทุน ขายตรง หรือหารายได้เสริม', text: 'ชวนทำธุรกิจ คริปโต ขายประกัน หรือขายของแอบแฝง' },
  { id: 'harassment', title: 'คุกคามหรือพูดจาไม่เหมาะสม', text: 'คุกคามทางเพศ ใช้คำหยาบ หรือละเมิดความเป็นส่วนตัว' },
  { id: 'unsafe_location', title: 'นัดพบในที่ลับตาคนหรือไม่ปลอดภัย', text: 'นัดในที่ส่วนตัว ในรถ หรือนอกพื้นที่สาธารณะ' },
  { id: 'fake_or_spam', title: 'ข้อมูลปลอม สแปม หรือไม่มาตามนัด', text: 'ไม่ได้ตั้งใจจัดจริง หรือตั้งขึ้นเพื่อรบกวนคนอื่น' },
  { id: 'wrong_info', title: 'ข้อมูลไม่ถูกต้องหรือไม่อัปเดต', text: 'ปิดไปแล้ว ย้ายที่ เวลาหรือราคาไม่ตรง', places: true },
  { id: 'other', title: 'เรื่องอื่น', text: 'เล่าให้ทีมงานฟังในช่องด้านล่าง' },
];

/** The "รายงาน" dialog on event, fair and place pages, on a review and on a group chat message. Sends the report to staff (POST /api/reports). */
export const ReportSafetyModal: React.FC<ReportSafetyModalProps> = (props) => (props.isOpen ? <ReportDialog {...props} /> : null);

function ReportDialog({ onClose, targetType, targetId, targetTitle, subject, onReportSubmitted }: ReportSafetyModalProps) {
  const uid = useId();
  // A place is reported for wrong details first; an event for how people behave
  // Words someone wrote (a review, a chat message) are not a place or a meeting, so those two reasons do not apply
  const isWords = targetType === 'review' || targetType === 'chat_message';
  const reasons = isWords ? REASONS.filter((r) => r.id !== 'unsafe_location' && r.id !== 'wrong_info') : targetType === 'spot' ? [...REASONS.filter((r) => r.places), ...REASONS.filter((r) => !r.places && r.id !== 'unsafe_location')] : REASONS;
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason) return setError('เลือกเหตุผลที่รายงาน');
    if (reason === 'other' && details.trim().length < 5) return setError('เล่าสั้นๆ ว่าเกิดอะไรขึ้น');
    setError(null);
    setIsSending(true);
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType, targetId, targetTitle, reason, details: subject ? `[กลุ่ม: ${subject}] ${details}` : details }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(res.status === 401 ? 'เข้าสู่ระบบก่อนจึงจะส่งรายงานได้' : data?.message || 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      setIsSent(true);
      onReportSubmitted?.(REASONS.find((r) => r.id === reason)?.title ?? reason, details);
    } catch {
      setError('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <DialogShell onClose={onClose} size="sm" title="ส่งรายงานแล้ว" subtitle="ขอบคุณที่ช่วยดูแลคอมมูนิตี้ ทีมงานจะตรวจสอบ และจะไม่บอกใครว่าคุณเป็นผู้รายงาน">
        <div className="flex justify-center">
          <button type="button" data-autofocus onClick={onClose} className={dialogButton.primary}>เข้าใจแล้ว</button>
        </div>
      </DialogShell>
    );
  }

  return (
    <DialogShell onClose={onClose} size="md" title="รายงานให้ทีมงาน" subtitle={subject ? `${subject} · ${targetTitle}` : targetTitle}>
      <form onSubmit={submit} className="space-y-5 text-left">
        <p className="text-sm font-medium text-slate-600 leading-relaxed p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          รายงานนี้ส่งถึงทีมงานเท่านั้น ผู้ถูกรายงานจะไม่เห็นว่าใครเป็นคนส่ง
        </p>

        <fieldset>
          <legend className="block text-sm font-bold text-slate-900 mb-2">เกิดอะไรขึ้น</legend>
          <div className="space-y-2">
            {reasons.map((item) => {
              const selected = reason === item.id;
              return (
                <label key={item.id} className={`relative flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#2563EB]/40 ${selected ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="radio" name={`${uid}-reason`} value={item.id} checked={selected} onChange={() => { setReason(item.id); setError(null); }} className="sr-only" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{item.title}</span>
                    <span className="block mt-0.5 text-xs font-medium text-slate-500 leading-relaxed">{item.text}</span>
                  </span>
                  {selected && <Check className="w-4 h-4 shrink-0 text-[#2563EB] mt-0.5" aria-hidden="true" />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${uid}-details`} className="block text-sm font-bold text-slate-900 mb-1.5">
            รายละเอียด
            {reason !== 'other' && <span className="ml-1.5 text-xs font-medium text-slate-500">(ไม่บังคับ)</span>}
          </label>
          <textarea id={`${uid}-details`} rows={3} value={details} maxLength={500} onChange={(e) => { setDetails(e.target.value); setError(null); }} placeholder="สิ่งที่เห็นหรือข้อความที่ได้รับ ช่วยให้ทีมงานตรวจได้เร็วขึ้น"
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" />
        </div>

        {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className={dialogButton.quiet}>ยกเลิก</button>
          <button type="submit" disabled={isSending} className={dialogButton.primary}>
            {isSending ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> กำลังส่ง…</> : 'ส่งรายงาน'}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
