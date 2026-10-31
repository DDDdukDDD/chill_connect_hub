import type { Metadata } from 'next';
import { connection } from 'next/server';
import { discoverCounts, listPublicQuests, listUpcomingEvents } from '@/lib/publicContent';
import { ALL_PROVINCES } from '@/lib/discoverMatch';
import { liveCampaign } from '@/lib/campaigns/store';
import { HOME_CARD_WIDTH, memberHomeData, sizedImage } from '@/lib/homeData';
import { optimizedImage } from '@/lib/optimizedImage';
import { homeEvents } from '@/lib/homeFairs';
import { eventListItem } from '@/lib/listItems';
import { getCommunityEventCategory } from '@/data/masterHub';
import { getPageMember } from '@/lib/members/session';
import { toPublicMember } from '@/lib/members';
import { providerStatus } from '@/lib/members/oauth';
import HomeView from './HomeView';

// The home page's own address: invite and share links (/?invite=…, /?share=…) point search engines here
export const metadata: Metadata = { alternates: { canonical: '/' } };

// Read per request so the visitor landing (meetups, challenges, fairs) is in the server HTML, never a stale build copy.
// The member is read here too: a member gets their home's data with the page (2026-10-29, was five requests after it)
// and a visitor the place count, and neither sees the other's page flash first.
export default async function HomePage() {
  await connection();
  const [upcoming, quests, member] = await Promise.all([listUpcomingEvents(), listPublicQuests(), getPageMember()]);
  // Every ตี้, and of the อีเวนต์ only what the page shows (the row, and a member's band pool)
  const { events, fairTotal } = homeEvents(upcoming, Boolean(member));
  const [memberData, spotTotal] = await Promise.all([
    member ? memberHomeData(member, events) : null,
    member ? null : discoverCounts('', ALL_PROVINCES).then((counts) => counts.spots),
  ]);
  // As list items: the tiles and rows never read the detail-only fields, which were most of the page's weight.
  // Each ตี้ comes with its สาย worked out here: the browser matched keywords for every ตี้ on every สาย card
  // (~900 runs, ~120 ms on a phone); getCommunityEventCategory returns a set lifestyleCategory as it is
  const listed = [...events, ...(memberData?.extraEvents ?? [])].map((event) =>
    eventListItem(event.eventType === 'public_venue' ? event : { ...event, lifestyleCategory: getCommunityEventCategory(event) })
  );
  // The member home's cards show photos as sent (the visitor tiles size their own): resized here for members
  const shownEvents = member ? listed.map(sizedImage) : listed;
  // The prize sits in a box at most 144 px wide; the file is a 200 KB PNG
  const campaign = liveCampaign({ home: true });
  const shownCampaign = campaign?.prizeImage ? { ...campaign, prizeImage: optimizedImage(campaign.prizeImage, 384) } : campaign;
  const shownQuests = member
    ? quests.map((quest) => ({ ...sizedImage(quest), badgeCoverImg: quest.badgeCoverImg && optimizedImage(quest.badgeCoverImg, HOME_CARD_WIDTH) }))
    : quests;
  return (
    <HomeView
      initialEvents={shownEvents}
      initialQuests={shownQuests}
      campaign={shownCampaign}
      signedIn={Boolean(member)}
      // What GET /api/auth/member would answer, so the page knows who is here as it hydrates
      session={{ member: member ? toPublicMember(member) : null, providers: providerStatus() }}
      memberData={memberData}
      spotTotal={spotTotal}
      fairTotal={fairTotal}
    />
  );
}
