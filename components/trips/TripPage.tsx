'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Footprints, Lock, MapPin, Pencil, Play, Share2, Users } from 'lucide-react';
import { TripCardButton, TripComments, TripCommentsLink, TripLikeButton } from '@/components/trips/TripSocial';
import { MomentsChrome } from '@/components/moments/MomentsChrome';
import { TripPlayer } from '@/components/trips/TripPlayer';
import { FollowTripDialog } from '@/components/trips/FollowTripDialog';
import { TripPublishedDialog } from '@/components/trips/TripPublishedDialog';
import { optimizedImage } from '@/lib/optimizedImage';
import { daysBetween, itemPicture, subTrip, thaiDateRange, thaiShortDate, timeOf, tripCover, tripParts, tripPlaces, tripTag, visibleItems, type TripChapter, type TripView } from '@/lib/trips/story';

/** Shares the trip's link: the phone's share sheet, else copied */
export async function shareTrip(trip: Pick<TripView, 'id' | 'title'>, showToast: (message: string) => void, legId?: string) {
  const url = `${window.location.origin}/trips/${trip.id}${legId ? `?leg=${encodeURIComponent(legId)}` : ''}`;
  if (navigator.share) {
    await navigator.share({ title: trip.title, url }).catch(() => undefined);
    return;
  }
  const copied = await navigator.clipboard?.writeText(url).then(() => true).catch(() => false);
  showToast(copied ? 'คัดลอกลิงก์แล้ว' : url);
}

