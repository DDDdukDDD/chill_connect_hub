'use client';

import React, { useCallback, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { useAuth } from '@/lib/useAuth';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);
  const requireLogin = useCallback((actionTitle?: string) => setMembershipAction(actionTitle ?? 'เพื่อกดใจ คอมเมนต์ และบันทึกโมเมนต์'), []);

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
      {toastMessage && (
        <div role="status" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-sm font-bold max-w-[90vw] text-center">
          {toastMessage}
        </div>
      )}
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
