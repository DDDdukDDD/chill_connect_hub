'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { memberActions, useMemberSession } from '@/lib/useMemberSession';

/**
 * Shown when a member who has not confirmed their email or taken the pledge tries to post.
 * Says only what is still missing and lets them send the email link from here, without a trip to the profile.
 */
export function VerifyToPostDialog({ onClose }: { onClose: () => void }) {
  const session = useMemberSession();
  const trust = session.member?.trust;
  const needsEmail = !trust?.emailVerified;
  const needsPledge = !trust?.pledged;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [devUrl, setDevUrl] = useState('');

  const send = async () => {
    setBusy(true);
    setNote('');
    try {
      const result = await memberActions.sendEmailVerification();
      if (result.alreadyVerified) return window.location.reload();
      if (result.devVerifyUrl) setDevUrl(result.devVerifyUrl);
      setNote(result.sent || result.devVerifyUrl ? 'ส่งลิงก์ไปที่อีเมลของคุณแล้ว กดลิงก์ในอีเมล แล้วกลับมาโพสต์ได้เลย' : 'ระบบส่งอีเมลยังไม่พร้อม ลองใหม่ภายหลังนะ');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'ส่งลิงก์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const subtitle = needsEmail && needsPledge
    ? 'ยืนยันอีเมล และรับคำมั่นของเราก่อน เพื่อให้ที่นี่ปลอดภัยสำหรับทุกคน'
    : needsEmail
      ? `ยืนยันอีเมล ${session.member?.email ?? 'ของคุณ'} ก่อน แล้วโพสต์ได้เลย`
      : 'รับคำมั่น 4 ข้อของเราก่อน เพื่อให้ที่นี่ปลอดภัยสำหรับทุกคน';

  return (
    <DialogShell onClose={onClose} title="อีกนิดเดียว ก็โพสต์ได้แล้ว" subtitle={subtitle} size="sm">
      {note && <p role="status" className="mb-3 text-sm font-semibold text-slate-700">{note}</p>}
      {devUrl && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-bold text-amber-900">โหมดพัฒนา: ยังไม่ได้ตั้งค่าระบบส่งอีเมล ลิงก์จึงแสดงตรงนี้แทน</p>
          <a href={devUrl} className="mt-1 block text-xs font-bold text-[#2563EB] underline break-all">{devUrl}</a>
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2.5">
        <button type="button" className={dialogButton.quiet} onClick={onClose}>ไว้ทีหลัง</button>
        {needsEmail ? (
          <button type="button" className={dialogButton.primary} onClick={send} disabled={busy}>
            {busy ? 'กำลังส่ง…' : note ? 'ส่งลิงก์อีกครั้ง' : 'ส่งลิงก์ยืนยันอีเมล'}
          </button>
        ) : (
          <Link href="/onboarding?step=pledge" className={dialogButton.primary}>อ่านคำมั่น</Link>
        )}
      </div>
    </DialogShell>
  );
}
