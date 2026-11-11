import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { thaiTimeAgo } from '../moments/service';
import { notificationStore, type NotificationMatch, type NotificationType, type StoredNotification } from './notificationStore';
import { afterResponse, pushConfigured, sendPush, type PushMessage } from './push';
import { pushStore } from './pushStore';
import { FRIENDS_GOING_MAX } from './socialRules';

export type { NotificationType };

/**
 * Saving a notice must never undo the action behind it: the like, comment or join has already happened,
 * so a database hiccup here only costs the notice.
 */
async function quietly(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    console.error('NOTIFICATION FAILED:', error);
  }
}

const newId = () => `ntf_${randomUUID()}`;
const now = () => new Date().toISOString();

/** Takes back notices whose cause is gone: an unlike, an unfollow, a deleted comment or post, a block */
export const removeNotifications = (match: NotificationMatch): Promise<void> => quietly(() => notificationStore.remove(match));

/** Tells a member that someone followed them, liked or commented on their moment. Never notifies about one's own action. */
export async function notify(recipientId: string | null | undefined, actor: Member, type: NotificationType, momentId?: string, preview?: string, commentId?: string): Promise<void> {
  if (!recipientId || recipientId === actor.id) return;
  // A repeated like or follow by the same person is one notification, not many
  const same = type === 'comment' || type === 'reply' ? undefined : { memberId: recipientId, actorId: actor.id, types: [type], momentId, ...(type === 'comment_like' ? { commentId } : {}) };
  await quietly(() => saveAndPush({ id: newId(), memberId: recipientId, type, actorId: actor.id, momentId, commentId, preview: preview?.slice(0, 80), createdAt: now() }, same));
}

/** Tells a member, once per challenge, that they finished it and the reward is waiting */
export async function notifyChallengeFinished(memberId: string, questId: string, questTitle: string): Promise<void> {
  await quietly(async () => {
    if (await notificationStore.exists({ memberId, types: ['challenge'], questId })) return;
    await saveAndPush({ id: newId(), memberId, type: 'challenge', actorId: memberId, questId, preview: questTitle.slice(0, 80), createdAt: now() });
  });
}

/** Tells a member that staff looked at a moment's photo and did not count it as a visit (the reason is the preview) */
export async function notifyEvidenceRejected(memberId: string, momentId: string, note: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'evidence', actorId: memberId, momentId, preview: note.slice(0, 80), createdAt: now() }, { memberId, types: ['evidence'], momentId }));
}

/** Tells a member that someone they picked after a ตี้ picked them too ("อยากเจออีก"), so they can talk now */
export async function notifyMatch(memberId: string, actor: Member, eventId: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'match', actorId: actor.id, eventId, createdAt: now() }));
}

/** A seat opened in a full ตี้ the member queued for; it is held for them for a while (lib/social/waitlist.ts) */
export async function notifySeat(memberId: string, eventId: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'seat', actorId: memberId, eventId, createdAt: now() }));
}

/** Someone asked the host a question on their ตี้, or the host answered the member's question */
export async function notifyQuestion(memberId: string, actor: Member, eventId: string, type: 'question' | 'answer', preview: string): Promise<void> {
  if (memberId === actor.id) return;
  await quietly(() => saveAndPush({ id: newId(), memberId, type, actorId: actor.id, eventId, preview: preview.slice(0, 80), createdAt: now() }));
}

/** The title, then why when staff said no, so a member knows what to change */
const decisionPreview = (title: string, reason?: string) => (reason ? `${title.slice(0, 60)} · เหตุผล: ${reason}`.slice(0, 160) : title.slice(0, 80));

/** Tells a host that staff published or turned down their ตี้ or อีเวนต์ */
export async function notifyReview(memberId: string, eventId: string, eventTitle: string, type: 'approved' | 'rejected', path: string, reason?: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type, actorId: memberId, eventId, path, preview: decisionPreview(eventTitle, reason), createdAt: now() }, { memberId, eventId, types: ['approved', 'rejected'] }));
}

/** The same, for what has no event behind it: a proposed challenge, a suggested place, a request to become a host */
export async function notifyDecision(memberId: string, type: 'approved' | 'rejected', title: string, path: string, reason?: string, questId?: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type, actorId: memberId, path, questId, preview: decisionPreview(title, reason), createdAt: now() }, questId ? { memberId, questId, types: ['approved', 'rejected'] } : undefined));
}

/** Tells a host that someone joined their ตี้; joining again after leaving stays one notification */
/** How many friends hear that someone joined a ตี้, at most (the newest friendships first would need more reads; any 30 is fine) */
const MAX_FRIENDS_TOLD = FRIENDS_GOING_MAX;

