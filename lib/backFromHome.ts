'use client';

import { useEffect } from 'react';

/**
 * Back to the home page when a page was opened from it (owner 2026-11-16): a Circle, a plan or a card on home opens a
 * challenge, ตี้, อีเวนต์ or place, and that page's back link says "กลับหน้าหลัก" and returns there, instead of to the
 * section's own list. The home page notes which page a tap left for, in this tab only; a detail page reads it.
 * Posts have their own return (components/moments/momentsReturn.ts).
 */
const KEY = 'back:home';
/** A note older than this is stale: the reader has moved on */
const FRESH_MS = 30 * 60 * 1000;

function remember(path: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // Storage blocked: the back link keeps its usual place
  }
}

/** True when the page at `pathname` was opened from home in this tab, a moment ago */
export function cameFromHome(pathname: string): boolean {
  try {
    const note = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { path?: string; at?: number } | null;
    return Boolean(note && note.path === pathname && typeof note.at === 'number' && Date.now() - note.at < FRESH_MS);
  } catch {
    return false;
  }
}

/** On the home page: every link followed from it (dialogs on top of it too) is noted as left from home */
export function useHomeExitNote() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === '/') return;
      remember(url.pathname);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}
