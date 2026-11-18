// Seeds the Bangkok Lifestyle campaign (2 challenges + 4 neighborhood meetups: Ari, Charoenkrung, Banthat Thong, Yaowarat).
// Safe to run more than once: skips items whose title already exists.
//
// Usage (dev):
//   node db/seed-bkk-lifestyle.mjs
//
// Usage (production, PowerShell):
//   $env:BASE_URL="https://www.chillwaa.com"; $env:ADMIN_PASSWORD="รหัสแอดมินเว็บจริง"; node db/seed-bkk-lifestyle.mjs
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

// 1. Challenges
const existingQuestsRes = await adminFetch('/api/admin/quests?limit=200&status=all');
const existingQuestByTitle = new Map((existingQuestsRes.data?.quests ?? []).map((q) => [q.title, q]));

const QUESTS = [
  {
    publishNow: true,
    payload: {
      title: 'เช็กอิน 4 ย่านฮิต กทม.: อารีย์ · เจริญกรุง · บรรทัดทอง · เยาวราช',
      targetGoal: 'โพสต์โมเมนต์ร้านเด็ดหรือมุมโปรดในย่านฮิตครบ 3 ครั้ง',
      objective: 'ออกไปเดินเล่น กินของอร่อย หรือนั่งคาเฟ่ในย่านยอดฮิตของกรุงเทพฯ ไม่ว่าจะเป็นอารีย์ เจริญกรุง บรรทัดทอง หรือเยาวราช แล้วแชร์โมเมนต์ป้ายยาให้เพื่อนตามรอยได้',
      steps: [
        'เลือกร้านกาแฟ ร้านอาหาร หรือมุมเดินเล่นในย่านอารีย์ เจริญกรุง บรรทัดทอง หรือเยาวราช',
        'ถ่ายรูปบรรยากาศร้าน เมนูโปรด หรือมุมถ่ายรูปสวยๆ',
        'โพสต์โมเมนต์พร้อมปักชื่อสถานที่ให้ครบ 3 ครั้ง',
      ],
      verificationMethod: 'นับจากโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ครบ 3 โพสต์',
      rewardsText: '+300 XP และเหรียญ BKK Explorer',
      rewardPoints: 300,
      category: 'cafe_social',
      badgeLabel: 'BKK Explorer',
      iconName: 'MapPin',
      total: 3,
      startDate: '2026-11-16',
      endDate: '2026-12-31',
      image: '/images/campaigns/bkk-lifestyle/yaowarat.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ BKK Explorer',
        shortTitle: '+300 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 3, posts: { withPlace: true } },
    },
  },
  {
    publishNow: true,
    payload: {
      title: 'Morning Run & Coffee: วิ่งเสร็จแวะคาเฟ่',
      targetGoal: 'โพสต์โมเมนต์ออกกำลังกายหรือแวะคาเฟ่หลังซ้อมครบ 2 ครั้ง',
      objective: 'เชื่อมเช้าวันหยุดให้สมบูรณ์กว่าเดิม ทั้งได้ขยับร่างกายในสวนและได้พักจิบกาแฟหรืออาหารเช้าต่อกับเพื่อนๆ',
      steps: [
        'ออกไปวิ่งหรือเดินออกกำลังกายตอนเช้าที่สวนสาธารณะที่ชอบ',
        'แวะร้านกาแฟหรือร้านอาหารเช้าใกล้สวนแล้วถ่ายรูปเก็บไว้',
        'โพสต์โมเมนต์พร้อมปักชื่อสถานที่ครบ 2 ครั้ง',
      ],
      verificationMethod: 'นับจากโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ครบ 2 โพสต์',
      rewardsText: '+200 XP และเหรียญ Run & Chill',
      rewardPoints: 200,
      category: 'running_fitness',
      badgeLabel: 'Run & Chill',
      iconName: 'Coffee',
      total: 2,
      startDate: '2026-11-16',
      endDate: '2026-12-31',
      image: '/images/campaigns/challenges/run-and-coffee.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ Run & Chill',
        shortTitle: '+200 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 2, posts: { withPlace: true } },
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

// 2. Neighborhood Meetups
const existingEventsRes = await adminFetch('/api/admin/events?type=community&limit=200');
const existingEventTitles = new Set((existingEventsRes.data?.events ?? []).map((e) => e.title));

const MEETUPS = [
  {
    title: 'ตะลุยกินบรรทัดทอง 4 ร้านเด็ด หลังเลิกงาน',
    category: 'chill',
    lifestyleCategory: 'food_hunt',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ตะลุยกิน',
    date: '20 พ.ย. 2569',
    time: '18:30 - 21:30 น.',
    province: 'กรุงเทพฯ',
    zone: 'ปทุมวัน',
    location: 'ถนนบรรทัดทอง (จุดนัดพบ: หน้า Stadium One ฝั่งทางเข้าหลัก)',
    meetingPoint: 'หน้า Stadium One ถนนบรรทัดทอง',
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 6,
    price: 'จ่ายตามจริง',
    image: '/images/campaigns/bkk-lifestyle/banthat-thong.jpg',
    galleryImages: [
      '/images/campaigns/bkk-lifestyle/banthat-thong.jpg',
      '/images/campaigns/bkk-lifestyle/yaowarat.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
      '/images/campaigns/bkk-lifestyle/charoenkrung.jpg',
    ],
    description: 'เลิกงานวันศุกร์แล้วมาหารของอร่อยกินกันแถวบรรทัดทอง เก็บครบทั้งของคาวและขนมหวาน 3-4 ร้าน มากลุ่มเล็กๆ จะได้สั่งแบ่งกันชิมได้หลายเมนู',
    targetGender: 'all',
    targetAge: '20-35 ปี',
    energyLevel: 'chill',
    whatToBring: ['เงินสดหรือพร้อมเพย์', 'รองเท้าเดินสบาย'],
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
    title: 'Cafe Hopping & นั่งชิลล์คุยเล่นย่านอารีย์',
    category: 'chill',
    lifestyleCategory: 'cafe_social',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'นัดชิลล์',
    date: '21 พ.ย. 2569',
    time: '14:00 - 17:00 น.',
    province: 'กรุงเทพฯ',
    zone: 'พญาไท',
    location: 'อารีย์ (จุดนัดพบ: BTS อารีย์ ทางออก 3 หน้าอาคารปิยวรรณ)',
    meetingPoint: 'BTS อารีย์ ทางออก 3',
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 6,
    price: 'จ่ายตามจริง',
    image: '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
    galleryImages: [
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
      '/images/campaigns/bkk-lifestyle/charoenkrung.jpg',
      '/images/campaigns/bkk-lifestyle/banthat-thong.jpg',
      '/images/campaigns/atmbkk/benchakitti.jpg',
    ],
    description: 'บ่ายวันเสาร์ชวนมาเดินซอยอารีย์ แวะคาเฟ่ 2 ร้าน นั่งจิบกาแฟ ถ่ายรูป และแลกเปลี่ยนเรื่องเที่ยวหรือเรื่องงานแบบสบายๆ มาคนเดียวได้ครับ',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['เงินสดเล็กน้อย'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: true,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now() + 1,
  },
  {
    title: 'เดินกินสตรีทฟู้ดเยาวราชยามค่ำ 4 ร้านดัง',
    category: 'chill',
    lifestyleCategory: 'food_hunt',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ตะลุยกิน',
    date: '21 พ.ย. 2569',
    time: '19:00 - 22:00 น.',
    province: 'กรุงเทพฯ',
    zone: 'สัมพันธวงศ์',
    location: 'ถนนเยาวราช (จุดนัดพบ: MRT วัดมังกร ทางออก 1)',
    meetingPoint: 'MRT วัดมังกร ทางออก 1',
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 6,
    price: 'จ่ายตามจริง',
    image: '/images/campaigns/bkk-lifestyle/yaowarat.jpg',
    galleryImages: [
      '/images/campaigns/bkk-lifestyle/yaowarat.jpg',
      '/images/campaigns/bkk-lifestyle/banthat-thong.jpg',
      '/images/campaigns/bkk-lifestyle/charoenkrung.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
    ],
    description: 'ชวนสายกินมาเดินลุยเยาวราชตอนค่ำ ตั้งแต่ก๋วยจั๊บ ขนมปังปิ้ง ไปจนถึงของหวานริมทาง หารกันชิมได้หลายอย่าง ไม่ต้องต่อคิวกินคนเดียว',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['เงินสดเล็กน้อย', 'รองเท้าเดินสบาย'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: false,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now() + 2,
  },
  {
    title: 'เดินเล่นแกลเลอรี & คาเฟ่ลับย่านเจริญกรุง–ตลาดน้อย',
    category: 'heal',
    lifestyleCategory: 'cafe_social',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ฮีลใจ',
    date: '22 พ.ย. 2569',
    time: '14:00 - 17:30 น.',
    province: 'กรุงเทพฯ',
    zone: 'บางรัก',
    location: 'เจริญกรุง - ตลาดน้อย (จุดนัดพบ: หน้าไปรษณีย์กลางบางรัก)',
    meetingPoint: 'หน้าอาคารไปรษณีย์กลางบางรัก',
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 8,
    price: 'จ่ายตามจริง',
    image: '/images/campaigns/bkk-lifestyle/charoenkrung.jpg',
    galleryImages: [
      '/images/campaigns/bkk-lifestyle/charoenkrung.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
      '/images/campaigns/bkk-lifestyle/yaowarat.jpg',
      '/images/campaigns/bkk-lifestyle/banthat-thong.jpg',
    ],
    description: 'บ่ายวันอาทิตย์เดินชมงานศิลปะย่านเจริญกรุง เลาะซอยตลาดน้อยถ่ายรูปตึกเก่าและสตรีทอาร์ต ปิดท้ายนั่งคาเฟ่ริมน้ำก่อนพระอาทิตย์ตก',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['กล้องหรือมือถือ', 'ขวดน้ำส่วนตัว'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: true,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now() + 3,
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
  console.log(`meetup created: ${eventData.title}`);
}
