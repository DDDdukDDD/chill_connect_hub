import fs from 'fs/promises';
import path from 'path';
import { validatePublicHttpsUrl } from './structuredDataScraper';
import { isValidImageUrl } from './spotImageResolver';

/**
 * Checks whether stored image URLs actually load.
 * Results are cached per URL in process memory (prototype: not persisted, not shared across instances).
 */
export type ImageStatus = 'ok' | 'broken' | 'missing' | 'unchecked';

interface ImageCheckResult {
  ok: boolean;
  reason?: string;
  checkedAt: number;
}

const CHECK_TTL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 2;
const CONCURRENCY = 6;

const globalForImages = globalThis as unknown as { _cchImageHealth?: Map<string, ImageCheckResult> };
const results = (globalForImages._cchImageHealth ??= new Map());

async function checkLocalImage(url: string): Promise<ImageCheckResult> {
  const publicDir = path.join(process.cwd(), 'public');
  const target = path.normalize(path.join(publicDir, decodeURIComponent(url.split('?')[0])));
  if (!target.startsWith(publicDir)) return { ok: false, reason: 'Path outside public/', checkedAt: Date.now() };
  try {
    const stat = await fs.stat(target);
    return stat.isFile() ? { ok: true, checkedAt: Date.now() } : { ok: false, reason: 'Not a file', checkedAt: Date.now() };
  } catch {
    return { ok: false, reason: 'File not found in public/', checkedAt: Date.now() };
  }
}

async function checkRemoteImage(value: string, redirectCount = 0): Promise<ImageCheckResult> {
  try {
    const url = await validatePublicHttpsUrl(value);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'ChillConnectHubBot/1.0', Range: 'bytes=0-0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    await response.body?.cancel();

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount >= MAX_REDIRECTS) return { ok: false, reason: 'Too many redirects', checkedAt: Date.now() };
      return checkRemoteImage(new URL(location, url).toString(), redirectCount + 1);
    }
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}`, checkedAt: Date.now() };
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return { ok: false, reason: `Not an image (${contentType || 'unknown type'})`, checkedAt: Date.now() };
    return { ok: true, checkedAt: Date.now() };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Request failed', checkedAt: Date.now() };
  }
}

async function checkImage(url: string): Promise<ImageCheckResult> {
  if (url.startsWith('/') && !url.startsWith('//')) return checkLocalImage(url);
  if (url.startsWith('http://')) return { ok: false, reason: 'Insecure http:// image', checkedAt: Date.now() };
  return checkRemoteImage(url);
}

/** Status of an image from the last check (no network access). */
export function getImageStatus(url: string | undefined): ImageStatus {
  if (!url || !isValidImageUrl(url)) return 'missing';
  const cached = results.get(url);
  if (!cached || Date.now() - cached.checkedAt > CHECK_TTL_MS) return 'unchecked';
  return cached.ok ? 'ok' : 'broken';
}

/** Checks every distinct URL (with limited concurrency) and caches the results. */
export async function checkImages(urls: string[]): Promise<{ checked: number; ok: number; broken: number }> {
  const queue = [...new Set(urls.filter((url) => url && isValidImageUrl(url)))];
  let ok = 0;
  let broken = 0;

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()!;
      const result = await checkImage(url);
      results.set(url, result);
      if (result.ok) ok += 1;
      else broken += 1;
    }
  }

  const total = queue.length;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
  return { checked: total, ok, broken };
}
