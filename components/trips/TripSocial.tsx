'use client';
/* eslint-disable @next/next/no-img-element -- member faces load through avatarImage, not the paid image optimizer */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ImageDown, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react';
import { avatarImage } from '@/lib/optimizedImage';
import { MAX_TRIP_COMMENT, type TripView } from '@/lib/trips/story';
import type { TripCommentView } from '@/lib/trips/social';
import { useTripCard } from '@/components/trips/storyCard';

/**
 * Readers answer a trip (owner 2026-11-27): a heart beside the trip's buttons, and comments under the story. Before,
 * a reader who finished could only follow it or share it, so the author never heard back.
 */

type Chrome = { isLoggedIn: boolean; requireLogin: (reason: string) => void; showToast: (message: string) => void };

export function TripLikeButton({ trip, chrome }: { trip: TripView; chrome: Chrome }) {
  const [state, setState] = useState({ liked: trip.liked, count: trip.likeCount });
  const toggle = async () => {
    if (!chrome.isLoggedIn) return chrome.requireLogin('ส่งหัวใจให้ทริปนี้');
    const liked = !state.liked;
    setState((s) => ({ liked, count: Math.max(0, s.count + (liked ? 1 : -1)) }));
    const json = await fetch(`/api/trips/${trip.id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liked }) })
      .then((r) => r.json())
      .catch(() => null);
    if (json?.success) setState({ liked: json.liked, count: json.likeCount });
    else {
      setState({ liked: !liked, count: state.count });
      chrome.showToast(json?.message || 'ส่งหัวใจไม่สำเร็จ ลองอีกครั้งนะ');
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'เลิกส่งหัวใจ' : 'ส่งหัวใจให้ทริปนี้'}
      className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
    >
      <Heart className={`size-5 ${state.liked ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} aria-hidden />
      {state.count > 0 && <span className="tabular-nums">{state.count}</span>}
    </button>
  );
}

/** Jumps to the comments; the count tells there is a conversation */
export function TripCommentsLink({ count }: { count: number }) {
  return (
    <a href="#comments" aria-label="ความคิดเห็น" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
      <MessageCircle className="size-5" aria-hidden />
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </a>
  );
}

/** The 9:16 picture for IG Story and LINE (components/trips/storyCard.ts) */
export function TripCardButton({ trip, onToast, className = '' }: { trip: TripView; onToast: (message: string) => void; className?: string }) {
  const card = useTripCard(trip, onToast);
  return (
    <button
      type="button"
      onClick={() => void card.go()}
      disabled={card.busy}
      className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-wait ${className}`}
    >
      {card.busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImageDown className="size-4" aria-hidden />}
      {card.busy ? 'กำลังทำรูป…' : card.ready ? 'รูปพร้อมแล้ว แตะเพื่อแชร์' : 'รูปลงสตอรี่'}
    </button>
  );
}

export function TripComments({ trip, chrome }: { trip: TripView; chrome: Chrome }) {
  const [comments, setComments] = useState<TripCommentView[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/trips/${trip.id}/comments`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => live && setComments(json?.success ? (json.comments as TripCommentView[]) : []))
      .catch(() => live && setComments([]));
    return () => {
      live = false;
    };
  }, [trip.id]);

  const send = async () => {
    if (!chrome.isLoggedIn) return chrome.requireLogin('แสดงความคิดเห็นในทริปนี้');
    if (!text.trim() || sending) return;
    setSending(true);
    const json = await fetch(`/api/trips/${trip.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      .then((r) => r.json())
      .catch(() => null);
    setSending(false);
    if (!json?.success) return chrome.showToast(json?.message || 'ส่งไม่สำเร็จ ลองอีกครั้งนะ');
    setComments((list) => [...(list ?? []), json.comment as TripCommentView]);
    setText('');
  };

  const remove = async (id: string) => {
    const json = await fetch(`/api/trips/${trip.id}/comments/${id}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => null);
    if (json?.success) setComments((list) => (list ?? []).filter((c) => c.id !== id));
    else chrome.showToast(json?.message || 'ลบไม่สำเร็จ');
  };

  return (
    <section id="comments" className="mt-16 scroll-mt-24 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-bold text-slate-900">ความคิดเห็น{comments && comments.length > 0 && <span className="font-normal text-slate-500"> · {comments.length}</span>}</h2>
      {comments === null ? (
        <p className="mt-3 text-sm text-slate-500">กำลังโหลด…</p>
      ) : comments.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{trip.isOwner ? 'ยังไม่มีใครคอมเมนต์ แชร์ทริปให้เพื่อนดูกัน' : `เป็นคนแรกที่บอก ${trip.author.name} ว่าชอบทริปนี้ตรงไหน`}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Link href={`/profile?id=${encodeURIComponent(c.author.id)}`} className="relative size-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {c.author.avatar && <img src={avatarImage(c.author.avatar, 96)} alt="" className="size-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link href={`/profile?id=${encodeURIComponent(c.author.id)}`} className="font-semibold text-slate-900 hover:underline">
                    {c.author.name}
                  </Link>{' '}
                  <span className="text-xs text-slate-500">{c.timeAgo}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{c.text}</p>
              </div>
              {c.canDelete && (
                <button type="button" onClick={() => remove(c.id)} aria-label="ลบความคิดเห็น" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !chrome.isLoggedIn && chrome.requireLogin('แสดงความคิดเห็นในทริปนี้')}
          maxLength={MAX_TRIP_COMMENT}
          rows={1}
          placeholder="เขียนความคิดเห็น…"
          aria-label="เขียนความคิดเห็น"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
        />
        <button type="submit" disabled={!text.trim() || sending} aria-label="ส่ง" className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
    </section>
  );
}
