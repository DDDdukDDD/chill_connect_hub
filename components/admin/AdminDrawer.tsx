'use client';

import React, { useEffect } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import type { QualityReport } from '@/lib/contentQuality';

/**
 * Right-hand slide-over editor shared by every content pillar:
 * form on the left, live preview on the right (stacked on small screens), sticky action footer.
 */
export function AdminDrawer({
  title,
  subtitle,
  onClose,
  footer,
  preview,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer: React.ReactNode;
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-slate-950/30" />
      <div className="relative flex h-full w-full max-w-6xl flex-col bg-[#F6F8F7] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">{title}</h2>
            {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={`grid gap-5 p-4 sm:p-6 ${preview ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
            <div className="min-w-0 space-y-5">{children}</div>
            {preview && <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">{preview}</aside>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">{footer}</div>
      </div>
    </div>
  );
}

/** A titled group of fields inside the drawer (mirrors a section of the public detail page). */
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{title}</h3>
      {hint && <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">{hint}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export const fieldInputClass =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:bg-slate-50 disabled:text-slate-500';

/** Label + control + optional hint/error, spanning both columns when `wide`. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** Live quality checklist shown next to the preview. */
export function QualityPanel({ report }: { report: QualityReport }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] sm:text-xs font-semibold text-slate-500">ตรวจคุณภาพ</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold tabular-nums ${
          report.requiredFailures > 0
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : report.score < 90 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>{report.score}%</span>
      </div>
      <ul className="space-y-1.5">
        {report.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-1.5 text-xs">
            {check.ok
              ? <CircleCheck size={14} className="mt-px shrink-0 text-emerald-600" />
              : <CircleAlert size={14} className={`mt-px shrink-0 ${check.severity === 'required' ? 'text-rose-600' : 'text-amber-500'}`} />}
            <span className={check.ok ? 'text-slate-600' : check.severity === 'required' ? 'font-semibold text-rose-700' : 'text-amber-700'}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Card / list toggle for previews (matches the frontend's ViewModeToggle modes). */
export function PreviewModeToggle({ mode, onChange }: { mode: 'card' | 'list'; onChange: (mode: 'card' | 'list') => void }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
      {(['card', 'list'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${mode === value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
        >
          {value === 'card' ? 'การ์ด' : 'รายการ'}
        </button>
      ))}
    </div>
  );
}

/** Swallows clicks so a preview built from real frontend components never navigates away. */
export function InertPreview({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

/** Neutral image for previews of content that has no photo yet (an empty src makes the browser refetch the page) */
export const PREVIEW_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#E2E8F0"/><path d="M150 190l35-45 30 35 20-25 35 35z" fill="#94A3B8"/><circle cx="245" cy="120" r="14" fill="#94A3B8"/></svg>'
)}`;
