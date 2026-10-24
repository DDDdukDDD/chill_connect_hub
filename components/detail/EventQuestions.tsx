'use client';

import React, { useEffect, useState } from 'react';

export interface QuestionItem {
  id: string;
  authorName: string;
  text: string;
  timeAgo: string;
  isMine: boolean;
  answer?: { text: string; timeAgo: string };
}

interface QuestionsState {
  canAnswer: boolean;
  hostName?: string;
  questions: QuestionItem[];
}

/**
 * "ถามผู้จัดก่อนไป" (owner 2026-10-23): public questions on a ตี้ with the host's answers. The first list comes from the
 * server (in the HTML for visitors and search engines); members can ask, the host answers here.
 */
export function EventQuestions({ eventId, initial, isLoggedIn, onRequireLogin }: { eventId: string; initial: QuestionsState | null; isLoggedIn: boolean; onRequireLogin: () => void }) {
  const [state, setState] = useState<QuestionsState>(initial ?? { canAnswer: false, questions: [] });
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Signed in: read again so "canAnswer" and "isMine" reflect the member
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/events/${encodeURIComponent(eventId)}/questions`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json?.success && setState(json))
      .catch(() => undefined);
  }, [eventId, isLoggedIn]);

  const post = async (body: Record<string, string>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || 'ส่งไม่สำเร็จ ลองอีกครั้งนะ');
        return false;
      }
      setState(json);
      return true;
    } finally {
      setBusy(false);
    }
  };

  const host = state.hostName ? state.hostName.replace(/\s*\(.*\)\s*$/, '') : 'คนจัด';

  return (
    <section id="questions" className="scroll-mt-24 space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">ถาม {host} ก่อนไป</h2>
      {state.questions.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีคำถาม มีอะไรอยากรู้ก่อนไป ถามได้เลย</p>}
      <ul className="divide-y divide-slate-100">
        {state.questions.map((q) => (
          <li key={q.id} className="py-3 text-sm text-slate-700">
            <p>
              <strong className="text-slate-900">{q.authorName}</strong> <span className="text-slate-500">· {q.timeAgo}</span>
            </p>
            <p className="mt-0.5">{q.text}</p>
            {q.answer ? (
              <div className="mt-2 pl-3.5 border-l-2 border-[#F9C9B2]">
                <p>
                  <strong className="text-slate-900">{host}</strong> <span className="text-xs font-semibold text-[#B93F12]">คนจัด</span> <span className="text-slate-500">· {q.answer.timeAgo}</span>
                </p>
                <p className="mt-0.5">{q.answer.text}</p>
              </div>
            ) : state.canAnswer ? (
              <form
                className="mt-2 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await post({ action: 'answer', id: q.id, text: answers[q.id] ?? '' })) setAnswers((a) => ({ ...a, [q.id]: '' }));
                }}
              >
                <label htmlFor={`answer-${q.id}`} className="sr-only">ตอบคำถามนี้</label>
                <input id={`answer-${q.id}`} value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} maxLength={200} placeholder="ตอบคำถามนี้" className="flex-1 h-10 px-4 border border-slate-300 rounded-full text-sm focus:outline-hidden focus:border-[#2563EB]" />
                <button type="submit" disabled={busy} className="h-10 px-4 rounded-full bg-[#2563EB] text-white text-sm font-semibold cursor-pointer">ตอบ</button>
              </form>
            ) : (
              <p className="mt-1 text-xs text-slate-500">รอคนจัดตอบ</p>
            )}
            {q.isMine && (
              <button type="button" onClick={() => void post({ action: 'remove', id: q.id })} className="mt-1 text-xs text-slate-500 underline cursor-pointer">ลบคำถามของฉัน</button>
            )}
          </li>
        ))}
      </ul>
      {!state.canAnswer && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isLoggedIn) return onRequireLogin();
            if (await post({ action: 'ask', text })) setText('');
          }}
        >
          <label htmlFor={`ask-${eventId}`} className="sr-only">ถามคำถาม</label>
          <input id={`ask-${eventId}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="ถามอะไรก็ได้เกี่ยวกับตี้นี้" className="flex-1 h-11 px-4 border border-slate-300 rounded-full text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" />
          <button type="submit" disabled={busy || (isLoggedIn && text.trim().length < 3)} className="h-11 px-5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-900 cursor-pointer disabled:opacity-50">ถาม</button>
        </form>
      )}
      {error && <p className="text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      <p className="text-xs text-slate-500">คำถามและคำตอบทุกคนเห็น · เรื่องส่วนตัวคุยในแชตกลุ่มหลังลงทะเบียน</p>
    </section>
  );
}
