'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, LogOut, Loader2 } from 'lucide-react';

interface AdminSessionState {
  authenticated: boolean;
  hasSession: boolean;
  authRequired: boolean;
  loginAvailable: boolean;
}

async function fetchAdminSession(): Promise<AdminSessionState | Error> {
  try {
    const res = await fetch('/api/auth/admin', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'ไม่สามารถตรวจสอบสิทธิ์ผู้ดูแลได้');
    return data as AdminSessionState;
  } catch (error) {
    return error instanceof Error ? error : new Error('ไม่สามารถตรวจสอบสิทธิ์ผู้ดูแลได้');
  }
}

/**
 * Server-verified gate for the admin console.
 * Renders children only after /api/auth/admin confirms an admin session
 * (or local development without admin credentials configured).
 */
export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSessionState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const applySessionResult = useCallback((result: AdminSessionState | Error) => {
    if (result instanceof Error) setLoadError(result.message);
    else setSession(result);
  }, []);

  const refreshSession = useCallback(async () => {
    applySessionResult(await fetchAdminSession());
  }, [applySessionResult]);

  useEffect(() => {
    let cancelled = false;
    fetchAdminSession().then((result) => {
      if (!cancelled) applySessionResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applySessionResult]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      setPassword('');
      await refreshSession();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/admin', { method: 'DELETE' });
    await refreshSession();
  };

  if (session?.authenticated) {
    return (
      <>
        {children}
        {session.hasSession && (
          <button
            onClick={handleLogout}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <LogOut size={14} />
            ออกจากระบบผู้ดูแล
          </button>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 sm:p-8">
        <div className="w-12 h-12 mb-5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          {session || loadError ? <Lock size={22} className="text-slate-500" /> : <Loader2 size={22} className="text-slate-400 animate-spin" />}
        </div>
        <h1 className="text-lg sm:text-xl font-black text-slate-900 mb-1">Admin Console</h1>

        {!session && !loadError && (
          <p className="text-xs sm:text-sm font-bold text-slate-500">กำลังตรวจสอบสิทธิ์ผู้ดูแล...</p>
        )}

        {loadError && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-bold text-rose-600">{loadError}</p>
            <button
              onClick={() => {
                setLoadError(null);
                refreshSession();
              }}
              className="w-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-2xs transition-colors"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {session && !session.loginAvailable && (
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            ยังไม่ได้ตั้งค่าการเข้าสู่ระบบผู้ดูแลบนเซิร์ฟเวอร์ (ADMIN_PASSWORD และ AUTH_SECRET)
          </p>
        )}

        {session && session.loginAvailable && (
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div>
              <label htmlFor="admin-password" className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5">
                รหัสผ่านผู้ดูแลระบบ:
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                required
              />
            </div>
            {loginError && <p className="text-xs sm:text-sm font-bold text-rose-600">{loginError}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              เข้าสู่ระบบ
            </button>
          </form>
        )}

        <Link href="/" className="block mt-5 text-center text-xs font-semibold text-slate-500 hover:text-slate-700">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
