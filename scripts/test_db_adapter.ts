/**
 * Verification Script for Data Access Layer (DAO) & Concurrency Architecture
 * Tests:
 * 1. Pagination & Slicing
 * 2. Multi-Pillar Filtering (Community, Public Fairs, Lifestyle Spots)
 * 3. High-Concurrency Race Condition Prevention (Atomic Seat Booking)
 */

import { getDatabase } from '../lib/db/index';

async function runTests() {
  console.log('🚀 Starting Data Access Layer & Concurrency Verification...\n');
  const db = getDatabase();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Pagination Engine (Page 1 vs Page 2)
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Pagination & Slicing ---');
  const page1 = await db.findEvents({ page: 1, limit: 3 });
  assert(page1.items.length === 3, 'Page 1 returns exactly 3 items');
  assert(page1.page === 1, 'Metadata page is 1');
  assert(page1.limit === 3, 'Metadata limit is 3');
  assert(page1.totalPages > 1, 'Total pages calculated correctly');
  assert(page1.hasNextPage === true, 'hasNextPage is true for Page 1');

  const page2 = await db.findEvents({ page: 2, limit: 3 });
  assert(page2.items.length === 3, 'Page 2 returns 3 items');
  assert(page2.page === 2, 'Metadata page is 2');
  assert(page2.items[0].id !== page1.items[0].id, 'Page 1 and Page 2 contain distinct events');

  // ---------------------------------------------------------------------------
  // TEST 2: Multi-Pillar Filter (Community vs Public Fairs vs Spots)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Multi-Pillar & Province Filtering ---');
  const communityEvents = await db.findEvents({ eventType: 'community', limit: 50 });
  const allCommunity = communityEvents.items.every((e) => e.eventType === 'community');
  assert(allCommunity, 'All events in community query have eventType="community"');

  const fairEvents = await db.findEvents({ eventType: 'public_venue', limit: 50 });
  const allFairs = fairEvents.items.every((e) => e.eventType === 'public_venue');
  assert(allFairs, 'All events in fairs query have eventType="public_venue"');

  const bkkSpots = await db.findSpots({ province: 'กรุงเทพฯ', limit: 10 });
  assert(bkkSpots.items.length > 0, 'Found lifestyle spots in กรุงเทพฯ');
  assert(bkkSpots.items.every((s) => s.province.includes('กรุงเทพ')), 'All returned spots match requested province');

  // ---------------------------------------------------------------------------
  // TEST 3: High-Concurrency Atomic Join (Anti-Race Condition / Anti-Overbooking)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: High-Concurrency Atomic Join (Race Condition Test) ---');
  // Create a limited test event with capacity of 4 seats (1 host + 3 available)
  const testMeetup = await db.createEvent({
    title: 'Atomic Concurrency Stress Test Meetup',
    eventType: 'community',
    category: 'chill',
    tag: 'ชิลล์เอาต์',
    province: 'กรุงเทพฯ',
    location: 'Test Lab',
    participantsCount: 1,
    maxParticipants: 4, // Only 3 seats remaining!
    status: 'recruiting',
    date: '2026-12-25',
    time: '18:00 - 20:00 น.',
    hostName: 'Test Host',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865',
    description: 'Concurrency stress test',
  });

  console.log(`  Created test meetup ID=${testMeetup.id} (Cap: ${testMeetup.maxParticipants}, Current: ${testMeetup.participantsCount})`);
  console.log('  Simulating 10 users clicking "Join" at the EXACT same millisecond...');

  // Fire 10 simultaneous join requests in parallel
  const joinPromises = Array.from({ length: 10 }, (_, i) => {
    const userId = `concurrent-user-${i + 1}`;
    return db.atomicJoinEvent(testMeetup.id, {
      userId,
      userName: `User #${i + 1}`,
      joinedAt: new Date().toISOString(),
    });
  });

  const results = await Promise.all(joinPromises);

  const successfulJoins = results.filter((r) => r.success);
  const rejectedJoins = results.filter((r) => !r.success && r.status === 'event_full');

  console.log(`  -> Successful joins: ${successfulJoins.length}`);
  console.log(`  -> Rejected (full): ${rejectedJoins.length}`);

  // Exactly 3 users should have successfully joined (1 initial + 3 = 4 max)
  assert(successfulJoins.length === 3, 'Exactly 3 out of 10 concurrent requests were admitted');
  assert(rejectedJoins.length === 7, 'Exactly 7 out of 10 requests were safely rejected with event_full');

  const finalEvent = await db.findEventById(testMeetup.id);
  assert(finalEvent !== null && finalEvent.participantsCount === 4, 'Final participantsCount is exactly 4 (No overbooking!)');
  assert(finalEvent !== null && finalEvent.status === 'full', 'Event status was automatically marked as "full"');

  // Clean up test event
  await db.deleteEvent(testMeetup.id);
  console.log('  Cleaned up stress test event.');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n=============================================`);
  console.log(`Verification Complete: ${passed} passed, ${failed} failed`);
  console.log(`=============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
