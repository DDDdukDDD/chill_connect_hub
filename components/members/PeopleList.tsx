'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';

export interface ListedPerson {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

/** Follows or unfollows; returns an error message to show, or null when it worked */
export async function setFollowing(person: ListedPerson, follow: boolean): Promise<string | null> {
  const res = await fetch(`/api/members/${encodeURIComponent(person.id)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: follow ? 'follow' : 'unfollow' }),
  }).catch(() => null);
  if (res?.ok) return null;
  const json = await res?.json().catch(() => null);
  return json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ';
}

/** People with a link to their profile and a follow button, as in the follower lists and "who liked this" */
export function PeopleList({ people, busyId, onToggle, onNavigate }: { people: ListedPerson[]; busyId: string | null; onToggle: (person: ListedPerson) => void; onNavigate: () => void }) {
  return (
    <ul>
      {people.map((person) => (
        <li key={person.id} className="flex items-center gap-3 py-2">
          <Link href={`/profile?id=${encodeURIComponent(person.id)}`} onClick={onNavigate} className="flex items-center gap-3 flex-1 min-w-0 rounded-xl min-h-11 hover:opacity-80">
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
            onClick={() => onToggle(person)}
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
  );
}
