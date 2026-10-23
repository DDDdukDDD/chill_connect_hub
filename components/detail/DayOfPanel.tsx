'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MapPin, MessageCircle, QrCode } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { isEventEnded, parseEventDateToTimestamp } from '@/lib/dateUtils';

const BANGKOK_MS = 7 * 60 * 60 * 1000;
const bangkokDay = (ms: number) => new Date(ms + BANGKOK_MS).toISOString().slice(0, 10);

/** Today in Bangkok is the ตี้'s date */
export function isToday(event: EventItem): boolean {
  const start = parseEventDateToTimestamp(event.date);
  return Number.isFinite(start) && start > 0 && bangkokDay(start) === bangkokDay(Date.now()) && !isEventEnded(event);
}

/** Minutes until the start time on the ตี้'s date ("17:30 - 19:00 น."), or null when unknown */
function minutesToStart(event: EventItem): number | null {
  const match = /(\d{1,2})[:.](\d{2})/.exec(event.time ?? '');
  if (!match) return null;
  const day = bangkokDay(parseEventDateToTimestamp(event.date));
  const [y, m, d] = day.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d, Number(match[1]), Number(match[2])) - BANGKOK_MS;
  return Math.round((start - Date.now()) / 60000);
}

interface Attendee {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isMe: boolean;
  arrived?: boolean;
}

/**
 * The day of a ตี้ for someone who joined (the "ระหว่าง" phase): how long until it starts, the ticket to show the
 * host, the way to the meeting point, the group chat, "I'll be late", and who has arrived. Arrival is the host's
 * check-in (the proof of going); the attendee list says who arrived only to people in the ตี้.
 */
export function DayOfPanel({ event, onOpenTicket, onOpenChat, onCancel }: { event: EventItem; onOpenTicket: () => void; onOpenChat: () => void; onCancel: () => void }) {
  // Only a ตี้ run by a member has a host who checks people in; online ones have no place to go to
  const hostRun = Boolean((event as { createdByMemberId?: string }).createdByMemberId);
  const isOnline = event.locationType === 'online' || event.province === 'ออนไลน์';
  const [people, setPeople] = useState<Attendee[]>([]);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [lateSent, setLateSent] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch(`/api/events/${encodeURIComponent(event.id)}/attendees`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => active && Array.isArray(json?.attendees) && setPeople(json.attendees))
        .catch(() => undefined);
      fetch(`/api/events/${encodeURIComponent(event.id)}/ticket`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => active && setCheckedInAt(json?.ticket?.checkedInAt ?? null))
        .catch(() => undefined);
    };
    load();
    // The host checks people in as they arrive: keep the list fresh while the page is open
    const timer = setInterval(() => {
      load();
      tick((n) => n + 1);
    }, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [event.id]);

  const minutes = minutesToStart(event);
  const countdown = minutes === null ? 'วันนี้' : minutes > 60 ? `วันนี้ · อีก ${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที` : minutes > 0 ? `วันนี้ · อีก ${minutes} นาที` : 'เริ่มแล้ว';
  const arrived = people.filter((p) => p.arrived);

  const sendLate = async () => {
    const res = await fetch(`/api/chat/${encodeURIComponent(event.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'กำลังไปนะ จะถึงช้ากว่านัดประมาณ 15 นาที' }),
    }).catch(() => null);
    if (res?.ok) setLateSent(true);
  };

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.meetingPoint || event.location)}`;

  return (
    <section className="rounded-3xl bg-[#FFF4EE] p-5 sm:p-6 space-y-4" aria-label="วันนัด">
      <div>
        <p className="text-sm font-semibold text-[#B93F12] flex items-center gap-1.5">
          <Clock className="w-4 h-4" aria-hidden="true" />
          {countdown}
        </p>
        <p className="mt-0.5 text-[15px] text-slate-800">
          {event.time} · {event.meetingPoint || event.location}
        </p>
        {checkedInAt && (
          <p className="mt-1 text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            คนจัดยืนยันว่าคุณมาแล้ว {new Date(checkedInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button type="button" onClick={onOpenTicket} className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-900 cursor-pointer">
          <QrCode className="w-5 h-5 text-[#F26430]" aria-hidden="true" />
          {hostRun ? 'บัตรให้สแกน' : 'บัตรของฉัน'}
        </button>
        {!isOnline && (
        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-900">
          <MapPin className="w-5 h-5 text-[#F26430]" aria-hidden="true" />
          นำทาง
        </a>
        )}
        <button type="button" onClick={onOpenChat} className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-900 cursor-pointer">
          <MessageCircle className="w-5 h-5 text-[#F26430]" aria-hidden="true" />
          แชตกลุ่ม
        </button>
        <button type="button" onClick={sendLate} disabled={lateSent} className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-900 cursor-pointer disabled:text-emerald-700">
          <Clock className="w-5 h-5 text-[#F26430]" aria-hidden="true" />
          {lateSent ? 'แจ้งในแชตแล้ว' : 'แจ้งว่าไปสาย'}
        </button>
      </div>

      {hostRun && people.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-900">ถึงแล้ว {arrived.length} จาก {people.length} คน</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {people.map((p) => (
              <li key={p.id} className={`flex flex-col items-center w-14 text-center text-[11px] ${p.arrived ? '' : 'opacity-40'}`}>
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- member photos
                  <img src={p.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-200" />
                ) : (
                  <span className="w-11 h-11 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold" aria-hidden="true">{p.name.slice(0, 1)}</span>
                )}
                <span className="mt-1 truncate w-full">{p.isMe ? 'คุณ' : p.name}</span>
                <span className="sr-only">{p.arrived ? 'ถึงแล้ว' : 'ยังไม่ถึง'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onCancel} className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer">
        ไปไม่ได้แล้ว · ยกเลิก
      </button>
    </section>
  );
}
