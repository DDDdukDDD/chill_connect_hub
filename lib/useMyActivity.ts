'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { EventItem } from '@/data/mockData';
import { useMemberSession } from './useMemberSession';

/**
 * The signed-in member's events and saved places, read from the account (GET /api/auth/member/activity).
 * One store for the whole app: My Hub renders from it and every "join" button writes through it.
 *
 * Bridge for older pages: the lists are mirrored into the localStorage keys those pages read
 * (`joined_event_ids`, `favorites`, `favorite_spots`), and hearts toggled there are sent to the account.
 * Pages should move to `useMyActivity()` over time and stop touching localStorage.
 */
export type ActivityEvent = EventItem & { joinedAt?: string; cancelledAt?: string; isHost?: boolean };

interface ActivityState {
  isLoaded: boolean;
  joined: ActivityEvent[];
  hosted: ActivityEvent[];
  cancelled: ActivityEvent[];
  joinedIds: string[];
  savedSpotIds: string[];
  savedEventIds: string[];
}

const EMPTY: ActivityState = { isLoaded: false, joined: [], hosted: [], cancelled: [], joinedIds: [], savedSpotIds: [], savedEventIds: [] };
const MIRROR = { joined: 'joined_event_ids', events: 'favorites', spots: 'favorite_spots' } as const;

let state: ActivityState = EMPTY;
let memberId: string | null = null;
const listeners = new Set<() => void>();

const readList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};
const writeList = (key: string, value: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

function setState(next: Partial<ActivityState>, mirrorSaved = true) {
  state = { ...state, ...next };
  if (typeof window !== 'undefined') {
    writeList(MIRROR.joined, state.joinedIds);
    if (mirrorSaved && memberId) {
      writeList(MIRROR.events, state.savedEventIds);
      writeList(MIRROR.spots, state.savedSpotIds);
    }
  }
  listeners.forEach((l) => l());
}

async function post(body: Record<string, unknown>) {
  try {
    const res = await fetch('/api/auth/member/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

export const activityActions = {
  refresh: async () => {
    if (!memberId) return setState({ ...EMPTY, isLoaded: true }, false);
    const forMember = memberId;
    const json = await fetch('/api/auth/member/activity', { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
    if (!json || forMember !== memberId) return;
    // First visit after this change: hearts kept only in this browser are added to the account once
    const mergedKey = `cch_activity_merged_${forMember}`;
    let savedEventIds: string[] = json.savedEventIds ?? [];
    let savedSpotIds: string[] = json.savedSpotIds ?? [];
    if (!localStorage.getItem(mergedKey)) {
      for (const [kind, key, known] of [['event', MIRROR.events, savedEventIds], ['spot', MIRROR.spots, savedSpotIds]] as const) {
        for (const id of readList(key).filter((x) => !known.includes(x)).slice(0, 100)) {
          const res = await post({ action: 'save', kind, id });
          if (res.ok) {
            savedEventIds = res.json.savedEventIds;
            savedSpotIds = res.json.savedSpotIds;
          }
        }
      }
      try {
        localStorage.setItem(mergedKey, '1');
      } catch {
        /* storage unavailable */
      }
    }
    setState({ isLoaded: true, joined: json.joined ?? [], hosted: json.hosted ?? [], cancelled: json.cancelled ?? [], joinedIds: json.joinedIds ?? [], savedEventIds, savedSpotIds });
  },

  /** Joins an event. `ok` is false with a message to show when the server refuses (full, ended, account not verified, signed out). */
  join: async (eventId: string): Promise<{ ok: boolean; message: string; status?: string; event?: EventItem }> => {
    const res = await post({ action: 'join', eventId });
    if (!res.ok) return { ok: false, message: res.json?.message || (res.status === 401 ? 'กรุณาเข้าสู่ระบบก่อน' : 'เข้าร่วมไม่สำเร็จ ลองอีกครั้งนะ'), status: res.json?.status };
    await activityActions.refresh();
    return { ok: true, message: res.json.message, status: res.json.status, event: res.json.event };
  },

  leave: async (eventId: string): Promise<{ ok: boolean; message: string; event?: EventItem }> => {
    const res = await post({ action: 'leave', eventId });
    if (!res.ok) return { ok: false, message: res.json?.message || 'ยกเลิกไม่สำเร็จ ลองอีกครั้งนะ' };
    await activityActions.refresh();
    return { ok: true, message: 'ยกเลิกการเข้าร่วมแล้ว', event: res.json.event ?? undefined };
  },

  forgetCancelled: async (eventId: string) => {
    const res = await post({ action: 'forget_cancelled', eventId });
    if (res.ok) setState({ cancelled: state.cancelled.filter((e) => e.id !== eventId) });
    return res.ok;
  },

  setSaved: async (kind: 'spot' | 'event', id: string, saved: boolean) => {
    const res = await post({ action: saved ? 'save' : 'unsave', kind, id });
    if (res.ok) setState({ savedEventIds: res.json.savedEventIds, savedSpotIds: res.json.savedSpotIds });
    return res.ok;
  },
};

/** Hearts toggled by older pages land in localStorage; this sends the difference to the account */
async function pushLocalHearts() {
  if (!memberId || !state.isLoaded) return;
  for (const [kind, key, known] of [['event', MIRROR.events, state.savedEventIds], ['spot', MIRROR.spots, state.savedSpotIds]] as const) {
    const local = readList(key);
    const added = local.filter((id) => !known.includes(id));
    const removed = known.filter((id) => !local.includes(id));
    for (const id of added.slice(0, 20)) await activityActions.setSaved(kind, id, true);
    for (const id of removed.slice(0, 20)) await activityActions.setSaved(kind, id, false);
  }
}

/** Mount once per page (the Navbar does): keeps the store in step with the signed-in member */
export function useActivitySync() {
  const session = useMemberSession();
  const id = session.member?.id ?? null;
  useEffect(() => {
    if (!session.isLoaded) return;
    memberId = id;
    void activityActions.refresh();
    if (!id) return;
    const timer = setInterval(() => void pushLocalHearts(), 2500);
    return () => clearInterval(timer);
  }, [session.isLoaded, id]);
}

export function useMyActivity(): ActivityState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => EMPTY
  );
}
