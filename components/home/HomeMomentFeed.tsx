'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CommentThread, MomentAvatar, ReplyingTo, type ThreadComment } from '@/components/moments/CommentThread';
import Link from 'next/link';
import { TaggedFriends } from '@/components/moments/TaggedFriends';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUp, Bookmark, Camera, Clock, ChevronLeft, ChevronRight, Flag, Heart, Image as ImageIcon, Link2, MessageCircle, MoreHorizontal, Pencil, Send, Trash2, Video, X } from 'lucide-react';
import type { FeedItem } from '@/lib/moments/service';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { MomentPhotos } from '@/components/moments/MomentPhotos';
import { saveFeedReturn, takeShowcase } from '@/components/moments/momentsReturn';
import { CaptionText } from '@/components/moments/CaptionText';
import { threadPeople, useMentionPicker } from '@/components/moments/MentionPicker';
import { MomentComposer, CountedQuestNotice, PostOptionFields, type CountedQuest, type MomentComposerInitial, type PostOptions } from '@/components/moments/MomentComposer';
import { liveHref } from '@/components/home/LiveActivity';
import { MOMENT_TARGETS } from '@/components/moments/momentTargets';
import { Toast } from '@/components/Toast';
import { EditPhotosRow, postRatio, type EditablePhoto } from '@/components/moments/EditPhotosRow';
import { uploadPicture } from '@/components/moments/publishMoment';
import { recall, remember } from '@/lib/clientMemory';
import { flushSeen, watchSeen } from '@/lib/moments/seenTracker';
import { targetLiveText } from '@/components/moments/targetLiveText';
import { inviteViaLine } from '@/components/moments/lineInvite';
import { AchievementLine } from '@/components/moments/AchievementLine';
import { AchievementsRow } from '@/components/home/AchievementsRow';
import { useClamped } from '@/components/moments/useClamped';
import type { HomeFeedStart } from '@/lib/homeData';
import { HOME_FEED_PAGE_SIZE } from '@/lib/moments/types';
import { ShareSheet } from '@/components/moments/ShareSheet';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { optimizedImage } from '@/lib/optimizedImage';
import type { Mention } from '@/lib/moments/mentions';
import { HOME_FEED_LOAD_AHEAD_PX } from '@/lib/social/socialRules';

const PAGE_SIZE = HOME_FEED_PAGE_SIZE;
const NEW_CHECK_MS = 60_000;
/** A longer caption folds to two lines, so the reactions stay near the photo */
export const REPORT_REASONS = ['ชวนลงทุน ขายของ หรือขายประกัน', 'หลอกลวงหรือขอข้อมูลส่วนตัว', 'เนื้อหาไม่เหมาะสม', 'คุกคามหรือพูดจาไม่ดี', 'อื่นๆ'];

// Where the moment came from, in its pillar's colors, and what the reader can do there
const TARGETS = MOMENT_TARGETS;

/** The three tabs, plus personal views opened from the shortcuts or the ⋯ next to the tabs (FEED_PLAN step 1: สำหรับคุณ comes first) */
export type FeedView = 'foryou' | 'all' | 'following' | 'popular' | 'saved' | 'mine';
const TABS: [FeedView, string][] = [
  ['foryou', 'สำหรับคุณ'],
  ['following', 'ติดตาม'],
  ['popular', 'ยอดฮิต'],
];
const PERSONAL: Partial<Record<FeedView, string>> = { all: 'โมเมนต์ล่าสุด', saved: 'โมเมนต์ที่บันทึก', mine: 'โมเมนต์ของฉัน' };
const EMPTY: Record<FeedView, string> = {
  foryou: 'ยังไม่มีโมเมนต์ ออกไปเที่ยวแล้วมาเล่าให้เพื่อนๆ ฟังกัน',
  all: 'ยังไม่มีโมเมนต์ ออกไปเที่ยวแล้วมาเล่าให้เพื่อนๆ ฟังกัน',
  following: 'ยังไม่ได้ติดตามใครเลย ติดตามเพื่อนที่ชอบออกไปไหนมาไหน แล้วโมเมนต์ของเขาจะมาอยู่ตรงนี้',
  popular: 'ยังไม่มีโมเมนต์ยอดฮิต',
  saved: 'ยังไม่ได้บันทึกโมเมนต์ไหน กดรูปที่คั่นหนังสือใต้โพสต์ที่ชอบ แล้วจะมาอยู่ตรงนี้',
  mine: 'ยังไม่มีโมเมนต์ของคุณ แชร์โมเมนต์แรกได้จากช่องด้านบน',
};
type Action = 'like' | 'unlike' | 'save' | 'unsave';

export const MOMENT_REACTED_EVENT = 'cch:moment-reacted';

