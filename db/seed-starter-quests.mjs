// The starter challenges (owner 2026-11-11; first steps added 2026-11-14): things a new member can do in a minute from the sofa, offered at the
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
    rewardsText: '+50 XP และเหรียญ Local Explorer',
    rewardPoints: 50,
    category: 'cafe_social',
    badgeLabel: 'Local Explorer',
    iconName: 'MapPin',
    image: '/images/onboarding/chill-cafe.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Local Explorer', shortTitle: '+50 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
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
  // Three more (owner 2026-11-11: five to choose from at the end of onboarding)
  {
    title: 'ร้านประจำที่อยากบอกต่อ',
    targetGoal: 'แชร์ร้านอร่อยที่ไปบ่อยที่สุด 1 ร้าน',
    objective: 'ร้านข้าว ร้านก๋วยเตี๋ยว หรือร้านขนมที่คุณกลับไปซ้ำเสมอ แชร์ให้เพื่อนๆ ได้ลองบ้าง',
    steps: ['เลือกรูปเมนูหรือหน้าร้านจากในเครื่อง', 'ใส่ชื่อร้าน แล้วบอกเมนูที่ต้องสั่ง', 'โพสต์ แล้วรับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ ไม่ต้องอยู่ที่นั่นตอนโพสต์',
    rewardsText: '+60 XP และเหรียญ Food Hunter',
    rewardPoints: 60,
    category: 'food_hunt',
    badgeLabel: 'Food Hunter',
    iconName: 'UtensilsCrossed',
    image: '/images/onboarding/fair-festival.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Food Hunter', shortTitle: '+60 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, posts: { withPlace: true } },
  },
  {
    title: 'ทริปที่ยังคิดถึง',
    targetGoal: 'โพสต์รูปจากทริปที่ยังคิดถึง 1 รูป',
    objective: 'ทริปไหนที่ยังนึกถึงอยู่เสมอ ใกล้หรือไกลก็ได้ เล่าให้เพื่อนๆ ฟังหน่อยว่าที่นั่นดียังไง',
    steps: ['เลือกรูปจากทริปนั้นในเครื่อง', 'ใส่ชื่อสถานที่ แล้วเล่าสั้นๆ', 'โพสต์ แล้วรับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ ไม่ต้องอยู่ที่นั่นตอนโพสต์',
    rewardsText: '+60 XP และเหรียญ Throwback',
    rewardPoints: 60,
    category: 'travel_outdoor',
    badgeLabel: 'Throwback',
    iconName: 'Plane',
    image: '/images/onboarding/browse-moments.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Throwback', shortTitle: '+60 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, posts: { withPlace: true } },
  },
  {
    title: 'ช่วงเวลาดีๆ กับเพื่อน',
    targetGoal: 'โพสต์รูปที่ได้ออกไปกับเพื่อน 1 รูป',
    objective: 'วันที่ได้ออกไปกับเพื่อนแล้วสนุกที่สุดเมื่อไม่นานมานี้ แชร์เป็นโมเมนต์แรกกับเพื่อนๆ ที่นี่',
    steps: ['เลือกรูปที่ได้ออกไปกับเพื่อน', 'แท็กเพื่อนที่อยู่ใน Chillwaa ได้ถ้ามี', 'โพสต์ แล้วรับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อโพสต์โมเมนต์ 1 โพสต์',
    rewardsText: '+60 XP และเหรียญ Good Company',
    rewardPoints: 60,
    category: 'photo_content',
    badgeLabel: 'Good Company',
    iconName: 'Users',
    image: '/images/onboarding/friends-start.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Good Company', shortTitle: '+60 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, posts: {} },
  },
  // The first steps on the onboarding summary (owner 2026-11-14): three per part, picked by what the member chose first
  {
    title: 'กดใจโมเมนต์แรก',
    targetGoal: 'กดใจโมเมนต์ของเพื่อนๆ 1 โมเมนต์',
    objective: 'เลื่อนดูโมเมนต์ของเพื่อนๆ แล้วกดใจอันที่ชอบ 1 โมเมนต์ เพื่อนจะรู้ว่ามีคนเห็น',
    steps: ['เปิดเมนูโมเมนต์', 'กดหัวใจที่โมเมนต์ที่ชอบ', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อกดใจโมเมนต์ของคนอื่น',
    rewardsText: '+20 XP และเหรียญ First Like',
    rewardPoints: 20,
    category: 'photo_content',
    badgeLabel: 'First Like',
    iconName: 'Heart',
    image: '/images/onboarding/browse-moments.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ First Like', shortTitle: '+20 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'like' }, newMemberDays: 30 },
  },
  {
    title: 'ติดตามเพื่อนคนแรก',
    targetGoal: 'กดติดตามเพื่อน 1 คน',
    objective: 'เจอโมเมนต์ที่ชอบ กดติดตามคนโพสต์ แล้วโมเมนต์ใหม่ของเขาจะขึ้นในหน้าหลักของคุณ',
    steps: ['เปิดโมเมนต์ที่ชอบ', 'กดติดตามคนโพสต์', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อกดติดตามสมาชิกคนอื่น',
    rewardsText: '+20 XP และเหรียญ First Follow',
    rewardPoints: 20,
    category: 'photo_content',
    badgeLabel: 'First Follow',
    iconName: 'UserPlus',
    image: '/images/onboarding/friends-start.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ First Follow', shortTitle: '+20 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'follow' }, newMemberDays: 30 },
  },
  {
    title: 'บันทึกตี้ที่สนใจ',
    targetGoal: 'กดบันทึกตี้ที่อยากไป 1 ตี้',
    objective: 'เปิดเมนูตี้ เจอตี้ที่น่าไป กดบันทึกไว้ก่อน แล้วค่อยตัดสินใจทีหลังก็ได้',
    steps: ['เปิดเมนูตี้', 'กดบันทึกตี้ที่สนใจ', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อกดบันทึกตี้',
    rewardsText: '+20 XP และเหรียญ Tee Saver',
    rewardPoints: 20,
    category: 'cafe_social',
    badgeLabel: 'Tee Saver',
    iconName: 'Bookmark',
    image: '/images/onboarding/goals/join-tee.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Tee Saver', shortTitle: '+20 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'save', targetType: 'community' }, newMemberDays: 30 },
  },
  {
    title: 'ลงชื่อเข้าร่วมตี้แรก',
    targetGoal: 'ลงชื่อเข้าร่วมตี้ 1 ตี้',
    objective: 'เลือกตี้ที่ใช่ แล้วกดเข้าร่วม โฮสต์และเพื่อนในตี้จะรอเจอคุณ',
    steps: ['เปิดตี้ที่สนใจ', 'กดเข้าร่วมตี้', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อลงชื่อเข้าร่วมตี้ที่คนอื่นเปิด',
    rewardsText: '+50 XP และเหรียญ First Tee',
    rewardPoints: 50,
    category: 'cafe_social',
    badgeLabel: 'First Tee',
    iconName: 'Users',
    image: '/images/onboarding/friends-start.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ First Tee', shortTitle: '+50 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'join' }, newMemberDays: 30 },
  },
  {
    title: 'ไปตี้แรก แล้วแชร์โมเมนต์',
    targetGoal: 'ไปตี้ 1 ตี้ แล้วแชร์โมเมนต์จากที่นั่น',
    objective: 'ไปเจอเพื่อนใหม่ในตี้แรกของคุณ แล้วแชร์โมเมนต์ความประทับใจจากวันนั้น',
    steps: ['ไปตี้ที่ลงชื่อไว้', 'ถ่ายรูปที่ตี้ แล้วแชร์เป็นโมเมนต์', 'รับรางวัลเมื่อรูปผ่าน'],
    verificationMethod: 'นับเมื่อแชร์โมเมนต์ที่ตี้ หรือโฮสต์เช็กอินให้',
    rewardsText: '+100 XP และเหรียญ Tee Memory',
    rewardPoints: 100,
    category: 'cafe_social',
    badgeLabel: 'Tee Memory',
    iconName: 'Camera',
    image: '/images/onboarding/goals/join-tee.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Tee Memory', shortTitle: '+100 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: ['community'], count: 1, newMemberDays: 30 },
  },
  {
    title: 'บันทึกอีเวนต์ที่สนใจ',
    targetGoal: 'กดบันทึกอีเวนต์ที่อยากไป 1 งาน',
    objective: 'เปิดเมนูอีเวนต์ เจองานที่น่าไป กดบันทึกไว้ จะได้ไม่พลาด',
    steps: ['เปิดเมนูอีเวนต์', 'กดบันทึกงานที่สนใจ', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อกดบันทึกอีเวนต์',
    rewardsText: '+20 XP และเหรียญ Event Saver',
    rewardPoints: 20,
    category: 'photo_content',
    badgeLabel: 'Event Saver',
    iconName: 'Bookmark',
    image: '/images/onboarding/goals/fair-festival.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Event Saver', shortTitle: '+20 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'save', targetType: 'fair' }, newMemberDays: 30 },
  },
  {
    title: 'ไปอีเวนต์แรก แล้วแชร์โมเมนต์',
    targetGoal: 'ไปอีเวนต์ 1 งาน แล้วแชร์โมเมนต์จากที่นั่น',
    objective: 'ไปอีเวนต์ที่ชอบ แล้วแชร์โมเมนต์สนุกๆ จากงานให้เพื่อนเห็น',
    steps: ['ไปอีเวนต์ที่สนใจ', 'ถ่ายรูปที่งาน แล้วแชร์เป็นโมเมนต์', 'รับรางวัลเมื่อรูปผ่าน'],
    verificationMethod: 'นับเมื่อแชร์โมเมนต์ที่อีเวนต์',
    rewardsText: '+80 XP และเหรียญ Event Memory',
    rewardPoints: 80,
    category: 'photo_content',
    badgeLabel: 'Event Memory',
    iconName: 'Ticket',
    image: '/images/onboarding/goals/fair-festival.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Event Memory', shortTitle: '+80 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: ['fair'], count: 1, newMemberDays: 30 },
  },
  {
    title: 'บันทึกที่เที่ยวที่สนใจ',
    targetGoal: 'กดบันทึกที่เที่ยวที่อยากไป 1 แห่ง',
    objective: 'เปิดเมนูที่เที่ยว เจอที่ที่อยากไป กดบันทึกเก็บไว้ในลิสต์ของคุณ',
    steps: ['เปิดเมนูที่เที่ยว', 'กดบันทึกที่ที่อยากไป', 'รับรางวัลได้ทันที'],
    verificationMethod: 'นับเมื่อกดบันทึกที่เที่ยว',
    rewardsText: '+20 XP และเหรียญ Place Saver',
    rewardPoints: 20,
    category: 'travel_outdoor',
    badgeLabel: 'Place Saver',
    iconName: 'Bookmark',
    image: '/images/onboarding/goals/spots-doi-cafe.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ Place Saver', shortTitle: '+20 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: [], count: 1, actions: { kind: 'save', targetType: 'spot' }, newMemberDays: 30 },
  },
  {
    title: 'ไปที่เที่ยวแรก แล้วแชร์โมเมนต์',
    targetGoal: 'ไปที่เที่ยว 1 แห่ง แล้วแชร์โมเมนต์จากที่นั่น',
    objective: 'ไปที่ที่อยากไป แล้วแชร์โมเมนต์ความประทับใจจากที่นั่น',
    steps: ['ไปที่เที่ยวที่สนใจ', 'ถ่ายรูปที่นั่น แล้วแชร์เป็นโมเมนต์', 'รับรางวัลเมื่อรูปผ่าน'],
    verificationMethod: 'นับเมื่อแชร์โมเมนต์ที่สถานที่นั้น',
    rewardsText: '+100 XP และเหรียญ First Trip',
    rewardPoints: 100,
    category: 'travel_outdoor',
    badgeLabel: 'First Trip',
    iconName: 'MapPin',
    image: '/images/onboarding/done-viewpoint.jpg',
    brandReward: { type: 'hub_central', title: 'เหรียญ First Trip', shortTitle: '+100 XP', hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ' },
    rule: { targetTypes: ['spot'], count: 1, newMemberDays: 30 },
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
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  for (const quest of STARTER_QUESTS) {
    const found = (existing.quests ?? existing.items ?? existing.data ?? []).find((q) => q.title === quest.title);
    if (found) {
      // A reward changed here is carried to the challenge already made (owner 2026-11-14: ป้ายยา 100 → 50 XP)
      if (found.rewardPoints !== quest.rewardPoints) {
        const updated = await call('POST', { action: 'update', id: found.id, updatedFields: { rewardPoints: quest.rewardPoints, rewardsText: quest.rewardsText, brandReward: quest.brandReward } });
        console.log(updated.success ? 'reward updated' : `reward not updated (${updated.error})`, found.id, quest.title, `${found.rewardPoints} → ${quest.rewardPoints}`);
      } else console.log('skip (exists)', quest.title);
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
