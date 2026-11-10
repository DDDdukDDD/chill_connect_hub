'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { MomentAvatar } from '@/components/moments/CommentThread';
import type { TagFriend } from '@/components/moments/FriendTagPicker';

const MAX_INVITES = 10;

/**
 * "ไปกันไหม" (owner 2026-11-10): send a post to friends as an invitation to go there together. Only friends (people
 * who follow each other) are listed; each gets one notice with the post, and can answer "ไปกัน" on it.
 */
export function InviteFriendsDialog({ momentId, place, onClose, onDone }: { momentId: string; place: string; onClose: () => void; onDone: (message: string) => void }) {
  const [friends, setFriends] = useState<TagFriend[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/members/friends', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setFriends(json?.success && Array.isArray(json.friends) ? json.friends : []))
      .catch(() => active && setFriends([]));
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (friends ?? []).filter((friend) => !q || friend.name.toLowerCase().includes(q));
  }, [friends, query]);

  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_INVITES ? [...list, id] : list));

  const send = async () => {
    if (picked.length === 0 || isSending) return;
    setIsSending(true);
    setError('');
    const result = await fetch(`/api/moments/${encodeURIComponent(momentId)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'invite', to: picked }) })
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .catch(() => ({ ok: false, json: { message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' } }));
    setIsSending(false);
    if (!result.ok || result.json?.success === false) return setError(result.json?.message || 'ส่งคำชวนไม่สำเร็จ ลองอีกครั้งนะ');
    onDone(picked.length === 1 ? 'ส่งคำชวนให้เพื่อนแล้ว' : `ส่งคำชวนให้เพื่อน ${picked.length} คนแล้ว`);
  };

  return (
    <DialogShell onClose={onClose} title="ไปกันไหม" subtitle={place ? `ชวนเพื่อนไป ${place} ด้วยกัน` : 'ส่งโพสต์นี้ชวนเพื่อนไปด้วยกัน'} size="sm">
      {friends === null ? (
        <div className="py-8 flex justify-center" role="status" aria-label="กำลังโหลดรายชื่อเพื่อน">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <p className="py-6 text-center text-sm font-medium text-slate-600">ชวนได้เฉพาะเพื่อนที่ติดตามกันทั้งสองฝ่าย ติดตามเพื่อนแล้วให้เพื่อนติดตามกลับ แล้วค่อยมาชวนกันนะ</p>
      ) : (
        <>
          {friends.length > 6 && (
            <label className="relative block mb-3">
              <span className="sr-only">ค้นหาเพื่อน</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาเพื่อน"
                className="w-full h-11 pl-10 pr-4 rounded-full bg-slate-100 text-base sm:text-sm text-slate-900 placeholder:text-slate-500 outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
            </label>
          )}
          <ul className="max-h-[50dvh] overflow-y-auto -mx-2 mb-4" aria-label="เพื่อนที่ชวนได้">
            {shown.map((friend) => {
              const isPicked = picked.includes(friend.id);
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => toggle(friend.id)}
                    aria-pressed={isPicked}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <MomentAvatar name={friend.name} src={friend.avatar} className="w-10 h-10 text-sm" />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900">{friend.name}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPicked ? 'bg-[#2563EB] text-white' : 'border-2 border-slate-300'}`} aria-hidden="true">
                      {isPicked && <Check className="w-4 h-4" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {error && <p className="mb-3 text-sm font-medium text-rose-600" role="alert">{error}</p>}
          <button type="button" onClick={send} disabled={picked.length === 0 || isSending} className={`${dialogButton.primary} w-full`}>
            {isSending ? 'กำลังส่ง…' : picked.length ? `ชวน ${picked.length} คน` : 'เลือกเพื่อนที่จะชวน'}
          </button>
        </>
      )}
    </DialogShell>
  );
}
