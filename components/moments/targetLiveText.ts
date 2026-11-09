import type { TargetLive } from '@/lib/moments/targetLive';

const DAY = 86_400_000;
const bangkokDay = (ms: number) => Math.floor((ms + 7 * 3_600_000) / DAY);
const WEEKDAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];

/** "วันนี้", "พรุ่งนี้", "เสาร์นี้" within the week, otherwise "26 ธ.ค." (Bangkok time) */
export function nearDay(iso: string, now = Date.now()): string {
  const at = Date.parse(iso);
  const days = bangkokDay(at) - bangkokDay(now);
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  if (days < 7) return `${WEEKDAY[new Date(at + 7 * 3_600_000).getUTCDay()]}นี้`;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' }).format(at);
}

/**
 * The live part of a post's slim line and, when it changes, the action word: what the reader can still do there.
 * Nothing for targets that no longer invite (the line then reads as before).
 */
export function targetLiveText(live: TargetLive | undefined, now = Date.now()): { status: string; go?: string } | null {
  if (!live) return null;
  if (live.kind === 'meetup') {
    const seats = live.seatsLeft !== null && live.seatsLeft <= 5 ? ` · เหลือ ${live.seatsLeft} ที่` : '';
    return { status: `${nearDay(live.startsAt, now)}${seats}`, go: 'ขอไปด้วย' };
  }
  if (live.kind === 'fair') {
    const started = Date.parse(live.startsAt) <= now;
    return { status: started ? `ถึง${nearDay(live.endsAt, now) === 'วันนี้' ? 'วันนี้' : ` ${nearDay(live.endsAt, now)}`}` : nearDay(live.startsAt, now) };
  }
  if (live.kind === 'challenge') return live.xp > 0 ? { status: `+${live.xp} XP` } : null;
  return { status: 'เปิดอยู่' };
}
