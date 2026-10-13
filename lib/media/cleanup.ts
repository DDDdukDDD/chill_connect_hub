import { mediaStorage } from './index';

// Folders members upload into; event and place photos are never removed from here
const MEMBER_FOLDERS = ['moments', 'avatars'];

/** The storage key of a member upload, or null for anything else (outside photos, event images) */
function memberUploadKey(url: string): string | null {
  const local = /^\/uploads\/([\w-]+)\/[\w\-.]+$/.exec(url);
  if (local) return MEMBER_FOLDERS.includes(local[1]) ? url.slice('/uploads/'.length) : null;
  const blob = /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/([\w-]+)\//.exec(url);
  // The blob store deletes by URL
  return blob && MEMBER_FOLDERS.includes(blob[1]) ? url : null;
}

/**
 * Deletes the files behind content that was just removed (account deletion).
 * `stillUsed` are image URLs that remaining content shows; those files stay.
 */
export async function deleteMemberUploads(urls: Iterable<string | undefined>, stillUsed: Iterable<string>): Promise<number> {
  const keep = new Set(stillUsed);
  let deleted = 0;
  for (const url of new Set(urls)) {
    if (!url || keep.has(url)) continue;
    const key = memberUploadKey(url);
    if (key && (await mediaStorage.delete(key))) deleted++;
  }
  return deleted;
}
