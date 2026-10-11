'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, Trash2, X } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { nameInitial } from '@/lib/displayName';

interface ChatMessage {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  isMine: boolean;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The event whose participants are chatting */
  event: EventItem | null;
  /** A fair meet-up group (grp_…) instead of the whole event */
  roomId?: string;
  roomTitle?: string;
}

const POLL_MS = 4000;
const clock = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

/**
 * Group chat for the people who joined an event (or a fair meet-up group).
 * Messages live on the server (/api/chat/{roomId}); the list refreshes every few seconds while open.
 */
export const GroupChatModal: React.FC<GroupChatModalProps> = ({ isOpen, onClose, event, roomId, roomTitle }) => {
  const room = roomId || event?.id || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [info, setInfo] = useState<{ title: string; members: number } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [notice, setNotice] = useState('');
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastSeen = useRef('');

  useEffect(() => {
    if (!isOpen || !room) return;
    let active = true;
    let opened = false;
    lastSeen.current = '';
    setMessages([]);
    setState('loading');
    setNotice('');
    const load = async () => {
      const after = lastSeen.current ? `?after=${encodeURIComponent(lastSeen.current)}` : '';
      const res = await fetch(`/api/chat/${encodeURIComponent(room)}${after}`, { cache: 'no-store' }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (!active) return;
      if (!res || !json?.success) {
        // A refusal on the first load closes the room; a failed refresh just keeps what is shown
        if (!opened) {
          setState('denied');
          setNotice(json?.message || 'เปิดแชตไม่ได้ ลองอีกครั้งนะ');
        }
        return;
      }
      opened = true;
      setInfo(json.room);
      setState('ready');
      const fresh: ChatMessage[] = json.messages ?? [];
      if (fresh.length) {
        lastSeen.current = fresh[fresh.length - 1].createdAt;
        setMessages((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))]);
      }
    };
    void load();
    const timer = setInterval(() => document.visibilityState === 'visible' && void load(), POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isOpen, room]);

  useEffect(() => {
    // Keep the newest message in view
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !room) return null;

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/chat/${encodeURIComponent(room)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    const json = await res?.json().catch(() => null);
    return { ok: Boolean(res?.ok && json?.success), message: (json?.message as string) || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', json };
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || isSending) return;
    setIsSending(true);
    setNotice('');
    const result = await post({ text: value });
    setIsSending(false);
    if (!result.ok) return setNotice(result.message);
    setText('');
    // Show it straight away; the next refresh confirms it
    const mine: ChatMessage = { id: result.json.message.id, authorId: 'me', authorName: 'คุณ', authorAvatar: '', text: value, createdAt: result.json.message.createdAt, isMine: true };
    lastSeen.current = mine.createdAt;
    setMessages((prev) => [...prev, mine]);
  };

  const remove = async (id: string) => {
    const result = await post({ action: 'delete', id });
    if (!result.ok) return setNotice(result.message);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const title = roomTitle || info?.title || event?.title || 'แชตกลุ่ม';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-5 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-chat-title"
        className="bg-white w-full sm:max-w-lg h-[88dvh] sm:h-[78vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100">
          <div className="min-w-0">
            <h3 id="group-chat-title" className="text-base font-extrabold text-slate-900 truncate">{title}</h3>
            <p className="text-xs font-medium text-slate-500">{info ? `แชตของคนที่เข้าร่วม · ${info.members} คน` : 'แชตของคนที่เข้าร่วม'}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-slate-50/60" aria-live="polite">
          {state === 'loading' && <p className="text-sm font-medium text-slate-500 text-center py-8">กำลังเปิดแชต…</p>}
          {state === 'ready' && messages.length === 0 && (
            <p className="text-sm font-medium text-slate-500 text-center py-8">ยังไม่มีข้อความ ทักทายกันก่อนวันงานได้เลย</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex items-end gap-2 ${m.isMine ? 'flex-row-reverse' : ''}`}>
              {!m.isMine &&
                (m.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- member upload
                  <img src={m.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">{nameInitial(m.authorName)}</span>
                ))}
              <div className={`max-w-[78%] ${m.isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!m.isMine &&
                  (m.authorId ? (
                    <Link href={`/profile?id=${m.authorId}`} className="text-xs font-bold text-slate-700 hover:text-[#2563EB] mb-0.5">{m.authorName}</Link>
                  ) : (
                    <span className="text-xs font-bold text-slate-700 mb-0.5">{m.authorName}</span>
                  ))}
                <p className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${m.isMine ? 'bg-[#2563EB] text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>{m.text}</p>
                <span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  {clock(m.createdAt)}
                  {m.isMine && (
                    <button type="button" onClick={() => void remove(m.id)} className="inline-flex items-center gap-1 hover:text-rose-600 cursor-pointer" aria-label="ลบข้อความนี้">
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                      ลบ
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {notice && (
          <p role="alert" className="shrink-0 mx-4 sm:mx-5 mt-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
            {notice}
            {/ยืนยันอีเมล|รับคำมั่น/.test(notice) && <Link href="/profile#trust" className="ml-2 underline whitespace-nowrap">ไปที่โปรไฟล์</Link>}
          </p>
        )}

        {state !== 'denied' && (
          <form onSubmit={send} className="shrink-0 flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-slate-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <label htmlFor="group-chat-input" className="sr-only">ข้อความ</label>
            <input
              id="group-chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder="พิมพ์ข้อความ"
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-full px-4 py-3 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-400"
            />
            <button type="submit" disabled={!text.trim() || isSending} className="shrink-0 w-12 h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed" aria-label="ส่งข้อความ">
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
