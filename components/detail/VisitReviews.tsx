'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  at: string;
}

const TAGS: Record<'spot' | 'fair', string[]> = {
  spot: ['วิวดี', 'บรรยากาศดี', 'คนน้อย', 'คนเยอะ', 'ที่จอดรถหายาก'],
  fair: ['คุ้มค่า', 'ร้านเยอะ', 'คนแน่นมาก', 'เดินทางง่าย', 'ที่จอดรถหายาก'],
};

/**
 * Ratings and short reviews of a place or fair (the "จบ" phase there). Going on your own is personal and needs no proof
 * (owner 2026-10-23), so anyone who pressed "มาที่นี่แล้ว" can rate it; the form opens for them here.
 */
export function VisitReviews({ targetType, targetId, isLoggedIn }: { targetType: 'spot' | 'fair'; targetId: string; isLoggedIn: boolean }) {
  const [data, setData] = useState<{ count: number; average: number; reviews: Review[] } | null>(null);
  const [marked, setMarked] = useState<{ rating?: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/visits?reviews=${encodeURIComponent(`${targetType}:${targetId}`)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json?.success && setData(json))
      .catch(() => undefined);
  }, [targetType, targetId]);

  useEffect(() => {
    load();
    if (!isLoggedIn) return;
    fetch('/api/visits?mine=1', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const mark = (json?.marks ?? []).find((m: { targetType: string; targetId: string }) => m.targetType === targetType && m.targetId === targetId);
        setMarked(mark ?? null);
      })
      .catch(() => undefined);
  }, [load, isLoggedIn, targetType, targetId]);

  const submit = async () => {
    if (!rating || busy) return;
    setBusy(true);
    setError('');
    const review = [tags.join(' · '), text.trim()].filter(Boolean).join(' — ').slice(0, 300);
    const res = await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark', targetType, targetId, rating, review }) }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(json?.message || 'ส่งรีวิวไม่สำเร็จ ลองอีกครั้งนะ');
    setSent(true);
    load();
  };

  const canReview = Boolean(marked) && !marked?.rating && !sent;

  return (
    <section className="space-y-3" aria-labelledby={`reviews-${targetId}`}>
      <h2 id={`reviews-${targetId}`} className="text-lg sm:text-xl font-bold text-slate-900">
        รีวิว
        {data && data.count > 0 && (
          <span className="ml-2 text-base font-semibold text-slate-600">
            <span className="text-amber-500">★</span> {data.average} · {data.count} คนให้คะแนน
          </span>
        )}
      </h2>

      {canReview && (
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">{targetType === 'spot' ? 'ที่นี่เป็นยังไงบ้าง' : 'งานนี้เป็นยังไงบ้าง'}</p>
          <div className="mt-1 flex gap-1" role="radiogroup" aria-label="ให้คะแนน">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ดาว`} onClick={() => setRating(n)} className="w-10 h-10 flex items-center justify-center cursor-pointer">
                <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAGS[targetType].map((tag) => {
              const on = tags.includes(tag);
              return (
                <button key={tag} type="button" aria-pressed={on} onClick={() => setTags((l) => (on ? l.filter((t) => t !== tag) : [...l, tag]))} className={`h-9 px-4 rounded-full text-sm font-semibold border cursor-pointer ${on ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-200 text-slate-700'}`}>
                  {tag}
                </button>
              );
            })}
          </div>
          <label htmlFor={`review-text-${targetId}`} className="mt-3 block text-sm text-slate-600">ทิปสำหรับคนที่จะไป (ไม่บังคับ)</label>
          <textarea id={`review-text-${targetId}`} rows={2} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder={targetType === 'spot' ? 'เช่น มาก่อน 7 โมง คนน้อย' : 'เช่น ไปวันธรรมดา เดินสบายกว่า'} className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" />
          {error && <p className="mt-1 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
          <button type="button" onClick={submit} disabled={!rating || busy} className="mt-3 h-11 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white text-sm font-semibold cursor-pointer">
            {busy ? 'กำลังส่ง…' : 'ส่งรีวิว'}
          </button>
        </div>
      )}
      {sent && <p className="text-sm text-emerald-700 font-semibold">ขอบคุณสำหรับรีวิว</p>}
      {!marked && isLoggedIn && (data?.reviews.length ?? 0) === 0 && <p className="text-sm text-slate-500">เคยไปแล้ว? กด &quot;มาที่นี่แล้ว&quot; แล้วให้คะแนนได้เลย</p>}

      {data && data.reviews.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.reviews.map((r) => (
            <li key={r.id} className="py-3 text-sm text-slate-700">
              <p>
                <strong className="text-slate-900">{r.authorName}</strong> <span className="text-amber-500" aria-label={`${r.rating} ดาว`}>{'★'.repeat(r.rating)}</span>{' '}
                <span className="text-slate-500">· {new Date(r.at).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}</span>
              </p>
              <p className="mt-0.5">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
      {data && data.count === 0 && !canReview && <p className="text-sm text-slate-500">ยังไม่มีรีวิว</p>}
    </section>
  );
}
