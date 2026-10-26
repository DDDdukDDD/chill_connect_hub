'use client';

import { useEffect, useState } from 'react';
import { recall, remember } from './clientMemory';
import type { MyMonth } from '@/lib/social/myMonth';

export type { MonthItem, MyMonth } from '@/lib/social/myMonth';

/**
 * The signed-in member's month: places and fairs they went to (Chill) and meetups they went to (Connect),
 * from GET /api/visits?mine=1&month=1. Home shows the counts; My Hub lists them.
 */
export function useMyMonth(isLoggedIn: boolean) {
  const [state, setState] = useState<{ isLoaded: boolean; month: MyMonth | null }>(() => recall('my-month') ?? { isLoaded: false, month: null });

  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch('/api/visits?mine=1&month=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive) setState(remember('my-month', { isLoaded: true, month: json?.month ?? null }));
      })
      .catch(() => {
        if (alive) setState({ isLoaded: true, month: null });
      });
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // Signed out there is nothing to load
  return isLoggedIn ? state : { isLoaded: true, month: null };
}
