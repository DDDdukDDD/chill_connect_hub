'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';
import { Toast } from '@/components/Toast';

export interface MomentsChromeContext {
  isLoggedIn: boolean;
  isAuthReady: boolean;
  /** Opens the "members only" dialog; `actionTitle` says what membership is for */
  requireLogin: (actionTitle?: string) => void;
  showToast: (message: string) => void;
}

/** Top bar, bottom bar, sign-in dialogs and the toast for the /moments pages; the page content is a render function */
export function MomentsChrome({ children }: { children: (context: MomentsChromeContext) => React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('moments');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [membershipAction, setMembershipAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; at: number } | null>(null);
  const toastMessage = toast?.message ?? null;

  const showToast = useCallback((message: string) => setToast({ message, at: Date.now() }), []);
  // Each new message gets its own full three seconds, even when one comes right after another
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  const requireLogin = useCallback((actionTitle?: string) => setMembershipAction(actionTitle ?? 'กดใจ คุยกัน และเก็บโมเมนต์ที่ชอบไว้'), []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />
      <Toast message={toastMessage} />
      {children({ isLoggedIn, isAuthReady, requireLogin, showToast })}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <RequireMembershipModal
        isOpen={membershipAction !== null}
        onClose={() => setMembershipAction(null)}
        onOpenLogin={() => {
          setMembershipAction(null);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipAction ?? ''}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
        }}
      />
    </div>
  );
}
