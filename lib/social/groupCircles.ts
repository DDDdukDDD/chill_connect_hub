import type { EventItem } from '@/data/mockData';
import { cacheManager } from '../cache';
import { db } from '../db';
import { isClosedToJoin, isEventEnded, meetupTimes, parseEventEndDateToTimestamp } from '../dateUtils';
import { tidyDisplayName } from '../displayName';
import { memberRepository, type Member } from '../members';
import { momentRepository } from '../moments';
import { isPubliclyVisible, loadPeople, thaiTimeAgo } from '../moments/service';
import { GROUP_CIRCLES_MAX, GROUP_CIRCLE_MIN_PEOPLE, GROUP_CIRCLE_WINDOW_DAYS } from './socialRules';

/**
 * Group Circles (Circles round B, owner 2026-11-16): a ตี้ that just ended, as one Circle with the faces of the group.
 * It shows only with proof that the group really met: at least GROUP_CIRCLE_MIN_PEOPLE people who went, counted from
 * the host's check-ins (a check-in means the host was there too) and from posts tied to the ตี้ by people on it
 * (with the friends they tagged who were on it). At most GROUP_CIRCLES_MAX in the row.
 *
 * Who sees it: the people who went (they see everyone who went), and readers who follow someone who posted from it.
 * A check-in alone never publishes a name (as "ใครเคยไป", lib/social/visits.ts), so outsiders see only the posters'
 * faces and the head count.
 */

export interface GroupCircle {
  /** `g:<eventId>` */
  id: string;
  kind: 'group';
  tee: { id: string; title: string; image?: string; href: string };
  /** The faces this reader may see, people they follow first */
  people: { id: string; name: string; avatar?: string }[];
  /** Everyone who went (proven), named or not */
  count: number;
  /** Photos of the public posts from the ตี้, newest first */
  photos: { url: string; momentId: string }[];
  /** The reader went */
  wasThere: boolean;
  /** Where the main button goes: the host's next open ตี้, or ตี้ of the same kind */
  next: { href: string; title?: string };
  timeAgo: string;
  at: string;
}

interface Group {
  event: EventItem;
  endedAt: number;
  /** Everyone proven to have gone */
  went: string[];
  /** The authors of the public posts (their faces are public) */
  posters: string[];
  photos: { url: string; momentId: string }[];
}

const PHOTOS_MAX = 6;
const FACES_MAX = 5;

/** The member who runs the ตี้; samples and official ones have none */
const hostOf = (event: EventItem) => (event as { createdByMemberId?: string }).createdByMemberId;

const endOf = (event: EventItem) => meetupTimes(event)?.end ?? parseEventEndDateToTimestamp(event.date);

/** The groups of every ตี้ that ended in the window, the same for every reader: read at most once a minute */
const recentGroups = () =>
  cacheManager.getOrSet(
    'circles:groups',
    async (): Promise<Group[]> => {
      const now = Date.now();
      const since = now - GROUP_CIRCLE_WINDOW_DAYS * 86_400_000;
      const ended = (await db.listAllEvents()).filter((event) => {
        if (event.eventType === 'public_venue' || event.approvalStatus !== 'approved' || event.status === 'cancelled' || !isEventEnded(event)) return false;
        const end = endOf(event);
        return end >= since && end <= now;
      });
      if (ended.length === 0) return [];
      const participants = await db.listParticipantsByEvent(ended.map((event) => event.id));
      const groups: Group[] = [];
      for (const event of ended) {
        const list = participants.get(event.id) ?? [];
        const host = hostOf(event);
        const onIt = new Set([...list.map((p) => p.userId), ...(host ? [host] : [])]);
        const went = new Set<string>();
        for (const p of list) if (p.checkedInAt) went.add(p.userId);
        if (went.size > 0 && host) went.add(host);
        const { items } = await momentRepository.query({ statuses: ['published'], targetType: 'community', targetId: event.id, sort: 'newest', page: 1, limit: 30 });
        const people = await loadPeople(items);
        const posters: string[] = [];
        const photos: Group['photos'] = [];
        for (const moment of items) {
          // Only people on the ตี้ count: a post tied to it by someone else proves nothing about the group
          if (!moment.authorId || !onIt.has(moment.authorId) || !isPubliclyVisible(moment, people)) continue;
          went.add(moment.authorId);
          if (!posters.includes(moment.authorId)) posters.push(moment.authorId);
          for (const id of moment.taggedIds ?? []) if (onIt.has(id)) went.add(id);
          if (photos.length < PHOTOS_MAX && moment.images?.[0]) photos.push({ url: moment.images[0], momentId: moment.id });
        }
        if (went.size >= GROUP_CIRCLE_MIN_PEOPLE) groups.push({ event, endedAt: endOf(event), went: [...went], posters, photos });
      }
      return groups;
    },
    { ttlMs: 60_000, tags: ['achievements'] }
  );

