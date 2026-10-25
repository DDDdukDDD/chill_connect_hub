import type { ChallengeQuest, EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { matchSearchQuery } from '@/lib/searchUtils';

/**
 * How the ค้นพบ pages (/community, /events, /spots) match a search word and a province.
 * The pages filter with these and GET /api/discover/counts counts with them, so the number on a tab
 * is the number of cards that tab shows for the same search.
 */

export type DiscoverKind = 'meetups' | 'fairs' | 'spots';

/** 'all' means no province picked */
export const ALL_PROVINCES = 'all';
export const ONLINE = 'ออนไลน์';

const isBangkok = (province: string) => province === 'กรุงเทพฯ' || province === 'กรุงเทพมหานคร';

/** A meetup or fair in the picked province ('ออนไลน์' picks online meetups). */
export function eventInProvince(event: EventItem, province: string): boolean {
  if (!province || province === ALL_PROVINCES) return true;
  const evProv = (event.province || '').trim();
  const evLoc = (event.location || '').toLowerCase();
  if (province === ONLINE || province.toLowerCase().includes('online')) {
    return evProv === ONLINE || evLoc.includes('zoom') || evLoc.includes('discord') || evLoc.includes('online');
  }
  if (isBangkok(province)) {
    return isBangkok(evProv) || (!evProv && (evLoc.includes('กทม') || evLoc.includes('กรุงเทพ')));
  }
  return evProv === province || evLoc.includes(province.toLowerCase());
}

export const meetupSearchText = (event: EventItem) =>
  `${event.title} ${event.description || ''} ${event.tag || ''} ${event.location || ''} ${event.hostName || ''} ${event.province || ''}`.toLowerCase();

export const fairSearchText = (event: EventItem) =>
  `${event.title} ${event.description || ''} ${event.tag || ''} ${event.location || ''} ${event.hostName || ''} ${event.venueTag || ''} ${event.province || ''}`.toLowerCase();

export const spotSearchText = (spot: LifestyleSpotItem) =>
  `${spot.province} ${spot.district || ''} ${spot.title} ${(spot.vibeTags || []).join(' ')} ${spot.categoryLabel || ''} ${spot.description}`.toLowerCase();

export const questSearchText = (quest: ChallengeQuest) => {
  const reward = getQuestBrandReward(quest);
  return `${quest.title} ${quest.targetGoal || ''} ${quest.badgeLabel || ''} ${quest.creatorName || ''} ${reward.partnerName || ''} ${reward.title || ''}`.toLowerCase();
};

/** Not over yet: the /challenges list shows these by default */
export const isQuestOpen = (quest: ChallengeQuest) => !(quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0));

/**
 * A place in the picked province, with the city names people use for a province
 * (Hat Yai ↔ Songkhla, Hua Hin ↔ Prachuap, Pattaya ↔ Chonburi). `text` is `spotSearchText(spot)`, passed in when cached.
 */
export function spotInProvince(spot: LifestyleSpotItem, province: string, text = spotSearchText(spot)): boolean {
  if (!province || province === ALL_PROVINCES) return true;
  const spotProv = (spot.province || '').toLowerCase();
  if (isBangkok(province)) return spotProv.includes('กรุงเทพ');
  const p = province.toLowerCase();
  return (
    spotProv.includes(p) ||
    p.includes(spotProv) ||
    (p.includes('หาดใหญ่') && text.includes('หาดใหญ่')) ||
    (p.includes('หัวหิน') && text.includes('หัวหิน')) ||
    (p.includes('พัทยา') && text.includes('พัทยา')) ||
    (p.includes('ชลบุรี') && text.includes('ชลบุรี')) ||
    (p.includes('ประจวบ') && (text.includes('ประจวบ') || text.includes('หัวหิน'))) ||
    (p.includes('สงขลา') && (text.includes('สงขลา') || text.includes('หาดใหญ่')))
  );
}

/** True when there is no search word, or the text matches it. */
export const matchesQuery = (text: string, query: string) => !query.trim() || matchSearchQuery(text, query);

/** How many of each the search finds; `challenges` only counts when there is a search word. */
export type DiscoverCounts = { meetups: number; fairs: number; spots: number; challenges: number };

/** The ค้นพบ page of each kind, carrying the search word and province along. */
export function discoverHref(kind: DiscoverKind, query: string, province: string): string {
  const path = kind === 'meetups' ? '/community' : kind === 'fairs' ? '/events' : '/spots';
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (province && province !== ALL_PROVINCES && !(province === ONLINE && kind !== 'meetups')) params.set('province', province);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
