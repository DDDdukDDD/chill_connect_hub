'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Bookmark, Camera, Users } from 'lucide-react';
import { DialogShell, dialogButton } from './auth/DialogShell';
import { PhraseText } from './auth/PhraseText';

interface RequireMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  /** Opens the sign-up form in place; without it the button goes to /login?mode=signup */
  onOpenSignup?: () => void;
  /** Completes "เข้าสู่ระบบ …", e.g. "เพื่อเข้าร่วมกิจกรรม" */
  actionTitle?: string;
}

// What an account unlocks today (only things that work)
const PERKS = [
  { icon: Users, title: 'เข้าร่วมกิจกรรม และชาเลนจ์', desc: 'จองที่ในกิจกรรมคอมมูนิตี้ และรับภารกิจสะสม XP' },
  { icon: Camera, title: 'แชร์โมเมนต์ของคุณ', desc: 'โพสต์รูป กดไลก์ และคอมเมนต์โมเมนต์ของเพื่อน' },
  { icon: Bookmark, title: 'เก็บสิ่งที่ชอบ ไว้ดูทีหลัง', desc: 'บันทึกกิจกรรม ที่เที่ยว และโมเมนต์ที่ถูกใจ' },
];

/** Shown when a visitor tries something that needs an account */
export const RequireMembershipModal: React.FC<RequireMembershipModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenSignup,
  actionTitle = 'เพื่อดำเนินการต่อ',
}) => {
  const pathname = usePathname();
  if (!isOpen) return null;
  const signupHref = `/login?mode=signup&returnTo=${encodeURIComponent(pathname || '/')}`;

  return (
    <DialogShell onClose={onClose} title={`เข้าสู่ระบบ ${actionTitle}`} subtitle="สมัครฟรี ใช้เวลาไม่ถึง 1 นาที">
      <ul className="space-y-2.5 mb-6">
        {PERKS.map((perk) => {
          const Icon = perk.icon;
          return (
            <li key={perk.title} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200">
              <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-slate-900 leading-snug"><PhraseText text={perk.title} /></span>
                <span className="block text-xs font-medium text-slate-500 mt-0.5"><PhraseText text={perk.desc} /></span>
              </span>
            </li>
          );
        })}
      </ul>

      <Link
        href={signupHref}
        data-autofocus
        onClick={(e) => {
          onClose();
          if (onOpenSignup) {
            e.preventDefault();
            onOpenSignup();
          }
        }}
        className={`${dialogButton.primary} w-full`}
      >
        สมัครสมาชิกฟรี
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>

      <p className="pt-5 mt-6 border-t border-slate-100 text-center text-sm text-slate-600 font-medium">
        มีบัญชีอยู่แล้ว?{' '}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenLogin();
          }}
          className="font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap"
        >
          เข้าสู่ระบบ
        </button>
      </p>
    </DialogShell>
  );
};
