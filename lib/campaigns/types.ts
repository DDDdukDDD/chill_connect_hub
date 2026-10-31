/**
 * A marketing campaign (owner 2026-10-25): the words on the home page strip and the /challenges banner, its dates,
 * the challenges that make it up and the prize behind it. Staff edit campaigns in the admin console (?m=campaigns).
 * This file has no server-only imports, so the browser may use it too.
 */
export interface Campaign {
  id: string;
  /** Staff-facing name in the admin list */
  name: string;
  /** Small line above the headline, e.g. "กิจกรรมเปิดตัว Chillwaa" */
  eyebrow: string;
  /** A draw says ลุ้น, never รับ: not every member gets the prize */
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
  /** Prize picture: a path under /public or an https URL; empty → the strip draws a phone */
  prizeImage?: string;
  /** The rewards catalog item (data/rewardsData.ts) the XP is spent on, usually a draw entry */
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

/** What one campaign brought in, for the admin page */
export interface CampaignStats {
  /** Accounts created during the campaign */
  signups: number;
  /** Of those, how many were checked in at a ตี้ within 14 days of signing up */
  firstTeeWithin14Days: number;
  /** Accounts created through a member's invite link during the campaign */
  invited: number;
  /** Of those, how many went to a ตี้ with the friend who invited them */
  invitedActivated: number;
  /** Prize entries redeemed */
  entries: number;
  quests: { id: string; title: string; joined: number; finished: number; isStep: boolean }[];
}

export const bangkokToday = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

/** Running today: published and inside its dates */
export const isCampaignLive = (campaign: Campaign, today = bangkokToday()) =>
  campaign.published && campaign.startDate <= today && today <= campaign.endDate;

/** The one campaign the home strip shows: live, marked for the home page, the latest start wins (the admin list warns about the others) */
export const homeCampaignOf = <T extends Campaign>(campaigns: T[], today = bangkokToday()): T | null =>
  [...campaigns].sort((a, b) => b.startDate.localeCompare(a.startDate)).find((c) => isCampaignLive(c, today) && c.showOnHome) ?? null;

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** "2026-12-31" → "31 ธ.ค. 2569" */
export function campaignDay(iso: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return iso ?? '';
  return `${Number(match[3])} ${THAI_MONTHS[Number(match[2]) - 1]} ${Number(match[1]) + 543}`;
}
