'use client';

import React, { useEffect, useState } from 'react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import type { EventItem } from '@/data/mockData';

type Attendee = { name: string; isHost?: boolean; isMe?: boolean };

/** The ready text: where, when and with whom, plus the trip link, so someone close knows the plan */
export function tripDetailsText(event: EventItem, people: Attendee[], url: string): string {
  const place = event.spotTitle || event.location;
  const others = people.filter((p) => !p.isMe);
  const host = others.find((p) => p.isHost)?.name || event.hostName;
  const rest = others.filter((p) => !p.isHost).map((p) => p.name);
  const withWhom = [host ? `${host} (คนจัด)` : '', ...rest].filter(Boolean).join(', ');
  return [
    `บอกไว้ก่อนนะ ฉันจะไปทริป "${event.title}"`,
    `ที่ไหน: ${place}`,
    event.location && event.location !== place ? `ที่อยู่: ${event.location}` : '',
    // Coordinates give a short, exact link; a Thai place name turns into a long run of %E0%B8…
    `แผนที่: https://maps.google.com/?q=${typeof event.latitude === 'number' && typeof event.longitude === 'number' ? `${event.latitude},${event.longitude}` : encodeURIComponent(event.location || place)}`,
    `เมื่อไหร่: ${event.date} · ${event.time}`,
    withWhom ? `ไปกับ: ${withWhom}` : '',
    `ดูทริป: ${url}`,
    'ถ้าติดต่อฉันไม่ได้ ช่วยเช็กให้หน่อยนะ',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Sends the trip plan to someone close (LINE, the phone's share sheet or a copy), instead of the plain share,
 * for a member in a Spot Buddy trip. The text can be edited before sending.
 */
export function TripSafetyShare({ event, onClose, onDone }: { event: EventItem; onClose: () => void; onDone: (message: string) => void }) {
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/community/${encodeURIComponent(event.id)}`;
  const [text, setText] = useState(() => tripDetailsText(event, [], url));
  const [edited, setEdited] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Names come from the attendee list; the text fills them in unless the member already changed it
  useEffect(() => {
    let live = true;
    fetch(`/api/events/${encodeURIComponent(event.id)}/attendees`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { attendees?: Attendee[] } | null) => {
        if (live && data?.attendees && !edited) setText(tripDetailsText(event, data.attendees, url));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onDone('คัดลอกรายละเอียดแล้ว ส่งให้คนใกล้ตัวได้เลย');
    } catch {
      onDone('คัดลอกไม่ได้ ลองกดค้างที่ข้อความแล้วคัดลอกเองนะ');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ text });
      onDone('ส่งรายละเอียดทริปแล้ว');
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <DialogShell onClose={onClose} title="ส่งรายละเอียดให้คนใกล้ตัว" subtitle="บอกคนที่ไว้ใจว่าไปไหน เมื่อไหร่ กับใคร" size="sm" focusField={false}>
      <label htmlFor="trip-share-text" className="sr-only">ข้อความที่จะส่ง</label>
      <textarea
        id="trip-share-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setEdited(true);
        }}
        rows={8}
        className="w-full mb-4 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/40"
      />
      <div className="flex flex-wrap justify-center gap-2.5">
        <a
          href={`https://line.me/R/share?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onDone('เปิด LINE ให้เลือกคนที่จะส่งแล้ว')}
          className={dialogButton.primary}
        >
          ส่งทาง LINE
        </a>
        {canShare ? (
          <button type="button" onClick={share} className={dialogButton.quiet}>ส่งทางแอปอื่น</button>
        ) : (
          <button type="button" onClick={copy} className={dialogButton.quiet}>คัดลอกข้อความ</button>
        )}
      </div>
      <p className="mt-4 text-xs text-center text-slate-500">ข้อความนี้ส่งจากเครื่องคุณเท่านั้น Chillwaa ไม่ได้เก็บหรือส่งให้ใคร</p>
    </DialogShell>
  );
}