/**
 * "เพื่อนจะไปตี้นี้ ไปด้วยกันไหม?" (owner 2026-11-10: notices that give a reason to go out). Friends only (they follow each
 * other); one notice per friend and ตี้; never the host. Sent after the answer, so joining
 * stays quick. Who joined a ตี้ is already public on its page.
 */
export function notifyFriendsGoing(actor: Member, eventId: string, eventTitle: string, skip: string[]): void {
  afterResponse(async () => {
    const followed = await memberRepository.findByIds(actor.followingIds ?? []);
    const friends = [...followed.values()]
      .filter((f) => f.status === 'active' && f.followingIds?.includes(actor.id) && !f.blockedIds?.includes(actor.id) && !actor.blockedIds?.includes(f.id) && !skip.includes(f.id))
      .slice(0, MAX_FRIENDS_TOLD);
    for (const friend of friends) {
      await quietly(() => saveAndPush({ id: newId(), memberId: friend.id, type: 'friend_going', actorId: actor.id, eventId, preview: eventTitle.slice(0, 80), createdAt: now() }, { memberId: friend.id, types: ['friend_going'], actorId: actor.id, eventId }));
    }
  });
}

export async function notifyJoined(hostId: string, actor: Member, eventId: string, eventTitle: string): Promise<void> {
  if (hostId === actor.id) return;
  await quietly(() => saveAndPush({ id: newId(), memberId: hostId, type: 'joined', actorId: actor.id, eventId, preview: eventTitle.slice(0, 80), createdAt: now() }, { memberId: hostId, types: ['joined'], actorId: actor.id, eventId }));
}

/** The host moved the date, time or place of a ตี้ the member is in or queued for; a newer change replaces the older notice */
export async function notifyTeeChanged(memberId: string, actor: Member, eventId: string, summary: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'tee_changed', actorId: actor.id, eventId, preview: summary.slice(0, 160), createdAt: now() }, { memberId, eventId, types: ['tee_changed'] }));
}

/** A trip the member hosts, joined or queued for was called off because too few people came in time (lib/social/tripAutoCancel.ts) */
export async function notifyTripCancelled(memberId: string, eventId: string, title: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'trip_cancelled', actorId: memberId, eventId, preview: title.slice(0, 160), createdAt: now() }, { memberId, eventId, types: ['trip_cancelled'] }));
}

/** The member was drawn in a campaign's prize draw; `path` opens the campaign's popup, where they claim */
export async function notifyDrawWon(memberId: string, path: string, headline: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type: 'draw_won', actorId: memberId, path, preview: headline.slice(0, 80), createdAt: now() }));
}

/** Everyone else who held an entry: the results are out. One write, as there can be thousands */
export async function notifyDrawResult(memberIds: string[], path: string, headline: string): Promise<void> {
  await quietly(async () => {
    const notice = { type: 'draw_result' as const, path, preview: headline.slice(0, 80) };
    await notificationStore.addToMany(memberIds, notice);
    if (pushConfigured) afterResponse(() => pushToAll(memberIds, notice));
  });
}

/** Sent by the site itself, not by a person */
const SYSTEM_TYPES = new Set<NotificationType>(['challenge', 'evidence', 'seat', 'approved', 'rejected', 'draw_won', 'draw_result', 'trip_cancelled']);

/** Where a notice from the site leads; undefined means its moment */
const systemHref = (n: StoredNotification) => (n.type === 'evidence' ? undefined : n.type === 'rejected' ? (n.eventId ? '/myhub' : n.path ?? '/myhub') : n.type === 'approved' || n.type === 'draw_won' || n.type === 'draw_result' ? n.path : n.type === 'seat' || n.type === 'trip_cancelled' ? `/community/${encodeURIComponent(n.eventId ?? '')}` : `/challenges/${encodeURIComponent(n.questId ?? '')}`);

/** Where a notice about a person leads; undefined means their moment or, without one, their profile */
const personHref = (n: StoredNotification) => ((n.type === 'invite_yes' || n.type === 'invite_no' || n.type === 'plan_soon' || n.type === 'plan_after' || n.type === 'plan_together') && n.path ? n.path : n.type === 'match' && n.eventId ? `/community/${encodeURIComponent(n.eventId)}#meet-again` : (n.type === 'question' || n.type === 'answer') && n.eventId ? `/community/${encodeURIComponent(n.eventId)}#questions` : (n.type === 'joined' || n.type === 'tee_changed' || n.type === 'friend_going') && n.eventId ? `/community/${encodeURIComponent(n.eventId)}` : n.type === 'invite' && n.path ? n.path : undefined);

