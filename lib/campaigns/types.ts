import type { RewardShopItem } from '@/data/rewardsData';

/**
 * A marketing campaign (owner 2026-10-25): the words on the home page strip and the /challenges banner, its dates,
 * the challenges that make it up and the reward behind it. Staff edit campaigns in the admin console (?m=campaigns).
 * This file has no server-only imports, so the browser may use it too.
 */
export interface Campaign {
  id: string;
  /** Staff-facing name in the admin list */
  name: string;
  /** Small line above the headline, e.g. "กิจกรรมเปิดตัว Chillwaa" */
  eyebrow: string;
  /** Campaigns give guaranteed rewards only (owner 2026-11-23), so never "ลุ้น" or "จับรางวัล" */
  headline: string;
  /** The longer line on the /challenges banner */
  text: string;
  /** One line under the headline on the home page strip */
  stripText: string;
  /** Button words, e.g. "เริ่มสะสมสิทธิ์" */
  cta: string;
  /** ISO dates (Bangkok); the campaign shows from the first to the last day */
  startDate: string;
  endDate: string;
  /** Prize picture: a path under /public or an https URL; empty → a gift icon */
  prizeImage?: string;
  /** The rewards catalog item (lib/rewards/catalog.ts) the XP is spent on */
  rewardId?: string;
  /** The steps on the banner, in the order a new member meets them */
  questIds: string[];
  /** More challenges that belong to the campaign (welcome, weekly themes, hosts, friends); counted in its stats */
  extraQuestIds: string[];
  /** Shows the strip on the home page while it runs */
  showOnHome: boolean;
  /** Draft campaigns never show on public pages */
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A campaign with what its popup lists: the challenges behind the steps */
export interface CampaignView extends Campaign {
  steps: { id: string; title: string; image?: string; total: number; rewardPoints: number }[];
  /** The catalog item behind `rewardId`, so a page needs no catalog of its own to show the price */
  prize?: RewardShopItem;
}

/** A campaign a member joined (My Hub), or whose reward they redeemed */
export interface MyCampaign {
  campaign: CampaignView;
  enrolledAt: string;
}

/** What one campaign brought in, for the admin page */
export interface CampaignStats {
  /** Members who signed up for it from its popup */
  enrolled: number;
  /** Accounts created during the campaign */
  signups: number;
  /** Of those, how many were checked in at a ตี้ within 14 days of signing up */
  firstTeeWithin14Days: number;
  /** Accounts created through a member's invite link during the campaign */
  invited: number;
  /** Of those, how many went to a ตี้ with the friend who invited them */
  invitedActivated: number;
  /** Rewards redeemed */
  entries: number;
  quests: { id: string; title: string; joined: number; finished: number; isStep: boolean }[];
}

export const bangkokToday = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

/** Running today: published and inside its dates */
export const isCampaignLive = (campaign: Campaign, today = bangkokToday()) =>
  campaign.published && campaign.startDate <= today && today <= campaign.endDate;

/** About ten can run at once (owner 2026-11-04); the admin list warns about the ones past this */
export const MAX_HOME_CAMPAIGNS = 10;

/** The campaigns the home page and /challenges show: live, marked for the home page, the latest start first */
export const homeCampaignsOf = <T extends Campaign>(campaigns: T[], today = bangkokToday()): T[] =>
  campaigns
    .filter((c) => isCampaignLive(c, today) && c.showOnHome)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, MAX_HOME_CAMPAIGNS);

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** "2026-12-31" → "31 ธ.ค. 2569" */
export function campaignDay(iso: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return iso ?? '';
  return `${Number(match[3])} ${THAI_MONTHS[Number(match[2]) - 1]} ${Number(match[1]) + 543}`;
}
