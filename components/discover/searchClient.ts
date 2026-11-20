'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { SearchResult, SearchStart } from '@/lib/search/siteSearch';
import { hashtagHref } from '@/lib/moments/hashtags';

/**
 * What the search box, the phone search screen and /search share (BE-441): asking GET /api/search while typing, the
 * recent searches kept on this device, and moving through results with the arrow keys.
 */

/** "#คาเฟ่" alone: the tag's own page */
export const tagOfQuery = (query: string): string | null => {
  const match = /^#+([\p{L}\p{M}\p{N}_]+)$/u.exec(query.trim());
  return match ? match[1] : null;
};

/** Where Enter goes: a tag's page for "#tag", otherwise the results page */
export const searchHref = (query: string): string => {
  const tag = tagOfQuery(query);
  return tag ? hashtagHref(tag) : `/search?q=${encodeURIComponent(query.trim())}`;
};

export type SearchAnswer = { kind: 'start'; start: SearchStart } | { kind: 'found'; result: SearchResult };

/**
 * Asks GET /api/search a moment after typing stops. An empty word asks for the start (what to show before typing)
 * when `enabled`; the dropdown passes false while closed so a page load costs nothing.
 */
export function useSearch(query: string, { enabled = true, province }: { enabled?: boolean; province?: string } = {}) {
  const word = query.replace(/\s+/g, ' ').trim();
  const [answer, setAnswer] = useState<{ word: string; value: SearchAnswer } | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: word });
      if (province) params.set('province', province);
      fetch(`/api/search?${params}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((json) => {
          if (!active || !json?.success) return;
          setAnswer({ word, value: json.start ? { kind: 'start', start: json.start } : { kind: 'found', result: json } });
        })
        .catch(() => undefined)
        .finally(() => active && setLoading(false));
    }, word ? 200 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [word, enabled, province]);
  // An answer for an older word is not shown under a new one
  return { answer: answer && answer.word === word ? answer.value : null, loading, word };
}

/* ---------- Recent searches (this device only, like IG's) ---------- */

const RECENT_KEY = 'search-recent';
const RECENT_MAX = 8;
const RECENT_EVENT = 'search-recent-changed';

const parseRecent = (raw: string): string[] => {
  try {
    const list = JSON.parse(raw || '[]');
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};
const rawRecent = () => {
  try {
    return localStorage.getItem(RECENT_KEY) ?? '';
  } catch {
    return '';
  }
};

export const readRecent = (): string[] => parseRecent(rawRecent());

function writeRecent(list: string[]): string[] {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Private mode: nothing is remembered
  }
  window.dispatchEvent(new Event(RECENT_EVENT));
  return list;
}

const subscribeRecent = (onChange: () => void) => {
  window.addEventListener(RECENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(RECENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** The recent searches, kept in step with every box on the page; none in the server HTML */
export function useRecent(): string[] {
  const raw = useSyncExternalStore(subscribeRecent, rawRecent, () => '');
  return useMemo(() => parseRecent(raw), [raw]);
}

/** Newest first, each word once (case aside) */
export function addRecent(query: string): string[] {
  const word = query.replace(/\s+/g, ' ').trim();
  if (!word || word.replace(/^#+/, '') === '') return readRecent();
  return writeRecent([word, ...readRecent().filter((item) => item.toLowerCase() !== word.toLowerCase())].slice(0, RECENT_MAX));
}

export const removeRecent = (query: string): string[] => writeRecent(readRecent().filter((item) => item !== query));
export const clearRecent = (): string[] => writeRecent([]);

/* ---------- Arrow keys ---------- */

/**
 * Up and down through the results (`data-search-option`), as on IG and Google's box. Down from the box goes to the
 * first result; up from the first goes back to the box.
 */
export function moveThroughResults(panel: HTMLElement | null, dir: 1 | -1, input?: HTMLElement | null) {
  if (!panel) return;
  const items = [...panel.querySelectorAll<HTMLElement>('[data-search-option]')].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const at = items.indexOf(document.activeElement as HTMLElement);
  const next = at + dir;
  if (next < 0) {
    input?.focus();
    return;
  }
  items[Math.min(next, items.length - 1)].focus();
}
