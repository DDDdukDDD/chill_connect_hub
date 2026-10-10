'use client';

import React, { useEffect, useId, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { AuthPanel } from './auth/AuthPanel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the member's display name after a successful email login or sign-up */
  onLoginSuccess: (userName: string) => void;
  initialMode?: 'login' | 'signup';
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Login / sign-up popup. The content is the shared AuthPanel (also used by /login and /onboarding).
 * New members continue to /onboarding to pick their interests, then come back to this page.
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialMode = 'login' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('input, button:not([aria-label])')?.focus();

    const onKey = (e: KeyboardEvent) => {
      // Let a nested dialog (terms) handle its own keys
      if (!dialogRef.current || dialogRef.current.querySelector('[data-nested-dialog]')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
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
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname || '/';

  return (
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-[32px] max-w-[520px] w-full min-w-0 border border-slate-200 shadow-2xl p-5 sm:p-10 max-h-[92vh] overflow-y-auto"
      >
        <AuthPanel
          initialView={initialMode}
          returnTo={here}
          titleId={titleId}
          onClose={onClose}
          onAuthenticated={(member, { isNew }) => {
            onLoginSuccess(member.displayName);
            onClose();
            if (isNew) router.push(`/onboarding?returnTo=${encodeURIComponent(here)}`);
          }}
        />
      </div>
    </div>
  );
};

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-7 sm:p-8 space-y-6 animate-scale-up text-center">
        
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/80 shadow-2xs">
          <LogOut className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">
            ยืนยันการออกจากระบบ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            คุณต้องการออกจากระบบ Chill & Connect Hub ใช่หรือไม่? ข้อมูลกิจกรรมและรายการโปรดของคุณจะยังคงถูกบันทึกไว้อย่างปลอดภัย
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmLogout();
              onClose();
            }}
            className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>

      </div>
    </div>
  );
};
