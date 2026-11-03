'use client';

import React from 'react';
import type { OrganizerNeed } from '@/lib/members/types';
import { DialogShell, dialogButton } from './DialogShell';
import { PhoneVerifyForm } from './PhoneVerifyForm';

/** What a member still has to do before opening something that brings people out to meet (lib/members/trust.ts, organizerNeeds) */
export function OrganizerGateDialog({ need, hasEmail, onClose }: { need: OrganizerNeed; hasEmail: boolean; onClose: () => void }) {
  return (
    <DialogShell
      onClose={onClose}
      size="sm"
      title={need === 'phone' ? 'ยืนยันเบอร์โทรก่อนนะ' : 'อีกนิดเดียว ก็สร้างได้แล้ว'}
      subtitle={
        need === 'phone'
          ? 'คนที่ชวนเพื่อนออกไปเจอกันต้องยืนยันเบอร์โทร เพื่อให้ทุกคนมั่นใจว่าไปกับคนจริง เราไม่แสดงเบอร์นี้ให้ใครเห็น'
          : need === 'pledge'
            ? 'รับคำมั่นของคอมมูนิตี้ก่อน แล้วค่อยกลับมาสร้างได้เลย'
            : hasEmail
              ? 'ยืนยันอีเมลของคุณก่อน แล้วค่อยกลับมาสร้างได้เลย'
              : 'ตอนนี้การสร้างเปิดให้บัญชีที่ยืนยันอีเมลก่อน อีกไม่นานจะยืนยันด้วยเบอร์โทรได้ โพสต์และเข้าร่วมตี้ได้ตามปกตินะ'
      }
    >
      {need === 'phone' ? (
        <PhoneVerifyForm />
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
