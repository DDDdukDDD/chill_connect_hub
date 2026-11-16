import { removePlansBy } from '../social/friendPlans';
import { removeNotificationsOf } from '../social/notifications';
import { removeMeetAgainOf } from '../social/meetAgain';
import { removeWaitlistOf } from '../social/waitlist';
import { removeQuestionsOf } from '../social/eventQuestions';
import { deleteMemberUploads } from '../media/cleanup';
import { removeReviewsBy } from '../social/reviews';
import { removeVisitsBy } from '../social/visits';
import { removeRedemptionsBy } from '../social/rewardsLedger';
import { removeQuestJoinsBy } from '../social/questJoins';
import { removeCampaignEntriesBy } from '../campaigns/members';
import { removeWinnerEntriesBy } from '../campaigns/winners';
import { removeVouchersBy } from '../social/questVouchers';
import { removeFinishesBy } from '../social/questFinishes';
import { removeContentReportsBy } from '../social/contentReports';
import { removeFairGroupsOf } from '../social/fairGroups';
import { removeChatMessagesBy } from '../social/chat';
import { db } from '../db';
import { recordAudit } from '../auditLog';
import { momentRepository } from '../moments';
import { momentFiles } from '../moments/service';
import { memberRepository } from './index';
import type { Member } from './types';

/**
 * PDPA: deletes one account and everything it posted (moved here from app/api/auth/member/account in BE-393).
 * Deleting an owner deletes its sub-accounts first, the same way, so nothing they posted is left behind.
 */
/** `by: 'staff'`: the admin console deletes (a PDPA erasure request) and writes its own audit entry */
export async function deleteMemberAccount(member: Member, by: 'self' | 'staff' = 'self'): Promise<{ removedMoments: number; removedComments: number }> {
  let removedMoments = 0;
  let removedComments = 0;
  if (!member.ownerId) {
    for (const sub of await memberRepository.findSubAccounts(member.id)) {
      const removed = await deleteMemberAccount(sub, by);
      removedMoments += removed.removedMoments;
      removedComments += removed.removedComments;
    }
  }
  // The member's posts, comments, likes, saves and reports go with the account
  const { items: ownMoments } = await momentRepository.query({ statuses: ['published', 'hidden'], authorId: member.id, sort: 'newest', page: 1, limit: 10_000 });
  const moments = await momentRepository.removeByAuthor(member.id);
  const comments = await momentRepository.removeCommentsByAuthor(member.id);
  await removeReviewsBy(member.id);
  await removeVisitsBy(member.id);
  await removeRedemptionsBy(member.id);
  await removeQuestJoinsBy(member.id);
  await removeCampaignEntriesBy(member.id);
  await removePlansBy(member.id);
  await removeWinnerEntriesBy(member.id);
  await removeVouchersBy(member.id);
  await removeFinishesBy(member.id);
  await removeContentReportsBy(member.id);
  await removeFairGroupsOf(member.id);
  await removeChatMessagesBy(member.id);
  await db.removeParticipantEverywhere(member.id);
  await removeNotificationsOf(member.id);
  await removeMeetAgainOf(member.id);
  await removeWaitlistOf(member.id);
  await removeQuestionsOf(member.id);
  await memberRepository.remove(member.id);
  // The photos themselves go too, unless something that remains still shows them
  const { items: remaining } = await momentRepository.query({ statuses: ['published', 'hidden'], sort: 'newest', page: 1, limit: 10_000 });
  await deleteMemberUploads([...ownMoments.flatMap(momentFiles), member.avatarUrl], remaining.flatMap(momentFiles));
  // Keep proof that the deletion happened, without keeping who it was
  if (by === 'self') recordAudit(null, 'member.self_delete', `สมาชิกลบบัญชี${member.ownerId ? 'ย่อย' : ''}ของตัวเอง (โมเมนต์ ${moments} คอมเมนต์ ${comments})`, { type: 'member', id: member.id });
  return { removedMoments: removedMoments + moments, removedComments: removedComments + comments };
}
