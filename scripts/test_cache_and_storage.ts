/**
 * 🧪 Chill & Connect Hub - Automated Cache & Media Storage Test Suite
 * Tests L1 Memory Cache with TTL & Tag Invalidation, and Media Storage Pipeline.
 */

import { cacheManager, MemoryCacheManager } from '../lib/cache';
import { LocalStorageAdapter } from '../lib/media/adapters/localStorageAdapter';
import { db } from '../lib/db';
import fs from 'fs/promises';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log('🚀 Starting Cache & Media Storage Verification...\n');
  let passed = 0;

  // ═══════════════════════════════════════════════════════
  // Test Suite 1: In-Memory Cache Manager & TTL
  // ═══════════════════════════════════════════════════════
  console.log('--- Test Suite 1: Cache Manager & TTL ---');
  const testCache = new MemoryCacheManager(1000, 50);

  // 1. Basic Set / Get
  testCache.set('user:001', { name: 'Alice' }, { ttlMs: 1000, tags: ['users'] });
  const val = testCache.get<{ name: string }>('user:001');
  assert(val !== null && val.name === 'Alice', 'Cache stores and retrieves object by key');
  passed++;

  // 2. Cache Miss
  const miss = testCache.get('user:non_existent');
  assert(miss === null, 'Non-existent key returns null (miss)');
  passed++;

  // 3. Stats tracking
  const stats = testCache.getStats();
  assert(stats.hits === 1 && stats.misses === 1, 'Cache correctly tracks hits and misses');
  passed++;

  // 4. getOrSet factory execution
  let factoryRuns = 0;
  const computed1 = await testCache.getOrSet('calc:sum', async () => {
    factoryRuns++;
    return 42;
  });
  const computed2 = await testCache.getOrSet('calc:sum', async () => {
    factoryRuns++;
    return 42;
  });
  assert(computed1 === 42 && computed2 === 42, 'getOrSet returns correct value');
  assert(factoryRuns === 1, 'getOrSet executes factory only once for cached key');
  passed += 2;

  // 5. TTL Expiration
  testCache.set('temp:short', 'will_expire', { ttlMs: 60 });
  await new Promise((r) => setTimeout(r, 80));
  const expired = testCache.get('temp:short');
  assert(expired === null, 'Cache entry expires after TTL passes');
  passed++;

  // 6. Tag-based invalidation
  testCache.set('post:1', { title: 'P1' }, { tags: ['posts', 'author:10'] });
  testCache.set('post:2', { title: 'P2' }, { tags: ['posts', 'author:20'] });
  testCache.set('post:3', { title: 'P3' }, { tags: ['posts', 'author:10'] });

  const deletedCount = testCache.invalidateTag('author:10');
  assert(deletedCount === 2, 'invalidateTag removed exactly 2 items with tag author:10');
  assert(testCache.get('post:1') === null, 'post:1 was invalidated');
  assert(testCache.get('post:2') !== null, 'post:2 remains intact');
  passed += 3;

  // ═══════════════════════════════════════════════════════
  // Test Suite 2: Repository Cache Integration & Auto-Invalidation
  // ═══════════════════════════════════════════════════════
  console.log('\n--- Test Suite 2: Repository Cache & Auto-Invalidation ---');

  // Query events twice
  cacheManager.clear();
  const res1 = await db.findEvents({ page: 1, limit: 5 });
  const res2 = await db.findEvents({ page: 1, limit: 5 });
  assert(res1.items.length === res2.items.length, 'Repository returns consistent results');
  const globalStats = cacheManager.getStats();
  assert(globalStats.hits >= 1, 'Second repository query hit L1 memory cache');
  passed += 2;

  // Invalidate via Event Mutation
  const tempEvent = await db.createEvent({
    title: 'เทสแคชอินวาลิเดต',
    description: 'ทดสอบความเร็วและแคช',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop',
    eventType: 'community',
    category: 'chill',
    date: '2026-12-31',
    time: '18:00',
    location: 'กรุงเทพฯ',
    province: 'กรุงเทพมหานคร',
    hostName: 'Tester',
    hostId: 'test-user',
    tag: 'ทดสอบ',
    participantsCount: 1,
    maxParticipants: 5,
  });

  // Query again - should fetch fresh list including new event
  const res3 = await db.findEvents({ page: 1, limit: 5 });
  assert(res3.items.some((e) => e.id === tempEvent.id), 'Cache was auto-invalidated upon event creation');
  passed++;

  // Clean up test event
  await db.deleteEvent(tempEvent.id);

  // ═══════════════════════════════════════════════════════
  // Test Suite 3: Media Storage Adapter & Security
  // ═══════════════════════════════════════════════════════
  console.log('\n--- Test Suite 3: Media Storage Adapter & Security ---');

  const testStorageDir = path.join(process.cwd(), 'public', 'uploads', '_test');
  const storage = new LocalStorageAdapter(testStorageDir, '/uploads/_test');

  // 1. Upload valid image buffer
  const fakeJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const uploadRes = await storage.upload(fakeJpg, 'sample.jpg', 'image/jpeg', {
    folder: 'events',
  });

  assert(uploadRes.url.startsWith('/uploads/_test/events/'), 'Upload URL has correct public prefix');
  assert(uploadRes.size === fakeJpg.length, 'Upload result tracks exact byte size');
  assert(uploadRes.mimeType === 'image/jpeg', 'Upload tracks MIME type');
  passed += 3;

  // 2. Verify file was physically written to disk
  const diskPath = path.join(testStorageDir, uploadRes.key);
  const exists = await fs
    .stat(diskPath)
    .then(() => true)
    .catch(() => false);
  assert(exists, 'Uploaded file exists physically on disk');
  passed++;

  // 3. Security: Reject disallowed MIME type
  let rejectedMime = false;
  try {
    await storage.upload(Buffer.from('malicious script'), 'payload.exe', 'application/x-msdownload');
  } catch {
    rejectedMime = true;
  }
  assert(rejectedMime, 'Storage rejects non-image MIME types');
  passed++;

  // 4. Security: Reject oversized file
  let rejectedSize = false;
  try {
    const hugeBuffer = Buffer.alloc(1024 * 1024 + 10); // 1MB + 10 bytes
    await storage.upload(hugeBuffer, 'big.png', 'image/png', {
      maxSizeBytes: 1024 * 1024, // 1MB limit
    });
  } catch {
    rejectedSize = true;
  }
  assert(rejectedSize, 'Storage rejects files exceeding maxSizeBytes');
  passed++;

  // 5. Delete file
  const deleted = await storage.delete(uploadRes.key);
  assert(deleted, 'Storage successfully deletes file by key');
  const stillExists = await fs
    .stat(diskPath)
    .then(() => true)
    .catch(() => false);
  assert(!stillExists, 'File no longer exists on disk after deletion');
  passed += 2;

  // Clean up test dir
  await fs.rm(testStorageDir, { recursive: true, force: true }).catch(() => {});

  console.log('\n=============================================');
  console.log(`Verification Complete: ${passed} passed, 0 failed`);
  console.log('=============================================\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
