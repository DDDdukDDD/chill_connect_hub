'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Camera, Check, Share2, Undo2 } from 'lucide-react';
import type { QuestPlan } from '@/data/mockData';
import { MomentComposer, type MomentComposerInitial } from '@/components/moments/MomentComposer';
import { addDays, isFixedPlan, planNeeded, planSummary, planTotal, planWeekOf, taskOn, WEEKDAY_NAMES, WEEKDAY_SHORT, type PlanStatus } from '@/lib/social/questPlan';

/**
 * A challenge done by plan, on its page (owner 2026-11-07): the plan before joining; after, today's task with one
 * button to stamp it, how far along the member is, their weeks as a calendar, and ways to share it. Stamps go to
 * /api/quests/[id]/stamps; the server decides what counts (lib/social/questPlan.ts) and finishes the challenge.
 */

type Stamp = { day: string; momentId?: string };
type PlanState = { start: string; stamps: Stamp[]; status: PlanStatus };

const SECTION_TITLE = 'text-xl sm:text-2xl font-bold text-slate-900';
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const shortDay = (day: string) => `${Number(day.slice(8, 10))} ${THAI_MONTHS[Number(day.slice(5, 7)) - 1]}`;
/** Weeks shown around this one before "ดูทั้งหมด" */
const WEEKS_AROUND = 3;

