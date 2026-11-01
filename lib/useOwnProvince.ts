'use client';

import { useEffect, useRef } from 'react';
import { ALL_PROVINCES } from '@/lib/discoverMatch';
import { useAuth } from '@/lib/useAuth';

/**
 * The กิจกรรม pages (/community, /events, /spots) start in a signed-in member's own province, like the top bar search
 * (owner 2026-11-01). Only once, only when the link names no province, and only while nothing else is picked: a link
 * such as /community?province=all or a province chosen before the session loads wins. The server page still renders
 * ทั่วประเทศ, so search engines read the whole list.
 */
export function useOwnProvinceDefault(urlProvince: string | null, current: string, apply: (province: string) => void) {
  const own = useAuth().member?.province;
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !own || urlProvince) return;
    done.current = true;
    if (current === ALL_PROVINCES) apply(own);
  }, [own, urlProvince, current, apply]);
}
