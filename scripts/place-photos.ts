// Copies place photos from Wikimedia and the TAT Data API onto our own storage (R2), on GitHub Actions instead of
// Vercel (2026-11-24: webp work is CPU time). The job itself is lib/media/placePhotoBackfill.ts.
//
//   npx tsx scripts/place-photos.ts [--places 300] [--photos 600] [--minutes 8]
//
// Needs DATA_STORE=postgres, DATABASE_URL (the site's runtime login) and the R2_* settings in the environment.
// One run reads a batch of places and writes it back in one transaction (each write makes servers reread the catalog).
import { copyPlacePhotos } from '../lib/media/placePhotoBackfill';
import { sql } from '../lib/db/postgres/client';

const arg = (name: string, fallback: number) => {
  const at = process.argv.indexOf(`--${name}`);
  const value = at > 0 ? Number(process.argv[at + 1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

async function main() {
  try {
    const result = await copyPlacePhotos({ places: arg('places', 300), photos: arg('photos', 600), timeBudgetMs: arg('minutes', 8) * 60_000 });
    console.log(JSON.stringify(result));
    // Every place failed: something is wrong with the settings, so the run shows red
    if ('failed' in result && result.places > 0 && result.copied === 0 && result.failed === result.places) process.exitCode = 1;
  } finally {
    await sql().end();
  }
}
main();
