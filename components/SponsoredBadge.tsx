/**
 * The chip on a sponsored card's photo (lib/sponsored): says plainly that a venue or organiser paid for its place,
 * on the photo so the tile keeps its height (owner 2026-10-31). Top left; ChallengeTile puts it top right, past its XP sticker.
 */
export function SponsoredBadge({ className = 'left-2.5 top-2.5' }: { className?: string }) {
  return <span className={`absolute ${className} rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 whitespace-nowrap shadow-sm`}>สนับสนุน</span>;
}
