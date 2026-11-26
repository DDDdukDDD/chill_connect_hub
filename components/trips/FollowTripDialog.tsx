'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Footprints, Loader2, X } from 'lucide-react';
import { inputClass } from '@/components/trips/TripCreate';
import { daysBetween, followedLegs, localNow, thaiDateRange, thaiShortDate, type TripView } from '@/lib/trips/story';

/**
 * "ไปตามรอยทริปนี้" (owner 2026-11-26): pick the day to set off, see the sub-trips on one's own days, and get a draft
 * trip of one's own that keeps the route. `plan` is the whole trip or one sub-trip (subTrip()); `legId` names it.
 */
export function FollowTripDialog({ trip, plan, legId, onClose, onToast }: { trip: TripView; plan: TripView; legId?: string; onClose: () => void; onToast: (message: string) => void }) {
  const router = useRouter();
  const [startsOn, setStartsOn] = useState(localNow().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const preview = useMemo(() => followedLegs(plan, startsOn || plan.startsOn), [plan, startsOn]);
  const days = daysBetween(plan.startsOn, plan.endsOn) + 1;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    setBusy(true);
    setError('');
    const json = await fetch(`/api/trips/${trip.id}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsOn, ...(legId ? { legId } : {}) }),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (!json?.success) {
      setBusy(false);
      setError(json?.message || 'สร้างทริปไม่สำเร็จ ลองอีกครั้งนะ');
      return;
    }
    onToast(json.existing ? 'คุณวางแผนทริปนี้ไว้แล้ว' : 'สร้างทริปของคุณแล้ว');
    router.push(`/trips/${json.id}/edit`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="follow-trip-title" onClick={onClose}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="follow-trip-title" className="text-lg font-bold text-slate-900 sm:text-xl">ไปตามรอยทริปนี้</h2>
            <p className="mt-1 text-sm text-slate-500">
              ได้ทริปของคุณเองตามเส้นทางของ {trip.author.name} · {days} วัน
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="ปิด" className="-mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-900">วันที่จะเริ่มเดินทาง</span>
          <input type="date" value={startsOn} min={localNow().slice(0, 10)} onChange={(e) => setStartsOn(e.target.value)} className={`${inputClass} mt-2`} />
        </label>
        {startsOn && <p className="mt-2 text-xs text-slate-500">{thaiDateRange(startsOn, preview.endsOn)}</p>}

        {preview.legs.length > 0 && (
          <ol className="mt-5 space-y-2.5 border-l-2 border-slate-200 pl-4">
            {preview.legs.map((leg, i) => (
              <li key={`${leg.city}-${i}`} className="text-sm">
                <span className="font-semibold text-slate-900">{leg.city}</span>
                <span className="text-slate-500"> · {daysBetween(leg.from, leg.to) + 1} วัน · {leg.from === leg.to ? thaiShortDate(leg.from) : `${thaiShortDate(leg.from)} – ${thaiShortDate(leg.to)}`}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-5 flex gap-2 text-xs leading-relaxed text-slate-500">
          <Footprints className="mt-0.5 size-4 shrink-0 text-[#4A7C59]" aria-hidden />
          ทริปของคุณจะเป็นร่าง แก้วันและเมืองได้ทุกอย่าง ระหว่างทางโพสต์โมเมนต์แล้วรูปจะเข้าทริปเอง
        </p>

        {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy || !startsOn}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2563EB] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? 'กำลังสร้าง…' : 'สร้างทริปของฉัน'}
        </button>
      </div>
    </div>
  );
}
