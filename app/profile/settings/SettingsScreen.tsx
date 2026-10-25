'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { Navbar } from '@/components/Navbar';
import { dialogButton } from '@/components/auth/DialogShell';
import type { HostApplication, PublicMember } from '@/lib/members/types';
import { useAuth } from '@/lib/useAuth';
import { AccountCard, HostCard, TrustCard } from '../ProfileScreen';

const SECTION = 'mt-10 pt-8 border-t border-slate-200 first:mt-0 first:pt-0 first:border-t-0';

/**
 * ตั้งค่าบัญชี (owner 2026-10-25): what used to sit at the end of my profile, so the profile shows only who I am.
 * Reached from the gear on my profile and "ตั้งค่าบัญชี" in the profile menu.
 */
export function SettingsScreen() {
  const { isLoggedIn, isAuthReady, member, handleSetIsLoggedIn } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [own, setOwn] = useState<{ member: PublicMember; hostApplication: HostApplication | null } | null | 'signin'>(null);
  const memberId = member?.id;

  useEffect(() => {
    if (!isAuthReady) return;
    let active = true;
    if (!memberId) {
      Promise.resolve().then(() => active && setOwn('signin'));
      return;
    }
    fetch('/api/auth/member/profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active) setOwn(json?.member ? { member: json.member, hostApplication: json.hostApplication ?? null } : 'signin');
      })
      .catch(() => active && setOwn('signin'));
    return () => {
      active = false;
    };
  }, [isAuthReady, memberId, reload]);

  // Links such as /profile/settings#host land on their card once it has loaded
  const loaded = Boolean(own && own !== 'signin');
  useEffect(() => {
    if (!loaded || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [loaded]);

  const changed = () => {
    handleSetIsLoggedIn(true);
    setReload((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Navbar
        showMenuOnMobile
        activeTab="profile"
        setActiveTab={() => undefined}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-28 lg:pb-16">
        <Link href="/profile" className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          โปรไฟล์ของฉัน
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">ตั้งค่าบัญชี</h1>

        {own === null && (
          <p className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-500" role="status">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            กำลังโหลด…
          </p>
        )}

        {own === 'signin' && (
          <div className="mt-8">
            <p className="text-sm font-medium text-slate-600 mb-4">เข้าสู่ระบบก่อน เพื่อดูการตั้งค่าบัญชี</p>
            <button type="button" onClick={() => setIsAuthOpen(true)} className={dialogButton.primary}>เข้าสู่ระบบ</button>
          </div>
        )}

        {own && own !== 'signin' && (
          <div className="mt-8">
            <div className={SECTION}>
              <TrustCard member={own.member} onChanged={changed} />
            </div>
            <div className={SECTION}>
              <HostCard member={own.member} application={own.hostApplication} onChanged={changed} />
            </div>
            <div className={SECTION}>
              <AccountCard member={own.member} onLogout={() => setIsLogoutOpen(true)} />
            </div>
          </div>
        )}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirmLogout={() => handleSetIsLoggedIn(false)} />
    </div>
  );
}
