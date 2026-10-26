'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Flag, Heart, Link2, MessageCircle, Send, Trash2 } from 'lucide-react';
import type { FeedItem } from '@/lib/moments/service';
import { nameInitial } from '@/lib/displayName';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
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

interface DetailProps {
  initialMoment: FeedItem;
}

function DetailBody({ initialMoment, isLoggedIn, requireLogin, showToast }: DetailProps & MomentsChromeContext) {
  const router = useRouter();
  const [moment, setMoment] = useState(initialMoment);
  const [viewer, setViewer] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  // Long threads open on the newest few; every comment is still in the server HTML
  const [showAllComments, setShowAllComments] = useState(false);
  /** Own comment waiting for "ลบเลย": deleting cannot be undone, so it takes a second tap */
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);
  const commentInput = useRef<HTMLInputElement>(null);

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
    const link = window.location.href;
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
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-16">
      <Link href={backHref} scroll={!savedGrid} onClick={() => markReturning(moment.id)} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        โมเมนต์ทั้งหมด
      </Link>

      <article className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 items-start">
        {/* On a computer the photo stays in view while a long comment thread scrolls beside it */}
        <div className="-mx-4 sm:mx-0 sm:rounded-3xl overflow-hidden lg:sticky lg:top-24">
          <MomentPhotos images={moment.images} alt={title || `โมเมนต์จาก ${place}`} onOpen={(index) => setViewer(index)} onDoubleTap={() => !moment.isLiked && toggle('like')} />
        </div>

        <div className="min-w-0 space-y-5">
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

          <section id="comments" aria-label="ความคิดเห็น" className="space-y-4 scroll-mt-24">
            <h2 className="text-sm font-bold text-slate-900">ความคิดเห็น {moment.commentsCount > 0 && <span className="tabular-nums">({moment.commentsCount})</span>}</h2>
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
