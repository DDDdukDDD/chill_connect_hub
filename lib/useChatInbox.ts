'use client';

import { useEffect, useSyncExternalStore } from 'react';

/** One room in GET /api/chat */
export interface InboxRoom {
  roomId: string;
  title: string;
  kind: 'plan' | 'pair' | 'group' | 'event';
  planId?: string;
  unread: number;
  muted: boolean;
  lastText: string;
  lastAt: string;
}

export interface ChatInbox {
  unread: number;
  rooms: InboxRoom[];
}

const EMPTY: ChatInbox = { unread: 0, rooms: [] };
const REFRESH_MS = 60_000;

/**
 * The member's unread chat, shared by the top bar's "แชต" and the badges on chat buttons (My Hub plans), so one
 * request serves every place on the page. Kept outside React: the top bar is drawn anew on each page.
 */
let state: { memberId: string; at: number; data: ChatInbox } | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Reads the inbox again; without `force`, an answer younger than a minute is kept */
export function refreshChatInbox(memberId: string | undefined, force = false): Promise<void> {
  if (!memberId) return Promise.resolve();
  if (!force && state?.memberId === memberId && Date.now() - state.at < REFRESH_MS - 1000) return Promise.resolve();
  if (loading) return loading;
  loading = fetch('/api/chat', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (json?.success) {
        state = { memberId, at: Date.now(), data: { unread: Number(json.unread) || 0, rooms: Array.isArray(json.rooms) ? json.rooms : [] } };
        emit();
      }
    })
    .catch(() => undefined)
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** A room was just read here: its count goes at once, before the next refresh confirms it */
export function markInboxRoomRead(roomId: string): void {
  if (!state) return;
  const rooms = state.data.rooms.map((r) => (r.roomId === roomId ? { ...r, unread: 0 } : r));
  state = { ...state, data: { rooms, unread: rooms.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0) } };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The inbox for this member; `poll` (the top bar) keeps it fresh every minute and when the tab comes back */
export function useChatInbox(memberId: string | undefined, poll = false): ChatInbox {
  const data = useSyncExternalStore(
    subscribe,
    () => (memberId && state?.memberId === memberId ? state.data : EMPTY),
    () => EMPTY
  );
  useEffect(() => {
    if (!memberId) return;
    void refreshChatInbox(memberId);
    if (!poll) return;
    const refresh = () => document.visibilityState === 'visible' && void refreshChatInbox(memberId);
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [memberId, poll]);
  return data;
}

/** "3" or "99+" for a badge */
export const unreadLabel = (n: number) => (n > 99 ? '99+' : String(n));