/**
 * "ชวนไป" (owner 2026-11-10, every section 2026-11-11): a friend invites the reader to a place, a ตี้, an อีเวนต์, a
 * challenge or a post. `path` is that page with the signed invitation (lib/social/inviteLinks.ts), where the reader
 * answers "ไปกัน". One notice per friend and post / event / challenge, however often it is sent.
 */
export async function notifyInvite(recipientId: string, actor: Member, invite: { place: string; path: string; refs: { momentId?: string; eventId?: string; questId?: string } }): Promise<void> {
  const { momentId, eventId, questId } = invite.refs;
  const same = momentId || eventId || questId ? { memberId: recipientId, actorId: actor.id, types: ['invite' as const], momentId, eventId, questId } : undefined;
  await quietly(() => saveAndPush({ id: newId(), memberId: recipientId, type: 'invite', actorId: actor.id, momentId, eventId, questId, preview: invite.place.slice(0, 80) || undefined, path: invite.path, createdAt: now() }, same));
}

/** A friend said "ไปกัน": the host is told and led to the plan's chat */
export async function notifyInviteYes(hostId: string, actor: Member, answer: { place: string; path: string; momentId?: string }): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId: hostId, type: 'invite_yes', actorId: actor.id, momentId: answer.momentId, preview: answer.place.slice(0, 80) || undefined, path: answer.path, createdAt: now() }));
}

/**
 * "รอบนี้ไม่สะดวก" (owner 2026-11-12): the host is not left waiting. In the bell only, never pushed to the phone: a
 * no is not worth a buzz.
 */
export async function notifyInviteNo(hostId: string, actor: Member, answer: { place: string; path: string; momentId?: string }): Promise<void> {
  await quietly(() => notificationStore.add({ id: newId(), memberId: hostId, type: 'invite_no', actorId: actor.id, momentId: answer.momentId, preview: answer.place.slice(0, 80) || undefined, path: answer.path, createdAt: now() }, { memberId: hostId, actorId: actor.id, types: ['invite_no'] }));
}

/** A "ไปกัน" plan's notices (lib/social/friendPlans.ts): the actor is the friend going along, `path` where it leads */
export async function notifyPlan(type: 'plan_soon' | 'plan_after' | 'plan_together', memberId: string, friendId: string, path: string, place: string): Promise<void> {
  await quietly(() => saveAndPush({ id: newId(), memberId, type, actorId: friendId, preview: place.slice(0, 80) || undefined, path, createdAt: now() }));
}


const MESSAGES: Record<NotificationType, string> = { approved: 'ทีมงานอนุมัติแล้ว กดดูได้เลย', rejected: 'ทีมงานยังอนุมัติรายการนี้ไม่ได้ กดดูได้เลย', joined: 'เข้าร่วมตี้ของคุณแล้ว',seat: 'มีที่ว่างในตี้ที่คุณต่อคิวไว้ กันที่ไว้ให้ 2 ชั่วโมง', question: 'ถามคำถามในตี้ของคุณ', answer: 'ตอบคำถามของคุณแล้ว', match: 'อยากเจอคุณอีกเหมือนกัน คุยต่อกันได้แล้ว', evidence: 'ทีมงานตรวจรูปแล้ว โมเมนต์นี้ยังไม่นับในชาเลนจ์', tagged: 'แท็กคุณในโมเมนต์', follow: 'เริ่มติดตามคุณ', like: 'ส่งหัวใจให้โมเมนต์ของคุณ', comment: 'แสดงความคิดเห็นในโมเมนต์ของคุณ', reply: 'ตอบกลับความคิดเห็นของคุณ', comment_like: 'ส่งหัวใจให้ความคิดเห็นของคุณ', challenge: 'คุณทำชาเลนจ์ครบแล้ว กดดูรางวัลได้เลย', draw_won: 'ยินดีด้วย คุณคือผู้โชคดี! กดยืนยันรับรางวัลภายใน 7 วัน', draw_result: 'ประกาศผลรางวัลแล้ว กดดูผลได้เลย', tee_changed: 'เปลี่ยนวัน เวลา หรือสถานที่ของตี้ที่คุณสมัครไว้ เช็กอีกทีว่ายังไปได้ไหม', invite: 'ชวนคุณไปที่นี่ด้วยกัน ไปกันไหม?', friend_going: 'จะไปตี้นี้ ไปด้วยกันไหม?', invite_yes: 'ตอบว่าไปกัน! เปิดแชตนัดวันกันเลย', invite_no: 'รอบนี้ไม่สะดวก ไว้ชวนกันใหม่นะ', plan_soon: 'พรุ่งนี้ไปกันนะ เช็กเวลานัดในแชตอีกที', plan_after: 'ไปมาแล้วเป็นไงบ้าง? โพสต์โมเมนต์ที่นี่แล้วแท็กกันได้เลย', plan_together: 'ไปด้วยกันครบแล้ว! ได้โบนัสไปกับเพื่อน', trip_cancelled: 'ทริปนี้ยกเลิกแล้ว เพราะคนยังไม่ครบ 3 คนก่อนเวลานัด 2 ชั่วโมง ไว้ชวนกันใหม่นะ' };
// A mention in a comment travels as 'tagged' with the comment, but reads as what it is
const messageOf = (n: { type: NotificationType; commentId?: string }) => (n.type === 'tagged' && n.commentId ? 'พูดถึงคุณในความคิดเห็น' : MESSAGES[n.type]);

