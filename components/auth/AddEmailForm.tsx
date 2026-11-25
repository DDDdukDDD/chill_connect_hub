'use client';

import React, { useState } from 'react';
import { dialogButton } from '@/components/auth/DialogShell';
import { memberActions } from '@/lib/useMemberSession';

/**
 * For an account without a password (LINE gives no email): type an email, we send the link that confirms it. Opening
 * the link confirms the account, and what waited for it (opening a ตี้, a trip) is open on the next visit.
 * Server: POST /api/auth/member/email (docs/API.md).
 */
export function AddEmailForm({ initialEmail = '', returnTo }: { initialEmail?: string; returnTo?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await memberActions.addEmail(email.trim(), returnTo);
      setSentTo(email.trim());
      setDevUrl(result.devVerifyUrl ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งลิงก์ไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setBusy(false);
    }
  };
  const input = 'w-full min-h-11 px-4 rounded-2xl border border-slate-300 text-base font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]';

  if (sentTo) {
    return (
      <div className="space-y-3" role="status">
        <p className="text-sm font-semibold text-slate-700">
          ส่งลิงก์ไปที่ <span className="font-bold text-slate-900 break-all">{sentTo}</span> แล้ว เปิดอีเมลแล้วกดลิงก์ ลิงก์ใช้ได้ 48 ชั่วโมง ถ้าไม่เห็น ลองดูในอีเมลขยะ
        </p>
        {devUrl && (
          <p className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
            โหมดพัฒนา: ยังไม่ได้ตั้งค่าระบบส่งอีเมล <a href={devUrl} className="text-[#2563EB] underline break-all">กดลิงก์ยืนยันตรงนี้</a>
          </p>
        )}
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={dialogButton.quiet} disabled={busy} onClick={() => void send()}>{busy ? 'รอสักครู่…' : 'ส่งอีกครั้ง'}</button>
          <button type="button" className={dialogButton.quiet} disabled={busy} onClick={() => { setSentTo(''); setDevUrl(''); setError(''); }}>เปลี่ยนอีเมล</button>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <label className="block text-sm font-bold text-slate-800">
        อีเมลของคุณ
        <input className={`${input} mt-1.5`} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <p className="text-xs font-medium text-slate-500">เราใช้อีเมลนี้ยืนยันตัวตนเท่านั้น ไม่แสดงให้ใครเห็น</p>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
      <button type="submit" className={dialogButton.primary} disabled={busy || !email.trim()}>
        {busy ? 'รอสักครู่…' : 'ส่งลิงก์ยืนยัน'}
      </button>
    </form>
  );
}
