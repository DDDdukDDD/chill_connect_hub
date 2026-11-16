'use client';

import React from 'react';
import { avatarImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';
import type { FriendsDoing } from '@/lib/social/circleActions';

/** The words of the line: friends lead, the total follows quietly; "เพื่อน" only when friends are counted (owner 2026-11-16) */
export function friendsDoingWords(doing: FriendsDoing): { lead: string; total?: string } | null {
  const { friends, friendCount, total } = doing;
  const fmt = (n: number) => n.toLocaleString('th-TH');
  if (friendCount === 0) return total > 0 ? { lead: `${fmt(total)} คนทำอยู่` } : null;
  const names = friends.map((f) => f.name);
  const lead =
    friendCount === 1
      ? `${names[0]}ทำอยู่`
      : friendCount === 2
        ? `${names[0]} และ${names[1]}ทำอยู่`
        : `${names[0]} ${names[1]} และเพื่อนอีก ${fmt(friendCount - 2)} คนทำอยู่`;
  return { lead, ...(total > friendCount ? { total: `ทั้งหมด ${fmt(total)} คน` } : {}) };
}

/** "คุณแนน คุณวิน และเพื่อนอีก 2 คนทำอยู่ · ทั้งหมด 1,000 คน", with the friends' faces. Used by Circles and the challenge page */
export function FriendsDoingLine({ doing, className = '' }: { doing: FriendsDoing; className?: string }) {
  const words = friendsDoingWords(doing);
  if (!words) return null;
  return (
    <p className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {doing.friends.length > 0 && (
        <span className="flex -space-x-2 shrink-0" aria-hidden="true">
          {doing.friends.map((friend) =>
            friend.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
              <img key={friend.id} src={avatarImage(friend.avatar)} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover bg-slate-100" />
            ) : (
              <span key={friend.id} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">
                {nameInitial(friend.name)}
              </span>
            )
          )}
        </span>
      )}
      <span className="min-w-0 text-sm leading-snug">
        <span className="font-semibold text-slate-800">{words.lead}</span>
        {words.total && <span className="text-slate-500"> · {words.total}</span>}
      </span>
    </p>
  );
}

/**
 * The line on a challenge page, for a signed-in reader with friends doing it; the total alone is already in
 * "ใครทำอยู่บ้าง" below, so without friends nothing shows. `refreshKey` reloads it after the reader joins.
 */
export function QuestFriendsDoing({ questId, refreshKey, className = '' }: { questId: string; refreshKey?: unknown; className?: string }) {
  const [doing, setDoing] = React.useState<FriendsDoing | null>(null);
  React.useEffect(() => {
    let active = true;
    fetch(`/api/quests/${encodeURIComponent(questId)}/friends`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && json?.success && setDoing(json as FriendsDoing))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [questId, refreshKey]);
  if (!doing || doing.friendCount === 0) return null;
  return <FriendsDoingLine doing={doing} className={className} />;
}
