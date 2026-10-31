import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { thaiTimeAgo } from '../moments/service';
import { createJsonStore } from './jsonStore';

export type NotificationType = 'follow' | 'like' | 'comment' | 'challenge' | 'evidence' | 'match' | 'seat' | 'question' | 'answer' | 'approved' | 'rejected' | 'joined';

interface StoredNotification {
  id: string;
  /** Who receives it */
  memberId: string;
  type: NotificationType;
  actorId: string;
  momentId?: string;
  /** Start of the comment, for 'comment' */
  preview?: string;
  /** For 'challenge': the challenge the member finished (actorId is the member themselves) */
  questId?: string;
  /** For 'match': the ตี้ where the two met */
  eventId?: string;
  /** For 'approved': the published page (/community/… or /events/…) */
  path?: string;
  createdAt: string;
  read: boolean;
}

const store = createJsonStore<StoredNotification>('notifications');
const KEEP_PER_MEMBER = 60;

/** Tells a member that someone followed them, liked or commented on their moment. Never notifies about one's own action. */
export async function notify(recipientId: string | null | undefined, actor: Member, type: NotificationType, momentId?: string, preview?: string): Promise<void> {
  if (!recipientId || recipientId === actor.id) return;
  await store.update((items) => {
    // A repeated like or follow by the same person is one notification, not many
    const rest = type === 'comment' ? items : items.filter((n) => !(n.memberId === recipientId && n.actorId === actor.id && n.type === type && n.momentId === momentId));
    const next = [{ id: `ntf_${randomUUID()}`, memberId: recipientId, type, actorId: actor.id, momentId, preview: preview?.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...rest];
    let kept = 0;
    return next.filter((n) => n.memberId !== recipientId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Tells a member, once per challenge, that they finished it and the reward is waiting */
export async function notifyChallengeFinished(memberId: string, questId: string, questTitle: string): Promise<void> {
  await store.update((items) => {
    if (items.some((n) => n.memberId === memberId && n.type === 'challenge' && n.questId === questId)) return items;
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type: 'challenge' as const, actorId: memberId, questId, preview: questTitle.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...items];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Tells a member that staff looked at a moment's photo and did not count it as a visit (the reason is the preview) */
export async function notifyEvidenceRejected(memberId: string, momentId: string, note: string): Promise<void> {
  await store.update((items) => {
    const rest = items.filter((n) => !(n.memberId === memberId && n.type === 'evidence' && n.momentId === momentId));
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type: 'evidence' as const, actorId: memberId, momentId, preview: note.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...rest];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Tells a member that someone they picked after a ตี้ picked them too ("อยากเจออีก"), so they can talk now */
export async function notifyMatch(memberId: string, actor: Member, eventId: string): Promise<void> {
  await store.update((items) => {
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type: 'match' as const, actorId: actor.id, eventId, createdAt: new Date().toISOString(), read: false }, ...items];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** A seat opened in a full ตี้ the member queued for; it is held for them for a while (lib/social/waitlist.ts) */
export async function notifySeat(memberId: string, eventId: string): Promise<void> {
  await store.update((items) => {
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type: 'seat' as const, actorId: memberId, eventId, createdAt: new Date().toISOString(), read: false }, ...items];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Someone asked the host a question on their ตี้, or the host answered the member's question */
export async function notifyQuestion(memberId: string, actor: Member, eventId: string, type: 'question' | 'answer', preview: string): Promise<void> {
  if (memberId === actor.id) return;
  await store.update((items) => {
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type, actorId: actor.id, eventId, preview: preview.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...items];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Tells a host that staff published or turned down their ตี้ (the preview is its title) */
export async function notifyReview(memberId: string, eventId: string, eventTitle: string, type: 'approved' | 'rejected', path: string): Promise<void> {
  await store.update((items) => {
    const rest = items.filter((n) => !(n.memberId === memberId && n.eventId === eventId && (n.type === 'approved' || n.type === 'rejected')));
    const next = [{ id: `ntf_${randomUUID()}`, memberId, type, actorId: memberId, eventId, path, preview: eventTitle.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...rest];
    let kept = 0;
    return next.filter((n) => n.memberId !== memberId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Tells a host that someone joined their ตี้; joining again after leaving stays one notification */
export async function notifyJoined(hostId: string, actor: Member, eventId: string, eventTitle: string): Promise<void> {
  if (hostId === actor.id) return;
  await store.update((items) => {
    const rest = items.filter((n) => !(n.memberId === hostId && n.type === 'joined' && n.actorId === actor.id && n.eventId === eventId));
    const next = [{ id: `ntf_${randomUUID()}`, memberId: hostId, type: 'joined' as const, actorId: actor.id, eventId, preview: eventTitle.slice(0, 80), createdAt: new Date().toISOString(), read: false }, ...rest];
    let kept = 0;
    return next.filter((n) => n.memberId !== hostId || ++kept <= KEEP_PER_MEMBER);
  });
}

/** Sent by the site itself, not by a person */
const SYSTEM_TYPES = new Set<NotificationType>(['challenge', 'evidence', 'seat', 'approved', 'rejected']);

const MESSAGES: Record<NotificationType, string> = { approved: 'ทีมงานตรวจแล้ว ตี้ของคุณขึ้นบนเว็บแล้ว ชวนเพื่อนๆ มาได้เลย', rejected: 'ทีมงานยังเผยแพร่ตี้นี้ไม่ได้ ดูตี้ของคุณได้ที่มายฮับ', joined: 'เข้าร่วมตี้ของคุณแล้ว',seat: 'มีที่ว่างในตี้ที่คุณต่อคิวไว้ กันที่ไว้ให้ 2 ชั่วโมง', question: 'ถามคำถามในตี้ของคุณ', answer: 'ตอบคำถามของคุณแล้ว', match: 'อยากเจอคุณอีกเหมือนกัน คุยต่อกันได้แล้ว', evidence: 'ทีมงานตรวจรูปแล้ว โมเมนต์นี้ยังไม่นับในชาเลนจ์', follow: 'เริ่มติดตามคุณ', like: 'ส่งหัวใจให้โมเมนต์ของคุณ', comment: 'แสดงความคิดเห็นในโมเมนต์ของคุณ', challenge: 'คุณทำชาเลนจ์ครบแล้ว กดดูรางวัลได้เลย' };

export async function notificationsFor(member: Member) {
  const mine = store.read().filter((n) => n.memberId === member.id);
  const blocked = new Set(member.blockedIds ?? []);
  const actors = await memberRepository.findByIds(mine.map((n) => n.actorId));
  const items = mine
    .filter((n) => SYSTEM_TYPES.has(n.type) || (!blocked.has(n.actorId) && actors.get(n.actorId)?.status === 'active'))
    .map((n) => {
      if (SYSTEM_TYPES.has(n.type)) {
        return {
          id: n.id,
          type: n.type,
          actorId: n.actorId,
          actorName: 'Chillwaa',
          actorAvatar: '',
          momentId: n.type === 'evidence' ? n.momentId : undefined,
          href: n.type === 'evidence' ? undefined : n.type === 'rejected' ? '/myhub' : n.type === 'approved' ? n.path : n.type === 'seat' ? `/community/${encodeURIComponent(n.eventId ?? '')}` : `/challenges/${encodeURIComponent(n.questId ?? '')}`,
          message: MESSAGES[n.type],
          preview: n.preview,
          timeAgo: thaiTimeAgo(n.createdAt),
          read: n.read,
        };
      }
      const actor = actors.get(n.actorId)!;
      return {
        id: n.id,
        type: n.type,
        actorId: n.actorId,
        actorName: tidyDisplayName(actor.displayName).trim() || actor.displayName,
        actorAvatar: actor.avatarUrl ?? '',
        momentId: n.momentId,
        href: n.type === 'match' && n.eventId ? `/community/${encodeURIComponent(n.eventId)}#meet-again` : (n.type === 'question' || n.type === 'answer') && n.eventId ? `/community/${encodeURIComponent(n.eventId)}#questions` : n.type === 'joined' && n.eventId ? `/community/${encodeURIComponent(n.eventId)}` : (undefined as string | undefined),
        message: MESSAGES[n.type],
        preview: n.preview,
        timeAgo: thaiTimeAgo(n.createdAt),
        read: n.read,
      };
    });
  return { items, unread: items.filter((n) => !n.read).length };
}

export async function markNotificationsRead(memberId: string): Promise<void> {
  if (!store.read().some((n) => n.memberId === memberId && !n.read)) return;
  await store.update((items) => items.map((n) => (n.memberId === memberId && !n.read ? { ...n, read: true } : n)));
}

/** Account deletion: nothing addressed to, or caused by, the member stays behind */
export async function removeNotificationsOf(memberId: string): Promise<void> {
  await store.update((items) => items.filter((n) => n.memberId !== memberId && n.actorId !== memberId));
}
