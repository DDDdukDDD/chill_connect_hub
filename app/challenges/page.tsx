import { connection } from 'next/server';
import { listPublicQuests } from '@/lib/publicContent';
import { liveCampaign } from '@/lib/campaigns/store';
import { challengeCollectionJsonLd, jsonLdHtml } from '@/lib/structuredData';
import ChallengesListView from './ChallengesListView';

type Props = { searchParams: Promise<{ q?: string }> };

// Read per request so the challenges are in the server HTML, never a stale build copy.
// ?q= comes from the ค้นพบ search ("ชาเลนจ์ที่ตรงกับ…").
export default async function ChallengesPage({ searchParams }: Props) {
  await connection();
  const { q } = await searchParams;
  const quests = await listPublicQuests();
  return (
    <>
      {/* The open challenges as a list search engines read, each linking to its own page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(
          challengeCollectionJsonLd(
            quests.filter((quest) => quest.status !== 'ended' && (quest.daysRemaining === undefined || quest.daysRemaining > 0)),
            '/challenges',
            'ชาเลนจ์ชวนออกไปใช้ชีวิต',
            'ชาเลนจ์ชวนออกไปใช้ชีวิต ไปตามที่ เข้าร่วมตี้ เก็บ XP รับเหรียญตรา และแลกของรางวัลจากพาร์ทเนอร์'
          )
        )}
      />
      <ChallengesListView initialQuests={quests} initialQuery={typeof q === 'string' ? q : ''} campaign={liveCampaign({ home: true })} />
    </>
  );
}
