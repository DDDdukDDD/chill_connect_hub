// Seeds the ATMBKK 2026 campaign (2 challenges + 3 running practice meetups) via the Admin API.
// Safe to run more than once: skips items whose title already exists.
//
// Usage (dev):
//   node db/seed-atmbkk-2026.mjs
//
// Usage (production, PowerShell):
//   $env:BASE_URL="https://www.chillwaa.com"; $env:ADMIN_PASSWORD="รหัสแอดมินเว็บจริง"; node db/seed-atmbkk-2026.mjs
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
      title: 'Road to ATMBKK 2026: ซ้อมก่อนวันจริง 3 ครั้ง',
      targetGoal: 'โพสต์โมเมนต์ซ้อมวิ่ง 3 ครั้งก่อนวันแข่ง',
      objective: 'โค้งสุดท้ายก่อน Amazing Thailand Marathon Bangkok 2026 ชวนนักวิ่งมาบันทึกการซ้อม 3 รอบสุดท้าย ไม่ว่าจะซ้อมที่สวนสาธารณะ ลู่วิ่ง หรือซ้อมเบาๆ ช่วง Taper เพื่อเช็กความพร้อมและเป็นกำลังใจให้เพื่อนร่วมทาง',
      steps: [
        'ออกไปซ้อมวิ่งหรือเดิน-วิ่งเบาๆ ที่สวนหรือลู่วิ่งที่สะดวก',
        'ถ่ายรูปบรรยากาศสวน รองเท้า หรือหน้าปัดนาฬิกาหลังซ้อมเสร็จ',
        'โพสต์โมเมนต์พร้อมปักชื่อสถานที่ให้ครบ 3 ครั้งก่อนวันที่ 29 พ.ย.',
      ],
      verificationMethod: 'นับจากโพสต์โมเมนต์ที่ใส่ชื่อสถานที่ครบ 3 โพสต์ในช่วงกิจกรรม',
      rewardsText: '+250 XP และเหรียญ ATMBKK Ready',
      rewardPoints: 250,
      category: 'running_fitness',
      badgeLabel: 'ATMBKK Ready',
      iconName: 'Zap',
      total: 3,
      startDate: '2026-11-15',
      endDate: '2026-11-28',
      image: '/images/campaigns/atmbkk/marathon.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ ATMBKK Ready',
        shortTitle: '+250 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 3, posts: { withPlace: true } },
    },
  },
  {
    publishNow: false,
    payload: {
      title: 'ATMBKK 2026 Finisher: เข้าเส้นชัยแล้วเล่าโมเมนต์',
      targetGoal: 'โพสต์โมเมนต์วันแข่งหรือหลังเข้าเส้นชัย 1 ครั้ง',
      objective: 'บันทึกความทรงจำวันแข่ง Amazing Thailand Marathon Bangkok 2026 ไม่ว่าจะเป็นระยะ 10K, 21K หรือ 42K แชร์ภาพเหรียญ บรรยากาศหน้าเส้นชัย หรือมื้อฉลองหลังจบงานไว้เป็นหลักฐานความภูมิใจ',
      steps: [
        'ถ่ายรูปเหรียญ Finisher บรรยากาศวันงาน หรือมื้อฉลองหลังเข้าเส้นชัย',
        'เลือกปักสถานที่ในงานหรือร้านที่แวะพักหลังวิ่งเสร็จ',
        'โพสต์โมเมนต์เล่าความรู้สึกสั้นๆ แล้วรับ XP และเหรียญทันที',
      ],
      verificationMethod: 'นับเมื่อโพสต์โมเมนต์ 1 โพสต์ในช่วงวันที่ 29–30 พ.ย.',
      rewardsText: '+400 XP และเหรียญ ATMBKK 2026 Finisher',
      rewardPoints: 400,
      category: 'running_fitness',
      badgeLabel: 'ATMBKK 2026 Finisher',
      iconName: 'Trophy',
      total: 1,
      startDate: '2026-11-29',
      endDate: '2026-11-30',
      image: '/images/campaigns/challenges/atmbkk-finisher.jpg',
      brandReward: {
        type: 'hub_central',
        title: 'เหรียญ ATMBKK 2026 Finisher',
        shortTitle: '+400 XP',
        hubRewardNote: 'เหรียญขึ้นในโปรไฟล์ทันทีที่ทำสำเร็จ',
      },
      rule: { targetTypes: [], count: 1, posts: {} },
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

// 2. Running practice meetups
const findPlaceId = async (q) => {
  const res = await fetch(`${base}/api/spots?q=${encodeURIComponent(q)}&limit=5`);
  const data = await res.json().catch(() => null);
  return data?.spots?.[0]?.id;
};

const existingEventsRes = await adminFetch('/api/admin/events?type=community&limit=200');
const existingEventTitles = new Set((existingEventsRes.data?.events ?? []).map((e) => e.title));

const [benjaId, lumphiniId, rotfaiId] = await Promise.all([
  findPlaceId('สวนเบญจกิติ'),
  findPlaceId('สวนลุมพินี'),
  findPlaceId('สวนวชิรเบญจทัศ'),
]);

const MEETUPS = [
  {
    title: 'ชวนซ้อม Easy Run 5K สวนเบญจกิติ ก่อนแข่ง ATMBKK',
    category: 'move',
    lifestyleCategory: 'running_fitness',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ออกกำลังกาย',
    date: '17 พ.ย. 2569',
    time: '18:30 - 19:45 น.',
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
      '/images/campaigns/atmbkk/marathon.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
    ],
    description: 'นัดวิ่งเบาๆ เพซ 6:30–7:30 คุยกันรู้เรื่อง 5 กิโลเมตร ไม่เน้นเร็ว เน้นยืดเส้นและเช็กความพร้อมก่อนวันแข่งจริง ใครซ้อมคนเดียวเหงาๆ มาจอยกันได้ครับ',
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
    title: 'Long Run เช้าวันเสาร์ สวนลุมพินี แล้วแวะกินกาแฟต่อ',
    category: 'move',
    lifestyleCategory: 'running_fitness',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ออกกำลังกาย',
    date: '21 พ.ย. 2569',
    time: '06:00 - 08:30 น.',
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
    maxParticipants: 10,
    price: 'ฟรี',
    image: '/images/campaigns/atmbkk/lumphini.jpg',
    galleryImages: [
      '/images/campaigns/atmbkk/lumphini.jpg',
      '/images/campaigns/bkk-lifestyle/ari-cafe.jpg',
      '/images/campaigns/atmbkk/benchakitti.jpg',
      '/images/campaigns/atmbkk/marathon.jpg',
    ],
    description: 'ซ้อมวิ่งเก็บระยะรอบสวนลุม 2–4 รอบตามความไหวของแต่ละคน แยกเพซได้ เสร็จแล้วเดินไปกินน้ำเต้าหู้หรือกาแฟแถวหลังสวนด้วยกัน',
    targetGender: 'all',
    targetAge: 'ไม่จำกัดอายุ',
    energyLevel: 'chill',
    whatToBring: ['ขวดน้ำส่วนตัว', 'รองเท้าผ้าใบ', 'เงินสดเล็กน้อย'],
    isSoloFriendly: true,
    isBeginnerFriendly: true,
    isIntrovertFriendly: false,
    canBringFriend: true,
    cancellationPolicy: 'free_24h',
    approvalStatus: 'approved',
    isNew: true,
    createdAtTimestamp: Date.now() + 1,
  },
  {
    title: 'ซ้อม Taper สบายๆ อาทิตย์เช้า สวนรถไฟ จตุจักร',
    category: 'move',
    lifestyleCategory: 'running_fitness',
    eventType: 'community',
    badgeText: 'เปิดรับสมัคร',
    tag: 'ออกกำลังกาย',
    date: '22 พ.ย. 2569',
    time: '06:30 - 08:00 น.',
    province: 'กรุงเทพฯ',
    zone: 'จตุจักร',
    location: 'สวนวชิรเบญจทัศ (สวนรถไฟ) (จุดนัดพบ: ลานจอดรถประตูใหญ่ ใกล้จุดเช่าจักรยาน)',
    meetingPoint: 'หน้าลานจอดรถประตูใหญ่ ใกล้จุดเช่าจักรยานสวนรถไฟ',
    placeId: rotfaiId,
    venueTag: 'park',
    scheduleType: 'single',
    locationType: 'physical',
    hostName: 'ทีม Chillwaa',
    hostAvatar: '/icons/icon-192.png',
    participantsCount: 0,
    maxParticipants: 8,
    price: 'ฟรี',
    image: '/images/campaigns/atmbkk/rotfai.jpg',
    galleryImages: [
      '/images/campaigns/atmbkk/rotfai.jpg',
      '/images/campaigns/atmbkk/benchakitti.jpg',
      '/images/campaigns/atmbkk/lumphini.jpg',
      '/images/campaigns/atmbkk/marathon.jpg',
    ],
    description: 'วิ่งประคองขาช่วงโค้งสุดท้ายก่อนวันแข่ง 5–7 กิโลเมตร อากาศตอนเช้าต้นไม้ร่มรื่น เหมาะกับคนซ้อมระยะ 10K และ 21K',
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
    createdAtTimestamp: Date.now() + 2,
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

// 3. Fix cover image & gallery for Amazing Thailand Marathon Bangkok 2026 (/events)
const fairRes = await adminFetch('/api/admin/events?type=public_venue&q=Amazing+Thailand+Marathon&limit=10');
const atmbkk = (fairRes.data?.events ?? []).find((e) => e.title.includes('Amazing Thailand Marathon Bangkok 2026'));
if (atmbkk) {
  const up = await adminFetch('/api/admin/events', 'POST', {
    action: 'update_fields',
    id: atmbkk.id,
    updatedFields: {
      image: '/images/campaigns/atmbkk/marathon.jpg',
      galleryImages: [
        '/images/campaigns/atmbkk/marathon.jpg',
        '/images/campaigns/atmbkk/benchakitti.jpg',
        '/images/campaigns/atmbkk/lumphini.jpg',
        '/images/campaigns/atmbkk/rotfai.jpg',
      ],
    },
  });
  console.log(`ATMBKK 2026 event image updated: ${up.data?.success ? 'ok' : up.data?.error}`);
} else {
  console.log('ATMBKK 2026 event not found in public_venue');
}
