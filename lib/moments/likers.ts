import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { momentRepository } from './index';

/**
 * Who gave the viewer's own moment a heart, newest first (owner 2026-11-07). Only the person who posted it sees the
 * names: people here meet strangers, so a list of who likes whom stays with the owner; everyone else sees the count.
 * Blocked people either way and closed accounts are left out.
 */
export async function momentLikers(viewer: Member, momentId: string) {
  const moment = await momentRepository.findById(momentId);
  if (!moment || moment.status === 'removed') throw new MemberAuthError('ไม่พบโมเมนต์', 404);
  if (moment.authorId !== viewer.id) throw new MemberAuthError('ดูได้เฉพาะเจ้าของโมเมนต์', 403);
  const ids = [...moment.likedBy].reverse().filter((id) => id !== viewer.id);
  const people = await memberRepository.findByIds(ids);
  const following = new Set(viewer.followingIds ?? []);
  return ids
    .map((id) => people.get(id))
    .filter((m): m is Member => Boolean(m && m.status === 'active' && !viewer.blockedIds?.includes(m.id) && !m.blockedIds?.includes(viewer.id)))
    .map((m) => ({ id: m.id, name: tidyDisplayName(m.displayName).trim() || m.displayName, avatar: m.avatarUrl ?? '', isFollowing: following.has(m.id) }));
}
