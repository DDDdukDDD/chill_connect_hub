'use client';

import React, { useState } from 'react';
import { dialogButton } from '@/components/auth/DialogShell';
import { memberActions } from '@/lib/useMemberSession';

/**
 * Two steps on one spot: the number, then the code that went to it. On success the session updates, so whatever
 * was waiting for the check opens by itself.
 */
export function PhoneVerifyForm({ onDone }: { onDone?: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setBusy(false);
    }
  };

  const send = () => run(async () => {
    const result = await memberActions.sendPhoneCode(phone);
    setSentTo(phone);
    setCode('');
    setDevCode(result.devCode ?? '');
  });
  const confirm = () => run(async () => {
    await memberActions.confirmPhoneCode(code);
    onDone?.();
  });
  const input = 'w-full min-h-11 px-4 rounded-2xl border border-slate-300 text-base font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]';

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void (sentTo ? confirm() : send());
      }}
    >
      {sentTo ? (
        <label className="block text-sm font-bold text-slate-800">
          รหัส 6 หลักที่ส่งไปที่ {sentTo}
          <input className={`${input} mt-1.5`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        </label>
      ) : (
        <label className="block text-sm font-bold text-slate-800">
          เบอร์มือถือของคุณ
          <input className={`${input} mt-1.5`} type="tel" inputMode="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      )}
      {devCode && <p className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">โหมดพัฒนา: ยังไม่ได้ต่อระบบ SMS รหัสคือ {devCode}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" className={dialogButton.primary} disabled={busy || (sentTo ? code.length !== 6 : !phone.trim())}>
          {busy ? 'รอสักครู่…' : sentTo ? 'ยืนยันรหัส' : 'ส่งรหัสให้ฉัน'}
        </button>
        {sentTo && (
          <button type="button" className={dialogButton.quiet} disabled={busy} onClick={() => { setSentTo(''); setDevCode(''); setError(''); }}>เปลี่ยนเบอร์</button>
        )}
      </div>
    </form>
  );
}
