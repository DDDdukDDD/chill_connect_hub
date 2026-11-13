import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import type { Member } from '../members/types';
import { momentRepository } from './index';

/**
 * Who gave a moment a heart, newest first, for any signed-in member, like IG (owner 2026-11-13; until then only the
 * author could look). When the author hid the likes only they can. Blocked people either way and closed accounts are
 * left out; the viewer is in the list too, without a follow button.
 */
export async function momentLikers(viewer: Member, momentId: string) {
  const moment = await momentRepository.findById(momentId);
  if (!moment || moment.status === 'removed') throw new MemberAuthError('ไม่พบโมเมนต์', 404);
  if (moment.likesOff && moment.authorId !== viewer.id) throw new MemberAuthError('เจ้าของโพสต์ซ่อนยอดถูกใจไว้', 403);
  const ids = [...moment.likedBy].reverse();
  const people = await memberRepository.findByIds(ids);
  const following = new Set(viewer.followingIds ?? []);
  return ids
    .map((id) => people.get(id))
    .filter((m): m is Member => Boolean(m && m.status === 'active' && !viewer.blockedIds?.includes(m.id) && !m.blockedIds?.includes(viewer.id)))
    .map((m) => ({ id: m.id, name: tidyDisplayName(m.displayName).trim() || m.displayName, avatar: m.avatarUrl ?? '', isFollowing: following.has(m.id), ...(m.id === viewer.id ? { isMe: true } : {}) }));
}
