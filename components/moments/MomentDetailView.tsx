'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Bookmark, ChevronDown, ChevronUp, Flag, Heart, MessageCircle, MoreHorizontal, Send, Trash2, UserMinus, X } from 'lucide-react';
import { InviteIcon } from '@/components/icons/InviteIcon';
import { CommentIcon, LikeIcon, SaveIcon } from '@/components/icons/ActionIcons';
import { CommentThread, MomentAvatar, ReplyingTo, type ThreadComment } from '@/components/moments/CommentThread';
import { threadPeople, useMentionPicker } from '@/components/moments/MentionPicker';
import { TaggedFriends } from '@/components/moments/TaggedFriends';
import { LikersDialog } from '@/components/moments/LikersDialog';
import { useMemberSession } from '@/lib/useMemberSession';
import type { FeedItem } from '@/lib/moments/service';
import { DialogShell, dialogButton, lockPageScroll } from '@/components/auth/DialogShell';
import { CaptionText } from '@/components/moments/CaptionText';
import { ClipPlayer } from '@/components/moments/ClipPlayer';
import { AchievementLine } from '@/components/moments/AchievementLine';
import { ShareSheet } from '@/components/moments/ShareSheet';
import { InviteSheet } from '@/components/invites/InviteSheet';
import { InviteBanner } from '@/components/invites/InviteBanner';
import { MomentPhotos } from '@/components/moments/MomentPhotos';
import { PhotoViewer, REPORT_REASONS, call } from '@/components/home/HomeMomentFeed';
import { MomentsChrome, type MomentsChromeContext } from '@/components/moments/MomentsChrome';
import { useClamped } from './useClamped';

import { MOMENT_TARGETS, isMomentTarget, momentTargetHref, momentTitle } from '@/components/moments/momentTargets';
import { targetLiveText } from '@/components/moments/targetLiveText';
import { inviteViaLine } from '@/components/moments/lineInvite';
import { clipsAfter, markReturning, showcaseUrlFor, updateSavedMoment } from '@/components/moments/momentsReturn';

const Avatar = MomentAvatar;

const iconButton =
  'inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors duration-200 tabular-nums focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]';

/** The buttons down the side of a clip */
const railButton =
  'flex min-w-12 min-h-12 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-bold text-white tabular-nums cursor-pointer active:scale-90 transition-transform [text-shadow:0_1px_3px_rgb(0_0_0/0.8)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white';

interface DetailProps {
  initialMoment: FeedItem;
  /** The reader tapped the clip in a feed or grid, so it opens filling the screen */
  openFullScreen?: boolean;
}

/** The Reel (FEED_PLAN step 3): swiping up or down in full screen steps through clips without leaving the page */
interface ReelProps {
  /** The clip after this one, loaded ahead so it starts at once */
  next?: FeedItem;
  hasPrev: boolean;
  step: (by: 1 | -1) => void;
  /** Which way this clip came in, for its slide */
  enteredFrom?: 1 | -1;
  /** The moment first opened: the feed's saved place names it */
  returnId: string;
  /** Leaving full screen goes Back to where the first clip was tapped */
  backOnLeave: boolean;
  /** This clip came from the Reel's line, not from the server page, so it is read whole in the browser */
  fromQueue: boolean;
  onFullChange: (full: boolean) => void;
}

/** A swipe this far (px) and mostly upright steps to the next clip; a wheel or key step waits this long after the last */
const SWIPE_PX = 60;
const STEP_PAUSE_MS = 650;
let lastStepAt = 0;
const REEL_HINT_KEY = 'chillwaa:reel-hint-seen';
/** The swipe hint shows once per device; with storage blocked it simply shows again next time */
function reelHintSeen(seen?: true): boolean {
  try {
    if (seen) localStorage.setItem(REEL_HINT_KEY, '1');
    return Boolean(localStorage.getItem(REEL_HINT_KEY));
  } catch {
    return false;
  }
}

