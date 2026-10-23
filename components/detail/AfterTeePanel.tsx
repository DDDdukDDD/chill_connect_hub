'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, MessageCircle, Star } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import { isEventEnded } from '@/lib/dateUtils';
import { activityActions, useMyActivity } from '@/lib/useMyActivity';
import { useMemberSession } from '@/lib/useMemberSession';

const TAGS = ['สนุก', 'ตรงเวลา', 'รู้สึกปลอดภัย', 'คนจัดดูแลดี', 'อยากไปอีก'];
const MAX_REVIEW = 300;

interface Person {
  id: string;
  name: string;
  avatar: string;
  picked: boolean;
  matched: boolean;
  roomId?: string;
}

/**
 * The end of a ตี้ on its own page (the "จบ" phase): rate and review it, pick who you would like to meet again,
 * and share a moment. Proof of going comes from the host's check-in: a ตี้ run by a member can be reviewed, and
 * people picked, only after the host confirmed the member came (server rules in lib/members/activity.ts and
 * lib/social/meetAgain.ts; this panel only follows them).
 */
export function AfterTeePanel({ event, isHost, onOpenPairChat }: { event: EventItem; isHost: boolean; onOpenPairChat: (roomId: string, title: string) => void }) {
  const { member } = useMemberSession();
  const activity = useMyActivity();
  const joined = activity.joined.find((e) => e.id === event.id);
  const hostRun = isHost || Boolean(joined?.hasHostCheckIn);
  const checkedIn = Boolean(joined?.checkedInAt);
  const ended = isEventEnded(event);
  const met = isHost || (hostRun ? checkedIn : ended);

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentRating, setSentRating] = useState(0);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busyId, setBusyId] = useState('');

  const reviewed = sentRating > 0 || activity.reviewedEventIds.includes(event.id);

  useEffect(() => {
    if (!member || !hostRun || !(isHost || checkedIn)) return;
    let active = true;
    fetch(`/api/events/${encodeURIComponent(event.id)}/meet-again`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && Array.isArray(json?.people)) setPeople(json.people);
      })
      .catch(() => {
        /* the section stays hidden */
      });
    return () => {
      active = false;
    };
  }, [member, hostRun, isHost, checkedIn, event.id]);

  if (!member || (!joined && !isHost)) return null;
  // Before anything happened there is nothing to show here: the header carries the ticket and chat
  if (!met && !(hostRun && ended)) return null;

  const sendReview = async () => {
    if (!rating || sending) return;
    setSending(true);
    setError('');
    const body = [tags.join(' · '), text.trim()].filter(Boolean).join(' — ').slice(0, MAX_REVIEW);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.id)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text: body }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 409 || res.ok) {
        setSentRating(rating);
        void activityActions.refresh();
      } else {
        setError(json?.message || 'ส่งรีวิวไม่สำเร็จ ลองอีกครั้งนะ');
      }
    } catch {
      setError('ส่งรีวิวไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setSending(false);
    }
  };

  const togglePick = async (person: Person) => {
    if (busyId) return;
    setBusyId(person.id);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.id)}/meet-again`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: person.id, want: !person.picked }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        setPeople((list) => (list ?? []).map((p) => (p.id === person.id ? { ...p, picked: json.picked, matched: json.matched, roomId: json.roomId } : p)));
      }
    } finally {
      setBusyId('');
    }
  };

  const shareHref = `/?share=${encodeURIComponent(`community:${event.id}`)}&title=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location ?? '')}`;

  return (
    <section id="meet-again" className="scroll-mt-24 rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-6">
      <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
        <Check className="w-4 h-4" aria-hidden="true" />
        {isHost ? 'คุณเป็นคนจัดตี้นี้' : checkedIn ? 'คุณไปมาแล้ว · คนจัดยืนยันแล้ว' : 'ตี้นี้จบแล้ว'}
      </p>

      {!isHost && hostRun && !checkedIn && (
        <p className="text-sm text-slate-600">
          รีวิวและเลือกคนที่อยากเจออีกได้ เมื่อคนจัดยืนยันว่าคุณมาแล้ว ถ้าคุณไปจริงแต่ยังไม่ถูกเช็กชื่อ ทักคนจัดในแชตกลุ่มได้เลย
        </p>
      )}

      {!isHost && met && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">ตี้นี้เป็นยังไงบ้าง</h2>
          {reviewed ? (
            <p className="mt-1 text-sm text-slate-600">ขอบคุณสำหรับรีวิว{sentRating ? ` (${sentRating} ดาว)` : ''} คะแนนช่วยคนอื่นเลือกตี้ และช่วยคนจัดจัดให้ดีขึ้น</p>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-slate-500">คะแนนช่วยคนอื่นเลือกตี้ และช่วยคนจัดจัดให้ดีขึ้น</p>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="ให้คะแนน">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ดาว`}
                    onClick={() => setRating(n)}
                    className="w-11 h-11 flex items-center justify-center cursor-pointer"
                  >
                    <Star className={`w-8 h-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const on = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTags((list) => (on ? list.filter((t) => t !== tag) : [...list, tag]))}
                      className={`h-9 px-4 rounded-full text-sm font-semibold cursor-pointer border ${on ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <label htmlFor={`review-${event.id}`} className="mt-3 block text-sm text-slate-600">เล่าสั้นๆ (ไม่บังคับ)</label>
              <textarea
                id={`review-${event.id}`}
                rows={2}
                maxLength={200}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="เช่น มาคนเดียวแต่คุยสนุกมาก"
                className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
              {error && <p className="mt-1 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={sendReview}
                  disabled={!rating || sending}
                  className="h-11 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                >
                  {sending ? 'กำลังส่ง…' : 'ส่งรีวิว'}
                </button>
                <span className="text-xs text-slate-500">มีอะไรไม่ปลอดภัย ใช้ปุ่มธงด้านบนเพื่อแจ้งทีมงาน</span>
              </div>
            </>
          )}
        </div>
      )}

      {people && people.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">อยากเจอใครอีก</h2>
          <p className="mt-0.5 text-sm text-slate-500">ถ้าเลือกกันทั้งคู่ จะคุยต่อกันได้ ถ้าไม่ตรงกัน อีกฝ่ายจะไม่รู้</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 py-2.5">
                {person.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- member photos
                  <img src={person.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold" aria-hidden="true">{person.name.slice(0, 1)}</span>
                )}
                <span className="flex-1 min-w-0">
                  <Link href={`/profile?id=${encodeURIComponent(person.id)}`} className="font-semibold text-slate-900 hover:underline">{person.name}</Link>
                  <span className={`block text-xs ${person.matched ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                    {person.matched ? 'เลือกตรงกัน คุยต่อได้แล้ว' : person.picked ? 'เลือกแล้ว รอดูว่าตรงกันไหม' : ' '}
                  </span>
                </span>
                {person.matched && person.roomId ? (
                  <button type="button" onClick={() => onOpenPairChat(person.roomId!, person.name)} className="h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    ทักเลย
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => togglePick(person)}
                    aria-pressed={person.picked}
                    disabled={busyId === person.id}
                    className={`h-9 px-4 rounded-full text-sm font-semibold cursor-pointer border ${person.picked ? 'border-[#2563EB] text-[#1D4ED8] bg-white' : 'border-slate-200 text-slate-900 bg-white hover:bg-slate-50'}`}
                  >
                    {person.picked ? 'เลือกแล้ว' : 'อยากเจออีก'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {met && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href={shareHref} className="h-11 px-5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-semibold inline-flex items-center gap-2">
            <Camera className="w-4 h-4 text-rose-500" aria-hidden="true" />
            แชร์โมเมนต์จากตี้นี้
          </Link>
          <span className="text-xs text-slate-500">เพื่อนๆ จะเห็นในฟีด และนับในชาเลนจ์ที่ตี้นี้นับ</span>
        </div>
      )}
    </section>
  );
}
