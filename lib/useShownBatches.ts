'use client';

import { useEffect, useRef, useState } from 'react';

const STORE_KEY = 'list-batches';
// How long to keep trying to reach the old place while the restored batches arrive
const RESTORE_MS = 4000;
// A page drawn this soon after the back button is what it brought back (it may wait for the network first)
const BACK_WINDOW_MS = 5000;
// Drawn and gone this fast: nothing was read, so what is stored stays
const JUST_DRAWN_MS = 1000;

// Set by the browser's back and forward buttons; a list opened from a link starts at its top
let cameBackAt = 0;
let restoringUntil = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    cameBackAt = Date.now();
  });
}

const here = () => `${window.location.pathname}${window.location.search}`;

function readStored(): { where: string; batches: number; y: number } | null {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeStored(value: { where: string; batches: number; y: number } | null) {
  try {
    if (value) sessionStorage.setItem(STORE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    // Private mode: back just returns to the first batch
  }
}

/** Follows the page down until it has grown enough to reach `y`; any touch or wheel leaves the reader in charge */
function scrollBackTo(y: number) {
  const stopAt = Date.now() + RESTORE_MS;
  let stopped = false;
  const stop = () => {
    stopped = true;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  const step = () => {
    if (stopped) return;
    // Instant: the site scrolls smoothly by default, which would never arrive while this repeats
    window.scrollTo({ top: y, behavior: 'instant' });
    if (Math.abs(window.scrollY - y) < 2 || Date.now() > stopAt) return stop();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * How many batches a ค้นพบ list has on screen. Leaving for a detail page and pressing back returns to the same length
 * and place, even though the page is drawn anew; filters still reset it with setBatches(1).
 */
export function useShownBatches() {
  const [batches, setBatches] = useState(1);
  const latest = useRef({ where: '', batches: 1, y: 0 });

  useEffect(() => {
    const drawnAt = Date.now();
    // A moment later: the router draws the page before the browser's back event reaches the listener above
    const afterDraw = setTimeout(() => {
      if (Date.now() - cameBackAt > BACK_WINDOW_MS) return;
      const stored = readStored();
      if (!stored || stored.where !== here() || stored.batches <= 1) return;
      restoringUntil = Date.now() + RESTORE_MS;
      setBatches(stored.batches);
      scrollBackTo(stored.y);
    }, 0);
    const onScroll = () => {
      latest.current = { where: here(), batches: latest.current.batches, y: window.scrollY };
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(afterDraw);
      window.removeEventListener('scroll', onScroll);
      if (Date.now() - drawnAt < JUST_DRAWN_MS || Date.now() < restoringUntil) return;
      // The address has already changed by now, so this keeps the one seen last while on the list
      writeStored(latest.current.batches > 1 ? latest.current : null);
    };
  }, []);

  useEffect(() => {
    latest.current = { where: here(), batches, y: window.scrollY };
  }, [batches]);

  return [batches, setBatches] as const;
}
