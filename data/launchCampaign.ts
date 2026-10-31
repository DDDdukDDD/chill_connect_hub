// data/launchCampaign.ts
// Seed for the campaigns store (lib/campaigns/store.ts): the launch campaign, three starter challenges (one per
// pillar) whose XP adds up to an entry in the prize draw, plus the other campaign challenges (BE-135, BE-136).
// Staff edit campaigns in the admin console; this file only fills an empty store.
// SAMPLE: the prize, dates and draw are made up for the prototype; listed in docs/LAUNCH_CHECKLIST.md.
import type { Campaign } from '@/lib/campaigns/types';

export const LAUNCH_CAMPAIGN: Omit<Campaign, 'createdAt' | 'updatedAt'> = {
  id: 'launch-2569',
  name: 'กิจกรรมเปิดตัว ลุ้น iPhone Duo',
  eyebrow: 'กิจกรรมเปิดตัว Chillwaa',
  headline: 'แค่ออกไปใช้ชีวิต ก็ลุ้น iPhone Duo ฟรี',
  text: 'ไปตี้แรก แชร์โมเมนต์จากที่เที่ยว และไปอีเวนต์กับเพื่อนๆ ครบสามชาเลนจ์ก็ได้ XP 500 พอแลกสิทธิ์ลุ้นแล้ว',
  stripText: 'ไปตี้ แชร์โมเมนต์ ไปอีเวนต์ ครบ 3 ชาเลนจ์ รับสิทธิ์ลุ้นทันที',
  cta: 'เริ่มสะสมสิทธิ์',
  // SAMPLE: a product render the owner supplied for the prototype (2026-10-25); replace with a photo we own before launch
  prizeImage: '/campaign/iphone-duo.png',
  startDate: '2026-10-25',
  endDate: '2026-12-31',
  rewardId: 'reward-launch-iphone',
  questIds: ['launch-tee', 'launch-spots', 'launch-fair'],
  extraQuestIds: [
    'welcome-first-tee', 'host-starter', 'friend-ticket', 'squad-tee', 'weekend-passport-nov', 'weekend-passport-dec',
    'theme-hidden-cafe', 'theme-green-park', 'theme-art-day', 'theme-market', 'theme-sunset-view', 'theme-year-end-tee',
  ],
  showOnHome: true,
  published: true,
};
