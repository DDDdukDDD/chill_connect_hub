'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';

export type FollowTab = 'followers' | 'following';

interface Person {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

const TABS: { key: FollowTab; label: string; empty: string }[] = [
  { key: 'followers', label: 'ผู้ติดตาม', empty: 'ยังไม่มีผู้ติดตาม ลองโพสต์โมเมนต์หรือไปตี้สักครั้ง เพื่อนๆ จะได้รู้จักคุณ' },
  { key: 'following', label: 'กำลังติดตาม', empty: 'ยังไม่ได้ติดตามใคร เจอใครถูกใจ กดติดตามจากโปรไฟล์ของเขาได้เลย' },
];

/**
 * The member's own followers and following, as on IG. "กำลังติดตาม" unfollows at once and the person stays in the list
 * as "ติดตาม", so a slip is one tap to undo and needs no second dialog. The list is re-read each time it opens;
 * the profile's numbers refresh when it closes.
 */
export function FollowListDialog({ initialTab, onClose }: { initialTab: FollowTab; onClose: (changed: boolean) => void }) {
  const titleId = useId();
  const [tab, setTab] = useState<FollowTab>(initialTab);
  const [lists, setLists] = useState<Record<FollowTab, Person[]> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/members/follows', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('load failed'))))
      .then((json) => {
        if (alive) setLists({ followers: json.followers, following: json.following });
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = async (person: Person) => {
    if (busyId) return;
    setBusyId(person.id);
    setNotice('');
    const next = !person.isFollowing;
    const res = await fetch(`/api/members/${encodeURIComponent(person.id)}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: next ? 'follow' : 'unfollow' }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusyId(null);
    if (!res?.ok) {
      setNotice(json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ');
      return;
    }
    setChanged(true);
    setLists((current) => {
      if (!current) return current;
      const flip = (people: Person[]) => people.map((p) => (p.id === person.id ? { ...p, isFollowing: next } : p));
      return { followers: flip(current.followers), following: flip(current.following) };
    });
  };

  const close = () => onClose(changed);
  const people = lists?.[tab] ?? [];

  return (
    <DialogShell onClose={close} size="sm" bare labelledBy={titleId}>
      <h2 id={titleId} className="sr-only">ผู้ติดตามและกำลังติดตาม</h2>
      <div className="flex gap-6 px-5 sm:px-8 pt-6 pr-16 border-b border-slate-100 shrink-0">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            className={`pb-3 -mb-px min-h-11 text-sm sm:text-base font-bold border-b-2 whitespace-nowrap cursor-pointer ${tab === item.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {item.label}
            {lists && <span className="ml-1.5 text-xs sm:text-sm font-medium text-slate-500 tabular-nums">{lists[item.key].length.toLocaleString()}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-48 overflow-y-auto px-5 sm:px-8 py-3">
        {loadFailed ? (
          <p role="alert" className="py-10 text-center text-sm font-medium text-slate-600">โหลดรายชื่อไม่สำเร็จ ปิดแล้วลองเปิดใหม่อีกครั้งนะ</p>
        ) : !lists ? (
          <div role="status" aria-label="กำลังโหลด" className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" aria-hidden="true" />
          </div>
        ) : people.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-slate-500 leading-relaxed">{TABS.find((t) => t.key === tab)?.empty}</p>
        ) : (
          <ul>
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 py-2">
                <Link href={`/profile?id=${encodeURIComponent(person.id)}`} onClick={close} className="flex items-center gap-3 flex-1 min-w-0 rounded-xl min-h-11 hover:opacity-80">
                  {person.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a member's avatar from any allowed host
                    <img src={avatarImage(person.avatar)} alt="" loading="lazy" className="w-11 h-11 rounded-full object-cover bg-slate-100 shrink-0" />
                  ) : (
                    <span aria-hidden="true" className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center shrink-0">{nameInitial(person.name)}</span>
                  )}
                  <span className="text-sm font-bold text-slate-900 truncate">{person.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(person)}
                  disabled={busyId !== null}
                  aria-pressed={person.isFollowing}
                  aria-label={`${person.isFollowing ? 'เลิกติดตาม' : 'ติดตาม'} ${person.name}`}
                  className={`shrink-0 min-h-11 px-4 rounded-full text-sm font-bold whitespace-nowrap cursor-pointer transition-colors disabled:cursor-default ${person.isFollowing ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'}`}
                >
                  {busyId === person.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : person.isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice && <p role="alert" className="px-5 sm:px-8 pb-4 text-sm font-medium text-rose-700 shrink-0">{notice}</p>}
    </DialogShell>
  );
}
