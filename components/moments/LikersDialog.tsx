'use client';

import React, { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { PeopleList, setFollowing, type ListedPerson } from '@/components/members/PeopleList';

/**
 * "ใครกดหัวใจ" on the member's own moment (owner 2026-11-07): newest first, with a follow button so a heart can turn
 * into a follow, like IG. Only the owner can open it (GET /api/moments/{id}/likes).
 */
export function LikersDialog({ momentId, onClose }: { momentId: string; onClose: () => void }) {
  const titleId = useId();
  const [people, setPeople] = useState<ListedPerson[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`/api/moments/${encodeURIComponent(momentId)}/likes`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('load failed'))))
      .then((json) => alive && setPeople(json.people))
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [momentId]);

  const toggle = async (person: ListedPerson) => {
    if (busyId) return;
    setBusyId(person.id);
    setNotice('');
    const failed = await setFollowing(person, !person.isFollowing);
    setBusyId(null);
    if (failed) return setNotice(failed);
    setPeople((current) => current?.map((p) => (p.id === person.id ? { ...p, isFollowing: !person.isFollowing } : p)) ?? current);
  };

  return (
    <DialogShell onClose={onClose} size="sm" bare labelledBy={titleId}>
      <h2 id={titleId} className="px-5 sm:px-8 pt-6 pr-16 pb-3 border-b border-slate-100 text-base font-bold text-slate-900 shrink-0">
        คนที่ส่งหัวใจให้
        {people && <span className="ml-1.5 text-sm font-medium text-slate-500 tabular-nums">{people.length.toLocaleString()}</span>}
      </h2>
      <div className="flex-1 min-h-48 overflow-y-auto px-5 sm:px-8 py-3">
        {loadFailed ? (
          <p role="alert" className="py-10 text-center text-sm font-medium text-slate-600">โหลดรายชื่อไม่สำเร็จ ปิดแล้วลองเปิดใหม่อีกครั้งนะ</p>
        ) : !people ? (
          <div role="status" aria-label="กำลังโหลด" className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" aria-hidden="true" />
          </div>
        ) : people.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-slate-500 leading-relaxed">ยังไม่มีใครส่งหัวใจ แชร์โมเมนต์นี้ให้เพื่อนๆ ดูสิ</p>
        ) : (
          <PeopleList people={people} busyId={busyId} onToggle={toggle} onNavigate={onClose} />
        )}
      </div>
      {notice && <p role="alert" className="px-5 sm:px-8 pb-4 text-sm font-medium text-rose-700 shrink-0">{notice}</p>}
    </DialogShell>
  );
}
