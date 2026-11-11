import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { inviteInfo } from '@/lib/social/friendPlans';
import { inviteLinkStore, isInviteCode } from '@/lib/social/inviteLinkStore';
import { pageMetadata, PRIVATE_PAGE } from '@/lib/site';
import { InviteRedirect } from './InviteRedirect';

/**
 * A short "ชวนไป" link (owner 2026-11-11): www.chillwaa.com/i/<code>. LINE reads this page for the preview card, so it
 * names who asked and where, with the place's picture; a person is sent straight on to the page itself with the
 * invitation (`?invite=`), where the banner asks "ไปกันไหม". Not a server redirect: LINE would follow it and show the
 * plain page's card instead of the invitation.
 */
type Props = { params: Promise<{ code: string }> };

const linkOf = cache(async (code: string) => (isInviteCode(code) ? inviteLinkStore.byCode(code) : null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const link = await linkOf(code);
  const info = link ? await inviteInfo(null, link.token) : null;
  if (!link || !info) return { ...PRIVATE_PAGE, title: 'คำชวน' };
  const going = [info.dateLabel, info.goingCount > 1 ? `ไปกันแล้ว ${info.goingCount} คน` : ''].filter(Boolean).map((part) => `${part} · `).join('');
  return {
    ...pageMetadata({
      title: `${info.host.name} ชวนคุณไป${info.kind === 'tee' ? `ตี้ ${info.title}` : info.title}`,
      description: `${going}กดดูแล้วตอบได้เลยว่าไปกันไหม`,
      path: `/i/${code}`,
      image: info.image,
    }),
    ...PRIVATE_PAGE,
  };
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const link = await linkOf(code);
  if (!link) notFound();
  const href = `${link.path}${link.path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(link.token)}`;
  return <InviteRedirect href={href} />;
}
