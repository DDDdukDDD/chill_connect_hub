'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { optimizedImage } from '@/lib/optimizedImage';
import { localNow, thaiShortDate } from '@/lib/trips/story';
import type { TripSuggestion } from '@/lib/trips/suggest';

/**
 * "วันนี้ไป 3 ที่ เล่าเป็นเรื่องไหม" (owner 2026-11-27, lib/trips/suggest.ts): a trip offered from a day or weekend of
 * moments. "เล่าเป็นเรื่อง" makes the draft and opens its story, whose end has "เผยแพร่เลย". "ไว้ก่อน" hides this
 * offer on this device; the next day out brings a new one. Nothing shows when there is no offer.
 */

const DISMISSED_KEY = 'chillwaa:trip-suggest-dismissed';
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
const keyOf = (s: Pick<TripSuggestion, 'from' | 'to'>) => `${s.from}_${s.to}`;

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function whenWord(s: TripSuggestion): string {
  const today = localNow().slice(0, 10);
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (s.from !== s.to) return s.to >= yesterday ? 'สุดสัปดาห์นี้' : 'สุดสัปดาห์ที่แล้ว';
  if (s.from === today) return 'วันนี้';
  if (s.from === yesterday) return 'เมื่อวาน';
  return `วัน${THAI_DAYS[new Date(`${s.from}T00:00:00Z`).getUTCDay()]}ที่ ${thaiShortDate(s.from)}`;
}

export function SuggestedTripCard({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<TripSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetch('/api/trips/suggest', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        const s = json?.suggestion as TripSuggestion | null;
        if (live && s && !readDismissed().includes(keyOf(s))) setSuggestion(s);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!suggestion) return null;

  const tell = async () => {
    setBusy(true);
    setError('');
    const json = await fetch('/api/trips/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: suggestion.from, to: suggestion.to }) })
      .then((r) => r.json())
      .catch(() => null);
    if (json?.success && json.id) {
      router.push(`/trips/${json.id}/edit?play=1`);
      return;
    }
    setBusy(false);
    setError(json?.message || 'สร้างเรื่องไม่สำเร็จ ลองอีกครั้งนะ');
  };
  const later = () => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...readDismissed(), keyOf(suggestion)].slice(-20)));
    setSuggestion(null);
  };

  return (
    <section aria-label="เล่าเป็นเรื่อง" className={`rounded-3xl bg-rose-50/70 p-4 ${className}`}>
      <div className="flex items-center gap-3.5">
        <div className="flex shrink-0 -space-x-4">
          {suggestion.covers.map((src, i) => (
            <img key={src} src={optimizedImage(src, 160)} alt="" className="size-14 rounded-2xl border-2 border-white bg-slate-100 object-cover shadow-sm" style={{ transform: `rotate(${(i - 1) * 6}deg)` }} />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-base font-bold text-slate-900">
            <Sparkles className="size-4 shrink-0 text-[#E11D48]" aria-hidden />
            <span>
              {whenWord(suggestion)}ไป {suggestion.places.length} ที่ เล่าเป็นเรื่องไหม
            </span>
          </p>
          <p className="mt-0.5 truncate text-sm text-slate-600">{suggestion.places.join(' · ')}</p>
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={tell}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? 'กำลังทำเรื่อง…' : `เล่าเป็นเรื่องจาก ${suggestion.momentCount} โมเมนต์`}
        </button>
        <button type="button" onClick={later} className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
          ไว้ก่อน
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700" role="alert">{error}</p>}
    </section>
  );
}