async function send(questId: string, method: 'POST' | 'DELETE' | 'PATCH', body: unknown) {
  const res = await fetch(`/api/quests/${encodeURIComponent(questId)}/stamps`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json().catch(() => ({ success: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' }));
}

/** The progress as a picture to share: the title, how many, and a stamp card */
async function progressCard(title: string, done: number, needed: number): Promise<File | null> {
  const canvas = Object.assign(document.createElement('canvas'), { width: 1080, height: 1080 });
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily;
  await document.fonts?.load(`700 64px ${font}`, 'กA').catch(() => undefined);
  ctx.fillStyle = '#F5F3FF';
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = '#5B21B6';
  ctx.font = `600 40px ${font}`;
  ctx.fillText('ชาเลนจ์ของฉันบน Chillwaa', 90, 130);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 64px ${font}`;
  const words = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(title)].map((s) => s.segment) : [...title];
  const lines: string[] = [''];
  for (const word of words) {
    if (ctx.measureText(lines[lines.length - 1] + word).width > 900 && lines[lines.length - 1]) lines.push(word.trimStart());
    else lines[lines.length - 1] += word;
  }
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 90, 225 + i * 80));
  ctx.fillStyle = '#7C3AED';
  ctx.font = `700 150px ${font}`;
  ctx.fillText(`${done}/${needed}`, 90, 500);
  ctx.fillStyle = '#475569';
  ctx.font = `600 40px ${font}`;
  ctx.fillText(done >= needed ? 'ทำสำเร็จแล้ว' : `ทำไปแล้ว อีก ${needed - done} ครั้ง`, 90, 565);
  // The stamp card: one circle per time, filled when done
  const shown = Math.min(needed, 60);
  const perRow = shown > 40 ? 12 : shown > 18 ? 10 : 6;
  const gap = 900 / perRow;
  const r = Math.min(34, gap / 2 - 8);
  for (let i = 0; i < shown; i++) {
    const cx = 90 + gap / 2 + (i % perRow) * gap;
    const cy = 690 + Math.floor(i / perRow) * gap;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const filled = i < Math.round((done / needed) * shown);
    ctx.fillStyle = filled ? '#7C3AED' : '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = filled ? '#7C3AED' : '#C4B5FD';
    ctx.stroke();
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return blob ? new File([blob], 'challenge-progress.jpg', { type: 'image/jpeg' }) : null;
}

export function ChallengePlan({ questId, title, plan, joined, isEnded, onProgress, onToast }: {
  questId: string;
  title: string;
  plan: QuestPlan;
  joined: boolean;
  isEnded: boolean;
  /** After a stamp: the page reloads its progress and reward */
  onProgress: () => void;
  onToast: (message: string) => void;
}) {
  const [state, setState] = useState<PlanState | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [composer, setComposer] = useState<(MomentComposerInitial & { stampDay: 'today' | 'yesterday' | null }) | null>(null);
  const needed = planNeeded(plan);
  const total = planTotal(plan);

  const load = useCallback(async () => {
    const json = await fetch(`/api/quests/${encodeURIComponent(questId)}/stamps`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (json?.success) setState(json.state ?? null);
  }, [questId]);
  useEffect(() => {
    if (joined) void load();
  }, [joined, load]);

  const stamp = async (day: 'today' | 'yesterday') => {
    setIsBusy(true);
    const json = await send(questId, 'POST', { day });
    setIsBusy(false);
    if (!json.success) return onToast(json.message || 'stamp ไม่สำเร็จ ลองอีกครั้งนะ');
    setState(json.state);
    onProgress();
    onToast(json.finished ? 'ครบแผนแล้ว ทำสำเร็จ!' : 'stamp แล้ว เก่งมาก');
  };
  const undo = async (day: 'today' | 'yesterday') => {
    setIsBusy(true);
    const json = await send(questId, 'DELETE', { day });
    setIsBusy(false);
    if (json.success) {
      setState(json.state);
      onProgress();
    }
  };
  const shareProgress = async () => {
    const card = await progressCard(title, state?.status.done ?? 0, needed);
    if (!card) return;
    setComposer({ photoFiles: [card], caption: `${title} · ทำไปแล้ว ${state?.status.done ?? 0}/${needed} ครั้ง`, stampDay: null });
  };

  /* ---------- the plan itself ---------- */
  const planList = isFixedPlan(plan) ? (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
      {[...(plan.days ?? [])].sort((a, b) => a.weekday - b.weekday).map((d) => (
        <li key={d.weekday} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="w-20 shrink-0 font-semibold text-slate-500">{WEEKDAY_NAMES[d.weekday]}</span>
          <span className="font-semibold text-slate-900">{d.task}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
      สัปดาห์ละ {plan.perWeek} ครั้ง วันไหนก็ได้ · {plan.task}
    </p>
  );

  if (!joined || !state) {
    return (
      <section id="plan" className="space-y-3 scroll-mt-24">
        <h2 className={SECTION_TITLE}>แผนของชาเลนจ์นี้</h2>
        <p className="text-sm font-medium text-slate-600 leading-relaxed">
          {planSummary(plan)} เริ่มนับวันที่คุณกดร่วม ทำครบ {needed} จาก {total} ครั้งก็สำเร็จ{total > needed ? ` (พลาดได้ ${total - needed} ครั้ง)` : ''}
        </p>
        {planList}
      </section>
    );
  }

  const { status } = state;
  const stamped = new Set(state.stamps.map((s) => s.day));
  const todayStamp = state.stamps.find((s) => s.day === status.today);
  const percent = Math.min(100, Math.round((status.done / needed) * 100));

  /* ---------- the member's weeks ---------- */
  const thisWeek = planWeekOf(state.start, status.today);
  const firstWeek = showAll ? 0 : Math.max(0, Math.min(thisWeek, plan.weeks - 1) - 1);
  const lastWeek = showAll ? plan.weeks - 1 : Math.min(plan.weeks - 1, firstWeek + WEEKS_AROUND);
  // Rows start on Monday, so the weekday columns line up; days before the start or after the end show empty
  const startMonday = addDays(state.start, -((new Date(`${state.start}T00:00:00Z`).getUTCDay() + 6) % 7));
  const rows: string[][] = [];
  const lastDay = status.end;
  for (let w = firstWeek; w <= lastWeek + (startMonday < state.start ? 1 : 0); w++) {
    const row = Array.from({ length: 7 }, (_, i) => addDays(startMonday, w * 7 + i));
    if (row[0] > lastDay) break;
    rows.push(row);
  }

  return (
    <section id="plan" className="space-y-4 scroll-mt-24">
      <div className="flex items-end justify-between gap-3">
        <h2 className={SECTION_TITLE}>แผนของคุณ</h2>
        <span className="text-xs font-semibold text-slate-500 tabular-nums">สัปดาห์ที่ {status.week}/{plan.weeks}</span>
      </div>

      {/* Today: one thing to do and one button */}
      <div className="rounded-3xl bg-[#F5F3FF] p-4 sm:p-5 space-y-3">
        <p className="text-xs font-semibold text-[#5B21B6]">วันนี้ · {shortDay(status.today)}</p>
        {status.todayStamped ? (
          <>
            <p className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="w-7 h-7 rounded-full bg-[#7C3AED] text-white flex items-center justify-center"><Check className="w-4 h-4" aria-hidden="true" /></span>
              stamp วันนี้แล้ว{status.todayTask ? ` · ${status.todayTask}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {!todayStamp?.momentId && (
                <button type="button" onClick={() => setComposer({ caption: `${title} · ครั้งที่ ${status.done}/${needed}`, stampDay: 'today' })} className="h-10 px-4 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-800 cursor-pointer inline-flex items-center gap-1.5">
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  แชร์โมเมนต์วันนี้
                </button>
              )}
              {!status.finished && <button type="button" onClick={() => undo('today')} disabled={isBusy} className="h-10 px-3 rounded-full text-sm font-semibold text-slate-600 hover:bg-white/70 cursor-pointer inline-flex items-center gap-1.5">
                <Undo2 className="w-4 h-4" aria-hidden="true" />
                ยกเลิก stamp
              </button>}
            </div>
          </>
        ) : status.todayProblem ? (
          <p className="text-base font-bold text-slate-900">{status.ended ? 'แผนของคุณจบแล้ว' : status.todayProblem}</p>
        ) : (
          <>
            <p className="text-base sm:text-lg font-bold text-slate-900">{status.todayTask}</p>
            <button type="button" onClick={() => stamp('today')} disabled={isBusy || isEnded} className="w-full sm:w-auto h-12 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold shadow-sm cursor-pointer inline-flex items-center justify-center gap-2">
              <Check className="w-5 h-5" aria-hidden="true" />
              {isBusy ? 'กำลังบันทึก…' : 'ทำแล้ว stamp เลย'}
            </button>
          </>
        )}
        {status.yesterdayOpen && !isEnded && (
          <button type="button" onClick={() => stamp('yesterday')} disabled={isBusy} className="block text-sm font-semibold text-[#2563EB] hover:underline cursor-pointer">
            ลืม stamp เมื่อวาน? stamp ย้อนหลัง ({status.yesterdayOpen})
          </button>
        )}
      </div>

      {/* How far along */}
      <div className="space-y-1.5">
        <p className="flex items-center justify-between text-sm font-bold text-slate-900">
          {status.finished ? 'ทำสำเร็จแล้ว' : `stamp แล้ว ${status.done} จาก ${needed} ครั้ง`}
          <span className="text-xs font-semibold text-slate-500 tabular-nums">{percent}%</span>
        </p>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label="ความคืบหน้าของแผน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="h-full rounded-full bg-[#7C3AED] transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        {status.missed > 0 && !status.finished && (
          <p className="text-xs font-medium text-slate-500">พลาดไป {status.missed} ครั้ง{total - needed - status.missed >= 0 ? ` ยังพลาดได้อีก ${total - needed - status.missed} ครั้ง` : ''}</p>
        )}
      </div>

      {/* The weeks: stamped, to do, today, rest */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
          {[1, 2, 3, 4, 5, 6, 7].map((weekday) => <span key={weekday}>{WEEKDAY_SHORT[weekday]}</span>)}
        </div>
        {rows.map((row) => (
          <div key={row[0]} className="grid grid-cols-7 gap-1">
            {row.map((day) => {
              const inPlan = day >= state.start && day <= lastDay;
              const task = inPlan ? taskOn(plan, day) : null;
              const isStamped = stamped.has(day);
              const isToday = day === status.today;
              const past = day < status.today;
              const planned = Boolean(task) && isFixedPlan(plan);
              return (
                <span
                  key={day}
                  title={task ? `${shortDay(day)} · ${task}` : shortDay(day)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums ${
                    !inPlan
                      ? 'text-slate-300'
                      : isStamped
                      ? 'bg-[#7C3AED] text-white'
                      : planned && past
                      ? 'bg-slate-100 text-slate-400 line-through'
                      : planned
                      ? 'border-2 border-[#C4B5FD] text-slate-700'
                      : 'text-slate-500'
                  } ${isToday ? 'ring-2 ring-offset-1 ring-[#2563EB]' : ''}`}
                >
                  {isStamped ? <Check className="w-4 h-4" aria-label={`${shortDay(day)} stamp แล้ว`} /> : Number(day.slice(8, 10))}
                </span>
              );
            })}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-[11px] font-medium text-slate-500">{isFixedPlan(plan) ? 'กรอบม่วง = วันที่มีแผน · ม่วงเต็ม = stamp แล้ว' : `สัปดาห์ละ ${plan.perWeek} ครั้ง วันไหนก็ได้ · ม่วงเต็ม = stamp แล้ว`}</p>
          {plan.weeks > WEEKS_AROUND + 1 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer">
              {showAll ? 'ดูเฉพาะช่วงนี้' : `ดูทั้ง ${plan.weeks} สัปดาห์`}
            </button>
          )}
        </div>
      </div>

      <button type="button" onClick={() => void shareProgress()} className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer inline-flex items-center gap-1.5">
        <Share2 className="w-4 h-4" aria-hidden="true" />
        แชร์ความคืบหน้า
      </button>

      {composer && (
        <MomentComposer
          initial={composer}
          onClose={() => setComposer(null)}
          onToast={onToast}
          onPosted={(moment) => {
            const day = composer.stampDay;
            setComposer(null);
            // The day's photo goes with that day's stamp
            if (day) void send(questId, 'PATCH', { day, momentId: moment.id }).then(() => load());
          }}
        />
      )}
    </section>
  );
}
