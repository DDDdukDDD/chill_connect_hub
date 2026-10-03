'use client';

import React, { useState } from 'react';
import { LogOut, ShieldCheck, Wrench } from 'lucide-react';
import { useAdminSession } from './AdminAuthGate';

/**
 * Shows the real, server-verified admin access state:
 * - signed-in admin session (with logout)
 * - local development with admin auth not configured (open access)
 */
export function AdminSessionStatus({ variant }: { variant: 'header' | 'sidebar' }) {
  const { session, logout } = useAdminSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLocalOpenAccess = !session.authRequired && !session.hasSession;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const label = isLocalOpenAccess ? 'Local · ไม่ต้องเข้าสู่ระบบ' : 'ผู้ดูแลระบบ';
  const detail = isLocalOpenAccess
    ? 'ยังไม่ได้ตั้งค่า ADMIN_PASSWORD / AUTH_SECRET'
    : 'เข้าสู่ระบบแล้ว · session 8 ชั่วโมง';
  const Icon = isLocalOpenAccess ? Wrench : ShieldCheck;
  const tone = isLocalOpenAccess
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/30';

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-2">
        <span
          title={detail}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${tone}`}
        >
          <Icon size={12} />
          <span className="hidden sm:block">{label}</span>
        </span>
        {session.hasSession && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="ออกจากระบบผู้ดูแล"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <LogOut size={12} />
            <span className="hidden md:block">ออกจากระบบ</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-700 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate" title={detail}>{detail}</p>
      </div>
    </div>
  );
}
