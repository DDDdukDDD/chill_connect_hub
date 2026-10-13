import type { Metadata } from 'next';
import { db } from '@/lib/db';

// The page itself is a client component; the title and preview of a shared link are made here on the server.
// The root layout adds the site name to the title.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const quest = await db.findQuestById(decodeURIComponent(id));
  if (!quest || quest.status === 'draft') return { title: 'ชาเลนจ์' };
  const description = quest.targetGoal || quest.objective || 'ชาเลนจ์ชวนออกไปใช้ชีวิต';
  const image = quest.badgeCoverImg || quest.image;
  return {
    title: quest.title,
    description,
    openGraph: { title: quest.title, description, type: 'article', ...(image ? { images: [image] } : {}) },
  };
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