/** The same words and destination as the bell (components/NotificationBell.tsx) */
function pushMessage(n: StoredNotification, actor?: Member): PushMessage {
  const isSystem = SYSTEM_TYPES.has(n.type);
  const momentHref = n.momentId ? `/moments/${encodeURIComponent(n.momentId)}${n.type === 'comment' || n.type === 'reply' || n.type === 'comment_like' ? '#comments' : ''}` : undefined;
  return {
    title: isSystem || !actor ? 'Chillwaa' : tidyDisplayName(actor.displayName).trim() || actor.displayName,
    body: n.preview ? `${messageOf(n)}\n“${n.preview}”` : messageOf(n),
    url: (isSystem ? systemHref(n) : personHref(n)) ?? momentHref ?? `/profile?id=${encodeURIComponent(n.actorId)}`,
    // Many hearts on one moment stay one notification; a like taken back and given again does not ring twice
    tag: n.type === 'like' ? `like:${n.momentId}` : n.commentId ? `comment:${n.commentId}` : [n.type, n.actorId, n.momentId ?? n.eventId ?? n.questId ?? n.path].filter(Boolean).join(':'),
  };
}

/** Pushed under the same rule as the bell: never someone the member blocked, never to or from a closed account */
async function pushNotice(n: StoredNotification): Promise<void> {
  const devices = await pushStore.listFor([n.memberId]);
  if (devices.length === 0) return;
  const people = await memberRepository.findByIds([n.memberId, n.actorId]);
  const recipient = people.get(n.memberId);
  const actor = people.get(n.actorId);
  if (recipient?.status !== 'active') return;
  if (!SYSTEM_TYPES.has(n.type) && (actor?.status !== 'active' || recipient.blockedIds?.includes(n.actorId))) return;
  await sendPush(devices, () => pushMessage(n, actor));
}

async function pushToAll(memberIds: string[], notice: Pick<StoredNotification, 'type' | 'preview' | 'path'>): Promise<void> {
  const devices = await pushStore.listFor(memberIds);
  if (devices.length === 0) return;
  const people = await memberRepository.findByIds([...new Set(devices.map((d) => d.memberId))]);
  await sendPush(
    devices.filter((d) => people.get(d.memberId)?.status === 'active'),
    (d) => pushMessage({ ...notice, id: '', memberId: d.memberId, actorId: d.memberId, createdAt: '', read: false })
  );
}

async function saveAndPush(notice: Omit<StoredNotification, 'read' | 'readAt'>, replace?: NotificationMatch): Promise<void> {
  await notificationStore.add(notice, replace);
  if (pushConfigured) afterResponse(() => pushNotice({ ...notice, read: false }));
}

export async function notificationsFor(member: Member) {
  const mine = await notificationStore.list(member.id);
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
          href: systemHref(n),
          message: messageOf(n),
          preview: n.preview,
          timeAgo: thaiTimeAgo(n.createdAt),
          createdAt: n.createdAt,
          momentImage: n.momentImage,
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
        href: personHref(n),
        message: messageOf(n),
        preview: n.preview,
        timeAgo: thaiTimeAgo(n.createdAt),
        createdAt: n.createdAt,
        momentImage: n.momentImage,
        read: n.read,
      };
    });
  return { items, unread: items.filter((n) => !n.read).length };
}

export async function markNotificationsRead(memberId: string): Promise<void> {
  await notificationStore.markRead(memberId);
}

/** Account deletion: nothing addressed to, or caused by, the member stays behind */
export async function removeNotificationsOf(memberId: string): Promise<void> {
  await notificationStore.removeInvolving(memberId);
  await pushStore.removeMember(memberId);
}
