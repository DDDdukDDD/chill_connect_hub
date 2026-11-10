import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { MomentAchievement } from '@/lib/moments/types';

/**
 * "พิชิตชาเลนจ์สายคาเฟ่ · 2/3" under a post that counted toward a challenge (FEED_PLAN step 3.5): going out adds up,
 * which is the point of the platform. One quiet line in the challenge colour, linking to the challenge.
 */
export function AchievementLine({ achievement, onDark = false, className = '' }: { achievement: MomentAchievement; onDark?: boolean; className?: string }) {
  const done = achievement.current >= achievement.total;
  return (
    <Link
      href={`/challenges/${encodeURIComponent(achievement.questId)}`}
      className={`group flex items-center gap-1.5 min-w-0 text-[13px] font-semibold ${onDark ? 'text-white pointer-events-auto' : 'text-[#6D28D9]'} ${className}`}
    >
      <Trophy className={`w-4 h-4 shrink-0 ${onDark ? '' : 'text-[#7C3AED]'}`} aria-hidden="true" />
      <span className="min-w-0 truncate group-hover:underline underline-offset-4">พิชิตชาเลนจ์ {achievement.title}</span>
      <span className="shrink-0 whitespace-nowrap tabular-nums">· {done ? 'ครบแล้ว' : `${achievement.current}/${achievement.total}`}</span>
    </Link>
  );
}
