'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { BellOff, CalendarDays, MessageCircle, User, Users } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';
import { useMemberSession } from '@/lib/useMemberSession';
import { unreadLabel, useChatInbox, type InboxRoom } from '@/lib/useChatInbox';

const GroupChatModal = dynamic(() => import('@/components/GroupChatModal').then((m) => m.GroupChatModal), { ssr: false });

const bangkokDay = (time: Date | string) => new Date(time).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
/** Today: the time; earlier: the day, like a chat list */
function when(iso: string): string {
  const time = new Date(iso);
  if (bangkokDay(time) === bangkokDay(new Date())) return time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
  return time.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
}

const KIND_ICON = { plan: CalendarDays, pair: User, group: Users, event: Users };

/**
 * ?chat=<roomId> in the address: a notification or "back" from a page opened inside the chat. Next to ?plan= it is
 * My Hub's plan chat (?plan=<id>&chat=1), which My Hub opens.
 */
function chatInAddress(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URL(window.location.href).searchParams;
  return params.has('plan') ? null : params.get('chat');
}
function setChatInAddress(roomId: string | null) {
  const url = new URL(window.location.href);
  if (roomId) url.searchParams.set('chat', roomId);
  else url.searchParams.delete('chat');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * "แชต" in the top bar (owner 2026-11-12): every room the member talks in, unread first in mind, like LINE's chat
 * list. The count is new messages from others in rooms that are not muted. A "ไปกัน" plan opens over its plan in My
 * Hub (components/myhub/FriendPlans.tsx); any other room opens here, and its id stays in the address (?chat=) so
 * coming back from a page opened inside the chat brings the chat back. Hidden while the member has no chat at all.
 */
export function ChatInbox() {
  const router = useRouter();
  const { member } = useMemberSession();
  const memberId = member?.id;
  const inbox = useChatInbox(memberId, true);
  const [isOpen, setIsOpen] = useState(false);
  const [room, setRoom] = useState<{ roomId: string; title?: string } | null>(null);

  // A room named in the address opens once the member is known (a plan's chat is My Hub's to open)
  useEffect(() => {
    const asked = chatInAddress();
    if (memberId && asked) setRoom({ roomId: asked });
  }, [memberId]);

  if (!memberId) return null;

  const openRoom = (r: InboxRoom) => {
    setIsOpen(false);
    if (r.kind === 'plan' && r.planId) return router.push(`/myhub?plan=${encodeURIComponent(r.planId)}&chat=1`);
    setChatInAddress(r.roomId);
    setRoom({ roomId: r.roomId, title: r.title });
  };
  const closeRoom = () => {
    setRoom(null);
    setChatInAddress(null);
  };

  return (
    <>
      {inbox.rooms.length > 0 && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          aria-label={inbox.unread > 0 ? `แชต มีข้อความใหม่ ${inbox.unread} ข้อความ` : 'แชต'}
          title="แชต"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          {inbox.unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
              {inbox.unread > 9 ? '9+' : inbox.unread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <DialogShell onClose={() => setIsOpen(false)} title="แชต" size="sm" focusField={false}>
          <ul className="-mx-2 max-h-[60dvh] overflow-y-auto overscroll-contain">
            {inbox.rooms.map((r) => {
              const Icon = KIND_ICON[r.kind] ?? Users;
              const isNew = r.unread > 0;
              return (
                <li key={r.roomId}>
                  <button type="button" onClick={() => openRoom(r)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-2xl text-left hover:bg-slate-50 cursor-pointer">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`truncate text-sm ${isNew ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{r.title}</span>
                        {r.muted && <BellOff className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-label="ปิดแจ้งเตือนไว้" />}
                      </span>
                      <span className={`block truncate text-[13px] ${isNew ? 'font-medium text-slate-800' : 'text-slate-500'}`}>{r.lastText}</span>
                    </span>
                    <span className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] font-medium text-slate-500">{when(r.lastAt)}</span>
                      {isNew && (
                        <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${r.muted ? 'bg-slate-200 text-slate-700' : 'bg-rose-600 text-white'}`}>
                          <span className="sr-only">ยังไม่อ่าน </span>
                          {unreadLabel(r.unread)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogShell>
      )}

      {room && <GroupChatModal isOpen onClose={closeRoom} event={null} roomId={room.roomId} roomTitle={room.title} />}
    </>
  );
}
