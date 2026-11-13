'use client';

import { useEffect } from 'react';
import { CLICK_REF, OUTBOUND_KINDS, classifyHref, targetOfPath, type ClickTargetType, type LinkKind, type OutboundKind } from './linkKinds';

/**
 * Browser side of step 4 in docs/TRACEABILITY.md: counts taps that leave the site and sponsored card views and taps.
 * Sent with navigator.sendBeacon so leaving the page does not lose it; nothing waits on it and nothing breaks without it.
 */

function send(kind: LinkKind, type: ClickTargetType, ref: string) {
  if (!ref || !CLICK_REF.test(ref)) return;
  const body = JSON.stringify({ kind, type, ref });
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    // fall through to fetch
  }
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

/**
 * While a detail page is open, counts every tap on a link that leaves the site (map, website, tickets, LINE...), so the
 * page's links need no changes. A link can name its kind with data-out-kind="ticket"; data-out-ignore skips a part.
 */
export function useOutboundTracking(type: ClickTargetType, ref: string | undefined) {
  useEffect(() => {
    if (!ref || !CLICK_REF.test(ref)) return;
    const onClick = (event: MouseEvent) => {
      if (event.button > 1) return;
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.closest('[data-out-ignore]')) return;
      const href = link.href;
      if (!/^tel:/i.test(href)) {
        try {
          if (new URL(href).origin === window.location.origin) return;
        } catch {
          return;
        }
      }
      const named = link.dataset.outKind as OutboundKind | undefined;
      const kind = named && (OUTBOUND_KINDS as readonly string[]).includes(named) ? named : classifyHref(href);
      if (kind) send(kind, type, ref);
    };
    // Capture, and auxclick for a middle click: a link that stops the event still counts
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
    };
  }, [type, ref]);
}

const VIEW_KEY = 'cw_sp_seen';

/** One view per sponsored card per browser per Bangkok day, so scrolling past it again or reloading does not inflate it */
function firstViewToday(type: ClickTargetType, ref: string): boolean {
  const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const key = `${day}|${type}|${ref}`;
  try {
    const list: unknown = JSON.parse(localStorage.getItem(VIEW_KEY) || '[]');
    const seen = (Array.isArray(list) ? list : []).filter((k): k is string => typeof k === 'string' && k.startsWith(day));
    if (seen.includes(key)) return false;
    localStorage.setItem(VIEW_KEY, JSON.stringify([...seen, key].slice(-40)));
    return true;
  } catch {
    // Storage blocked: once per page load instead
    const w = window as unknown as { __cwSpSeen?: Set<string> };
    w.__cwSpSeen ??= new Set();
    if (w.__cwSpSeen.has(key)) return false;
    w.__cwSpSeen.add(key);
    return true;
  }
}

/**
 * Watches the sponsored card around `badge` (the "สนับสนุน" chip): a view once half the card is on screen for a second,
 * and a tap on the card's link. The card is found from the chip, so the tiles need no changes. Returns a stop function.
 */
export function watchSponsored(badge: HTMLElement): () => void {
  const link = badge.closest('a[href]') as HTMLAnchorElement | null;
  const target = link ? targetOfPath(new URL(link.href, window.location.origin).pathname) : null;
  if (!link || !target || typeof IntersectionObserver === 'undefined') return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
        timer ??= setTimeout(() => {
          observer.disconnect();
          if (firstViewToday(target.type, target.ref)) send('sponsored_view', target.type, target.ref);
        }, 1000);
      } else if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    },
    { threshold: [0, 0.5, 1] }
  );
  observer.observe(link);
  const onTap = () => send('sponsored_click', target.type, target.ref);
  link.addEventListener('click', onTap);
  return () => {
    observer.disconnect();
    clearTimeout(timer);
    link.removeEventListener('click', onTap);
  };
}
