'use client';

import { useEffect, useState } from 'react';

export interface MyInterests {
  /** ตี้ สาย (also the challenge categories) */
  communityCategories: string[];
  /** Place kinds and fair groups that onboarding inferred from the สาย and goals */
  spotVibes: string[];
  fairCategories: string[];
}

const NONE: MyInterests = { communityCategories: [], spotVibes: [], fairCategories: [] };

/**
 * The signed-in member's onboarding interests (GET /api/auth/member/preferences), for showing their own
 * categories first on ค้นพบ and /challenges. Empty while signed out or loading.
 */
export function useMyInterests(isLoggedIn: boolean): MyInterests {
  const [interests, setInterests] = useState<MyInterests>(NONE);
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch('/api/auth/member/preferences', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        const found = json?.preferences?.interests;
        if (alive && found) setInterests({ ...NONE, ...found });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);
  return isLoggedIn ? interests : NONE;
}
