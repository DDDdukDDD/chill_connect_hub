'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heart, MoreHorizontal, X } from 'lucide-react';
import { avatarImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import type { FeedItem } from '@/lib/moments/service';

export type ThreadComment = FeedItem['comments'][number];

export function MomentAvatar({ name, src, className }: { name: string; src?: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
    <img src={avatarImage(src)} alt="" className={`${className} rounded-full object-cover bg-slate-100 shrink-0`} />
  ) : (
    <span className={`${className} rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0`} aria-hidden="true">
      {nameInitial(name)}
    </span>
  );
}

/** The line above the comment box while answering someone; ✕ goes back to a plain comment */
export function ReplyingTo({ name, onCancel }: { name: string; onCancel: () => void }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="min-w-0 truncate">กำลังตอบกลับ {name}</span>
      <button type="button" onClick={onCancel} aria-label="ยกเลิกการตอบกลับ" className="w-7 h-7 -my-1 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0">
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </p>
  );
}

type Props = {
  momentId: string;
  /** Oldest first, replies among them; a reply shows under its comment */
  comments: ThreadComment[];
  isLoggedIn: boolean;
  onNeedLogin: () => void;
  /** Sends like_comment, unlike_comment or delete_comment; false when it did not go through (the caller says why) */
  onAct: (body: { action: 'like_comment' | 'unlike_comment' | 'delete_comment'; commentId: string }) => Promise<boolean>;
  onReply: (comment: ThreadComment) => void;
  /** Older comments stay in the HTML (search engines read them) but out of sight until asked for */
  hiddenBefore?: number;
};

/** The comments of a moment, on the feed and on its own page: like, reply, delete and report work the same in both */
export function CommentThread({ momentId, comments, isLoggedIn, onNeedLogin, onAct, onReply, hiddenBefore = 0 }: Props) {
  const [reporting, setReporting] = useState<ThreadComment | null>(null);
  const tops = comments.filter((comment) => !comment.parentId);
  const row = { isLoggedIn, onNeedLogin, onAct, onReply, onReport: setReporting };
  return (
    <>
      <ul className="space-y-3.5">
        {tops.map((comment, index) => {
          const replies = comments.filter((reply) => reply.parentId === comment.id);
          return (
            <li key={comment.id} className={index < hiddenBefore ? 'hidden' : ''}>
              <CommentRow comment={comment} {...row} />
              {replies.length > 0 && (
                <ul className="mt-3 ml-9 space-y-3" aria-label={`ตอบกลับ ${comment.userName}`}>
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentRow comment={reply} {...row} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <ReportSafetyModal
        isOpen={reporting !== null}
        onClose={() => setReporting(null)}
        targetType="comment"
        targetId={reporting ? `${momentId}/${reporting.id}` : ''}
        targetTitle={reporting ? `ความคิดเห็นของ ${reporting.userName}` : ''}
      />
    </>
  );
}

const ACTION = 'inline-flex items-center min-h-6 font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer';

function CommentRow({ comment, isLoggedIn, onNeedLogin, onAct, onReply, onReport }: Pick<Props, 'isLoggedIn' | 'onNeedLogin' | 'onAct' | 'onReply'> & { comment: ThreadComment; onReport: (comment: ThreadComment) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  // Like IG: delete and report sit behind ⋯, so the line under a comment is the time and ตอบกลับ
  const canReport = isLoggedIn && !comment.isMine;
  const hasMenu = comment.canDelete || canReport;
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);
  // The heart answers at once and goes back if the server says no; the next answer from the server replaces it
  const [heart, setHeart] = useState<{ forLiked: boolean; liked: boolean; count: number } | null>(null);
  const shown = heart && heart.forLiked === comment.isLiked ? heart : { liked: comment.isLiked, count: comment.likesCount };

  const toggleHeart = async () => {
    if (!isLoggedIn) return onNeedLogin();
    const liked = !shown.liked;
    setHeart({ forLiked: comment.isLiked, liked, count: shown.count + (liked ? 1 : -1) });
    const done = await onAct({ action: liked ? 'like_comment' : 'unlike_comment', commentId: comment.id });
    if (!done) setHeart(null);
  };

  return (
    <div className="group/comment flex items-start gap-2.5">
      <MomentAvatar name={comment.userName} src={comment.userAvatar} className={comment.parentId ? 'w-6 h-6 text-[11px]' : 'w-7 h-7 text-[11px]'} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] sm:text-sm text-slate-800 break-words">
          <span className="font-semibold text-slate-900">{comment.userName}</span> {comment.text}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
          <span>{comment.timeAgo}</span>
          <button type="button" className={ACTION} onClick={() => (isLoggedIn ? onReply(comment) : onNeedLogin())}>
            ตอบกลับ
          </button>
          {confirming ? (
            <span className="inline-flex items-center gap-3">
              <span className="text-slate-700">ลบความคิดเห็นนี้ไหม</span>
              <button type="button" onClick={() => void onAct({ action: 'delete_comment', commentId: comment.id })} className="min-h-6 font-semibold text-rose-600 hover:underline cursor-pointer">
                ลบเลย
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={ACTION}>
                ยกเลิก
              </button>
            </span>
          ) : (
            hasMenu && (
              <span ref={menuRef} className="relative inline-flex">
                {/* Phones always show ⋯; wider screens show it on hover or keyboard focus, as IG does */}
                <button
                  type="button"
                  aria-label={`ตัวเลือกความคิดเห็นของ ${comment.userName}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                  className={`inline-flex items-center justify-center w-7 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-opacity ${menuOpen ? '' : 'sm:opacity-0 sm:group-hover/comment:opacity-100 sm:focus-visible:opacity-100'}`}
                >
                  <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                </button>
                {menuOpen && (
                  <span role="menu" className="absolute left-0 top-full mt-1 z-20 min-w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {comment.canDelete && (
                      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setConfirming(true); }} className="block w-full px-3.5 py-2 text-left text-sm font-medium text-rose-600 hover:bg-slate-50 cursor-pointer">
                        ลบความคิดเห็น
                      </button>
                    )}
                    {canReport && (
                      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onReport(comment); }} className="block w-full px-3.5 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                        รายงาน
                      </button>
                    )}
                  </span>
                )}
              </span>
            )
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={toggleHeart}
        aria-pressed={shown.liked}
        aria-label={shown.liked ? `เลิกถูกใจความคิดเห็นของ ${comment.userName}` : `ถูกใจความคิดเห็นของ ${comment.userName}`}
        className="flex flex-col items-center justify-center min-w-8 min-h-8 -my-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
      >
        <Heart className={`w-3.5 h-3.5 ${shown.liked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
        {shown.count > 0 && <span className="text-[11px] text-slate-500 tabular-nums">{shown.count.toLocaleString()}</span>}
      </button>
    </div>
  );
}
