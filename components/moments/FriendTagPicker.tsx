'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { avatarImage } from '@/lib/optimizedImage';

export type TagFriend = { id: string; name: string; avatar: string };

export const MAX_MOMENT_TAGS = 10;

function Avatar({ name, src }: { name: string; src: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a member's avatar from any allowed host
  if (src) return <img src={avatarImage(src)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  return <span aria-hidden="true" className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">{name.slice(0, 1)}</span>;
}

/** Who was there too: only people who follow each other can be tagged, the server checks the same */
export function FriendTagPicker({ value, onDone, onClose }: { value: TagFriend[]; onDone: (friends: TagFriend[]) => void; onClose: () => void }) {
  const [friends, setFriends] = useState<TagFriend[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState(value);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/members/friends', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success) setFriends(json.friends);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (friends ?? []).filter((friend) => !q || friend.name.toLowerCase().includes(q));
  }, [friends, query]);
  const isFull = picked.length >= MAX_MOMENT_TAGS;

  return (
    <DialogShell onClose={onClose} title="ไปกับใครบ้าง" subtitle="แท็กเพื่อนที่ติดตามกันอยู่ เพื่อนจะได้รับแจ้งเตือน และเอาแท็กออกเองได้" size="sm" layer="top" align="top">
      <div className="space-y-3">
        {friends === null && !failed && <p role="status" className="text-sm text-slate-500">กำลังโหลดรายชื่อเพื่อน…</p>}
        {failed && <p role="alert" className="text-sm font-semibold text-rose-700">โหลดรายชื่อไม่สำเร็จ ลองอีกครั้งนะ</p>}
        {friends?.length === 0 && <p className="text-sm text-slate-600">ยังไม่มีเพื่อนที่ติดตามกันทั้งสองฝ่าย พอติดตามกันแล้ว จะแท็กกันได้เลย</p>}
        {friends && friends.length > 6 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อเพื่อน"
              aria-label="ค้นหาชื่อเพื่อน"
              className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-3.5 py-3 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        )}
        {shown.length > 0 && (
          <ul className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {shown.map((friend) => {
              const isOn = picked.some((item) => item.id === friend.id);
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    aria-pressed={isOn}
                    disabled={!isOn && isFull}
                    onClick={() => setPicked((list) => (isOn ? list.filter((item) => item.id !== friend.id) : [...list, friend]))}
                    className="w-full flex items-center gap-3 px-3.5 min-h-12 py-2 text-left hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Avatar name={friend.name} src={friend.avatar} />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900 truncate">{friend.name}</span>
                    <span aria-hidden="true" className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${isOn ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-slate-300 text-transparent'}`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {isFull && <p role="status" className="text-xs font-medium text-slate-600">แท็กได้สูงสุด {MAX_MOMENT_TAGS} คนต่อโพสต์</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={dialogButton.quiet} onClick={onClose}>ยกเลิก</button>
          <button type="button" className={dialogButton.primary} onClick={() => onDone(picked)}>{picked.length > 0 ? `แท็ก ${picked.length} คน` : 'เสร็จแล้ว'}</button>
        </div>
      </div>
    </DialogShell>
  );
}
