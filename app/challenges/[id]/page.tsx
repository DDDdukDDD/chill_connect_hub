import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import type { QuestDetail } from '@/lib/questDisplay';
import { metaDescription, pageMetadata } from '@/lib/site';
import { buildQuestDetail } from '@/lib/social/questDetail';
import { breadcrumbJsonLd, jsonLdHtml } from '@/lib/structuredData';
import ChallengeDetailView from './ChallengeDetailView';

type Props = { params: Promise<{ id: string }> };

const getPublicQuest = cache(async (id: string) => {
  const quest = await db.findQuestById(id);
  return quest && quest.status !== 'draft' ? quest : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quest = await getPublicQuest(decodeURIComponent((await params).id));
  if (!quest) return { title: 'ชาเลนจ์' };
  return pageMetadata({
    title: quest.title,
    description: metaDescription(quest.targetGoal || quest.objective || 'ชาเลนจ์ชวนออกไปใช้ชีวิต'),
    path: `/challenges/${encodeURIComponent(quest.id)}`,
    image: quest.badgeCoverImg || quest.image,
    type: 'article',
  });
}

// The public part (the challenge, where to go, related ones) is built here so it is in the server HTML.
// The signed-in member's progress is added in the browser, as before.
export default async function ChallengeDetailPage({ params }: Props) {
  const quest = await getPublicQuest(decodeURIComponent((await params).id));
  if (!quest) notFound();
  const detail = (await buildQuestDetail(quest, null)) as QuestDetail;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          breadcrumbJsonLd([{ name: 'ชาเลนจ์', path: '/challenges' }, { name: quest.title, path: `/challenges/${encodeURIComponent(quest.id)}` }])
        )}
      />

      <ChallengeDetailView initialDetail={detail} />
    </>
  );
}