/** /trips/[id]: the trip told as a page (in the server HTML, for search) with the full-screen story one tap away */
/** `legId`: one sub-trip on its own (its link, ?leg=) */
/** `justPublished`: the editor just published it (?published=1): the share dialog opens once */
export function TripPage({ trip: fullTrip, autoplay, legId, justPublished = false }: { trip: TripView; autoplay: boolean; legId?: string; justPublished?: boolean }) {
  const leg = legId ? subTrip(fullTrip, legId) : null;
  const trip = leg ?? fullTrip;
  const [playing, setPlaying] = useState<{ startItemId?: string; partId?: string } | null>(autoplay ? {} : null);
  const close = useCallback(() => setPlaying(null), []);
  const parts = tripParts(trip);
  const playTrip = (playing?.partId && subTrip(fullTrip, playing.partId)) || trip;
  // "ไปตามรอย": the whole trip, or one sub-trip (from its own link or after playing it)
  const [following, setFollowing] = useState<{ legId?: string } | null>(null);
  const canFollow = !fullTrip.isOwner && fullTrip.status === 'published';
  const followPlan = following?.legId ? subTrip(fullTrip, following.legId) : fullTrip;
  const cover = tripCover(trip);
  const { cities } = tripPlaces(trip);
  const count = visibleItems(trip).length;
  const draft = trip.status !== 'published';
  const [published, setPublished] = useState(justPublished && fullTrip.isOwner && !draft);
  // A reload or a copied link must not open the dialog again
  useEffect(() => {
    if (justPublished) window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [justPublished]);

  return (
    <MomentsChrome>
      {({ showToast, isLoggedIn, requireLogin }) => {
        const startFollow = (legIdToFollow?: string) => {
          setPlaying(null);
          if (!isLoggedIn) requireLogin('ไปตามรอยทริปนี้');
          else setFollowing({ legId: legIdToFollow });
        };
        return (
        <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
          {leg && (
            <p className="mb-4 text-sm text-slate-500">
              ทริปย่อยใน{' '}
              <Link href={`/trips/${fullTrip.id}`} className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                {fullTrip.title}
              </Link>
            </p>
          )}
          {trip.isOwner && !leg && (
            <div className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${draft ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700'}`}>
              {draft ? <Lock className="size-4 shrink-0" aria-hidden /> : <Users className="size-4 shrink-0" aria-hidden />}
              <p className="min-w-0 flex-1">
                {trip.status === 'hidden' ? 'ทีมงานซ่อนทริปนี้ไว้ มีแต่คุณที่เห็น' : draft ? 'ร่างไว้ ยังไม่มีใครเห็น' : trip.visibility === 'public' && trip.heldUntilBack ? `ตอนนี้เห็นเฉพาะผู้ติดตาม ทุกคนเห็นได้หลัง ${thaiShortDate(trip.endsOn)}` : trip.visibility === 'public' ? 'ทุกคนเห็นทริปนี้' : trip.visibility === 'followers' ? 'ผู้ติดตามเห็นทริปนี้' : 'มีแต่คุณที่เห็น'}
              </p>
              <Link href={`/trips/${trip.id}/edit`} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200">
                <Pencil className="size-4" aria-hidden /> แก้ไขทริป
              </Link>
            </div>
          )}

          {cover ? (
            <button
              type="button"
              onClick={() => setPlaying({})}
              className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-3xl bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] sm:aspect-[16/10]"
              aria-label={`เล่นเรื่อง ${trip.title}`}
            >
              <img src={optimizedImage(itemPicture(cover), 1080)} alt={cover.caption || trip.title} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
                <span className="size-1.5 rounded-full bg-[#E11D48]" aria-hidden />
                {tripTag(trip)}
              </span>
              <span className="absolute bottom-4 right-4 flex size-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur transition group-hover:bg-white">
                <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
              </span>
            </button>
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-500">ยังไม่มีรูปในทริปนี้</div>
          )}

          <h1 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{trip.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {thaiDateRange(trip.startsOn, trip.endsOn)} · {count} โมเมนต์
          </p>
          {cities.length > 0 && <p className="mt-1 text-sm text-slate-700">{cities.join(' → ')}</p>}
          {trip.intro && <p className="mt-4 max-w-prose text-sm leading-relaxed text-slate-700">{trip.intro}</p>}
          {fullTrip.follows && (
            <p className="mt-3 text-sm text-slate-500">
              ตามรอยทริป{' '}
              <Link href={`/trips/${fullTrip.follows.id}`} className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                {fullTrip.follows.title}
              </Link>{' '}
              ของ {fullTrip.follows.authorName}
            </p>
          )}
          {fullTrip.followedCount > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <Footprints className="size-4 shrink-0 text-[#4A7C59]" aria-hidden />
              <span>
                <span className="font-semibold tabular-nums text-slate-900">{fullTrip.followedCount} คน</span> ไปตามรอยทริปนี้แล้ว
              </span>
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Link href={`/profile?id=${encodeURIComponent(trip.author.id)}`} className="flex min-w-0 items-center gap-2.5">
              <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {trip.author.avatar && <img src={optimizedImage(trip.author.avatar, 96)} alt="" className="size-full object-cover" />}
              </span>
              <span className="min-w-0 truncate text-sm font-semibold text-slate-900">{trip.author.name}</span>
            </Link>
            {trip.withPeople.length > 0 && (
              <span className="min-w-0 truncate text-sm text-slate-500">ไปกับ {trip.withPeople.map((p) => p.name).join(' ')}</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {count > 0 && (
              <button
                type="button"
                onClick={() => setPlaying({})}
                className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] active:scale-[0.98]"
              >
                <Play className="size-4 fill-current" aria-hidden /> เล่นเรื่อง
              </button>
            )}
            {canFollow && (
              <button
                type="button"
                onClick={() => startFollow(legId)}
                className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
              >
                <Footprints className="size-4" aria-hidden /> ไปตามรอย
              </button>
            )}
            {!draft && (
              <button
                type="button"
                onClick={() => shareTrip(fullTrip, showToast, legId)}
                aria-label="แชร์ทริปนี้"
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              >
                <Share2 className="size-4" aria-hidden />
              </button>
            )}
          </div>
          {!draft && (
            <div className="mt-3 flex flex-wrap gap-2">
              <TripLikeButton trip={fullTrip} chrome={{ isLoggedIn, requireLogin, showToast }} />
              <TripCommentsLink count={fullTrip.commentCount} />
              {!leg && <TripCardButton trip={fullTrip} onToast={showToast} />}
            </div>
          )}

          {parts.length > 1
            ? parts.map((part) => (
                <section key={part.id} className="mt-14">
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{part.city || 'ระหว่างทาง'}</h2>
                  <p className="mt-1 text-xs tabular-nums text-slate-500">
                    ทริปย่อย {part.number} · {daysBetween(part.from, part.to) + 1} วัน · {part.from === part.to ? thaiShortDate(part.from) : `${thaiShortDate(part.from)} – ${thaiShortDate(part.to)}`}
                  </p>
                  {part.note && <p className="mt-2 max-w-prose text-base leading-relaxed text-slate-700">{part.note}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPlaying({ partId: part.id })} className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                      <Play className="size-3.5 fill-current" aria-hidden /> เล่นเฉพาะ{part.city || 'ช่วงนี้'}
                    </button>
                    {!draft && (
                      <button type="button" onClick={() => shareTrip(trip, showToast, part.id)} className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                        <Share2 className="size-3.5" aria-hidden /> แชร์ทริปย่อยนี้
                      </button>
                    )}
                  </div>
                  {part.chapters.map((chapter) => (
                    <DaySection key={chapter.day} chapter={chapter} level="h3" onOpen={(id) => setPlaying({ startItemId: id })} />
                  ))}
                </section>
              ))
            : parts.flatMap((part) => part.chapters).map((chapter) => (
                <DaySection key={chapter.day} chapter={chapter} level="h2" onOpen={(id) => setPlaying({ startItemId: id })} />
              ))}

          {!draft && <TripOnward trip={trip} canFollow={canFollow} onFollow={() => startFollow(legId)} />}
          {!draft && <TripComments trip={fullTrip} chrome={{ isLoggedIn, requireLogin, showToast }} />}

          {playing && count > 0 && (
            <TripPlayer trip={playTrip} startItemId={playing.startItemId} onClose={close} actions={draft ? {} : { onShare: () => shareTrip(fullTrip, showToast, playing.partId ?? legId), ...(canFollow ? { onFollow: () => startFollow(playing.partId ?? legId) } : {}) }} />
          )}
          {published && <TripPublishedDialog trip={fullTrip} onPlay={() => setPlaying({})} onToast={showToast} onClose={() => setPublished(false)} />}
          {following && followPlan && (
            <FollowTripDialog trip={fullTrip} plan={followPlan} legId={following.legId} onClose={() => setFollowing(null)} onToast={showToast} />
          )}
        </main>
        );
      }}
    </MomentsChrome>
  );
}

/**
 * After the story, where to go next (owner 2026-11-27): the trip leads back into going out. Places in Thailand open
 * their places on /spots and a ตี้ along the same way; a trip abroad offers following it.
 */
function TripOnward({ trip, canFollow, onFollow }: { trip: TripView; canFollow: boolean; onFollow: () => void }) {
  const thaiCities = [
    ...new Set(
      tripParts(trip)
        .filter((part) => part.city && part.chapters.some((c) => c.items.some((i) => i.countryCode === 'TH')))
        .map((part) => part.city),
    ),
  ].slice(0, 4);
  if (!thaiCities.length && !canFollow) return null;
  const chip = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200';
  return (
    <section className="mt-16 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-bold text-slate-900">อยากไปแบบนี้บ้าง</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {canFollow && (
          <button type="button" onClick={onFollow} className={`${chip} cursor-pointer`}>
            <Footprints className="size-4 text-[#4A7C59]" aria-hidden /> ไปตามรอยทริปนี้
          </button>
        )}
        {thaiCities.map((city) => (
          <Link key={city} href={`/spots?q=${encodeURIComponent(city)}`} className={chip}>
            <MapPin className="size-4 text-[#4A7C59]" aria-hidden /> ที่เที่ยวใน{city}
          </Link>
        ))}
        {thaiCities.length > 0 && (
          <Link href="/community?create=1" className={chip}>
            <Users className="size-4" aria-hidden /> ชวนเพื่อนตั้งตี้ไปด้วยกัน
          </Link>
        )}
      </div>
    </section>
  );
}

/** One day: its heading and its photos, a tap opens the story at that photo */
function DaySection({ chapter, level, onOpen }: { chapter: TripChapter; level: 'h2' | 'h3'; onOpen: (itemId: string) => void }) {
  const Heading = level;
  return (
    <section className={level === 'h2' ? 'mt-12' : 'mt-8'}>
      <Heading className={level === 'h2' ? 'text-xl font-bold text-slate-900 sm:text-2xl' : 'text-base font-bold text-slate-900'}>
        {chapter.label}
        {level === 'h2' && chapter.title && <span className="font-bold"> · {chapter.title}</span>}
      </Heading>
      <p className="mt-1 text-xs text-slate-500">{thaiShortDate(chapter.day)} · {chapter.items.length} โมเมนต์</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {chapter.items.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)} className="group block w-full cursor-pointer text-left">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                <img src={optimizedImage(itemPicture(item), 480)} alt={item.caption || `${chapter.title} ${timeOf(item.takenLocal)}`} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                {item.kind === 'video' && (
                  <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
                    <Play className="size-3.5 translate-x-px fill-current" aria-hidden />
                  </span>
                )}
              </span>
              {item.caption && <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-slate-700">{item.caption}</span>}
              <span className="mt-0.5 block text-xs tabular-nums text-slate-500">{timeOf(item.takenLocal)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
