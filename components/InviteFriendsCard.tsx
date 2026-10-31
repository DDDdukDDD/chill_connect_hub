'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Share2, Ticket } from 'lucide-react';

type Invitee = { id: string; displayName: string; avatarUrl?: string; joinedAt: string; wentTogether: boolean };

/**
 * "ตั๋วเพื่อนซี้" (owner 2026-10-25): the member's invite link and the friends who signed up with it.
 * Its one job: get a friend to sign up and go to a ตี้ together. The reward comes from the challenge
 * (friend-ticket), once both are checked in at the same ตี้, never from the sign-up alone.
 */
export function InviteFriendsCard({ questHref = '/challenges/friend-ticket', className = '' }: { questHref?: string; className?: string }) {
  const [data, setData] = useState<{ url: string; invitees: Invitee[] } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/member/invite', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => alive && json.success && setData({ url: json.url, invitees: json.invitees }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null;
  const message = 'มาออกไปใช้ชีวิตด้วยกัน สมัคร Chillwaa ผ่านลิงก์นี้ แล้วไปตี้แรกด้วยกันนะ';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('คัดลอกลิงก์นี้', data.url);
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ชวนเพื่อนมา Chillwaa', text: message, url: data.url });
        return;
      } catch {
        return;
      }
    }
    void copy();
  };

  return (
    <div className={`rounded-3xl bg-[#FFF4C7] p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[#FFD84D] flex items-center justify-center shrink-0">
          <Ticket className="w-6 h-6 text-slate-900" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">ตั๋วเพื่อนซี้</h2>
          <p className="mt-0.5 text-sm text-slate-700 leading-relaxed">
            ชวนเพื่อนสมัครผ่านลิงก์ของคุณ แล้วไปตี้เดียวกัน ได้ XP ทั้งคู่{' '}
            <Link href={questHref} className="font-bold text-[#2563EB] hover:underline whitespace-nowrap">ดูกติกา</Link>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input readOnly value={data.url} aria-label="ลิงก์ชวนเพื่อนของคุณ" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 h-11 rounded-full border border-amber-200 bg-white px-4 text-sm text-slate-700" />
        <div className="flex gap-2">
          <button type="button" onClick={() => void copy()} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-white hover:bg-amber-50 border border-amber-200 text-sm font-bold text-slate-800 cursor-pointer">
            {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
          <button type="button" onClick={() => void share()} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-[#F26430] hover:bg-[#E2551F] text-white text-sm font-bold cursor-pointer">
            <Share2 className="w-4 h-4" aria-hidden="true" />
            ส่งให้เพื่อน
          </button>
        </div>
      </div>

      {data.invitees.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-800">เพื่อนที่สมัครผ่านลิงก์ของคุณ {data.invitees.length} คน</p>
          <ul className="mt-2 space-y-2">
            {data.invitees.map((friend) => (
              <li key={friend.id} className="flex items-center gap-3">
                {friend.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- member avatars from storage
                  <img src={friend.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold text-slate-600">{friend.displayName.slice(0, 1)}</span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{friend.displayName}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${friend.wentTogether ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600'}`}>
                  {friend.wentTogether ? 'ไปตี้ด้วยกันแล้ว' : 'ยังไม่ได้ไปตี้ด้วยกัน'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
