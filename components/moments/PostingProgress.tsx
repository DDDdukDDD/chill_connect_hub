'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, RotateCw, X } from 'lucide-react';
import { dismissPosting, retryPosting, usePostingJobs } from '@/lib/moments/postingJobs';

/**
 * The posts on their way up (lib/moments/postingJobs.ts), Instagram style: a small light card under the top bar with
 * the post's picture and a bar, then "โพสต์แล้ว", or the reason it failed and "ลองใหม่". Mounted once in the root
 * layout, so it stays while the member moves to another page. While a post uploads, closing the page asks first.
 */
export function PostingProgress() {
  const jobs = usePostingJobs();
  const uploading = jobs.some((job) => job.state === 'working');

  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  if (!jobs.length) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[85] w-[min(24rem,calc(100vw-2rem))] space-y-2">
      {jobs.map((job) => {
        const percent = Math.round(job.share * 100);
        return (
          <div
            key={job.id}
            role={job.state === 'failed' ? 'alert' : 'status'}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 pr-3 shadow-[0_12px_32px_rgba(15,23,42,0.14)] animate-toast-in"
          >
            {job.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element -- a small local picture of the post
              <img src={job.thumb} alt="" className="w-11 h-11 shrink-0 rounded-xl object-cover bg-slate-100" />
            ) : (
              <span className="w-11 h-11 shrink-0 rounded-xl bg-slate-100" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              {job.state === 'working' && (
                <>
                  <p className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800">
                    <span className="truncate">{job.note || 'กำลังโพสต์…'}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-500 tabular-nums">{percent}%</span>
                  </p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label="ความคืบหน้าการโพสต์" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                    <div className="h-full rounded-full bg-[#2563EB] transition-[width] duration-300 ease-out" style={{ width: `${Math.max(4, percent)}%` }} />
                  </div>
                </>
              )}
              {job.state === 'done' && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  แชร์โมเมนต์แล้ว
                </p>
              )}
              {job.state === 'failed' && (
                <p className="flex items-start gap-1.5 text-sm font-semibold text-slate-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                  <span className="min-w-0 line-clamp-2">{job.error}</span>
                </p>
              )}
            </div>
            {job.state === 'failed' && (
              <>
                <button type="button" onClick={() => retryPosting(job.id)} className="h-9 px-3 shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white whitespace-nowrap cursor-pointer inline-flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  ลองใหม่
                </button>
                <button type="button" onClick={() => dismissPosting(job.id)} aria-label="ยกเลิกโพสต์นี้" className="w-9 h-9 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
