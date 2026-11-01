'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flag, Plus, Trash2, X } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { VerifyToPostDialog } from '@/components/moments/VerifyToPostDialog';
import { STICKER_SPOT, StoryCaption, StoryComposer, StoryPhoto, StorySticker, type CaptionLayout, type StoryDraft, type StoryTargetDraft } from '@/components/moments/StoryComposer';
import { momentImageSrc, momentTargetHref } from '@/components/moments/momentTargets';
import type { StoryTextColor } from '@/lib/storyTextColors';
import { nameInitial } from '@/lib/displayName';
import { useMemberSession } from '@/lib/useMemberSession';
import { recall, remember } from '@/lib/clientMemory';

/**
 * Stories: one photo, gone after 24 hours. The row of circles, the full-screen viewer, the full-screen
 * "เพิ่มสตอรี่" composer (StoryComposer) and reporting, shared by the home feed and /moments.
 */

interface StoryGroup {
  author: { id: string; displayName: string; avatarUrl: string };
  isMine: boolean;
  allSeen: boolean;
  stories: { id: string; image: string; caption: string; captionLayout?: CaptionLayout; captionColor?: StoryTextColor; target?: StoryTargetDraft; hoursLeft: number; seen: boolean; hasReported?: boolean; views?: number }[];
}

const REPORT_REASONS = ['ชวนลงทุน ขายของ หรือขายประกัน', 'หลอกลวงหรือขอข้อมูลส่วนตัว', 'เนื้อหาไม่เหมาะสม', 'คุกคามหรือพูดจาไม่ดี', 'อื่นๆ'];

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ' };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

export interface StoriesRailProps {
  isLoggedIn: boolean;
  /** Signed out: ask the visitor to join before adding a story */
  onNeedLogin?: () => void;
  onToast: (message: string) => void;
  /** More items at the end of the row, e.g. the highlights on /moments */
  after?: React.ReactNode;
  /** Home feed: no row at all until someone has a story (adding one starts from `addSignal`) */
  hideWhenEmpty?: boolean;
  /** Bump to open the "เพิ่มสตอรี่" form from a button outside the row */
  addSignal?: number;
  /** Item size: 64px on the home feed, 64 → 72px on /moments */
  size?: 'sm' | 'md';
}

