// data/launchCampaign.ts
// Seed for the campaigns store of a clone without a database (lib/campaigns/store.ts): the launch campaign, three
// steps that take a new member out for real, plus other campaign challenges (BE-135, BE-136). No prize draw and no
// linked reward (owner 2026-11-23: guaranteed rewards only): each challenge gives its own XP and badge.
// On a database the campaign is written by db/apply-launch-campaign.mjs (the same words; keep the two alike), and
// staff edit campaigns in the admin console.
import type { Campaign } from '@/lib/campaigns/types';

export const LAUNCH_CAMPAIGN: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
  id: 'launch-2569',
  name: 'กิจกรรมเปิดตัว Chillwaa',
  eyebrow: 'กิจกรรมเปิดตัว Chillwaa',
  headline: 'ออกไปใช้ชีวิตจริง ครบ 3 อย่าง',
  text: 'เข้าตี้แรก แชร์โมเมนต์จาก 3 ที่เที่ยว และไปอีเวนต์กับเพื่อนๆ ทุกชาเลนจ์ได้ XP และเหรียญของตัวเองทันทีที่ทำครบ',
  stripText: 'เข้าตี้ แชร์โมเมนต์ ไปอีเวนต์ เก็บ XP และเหรียญ',
  cta: 'เริ่มเลย',
  prizeImage: '/images/challenges/join-first-tee.webp',
  startDate: '2026-11-26',
  endDate: '2026-12-31',
  questIds: ['welcome-first-tee', 'launch-spots', 'launch-fair'],
  extraQuestIds: [
    'host-starter', 'friend-ticket', 'squad-tee', 'weekend-passport-dec',
    'theme-hidden-cafe', 'theme-green-park', 'theme-art-day', 'theme-market', 'theme-sunset-view',
  ],
  showOnHome: true,
  published: true,
};
