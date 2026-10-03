import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { mediaStorage } from '@/lib/media';
import { MOCK_EVENTS } from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { db } from '@/lib/db';

async function getAllStoredSpots(): Promise<LifestyleSpotItem[]> {
  const firstPage = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  }
  return spots;
}

// Helper to gather all referenced images across the platform
async function getAllReferencedImageUrls(): Promise<Set<string>> {
  const referenced = new Set<string>();
  const addAll = (values: Array<string | undefined>) => {
    values.forEach((value) => {
      if (value) referenced.add(value);
    });
  };

  // Seed catalogs plus every stored record (all moderation / publication states)
  const [storedEvents, storedSpots, storedQuests] = await Promise.all([
    db.listAllEvents(),
    getAllStoredSpots(),
    db.findQuests({ page: 1, limit: 1000, includeDrafts: true, status: 'all' }),
  ]);

  for (const s of [...MOCK_SPOTS, ...storedSpots]) {
    addAll([s.image, ...(s.galleryImages || [])]);
  }
  for (const e of [...MOCK_EVENTS, ...storedEvents]) {
    addAll([e.image, e.hostAvatar, ...(e.galleryImages || [])]);
  }
  for (const q of storedQuests.items) {
    addAll([q.badgeCoverImg, q.creatorAvatar]);
  }

  return referenced;
}

export async function GET(request: NextRequest) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const files = mediaStorage.listFiles ? await mediaStorage.listFiles() : [];
    const stats = mediaStorage.getStats ? await mediaStorage.getStats() : {
      totalFiles: files.length,
      totalSizeBytes: files.reduce((a, f) => a + f.size, 0),
      webpFilesCount: files.filter((f) => f.mimeType === 'image/webp').length,
      storageDriver: 'local',
    };

    const referencedUrls = await getAllReferencedImageUrls();

    // Mark files as orphan if neither its full URL nor its key is referenced
    const enrichedFiles = files.map((file) => {
      const isReferenced = referencedUrls.has(file.url) || Array.from(referencedUrls).some((url) => url.includes(file.key));
      return {
        ...file,
        isOrphan: !isReferenced,
      };
    });

    const orphanCount = enrichedFiles.filter((f) => f.isOrphan).length;

    return NextResponse.json({
      success: true,
      files: enrichedFiles,
      stats: {
        ...stats,
        orphanCount,
        referencedDatabaseImages: referencedUrls.size,
      },
    });
  } catch (error) {
    console.error('Error fetching media assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media assets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing file key' },
        { status: 400 }
      );
    }

    const deleted = await mediaStorage.delete(key);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'File not found or delete failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Deleted ${key}` });
  } catch (error) {
    console.error('Error deleting media asset:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'clean_orphans') {
      const files = mediaStorage.listFiles ? await mediaStorage.listFiles() : [];
      const referencedUrls = await getAllReferencedImageUrls();

      let deletedCount = 0;
      let freedBytes = 0;

      for (const file of files) {
        const isReferenced = referencedUrls.has(file.url) || Array.from(referencedUrls).some((url) => url.includes(file.key));
        if (!isReferenced) {
          const ok = await mediaStorage.delete(file.key);
          if (ok) {
            deletedCount++;
            freedBytes += file.size;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `ลบไฟล์ขยะเรียบร้อยแล้ว ${deletedCount} ไฟล์ (คืนพื้นที่ ${(freedBytes / (1024 * 1024)).toFixed(2)} MB)`,
        deletedCount,
        freedBytes,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in media admin POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
