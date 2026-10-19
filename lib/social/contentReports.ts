import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { chatMessageForReport, chatRoomForStaff, removeChatMessageAsStaff } from './chat';
import { createJsonStore } from './jsonStore';
import { removeReview, reviewById } from './reviews';

/**
 * Safety reports members send about an event, a fair or a place (the "รายงาน" button on detail pages),
 * about a review on a host's profile, or about a message in a group chat.
 * Staff read and close them in the admin console. The reported side never sees who reported.
 */
export const REPORT_TARGET_TYPES = ['community', 'fair', 'spot', 'review', 'chat_message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const CONTENT_REPORT_REASONS = [
  { id: 'investment_mlm', label: 'ชวนลงทุน ขายตรง หรือหารายได้เสริม' },
  { id: 'harassment', label: 'คุกคามหรือพูดจาไม่เหมาะสม' },
  { id: 'unsafe_location', label: 'นัดพบในที่ลับตาคนหรือไม่ปลอดภัย' },
  { id: 'fake_or_spam', label: 'ข้อมูลปลอม สแปม หรือไม่มาตามนัด' },
  { id: 'wrong_info', label: 'ข้อมูลไม่ถูกต้องหรือไม่อัปเดต' },
  { id: 'other', label: 'เรื่องอื่น' },
] as const;
const REASON_IDS = new Set<string>(CONTENT_REPORT_REASONS.map((reason) => reason.id));

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  /** The member responsible for the target: who created the event, or who wrote the review or message */
  hostMemberId?: string;
  /** The reported words as they were when reported (reviews and chat messages) */
  excerpt?: string;
  /** The chat room a reported message is in, so staff can read what was said around it */
  roomId?: string;
  reason: string;
  details: string;
  reporterId: string;
  createdAt: string;
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  note?: string;
}

const store = createJsonStore<ContentReport>('content_reports');
const MAX_PER_DAY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function fileContentReport(reporter: Member, input: Record<string, unknown>): Promise<ContentReport> {
  if (reporter.status !== 'active') throw new MemberAuthError('บัญชีนี้ยังส่งรายงานไม่ได้', 403);
  const targetType = input.targetType as ReportTargetType;
  const targetId = typeof input.targetId === 'string' ? input.targetId.trim().slice(0, 120) : '';
  const reason = typeof input.reason === 'string' ? input.reason : '';
  const details = typeof input.details === 'string' ? input.details.trim().slice(0, 500) : '';
  if (!REPORT_TARGET_TYPES.includes(targetType) || !targetId) throw new MemberAuthError('ไม่พบสิ่งที่ต้องการรายงาน', 400);
  if (!REASON_IDS.has(reason)) throw new MemberAuthError('เลือกเหตุผลที่รายงาน', 400);
  if (reason === 'other' && details.length < 5) throw new MemberAuthError('เล่าสั้นๆ ว่าเกิดอะไรขึ้น', 400);

  // The title, the words and the member responsible come from our own data, never from the request
  let targetTitle = '';
  let hostMemberId: string | undefined;
  let excerpt: string | undefined;
  let roomId: string | undefined;
  if (targetType === 'review') {
    const review = reviewById(targetId);
    if (!review) throw new MemberAuthError('ไม่พบรีวิวนี้ อาจถูกลบไปแล้ว', 404);
    targetTitle = `รีวิวของตี้ "${review.eventTitle}"`;
    hostMemberId = review.authorId;
    excerpt = review.text;
  } else if (targetType === 'chat_message') {
    // Throws unless the reporter can read that room
    const { message, roomTitle } = await chatMessageForReport(reporter, targetId);
    targetTitle = `ข้อความในแชตกลุ่ม "${roomTitle}"`;
    hostMemberId = message.authorId;
    excerpt = message.text;
    roomId = message.roomId;
  } else {
    const event = targetType === 'spot' ? null : await db.findEventById(targetId);
    const spot = targetType === 'spot' ? await db.findSpotById(targetId) : null;
    const fallbackTitle = typeof input.targetTitle === 'string' ? input.targetTitle.trim().slice(0, 160) : '';
    targetTitle = event?.title ?? spot?.title ?? fallbackTitle;
    hostMemberId = (event as { createdByMemberId?: string } | null)?.createdByMemberId;
  }
  if (!targetTitle) throw new MemberAuthError('ไม่พบสิ่งที่ต้องการรายงาน', 404);
  if (hostMemberId === reporter.id) throw new MemberAuthError('รายงานสิ่งที่ตัวเองสร้างไม่ได้', 400);

  const mine = store.read().filter((report) => report.reporterId === reporter.id);
  if (mine.some((report) => report.targetId === targetId && report.status === 'open')) throw new MemberAuthError('คุณรายงานเรื่องนี้ไปแล้ว ทีมงานกำลังตรวจ', 409);
  if (mine.filter((report) => Date.now() - new Date(report.createdAt).getTime() < DAY_MS).length >= MAX_PER_DAY) {
    throw new MemberAuthError('วันนี้ส่งรายงานครบจำนวนแล้ว ลองใหม่พรุ่งนี้', 429);
  }

  const saved: ContentReport = { id: `rep_${randomUUID()}`, targetType, targetId, targetTitle, hostMemberId, excerpt, roomId, reason, details, reporterId: reporter.id, createdAt: new Date().toISOString(), status: 'open' };
  await store.update((items) => [saved, ...items]);
  return saved;
}

