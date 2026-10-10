'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { PhraseText } from './PhraseText';

/**
 * The one dialog frame for account popups (login, sign-up, log out, terms and privacy, join prompts),
 * so they look and behave the same (DESIGN_SYSTEM.md → Dialogs):
 * overlay, white rounded panel, quiet close button, Esc to close, focus kept inside, page scroll locked,
 * and focus returned to the trigger on close. A dialog opened from another dialog works: only the
 * top-most one reacts to keys.
 */
interface DialogShellProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Shown as the dialog heading; omit when the content renders its own (pass `labelledBy` then) */
  title?: string;
  subtitle?: string;
  /** id of the heading element inside `children`, when `title` is not used */
  labelledBy?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Raise above another open dialog */
  layer?: 'base' | 'top';
  /** Fixed header/footer with a scrolling middle (long text). Children then manage their own padding. */
  bare?: boolean;
  showClose?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const SIZES = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[680px]' };

export function DialogShell({ onClose, children, title, subtitle, labelledBy, size = 'md', layer = 'base', bare = false, showClose = true }: DialogShellProps) {
  const ownTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (panel.querySelector<HTMLElement>('[data-autofocus], input, select, textarea') ?? panel).focus({ preventScroll: true });

    const isTopMost = () => {
      const open = document.querySelectorAll('[data-dialog-shell]');
      return open[open.length - 1] === panel;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTopMost()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs ${layer === 'top' ? 'z-[100010]' : 'z-[100002]'}`}>
      <div
        ref={panelRef}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? ownTitleId : labelledBy}
        tabIndex={-1}
        className={`relative bg-white rounded-[32px] w-full min-w-0 border border-slate-200 shadow-2xl max-h-[92vh] focus:outline-hidden ${SIZES[size]} ${bare ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-5 sm:p-10'}`}
      >
        {showClose && (
          <button type="button" onClick={onClose} aria-label="ปิด" className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {title && !bare && (
          <div className="text-center pb-6 px-8">
            <h2 id={ownTitleId} className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
              <PhraseText text={title} />
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                <PhraseText text={subtitle} />
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* Button styles shared by the account dialogs (DESIGN_SYSTEM.md → Buttons) */
export const dialogButton = {
  primary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-extrabold shadow-sm cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  secondary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-extrabold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  quiet:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  danger:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-extrabold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
};
