'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, MapPin, MessageCircle } from 'lucide-react';
import { GroupChatModal } from '@/components/GroupChatModal';
import type { PlanView } from '@/lib/social/friendPlans';

/**
 * "ไปกัน" plans in My Hub (owner 2026-11-10): each plan made when a friend answered "ไปกัน" on a post. Tapping one
 * opens the two-person chat with the plan pinned on top, where the day is set. /myhub?plan=<id> (from the notices)
 * opens that chat straight away. Nothing shows while the member has no plan.
 */

const todayInBangkok = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function patchPlan(id: string, body: unknown): Promise<{ ok: boolean; message?: string; plan?: PlanView }> {
  try {
    const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message, plan: json?.plan };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

/** Pinned above the messages: where, when, and the day picker */
function PlanCard({ plan, onChanged, onCancelled }: { plan: PlanView; onChanged: (plan: PlanView) => void; onCancelled: () => void }) {
  const [isPicking, setIsPicking] = useState(false);
  const [day, setDay] = useState(plan.date ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [askCancel, setAskCancel] = useState(false);
  const [error, setError] = useState('');

  const save = async (date: string | null) => {
    setIsBusy(true);
    setError('');
    const result = await patchPlan(plan.id, { date });
    setIsBusy(false);
    if (!result.ok || !result.plan) return setError(result.message || 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
    setIsPicking(false);
    onChanged(result.plan);
  };
  const cancel = async () => {
    setIsBusy(true);
    const result = await patchPlan(plan.id, { action: 'cancel' });
    setIsBusy(false);
    if (!result.ok) return setError(result.message || 'ยกเลิกไม่สำเร็จ ลองอีกครั้งนะ');
    onCancelled();
  };

  return (
    <div className="shrink-0 border-b border-slate-100 px-4 sm:px-5 py-3 space-y-2.5">
      <div className="flex items-center gap-3">
        {plan.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small thumb of the post's own photo
          <img src={plan.image} alt="" className="w-12 h-12 shrink-0 rounded-xl object-cover bg-slate-100" />
        ) : (
          <span className="w-12 h-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><MapPin className="w-5 h-5" aria-hidden="true" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">ไป{plan.title}</p>
          <p className={`text-[13px] font-medium ${plan.date ? 'text-slate-700' : 'text-slate-500'}`}>{plan.dateLabel ? `นัดกัน ${plan.dateLabel}` : 'ยังไม่ได้นัดวัน คุยกันแล้วเลือกวันได้เลย'}</p>
        </div>
        {plan.placeHref && (
          <Link href={plan.placeHref} className="shrink-0 h-9 px-3 inline-flex items-center rounded-full text-[13px] font-semibold text-slate-700 hover:bg-slate-100">
            ดูที่นี่
          </Link>
        )}
      </div>

      {isPicking ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`plan-day-${plan.id}`} className="sr-only">วันที่ไปกัน</label>
          <input id={`plan-day-${plan.id}`} type="date" min={todayInBangkok()} value={day} onChange={(e) => setDay(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900" />
          <button type="button" onClick={() => day && save(day)} disabled={!day || isBusy} className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white disabled:opacity-50 cursor-pointer">
            บันทึกวันนัด
          </button>
          <button type="button" onClick={() => setIsPicking(false)} className="h-10 px-3 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
            ยกเลิก
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setIsPicking(true)} className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-800 cursor-pointer">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            {plan.date ? 'เปลี่ยนวัน' : 'เลือกวันที่ไปกัน'}
          </button>
          {plan.date && (
            <button type="button" onClick={() => save(null)} disabled={isBusy} className="h-9 px-3 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              ยังไม่แน่ใจวัน
            </button>
          )}
          {askCancel ? (
            <button type="button" onClick={cancel} disabled={isBusy} className="ml-auto h-9 px-3 rounded-full text-[13px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
              ยืนยันยกเลิกแผน
            </button>
          ) : (
            <button type="button" onClick={() => setAskCancel(true)} className="ml-auto h-9 px-3 rounded-full text-[13px] font-medium text-slate-500 hover:bg-slate-100 cursor-pointer">
              ยกเลิกแผน
            </button>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export function FriendPlans({ onCount }: { onCount?: (count: number) => void }) {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  // Held in a ref: the page passes a new function each render, which must not reload the plans
  const countRef = useRef(onCount);
  useEffect(() => {
    countRef.current = onCount;
  });

  const load = useCallback(async () => {
    const json = await fetch('/api/plans', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const list: PlanView[] = Array.isArray(json?.plans) ? json.plans : [];
    setPlans(list);
    countRef.current?.(list.length);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // A notice links to /myhub?plan=<id>: open that chat once the plans are in
  const asked = searchParams.get('plan');
  useEffect(() => {
    if (asked && plans.some((p) => p.id === asked)) setOpenId(asked);
  }, [asked, plans]);

  const open = plans.find((p) => p.id === openId) ?? null;
  const close = () => {
    setOpenId(null);
    if (asked) window.history.replaceState(window.history.state, '', window.location.pathname);
  };

  if (plans.length === 0) return null;
  return (
    <section aria-labelledby="friend-plans-title" className="space-y-2">
      <h2 id="friend-plans-title" className="text-base font-bold text-slate-900">แผนไปกันกับเพื่อน</h2>
      <ul className="divide-y divide-slate-100">
        {plans.map((plan) => (
          <li key={plan.id} className="flex items-center gap-3 py-2.5">
            {plan.friend.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- member avatar
              <img src={plan.friend.avatar} alt="" className="w-10 h-10 shrink-0 rounded-full object-cover bg-slate-100" />
            ) : (
              <span className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-sm font-bold text-slate-600 flex items-center justify-center" aria-hidden="true">{plan.friend.name.trim().charAt(0).toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">ไป{plan.title}</p>
              <p className="text-[13px] text-slate-600 truncate">
                กับ {plan.friend.name} · {plan.isPast ? (plan.wentByMe ? 'ไปมาแล้ว' : `นัดไว้ ${plan.dateLabel}`) : plan.dateLabel ?? 'ยังไม่ได้นัดวัน'}
              </p>
            </div>
            {plan.isPast && !plan.wentByMe ? (
              <Link href={plan.postHref} className="shrink-0 h-9 px-3.5 inline-flex items-center rounded-full bg-slate-900 hover:bg-slate-800 text-[13px] font-bold text-white">
                โพสต์โมเมนต์
              </Link>
            ) : (
              <button type="button" onClick={() => setOpenId(plan.id)} className="shrink-0 h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-800 cursor-pointer">
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                {plan.date ? 'แชต' : 'คุยนัดวัน'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {open && (
        <GroupChatModal
          isOpen
          onClose={close}
          event={null}
          roomId={open.roomId}
          roomTitle={open.friend.name}
          subtitle={`แผนไป${open.title}`}
          emptyText="ยังไม่มีข้อความ ทักกันแล้วเลือกวันที่ไปกันได้เลย"
          header={
            <PlanCard
              key={`${open.id}:${open.date ?? ''}`}
              plan={open}
              onChanged={(next) => setPlans((all) => all.map((p) => (p.id === next.id ? next : p)))}
              onCancelled={() => {
                const left = plans.filter((p) => p.id !== open.id);
                setPlans(left);
                countRef.current?.(left.length);
                close();
              }}
            />
          }
        />
      )}
    </section>
  );
}
