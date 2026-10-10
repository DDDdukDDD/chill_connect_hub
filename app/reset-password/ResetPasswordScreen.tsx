'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { memberActions } from '@/lib/useMemberSession';

const MIN_PASSWORD = 8;

export function ResetPasswordScreen({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? '' : 'ลิงก์ไม่ครบ กรุณาเปิดลิงก์จากอีเมลอีกครั้ง หรือขอลิงก์ใหม่');
  const [submitted, setSubmitted] = useState(false);

  const tooShort = password.length < MIN_PASSWORD;
  const mismatch = confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!token || tooShort || mismatch) return;
    setBusy(true);
    setError('');
    try {
      await memberActions.confirmPasswordReset(token, password);
      router.replace('/myhub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ตั้งรหัสผ่านไม่สำเร็จ');
      setBusy(false);
    }
  };

  const input =
    'w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 aria-[invalid=true]:border-rose-400';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 border-b border-[#E8E2D8] bg-white/80">
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-[#1E293B]">Chill & Connect Hub</span>
        </Link>
      </header>
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-10 flex flex-col justify-center">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-7 sm:p-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <KeyRound className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-center">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-slate-500 font-medium text-center mt-2 mb-6">ตั้งแล้วอุปกรณ์อื่นที่เคยเข้าสู่ระบบไว้จะถูกออกจากระบบ</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-sm font-bold text-slate-800">รหัสผ่านใหม่</label>
              <div className="relative">
                <input id="new-password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={(submitted && tooShort) || undefined} className={input} />
                <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={visible} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                  {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-xs font-medium ${submitted && tooShort ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>อย่างน้อย {MIN_PASSWORD} ตัวอักษร</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-800">ยืนยันรหัสผ่านใหม่</label>
              <input id="confirm-password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={(submitted && mismatch) || undefined} className={input} />
              {submitted && mismatch && <p className="text-xs font-bold text-rose-600">รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>}
            </div>
            {error && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {error}{' '}
                  <Link href="/login" className="underline">ขอลิงก์ใหม่</Link>
                </span>
              </div>
            )}
            <button type="submit" disabled={busy || !token} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 px-6 rounded-full font-extrabold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">
              {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              <span>{busy ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
