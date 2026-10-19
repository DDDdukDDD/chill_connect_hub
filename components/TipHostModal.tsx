'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';

interface TipHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  /** Called after the server saved the review. The third argument is always 0: tipping is not offered until payments exist. */
  onTipSubmit: (rating: number, reviewText: string, tipAmount: number) => void;
}

const RATING_WORDS = ['', 'ไม่ประทับใจ', 'พอใช้', 'ดี', 'ดีมาก', 'ประทับใจมาก'];
const plain = (value: string) => value.replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();

/**
 * Review of an event the member attended: stars and an optional short note, saved through
 * POST /api/events/{id}/review. (The file keeps its old name; it no longer handles tips.)
 */
export const TipHostModal: React.FC<TipHostModalProps> = ({ isOpen, onClose, event, onTipSubmit }) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !event) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.id)}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, text: reviewText }) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) return setError(json?.message || 'ส่งรีวิวไม่สำเร็จ ลองอีกครั้งนะ');
      onTipSubmit(rating, reviewText, 0);
      setReviewText('');
      onClose();
    } catch {
      setError('เชื่อมต่อไม่ได้ ลองอีกครั้งนะ');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DialogShell onClose={onClose} title="รีวิวตี้" subtitle={event.hostName ? `${event.title} · จัดโดย ${plain(event.hostName)}` : event.title} size="sm">
      <form onSubmit={submit}>
        <fieldset className="mb-5">
          <legend className="text-sm font-bold text-slate-900 mb-2">ให้คะแนน</legend>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="คะแนน 1 ถึง 5 ดาว">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ดาว`}
                onClick={() => setRating(n)}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 shrink-0"
              >
                <Star className={`w-7 h-7 ${n <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} aria-hidden="true" />
              </button>
            ))}
            <span className="ml-1 text-sm font-bold text-slate-700 whitespace-nowrap" aria-live="polite">{RATING_WORDS[rating]}</span>
          </div>
        </fieldset>

        <label htmlFor="review-text" className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-bold text-slate-900">เล่าให้คนอื่นฟังหน่อย</span>
          <span className="text-xs font-medium text-slate-500">ไม่บังคับ · {reviewText.length}/300</span>
        </label>
        <textarea
          id="review-text"
          rows={3}
          maxLength={300}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="บรรยากาศเป็นยังไง คนจัดดูแลดีไหม"
          className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed placeholder:text-slate-400"
        />
        <p className="mt-2 text-xs font-medium text-slate-500">รีวิวจะแสดงบนโปรไฟล์ของคนจัด พร้อมชื่อของคุณ</p>

        {error && (
          <p role="alert" className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">{error}</p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button type="button" className={dialogButton.quiet} onClick={onClose}>ไว้ทีหลัง</button>
          <button type="submit" className={dialogButton.primary} disabled={isSending}>{isSending ? 'กำลังส่ง…' : 'ส่งรีวิว'}</button>
        </div>
      </form>
    </DialogShell>
  );
};
