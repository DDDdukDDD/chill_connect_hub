import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { thaiTimeAgo } from '../moments/service';
import { createJsonStore } from './jsonStore';

export type NotificationType = 'follow' | 'like' | 'comment';

interface StoredNotification {
  id: string;
  /** Who receives it */
  memberId: string;
  type: NotificationType;
  actorId: string;
  momentId?: string;
  /** Start of the comment, for 'comment' */
  preview?: string;
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

const MESSAGES: Record<NotificationType, string> = { follow: 'เริ่มติดตามคุณ', like: 'ส่งหัวใจให้โมเมนต์ของคุณ', comment: 'แสดงความคิดเห็นในโมเมนต์ของคุณ' };

export async function notificationsFor(member: Member) {
  const mine = store.read().filter((n) => n.memberId === member.id);
  const blocked = new Set(member.blockedIds ?? []);
  const actors = new Map<string, Member | null>();
  for (const id of new Set(mine.map((n) => n.actorId))) actors.set(id, await memberRepository.findById(id));
  const items = mine
    .filter((n) => !blocked.has(n.actorId) && actors.get(n.actorId)?.status === 'active')
    .map((n) => {
      const actor = actors.get(n.actorId)!;
      return {
        id: n.id,
        type: n.type,
        actorId: n.actorId,
        actorName: tidyDisplayName(actor.displayName).trim() || actor.displayName,
        actorAvatar: actor.avatarUrl ?? '',
        momentId: n.momentId,
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
