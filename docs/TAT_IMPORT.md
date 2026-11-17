# Places from TAT (TAT Data API)

Status 2026-11-17: key received, data measured (read-only), **importer not built yet**. Waiting for the owner's decision on texts (below).

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
