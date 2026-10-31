'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { MomentComposer, type MomentComposerInitial } from '@/components/moments/MomentComposer';
import { nameInitial } from '@/lib/displayName';
import { useMyMonth, type MonthItem } from '@/lib/useMyMonth';

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80';
const FACE_COLORS = ['bg-amber-500', 'bg-pink-500', 'bg-sky-500'];
// Test-login ตี้ carry a "[ตัวอย่าง]" tag in the title (as MeetupTile)
const cleanTitle = (title: string) => title.replace(/^\[ตัวอย่าง\]\s*/, '');

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
};
const hrefOf = (item: MonthItem) =>
  `/${item.targetType === 'spot' ? 'spots' : item.targetType === 'fair' ? 'events' : 'community'}/${encodeURIComponent(item.targetId)}`;

/**
 * "เดือนนี้ของฉัน": what "ตี้ · ที่เที่ยว" on the home page counts. Meetups the member went to with the people
 * who came, places and fairs they visited, and a way to share a moment from any of them that has none yet.
 */
export function MyMonthSection({ isLoggedIn, onToast }: { isLoggedIn: boolean; onToast: (message: string) => void }) {
  const { isLoaded, month } = useMyMonth(isLoggedIn);
  const [composer, setComposer] = useState<MomentComposerInitial | null>(null);
  const [sharedKeys, setSharedKeys] = useState<string[]>([]);

  if (!isLoaded || !month) return null;
  const monthName = THAI_MONTHS[Number(month.month.slice(5, 7)) - 1];
  const keyOf = (item: MonthItem) => `${item.targetType}:${item.targetId}`;
  const hasMoment = (item: MonthItem) => item.hasMoment || sharedKeys.includes(keyOf(item));
  const share = (item: MonthItem) =>
    setComposer({ target: { type: item.targetType, id: item.targetId, title: item.title, location: item.place ?? '' }, location: item.place });

  const shareButton = (item: MonthItem) =>
    hasMoment(item) ? (
      <span className="text-[11px] font-semibold text-[#E11D48] whitespace-nowrap">มีโมเมนต์แล้ว</span>
    ) : (
      <button
        type="button"
        onClick={() => share(item)}
        className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
      >
        <Camera className="w-3.5 h-3.5 text-[#F43F5E]" aria-hidden="true" />
        แชร์โมเมนต์
      </button>
    );

  return (
    <section id="my-month" aria-label="เดือนนี้ของฉัน" className="scroll-mt-24">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">เดือนนี้ของฉัน</h2>
        <span className="text-xs text-slate-500">{monthName}</span>
      </div>

      {month.connect.length === 0 && month.chill.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          เดือนนี้ยังไม่ได้ออกไปไหนเลย ไปตี้แรกของเดือนกัน{' '}
          <Link href="/community" className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">หาตี้</Link>
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-bold">
            ตี้ที่ไปมา <span className="tabular-nums">{month.connect.length}</span>
          </p>
          {month.connect.length > 0 && (
            <ul className="mt-2 space-y-3">
              {month.connect.map((item) => (
                <li key={keyOf(item)} className="flex items-center gap-3">
                  <Link href={hrefOf(item)} className="group flex items-center gap-3 min-w-0 flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || FALLBACK_IMAGE} alt="" className="w-12 h-12 shrink-0 rounded-xl object-cover bg-slate-100" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 truncate group-hover:underline">{cleanTitle(item.title)}</span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        {(item.people ?? []).length > 0 && (
                          <span className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                            {(item.people ?? []).map((p, i) =>
                              p.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={p.avatar} alt="" className="w-5 h-5 rounded-full ring-2 ring-white object-cover bg-slate-100" />
                              ) : (
                                <span key={i} className={`w-5 h-5 rounded-full ring-2 ring-white ${FACE_COLORS[i % FACE_COLORS.length]} text-white text-[9px] font-bold flex items-center justify-center`}>
                                  {nameInitial(p.name)}
                                </span>
                              )
                            )}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 truncate tabular-nums">
                          {shortDate(item.at)}
                          {item.peopleCount ? ` · ไปกับ ${item.peopleCount} คน` : ''}
                        </span>
                      </span>
                    </span>
                  </Link>
                  {shareButton(item)}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-sm font-bold">
            ที่เที่ยวที่ไปมา <span className="tabular-nums">{month.chill.length}</span>
          </p>
          {month.chill.length > 0 && (
            <ul className="mt-2 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3">
              {month.chill.map((item) => (
                <li key={keyOf(item)} className="w-[104px] shrink-0 lg:w-auto">
                  <div className="relative">
                    <Link href={hrefOf(item)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image || FALLBACK_IMAGE} alt="" className="w-full aspect-square rounded-2xl object-cover bg-slate-100" />
                    </Link>
                    {!hasMoment(item) && (
                      <button
                        type="button"
                        onClick={() => share(item)}
                        aria-label={`แชร์โมเมนต์จาก ${cleanTitle(item.title)}`}
                        className="absolute right-1.5 bottom-1.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur text-[#F43F5E] flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <Camera className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <Link href={hrefOf(item)} className="mt-1 block text-xs font-semibold text-slate-900 leading-tight truncate hover:underline">{cleanTitle(item.title)}</Link>
                  <p className="text-[11px] text-slate-500 tabular-nums">{shortDate(item.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {composer && (
        <MomentComposer
          initial={composer}
          onClose={() => setComposer(null)}
          onToast={onToast}
          onPosted={() => {
            const target = composer.target;
            if (target) setSharedKeys((keys) => [...keys, `${target.type}:${target.id}`]);
            setComposer(null);
            onToast('แชร์โมเมนต์แล้ว');
          }}
        />
      )}
    </section>
  );
}
