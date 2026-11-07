'use client';

import { useSyncExternalStore } from 'react';

/**
 * Posts on their way up, the way Instagram and TikTok do it (owner 2026-11-07): the form closes as soon as the member
 * taps โพสต์, and the work (shrinking a clip, uploading, posting) goes on while they keep browsing. PostingProgress
 * shows each one with a bar, then done or "ลองใหม่". It lives in this tab only: closing or reloading the page drops a
 * post that has not finished, so the page asks first while one is uploading.
 */

export type PostingState = 'working' | 'done' | 'failed';

export interface PostingJob {
  id: string;
  /** A small picture of the post (data URL) */
  thumb: string;
  /** 0..1 of the whole job */
  share: number;
  note: string;
  state: PostingState;
  error?: string;
}

/** Reports progress: `share` is 0..1 of the whole job, `note` says what is happening */
export type ReportProgress = (share: number, note: string) => void;

/** A failure with words the member can act on; any other error shows a general message */
export class PostingError extends Error {}

const DONE_SHOWN_MS = 3000;
const GENERAL_ERROR = 'โพสต์ไม่สำเร็จ ลองอีกครั้งนะ';

let jobs: PostingJob[] = [];
const runs = new Map<string, (report: ReportProgress) => Promise<void>>();
const listeners = new Set<() => void>();

function set(id: string, change: Partial<PostingJob>) {
  jobs = jobs.map((job) => (job.id === id ? { ...job, ...change } : job));
  listeners.forEach((listener) => listener());
}

async function execute(id: string) {
  const run = runs.get(id);
  if (!run) return;
  set(id, { state: 'working', share: 0, note: 'กำลังเตรียมโพสต์…', error: undefined });
  try {
    await run((share, note) => set(id, { share: Math.max(0, Math.min(1, share)), note }));
    set(id, { state: 'done', share: 1, note: 'โพสต์แล้ว' });
    runs.delete(id);
    setTimeout(() => dismissPosting(id), DONE_SHOWN_MS);
  } catch (err) {
    if (!(err instanceof PostingError)) console.error('Moment post failed:', err);
    set(id, { state: 'failed', error: err instanceof PostingError ? err.message : GENERAL_ERROR });
  }
}

/** Starts a post in the background; `run` does the work and throws PostingError with words for the member */
export function startPosting(thumb: string, run: (report: ReportProgress) => Promise<void>) {
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  jobs = [...jobs, { id, thumb, share: 0, note: '', state: 'working' }];
  runs.set(id, run);
  void execute(id);
}

/** Runs a failed post again from the start */
export function retryPosting(id: string) {
  void execute(id);
}

export function dismissPosting(id: string) {
  runs.delete(id);
  jobs = jobs.filter((job) => job.id !== id);
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const EMPTY: PostingJob[] = [];

export function usePostingJobs(): PostingJob[] {
  return useSyncExternalStore(subscribe, () => jobs, () => EMPTY);
}
