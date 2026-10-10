'use client';

import React, { useId } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthPanel } from './auth/AuthPanel';
import { DialogShell, dialogButton } from './auth/DialogShell';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the member's display name after a successful email login or sign-up */
  onLoginSuccess: (userName: string) => void;
  initialMode?: 'login' | 'signup';
}

/**
 * Login / sign-up popup. The content is the shared AuthPanel (also used by /login and /onboarding).
 * New members continue to /onboarding, then come back to this page.
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialMode = 'login' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  if (!isOpen) return null;

  const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname || '/';

  return (
    <DialogShell onClose={onClose} labelledBy={titleId}>
      <AuthPanel
        initialView={initialMode}
        returnTo={here}
        titleId={titleId}
        onAuthenticated={(member, { isNew }) => {
          onLoginSuccess(member.displayName);
          onClose();
          if (isNew) router.push(`/onboarding?returnTo=${encodeURIComponent(here)}`);
        }}
      />
    </DialogShell>
  );
};

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

/** Logging out is not destructive, so this is a calm confirmation, not a red warning */
export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose, onConfirmLogout }) => {
  if (!isOpen) return null;

  return (
    <DialogShell onClose={onClose} size="sm" title="ออกจากระบบใช่ไหม" subtitle="บัญชีและสิ่งที่คุณโพสต์ ยังอยู่เหมือนเดิม กลับมาเข้าสู่ระบบได้ทุกเมื่อ">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" data-autofocus onClick={onClose} className={dialogButton.quiet}>
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirmLogout();
            onClose();
          }}
          className={dialogButton.secondary}
        >
          ออกจากระบบ
        </button>
      </div>
    </DialogShell>
  );
};