/** The host's next ตี้ still open to join, else ตี้ of the same kind */
function nextFor(event: EventItem, all: EventItem[], now: number): GroupCircle['next'] {
  const host = hostOf(event);
  const upcoming = host
    ? all
        .filter((other) => other.id !== event.id && hostOf(other) === host && other.eventType !== 'public_venue' && other.approvalStatus === 'approved' && !isClosedToJoin(other, now))
        .sort((a, b) => (meetupTimes(a)?.start ?? 0) - (meetupTimes(b)?.start ?? 0))[0]
    : undefined;
  if (upcoming) return { href: `/community/${encodeURIComponent(upcoming.id)}`, title: upcoming.title };
  return { href: event.category ? `/community?category=${encodeURIComponent(event.category)}` : '/community' };
}

export async function groupCircles(viewer: Member): Promise<GroupCircle[]> {
  const groups = await recentGroups();
  if (groups.length === 0) return [];
  const following = new Set(viewer.followingIds ?? []);
  const blocked = new Set(viewer.blockedIds ?? []);
  // The reader's own groups first, then the ones with more people they follow, then the newest
  const seen = groups
    .map((group) => {
      const wasThere = group.went.includes(viewer.id);
      const friends = group.posters.filter((id) => following.has(id) && !blocked.has(id)).length;
      return { group, wasThere, friends };
    })
    .filter(({ wasThere, friends }) => wasThere || friends > 0)
    .sort((a, b) => Number(b.wasThere) - Number(a.wasThere) || b.friends - a.friends || b.group.endedAt - a.group.endedAt)
    .slice(0, GROUP_CIRCLES_MAX);
  if (seen.length === 0) return [];

  const faceIds = new Set(seen.flatMap(({ group, wasThere }) => (wasThere ? group.went : group.posters)));
  const [people, all] = await Promise.all([memberRepository.findByIds([...faceIds]), db.listAllEvents()]);
  const now = Date.now();
  return seen.map(({ group, wasThere }): GroupCircle => {
    const rank = (id: string) => (following.has(id) ? 0 : 1);
    const faces = (wasThere ? group.went : group.posters)
      .filter((id) => id !== viewer.id && !blocked.has(id))
      .flatMap((id) => {
        const person = people.get(id);
        if (!person || person.status !== 'active' || person.blockedIds?.includes(viewer.id)) return [];
        return [{ id, name: tidyDisplayName(person.displayName).trim() || person.displayName, ...(person.avatarUrl ? { avatar: person.avatarUrl } : {}) }];
      })
      .sort((a, b) => rank(a.id) - rank(b.id))
      .slice(0, FACES_MAX);
    const at = new Date(group.endedAt).toISOString();
    return {
      id: `g:${group.event.id}`,
      kind: 'group',
      tee: { id: group.event.id, title: group.event.title, ...(group.event.image ? { image: group.event.image } : {}), href: `/community/${encodeURIComponent(group.event.id)}` },
      people: faces,
      count: group.went.length,
      photos: group.photos,
      wasThere,
      next: nextFor(group.event, all, now),
      timeAgo: thaiTimeAgo(at, now),
      at,
    };
  });
}