/** For the admin console: reports with the names staff need to act */
export async function listContentReports(status: 'open' | 'closed' | 'all') {
  const reports = store.read().filter((report) => status === 'all' || report.status === status);
  const names = new Map<string, string>();
  for (const id of new Set(reports.flatMap((report) => [report.reporterId, report.hostMemberId].filter((value): value is string => Boolean(value))))) {
    names.set(id, (await memberRepository.findById(id))?.displayName ?? 'บัญชีที่ลบแล้ว');
  }
  return reports.map((report) => ({
    ...report,
    reasonLabel: CONTENT_REPORT_REASONS.find((reason) => reason.id === report.reason)?.label ?? report.reason,
    reporterName: names.get(report.reporterId) ?? '',
    hostName: report.hostMemberId ? names.get(report.hostMemberId) : undefined,
    // How many open reports the same target has: several people reporting one event is the strongest signal
    sameTargetOpen: store.read().filter((other) => other.targetId === report.targetId && other.status === 'open').length,
  }));
}

export const openContentReportCount = () => store.read().filter((report) => report.status === 'open').length;

export async function closeContentReport(id: string, closedBy: string, note: string): Promise<ContentReport | null> {
  let closed: ContentReport | null = null;
  await store.update((items) => items.map((report) => {
    if (report.id !== id || report.status === 'closed') return report;
    closed = { ...report, status: 'closed', closedAt: new Date().toISOString(), closedBy, note: note || undefined };
    return closed;
  }));
  return closed;
}

/**
 * The chat room of a reported message, for staff handling that report. Reading a room is tied to a report on purpose:
 * staff do not browse members' chats. Returns null when the report is not about a chat message.
 */
export async function chatRoomOfReport(id: string) {
  const report = store.read().find((item) => item.id === id);
  if (!report || report.targetType !== 'chat_message' || !report.roomId) return null;
  return { report, messages: await chatRoomForStaff(report.roomId) };
}

/** Staff delete another message of the reported room (the reported one goes through removeReportedContent) */
export async function removeChatMessageOfReport(id: string, messageId: string): Promise<{ report: ContentReport; text: string } | null> {
  const room = await chatRoomOfReport(id);
  const message = room?.messages.find((item) => item.id === messageId);
  if (!room || !message) return null;
  await removeChatMessageAsStaff(messageId);
  return { report: room.report, text: message.text };
}

/**
 * Staff take down the reported review or chat message. Every open report about it is closed with it.
 * Returns null when the report is not about a review or a message, or is already closed.
 */
export async function removeReportedContent(id: string, closedBy: string, note: string): Promise<ContentReport | null> {
  const report = store.read().find((item) => item.id === id && item.status === 'open');
  if (!report || (report.targetType !== 'review' && report.targetType !== 'chat_message')) return null;
  if (report.targetType === 'review') await removeReview(report.targetId);
  else await removeChatMessageAsStaff(report.targetId);
  const closedAt = new Date().toISOString();
  const closingNote = ['ลบเนื้อหาที่ถูกรายงานแล้ว', note].filter(Boolean).join(' · ');
  await store.update((items) => items.map((item) => (
    item.targetId === report.targetId && item.status === 'open' ? { ...item, status: 'closed' as const, closedAt, closedBy, note: closingNote } : item
  )));
  return { ...report, status: 'closed', closedAt, closedBy, note: closingNote };
}

/** Account deletion: reports the member sent go with them */
export async function removeContentReportsBy(memberId: string): Promise<void> {
  await store.update((items) => items.filter((report) => report.reporterId !== memberId));
}