export async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; message: string; moment?: FeedItem; autoHidden?: boolean; planId?: string }> {
  try {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => null);
    const ok = res.ok && json?.success !== false;
    // The journey band's moments path (JourneyBand) moves on at the first like or comment
    const action = (body as { action?: string } | undefined)?.action;
    if (ok && (action === 'like' || action === 'comment')) window.dispatchEvent(new Event(MOMENT_REACTED_EVENT));
    return { ok, message: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', moment: json?.moment, autoHidden: json?.autoHidden, planId: json?.planId };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

const Avatar = MomentAvatar;

interface PostHandlers {
  onToggle: (id: string, action: Action) => void;
  /** Shows the comment at once, then the server's copy; false (and the comment gone again) when it could not be sent */
  onComment: (id: string, text: string, parentId?: string, mentions?: Mention[]) => Promise<boolean>;
  onCommentAct: (id: string, body: { action: 'like_comment' | 'unlike_comment' | 'delete_comment'; commentId: string }) => Promise<boolean>;
  onMenu: (moment: FeedItem, choice: 'edit' | 'delete' | 'report' | 'copy' | 'share' | 'card' | 'send') => void;
  onPhotos: (images: string[], index: number) => void;
  /** A clip is opening on its own page: keep the list and the place in it for the way back */
  onLeaveToClip: (id: string) => void;
  /** A feed post comes with only its newest comment: the rest load when they are opened */
  onLoadComments: (id: string) => Promise<void>;
  /** Follow the author straight from the post, like IG; every post by them updates */
  onFollow: (authorId: string) => Promise<boolean>;
}

function MomentPost({ moment, handlers, myAvatar, myName }: { moment: FeedItem; handlers: PostHandlers; myAvatar?: string; myName: string }) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWholeCaption, setShowWholeCaption] = useState(false);
  // "ติดตาม" sits by the name only for people not followed yet; the post tapped keeps a quiet "กำลังติดตาม" as the answer
  const [justFollowed, setJustFollowed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const showFollow = Boolean(moment.authorId) && !moment.isMine && !moment.isSample && (!moment.isFollowingAuthor || justFollowed);
  // Answers at once, like IG; goes back with a message if the server says no
  const follow = async () => {
    if (!moment.authorId || isFollowing) return;
    setIsFollowing(true);
    setJustFollowed(true);
    if (!(await handlers.onFollow(moment.authorId))) setJustFollowed(false);
    setIsFollowing(false);
  };
  // Two lines until opened; "ดูเพิ่มเติม" only when the two lines really cut the caption off
  const [captionRef, captionCut] = useClamped<HTMLParagraphElement>(!showWholeCaption);
  const target = moment.targetType && moment.targetType !== 'general' && moment.targetId ? TARGETS[moment.targetType as keyof typeof TARGETS] : undefined;
  const live = targetLiveText(moment.live);
  // Gone once the reader takes back their own like and the friend was the only one counted
  const friendLike = !moment.likesOff && moment.likesCount > 0 ? moment.likedByFriend : undefined;
  const shownComments = showComments ? moment.comments : moment.comments.filter((comment) => !comment.parentId).slice(-1);
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null);
  const commentBox = useRef<HTMLInputElement>(null);
  const mention = useMentionPicker({ value: draft, setValue: setDraft, fieldRef: commentBox, extra: threadPeople(moment) });
  const answer = (comment: ThreadComment) => {
    setReplyTo(comment);
    setShowComments(true);
    requestAnimationFrame(() => commentBox.current?.focus());
  };
  const missingComments = showComments && moment.comments.length < moment.commentsCount;
  const { onLoadComments } = handlers;
  useEffect(() => {
    if (missingComments) void onLoadComments(moment.id);
    // once each time the comments open; `handlers` is new on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingComments, moment.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    // The box clears and the comment shows at once; if it cannot be sent, the words come back to the box
    const text = draft.trim();
    const parent = replyTo;
    const people = mention.mentions;
    setIsSending(true);
    setDraft('');
    mention.reset();
    setReplyTo(null);
    if (!(await handlers.onComment(moment.id, text, parent?.id, people))) {
      setDraft(text);
      setReplyTo(parent);
    }
    setIsSending(false);
  };

  // A closed post keeps its link for the author only
  const mayShare = !moment.sharesOff || moment.isMine;
  const menuItems = moment.isMine
    ? ([
        ['edit', 'แก้ไขโพสต์', Pencil],
        ['copy', 'คัดลอกลิงก์', Link2],
        ['delete', 'ลบโมเมนต์', Trash2],
      ] as const)
    : ([
        ...(mayShare ? ([['copy', 'คัดลอกลิงก์', Link2]] as const) : []),
        ['report', moment.hasReported ? 'รายงานแล้ว' : 'รายงานโพสต์นี้', Flag],
      ] as const);

  // Seen posts sink in สำหรับคุณ; own posts need no note
  const articleRef = useRef<HTMLElement>(null);
  useEffect(() => (articleRef.current && !moment.isMine ? watchSeen(articleRef.current) : undefined), [moment.isMine]);

  return (
    <article ref={articleRef} data-seen-id={moment.id} id={`moment-${moment.id}`} className="py-5 border-b border-slate-200 space-y-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {moment.authorId ? (
          <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} aria-label={`โปรไฟล์ของ ${moment.userName}`} className="shrink-0">
            <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
          </Link>
        ) : (
          <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 min-w-0 text-sm">
            <span className="font-semibold text-slate-900 truncate">{moment.userName}</span>
          </p>
          <TaggedFriends people={moment.tagged} className="text-xs text-slate-700" />
          <p className="text-xs text-slate-500 truncate">
            {moment.timeAgo}
            {moment.location && ` · ${moment.location}`}
          </p>
        </div>
        {/* Follow sits by the ... menu, away from the name and photo, so a tap meant for the profile never follows (owner 2026-11-09) */}
        {showFollow &&
          (justFollowed ? (
            <span className="shrink-0 text-sm text-slate-500">กำลังติดตาม</span>
          ) : (
            <button
              type="button"
              onClick={follow}
              disabled={isFollowing}
              aria-label={`ติดตาม ${moment.userName}`}
              className="shrink-0 h-9 px-2 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline disabled:opacity-60 cursor-pointer"
            >
              ติดตาม
            </button>
          ))}
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

      {moment.images.length > 0 && <MomentPhotos images={moment.images} video={moment.video} ratio={moment.imageRatio} alt={moment.caption || moment.location} onOpen={(index) => {
        if (!moment.video) return handlers.onPhotos(moment.images, index);
        handlers.onLeaveToClip(moment.id);
        router.push(`/moments/${encodeURIComponent(moment.id)}?full=1`);
      }} onDoubleTap={moment.likesOff ? undefined : () => !moment.isLiked && handlers.onToggle(moment.id, 'like')} />}

      {/*
        Reactions sit right under the photo, like IG (owner 2026-11-10); the words, the challenge and the place follow.
        Design 1 (owner 2026-11-10): the usual icons stay quiet, "ชวนไป" is the one action with a shape.
      */}
      <div className="-my-1.5 flex items-center gap-1 text-[13px] font-semibold text-slate-800">
        {!moment.likesOff && (
        <button
          type="button"
          onClick={() => handlers.onToggle(moment.id, moment.isLiked ? 'unlike' : 'like')}
          aria-pressed={moment.isLiked}
          aria-label={moment.isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'}
          className={`inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 cursor-pointer hover:text-[#F43F5E] ${moment.isLiked ? 'text-[#E11D48]' : ''}`}
        >
          <Heart className={`w-5 h-5 ${moment.isLiked ? 'fill-current' : ''}`} aria-hidden="true" />
          {moment.likesCount > 0 && !friendLike && <span className="tabular-nums">{moment.likesCount.toLocaleString()}</span>}
        </button>
        )}
        {!moment.commentsOff && (
        <button
          type="button"
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          aria-label="ความคิดเห็น"
          className={`inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 cursor-pointer hover:text-slate-800 ${showComments ? 'text-slate-900' : ''}`}
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          {moment.commentsCount > 0 && <span className="tabular-nums">{moment.commentsCount.toLocaleString()}</span>}
        </button>
        )}
        {mayShare && (
        <button type="button" onClick={() => handlers.onMenu(moment, 'send')} aria-label="ชวนเพื่อนไปด้วยกัน หรือแชร์" className="group inline-flex items-center min-h-11 ml-1 cursor-pointer">
          <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-800 font-semibold transition-colors">
            <Send className="w-[18px] h-[18px] -rotate-12" aria-hidden="true" />
            ชวนไป
          </span>
        </button>
        )}
        <button
          type="button"
          onClick={() => handlers.onToggle(moment.id, moment.isSaved ? 'unsave' : 'save')}
          aria-pressed={moment.isSaved}
          aria-label={moment.isSaved ? 'เลิกบันทึก' : 'บันทึก'}
          className={`inline-flex items-center justify-center min-h-11 min-w-11 ml-auto cursor-pointer hover:text-slate-900 ${moment.isSaved ? 'text-slate-900' : ''}`}
        >
          <Bookmark className={`w-5 h-5 ${moment.isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {/* A friend in the likes says more than a number (social proof, 2026-11-09): only someone the reader follows */}
      {friendLike && (
        <p className="-mt-1 text-[13px] text-slate-600">
          ถูกใจโดย{" "}
          <Link href={`/profile?id=${encodeURIComponent(friendLike.id)}`} className="font-semibold text-slate-900 hover:underline underline-offset-4">
            {friendLike.name}
          </Link>
          {moment.likesCount > 1 && <> และอีก <span className="tabular-nums">{(moment.likesCount - 1).toLocaleString()}</span> คน</>}
        </p>
      )}

      {moment.caption && (
        <div>
          <p ref={captionRef} className={`text-sm leading-relaxed text-slate-800 whitespace-pre-line break-words ${showWholeCaption ? '' : 'line-clamp-2'}`}>
            <strong className="font-semibold text-slate-900">{moment.userName}</strong> <CaptionText text={moment.caption} mentions={moment.tagged} />
          </p>
          {!showWholeCaption && captionCut && (
            <button type="button" onClick={() => setShowWholeCaption(true)} className="inline-flex items-center min-h-11 -my-3 text-[13px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
              ดูเพิ่มเติม
            </button>
          )}
        </div>
      )}

      {moment.achievement && <AchievementLine achievement={moment.achievement} />}

      {/* Where it was, in one slim line (owner 2026-10-29): the place, then what to do there */}
      {target && (
        <Link
          href={liveHref({ type: moment.targetType as keyof typeof TARGETS, id: moment.targetId, title: moment.targetTitle ?? '' })}
          className="group flex items-center gap-1.5 min-w-0 text-[13px] font-semibold"
        >
          <target.Icon className={`w-4 h-4 shrink-0 ${target.icon}`} aria-hidden="true" />
          <span className="min-w-0 truncate text-slate-800 group-hover:underline underline-offset-4">{moment.targetTitle || moment.location}</span>
          {/* What it still offers (FEED_PLAN: the feed takes people out): the day and seats left, XP, open now */}
          {live && <span className={`shrink-0 whitespace-nowrap ${live.status === 'เปิดอยู่' ? 'text-[#2D5A3C]' : 'text-slate-500'}`}>· {live.status}</span>}
          <span className={`shrink-0 inline-flex items-center gap-1 whitespace-nowrap ${target.ink}`}>· {live?.go ?? target.go}<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
        </Link>
      )}

      {shownComments.length > 0 && (
        <CommentThread momentId={moment.id} comments={shownComments} isLoggedIn onNeedLogin={() => undefined} onAct={(body) => handlers.onCommentAct(moment.id, body)} onReply={answer} />
      )}
      {!showComments && moment.commentsCount > 1 && (
        <button type="button" onClick={() => setShowComments(true)} className="inline-flex items-center min-h-11 -my-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
          ดูความคิดเห็นทั้งหมด {moment.commentsCount} รายการ
        </button>
      )}
      {showComments && !moment.commentsOff && replyTo && <ReplyingTo name={replyTo.userName} onCancel={() => setReplyTo(null)} />}
      {showComments && !moment.commentsOff && (
        <form onSubmit={send} className="flex items-center gap-2">
          <Avatar name={myName} src={myAvatar} className="w-7 h-7 text-[11px]" />
          <label htmlFor={`comment-${moment.id}`} className="sr-only">เขียนความคิดเห็น</label>
          <input
            ref={commentBox}
            id={`comment-${moment.id}`}
            value={draft}
            maxLength={300}
            {...mention.fieldProps}
            placeholder="เขียนความคิดเห็น…"
            className="flex-1 min-w-0 h-11 sm:h-9 rounded-full bg-slate-50 border border-slate-200 px-3.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
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
      {showComments && !moment.commentsOff && mention.list}
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
      className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
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
      <img src={optimizedImage(images[index], 1080)} alt={`รูปที่ ${index + 1}`} className="max-w-full max-h-[90dvh] object-contain" onClick={(e) => e.stopPropagation()} />
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
  /** The first page of สำหรับคุณ and the achievements row, rendered with the page (app/page.tsx): no placeholders and no second request on arrival */
  start?: HomeFeedStart;
  avatar?: string;
  name: string;
  /** Shown under the "share a moment" box, before the posts, e.g. the live ticker */
  top?: React.ReactNode;
  /** Which moments to show; the left column's shortcuts change it too */
  view: FeedView;
  onViewChange: (view: FeedView) => void;
  /** Rendered after a given post (0 = the first). Each insert sets its own screen sizes */
  inserts?: Record<number, React.ReactNode>;
  /** Inserts up to this index that a short feed never reaches go at its end, once every post has loaded */
  tailUpTo?: number;
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
type SuggestedMember = { id: string; displayName: string; avatarUrl?: string; momentCount: number };

/**
 * An empty ติดตาม tab offers people worth following (GET /api/members/suggested: trusted members who post), so the
 * tab is a start, not a dead end. Following one or more brings their posts in with one tap.
 */
function SuggestedToFollow({ onFollow, onSeePosts }: { onFollow: (id: string) => Promise<boolean>; onSeePosts: () => void }) {
  const [people, setPeople] = useState<SuggestedMember[] | null>(null);
  const [followed, setFollowed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/members/suggested', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setPeople(Array.isArray(json?.members) ? json.members : []))
      .catch(() => setPeople([]));
  }, []);
  if (!people?.length) return null;
  const follow = async (id: string) => {
    setBusy(id);
    if (await onFollow(id)) setFollowed((list) => [...list, id]);
    setBusy(null);
  };
  return (
    <section aria-labelledby="suggested-heading" className="border-t border-slate-200 pt-5">
      <h3 id="suggested-heading" className="text-base font-bold text-slate-900">คนที่น่าติดตาม</h3>
      <ul className="mt-2 divide-y divide-slate-100">
        {people.map((person) => (
          <li key={person.id} className="flex items-center gap-3 py-3">
            <Link href={`/profile?id=${encodeURIComponent(person.id)}`} className="flex items-center gap-3 min-w-0 flex-1 group">
              <Avatar name={person.displayName} src={person.avatarUrl} className="w-11 h-11 text-sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 group-hover:underline underline-offset-4">{person.displayName}</span>
                <span className="block text-xs text-slate-500">{person.momentCount.toLocaleString()} โมเมนต์</span>
              </span>
            </Link>
            {followed.includes(person.id) ? (
              <span className="shrink-0 text-sm font-semibold text-slate-500">กำลังติดตาม</span>
            ) : (
              <button
                type="button"
                onClick={() => void follow(person.id)}
                disabled={busy === person.id}
                className="shrink-0 h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold whitespace-nowrap disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {busy === person.id ? 'กำลังติดตาม…' : 'ติดตาม'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {followed.length > 0 && (
        <button type="button" onClick={onSeePosts} className="mt-3 w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap cursor-pointer">
          ดูโมเมนต์ของคนที่ติดตาม
        </button>
      )}
    </section>
  );
}

function shareInitial(type: string, id: string, title: string, location: string, withFriend?: { id: string; name: string }): MomentComposerInitial {
  const targetType = type === 'spot' || type === 'fair' ? type : 'community';
  // A "ไปกัน" plan's day-after link may name a place with no page ('general:'): the words only, with the friend tagged
  const isPlace = type !== 'general';
  return {
    target: isPlace && id && title ? { type: targetType, id, title, location } : undefined,
    location,
    caption: title ? (isPlace && targetType === 'community' ? `แชร์ความประทับใจจากตี้ "${title}"\n` : `ไปมาแล้ว "${title}"\n`) : undefined,
    ...(withFriend ? { tagged: [{ ...withFriend, avatar: '' }] } : {}),
  };
}

/**
 * The middle of the member home: every moment, newest or most liked, loading more as the member scrolls.
 * Posting, comments, likes, saves, editing, deleting and reporting all happen here; /moments is the
 * photo showcase for browsing (no posting there).
 */
export function HomeMomentFeed({ avatar, name, top, view: sort, onViewChange: setSort, inserts: feedInserts = {}, tailUpTo = -1, shareRequest, onPosted, start }: HomeMomentFeedProps) {
  // Cards between the posts belong to the first tab only (ล่าสุด until 2026-11-09, now สำหรับคุณ) (owner 2026-11-02): a chosen view shows just what was asked for
  const inserts = sort === 'foryou' ? feedInserts : {};
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  // Back on Home, the first page seen last time shows at once while it refreshes
  // The server's first page wins (it is fresh); otherwise the one seen last time shows at once while it refreshes
  const serverFirst = start && sort === 'foryou' ? start : undefined;
  // The view whose first page is already here (the server's, or one restored on the way back): no fetch for it
  const fetchedView = useRef<FeedView | null>(serverFirst ? sort : null);
  const [moments, setMoments] = useState<FeedItem[]>(() => (serverFirst ? remember(`home-feed:${sort}`, { items: serverFirst.items, hasNext: serverFirst.hasNext }).items : (recall<{ items: FeedItem[] }>(`home-feed:${sort}`)?.items ?? [])));
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState<string | undefined>(() => (serverFirst ? serverFirst.nextCursor : undefined));
  const [hasMore, setHasMore] = useState(() => (serverFirst ? serverFirst.hasNext : (recall<{ hasNext: boolean }>(`home-feed:${sort}`)?.hasNext ?? false)));
  // The view whose list is on screen; until it matches the chosen view, placeholders show
  const [loadedView, setLoadedView] = useState<FeedView | null>(() => (serverFirst || recall(`home-feed:${sort}`) ? sort : null));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<MomentComposerInitial | null>(null);
  const [counted, setCounted] = useState<CountedQuest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeedItem | null>(null);
  const [reporting, setReporting] = useState<{ moment: FeedItem; reason: string } | null>(null);
  const [editing, setEditing] = useState<({ id: string; caption: string; photos: EditablePhoto[] | null; ratio: number } & PostOptions) | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [sharing, setSharing] = useState<FeedItem | null>(null);
  const [inviting, setInviting] = useState<FeedItem | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // What was looked at goes out when the feed leaves the page (another page in the app is not a page close)
  useEffect(() => flushSeen, []);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Old share links (/moments?createForEvent=…) forward here as /?share=<type>:<id>&title=&location=; the form opens tied to that event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (!share) return;
    const [type, ...rest] = share.split(':');
    const withId = params.get('with');
    setComposerInitial(shareInitial(type, rest.join(':'), params.get('title') ?? '', params.get('location') ?? '', withId ? { id: withId, name: params.get('withName') ?? '' } : undefined));
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

  const fetchPage = useCallback(async (which: FeedView, pageNo: number, after?: string) => {
    const response = await fetch(`/api/moments?tab=${which}&page=${pageNo}&limit=${PAGE_SIZE}${after ? `&cursor=${encodeURIComponent(after)}` : ''}`, { cache: 'no-store' });
    const result = await response.json();
    if (!result?.success || !Array.isArray(result.moments)) throw new Error('moments');
    return { items: result.moments as FeedItem[], hasNext: Boolean(result.pagination?.hasNextPage), nextCursor: result.pagination?.nextCursor as string | undefined };
  }, []);

  const reload = useCallback(
    (which: FeedView) => {
      // The current list stays on screen until the new one arrives
      fetchPage(which, 1)
        .then(({ items, hasNext, nextCursor }) => {
          remember(`home-feed:${which}`, { items, hasNext });
          setMoments(items);
          setHasMore(hasNext);
          setCursor(nextCursor);
          setPage(1);
          setNewCount(0);
        })
        .catch((error) => console.warn('Home moments:', error))
        .finally(() => setLoadedView(which));
    },
    [fetchPage]
  );

  // Back from a clip: the same view, the posts loaded so far and the place in the list, before anything paints
  const restored = useRef(false);
  useLayoutEffect(() => {
    const snapshot = takeShowcase(window.location.pathname);
    if (!snapshot) return;
    restored.current = true;
    fetchedView.current = (snapshot.view as FeedView | undefined) ?? sort;
    const view = (snapshot.view as FeedView | undefined) ?? sort;
    if (view !== sort) setSort(view);
    setMoments(snapshot.moments);
    setPage(snapshot.page);
    setHasMore(snapshot.hasMore);
    setCursor(snapshot.cursor);
    setLoadedView(view);
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: snapshot.scrollY, behavior: 'instant' })));
    // once, on arriving at the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (restored.current) {
      restored.current = false;
      return;
    }
    // The server's page (or the restored list) is this view already: fetch only when the member changes the view
    if (fetchedView.current === sort) return;
    fetchedView.current = sort;
    reload(sort);
  }, [sort, reload]);

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
    fetchPage(sort, page + 1, cursor)
      .then(({ items, hasNext, nextCursor }) => {
        setMoments((prev) => [...prev, ...items.filter((m) => !prev.some((p) => p.id === m.id))]);
        setHasMore(hasNext);
        setCursor(nextCursor);
        setPage(page + 1);
      })
      .catch((error) => console.warn('Home moments:', error))
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, fetchPage, sort, page, cursor]);

  // The next page loads about three posts before the end, so a quick thumb never meets the bottom of the list (or the footer jumping away under it)
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: `${HOME_FEED_LOAD_AHEAD_PX}px` });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, loadedView]);

  // Leaving through any link in the feed (a profile, a place, a tag) keeps the list and the place in it for the way back
  const rememberPlace = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const link = (e.target as HTMLElement).closest('a');
    const href = link?.getAttribute('href');
    if (!href?.startsWith('/') || link?.target === '_blank' || loadedView !== sort) return;
    // The post the link sits in, taken from the loaded list: nothing read off the page goes into storage (CodeQL
    // js/xss-through-dom, 2026-11-10), since what the moment page reads back from there ends up in links and players
    const seenId = (e.target as HTMLElement).closest('article')?.getAttribute('data-seen-id');
    saveReturn(moments.find((m) => m.id === seenId)?.id ?? '');
  };
  const saveReturn = (momentId: string) =>
    saveFeedReturn({ url: window.location.pathname, momentId, moments, page, hasMore, cursor, scrollY: window.scrollY, view: sort });

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
    onComment: async (id, text, parentId, mentions = []) => {
      const pendingId = `pending-${Date.now()}`;
      const pending = {
        id: pendingId, userName: name, userAvatar: avatar ?? '', text, timeAgo: 'เมื่อสักครู่นี้', createdAt: new Date().toISOString(),
        isMine: true, parentId, authorId: null, mentions, likesCount: 0, isLiked: false, canDelete: false,
      } as FeedItem['comments'][number];
      const withPending = (on: boolean) =>
        setMoments((list) =>
          list.map((m) =>
            m.id !== id ? m : on ? { ...m, comments: [...m.comments, pending], commentsCount: m.commentsCount + 1 } : { ...m, comments: m.comments.filter((c) => c.id !== pendingId), commentsCount: m.commentsCount - 1 }
          )
        );
      withPending(true);
      const result = await call(`/api/moments/${encodeURIComponent(id)}/actions`, 'POST', { action: 'comment', text, parentId, mentions: mentions.map((m) => m.id) });
      if (!result.ok || !result.moment) {
        withPending(false);
        showToast(result.message);
        return false;
      }
      replace(result.moment);
      return true;
    },
    onCommentAct: async (id, body) => {
      const result = await call(`/api/moments/${encodeURIComponent(id)}/actions`, 'POST', body);
      if (!result.ok || !result.moment) {
        showToast(result.message);
        return false;
      }
      replace(result.moment);
      return true;
    },
    onMenu: (moment, choice) => {
      // A clip post keeps its cover; only photo posts show the photo row
      if (choice === 'edit') setEditing({ id: moment.id, caption: moment.caption, photos: moment.video ? null : moment.images.map((url) => ({ url })), ratio: postRatio(moment.imageRatio), commentsOff: moment.commentsOff, likesOff: moment.likesOff, sharesOff: moment.sharesOff });
      if (choice === 'delete') setConfirmDelete(moment);
      if (choice === 'report') setReporting({ moment, reason: '' });
      // A 9:16 picture for an IG Story or LINE, like Strava (FEED_PLAN step 3.5)
      // The share button opens the send sheet: invite friends, the link, the card
      if (choice === 'send') setSharing(moment);
      if (choice === 'card') {
        showToast('กำลังทำการ์ดแชร์…');
        void import('@/components/moments/shareCard')
          .then(({ shareCard }) => shareCard(moment))
          .then((done) => done !== 'cancelled' && showToast(done === 'saved' ? 'บันทึกการ์ดแชร์ลงเครื่องแล้ว' : 'แชร์การ์ดแล้ว'))
          .catch(() => showToast('ทำการ์ดแชร์ไม่สำเร็จ ลองอีกครั้งนะ'));
      }
      if (choice === 'copy' || choice === 'share') {
        const url = `${window.location.origin}/moments/${encodeURIComponent(moment.id)}`;
        // The phone's own share sheet where there is one; otherwise the link is copied
        const copy = () => {
          if (!navigator.clipboard) return showToast(url);
          navigator.clipboard.writeText(url).then(
            () => showToast('คัดลอกลิงก์โมเมนต์แล้ว'),
            () => showToast(url)
          );
        };
        if (choice === 'share' && navigator.share) {
          navigator.share({ title: 'โมเมนต์', url }).catch((err: DOMException) => {
            if (err.name !== 'AbortError') copy();
          });
          return;
        }
        copy();
      }
    },
    onPhotos: (images, index) => setViewer({ images, index }),
    onLeaveToClip: (id) => saveFeedReturn({ url: window.location.pathname, momentId: id, moments, page, hasMore, cursor, scrollY: window.scrollY, view: sort }),
    onLoadComments: async (id) => {
      const result = await call(`/api/moments/${encodeURIComponent(id)}`, 'GET');
      if (result.ok && result.moment) replace(result.moment);
      else showToast(result.message);
    },
    onFollow: async (authorId) => {
      const following = (on: boolean) => setMoments((list) => list.map((m) => (m.authorId === authorId ? { ...m, isFollowingAuthor: on } : m)));
      following(true);
      const result = await call(`/api/members/${encodeURIComponent(authorId)}/actions`, 'POST', { action: 'follow' });
      if (!result.ok) {
        following(false);
        showToast(result.message);
        return false;
      }
      return true;
    },
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
    if (!editing) return;
    setIsBusy(true);
    let images: string[] | undefined;
    try {
      // Photos added in this edit upload only now, in their place in the row
      images = editing.photos ? await Promise.all(editing.photos.map((photo) => (photo.added ? uploadPicture(photo.added) : photo.url))) : undefined;
    } catch (error) {
      setIsBusy(false);
      return showToast(error instanceof Error ? error.message : 'อัปโหลดรูปไม่สำเร็จ ลองอีกครั้งนะ');
    }
    const result = await call(`/api/moments/${encodeURIComponent(editing.id)}`, 'PATCH', { caption: editing.caption.trim(), images, commentsOff: editing.commentsOff, likesOff: editing.likesOff, sharesOff: editing.sharesOff });
    setIsBusy(false);
    if (!result.ok || !result.moment) return showToast(result.message);
    replace(result.moment);
    setEditing(null);
    showToast('แก้ไขโพสต์แล้ว');
  };

  const openWithFiles = (e: React.ChangeEvent<HTMLInputElement>, kind: 'photos' | 'clip') => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setComposerInitial(kind === 'photos' ? { photoFiles: files } : { clipFile: files[0] });
    setIsComposerOpen(true);
  };

  const showNew = () => {
    reload('all');
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The inserts from `from` up to `tailUpTo`, one after another (the feed ended before their posts)
  const tailOf = (from: number) =>
    Object.keys(inserts)
      .map(Number)
      .filter((at) => at >= from && at <= Math.max(tailUpTo, 0))
      .sort((x, y) => x - y)
      .map((at) => <React.Fragment key={`tail-${at}`}>{inserts[at]}</React.Fragment>);

  return (
    <div ref={topRef} className="scroll-mt-24" onClickCapture={rememberPlace}>
      {/* The title keeps one line: on phones the tabs go under it */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="shrink-0 whitespace-nowrap text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">โมเมนต์จากเพื่อนๆ</h2>
        {PERSONAL[sort] ? (
          <button
            type="button"
            onClick={() => setSort('foryou')}
            className="shrink-0 h-8 pl-3 pr-2 rounded-full bg-[#FFF1F2] text-[#BE123C] text-[13px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            aria-label={`${PERSONAL[sort]} กลับไปที่สำหรับคุณ`}
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
                sort === value ? 'bg-[#FFF1F2] text-[#BE123C]' : 'text-slate-500 hover:bg-slate-100'
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
              aria-label="โมเมนต์ล่าสุด ที่บันทึก และของฉัน"
              aria-expanded={isViewMenuOpen}
              className="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {isViewMenuOpen && (
              <>
                <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setIsViewMenuOpen(false)} />
                <ul className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  {(['all', 'saved', 'mine'] as const).map((value) => (
                    <li key={value}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewMenuOpen(false);
                          setSort(value);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {value === 'all' ? <Clock className="w-4 h-4" aria-hidden="true" /> : value === 'saved' ? <Bookmark className="w-4 h-4" aria-hidden="true" /> : <Camera className="w-4 h-4" aria-hidden="true" />}
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

      {/* Friends out living, where other apps put stories (owner 2026-11-10); on the main tabs only. Above the posting
          box (owner 2026-11-10): seeing what friends did comes more often than posting */}
      {!PERSONAL[sort] && <AchievementsRow initial={start?.achievements} onOpenMoment={(id) => loadedView === sort && saveReturn(id)} />}

      <div className="mt-3">
        {/* Photos and clips are two ways in (owner 2026-11-02); each button goes straight to the phone's picker */}
        <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1.5">
          <button type="button" onClick={() => setIsComposerOpen(true)} className="flex-1 min-w-0 flex items-center gap-3 rounded-full py-0.5 pl-0.5 pr-2 text-left hover:bg-slate-50 transition-colors cursor-pointer">
            <Avatar name={name} src={avatar} className="w-9 h-9 text-sm" />
            <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-500">
              {/* Short on phones so it never cuts off mid-word */}
              <span className="sm:hidden">วันนี้ไปไหนมา?</span>
              <span className="hidden sm:inline">วันนี้ไปไหนมา แชร์ให้เพื่อนๆ ดูหน่อย</span>
            </span>
          </button>
          <label className="shrink-0 h-9 px-2.5 rounded-full hover:bg-slate-100 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 cursor-pointer focus-within:ring-2 focus-within:ring-[#F43F5E]">
            <ImageIcon className="w-[18px] h-[18px] text-[#F43F5E]" aria-hidden="true" />
            รูป
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => openWithFiles(e, 'photos')} />
          </label>
          <label className="shrink-0 h-9 px-2.5 rounded-full hover:bg-slate-100 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 cursor-pointer focus-within:ring-2 focus-within:ring-[#F43F5E]">
            <Video className="w-[18px] h-[18px] text-slate-700" aria-hidden="true" />
            คลิป
            <input type="file" accept="video/*" className="sr-only" onChange={(e) => openWithFiles(e, 'clip')} />
          </label>
        </div>
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
          {sort === 'following' && <SuggestedToFollow onFollow={handlers.onFollow} onSeePosts={() => reload('following')} />}
          {/* What would follow the first posts still shows on an empty feed */}
          {tailOf(0)}
        </>
      ) : (
        <>
          {moments.map((moment, i) => (
            <React.Fragment key={moment.id}>
              <MomentPost moment={moment} handlers={handlers} myAvatar={avatar} myName={name} />
              {inserts[i]}
            </React.Fragment>
          ))}
          {!hasMore && tailOf(moments.length)}
          <div ref={sentinelRef} aria-hidden="true" />
          {isLoadingMore && (
            <div className="py-6 flex justify-center" role="status" aria-label="กำลังโหลดโมเมนต์">
              <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
            </div>
          )}
          {!hasMore && moments.length > PAGE_SIZE && <p className="py-8 text-center text-[13px] font-medium text-slate-500">ดูครบทุกโมเมนต์แล้ว</p>}
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
            // The progress card says โพสต์แล้ว; the member keeps their place in the feed, like Instagram
            if (countedQuest) setCounted(countedQuest);
            onPosted?.();
          }}
        />
      )}
      {counted && <CountedQuestNotice counted={counted} onClose={() => setCounted(null)} />}
      {viewer && <PhotoViewer images={viewer.images} start={viewer.index} onClose={() => setViewer(null)} />}

      {confirmDelete && (
        <DialogShell onClose={() => setConfirmDelete(null)} title="ลบโมเมนต์นี้ไหม" subtitle="รูป ข้อความ และความคิดเห็นของโพสต์นี้จะหายไป และกู้คืนไม่ได้" size="sm">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" data-autofocus className={dialogButton.quiet} onClick={() => setConfirmDelete(null)}>ยกเลิก</button>
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
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={dialogButton.quiet} onClick={() => setReporting(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!reporting.reason || isBusy} onClick={sendReport}>
              {isBusy ? 'กำลังส่ง…' : 'ส่งรายงาน'}
            </button>
          </div>
        </DialogShell>
      )}

      {editing && (
        <DialogShell onClose={() => setEditing(null)} title="แก้ไขโพสต์" size="sm">
          {editing.photos && (
            <EditPhotosRow photos={editing.photos} ratio={editing.ratio} onChange={(photos) => setEditing({ ...editing, photos })} onError={showToast} />
          )}
          <label htmlFor="home-edit-caption" className="sr-only">ข้อความของโมเมนต์</label>
          <textarea
            id="home-edit-caption"
            rows={4}
            maxLength={500}
            value={editing.caption}
            placeholder="เล่าสั้นๆ ว่าวันนี้เป็นยังไง (ไม่ใส่ก็ได้)"
            onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed mb-3"
          />
          <div className="mb-5">
            <PostOptionFields value={editing} onChange={(options) => setEditing({ ...editing, ...options })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={dialogButton.quiet} onClick={() => setEditing(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={isBusy} onClick={saveEdit}>
              {isBusy ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </DialogShell>
      )}

      {sharing && (
        <ShareSheet
          canInvite
          canCard={Boolean(sharing.images[0])}
          onInvite={() => setInviting(sharing)}
          onLine={() => void inviteViaLine({ type: 'moment', id: sharing.id }, sharing.targetTitle || sharing.location || '').then((ok) => !ok && showToast('ทำลิงก์ชวนไม่สำเร็จ ลองอีกครั้งนะ'))}
          onLink={() => handlers.onMenu(sharing, 'share')}
          onCard={() => handlers.onMenu(sharing, 'card')}
          onClose={() => setSharing(null)}
        />
      )}
      {inviting && (
        <InviteSheet
          target={{ type: 'moment', id: inviting.id }}
          place={inviting.targetTitle || inviting.location}
          onClose={() => setInviting(null)}
          onDone={(message) => {
            setInviting(null);
            showToast(message);
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
