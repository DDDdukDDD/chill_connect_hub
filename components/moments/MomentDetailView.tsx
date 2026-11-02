'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Flag, Heart, Link2, MessageCircle, Send, Share2, Trash2, X } from 'lucide-react';
import type { FeedItem } from '@/lib/moments/service';
import { nameInitial } from '@/lib/displayName';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { ClipPlayer } from '@/components/moments/ClipPlayer';
import { MomentPhotos } from '@/components/moments/MomentPhotos';
import { PhotoViewer, REPORT_REASONS, call } from '@/components/home/HomeMomentFeed';
import { MomentsChrome, type MomentsChromeContext } from '@/components/moments/MomentsChrome';

import { MOMENT_TARGETS, isMomentTarget, momentTargetHref, momentTitle } from '@/components/moments/momentTargets';
import { markReturning, showcaseUrlFor, updateSavedMoment } from '@/components/moments/momentsReturn';

function Avatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
    <img src={src} alt="" className={`${className} rounded-full object-cover bg-slate-100 shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0`}>{nameInitial(name)}</span>
  );
}

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

function DetailBody({ initialMoment, openFullScreen = false, isLoggedIn, requireLogin, showToast }: DetailProps & MomentsChromeContext) {
  const router = useRouter();
  const [moment, setMoment] = useState(initialMoment);
  const [viewer, setViewer] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  // Long threads open on the newest few; every comment is still in the server HTML
  const [showAllComments, setShowAllComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  /** Own comment waiting for "ลบเลย": deleting cannot be undone, so it takes a second tap */
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);
  const commentInput = useRef<HTMLInputElement>(null);
  const [isFull, setIsFull] = useState(openFullScreen && Boolean(initialMoment.video));
  const openedFull = useRef(isFull);
  // The cover has the clip's shape: full screen on a computer, a tall clip leaves room, so its words and buttons sit right beside it
  const clipRatio = initialMoment.imageRatio ?? 9 / 16;
  /** Full screen only: the comments open over the clip and it keeps playing */
  const [commentsOpen, setCommentsOpen] = useState(false);
  const besideClip = isFull && clipRatio <= 0.8 && !commentsOpen;

  // Filling the screen with the buttons kept: the browser's own full screen would hand an iPhone to its plain player
  useEffect(() => {
    if (!isFull) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
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
    if (!isLoggedIn) return;
    let active = true;
    fetch(`/api/moments/${encodeURIComponent(initialMoment.id)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && json?.moment && setMoment(json.moment))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isLoggedIn, initialMoment.id]);

  // Back to the grid where the reader left it: the link goes to the tab it was opened from, and the browser's Back works the same
  const [savedGrid, setSavedGrid] = useState<string | null>(null);
  const backHref = savedGrid ?? '/moments';
  useEffect(() => {
    setSavedGrid(showcaseUrlFor(initialMoment.id));
    const onBack = () => markReturning(initialMoment.id);
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [initialMoment.id]);

  // Hearts, saves and comments given here show on the card when the reader goes back
  useEffect(() => {
    updateSavedMoment(moment.id, { isLiked: moment.isLiked, likesCount: moment.likesCount, commentsCount: moment.commentsCount, isSaved: moment.isSaved });
  }, [moment.id, moment.isLiked, moment.likesCount, moment.commentsCount, moment.isSaved]);

  const url = `/api/moments/${encodeURIComponent(moment.id)}`;
  const title = momentTitle(moment.caption);
  const rest = moment.caption.slice(moment.caption.indexOf(title) + title.length).trim();
  const target = isMomentTarget(moment.targetType) ? MOMENT_TARGETS[moment.targetType] : null;
  const targetHref = momentTargetHref(moment.targetType, moment.targetId);
  const place = moment.targetTitle || moment.location;
  /** Comments before the newest three, folded until the reader opens them */
  const hiddenComments = Math.max(0, moment.comments.length - 3);

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
      }
    });
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    setIsBusy(true);
    const result = await call(`${url}/actions`, 'POST', { action: 'comment', text });
    setIsBusy(false);
    if (!result.ok || !result.moment) return showToast(result.message);
    setMoment(result.moment);
    setComment('');
  };

  const deleteComment = async (commentId: string) => {
    setConfirmCommentId(null);
    const result = await call(`${url}/actions`, 'POST', { action: 'delete_comment', commentId });
    if (!result.ok || !result.moment) return showToast(result.message);
    setMoment(result.moment);
  };

  const share = async () => {
    const link = `${window.location.origin}/moments/${encodeURIComponent(moment.id)}`;
    if (navigator.share) {
      await navigator.share({ title: title || 'โมเมนต์', url: link }).catch(() => undefined);
      return;
    }
    if (!navigator.clipboard) return showToast(link);
    navigator.clipboard.writeText(link).then(
      () => showToast('คัดลอกลิงก์แล้ว'),
      () => showToast(link)
    );
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
        โมเมนต์ทั้งหมด
      </Link>

      <article className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 items-start">
        {/* A clip fills the screen with everything on it, like a Reel; the place and the comments follow */}
        {moment.video ? (
          <div
            style={{ '--clip-w': `min(100vw, calc(100dvh * ${clipRatio}))` } as React.CSSProperties}
            className={`overflow-hidden bg-black ${isFull ? `fixed inset-0 z-[60] ${commentsOpen ? 'lg:right-[400px]' : ''}` : 'relative -mx-4 sm:mx-0 sm:rounded-3xl h-[calc(100dvh-14rem)] xl:h-[calc(100dvh-9rem)] min-h-[340px] lg:sticky lg:top-24'}`}
          >
            <ClipPlayer
              url={moment.video.url}
              poster={moment.images[0]}
              label={title || `คลิปจาก ${place}`}
              onTap={isFull ? undefined : () => setIsFull(true)}
              onDoubleTap={() => !moment.isLiked && toggle('like')}
              className="absolute inset-0"
            />
            {isFull && (
              <button type="button" onClick={leaveFull} aria-label="ออกจากเต็มจอ" className="absolute top-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/60 to-transparent pt-16 pb-4 pl-4 pr-16 text-white pointer-events-none ${
                besideClip ? 'lg:inset-x-auto lg:bottom-auto lg:top-4 lg:right-[calc(50%+var(--clip-w)/2+0.75rem)] lg:w-[min(20rem,calc(50%-var(--clip-w)/2-5rem))] lg:bg-none lg:p-0' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={moment.userName} src={moment.userAvatar} className="w-9 h-9 text-sm" />
                <div className="min-w-0">
                  {moment.authorId ? (
                    <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} className="block text-sm font-bold truncate hover:underline pointer-events-auto">
                      {moment.userName}
                    </Link>
                  ) : (
                    <span className="block text-sm font-bold truncate">{moment.userName}</span>
                  )}
                  <time dateTime={moment.createdAt} className="block text-xs font-medium text-white/80">
                    {moment.timeAgo}
                  </time>
                </div>
              </div>
              <div className={`mt-2 pointer-events-auto ${showFullCaption ? 'max-h-40 overflow-y-auto' : ''}`}>
                <h1 className={`text-sm font-bold leading-snug break-words ${showFullCaption ? '' : 'line-clamp-2'}`}>{title || `โมเมนต์จาก ${place || 'เพื่อนๆ'}`}</h1>
                {/* The rest stays in the HTML for search engines and shows when the reader asks */}
                {rest && <p className={`mt-1 text-sm font-medium leading-relaxed whitespace-pre-line break-words ${showFullCaption ? '' : 'hidden'}`}>{rest}</p>}
                {(rest || title.length > 80) && (
                  <button type="button" onClick={() => setShowFullCaption((open) => !open)} className="mt-1 text-xs font-bold text-white/80 hover:text-white cursor-pointer">
                    {showFullCaption ? 'ย่อ' : 'ดูเพิ่มเติม'}
                  </button>
                )}
              </div>
            </div>

            <div className={`absolute right-1.5 bottom-3 z-10 flex flex-col items-center gap-1 ${besideClip ? 'lg:right-auto lg:left-[calc(50%+var(--clip-w)/2+0.75rem)]' : ''}`}>
              <button type="button" onClick={() => toggle(moment.isLiked ? 'unlike' : 'like')} aria-pressed={moment.isLiked} aria-label={moment.isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'} className={railButton}>
                <Heart className={`w-7 h-7 drop-shadow ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
                {moment.likesCount.toLocaleString()}
              </button>
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
              <button type="button" onClick={share} aria-label="แชร์" className={railButton}>
                <Share2 className="w-7 h-7 drop-shadow" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => toggle(moment.isSaved ? 'unsave' : 'save')} aria-pressed={moment.isSaved} aria-label={moment.isSaved ? 'เลิกบันทึก' : 'บันทึก'} className={railButton}>
                <Bookmark className={`w-7 h-7 drop-shadow ${moment.isSaved ? 'fill-white' : ''}`} aria-hidden="true" />
              </button>
              {moment.isMine ? (
                <button type="button" onClick={() => setConfirmDelete(true)} aria-label="ลบโมเมนต์" className={railButton}>
                  <Trash2 className="w-6 h-6 drop-shadow" aria-hidden="true" />
                </button>
              ) : (
                !moment.hasReported && (
                  <button type="button" onClick={() => (isLoggedIn ? setReportReason('') : requireLogin('เพื่อรายงานโพสต์'))} aria-label="รายงานโพสต์นี้" className={railButton}>
                    <Flag className="w-6 h-6 drop-shadow" aria-hidden="true" />
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          // On a computer the photo stays in view while a long comment thread scrolls beside it
          <div className="-mx-4 sm:mx-0 sm:rounded-3xl overflow-hidden lg:sticky lg:top-24">
            <MomentPhotos images={moment.images} alt={title || `โมเมนต์จาก ${place}`} onOpen={(index) => setViewer(index)} onDoubleTap={() => !moment.isLiked && toggle('like')} />
          </div>
        )}

        <div className="min-w-0 space-y-5">
          {!moment.video && (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={moment.userName} src={moment.userAvatar} className="w-10 h-10 text-sm" />
                <div className="min-w-0">
                  {moment.authorId ? (
                    <Link href={`/profile?id=${encodeURIComponent(moment.authorId)}`} className="block text-sm font-bold text-slate-900 hover:underline truncate">
                      {moment.userName}
                    </Link>
                  ) : (
                    <span className="block text-sm font-bold text-slate-900 truncate">{moment.userName}</span>
                  )}
                  <time dateTime={moment.createdAt} className="block text-xs font-medium text-slate-500">
                    {moment.timeAgo}
                  </time>
                </div>
                {/* Share and report (or delete your own) sit with the author, away from the reactions */}
                <div className="ml-auto flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={share} className={iconButton}>
                    <Link2 className="w-5 h-5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">แชร์</span>
                  </button>
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
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">{title || `โมเมนต์จาก ${place || 'เพื่อนๆ'}`}</h1>
                {rest && <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-line break-words">{rest}</p>}
              </div>
            </>
          )}

          {/* Where it is from and the one thing to do next, in the same box as the posts on Home and /moments */}
          {place &&
            (targetHref && target ? (
              <Link href={targetHref} className={`flex items-center gap-2.5 rounded-2xl ${target.box} pl-2 pr-3 py-2 hover:opacity-90`}>
                <span className={`w-8 h-8 rounded-xl bg-white ${target.icon} flex items-center justify-center shrink-0`} aria-hidden="true">
                  <target.Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium opacity-80">{target.label}</span>
                  <span className="block text-[13px] font-semibold truncate">{place}</span>
                </span>
                <span className="text-xs font-semibold whitespace-nowrap">{target.go} →</span>
              </Link>
            ) : (
              <p className="flex items-center gap-2.5 rounded-2xl bg-slate-100 text-slate-700 pl-2 pr-3 py-2">
                <span className="w-8 h-8 rounded-xl bg-white text-slate-500 flex items-center justify-center shrink-0" aria-hidden="true">
                  <MOMENT_TARGETS.spot.Icon className="w-4 h-4" />
                </span>
                <span className="text-[13px] font-semibold truncate">{place}</span>
              </p>
            ))}

          {!moment.video && (
            <div className="flex flex-wrap items-center gap-1 border-y border-slate-100 py-1.5 -mx-1">
              <button type="button" onClick={() => toggle(moment.isLiked ? 'unlike' : 'like')} aria-pressed={moment.isLiked} className={iconButton}>
                <Heart className={`w-5 h-5 ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
                {moment.likesCount.toLocaleString()}
                <span className="sr-only">ถูกใจ</span>
              </button>
              <button type="button" onClick={() => (isLoggedIn ? commentInput.current?.focus() : requireLogin('เพื่อร่วมคอมเมนต์'))} className={iconButton}>
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                {moment.commentsCount.toLocaleString()}
                <span className="sr-only">ความคิดเห็น</span>
              </button>
              <button type="button" onClick={() => toggle(moment.isSaved ? 'unsave' : 'save')} aria-pressed={moment.isSaved} className={`${iconButton} ml-auto`}>
                <Bookmark className={`w-5 h-5 ${moment.isSaved ? 'fill-slate-900 text-slate-900' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">{moment.isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
              </button>
            </div>
          )}

          {/* A tap above the sheet closes it, on a phone where it covers the clip's buttons */}
          {commentsOpen && <button type="button" aria-label="ปิดความคิดเห็น" tabIndex={-1} onClick={() => setCommentsOpen(false)} className="fixed inset-0 z-[61] cursor-default lg:hidden" />}

          {/* One section for the page and the sheet, so the comments stay in the server HTML and in one place */}
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
            {isLoggedIn ? (
              <form onSubmit={sendComment} className="flex items-center gap-2">
                <label htmlFor="moment-comment" className="sr-only">เขียนความคิดเห็น</label>
                <input
                  ref={commentInput}
                  id="moment-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
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
            ) : (
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
                    {showAllComments ? 'ซ่อนความคิดเห็นก่อนหน้า' : `ดูความคิดเห็นทั้งหมด (${moment.comments.length.toLocaleString()})`}
                  </button>
                )}
                <ul className="space-y-3.5">
                  {moment.comments.map((c, index) => (
                    // Older ones stay in the HTML (search engines read them) and show when the reader asks
                    <li key={c.id} className={`flex items-start gap-2.5 ${index < hiddenComments && !showAllComments ? 'hidden' : ''}`}>
                      <Avatar name={c.userName} src={c.userAvatar} className="w-8 h-8 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800 break-words">
                          <span className="font-bold text-slate-900">{c.userName}</span> {c.text}
                        </p>
                        <p className="mt-0.5 flex items-center gap-3 text-xs font-medium text-slate-500">
                          {c.timeAgo}
                          {c.isMine &&
                            (confirmCommentId === c.id ? (
                              <span className="inline-flex items-center gap-3">
                                <span className="text-slate-700">ลบความคิดเห็นนี้ไหม</span>
                                <button type="button" onClick={() => deleteComment(c.id)} className="font-bold text-rose-600 hover:underline cursor-pointer">
                                  ลบเลย
                                </button>
                                <button type="button" onClick={() => setConfirmCommentId(null)} className="font-bold hover:text-slate-800 hover:underline cursor-pointer">
                                  ยกเลิก
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setConfirmCommentId(c.id)} className="font-bold hover:text-slate-800 hover:underline cursor-pointer">
                                ลบ
                              </button>
                            ))}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm font-medium text-slate-500">ยังไม่มีความคิดเห็น ทักทายเป็นคนแรกเลย</p>
            )}
          </section>
        </div>
      </article>

      {viewer !== null && <PhotoViewer images={moment.images} start={viewer} onClose={() => setViewer(null)} />}

      {confirmDelete && (
        <DialogShell onClose={() => setConfirmDelete(false)} title="ลบโมเมนต์นี้ไหม" subtitle="รูป ข้อความ และความคิดเห็นของโพสต์นี้จะหายไป และกู้คืนไม่ได้" size="sm">
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setConfirmDelete(false)}>
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
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setReportReason(null)}>
              ยกเลิก
            </button>
            <button type="button" className={dialogButton.primary} disabled={!reportReason || isBusy} onClick={sendReport}>
              {isBusy ? 'กำลังส่ง…' : 'ส่งรายงาน'}
            </button>
          </div>
        </DialogShell>
      )}
    </main>
  );
}

/** /moments/[id]: one moment, built on the server for search; likes, saves and comments work here */
export function MomentDetailView(props: DetailProps) {
  return <MomentsChrome>{(context) => <DetailBody {...props} {...context} />}</MomentsChrome>;
}
