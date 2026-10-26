'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { nameInitial } from '@/lib/displayName';
import { useMemberSession } from '@/lib/useMemberSession';

interface NotificationItem {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  momentId?: string;
  /** Where a notification that is not about a person leads */
  href?: string;
  message: string;
  preview?: string;
  timeAgo: string;
  read: boolean;
}

const REFRESH_MS = 60_000;

/**
 * Bell for the signed-in member: follows, likes and comments on their moments (GET /api/notifications).
 * Refreshes every minute and when the tab gets focus; opening the list marks everything as read.
 * Renders nothing for signed-out visitors.
 */
export function NotificationBell() {
  const { member } = useMemberSession();
  const memberId = member?.id;
  const [data, setData] = useState<{ items: NotificationItem[]; unread: number }>({ items: [], unread: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(() => {
    fetch('/api/notifications', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setData({ items: json.items ?? [], unread: json.unread ?? 0 }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!memberId) return;
    refresh();
    const timer = setInterval(() => document.visibilityState === 'visible' && refresh(), REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [memberId, refresh]);

  if (!memberId) return null;

  const open = () => {
    setIsOpen(true);
    if (data.unread > 0) {
      fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => undefined);
      setData((prev) => ({ ...prev, unread: 0 }));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
        aria-label={data.unread > 0 ? `การแจ้งเตือน มีใหม่ ${data.unread} รายการ` : 'การแจ้งเตือน'}
        title="การแจ้งเตือน"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {data.unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {isOpen && (
        <DialogShell onClose={() => setIsOpen(false)} title="การแจ้งเตือน" size="sm">
          {data.items.length === 0 ? (
            <p className="text-sm font-medium text-slate-600 py-4">ยังไม่มีการแจ้งเตือน เมื่อมีคนติดตาม ส่งหัวใจ <span className="whitespace-nowrap">หรือเข้าร่วมตี้ของคุณ</span> <span className="whitespace-nowrap">จะแสดงที่นี่</span></p>
          ) : (
            <ul className="-mx-2 max-h-[60vh] overflow-y-auto">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? (n.momentId ? `/moments/${encodeURIComponent(n.momentId)}` : `/profile?id=${n.actorId}`)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-2 py-3 rounded-2xl hover:bg-slate-50"
                  >
                    {n.actorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- member upload
                      <img src={n.actorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 text-base font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                        {nameInitial(n.actorName)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-700 leading-snug">
                        <span className="font-bold text-slate-900">{n.actorName}</span> {n.message}
                      </span>
                      {n.preview && <span className="block text-xs text-slate-500 mt-0.5 truncate">“{n.preview}”</span>}
                      <span className="block text-xs font-medium text-slate-500 mt-0.5">{n.timeAgo}</span>
                    </span>
                    {!n.read && <span className="mt-2 w-2 h-2 rounded-full bg-[#2563EB] shrink-0" aria-label="ยังไม่ได้อ่าน" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DialogShell>
      )}
    </>
  );
}
