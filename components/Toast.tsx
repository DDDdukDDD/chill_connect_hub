'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

/**
 * What kind of message a toast is, read from its words, so the many `showToast(message)` calls need no change:
 * a failure or a request to fix something → error; something done → success; anything else (signing out,
 * a hint) → info, which has no icon. Pass `tone` to say it outright.
 */
export function toastToneOf(message: string): ToastTone {
  if (/ไม่สำเร็จ|ไม่ได้|ผิดพลาด|ไม่พบ|ล้มเหลว|ขออภัย|กรุณา|เกินกำหนด|error|failed/i.test(message)) return 'error';
  if (/ออกจากระบบ/.test(message)) return 'info';
  if (/แล้ว|สำเร็จ|เรียบร้อย/.test(message)) return 'success';
  return 'info';
}

/**
 * The one short-lived message on member-facing pages (owner 2026-10-25: light, not black; an icon only when it fits).
 * Top centre under the top bar, clear of the phone's bottom bar. `className` replaces the position (e.g. inside a dialog).
 */
export function Toast({ message, tone, className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[90]' }: { message: string | null | undefined; tone?: ToastTone; className?: string }) {
  if (!message) return null;
  const kind = tone ?? toastToneOf(message);
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`${className} flex items-center gap-2 max-w-[calc(100vw-2rem)] w-max rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-[0_12px_32px_rgba(15,23,42,0.14)] animate-toast-in`}
    >
      {kind === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />}
      {kind === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />}
      <span className="min-w-0">{message}</span>
    </div>
  );
}
