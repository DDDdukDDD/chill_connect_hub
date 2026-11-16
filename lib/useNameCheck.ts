'use client';

import { useEffect, useState } from 'react';
import { nameKey } from './displayName';

export type NameCheck = { state: 'idle' | 'checking' | 'available' | 'taken'; message?: string };

/**
 * Asks the server whether a name is free while the member types, like IG (BE-394). `current`: the member's own name,
 * which needs no check. Waits 400 ms after the last key. A failed request stays quiet: saving checks again anyway.
 */
export function useNameCheck(name: string, { current, enabled = true, forNewAccount = false }: { current?: string; enabled?: boolean; forNewAccount?: boolean } = {}): NameCheck {
  const [result, setResult] = useState<{ key: string; check: NameCheck } | null>(null);
  const key = nameKey(name);
  const skip = !enabled || key.length < 2 || (current !== undefined && key === nameKey(current));

  useEffect(() => {
    if (skip) return;
    let alive = true;
    const timer = setTimeout(() => {
      fetch(`/api/auth/member/name-check?name=${encodeURIComponent(name.trim())}${forNewAccount ? '&for=new' : ''}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (!alive || !json?.success) return;
          setResult({ key, check: json.available ? { state: 'available' } : { state: 'taken', message: json.message } });
        })
        .catch(() => undefined);
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [skip, key, name, forNewAccount]);

  if (skip) return { state: 'idle' };
  // An answer for an older spelling does not count: still checking the new one
  return result?.key === key ? result.check : { state: 'checking' };
}
