'use client';

import { CircleCheck, Loader2 } from 'lucide-react';
import type { NameCheck } from '@/lib/useNameCheck';

/** The line under a name field while it is checked (BE-394): checking, free, or taken with what to try */
export function NameCheckHint({ check, id }: { check: NameCheck; id?: string }) {
  if (check.state === 'checking') {
    return (
      <p id={id} className="flex items-center gap-1.5 text-xs font-medium text-slate-500" role="status">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        กำลังตรวจชื่อ…
      </p>
    );
  }
  if (check.state === 'available') {
    return (
      <p id={id} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" role="status">
        <CircleCheck className="w-3.5 h-3.5" aria-hidden="true" />
        ชื่อนี้ใช้ได้
      </p>
    );
  }
  if (check.state === 'taken') {
    return <p id={id} className="text-xs font-bold text-rose-600" role="alert">{check.message}</p>;
  }
  return null;
}
