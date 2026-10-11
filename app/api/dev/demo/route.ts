import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAdminEvent, deleteAdminEvent, updateAdminEvent } from '@/lib/eventsStore';
import { memberRepository } from '@/lib/members';
import { joinEvent } from '@/lib/members/activity';
import { ensureSampleMembers, sampleMemberId } from '@/lib/members/sampleMembers';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { PLEDGE_VERSION } from '@/lib/members/trust';
import { sendChatMessage } from '@/lib/social/chat';

/**
 * DEVELOPMENT ONLY (returns 404 in production; remove before launch).
 * Fills the signed-in member's account with sample activity so every My Hub feature can be seen without
 * several accounts: a verified and trusted account, upcoming events, an event they host with people to
 * check in and a chat, and a past event they attended and can review.
 */
const isDev = process.env.NODE_ENV !== 'production';
const DAY = 24 * 60 * 60 * 1000;
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const thaiDate = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const hostedId = (memberId: string) => `demo-host-${memberId}`;
const pastId = (memberId: string) => `demo-past-${memberId}`;
type NewEvent = Parameters<typeof createAdminEvent>[0];

async function removeDemoEvents(memberId: string) {
  for (const id of [hostedId(memberId), pastId(memberId)]) await deleteAdminEvent(id).catch(() => undefined);
}

export async function POST(request: Request) {
  if (!isDev) return NextResponse.json({ success: false }, { status: 404 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const session = await getSessionMember(request);
  if (!session) return NextResponse.json({ success: false, message: 'เข้าสู่ระบบก่อน แล้วลองอีกครั้ง' }, { status: 401 });

  await ensureSampleMembers();
  // 1. A verified account that is past the new-account period
  const now = new Date().toISOString();
  const member = await memberRepository.update(session.id, {
    emailVerified: true,
    pledgeAcceptedAt: session.pledgeAcceptedAt ?? now,
    pledgeVersion: session.pledgeVersion ?? PLEDGE_VERSION,
    createdAt: new Date(Math.min(new Date(session.createdAt).getTime(), Date.now() - 10 * DAY)).toISOString(),
  });

  // 2. Upcoming events: two meetups and one fair
  const [meetups, fairs] = await Promise.all([
    db.findEvents({ page: 1, limit: 6, eventType: 'community', status: 'recruiting', sortBy: 'newest', approvalStatus: 'approved' }),
    db.findEvents({ page: 1, limit: 3, eventType: 'public_venue', sortBy: 'newest', approvalStatus: 'approved' }),
  ]);
  const joined: string[] = [];
  for (const event of [...meetups.items.filter((e) => /\d{4}/.test(e.date)).slice(0, 2), ...fairs.items.slice(0, 1)]) {
    const result = await joinEvent(member, event.id);
    if (result.status === 'joined' || result.status === 'already_joined') joined.push(event.title);
  }

  await removeDemoEvents(member.id);
  const samples = [];
  for (const handle of ['Kee_Explorer', 'Mint_Vibes', 'Praew_Art']) {
    const sample = await memberRepository.findById(sampleMemberId(handle));
    if (sample) samples.push(sample);
  }
  const [kee, mint, praew] = samples;

  // 3. An event the member hosts, with two people coming (one already checked in) and a chat
  const base = { category: 'chill', tag: 'กิจกรรมคอมมูนิตี้', price: 'เข้าร่วมฟรี', eventType: 'community', province: 'กรุงเทพฯ', approvalStatus: 'approved', source: 'Community Member', participantsCount: 0, createdAtTimestamp: Date.now(), createdAt: now };
  await createAdminEvent({
    ...base,
    id: hostedId(member.id),
    title: '[ตัวอย่าง] เดินเล่นสวนเบญจกิติยามเย็น',
    date: thaiDate(7),
    time: '17:30 - 19:00 น.',
    location: 'สวนเบญจกิติ (จุดนัดพบ: ทางเข้าฝั่งศูนย์สิริกิติ์)',
    image: '/event-city-run.png',
    description: 'กิจกรรมตัวอย่างสำหรับทดสอบมายฮับ: เดินเล่นคุยกันสบายๆ รอบสวน แล้วนั่งพักดูพระอาทิตย์ตก',
    hostName: member.displayName,
    hostAvatar: member.avatarUrl ?? '',
    maxParticipants: 8,
    createdByMemberId: member.id,
  } as unknown as NewEvent);
  await db.atomicJoinEvent(hostedId(member.id), { userId: member.id, userName: member.displayName, userAvatar: member.avatarUrl, note: 'host' });
  for (const sample of [kee, mint].filter(Boolean)) {
    await db.atomicJoinEvent(hostedId(member.id), { userId: sample.id, userName: sample.displayName, userAvatar: sample.avatarUrl });
  }
  if (kee) await db.setCheckIn(hostedId(member.id), { userId: kee.id }, true);
  if (mint) {
    await sendChatMessage(mint, hostedId(member.id), 'สวัสดีค่ะ เพิ่งเคยมาครั้งแรก ต้องเตรียมอะไรไปไหมคะ').catch(() => undefined);
    await sendChatMessage(mint, hostedId(member.id), 'เจอกันที่ทางเข้าฝั่งศูนย์สิริกิติ์ใช่ไหมคะ').catch(() => undefined);
  }

  // 4. A past event the member attended (hosted by a sample member), ready to review
  if (praew) {
    await createAdminEvent({
      ...base,
      id: pastId(member.id),
      title: '[ตัวอย่าง] เดินชมงานอาร์ตแฟร์ด้วยกัน',
      date: thaiDate(1),
      time: '14:00 - 16:00 น.',
      location: 'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร',
      image: '/event-board-games.png',
      description: 'กิจกรรมตัวอย่างสำหรับทดสอบมายฮับ: กิจกรรมที่คุณไปร่วมมาแล้ว และคนจัดเช็กอินให้เรียบร้อย',
      hostName: praew.displayName,
      hostAvatar: praew.avatarUrl ?? '',
      maxParticipants: 6,
      createdByMemberId: praew.id,
    } as unknown as NewEvent);
    await db.atomicJoinEvent(pastId(member.id), { userId: praew.id, userName: praew.displayName, userAvatar: praew.avatarUrl, note: 'host' });
    await db.atomicJoinEvent(pastId(member.id), { userId: member.id, userName: member.displayName, userAvatar: member.avatarUrl });
    await db.setCheckIn(pastId(member.id), { userId: member.id }, true);
    await updateAdminEvent(pastId(member.id), { date: thaiDate(-3) } as Parameters<typeof updateAdminEvent>[1]);
  }

  return NextResponse.json({ success: true, joined, hosted: hostedId(member.id), attended: praew ? pastId(member.id) : null });
}

// Removes the two sample events made for this member (joined real events and the verified status stay)
export async function DELETE(request: Request) {
  if (!isDev) return NextResponse.json({ success: false }, { status: 404 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const session = await getSessionMember(request);
  if (!session) return NextResponse.json({ success: false, message: 'เข้าสู่ระบบก่อน' }, { status: 401 });
  await removeDemoEvents(session.id);
  return NextResponse.json({ success: true });
}
