'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PhraseText } from './PhraseText';

/**
 * The one dialog frame for account popups (login, sign-up, log out, terms and privacy, join prompts),
 * so they look and behave the same (DESIGN_SYSTEM.md → Dialogs):
 * overlay, white rounded panel, quiet close button, Esc to close, focus kept inside, page scroll locked,
 * and focus returned to the trigger on close. A dialog opened from another dialog works: only the
 * top-most one reacts to keys.
 * Rendered into <body>, so a dialog opened from inside the sticky navbar (whose backdrop blur would
 * otherwise become the frame for `fixed`) still covers the whole screen.
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
  /** 'top' keeps the heading in one place when the content changes height (multi-step dialogs such as sign-up) */
  align?: 'center' | 'top';
  /** false when the first field is a choice: focus on it would look like an answer already picked */
  focusField?: boolean;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const SIZES = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[680px]' };

/**
 * What every dialog does (DESIGN_SYSTEM.md → Dialogs): Esc closes, Tab stays inside, the page behind does not
 * scroll, and focus goes back to the trigger on close. For a dialog with its own frame: put `data-dialog-shell`
 * and `tabIndex={-1}` on the panel so stacked dialogs know which one is on top.
 * `focusField: false` starts on the panel, so a phone does not open its keyboard over a dialog that is mostly reading.
 */
/**
 * The page behind stays still while any dialog is open. Counted, not "remember and put back": with a remembered value,
 * two dialogs that close in the other order than they opened put back "hidden" and leave the page unable to scroll
 * until a reload (owner 2026-11-09, seen after posting a clip).
 */
let scrollLocks = 0;
let overflowBeforeLocks = '';
export function lockPageScroll(): () => void {
  if (scrollLocks++ === 0) {
    overflowBeforeLocks = document.body.style.overflow === 'hidden' ? '' : document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.style.overflow = overflowBeforeLocks;
  };
}

export function useDialogBehavior(panelRef: React.RefObject<HTMLElement | null>, onClose: () => void, { active = true, focusField = true }: { active?: boolean; focusField?: boolean } = {}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!active || !panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlockScroll = lockPageScroll();
    (panel.querySelector<HTMLElement>(focusField ? '[data-autofocus], input, select, textarea' : '[data-autofocus]') ?? panel).focus({ preventScroll: true });

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
      unlockScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
    // panelRef is a stable ref; focusField never changes while a dialog is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

export function DialogShell({ onClose, children, title, subtitle, labelledBy, size = 'md', layer = 'base', bare = false, showClose = true, align = 'center', focusField = true }: DialogShellProps) {
  const ownTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose, { focusField });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 flex justify-center p-4 sm:p-6 bg-black/65 ${align === 'top' ? 'items-start pt-[4vh] sm:pt-[8vh]' : 'items-center'} backdrop-blur-xs ${layer === 'top' ? 'z-[100010]' : 'z-[100002]'}`}>
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
          <div className="text-center pb-6 px-2 sm:px-8">
            <h2 id={ownTitleId} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
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
    </div>,
    document.body,
  );
}

/* Button styles shared by the account dialogs (DESIGN_SYSTEM.md → Buttons) */
export const dialogButton = {
  primary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold shadow-sm cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  secondary:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  quiet:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
  danger:
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2',
};
