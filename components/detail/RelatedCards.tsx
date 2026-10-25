import Link from 'next/link';
import { Calendar } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { formatSpotBadgePrice } from '@/components/SpotCard';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { formatEventBadgePrice, hasKnownPrice } from '@/lib/priceUtils';

const CARD = 'group block h-full rounded-2xl border border-slate-200 bg-white overflow-hidden';
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80';

export interface RelatedCard {
  id: string;
  /** No link: the card shows but cannot be opened (a ตี้ still waiting for review) */
  href?: string;
  image?: string | null;
  /** Date line above the title */
  dateText?: string;
  title: string;
  /** Grey text at the bottom left (seats, province, people) */
  note: string;
  /** Violet pill at the bottom right (challenge XP) */
  pill?: string;
  /** Plain bold text at the bottom right (price) */
  tail?: string;
}

/** "More like this" row at the end of every detail page: the same quiet card on ตี้, อีเวนต์, ที่เที่ยว and ชาเลนจ์ */
export function RelatedCards({
  title,
  allHref,
  allLabel = 'ดูทั้งหมด',
  items,
  titleClassName = 'text-lg sm:text-xl font-bold text-slate-900 tracking-tight',
  className = 'mt-12 sm:mt-16',
  gridClassName = 'grid-cols-2 lg:grid-cols-4',
}: {
  title: string;
  allHref?: string;
  allLabel?: string;
  items: RelatedCard[];
  titleClassName?: string;
  className?: string;
  /** Columns of the card grid (a narrow column wants fewer) */
  gridClassName?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={`${className} space-y-4`} aria-labelledby="related-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="related-title" className={titleClassName}>{title}</h2>
        {allHref && <Link href={allHref} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0">{allLabel}</Link>}
      </div>
      <ul className={`grid ${gridClassName} gap-3 sm:gap-4`}>
        {items.map((item) => {
          const body = (
            <>
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- images come from many hosts and uploads */}
                <img src={item.image || FALLBACK_PHOTO} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 space-y-1.5">
                {item.dateText && (
                  <p className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    {item.dateText}
                  </p>
                )}
                {/* Same title size as the cards on the ค้นพบ pages (EventGrid, SpotCard) */}
                <p className="text-[13px] sm:text-sm font-bold text-slate-900 leading-[1.3] tracking-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[2.6rem]">{item.title}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 tabular-nums truncate">{item.note}</span>
                  {item.pill && <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[11px] font-bold tabular-nums">{item.pill}</span>}
                  {!item.pill && item.tail && <span className="shrink-0 text-[11px] sm:text-xs font-bold text-slate-900 tabular-nums">{item.tail}</span>}
                </div>
              </div>
            </>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className={`${CARD} hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]`}>{body}</Link>
              ) : (
                <div className={CARD}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const shortPrice = (event: EventItem) => (hasKnownPrice(event.price) ? formatEventBadgePrice(event.price) : undefined);

/** A ตี้ as a related card: seats left on the left, price on the right */
export function teeCard(event: EventItem): RelatedCard {
  const left = event.maxParticipants - event.participantsCount;
  const seats = event.maxParticipants > 0 ? (left <= 0 || event.status === 'full' ? 'เต็มแล้ว' : `เหลือ ${left} ที่`) : event.province || '';
  return { id: event.id, href: `/community/${encodeURIComponent(event.id)}`, image: event.image, dateText: event.date, title: event.title, note: seats, tail: shortPrice(event) };
}

/** A fair as a related card: no attendee count on fairs, so the province sits on the left */
export function fairCard(event: EventItem): RelatedCard {
  return { id: event.id, href: `/fairs/${encodeURIComponent(event.id)}`, image: event.image, dateText: event.date, title: event.title, note: event.province || event.location || '', tail: shortPrice(event) };
}

// "ไม่ระบุ" is not a price: the card leaves the corner empty instead
const spotPrice = (spot: LifestyleSpotItem) => {
  const price = formatSpotBadgePrice(spot.price);
  return price.startsWith('ไม่ระบุ') ? undefined : price;
};

/** A place as a related card: where it is on the left, the entry price on the right */
export function spotCard(spot: LifestyleSpotItem): RelatedCard {
  return { id: spot.id, href: `/spots/${encodeURIComponent(spot.id)}`, image: resolveSpotImage(spot), title: spot.title, note: [spot.district, spot.province].filter(Boolean).join(', '), tail: spotPrice(spot) };
}
