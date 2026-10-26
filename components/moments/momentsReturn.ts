import type { FeedItem } from '@/lib/moments/service';

/**
 * Coming back from a moment to /moments where the reader left it: the tab, the cards loaded so far and the
 * scroll position are kept in this tab's sessionStorage when a card is opened, and put back on the way back.
 * Storage can be missing (private mode, blocked site data), so every read and write fails quietly.
 */

const SNAPSHOT_KEY = 'moments:showcase';
const RETURNING_KEY = 'moments:returning';
/** The "on the way back" mark only counts for a moment, so a later visit from the menu starts fresh */
const RETURN_WINDOW_MS = 5000;

export interface ShowcaseSnapshot {
  /** /moments with its tab, e.g. /moments?type=spot */
  url: string;
  /** The moment that was opened */
  momentId: string;
  moments: FeedItem[];
  page: number;
  hasMore: boolean;
  scrollY: number;
}

function read(): ShowcaseSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as ShowcaseSnapshot) : null;
  } catch {
    return null;
  }
}

function write(snapshot: ShowcaseSnapshot) {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // too big or storage blocked: the way back simply starts fresh
  }
}

/** Called when a card is opened; comments are left out since the cards only show their count */
export function saveShowcase(snapshot: ShowcaseSnapshot) {
  write({ ...snapshot, moments: snapshot.moments.map((moment) => ({ ...moment, comments: [] })) });
}

/** Where the moment page's back link goes: the tab it was opened from, or /moments when it was opened elsewhere */
export function showcaseUrlFor(momentId: string): string | null {
  const snapshot = read();
  return snapshot?.momentId === momentId ? snapshot.url : null;
}

/** The moment page is being left back towards the grid it was opened from */
export function markReturning(momentId: string) {
  if (read()?.momentId !== momentId) return;
  try {
    sessionStorage.setItem(RETURNING_KEY, String(Date.now()));
  } catch {
    // nothing to put back then
  }
}

/** Keeps the saved card in step with hearts and comments given on the moment's page; `null` drops a deleted one */
export function updateSavedMoment(momentId: string, moment: Pick<FeedItem, 'isLiked' | 'likesCount' | 'commentsCount' | 'isSaved'> | null) {
  const snapshot = read();
  if (!snapshot || !snapshot.moments.some((m) => m.id === momentId)) return;
  write({
    ...snapshot,
    moments: moment ? snapshot.moments.map((m) => (m.id === momentId ? { ...m, ...moment } : m)) : snapshot.moments.filter((m) => m.id !== momentId),
  });
}

/** On the grid: the saved state when the reader has just come back to this same URL, otherwise null */
export function takeShowcase(url: string): ShowcaseSnapshot | null {
  let returning = 0;
  try {
    returning = Number(sessionStorage.getItem(RETURNING_KEY)) || 0;
    sessionStorage.removeItem(RETURNING_KEY);
  } catch {
    return null;
  }
  if (Date.now() - returning > RETURN_WINDOW_MS) return null;
  const snapshot = read();
  return snapshot?.url === url ? snapshot : null;
}
