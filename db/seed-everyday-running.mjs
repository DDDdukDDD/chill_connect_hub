// Seeds the always-on Everyday Park Running loop (2 challenges + 2 casual park meetups) via the Admin API.
// Safe to run more than once: skips items whose title already exists.
//
// Usage (dev):
//   node db/seed-everyday-running.mjs
//
// Usage (production, PowerShell):
//   $env:BASE_URL="https://www.chillwaa.com"; $env:ADMIN_PASSWORD="รหัสแอดมินเว็บจริง"; node db/seed-everyday-running.mjs
import fs from 'node:fs';

const fromDevEnv = (name) => {
  try {
    const line = fs.readFileSync(new URL('../.env.development.local', import.meta.url), 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
    return line?.[1].trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
};

const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const password = process.env.ADMIN_PASSWORD || (base.includes('localhost') ? fromDevEnv('ADMIN_PASSWORD') : undefined);
if (!password) {
  console.error('Set ADMIN_PASSWORD before running against a live URL.');
  process.exit(1);
}

const login = await fetch(`${base}/api/auth/admin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base },
  body: JSON.stringify({ password }),
});
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
if (!login.ok || !cookie) {
  console.error(`Admin login failed (${login.status})`);
  process.exit(1);
}

const adminFetch = async (path, method = 'GET', body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};

// 1. Always-on Everyday Running Challenges
const existingQuestsRes = await adminFetch('/api/admin/quests?limit=200&status=all');
const existingQuestByTitle = new Map((existingQuestsRes.data?.quests ?? []).map((q) => [q.title, q]));

const QUESTS = [
  {
    publishNow: true,
    payload: {
      title: 'ออกกำลังกายในสวน 3 ครั้งเดือนนี้',
      targetGoal: 'โพสต์โมเมนต์เดินหรือวิ่งในสวนสาธารณะครบ 3 ครั้ง',
      objective: 'ไม่ต้องลงงานแข่งก็ออกไปดูแลสุขภาพได้ แค่เดินเร็ว วิ่งจ๊อกกิ้ง หรือวิ่งเบาๆ ในสวนใกล้บ้านหรือที่ทำงานให้ครบ 3 ครั้ง',
      steps: [
        'ออกไปเดินหรือวิ่งที่สวนสาธารณะที่สะดวก',
        'ถ่ายรูปบรรยากาศสวน รองเท้า หรือวิวหลังออกกำลังกาย',
        'โพสต์โมเมนต์พร้อมปักชื่อสวนให้ครบ 3 ครั้ง',
      ],
      verificationMethod: 'นับจากโพสต์โมเมนต์ที่ปักชื่อสถานที่ครบ 3 โพสต์',
      rewardsText: '+200 XP และเหรียญ Park Regular',
      rewardPoints: 200,
      category: 'running_fitness',
      badgeLabel: 'Park Regular',
      iconName: 'Zap',
      total: 3,
      startDate: '2026-11-16',
      endDate: '2027-12-31',
      image: '/images/campaigns/challenges/park-regular.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ Park Regular',
        shortTitle: '+200 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 3, posts: { withPlace: true } },
    },
  },
  {
    publishNow: true,
    payload: {
      title: 'เก็บครบ 3 สวนดัง กทม.',
      targetGoal: 'ออกไปวิ่งหรือเดินเล่นที่สวนสาธารณะใน กทม. 3 แห่ง',
      objective: 'เปลี่ยนบรรยากาศจากการวิ่งสวนเดิมๆ ลองออกไปเก็บระยะหรือเดินรับลมที่สวนดังอย่างสวนลุมพินี สวนเบญจกิติ และสวนรถไฟ',
      steps: [
        'เลือกไปวิ่งหรือเดินเล่นที่สวนใน กทม. เช่น สวนลุมพินี สวนเบญจกิติ สวนรถไฟ',
        'ถ่ายรูปบรรยากาศระหว่างทางหรือหลังวิ่งเสร็จ',
        'โพสต์โมเมนต์พร้อมปักชื่อสวนให้ครบ 3 ครั้ง',
      ],
      verificationMethod: 'นับจากโพสต์โมเมนต์ที่ปักชื่อสถานที่ครบ 3 โพสต์',
      rewardsText: '+300 XP และเหรียญ BKK Park Runner',
      rewardPoints: 300,
      category: 'running_fitness',
      badgeLabel: 'BKK Park Runner',
      iconName: 'Trophy',
      total: 3,
      startDate: '2026-11-16',
      endDate: '2027-12-31',
      image: '/images/campaigns/challenges/bkk-3-parks.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ BKK Park Runner',
        shortTitle: '+300 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 3, posts: { withPlace: true } },
    },
  },
];

for (const item of QUESTS) {
  const existing = existingQuestByTitle.get(item.payload.title);
  let id = existing?.id;
  if (existing) {
    console.log(`quest exists (${existing.status}): ${item.payload.title}`);
  } else {
    const created = await adminFetch('/api/admin/quests', 'POST', { action: 'create', quest: item.payload });
    if (!created.data?.success) {
      console.error(`quest failed: ${item.payload.title}`, created.status, created.data);
      continue;
    }
    id = created.data.quest?.id;
    console.log(`quest created (draft): ${item.payload.title} [${id}]`);
  }
  if (item.publishNow && id && existing?.status !== 'active') {
    const pub = await adminFetch('/api/admin/quests', 'POST', { action: 'update', id, updatedFields: { status: 'active' } });
    console.log(`quest published: ${item.payload.title} -> ${pub.data?.success ? 'active' : pub.data?.error}`);
  }
}

// 2. Casual Everyday Park Meetups (no race required)
const findPlaceId = async (q) => {
  const res = await fetch(`${base}/api/spots?q=${encodeURIComponent(q)}&limit=5`);
  const data = await res.json().catch(() => null);
  return data?.spots?.[0]?.id;
};

const existingEventsRes = await adminFetch('/api/admin/events?type=community&limit=200');
const existingEventTitles = new Set((existingEventsRes.data?.events ?? []).map((e) => e.title));

const [benjaId, lumphiniId] = await Promise.all([
  findPlaceId('สวนเบญจกิติ'),
  findPlaceId('สวนลุมพินี'),
]);

const MEETUPS = [
  {
    title: 'เดิน-วิ่งหลังเลิกงาน สวนเบญจกิติ (เพซสบาย ไม่เน้นเร็ว)',
    category: 'move',
    lifestyleCategory: 'running_fitness',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ออกกำลังกาย',
    date: '18 พ.ย. 2569',
    time: '18:30 - 19:30 น.',
    province: 'กรุงเทพฯ',
    zone: 'คลองเตย',
    location: 'สวนเบญจกิติ (จุดนัดพบ: ลานหน้าอาคารพิพิธภัณฑ์สวนเบญจกิติ ฝั่ง MRT ศูนย์ฯ สิริกิติ์)',
    meetingPoint: 'ลานหน้าอาคารพิพิธภัณฑ์สวนเบญจกิติ ฝั่ง MRT ศูนย์ฯ สิริกิติ์',
    placeId: benjaId,
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 8,
    price: 'ฟรี',
    image: '/images/campaigns/atmbkk/benchakitti.jpg',
    galleryImages: [
      '/images/campaigns/atmbkk/benchakitti.jpg',
      '/images/campaigns/atmbkk/lumphini.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
    ],
    description: 'เลิกงานแล้วมาขยับร่างกาย 3–5 กิโลเมตรแบบไม่กดดัน เดินสลับวิ่งได้ เหมาะกับคนที่อยากออกกำลังกายประจำแต่ไม่อยากเดิน-วิ่งคนเดียว',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['ขวดน้ำส่วนตัว', 'รองเท้าผ้าใบ'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: true,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now(),
  },
  {
    title: 'วิ่งเช้าวันเสาร์ สวนลุมพินี 3-5K แล้วกินน้ำเต้าหู้',
    category: 'move',
    lifestyleCategory: 'running_fitness',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ออกกำลังกาย',
    date: '28 พ.ย. 2569',
    time: '06:30 - 08:30 น.',
    province: 'กรุงเทพฯ',
    zone: 'ปทุมวัน',
    location: 'สวนลุมพินี (จุดนัดพบ: หน้าอนุสาวรีย์รัชกาลที่ 6 ฝั่งประตู 1 MRT สีลม)',
    meetingPoint: 'หน้าอนุสาวรีย์รัชกาลที่ 6 ฝั่งประตู 1 (MRT สีลม)',
    placeId: lumphiniId,
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 8,
    price: 'ฟรี',
    image: '/images/campaigns/atmbkk/lumphini.jpg',
    galleryImages: [
      '/images/campaigns/atmbkk/lumphini.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
      '/images/campaigns/atmbkk/benchakitti.jpg',
    ],
    description: 'ตื่นเช้าวันเสาร์มาวิ่งรับแดดอ่อนๆ 1–2 รอบสวนลุม ไม่เน้นเร็ว เสร็จแล้วเดินไปกินน้ำเต้าหู้หรือกาแฟแถวหลังสวนด้วยกัน',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['ขวดน้ำส่วนตัว', 'รองเท้าผ้าใบ', 'เงินสดเล็กน้อย'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: true,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now() + 1,
  },
];

for (const eventData of MEETUPS) {
  if (existingEventTitles.has(eventData.title)) {
    console.log(`meetup exists: ${eventData.title}`);
    continue;
  }
  const res = await adminFetch('/api/admin/events', 'POST', { action: 'create', eventData });
  if (!res.data?.success) {
    console.error(`meetup failed: ${eventData.title}`, res.status, res.data);
    continue;
  }
  console.log(`meetup created: ${eventData.title} (placeId=${eventData.placeId ?? 'none'})`);
}
