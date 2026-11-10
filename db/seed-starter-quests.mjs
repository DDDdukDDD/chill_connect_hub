// The two starter challenges (owner 2026-11-11): things a new member can do in a minute from the sofa, offered at the
// end of onboarding. They count posts, not visits (QuestRule.posts in data/mockData.ts), and finish once.
// Created through the admin API like any challenge, so the same script works on dev and on live:
//   node db/seed-starter-quests.mjs                              (http://localhost:3000, ADMIN_PASSWORD from .env.development.local)
//   BASE_URL=https://www.chillwaa.com ADMIN_PASSWORD=… node db/seed-starter-quests.mjs
// Running it again skips challenges whose title already exists.
import fs from 'node:fs';

export const STARTER_QUESTS = [
  {
    title: 'ป้ายยาที่โปรดใกล้ตัวคุณ',
    targetGoal: 'แชร์ร้านหรือมุมโปรดใกล้บ้าน 1 แห่ง',
    objective: 'แชร์ร้านกาแฟ ร้านอาหาร หรือมุมพักผ่อนที่คุณชอบที่สุดแถวบ้านหรือที่ทำงาน 1 แห่ง ให้เพื่อนๆ ได้รู้จัก',
    steps: ['เลือกรูปร้านหรือมุมโปรดจากในเครื่อง', 'ใส่ชื่อสถานที่ แล้วเล่าสั้นๆ ว่าทำไมชอบ', 'โพสต์ แล้วรับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ ไม่ต้องอยู่ที่นั่นตอนโพสต์',
    rewardsText: '+100 XP และเหรียญ Local Explorer',
    rewardPoints: 100,
    category: 'cafe_social',
    badgeLabel: 'Local Explorer',
    iconName: 'MapPin',
    image: '/images/onboarding/chill-cafe.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Local Explorer', shortTitle: '+100 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, posts: { withPlace: true } },
  },
  {
    title: 'ภาพล่าสุดที่ทำให้ยิ้มได้',
    targetGoal: 'โพสต์รูปที่ทำให้ยิ้มได้ 1 รูป',
    objective: 'เลือกรูปจากทริปหรือวันหยุดล่าสุดที่คุณประทับใจที่สุดในเดือนนี้ แล้วเล่าสั้นๆ',
    steps: ['เปิดรูปในเครื่อง เลือกรูปที่ทำให้ยิ้มได้', 'เล่าสั้นๆ ว่าวันนั้นเป็นยังไง', 'โพสต์ แล้วรับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อโพสต์โมเมนต์ 1 โพสต์',
    rewardsText: '+80 XP และเหรียญ First Moment',
    rewardPoints: 80,
    category: 'photo_content',
    badgeLabel: 'First Moment',
    iconName: 'Smile',
    image: '/images/onboarding/share-moment.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ First Moment', shortTitle: '+80 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, posts: {} },
  },
];

const fromFile = (name) => {
  try {
    const line = fs.readFileSync(new URL('../.env.development.local', import.meta.url), 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
    return line?.[1].trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
};

async function main() {
  const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const password = process.env.ADMIN_PASSWORD || (base.includes('localhost') ? fromFile('ADMIN_PASSWORD') : undefined);
  if (!password) throw new Error('Set ADMIN_PASSWORD');
  const login = await fetch(`${base}/api/auth/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ password }) });
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!login.ok || !cookie) throw new Error(`Admin login failed (${login.status})`);
  const call = (method, body) =>
    fetch(`${base}/api/admin/quests${method === 'GET' ? '?limit=200&status=all' : ''}`, { method, headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

  const existing = await call('GET');
  const titles = new Set((existing.quests ?? existing.items ?? existing.data ?? []).map((q) => q.title));
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  for (const quest of STARTER_QUESTS) {
    if (titles.has(quest.title)) {
      console.log('skip (exists)', quest.title);
      continue;
    }
    const created = await call('POST', { action: 'create', quest: { ...quest, total: String(quest.rule.count), startDate: today, endDate: '2027-12-31' } });
    if (!created.success) throw new Error(`${quest.title}: ${created.error}`);
    const published = await call('POST', { action: 'update', id: created.quest.id, updatedFields: { status: 'active' } });
    console.log(published.success ? 'created' : `created as draft (${published.error})`, created.quest.id, quest.title);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
