'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Check, MapPin, MessageCircle, UserPlus } from 'lucide-react';
import { GroupChatModal } from '@/components/GroupChatModal';
import { DialogShell } from '@/components/auth/DialogShell';
import { MomentAvatar } from '@/components/moments/CommentThread';
import { openLineShare } from '@/components/moments/lineInvite';
import { InviteSheet } from '@/components/invites/InviteSheet';
import type { PlanView } from '@/lib/social/friendPlans';

/**
 * "ไปกัน" group plans in My Hub (owner 2026-11-10; groups 2026-11-11): every plan the member hosts, joined, or was
 * asked to. Tapping one opens the plan: who is going, talk it over in LINE (where Thai friends already talk) or in the
 * group chat, set the day, ask more friends. /myhub?plan=<id> (from the notices) opens the plan straight away.
 * Nothing shows while the member has no plan.
 */

const todayInBangkok = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function send(url: string, method: 'PATCH' | 'POST', body: unknown): Promise<{ ok: boolean; message?: string; plan?: PlanView; result?: string }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message, plan: json?.plan, result: json?.result };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}
const patchPlan = (id: string, body: unknown) => send(`/api/plans/${encodeURIComponent(id)}`, 'PATCH', body);

const verb = (plan: PlanView) => (plan.kind === 'quest' ? `ทำชาเลนจ์ ${plan.title}` : `ไป${plan.title}`);

/** LINE's ready-made message: the plan and a link back to it */
const lineText = (plan: PlanView) =>
  `${plan.dateLabel ? `นัด${verb(plan)} ${plan.dateLabel} นะ` : `${verb(plan)}กันวันไหนดี?`} ${window.location.origin}/myhub?plan=${encodeURIComponent(plan.id)}`;

/** Who is in it: the host first, a tick on whoever has been */
function People({ plan, max = 4 }: { plan: PlanView; max?: number }) {
  return (
    <span className="flex -space-x-2 shrink-0" aria-hidden="true">
      {plan.people.slice(0, max).map((p) => (
        <MomentAvatar key={p.id} name={p.name} src={p.avatar} className="w-9 h-9 text-xs ring-2 ring-white" />
      ))}
      {plan.people.length > max && <span className="w-9 h-9 rounded-full ring-2 ring-white bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center">+{plan.people.length - max}</span>}
    </span>
  );
}

function statusLine(plan: PlanView): string {
  if (plan.isInvited) return `${plan.host.name}ชวนคุณ · รอคุณตอบ`;
  const count = `${plan.people.length} คน`;
  const when = plan.isPast ? (plan.wentByMe ? 'ไปมาแล้ว' : `นัดไว้ ${plan.dateLabel}`) : plan.dateLabel ?? 'ยังไม่ได้นัดวัน';
  return [count, when, plan.invitedCount ? `รอตอบ ${plan.invitedCount}` : ''].filter(Boolean).join(' · ');
}

/**
 * Where, who, when. In the plan sheet it also leads with LINE and offers the group chat; pinned above the chat's
 * messages it shows the plan alone.
 */
