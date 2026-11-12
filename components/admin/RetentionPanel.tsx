'use client';

import React, { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { InviteIcon } from '@/components/icons/InviteIcon';
import type { RetentionWeek } from '@/lib/members/activeDays';
import type { InviteFunnel } from '@/lib/social/inviteFunnel';

/**
 * Do new members come back (owner 2026-11-11)? One row per sign-up week: how many signed up, then the share who came
 * back the next day and within 7 days, posted, made a "ไปกัน" plan, and finished a starter challenge. Counting
 * comeback days began on 2026-11-11 (app.member_days), so earlier weeks show low "กลับมา" numbers.
 */

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const weekLabel = (ymd: string) => {
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]}`;
};

const COLUMNS: { key: keyof RetentionWeek; label: string }[] = [
  { key: 'back1', label: 'กลับมาวันถัดไป' },
  { key: 'back7', label: 'กลับมาใน 7 วัน' },
  { key: 'posted7', label: 'โพสต์ใน 7 วัน' },
  { key: 'planned7', label: 'มีแผนไปกัน' },
  { key: 'starter', label: 'ทำภารกิจแรก' },
];

function Share({ part, of }: { part: number; of: number }) {
  if (of === 0) return <span className="text-slate-400">–</span>;
  const percent = Math.round((part / of) * 100);
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`font-semibold ${percent >= 40 ? 'text-emerald-700' : percent >= 20 ? 'text-slate-900' : 'text-slate-500'}`}>{percent}%</span>
      <span className="text-[11px] text-slate-400">{part}</span>
    </span>
  );
}

export function RetentionPanel() {
  const [weeks, setWeeks] = useState<RetentionWeek[] | null>(null);
  const [invites, setInvites] = useState<InviteFunnel | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void fetch('/api/admin/retention', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) return setFailed(true);
        setWeeks(json.weeks);
        setInvites(json.invites ?? null);
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="retention-title">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Repeat size={16} className="text-slate-500" aria-hidden="true" />
        <h2 id="retention-title" className="text-sm font-bold text-slate-900">สมาชิกใหม่กลับมาไหม</h2>
        <span className="ml-auto text-[11px] text-slate-500">ตามสัปดาห์ที่สมัคร · เริ่มนับการกลับมา 11 พ.ย. 2026</span>
      </div>
      {failed ? (
        <p className="px-4 py-3 text-xs text-slate-500">โหลดตัวเลขไม่สำเร็จ กดรีเฟรชเพื่อลองใหม่</p>
      ) : weeks === null ? (
        <p className="px-4 py-3 text-xs text-slate-500">กำลังโหลด…</p>
      ) : weeks.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-500">ยังไม่มีสมาชิกใหม่ใน 8 สัปดาห์ที่ผ่านมา</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm tabular-nums">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-500">
                <th scope="col" className="px-4 py-2 font-semibold">สัปดาห์</th>
                <th scope="col" className="px-3 py-2 font-semibold">สมัคร</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col" className="px-3 py-2 font-semibold">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeks.map((w) => (
                <tr key={w.week}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-700 whitespace-nowrap">{weekLabel(w.week)}</th>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{w.signups}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5"><Share part={w[c.key] as number} of={w.signups} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    {invites && <InviteSteps funnel={invites} />}
    </>
  );
}

/**
 * "ชวนไป" step by step (owner 2026-11-12): each line with its share of the step it follows, so the drop-off shows.
 * Opens are counted from 12 พ.ย. 2026.
 */
function InviteSteps({ funnel }: { funnel: InviteFunnel }) {
  const steps: { label: string; value: number; of?: number }[] = [
    { label: 'แผนที่เกิดจากการกดชวนไป', value: funnel.plans },
    { label: 'ลิงก์ที่ส่งออกไป (LINE, แอปอื่น)', value: funnel.links },
    { label: 'ลิงก์ที่มีคนเปิด', value: funnel.linksOpened, of: funnel.links },
    { label: 'เพื่อนตอบไปกัน', value: funnel.yes },
    { label: 'ในนั้นสมัครใหม่เพราะคำชวน', value: funnel.yesNewMembers, of: funnel.yes },
    { label: 'ตอบรอบนี้ไม่สะดวก', value: funnel.declines },
    { label: 'แผนที่ได้วันนัด', value: funnel.dated, of: funnel.plans },
    { label: 'แผนที่ไปด้วยกันจริง (2 คนขึ้นไป)', value: funnel.wentTogether, of: funnel.plans },
    { label: 'แผนที่ปิดเพราะเงียบ 30 วัน', value: funnel.closedQuiet },
  ];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden" aria-labelledby="invite-steps-title">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <InviteIcon className="h-[17px] w-[39px] shrink-0" />
        <h2 id="invite-steps-title" className="text-sm font-bold text-slate-900">ชวนไป ทีละขั้น</h2>
        <span className="ml-auto text-[11px] text-slate-500">{funnel.days} วันล่าสุด · นับการเปิดลิงก์ตั้งแต่ 12 พ.ย. 2026</span>
      </div>
      <dl className="divide-y divide-slate-100 text-sm tabular-nums">
        {steps.map((step) => (
          <div key={step.label} className="flex items-baseline gap-3 px-4 py-2.5">
            <dt className="flex-1 text-slate-700">{step.label}</dt>
            <dd className="font-semibold text-slate-900">{step.value.toLocaleString()}</dd>
            <dd className="w-16 text-right">{step.of ? <span className="text-xs font-semibold text-slate-500">{Math.round((step.value / step.of) * 100)}%</span> : null}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
