import type { QuestPlan } from '@/data/mockData';

/**
 * Challenges done by plan (owner 2026-11-07): "ฟิตแกนกลาง 12 สัปดาห์", "วิ่งสัปดาห์ละ 2 ครั้ง". Each member's plan starts
 * the day they join and runs the plan's weeks; each time done, they stamp it. Fixed plans say what to do on which
 * weekday (the other days are rest); flexible plans ask for a number of times a week, on any days. Days are Thai
 * dates ("YYYY-MM-DD", UTC+7). Shared by the server (what counts) and the pages (the calendar), so both agree.
 */

export type PlanDay = string;

/** A stamp may go on today or yesterday, so a late night still counts */
export const STAMP_LATE_DAYS = 1;
export const MAX_PLAN_WEEKS = 104;
export const WEEKDAY_SHORT = ['', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
export const WEEKDAY_NAMES = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_MS = 7 * 60 * 60 * 1000;

export const bangkokDay = (at: Date | string = new Date()): PlanDay => new Date(new Date(at).getTime() + BANGKOK_MS).toISOString().slice(0, 10);
const dayMs = (day: PlanDay) => Date.parse(`${day}T00:00:00Z`);
export const addDays = (day: PlanDay, n: number): PlanDay => new Date(dayMs(day) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (from: PlanDay, to: PlanDay) => Math.round((dayMs(to) - dayMs(from)) / DAY_MS);
/** 1 = Monday … 7 = Sunday */
export const weekdayOf = (day: PlanDay) => ((new Date(dayMs(day)).getUTCDay() + 6) % 7) + 1;

export const isFixedPlan = (plan: QuestPlan) => Boolean(plan.days?.length);

/** How many times the whole plan asks for */
export function planTotal(plan: QuestPlan): number {
  return isFixedPlan(plan) ? plan.weeks * (plan.days?.length ?? 0) : plan.weeks * (plan.perWeek ?? 0);
}

/** How many stamps finish the challenge: the total less the misses allowed (one in seven by default) */
export function planNeeded(plan: QuestPlan): number {
  const total = planTotal(plan);
  const misses = plan.allowMisses ?? Math.floor(total / 7);
  return Math.max(1, total - Math.max(0, misses));
}

export const planEnd = (plan: QuestPlan, start: PlanDay): PlanDay => addDays(start, plan.weeks * 7 - 1);
/** 0-based week of the member's plan a day falls in */
export const planWeekOf = (start: PlanDay, day: PlanDay) => Math.floor(daysBetween(start, day) / 7);

/** What the plan asks on a day; flexible plans ask the same on any day; null on a rest day */
export function taskOn(plan: QuestPlan, day: PlanDay): string | null {
  if (!isFixedPlan(plan)) return plan.task?.trim() || 'ทำตามแผน';
  return plan.days?.find((d) => d.weekday === weekdayOf(day))?.task ?? null;
}

/** The plan in one line: "จ. พ. ศ. · 12 สัปดาห์" or "สัปดาห์ละ 2 ครั้ง · 8 สัปดาห์" */
export function planSummary(plan: QuestPlan): string {
  const when = isFixedPlan(plan)
    ? [...(plan.days ?? [])].sort((a, b) => a.weekday - b.weekday).map((d) => WEEKDAY_SHORT[d.weekday]).join(' ')
    : `สัปดาห์ละ ${plan.perWeek} ครั้ง`;
  return `${when} · ${plan.weeks} สัปดาห์`;
}

/** Why a day cannot be stamped, in words for the member; null when it can */
export function stampProblem(plan: QuestPlan, start: PlanDay, stamped: PlanDay[], day: PlanDay, today: PlanDay = bangkokDay()): string | null {
  const back = daysBetween(day, today);
  if (back < 0) return 'ยังไม่ถึงวันนั้นนะ';
  if (back > STAMP_LATE_DAYS) return 'ย้อน stamp ได้แค่เมื่อวาน';
  if (day < start) return 'ก่อนวันที่เริ่มแผน';
  if (day > planEnd(plan, start)) return 'แผนนี้จบแล้ว';
  if (stamped.includes(day)) return 'วันนี้ stamp ไปแล้ว';
  if (isFixedPlan(plan)) return taskOn(plan, day) ? null : 'วันนี้เป็นวันพัก';
  const week = planWeekOf(start, day);
  const inWeek = stamped.filter((d) => d >= start && planWeekOf(start, d) === week).length;
  return inWeek >= (plan.perWeek ?? 0) ? `สัปดาห์นี้ครบ ${plan.perWeek} ครั้งแล้ว` : null;
}

/** Stamps that count: inside the member's plan and allowed by it, at most the plan's total */
export function countedStamps(plan: QuestPlan, start: PlanDay, stamped: PlanDay[]): PlanDay[] {
  const end = planEnd(plan, start);
  const perWeek = new Map<number, number>();
  const counted: PlanDay[] = [];
  for (const day of [...new Set(stamped)].sort()) {
    if (day < start || day > end) continue;
    if (isFixedPlan(plan)) {
      if (!taskOn(plan, day)) continue;
    } else {
      const week = planWeekOf(start, day);
      if ((perWeek.get(week) ?? 0) >= (plan.perWeek ?? 0)) continue;
      perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    }
    counted.push(day);
  }
  return counted;
}

export interface PlanStatus {
  start: PlanDay;
  end: PlanDay;
  total: number;
  needed: number;
  done: number;
  finished: boolean;
  /** 1-based; past the end it stays at the last week */
  week: number;
  ended: boolean;
  today: PlanDay;
  todayTask: string | null;
  todayStamped: boolean;
  /** Why today cannot be stamped (rest day, week full, ended); null when it can */
  todayProblem: string | null;
  /** Yesterday can still be stamped: its task, else null */
  yesterdayOpen: string | null;
  /** Fixed plans: planned days already past and not stamped */
  missed: number;
}

export function planStatus(plan: QuestPlan, start: PlanDay, stamped: PlanDay[], today: PlanDay = bangkokDay()): PlanStatus {
  const end = planEnd(plan, start);
  const counted = countedStamps(plan, start, stamped);
  const needed = planNeeded(plan);
  const yesterday = addDays(today, -1);
  let missed = 0;
  if (isFixedPlan(plan)) {
    // Days before yesterday that had a task and no stamp; yesterday may still be stamped
    for (let day = start; day < yesterday && day <= end; day = addDays(day, 1)) {
      if (taskOn(plan, day) && !counted.includes(day)) missed += 1;
    }
  }
  return {
    start,
    end,
    total: planTotal(plan),
    needed,
    done: counted.length,
    finished: counted.length >= needed,
    week: Math.min(plan.weeks, Math.max(1, planWeekOf(start, today) + 1)),
    ended: today > end,
    today,
    todayTask: today >= start && today <= end ? taskOn(plan, today) : null,
    todayStamped: counted.includes(today),
    todayProblem: stampProblem(plan, start, stamped, today, today),
    yesterdayOpen: stampProblem(plan, start, stamped, yesterday, today) ? null : taskOn(plan, yesterday),
    missed,
  };
}

/** A plan as staff typed it, checked; null when it is not a usable plan */
export function parseQuestPlan(input: unknown): QuestPlan | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const weeks = Math.round(Number(raw.weeks));
  if (!Number.isFinite(weeks) || weeks < 1 || weeks > MAX_PLAN_WEEKS) return null;
  const text = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 80) : '');
  const allowMisses = raw.allowMisses === undefined || raw.allowMisses === '' || raw.allowMisses === null ? undefined : Math.max(0, Math.round(Number(raw.allowMisses)));
  if (Array.isArray(raw.days) && raw.days.length) {
    const seen = new Set<number>();
    const days = raw.days
      .map((d) => ({ weekday: Math.round(Number((d as Record<string, unknown>)?.weekday)), task: text((d as Record<string, unknown>)?.task) }))
      .filter((d) => d.weekday >= 1 && d.weekday <= 7 && d.task && !seen.has(d.weekday) && seen.add(d.weekday))
      .sort((a, b) => a.weekday - b.weekday);
    if (!days.length) return null;
    return { weeks, days, ...(Number.isFinite(allowMisses) ? { allowMisses } : {}) };
  }
  const perWeek = Math.round(Number(raw.perWeek));
  if (!Number.isFinite(perWeek) || perWeek < 1 || perWeek > 7) return null;
  return { weeks, perWeek, task: text(raw.task) || 'ทำตามแผน', ...(Number.isFinite(allowMisses) ? { allowMisses } : {}) };
}
