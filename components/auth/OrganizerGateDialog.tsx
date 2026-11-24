'use client';

import React from 'react';
import type { OrganizerNeed, PublicMember } from '@/lib/members/types';
import { AddEmailForm } from './AddEmailForm';
import { DialogShell, dialogButton } from './DialogShell';
import { PhoneVerifyForm } from './PhoneVerifyForm';

/** An account without a password (LINE, Google, Facebook, Apple) adds or changes its email here; a sub-account uses its owner's */
export const canAddEmail = (member: PublicMember | null | undefined) => Boolean(member && !member.isSubAccount && !member.loginMethods.includes('email'));

/** What a member still has to do before opening something that brings people out to meet (lib/members/trust.ts, organizerNeeds) */
export function OrganizerGateDialog({ need, member, onClose }: { need: OrganizerNeed; member: PublicMember | null | undefined; onClose: () => void }) {
  const hasEmail = Boolean(member?.trust?.hasEmail);
  const addsEmail = need === 'email' && canAddEmail(member);
  return (
    <DialogShell
      onClose={onClose}
      size="sm"
      title={need === 'phone' ? 'ยืนยันเบอร์โทรก่อนนะ' : 'อีกนิดเดียว ก็สร้างได้แล้ว'}
      subtitle={
        need === 'phone'
          ? 'คนที่ชวนเพื่อนออกไปเจอกัน ต้องยืนยันเบอร์โทร เพื่อให้ทุกคนมั่นใจ ว่าไปกับคนจริง เราไม่แสดงเบอร์นี้ ให้ใครเห็น'
          : need === 'pledge'
            ? 'รับคำมั่นของคอมมูนิตี้ก่อน แล้วค่อยกลับมาสร้างได้เลย'
            : addsEmail
              ? 'คนที่ชวนเพื่อนออกไปเจอกัน ต้องยืนยันอีเมล ใส่อีเมลแล้วกดลิงก์ที่เราส่งไป ก็สร้างได้เลย'
              : hasEmail
                ? 'ยืนยันอีเมลของคุณก่อน แล้วค่อยกลับมาสร้างได้เลย'
                : 'บัญชีหลักต้องยืนยันอีเมลก่อน แล้วบัญชีนี้ก็สร้างได้เลย'
      }
    >
      {need === 'phone' ? (
        <PhoneVerifyForm />
      ) : addsEmail ? (
        <AddEmailForm initialEmail={member?.email} returnTo={typeof window === 'undefined' ? undefined : window.location.pathname} />
      ) : need === 'email' && !hasEmail ? (
        <div className="flex justify-center">
          <button type="button" className={dialogButton.primary} onClick={onClose}>เข้าใจแล้ว</button>
        </div>
      ) : (
        <div className="flex justify-center">
          <a href={need === 'pledge' ? '/onboarding?step=pledge' : '/profile/settings#trust'} className={dialogButton.primary}>
            {need === 'pledge' ? 'อ่านคำมั่น' : 'ไปที่ตั้งค่าบัญชี'}
          </a>
        </div>
      )}
    </DialogShell>
  );
}
