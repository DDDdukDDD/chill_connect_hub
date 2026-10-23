import { db } from '../db';
import type { MomentEvidence } from './types';

/**
 * Proof of going for challenges (owner 2026-10-23). A photo moment tied to a place or fair passes at once when the
 * phone's location at posting time is at the place; otherwise it waits for staff review. Marking "มาที่นี่แล้ว"
 * alone never counts toward a challenge (lib/social/questProgress.ts), and a ตี้ is proven by the host's check-in.
 *
 * Limits of a web prototype: the browser cannot prove a photo came from the camera rather than the gallery, and a
 * location can be faked with developer tools. The location check removes most honest mistakes and casual cheating;
 * staff review (and partner QR codes later) covers the rest.
 */
const PASS_RADIUS_M = 300;
const MAX_ACCURACY_M = 200;
const MAX_FIX_AGE_MS = 10 * 60 * 1000;

const toRad = (deg: number) => (deg * Math.PI) / 180;
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const finite = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

async function coordinatesOf(targetType: string, targetId: string): Promise<{ lat: number; lng: number } | null> {
  if (targetType === 'spot') {
    const spot = await db.findSpotById(targetId);
    return spot && finite(spot.latitude) !== null && finite(spot.longitude) !== null && (spot.latitude || spot.longitude) ? { lat: spot.latitude, lng: spot.longitude } : null;
  }
  if (targetType === 'fair') {
    const event = await db.findEventById(targetId);
    return event && finite(event.latitude) !== null && finite(event.longitude) !== null ? { lat: event.latitude as number, lng: event.longitude as number } : null;
  }
  return null;
}

/**
 * Decides the evidence state of a new moment tied to a place or fair. `capture` comes from the browser at posting
 * time: { lat, lng, accuracy, at } (no capture = the member did not share a location).
 */
export async function evidenceForNewMoment(targetType: string, targetId: string | undefined, capture: unknown): Promise<MomentEvidence | undefined> {
  if (!targetId || (targetType !== 'spot' && targetType !== 'fair')) return undefined;
  const now = new Date().toISOString();
  const raw = (capture && typeof capture === 'object' ? capture : {}) as Record<string, unknown>;
  const lat = finite(raw.lat);
  const lng = finite(raw.lng);
  const accuracy = finite(raw.accuracy);
  const at = typeof raw.at === 'number' ? raw.at : null;
  const place = await coordinatesOf(targetType, targetId);
  if (lat === null || lng === null || !place) return { status: 'pending', at: now, reason: lat === null ? 'no_location' : 'no_place_coordinates' };
  const distance = distanceMeters({ lat, lng }, place);
  const fresh = at !== null && Math.abs(Date.now() - at) <= MAX_FIX_AGE_MS;
  const precise = accuracy !== null && accuracy <= MAX_ACCURACY_M;
  if (fresh && precise && distance <= PASS_RADIUS_M) return { status: 'auto', at: now, distanceM: distance };
  return { status: 'pending', at: now, distanceM: distance, reason: !fresh ? 'stale_location' : !precise ? 'imprecise_location' : 'too_far' };
}

/** True when a moment's photo counts as proof for challenges */
export const evidencePassed = (moment: { evidence?: MomentEvidence; evidenceRejected?: unknown }) =>
  !moment.evidenceRejected && (!moment.evidence || moment.evidence.status === 'auto' || moment.evidence.status === 'approved');
