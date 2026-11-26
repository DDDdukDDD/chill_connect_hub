'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MomentsChrome } from '@/components/moments/MomentsChrome';
import { localNow, MAX_TRIP_TITLE, type TripVisibility } from '@/lib/trips/story';

export const VISIBILITY_OPTIONS: { value: TripVisibility; label: string; hint: string }[] = [
  { value: 'public', label: 'ทุกคน', hint: 'ขึ้นฟีดและหาเจอได้ ช่วยให้คนอื่นไปตามรอยได้' },
  { value: 'followers', label: 'ผู้ติดตาม', hint: 'เห็นเฉพาะคนที่ติดตามคุณ' },
  { value: 'private', label: 'เฉพาะฉัน', hint: 'เก็บไว้ดูเอง' },
];

export function VisibilitySwitch({ value, onChange }: { value: TripVisibility; onChange: (value: TripVisibility) => void }) {
  const hint = VISIBILITY_OPTIONS.find((o) => o.value === value)?.hint;
  return (
    <div>
      <div role="radiogroup" aria-label="ใครเห็นทริปนี้" className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1">
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer whitespace-nowrap rounded-full py-2 text-sm font-medium transition ${value === option.value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]';

/** /trips/new: a name and the days, nothing else; photos come in the editor */
export function TripCreate() {
  const router = useRouter();
  const today = localNow().slice(0, 10);
  const [title, setTitle] = useState('');
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [visibility, setVisibility] = useState<TripVisibility>('public');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, startsOn, endsOn: endsOn < startsOn ? startsOn : endsOn, visibility }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!json?.success) {
      setBusy(false);
      setError(json?.message || 'สร้างทริปไม่สำเร็จ ลองอีกครั้งนะ');
      return;
    }
    router.push(`/trips/${json.id}/edit`);
  };

  return (
    <MomentsChrome>
      {() => (
        <main className="mx-auto max-w-lg px-4 pb-32 pt-8 sm:pt-12">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">เล่าทริปใหม่</h1>
          <p className="mt-2 text-sm text-slate-500">ไม่ต้องเป็นทริปใหญ่ แค่วันเสาร์ไปกิน เดินเล่น 3 ที่ ก็เล่าเป็นเรื่องได้ ไปหลายเมืองระบบแบ่งทริปย่อยให้เอง ระหว่างทริป โมเมนต์ที่โพสต์จะเข้าทริปให้เอง</p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">ชื่อทริป</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TRIP_TITLE}
                placeholder="เช่น เสาร์นี้ตะลุยเยาวราช หรือ จีน–ฮ่องกง 10 วัน"
                className={`${inputClass} mt-2`}
                autoFocus
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">วันเริ่ม</span>
                <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={`${inputClass} mt-2`} required />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">วันกลับ</span>
                <input type="date" value={endsOn} min={startsOn} onChange={(e) => setEndsOn(e.target.value)} className={`${inputClass} mt-2`} required />
              </label>
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-900">ใครเห็นทริปนี้</span>
              <div className="mt-2">
                <VisibilitySwitch value={visibility} onChange={setVisibility} />
              </div>
            </div>

            {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={busy || title.trim().length < 2}
              className="flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2563EB] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {busy ? 'กำลังสร้าง…' : 'สร้างทริป แล้วเลือกรูป'}
            </button>
          </form>
        </main>
      )}
    </MomentsChrome>
  );
}
