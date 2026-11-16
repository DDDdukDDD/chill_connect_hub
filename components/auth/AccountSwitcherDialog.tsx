'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Loader2, Plus } from 'lucide-react';
import { DialogShell, dialogButton } from './DialogShell';
import { PhraseText } from './PhraseText';
import { nameInitial } from '@/lib/displayName';
import { avatarImage } from '@/lib/optimizedImage';
import { memberActions } from '@/lib/useMemberSession';
import type { AccountChoice } from '@/lib/members/types';
import { useNameCheck } from '@/lib/useNameCheck';
import { NameCheckHint } from './NameCheckHint';

const inputClass =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

function Avatar({ account, size = 'w-11 h-11' }: { account: Pick<AccountChoice, 'displayName' | 'avatarUrl'>; size?: string }) {
  return (
    <span className={`${size} shrink-0 rounded-full overflow-hidden bg-slate-100 text-slate-600 text-base font-bold flex items-center justify-center`}>
      {account.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads or a provider
        <img src={avatarImage(account.avatarUrl, 96)} alt="" className="w-full h-full object-cover" />
      ) : (
        nameInitial(account.displayName, 'C')
      )}
    </span>
  );
}

/**
 * Switch between the member's own accounts, or make a new one, like Instagram (BE-393). A new account has no email:
 * it is reached through these accounts only. After a switch the page reloads, so nothing of the last account stays.
 */
export function AccountSwitcherDialog({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<{ accounts: AccountChoice[]; canCreate: boolean; max: number } | null>(null);
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameCheck = useNameCheck(name, { enabled: creating, forNewAccount: true });

  useEffect(() => {
    let alive = true;
    memberActions
      .listAccounts()
      .then((result) => alive && setData(result))
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'โหลดรายชื่อบัญชีไม่สำเร็จ'));
    return () => {
      alive = false;
    };
  }, []);

  const switchTo = async (account: AccountChoice) => {
    if (account.isCurrent || !account.available || switching) return;
    setSwitching(account.id);
    setError('');
    try {
      await memberActions.switchAccount(account.id);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สลับบัญชีไม่สำเร็จ');
      setSwitching(null);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setFieldError('ตั้งชื่ออย่างน้อย 2 ตัวอักษรนะ');
    if (nameCheck.state === 'taken') return setFieldError(nameCheck.message ?? 'ชื่อนี้มีคนใช้แล้ว');
    if (!consent) return setFieldError('ติ๊กยอมรับข้อกำหนดก่อนนะ');
    setFieldError('');
    setError('');
    setBusy(true);
    try {
      await memberActions.createSubAccount({ displayName: name.trim(), consent });
      // A new account starts with onboarding, then comes back to its profile. A full load, so nothing of the last account stays
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full page load after a session change
      window.location.href = '/onboarding?returnTo=%2Fprofile';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างบัญชีไม่สำเร็จ');
      setBusy(false);
    }
  };

  if (creating) {
    return (
      <DialogShell onClose={onClose} size="sm" title="สร้างบัญชีใหม่" subtitle="ไม่ต้องใช้อีเมล สลับเข้าได้จากบัญชีของคุณ">
        <form onSubmit={create} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="sub-account-name" className="block text-xs sm:text-sm font-bold text-slate-800">ชื่อที่แสดงของบัญชีใหม่</label>
            <input id="sub-account-name" autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={nameCheck.state === 'taken' || undefined} aria-describedby="sub-account-name-check" className={`${inputClass} aria-[invalid=true]:border-rose-400`} />
            <NameCheckHint check={nameCheck} id="sub-account-name-check" />
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed list-disc pl-5">
            <li><PhraseText text="คนอื่นจะเห็นเป็นอีกบัญชีหนึ่ง ไม่เห็นว่าเป็นของคุณ" /></li>
            <li><PhraseText text="บัญชีของคุณเข้าตี้ ทริป หรือกลุ่มเดียวกันไม่ได้" /></li>
            <li><PhraseText text="ถ้าลบบัญชีหลัก บัญชีนี้จะถูกลบไปด้วย" /></li>
          </ul>
          <label className="flex items-start gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#2563EB]" />
            <span>
              บัญชีนี้เป็นของฉัน และฉันยอมรับ{' '}
              <Link href="/legal" target="_blank" className="whitespace-nowrap font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">ข้อกำหนดการใช้งาน</Link>
              {' '}สำหรับบัญชีนี้
            </span>
          </label>
          {fieldError && <p className="text-xs font-bold text-rose-600">{fieldError}</p>}
          {error && <p role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setCreating(false); setError(''); }} className={dialogButton.quiet}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              กลับ
            </button>
            <button type="submit" disabled={busy} className={dialogButton.primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {busy ? 'กำลังสร้าง…' : 'สร้างบัญชี'}
            </button>
          </div>
        </form>
      </DialogShell>
    );
  }

  return (
    <DialogShell onClose={onClose} size="sm" title="สลับบัญชี" focusField={false}>
      {!data && !error && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm font-bold text-slate-500" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          กำลังโหลด…
        </p>
      )}
      {data && (
        <ul className="space-y-2">
          {data.accounts.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => switchTo(account)}
                disabled={!account.available || Boolean(switching)}
                aria-current={account.isCurrent ? 'true' : undefined}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${account.isCurrent ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-200 hover:bg-slate-50 cursor-pointer'} disabled:cursor-default`}
              >
                <Avatar account={account} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 truncate">{account.displayName}</span>
                  <span className="block text-xs text-slate-500">{!account.available ? 'ถูกระงับอยู่' : account.isOwner ? 'บัญชีหลัก' : 'บัญชีย่อย'}</span>
                </span>
                {switching === account.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" aria-label="กำลังสลับบัญชี" />
                ) : (
                  account.isCurrent && <Check className="w-5 h-5 text-[#2563EB]" aria-label="บัญชีที่ใช้อยู่" />
                )}
              </button>
            </li>
          ))}
          <li>
            {data.canCreate ? (
              <button type="button" onClick={() => setCreating(true)} disabled={Boolean(switching)} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-50 text-left cursor-pointer">
                <span className="w-11 h-11 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-800">สร้างบัญชีใหม่</span>
              </button>
            ) : (
              <p className="px-1 pt-1 text-xs text-slate-500">
                <PhraseText text={data.accounts.length >= data.max ? `มีได้สูงสุด ${data.max} บัญชีรวมบัญชีหลัก` :'ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ที่บัญชีหลักก่อน จึงจะสร้างบัญชีเพิ่มได้'} />
              </p>
            )}
          </li>
        </ul>
      )}
      {error && <p role="alert" className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700">{error}</p>}
    </DialogShell>
  );
}
