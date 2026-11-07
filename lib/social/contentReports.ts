import { db } from '../db';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { commentOfReport, removeReportedComment } from '../moments/service';
import { removeNotifications } from './notifications';
import { chatMessageForReport, chatRoomForStaff, removeChatMessageAsStaff } from './chat';
import { contentReportStore, questionStore } from './stores';
import { removeReview, reviewById } from './reviews';
import { pairMembersOf } from './meetAgain';

/**
 * Safety reports members send about an event, a fair or a place (the "รายงาน" button on detail pages),
 * about a review on a host's profile, a message in a group or pair chat, or a question on a ตี้ page.
 * Staff read and close them in the admin console. The reported side never sees who reported.
 */
// A 'comment' target is "momentId/commentId", a 'question' target "eventId/questionId" (a question on a ตี้ page)
export const REPORT_TARGET_TYPES = ['community', 'fair', 'spot', 'review', 'chat_message', 'comment', 'question'] as const;
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
    const review = await reviewById(targetId);
    if (!review) throw new MemberAuthError('ไม่พบรีวิวนี้ อาจถูกลบไปแล้ว', 404);
    targetTitle = `รีวิวของตี้ "${review.eventTitle}"`;
    hostMemberId = review.authorId;
    excerpt = review.text;
  } else if (targetType === 'comment') {
    const found = await commentOfReport(targetId);
    if (!found) throw new MemberAuthError('ไม่พบความคิดเห็นนี้ อาจถูกลบไปแล้ว', 404);
    targetTitle = `ความคิดเห็นในโมเมนต์ของ ${found.moment.authorName}`;
    hostMemberId = found.comment.authorId ?? undefined;
    excerpt = found.comment.text;
  } else if (targetType === 'question') {
    const cut = targetId.lastIndexOf('/');
    const eventId = targetId.slice(0, cut);
    const question = cut > 0 ? await questionStore.find(targetId.slice(cut + 1), eventId) : undefined;
    const event = question ? await db.findEventById(eventId) : null;
    if (!question || question.hidden || !event) throw new MemberAuthError('ไม่พบคำถามนี้ อาจถูกลบไปแล้ว', 404);
    targetTitle = `คำถามในตี้ "${event.title}"`;
    hostMemberId = question.authorId;
    excerpt = question.text;
  } else if (targetType === 'chat_message') {
    // Throws unless the reporter can read that room
    const { message, roomTitle } = await chatMessageForReport(reporter, targetId);
    targetTitle = pairMembersOf(message.roomId) ? `ข้อความในแชตคู่กับ ${roomTitle}` : `ข้อความในแชตกลุ่ม "${roomTitle}"`;
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

  const everything = await contentReportStore.all();
  const mine = everything.filter((report) => report.reporterId === reporter.id);
  if (mine.some((report) => report.targetId === targetId && report.status === 'open')) throw new MemberAuthError('คุณรายงานเรื่องนี้ไปแล้ว ทีมงานกำลังตรวจ', 409);
  if (mine.filter((report) => Date.now() - new Date(report.createdAt).getTime() < DAY_MS).length >= MAX_PER_DAY) {
    throw new MemberAuthError('วันนี้ส่งรายงานครบจำนวนแล้ว ลองใหม่พรุ่งนี้', 429);
  }

  return contentReportStore.add({ targetType, targetId, targetTitle, hostMemberId, excerpt, roomId, reason, details, reporterId: reporter.id });
}

/** For the admin console: reports with the names staff need to act */
export async function listContentReports(status: 'open' | 'closed' | 'all') {
  const everything = await contentReportStore.all();
  const reports = everything.filter((report) => status === 'all' || report.status === status);
  const ids = [...new Set(reports.flatMap((report) => [report.reporterId, report.hostMemberId].filter((value): value is string => Boolean(value))))];
  const people = await memberRepository.findByIds(ids);
  const names = new Map(ids.map((id) => [id, people.get(id)?.displayName ?? 'บัญชีที่ลบแล้ว']));
  return reports.map((report) => ({
    ...report,
    reasonLabel: CONTENT_REPORT_REASONS.find((reason) => reason.id === report.reason)?.label ?? report.reason,
    reporterName: names.get(report.reporterId) ?? '',
    hostName: report.hostMemberId ? names.get(report.hostMemberId) : undefined,
    // How many open reports the same target has: several people reporting one event is the strongest signal
    sameTargetOpen: everything.filter((other) => other.targetId === report.targetId && other.status === 'open').length,
  }));
}

export const openContentReportCount = async () => (await contentReportStore.all()).filter((report) => report.status === 'open').length;

export async function closeContentReport(id: string, closedBy: string, note: string): Promise<ContentReport | null> {
  return contentReportStore.close(id, closedBy, note || undefined);
}

/**
 * The chat room of a reported message, for staff handling that report. Reading a room is tied to a report on purpose:
 * staff do not browse members' chats. Returns null when the report is not about a chat message.
 */
export async function chatRoomOfReport(id: string) {
  const report = (await contentReportStore.all()).find((item) => item.id === id);
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
 * Staff take down the reported review, comment, question or chat message. Every open report about it is closed with it.
 * Returns null when the report is not about a review or a message, or is already closed.
 */
export async function removeReportedContent(id: string, closedBy: string, note: string): Promise<ContentReport | null> {
  const report = (await contentReportStore.all()).find((item) => item.id === id && item.status === 'open');
  if (!report || !['review', 'chat_message', 'comment', 'question'].includes(report.targetType)) return null;
  if (report.targetType === 'review') await removeReview(report.targetId);
  else if (report.targetType === 'comment') {
    const removedIds = await removeReportedComment(report.targetId);
    await Promise.all(removedIds.map((commentId) => removeNotifications({ types: ['comment', 'reply', 'comment_like'], commentId })));
  }
  else if (report.targetType === 'question') await questionStore.hide(report.targetId.slice(report.targetId.lastIndexOf('/') + 1));
  else await removeChatMessageAsStaff(report.targetId);
  const closedAt = new Date().toISOString();
  const closingNote = ['ลบเนื้อหาที่ถูกรายงานแล้ว', note].filter(Boolean).join(' · ');
  await contentReportStore.closeTarget(report.targetId, closedBy, closingNote);
  return { ...report, status: 'closed', closedAt, closedBy, note: closingNote };
}

/** Account deletion: reports the member sent go with them */
export async function removeContentReportsBy(memberId: string): Promise<void> {
  await contentReportStore.removeBy(memberId);
}
