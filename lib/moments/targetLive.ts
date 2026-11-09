/**
 * What a moment's ตี้, อีเวนต์, challenge or place offers right now, for the slim line under a feed post
 * ("ส. 26 ธ.ค. · เหลือ 4 ที่ · ขอไปด้วย"). Only what still invites the reader is sent: an ended ตี้ or อีเวนต์ has no
 * entry and its line stays as it was (owner 2026-10-26: the page itself leads on).
 */
export type TargetLive =
  /** A ตี้ still taking people */
  | { kind: 'meetup'; startsAt: string; seatsLeft: number | null }
  /** An อีเวนต์ not ended yet */
  | { kind: 'fair'; startsAt: string; endsAt: string }
  /** A challenge still open */
  | { kind: 'challenge'; xp: number }
  /** A place open at this moment (closed or unknown hours send nothing) */
  | { kind: 'spot'; openNow: true };

export const liveKey = (type: string, ref: string) => `${type}:${ref}`;
