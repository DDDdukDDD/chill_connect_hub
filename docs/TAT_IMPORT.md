# Places from TAT (TAT Data API)

Status 2026-11-19: **attractions imported into the dev database** (1,642 new drafts, 346 existing places filled in), see "Import run" below. Live not touched.

## Access

- API: `https://tatdataapi.io`, OpenAPI at `/api/docs-json`, header `x-api-key`, `Accept-Language: th`. Use version 2 (`/api/v2/...`), which TAT recommends.
- One key covers both the TAT Data API and the TAT Data Catalog. Each computer puts it in its own `.env.development.local` as `TAT_API_KEY` (never in git or chat). `.env.local` and Vercel only when an import runs against live or a scheduled job needs it.
- Quota: 3,000 calls per day for ordinary developers. Lists take `limit=1000`.
- Git Bash rewrites arguments starting with `/api/...` into Windows paths: set `MSYS_NO_PATHCONV=1` when calling from a shell script.

## Terms (TAT's email reply, 2026-11-17)

- Terms of use are those of TourismThailand.org; registering means accepting them. Open Data approach; no limit on who may use it (commercial use is fine).
- Translating and adapting are allowed if we tell readers how the text was made: show "เรียบเรียงจากข้อมูล ททท." on rewritten texts.
- Images may be used, resized and cropped, credit in our own format, as long as the change does not mislead. Copy them to our storage rather than hotlinking `dmc.tatdataapi.io`.
- Our credit format is fine; a link back to the source record is not needed (TAT says such links can be inconsistent).
- No guarantee of accuracy or freshness: imported places go through staff approval, and the "แจ้งข้อมูลผิด" button stays.
- Permission has no end date; changes are announced by email to the registered address.

## What is there (measured 2026-11-17)

| Data | Count | Use |
| :--- | ---: | :--- |
| Events, all | 21,952 | `upcoming=true` does not filter. Only **14** end on or after today, so no importer; staff add the good ones by hand |
| Places, all (78 provinces, Bangkok 4,498) | 20,099 | Restaurants/cafés 9,166, attractions 4,325, other 2,972, shops 2,150, stays 1,486 |
| Attractions not already ours (same name or within ~200 m of our 2,342 dev places) | 2,917 | `app.places.location` is PostGIS: compare with `st_y`/`st_x` |
| Of those, introduction + picture already in the **list** | 1,421 | Bangkok only 25; Chiang Mai 75, Kanchanaburi 43, Ayutthaya 41 |
| Estimate after opening **details** (`/api/v2/places/{id}`) | ~2,300 attractions, ~2,000–2,500 restaurants with pictures | The list hides most content: in a sample of 10 "empty" attractions, 9 had detail text and 6 had about 30 pictures; 3 in 10 restaurants had pictures, almost none had text |

Details give `information.detail` (HTML), `openingHours`, fees, `desktopImageUrls`/`mobileImageUrls`, `googleMapUrl`, contact and facilities. One call per place: all attractions ≈ 1 day of quota, restaurants ≈ 3–4 days, so the importer should fetch in nightly batches.

## Text quality

TAT's texts read like official notices: almost every one starts "ตั้งอยู่ตำบล…", temples and museums are mostly history and royal background, some read like propaganda ("ให้เกิดความรักชาติ"), and some have typos (doubled vowels such as "มหาวิทยาลััย"). Better than Wikipedia for places where you do something (indigo workshops, community trips, markets), still a history lesson for temples, museums and monuments. Nothing about feel, best time or who it suits.

## Proposed plan (waiting for the owner)

1. Importer into the **dev** database: map TAT categories to ours, skip places we already have, copy pictures to our storage, clean HTML and obvious typos, credit TAT, every place waits for staff approval.
2. Texts: use TAT's text first; write our own vibe text only for places that get recommended or shown on a province's first page, temples and museums first. This changes the 2026-11-08 rule "vibe text for every imported place in the same batch", so it needs the owner's yes.
3. Start with attractions in one region (north), owner checks, then the other regions, then restaurants starting with Bangkok.
4. Optional: an Anthropic API key would let the importer write the vibe texts (about $1–3 for all), staff still check them.

## Import run (2026-11-19, dev only)

Owner decisions 2026-11-18: TAT's text first (our vibe text later, for places that get recommended); every attraction with text and a picture, all provinces; where we already have the place and TAT knows more, use TAT's data.

- Importer: `db/import-tat-attractions.ts` (mapping in `lib/scrapers/tatDataApi.ts`), run with `npx tsx --env-file=.env.development.local db/import-tat-attractions.ts`. Refuses any database but dev. `--dry`, `--limit=N`, `--budget=N` (calls, default 1,800), `--skip-province=`, `--recategorize`.
- The list API ignores `categoryId` (every page holds all 20,159 places) and pages come a few short of 1,000: the importer walks all ~21 pages and keeps category 3 (4,325 attractions).
- Result: 4,325 listed, 2,005 without text or picture, 1,642 new places (drafts, `tat-<placeId>`, credited "การท่องเที่ยวแห่งประเทศไทย"), 346 places we had filled in, 314 we had with nothing to add, 18 already from TAT. 2,271 calls.
- Filling in keeps what is there: a real cover stays the cover and TAT pictures follow (up to 8), a stock or missing cover is replaced; a description under 120 characters is replaced by a TAT text at least twice as long; opening hours, price, facilities and contact only where ours is empty or "ไม่ระบุ"; TAT is added to the credit ("OpenStreetMap · Wikipedia · การท่องเที่ยวแห่งประเทศไทย"). Every place as it was before the run is saved in `data/.tat-cache/places-before-*.json` (this computer only).
- Categories: a telling start of the name first (วัด…, พิพิธภัณฑ์…, หาด…, น้ำตก…), then TAT's sub-category mapped name by name, then the name's words. Staff can still change it when approving.
- Pictures still point at `dmc.tatdataapi.io`. Before any of this goes live they must be copied to our storage (TAT's terms); no R2 for dev on this computer.
- Left for the owner: Gemini's earlier Bangkok run overwrote pictures and texts of three published places on dev (ซาฟารีเวิลด์, มิวเซียมสยาม, พิพิธภัณฑ์ศิริราชพิมุขสถาน), with no record of the old values; the credit now names TAT. Its five uncredited drafts got the credit from this run.

Next: staff approval on dev, then a promote step to live (copy pictures to R2, insert the approved places), then restaurants.
