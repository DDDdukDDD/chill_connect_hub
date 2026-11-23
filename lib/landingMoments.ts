import { listMoments } from '@/lib/moments/service';
import type { WallMoment } from '@/components/FriendsMomentsWall';

/** Fewer real moments than this and the landing leaves "เพื่อน & โมเมนต์" out rather than fill it */
const MIN_SHOWN = 4;
const MAX_SHOWN = 8;

/**
 * "เพื่อน & โมเมนต์" on the visitor landing from real public moments (2026-11-24, sample data removed before launch;
 * until then a fixed set of made-up people, data/landingMomentsSample.ts). The same popular-and-new mix /moments opens
 * with, photo posts only, one per person, people with a profile picture and a caption first. Read on the server, so it
 * is in the HTML. Hidden, removed and private posts never reach listMoments for a visitor.
 */
export async function landingMoments(): Promise<WallMoment[]> {
  try {
    const { moments } = await listMoments(null, { tab: 'mix', limit: 48 });
    const people = new Set<string>();
    const picked: WallMoment[] = [];
    const ranked = moments
      .filter((m) => m.images?.[0] && !m.video && m.authorId && m.userAvatar)
      .sort((a, b) => Number(Boolean(b.caption?.trim())) - Number(Boolean(a.caption?.trim())));
    for (const m of ranked) {
      if (people.has(m.authorId!)) continue;
      people.add(m.authorId!);
      picked.push({
        id: m.id,
        authorId: m.authorId,
        userName: m.userName,
        userAvatar: m.userAvatar,
        images: m.images,
        caption: m.caption?.trim() ?? '',
        location: m.location ?? '',
        targetTitle: m.targetTitle,
        targetType: m.targetType,
        targetId: m.targetId,
        likesCount: m.likesCount,
        commentsCount: m.commentsCount,
        timeAgo: m.timeAgo,
        comments: m.comments.filter((c) => !c.parentId && c.text).slice(0, 2).map((c) => ({ userName: c.userName, userAvatar: c.userAvatar, text: c.text, isMine: false })),
      });
      if (picked.length === MAX_SHOWN) break;
    }
    return picked.length >= MIN_SHOWN ? picked : [];
  } catch {
    return [];
  }
}
