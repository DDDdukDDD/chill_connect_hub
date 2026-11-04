import { type RewardShopItem, REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { drawWinnerMessage, sendMail } from '../members/mailer';
import { notifyDrawResult, notifyDrawWon } from '../social/notifications';
import { entryCodeOf } from '../social/rewardsLedger';
import { redemptionStore } from '../social/stores';
import { absoluteUrl } from '../site';
import { CampaignError, findCampaign, listCampaigns } from './store';
import { type Campaign, type CampaignResult, type DrawCampaign, CLAIM_DAYS, RESULTS_PATH, bangkokToday } from './types';
import { type CampaignWinner, type PoolEntry, winnerStore } from './winners';

/**
 * The prize draw (owner 2026-11-04). Staff draw after the campaign ends and on or after the draw date, look at who
 * came up, then announce: only then do members hear and the result goes public. A winner has CLAIM_DAYS to press
 * claim; staff then check who they are and mark the prize as given, or mark it forfeited and draw again.
 */
const prizeOf = (campaign: Campaign): (RewardShopItem & { drawEntry: NonNullable<RewardShopItem['drawEntry']> }) | null => {
  const prize = REWARD_SHOP_ITEMS.find((item) => item.id === campaign.rewardId);
  return prize?.drawEntry ? (prize as RewardShopItem & { drawEntry: NonNullable<RewardShopItem['drawEntry']> }) : null;
};

const winnerPath = (campaignId: string) => `/myhub?campaign=${encodeURIComponent(campaignId)}`;
const resultPath = (campaignId: string) => `${RESULTS_PATH}#${encodeURIComponent(campaignId)}`;

/** Who can be drawn: an active real member holding an entry. A suspended or deleted account stays out */
async function poolOf(rewardId: string): Promise<PoolEntry[]> {
  const entries = await redemptionStore.ofReward(rewardId);
  const members = await memberRepository.findByIds(entries.map((entry) => entry.memberId));
  return entries.flatMap((entry) => {
    const member = members.get(entry.memberId);
    return member?.status === 'active' && !member.isSample ? [{ memberId: entry.memberId, code: entryCodeOf(entry.id, rewardId) as string }] : [];
  });
}

/** Why this campaign cannot be drawn today, or null */
function drawRefusal(campaign: Campaign, all: Campaign[], winners: CampaignWinner[]): string | null {
  const prize = prizeOf(campaign);
  if (!prize) return 'แคมเปญนี้ไม่มีการจับรางวัล';
  const today = bangkokToday();
  if (!campaign.published) return 'แคมเปญนี้ยังเป็นฉบับร่าง';
  if (today <= campaign.endDate) return 'แคมเปญยังไม่จบ จับรางวัลได้หลังวันจบ';
  if (prize.drawEntry.drawDate && today < prize.drawEntry.drawDate) return `ยังไม่ถึงวันจับรางวัล (${prize.drawEntry.drawLabel})`;
  // Entries belong to the reward, so two campaigns on one reward would draw from one pool twice
  const sibling = all.find((c) => c.id !== campaign.id && c.rewardId === campaign.rewardId && winners.some((w) => w.campaignId === c.id));
  return sibling ? `ของรางวัลนี้จับไปแล้วในแคมเปญ ${sibling.name}` : null;
}

/** The draw page: every campaign with a draw, newest first, with its entries and winners */
export async function drawCampaigns(): Promise<DrawCampaign[]> {
  const [all, winners] = await Promise.all([listCampaigns(), winnerStore.all()]);
  const views = await Promise.all(
    all.filter(prizeOf).map(async (campaign) => {
      const prize = prizeOf(campaign)!;
      const rows = winners.filter((w) => w.campaignId === campaign.id);
      const people = await memberRepository.findByIds(rows.flatMap((w) => (w.memberId ? [w.memberId] : [])));
      const pool = await poolOf(prize.id);
      return {
        id: campaign.id,
        name: campaign.name,
        endDate: campaign.endDate,
        prizeTitle: prize.discountValue,
        drawLabel: prize.drawEntry.drawLabel,
        prizeCount: prize.drawEntry.prizeCount,
        entries: pool.length,
        refusal: drawRefusal(campaign, all, winners),
        winners: rows.map(({ memberId, ...w }) => {
          const person = memberId ? people.get(memberId) : undefined;
          return { ...w, name: person?.displayName ?? 'บัญชีถูกลบแล้ว', email: person?.email, phone: person?.phone };
        }),
      };
    })
  );
  return views;
}

async function tellWinner(winner: CampaignWinner, campaign: Campaign, prizeTitle: string): Promise<void> {
  if (!winner.memberId) return;
  await notifyDrawWon(winner.memberId, winnerPath(campaign.id), campaign.headline);
  const member = await memberRepository.findById(winner.memberId);
  // The time to claim is short and the bell needs the member to come back, so a confirmed address hears as well
  if (member?.email && member.emailVerified) {
    await sendMail({ to: member.email, ...drawWinnerMessage(tidyDisplayName(member.displayName), prizeTitle, winner.code, absoluteUrl(winnerPath(campaign.id)), CLAIM_DAYS) });
  }
}

/** Draws until the prize count stands. Results already out: the new winner is told at once, nobody else hears again */
export async function drawWinners(campaignId: string, staff: string): Promise<CampaignWinner[]> {
  const campaign = await findCampaign(campaignId);
  if (!campaign) throw new CampaignError('ไม่พบแคมเปญนี้', 404);
  const refusal = drawRefusal(campaign, await listCampaigns(), await winnerStore.all());
  if (refusal) throw new CampaignError(refusal, 409);
  const prize = prizeOf(campaign)!;
  const pool = await poolOf(prize.id);
  if (pool.length === 0) throw new CampaignError('ยังไม่มีผู้มีสิทธิ์ลุ้น', 409);
  const drawn = await winnerStore.draw(campaign.id, pool, prize.drawEntry.prizeCount, staff);
  if (drawn.length === 0) throw new CampaignError('ไม่มีรางวัลให้จับเพิ่ม หรือไม่เหลือผู้มีสิทธิ์แล้ว', 409);
  for (const winner of drawn) if (winner.announcedAt) await tellWinner(winner, campaign, prize.discountValue);
  return drawn;
}

/** Goes public: winners get a notice and an email, everyone else holding an entry gets a notice with the result */
export async function announceResults(campaignId: string): Promise<CampaignWinner[]> {
  const campaign = await findCampaign(campaignId);
  const prize = campaign && prizeOf(campaign);
  if (!campaign || !prize) throw new CampaignError('ไม่พบแคมเปญนี้', 404);
  const announced = await winnerStore.announce(campaign.id);
  if (announced.length === 0) throw new CampaignError('ยังไม่มีผู้โชคดีที่รอประกาศ', 409);
  for (const winner of announced) await tellWinner(winner, campaign, prize.discountValue);
  const won = new Set((await winnerStore.all()).filter((w) => w.campaignId === campaign.id).map((w) => w.memberId));
  const others = (await redemptionStore.ofReward(prize.id)).map((entry) => entry.memberId).filter((id) => !won.has(id));
  await notifyDrawResult(others, resultPath(campaign.id), campaign.headline);
  return announced;
}

/** The winner says they want the prize, inside the time to claim */
export async function claimPrize(memberId: string, campaignId: string): Promise<void> {
  const win = (await winnerStore.ofMember(memberId)).find((w) => w.campaignId === campaignId && w.announcedAt);
  if (!win) throw new CampaignError('ไม่พบสิทธิ์รับรางวัลนี้', 404);
  if (win.status !== 'pending') return;
  if (!win.claimBy || Date.parse(win.claimBy) < Date.now()) throw new CampaignError('เลยกำหนดยืนยันรับรางวัลแล้ว', 409);
  if (!(await winnerStore.move(win.id, ['pending'], 'claimed'))) throw new CampaignError('ยืนยันรับรางวัลไม่สำเร็จ กรุณาลองใหม่', 409);
}

/** Staff: the prize reached the winner, or the winner lost it (time ran out, identity did not check out) */
export async function decideWinner(winnerId: string, decision: 'confirmed' | 'forfeited'): Promise<CampaignWinner> {
  const moved = await winnerStore.move(winnerId, decision === 'confirmed' ? ['claimed'] : ['pending', 'claimed'], decision);
  if (!moved) throw new CampaignError('สถานะของผู้โชคดีคนนี้เปลี่ยนไปแล้ว ลองโหลดใหม่', 409);
  return moved;
}

/** "ส•••": enough for friends to recognise, not a full name on a public page. The entry code says who it is */
const maskedName = (name: string | undefined) => (name ? `${Array.from(tidyDisplayName(name).trim())[0] ?? ''}•••` : 'ผู้โชคดี');

/** What the public results page shows: announced campaigns, newest first, without winners who gave the prize up */
export async function publicResults(): Promise<CampaignResult[]> {
  const winners = (await winnerStore.all()).filter((w) => w.announcedAt);
  const campaigns = (await listCampaigns()).filter((c) => c.published && winners.some((w) => w.campaignId === c.id));
  const standing = winners.filter((w) => w.status !== 'forfeited');
  const people = await memberRepository.findByIds(standing.flatMap((w) => (w.memberId ? [w.memberId] : [])));
  return campaigns
    .map((campaign) => {
      const rows = winners.filter((w) => w.campaignId === campaign.id);
      const prize = prizeOf(campaign);
      return {
        id: campaign.id,
        headline: campaign.headline,
        image: campaign.prizeImage,
        prizeTitle: prize?.discountValue ?? '',
        announcedAt: rows.map((w) => w.announcedAt as string).sort()[0],
        entries: Math.max(...rows.map((w) => w.poolSize)),
        winners: rows.filter((w) => w.status !== 'forfeited').map((w) => ({ code: w.code, name: maskedName(w.memberId ? people.get(w.memberId)?.displayName : undefined) })),
      };
    })
    .sort((a, b) => b.announcedAt.localeCompare(a.announcedAt));
}
