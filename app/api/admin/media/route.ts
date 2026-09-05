import { NextRequest, NextResponse } from 'next/server';
import { mediaStorage } from '@/lib/media';
import { MOCK_EVENTS } from '@/data/mockData';
import { MOCK_SPOTS } from '@/data/spotsData';
import fs from 'fs/promises';
import path from 'path';

// Helper to gather all referenced images across the platform
async function getAllReferencedImageUrls(): Promise<Set<string>> {
  const referenced = new Set<string>();

  // 1. From MOCK_SPOTS
  for (const s of MOCK_SPOTS) {
    if (s.image) referenced.add(s.image);
    if (s.galleryImages) {
      s.galleryImages.forEach((img) => referenced.add(img));
    }
  }

  // 2. From MOCK_EVENTS
  for (const e of MOCK_EVENTS) {
    if (e.image) referenced.add(e.image);
    if (e.galleryImages) {
      e.galleryImages.forEach((img) => referenced.add(img));
    }
    if (e.hostAvatar) referenced.add(e.hostAvatar);
  }

  // 3. From chill_database.json if exists
  try {
    const dbPath = path.join(process.cwd(), 'data', 'chill_database.json');
    const raw = await fs.readFile(dbPath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.events)) {
      for (const e of data.events) {
        if (e.image) referenced.add(e.image);
        if (e.galleryImages) {
          e.galleryImages.forEach((img: string) => referenced.add(img));
        }
        if (e.hostAvatar) referenced.add(e.hostAvatar);
      }
    }
  } catch {
    // ignore if not present
  }

  return referenced;
}

export async function GET() {
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