function DetailBody({ initialMoment, openFullScreen = false, reel, isLoggedIn, requireLogin, showToast }: DetailProps & { reel?: ReelProps } & MomentsChromeContext) {
  const router = useRouter();
  const me = useMemberSession().member;
  const myId = me?.id;
  const [moment, setMoment] = useState(initialMoment);
  const [viewer, setViewer] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  // Long threads open on the newest few; every comment is still in the server HTML
  const [showAllComments, setShowAllComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  // "ดูเพิ่มเติม" on a clip: more text below, or a title the two lines really cut off
  const [titleRef, titleCut] = useClamped<HTMLHeadingElement>(!showFullCaption);
  /** Own comment waiting for "ลบเลย": deleting cannot be undone, so it takes a second tap */
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null);
  const commentInput = useRef<HTMLInputElement>(null);
  const mention = useMentionPicker({ value: comment, setValue: setComment, fieldRef: commentInput, extra: threadPeople(moment) });
  const [isFull, setIsFull] = useState(openFullScreen && Boolean(initialMoment.video));
  const openedFull = useRef(reel ? reel.backOnLeave : isFull);
  const returnId = reel?.returnId ?? initialMoment.id;
  const onFullChange = reel?.onFullChange;
  useEffect(() => onFullChange?.(isFull), [isFull, onFullChange]);
  // The cover has the clip's shape: full screen on a computer, a tall clip leaves room, so its words and buttons sit right beside it
  const clipRatio = initialMoment.imageRatio ?? 9 / 16;
  /** Full screen only: the comments open over the clip and it keeps playing */
  const [commentsOpen, setCommentsOpen] = useState(false);
  // The owner can see who sent a heart (owner 2026-11-07); for everyone else the number is just a number
  const [likersOpen, setLikersOpen] = useState(false);
  const canSeeLikers = Boolean(moment.isMine && moment.likesCount > 0);
  const besideClip = isFull && clipRatio <= 0.8 && !commentsOpen;

  // Filling the screen with the buttons kept: the browser's own full screen would hand an iPhone to its plain player
  useEffect(() => {
    if (!isFull) return;
    // The shared, counted lock: a dialog open on top of this page can close in either order (owner 2026-11-09)
    return lockPageScroll();
  }, [isFull]);

  /** Back where the tap came from; otherwise (opened here, or a shared link) to this moment's page */
  const leaveFull = useCallback(() => {
    setCommentsOpen(false);
    if (openedFull.current && window.history.length > 1) router.back();
    else setIsFull(false);
  }, [router]);

  useEffect(() => {
    if (!isFull) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (commentsOpen) setCommentsOpen(false);
      else leaveFull();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFull, commentsOpen, leaveFull]);

  // Ready to type on a computer; on a phone the keyboard would cover the clip, so it waits for a tap on the box
  useEffect(() => {
    if (commentsOpen && window.matchMedia('(min-width: 1024px)').matches) commentInput.current?.focus();
  }, [commentsOpen]);

  // The server page is the same for everyone; the signed-in member's likes, saves and own comments are read here
  useEffect(() => {
    if (!isLoggedIn && !reel?.fromQueue) return;
    let active = true;
    fetch(`/api/moments/${encodeURIComponent(initialMoment.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && json?.moment && setMoment(json.moment))
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // reel.fromQueue is fixed for this clip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, initialMoment.id]);

  // Back to the grid where the reader left it: the link goes to the tab it was opened from, and the browser's Back works the same
  const [savedGrid, setSavedGrid] = useState<string | null>(null);
  const backHref = savedGrid ?? '/moments';
  // Says where it goes: opened from the Home feed (a post, a clip, the achievements row), it goes back there
  const backLabel = savedGrid === '/' ? 'กลับหน้าแรก' : 'โมเมนต์ทั้งหมด';
  useEffect(() => {
    setSavedGrid(showcaseUrlFor(returnId));
    const onBack = () => markReturning(returnId);
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [returnId]);

  // Up and down through the clips: a swipe on a phone, the wheel, the arrow keys or the buttons on a computer
  const canStep = Boolean(reel && isFull && !commentsOpen);
  const stepBy = useCallback(
    (by: 1 | -1) => {
      if (!reel || (by === 1 ? !reel.next : !reel.hasPrev) || Date.now() - lastStepAt < STEP_PAUSE_MS) return;
      lastStepAt = Date.now();
      reel.step(by);
    },
    [reel]
  );
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeProps = canStep
    ? {
        onTouchStart: (e: React.TouchEvent) => {
          // The time bar and an opened caption keep their own drag
          touchStart.current = (e.target as HTMLElement).closest('input, [data-own-scroll]') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
        },
        onTouchEnd: (e: React.TouchEvent) => {
          const from = touchStart.current;
          touchStart.current = null;
          if (!from) return;
          const dx = e.changedTouches[0].clientX - from.x;
          const dy = e.changedTouches[0].clientY - from.y;
          if (Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(dx) * 1.5) stepBy(dy < 0 ? 1 : -1);
        },
        onWheel: (e: React.WheelEvent) => {
          if (Math.abs(e.deltaY) > 25) stepBy(e.deltaY > 0 ? 1 : -1);
        },
      }
    : {};
  useEffect(() => {
    if (!canStep) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowDown') stepBy(1);
      if (e.key === 'ArrowUp') stepBy(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canStep, stepBy]);
  // Once per device, a phone is told it can swipe on
  const [showHint, setShowHint] = useState(false);
  const hasNext = Boolean(reel?.next);
  useEffect(() => {
    if (!canStep || !hasNext || reelHintSeen()) return;
    // A moment after the clip starts, then gone by itself
    const show = setTimeout(() => {
      reelHintSeen(true);
      setShowHint(true);
    }, 600);
    const hide = setTimeout(() => setShowHint(false), 3200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [canStep, hasNext]);

  // Hearts, saves and comments given here show on the card when the reader goes back
  useEffect(() => {
    updateSavedMoment(moment.id, { isLiked: moment.isLiked, likesCount: moment.likesCount, commentsCount: moment.commentsCount, isSaved: moment.isSaved });
  }, [moment.id, moment.isLiked, moment.likesCount, moment.commentsCount, moment.isSaved]);

  const url = `/api/moments/${encodeURIComponent(moment.id)}`;
  const title = momentTitle(moment.caption);
  // A closed post keeps its link for the author only
  const mayShare = !moment.sharesOff || moment.isMine;
  const rest = moment.caption.slice(moment.caption.indexOf(title) + title.length).trim();
  const target = isMomentTarget(moment.targetType) ? MOMENT_TARGETS[moment.targetType] : null;
  const targetHref = momentTargetHref(moment.targetType, moment.targetId);
  const place = moment.targetTitle || moment.location;
  const live = targetLiveText(moment.live ?? initialMoment.live);
  /** Comments before the newest three, folded until the reader opens them */
  // The newest three threads show first
  const hiddenComments = Math.max(0, moment.comments.filter((c) => !c.parentId).length - 3);

  // "ติดตาม" by the name for someone not followed yet, like the feed (owner 2026-11-08); after the tap it reads "กำลังติดตาม"
  const [justFollowed, setJustFollowed] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const showFollow = Boolean(moment.authorId) && !moment.isMine && !moment.isSample && (!moment.isFollowingAuthor || justFollowed);
  const follow = async () => {
    if (!isLoggedIn) return requireLogin('เพื่อติดตาม');
    if (!moment.authorId || isFollowBusy) return;
    // Answers at once and goes back with a message if the server says no, like the feed
    setIsFollowBusy(true);
    setJustFollowed(true);
    setMoment((m) => ({ ...m, isFollowingAuthor: true }));
    const result = await call(`/api/members/${encodeURIComponent(moment.authorId)}/actions`, 'POST', { action: 'follow' });
    setIsFollowBusy(false);
    if (result.ok) return;
    setJustFollowed(false);
    setMoment((m) => ({ ...m, isFollowingAuthor: false }));
    showToast(result.message);
  };
  const followLink = (onDark: boolean, place = '') =>
    showFollow &&
    (justFollowed ? (
      <span className={`shrink-0 text-sm ${place} ${onDark ? 'text-white/80' : 'text-slate-500'}`}>กำลังติดตาม</span>
    ) : (
      <button
        type="button"
        onClick={follow}
        disabled={isFollowBusy}
        aria-label={`ติดตาม ${moment.userName}`}
        className={`shrink-0 text-sm ${place} font-semibold pointer-events-auto hover:underline disabled:opacity-60 cursor-pointer ${onDark ? 'text-white' : 'text-[#2563EB] hover:text-[#1D4ED8]'}`}
      >
        ติดตาม
      </button>
    ));

  const toggle = (action: 'like' | 'unlike' | 'save' | 'unsave') => {
    if (!isLoggedIn) return requireLogin();
    const apply = (act: typeof action) => (m: FeedItem) =>
      act === 'like' || act === 'unlike' ? { ...m, isLiked: act === 'like', likesCount: m.likesCount + (act === 'like' ? 1 : -1) } : { ...m, isSaved: act === 'save' };
    const undo = { like: 'unlike', unlike: 'like', save: 'unsave', unsave: 'save' } as const;
    setMoment(apply(action));
    call(`${url}/actions`, 'POST', { action }).then((result) => {
      if (!result.ok) {
        setMoment(apply(undo[action]));
        showToast(result.message);
        return;
      }
      // The post's place or อีเวนต์ is saved to My Hub too (owner 2026-11-12)
      if (action === 'save' && moment.targetTitle && (moment.targetType === 'spot' || moment.targetType === 'fair')) showToast(`เก็บ ${moment.targetTitle} ไว้ในมายฮับด้วย ชวนเพื่อนไปได้เลย`);
    });
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text || isBusy) return;
    // Shows at once with the box cleared, like the feed; if it cannot be sent the words come back to the box
    const parent = replyTo;
    const people = mention.mentions;
    const pendingId = `pending-${Date.now()}`;
    const pending = {
      id: pendingId, userName: me?.displayName ?? '', userAvatar: me?.avatarUrl ?? '', text, timeAgo: 'เมื่อสักครู่นี้', createdAt: new Date().toISOString(),
      isMine: true, parentId: parent?.id, authorId: null, mentions: people, likesCount: 0, isLiked: false, canDelete: false,
    } as FeedItem['comments'][number];
    setIsBusy(true);
    setMoment((m) => ({ ...m, comments: [...m.comments, pending], commentsCount: m.commentsCount + 1 }));
    setComment('');
    mention.reset();
    setReplyTo(null);
    const result = await call(`${url}/actions`, 'POST', { action: 'comment', text, parentId: parent?.id, mentions: people.map((m) => m.id) });
    setIsBusy(false);
    if (result.ok && result.moment) return setMoment(result.moment);
    setMoment((m) => ({ ...m, comments: m.comments.filter((c) => c.id !== pendingId), commentsCount: m.commentsCount - 1 }));
    setComment(text);
    setReplyTo(parent);
    showToast(result.message);
  };

  const actOnComment = async (body: { action: 'like_comment' | 'unlike_comment' | 'delete_comment'; commentId: string }) => {
    const result = await call(`${url}/actions`, 'POST', body);
    if (!result.ok || !result.moment) {
      showToast(result.message);
      return false;
    }
    setMoment(result.moment);
    return true;
  };
  const answer = (c: ThreadComment) => {
    setReplyTo(c);
    requestAnimationFrame(() => commentInput.current?.focus());
  };

  const share = async () => {
    const link = `${window.location.origin}/moments/${encodeURIComponent(moment.id)}`;
    if (navigator.share) {
      const shared = await navigator.share({ title: title || 'โมเมนต์', url: link }).then(() => true, (err: DOMException) => err.name === 'AbortError');
      if (shared) return;
    }
    if (!navigator.clipboard) return showToast(link);
    navigator.clipboard.writeText(link).then(
      () => showToast('คัดลอกลิงก์แล้ว'),
      () => showToast(link)
    );
  };

  // The share button opens the send sheet (invite friends, LINE, the link), like the feed
  const [sharing, setSharing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const removeMyTag = async () => {
    const result = await call(`${url}/actions`, 'POST', { action: 'untag' });
    if (!result.ok) return showToast(result.message);
    setMoment((m) => ({ ...m, isTaggedMe: false, tagged: m.tagged?.filter((person) => person.id !== myId) }));
    showToast('เอาแท็กของคุณออกแล้ว');
  };

  const deleteMoment = async () => {
    setIsBusy(true);
    const result = await call(url, 'DELETE');
    setIsBusy(false);
    setConfirmDelete(false);
    if (!result.ok) return showToast(result.message);
    updateSavedMoment(moment.id, null);
    markReturning(moment.id);
    router.push(backHref, { scroll: !savedGrid });
  };

  const sendReport = async () => {
    if (!reportReason) return;
    setIsBusy(true);
    const result = await call(`${url}/actions`, 'POST', { action: 'report', reason: reportReason });
    setIsBusy(false);
    if (!result.ok) return showToast(result.message);
    setReportReason(null);
    setMoment((m) => ({ ...m, hasReported: true }));
    showToast('ส่งรายงานให้ทีมงานแล้ว ขอบคุณที่ช่วยกันดูแล');
  };

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 xl:pb-16">
      <Link href={backHref} scroll={!savedGrid} onClick={() => markReturning(moment.id)} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {backLabel}
      </Link>

      {/* Opened from a friend's "ชวนไป": answer in one tap (owner 2026-11-10) */}
      <InviteBanner className="mt-3" isLoggedIn={isLoggedIn} myId={myId} onMessage={showToast} />

      <article className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 items-start">
        {/* A clip fills the screen with everything on it, like a Reel; the place and the comments follow */}
        {moment.video ? (
          <div
            style={{ '--clip-w': `min(100vw, calc(100dvh * ${clipRatio}))` } as React.CSSProperties}
            {...swipeProps}
            className={`overflow-hidden bg-black ${isFull ? `fixed inset-0 z-[60] ${commentsOpen ? 'bottom-[70dvh] lg:bottom-0 lg:right-[400px]' : ''} ${reel?.enteredFrom === 1 ? 'motion-safe:animate-reel-up' : reel?.enteredFrom === -1 ? 'motion-safe:animate-reel-down' : ''}` : 'relative -mx-4 sm:mx-0 sm:rounded-3xl h-[calc(100dvh-14rem)] xl:h-[calc(100dvh-9rem)] min-h-[340px] lg:sticky lg:top-24'}`}
          >
            <ClipPlayer
              url={moment.video.url}
              startS={moment.video.startS}
              durationS={moment.video.durationS}
              poster={moment.images[0]}
              label={title || `คลิปจาก ${place || moment.userName}`}
              onTap={isFull ? undefined : () => setIsFull(true)}
              onDoubleTap={moment.likesOff ? undefined : () => !moment.isLiked && toggle('like')}
              showTime={isFull}
              className="absolute inset-0"
            />
            {/* The next clip loads while this one plays, so a swipe starts it at once */}
            {isFull && reel?.next?.video && (
              <>
                <video src={reel.next.video.url} preload="auto" muted playsInline className="hidden" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element -- warms the next cover */}
                {reel.next.images[0] && <img src={reel.next.images[0]} alt="" className="hidden" />}
              </>
            )}
            {canStep && (
              <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-10 flex-col gap-3">
                <button type="button" onClick={() => stepBy(-1)} disabled={!reel?.hasPrev} aria-label="คลิปก่อนหน้า" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30 disabled:cursor-default cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white">
                  <ChevronUp className="h-6 w-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => stepBy(1)} disabled={!reel?.next} aria-label="คลิปถัดไป" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30 disabled:cursor-default cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white">
                  <ChevronDown className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            )}
            {showHint && (
              <span role="status" className="lg:hidden pointer-events-none absolute left-1/2 top-[38%] z-10 -translate-x-1/2 inline-flex flex-col items-center gap-1 rounded-2xl bg-black/55 px-4 py-3 text-sm font-semibold text-white whitespace-nowrap motion-safe:animate-toast-in">
                <ChevronUp className="h-6 w-6 motion-safe:animate-bounce" aria-hidden="true" />
                ปัดขึ้นดูคลิปถัดไป
              </span>
            )}
            {/* On a phone the clip shrinks above the comments, whole and still playing; a tap on it closes them */}
            {commentsOpen && <button type="button" aria-label="ปิดความคิดเห็น" tabIndex={-1} onClick={() => setCommentsOpen(false)} className="absolute inset-0 z-[5] cursor-default lg:hidden" />}
            {isFull && (
              <button type="button" onClick={leaveFull} aria-label="ออกจากเต็มจอ" className="absolute top-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/60 to-transparent pt-16 pb-4 pl-4 pr-16 sm:pb-6 sm:pl-6 sm:pr-28 text-white pointer-events-none ${commentsOpen ? 'max-lg:hidden' : ''} ${
                besideClip ? 'lg:inset-x-auto lg:bottom-auto lg:top-4 lg:right-[calc(50%+var(--clip-w)/2+0.75rem)] lg:w-[min(20rem,calc(50%-var(--clip-w)/2-5rem))] lg:bg-none lg:p-0' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={moment.userName} src={moment.userAvatar} className="w-9 h-9 text-sm" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    {moment.authorId ? (
                      <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} className="text-sm font-bold truncate hover:underline pointer-events-auto">
                        {moment.userName}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold truncate">{moment.userName}</span>
                    )}
                  </div>
                  <TaggedFriends people={moment.tagged} className="text-xs text-white" />
                  <time dateTime={moment.createdAt} className="block text-xs font-medium text-white/80">
                    {moment.timeAgo}
                  </time>
                </div>
                {/* On a clip, follow ends the author row as an outlined pill, apart from the name (owner 2026-11-09) */}
                {followLink(true, 'ml-auto rounded-full border border-white/70 px-3 py-1')}
              </div>
              <div data-own-scroll={showFullCaption || undefined} className={`mt-2 pointer-events-auto ${showFullCaption ? 'max-h-40 overflow-y-auto' : ''}`}>
                <h1 ref={titleRef} className={title ? `text-sm font-semibold leading-snug break-words ${showFullCaption ? '' : 'line-clamp-2'}` : 'sr-only'}>{title ? <CaptionText text={title} mentions={moment.tagged} linkClassName="underline" /> : `โมเมนต์จาก ${moment.userName}`}</h1>
                {/* The rest stays in the HTML for search engines and shows when the reader asks */}
                {rest && <p className={`mt-1 text-sm font-medium leading-relaxed whitespace-pre-line break-words ${showFullCaption ? '' : 'hidden'}`}><CaptionText text={rest} mentions={moment.tagged} linkClassName="underline" /></p>}
                {(rest || titleCut) && (
                  <button type="button" onClick={() => setShowFullCaption((open) => !open)} className="mt-1 text-xs font-bold text-white/80 hover:text-white cursor-pointer">
                    {showFullCaption ? 'ย่อ' : 'ดูเพิ่มเติม'}
                  </button>
                )}
              </div>
            </div>

            <div className={`absolute right-[max(0.375rem,env(safe-area-inset-right))] sm:right-[max(1.5rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-1 ${commentsOpen ? 'max-lg:hidden' : ''} ${besideClip ? 'lg:right-auto lg:left-[calc(50%+var(--clip-w)/2+0.75rem)]' : ''}`}>
              {!moment.likesOff && (
              <button type="button" onClick={() => toggle(moment.isLiked ? 'unlike' : 'like')} aria-pressed={moment.isLiked} aria-label={moment.isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'} className={railButton}>
                <Heart className={`w-7 h-7 drop-shadow ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
                {!canSeeLikers && moment.likesCount.toLocaleString()}
              </button>
              )}
              {!moment.likesOff && canSeeLikers && (
              <button type="button" onClick={() => setLikersOpen(true)} aria-label={`ดูคนที่ส่งหัวใจ ${moment.likesCount} คน`} className={`${railButton} -mt-2 min-h-8 underline underline-offset-2`}>
                {moment.likesCount.toLocaleString()}
              </button>
              )}
              {!moment.commentsOff && (
              <button
                type="button"
                onClick={() => {
                  if (isFull) setCommentsOpen((open) => !open);
                  else if (isLoggedIn) commentInput.current?.focus();
                  else requireLogin('เพื่อร่วมคอมเมนต์');
                }}
                aria-label="ความคิดเห็น"
                aria-expanded={isFull ? commentsOpen : undefined}
                className={railButton}
              >
                <MessageCircle className="w-7 h-7 drop-shadow" aria-hidden="true" />
                {moment.commentsCount.toLocaleString()}
              </button>
              )}
              {mayShare && (
              <button type="button" onClick={() => setSharing(true)} aria-label="ชวนเพื่อนไปด้วยกัน หรือแชร์" className={railButton}>
                <InviteIcon className="h-6 w-[55px] drop-shadow" mono />
                ชวนไป
              </button>
              )}
              <button type="button" onClick={() => toggle(moment.isSaved ? 'unsave' : 'save')} aria-pressed={moment.isSaved} aria-label={moment.isSaved ? 'เลิกบันทึก' : 'บันทึก'} className={railButton}>
                <Bookmark className={`w-7 h-7 drop-shadow ${moment.isSaved ? 'fill-white' : ''}`} aria-hidden="true" />
              </button>
              {/* Delete or report stay one step away, so they are not pressed by mistake */}
              <div className="relative" onKeyDown={(e) => e.key === 'Escape' && setMoreOpen(false)}>
                <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-label="ตัวเลือกเพิ่มเติม" aria-haspopup="menu" aria-expanded={moreOpen} className={railButton}>
                  <MoreHorizontal className="w-7 h-7 drop-shadow" aria-hidden="true" />
                </button>
                {moreOpen && (
                  <>
                    <button type="button" aria-label="ปิดเมนู" tabIndex={-1} onClick={() => setMoreOpen(false)} className="fixed inset-0 z-10 cursor-default" />
                    <div role="menu" className="absolute right-full bottom-0 z-20 mr-2 w-max rounded-2xl bg-white p-1.5 shadow-lg">
                      {moment.isTaggedMe && (
                        <button type="button" role="menuitem" onClick={() => { setMoreOpen(false); removeMyTag(); }} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-slate-800 hover:bg-slate-100 cursor-pointer">
                          <UserMinus className="w-4 h-4" aria-hidden="true" />
                          เอาแท็กของฉันออก
                        </button>
                      )}
                      {moment.isMine ? (
                        <button type="button" role="menuitem" autoFocus onClick={() => { setMoreOpen(false); setConfirmDelete(true); }} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          ลบโมเมนต์
                        </button>
                      ) : moment.hasReported ? (
                        <p role="menuitem" aria-disabled="true" className="flex min-h-11 items-center gap-2.5 px-3 text-sm font-medium text-slate-500">
                          <Flag className="w-4 h-4" aria-hidden="true" />
                          รายงานแล้ว ทีมงานกำลังดูให้
                        </p>
                      ) : (
                        <button type="button" role="menuitem" autoFocus onClick={() => { setMoreOpen(false); if (isLoggedIn) setReportReason(''); else requireLogin('เพื่อรายงานโพสต์'); }} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-slate-800 hover:bg-slate-100 cursor-pointer">
                          <Flag className="w-4 h-4" aria-hidden="true" />
                          รายงานโพสต์นี้
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // On a computer the photo stays in view while a long comment thread scrolls beside it
          <div className="-mx-4 sm:mx-0 sm:rounded-3xl overflow-hidden lg:sticky lg:top-24">
            <MomentPhotos images={moment.images} ratio={moment.imageRatio} alt={title || `โมเมนต์จาก ${place || moment.userName}`} onOpen={(index) => setViewer(index)} onDoubleTap={moment.likesOff ? undefined : () => !moment.isLiked && toggle('like')} />
          </div>
        )}

        <div className="min-w-0 flex flex-col gap-5">
          {!moment.video && (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    {moment.authorId ? (
                      <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} className="text-sm font-bold text-slate-900 hover:underline truncate">
                        {moment.userName}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-slate-900 truncate">{moment.userName}</span>
                    )}
                  </div>
                  <TaggedFriends people={moment.tagged} className="text-xs text-slate-700" />
                  <time dateTime={moment.createdAt} className="block text-xs font-medium text-slate-500">
                    {moment.timeAgo}
                  </time>
                </div>
                {/* Share and report (or delete your own) sit with the author, away from the reactions */}
                <div className="ml-auto flex items-center gap-0.5 shrink-0">
                  {/* Follow leads the actions on the right, away from the name, so a tap meant for the profile never follows (owner 2026-11-09) */}
                  {followLink(false, 'h-9 px-2 inline-flex items-center')}
                  {moment.isTaggedMe && (
                    <button type="button" onClick={removeMyTag} className={`${iconButton} text-slate-500`}>
                      <UserMinus className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">เอาแท็กออก</span>
                    </button>
                  )}
                  {/* A photo post has "ชวนไป" in its reaction row; a clip has no row, so it keeps this one */}
                  {mayShare && moment.video && (
                  <button type="button" onClick={() => setSharing(true)} aria-label="ชวนเพื่อนไปด้วยกัน หรือแชร์" className={iconButton}>
                    <InviteIcon className="h-[17px] w-[39px] shrink-0" />
                    <span className="sr-only sm:not-sr-only">ชวนไป</span>
                  </button>
                  )}
                  {moment.isMine ? (
                    <button type="button" onClick={() => setConfirmDelete(true)} className={`${iconButton} text-slate-500`}>
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">ลบ</span>
                    </button>
                  ) : (
                    !moment.hasReported && (
                      <button type="button" onClick={() => (isLoggedIn ? setReportReason('') : requireLogin('เพื่อรายงานโพสต์'))} className={`${iconButton} text-slate-500`}>
                        <Flag className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">รายงาน</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className={!title ? 'sr-only' : title.length > LONG_HEADLINE ? 'text-[15px] font-medium text-slate-800 leading-relaxed break-words' : 'text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight break-words'}>{title ? <CaptionText text={title} mentions={moment.tagged} /> : `โมเมนต์จาก ${moment.userName}`}</h1>
                {rest && <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-line break-words"><CaptionText text={rest} mentions={moment.tagged} /></p>}
              </div>
            </>
          )}

          {moment.achievement && <AchievementLine achievement={moment.achievement} />}
          {/*
            Where it is from and the one thing to do next: the same slim line as the feed (owner 2026-11-10), with what
            the place still offers (seats left, open now). A reaction returns the moment without it, so the first copy is kept.
          */}
          {place &&
            (targetHref && target ? (
              <Link href={targetHref} className="group flex items-center gap-1.5 min-w-0 text-[13px] font-semibold">
                <target.Icon className={`w-4 h-4 shrink-0 ${target.icon}`} aria-hidden="true" />
                <span className="min-w-0 truncate text-slate-800 group-hover:underline underline-offset-4">{place}</span>
                {live && <span className={`shrink-0 whitespace-nowrap ${live.status === 'เปิดอยู่' ? 'text-[#2D5A3C]' : 'text-slate-500'}`}>· {live.status}</span>}
                <span className={`shrink-0 inline-flex items-center gap-1 whitespace-nowrap ${target.ink}`}>· {live?.go ?? target.go}<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
              </Link>
            ) : (
              <p className="flex items-center gap-1.5 min-w-0 text-[13px] font-semibold text-slate-800">
                <MOMENT_TARGETS.spot.Icon className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0 truncate">{place}</span>
              </p>
            ))}


          {/* On a phone the reactions sit right under the photo (first in this column, like the feed, owner 2026-11-10); on a computer they keep their place under the place box */}
          {!moment.video && (
          <div className="order-first lg:order-none flex flex-wrap items-center gap-1 border-y border-slate-100 py-1.5 -mx-1">
            {!moment.likesOff && (
            <button type="button" onClick={() => toggle(moment.isLiked ? 'unlike' : 'like')} aria-pressed={moment.isLiked} className={iconButton}>
              <LikeIcon active={moment.isLiked} />
              {!canSeeLikers && moment.likesCount.toLocaleString()}
              <span className="sr-only">ถูกใจ</span>
            </button>
            )}
            {!moment.likesOff && canSeeLikers && (
            <button type="button" onClick={() => setLikersOpen(true)} className={`${iconButton} -ml-2 underline underline-offset-2`}>
              {moment.likesCount.toLocaleString()}
              <span className="sr-only">ดูคนที่ส่งหัวใจ</span>
            </button>
            )}
            {!moment.commentsOff && (
            <button type="button" onClick={() => (isLoggedIn ? commentInput.current?.focus() : requireLogin('เพื่อร่วมคอมเมนต์'))} className={iconButton}>
              <CommentIcon />
              {moment.commentsCount.toLocaleString()}
              <span className="sr-only">ความคิดเห็น</span>
            </button>
            )}
            {/* The same row as the feed (design 1, owner 2026-11-10): "ชวนไป" is the one action with a shape */}
            {mayShare && (
            <button type="button" onClick={() => setSharing(true)} aria-label="ชวนเพื่อนไปด้วยกัน หรือแชร์" className="group inline-flex items-center min-h-11 ml-1 cursor-pointer">
              <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-slate-100 group-hover:bg-slate-200 text-sm text-slate-800 font-semibold transition-colors">
                <InviteIcon className="h-[17px] w-[39px] shrink-0" />
                ชวนไป
              </span>
            </button>
            )}
            <button type="button" onClick={() => toggle(moment.isSaved ? 'unsave' : 'save')} aria-pressed={moment.isSaved} aria-label={moment.isSaved ? 'เลิกบันทึก' : 'บันทึก'} className={`${iconButton} ml-auto`}>
              <SaveIcon active={moment.isSaved} />
            </button>
          </div>
          )}

          {/* One section for the page and the sheet, so the comments stay in the server HTML and in one place */}
          {!moment.commentsOff && (
          <section
            id="comments"
            aria-label="ความคิดเห็น"
            className={`space-y-4 scroll-mt-24 ${
              commentsOpen ? 'fixed z-[62] m-0 inset-x-0 bottom-0 h-[70dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 shadow-2xl lg:inset-x-auto lg:right-0 lg:top-0 lg:h-full lg:w-[400px] lg:rounded-none lg:p-6' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">ความคิดเห็น {moment.commentsCount > 0 && <span className="tabular-nums">({moment.commentsCount})</span>}</h2>
              {commentsOpen && (
                <button type="button" onClick={() => setCommentsOpen(false)} aria-label="ปิดความคิดเห็น" className="flex h-10 w-10 -my-2 -mr-2 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
            {/* The box comes first, so replying never needs scrolling past the thread */}
            {isLoggedIn && replyTo && <ReplyingTo name={replyTo.userName} onCancel={() => setReplyTo(null)} />}
            {isLoggedIn ? (
              <form onSubmit={sendComment} className="flex items-center gap-2">
                <label htmlFor="moment-comment" className="sr-only">เขียนความคิดเห็น</label>
                <input
                  ref={commentInput}
                  id="moment-comment"
                  value={comment}
                  {...mention.fieldProps}
                  maxLength={300}
                  placeholder="เขียนความคิดเห็น…"
                  className="flex-1 min-w-0 h-11 px-4 rounded-full bg-slate-100 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || isBusy}
                  aria-label="ส่งความคิดเห็น"
                  className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            ) : null}
            {isLoggedIn && mention.list}
            {isLoggedIn ? null : (
              <button type="button" onClick={() => requireLogin('เพื่อร่วมคอมเมนต์')} className="block h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer">
                เข้าสู่ระบบเพื่อคอมเมนต์
              </button>
            )}
            {moment.comments.length > 0 ? (
              <>
                {hiddenComments > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllComments((open) => !open)}
                    aria-expanded={showAllComments}
                    className="block text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer tabular-nums"
                  >
                    {showAllComments ? 'ซ่อนความคิดเห็นก่อนหน้า' : `ดูความคิดเห็นก่อนหน้าอีก ${hiddenComments.toLocaleString()} รายการ`}
                  </button>
                )}
                {/* Older threads stay in the HTML (search engines read them) and show when the reader asks */}
                <CommentThread
                  momentId={moment.id}
                  comments={moment.comments}
                  isLoggedIn={isLoggedIn}
                  onNeedLogin={() => requireLogin('เพื่อร่วมคอมเมนต์')}
                  onAct={actOnComment}
                  onReply={answer}
                  hiddenBefore={showAllComments ? 0 : hiddenComments}
                />
              </>
            ) : (
              <p className="text-sm font-medium text-slate-500">ยังไม่มีความคิดเห็น ทักทายเป็นคนแรกเลย</p>
            )}
          </section>
          )}
        </div>
      </article>

      {viewer !== null && <PhotoViewer images={moment.images} start={viewer} onClose={() => setViewer(null)} />}

      {likersOpen && <LikersDialog momentId={moment.id} onClose={() => setLikersOpen(false)} />}
      {confirmDelete && (
        <DialogShell onClose={() => setConfirmDelete(false)} title="ลบโมเมนต์นี้ไหม" subtitle="รูป ข้อความ และความคิดเห็นของโพสต์นี้จะหายไป และกู้คืนไม่ได้" size="sm">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" data-autofocus className={dialogButton.quiet} onClick={() => setConfirmDelete(false)}>
              ยกเลิก
            </button>
            <button type="button" className={dialogButton.danger} disabled={isBusy} onClick={deleteMoment}>
              ลบโมเมนต์
            </button>
          </div>
        </DialogShell>
      )}

      {reportReason !== null && (
        <DialogShell onClose={() => setReportReason(null)} title="รายงานโพสต์นี้" subtitle="ทีมงานจะตรวจสอบ เจ้าของจะไม่รู้ว่าใครรายงาน" size="sm">
          <fieldset className="space-y-2 mb-5">
            <legend className="sr-only">เหตุผล</legend>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-sm font-semibold ${
                  reportReason === reason ? 'border-[#2563EB] bg-blue-50/60 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="moment-report-reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="accent-[#2563EB]" />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={dialogButton.quiet} onClick={() => setReportReason(null)}>
              ยกเลิก
            </button>
            <button type="button" className={dialogButton.primary} disabled={!reportReason || isBusy} onClick={sendReport}>
              {isBusy ? 'กำลังส่ง…' : 'ส่งรายงาน'}
            </button>
          </div>
        </DialogShell>
      )}
      {sharing && (
        <ShareSheet
          canInvite={isLoggedIn}
          onInvite={() => setInviting(true)}
          onLine={() => void inviteViaLine({ type: 'moment', id: moment.id }, place ?? '').then((ok) => !ok && showToast('ทำลิงก์ชวนไม่สำเร็จ ลองอีกครั้งนะ'))}
          onLink={() => void share()}
          invite={{ target: { type: 'moment', id: moment.id }, place: place ?? '' }}
          onMessage={showToast}
          onClose={() => setSharing(false)}
        />
      )}
      {inviting && (
        <InviteSheet
          target={{ type: 'moment', id: moment.id }}
          place={place}
          onClose={() => setInviting(false)}
          onDone={(message) => {
            setInviting(false);
            showToast(message);
          }}
        />
      )}
    </main>
  );
}

/** /moments/[id]: one moment, built on the server for search; likes, saves and comments work here */
/** A first line longer than this reads as text, not as a headline */
const LONG_HEADLINE = 60;

export function MomentDetailView(props: DetailProps) {
  return <MomentsChrome>{(context) => (props.initialMoment.video ? <ReelHost {...props} context={context} /> : <DetailBody {...props} {...context} />)}</MomentsChrome>;
}

/**
 * A clip's page holds the Reel: once the clip fills the screen, the clips after it (from the feed it was tapped in,
 * then the newest clips) wait in line, and a swipe brings the next one in place, address and all.
 */
function ReelHost({ initialMoment, openFullScreen = false, context }: DetailProps & { context: MomentsChromeContext }) {
  const [clips, setClips] = useState<FeedItem[]>([initialMoment]);
  const [at, setAt] = useState(0);
  const [enteredFrom, setEnteredFrom] = useState<1 | -1 | undefined>();
  const [isFull, setIsFull] = useState(false);
  /** undefined: the first page not asked for yet; null: no more clips */
  const cursor = useRef<string | null | undefined>(undefined);
  const loading = useRef(false);

  const loadMore = useCallback(async () => {
    if (loading.current || cursor.current === null) return;
    loading.current = true;
    const first = cursor.current === undefined;
    try {
      const after = cursor.current ? `&cursor=${encodeURIComponent(cursor.current)}` : '';
      const json = await fetch(`/api/moments?media=clip&limit=10${after}`, { cache: 'no-store' }).then((res) => res.json());
      const found: FeedItem[] = [...(first ? clipsAfter(initialMoment.id) : []), ...(Array.isArray(json?.moments) ? json.moments : [])];
      cursor.current = json?.pagination?.hasNextPage && json.pagination.nextCursor ? json.pagination.nextCursor : null;
      setClips((list) => {
        const known = new Set(list.map((m) => m.id));
        const fresh = found.filter((m) => {
          if (!m.video || known.has(m.id)) return false;
          known.add(m.id);
          return true;
        });
        return fresh.length ? [...list, ...fresh] : list;
      });
    } catch {
      cursor.current = null;
    } finally {
      loading.current = false;
    }
  }, [initialMoment.id]);

  // The line fills when the clip first fills the screen, and again as the reader nears its end
  useEffect(() => {
    if (isFull && at >= clips.length - 2) void loadMore();
  }, [isFull, at, clips.length, loadMore]);

  const step = useCallback(
    (by: 1 | -1) => {
      const next = clips[at + by];
      if (!next) return;
      setEnteredFrom(by);
      setAt(at + by);
      // The address follows the clip on screen, in place of the last, so Back still leaves the Reel in one step
      window.history.replaceState(window.history.state, '', `/moments/${encodeURIComponent(next.id)}?full=1`);
    },
    [clips, at]
  );

  const current = clips[at];
  const reel: ReelProps = {
    next: clips[at + 1],
    hasPrev: at > 0,
    step,
    enteredFrom,
    returnId: initialMoment.id,
    backOnLeave: openFullScreen,
    fromQueue: at > 0,
    onFullChange: setIsFull,
  };
  return <DetailBody key={current.id} initialMoment={current} openFullScreen={openFullScreen || at > 0} reel={reel} {...context} />;
}
