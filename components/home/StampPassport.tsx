import Link from 'next/link';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80';
const SLOTS = 8;

export interface PassportStamp {
  questId: string;
  label: string;
  image?: string;
}

export interface PassportPending extends PassportStamp {
  /** Steps still to go before the stamp is earned */
  left: number;
}

/**
 * Badges as stamps in a passport: one stamp per finished challenge, in colour; the challenges the member is doing
 * as dashed outlines with the steps still to go; the rest of the running challenges as one "+N" slot.
 */
export function StampPassport({ earned, pending, more }: { earned: PassportStamp[]; pending: PassportPending[]; more: number }) {
  const total = earned.length + pending.length + more;
  const shownEarned = earned.slice(0, SLOTS);
  const shownPending = pending.slice(0, Math.max(0, SLOTS - 1 - shownEarned.length));
  const rest = total - shownEarned.length - shownPending.length;

  return (
    <section aria-label="พาสปอร์ตของฉัน">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-900">พาสปอร์ตของฉัน</h2>
        <span className="text-xs text-slate-500 tabular-nums">{earned.length}/{total} แสตมป์</span>
      </div>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3">
        {shownEarned.map((stamp, i) => (
          <li key={stamp.questId} className="text-center">
            <Link href={`/challenges/${encodeURIComponent(stamp.questId)}`} className="group block" title={stamp.label}>
              {/* Stamps sit a little crooked, like real ones */}
              <span className={`mx-auto block w-14 h-14 rounded-full p-0.5 border-2 border-[#7C3AED] bg-white ${i % 2 ? 'rotate-6' : '-rotate-6'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stamp.image || FALLBACK_IMAGE} alt="" className="w-full h-full rounded-full object-cover bg-slate-100" />
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2 group-hover:underline">{stamp.label}</span>
            </Link>
          </li>
        ))}
        {shownPending.map((stamp) => (
          <li key={stamp.questId} className="text-center">
            <Link href={`/challenges/${encodeURIComponent(stamp.questId)}`} className="group block" title={stamp.label}>
              <span className="mx-auto block w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-slate-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stamp.image || FALLBACK_IMAGE} alt="" className="w-full h-full rounded-full object-cover bg-slate-100 grayscale opacity-40" />
              </span>
              <span className="mt-1 block text-[11px] text-slate-500 leading-tight group-hover:underline">อีก {stamp.left}</span>
            </Link>
          </li>
        ))}
        {rest > 0 && (
          <li className="text-center">
            <Link href="/challenges" className="group block">
              <span className="mx-auto w-14 h-14 rounded-full border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 flex items-center justify-center tabular-nums">+{rest}</span>
              <span className="mt-1 block text-[11px] text-slate-400 leading-tight group-hover:underline">ชาเลนจ์อื่น</span>
            </Link>
          </li>
        )}
      </ul>
      {earned.length === 0 && pending.length === 0 && (
        <Link href="/challenges" className="mt-3 inline-block text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
          เริ่มชาเลนจ์แรก รับแสตมป์แรก →
        </Link>
      )}
    </section>
  );
}
