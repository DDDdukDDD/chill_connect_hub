'use client';

import { useEffect, useState } from 'react';
import type { RewardShopItem } from '@/data/rewardsData';

/**
 * The rewards catalog in the browser (GET /api/rewards/catalog; staff edit it in the admin console). One request per
 * page load, shared by every part that asks. A page rendered with the catalog on the server passes it as `initial`.
 * Hidden rewards are in it, marked `hidden`: shop lists leave them out, a member's redeemed ones still read.
 */
let loaded: RewardShopItem[] | null = null;
let pending: Promise<RewardShopItem[]> | null = null;

const load = () =>
  (pending ??= fetch('/api/rewards/catalog')
    .then((res) => res.json())
    .then((data: { rewards?: RewardShopItem[] }) => (loaded = data.rewards ?? []))
    .catch(() => {
      pending = null;
      return [];
    }));

export function useRewardCatalog(initial?: RewardShopItem[]): RewardShopItem[] {
  const [items, setItems] = useState<RewardShopItem[]>(() => initial ?? loaded ?? []);
  useEffect(() => {
    if (initial) {
      loaded ??= initial;
      return;
    }
    let live = true;
    void load().then((rewards) => live && setItems(rewards));
    return () => {
      live = false;
    };
  }, [initial]);
  return items;
}