export function StoriesRail({ isLoggedIn, onNeedLogin, onToast, after, size = 'md', hideWhenEmpty = false, addSignal = 0 }: StoriesRailProps) {
  const session = useMemberSession();
  const [groups, setGroups] = useState<StoryGroup[]>(() => recall<StoryGroup[]>('stories') ?? []);
  const [reload, setReload] = useState(0);
  const [view, setView] = useState<{ group: number; index: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [reporting, setReporting] = useState<{ id: string; reason: string } | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/stories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setGroups(remember('stories', json.groups ?? [])))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [reload, session.member?.id]);

  const openForm = () => {
    if (!isLoggedIn) return onNeedLogin?.();
    const trust = session.member?.trust;
    if (trust && !(trust.emailVerified && trust.pledged)) return setIsVerifyOpen(true);
    setIsComposing(true);
  };
  // A button outside the row (the home composer) asks for the form by bumping the number
  const seenSignal = useRef(addSignal);
  useEffect(() => {
    if (addSignal === seenSignal.current) return;
    seenSignal.current = addSignal;
    openForm();
  });

  const post = async (draft: StoryDraft) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const form = new FormData();
      form.append('file', draft.file);
      form.append('folder', 'moments');
      const upload = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
      if (!upload?.success || !upload.url) return onToast(upload?.error || upload?.message || 'อัปโหลดรูปไม่สำเร็จ ลองอีกครั้งนะ');
      const result = await call('/api/stories', 'POST', { image: upload.url, caption: draft.caption, captionLayout: draft.captionLayout, captionColor: draft.captionColor, target: draft.target ?? undefined });
      if (!result.ok) return onToast(result.message);
      setIsComposing(false);
      setReload((n) => n + 1);
      onToast('แชร์สตอรี่แล้ว จะแสดง 24 ชั่วโมง');
    } finally {
      setIsBusy(false);
    }
  };

  const open = useCallback(
    (group: number, index: number) => {
      const story = groups[group]?.stories[index];
      if (!story) return setView(null);
      setView({ group, index });
      if (isLoggedIn && !story.seen) {
        void call(`/api/stories/${story.id}`, 'POST', {});
        setGroups((prev) =>
          prev.map((g, gi) => (gi !== group ? g : { ...g, stories: g.stories.map((s, si) => (si === index ? { ...s, seen: true } : s)), allSeen: g.stories.every((s, si) => si === index || s.seen) }))
        );
      }
    },
    [groups, isLoggedIn]
  );

  /** Next photo, then the next person's stories, then close */
  const step = useCallback(
    (direction: 1 | -1) => {
      if (!view) return;
      const group = groups[view.group];
      const nextIndex = view.index + direction;
      if (group && nextIndex >= 0 && nextIndex < group.stories.length) return open(view.group, nextIndex);
      const nextGroup = view.group + direction;
      if (nextGroup < 0 || nextGroup >= groups.length) return setView(null);
      open(nextGroup, direction === 1 ? 0 : groups[nextGroup].stories.length - 1);
    },
    [view, groups, open]
  );

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, step]);

  const remove = async (id: string) => {
    const result = await call(`/api/stories/${id}`, 'DELETE');
    if (!result.ok) return onToast(result.message);
    setView(null);
    setReload((n) => n + 1);
    onToast('ลบสตอรี่แล้ว');
  };

  const sendReport = async () => {
    if (!reporting?.reason) return;
    setIsBusy(true);
    const result = await call(`/api/stories/${reporting.id}`, 'POST', { action: 'report', reason: reporting.reason });
    setIsBusy(false);
    if (!result.ok) return onToast(result.message);
    setReporting(null);
    setReload((n) => n + 1);
    onToast('ส่งรายงานให้ทีมงานแล้ว ขอบคุณที่ช่วยกันดูแล');
  };

  const box = size === 'sm' ? 'w-16' : 'w-16 sm:w-[72px]';
  const circle = size === 'sm' ? 'w-16 h-16' : 'w-16 h-16 sm:w-[72px] sm:h-[72px]';
  const current = view ? groups[view.group]?.stories[view.index] : undefined;
  const currentGroup = view ? groups[view.group] : undefined;

  return (
    <>
      {!(hideWhenEmpty && groups.length === 0) && (
      <ul className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1" aria-label="สตอรี่">
        <li className={`shrink-0 ${box}`}>
          <button type="button" onClick={openForm} className="w-full flex flex-col items-center gap-1.5 cursor-pointer group">
            <span className={`${circle} rounded-full border-2 border-dashed border-slate-300 group-hover:border-[#2563EB] bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-[#2563EB] transition-colors`}>
              <Plus className="w-6 h-6" aria-hidden="true" />
            </span>
            <span className="w-full text-[11px] font-medium text-slate-700 truncate text-center">เพิ่มสตอรี่</span>
          </button>
        </li>
        {groups.map((g, gi) => (
          <li key={g.author.id} className={`shrink-0 ${box}`}>
            <button
              type="button"
              onClick={() => open(gi, Math.max(0, g.stories.findIndex((s) => !s.seen)))}
              className="w-full flex flex-col items-center gap-1.5 cursor-pointer"
              aria-label={`ดูสตอรี่ของ ${g.author.displayName}`}
            >
              <span className={`${circle} rounded-full p-0.5 border-2 ${g.allSeen ? 'border-slate-300' : 'border-[#F43F5E]'}`}>
                {/* A 56-72px ring: a small copy, not the full photo */}
                {/* eslint-disable-next-line @next/next/no-img-element -- member upload */}
                <img loading="lazy" src={momentImageSrc(g.stories[g.stories.length - 1].image, 128)} alt="" className="w-full h-full rounded-full object-cover" />
              </span>
              <span className="w-full text-[11px] font-medium text-slate-700 truncate text-center">{g.isMine ? 'สตอรี่ของคุณ' : g.author.displayName}</span>
            </button>
          </li>
        ))}
        {after}
      </ul>
      )}

      {isComposing && <StoryComposer onClose={() => setIsComposing(false)} onShare={post} onToast={onToast} isBusy={isBusy} />}

      {view && current && currentGroup && (
        <div role="dialog" aria-modal="true" aria-label={`สตอรี่ของ ${currentGroup.author.displayName}`} className="fixed inset-0 z-[70] bg-black flex items-center justify-center" onClick={() => setView(null)}>
          <div className="relative w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <StoryPhoto src={current.image} alt={current.caption || `สตอรี่ของ ${currentGroup.author.displayName}`} />
            <button type="button" onClick={() => step(-1)} className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" aria-label="รูปก่อนหน้า" />
            <button type="button" onClick={() => step(1)} className="absolute inset-y-0 right-0 w-2/3 cursor-pointer" aria-label="รูปถัดไป" />
            <div className="absolute top-0 inset-x-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-black/45 space-y-2.5">
              <div className="flex gap-1" aria-hidden="true">
                {currentGroup.stories.map((s, i) => (
                  <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= view.index ? 'bg-white' : 'bg-white/35'}`} />
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <Link href={`/profile?id=${currentGroup.author.id}`} className="flex items-center gap-2.5 min-w-0">
                  {currentGroup.author.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- member upload
                    <img src={currentGroup.author.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/40 shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                      {nameInitial(currentGroup.author.displayName)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white truncate">{currentGroup.author.displayName}</span>
                    <span className="block text-xs font-medium text-white/80">เหลืออีก {current.hoursLeft} ชั่วโมง</span>
                  </span>
                </Link>
                <span className="flex items-center gap-2 shrink-0">
                  {!currentGroup.isMine && isLoggedIn && (
                    <button
                      type="button"
                      disabled={current.hasReported}
                      onClick={() => {
                        setReporting({ id: current.id, reason: '' });
                        setView(null);
                      }}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center cursor-pointer"
                      aria-label={current.hasReported ? 'รายงานแล้ว' : 'รายงานสตอรี่นี้'}
                      title={current.hasReported ? 'รายงานแล้ว' : 'รายงานสตอรี่นี้'}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setView(null)} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer" aria-label="ปิด">
                    <X className="w-5 h-5" />
                  </button>
                </span>
              </div>
            </div>
            {/* The text and the sticker where the author put them; the sticker opens its ตี้, อีเวนต์ or place */}
            {current.target && (
              <Link href={momentTargetHref(current.target.type, current.target.id) ?? '#'} className={STICKER_SPOT}>
                <StorySticker target={current.target} />
              </Link>
            )}
            {current.caption && <StoryCaption text={current.caption} layout={current.captionLayout} color={current.captionColor} />}
            {currentGroup.isMine && (
              <div className="absolute bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/55 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-white/85">มีคนดูแล้ว {current.views ?? 0} คน</span>
                <button type="button" onClick={() => remove(current.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-rose-600 text-white text-sm font-bold cursor-pointer whitespace-nowrap">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  ลบสตอรี่
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {reporting && (
        <DialogShell onClose={() => setReporting(null)} title="รายงานสตอรี่นี้" subtitle="ทีมงานจะตรวจสอบ เจ้าของจะไม่รู้ว่าใครรายงาน" size="sm">
          <fieldset className="space-y-2 mb-5">
            <legend className="sr-only">เหตุผล</legend>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-sm font-semibold ${
                  reporting.reason === reason ? 'border-[#2563EB] bg-blue-50/60 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="story-report-reason" value={reason} checked={reporting.reason === reason} onChange={() => setReporting({ ...reporting, reason })} className="accent-[#2563EB]" />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setReporting(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!reporting.reason || isBusy} onClick={sendReport}>ส่งรายงาน</button>
          </div>
        </DialogShell>
      )}

      {isVerifyOpen && <VerifyToPostDialog onClose={() => setIsVerifyOpen(false)} />}
    </>
  );
}
