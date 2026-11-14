'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { EventItem } from '@/data/mockData';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';

// What the onboarding summary needs from the member journey (the journey band left the home page on 2026-10-30)

const CHALLENGE_GOALS = ['earn_xp'];
const MEETUP_GOALS = ['find_friends', 'join_community'];
const SOCIAL_GOALS = ['share_moments', 'browse_moments'];
/** Only moment goals picked: moments first on the onboarding summary */
export const isSocialOnly = (goals: string[]) => goals.length > 0 && goals.every((g) => SOCIAL_GOALS.includes(g));

/** The first step the onboarding summary offered */
export interface FirstStep {
  pillar: 'community' | 'challenges';
  id: string;
  reason?: string;
  /** The ตี้ itself */
  event?: EventItem;
}
export const FIRST_STEP_KEY = (memberId: string) => `cch_first_step_${memberId}`;

/** What to offer first: a challenge when the member chose challenges and no meetup goal, else a ตี้ */
export function flavourFromGoals(goals: string[]): 'meetup' | 'challenge' {
  const challenge = goals.some((g) => CHALLENGE_GOALS.includes(g));
  const meetup = goals.some((g) => MEETUP_GOALS.includes(g));
  return challenge && !meetup ? 'challenge' : 'meetup';
}

interface Suggested {
  id: string;
  displayName: string;
  avatarUrl?: string;
  momentCount: number;
}

/**
 * People worth following (verified members who post, GET /api/members/suggested), each with a follow button.
 * Used by the onboarding summary and the member home (a sideways row in the feed, a list in the right rail).
 * `onLoaded` tells how many came back.
 */
export function FollowRow({ onFollowed, onLoaded, emptyText, layout = 'row' }: { onFollowed?: () => void; onLoaded?: (count: number) => void; emptyText: string; layout?: 'row' | 'list' }) {
  const [people, setPeople] = useState<Suggested[] | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/members/suggested', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => json?.members ?? [])
      .catch(() => [])
      .then((list: Suggested[]) => {
        if (!alive) return;
        setPeople(list);
        onLoaded?.(list.length);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);
  const follow = async (id: string) => {
    setBusy(id);
    const res = await fetch(`/api/members/${encodeURIComponent(id)}/actions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'follow' }),
    }).catch(() => null);
    setBusy(null);
    if (res?.ok) {
      setDone((d) => [...d, id]);
      onFollowed?.();
    }
  };
  if (people === null && layout === 'list') {
    return (
      <div className="space-y-3.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-slate-100 shrink-0" />
            <span className="h-3 w-28 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }
  if (people === null) return <div className="h-[92px]" aria-hidden="true" />;
  if (people.length === 0) return <p className="text-sm text-slate-600">{emptyText}</p>;
  if (layout === 'list') {
    // One person per line, as "Suggested for you" beside a feed: face, name and posts, a quiet text button
    return (
      <ul className="space-y-3.5">
        {people.slice(0, 5).map((p) => {
          const isDone = done.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-3">
              <Link href={`/profile?id=${encodeURIComponent(p.id)}`} className="group flex items-center gap-3 min-w-0 flex-1">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarImage(p.avatarUrl)} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100 shrink-0" />
                ) : (
                  <span className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0" aria-hidden="true">{nameInitial(p.displayName)}</span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 truncate group-hover:underline">{p.displayName}</span>
                  <span className="block text-xs text-slate-500">{p.momentCount} โมเมนต์</span>
                </span>
              </Link>
              <button type="button" disabled={isDone || busy === p.id} onClick={() => follow(p.id)} aria-label={isDone ? `ติดตาม ${p.displayName} แล้ว` : `ติดตาม ${p.displayName}`}
                className={`shrink-0 text-[13px] font-semibold whitespace-nowrap ${isDone ? 'text-slate-500' : 'text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer'}`}>
                {isDone ? 'ติดตามแล้ว' : 'ติดตาม'}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      {people.slice(0, 5).map((p) => {
        const isDone = done.includes(p.id);
        return (
          <li key={p.id} className="w-[84px] shrink-0 flex flex-col items-center text-center">
            <Link href={`/profile?id=${encodeURIComponent(p.id)}`} className="group flex flex-col items-center min-w-0 w-full">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarImage(p.avatarUrl)} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100 border-2 border-white shadow-sm" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center border-2 border-white shadow-sm" aria-hidden="true">{nameInitial(p.displayName)}</span>
              )}
              <span className="mt-1 w-full text-xs font-semibold text-slate-900 truncate group-hover:underline">{p.displayName}</span>
              <span className="text-[11px] text-slate-500">{p.momentCount} โมเมนต์</span>
            </Link>
            <button type="button" disabled={isDone || busy === p.id} onClick={() => follow(p.id)} aria-label={isDone ? `ติดตาม ${p.displayName} แล้ว` : `ติดตาม ${p.displayName}`}
              className={`mt-1.5 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${isDone ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'}`}>
              {isDone ? 'ติดตามแล้ว' : 'ติดตาม'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
