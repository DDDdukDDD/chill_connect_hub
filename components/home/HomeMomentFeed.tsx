'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Bookmark, Camera, ChevronLeft, ChevronRight, Flag, Heart, Link2, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { StoriesRail } from '@/components/moments/StoriesRail';
import type { FeedItem } from '@/lib/moments/service';
import { nameInitial } from '@/lib/displayName';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { MomentPhotos } from '@/components/moments/MomentPhotos';
import { MomentComposer, CountedQuestNotice, type CountedQuest, type MomentComposerInitial } from '@/components/moments/MomentComposer';
import { liveHref } from '@/components/home/LiveActivity';
import { MOMENT_TARGETS } from '@/components/moments/momentTargets';

const PAGE_SIZE = 8;
const NEW_CHECK_MS = 60_000;
export const REPORT_REASONS = ['ชวนลงทุน ขายของ หรือขายประกัน', 'หลอกลวงหรือขอข้อมูลส่วนตัว', 'เนื้อหาไม่เหมาะสม', 'คุกคามหรือพูดจาไม่ดี', 'อื่นๆ'];

// Where the moment came from, in its pillar's colors, and what the reader can do there
const TARGETS = MOMENT_TARGETS;

/** The three tabs, plus two personal views opened from the shortcuts or the ⋯ next to the tabs */
export type FeedView = 'all' | 'following' | 'popular' | 'saved' | 'mine';
const TABS: [FeedView, string][] = [
  ['all', 'ล่าสุด'],
  ['following', 'ติดตาม'],
  ['popular', 'ยอดฮิต'],
];
const PERSONAL: Partial<Record<FeedView, string>> = { saved: 'โมเมนต์ที่บันทึก', mine: 'โมเมนต์ของฉัน' };
const EMPTY: Record<FeedView, string> = {
  all: 'ยังไม่มีโมเมนต์ ออกไปเที่ยวแล้วมาเล่าให้เพื่อนๆ ฟังกัน',
  following: 'ยังไม่ได้ติดตามใครเลย กดชื่อเพื่อนในโมเมนต์ แล้วกดติดตามที่โปรไฟล์',
  popular: 'ยังไม่มีโมเมนต์ยอดฮิต',
  saved: 'ยังไม่ได้บันทึกโมเมนต์ไหน กดรูปที่คั่นหนังสือใต้โพสต์ที่ชอบ แล้วจะมาอยู่ตรงนี้',
  mine: 'ยังไม่มีโมเมนต์ของคุณ แชร์โมเมนต์แรกได้จากช่องด้านบน',
};
type Action = 'like' | 'unlike' | 'save' | 'unsave';