function PlanCard({ plan, onChanged, onGone, onOpenChat, onInvite }: { plan: PlanView; onChanged: (plan: PlanView) => void; onGone: () => void; onOpenChat?: () => void; onInvite?: () => void }) {
  const inSheet = Boolean(onOpenChat);
  const [isPicking, setIsPicking] = useState(false);
  const [day, setDay] = useState(plan.date ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [askLeave, setAskLeave] = useState(false);
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
  const leave = async () => {
    setIsBusy(true);
    const result = await patchPlan(plan.id, { action: 'leave' });
    setIsBusy(false);
    if (!result.ok) return setError(result.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ');
    onGone();
  };

  return (
    <div className={inSheet ? 'space-y-4' : 'shrink-0 border-b border-slate-100 px-4 sm:px-5 py-3 space-y-2.5'}>
      <div className="flex items-center gap-3">
        {plan.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small thumb of the place
          <img src={plan.image} alt="" className="w-12 h-12 shrink-0 rounded-xl object-cover bg-slate-100" />
        ) : (
          <span className="w-12 h-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><MapPin className="w-5 h-5" aria-hidden="true" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{verb(plan)}</p>
          <p className={`text-[13px] font-medium ${plan.date ? 'text-slate-700' : 'text-slate-500'}`}>{plan.dateLabel ? `นัดกัน ${plan.dateLabel}` : 'ยังไม่ได้นัดวัน'}</p>
        </div>
        {plan.placeHref && (
          <Link href={plan.placeHref} className="shrink-0 h-9 px-3 inline-flex items-center rounded-full text-[13px] font-semibold text-slate-700 hover:bg-slate-100">
            ดูรายละเอียด
          </Link>
        )}
      </div>

      {inSheet && (
        <div>
          <p className="text-[13px] font-semibold text-slate-500 mb-1.5">ไปกัน {plan.people.length} คน{plan.invitedCount ? ` · รอตอบ ${plan.invitedCount}` : ''}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-2">
            {plan.people.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                <MomentAvatar name={p.name} src={p.avatar} className="w-7 h-7 text-[11px]" />
                <span className="max-w-[8rem] truncate">{p.name}</span>
                {p.went && <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="ไปมาแล้ว" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onOpenChat && (
        <div className="grid gap-2">
          <button type="button" onClick={() => openLineShare(lineText(plan))} className="h-11 rounded-full bg-[#06C755] hover:bg-[#05B34C] text-sm font-bold text-white inline-flex items-center justify-center gap-2 cursor-pointer">
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            คุยต่อใน LINE
          </button>
          <button type="button" onClick={onOpenChat} className="h-10 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
            แชตกลุ่มใน Chillwaa
          </button>
        </div>
      )}

      {isPicking ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`plan-day-${plan.id}`} className="sr-only">วันที่ไปกัน</label>
          <input id={`plan-day-${plan.id}`} type="date" min={plan.dateMin ?? todayInBangkok()} max={plan.dateMax} value={day} onChange={(e) => setDay(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900" />
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
          {onInvite && plan.spotsLeft > 0 && (
            <button type="button" onClick={onInvite} className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-800 cursor-pointer">
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              ชวนเพิ่ม
            </button>
          )}
          {plan.date && (
            <button type="button" onClick={() => save(null)} disabled={isBusy} className="h-9 px-3 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              ยังไม่แน่ใจวัน
            </button>
          )}
          {askLeave ? (
            <button type="button" onClick={leave} disabled={isBusy} className="ml-auto h-9 px-3 rounded-full text-[13px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
              {plan.isHost ? 'ยืนยันยกเลิกแผน' : 'ยืนยันออกจากแผน'}
            </button>
          ) : (
            <button type="button" onClick={() => setAskLeave(true)} className="ml-auto h-9 px-3 rounded-full text-[13px] font-medium text-slate-500 hover:bg-slate-100 cursor-pointer">
              {plan.isHost ? 'ยกเลิกแผน' : 'ออกจากแผน'}
            </button>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}

/** An invitation not answered yet: who asked, who is going, and the answer */
function InvitedCard({ plan, onAnswered, onGone }: { plan: PlanView; onAnswered: () => void; onGone: () => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const yes = async () => {
    setIsBusy(true);
    const result = await send('/api/invites/answer', 'POST', { planId: plan.id });
    setIsBusy(false);
    if (!result.ok) return setError(result.message || 'ตอบไม่สำเร็จ ลองอีกครั้งนะ');
    onAnswered();
  };
  const no = async () => {
    setIsBusy(true);
    const result = await patchPlan(plan.id, { action: 'leave' });
    setIsBusy(false);
    if (!result.ok) return setError(result.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ');
    onGone();
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <People plan={plan} />
        <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
          {plan.host.name}ชวนคุณ{verb(plan)}
          {plan.people.length > 1 ? ` · ไปกันแล้ว ${plan.people.length} คน` : ''}
        </p>
      </div>
      {plan.placeHref && (
        <Link href={plan.placeHref} className="inline-flex text-[13px] font-semibold text-slate-700 underline underline-offset-4">
          ดูรายละเอียด
        </Link>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={no} disabled={isBusy} className="h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 cursor-pointer disabled:opacity-60">
          ไม่สะดวก
        </button>
        <button type="button" onClick={yes} disabled={isBusy} className="h-11 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-sm font-bold text-white cursor-pointer disabled:opacity-60">
          ไปกัน
        </button>
      </div>
      {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export function FriendPlans({ onCount }: { onCount?: (count: number) => void }) {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [note, setNote] = useState('');
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

  // A notice links to /myhub?plan=<id>: open that plan once the plans are in
  const asked = searchParams.get('plan');
  useEffect(() => {
    if (asked && plans.some((p) => p.id === asked)) setOpenId(asked);
  }, [asked, plans]);

  const open = plans.find((p) => p.id === openId) ?? null;
  const chat = plans.find((p) => p.id === chatId) ?? null;
  const inviting = plans.find((p) => p.id === inviteId) ?? null;
  const close = () => {
    setOpenId(null);
    setNote('');
    if (asked) window.history.replaceState(window.history.state, '', window.location.pathname);
  };
  const changed = (next: PlanView) => setPlans((all) => all.map((p) => (p.id === next.id ? next : p)));
  const gone = (id: string) => {
    const left = plans.filter((p) => p.id !== id);
    setPlans(left);
    countRef.current?.(left.length);
    setChatId(null);
    close();
  };

  if (plans.length === 0) return null;
  return (
    <section aria-labelledby="friend-plans-title" className="space-y-2">
      <h2 id="friend-plans-title" className="text-base font-bold text-slate-900">แผนไปกันกับเพื่อน</h2>
      <ul className="divide-y divide-slate-100">
        {plans.map((plan) => (
          <li key={plan.id} className="flex items-center gap-3 py-2.5">
            <People plan={plan} max={3} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{verb(plan)}</p>
              <p className={`text-[13px] truncate ${plan.isInvited ? 'font-semibold text-[#E11D48]' : 'text-slate-600'}`}>{statusLine(plan)}</p>
            </div>
            {plan.isPast && !plan.wentByMe && plan.kind !== 'quest' && !plan.isInvited ? (
              <Link href={plan.postHref} className="shrink-0 h-9 px-3.5 inline-flex items-center rounded-full bg-slate-900 hover:bg-slate-800 text-[13px] font-bold text-white">
                โพสต์โมเมนต์
              </Link>
            ) : (
              <button type="button" onClick={() => setOpenId(plan.id)} className="shrink-0 h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-800 cursor-pointer">
                {plan.isInvited ? 'ตอบคำชวน' : plan.date ? 'ดูแผน' : 'นัดวันกัน'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {open && !chat && !inviting && (
        <DialogShell onClose={close} title={open.isInvited ? 'คำชวนไปกัน' : open.kind === 'quest' ? 'แผนทำด้วยกัน' : 'แผนไปกัน'} size="sm" focusField={false}>
          {open.isInvited ? (
            <InvitedCard
              plan={open}
              onAnswered={() => {
                void load();
                setChatId(open.id);
              }}
              onGone={() => gone(open.id)}
            />
          ) : (
            <>
              <PlanCard key={`sheet:${open.id}:${open.date ?? ''}`} plan={open} onChanged={changed} onGone={() => gone(open.id)} onOpenChat={() => setChatId(open.id)} onInvite={() => setInviteId(open.id)} />
              {note && <p role="status" className="mt-3 text-[13px] font-medium text-emerald-700">{note}</p>}
            </>
          )}
        </DialogShell>
      )}
      {inviting && (
        <InviteSheet
          target={inviting.invite}
          place={inviting.title}
          onClose={() => setInviteId(null)}
          onDone={(message) => {
            setInviteId(null);
            setNote(message);
            void load();
          }}
        />
      )}
      {chat && (
        <GroupChatModal
          isOpen
          onClose={() => setChatId(null)}
          event={null}
          roomId={chat.roomId}
          roomTitle={verb(chat)}
          subtitle={`ไปกัน ${chat.people.length} คน`}
          emptyText="ยังไม่มีข้อความ ทักกันแล้วเลือกวันที่ไปกันได้เลย"
          header={<PlanCard key={`chat:${chat.id}:${chat.date ?? ''}`} plan={chat} onChanged={changed} onGone={() => gone(chat.id)} />}
        />
      )}
    </section>
  );
}
