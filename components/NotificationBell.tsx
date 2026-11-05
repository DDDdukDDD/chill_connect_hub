'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { readPushStatus } from '@/lib/appClient';
import { nameInitial } from '@/lib/displayName';
import { useMemberSession } from '@/lib/useMemberSession';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';

interface NotificationItem {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  momentId?: string;
  /** The moment's first picture, so it is clear which post this is about */
  momentImage?: string;
  /** Where a notification that is not about a person leads */
  href?: string;
  message: string;
  preview?: string;
  timeAgo: string;
  createdAt: string;
  read: boolean;
}

const REFRESH_MS = 60_000;
type BellData = { items: NotificationItem[]; unread: number };
// The top bar is drawn anew on each page, so the last answer is kept outside it
let lastRead: { memberId: string; at: number; data: BellData } | null = null;
const DAY_MS = 24 * 60 * 60 * 1000;

const bangkokDay = (time: Date | string) => new Date(time).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

function sectionsOf(items: NotificationItem[]): { title: string; items: NotificationItem[] }[] {
  const now = new Date();
  const today = bangkokDay(now);
  const sections = [
    { title: 'วันนี้', items: [] as NotificationItem[] },
    { title: '7 วันที่ผ่านมา', items: [] as NotificationItem[] },
    { title: 'ก่อนหน้านี้', items: [] as NotificationItem[] },
  ];
  for (const item of items) {
    const at = bangkokDay(item.createdAt) === today ? 0 : now.getTime() - new Date(item.createdAt).getTime() < 7 * DAY_MS ? 1 : 2;
    sections[at].items.push(item);
  }
  return sections.filter((section) => section.items.length > 0);
}

const hrefOf = (n: NotificationItem) => n.href ?? (n.momentId ? `/moments/${encodeURIComponent(n.momentId)}${n.type === 'comment' ? '#comments' : ''}` : `/profile?id=${n.actorId}`);

/**
 * Bell for the signed-in member: follows, likes and comments on their moments (GET /api/notifications).
 * Refreshes every minute and when the tab gets focus; opening the list marks everything as read, and what was new
 * stays marked as new until the list closes. Renders nothing for signed-out visitors.
 */
export function NotificationBell() {
  const { member } = useMemberSession();
  const memberId = member?.id;
  const [remembered] = useState(() => (lastRead?.memberId === memberId ? lastRead : null));
  const [data, setDataNow] = useState<BellData>(remembered?.data ?? { items: [], unread: 0 });
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(remembered ? 'ready' : 'loading');
  const setData = useCallback((next: BellData | ((now: BellData) => BellData)) => {
    setDataNow((now) => {
      const value = typeof next === 'function' ? next(now) : next;
      if (lastRead) lastRead = { ...lastRead, data: value };
      return value;
    });
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [canTurnOnPush, setCanTurnOnPush] = useState(false);
  const listOpen = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error('notifications');
    return { items: (json.items ?? []) as NotificationItem[], unread: (json.unread ?? 0) as number };
  }, []);

  const refresh = useCallback(() => {
    // The list on screen is not swapped under the reader
    if (listOpen.current || !memberId) return;
    // Moving between pages or back to this tab within the minute shows what was read; the timer keeps the minute
    if (lastRead?.memberId === memberId && Date.now() - lastRead.at < REFRESH_MS - 1000) return;
    lastRead = { memberId, at: Date.now(), data: lastRead?.memberId === memberId ? lastRead.data : { items: [], unread: 0 } };
    load().then(
      (next) => {
        // Kept here too: this bar may be gone by now, and the next page's bar reads this
        lastRead = { memberId, at: Date.now(), data: next };
        setData(next);
        setStatus('ready');
      },
      () => {
        lastRead = null;
        setStatus((now) => (now === 'loading' ? 'failed' : now));
      }
    );
  }, [load, memberId, setData]);

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

  const showNew = (next: { items: NotificationItem[]; unread: number }) => {
    setData({ ...next, unread: 0 });
    setStatus('ready');
    setNewIds((before) => new Set([...before, ...next.items.filter((n) => !n.read).map((n) => n.id)]));
    if (next.unread > 0) fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => undefined);
  };

  const fetchForList = () => {
    if (data.items.length === 0) setStatus('loading');
    load().then(showNew, () => setStatus((now) => (data.items.length > 0 ? now : 'failed')));
  };

  const open = () => {
    listOpen.current = true;
    setIsOpen(true);
    readPushStatus().then((push) => setCanTurnOnPush(push === 'off' || push === 'needs-install'), () => undefined);
    // What is already here shows at once, while the newest arrives
    showNew(data);
    fetchForList();
  };

  const close = () => {
    listOpen.current = false;
    setIsOpen(false);
    setNewIds(new Set());
    setData((now) => ({ ...now, items: now.items.map((n) => ({ ...n, read: true })) }));
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
        <DialogShell onClose={close} title="การแจ้งเตือน" size="sm">
          {canTurnOnPush && (
            <Link href="/profile/settings#app" onClick={close} className="mb-3 flex items-center justify-between gap-2 min-h-10 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700">
              ไม่พลาดอะไร เปิดแจ้งเตือนบนเครื่องนี้เลย
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
          {data.items.length > 0 ? (
            <div className="-mx-2 max-h-[60dvh] overflow-y-auto overscroll-contain space-y-3">
              {sectionsOf(data.items).map((section) => (
                <section key={section.title}>
                  <h3 className="px-2 pb-1 text-xs font-bold text-slate-500">{section.title}</h3>
                  <ul>
                    {section.items.map((n) => {
                      const isNew = newIds.has(n.id);
                      return (
                        <li key={n.id}>
                          <Link href={hrefOf(n)} onClick={close} className={`flex items-center gap-3 px-2 py-2.5 rounded-2xl ${isNew ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                            {n.actorAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element -- member upload
                              <img src={avatarImage(n.actorAvatar)} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 text-base font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                                {nameInitial(n.actorName)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-slate-700 leading-snug">
                                <span className="font-bold text-slate-900">{n.actorName}</span> {n.message}
                                {isNew && <span className="sr-only"> (ใหม่)</span>}
                              </span>
                              {n.preview && <span className="block text-xs text-slate-500 mt-0.5 truncate">“{n.preview}”</span>}
                              <span className="block text-xs font-medium text-slate-500 mt-0.5">{n.timeAgo}</span>
                            </span>
                            {n.momentImage && (
                              // eslint-disable-next-line @next/next/no-img-element -- member upload
                              <img src={optimizedImage(n.momentImage, 256)} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : status === 'loading' ? (
            <div className="space-y-3 py-2" role="status" aria-label="กำลังโหลดการแจ้งเตือน">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                  <span className="h-4 flex-1 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : status === 'failed' ? (
            <div className="py-3 space-y-3">
              <p className="text-sm font-medium text-slate-600">โหลดการแจ้งเตือนไม่สำเร็จ ลองอีกครั้งนะ</p>
              <button type="button" onClick={fetchForList} className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer">
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-600 py-4">ยังไม่มีการแจ้งเตือน เมื่อมีคนติดตาม ส่งหัวใจ <span className="whitespace-nowrap">หรือเข้าร่วมตี้ของคุณ</span> <span className="whitespace-nowrap">จะแสดงที่นี่</span></p>
          )}
        </DialogShell>
      )}
    </>
  );
}