export async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; message: string; moment?: FeedItem; autoHidden?: boolean }> {
  try {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', moment: json?.moment, autoHidden: json?.autoHidden };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

function Avatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} rounded-full object-cover bg-slate-100 shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0`} aria-hidden="true">
      {nameInitial(name)}
    </span>
  );
}

interface PostHandlers {
  onToggle: (id: string, action: Action) => void;
  onComment: (id: string, text: string) => Promise<boolean>;
  onDeleteComment: (id: string, commentId: string) => void;
  onMenu: (moment: FeedItem, choice: 'edit' | 'delete' | 'report' | 'copy') => void;
  onPhotos: (images: string[], index: number) => void;
}

function MomentPost({ moment, handlers, myAvatar, myName }: { moment: FeedItem; handlers: PostHandlers; myAvatar?: string; myName: string }) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const target = moment.targetType && moment.targetType !== 'general' && moment.targetId ? TARGETS[moment.targetType as keyof typeof TARGETS] : undefined;
  const shownComments = showComments ? moment.comments : moment.comments.slice(-1);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    if (await handlers.onComment(moment.id, draft.trim())) setDraft('');
    setIsSending(false);
  };

  const menuItems = moment.isMine
    ? ([
        ['edit', 'แก้ไขข้อความ', Pencil],
        ['copy', 'คัดลอกลิงก์', Link2],
        ['delete', 'ลบโมเมนต์', Trash2],
      ] as const)
    : ([
        ['copy', 'คัดลอกลิงก์', Link2],
        ['report', moment.hasReported ? 'รายงานแล้ว' : 'รายงานโพสต์นี้', Flag],
      ] as const);

  return (
    <article id={`moment-${moment.id}`} className="py-5 border-b border-slate-200 space-y-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {moment.authorId ? (
          <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} className="shrink-0">
            <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
          </Link>
        ) : (
          <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{moment.userName}</p>
          <p className="text-xs text-slate-500 truncate">
            {moment.timeAgo}
            {moment.location && ` · ${moment.location}`}
          </p>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="ตัวเลือกเพิ่มเติม"
            aria-expanded={isMenuOpen}
            className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <>
              <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setIsMenuOpen(false)} />
              <ul className="absolute right-0 top-10 z-30 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                {menuItems.map(([choice, label, Icon]) => (
                  <li key={choice}>
                    <button
                      type="button"
                      disabled={choice === 'report' && moment.hasReported}
                      onClick={() => {
                        setIsMenuOpen(false);
                        handlers.onMenu(moment, choice);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        choice === 'delete' ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {moment.images.length > 0 && <MomentPhotos images={moment.images} ratio={moment.imageRatio} alt={moment.caption || moment.location} onOpen={(index) => handlers.onPhotos(moment.images, index)} onDoubleTap={() => !moment.isLiked && handlers.onToggle(moment.id, 'like')} />}

      {moment.caption && (
        <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line">
          <strong className="font-semibold text-slate-900">{moment.userName}</strong> {moment.caption}
        </p>
      )}

      {target && (
        <Link
          href={liveHref({ type: moment.targetType as keyof typeof TARGETS, id: moment.targetId, title: moment.targetTitle ?? '' })}
          className={`flex items-center gap-2.5 rounded-2xl ${target.box} pl-2 pr-3 py-2 hover:opacity-90`}
        >
          <span className={`w-8 h-8 rounded-xl bg-white ${target.icon} flex items-center justify-center shrink-0`} aria-hidden="true">
            <target.Icon className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium opacity-80">{target.label}</span>
            <span className="block text-[13px] font-semibold truncate">{moment.targetTitle || moment.location}</span>
          </span>
          <span className="text-xs font-semibold whitespace-nowrap">{target.go} →</span>
        </Link>
      )}

      <div className="flex items-center gap-5 text-[13px] font-medium text-slate-500">
        <button
          type="button"
          onClick={() => handlers.onToggle(moment.id, moment.isLiked ? 'unlike' : 'like')}
          aria-pressed={moment.isLiked}
          aria-label={moment.isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'}
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-[#F43F5E] ${moment.isLiked ? 'text-[#F43F5E]' : ''}`}
        >
          <Heart className={`w-[18px] h-[18px] ${moment.isLiked ? 'fill-current' : ''}`} />
          <span className="tabular-nums">{moment.likesCount.toLocaleString()}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          aria-label="ความคิดเห็น"
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-800 ${showComments ? 'text-slate-900' : ''}`}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="tabular-nums">{moment.commentsCount.toLocaleString()}</span>
        </button>
        <button
          type="button"
          onClick={() => handlers.onToggle(moment.id, moment.isSaved ? 'unsave' : 'save')}
          aria-pressed={moment.isSaved}
          aria-label={moment.isSaved ? 'เลิกบันทึก' : 'บันทึก'}
          className={`ml-auto cursor-pointer hover:text-slate-900 ${moment.isSaved ? 'text-slate-900' : ''}`}
        >
          <Bookmark className={`w-[18px] h-[18px] ${moment.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {shownComments.length > 0 && (
        <ul className="space-y-2">
          {shownComments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-2 text-[13px] text-slate-700">
              <Avatar name={comment.userName} src={comment.userAvatar} className="w-6 h-6 text-[10px] mt-0.5" />
              <span className="min-w-0 flex-1">
                <strong className="font-semibold text-slate-900">{comment.userName}</strong> {comment.text}
                <span className="block text-[11px] text-slate-400">{comment.timeAgo}</span>
              </span>
              {comment.isMine && (
                <button
                  type="button"
                  onClick={() => handlers.onDeleteComment(moment.id, comment.id)}
                  aria-label="ลบความคิดเห็น"
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!showComments && moment.commentsCount > 1 && (
        <button type="button" onClick={() => setShowComments(true)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
          ดูความคิดเห็นทั้งหมด {moment.commentsCount} รายการ
        </button>
      )}
      {showComments && (
        <form onSubmit={send} className="flex items-center gap-2">
          <Avatar name={myName} src={myAvatar} className="w-7 h-7 text-[11px]" />
          <label htmlFor={`comment-${moment.id}`} className="sr-only">เขียนความคิดเห็น</label>
          <input
            id={`comment-${moment.id}`}
            value={draft}
            maxLength={300}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="เขียนความคิดเห็น…"
            className="flex-1 min-w-0 h-9 rounded-full bg-slate-50 border border-slate-200 px-3.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            aria-label="ส่งความคิดเห็น"
            className="w-9 h-9 rounded-full text-[#2563EB] hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </article>
  );
}

/** Full-screen photos: arrows, swipe and Esc */
export function PhotoViewer({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);
  const step = useCallback((by: number) => setIndex((i) => (i + by + images.length) % images.length), [images.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ดูรูป"
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- member upload */}
      <img src={images[index]} alt={`รูปที่ ${index + 1}`} className="max-w-full max-h-[90dvh] object-contain" onClick={(e) => e.stopPropagation()} />
      <button type="button" onClick={onClose} aria-label="ปิด" className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer">
        <X className="w-5 h-5" />
      </button>
      {images.length > 1 && (
        <>
          <span className="absolute top-[max(1.4rem,env(safe-area-inset-top))] left-4 text-sm font-bold text-white/85 tabular-nums">
            {index + 1}/{images.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="รูปก่อนหน้า"
            className="hidden sm:flex absolute left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="รูปถัดไป"
            className="hidden sm:flex absolute right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
}

export interface HomeMomentFeedProps {
  avatar?: string;
  name: string;
  /** Shown under the "share a moment" box, before the posts, e.g. the live ticker */
  top?: React.ReactNode;
  /** Which moments to show; the left column's shortcuts change it too */
  view: FeedView;
  onViewChange: (view: FeedView) => void;
  /** Rendered after a given post (0 = the first). Each insert sets its own screen sizes */
  inserts?: Record<number, React.ReactNode>;
  /** Opens the share form tied to a place or event (the journey band's "แชร์โมเมนต์แรก"); a new `key` opens it again */
  shareRequest?: ShareRequest | null;
  /** Told after the member posts a moment */
  onPosted?: () => void;
}

export interface ShareRequest {
  key: number;
  type?: string;
  id?: string;
  title?: string;
  location?: string;
}

/** The share form's opening state for a place or event ("community", "spot", "fair") */
function shareInitial(type: string, id: string, title: string, location: string): MomentComposerInitial {
  const targetType = type === 'spot' || type === 'fair' ? type : 'community';
  return {
    target: id && title ? { type: targetType, id, title, location } : undefined,
    location,
    caption: title ? (targetType === 'community' ? `แชร์ความประทับใจจากตี้ "${title}"\n` : `ไปมาแล้ว "${title}"\n`) : undefined,
  };
}

/**
 * The middle of the member home: every moment, newest or most liked, loading more as the member scrolls.
 * Posting, comments, likes, saves, editing, deleting and reporting all happen here; /moments is the
 * photo showcase for browsing (no posting there).
 */
export function HomeMomentFeed({ avatar, name, top, view: sort, onViewChange: setSort, inserts = {}, shareRequest, onPosted }: HomeMomentFeedProps) {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [moments, setMoments] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // The view whose list is on screen; until it matches the chosen view, placeholders show
  const [loadedView, setLoadedView] = useState<FeedView | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<MomentComposerInitial | null>(null);
  // The "+ สตอรี่" button beside the composer opens the story form inside the rail
  const [storySignal, setStorySignal] = useState(0);
  const [counted, setCounted] = useState<CountedQuest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeedItem | null>(null);
  const [reporting, setReporting] = useState<{ moment: FeedItem; reason: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; caption: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Old share links (/moments?createForEvent=…) forward here as /?share=<type>:<id>&title=&location=; the form opens tied to that event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (!share) return;
    const [type, ...rest] = share.split(':');
    setComposerInitial(shareInitial(type, rest.join(':'), params.get('title') ?? '', params.get('location') ?? ''));
    setIsComposerOpen(true);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // The journey band asks for the form without leaving the page
  useEffect(() => {
    if (!shareRequest) return;
    const { type = '', id = '', title = '', location = '' } = shareRequest;
    setComposerInitial(shareInitial(type, id, title, location));
    setIsComposerOpen(true);
  }, [shareRequest]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPage = useCallback(async (which: FeedView, pageNo: number) => {
    const response = await fetch(`/api/moments?tab=${which}&page=${pageNo}&limit=${PAGE_SIZE}`, { cache: 'no-store' });
    const result = await response.json();
    if (!result?.success || !Array.isArray(result.moments)) throw new Error('moments');
    return { items: result.moments as FeedItem[], hasNext: Boolean(result.pagination?.hasNextPage) };
  }, []);

  const reload = useCallback(
    (which: FeedView) => {
      // The current list stays on screen until the new one arrives
      fetchPage(which, 1)
        .then(({ items, hasNext }) => {
          setMoments(items);
          setHasMore(hasNext);
          setPage(1);
          setNewCount(0);
        })
        .catch((error) => console.warn('Home moments:', error))
        .finally(() => setLoadedView(which));
    },
    [fetchPage]
  );

  useEffect(() => reload(sort), [sort, reload]);

  // New moments: a quiet check every minute; the list itself never jumps while someone is reading
  useEffect(() => {
    if (sort !== 'all' || moments.length === 0) return;
    const known = new Set(moments.map((m) => m.id));
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchPage('all', 1)
        .then(({ items }) => {
          const firstKnown = items.findIndex((m) => known.has(m.id));
          setNewCount(firstKnown === -1 ? items.length : firstKnown);
        })
        .catch(() => {});
    }, NEW_CHECK_MS);
    return () => clearInterval(timer);
  }, [sort, moments, fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    fetchPage(sort, page + 1)
      .then(({ items, hasNext }) => {
        setMoments((prev) => [...prev, ...items.filter((m) => !prev.some((p) => p.id === m.id))]);
        setHasMore(hasNext);
        setPage(page + 1);
      })
      .catch((error) => console.warn('Home moments:', error))
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, fetchPage, sort, page]);

  // The next page loads before the end of the list comes into view
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: '600px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, loadedView]);

  const replace = (updated: FeedItem) => setMoments((list) => list.map((m) => (m.id === updated.id ? updated : m)));

  const handlers: PostHandlers = {
    onToggle: (id, action) => {
      const apply = (list: FeedItem[], act: Action) =>
        list.map((m) =>
          m.id !== id
            ? m
            : act === 'like' || act === 'unlike'
              ? { ...m, isLiked: act === 'like', likesCount: m.likesCount + (act === 'like' ? 1 : -1) }
              : { ...m, isSaved: act === 'save' }
        );
      const undo = { like: 'unlike', unlike: 'like', save: 'unsave', unsave: 'save' } as const;
      setMoments((list) => apply(list, action));
      call(`/api/moments/${encodeURIComponent(id)}/actions`, 'POST', { action }).then((result) => {
        if (!result.ok) {
          setMoments((list) => apply(list, undo[action]));
          showToast(result.message);
        }
      });
    },
    onComment: async (id, text) => {
      const result = await call(`/api/moments/${encodeURIComponent(id)}/actions`, 'POST', { action: 'comment', text });
      if (!result.ok || !result.moment) {
        showToast(result.message);
        return false;
      }
      replace(result.moment);
      return true;
    },
    onDeleteComment: async (id, commentId) => {
      const result = await call(`/api/moments/${encodeURIComponent(id)}/actions`, 'POST', { action: 'delete_comment', commentId });
      if (!result.ok || !result.moment) return showToast(result.message);
      replace(result.moment);
    },
    onMenu: (moment, choice) => {
      if (choice === 'edit') setEditing({ id: moment.id, caption: moment.caption });
      if (choice === 'delete') setConfirmDelete(moment);
      if (choice === 'report') setReporting({ moment, reason: '' });
      if (choice === 'copy') {
        const url = `${window.location.origin}/moments/${encodeURIComponent(moment.id)}`;
        if (!navigator.clipboard) return showToast(url);
        navigator.clipboard.writeText(url).then(
          () => showToast('คัดลอกลิงก์โมเมนต์แล้ว'),
          () => showToast(url)
        );
      }
    },
    onPhotos: (images, index) => setViewer({ images, index }),
  };

  const deletePost = async (moment: FeedItem) => {
    setIsBusy(true);
    const result = await call(`/api/moments/${encodeURIComponent(moment.id)}`, 'DELETE');
    setIsBusy(false);
    setConfirmDelete(null);
    if (!result.ok) return showToast(result.message);
    setMoments((list) => list.filter((m) => m.id !== moment.id));
    showToast('ลบโมเมนต์แล้ว');
  };

  const sendReport = async () => {
    if (!reporting?.reason) return;
    setIsBusy(true);
    const result = await call(`/api/moments/${encodeURIComponent(reporting.moment.id)}/actions`, 'POST', { action: 'report', reason: reporting.reason });
    setIsBusy(false);
    if (!result.ok) return showToast(result.message);
    const id = reporting.moment.id;
    // A post hidden by enough reports leaves the feed straight away
    setMoments((list) => (result.autoHidden ? list.filter((m) => m.id !== id) : list.map((m) => (m.id === id ? { ...m, hasReported: true } : m))));
    setReporting(null);
    showToast('ส่งรายงานให้ทีมงานแล้ว ขอบคุณที่ช่วยกันดูแล');
  };

  const saveEdit = async () => {
    if (!editing?.caption.trim()) return;
    setIsBusy(true);
    const result = await call(`/api/moments/${encodeURIComponent(editing.id)}`, 'PATCH', { caption: editing.caption.trim() });
    setIsBusy(false);
    if (!result.ok || !result.moment) return showToast(result.message);
    replace(result.moment);
    setEditing(null);
    showToast('แก้ไขข้อความแล้ว');
  };

  const showNew = () => {
    reload('all');
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">โมเมนต์จากเพื่อนๆ</h2>
        {PERSONAL[sort] ? (
          <button
            type="button"
            onClick={() => setSort('all')}
            className="shrink-0 h-8 pl-3 pr-2 rounded-full bg-[#FFF1F2] text-[#F43F5E] text-[13px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            aria-label={`${PERSONAL[sort]} กลับไปดูทั้งหมด`}
          >
            {PERSONAL[sort]}
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
        <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="เลือกโมเมนต์">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`h-8 px-3 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                sort === value ? 'bg-[#FFF1F2] text-[#F43F5E]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
          {/* Saved and own moments: on wide screens the left column has them as shortcuts too */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsViewMenuOpen((open) => !open)}
              aria-label="โมเมนต์ที่บันทึก และโมเมนต์ของฉัน"
              aria-expanded={isViewMenuOpen}
              className="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {isViewMenuOpen && (
              <>
                <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setIsViewMenuOpen(false)} />
                <ul className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  {(['saved', 'mine'] as const).map((value) => (
                    <li key={value}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewMenuOpen(false);
                          setSort(value);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {value === 'saved' ? <Bookmark className="w-4 h-4" aria-hidden="true" /> : <Camera className="w-4 h-4" aria-hidden="true" />}
                        {PERSONAL[value]}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      {/* The row of circles only shows once someone has a story; a lone "+" read as an empty room */}
      <div className="mt-3 empty:hidden">
        <StoriesRail isLoggedIn onToast={showToast} size="sm" hideWhenEmpty addSignal={storySignal} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="flex-1 min-w-0 flex items-center gap-3 rounded-full border border-slate-200 py-2 pl-2 pr-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Avatar name={name} src={avatar} className="w-9 h-9 text-sm" />
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-500">วันนี้ไปไหนมา แชร์โมเมนต์ให้เพื่อนๆ ดูหน่อย</span>
          <Camera className="w-5 h-5 text-[#F43F5E] shrink-0" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setStorySignal((n) => n + 1)}
          aria-label="เพิ่มสตอรี่ รูปเดียว แสดง 24 ชั่วโมง"
          className="shrink-0 h-[54px] flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 text-[13px] font-medium text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          สตอรี่
        </button>
      </div>

      {/* The live line opens the feed: what friends are doing now, right before their moments */}
      {top && <div className="mt-5">{top}</div>}

      {newCount > 0 && (
        <div className="sticky top-20 z-10 flex justify-center h-0 overflow-visible">
          <button
            type="button"
            onClick={showNew}
            className="mt-2 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#F43F5E] text-white text-[13px] font-bold shadow-lg cursor-pointer motion-safe:animate-slide-in"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
            โมเมนต์ใหม่ {newCount} รายการ
          </button>
        </div>
      )}

      {loadedView !== sort ? (
        <div className="space-y-6 pt-5" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-4 w-40 rounded bg-slate-100" />
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : moments.length === 0 ? (
        <>
          <p className="py-10 text-center text-sm font-medium text-slate-500">{EMPTY[sort]}</p>
          {/* What would follow the first post still shows on an empty feed */}
          {inserts[0]}
        </>
      ) : (
        <>
          {moments.map((moment, i) => (
            <React.Fragment key={moment.id}>
              <MomentPost moment={moment} handlers={handlers} myAvatar={avatar} myName={name} />
              {inserts[i]}
            </React.Fragment>
          ))}
          <div ref={sentinelRef} aria-hidden="true" />
          {isLoadingMore && (
            <div className="py-6 flex justify-center" role="status" aria-label="กำลังโหลดโมเมนต์">
              <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
            </div>
          )}
          {!hasMore && moments.length > PAGE_SIZE && <p className="py-8 text-center text-[13px] font-medium text-slate-400">ดูครบทุกโมเมนต์แล้ว</p>}
        </>
      )}

      {isComposerOpen && (
        <MomentComposer
          initial={composerInitial}
          onClose={() => {
            setIsComposerOpen(false);
            setComposerInitial(null);
          }}
          onToast={showToast}
          onPosted={(moment, countedQuest) => {
            setMoments((list) => [moment as unknown as FeedItem, ...list.filter((m) => m.id !== moment.id)]);
            setIsComposerOpen(false);
            setComposerInitial(null);
            if (countedQuest) setCounted(countedQuest);
            else showToast('แชร์โมเมนต์แล้ว');
            onPosted?.();
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
      {counted && <CountedQuestNotice counted={counted} onClose={() => setCounted(null)} />}
      {viewer && <PhotoViewer images={viewer.images} start={viewer.index} onClose={() => setViewer(null)} />}

      {confirmDelete && (
        <DialogShell onClose={() => setConfirmDelete(null)} title="ลบโมเมนต์นี้ไหม" subtitle="รูป ข้อความ และความคิดเห็นของโพสต์นี้จะหายไป และกู้คืนไม่ได้" size="sm">
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setConfirmDelete(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.danger} disabled={isBusy} onClick={() => deletePost(confirmDelete)}>
              {isBusy ? 'กำลังลบ…' : 'ลบโมเมนต์'}
            </button>
          </div>
        </DialogShell>
      )}

      {reporting && (
        <DialogShell onClose={() => setReporting(null)} title="รายงานโพสต์นี้" subtitle="ทีมงานจะตรวจสอบ เจ้าของจะไม่รู้ว่าใครรายงาน" size="sm">
          <fieldset className="space-y-2 mb-5">
            <legend className="sr-only">เหตุผล</legend>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-sm font-semibold ${
                  reporting.reason === reason ? 'border-[#2563EB] bg-blue-50/60 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="home-report-reason" value={reason} checked={reporting.reason === reason} onChange={() => setReporting({ ...reporting, reason })} className="accent-[#2563EB]" />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setReporting(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!reporting.reason || isBusy} onClick={sendReport}>
              {isBusy ? 'กำลังส่ง…' : 'ส่งรายงาน'}
            </button>
          </div>
        </DialogShell>
      )}

      {editing && (
        <DialogShell onClose={() => setEditing(null)} title="แก้ไขข้อความ" size="sm">
          <label htmlFor="home-edit-caption" className="sr-only">ข้อความของโมเมนต์</label>
          <textarea
            id="home-edit-caption"
            rows={4}
            maxLength={500}
            value={editing.caption}
            onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed mb-5"
          />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setEditing(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!editing.caption.trim() || isBusy} onClick={saveEdit}>
              {isBusy ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </DialogShell>
      )}

      {toast && (
        <div role="status" className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}
