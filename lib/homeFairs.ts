import type { EventItem } from '@/data/mockData';
import { isTradeEvent } from '@/lib/highlights';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';

/**
 * The home page's อีเวนต์ row, shared by the server page (which now sends only these, not every อีเวนต์) and the
 * browser (which still picks from a full list when a member signs in on the page).
 */

/** The kinds named in the home page fair heading, and how many fairs that row shows */
export const FAIR_ROW_KINDS = ['fair', 'run', 'concert'] as const;
export const FAIR_ROW_SHOWN = 6;

/** 'other' (a ceremony, a festival, a workshop…) gets no kind word, rather than a wrong "เอ็กซ์โป" */
export const fairKind = (e: EventItem): (typeof FAIR_ROW_KINDS)[number] | 'other' => {
  const text = `${e.title} ${e.tag}`;
  if (/วิ่ง|มาราธอน|เทรล|marathon|\brun\b|trail/i.test(text)) return 'run';
  if (/คอนเสิร์ต|ดนตรีสด|concert|live music/i.test(text)) return 'concert';
  if (/เอ็กซ์โป|expo|แฟร์|\bfair\b|มหกรรม|แสดงสินค้า|นิทรรศการ|exhibition|trade show|convention|congress/i.test(text)) return 'fair';
  return 'other';
};

/** Places and fairs the member home's journey band picks from, three at a time ("สุ่มใหม่") */
export const BAND_PICK_POOL = 30;

/**
 * The events the home page sends: every ตี้ (the สาย cards count and filter them), and of the อีเวนต์ only the row,
 * plus for a member the band's pool of the soonest. Was every อีเวนต์ (78 of 149 events, 2026-10-29).
 */
export function homeEvents(upcoming: EventItem[], forMember: boolean): { events: EventItem[]; fairTotal: number } {
  const fairs = upcoming
    .filter((e) => e.eventType === 'public_venue')
    .sort((a, b) => parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date));
  // Twice the row: the browser drops what has ended by its own clock (Bangkok, while the server runs on UTC, or a tab
  // left open overnight) and re-picks six from the rest, so the row never shrinks (was 2 of 6 on an iPad, 2026-10-31)
  const keep = new Set([...pickFairRow(fairs, FAIR_ROW_SHOWN * 2), ...(forMember ? fairs.slice(0, BAND_PICK_POOL) : [])]);
  return { events: upcoming.filter((e) => e.eventType !== 'public_venue' || keep.has(e)), fairTotal: fairs.length };
}

/** From อีเวนต์ not over, soonest first: the row's six, still in date order */
export function pickFairRow(fairsByDate: EventItem[], count = FAIR_ROW_SHOWN): EventItem[] {
  const matched = [...fairsByDate]
    // Trade shows stay listed on /events but go last here (the sort keeps the date order within each group)
    .sort((a, b) => Number(isTradeEvent(a)) - Number(isTradeEvent(b)));
  // The heading promises "เอ็กซ์โป งานวิ่ง คอนเสิร์ต": the soonest of each kind in turn (two rounds), then the rest by date
  const byKind = FAIR_ROW_KINDS.map((kind) => matched.filter((e) => fairKind(e) === kind));
  const turns = [0, 1].flatMap((round) => byKind.map((list) => list[round])).filter((e): e is EventItem => !!e);
  const picked = [...turns, ...matched.filter((e) => !turns.includes(e))].slice(0, count);
  return matched.filter((e) => picked.includes(e));
}
