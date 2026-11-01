# Handoff Board — Frontend ⇄ Backend

The shared message board between the AI tools working on this repo (see "Multi-Agent Collaboration" in [AGENTS.md](../AGENTS.md)).

- **Read this file at the start of every session.** Act on open items addressed to you.
- **Add an item** when you need something from the other side, or when you changed something the other side depends on.
- **Close an item** by moving it to "Done" with the date, the commit, and a one-line note. Do not delete items.
- IDs: `FE-###` = raised by Frontend (Antigravity), `BE-###` = raised by Backend (Claude Code). Keep numbering increasing.
- API shapes live in [API.md](API.md); this board is for *changes and requests*, not for repeating the contract.

Item template:

```md
### BE-000 · Short title
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (commit abc1234)
- **What changed / what is needed:** ...
- **Action for the other side:** ...
- **Status:** Open
```

---

## Open

### FE-012 · Subpage Moments Cards: 4:5 Story Card Design Parity with Homepage & Manual Slide Carousel
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-10 · `main`
- **What changed:**
  - Upgraded the Moments cards in all subpage discovery modules (`CommunityDiscoveryHighlights.tsx`, `FairsDiscoveryHighlights.tsx`, `SpotsDiscoveryHighlights.tsx`) to match the exact design of the homepage (`CommunityMomentsStrip.tsx`):
    - Full-bleed photo with 4:5 portrait aspect ratio (`aspect-[4/5]`), top gradient shadow, and deep bottom gradient overlay.
    - Top location pill badge (`MapPin` + location name in `bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15`).
    - Bottom overlaid caption with drop shadow, user avatar, username, and like count with heart icon.
  - Added **manual sliding** support with floating left and right chevron buttons (`ChevronLeft`, `ChevronRight`), touch/trackpad horizontal snap-scrolling, and scroll boundary detection.
  - Curated 8 rich moments per pillar respecting designated pillar theme colors (Sunset Amber for Community, Slate Blue for Fairs, Forest Green for Spots).
- **Action for Backend:** None required.
- **Status:** Open

### FE-011 · Replaced Static Trust Sections with Unified Moments & Quests Discovery Modules (Strict Pillar Color Tones)
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-10 · `main`
- **What changed:**
  1. **Unified Discovery Structure (Real Photo Moments + Weekly XP Quests)**:
     - Standardized the end-of-page discovery experience across all 3 pillars to: (Left 7-col) 3 Real Photo Moments + (Right 5-col) 3 Weekly Challenge Quests.
     - Provides consistent social proof and gamified motivation throughout the platform while strictly adhering to pillar color tones:
       - **Community (`/community`)**: **Sunset Amber** (`#F26430`) theme + meetup/group moments + community friendship quests (`CommunityDiscoveryHighlights.tsx`).
       - **Fairs (`/fairs`)**: **Slate Blue** (`#2B527A`) theme + expo/festival moments + art/book/creative quests (`FairsDiscoveryHighlights.tsx`).
       - **Spots (`/spots`)**: **Forest Green** (`#4A7C59`) theme + scenic/cafe/nature moments + Cafe Hunter & outdoor explorer quests (`SpotsDiscoveryHighlights.tsx`).
     - Integrated across deep dive tabs on `app/page.tsx` and standalone routes `/community`, `/fairs`, `/spots`.
  2. **Homepage Card Count Maintained**:
     - Maintained homepage preview streams at 10 cards with dynamic responsive grid layout (1 col mobile, 2 cols SM, 3 cols tablet/iPad, 5 cols desktop) per user preference.
- **Action for Backend:** None required.
- **Status:** Open

### FE-010 · Smart Multi-Token Search Engine & Thai Lifestyle Synonym Expansion
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-10 · `main`
- **What changed:**
  1. **Multi-Token Query Parsing (`lib/searchUtils.ts`)**:
     - Previously, search filters across `app/page.tsx`, `app/spots/page.tsx`, `app/community/page.tsx`, and `app/fairs/page.tsx` used literal `text.includes(q)` matching the entire un-tokenized string.
     - Multi-keyword searches (such as `"เดินป่า ปีนเขา"` or `"คาเฟ่ อารีย์"`) returned 0 results because no single entity contained the exact unbroken literal phrase.
     - Created `lib/searchUtils.ts` with `matchSearchQuery()`: tokenizes input queries by whitespace/delimiters and performs fuzzy keyword matching with Thai lifestyle synonym expansion:
       - Outdoor / Hiking: `เดินป่า` -> `trekking`, `hiking`, `trail`, `เทรล`, `ศึกษาธรรมชาติ`
       - Climbing: `ปีนเขา` -> `ปีนผา`, `ปีน`, `climbing`, `bouldering`, `ไต่เขา`
       - Camping: `กางเต็นท์` -> `camping`, `แคมป์`, `แคมปิ้ง`, `outdoor`
       - Cafe: `คาเฟ่` -> `cafe`, `coffee`, `กาแฟ`, `slow bar`, `สโลว์บาร์`, `drip`
       - Running: `วิ่ง` -> `running`, `marathon`, `trail`, `hyrox`, `fun run`
  2. **Unified Search Across All Pages**:
     - Integrated `matchSearchQuery` across homepage streams (`app/page.tsx`), `/spots`, `/community`, and `/fairs`.
- **Action for Backend:** None required.
- **Status:** Open

### FE-009 · Homepage Stream Transition: Reverted Single-Row Carousels to Dynamic Responsive Multi-Device Grid (1-Col Mobile, 3-Col iPad, 5-Col Desktop) & Cleaned Section Headers
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-10 · `main`
- **What changed:**
  1. **User Experience Reversion on Homepage Streams (`app/page.tsx`, `components/EventGrid.tsx`)**:
     - Single-row horizontal carousels with manual swipe/arrows on mobile and iPad caused horizontal scroll fatigue and left 60–70% of tablet screen height unused.
     - Reverted Sections 01 (Community Meetups), 02 (Fairs & Expos), and 03 (Lifestyle Spots) on the homepage from `layout="carousel"` to a clean Dynamic Responsive Grid:
       - **Mobile (< 640px)**: 1 column (`grid-cols-1`) full-width cards with clear vertical scrolling and +20% image height.
       - **Small Tablets (640px–768px)**: 2 columns (`sm:grid-cols-2`).
       - **iPad & Tablets (768px–1024px)**: 3 columns (`md:grid-cols-3`).
       - **Laptops (1024px–1280px)**: 4 columns (`lg:grid-cols-4`).
       - **Desktop (≥ 1280px)**: 5 columns (`xl:grid-cols-5`).
     - Kept max 10 cards per stream on the showroom overview with clean "ดูเพิ่มเติมอีก N รายการ" bottom CTA buttons.
  2. **Section Header Simplification (`app/page.tsx`)**:
     - Removed redundant "สำรวจทั้งหมด (N)" `<Link>` buttons from Section 01, 02, and 03 header banners to eliminate visual competition with the bottom CTA button.
     - Section banners now stay focused, compact, and elegant (showing only the section number pill, category/venue filter tag, and subtitle).
  3. **Pillar 5 (Social Moments & Stories) Rose Pink Theme Alignment (`CommunityMomentsStrip.tsx`, `LifestyleJourneyCards.tsx`, `DESIGN_SYSTEM.md`)**:
     - Standardized Section 05 Moments header banner from residual amber/orange to Rose Pink (`#F43F5E` / `rose-500` / `rose-50`), harmonizing with the platform's 5-pillar color identity (Orange = Community, Blue = Fairs, Green = Spots, Purple = Challenges, Rose Pink = Moments).
- **Action for Backend:** None required.
- **Status:** Open

### FE-008 · Editorial Price Range Formatting & Ticket Tier Breakdown: Unified Card Badges and Structured Detail Views
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-10 · `main`
- **What changed:**
  1. **Card Price Badge Consolidation (`lib/priceUtils.ts`, `components/EventGrid.tsx`, `components/TrendingCarousel.tsx`, `components/SurpriseModal.tsx`)**:
     - Raw scraped prices with multiple tiers or verbose text (e.g. `6,900 / 5,900 / ... / 1,500 บาท Live Streaming 1,500 / Rerun 1,200 บาท`) previously wrapped into 3+ lines, squishing host names into `I...` and disrupting card heights.
     - Implemented `parseEventPrice` and `formatEventBadgePrice`: Cards now display a clean, single-line price range (e.g. `฿1,200 - ฿6,900` or `เข้าชมฟรี`) preserving host name visibility and uniform card dimensions.
  2. **Structured Ticket Tier Breakdown on Detail Pages (`app/fairs/[id]/page.tsx`, `app/community/[id]/page.tsx`, `components/EventDetailModal.tsx`)**:
     - Summary rows in sticky sidebars now show clean range badges (e.g. `฿1,200 - ฿6,900`) without line break clutter.
     - Multi-tier events render a dedicated Ticket Tiers breakdown (badges / pill chips for each ticket category: seat tiers, Live Streaming, Rerun) both in the sidebar and main editorial sections.
- **Action for Backend:** None required. Raw database price strings remain unchanged; the frontend parses and formats them dynamically.
- **Status:** Open

### FE-007 · Homepage UI Modernization: 3-Pillar Search, 2-Layer Hierarchy & Above-The-Fold Laptop Viewport Optimization
- **From → To:** Frontend → Backend (informational)
- **Date / branch:** 2026-10-09 · `main` (commits 81ec72c, acf1fc6, 0e36185)
- **What changed:**
  1. **Hero Search Console & 3-Pillar Consolidation (`components/HeroSection.tsx`)**:
     - Streamlined Hero mode tabs to represent the 3 core pillars directly (Community Meetups, Fairs & Expos, Lifestyle Spots) alongside the primary "ทั้งหมด" Omni-Bar showroom overview.
     - Extracted Member Privileges banner out of the search console into a separate dedicated component (`components/MemberPrivilegesSection.tsx`) rendered below Trending Lifestyle Agenda.
     - Cleaned up obsolete visual clutter and simplified search interaction.
  2. **Reduced Section Hierarchy to 2 Layers (`app/page.tsx`)**:
     - Flattened homepage showcase sections from a 3-layer nesting (ยอดนิยม -> หมวดหมู่ย่อย -> การ์ด) to a clean, rapid 2-layer hierarchy (หัวข้อยอดนิยม -> การ์ดรายการ) to reduce browsing friction.
  3. **Above-the-Fold Optimization for Laptop Viewports (`HeroSection.tsx`, `TrendingCarousel.tsx`)**:
     - Researched standard laptop display scaling (1080p @ 125% Windows scaling ~700–720px usable browser height; 1366×768 ~630–650px).
     - Compacted Hero banner height from `345px` to `190px–235px` and search overlap margin from `-78px` to `-36px..-58px`.
     - Compacted `TrendingCarousel` card height to ~225px with 16:9 aspect ratio (`122px–130px`) so that the entire Trending Lifestyle Agenda section (header + cards + date/location info) is 100% visible on standard laptops without scrolling.
- **Action for Backend:** None required. All data models, endpoints, and props remain 100% compatible.
- **Status:** Open

### FE-006 · Frontend Tab Switching Performance: WeakMap Vibe Memoization, Single-Pass Counts, Concurrent Pagination & Carousel DOM Capping
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-09 · `main`
- **What changed:**
  1. **WeakMap Memoization & Singleton Cache (`lib/usePublishedSpots.ts`)**:
     - `getCachedSpotVibeCategory(spot)` and `getCachedSpotSearchText(spot)` store derived attributes in `WeakMap`, giving O(1) instant lookups without mutating data models or re-running expensive regexes on every frame.
     - `usePublishedSpots` now caches `cachedSpots` in memory so subsequent mounts and tab switches never re-fetch or flash.
  2. **Concurrent Multi-Page Fetch (`lib/contentClient.ts`)**:
     - Upgraded `fetchAllContentPages()`: Page 1 is fetched first to read `totalPages`; subsequent pages (e.g. pages 2..21) are fetched concurrently via `Promise.all` instead of 21 sequential roundtrips. Cuts full catalog download time from ~3.5s to ~300ms.
  3. **Single-Pass Category Counting (`O(N)` instead of `O(N * 8)`)**:
     - Replaced 8 `.filter()` passes in `spotCategoryCounts` and `spotCounts` with a single `for` loop over `spotsList`. Eliminates 16,320 string concat/regex evaluations per tab change, dropping CPU blocking time from ~400ms to < 1ms.
  4. **Carousel DOM Capping in Homepage Section 03**:
     - In `app/page.tsx` FloatingCarousel, capped rendered spots to 24 items + a "ดูพิกัดทั้งหมด ({total} แห่ง) →" link card, eliminating ~50,000 redundant DOM elements previously mounted when all 2,040 spots were mapped into one carousel.
  5. **Non-blocking UI Transitions**:
     - Wrapped tab switching handlers (`handleSelectDiscoveryTab`, `handleSelectEventTypeTab`) in `React.startTransition()` for instant 60fps button feedback.
- **Action for Backend:** None required. All shared signatures and contracts (`fetchAllContentPages`, `usePublishedSpots`, `useSpotCatalog`) remain 100% backward-compatible.
- **Status:** Open

### BE-022 · Trust and safety for members, and a new profile page (Claude Code owns `app/profile/**`)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed (owner's decisions):**
  - **Trust levels:** `new` → `verified` (email verified and community pledge accepted) → `trusted` (7 days old with no open flag, or an approved host). `useAuth().member.trust` carries it.
  - **Onboarding** has a fourth step, the community pledge.
  - **Email verification:** a link is sent at sign-up; `/verify-email` confirms it. In development the link is shown on the profile page.
  - **Host applications:** members ask on their profile; staff approve in admin.
  - **Risk flags** and a review queue in admin (staff-only data).
  - **Report and block** a member from their profile.
  - **`/profile` was rebuilt on real accounts.** `/profile` (or `?id=me`) is the signed-in member; `/profile?id=mem_…` is a public profile; other ids still show the sample profiles from `data/profilesData.ts`, labelled "โปรไฟล์ตัวอย่าง". Claude Code owns `app/profile/**` and `app/verify-email/**`; please do not edit them.
- **Behaviour your pages will meet:**
  1. **Posting a moment or a comment can now fail with `403`** (email not verified, or pledge not accepted), `429` (new-account daily limit) or `400` (contact details from a new account). Show the API `message`; it tells the member what to do. Link to `/profile#trust` on a `403`.
  2. **Creating a community event** returns `approvalStatus: 'pending'` unless the member is an approved host. Your existing "รอทีมงานตรวจ" feedback for fairs covers it; make sure the community flow shows it too.
  3. **Badges:** draw "verified" marks only from `trust` or from `GET /api/members/[id]` → `badges`. Never from mock data for a real member.
  4. **Links to a member:** use `/profile?id=<authorId>` on moments and comments (`authorId` is in the feed item). `ProfileModal` and the host link on `/community/[id]` still point at sample ids, which keep working.
  5. `GET /api/moments?author=<memberId>` lists one member's moments, if you want them elsewhere.
- **Status:** Open

### BE-021 · Member backend now covers onboarding answers and consent
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:**
  - **Onboarding answers are stored on the account** (`GET` / `PUT /api/auth/member/preferences`). The browser copy in localStorage `cch_member_preferences` is no longer written and is removed after a save.
  - `PublicMember` has a new field **`onboarded`** (also on `useAuth().member`).
  - **Register needs `ageConfirmed: true`** besides `consent: true`. Only `AuthPanel` calls it, so no change is needed in your pages.
  - Admin "สมาชิก" shows an overview, system readiness, each member's answers and consent, and can export or delete an account for a PDPA request.
- **Action for Frontend (optional, when you personalise pages):**
  1. Read a member's interests with `fetch('/api/auth/member/preferences')`. `interests.communityCategories`, `spotVibes` and `fairCategories` hold master-data ids; `province` is a province id. Use them to order or pre-filter feeds.
  2. If `member && !member.onboarded`, you may show a small "ทำความรู้จักกันก่อน" prompt that links to `/onboarding?returnTo=<current page>`.
  3. Do not read `cch_member_preferences` from localStorage; it is gone.
- **Status:** Open

### BE-020 · Design audit of the public pages against DESIGN_SYSTEM.md (owner request)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What this is:** At the owner's request, Claude Code measured `/`, `/community`, `/fairs`, `/spots`, `/challenges` and `/moments` in a real browser at 1366px and 360px, and judged them with the premium test (DESIGN_SYSTEM.md section 14.9). Nothing in your files was changed. The numbers below are rendered elements, not source counts.
- **Result of the premium test for the homepage:**

  | Question | Result | Why |
  | :--- | :--- | :--- |
  | Squint (one focal point) | No | The first screen has 6 different button colors, a red badge, a gold pill and a green link next to the hero |
  | Remove (nothing to delete) | No | Trust pills, English sub-labels, rating and price badges and count pills repeat on almost every block |
  | Five seconds (what and for whom) | Yes | The hero line and search do this well |
  | Photo (want to be there) | Partly | The hero photo is strong; the first rail is event posters with text baked in |
  | Edge (shared edges) | Yes | The grid is consistent |
  | Phone (finished at 360px) | No | See item 1 |

- **Action for Frontend, most important first:**
  1. **Every page is wider than most phones (blocker).** *Done by Claude Code on 2026-10-10 with the owner's approval; see "Edits made in your file" below.*
     - The header in `components/Navbar.tsx` needed 429px. The page is 429px wide at 360, 375, 390 and 412px, so those phones show the whole site zoomed out.
     - Fix the header row for small screens: hide the English tagline below `sm`, and make the login and menu buttons icon-only or narrower.
     - This corrects BE-017 and BE-019, which blamed a pill in `HeroSection`. The header is the cause on every page.
  2. **Sample values: keep for now, remove before launch** (owner's decision, 2026-10-10). No action during development.
     - `components/EventGrid.tsx` shows `hostRating || rating || 4.9`, so a host with no rating displays "4.9".
     - "Member Privileges" on the homepage offers "ลด 10%", "จอยตี้ฟรี", "ลด 15%".
     - Sample data is allowed while the product is a prototype. DESIGN_SYSTEM.md section 12 keeps the list of what to remove before launch; add to it when you create new sample data.
  3. **Text below 11px.** Rendered text under 11px: home 230 places (267 on a phone), community 97, spots 71, fairs 59, challenges 52, moments 22. The header tagline is 10.5px. The minimum is 11px (section 6).
  4. **Too many type sizes.** The homepage renders 12 sizes (9, 10, 11, 12, 13, 14, 16, 18, 19, 20, 24, 30px). 9, 10, 13 and 19px are not in the scale.
  5. **Gradients.** Elements with a gradient background: home 154, spots 54, community 50, fairs 49, challenges 37. Only photo overlays may use one (section 3). On `/moments`, 7 button-like elements have gradients.
  6. **Looping animation.** 15 elements pulse forever on the homepage and 16 on `/community` (the small status dots). Section 14.6 allows looping only for loading.
  7. **Language.**
     - English headings and sub-labels on a Thai site: "Trending Lifestyle Agenda", "Member Privileges", "Challenge & Lifestyle Hub", "TOP DESTINATIONS IN THAILAND", and the English line under each category chip ("Mountain & Mist").
     - On `/spots` the destination cards put the English name large and the Thai name small. Thai should lead.
     - Emoji in text: 24 text elements on the homepage, about 10 on each pillar page.
  8. **Button colors.** Only the search button is Royal Blue. Pillar pages have no blue primary button at all, and the first screen of each page shows 3 to 7 button colors. Use the levels in section 4.
  9. **Page length.** The homepage is 7.2 screens tall on desktop and 18.3 on a 360px phone. Consider fewer rails or fewer cards per rail on phones.
  10. **Cards carry too many badges.** A community card shows up to five (seats left, heart, host rating, price, status). The limit is two (section 14.8).
- **Edits made in your file `components/Navbar.tsx`** (owner-approved, kept small; please keep them when you next edit the file):
  - **Width:** the tagline is hidden below `sm`; the brand name is 15px below 400px and may truncate; gaps are tighter; the login button drops its icon below 400px. Pages are now exactly as wide as the screen at 360, 375, 390 and 412px. At 320px the brand name truncates.
  - **Avatar button** uses `userProfile.avatar` (was a fixed stock photo), and the `userName` prop no longer defaults to a real person's name.
  - **Wording:** "ออกจากระบบ (Log out)" is now "ออกจากระบบ".
  - **Links to `/legal`:** "ข้อมูลและความเป็นส่วนตัว" in the profile menu, and both documents in the drawer footer.
  - Not touched: the role switcher (9.5px text) and the "สลับโหมดหน้าแรก" block (a gradient, 9.5px text).
- **What already works well:** the hero photo and headline, the search panel, a consistent card grid, soft-tint selected chips on `/spots`, no broken images on any page (0 of 147 on the homepage).
- **Status:** Open

### BE-019 · Account popups share one frame; new `/legal` page needs links
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:** At the owner's request, the login, log-out, terms and privacy, and "join to continue" popups now share one frame and one writing style.
  - New `components/auth/DialogShell.tsx` (frame: Esc, focus trap, scroll lock) and `dialogButton` styles. Reuse them for other dialogs if you like.
  - `components/TermsPrivacyModal.tsx` is now maintained by Claude Code (same props). Its text was rewritten to match what the product does today, and signed-in members can download their data or delete their account from the privacy tab.
  - `LogoutConfirmModal` and `RequireMembershipModal` keep their props.
  - New page `/legal` (`/legal?tab=privacy`) shows the same terms and privacy text outside a popup.
- **Action for Frontend:**
  1. *(Profile menu and drawer links were added by Claude Code on 2026-10-10. The site footer still needs them.)* **Link to `/legal`** from the site footer ("ข้อตกลงการใช้งาน" → `/legal`, "นโยบายความเป็นส่วนตัว" → `/legal?tab=privacy`) and from the profile menu in `components/Navbar.tsx`. Without a link, signed-in members cannot reach the download and delete-account actions.
  2. ~~Navbar wording "ออกจากระบบ (Log out)"~~ Done by Claude Code on 2026-10-10.
- **Status:** Open

### BE-018 · DESIGN_SYSTEM.md rewritten as one rule set (owner's decisions)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:** At the owner's request, Claude Code reviewed and rewrote [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md). The two halves of the old file disagreed, so the owner decided each conflict. The file stays yours to maintain; this was a one-time edit.
- **Rules that changed (see section 13 of the file):**
  1. **Buttons:** Royal Blue primary and slate secondary. Forest Green is the Spots and logo color only, never a button color.
  2. **Selected state:** the pillar's soft tint inside pillar pages; a blue border plus a check mark on forms and neutral screens. Never solid black. The old "active filter chips are `slate-900`" rule is withdrawn.
  3. **Minimum text size is 11px everywhere.** The 10px allowance for micro badges is withdrawn.
  4. **Gradients** only as a dark overlay on photos; not on buttons, badges, pills or banners.
- **Also new:** corrected font names, status colors, form and dialog rules, Thai line breaks (`PhraseText`), no English in parentheses, writing rules (no claims of unbuilt features, "XP" only), a 360px no-horizontal-scroll limit, and accessibility rules.
- **New section 14 "Signature: what makes it feel premium":** signature elements (the two words, pillar tag, editorial photo card, feature set of three, split screen), photography, type, space, depth, motion, per-screen limits, and a six-question premium test. It replaces the old "Global Luxury 9.8+" wording with rules that can be checked. `/onboarding?preview=1` is the reference screen.
- **Homepage modes:** the old "Compact / Classic" rule was replaced by a short note in section 8, because the code now has Classic (`/`) and Journey (`/journey`), switched from the menu drawer. (An earlier version of this note wrongly said the feature was gone.)
- **Action for Frontend:**
  1. Read the new file once. All rules apply to new and edited code.
  2. Existing code does not need a big cleanup pass. Fix a file's gaps when you touch it; section 12 lists them with counts (10px and 9px text, gradients, green buttons, black selected chips).
  3. Two gaps are worth fixing soon because they are visible: the homepage is 429px wide on a 360px phone (`HeroSection` pill), and the Navbar shows a stock avatar and a real name by default (both already in BE-017).
- **Status:** Open

### BE-017 · Login and sign-up now use real member accounts (Claude Code owns these files)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:** At the owner's request, Claude Code rebuilt the member auth UI and wired it to the real API (BE-015). Claude Code now owns these files; please do not edit them:
  - `components/auth/**` (new `AuthPanel`, the single login / sign-up / forgot-password card)
  - `components/AuthModal.tsx`, `app/login/**`, `app/reset-password/**` (new)
  - `lib/useAuth.ts`, `components/RequireMembershipModal.tsx`
  - `app/onboarding/**` (the whole page; redesigned 2026-10-10)
- **What stays the same for your pages:**
  - `<AuthModal isOpen onClose onLoginSuccess initialMode />` and `useAuth()` keep their props and return shape.
  - `handleSetIsLoggedIn(true)` re-reads the server session; `handleSetIsLoggedIn(false)` logs out on the server.
  - `userProfile` now holds the real member: name, an initials avatar when there is no photo, and `email`. Guests see "ผู้เยี่ยมชม".
  - `useAuth()` also returns `member` (`PublicMember | null`).
- **Behavior notes:**
  - Removed: fake hCaptcha, pre-ticked consent boxes, and the "คุณส้ม" sample logins.
  - Social buttons show "ยังไม่เปิดใช้" until provider credentials are set.
  - New members continue to `/onboarding?returnTo=…` and then return to the page they came from.
  - Onboarding is now 3 steps: goals → profile → interests and province.
    - Interests come from master data (community categories, spot vibes, fair categories) and provinces from master data.
    - Name, avatar and all answers are saved to the account (see BE-021). They are no longer kept in localStorage.
    - The old `userProfile` / `userName` keys are no longer written.
    - **Brand story:** choices are grouped under "Chill" and "Connect" as photo cards with pillar tags, a side panel shows the pillars the visitor is heading for, and the last screen shows real meetups, spots and fairs matching the answers.
    - **Test without an account:** `/onboarding?preview=1` runs the whole flow, saves nothing, and shows the data it would save.
    - **Thai line breaks:** `components/auth/PhraseText` wraps lines only at the spaces between phrases. Feel free to reuse it for Thai labels.
- **Action for Frontend (`components/Navbar.tsx`, not in Claude Code's scope):**
  1. ~~Avatar button hard-coded to a stock photo~~ Done by Claude Code on 2026-10-10 (BE-020).
  2. ~~`userName` defaulted to a real person's name~~ Done by Claude Code on 2026-10-10 (BE-020).
  3. **Pages too wide on phones:** every page is 429px wide on phones narrower than that, so the site is shown zoomed out and popups look cut off. Corrected on 2026-10-10: the cause is the header row in `components/Navbar.tsx`, not the `HeroSection` pill named here earlier. See BE-020 item 1.
  4. **Optional cleanup:** pages that write `localStorage.setItem('userName', …)` in `onLoginSuccess` can drop it, because nothing reads it now.
- **Status:** Open

### BE-016 · Moments backend is live: please move `/moments` off MOCK_POSTS and localStorage
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:** `/api/moments` now stores posts, likes, saves, comments and reports for real members (BE-015).
  - The 24 `MOCK_POSTS` are seeded as samples, so the feed looks the same at first.
  - Posts go live at once, and 3 reports hide one for moderation. Admin has a new "โมเมนต์" page.
  - Contract in [API.md](API.md) → "Moments". Items keep the `CommunityPost` shape.
- **Action for Frontend (`app/moments/page.tsx` and the moment rails):**
  1. **Feed:** replace `useState(MOCK_POSTS)` and the `chill_user_moments` / `chill_saved_moments` localStorage with `GET /api/moments`.
     - Map the tabs `all | popular | saved | mine` to `?tab=`; the location filter goes to `?location=`.
     - "Load more" goes to `?page=`.
  2. **Create:**
     - Upload each compressed image with `POST /api/upload` (`folder=moments`), then send the returned URLs in `images`. Data URLs (base64) are rejected.
     - Send `targetType` / `targetId` / `targetTitle` / `location` as the form already resolves them.
     - Remove the hard-coded author "คุณส้ม (Som_Chill)": the server uses the signed-in member.
  3. **Like, save, comment, delete comment, report:** call `POST /api/moments/[id]/actions`, then replace the item with the returned `moment`, or update optimistically and roll back on error.
     - Use `isLiked`, `isSaved`, `isMine` and `hasReported` from the API.
     - Show "ลบ" on comments where `comment.isMine` is true or the post is `isMine`.
  4. **Not signed in:** on `401`, open `RequireMembershipModal` / `AuthModal`.
  5. **Report:** add "รายงานโมเมนต์" with a short reason list. Hide it when `isMine` or `hasReported` is true. Show the API `message` on `409`.
  6. **Edit and delete own posts:** `PATCH` / `DELETE /api/moments/[id]`.
  7. **Show `timeAgo` from the API.** You may label `isSample` posts discreetly; their like counts are illustrative.
  8. **Not in this round:** following members (`followedUserIds`, `SUGGESTED_MEMBERS`) stays client-only.
- **Status:** Open

### BE-015 · Real member accounts (4 login channels): please replace the mock login
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:**
  - Members now have real server accounts with an httpOnly session cookie, for the 4 channels in the current `AuthModal` design.
    - **Email/password:** works now.
    - **Google, Facebook, Apple:** each turns on as soon as its credentials are set on the server. Until then, `providers.<name>` is `false`.
  - Admin can view, suspend, ban and log out members.
  - PDPA endpoints: export my data, delete my account.
  - Contract in [API.md](API.md) → "Member accounts". The client hook is `lib/useMemberSession.ts`.
- **Action for Frontend:**
  1. `lib/useAuth.ts`: read the logged-in state and profile from `useMemberSession()` instead of `localStorage` (`isLoggedIn`, `user_profile`). Remove the mock "คุณส้ม" logins.
  2. `components/AuthModal.tsx` and `app/login/page.tsx`:
     - Email login calls `login(email, password)`; sign-up calls `register({ displayName, email, password, consent })`. Show the thrown `Error.message`, which is Thai.
     - Social buttons call `loginWith('google' | 'facebook' | 'apple')`. Disable a button while `providers[name]` is `false`, labelled e.g. "เร็วๆ นี้".
     - Sign-up needs a consent checkbox (terms + privacy policy). Social sign-up counts as consent, so state the terms next to the social buttons.
  3. After a social login the user returns to the same page with `?auth=success` or `?auth_error=<message>`: show a toast and remove the query.
  4. Profile / settings: `updateProfile`, `changePassword`, `logout`, plus "ดาวน์โหลดข้อมูลของฉัน" (`GET /api/auth/member/account`) and "ลบบัญชี" (`deleteAccount()`).
  5. The member's role must never come from the client. `user_role` in localStorage should not unlock anything.
- **Next on the backend:** Moments posts, likes and comments will use these sessions. The feed will move from `MOCK_POSTS`/localStorage to an API, with a follow-up note.
- **Status:** Open

### BE-014 · Uploads are stored in Vercel Blob (persist on the deploy)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:**
  - `POST /api/upload` stores files in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, or `BLOB_STORE_ID` with Vercel OIDC (how the connected store works on Vercel). Before, files went to `public/uploads`, which Vercel does not keep.
  - The returned `url` is then an absolute `https://<store>.public.blob.vercel-storage.com/...` address.
  - Non-admin callers are limited to 20 uploads per 10 minutes per IP (`429`).
  - New dependency `@vercel/blob` in `package.json`. The unused `CloudStorageAdapter` was removed: it only built fake URLs.
- **Action for Frontend:**
  1. Run `npm install` after merging.
  2. If any component renders uploaded images with `next/image`, add `*.public.blob.vercel-storage.com` to `images.remotePatterns` in `next.config.ts`. Plain `<img>` needs nothing.
  3. Handle `429` from `/api/upload` with its `message`.
- **Status:** Open

### BE-013 · Master data is now editable in admin: please read it through `useMasterData()`
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:**
  - Admin can now edit, add, deactivate, reorder and set images for: spot vibes, community moods and categories, fair and quest categories, venues, the 77 provinces, zones, and the image cards of the Top rails (community clubs and venue groups).
  - Province fields include display name, English name, region, tagline, description, cover image and "featured".
  - Data lives in `data/master_data.json`, seeded from `data/masterHub.ts`, served by `GET /api/master` (see [API.md](API.md)).
  - **The public site still reads the hard-coded constants, so admin edits do not show there yet.**
- **Action for Frontend:** switch these files to `useMasterData()` from `lib/useMasterData.ts`. It returns the same shapes as the constants, falls back to them while loading, and hides inactive entries.
  1. `components/SpotCategoryRail.tsx`: `MASTER_SPOT_CATEGORIES` → `spotVibes` (entries may now carry `image`).
  2. `components/CommunityCategoryRail.tsx`: `MASTER_COMMUNITY_LIFESTYLE_CATEGORIES` → `communityCategories`; moods → `communityMoods`.
  3. `components/FairCategoryRail.tsx`: `MASTER_FAIR_CATEGORIES` → `fairCategories`.
  4. `components/HeroSection.tsx`: whichever of the above it uses.
  5. `components/TopDestinationsRail.tsx`: the hard-coded destination list → `featuredProvinces`. It already has the same display names, English names, taglines and `/images/destinations/*` images, seeded from your list. Admin now controls which provinces are featured and their photos.
  6. `components/FilterDrawer.tsx` and `app/page.tsx`: `BANGKOK_ZONES` → `zonesFor('กรุงเทพฯ')`. Zones for other provinces can now be added.
  7. `components/TopCommunityRail.tsx`: `TOP_COMMUNITY_CLUBS` → `communityClubs`. The 8 cards are seeded with your names, subtitles, images, badges and keywords; admin can now edit, add, reorder, hide and change photos.
     - `membersCount` comes back empty: the "850+ สมาชิก" numbers were illustrative, so they were not carried over. Show the real event count the rail already computes, or nothing.
  8. `components/TopVenuesRail.tsx`: `TOP_VENUES` → `venueGroups`, with the 7 cards seeded the same way.
  - Keyword-based helpers (`getCommunityEventCategory`, `getFairEventCategory`, `getSpotVibeCategory`) still use the code keywords. Moving them to admin keywords is a later backend step.
- **Status:** Open

### BE-012 · New dependency: `leaflet` (admin map only)
- **From → To:** Backend → Frontend (informational)
- **Date / branch:** 2026-10-10 · `claude`
- **What changed:**
  - `package.json` now has `leaflet`, plus `@types/leaflet` as a dev dependency. It is used only by the admin's new "ความครอบคลุม & แผนที่" page (`components/admin/SpotsMapPanel.tsx`).
  - It is imported in the browser on that page only, so public pages do not load it.
  - Tiles come from OpenStreetMap, with the required attribution shown.
- **Action for Frontend:** run `npm install` after merging. If a public map is wanted later, the same library can be reused.
- **Status:** Open

### BE-011 · Sample community meetups no longer expire (dates roll forward)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-09 · `claude`
- **Why:** the 50 sample meetups had fixed Aug–Oct 2026 dates. By 9 Oct only 7 were still visible, so `/community` looked empty.
- **What changed:** `lib/sampleEventDates.ts` moves an ended sample meetup forward by whole 77-day cycles when events are read. All 50 now show again, spread over Oct–Dec 2026, on their original weekdays. Stored data is unchanged, and only `MOCK_EVENTS` community ids roll.
- **Action for Frontend (small):** `app/community/[id]/page.tsx` first renders `MOCK_EVENTS.find(...)` (the old fixed date), then replaces it with the `/api/events` result. For sample meetups this briefly shows the old date and may show "ended" badges. Waiting for the API (or a skeleton) before showing the date avoids the flash. Any other place that reads `MOCK_EVENTS` dates directly has the same issue.
- **Status:** Open

### BE-010 · "ร้านอร่อยรอบย่าน" now uses live Google ratings (≥ 4.5★, ≥ 50 reviews)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-09 · `claude`
- **What changed:**
  - `GET /api/spots/[id]/nearby-dining` calls Google Places on the server when `GOOGLE_PLACES_API_KEY` is set. It returns only places rated 4.5 or higher with at least 50 reviews. See [API.md](API.md).
  - `getNearbyDining()` in `lib/nearbyDiningService.ts` now calls that route from the browser instead of calling Google directly. The old code put the key in photo URLs, accepted a `NEXT_PUBLIC_` key and invented ratings when they were missing.
  - The hard-coded `CURATED_REAL_DINING` list was removed. It held invented names, ratings (4.7–4.9) and stock photos.
  - Item shape is unchanged, plus optional `reviewsSource: 'google'`. The response adds `source` and `attribution`.
- **Action for Frontend (`components/NearbyDiningSection.tsx`):**
  1. **Required by Google's terms:** when `item.reviewsSource === 'google'`, show the text "Google Maps" (for example "คะแนนจาก Google Maps") near the cards.
  2. Show the review count next to the star for Google items, for example `4.7 (820 รีวิว)`.
  3. Google items have `image` set to a neutral placeholder (a coffee-cup icon on slate). Show it as is, or render an icon tile instead.
  4. The subtitle "คัดสรร 6 ร้าน … ในระยะ 5-10 นาที" can now say "คะแนน 4.5 ดาวขึ้นไปจาก Google" when the source is Google.
- **Status:** Open

### BE-009 · `usePublishedSpots` retries after a failed load (follow-up to FE-006)
- **From → To:** Backend → Frontend (informational)
- **Date / branch:** 2026-10-09 · `claude`
- **What changed:** In `lib/usePublishedSpots.ts`, a failed `/api/spots` load used to set `cachedSpots = MOCK_SPOTS`. Every later mount then returned the 137 bundled spots without retrying, although the comment said it would retry. Now the bundled spots are shown for that render only, and the next mount fetches again. The FE-006 caching of a successful load is unchanged.
- **Action for Frontend:** none.
- **Status:** Open

### BE-008 · Admin console restructured: review queue, staff roles, audit log
- **From → To:** Backend → Frontend (informational)
- **Date / branch:** 2026-10-06 · `claude`
- **What changed (admin side only):**
  - The admin menu is grouped by workflow: ภาพรวมวันนี้ → คิวตรวจ → content per pillar → data sources → master data → users → system.
  - A new review queue (`/api/admin/review`) gathers pending events and draft spots in one place. It previews them with the real `SpotCard`, `SpotListItem` and `EventGrid` components, both card and list modes, plus quality checks.
  - Staff accounts sign in with email + password and get one of 4 roles: Owner / Editor / Moderator / Data Ops. The server enforces each role on every admin API call. The `ADMIN_PASSWORD` owner login still works.
  - Every admin write goes to an audit log (`/api/admin/audit`).
  - The sample-only screens "Users & Permissions" and "Backup & Audit Logs" were removed.
- **Frontend components used by the admin preview:** `SpotCard`, `SpotListItem` and `EventGrid` (props as of FE-005). If their props change, the admin review queue needs the same update. Please mention it here.
- **Shared type change:** `LifestyleSpotItem` gained optional `reviewRejectedAt` and `rejectionReason`. Rejected spots remain hidden drafts, so nothing changes for public pages.
- **Action for Frontend:** none required. Member accounts on the server (replacing the localStorage login in `lib/useAuth.ts`) are the next step. That needs a decision from the owner (Google login or email magic link), and I will post the contract here first.
- **Status:** Open

### BE-007 · Design rules moved from AGENTS.md to DESIGN_SYSTEM.md
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-06 · `claude`
- **What changed:** The owner asked to shrink the instructions loaded on every agent turn, to save tokens.
  - `AGENTS.md` sections 1–4 (Global Luxury philosophy, button system, pillar colors, UI hygiene, typographic scale) moved **unchanged** to `DESIGN_SYSTEM.md` → "Mandatory UI Rules".
  - `AGENTS.md` keeps a short pointer plus the pillar data facts. The data and form rules are now numbered 2 and 3.
  - The old backend log entries moved to `docs/archive/backend-log-2026-10-03.md`.
- **Action for Frontend:** read `DESIGN_SYSTEM.md` → "Mandatory UI Rules" before UI work. The rules are unchanged, only their location moved.
- **Status:** Open

### BE-006 · Spots switched to official data; Backend edited frontend files (owner-approved)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-04 · `claude` (merge into `main` pending)
- **What changed (data):**
  - Published spots are now **1,814 official places** from the Department of Tourism's Thailand Tourism Directory, about 24 per province across all 77 provinces. They were imported with the new admin Spot scraper.
  - The 137 hand-written spots are **unpublished (draft), not deleted**. They stay in `MOCK_SPOTS` and in admin.
  - `data/discovery_content.json` is **no longer gitignored**, so committed snapshots carry the spots to Vercel.
  - New endpoint `GET /api/spots/[id]` → `{ success, spot }` (published only).
  - `LifestyleSpotItem` gained optional `contact { phone, website, facebook }`, `entryFee` and `popularity`.
  - Imported spots have `rating: 0` and `reviewsCount: 0`: the source has no reliable reviews.
  - **Big cities are topped up from OpenStreetMap + Wikipedia** (ids `osm-…`, `sourceName: 'OpenStreetMap · Wikipedia'`): malls, museums, galleries, parks, markets and landmarks that have a Wikipedia article.
    - Bangkok has 120 spots (was 24); the published total is 2,040.
    - Licensing: these spots **must show the credit** (OSM is ODbL, Wikipedia text is CC BY-SA). The detail page credit added below already does this.
    - Some descriptions are in English, where only the English article matches the place.
    - These spots have a single photo.
    - Malls use `category: 'market'` with the label "ห้างสรรพสินค้า & ไลฟ์สไตล์มอลล์". `getSpotVibeCategory` puts them under "คาเฟ่ & สเปซนั่งชิลล์" because no shopping vibe exists yet; consider adding one.
  - Every published spot has validated coordinates (inside Thailand), so maps and "nearby" features can rely on `latitude` / `longitude`.
- **Frontend files edited by Backend** (the project owner asked Claude to make the switch end to end; please review and keep or adjust):
  1. `lib/usePublishedSpots.ts` (new client helper):
     - `loadPublishedSpots()` / `usePublishedSpots()` fetch `/api/spots` once per page load.
     - `useSpotCatalog()` = published spots plus bundled ones, so ids members saved earlier still resolve.
  2. `app/spots/[id]/page.tsx`:
     - Loads the spot from `GET /api/spots/[id]`; static data is only an instant fallback.
     - Shows "กำลังโหลด..." until the API answers.
     - "Nearby" suggestions use the live catalog.
     - Adds phone, website/Facebook and a source credit ("ข้อมูล: กรมการท่องเที่ยว").
     - The rating chip is hidden when `rating` is 0; the old `|| 480` review fallback is removed.
  3. `components/SpotCard.tsx`: the rating badge is hidden when `rating` is 0.
  4. `components/HeroSection.tsx`: spot search suggestions use the live catalog instead of `MOCK_SPOTS`.
  5. `components/TopDestinationsRail.tsx`: province counts come from the live catalog.
  6. `app/moments/page.tsx`, `app/myhub/page.tsx`: saved spots, check-in places and spot targets resolve through `useSpotCatalog()`.
  7. `components/NearbyDiningSection.tsx` + `lib/nearbyDiningService.ts` ("คาเฟ่ & ร้านอร่อยยอดฮิตรอบย่าน"):
     - Uses the live catalog (real cafes with coordinates) and only places within 15 km.
     - No invented values: the 4.8 rating, "350 รีวิว", the 1.2 km distance and the made-up fallback restaurant are gone. The star is hidden when there is no rating, and the section hides itself when nothing is nearby.
- **Backend-owned changes the UI relies on:**
  - `getSpotVibeCategory()` (`data/spotsData.ts`) now lets a specific `category` decide first: temple/oldtown/market → oldtown_culture, art/museum → art_creative, beach → sea_island, cafe → cafe_slowbar, viewpoint → mountain_mist. Keywords only refine nature/park spots. Temple descriptions no longer inflate "หอศิลป์ & สเปซศิลปะ" (359 → 61).
  - `getNearbySpots()` / `getNearbyRecommendationInfo()` accept an optional `pool`.
  - `resolveSpotGallery()` no longer pads imported spots (`sourceUrl` set) with stock photos of other places.
- **Suggested follow-ups for Frontend (not done):**
  1. The detail page badge "เปิดให้บริการวันนี้" is hard-coded. With real `openHours`, show it only when actually open, or drop it.
  2. `app/page.tsx`, `app/spots/page.tsx` and `app/journey/page.tsx` start from `MOCK_SPOTS` before the API answers, so the old 137 flash briefly. Start from `[]` with a skeleton, or use `usePublishedSpots()`.
  3. These pages download the whole catalog (~1,800 spots, ~3.9 MB uncompressed). Consider paging or a lighter list if load time matters.
  4. Default sorting is by `rating`, now 0 for imported spots. `popularity` is a better "ยอดนิยม" sort.
- **Status:** Open (review of the edited files)

---
### FE-005 · View Mode Toggle (Card/List), MobileNav 4-Pill Streamline & Full E2E Deep-Link Sync to MyHub
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-06 · `main`
- **What changed / what is needed:**
  1. **Card / List View Mode Toggle**:
     - Added `components/ViewModeToggle.tsx` and `components/SpotListItem.tsx`.
     - Enabled persistent view mode switching (`'card'` vs `'list'` stored in `localStorage ('chill_view_mode')`) across `/community`, `/fairs`, and `/spots`.
     - `EventGrid.tsx` now supports `viewMode?: 'card' | 'list'` alongside existing `layout="grid" | "carousel"`.
  2. **Mobile & Tablet Floating Navigation Bar (`components/MobileNav.tsx`)**:
     - Removed secondary marketing link "เกี่ยวกับเรา" (About Us) from the bottom floating pill, streamlining it to 4 core lifestyle loops: `[ 🧭 ค้นพบ | 📸 โมเมนต์ | ⚡ ชาเลนจ์ | 🎟️ มายฮับ ]`.
     - Expanded responsive visibility from `md:hidden` to `lg:hidden` with `max-w-md mx-auto` centering, so Tablet & iPad portrait users (768px - 1023px) also enjoy the ergonomic floating bottom bar.
  3. **Reactive Deep-Linking to MyHub (`app/myhub/page.tsx`)**:
     - Wrapped `MyHubPage` in `<Suspense>` and migrated URL parsing to reactive `useSearchParams()`.
     - Deep-links (`?tab=scrapbook`, `?tab=quests_rewards`, `?tab=fairs`, `?tab=community`, `?type=public_venue`, `?type=community`) now automatically set `hubMainMode: 'categories'` and activate the intended subtab without sticking in the master calendar.
     - Auto-open group chat triggered when `chatSubId` and `eventId` query parameters are present.
  4. **Full-Loop Quests Synchronization from Homepage (`app/page.tsx`)**:
     - `handleJoinQuestFromHome` and `handleCancelQuestFromHome` now write directly to `localStorage ('cch_my_challenges')`, ensuring quests accepted from the Home Hero or Section 04 immediately show up in `/challenges` and `/myhub?tab=quests_rewards`.
- **Action for Backend:**
  - Informational only. No breaking API changes or backend migrations required.
  - When backend tests or creates event/spot data, both Card Grid and List View automatically consume the same standard `EventItem[]` and `LifestyleSpotItem[]` contracts.
- **Status:** Open

### FE-004 · Data Quality & Ingestion Guidelines for Global Luxury UI (Spots & Scraped Events)
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-06 · `main`
- **What changed / what is needed:**
  To maintain our **Global Luxury 9.8+ & Minimal Editorial** standards across both **Card Grid** and the new **List View Mode**, Frontend audited all components (`SpotCard`, `SpotListItem`, `EventGrid`, and Detail Pages `/spots/[id]`, `/fairs/[id]`, `/community/[id]`).
  We identified key formatting and fallback opportunities for the Scraper & Normalization engine (`lib/structuredDataScraper.ts`, `lib/eventNormalization.ts`, `lib/spotScraper.ts`) before data is stored into `chill_database.json` / `discovery_content.json`:

  #### 1. 🌲 Nationwide Lifestyle Spots (`LifestyleSpotItem`):
  - **`categoryLabel` (Must be Thai Vibe Label)**: Currently defaults to raw enum string (e.g. `'nature'`). Please map to human Thai labels:
    - `cafe` → `'คาเฟ่ & สเปซนั่งชิลล์'`
    - `art` / `museum` → `'หอศิลป์ & สเปซศิลปะ'`
    - `nature` / `park` → `'ธรรมชาติ & เดินป่า'`
    - `oldtown` / `temple` → `'ย่านเก่า & วัฒนธรรม'`
    - `viewpoint` → `'จุดชมวิว & ยอดดอย'`
    - `beach` → `'ทะเล & เกาะสวย'`
    - `market` → `'ตลาดนัด & ไลฟ์สไตล์มอลล์'`
  - **`vibeTags` (2-3 Thai Tags)**: Currently defaults to `['นำเข้าจากเว็บไซต์']`. Please auto-tag 2-3 short Thai vibe tags based on keywords (e.g. `['#slowbar', '#มุมถ่ายรูป', '#กาแฟดริป']` or `['#ชมพระอาทิตย์ตก', '#วิวธรรมชาติ']`).
  - **`price` (Free vs Numeric Format)**:
    - If admission is free or not mentioned for public parks/temples, set `'เข้าชมฟรี'` or `'ฟรี'` (enables the emerald green badge).
    - If ticketed, format as concise price (e.g. `'฿50'`, `'฿50 - ฿100'`). Avoid generic `'ไม่ระบุ'` whenever possible.
  - **`openHours`**: Format as clean Thai string (e.g. `'08:30 - 17:00 น.'`, `'เปิด 24 ชั่วโมง'`, `'ปิดวันจันทร์'`). Avoid raw English specs like `'Mo-Fr 08:30-17:00'`.
  - **`googleMapsUrl`**: If `hasMap` is missing from source, construct a direct search URL:
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` instead of falling back to the source website URL.
  - **`galleryImages` (Photo Mosaic)**: Detail page renders a 5-photo mosaic + fullscreen lightbox. If a spot only has 1 image, please provide at least 2-4 curated/related fallback photos (or use `resolveSpotGallery()`) so the photo grid isn't empty.
  - **`district` & `province` (Clean Text)**: Strip `"อำเภอ"`, `"อ."`, or `"จังหวัด"` prefixes so badges stay compact (e.g. `'พระนคร, กรุงเทพฯ'` not `'อ.พระนคร, จังหวัดกรุงเทพมหานคร'`).
  - **`transitInfo`**: When available, include transit keywords (`BTS`, `MRT`, `รถประจำทาง`, `มีที่จอดรถ`) so the detail page splits it into Public Transit vs Private Parking blocks.
  - **`highlights`**: Provide 2-3 bullet strings (e.g. `['จุดชมวิวพระอาทิตย์ตกริมแม่น้ำ', 'คาเฟ่ Specialty Coffee บรรยากาศร่มรื่น']`) to populate the "จุดเด่น & ไฮไลต์" section.
  - **`contact`**: Populate optional `{ phone, website, facebook }` where available.

  #### 2. 🏛️ Major Fairs & Public Expos (`EventItem` with `eventType: 'public_venue'`):
  - **`location` / `locationName` (Convention Center Keywords)**:
    Ensure venue landmarks include standardized names (`ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)`, `ไบเทค บางนา (BITEC)`, `อิมแพ็ค เมืองทองธานี (IMPACT)`, `รอยัล พารากอน ฮอลล์ (Paragon Hall)`, `ทรู ไอคอน ฮอลล์ (ICONSIAM)`).
    This automatically triggers public transit badges (MRT/BTS exits, parking capacity) and correct inclusion in `TopVenuesRail`.
  - **`date` & Date Timestamps (`startDate`, `endDate`)**:
    - `date`: Concise Thai date range (e.g. `'15 - 19 ต.ค. 2569'`).
    - `startDate` & `endDate`: Valid ISO timestamp strings so `isEventEnded()` and sort filters can accurately distinguish active events from archived ones.
  - **`price`**: Provide `'เข้าชมฟรี (Walk-in)'` or ticket tier (`'บัตรราคา 150 บาท'`) to render the price chip properly.
  - **`sourceUrl` / `externalUrl` / `link`**: Must link to the direct event page or official ticket registration, not just the venue's top-level homepage.
  - **`organizerName` / `hostName`**: Include the actual official organizer name (e.g. `'สมาคมผู้จัดพิมพ์ฯ (PUBAT)'`, `'Impact Exhibition Management'`).

  #### 3. 👥 Community Meetups (`EventItem` with `eventType: 'community'`):
  - **`time`**: Friendly Thai time string (e.g. `'07:00 - 09:30 น.'`).
  - **`maxParticipants`**: Number between 2 and 30 (never 0 or negative).
  - **`meetingPoint`**: Specific landmark location (e.g. `'ลานจอดรถประตู 1'`, `'หน้าเคาน์เตอร์ Slow Bar'`).
  - **`hostAvatar`**: High-quality avatar image URL (or fallback to DiceBear / Unsplash portrait avatar).

- **Action for Backend:**
  - Recommend adding a lightweight `sanitizeSpotItem()` in `lib/spotScraper.ts` / `lib/structuredDataScraper.ts` and `sanitizeEventItem()` in `lib/eventNormalization.ts` to enrich these defaults at ingestion time.
  - This ensures all newly scraped spots and events immediately look complete, rich, and stunning in both Grid and List modes without needing ad-hoc UI fallbacks.
- **Status:** Open (For Claude's implementation during scraper / ingestion pipeline refinements)

### FE-003 · Classic Mode Single-Row Floating Carousels, HeroSection Search Console Tabs & Journey Mode UI
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-04 · `main`
- **What changed:**
  1. **Classic Mode Single-Row Floating Carousels**:
     - Converted Section 01 (Community Meetups), Section 02 (Fairs & Expos), and Section 03 (Lifestyle Spots) on `app/page.tsx` from static 2-row grids with page-limit cuts (`limit={10}`) to modern single-row horizontal snap carousels (`layout="carousel"`).
     - Built `components/FloatingCarousel.tsx` with backdrop-blur floating left/right navigation pills, automatic boundary detection (`disabled:opacity-0 disabled:pointer-events-none`), and smooth snap-scrolling.
     - Extended `components/EventGrid.tsx` with `layout?: 'grid' | 'carousel'` prop (defaults to `'grid'`). When `layout="carousel"`, cards render seamlessly inside `FloatingCarousel` without pagination/limit truncation, preserving the full filtered collection.
  2. **Section 04 & 05 Parity (Challenges & Moments Carousels)**:
     - Updated `components/CommunityChallengeBar.tsx` and `components/CommunityMomentsStrip.tsx` to utilize floating centered manual navigation arrows matching the exact same floating pill aesthetic.
     - Standardized card sizing and height consistency across challenge quests and user moments strips.
  3. **Hero Section Search Console Enhancements (`components/HeroSection.tsx`)**:
     - Added two new tabs to the Search Console navigation in Classic Mode: `ชาเลนจ์` (`Trophy`) and `โมเมนต์` (`Camera`).
     - Adhered strictly to `AGENTS.md` button/tab hygiene: neutral monochrome slate hover (`group-hover:text-slate-600` and `group-hover:text-slate-800`), eliminating rainbow colors on mouse hover.
     - Color activation only triggers on click/active selection (`#7C3AED` royal violet for challenges, `rose-500` for moments).
     - On click, smoothly scrolls down to `#section-challenges` and `#section-moments` respectively.
     - Scroll spy / scroll reset listener automatically restores `activeModeTab` to `'all'` when the user scrolls back to the top of the page.
  4. **Journey Mode Page & Navigation (`app/journey/page.tsx`, `components/HeroSection.tsx`, `components/Navbar.tsx`)**:
     - Added dedicated `/journey` route presenting an editorial story-driven lifestyle stream with 6 curated rails: `Hot Activities`, `Popular Public Events`, `Top Traveling Destinations`, `Member Privileges`, `Active Quests`, and `Chill Moments`.
     - Created `JourneySectionCarousel.tsx` and `JourneyMomentCard.tsx`.
     - Updated Hero Section on Journey page to display 6 floating quick-access pills: `หน้าหลัก`, `กิจกรรมคอมมูนิตี้`, `งานมหกรรม & เอ็กซ์โป`, `พิกัดเที่ยว & จุดฮีลใจ`, `Challenge & Lifestyle Hub`, `โมเมนต์` with smooth scrolling and active-scroll detection.
     - Fixed Hot Activities carousel initial scroll offset / boundary calculation to guarantee left floating arrow correctly starts at offset 0.
     - Added "โหมดค้นหาแบบเจอร์นีย์" badge / navigation in `Navbar.tsx`.
- **Action for Backend:**
  - **No breaking API changes or backend migrations required.**
  - `EventGrid` defaults to `layout="grid"` so admin and deep-dive subpages (`/community`, `/fairs`) continue working unchanged.
  - When Claude works on search/filtering or event listings, these single-row carousel wrappers consume standard `EventItem[]` and `LifestyleSpotItem[]` lists seamlessly.
- **Status:** Acknowledged by Backend (2026-10-04): no backend action needed. Note that carousels now render the full approved list, so imported events and spots make the rails longer.

### BE-005 · Quests: use `brandReward` and the server-computed lifecycle from the API
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-04 · `claude` (merge into `main` pending)
- **What changed:**
  - `ChallengeQuest` now has `brandReward?: QuestReward` and `image?: string`. `QuestReward` is exported from `@/data/mockData` with the same shape as the local `QuestRewardProfile` in `components/JoinChallengeModal.tsx`.
  - `/api/quests` returns `brandReward` for every seed quest (Cafe Hunter → Ari Specialty Coffee Club, HYROX → HYROX Thailand, Step Count / Digital Detox → hub_central).
  - `daysRemaining` and `status: 'ended'` are computed from `endDate` on every read (stored values are ignored). Seed dates were refreshed to Oct–Dec 2026, except "Digital Detox" which is intentionally ended (25 มี.ค. 2026) so the "สิ้นสุดแล้ว" archive has a real case.
- **Action for Frontend:**
  1. Import `QuestReward` from `@/data/mockData` instead of redefining `QuestRewardProfile` (or alias it).
  2. For API quests, use `quest.brandReward` directly. `getQuestBrandReward()` already returns it when present — the title-keyword fallback is now only needed for the static `ALL_QUESTS` catalog in `app/challenges/page.tsx`.
  3. Rely on `status` / `daysRemaining` from the API instead of hard-coded values; quests without `endDate` have no `daysRemaining`.
  4. Optional: `QuestWithDuration.brandReward?: any` can become `QuestReward`.
- **Status:** Open

---

## Done

### FE-002 · Quests & Challenges UI Standardization (Status Archive, Ended Quests, Typographic Scale, Clean Minimal Filter)
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-04 · `main`
- **What changed / what is needed:** Frontend completed a comprehensive UI/UX overhaul of the Quests & Challenges system:
  1. **Badge Standardization**:
     - Platform Central Quests: `Official • Chill & Connect` with soft royal purple theme (`bg-purple-100/90 text-purple-900 border-purple-300/80`).
     - Brand Partner Quests: `Official • {partnerName}` with warm amber gold theme (`bg-amber-100/90 text-amber-950 border-amber-300/80`).
  2. **Status Archive & Ended Handling**:
     - Ended quests (`status === 'ended'` or `daysRemaining <= 0`) are now automatically filtered out of active carousels (`CommunityChallengeBar`) and archived into a dedicated "สิ้นสุดแล้ว" status tab in `/challenges`.
     - In modals (`JoinChallengeModal`), ended quests display a muted slate banner, status pill "สิ้นสุดภารกิจแล้ว", and disabled CTA button "ภารกิจสิ้นสุดระยะเวลาแล้ว".
  3. **Typography & Responsiveness**:
     - Card titles strictly adhere to `AGENTS.md` typography standard (`line-clamp-2 min-h-[2.5rem]`).
     - Modal footers adapt responsively (`flex-col-reverse` on mobile, `flex-row` on desktop).
  4. **Filter & Button Hygiene**:
     - Removed multi-color rainbow buttons and crown icons from filter chips.
     - Single consolidated filter row on `/challenges` with neutral monochrome slate styling (`bg-slate-900 text-white`).
- **Action for Backend:** When creating/updating quests in `/api/admin/quests` or `lib/db`, backend can safely set `status: 'ended'` or rely on `daysRemaining: 0` for expired quests. Ensure `brandReward` objects include `partnerName` and `title` when `type === 'brand_partner'`.
- **Status:** Done (2026-10-04 on `claude`: `brandReward` (`QuestReward`) and `image` added to `ChallengeQuest`; brand_partner requires `partnerName` + `title` (API-validated); `daysRemaining`/`ended` are now computed from `endDate` by the server; admin Quests form edits period and reward type. See BE-005 for the frontend follow-up.)

### FE-001 · Scope clarification: Claude owns Admin UI + Backend; Antigravity owns Customer-Facing Frontend
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-03 · `main`
- **What changed / what is needed:** Per project owner direction to optimize collaboration speed and eliminate cross-agent handoffs:
  - **Claude Code** now owns both Backend (`app/api/**`, `lib/**`, `data/**`) AND Admin UI (`app/admin/**`, `components/admin/**`, `components/AdminCreateEventModal.tsx`, `docs/API.md`, `BACKEND_IMPLEMENTATION_LOG.md`).
  - **Antigravity IDE (Gemini)** owns Customer-Facing Frontend (`app/**` except `/admin`, user-facing `components/**`, `app/globals.css`, client-only helpers, `DESIGN_SYSTEM.md`).
- **Action for Backend:** When pulling `main`, note that Claude Code may freely modify, refactor, and build all Admin UI screens and modals directly alongside backend routes without needing frontend requests.
- **Status:** Done (2026-10-03: acknowledged by Claude Code; memory and working rules updated. First admin-UI change under the new scope: admin honesty pass on `claude` — real session in header/sidebar, sample screens labeled, role simulator removed.)

### BE-001 · `POST /api/events` ignores `userRole`; admin status comes from the server session
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The server no longer trusts a role sent by the client. Fairs created by non-admins are `pending` until approved in `/admin`. Backend already removed `userRole` from the two requests in `components/CreateEventModal.tsx`.
- **Action for Frontend:** Do not re-add `userRole` (or any role/permission field) to requests. When showing the result of creating a fair, read `data.event.approvalStatus` and say "pending review" instead of "published" when it is `pending`.
- **Status:** Done (2026-10-03: UI reads `data.event.approvalStatus` and shows pending review feedback in CreateEventModal callbacks across all pages)

### BE-002 · `POST /api/events` returns only the created `event` (no `events` list)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The response used to include `events` (every event, including pending ones). It is now `{ success, message, event }`.
- **Action for Frontend:** Use `data.event`. The server may assign a different `id` than the one sent (if missing or taken): `CreateEventModal.tsx` currently stores and passes its own `communityPayload` / `fairPayload` (lines ~814–883). It should use `data.event` (especially `data.event.id`) for `user_created_events`, `joined_event_ids` and `onCreateSuccess`. `SpotBuddyGatheringModal.tsx` already does this.
- **Status:** Done (2026-10-03: CreateEventModal now merges `data.event` and uses server-generated `id` for local storage and `onCreateSuccess`)

### BE-003 · Admin console is behind a server-verified login
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** `app/admin/page.tsx` is wrapped in `components/admin/AdminAuthGate.tsx`, which calls `/api/auth/admin` and shows a login form when the server requires it (production, or when `ADMIN_PASSWORD` + `AUTH_SECRET` are set). Locally with no env vars it opens directly, as before. All `/api/admin/*` calls return `401` without a session.
- **Action for Frontend:** Keep the gate when restyling the admin page. Admin views should treat a `401` response as "session expired" (e.g. reload so the gate shows the login form) instead of a generic error. The "Preview Role" switcher in `AdminHeader` is a client-side simulator only — it grants no server permissions.
- **Status:** Done (2026-10-03: Created `components/admin/adminAuthUtils.ts` with `handleAdminUnauthorized`; integrated across all admin views to reload and prompt login on 401)

### BE-004 · `/api/upload` rejects SVG and checks file contents
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** Accepted types are JPEG, PNG, WebP and AVIF; the file bytes must match the declared type.
- **Action for Frontend:** No change needed today (no upload UI advertises SVG). Don't add SVG to `accept=` attributes or upload hints; keep compressing to WebP before upload.
- **Status:** Done (2026-10-03: Verified no SVG is accepted or advertised; tightened file input accept attributes to `image/jpeg,image/png,image/webp,image/avif` across the app)

### BE-023 (2026-10-10) Moments page wired to the API, hosted events on the profile — from Claude Code
Owner asked Claude Code to do this directly, including edits in two frontend files.
- **`app/moments/page.tsx` (frontend file, edited on the owner's request):** posts, comments, likes, saves and deletes on members' posts now go through `/api/moments`. The hard-coded author "คุณส้ม (Som_Chill)" is gone; "mine" and the delete button use `isMine` from the API. Members' posts load from `GET /api/moments?limit=30` and sit above the bundled `MOCK_POSTS`, which stay local. A post needs at least one uploaded photo (no stock image is added). Server refusals (401/403/429/400) show in the page's toast. `localStorage.chill_user_moments` is no longer used.
- **`app/myhub/page.tsx` (one small edit):** hosted events also load from `GET /api/events?mine=1` and merge over the `user_created_events` browser copy.
- **New:** `GET /api/events?mine=1` (signed-in member's own events, any approval status) and `GET /api/events?host=<memberId>` (that member's approved events). See `docs/API.md`.
- **Profile:** `/profile` shows "กิจกรรมที่จัด" (owner sees pending ones with a label; visitors see approved only). Managing events stays in My Hub.
- **`/onboarding?step=pledge&returnTo=…`:** opens the pledge alone for an existing member and saves nothing else.
- **For Gemini:** keep these API calls when restyling the Moments page. Still open: the feed's sample posts are local, so likes and comments on them are not saved.
- **Update 2026-10-11 (same file, owner's request):** the "share a moment" dialog in `app/moments/page.tsx` is now one short form: photos, caption, then one optional select ("เกี่ยวกับกิจกรรมหรือสถานที่ไหน") that replaces the five type tabs and the check-in popover. It is a bottom sheet on phones with the action bar always in view. The composer strip above the feed shows the member's own avatar, a short prompt and shorter tab labels (ทั้งหมด / ยอดนิยม / บันทึกไว้ / ของฉัน) that fit 360px. Unused after this change, safe to delete: `isCheckInPopoverOpen`, `checkInSearchQuery`, `filteredCheckInPlaces`.

### BE-024 (2026-10-11) Moments page reads everything from the server; following — from Claude Code
Owner asked Claude Code to do this directly in `app/moments/page.tsx`.
- **Feed:** every post (bundled samples included, they are seeded on the server) comes from `GET /api/moments` with `tab`, `location`, `page` and `limit=8`; scrolling fetches the next page. `MOCK_POSTS` is no longer rendered. Likes, saves and comments are stored for every post.
- **Safety on each card:** report button (dialog with reasons), author name and photo link to `/profile?id=…`, delete asks for confirmation, own captions can be edited, own comments can be deleted. Members who have not verified their email or accepted the pledge see a notice with a link to `/profile#trust` before the post form opens.
- **Following:** new tab "ติดตาม"; the sidebar "สมาชิกที่น่าติดตาม" lists real members from `GET /api/members/suggested`; follow button on `/profile?id=…` with follower counts.
- **Highlights:** the sample stories rail is replaced by "ไฮไลต์ยอดนิยม" (most liked moments). `components/MomentsStoriesRail.tsx` is no longer used by this page.
- **Removed:** made-up share counter, default saved posts, the "Connect" buttons on sample members, emoji in toasts. Images load lazily; a loading placeholder shows while the first page loads.
- **Now unused in the page, safe to delete:** `SUGGESTED_MEMBERS`, `handleToggleFollow`, `followedUserIds`, `visibleCount`, `userStoryThumbnail`, the `MOCK_POSTS` import.
- **Update 2026-10-11 (BE-024, same page):** real 24-hour stories (`/api/stories`) with an add form and a full-screen viewer; the rail shows stories first, then "ไฮไลต์". Notifications bell in the composer row (`/api/notifications`). The tab bar is three feed views (ทั้งหมด / ติดตาม / ยอดนิยม) plus two icon shortcuts (saved, mine). Sample posts carry a "ตัวอย่าง" tag. The sidebar has a third widget "ชาเลนจ์แนะนำ" from `GET /api/quests`. New stores `data/stories.json` and `data/notifications.json` are gitignored.
- **Update 2026-10-11 (BE-024, continued):** the notifications bell is now `components/NotificationBell.tsx`, rendered by `components/Navbar.tsx` for signed-in members on every page (refreshes each minute and on focus); it was removed from the Moments composer row. Stories can be reported from the viewer: `POST /api/stories/{id}` with `{ action: 'report', reason }` (once per member; 3 distinct reports hide the story and each report raises a risk flag for staff). `GET /api/stories` items include `hasReported`.
- **Update 2026-10-11 (BE-024, photos):** feed photos use `components/moments/MomentPhotos.tsx`: one frame per post sized by the first photo and kept between 4:5 and 1.91:1, photos fill the frame (`object-cover`), several photos are a swipeable carousel (scroll-snap) with a counter, dots and desktop arrows; one tap opens the lightbox, a double tap likes. The collage grid is gone. The feed column is 640px wide (page container 1080px); the sidebar shows from `lg` up only. `POST /api/moments` accepts `imageRatio` (width / height of the first photo) and feed items return it; posts without it are measured in the browser. Upload resize is now 1440x1800 max.

### BE-025 (2026-10-11) Sample accounts for sample posts; follow from the card — from Claude Code
- **Sample accounts:** each author of the bundled sample moments now has a sample member (`mem_sample_<handle>`, `isSample: true`, email `<handle>@sample.invalid`, no password, cannot sign in) with a full made-up profile from `data/sampleMembers.ts`. `ensureSampleMembers()` creates them once per server process and links the sample moments to them, so their profile opens at `/profile?id=…` (labelled "โปรไฟล์ตัวอย่าง") and they can be followed. They appear in the admin member list. Listed for removal before launch in `DESIGN_SYSTEM.md` section 12.
- **Feed items** now include `isFollowingAuthor`; the post card has a "ติดตาม" button beside the author's name. Suggested members include `isSample`.
- **Moments page on phones:** post cards are full width; "กิจกรรมแนะนำ" and "ชาเลนจ์แนะนำ" appear as cards after the 3rd and 7th post (the sidebar is desktop only).
- **Photos:** uploaded files are served through `/_next/image` in 640 / 828 / 1200 widths (`srcSet`); remote sample images are used as they are.
- **Update 2026-10-11 (BE-025, continued):** `MomentPhotos` layouts are now: 1 photo = one frame (4:5 to 1.91:1); 2 photos = side by side in a 5:4 frame; 3 or more = a strip where each photo takes 86% of the width so the next one peeks in, with counter, dots and desktop arrows. The post form's "เกี่ยวกับกิจกรรมหรือสถานที่ไหน" field is a live search over `/api/events`, `/api/spots` and `/api/quests` (the sample "booked events" select is gone). Sample posts can be reported. Esc closes the post form.
- **Update 2026-10-11 (BE-025, photo grid):** `MomentPhotos` now follows the Facebook feed grid (the strip/carousel is gone). The layout comes from the photo count and the shape of the first photo: 1 = the photo (4:5 to 1.91:1); 2 = side by side, stacked when the first is landscape; 3 = one large + two; 4 = one large + three, or 2x2 when the first is square; 5 or more = two above three with "+N" on the fifth tile. Frame is 1:1 for 2 to 4 photos and 6:5 for 5 or more; tiles are 2px apart and fill with `object-cover`. A tap opens the viewer at that photo (the viewer now also swipes on touch screens). Double-tap-to-like on photos was removed. Feed column is 680px, page container 1140px.

### BE-026 (2026-10-11) Joining events is real; My Hub reads the account — from Claude Code
From 2026-10-11 the owner asked Claude Code to do all work, frontend included.
- **Joining:** every join and cancel goes through `activityActions.join / leave` (`lib/useMyActivity.ts`) → `POST /api/auth/member/activity`. The server checks seats, ended events, approval and the member's trust level. `components/EventDetailModal.tsx` and `app/community/[id]/page.tsx` call it and show the server's refusal; the home, community, fairs, spots and journey pages take `joinedEventIds` from the store. The sample "already joined" lists that pages wrote for every visitor are gone.
- **My Hub (`app/myhub/page.tsx`):** joined, hosted, cancelled and saved items come from the account; a new member starts empty. Header shows the member's name and three real counts; level, XP and reward numbers were removed until the challenges work. Phones open on the list view. No text under 11px.
- **Fix:** joining a sample meetup failed as "ended" because the join check used the stored date while pages show the rolled-forward one; the check now uses the shown date.
- **Still local to the browser:** fair sub-groups (`joinedSubActivities`), "missed" and "reviewed" marks, challenge progress. `app/fairs/[id]/page.tsx` was not changed.
- **Dev note:** after changing `lib/db/adapters/jsonAdapter.ts`, restart `next dev`; the adapter instance is cached across hot reloads.
- **Update 2026-10-11 (BE-026, tickets and reviews):** `components/ETicketModal.tsx` now loads the member's real ticket (`/api/events/{id}/ticket`) and shows the 6-character code; the "simulate check-in (+50 XP)" buttons and the drawn QR are gone (the `ticketId`, `isCheckedIn`, `onCheckIn` props are ignored). `components/TipHostModal.tsx` saves a real review (`/api/events/{id}/review`) and no longer offers tips; `onTipSubmit` is called with tip 0 after the server accepts. My Hub has a "กิจกรรมที่คุณจัด" section with a check-in dialog for hosts; "attended" for member-hosted events now means the host checked the member in. The profile shows "รีวิวจากผู้เข้าร่วม". New store `data/reviews.json` (gitignored).
- **Update 2026-10-11 (BE-026, chat and fair groups):** `components/GroupChatModal.tsx` was rewritten on top of `/api/chat/{roomId}` (same `isOpen / onClose / event` props, plus optional `roomId`, `roomTitle` for a fair group); the sample messages, image sending and in-chat report were removed. `app/fairs/[id]/page.tsx` loads meet-up groups from `/api/events/{id}/groups`; the two hard-coded groups and every private "contact channel" (LINE / IG handles) are gone, and the pass dialog has a "แชตกลุ่ม" button instead. My Hub has a development-only strip that calls `/api/dev/demo`. Fixed in My Hub's calendar: an event showed on every day whose number appeared anywhere in its date text. New stores `data/chat_messages.json`, `data/fair_groups.json` (gitignored).
- **Update 2026-10-11 (BE-026, QR ticket and dialogs):** added the `qrcode` package (and `@types/qrcode`). `components/ETicketModal.tsx` was rewritten: a real QR that holds `/checkin?event=…&code=…` plus the 6-character code, icons on each detail row, a neutral category chip (emoji stripped from old tags), no English header, and a "ยกเลิกการเข้าร่วม" button. New page `app/checkin/` checks the member in when the event's host opens the link (anyone else is refused by the server). `components/CancelTicketModal.tsx` and `components/TipHostModal.tsx` were rewritten on `DialogShell` (one question each; the cancel reasons list was removed because it was never stored). Text under 11px was raised in `ExpoMeetupPassModal`, `SpotBuddyGatheringModal`, `ReportSafetyModal`, `CreateEventModal`, `VerifyQuestModal`, `JoinChallengeModal`.
- **Update 2026-10-11 (BE-026, roles and ticket follow-up):** the site role is no longer a browser switch. `lib/useAuth.ts` derives `role` from the member's approved host application (`trust.hostKind`: host / venue_owner / organizer, otherwise member); `handleSetRole` is kept but does nothing, and `isAdmin` is never true on the public site. `components/CreateEventModal.tsx`: the member screen with "สลับเป็น Host / Organizer / Space / Admin" buttons was replaced by a short explanation with "สร้างกิจกรรม" (goes to the form; the event waits for review) and a link to the host application. Every community ticket now shows a QR (fairs do not). `POST /api/dev/demo` also creates an upcoming sample event hosted by a sample member.

### BE-027 (2026-10-11) Roles from the server everywhere; create-event form first pass — from Claude Code
- **Roles:** the "สลับบทบาททดสอบ (Role)" switch was removed from `components/Navbar.tsx`; onboarding no longer sets a role (the member's answer is saved as an intent only). `app/community/[id]/page.tsx` decides "you are the host" from the event's `createdByMemberId`, not from a list in the browser. Checked: an approved host opens the create form directly; an approved organizer or venue owner first chooses between a community event and a fair.
- **Create-event form (`components/CreateEventModal.tsx`, `components/RichTextEditor.tsx`, `components/SpotBuddyGatheringModal.tsx`):** primary blue instead of Forest Green on buttons and focus states, selected options use a blue tint instead of solid black, English in brackets and emoji removed from labels, no text under 11px. The submit button reads "ส่งให้ทีมงานตรวจ" unless the event will really publish at once.
- **No private contact channel:** the "ช่องทางติดต่อกลุ่ม (Line OpenChat / Line ID)" field is gone from both forms, and `POST /api/events` drops `contactChannel` from members' events. People talk in the event's group chat. Existing sample events that carry a contact channel still show it on the community detail page.
- **Still to do in this form:** it is a 3,000-line component with the quest and place forms inside (now unreachable from the public site, since `isAdmin` is never true there); steps 2 and 3 have not been redesigned, only cleaned.

### BE-028 (2026-10-11) Create dialog rebuilt; members can suggest places and challenges; dates in B.E. — from Claude Code

**What changed**
- `components/CreateEventModal.tsx` is rewritten (2,937 → about 1,160 lines) on `DialogShell`. Same props; `initialType` is now optional: without it the dialog starts with a chooser of four types (community event, fair, place suggestion, challenge idea). Each type is three short steps plus a review step, with messages under the fields, a saved draft per type (`sessionStorage`), and one primary button.
- The old place and challenge forms saved nothing. They now post to `POST /api/spots` and `POST /api/quests` (see `docs/API.md`), open to every verified member, always reviewed by staff. Fairs stay with approved organizers and venues; the server now enforces this.
- `components/MySubmissions.tsx` (My Hub): what the member sent and its state.
- Dates: everything shown is B.E. The API converts on read; sample data in `data/mockData.ts`, `data/profilesData.ts`, `data/rewardsData.ts` and date literals in pages were converted. Scrapers still store C.E. on purpose (deduplication compares stored values).
- `contactChannel` is no longer shown on the community event page and was removed from the sample meetup.
- `components/RichTextEditor.tsx`: toolbar buttons are 32px with `aria-label`; text is 16px on phones.

**Frontend action:** none. New date text must use `formatThaiDateBE` / `toBuddhistEra` from `lib/dateUtils.ts`.

**Not done yet:** no "เสนอชาเลนจ์" button on `/challenges` (the chooser reaches it from My Hub and other pages without `initialType`); staff see proposed challenges as drafts in the challenge manager, not in the unified review queue; `components/CreateChallengeModal.tsx` (home page) is the older local-only dialog.

### BE-029 (2026-10-11) Safety reports are real; proposed challenges in the review queue — from Claude Code

**What changed**
- `components/ReportSafetyModal.tsx` used to save nothing and still say the report was received. It is rewritten on `DialogShell` and posts to `POST /api/reports`. Props changed: `targetType` and `targetId` are required, `targetHostName` is gone, `subject` is optional. The four call sites are updated (`app/community/[id]`, `app/fairs/[id]`, `app/spots/[id]`, `components/EventDetailModal.tsx`).
- Admin console: new module "รายงานความปลอดภัย" (`components/admin/ReportsManagerView.tsx`) with an open count in the sidebar.
- Review queue: member-proposed challenges appear under a "ชาเลนจ์" tab and can be approved or rejected there.
- `/challenges` has an "เสนอชาเลนจ์" button that opens the create dialog on the challenge form.
- `components/CreateChallengeModal.tsx` is deleted: nothing opened it, and it only wrote to the browser.
- Three lint errors fixed (`app/challenges/page.tsx`, `app/page.tsx`, `components/CommunityChallengeBar.tsx`); `npx eslint app components lib --quiet` is clean.

**Frontend action:** any new "รายงาน" button must pass `targetType` and `targetId` to `ReportSafetyModal`.

### BE-030 (2026-10-11) Places get their pin when they are suggested; description template is back — from Claude Code

**Why:** an end-to-end test of the four create forms (create in the dialog, approve in the admin console, open the public page) showed that a suggested place was saved at `0,0` unless its Google Maps link happened to carry coordinates. The review queue still published it, and the place page then showed a map in the sea and "999999 กม." in the trip plan.

**What changed**
- New `components/LocationPinPicker.tsx` in the place form of `components/CreateEventModal.tsx`: paste a Google Maps link, search by name, or tap the map and drag the pin (Leaflet with OpenStreetMap, which was an admin-only dependency until now). A pin is required to continue.
- `POST /api/spots` requires the pin; `POST /api/places/resolve` and `GET /api/places/search` are new (see `docs/API.md`). `lib/mapLinks.ts` holds the link reader; `coordinatesFromMapUrl` moved there from `lib/members/submissions.ts`.
- The review queue refuses to approve a place without coordinates. The admin spot editor has a "ดึงพิกัดจากลิงก์ Google Maps" button.
- The description editor has its "ใช้โครงตัวอย่าง" button again (community event, fair, place). The template is headings with prompts in `[ ]`; the form does not continue while a prompt is left in the text.

**Frontend action:** none.

**Found by the same test, not fixed (owner to decide):** the event, fair and place pages add content nobody entered: stock photos in the gallery beside the one uploaded photo, a host line "จัดกิจกรรมมาแล้ว 12 ครั้ง • เรตติ้ง 4.9 (58 รีวิว)" and "Verified Host" for a new account, fixed "จุดเด่น" and "สิ่งที่ควรเตรียม" lists, fixed transport text for another venue, "Official Venue & Partner" on a member's fair (the organizer's name is not shown), and ended events under "ที่คุณอาจสนใจ". A newly approved place did not appear on the first page of `/spots`.

### BE-031 (2026-10-11) Detail pages add placeholder content to seed data only; fair badge follows the origin — from Claude Code

**Rule (new, `lib/contentOrigin.ts`):** every event and place has an origin, and it decides what a page may add around it.
- `member`: created by a member (`createdByMemberId` / `suggestedByMemberId`). The page shows only what the member entered; an empty section is hidden.
- `source`: imported by staff from an official venue or organizer website (`sourceUrl` with a real `source`). The page shows what the source gave and credits it.
- `sample`: seed data (`source: 'Chill & Connect Official'`, sample members, seed places). Placeholder photos and text still fill the gaps so layouts can be judged during development.

New placeholder content in a page must be behind `eventOrigin(...) === 'sample'` or `spotOrigin(...) === 'sample'`.

**What changed (files formerly owned by the frontend)**
- `lib/eventImageResolver.ts`, `lib/spotImageResolver.ts`: stock gallery photos only for seed data. Other records show their own photos; with fewer than five, the event and fair pages show one wide photo instead of the grid.
- `app/community/[id]/page.tsx`: the host rating, "Verified Host", the hosted-count line, the fixed highlights, the fixed rules and the fixed transport text are seed-only. A member's event shows its own "ของที่ควรเตรียม" and "การเดินทาง" when entered.
- `app/fairs/[id]/page.tsx`: the fixed highlights and generic transport lines are seed-only (facts about QSNCC, BITEC, IMPACT and Paragon stay for any fair held there). The card under the title names the organizer the member typed, and its badge follows the origin: "ผู้จัดงานลงประกาศเอง" (member), "ข้อมูลจากแหล่งทางการ" (source), "Official Venue & Partner" (seed only).
- `app/spots/[id]/page.tsx`: generic transport lines are seed-only; the photo label says whose photo it is.
- "ที่คุณอาจสนใจ" on the event and fair pages no longer lists ended events.

**Follow-up (same day):** the three items found in that test are fixed. The fixed pass numbers (`Pass #CCH-FAIR-0205`, `#CCH-2026`) are removed from the fair and event pages. `POST /api/events` starts a member's event at zero participants and then adds the creator, so a new event shows 1 joined, not 2 (the client's `participantsCount` is ignored). `/spots` puts a place a member suggested in the last 14 days first, newest on top, ahead of the popularity order. The grey map on the fair page was the lazy-loaded frame in the test screenshot, not a defect.

### BE-032 (2026-10-11) Reports for reviews and chat messages; blocking covers comments and events; Moments reads live events — from Claude Code

**What changed**
- **Reports:** `POST /api/reports` accepts `targetType: 'review' | 'chat_message'` (see `docs/API.md`). A "รายงาน" link sits on each review of a host profile (`app/profile/ProfileScreen.tsx`) and under each message from someone else in the group chat (`components/GroupChatModal.tsx`). `components/ReportSafetyModal.tsx` takes the two new target types and leaves out the two reasons that only fit a place or a meeting.
- **Admin:** the "รายงานความปลอดภัย" module shows the reported words and who wrote them, with a "ลบรีวิวนี้" / "ลบข้อความนี้" button that removes the content and closes every open report about it. On a chat report, "อ่านแชตทั้งห้อง" shows every message of that room with the reported one marked, and staff can delete other messages there. A room can be read only through a report about it, and each read is written to the audit log.
- **Blocking:** a viewer no longer sees comments on moments from people they blocked (`lib/moments/service.ts`), nor events those people created, in lists and in search (`GET /api/events`).
- **Moments page (`app/moments/page.tsx`):** no `MOCK_EVENTS` / `MOCK_CHALLENGES` / `MOCK_POSTS` imports are left. Recommended events and challenges, and the event or challenge a moment is about, come from `/api/events` and `/api/quests`. "My events" and "my saved places" in the post form come from the account (`useMyActivity`), not from fixed sample ids. A moment whose event or challenge no longer exists opens nothing; it used to open an unrelated one. The recommended list could show the same event twice; fixed.

**Tested end to end:** a member who is not an approved host creates a community event, it stays pending and hidden, staff approve it in the review queue, and it appears with 1 participant.

**Frontend action:** none. A new place that shows a review or a chat message should offer the same report link (`ReportSafetyModal` with `targetType` and the review or message id).

### BE-033 (2026-10-11) Spot Buddy on the place page, with safety rules — from Claude Code

**Why:** the owner chose Spot Buddy as the core of the platform. The place page had no way to invite people because meeting strangers away from a public event is risky. It now opens only for places staff marked as safe, under rules the server applies.

**What changed**
- **Places:** new field `meetupAllowed` on `LifestyleSpotItem`. Staff set it with the "นัดเจอได้" checkbox in the admin spot editor (`components/admin/SpotEditorDrawer.tsx`). It is off for every place until staff turn it on; the `bar` category cannot have it.
- **Rules (`lib/social/spotTrips.ts`, shared numbers in `lib/spotTripRules.ts`):** at least 3 people before a trip is confirmed, daytime only (06:00 - 19:00, one day), the meeting point is the place itself (a fixed list of three), everyone travels on their own, no contact channel, at most 2 open trips per host, the host has been to something before, and a host with an open report cannot open a trip. See `docs/API.md` ("Spot Buddy trips").
- **API:** `GET /api/spots/{id}/trips` (new), `spotId` filter on `GET /api/events`, trip rules on `POST /api/events` when `eventData.spotId` is sent. New `EventItem` fields: `spotId`, `spotTitle`, `minParticipants`.
- **Former frontend files I edited:**
  - `components/SpotBuddyTrips.tsx` (new): the block on the place page with open trips and the "ชวนเพื่อนไปที่นี่" button.
  - `app/spots/[id]/page.tsx`: renders that block above the one-day plan card.
  - `components/SpotBuddyGatheringModal.tsx`: in spot mode the place is locked, the meeting point is a choice, the ride-sharing options are gone, the date starts at tomorrow (it was fixed to 2026-09-01), and a refusal from the server is shown. It used to report success and save the trip in the browser even when the server refused. In fair mode it no longer posts a community event: the fair page already creates the group, so every fair group also left a pending community event behind.
  - `app/myhub/page.tsx`: the "ชวนเพื่อนไป" button on a saved place shows only when the place has `meetupAllowed`.
  - `app/community/[id]/page.tsx`: a trip shows whether it is confirmed.

**Tested:** type check passes. The rules were run directly against a made-up place and members (valid trip, night time, past date, place not opened, bar, unknown place, new member, approved host, reported member). Not tested in a browser, and not tested end to end with a signed-in member.

**Note for whoever runs the dev server:** restart `next dev` after pulling. The database object is kept across hot reloads, so the `spotId` filter does not apply until a restart.

**Frontend action:** a place card may show how many trips are open later; there is no count endpoint yet (ask with an `FE-###`).

### BE-034 (2026-10-11) Menu follows the core loop; event page reads "joined" from the account only — from Claude Code

**What changed (former frontend files)**
- **Menu (`components/Navbar.tsx`, `components/MobileNav.tsx`):** the items are ค้นพบ, โมเมนต์, ชาเลนจ์, มายฮับ. The bottom bar on phones leaves out มายฮับ for a visitor who is not signed in (the side menu still lists it). About moved from the menu list to the footer of the side menu. A ตี้เพื่อนใหม่ item was tried and taken out again at the owner's request.
- **Event page (`app/community/[id]/page.tsx`):** it no longer adds `joined_event_ids`, `user_created_events` and `joinedSubActivities` from the browser to the joined list. Those lists belong to whoever used the browser last, so after switching accounts the next member looked "joined" and had no join button. Joined state now comes only from `useMyActivity`.

**Still open:** `components/EventDetailModal.tsx`, `app/events/[id]/page.tsx`, `app/community/page.tsx` and `app/myhub/page.tsx` still read those browser lists; they were not checked for the same fault.


### BE-035 · `/journey` rebuilt as the proposed simpler homepage (owner request, for comparison with `/`)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-11 · `claude` (not committed yet)
- **What changed / what is needed:** The owner compared three layouts for the homepage and chose "one row per pillar", built at `/journey` so it can be compared with `/`. `/` is untouched.
  - `app/journey/page.tsx`: no longer uses `HeroSection`. One still photo with the question, one search box, and a "surprise me" button; three links to `/spots`, `/community`, `/fairs` with live counts; then one row each for places (ranked like the homepage), meetups with seats left (soonest first) and fairs (soonest first). The search filters the three rows on the page and "ดูทั้งหมด" carries the words to the pillar page as `?q=`. Member privileges, challenges and moments stay. The "why" block is three short lines that are true today plus a link to `/safety`; the sample totals ("10,000+") are not shown here. Rows show skeletons until data arrives, so the old 137-place flash is gone on this page.
  - For first-time visitors (same day): the headline stays "วันหยุดนี้ ไปไหนดี" and the line under it says going alone or finding company are both fine (the owner's point: most visitors are not looking for new friends, so meeting people is offered, not required), a three-step "how it works" strip sits under the three links, and the first row takes one place per vibe in turn (cafes, nature and art first; places open for meet-ups first) instead of the plain popularity order. A search still uses the popularity order.
  - `components/JourneySectionCarousel.tsx`: shows the `subtitle` prop; "ดูทั้งหมด" is a text link instead of a black button.
  - `components/JourneyMomentCard.tsx`: text below 11px raised to 11px.
  - Removed from this page: emoji in card labels and toasts, the made-up 4.8 rating for places with no rating, the "ไม่ระบุราคา" label on fairs.
- **Action for the other side:** None. If the owner picks this layout for `/`, two written rules change (homepage modes in `DESIGN_SYSTEM.md` section 8, and the three independent section filters in `AGENTS.md` section 2).
- **Status:** Open (waiting for the owner's comparison)

### BE-036 · Classic homepage `/`: highlights row replaces the trending carousel; three smaller changes (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-12 · `claude` (not committed yet)
- **What changed / what is needed:** The owner keeps Classic `/` and is improving it step by step. Done so far:
  - `components/TrendingCarousel.tsx` keeps its card and behavior (the owner tried a large photo card and preferred the old one); only the way items are picked changed. The rules are in the new `lib/highlights.ts`. The row shows eight items, one from each pillar in turn (a single pillar when a pillar tab is active); it now takes `spots`, `excludeIds`, `favoriteSpots` and `toggleFavoriteSpot`, and the heart on a place saves it as a place. The first line of each card states why it was picked (in place of the host name), from real data: community "เหลือ N ที่" (3 seats or fewer), "วันนี้ / พรุ่งนี้ / อีก N วัน" (within 14 days) or "เปิดใหม่"; fairs "กำลังจัดอยู่", "วันสุดท้าย" or "เริ่มในอีก N วัน" (within 14 days); places "รีวิว 4.x" (4.5 and 50 reviews or more) or "ยอดนิยม" (source page views), one place per province. The first five items of each section below are picked last, so the row does not repeat them. Fairs whose title reads as a trade show or congress are picked last. Titles are in Thai.
  - `lib/priceUtils.ts`: new `hasKnownPrice()`. Cards in `EventGrid`, `SurpriseModal` and `TrendingCarousel` show no price badge when the price is empty or "ไม่ระบุราคา". Detail pages are unchanged.
  - `app/page.tsx`: the 01 to 05 number chips beside the section headings are removed (04 and 05 were in `CommunityChallengeBar.tsx` and `CommunityMomentsStrip.tsx`); the member privileges strip moved from above the three sections to below them (before challenges).
- **Action for the other side:** None.
- **Status:** Open (more changes to `/` are being agreed with the owner)


### BE-037 · `/journey`: Chill / Connect switch and ready-made day plans (owner request, for comparison with `/`)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-12 · `claude` (not committed yet)
- **What changed / what is needed:** The owner asked for a homepage idea that is our own instead of following other sites, built on `/journey` so it can be compared with `/`. `/` is untouched by this note.
  - `app/journey/page.tsx`: a two-option switch under the three links, "Chill · เวลาของตัวเอง" (default) and "Connect · ออกไปเจอคน". It reorders the three rows (Chill: places, fairs, meetups; Connect: meetups, places, fairs) and changes the meetup row's heading; no row is hidden. In Connect the place row shows places open for meet-ups when at least three exist. The "surprise me" button moved from the hero photo to beside the switch, and in Connect it draws from meetups. The three-step "how it works" strip is replaced by the switch.
  - New `lib/holidayPlans.ts` and `components/JourneyHolidayPlans.tsx`: up to three day plans, each a date and province with three stops (a place, plus a meetup and/or a fair in the same province on the same day, within 14 days). One plan per province first; weekend days first; trade shows are left out; online events are left out. Events name Bangkok "กรุงเทพมหานคร" and places "กรุงเทพฯ", so the two are matched in this file. Hidden while a search is active.
  - `lib/highlights.ts` now exports `hasExactDate` and `isTradeEvent` (used by the plans).
- **Action for the other side:** None.
- **Status:** Open (waiting for the owner's comparison)


### BE-038 · `/journey` rebuilt from the Classic parts, ordered as one story; the earlier version moved to `/journey-simple` (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner asked to start `/journey` from the Classic homepage and order it by the product's three questions: where to go, who has been, what you get for going. `/` is untouched by this note.
  - `app/journey/page.tsx` now uses the Classic components: `HeroSection` (its pillar tabs open `/community`, `/fairs`, `/spots`), `TrendingCarousel`, `EventGrid` and `SpotCard`. Order: hero, a three-step strip that jumps to each part, highlights, moments ("คนที่ไปมาแล้ว"), challenges and member privileges ("ออกไปแล้วได้อะไร"), then one row per pillar in the Classic order with plain headings and a "ดูทั้งหมด" link, then the short "why" block. On phones the three pillar rows scroll sideways. A search shows the three rows first and hides the rest until it is cleared. Trade shows go last in the fairs row.
  - `app/journey-simple/page.tsx` is a copy of the previous `/journey` (BE-035 and BE-037: one-row layout, Chill / Connect switch, day plans), kept so the owner can still compare it.
  - `CommunityMomentsStrip` and `CommunityChallengeBar` take an optional `title` for the heading shown with `minimalHeader`; the default text is unchanged.
- **Action for the other side:** None.
- **Status:** Open (waiting for the owner's comparison)


### BE-039 · Visits link places, events, moments, challenges and points (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner asked for the parts of the product to be connected. A "visit" (a member has been to a place or event, with evidence) is now the link; see `docs/API.md`, "Visits".
  - New `lib/social/visits.ts`, `lib/social/questProgress.ts`, `app/api/visits/route.ts`. Evidence is read from the stores that already hold it (host check-in, moments tied to a target) plus a new `data/visits.json` (gitignored) for "I have been here" marks with an optional rating.
  - `ChallengeQuest` has a new optional `rule` (type `QuestRule` in `data/mockData.ts`). Stored seed quests take their rule from the seed once, on load.
  - New `components/VisitPanel.tsx` ("ใครไปมาแล้ว" and "ไปแล้วได้อะไร", with the "ฉันไปมาแล้ว" button and rating) in the right column of `/spots/[id]` (above Spot Buddy), `/fairs/[id]` and `/community/[id]` (under the schedule or registration card). Headings read "โมเมนต์จากเพื่อนๆ" and "ร่วมแชร์โมเมนต์".
  - `app/moments/page.tsx` reads `createForType`, so the composer can open tied to a place or a fair.
  - Owner decisions the same day: the park run quest (`comm-quest-2`) counts only the three parks its title names (`spot-bkk-1`, `osm-w23483299`, `osm-w23487550`); the HYROX quest (`comm-quest-3`) counts four HYROX meetups, so three sample meetups were added to `MOCK_EVENTS` (`comm-hyrox-2` to `comm-hyrox-4`).
  - Store edits made by hand with the owner's permission (server stopped): `spot-bkk-1` (Benjakitti Forest Park) is published, so the park run quest can be finished; two scraped places that could not be approved because the source gave a wrong pin (`ttd-100859`, `ttd-2479`) got coordinates from OpenStreetMap. They are still drafts, waiting for approval in the review queue.
- **Not done yet:** cards in lists do not show the proof (the API serves a whole row in one call); My Hub, `/rewards` and `/challenges` still show sample points and progress; the admin quest form has no rule fields (the API accepts them); most sample moments are still not tied to a place or event.
- **Action for the other side:** None.
- **Status:** Open


### BE-040 · My Hub, rewards and challenges show real points and progress (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** Points were a browser value that started at 650 for everyone. They now come from the account; see `docs/API.md`, "Points and rewards".
  - New `lib/social/rewardsLedger.ts`, `app/api/rewards/route.ts`, `lib/useMyRewards.ts`.
  - `app/rewards/page.tsx`: balance and redeemed rewards from the account; redeeming goes through `POST /api/rewards`. No reward is pre-redeemed for a new member any more.
  - `app/challenges/page.tsx`, `app/myhub/page.tsx`: balance from the account; challenges with a rule show the server's progress; noting progress by hand, the practice check-in and the practice "verify" no longer add points.
  - `components/VisitPanel.tsx` (BE-039) no longer lists points; its main button is "ร่วมแชร์โมเมนต์", with "ดูทั้งหมด N โมเมนต์" linking to `/moments?targetType=...&targetId=...` when a place has more than three.
- **Action for the other side:** None.
- **Status:** Open


### BE-041 · Moments and quests modules removed from the bottom of the pillar pages (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner asked to remove the "moments & quests" block under the lists (FE-011), because each place and event page now carries its own moments and challenge link (BE-039). Removed from `/community`, `/fairs`, `/spots` and from the three pillar tabs of `/`. `components/CommunityDiscoveryHighlights.tsx`, `FairsDiscoveryHighlights.tsx` and `SpotsDiscoveryHighlights.tsx` are deleted (nothing else used them). The moments strip and the challenge bar on the "all" tab of `/` are unchanged.
- **Action for the other side:** None.
- **Status:** Open


### BE-042 · Homepage challenge and moments rows read real data; sample moments tied to places and events (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The two rows on `/`, `/journey` and `/journey-simple` showed lists typed into the component files. They now read the stores; see `docs/API.md` ("`GET /api/quests`", "Moments").
  - `components/CommunityChallengeBar.tsx`: the `COMMUNITY_PUBLIC_QUESTS` list and its export are gone. The row shows `GET /api/quests` only, with placeholder cards while loading and one friendly line when there is nothing to show.
  - The seven quests from that list moved to `MOCK_CHALLENGES` in `data/mockData.ts` with the same ids (`comm-quest-1` to `comm-quest-7`), dates in the current quarter, `badgeCoverImg`, and a visit rule on six of them (the seven-day yoga one has none). The first four seed quests got cover photos. `lib/questLifecycle.ts` (`addNewSeedQuests`) and `lib/db/adapters/jsonAdapter.ts` add new seed quests to an existing store once.
  - `components/CommunityMomentsStrip.tsx`: reads the 12 newest moments from `GET /api/moments`; the count in the heading is the feed's total. Every card opens `/moments`, as before; the badge shows the place or event name when the moment is tied to one.
  - `data/mockData.ts`: 17 sample posts are now tied to a real meetup or a published place (20 of 24 in total; 3 stay `general`, 1 is tied to a challenge). `post-1` pointed at meetup `7`, which does not exist; it now points at `comm-fitness-1`. `lib/moments/jsonMomentRepository.ts` brings a store seeded earlier in line on start.
  - New export `SAMPLE_JOINED_CHALLENGES` (the first four seed quests) for the "joined" practice list a browser starts with on `/challenges` and `/`, so the longer catalog does not make every quest look joined.
  - `app/challenges/page.tsx`, `app/page.tsx`, `components/HeroSection.tsx`: no longer import the removed list. `/challenges` lists the catalog first, then the four quests still typed into that page.
- **Not done yet:** `/challenges` still has four quests typed into the page (two of them ended). `post-spot-1` is tied to `spot-bkk-1`, a draft in the store (the page opens from the bundled list, but the place is in no public list). Near-duplicate sample quests are both kept: coffee (`1`, `comm-quest-1`), HYROX (`4`, `comm-quest-3`), digital detox (`3` ended, `comm-quest-5`).
- **Action for the other side:** None. A dev server that was already running needs a restart to pick up the seed changes.
- **Status:** Open


### BE-043 · Joining a challenge is kept with the account; rule fields in the admin form (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed / what is needed:** Joining was a list in the browser (`cch_my_challenges`) that started with four sample challenges for everyone. It is now on the account; see `docs/API.md`, "Joining a challenge".
  - New `lib/social/questJoins.ts`, `app/api/quests/join/route.ts`. `GET /api/rewards` adds `joinedQuestIds` and `quests[].joined`. A challenge's reward points count only while the member is joined; progress is counted from visits either way.
  - `GET /api/quests`: `participantsCount` is the written number plus real joins.
  - `lib/useMyRewards.ts`: `joinQuest`, `leaveQuest`, `syncMyChallenges`.
  - `app/challenges/page.tsx`: joined state, join and cancel go through the account; the page lists the catalog only. Its four typed-in quests moved to `MOCK_CHALLENGES` (`quest-off-3`, `quest-off-4` with current dates and a rule; `quest-ended-1`, `quest-ended-2` as ended).
  - `app/myhub/page.tsx`: the challenge list is the joined challenges from the account with the catalog's details.
  - `components/CommunityChallengeBar.tsx`: joined state and progress from the account; the made-up "1/3" a card showed right after joining is gone. `joinedQuestTitles` is still accepted but no longer read; `onJoinQuest` is called after a saved join and when a signed-out visitor tries to join.
  - `components/admin/QuestsManagerView.tsx`: a "การนับความคืบหน้า" section sets the rule (what is counted, weakest evidence, categories, provinces, title words, ids). The target number is the rule's count. `/api/admin/quests` accepts `rule` on create as well.
  - `SAMPLE_JOINED_CHALLENGES` (BE-042) is removed. The challenge row and `/challenges` use `badgeCoverImg || image` for the cover, so a cover set in the admin form shows.
- **Not done yet:** the hero and the place modal on `/` still read joined titles from the browser list, which is only brought in line when `/challenges` or My Hub is opened. Saving a seed quest in the admin form sets the rule's count to the target number (for "Digital Detox" that is 3 hours against a count of 1; check before saving).
- **Action for the other side:** None.
- **Status:** Open


### BE-044 · The challenge detail window shows what the server counted (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The window (`components/JoinChallengeModal.tsx`, used on `/challenges`, the homepage row and the hero) let anyone press "send proof" and reach a reward card with the same code for everybody. It now reads `GET /api/quests/[id]`; see `docs/API.md`.
  - New `app/api/quests/[id]/route.ts`, `lib/social/questVouchers.ts`; `targetsOfQuest` in `lib/social/questProgress.ts`.
  - A challenge with a rule: a "ไปที่ไหนได้บ้าง" list of the places and events that count, each a link, with "นับแล้ว" on the ones already counted; progress is the server's; the main button for a joined member is "ไปกันเลย" (the next place). The simulated GPS / photo / QR proof form is gone for these.
  - A challenge without a rule: the member notes progress for themselves ("บันทึกความคืบหน้าเอง"), kept in the browser under `cch_quest_notes`, and the window says it earns no points or reward.
  - The partner reward card appears only when the server says the challenge is finished, with the member's own code. The made-up "1/N" right after joining is gone.
  - `data/mockData.ts`: the nine seed quests whose reward was guessed from the title now carry `brandReward` (same values).
  - `app/challenges/page.tsx`: the signed-out button no longer promises "+100 XP ฟรี".
- **Not done yet:** seed texts on some quests still describe GPS check-ins in their steps (the "ขั้นตอน" list), which the product does not do; the admin form has no steps field to correct them. Cards and the window still show "+XP" on the two quests without a rule (Step Count, Morning Yoga), though they cannot be finished for points. Emoji remain inside the reward cards. `isCompleted` is still accepted by the window but no longer read.
- **Action for the other side:** None.
- **Status:** Open


### BE-045 · Challenges page: own progress on cards, one word for the thing, moments in the detail window (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:**
  - `app/challenges/page.tsx`: a joined card shows the member's own progress bar from the account ("ร่วมอยู่ บันทึกความคืบหน้าเองได้" for a challenge without a rule). Heading is "ชาเลนจ์ชวนออกไปใช้ชีวิต"; the tabs read "เปิดอยู่" and "จบไปแล้ว"; the card button reads "ร่วมเลย".
  - Wording in `app/challenges/page.tsx`, `components/JoinChallengeModal.tsx`, `components/CommunityChallengeBar.tsx`: the thing is "ชาเลนจ์" everywhere (it was also "ภารกิจ" and "เควสต์"), and points are "แต้ม" (it was "XP"). The row's default heading changed with it. Join toasts on `/`, `/journey`, `/journey-simple` follow.
  - A challenge without a rule shows "บันทึกเอง" where the points were, on cards and in the window, since it cannot be finished for points.
  - The window's steps ("ทำอย่างไร") are written from how the challenge is counted (join, how a visit is counted, how many by when), not from `quest.steps`; the stored steps of the sample quests described GPS checks the product does not do. `quest.steps` and `verificationMethod` are no longer shown in the window.
  - `GET /api/quests/[id]` adds `moments` and `momentsTotal`; the window shows them as "โมเมนต์จากเพื่อนๆ ที่ร่วมชาเลนจ์นี้" when there are any, linking to `/moments?targetType=challenge&targetId=...`.
  - The window no longer shows made-up numbers: "+300 XP" for a quest with no points, "150+" participants for a quest with none.
- **Not done yet:** the moments composer cannot be opened tied to a challenge from a link (`createForType` accepts `spot`, `fair`, community only), so the window has no "share a moment" button. My Hub and `/rewards` still say "เควสต์" and "XP" in places. Emoji remain in the reward cards of the window.
- **Action for the other side:** None.
- **Status:** Open


### BE-046 · Challenges: leftovers done, then the page and its popups checked against DESIGN_SYSTEM.md (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **Leftovers from BE-045:**
  - `app/moments/page.tsx`: `createForType=challenge` opens the composer tied to a challenge; the detail window links to it ("ร่วมแชร์โมเมนต์") for a member who joined.
  - Reward codes: staff look one up and mark it used in `components/admin/QuestsManagerView.tsx` ("ตรวจรหัสรางวัล"); see `docs/API.md`.
  - `app/myhub/page.tsx`, `components/HeroSection.tsx`, `components/SpotDetailModal.tsx`: "เควสต์" and "ภารกิจ" read "ชาเลนจ์".
- **Design check** (rules in `DESIGN_SYSTEM.md`; counts are of the three files after the change: 0 texts under 11px, 0 gradients outside photo overlays, 0 emoji, 0 pillar-colored buttons, 0 solid-black selected states, 0 colored shadows, 0 `slate-400` text):
  - `components/JoinChallengeModal.tsx` was rebuilt on `DialogShell` (Esc, focus kept inside, `role="dialog"`, 520px, quiet close button). One blue primary action for the member's state; share and "เลิกทำ" are quiet. The violet gradient header, emoji, English sub-labels and bordered-box sections are gone; the pillar color stays only on the pillar dot, the progress bar and reward icons. Leaving a challenge is a quiet/secondary confirmation, not a danger one, because it can be undone.
  - `app/challenges/page.tsx`: selected filter uses the violet tint; buttons are slate or quiet, round and 40px high; card titles and the heading follow the type scale; the medal badge on the card photo is removed (two badges per card: owner and points); the cancel confirmation uses `DialogShell`.
  - `components/CommunityChallengeBar.tsx`: the same text sizes, flat tint, selected chips and button levels.
  - Already compliant, not changed: the propose dialog (`CreateEventModal`), the sign-in prompt (`RequireMembershipModal`) and `AuthModal`, all on `DialogShell`.
- **Not done yet / to decide:**
  - `DESIGN_SYSTEM.md` section 9 says points are called "XP". BE-045 renamed them "แต้ม" on the challenge screens, which matches `/rewards` and the server messages but breaks that rule as written. The owner has to choose; the rule file is unchanged until then, and My Hub and `/rewards` still say "XP" in places.
  - Filter chips do not expose `aria-pressed`. The pages were checked at desktop widths only, not at 360px. The homepage row's photo cards still carry three badges.
- **Action for the other side:** None.
- **Status:** Open


### BE-047 · The challenge window answers one question per state (owner feedback)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner pointed out that the list of places and the moments strip did not belong in the window a visitor opens to decide whether to join. `components/JoinChallengeModal.tsx` now shows, by state:
  - **Deciding (not joined):** what the challenge asks, what you get, one line on how it is counted, and the join button. Nothing else.
  - **Doing (joined, not finished):** the member's progress, "ไปที่ไหนต่อดี" (the places that count, with "นับแล้ว"), and the reward as a reminder. A challenge without a rule shows the self-noting line instead of places.
  - **Done:** the reward (the member's code for a partner challenge, or the points).
  - The moments strip is removed from the window, and with it the `moments` / `momentsTotal` fields of `GET /api/quests/[id]` and the `createForType=challenge` composer link (both added in BE-045 and BE-046). The three-step "ทำอย่างไร" list is replaced by the one line.
- **Action for the other side:** None.
- **Status:** Open


### BE-048 · Points are called XP everywhere (owner decision)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner chose "XP", as `DESIGN_SYSTEM.md` section 9 already says; the rule file is unchanged. The "แต้ม" wording from BE-045 is reverted on the challenge screens, and the same name now applies to `/rewards`, My Hub, the visit panel, the homepage toasts, the admin challenge form and the server messages of `/api/rewards` (15 files, 40 places). The older phrase "แต้มสะสม" for the balance is left as it was.
- **Action for the other side:** None.
- **Status:** Open


### BE-049 · A challenge has its own page; a card opens it and "ร่วมเลย" joins in place (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** The owner asked for the journey from a challenge card to be redesigned and left the choice between a page and a popup to me. I chose a page.
  - New `app/challenges/[id]/page.tsx`: a photo hero with the pillar tag, who runs it, the title, four facts and one main action; then "ทำครบแล้วได้อะไร" (first on a phone, sticky beside the text on a desktop), "ชาเลนจ์นี้ชวนทำอะไร" and "นับอย่างไร". After joining it shows progress and "ไปที่ไหนต่อดี" (photo cards of the places that count); when finished it shows the reward and the member's code. The places also show before joining when the challenge is about six places or fewer, because then the places are what the challenge is.
  - `app/challenges/page.tsx`: a card opens the page (`router.push`); "ร่วมเลย" joins at once with a toast, no window in between; a joined card's button reads "ไปต่อ" and opens the page; `/challenges?quest=id` redirects to `/challenges/id`. The page no longer renders `JoinChallengeModal`.
  - `components/CommunityChallengeBar.tsx`: a card opens the page; the window and its join handlers are removed, and `onJoinQuest` is no longer called.
  - `components/JoinChallengeModal.tsx` exports the texts and types the page shares with it.
- **Not done yet:** the window is still what opens from the hero and the place modal on `/`, from `/moments` and from My Hub; those should link to the page next so there is one experience. The page was checked at 1280px and 520px, not at 360px, and only signed out.
- **Action for the other side:** None.
- **Status:** Open


### BE-050 · One challenge experience; the page carries an organizer's brief (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:**
  - `components/JoinChallengeModal.tsx` is deleted. What it exported lives in `lib/questDisplay.ts` (`getQuestBrandReward`, `QuestDetail`, `describeQuestRule`, the texts and the self-noted progress helpers). `/moments` and My Hub now open `/challenges/[id]`; the hero and the place modal on `/` never opened the window, so their unused state and render were removed.
  - `app/challenges/[id]/page.tsx`, main column: "รายละเอียดชาเลนจ์" (`objective`), "ขั้นตอนการเข้าร่วม" (four steps), the places, and "กติกาและเงื่อนไข" (period, what counts, how a visit is confirmed, one count per place, who may join, how the reward is given, organizer). Steps and terms are written from the quest's `rule` by `describeQuestRule`, so they match what the server counts. A member who is doing the challenge sees the places first. The reward card reads "รางวัลเมื่อทำครบ" and says how the reward reaches the member.
  - `components/admin/QuestsManagerView.tsx`: a "รายละเอียด (ไม่บังคับ)" field saves `objective`, the longer description shown on the page.
- **Not done yet:** the sample quests have one-sentence descriptions, and some of their texts disagree with their dates (for example "ใน 14 วัน" on a quest that runs three months); a title word in a rule shows as stored (`"hyrox"`). Both are data to edit in the admin form.
- **Action for the other side:** None.
- **Status:** Open


### BE-051 · Descriptions for the running sample challenges; goals now match their rules (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:**
  - `data/mockData.ts`: the 12 running sample quests have a description of three to five sentences (`objective`) and a one-line goal (`targetGoal`) that says what their rule really counts (no "partner cafes", "14 days" or GPS). Title words in rules are spelled as shown to people ("HYROX", "Board Game").
  - `lib/questLifecycle.ts` (`refreshSeedQuestTexts`, `SEED_QUEST_TEXT_VERSION`) and `lib/db/adapters/jsonAdapter.ts`: a store takes the seed's goal and description for its seed quests once per text version (kept as `questSeedTextVersion` in `data/discovery_content.json`). This overwrites a goal or description staff edited on a sample quest; quests staff created are not touched. Raise the version when the seed texts change again.
- **Not done yet:** the three ended sample quests keep their old texts. Titles are unchanged, so "Cafe Hunter 5 … ย่านอารีย์-ทองหล่อ" still names an area its rule does not limit to.
- **Action for the other side:** None.
- **Status:** Open


### BE-052 · Challenges walked end to end in a browser; eleven gaps closed (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **How it was checked:** a headless browser at 360px, signed in with a throwaway member (deleted afterwards), went list → join → challenge page → place page → finish → My Hub → rewards → homepage row. No page overflows at 360px and the browser logged no errors.
- **What changed / what is needed:**
  1. **A partner's reward needs proof.** `minEvidenceOf` (`lib/social/questProgress.ts`): a challenge whose reward is `brand_partner` counts a photo moment or a host check-in, never a bare "มาที่นี่แล้ว", whatever its rule says. Before this, three presses gave a partner code.
  2. **The practice "verify" window is gone.** `components/VerifyQuestModal.tsx` is deleted; My Hub's buttons open the challenge page.
  3. **Badges exist.** `lib/social/questFinishes.ts` records a finished challenge once (`data/quest_finishes.json`, gitignored). `GET /api/rewards` adds `finished: [{ questId, title, badgeLabel, finishedAt, voucherCode, voucherUsedAt, rewardTitle }]`; My Hub shows them as "เหรียญของคุณ" with the reward code. A badge stays if the member later leaves the challenge.
  4. **Phone order.** A member who is doing a challenge sees the places before the reward card.
  5. **Finishing is announced.** The read that first sees a finished challenge (`/api/rewards`, `/api/quests/[id]`, or marking a visit) issues the partner code and sends a notification of the new type `'challenge'` (`href` to the challenge page; `components/NotificationBell.tsx` follows `href`).
  6. **Shared links carry the challenge.** `app/challenges/[id]/layout.tsx` sets the title, description and preview photo.
  7. **Out of time.** A member whose challenge ended unfinished is told how far they got.
  8. My Hub's development strip stacks at phone width.
  9. Leaving from a list card is a labelled "เลิกทำ" button.
  10. The home pages (`/`, `/journey`, `/journey-simple`), `HeroSection` and `SpotDetailModal` lost their unused join callbacks, the joined-titles state and the browser keys behind them; `CommunityChallengeBar` no longer takes `onJoinQuest` or `joinedQuestTitles`.
  11. Seed quest `1` is titled "Cafe Hunter 5: ตามรอย 5 คาเฟ่ที่ยังไม่เคยไป", which matches its rule; stores take the new title once (`SEED_QUEST_TEXT_VERSION` 3).
- **Not done yet:** badges are not on the public profile. The admin code check and challenge form, and a challenge counted by a host's check-in, were not exercised (they need an admin and a host). Moments posted for a partner challenge are not reviewed by anyone, so a photo of anything still counts.
- **Action for the other side:** None.
- **Status:** Open


### BE-053 · Challenge categories by topic, managed in the admin master data; badges on the public profile (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:**
  - **Categories.** A challenge's `category` is now an id of the master data collection `questCategories` (admin console → categories), not one of the four meetup moods. Built in: `cafe_food`, `active_outdoor`, `art_learn`, `wellness`, `social`, `travel` (`MASTER_QUEST_CATEGORIES` in `data/masterHub.ts`). The four entries the collection had before (`general`, `exp_only`, `badge_only`, `exp_badge`) described reward mechanics, were used by no challenge, and are dropped from `data/master_data.json` on load. `ChallengeQuest.category` is a `string`; a quest saved with an old id is shown under today's (`questCategoryId`, `LEGACY_QUEST_CATEGORIES`). Seed quests carry the new ids (`SEED_QUEST_TEXT_VERSION` 4).
  - `components/admin/QuestsManagerView.tsx` and the member's propose form (`components/CreateEventModal.tsx`, challenge type) list the active categories from the master data; `/api/admin/quests` and `lib/members/submissions.ts` accept only those.
  - `app/challenges/page.tsx`: a row of category chips filters the list (a category with nothing to show is left out); `GET /api/quests?category=` takes the same ids. `app/challenges/[id]/page.tsx` names the category beside the organizer.
  - **Badges.** `GET /api/members/[id]` adds `challengeBadges: [{ questId, badgeLabel, title }]`; `app/profile/ProfileScreen.tsx` shows them as "เหรียญจากชาเลนจ์".
- **Checked through the API** (development leaves the admin console open to the local developer): staff create a challenge with a category, a description and a rule; an old category id falls back; a host's check-in finishes a challenge; staff look a partner code up (any letter case), mark it used, and the member sees it used; the public profile lists the badges. Test data was removed.
- **Not done yet:** the admin screens themselves were not clicked through in a browser. The list page now has two filter rows (category, and Official / partner); the second could go.
- **Action for the other side:** None.
- **Status:** Open


### BE-054 · The top of the challenges list is two rows, so the cards start in the first screen (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude` (not committed yet)
- **What changed / what is needed:** `app/challenges/page.tsx` had four stacked blocks above the cards (a boxed heading, a rewards strip, the category row, the Official / partner filter with search, then a heading with the open / ended switch). Now:
  - Row 1: the heading and one line, with "เสนอชาเลนจ์" and one quiet link beside it ("ดูของรางวัล" signed out; the member's XP and how many challenges they are doing when signed in).
  - Row 2: the category chips, the open / ended switch with its counts, and the search field (one row on a desktop, two on a phone).
  - Removed: the rewards strip, the Official / partner filter (who runs a challenge is on every card), the "sign in to start collecting XP" button, the heading above the cards (its count is in the switch) and the box around the list.
  - Measured: the first card starts at 231px at 1280 wide (it was about 486px) and at 304px at 360 wide; no horizontal overflow.
- **Action for the other side:** None.
- **Status:** Open


### BE-055 · A tighter challenge card on the list (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed / what is needed:** the card in `app/challenges/page.tsx` now reads top to bottom: the photo edge to edge (16:10) with one white pill for the XP, who runs it, the title, the one-line goal, the partner's reward when there is one, the member's progress when they joined, then "N days left · N people" beside the one button. Removed from the card: the colored stripe, the "Official • …" badge with a crown (the organizer was named twice), the generic reward pill on platform challenges, the date range (days left says it; the range is on the challenge page) and the divider. An ended card shows its photo in grey with "จบแล้ว".
- **Action for the other side:** None.
- **Status:** Open


### BE-056 · The challenge card keeps its own look (owner feedback on BE-055)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed / what is needed:** BE-055 turned the card into a photo-first card like the place and event cards. The owner preferred the earlier look because it is more interesting and unlike the other cards, and asked only for it to be tidier with fewer icons. `app/challenges/page.tsx` is back to that look: the violet stripe, the owner pill and the XP pill, the inset photo, title and goal, the reward pill, dates with people and days left, and a footer with the organizer and the one button. Tidied: one pill size, the photo at 16:10, text sizes from the scale, no medal badge on the photo. Icons removed: the crown in the owner pill and the gift in the platform reward pill; the XP bolt and the partner's ticket stay because they carry meaning. A self-noted challenge shows no reward pill.
- **Action for the other side:** None.
- **Status:** Open


### BE-057 · Shorter challenge card, the reward on the photo, and a reward required on every challenge (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed:** `app/challenges/page.tsx`: the card is about 11% shorter (435px → 385px at 1440px wide; 8px gaps, the reward row gone, buttons 36px tall with a hidden edge that keeps the 40px touch target). The reward (`brandReward.title`) moved from its own row under the title to a strip on the lower edge of the photo and now shows on every card: amber with a ticket for `brand_partner`, violet with no icon for `hub_central`, grey when ended. `/api/admin/quests`: `create` now returns `400` without `brandReward`, and `update` returns `400` for `brandReward: null` (it used to clear the reward). The same now holds for `rule`: required on `create`, not removable on `update`, and `set_status active` returns `400` for a challenge without one; the admin form requires it. The two challenges nothing can check (`2` Step Count 30Days, `comm-quest-4` Morning Yoga 7 Days) are now `draft` in the seed and the store, so they are off the public list but still in the admin console. The default Hub reward text is now "สะสม XP แลกของรางวัลที่ชอบ" (seed, store, admin form default, `getQuestBrandReward` fallback). `docs/API.md` updated.
- **Action for the other side:** None.
- **Status:** Open


### BE-058 · The challenge journey, walked as a new member and filled in (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed:** I walked the journey at 390px with a throwaway account (meet, decide, start, go, between visits, finish, after) and filled the gaps. `app/challenges/[id]/page.tsx`: a finished challenge shows a "ทำสำเร็จแล้ว" line with the date, the places the member went with their own photos ("ความทรงจำจากชาเลนจ์นี้") and one challenge to go on with. `components/VisitPanel.tsx`: the challenge line links to the challenge's own page, says "ชาเลนจ์" (it said "ภารกิจ"), and for a member who joined shows their progress and whether this place has counted. `app/myhub/page.tsx`: a "ชาเลนจ์ที่ทำอยู่" section under the header (up to two, with progress, days left and "ไปต่อ"). `GET /api/quests/[id]`: `mine.finishedAt`, `mine.memories`, `next`, and places in the member's province first. `GET /api/auth/member/profile`: `publicView.challengeBadges`, so badges show on the member's own profile. Data: `comm-quest-1` (Bangkok Coffee Trail) counts cafes in กรุงเทพฯ only; it counted every cafe in the country. `docs/API.md` updated.
- **Action for the other side:** None.
- **Status:** Open

### BE-059 · Moments page: edges lined up, and the way on from a post (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed:** `app/moments/page.tsx` only; no API change. The stories rail (stories, then the "ไฮไลต์" tiles, unchanged in content) now sits inside the feed column, so the rail, the share box and the posts share one left and right edge at every width (measured at 390, 820 and 1440px). On a phone the rail and the share box run edge to edge like the posts. The feed column fills its grid column on desktop (it was 680px pushed to the right). A post tied to a place, event or challenge ends with one row linking to that page (`/spots/[id]`, `/community/[id]`, `/fairs/[id]`, `/challenges/[id]`); the row's second line names the challenge a visit there counts toward, read from `GET /api/visits?targets=`. After posting a moment tied to a place or event, a member who joined a challenge that counts it sees "นับในชาเลนจ์ … แล้ว 1 จาก 5" with a button to the challenge (read from `GET /api/visits?mine=1`); other posts keep the plain message. "ชาเลนจ์แนะนำ" (the block in the feed on phones and the one in the side column) shows photo cards like the challenges list: the challenge photo, the XP pill on it, the reward strip on its lower edge, then the title; each card opens `/challenges/[id]` (they all opened `/challenges`).
- **Action for the other side:** None.
- **Status:** Open


### BE-060 · Moments: the share form, photo review for challenges, and stories in the admin console (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed:** **Share form** (`app/moments/page.tsx`): a moment is tied to a place, a community event or a fair only; a challenge is no longer a choice, because such a moment counted toward nothing. Picking a place shows "ที่นี่นับในชาเลนจ์ …" before posting, and with nothing picked a line invites the member to pick one. Before the member types, the form lists what is on their account ("ที่คุณเข้าร่วมหรือบันทึกไว้"): events already attended first, then saved places, saved events, and what is still ahead; four show, "ดูทั้งหมด N" opens the rest in a scrolling box, and while typing the member's own matches come before the catalog's (`GET /api/spots?ids=` is new, for the saved places). A tap outside the form closes it only while it is empty. **Posts:** the place name shows once, as a link in the author line to its own page (the pill opened a window that fell back to the first place in the catalog when nothing matched); the row under the caption says what a visit there counts toward, or "ดูที่เที่ยวนี้". The author sees "ทีมงานตรวจรูปแล้ว โมเมนต์นี้ยังไม่นับในชาเลนจ์" on a moment staff did not count. Messages sit above the bottom bar on a phone and carry no emoji. Removed from the file: the sample member and check-in lists, the older per-type form code and the bookmark copy in the browser (bookmarks were already on the account). **Server:** `Moment.evidenceRejected`; a rejected moment is not a visit (`lib/social/visits.ts`); notification type `evidence`; `storiesForStaff` and `moderateStory` in `lib/social/stories.ts`; new `/api/admin/stories`; `/api/admin/moments` gains `filter=evidence`, `countsToward`, `reject_evidence` and `accept_evidence`. **Admin console** (`components/admin/MomentsManagerView.tsx`): a "ใช้นับชาเลนจ์" filter, the evidence section in the moment drawer, and a "สตอรี่" view (hide, restore, remove). `docs/API.md` updated ("Evidence review and story moderation"). Checked through the API with a throwaway member: progress 1/3 after posting, 0/3 after a rejection, 1/3 after accepting; a story hidden by staff leaves the public list.
- **Action for the other side:** None.
- **Status:** Open


### BE-061 · Fixes found by walking the signed-in share form and the admin moments manager in a browser
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed:** (1) `app/moments/page.tsx`: when a place counts toward several challenges, the share form and the row under a post name the challenge the member has joined first (it used to name the first one in the list, which could differ from the notice shown after posting); the line wraps to two lines on a phone instead of being cut. (2) Same file: a story caption typed while the photo is still being prepared is kept. (3) `DELETE /api/auth/member/account` also deletes the uploaded files of the member's moments, stories and avatar (`lib/media/cleanup.ts`); a file that remaining content still shows is kept. `removeStoriesOf` now answers with the removed images.
- **Not changed:** deleting one moment or story, and stories that run out after 24 hours, still leave their file in storage.
- **Action for the other side:** None.
- **Status:** Open


### BE-062 · My Hub: fixes from a browser walk (owner request, first of two parts)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **What changed (`app/myhub/page.tsx` only):** (1) the meetup and fair lists are ordered by date: what is coming first, nearest on top, then what has passed, latest first. (2) Challenges sit on the calendar on their real `startDate` and `endDate` (they used made-up days in September 2026); a challenge that runs over several months shows in each of them, and one without an end date is left off the calendar. (3) The calendar tab no longer carries a count (it was the count for the whole year next to a month view). (4) The empty list under "ทั้งหมด" says there is nothing yet, instead of "no past activities". (5) Wording: "ทริปพิกัด" is "ทริปชวนเพื่อน" as in the Spot Buddy form, the tab is "ชาเลนจ์ & XP", "Official •" is gone from challenge cards, the calendar note about challenges no longer names September.
- **The top of the page is shorter (owner request, same day):** the name, the three numbers and the calendar or list switch share one row; "ชาเลนจ์ที่ทำอยู่" and "กิจกรรมที่คุณจัด" sit side by side on a wide screen and show two rows each with "ดูทั้งหมด"; the development note is one line of text under them; a hosted event saved with a date like `2026-10-12` reads "12 ต.ค. 2569". The old line under the title and the hint beside the switch are gone.
- **Hosted events that have ended, and a shorter calendar (owner request, same day):** "กิจกรรมที่คุณจัด" at the top lists only events still to run, nearest first, and disappears when there is none; an ended one stays in the past list with its "โฮสต์" badge, where the host gets a "รายชื่อ" button (the check-in list) in place of "รีวิวโฮสต์"; "เคยเข้าร่วม" no longer counts events the member ran. Calendar day cells are 70px tall (were 95px), 64px on a phone (were 75px).
- **Host and guest are apart, and the calendar and the list show the same groups (owner request, same day):** the switch at the top has a third choice, "งานที่จัด", shown only to a member who has hosted something: events still to run (people count, team chat, check-in, review status) and events already run (the list of who came). The lists under "รายการ" and the numbers in the header are about events the member goes to as a guest only. The calendar still shows everything, with hosted events as their own amber group and filter. "ทริปชวนเพื่อน" is a tab in the list as it is a group on the calendar, and a trip is told by `spotId` (it used to be guessed from words in the title). The box at the top shows only the next hosted event with a link to the rest. A calendar day shows up to four events in time order with their start hour and the week grows to fit; a fuller day shows three and "อีก N รายการ"; on a phone a busy day shows a count next to its dots.
- **Found, not changed:** events the member only saved (`savedEventIds`) are shown nowhere in My Hub.
- **Left as it is, for the owner to decide:** a phone opens on the list and a wide screen on the calendar (written that way on purpose); a joined fair has a "ดูบัตร" button. The second part (a shorter page with the next meetup on top, XP in the header, a first step for an empty account, a shorter signed-out page) is not started.
- **Action for the other side:** None.
- **Status:** Open


### BE-063 · My Hub rebuilt around one schedule (owner request, after a clickable draft)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **Why:** the owner found three top views, five list tabs and their own filters too much for one page. The page now answers one question, "where do I go next", with one list ordered by date.
- **What changed (`app/myhub/page.tsx`, about 4,300 lines down to about 3,100):**
  - One schedule ("กำหนดการ") holds every dated thing the member goes to as a guest: meetups, buddy trips, fairs, and the last day of each joined challenge. It is ordered by date under a month heading, with "กำลังจะมาถึง / ที่ผ่านมา" and one row of group filters.
  - The month grid is a second way to look at the same schedule ("รายการ / เดือน"), with the same filters. The old "ตลอดทั้งปี" switch and the colour legend are gone. "วันนี้" goes to the real day (it was fixed to 26 September 2026).
  - Each event is a row: day, a small photo, group and status labels, title, time and place, then the same buttons the cards had (ticket, chat, share a moment, review the host, "I did go", the more menu with cancel). The rule for which buttons show is now written once.
  - The top shows the next event and the challenge under way, each with its photo. The three number pills are gone.
  - Events the member runs appear only under "งานที่จัด" (owner decision). The switch "ของฉัน | งานที่จัด" shows only to a member who has hosted; a guest sees no switch.
  - Saved places and the challenges and rewards view are no longer tabs. Two cards under the schedule open them, with a link back.
  - Removed: the community and fair list blocks with their photo cards, the sub tabs, the attended or not-attended sub filter, and the helpers only they used. Old links with `?tab=community`, `?tab=fairs` or `?type=` open the schedule with that filter.
- **Not done:** events a member only saved still show nowhere; the signed-out page is unchanged; several state names in the file keep their old words (`hubMainMode: 'calendar' | 'categories'`).
- **Action for the other side:** None.
- **Status:** Open
- **BE-063, later the same day: two columns on a wide screen (owner request).** From 1024px the page is a narrow left column that stays in view (name and the "ของฉัน | งานที่จัด" switch, the challenge under way, saved places with small photos, challenges and XP, things sent to staff) and a wide right column for time only (the next event, then the schedule, the host side, or a view opened from the left). On a phone the same pieces fall into one column in this order: name, next event, challenge under way, schedule, saved places, XP. Rows under the month grid are in date order.
- **BE-063, later still: a member with nothing yet, and a leak of saved lists between accounts.** (1) With an empty schedule the page shows "เริ่มที่ไหนดี" in place of filters full of zeros: up to four meetups that are open now (`GET /api/events?type=community&status=recruiting`, soonest first), then three doors (meetups, fairs, challenges). (2) On the left the challenges card comes before saved places in every state; with a challenge under way one card carries the XP, the challenge and the link to the rest. (3) **`lib/useMyActivity.ts` behaviour change:** the browser copy of the saved lists (`favorites`, `favorite_spots`) is now marked with the account it belongs to (`cch_saved_owner`) and emptied on sign-out or when another member signs in. Before, the previous member's saved places and events in the same browser were added to the next member's account on first sign-in. Hearts made while signed out are still added to the account once, as before.
- **BE-063, end of day: a review of every state, and the signed-out page.** Walked signed out, signed in with nothing, with only a challenge, with only events, and with everything, at 1280px and 360px: no sideways overflow, no broken image, no console error. (1) The signed-out page is rewritten to one screen: one sentence on what My Hub is, sign in and sign up, a link to browse first, and a labelled sample of the schedule (it replaces the long page with English feature names). (2) Events a member saved and has not joined now show in a card on the left, "งานที่บันทึกไว้" (`GET /api/events?type=all&limit=100`, matched to `savedEventIds` in the browser). (3) On a phone the open view (host side, saved places, challenges) comes before the challenge card. (4) The challenges view uses two or three columns, and its words match the rest: "ชาเลนจ์ของฉัน", "ทำครบแล้ว", "เหรียญ", "ของรางวัล"; the saved places view says "ที่เที่ยว" where it said "พิกัด". (5) Text links have a taller press area.


### BE-064 · Joining a challenge: one place to decide, and buttons that say where they lead (owner request)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-13 · `claude`
- **Why:** the owner found the path confusing: "ร่วมเลย" on a list card joined at once and turned into "ไปต่อ" with only a passing toast, and the challenge page then offered "ไปกันเลย". Three buttons with near-identical names did three different things, and a member could join without seeing the rules.
- **What changed:**
  - `app/challenges/page.tsx`: a list card no longer joins or leaves. Its button is "ดูชาเลนจ์", or "ทำต่อ" once the member has joined (the card already shows their progress). Leaving is on the challenge page only.
  - `app/challenges/[id]/page.tsx`: joining happens here, with "ร่วมชาเลนจ์นี้". After joining the page itself says "ร่วมชาเลนจ์นี้แล้ว" with the first thing to do (the evidence hint for that challenge), in place of a toast. The main button of a joined challenge is "ดูที่ที่นับได้ N แห่ง" and goes to the list of places on the same page (`#places`); it used to be "ไปกันเลย" and opened the first place. The places heading is "ที่ที่นับในชาเลนจ์นี้" in both states; the heading for the next challenge after finishing is "ลองชาเลนจ์ถัดไปไหม".
  - `app/myhub/page.tsx`: "ไปต่อ" is "ทำต่อ". Across the site the two verbs are now "ร่วมชาเลนจ์" (once) and "ทำต่อ" (afterwards).
- **Left in the code, unused:** the join and leave handlers and the leave dialog in `app/challenges/page.tsx`.
- **Action for the other side:** None.
- **Status:** Open
- **BE-064, later the same day (owner decisions).** (1) A joined card on the list says "กำลังทำอยู่" (a quiet violet button), since "ทำต่อ" was not understood; My Hub says "ดูความคืบหน้า". (2) On the challenge page a joined member no longer gets a button to the places (they are listed right below); the action there is "ยกเลิกการทำชาเลนจ์", which opens a dialog asking why, with five choices and an optional note. The reason is optional. `POST /api/quests/join` takes `reason` on leave and writes it to the audit log as `quest.leave` without the member's name; `leaveQuest(questId, reason?)` in `lib/useMyRewards.ts`. (3) `app/moments/page.tsx`: the row under each post ("นับในชาเลนจ์ …", "ดูงานนี้") is removed; the place or event name at the top of the post is the way on. The feed no longer asks `/api/visits?targets=` for every post, only for the place picked in the share form.
- **BE-064, last change of the day (owner request):** on the challenge page "ที่ที่นับในชาเลนจ์นี้" sits right after the reward box, in the same column, on every screen size (it used to lead the other column while a member was doing the challenge). The reward column is no longer pinned while that list is shown. "ยกเลิกการทำชาเลนจ์" is a quiet button, so stopping is not the loudest thing on the page.

### BE-065 · My Hub: a joined fair shows directions, not a ticket (owner decisions)
- **From → To:** Claude Code → Frontend
- **Date / branch:** 2026-10-14 · `claude`
- **Why:** fairs are public venues; we issue no ticket for them. The "ดูบัตร" button opened a QR ticket with a sample number (`CCH-FAIR-0201`) that a member could take to the gate.
- **What changed (`app/myhub/page.tsx` only):** for a fair, "ดูบัตร" is now "เส้นทาง", which opens Google Maps on the event's pin (`latitude`, `longitude`), or a search for `location` when it has none. This applies in the "ถัดไปของคุณ" box and in the schedule rows. Meetups keep their ticket.
- **Settled (owner, same day):** My Hub opens on the list on every screen size (already how the code works; the BE-062 note that a wide screen opens on the calendar is out of date). The BE-062 "second part" was built in BE-063 (next event on top, XP on the challenges card, a first step for an empty account, a one-screen signed-out page).
- **Later the same day, the fair row (owner request):** "เส้นทาง" shows only when the fair has a map pin (60 of 100 fairs); the other 40 name only a province, so the button is "ดูรายละเอียด" to the fair page. The second button on a fair row ("งานแฟร์" upcoming, "ข้อมูลงาน" passed) is removed, since the photo and title already open the fair page. The line under the title and in "ถัดไปของคุณ" leaves out "ไม่ระบุเวลา" and the "(ดูสถานที่ในรายละเอียด)" placeholder. Walked signed in at 1280px and 360px with one fair of each kind.
- **End of day, a quieter schedule (owner approved a clickable draft):** the only solid black button on My Hub is the main one in "ถัดไปของคุณ". Its date box and the picked "ทั้งหมด" filter are light blue (were black). Each schedule row has at most one small white button: "ดูบัตร" (meetup), "เส้นทาง" (fair with a pin), "จัดการตี้" (host), "แชร์โมเมนต์" (attended); a challenge, a cancelled or missed event and the row of the next event have none (the next event says "ถัดไป อยู่ด้านบน"). Chat, the host's list of who came and the host review moved into ⋯; "ดูบรรยากาศ", "ไปร่วมจริง", "ชาเลนจ์อื่น" and "ดูข้อมูลงาน" left the rows (the ⋯ menu already restores a cancelled or missed event). The coloured label is a dot and a short word ("งานแฟร์"); a challenge row says "วันสุดท้ายของชาเลนจ์ · ไปแล้ว N จาก M" instead of its description. Filter chips with 0 are hidden unless picked. Walked at 1280px and 360px with two meetups, two fairs and a challenge; past rows were not walked with data.
- **Fair page (`app/fairs/[id]/page.tsx`, owner request):** the dark "บันทึกกำหนดการใน My Hub แล้ว" box shown above the photo to a member who joined is removed, so a joined fair opens on the same page everyone sees. Its buttons were duplicates or misleading: "ดู Expo Pass" opened the first meetup group's pass even when the member was in no group, "ชวนเพื่อนเดินงาน" repeats "สร้างกลุ่มนัดเดินงาน" in the groups section (where each group's pass also lives), and it made up "10:00 - 21:00 น." when a fair has no time. The unused `isJoined`, `CheckCircle2` and `MessageCircle` went with it.
- **Fair page shows the member's real My Hub state (owner request):** the "บันทึกงานนี้ลง MyHub" card button and the "บันทึกงานนี้" button by the breadcrumb read and wrote `favorite_events` in the browser, a key nothing else reads, so a joined fair still said "บันทึกงานนี้ลง MyHub" and saving here never reached the account. Both now mean "in My Hub": an upcoming fair joins or leaves the member's schedule (`activityActions.join` / `leave`); an ended fair is kept as a saved event to follow the next round. The hearts on the related fairs below save on the account (`activityActions.setSaved`). A signed-out tap still asks to sign in and finishes the step after. `app/community/page.tsx`, `app/community/[id]/page.tsx`, `app/fairs/page.tsx`, `app/page.tsx` and the journey pages still use `favorite_events`; not changed.
- **Server fix, fairs had 10 seats:** `atomicJoinEvent` (`lib/db/adapters/jsonAdapter.ts`) treated a missing `maxParticipants` as 10, and 76 of the 100 fairs have none, so the 11th member got "เต็มจำนวนแล้ว" and the fair was marked `full`. A fair (`public_venue`) now has no seat limit and is never marked `full`; meetups keep their limit. Two fairs marked `full` during testing were set back to `active`. `docs/API.md` updated. The database object lives across code reloads in development, so the dev server had to be restarted for this to apply.
- **2026-10-15, same cards everywhere (owner request):** My Hub's "ที่เที่ยวที่บันทึกไว้" and "ชาเลนจ์ของฉัน" views drew their own cards, unlike /spots and /challenges. Saved places now use `SpotCard` (its heart takes a place off the list); challenges use the new `components/ChallengeCard.tsx`, which is the /challenges card moved out of `app/challenges/page.tsx` unchanged, and /challenges uses it too. The old My Hub cards had a "ชวนเพื่อนไปที่นี่" button on a saved place; that is now on the place page only, and the Spot Buddy dialog in My Hub is no longer opened from anywhere (left in the file). Both grids are 1/2/3 columns to fit the right column.
- **2026-10-15, challenges leave the list until their last week (owner decision):** a running challenge sat in the list on its last day, so one running now read like a December event. The list (and its "กำลังจะมาถึง" count and chips) now leaves a challenge out until its last 7 days, when it comes back as "วันสุดท้ายของชาเลนจ์ · ไปแล้ว N จาก M"; until then it is in the "ชาเลนจ์ของฉัน" card on the left. The month view still shows the whole span. Walked with a challenge 78 days from its end (left out); a challenge in its last week was not walked with data.
- **2026-10-15, My Hub is "what I'm doing" and "what I'm interested in" (owner decision; the page is not "where do I go next"):** the right column is now, top to bottom, "กำลังทำอยู่" (challenges under way, up to two rows with photo, progress and days left, XP in the heading, "ดูทั้งหมด N" when there are more; without one, a short "ชาเลนจ์ & XP" card), "ถัดไปของคุณ", then "กำหนดการ". The left column is headed "ที่สนใจ" and holds saved places and saved events; the challenge card left it. On a phone: name, กำลังทำอยู่, ถัดไปของคุณ, กำหนดการ, ที่สนใจ. Walked at 1280px and 360px with one challenge, saved places and joined events. Not built (offered, owner to choose): a "นับในชาเลนจ์" mark on schedule rows and saved places that count toward a challenge under way.
- **2026-10-15, the next event leaves the list; challenges that have not started (owner decisions):**
  - The schedule list no longer repeats the event shown in "ถัดไปของคุณ"; "กำลังจะมาถึง" and the chips count what the list shows, and with nothing else it says "ยังไม่มีนัดอื่นหลังจากนี้". The month view still shows it. The "ถัดไป อยู่ด้านบน" mark is gone.
  - **New derived field `startsInDays`** on challenges (`lib/questLifecycle.ts`, type in `data/mockData.ts`, `docs/API.md`): days until `startDate` while a challenge has not started. Before, a challenge starting next month read as running ("เหลือ N วัน") although visits before its start do not count.
  - My Hub: a joined challenge that has not started is not in "กำลังทำอยู่"; it sits in the schedule on its first day as "วันเริ่มชาเลนจ์ · ไปตั้งแต่วันนี้ถึงจะนับ" and moves up once it starts. `ChallengeCard` says "เริ่มในอีก N วัน" and the challenge page "เริ่มในอีก N วัน นับตั้งแต่วันเริ่ม".
  - **Bug fixed on the way:** My Hub read challenge dates only in Thai form, so a challenge created in the admin console (ISO `2026-12-31`) was dropped from the schedule and month view; it now uses `parseQuestDate`.
  - Walked with a throwaway challenge starting in 5 days (created, joined, deleted). The dev server had to be restarted for the new field (the database object keeps old code across reloads). Not changed: the "กำลังทำ N" count in the /challenges header still includes a joined challenge that has not started.
- **2026-10-15, the "ชาเลนจ์" chip is back, and counts are the rows in the list (owner decisions):** every count ("กำลังจะมาถึง", "ทั้งหมด", each chip) is the number of rows the list shows; what is above it ("กำลังทำอยู่", "ถัดไปของคุณ") is not counted again. The "ชาเลนจ์" chip shows for a member with joined challenges even at 0; its list holds a challenge on its first day (not started) and in its last 7 days. At 0 it says the challenges are in "กำลังทำอยู่" and when they come to the list, without the meetup and fair buttons. Walked with one challenge under way (chip at 0).
- **2026-10-15, /challenges as a dated list (owner approved a clickable draft):** new `components/ChallengeList.tsx`. The date column at the start of a row was later removed (owner: four dates per row; the month headings stay as they are); the whole period now leads the right side in bold with a calendar icon, as the dates decide whether a member can take part, followed by the days left or "เริ่มในอีก N วัน" and the people. Photos are 176×99 (16:9) on a wide screen and 72×72 on a phone (owner asked for bigger photos); on a phone a title may take two lines. Open challenges fall in two groups with month headings like the My Hub schedule: "เริ่มแล้ว" by closing day (the date column says "ปิด", soonest first) and "กำลังจะมาถึง" by starting day ("เริ่ม", hidden when empty); the "จบไปแล้ว" tab is one group, latest first. A row: date, photo, organizer, title, goal, XP and reward, and on the right the days left and people, or "เริ่มในอีก N วัน"; a joined one shows "กำลังทำอยู่ N/M" and a progress bar. The whole row opens the challenge; no solid button in a row. A "รายการ | การ์ด" switch beside the open/ended tabs keeps the cards (`ChallengeCard`, unchanged, paged as before); the list shows everything that matches, unpaged, and the choice is kept in the browser (`cch_challenges_view`). My Hub's "ชาเลนจ์ของฉัน" view uses the same list. Walked at 1280px and 360px with a throwaway challenge starting in 5 days (deleted after).
- **2026-10-15, five sample challenges that have not started, made through the admin form (owner request, to find what the form lacks):** ทะเลหมอกต้นหนาว (1 พ.ย. 69 – 31 ม.ค. 70, 2 viewpoints or nature places), ตลาดนัดสุดสัปดาห์ (7 พ.ย. – 6 ธ.ค. 69, 3 markets), ส่งท้ายปีที่งานแฟร์ (1–31 ธ.ค. 69, 2 fairs), ไหว้พระรับปีใหม่ 5 วัด (1–31 ม.ค. 70), เพื่อนใหม่ต้นปี (5 ม.ค. – 28 ก.พ. 70, 2 meetups with host check-in). All Hub rewards, no partner. Typed field by field into /admin → ชาเลนจ์ & ภารกิจ → สร้างภารกิจ, then published with the row button; one cover changed with the edit form. Listed for removal in `docs/LAUNCH_CHECKLIST.md`. Rows in `ChallengeList` now also show the whole period ("1 พ.ย. 69 – 31 ม.ค. 70").
  - **What the form lacks (found while filling it):** (1) the cover is a URL field with no preview and no upload, so a wrong photo went in unseen; (2) the place category for counting is free text with internal codes (`viewpoint`, `market`, `temple`) and no list to pick from; (3) no count of how many places or events match the rule before saving (`market` also holds shopping malls, which needed the extra word "ตลาด"; I first reported only 5 places named ตลาด, from a sample of 100 of the 2,043 places: there are 60); (4) "จำนวนเป้าหมาย" sits apart from the counting rule it belongs to; (5) no preview of how the challenge will look on /challenges; (6) the vibes places are grouped by (for example "ภูเขา & ทะเลหมอก") cannot be used in a rule, only the raw category.
- **2026-10-15, /challenges filters like a catalog, and the admin form fixed (owner request):**
  - **/challenges** (`components/ChallengeFilters.tsx`): topics are a row of icons with a short name and a count, the picked one underlined, scrolled with an arrow on a wide screen (topics with nothing in them hide). The other filters fold into pills that open a short menu and turn violet once set: "ช่วงเวลา" (เปิดอยู่ทั้งหมด, เริ่มแล้ว, กำลังจะมาถึง, จบไปแล้ว, with counts; it replaces the open/ended switch), "ทำอย่างไร" (ไปที่เที่ยว, ร่วมตี้, ไปงานแฟร์, from `rule.targetTypes`), "ของรางวัล" (from a shop or brand, or XP and badges from the Hub), and "ที่ฉันทำอยู่" for a signed-in member; "ล้างตัวกรอง" resets them. Approved as a clickable draft first.
  - **Admin form** (`components/admin/QuestsManagerView.tsx`), all six gaps above: the cover uses `ImageField` (upload, compressed, with a preview); categories are picked by name (place categories from `SPOT_CATEGORY_OPTIONS`, event moods by Thai name); places can also be limited by the vibes members see on /spots (new `rule.vibes`, matched in `lib/social/questProgress.ts`); a live line says how many places or events the rule counts, with five examples, and turns amber when there are fewer than the target (new admin action `preview_rule`); "ต้องไปให้ครบ" (the target number, with its unit) moved into the counting section; "โฮสต์เช็กอินให้" is offered only for meetups; the bottom shows the row as it will look on /challenges. The dialog is wider. Walked in the real form: picking "ภูเขา & ทะเลหมอก" counts 75 places.
- **2026-10-15, challenge groups renamed, starting-soon first (owner decisions):** "เริ่มแล้ว" is now "ทำได้เลยตอนนี้" and "กำลังจะมาถึง" is "เริ่มเร็วๆ นี้", in the list and in the "ช่วงเวลา" menu. Challenges that start soon moved from the bottom of the list to a strip of small cards above it (photo, period, title, "เริ่มในอีก N วัน", XP or "ร่วมแล้ว", reward), scrolling sideways, so a new challenge is seen even when many are running. Walked at 1280px and 360px. Later the same day (owner, after Meetup's "For you"): the strip has "ดูทั้งหมด", which sets "ช่วงเวลา" to "เริ่มเร็วๆ นี้" and shows them as a full dated list (the strip only shows while challenges are also running), and an arrow on a wide screen that scrolls it. My Hub's list has no "ดูทั้งหมด" (no `onBrowseAllSoon`).
- **Found, for the owner:** 37 of the 100 fairs are runs and trail races, labelled "งานแฟร์ & นิทรรศการ".
- **Still sample:** the meetup ticket number is the same placeholder (`CCH-2026-0101`) for every event in the "ถัดไปของคุณ" box.
- **Action for the other side:** None.
- **Status:** Open

### BE-066 · Meetup page: who is going, and a phone layout with a bottom bar (owner decisions)
- **2026-10-16, after comparing our meetup page with Meetup's event page (draft approved by the owner):**
  - **"ใครจะไปบ้าง" (phones and desktop):** one row under the meeting point and map: host first, 3 people on phones and 5 on wider screens, then an "อีก N คน" tile; "ดูทั้งหมด" opens the full grid. Each person links to their profile. Component `components/EventAttendees.tsx`, data from the new `GET /api/events/{id}/attendees` (see `docs/API.md`). The owner decided the list is open to everyone and members cannot hide from it; only name, photo and a checked badge are shown. Sample events have a count but few join records, so the event's host and gray "สมาชิก" faces fill the gap.
  - **Phones and tablets (below `lg`) on `/community/[id]`:** a card under the title with date and time, place with a "แผนที่" link, and price; a fixed bottom bar with date, seats left or the member's state, save, share and one main button (ลงทะเบียนเข้าร่วม / ดูตั๋ว / เปิดแชตลูกทีม / disabled when full or ended). The bar replaces the app's bottom menu (`MobileNav`) on this page. Save and share left the top row on these widths; the report flag stays there. The photo tip "(Fullscreen Lightbox)" is hidden on these widths. The sidebar card hides its price, date block and join button there, keeping seats, the cancellation rule and the joined member's ticket, chat and cancel buttons.
  - **Desktop (`lg` and up):** unchanged apart from "ใครจะไปบ้าง", as the owner asked.
- **Not done, for later:** the same header, card and bottom bar on `/fairs/[id]` and `/spots/[id]` (the owner kept those for later); the sidebar's "ใกล้เต็มแล้ว! เหลือ 0 ที่" pill also shows when an event is full.
- **Action for the other side:** None.
- **Status:** Open

### BE-067 · Challenges: community categories, where to go, who is doing it (owner decisions)
- **2026-10-16:**
  - **Categories:** challenges use the eight community categories (master data `communityCategories`), as the owner asked, and `/challenges` shows the same category rail as `/community` (`CommunityCategoryRail`, now with an `allLabelEn` prop: "All Challenges"). Old challenge ids are mapped on read (`LEGACY_QUEST_CATEGORIES` in `data/masterHub.ts`); the admin form, member proposals and validation use `communityCategories`; the old "หมวดชาเลนจ์" list is no longer offered in the admin taxonomy screen. Staff set board games → บอร์ดเกม & ปาร์ตี้, temples and sea of mist → ท่องเที่ยว & เอาต์ดอร์. The old icon row (`CategoryIconRow`) was removed.
  - **Detail page:** "ที่ที่นับในชาเลนจ์นี้" now shows before joining too, and says plainly when nothing is open in the period yet. Events in it must be still to come and inside the challenge period (they were not filtered before, so a January challenge listed October meetups). Dates read "5 ม.ค. – 28 ก.พ. 70" everywhere (`questDateRange`, `questDay` in `lib/questDisplay.ts`); "เริ่มในอีก N วัน" lost "นับตั้งแต่วันเริ่ม". New "ใครทำอยู่บ้าง" at the end of the main column, the same component as the meetup page (`EventAttendees`, now taking `src` and `title`), from `GET /api/quests/{id}/members`.
  - **List page:** "กำลังทำ N" no longer counts joined challenges that have not started or have ended.
  - **Sample data:** the sea-of-mist sample now also needs the `mountain_mist` vibe (75 places instead of 501 that included waterfalls and caves).
  - **Later the same day (owner):** the challenge detail page has a bottom bar on phones and tablets like the meetup page (XP and period, where the member stands, share, one main button: ร่วมชาเลนจ์นี้ / ดูที่ที่นับ / บันทึกเอง / reward link / disabled when ended), replacing the bottom menu there; and "ชาเลนจ์อื่นที่น่าลอง" at the end (up to 4 from `related` in `GET /api/quests/{id}`). The December fair challenge moved to "ศิลปะ & งานคราฟต์" (its text is about book fairs, craft fairs and Christmas markets). On phones and tablets "ที่ที่นับในชาเลนจ์นี้" sits right after "กติกาและเงื่อนไข" (owner); on a desktop it stays in the right column under the reward (one render function, `placesSection`). The meetup sidebar no longer shows "ใกล้เต็มแล้ว! เหลือ 0 ที่" when full.
- **Action for the other side:** None.
- **Status:** Open

### BE-068 · Homepage leads with the core loop (owner go-ahead)
- **2026-10-16, step 1 of `docs/PRODUCT_DIRECTION.md`:** on `/` (the "ทั้งหมด" view of `app/page.tsx`) the sections now run challenges → meetups (กิจกรรมคอมมูนิตี้) → moments → a new heading "ไปที่ไหนกันดี" ("ที่เที่ยวและงานที่ชาเลนจ์พาไป และเป็นจุดนัดเจอของตี้เพื่อนๆ") → places → fairs → member privileges → "ทำไมต้อง Chill & Connect Hub?". Before, places and fairs came first and challenges and moments sat below the privileges strip. Nothing inside the sections changed; the hero, the highlights row and the community, fairs and spots tabs are as they were. Walked at 390px.
- **Also fixed:** the challenge form in `components/CreateEventModal.tsx` showed an empty hint under each category (it read `description`; the field is `desc`).
- **Not done, for later:** menu order (step 2), and the hero tagline, which the owner has not chosen.
- **Action for the other side:** None.
- **Status:** Open

### BE-069 · /journey redesigned around the core loop (owner request)
- **2026-10-16:** the owner found the homepage too busy and asked for a free redesign on `/journey`, following `docs/PRODUCT_DIRECTION.md`. One heading style for every section (title, one friendly line, "ดูทั้งหมด"). Order: a light hero (headline "ออกไปใช้ชีวิต มีเพื่อนไปด้วย มีเรื่องเล่ากลับมา" (tagline option 1, not yet chosen by the owner), one search box, the loop in three steps that jump to their sections) → "ชาเลนจ์ที่ทำได้ตอนนี้" → "ตี้ที่เปิดรับอยู่" with "ตั้งตี้เอง" → "โมเมนต์จากเพื่อนๆ" → "ไปที่ไหนกันดี" (one row, switch ที่เที่ยว / งานแฟร์) → "ออกไปอย่างสบายใจ" → footer. A search shows meetups, places and fairs, as before.
- **Removed from `/journey`:** the slide hero (`HeroSection`) and its pillar tabs and surprise button, the highlights row (`TrendingCarousel`), the member privileges strip and the separate three-step cards. The components still exist and `/` still uses them.
- **Components:** `CommunityChallengeBar` and `CommunityMomentsStrip` take `hideHeader` so the page draws the heading.
- **Walked** at 390px (about 3.3 screens, no sideways scroll) and 1280px.
- **Open:** whether `/journey` replaces `/`; tagline.
- **Same day, second pass (owner: too plain, take ideas from meetup.com):** a warm hero with a photo collage (three province photos, labels "ทำชาเลนจ์ รับแต้ม" / "ไปกับตี้" / "แชร์โมเมนต์"), the headline on three lines with round icons inline, quick searches under the search box. New sections: "อยากทำอะไรดี" (the eight community categories as colored tiles, each opening `/community?category=`); for signed-out visitors only, "ใช้งานยังไง" (three tinted cards for the loop) and a dark join banner ("ไปคนเดียวก็ได้ ไปกับเพื่อนใหม่ก็ดี", "สมัครสมาชิกฟรี" opens the auth dialog); "ไปจังหวัดไหนดี" (six province photo cards from `TOP_DESTINATIONS`, each opening `/spots?province=`, plus links to all places and fairs) replaced the places/fairs switch. Category labels break only at "&". Order: hero, categories, challenges, meetups, how it works + join, moments, provinces, safety. Walked at 360px, 390px and 1280px.
- **Challenge cards (owner):** `/journey` shows challenges with `ChallengeCard`, the card from /challenges and My Hub, in a sideways row (up to 8: running first, then starting soon; joined state and progress from `useMyRewards`), instead of `CommunityChallengeBar`. The `hideHeader` prop is only on `CommunityMomentsStrip` now.
- **"เพื่อน & โมเมนต์" (owner: rename, no card frames, my idea):** new `components/FriendsMomentsWall.tsx` replaces the moments strip on `/journey`: a row of friends as story circles (moment photo, author face, name; first circle "แชร์ของคุณ" opens /moments); tapping one shows that moment openly: up to three photos as a frameless mosaic, author and time, "ไปที่ <place>", the caption as a large quote, likes and comments, one reply from another member, "ไปที่นี่บ้าง" (the spot, meetup, fair or challenge page) and "อ่านต่อและคุยกัน" (`/moments?momentId=`). The hero is shorter (392px at 1920px, was about 650px). `hideHeader` on the strips was removed again; nothing uses it.
- **"ชาเลนจ์สนุก แนะนำสำหรับคุณ" (owner: rename, redesign; a first large "featured" version was too big and formal):** new `components/ChallengePicks.tsx` replaces the `ChallengeCard` row on `/journey`: six small square photos in a row, each tilted a little (straightens on hover), an XP sticker poking out of the corner, the title, and one reason in a friend's voice from the challenge's own facts ("ไปที่เดียวก็ครบ ง่ายมาก", "เพื่อนๆ ลองแล้ว N คน", "ได้ของจาก <partner>", "เหลือ N วัน รีบเลย!", "อีก N วันเริ่ม จองที่ไว้เลย"); each reason kind is used once where possible. Picks: running challenges with a shop reward and more people first, last place kept for one that starts soon; members do not see ones they joined. No card frames.
- **Action for the other side:** None.
- **Status:** Open

### BE-070 · /journey: open meetups as photo tiles, new hero line (owner request)
- **Heading:** the section is now "ตี้แนะนำ เปิดรับอยู่" (owner); search results keep "ตี้ที่เปิดรับอยู่".
- **2026-10-16:** "ตี้ที่เปิดรับอยู่" now uses `components/OpenMeetupTiles.tsx` instead of `EventGrid`: tall photo tiles (staggered on desktop, swipe row on phones), each with a day pill ("วันนี้", "พรุ่งนี้", "เสาร์นี้" or the short date, plus the start time), title, place, faces from `GET /api/events/{id}/attendees` and an orange seats pill ("ว่าง 6 ที่", "เหลือ 2 ที่", "ขาดอีก 2 คน"). The last tile is "ไม่เจอที่ใช่? ตั้งตี้เองเลย"; the separate "ตั้งตี้เอง" buttons are gone. A first try as a day-grouped list was dropped (owner: it looked like an inner page, not a homepage). Search results still use `EventGrid`.
- **Hero:** the second line is now "พบเจอมิตรภาพใหม่" (was "มีเพื่อนไปด้วย"), owner's wording.
- **"เป็นสายไหน?" (was "อยากทำอะไรดี", owner chose my wording):** keeps the box grid (a colored-pill version was tried and dropped; the owner prefers boxes), made playful: a thick bottom edge in the category color, the icon in a tilted rounded square that straightens on hover, and the box lifts on hover. The number of open meetups (upcoming community meetups with seats left, matched by `getCommunityEventCategory`) is a small tilted bubble on the top-right corner, so it never changes the box size; no bubble when there are none. The box's `aria-label` carries "N ตี้เปิดรับ". A line under the heading: "เลือกสายที่ใช่ แล้วดูว่ามีตี้ไหนชวนอยู่บ้าง".
- **"เพื่อน & โมเมนต์" shorter (owner):** in `components/FriendsMomentsWall.tsx` the photo mosaic is 300px tall on desktop (was 400px) and 208px on phones (was 256px); the caption is one size smaller and clamps at 3 lines so the text column fits beside the photos. The line "เพื่อนๆ แชร์ไปแล้ว N โมเมนต์" under the section is removed (owner).
- **"ไปไหนดี?" (was "ไปจังหวัดไหนดี", owner chose my wording):** line "ที่เที่ยว ที่เดินเล่น และงานแฟร์ทั่วไทย เลือกจังหวัดที่อยากไปได้เลย". Fairs were too hidden (owner): the gray "งานแฟร์ & นิทรรศการ" link is replaced by a row "งานแฟร์ & นิทรรศการช่วงนี้" under the provinces: up to 4 fairs from `fairRow` (soonest first, trade shows last), photo with a pill ("กำลังจัดอยู่" once started, else "เร็วๆ นี้"), title, dates and venue, and "ดูทั้งหมด N งาน" to `/fairs`. Swipe row on phones, 2 columns on tablets, 4 on desktop.
- **"Chill & Connect Hub ใช้งานยังไง" replaces "ออกไปอย่างสบายใจ" (owner: like "How Meetup works"):** the last section is now for everyone: a centered heading, "ออกไปทำสิ่งที่ชอบ เจอเพื่อนใหม่ แล้วเก็บเรื่องเล่ากลับมา ใช้ฟรีทั้งหมด", and three frameless steps of the loop (a round tinted shape with a tilted icon and a step number, title, one line, link to `/challenges`, `/community`, `/moments`). The safety points stay as one quiet line under the steps (3-person daytime trips at the place, report or block anytime, link to `/safety`); the fairs-source point was dropped. The signed-out "ใช้งานยังไง" cards in the middle of the page are removed (they repeated these steps); signed-out visitors still get the dark join banner there.

### BE-071 · The Journey page is now the home page (owner request)
- **2026-10-16:** `app/journey/page.tsx` moved to `app/page.tsx` and replaced the old Classic homepage (slide hero, tabs, filter drawer; still in git history). `/journey` redirects to `/` (temporary redirect in `next.config.ts`). The "Journey / Classic" compare switch in the menu drawer (`components/Navbar.tsx`) is removed. `DESIGN_SYSTEM.md` section 8 updated.
- **No longer used by any page:** `components/FilterDrawer.tsx`, `PlatformTrustAndPerks.tsx`, `StoryBar.tsx`, `TrendingCarousel.tsx`. Left in place; delete when we are sure nothing comes back. `app/journey-simple/` is untouched.
- **Old links:** `/?tab=community|fairs|spots` now just opens the home page (nothing inside the app linked to it).
- **Join invitation moved up and redesigned (owner: the dark banner was too heavy, and new members matter, so not at the bottom):** for signed-out visitors, a light band right after "ชาเลนจ์สนุก แนะนำสำหรับคุณ" (before the meetups): soft orange-to-blue tint, three round province photos, "มาเป็นส่วนหนึ่งของ Chill & Connect กัน", "ให้ทุกการออกไปใช้ชีวิตมีความหมาย สมัครฟรี แล้วเก็บแต้ม ร่วมตี้ และแชร์โมเมนต์ได้เลย", and a blue primary "สมัครสมาชิกฟรี" (full width on phones) that opens the auth dialog. The dark `#1E293B` banner is gone.
- **Hero copy (owner):** third line "ส่งต่อความประทับใจ" (was "มีเรื่องเล่ากลับมา", "ความประทับใจ" in blue); the line under the headline is "ชาเลนจ์สนุกๆ ตี้ชิลๆ และกิจกรรมมากมายทั่วไทย รอให้คุณออกไปลอง".
- **Review fixes (owner):** "ไปไหนดี?" provinces scroll sideways on phones (was 3 rows of 2, about 650px); the line under "เพื่อน & โมเมนต์" now ends "แตะที่รูปเพื่ออ่านเรื่องของแต่ละคน". Walked signed in as a new member at 375px and 1280px: the join band is hidden, no empty sections, navbar and bottom bar show the member items.

### BE-072 · Log in on Vercel without real email verification (owner request, prototype)
- **2026-10-16:** new server env switch `SKIP_EMAIL_VERIFICATION=true` (`lib/members/safety.ts`: `isEmailVerificationSkipped`, `autoVerifyEmail`). Sign-up marks the email verified at once and sends no link; "ส่งลิงก์อีกครั้ง" on the profile verifies older accounts the same way. The pledge is still asked. Documented in `docs/API.md`; turning it off is on `docs/LAUNCH_CHECKLIST.md`.
- **Vercel needs:** `AUTH_SECRET` (32+ characters; without it sign-up and login answer 503 in production) and `SKIP_EMAIL_VERIFICATION=true`, then a redeploy.
- **Known limit:** on Vercel, member accounts are kept in a temporary file (`/tmp/members.json`), so they can disappear after a restart or a new deployment, and one server instance may not see an account made on another. Fine for trying the flow; a real database is on the launch checklist.

### BE-073 · Home page: shorter hero on phones and iPads, moment photo fix (owner request)
- **2026-10-15, hero (`app/page.tsx`):** on phones and iPads the hero took 68–70% of the screen (more than 80% with the browser bar). Phones (below 768px): the photo collage is gone; the three photos sit as small round pictures at the end of each headline line instead, the line under the headline is hidden below 640px, and the "ลองค้น" chips are one row that scrolls sideways. Tablets (768px up): two columns like desktop, text left and a smaller collage (240px) right, headline 32px. Desktop (1024px up) is unchanged. Measured: 360×740 46%, 390×844 40%, 768×1024 43%, 820×1180 38%; no sideways overflow.
- **"เพื่อน & โมเมนต์" (`components/FriendsMomentsWall.tsx`):** a moment with one photo (คุณเอก, คุณเบส) showed the photo at its full size, running into "ไปไหนดี?". The single-photo grid now has a fixed row and clips; all 8 stories checked at 1280px and 360px.
- **Notification dialog (`components/auth/DialogShell.tsx`):** opened from the bell in the navbar, the dialog sat inside the navbar's frame (its `backdrop-blur` makes it the box for `fixed` children), so its title and close button were above the screen and it could not be closed. `DialogShell` now renders into `<body>` through a portal, which fixes every dialog opened from inside the navbar. Checked signed in at 1280px and 390px: centered, closes with the X. The empty-state line no longer breaks "คอมเมนต์" in the middle.
- **"ไปไหนดี?" provinces (owner):** now the same size and row as "ชาเลนจ์สนุก แนะนำสำหรับคุณ": square photos (were 4:5), one row that scrolls sideways (44% / 30% / 23% wide, six in a row from 1024px), gap 16–24px. Checked at 1280px, 768px and 390px: about 181px, 163px and 158px, the same as the challenge photos; no sideways page scroll.
- **Hero on desktop, smaller and tidier (owner):** 392px → 338px tall from 1024px up. Headline 38px (was 44px), less padding, collage 250px in a fixed right column (460px, 500px from 1280px) so the gap in the middle is smaller. The three headline lines each end in an icon matching the three steps (footprints, friends, camera; the third line had none). Each collage label sits on its own photo and stays upright (only the photos tilt).
- **"ตี้แนะนำ เปิดรับอยู่" (`components/OpenMeetupTiles.tsx`, owner):** same size as the challenge picks: square photos (were 3:4, three across on tablets, staggered), the same widths and gaps, one sideways row. The day and time stay on the photo top-left and the seats left move to the bottom-right; the title (14px, two lines), place (12px) and faces now sit under the photo like the challenge picks. The "ไม่เจอที่ใช่?" tile is a square too. Titles in both rows now really stop at two lines (`block` was overriding `line-clamp-2`).
- **No subtitles under section headings on the home page (owner: other platforms do not have them):** removed the grey line under "เป็นสายไหน?", "ชาเลนจ์สนุก แนะนำสำหรับคุณ", "ตี้แนะนำ เปิดรับอยู่", "เพื่อน & โมเมนต์", "ไปไหนดี?" and "Chill & Connect Hub ใช้งานยังไง". `sectionHead` no longer takes a subtitle. The join band keeps its sentence (it is the band's message, not a subtitle).
- **New headings (owner):** "ไปไหนดี?" → "สายเที่ยว สายชิล ไปไหนดี?"; "งานแฟร์ & นิทรรศการช่วงนี้" → "งานแฟร์ งานวิ่ง งานคอน ช่วงนี้". So the row matches its heading, it now starts with the soonest fair, the soonest run and the soonest concert (`fairKind` in `app/page.tsx`, by words in the title and tag), fills the rest by date, and shows them in date order. A search still lists matches by date only. On 2026-10-15 it shows Baby & Kids Carnival, Thailand Coffee Tea & Drinks, OH MY FOURTH CONCERT and the 5KRC running clinic (before: four fairs and expos).
- **Home page for first-time visitors (owner approved a clickable draft):** (1) the line under the headline is now "หาเพื่อนไปวิ่ง ไปคาเฟ่ ไปเที่ยว ด้วยกัน ใกล้ๆ ตัวคุณ" and shows on phones too, so the first screen says what the site is; (2) visitors who are not signed in get three steps right under the hero, "เลือกตี้ที่ชอบ → ออกไปใช้ชีวิต → เก็บแต้ม แชร์โมเมนต์" (`HOW_STEPS`), with one safety line "เจอกันที่สถานที่จริง · รายงานหรือบล็อกได้ทุกเมื่อ" and a link to /safety; stacked and centered up to 1279px, one row with a short line under each step from 1280px; the old "Chill & Connect Hub ใช้งานยังไง" section and its safety box at the end of the page are removed (the footer still links to the safety guide); (3) "ตี้แนะนำ เปิดรับอยู่" now comes before "ชาเลนจ์สนุก แนะนำสำหรับคุณ"; the join band follows the challenges. Count bubbles on the category boxes stay as they are (owner). Checked signed out at 360, 390, 768, 1024 and 1280px; no sideways scroll. The one ESLint error left in `app/page.tsx` (`Date.now()` in the fair row) was already there.

### BE-074 · The home page becomes the member's own home when signed in (owner approved a clickable draft)
- **2026-10-15, `/` signed in** (`app/page.tsx`, new `components/MemberHomeTop.tsx`): in place of the hero, "สวัสดี {ชื่อ}" with one line of points ("⚡ 320 XP · 3 เหรียญ · แลกของรางวัลได้ 2 อย่าง →", to /rewards; from `GET /api/rewards`: balance, finished challenges, shop items the member can afford and has not redeemed) and a small search box. Then "ถัดไปของคุณ" with at most two items: the next meetup or fair the member joined or hosts (`useMyActivity`; a fair links to /fairs and shows no attendee count) and the challenge in progress that closes first, with a progress bar; "ดูตารางทั้งหมด" goes to My Hub, which stays the full schedule (owner). With nothing yet: "ยังว่างอยู่เลย ลองหาตี้แรกกัน", the categories picked at onboarding (`GET /api/auth/member/preferences`) as links, and "หาตี้แรกของคุณ".
- **Sections for members:** "เป็นสายไหน?" and the 3 steps are hidden; "ตี้แนะนำสำหรับคุณ" leaves out meetups the member joined or hosts, puts their onboarding categories first and says why under the title ("เพราะคุณชอบสายคาเฟ่", `OpenMeetupTiles` `reasons`); "ชาเลนจ์ของคุณ" (when one is in progress) shows the member's open challenges first with a progress bar (`ChallengePicks` `progress`), then suggestions. Moments, places and fairs are the same as for visitors.
- **Visitors:** the join band lists three perks (XP for rewards, shop rewards for finished challenges, badges), kept general because the reward shop still holds sample partners (added to `docs/LAUNCH_CHECKLIST.md`).
- **Also:** the fair row reads the page clock instead of calling `Date.now()` in render (the ESLint error is gone); a start-time regex in `OpenMeetupTiles` that lost its backslashes earlier today is fixed.
- **Checked** with throwaway members (deleted after) at 390px and 1280px: new member with categories picked (empty state), and a member with a joined fair and a joined challenge; no sideways scroll. Not checked: a joined community meetup in "ถัดไปของคุณ" (the throwaway account had no verified email), and while the session is loading the visitor hero shows briefly before the member home.

### BE-075 · "ลองใช้เลย ไม่ต้องสมัคร" on the login screen (owner request, prototype only)
- **2026-10-15:** the login view of `AuthPanel` (popup and /login) shows a dashed "ช่วงทดลองระบบ" box with "ลองใช้เลย ไม่ต้องสมัคร" when the server allows it. It signs in as one shared test account, "ผู้ทดลองใช้" (`POST /api/auth/member/demo`, `lib/members/demoLogin.ts`): verified email, pledge accepted, onboarded with คาเฟ่ and วิ่ง picked, so every member feature can be tried.
- **Why:** on Vercel, member accounts live in a per-instance `/tmp` file, so an account made on one instance is unknown to the next and the visitor is logged out. The test account is rebuilt from code by `getSessionMember` on any instance that lacks it, so its session holds. What it joins or posts can still vanish between instances.
- **Turning it on (Vercel):** `DEMO_LOGIN=on` and `AUTH_SECRET` (32+ characters), then redeploy. Always on in local development. Without `AUTH_SECRET` nothing signs in (a fixed fallback key was considered and dropped: it would let anyone forge sessions). Removing it is on `docs/LAUNCH_CHECKLIST.md`.
- **Checked** locally at 390px: the button signs in and the home page greets "สวัสดี ผู้ทดลองใช้". Not checked: the rebuild on a fresh instance (the dev server keeps accounts in memory, so removing the file entry did not exercise it).

### BE-076 · Member home becomes a live social page in three columns (owner approved a clickable draft)
- **2026-10-16, `/` signed in** (`app/page.tsx`, new `components/home/MemberLiveHome.tsx`, `HomeMomentFeed.tsx`, `LiveActivity.tsx`; `components/MemberHomeTop.tsx` removed): greeting, points and search stay on top. Below, from 1280px: left "ถัดไปของคุณ" (next meetup with a countdown inside two days, challenge in progress) and shortcuts (ตารางของฉัน, ชาเลนจ์ที่ทำอยู่, ที่บันทึกไว้, โมเมนต์ของฉัน, ของรางวัล); middle "โมเมนต์จากเพื่อนๆ" (ล่าสุด / ยอดฮิต, like and save in place, the place, meetup, fair or challenge each moment came from as a link, first comment, a pink "โมเมนต์ใหม่ N รายการ" pill when new ones arrive, checked every minute); right "ตอนนี้ในชิลล์" (polled every 30 seconds), "ตี้แนะนำสำหรับคุณ" and "ชาเลนจ์ที่เพื่อนๆ กำลังทำ". From 1024px the left column moves above the feed; on phones the live lines become a sideways strip and meetups and challenges sit between posts 2 and 3, and 4 and 5.
- **Members no longer see on `/`:** the challenge photo row, "เพื่อน & โมเมนต์", provinces and the fair row (the feed and the right column take their place). A typed search still shows the three result rows.
- **Visitors** keep the landing page, plus one line under the three steps: "สด · สัปดาห์นี้ในชิลล์ · เข้าร่วมตี้ N ครั้ง · เริ่มชาเลนจ์ N คน · แชร์โมเมนต์ N ครั้ง", counts only, hidden when all are zero.
- **Backend:** `GET /api/activity` (see docs/API.md, "Live activity"); `allQuestJoins()` and `allQuestFinishes()` added to the stores.
- **Checked** with the demo member at 1600, 1100 and 390px, and signed out at the same widths: no sideways scroll. Not checked: the new-moment pill with a second member posting.
- **Same day, owner review (BE-076 continued):** (1) the home feed now does everything a member needs with moments: the post box opens the real share form, and comments, delete own comment, ⋯ menu (edit caption, delete, copy link, report), a full-screen photo viewer and auto-loading as you scroll replace "ดูโมเมนต์เพิ่ม". The share form moved out of `app/moments/page.tsx` into `components/moments/MomentComposer.tsx` (also `CountedQuestNotice`), used by both pages; /moments keeps stories, the following / saved / mine tabs and search (owner choice). (2) "ตอนนี้ในชิลล์" took too much room: it is now one 44px line above the post box (`LiveTicker`), showing one line at a time every 4.5 seconds, with "ดูทั้งหมด N" to open the list. (3) The right column lists where to go: ตี้แนะนำสำหรับคุณ, ชาเลนจ์ที่เพื่อนๆ กำลังทำ, งานแฟร์ งานวิ่ง งานคอน ช่วงนี้, ที่เที่ยวน่าไป (3 each); on phones the same four sit between posts as sideways photo rows (after posts 2, 4, 6, 8).
- **Checked:** demo member at 1600px and 390px: feed grew from 8 to 24 posts by scrolling, the form opens on `/` and `/moments`, comments open with an input, no sideways scroll. Not checked: an actual post with a photo upload (it would add real data), edit and report end to end.
- **Same day, round 3 (owner):** the rest of /moments is on the home feed too. **Stories** (`components/moments/StoriesRail.tsx`, now shared with /moments: the row, the viewer, "เพิ่มสตอรี่" and reporting; an unseen story's ring is rose, the Moments color, instead of blue) sit at the top of the feed. **Tabs** are ล่าสุด · ติดตาม · ยอดฮิต; **saved and own moments** open in the feed from the left column ("โมเมนต์ของฉัน", "โมเมนต์ที่บันทึก") or the ⋯ next to the tabs, with a pink chip to go back. The left column's old "ที่บันทึกไว้" is now "ตี้และที่เที่ยวที่บันทึก" (still My Hub). **Search** on `/` now has a "โมเมนต์" row (`components/home/MomentSearchRow.tsx`, `/api/moments?q=`), for visitors too. On screens 1280px and wider, the greeting moved to the top of the left column and the search box to the top of the right one, so the feed starts right under the navbar (owner); typing there brings the top row back with the results and keeps the cursor.
- **Round 4, type on the member home (owner: "make it feel tidy"):** IBM Plex Sans Thai is loaded at 300–700 only (`app/layout.tsx`), so `font-black` (900) and `font-extrabold` (800) were drawn as browser-faked bold, which smears Thai. The member home pieces (`components/home/*`, `StoriesRail`) now stop at 700: headings `font-bold` (side headings 16px, feed heading 20–24px), titles `font-semibold`, dates `font-semibold` in the pillar color, secondary lines regular `text-slate-500`, captions regular `text-slate-800 leading-relaxed`, links `font-medium`. The points line is plain text with "ดูของรางวัล →" as its own link. **Done (80d7d74):** owner approved; all 643 `font-extrabold` / `font-black` uses site-wide became `font-bold`, and DESIGN_SYSTEM.md section 6 now caps weights at 700.
- **Round 5 (owner):** (1) **Photos like Instagram / Lemon8** on the home feed and /moments (`components/moments/MomentPhotos.tsx` rewritten): one photo at a time, swipe on a phone, arrows on hover, "1/3" and dots; the first photo sets the frame (4:5 tall, 1:1 square, up to 1.91:1 wide); a **double tap likes** the post with a heart burst (`animate-heart-pop` in `app/globals.css`), a single tap opens the viewer. Both feeds are 560px wide on large screens so a 4:5 photo fits on a laptop. (2) **Weights site-wide:** every `font-black` / `font-extrabold` (643 in 102 files, admin included) became `font-bold`, because the Thai font stops at 700 and 800/900 were faked. DESIGN_SYSTEM.md section 6 now says 700 at most and adds side heading, list row title and secondary line levels.
- **Round 6:** on screens 640px and up the photo frame is capped at `min(600px, 65vh)` (owner: frame too tall); phones keep 4:5. Measured 560 × 585px in a 900px-high window.
- **Round 7 (owner):** every post now uses the same **square** photo frame on all screens (replaces the 4:5 / 1:1 / 1.91:1 choice and the height cap); 560 × 560px on a computer. `ratio` on `MomentPhotos` is no longer used for the frame.
- **Round 8 (owner):** the live line ("● สด …") moved above the "โมเมนต์จากเพื่อนๆ" heading, at the top of the middle column, in line with the greeting and the search box; heading, stories, post box and posts now read as one block.
- **Round 9, visitor landing (owner):** the live counts ("● สด สัปดาห์นี้ในชิลล์ …") moved into the row of the 3 steps, on the right (xl) / under them (phones); the safety line moved into the hero under the quick searches; the divider is gone and "เป็นสายไหน?" sits closer (the steps section sets `mb-8! sm:mb-10!`, because the parent space-y is a bottom margin in Tailwind 4).

### BE-077 · Visitor hero: one strip less, live numbers moved up, sample numbers (owner request)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-16 · `claude`
- **What changed:** feedback on the visitor home was "looks good but no focus". By the owner's choice: (1) the safety line under the hero search ("เจอกันที่สถานที่จริง · รายงานหรือบล็อกได้ทุกเมื่อ · กติกา") is removed; (2) the 1-2-3 "ใช้งานยังไง" strip under the hero (`HOW_STEPS`) is removed, since the photo labels already tell the loop; (3) `LiveCountsRow` ("สัปดาห์นี้ในชิลล์") now sits inside the hero under the quick searches (`app/page.tsx`); (4) `LiveCountsRow` adds a sample base to the real counts (`SAMPLE_COUNTS` in `components/home/LiveActivity.tsx`: joins +1,147, challenges +343, moments +525), listed for removal in docs/LAUNCH_CHECKLIST.md. `/api/activity` itself is unchanged.
- **Then (owner):** collage labels are now "หากิจกรรมที่ใช่" (search icon), "ออกไปใช้ชีวิต" (footprints) and "แบ่งปันเรื่องราว"; `HERO_PHOTOS` are friends at a board game, the Bangkok park at golden hour and a group run (`/event-board-games.png`, `/hero-bkk-community-golden.jpg`, `/event-city-run.png`), also used as the small photos in the phone headline.
- **Headline (owner):** the headline is now "คอมมูนิตี้ของคน / ชอบออกไปใช้ชีวิต" ("ออกไปใช้ชีวิต" in orange, one footprints icon on wide screens, two photo circles on phones); "พบเจอมิตรภาพใหม่ ส่งต่อความประทับใจ" is a semibold line under it, followed by the existing grey line. The three colored icons after the old headline lines are gone.
- **Search box (owner):** the grey line "หาเพื่อนไปวิ่ง ไปคาเฟ่ ไปเที่ยว ด้วยกัน ใกล้ๆ ตัวคุณ" is removed; the hero search box ends with a province picker like the classic hero (popular six, then the other 71 from `MASTER_77_PROVINCES`). A province alone also opens the results; it filters meetups, places and fairs (Bangkok matches both spellings), passes `?province=` to the "ดูทั้งหมด" links of /community, /spots and /fairs, and is cleared by "ล้างคำค้นหา". The member home search is unchanged.
- **Owner decision (open, not built):** the "เป็นสายไหน?" cards stay on the landing, retitled "เลือกกิจกรรมตามสายที่ชอบ", and filter the meetup row right below (its "ตี้แนะนำ เปิดรับอยู่" title goes; an "ทั้งหมด" card first; no colored bottom borders). The same question is also used in onboarding (step "สิ่งที่ชอบ" in `app/onboarding/OnboardingFlow.tsx`). The challenge row stays exactly as it is now. Full-page draft: https://claude.ai/artifact/1SvLRGbpr4CeEaNmFWcmoa.
- **Also drafted, not built:** four hero options (A/B tidy the current hero, C puts three real meetups in the hero, D is a full-width photo with activity buttons) at https://claude.ai/artifact/BtCvw1FPiK2PxpvK1J1iyF. I recommended C; the owner chose the smaller change above for now.
- **Action for Frontend:** none.

### BE-078 · Visitor landing page rebuilt from the full-page draft (owner approved, hero "ร่าง 2")
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **What changed (`app/page.tsx`, signed-out view only; the member home is unchanged):**
  - **Hero:** collage on the left with numbered labels (1 หากิจกรรมที่ใช่, 2 ไปกับเพื่อนใหม่, 3 แบ่งปันเรื่องราว); headline "คอมมูนิตี้ของคน / ชอบออกไปใช้ชีวิต" plus the promise line; one orange button "ดูตี้ที่เปิดรับสัปดาห์นี้" that scrolls to the meetups; one line "สัปดาห์นี้ไปตี้กันแล้ว N ครั้ง" (`LiveJoinsLine` in `components/home/LiveActivity.tsx`, same sample base as BE-077) and "สมัครฟรี ไม่มีค่าใช้จ่าย". The hero search box, quick searches and `LiveCountsRow` are gone from the hero; phones now show the collage too.
  - **Search moved to the header:** `Navbar` takes optional `onOpenSearch` (bar on wide screens, icon on phones; the "/" key opens it too) and `onOpenSignup`. The window is `components/home/SearchPanel.tsx` (words + province + common searches) and shows the existing search results on the page. Other pages pass neither prop, so only their visitor buttons changed: "เข้าสู่ระบบ" is now a text link (hidden under 400px, still in the menu) next to a dark "สมัครฟรี".
  - **"เลือกกิจกรรมตามสายที่ชอบ":** the "เป็นสายไหน?" cards in their current style (colored bottom border, tilted count sticker), with "ทั้งหมด" first; they filter the meetup row below (the "ตี้แนะนำ เปิดรับอยู่" heading is gone) and "ดูทั้งหมด" carries `?category=` to /community. The province pill was removed by the owner (all open meetups are in Bangkok for now; province search stays in the header window and on /community).
  - **Meetup tiles** (`components/OpenMeetupTiles.tsx`): the "[ตัวอย่าง]" tag is hidden from titles; optional `savedIds`/`onToggleSave` add a heart on the photo (landing only).
  - **Sign-up:** the boxed banner is now an open peach band across the page after the challenges ("สุดสัปดาห์นี้ ออกไปด้วยกันไหม?", one orange button, "มีบัญชีแล้ว? เข้าสู่ระบบ", kept to one slim row on wide screens with the faces beside the heading); the footer adds one quiet "สมัครฟรีได้เลย" line for visitors.
  - **Fairs:** their own section, a dated two-column list with 128×88 photos (hidden on phones) and "กำลังจัดอยู่" / "เร็วๆ นี้". Every "ดูทั้งหมด" link is now ink with an arrow (was blue).
  - Kept as they were: challenge picks, moments, places, section titles, footer.
- **Open:** the hero and band buttons are orange, as the owner chose in the draft, but DESIGN_SYSTEM.md says the primary button is blue. Either the design system gets a landing-page exception or the buttons go blue.
- **Action for Frontend:** none.
- **Review pass (same day):** hero button now says "ดูตี้ที่เปิดรับอยู่" (the row is not limited to this week); the blue hero circle moved off the trust line; fair status is a dot and words instead of a filled chip (on phones it leads the second line); the fairs link drops the count on phones; "อ่านต่อและคุยกัน" on the moment wall is an ink link; the sample Benjakitti moment's first photo is now `/hero-bkk-park-sunny.jpg` instead of a desert canyon (`data/mockData.ts`, and the local gitignored `data/moments.json`).
- **Owner tweaks (same day):** the "/" hint is gone from the header search bar (the key still opens it); the header "สมัครฟรี" is orange on every page (it was near-black); the "ทั้งหมด" card is soft grey (grey bottom border and sticker), and a picked category card shows a light grey background and a lift instead of a black frame.

### BE-079 · Landing page fixes from the owner (2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **What changed:**
  - **Meetup row** (`app/page.tsx`, `components/OpenMeetupTiles.tsx`): the last "ไม่เจอที่ใช่? ตั้งตี้เองเลย" tile is gone from the landing page, which now shows six real meetups (`MEETUP_ROW_SIZE`). `onCreate` is optional on `OpenMeetupTiles`; the member home still passes it and keeps the tile.
  - **Header** (`components/Navbar.tsx`): the "เมนู" button is hidden on `/` for visitors. Members and every other page still get it.
  - **Sign-up band:** the three faces no longer squeeze into the heading on iPad (their wrapper could shrink; it is now `shrink-0`).
  - **Fairs list:** one column up to 1024px wide, two columns from `lg` (it was two from `md`).
  - **Sliding rows** (new `components/ScrollRow.tsx`): meetups, challenge picks and places get round arrows floating over the photos from `md` up (phones swipe). An arrow shows only when there is more that way. Photos carry `data-row-photo` so the arrows sit on their middle. A picked category now shows up to 12 meetups ("ทั้งหมด" stays at 6); over 12, the heading link says "ดูทั้งหมด N ตี้". Challenges and places stay at 6.
  - **AGENTS.md section 4** (shared file): new owner rule that every public page must work for Google and AI search.
- **Action for Frontend:** none.

### BE-080 · Search and AI search, step 1: sitemap, page titles, private pages (owner rule, 2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **Why:** the owner's new rule (AGENTS.md section 4). The owner confirmed `chillconnecthub.com` is ours.
- **What changed:**
  - **`lib/site.ts`** (new): `SITE_URL` (override with `NEXT_PUBLIC_SITE_URL`), `pageMetadata()` (full title, description, canonical, Open Graph, Twitter), `metaDescription()` (plain text, cut near 160 chars), `PRIVATE_PAGE` (noindex). `app/layout.tsx` uses `SITE_URL` instead of the written-out domain; its search box entry now points to `/community?q=` (the home page never read `?search=`).
  - **Own title and preview per page:** server `layout.tsx` with `generateMetadata` for `/community/[id]`, `/fairs/[id]`, `/spots/[id]` (and `/challenges/[id]` now uses the same helper); static metadata for `/community`, `/fairs`, `/spots`, `/challenges`, `/moments`, `/about`, `/safety`, `/legal`.
  - **Private pages are noindex:** `/myhub`, `/profile`, `/onboarding`, `/rewards`, `/login`, `/checkin`, `/reset-password`, `/verify-email`, `/events/[id]` (redirect), the preview pages and `/journey-simple`. They are not blocked in robots.txt, so crawlers can read the noindex. Titles no longer repeat "· Chill & Connect Hub" (the root template adds it).
  - **`app/sitemap.ts`** is built from the database, refreshed hourly: static public pages, every not-ended meetup and fair at its real address (was `/?event=` links), open challenges and all published places (2,244 addresses today). Private pages removed.
  - **`app/robots.ts`:** one rule for every crawler (AI search crawlers included), only `/api/` and `/admin` blocked.
- **Next (not started):** step 2 JSON-LD `Event` / `Place` on detail pages; step 3 render list and detail content on the server (today the HTML has no meetups because pages fetch in the browser).
- **Action for Frontend:** a new public page needs its own `layout.tsx` with `pageMetadata()`; a signed-in page gets `PRIVATE_PAGE`.

### BE-081 · Search and AI search, steps 2 and 3: structured data and content in the server HTML (2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **Step 2, JSON-LD** (`lib/structuredData.ts`, new): meetup and fair pages carry an `Event` (date and time in Thai time, place with map point, organizer, free entry when the price says so, capacity for meetups); place pages carry a `TouristAttraction` (address, map point, map link, phone, website). Every detail page, challenges included, also has a `BreadcrumbList`. A date the text does not name a month for gets no `Event` rather than a guessed one. Place ratings are left out until they come from real visitors.
- **Step 3, content on the server:** each public route's `page.tsx` is now a server file that reads the data and hands it to the old page, moved next to it as `*View.tsx`:
  - Detail: `app/community/[id]`, `app/fairs/[id]`, `app/spots/[id]` (`getPublicEvent` / `getPublicSpot` in `lib/publicContent.ts`, shared with `generateMetadata` through React `cache`); the browser no longer refetches what the server sent. `app/challenges/[id]` gets the public part from the server; the member's progress still loads in the browser. The metadata moved from the step 1 `layout.tsx` files into these pages.
  - Lists: `/community`, `/fairs` and `/challenges` get their whole public list; `/spots` gets its first 60 places in the page's own order (`lib/spotRanking.ts`, shared by both), and the full catalog still loads in the browser. List pages render per request (`connection()`), so the `?q=` / `?category=` / `?province=` filters render on the server too.
  - `lib/social/questDetail.ts` (new) holds what `GET /api/quests/[id]` returns; the route calls it, the answer is unchanged.
- **Checked:** every page above has its title, text and links in the HTML from `curl`, one `<h1>`, and opens in headless Chrome with no console errors (no hydration warnings).
- **Follow-up, same day:**
  - **Real 404:** a meetup, fair, place or challenge id that does not exist now answers 404 (`notFound()` in each server page; sample ids from the bundled data still render). New `app/not-found.tsx` + `components/NotFoundScreen.tsx`: one friendly screen with links to the four sections, `noindex`.
  - **Home page:** `app/page.tsx` is a server file now; the old page moved to `app/HomeView.tsx`. It sends the approved events that are not over and the challenges, so the visitor landing (meetups, challenge picks, fairs) is in the HTML and visitors no longer fetch those lists. A signed-in member still loads the full event list in the browser, as before.
- **Deferred to docs/LAUNCH_CHECKLIST.md:** moments in search (needs a decision on whether members' posts should be indexed), and the per-category place counts on `/spots` that show the first 60 places' numbers until the full catalog loads.
- **Action for Frontend:** a new public page reads its data in a server `page.tsx` and passes it to the client view; do not fetch the main content only in `useEffect`.

### BE-082 · ค้นพบ: one header for meetups, fairs and places (2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **Why:** the owner chose a Meetup-style Find area (sketch v2): the three lists stay separate pages (each with its own address and title for search), under one ค้นพบ header.
- **What changed:**
  - **`components/discover/DiscoverHeader.tsx`** (new) on `/community`, `/fairs`, `/spots`: the three kinds as pills with how many the search finds (links carry `?q=` and `?province=`), a title that names the province ("มีตอัปใน เชียงใหม่", "มีตอัปออนไลน์"), the search word as a chip with ×, and "ชาเลนจ์ที่ตรงกับ “…” N อัน · ดูชาเลนจ์ →" to `/challenges?q=` when challenges match. Under it each page's filters as pills (`FilterSelect`, `filterPillClass`: a picked filter wears its pillar tint), the result count with "ล้างตัวกรองทั้งหมด", sort and grid/list.
  - **`components/discover/DiscoverSearch.tsx`** (new): word | province | blue search button. In the top bar on wide screens (new Navbar prop `searchSlot`), above the pills on phones. The list still filters while typing.
  - **Shared matching, `lib/discoverMatch.ts`** (new): province and search-word matching moved out of the three pages (and `/challenges`, which now matches with synonyms too, e.g. "วิ่ง" finds "running"). `GET /api/discover/counts` (new, in docs/API.md) counts with the same code, so a tab's number equals what that page shows. The server pages send the counts for the address they were opened with.
  - **Removed per page:** the breadcrumb, the coloured header box with its description, the in-page search box and province select, and the big filter box (every filter is still there, as pills). The "create" buttons sit beside the title ("ตั้งตี้เอง", "เพิ่มงานแฟร์", "แนะนำที่ใหม่"). The clubs / venues / destinations rails moved below the list; picking one scrolls back up to the results.
  - **Menu:** "ค้นพบ" in the Navbar menu and the phone bottom bar now goes to `/community` (was `/`); the logo goes home. The home page no longer marks "ค้นพบ" as active.
  - **Cards are unchanged.**
- **Checked:** desktop and phone screenshots of all three pages; tab counts equal the page counts for "วิ่ง", for กรุงเทพฯ, and for "คาเฟ่" in เชียงใหม่; `/challenges?q=วิ่ง` opens with the word filled in; no console errors.
- **Action for Frontend:** none. A new filter on these pages goes in the pill row; matching changes go in `lib/discoverMatch.ts` so the counts follow.

### BE-083 · ค้นพบ: shorter top on phones, matching counts, "มีที่ว่าง" (2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **Why:** a check of the ค้นพบ pages after BE-082 (owner request).
- **What changed:**
  - **Meetup tab count:** `discoverCounts` in `lib/publicContent.ts` counted ended meetups (58 on the tab, 57 in the list). It now leaves them out, like fairs.
  - **One row less:** `DiscoverHeader` takes a `summary` prop; "พบ N ตี้/งาน/แห่ง" with "ล้างตัวกรองทั้งหมด" sits under the title. Sort (meetups) and the grid/list switch close the filter pill row (`sm:ml-auto` on wide screens, at the end of the scrolling row on phones).
  - **Phone search hint:** `DiscoverSearch` takes `compact`; the phone copy says "ค้นหาตี้" / "ค้นหางานแฟร์" / "ค้นหาที่เที่ยว" instead of the cut-off full line.
  - **"มีที่ว่าง" on `/community`:** a filter pill for meetups with seats left, also opened by `?seats=open`. The home page's "เลือกกิจกรรมตามสายที่ชอบ" row shows only open meetups, so its "ดูทั้งหมด" link now carries `seats=open` and the numbers match (29 on both).
  - **Empty categories hidden:** `FairCategoryRail` and `CommunityCategoryRail` (rail variant) leave out a category with 0, unless it is the picked one.
- **Checked:** phone (375px) and desktop (1440px) screenshots of all three pages; `/community?seats=open` shows 29, งานวิ่ง 6, as on the home page; `tsc` clean.
- **Action for Frontend:** none.

### BE-084 · Member home: left column scrolls, live line under the share box (2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **What changed:** the left column of `MemberLiveHome` (wide screens) is capped at the screen height and scrolls on its own, like the right one, so its lower shortcuts can be reached. `HomeMomentFeed` shows its `top` slot (the live ticker) under "วันนี้ไปไหนมา…" and right before the posts, instead of above the heading.
- **Action for Frontend:** none.

### BE-085 · Search opens ค้นพบ; a calmer ค้นพบ top (owner request, 2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **Search goes to ค้นพบ:** the visitor home's search window (`SearchPanel`) and the member home's search boxes now open `/community?q=…&province=…` (`discoverHref`) instead of showing results on the home page. The home page's own results (rows of meetups, places, fairs, moments) are gone, with `components/home/MomentSearchRow.tsx`. Moments are left out of search for now (owner decision). With nothing typed, the window still scrolls to the meetup row.
- **ค้นพบ top, after Meetup's Find page:**
  - Row 1: the three page tabs, the "create" button at the end (just "+" on phones, where it sits beside the title so the tabs keep the row).
  - Row 2: the title with "พบ N" under it; sort and card/list on the right (`DiscoverHeader` prop `tools`).
  - Row 3: filter pills, lighter (36px, 13px text, slate-200 border).
  - Row 4: **`components/discover/DiscoverCategoryTabs.tsx`** (new): categories as icon tabs, a line in the pillar color under the picked one, no boxes, empty ones left out, arrows on wide screens. Replaces `CommunityCategoryRail`, `FairCategoryRail` and `SpotCategoryRail` on the three ค้นพบ pages (`/challenges` keeps `CommunityCategoryRail`).
- **Follow-up (owner, same day):** the page tabs are plain text (no pills); the current one is bold over a tilted highlighter stroke in its pillar color, others get a short stroke on hover; a visible `<h1>` in a friend's voice sits right under the tabs and says where: "กิจกรรมออกไปใช้ชีวิต ทั่วไทย" (or "… ใน เชียงใหม่", "กิจกรรมออนไลน์"), "งานแฟร์ งานวิ่ง งานคอน ทั่วไทย", "ที่เที่ยว ที่ชิล ทั่วไทย". "พบ N", sort and card/list sit at the right end of the filter row on wide screens, and on one short row with "+" under the tabs on phones. The search word chip and the matching-challenges line show under the tabs only while searching.
- **Checked:** screenshots at 375px and 1440px; no console errors; `tsc` clean.
- **Action for Frontend:** none.

### BE-086 · One search box in the top bar on every page (owner request, 2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **What changed:** the Navbar shows the ค้นพบ search box (word | province | blue button) on every page, left-aligned right after the logo, same look and place everywhere. On `/community`, `/fairs`, `/spots` it is the page's own box (`searchSlot`, filters while typing); elsewhere it is **`components/discover/SiteSearch.tsx`** (new): Enter or the button opens `/community?q=…&province=…`. "/" jumps into it. `DiscoverSearch` takes `onSubmit`.
- **Removed:** the search window `components/home/SearchPanel.tsx` and the Navbar prop `onOpenSearch`; the member home's two search boxes (the top bar has it). On phones the top bar's search icon links to `/community`, whose search box sits at the top.
- **Checked:** top bar screenshots of `/`, `/community`, `/challenges` (same place); from `/` and `/challenges`, "/" focuses the box and Enter lands on `/community?q=…` with the word filled in; `tsc` clean.
- **Action for Frontend:** none.

### BE-087 · ค้นพบ: destination circles on /spots, a dated list view for meetups and fairs (owner request, 2026-10-17)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-17 · `claude`
- **/spots, where first:** **`components/discover/DestinationCircles.tsx`** (new): the popular places (`TOP_DESTINATIONS`) as round photos with the short name people say ("เขาใหญ่", "หัวหิน") right under the heading (`DiscoverHeader` prop `lead`). A tap narrows to that province (green ring, heading "… ใน เชียงใหม่"); a second tap clears it. The big destination rail under the list is gone from /spots (`TopDestinationsRail` stays for its data).
- **รายการ on /community and /fairs, like /challenges:** **`components/discover/EventDateList.tsx`** (new): a strip of small cards on top ("สัปดาห์นี้" = the next 7 days for meetups; "กำลังจัดอยู่ตอนนี้" = open today for fairs), then the rest by date under month headings ("พฤศจิกายน 2569"), then ended ones when the status filter shows them. Rows: a calendar leaf (weekday, day), photo, the time (or a fair's range) in the pillar color, title, place and seats left / entry ("เริ่ม ฿1,800" for ticket tiers). No boxes; 40 rows then "ดูเพิ่ม" instead of page numbers. The sort menu hides in this view (the list is in date order). The card view is unchanged.
- **Checked:** screenshots at 375px and 1440px of both list views and of /spots with and without a province; `tsc` clean.
- **Action for Frontend:** none.

### BE-088 · /fairs: tabs say what kind of event, venue circles say where (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- **Tabs = event type only:** `MASTER_FAIR_CATEGORIES` (`data/masterHub.ts`) and `data/master_data.json` renamed: งานแฟร์ & เอ็กซ์โป · เทศกาล & งานศิลป์ · งานวิ่ง & กีฬา · งานประเพณี & งานประจำปี · ตลาด & คราฟต์ · คอนเสิร์ต & ดนตรี (new, `Music` icon). The ids stay the same (members' saved interests use them): `convention_centers` is now fairs & expos (and the fallback), `parks_openair` is now concerts & music. `getFairEventCategory` sorts by what the event is, not where: music words go to concerts; a park venue no longer decides the tab; book fairs moved from crafts to expos.
- **Venues under the h1:** **`components/discover/VenueCircles.tsx`** (new): the venues in `TOP_VENUES` as round photos in the `DiscoverHeader` `lead` slot, like the destination circles on /spots (blue ring when picked, second tap clears). The `TopVenuesRail` below the list is gone from /fairs (the component stays for its data).
- **รายการ grouped by day** (`components/discover/EventDateList.tsx`, /community and /fairs): one calendar leaf per day with that day's events beside it, two columns from `lg` up. A time with no end ("16:00 - 16:00") shows as "16:00".
- **16 event groups + catch-all** (owner pick, 2026-10-18), tab order: คอนเสิร์ต & แฟนมีต · เทศกาลดนตรี · งานวิ่ง · กีฬา & อีสปอร์ต · อาหาร & เครื่องดื่ม · ตลาด & คราฟต์ · การ์ตูน เกม & ป๊อปคัลเจอร์ · ศิลปะ & นิทรรศการ · สุขภาพ & เวลเนส · ละครเวที & การแสดง · หนังสือ & การเรียนรู้ · เทศกาล & ประเพณี · ท่องเที่ยว & เอาท์ดอร์ · บ้าน & ไลฟ์สไตล์ · สัตว์เลี้ยง · ไอที รถยนต์ & เทคโนโลยี · งานแฟร์ & เอ็กซ์โป (catch-all). New ids: `music_festivals`, `sports_esports`, `food_drinks`, `pop_culture`, `wellness`, `performing_arts`, `books_learning`, `travel_outdoor`, `home_lifestyle`, `pets`, `tech_motor`. `getFairEventCategory` now reads the **title only** (fair tags are loose: a game show tagged "เวิร์กช็อป") against each group's `keywords`, most specific group first (`FAIR_MATCH_ORDER`); Latin keywords match whole words. New icons in `ICON_OPTIONS`: MicVocal, PartyPopper, Trophy, HeartPulse, Drama, House, Car.

### BE-089 · Meetups: 18 categories, Lemon8-inspired (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- `MASTER_COMMUNITY_LIFESTYLE_CATEGORIES` (`data/masterHub.ts`) and `data/master_data.json` go from 8 to 18, tab order grouped by mood. chill: คาเฟ่ & พบปะชิลล์ · ตะลุยกิน & ร้านเด็ด · บอร์ดเกม & ปาร์ตี้ · เกม อนิเมะ & ป๊อปคัลเจอร์ · ดูหนัง ฟังเพลง & คอนเสิร์ต · สัตว์เลี้ยง & ครอบครัว. move: งานวิ่ง & ฟิตเนส · กีฬาทีม & แร็กเกต · เต้น & ขยับ · ท่องเที่ยว & เอาต์ดอร์. heal: ฮีลใจ & สมาธิ · ดูแลตัวเอง & บิวตี้ · จิตอาสา & ทำดี. learn: ศิลปะ & งานคราฟต์ · ถ่ายรูป & ทำคอนเทนต์ · ทำอาหาร & เบเกอรี่ · หนังสือ & ภาษา · อาชีพ เทค & การเงิน (was ทักษะ & เทคโนโลยี, same id `tech_skills`).
- New ids: `food_hunt`, `gaming_anime`, `movies_music`, `sports_club`, `dance_move`, `beauty_selfcare`, `volunteer`, `photo_content`, `cooking_baking`, `books_language`. The 8 old ids stay.
- `getCommunityEventCategory` is now keyword-based like the fair one: title first, then the host's tag, then the old mood; most specific group first (`MEETUP_MATCH_ORDER`). No dating or nightlife group on purpose (trust and safety). New icons in `ICON_OPTIONS`: Clapperboard, Disc3, Gem, HandHeart, ChefHat. `CATEGORY_SHORT` in `app/HomeView.tsx` has the new "สาย…" names.

### BE-090 · Hosts pick the group in the create forms (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- **`EventItem`** gains `lifestyleCategory?` (meetup category id) and `fairCategory?` (fair group id). Both list matchers already use them first; events without one are still sorted by title.
- **Member form** (`components/CreateEventModal.tsx`): a meetup picks one of the 18 categories as pills under the 4 mood headings (required; the mood follows), a fair picks one of the fair groups (required). The review step shows the picked name.
- **Admin form** (`components/AdminCreateEventModal.tsx`): the mood select is now "หมวดกิจกรรม" / "ประเภทงาน" with the groups from master data (meetups in mood optgroups), plus "ให้ระบบเลือกจากชื่องาน" to leave it to the title.
- **Server:** `lib/eventCategories.ts` (`checkedEventCategories`) keeps only an active group of the right kind and sets the meetup mood from it; used by `POST /api/events` and `/api/admin/events` `create` and `update_fields` (both fields added to `MUTABLE_EVENT_FIELDS`). `docs/API.md` updated.

### BE-091 · Places: 16 categories, nightlife included (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- `SpotVibeId` / `MASTER_SPOT_CATEGORIES` (`data/masterHub.ts`) and `data/master_data.json` go from 7 to 16, in this order: ภูเขา & ทะเลหมอก · ทะเล & เกาะสวย · ป่า น้ำตก & กางเต็นท์ (renamed) · จุดชมวิว & รูฟท็อป · สวน & พื้นที่สีเขียวในเมือง · วัด & สายมู · ย่านเก่า & วิถีชุมชน · พิพิธภัณฑ์ & แหล่งเรียนรู้ · หอศิลป์ & สเปซศิลปะ · คาเฟ่ & สเปซนั่งชิลล์ · ร้านอร่อย & สตรีทฟู้ด · ตลาด & ถนนคนเดิน · บาร์ & ไนท์ไลฟ์ · สวนสนุก & กิจกรรม · ช้อปปิ้ง & ไลฟ์สไตล์มอลล์ · สปา & จุดฮีลใจ. New ids: `views_rooftop`, `city_parks`, `temple_mu`, `museum_learning`, `food_street`, `market_walking`, `nightlife_bars`, `fun_activities`, `shopping_mall`.
- `getSpotVibeCategory` (`data/spotsData.ts`) rewritten: the stored category decides, the title refines it (temples get their own tab, malls and bars too; a "Cafe & Bar" stays a café). Catalog today: วัด 562, ป่า 414, คาเฟ่ 323, ย่านเก่า 306, ทะเล 149, พิพิธภัณฑ์ 87, ภูเขา 80, ตลาด 71, สวน 65, จุดชมวิว 30, ห้าง 28, สปา 25, สวนสนุก 21, หอศิลป์ 17, บาร์ 1, ร้านอร่อย 0 (empty tabs stay hidden until content arrives).
- Three new stored types for suggestions and admin: `restaurant`, `attraction`, `mall` (`LifestyleSpotItem['category']`, `lib/spotCategories.ts`, the admin whitelist, scraper labels). Labels: `market` = ตลาด & ถนนคนเดิน, `viewpoint` = จุดชมวิว & รูฟท็อป, `bar` = บาร์ & ไนท์ไลฟ์.
- Home places row (`VIBE_ORDER` in `app/HomeView.tsx`, `app/journey-simple/page.tsx`) takes every vibe in turn.
- Also fixed: two regexes held invisible control characters instead of `\b` (the home "run" check, which never matched, and the "16:00 - 16:00" time fix in `EventDateList.tsx`).

### BE-092 · Member home uplift, My Hub week and month, stamp passport (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- **Split agreed with the owner:** home is about friends and what is happening; My Hub is where members manage their own activity. Home shows a short summary that leads to My Hub. Draft: https://claude.ai/artifact/6NJ3p8SVkAPH8EG9cAj9cK
- **Home (`components/home/MemberLiveHome.tsx`, `app/HomeView.tsx`):** greeting with the time of day ("บ่ายวันอาทิตย์") and this month's "Chill N · Connect N", which opens `/myhub#my-month` (grey zeros plus "ไปตี้แรก = Connect แรกของคุณ รับ +50 XP" before anything counts). Below wide screens the greeting and plans sit in the feed's column (they used to start at the page edge). "ถัดไปของคุณ" is up to three rows in the right-column style (joined, hosted, then saved fairs); only the soonest has a countdown; meetups show faces from `/api/events/[id]/attendees`, fairs never do. The challenge card left home (it is "กำลังทำอยู่" in My Hub). Meetups between posts and in the right column are invites ("{host} ชวนไปด้วยกัน", seats as dots, "ขอไปด้วย" opens the meetup page where joining asks for the safety checks). Without plans the feed still comes first; three picks from the liked สาย sit after the first post on every size.
- **Stamp passport (`components/home/StampPassport.tsx`, wide screens, left column):** one stamp per finished challenge, joined ones as dashed outlines with the steps to go, other running challenges as "+N".
- **My Hub (`app/myhub/page.tsx`, `components/myhub/MyMonthSection.tsx`):** the schedule gains a "สัปดาห์" view (seven days from today, a dot per item in its pillar colour) and opens on it; รายการ and เดือน are unchanged. New "เดือนนี้ของฉัน": meetups gone to with faces, places and fairs visited, "แชร์โมเมนต์" opens the composer with the place filled in.
- **API:** `GET /api/visits?mine=1&month=1` adds `month` (`lib/social/myMonth.ts`; client hook `lib/useMyMonth.ts`). `docs/API.md` updated.
- Feed inserts (`HomeMomentFeed`) now set their own screen sizes; insert 0 also shows on an empty feed.

### BE-093 · Sliding สาย cards, หน้าแรก tab, passport moves to My Hub (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- **Landing (`app/HomeView.tsx`):** the "เลือกกิจกรรมตามสายที่ชอบ" cards are one sliding row on every screen (`ScrollRow`: phones swipe, iPad and up get arrows) instead of a 9-column grid that wrapped to three lines.
- **Mobile menu (`components/MobileNav.tsx`):** หน้าแรก is the first tab (id `home`, `/`). Members see five tabs, visitors four.
- **Member home (`components/home/MemberLiveHome.tsx`):** "Chill 0 · Connect 0" keeps its brand colours at zero (no grey). The stamp passport left the home page; the left column's "ของฉัน" list (now four rows: ตารางของฉัน, พาสปอร์ตของฉัน, ตี้และที่เที่ยวที่บันทึก, ของรางวัล; own and saved moments stay in the feed's ··· menu) has the passport with the stamp count, opening `/myhub#my-passport`.
- **My Hub (`app/myhub/page.tsx`):** the stamp passport sits in the left column under "เดือนนี้ของฉัน" (on phones after the schedule). `buildPassport` in `components/home/StampPassport.tsx` builds it from `/api/rewards` and `/api/quests`.
- **Home feed stories (`components/home/HomeMomentFeed.tsx`, `components/moments/StoriesRail.tsx`):** the row of circles shows only when someone has a story (`hideWhenEmpty`); adding one is a "+ สตอรี่" button beside the "วันนี้ไปไหนมา" composer (`addSignal`). /moments keeps its row with the "+" circle.
- **Member home right column (`components/home/MemberLiveHome.tsx`):** every row is when / one title line / who-where, so rows share one height. The challenge section is renamed "ชาเลนจ์ยอดฮิตตอนนี้" (it counts everyone, sorted by participants), with "เหลือ N วัน" on top. Close dates read "วันนี้" / "พรุ่งนี้" (meetups and fairs, also in ถัดไปของคุณ; fairs also "วันนี้วันสุดท้าย"). New shared helper `nearDayLabel` in `lib/dateUtils.ts`; the visitor landing keeps plain dates so server HTML and the phone never disagree.
- Challenge categories already use the 18 meetup groups (rail, admin form, member submissions); nothing changed there.

### BE-094 · /moments becomes a photo showcase, every moment gets its own page (owner request, 2026-10-18)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-18 · `claude`
- **Why:** Home is already the social feed (posting, comments, stories). /moments now has one job: browse what people did, Lemon8-style, and go there next.
- **`/moments` (`app/moments/page.tsx` → `components/moments/MomentShowcase.tsx`):** server-rendered full-width grid whose rows line up: 3 columns on computers, 2 on iPads and phones (owner 2026-10-18). Each card is a small Home-style moment post: author on top, one photo frame (square on computers, 3:4 on iPad/phone), 2-line first caption line, the pillar-coloured place box linking straight to the place/event ("ไปที่นี่บ้าง →" on computers), likes and comments. Photo and caption open the moment. Playful header like the landing hero (owner 2026-10-19): cream band with soft circles, three tilted prints of the first moments with white stickers, "ไปไหนมา? ดูโมเมนต์จริงจากเพื่อนๆ", one rose button "แชร์โมเมนต์ของคุณ" (to `/?share=new`). Type tabs ทั้งหมด / สถานที่ / ตี้ / งานแฟร์ / ชาเลนจ์ (`?type=`) are text tabs with a pillar-colour dot and the tilted highlighter, same as the ค้นพบ header. Cards: "1/N" on the photo when there are more (as on Home); photos lift and lean a little on hover. `?targetType&targetId&location` still shows one place's moments. No side column and no recommendation cells (owner removed them 2026-10-19): the page is moments only. Sample moments now carry their measured `imageRatio` (`SAMPLE_IMAGE_RATIOS` in `lib/moments/jsonMomentRepository.ts`), like real uploads. Composer, stories rail, following/saved tabs removed from this page (Home has them).
- **`/moments/[id]` (new, `components/moments/MomentDetailView.tsx`):** photos, caption (first line is the h1), place chip and a black "ไปที่นี่บ้าง / ดูตี้นี้ / ดูงานนี้ / ทำชาเลนจ์นี้" button, like, save, share, comments, report/delete. The place uses the same box as the cards ("ไปที่นี่บ้าง →"). Comments: the box comes first, then the newest 3 with "ดูความคิดเห็นทั้งหมด (N)" for the rest (all are in the server HTML); the photo stays in view on computers. No "more moments" section: the page is only this moment (owner 2026-10-19). Sample moment "post-spot-1" carries 20 sample comments for testing; new sample comments in `MOCK_POSTS` are added to stored samples on load. Own metadata, `SocialMediaPosting` + breadcrumb JSON-LD (`momentJsonLd` in `lib/structuredData.ts`), in `app/sitemap.ts`. Shows the author's display name and avatar only; hidden/removed/banned-author moments are 404 and drop out of the sitemap.
- **Sharing a moment opens where the member is:** `components/VisitPanel.tsx` (detail pages) and My Hub's "แชร์โมเมนต์" open `MomentComposer` in place, tied to that event or place. "Share yours" links elsewhere go to `/?share=new`, which opens Home's composer (`HomeMomentFeed` reads `?share=<type>:<id>&title&location`).
- **Old links:** `/moments?momentId=X` → 307 to `/moments/X`; `/moments?createForEvent=…` → 307 to `/?share=…`. All in-app `?momentId=` links now point at `/moments/[id]`.
- **Shared code:** `listMoments` / `findPublicMoment` in `lib/moments/service.ts` (used by `GET /api/moments`, which also takes `&category=` now); `components/moments/momentTargets.ts` holds the target labels/colours (Home feed uses it too).

### BE-095 · ค้นพบ: three quick filters, saved on the right, "show more" instead of pages (owner request, 2026-10-19)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-19 · `claude`
- **Filter row (`app/community/CommunityListView.tsx`, `app/fairs/FairsListView.tsx`, `app/spots/SpotsListView.tsx`):** left side keeps three quick filters: date, free, upcoming (spots: ใกล้ฉัน, เข้าฟรี). Removed: meetups "เหมาะกับ" and "มีที่ว่าง", fairs "สถานที่จัด". The right side drops the "พบ N" count and the meetups sort dropdown; it now holds the ♡ "ที่บันทึกไว้ (N)" button (heart + number on phones) and the card/list switch. "ล้างตัวกรองทั้งหมด" shows only when a filter is on. `?seats=open` and `?club=` links still filter.
- **Meetups:** the "Top Community Circles & Clubs" rail is gone from /community (`components/TopCommunityRail.tsx` still exports `TOP_COMMUNITY_CLUBS` for `?club=`).
- **Show more (new `components/discover/ShowMoreButton.tsx`):** page numbers replaced by one "แสดงเพิ่มเติม" button that adds the next batch under the list (Meetup-style). `currentPage` now means "batches shown", so every filter that reset to page 1 folds the list back. The server HTML still carries the first batch. `/challenges` keeps `Pagination`.
- **Challenge card (`components/ChallengeCard.tsx`, /challenges card view):** the landing's playful look. Frameless; the photo is a tilted print (white border, ±1°, straightens on hover) with the XP as a tilted sticker on its corner. The prize sits as a strip on the photo's lower edge, inside the white border, only when there is a real one (shop gift in amber, named medal in purple); the generic "สะสม XP แลก..." line and the repeated "+N XP" are gone. Host shows only for partners ("โดย …"). The title is the card's one link (stretched over the card), with a quiet "ดูชาเลนจ์ →" in place of the black button. New optional `index` prop picks the tilt.
- **Landing fix (`components/ChallengePicks.tsx`):** the "ชาเลนจ์สนุก" row clipped tilted photos and XP stickers at its edges; it now has 12px of room inside (with a matching negative margin) on iPad and up.
- **/challenges card grid:** 4 columns on computers, 5 on very wide screens (2 on iPad portrait, 3 on iPad landscape), same as the ค้นพบ grids; cards per page from `useResponsiveItemsPerPage` so rows are whole.
- **Short prize label:** `brandReward.shortTitle` (optional, at most `PRIZE_LABEL_MAX` = 24 characters counted as people read them, checked by `POST /api/admin/quests`; `docs/API.md` updated). Admin challenge form has "ชื่อรางวัลแบบสั้น (บนการ์ด)" with a live counter. The card shows `questPrizeLabel(quest)` (`lib/questDisplay.ts`): the short label, else the title without "(มูลค่า …)" / "+ N XP"; the full prize stays on the challenge page and in the strip's hover text. Seed prizes carry labels; `SEED_QUEST_TEXT_VERSION` 5 copies them onto stored seed quests whose prize is unchanged. Strip text back to 12px.
- **Challenge card title:** 13px phones / 14px wider, 2 lines kept free (same as the meetup cards in `EventGrid`), so the goal and footer line up across a row.
- **Create buttons in their pillar colour (owner 2026-10-19):** ตั้งตี้เอง darker orange `#D04A1B`, เพิ่มงานแฟร์ `#2B527A`, แนะนำที่ใหม่ `#4A7C59`, เสนอชาเลนจ์ `#7C3AED`, instead of black. Written into `DESIGN_SYSTEM.md` as the one exception to "no pillar colour on buttons".
- **การ์ด/รายการ switch (`components/ViewModeToggle.tsx`):** 36px tall and round like the filter pills (was ~30px with 11px text), 13px text, 16px icons, `aria-pressed`. Used on มีตอัป, งานแฟร์, ที่เที่ยว.
- **Top bar menu (`components/Navbar.tsx`):** the "เมนู" button and its drawer are for members only on every page (before: hidden for visitors on the landing page only). Visitors get เข้าสู่ระบบ / สมัครฟรี; phones keep the bottom tab bar; on computers the logo leads back to the landing page.
- **/challenges search box removed:** the top bar search covers it ("ชาเลนจ์ที่ตรงกับ …" on ค้นพบ links to `/challenges?q=`). A `?q=` word shows as a violet chip "“word” ✕" at the start of the filter row; tapping it clears the word.
- **/challenges categories = the landing's sticker cards:** new shared `components/CategoryStickerCards.tsx` (`CategoryStickerCards` + `communityCategoryCards`), taken out of `app/HomeView.tsx` ("เลือกกิจกรรมตามสายที่ชอบ" uses it unchanged). /challenges shows ทั้งหมด plus only categories that have challenges, no grey box; `CommunityCategoryRail` is no longer used there.
- **Prize as a raffle ticket (`components/ChallengeCard.tsx`):** replaces the strip. A small ticket stuck over the photo's lower-left edge: notched short sides (CSS mask), a coloured stub with the icon (amber ticket for partners, violet medal for Hub medals, grey when ended), a dashed tear line, the short label in dark text on a near-white body. It leans only with its photo: no own tilt and no filter shadow, which had blurred the label. Every photo keeps 12px below it so rows line up.
- **/challenges laid out like ค้นพบ (owner 2026-10-19, replaces the sticker cards there):** filter row first (search chip, ช่วงเวลา, ทำอย่างไร, ของรางวัล, ล้างตัวกรอง; right: ที่ฉันทำอยู่ + the shared `ViewModeToggle`), then `DiscoverCategoryTabs` (new kind `challenges`, violet underline) right above the list. Challenge pills use `challengePillClass` (`components/ChallengeFilters.tsx`) on the shared `FILTER_PILL` shape from `DiscoverHeader`. `CategoryStickerCards` stays for the landing only.
- **/challenges search searches challenges (fixes the top bar sending people to ค้นพบ):** new `components/ChallengeSearch.tsx` (word + blue button, no province), filters the list as you type. Computers: in the top bar via Navbar `searchSlot`; phones: at the top of the page (`md:hidden`), and the top bar 🔍 icon is gone there, as on ค้นพบ. `?q=` still fills it. The "“word” ✕" chip from earlier is removed (the box shows the word).
- **Meetups create button:** plain pillar orange `#F26430` (hover `#E2551F`, as สมัครฟรี), owner 2026-10-19, instead of the darker `#D04A1B`. All four create buttons are flat pillar colours.
- **One word for a meetup: ตี้ (owner 2026-10-19, member screens and admin):** มีตอัป and กิจกรรมคอมมูนิตี้ replaced across 46 files (ค้นพบ tab "ตี้", meetup detail page, join/cancel/check-in/review/chat messages, tickets, host forms, profile, onboarding, moments, admin sidebar/moderation/members/reports/quests/permissions/master-data labels). กิจกรรม stays only as the umbrella word (landing, about, safety/terms, site metadata, screens shared by meetups and fairs). Meetups page h1: "ตี้ชวนออกไปใช้ชีวิต"; /community title "ตี้หาเพื่อนไปทำกิจกรรมด้วยกัน". Rule written in `DESIGN_SYSTEM.md` §9. Sample challenge goals updated (seed + `SEED_QUEST_TEXT_VERSION` 6; one admin-made quest edited via the admin API). Not touched: unused components (`AdminCreateEventModal`, `EventDetailModal`, `SpotDetailModal`, `FilterDrawer`, `CommunityMoments`, `CommunityTrustSection`, `TrendingCarousel`, `MomentsStoriesRail`, `HeroSection`, `SurpriseModal`, `MoodFilterChips`) and the draft pages /preview-hero and /journey-simple; stored event `tag`/`badgeText` values (search only, not shown).

### BE-096 · Province titles on ค้นพบ, top-bar links on computers, like from the /moments grid (owner request, 2026-10-20)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-20 · `claude`
- **Province in the title (`lib/discoverMetadata.ts`, `generateMetadata` in `app/community|fairs|spots/page.tsx`):** `?province=เชียงใหม่` gives its own title, description and canonical URL ("ตี้ในเชียงใหม่ หาเพื่อนไปทำกิจกรรมด้วยกัน"; meetups also `ออนไลน์`). Only the 77 known names count; anything else and `?q=` keep the normal title. The three layouts no longer set metadata.
- **Top bar (`components/Navbar.tsx`):** ค้นพบ · โมเมนต์ · ชาเลนจ์ as text links between the search box and the account buttons, for visitors and members, from 1280px up (at 1024px they squeezed the search word field away). The current section is bold with a dark underline on the bar's edge, chosen by URL (ค้นพบ covers /community, /fairs, /spots). The drawer keeps its links.
- **/moments grid (`components/moments/MomentShowcase.tsx`, `app/moments/page.tsx`):** the heart under each card is a button (optimistic, undone with a toast on failure; visitors get the sign-in dialog). A signed-in member's first page is read again in the browser so their own hearts show. Each type tab shows its count (counted on the server; not on one place's moments).
- **Landing hero (`app/HomeView.tsx`):** "ดูตี้ที่เปิดรับอยู่" now scrolls to the ตี้ photo tiles (`#journey-meetup-tiles`), not the category heading that was already on screen. Beside it a white "ดูโมเมนต์" button (rose camera icon) scrolls to `#journey-moments`. Phones: the two share the row half and half.
- **Landing hero:** "สมัครฟรี ไม่มีค่าใช้จ่าย" under the buttons removed (owner 2026-10-20); the top bar สมัครฟรี button says it. The live joins line stays.
- **Landing hero stickers (`HERO_STEPS` in `app/HomeView.tsx`):** "เลือกกิจกรรมที่ใช่ · ออกไปใช้ชีวิต · แชร์โมเมนต์" (owner 2026-10-20), the same three labels the planned onboarding finish and member home journey will use.

### BE-097 · Member journey band: ① เลือกกิจกรรมที่ใช่ ② ออกไปใช้ชีวิต ③ แชร์โมเมนต์ (owner request, 2026-10-20)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-20 · `claude`
- **Why:** landing and onboarding felt fun, member home felt like a different place. The landing's three steps now run through all three screens. Draft: https://claude.ai/artifact/PDuBBzZxsmzEYmJSTE1NVA
- **Band (`components/home/JourneyBand.tsx`):** a cream band above member home (landing look: tilted prints, stickers) with a 3-part progress bar and one next thing to do. `useJourney` picks the step: a ตี้ within a day → ② (countdown, faces, ดูตี้นี้ / ดูตารางทั้งหมด); a joined ตี้ that ended in the last 14 days, or a challenge with a visit → ③ (rose "แชร์โมเมนต์แรก" opens the share form tied to that ตี้); a later ตี้ → ②; a running challenge → ② challenge flavour (violet, place stamps, next unvisited place from `GET /api/quests/[id]`, the evidence hint); otherwise ① with tabs ตี้ | ชาเลนจ์ (first tab from onboarding goals: Chill goals → challenge) and three picks (the member's matched meetups, or running challenges).
- **Ends:** for good once the member has any moment (`/api/moments?tab=mine`), right after posting one, or when they tap **ข้าม** (owner request; remembered per member in this browser, `cch_journey_skipped_<memberId>`). Then home is exactly as before.
- **Member home (`components/home/MemberLiveHome.tsx`):** while the band shows, it replaces the greeting and "ถัดไปของคุณ", and the first-ตี้ picks between posts are left out. Shared time/face helpers moved to `components/home/planHelpers.tsx`. `HomeMomentFeed` takes `shareRequest` (opens the form in place) and `onPosted`. `app/HomeView.tsx` passes goals (from preferences), every joined/hosted event, challenge progress and all challenges.
- **Onboarding finish (`app/onboarding/OnboardingFlow.tsx`):** under "ยินดีที่ได้รู้จัก" the three steps as stickers ("เส้นทางของคุณที่นี่ มีแค่ 3 ขั้น"), labels from `JOURNEY_STEPS`. Skipping onboarding ("ข้ามไปก่อน") was already there.
- **Member home right column, calmer (owner 2026-10-20, `components/home/MemberLiveHome.tsx`):** only section headings bold; each row = grey "when" line with a small pillar-colour dot (`Kicker`), a regular-weight title up to two lines (`ROW_TITLE`), one grey detail line ("{host} ชวนไป · เหลือ N ที่"); seat dots removed from these rows (they stay on the invite posts in the feed); "ดูทั้งหมด" grey; rows top-aligned with 20px between, 44px between sections. During journey step ① "ชวนไปด้วยกัน" skips the three ตี้ the band shows.
- **Journey band v2 (owner 2026-10-20, designer review):** laid on member home's own columns (`lg` 1fr|320, `xl` 260|1fr|320, `2xl` 300|1fr|360): greeting + a vertical step checklist over "ของฉัน" (xl+), the step over the feed at the feed's width (560, 600 on 2xl), this month's Chill · Connect + XP and ข้าม over the right column (lg+); below xl the greeting and a horizontal bar sit above the step. ~40% shorter (≈185px on laptops). One headline per step (the ตี้, the place, or "แชร์โมเมนต์แรกของคุณ"), buttons under the words. A ตี้ counts as over at its end time (`endsAt` in `planHelpers.tsx`), so the band moves to ③ the same evening. Side columns 300/360 on `2xl` so wide screens have smaller gutters. The "สด" live line moved from above the feed to after the first post.

### BE-098 · New-member quick fixes from a sign-up walk (owner request, 2026-10-22)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-22 · `claude`
- **Why:** a walk as a brand-new member (sign-up → onboarding → first home) found friction before the first screen of content.
- **Sign-up (`components/auth/AuthPanel.tsx`, `lib/members/accounts.ts`):** no name on the sign-up form (owner 2026-10-22): onboarding step 2 asks "เพื่อนใหม่ จะเรียกคุณว่าอะไรดี". `POST /api/auth/member/register` takes `displayName` as optional; without it the account is named "สมาชิกใหม่" (`NEW_MEMBER_NAME` in `lib/displayName.ts`), never the email. Onboarding starts the name empty when the account name is that placeholder or the email's first part. The choice screen keeps Google / Apple / Facebook (owner: keep them, "เร็วๆ นี้" until set up) but no longer greys every button until two boxes are ticked: one line under them says signing up confirms age 18+ and the terms (`consent=1` to the server). The email form has one box, "ฉันอายุ 18 ปีขึ้นไป และยอมรับ ข้อตกลง… และ นโยบาย…", which sends both `consent` and `ageConfirmed`; unticked, a red line says what is missing.
- **Onboarding (`app/onboarding/OnboardingFlow.tsx`):** pillar label on cards and picks says "ตี้" (was "คอมมูนิตี้"); the "มีเป้าหมายเล็กๆ ให้ตัวเอง" card uses a coffee photo (`public/images/challenges/cafe-hunter.jpg`, same Unsplash photo as the Cafe Hunter challenge) instead of the HYROX arena; the finish screen's place pick now prefers the member's province over the chosen kind of place far away (Bangkok + "จุดชมวิว" used to give ผาเก็บตะวัน, นครราชสีมา).
- **Posting before verifying (`components/moments/VerifyToPostDialog.tsx`, used by `MomentComposer` and `StoriesRail`):** the popup names only what is missing (email, pledge, or both) and sends the email link in place ("ส่งลิงก์ยืนยันอีเมล" / "ส่งลิงก์อีกครั้ง", dev link shown when there is no mailer); a member missing only the pledge goes to `/onboarding?step=pledge`. It no longer sends members to the profile.
- **Not changed (waiting for owner):** the orange "สมัครฟรี" on the landing versus blue buttons in sign-up and onboarding.
- **Sign-up popup look (owner 2026-10-22):** every main button in `AuthPanel` is the blue primary (owner prefers blue over black), including "สมัครด้วยอีเมล" (was black), so the popup no longer turns from black to blue. `DialogShell` has `align="top"` (used by `AuthModal`): the popup keeps one top edge and one width across its screens, and only its height follows the content.
- **Straight to onboarding (owner 2026-10-22, `components/AuthModal.tsx`):** after "สร้างบัญชี" in the popup the page behind used to flash as the member home before onboarding opened (the popup closed first, then navigated). A new member now gets a white cover with a spinner until `/onboarding` opens; log-ins still close the popup as before. `/login` already handled this.
- **Onboarding, question side refined (owner 2026-10-22, `app/onboarding/OnboardingFlow.tsx`; no new content):** progress shows the four step names under their bars (done ones blue with a check; phones keep the one line "ขั้นที่ N จาก 4 · …"); larger step titles with more space; on computers the column is full height so the buttons sit at the bottom of the screen on short steps. Step 1: the host choices are an open section ("อยากเป็นคนชวน") instead of a grey box. Step 2: gender is one row of four (segmented) under the year; province tiles carry the name on the photo (shorter). Step 3: interest boxes lighter (plain icon, check when picked, light blue fill); the group hint shows only "เลือกแล้ว N". Step 4: the pledge is an open list with dividers and soft blue icons, the note under it with a shield icon. Walked on phone (390px) and laptop (1440px).
- **"สมัครฟรี" opened log-in on most pages (owner 2026-10-22, `components/Navbar.tsx`):** only the home page passed `onOpenSignup`; elsewhere the top-bar button fell back to `onOpenLogin`. The Navbar now opens its own `AuthModal` on the sign-up screen when a page passes no `onOpenSignup`. Checked on /challenges, /moments, /spots, /community, /fairs and /.

### BE-099 · Onboarding: 3 questions + summary with the pledge, live side panel, landing words (owner decisions, 2026-10-22)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-22 · `claude`
- **Steps** (`app/onboarding/OnboardingFlow.tsx`): เลือกสิ่งที่ใช่ · บอกเราเกี่ยวกับคุณ · บอกสิ่งที่ชอบ · ออกไปใช้ชีวิตกัน (the summary). The pledge page is gone: the four pledge lines sit on the summary and its one button "รับคำมั่น แล้วออกไปใช้ชีวิตกัน" records it (`acceptPledge`). Answers and profile are still saved when step 3 ends. A card or link tapped on the summary before the pledge scrolls to the pledge and the button becomes "รับคำมั่น แล้วไปดูตี้นี้ / ชาเลนจ์นี้ / ที่นี่ / งานนี้ / โมเมนต์นี้", then goes there (owner option ข). `/onboarding?step=pledge` is now a pledge-only screen with "ฉันรับคำมั่นนี้". "ข้ามไปก่อน" unchanged.
- **Summary "ที่รออยู่สำหรับคุณ":** welcome ("ยินดีต้อนรับสู่คอมมูนิตี้ คุณ …"), the landing's ① ② ③ as "ต่อไป แค่ 3 ขั้น", three picks: a ตี้, a ชาเลนจ์ (`/api/quests`, image required) and a place (or a fair when only fairs were chosen), "ความประทับใจที่เพื่อนๆ ส่งต่อ" (moments that fit the goals first), the pledge. The old challenges list, "ไปต่อได้ที่" pills, "เพราะคุณชอบ" chips and the email box were removed (email is handled by the home band and the posting popup).
- **Step 3** shows only interests that fit the step-1 goals (`GOAL_INTERESTS`, popular ones when no goal), "ดูเพิ่มอีก N สาย" per group, and groups with nothing suggested as buttons at the end. Question "คุณ … เป็นสายไหนบ้าง?".
- **Side panel (photo side, left):** headlines carry the landing hero (คอมมูนิตี้ของคน / ชอบ**ออกไปใช้ชีวิต**, **มิตรภาพใหม่** เริ่มจากรู้จักชื่อกัน, เลือกกิจกรรม ตามสายที่ชอบ, พบเจอ**มิตรภาพใหม่** ส่งต่อความประทับใจ; accent orange). Below: moments matching the goals (`GOAL_MOMENTS`, by `targetType`/`category`); in step 2 a moment card with the member's own name, photo and province ("โมเมนต์แรกของคุณ จะหน้าตาแบบนี้", owner idea); in step 3 meetups that fit the interests picked so far, refreshed as they tap. Phones: three small moment prints on the photo band. The pillar list was removed.
- **Copy:** sign-up popup subtitle "เข้าร่วมคอมมูนิตี้ของคนชอบออกไปใช้ชีวิต ฟรี ใช้เวลาไม่ถึง 1 นาที" (`components/auth/AuthPanel.tsx`); step 1 "ช่วงนี้ อยากออกไปทำอะไรบ้าง".
- Walked as a brand-new member on laptop and phone: steps, live panel, summary, card-before-pledge (landed on the ตี้, pledge recorded), pledge-only page.
- **Step 1 "เลือกสิ่งที่ใช่" (owner 2026-10-22, same day):** no visible title or subtitle (an `sr-only` h1 keeps one heading), goal cards 16:10 on wider screens so "อยากเป็นคนชวน" is on the first screen. New cards by the feeling of going out: Chill = เดินงานสนุก สุดสัปดาห์ (`explore_fairs`), หาที่เที่ยว ร้านชิล (`explore_spots`), ดูโมเมนต์จากเพื่อน (`browse_moments`, new); Connect = หากิจกรรมออกไปใช้ชีวิต (`join_community`), ทำชาเลนจ์สนุกๆ (`earn_xp`), พบเพื่อน มิตรภาพใหม่ (`find_friends`). `heal_self` is no longer offered (its interests stay under "ดูเพิ่ม"). `components/home/JourneyBand.tsx` `flavourFromGoals`: challenge tab first only when `earn_xp` is chosen without a meetup goal. Admin member labels updated (`components/admin/MembersManagerView.tsx`, old `heal_self` label kept for older accounts).
- **Fix, summary stuck across accounts (owner report 2026-10-23):** the summary kept in the tab (`finishedRun`, so Back from a pick returns to it) was not tied to an account, so a second account signing up in the same tab opened the first one's summary. It now carries `memberId` and only reopens for the same account. The summary also has a way out: "ย้อนกลับ" (to บอกสิ่งที่ชอบ, answers kept) and "ไว้ทีหลัง" in the progress row (leaves without the pledge; posting asks for it later). Walked: account A to the summary, back, leave, log out; account B signs up in the same tab and starts at step 1.
- **No skipping, required basics (owner 2026-10-23):** "ข้ามไปก่อน" is gone from every onboarding step and the summary (only the pledge-only screen keeps "ไว้ทีหลัง", and preview mode its exit). Step 2 requires name, birth year and area: the year and province lists start on a disabled "เลือก…" option, "ไม่บอกก็ได้" removed from both, red line under each missing field plus one summary line ("ยังขาด ชื่อ ปีเกิด จังหวัด …"), the page scrolls to the first missing one. Gender stays optional. Interests (step 3) stay optional ("ข้ามข้อนี้" when none picked). Walked on a phone.
- **Step 1 side panel (owner 2026-10-23):** back to the pillar list (พิกัดเที่ยว · ตี้ · งานแฟร์และอีเวนต์ · ชาเลนจ์ · โมเมนต์) under the headline, each lighting up as cards are picked on the right; steps 2 and 3 keep the live previews. Phones: step 1 keeps its "คุณจะได้เจอ" chips under the cards (no moment prints on the band there).
- **Step 1 tidy, host tick (owner 2026-10-23):** the "อยากเป็นคนชวน" cards left step 1; step 2 ends with one checkbox "ฉันอยากเป็นคนชวนด้วย" (sets the `community_host` goal, so the role is host and the summary offers "ส่งคำขอ"). Goal cards back to 4:3, no pillar badge on them (the side list shows where they lead), "Chill" in `#2D5A3C` and "Connect" in `#D04A1B` like the member home. Side panel brand block now matches the landing top bar: `BrandLogo size="md"`, 19px name, subtitle "Curated Lifestyle & Meaningful Activities".
- **Province, one list (owner 2026-10-23):** the 8 province photo tiles are gone; "ปกติอยู่แถวไหน" is one select in the same column as name and birth year, popular provinces first (optgroup "ยอดนิยม", then "ทุกจังหวัด"). Step 2 on a phone went from about 3,300px to about 2,200px tall.
- **No visible titles in steps 2 and 3 either (owner 2026-10-23):** like step 1, each keeps an `sr-only` h1 ("บอกเราเกี่ยวกับคุณ", "บอกสิ่งที่ชอบ"); the progress labels and the photo-side headline name the step. The summary keeps its welcome title.
- **Host choice removed from onboarding (owner 2026-10-23):** the step-2 "ฉันอยากเป็นคนชวนด้วย" checkbox and the summary's "ส่งคำขอ" box are gone ("คนชวน" read as team jargon). Hosts start from "ตั้งตี้เอง" on the meetup pages or the request on `/profile#host`. Host goals saved before still set the role (`HOST_GOALS` kept for that). Idea for later: invite to host after a member's first ตี้.
- **"บอกสิ่งที่ชอบ" = the landing's สาย cards (owner 2026-10-23):** one set, the 18 ตี้ categories drawn like `CategoryStickerCards` (tilted icon tile, colored base; no count stickers, owner 2026-10-23), the ones that fit the step-1 goals first, many may be picked (blue check sticker). Places and fairs are no longer asked: `SAI_SPOTS` / `SAI_FAIRS` and the goals fill `spotVibes` / `fairCategories` in the saved preferences, so suggestions still fit. The three groups and "ดูเพิ่ม" are gone.
- **Step order (owner 2026-10-23):** เลือกสิ่งที่ใช่ → บอกสิ่งที่ชอบ → บอกเราเกี่ยวกับคุณ → ออกไปใช้ชีวิตกัน (choices first, the form last). Steps are named in code (`STEP_LIKES`, `STEP_ABOUT`); "ย้อนกลับ" on the summary returns to บอกเราเกี่ยวกับคุณ.
- **At least 3 สาย (owner 2026-10-23):** "บอกสิ่งที่ชอบ" needs three or more picks; the button always says "ถัดไป" (no more "ข้ามข้อนี้"), a counter "เลือกแล้ว N/3" sits beside it (blue once there are three), and pressing it early says "เลือกอย่างน้อย 3 สายนะ ตอนนี้เลือกแล้ว N".


### BE-100 · Members who come for moments: new step-1 cards, moments-first summary, moments path on home (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- **Why:** moments are a core pillar, so people who come only to look, post and follow friends (not to join a ตี้) are a target too (owner 2026-10-23).
- **Step 1 cards** (`app/onboarding/OnboardingFlow.tsx`, still 6, new photos in `public/images/onboarding/` from Unsplash): Chill · ให้เวลากับตัวเอง = เดินงานสนุก สุดสัปดาห์ (`explore_fairs`, now "งานแฟร์ งานวิ่ง งานคอน เทศกาล"), หาที่เที่ยว ร้านชิล (`explore_spots`), ทำชาเลนจ์ สนุกๆ (`earn_xp`, moved here: it works alone). Connect · เจอเพื่อนสายเดียวกัน = เข้าตี้ เจอเพื่อนใหม่ (`join_community`, takes over `find_friends`, which is no longer offered but still read for older accounts), แชร์โมเมนต์ ส่งต่อความประทับใจ (`share_moments`, new), ส่องโมเมนต์ สายเดียวกัน (`browse_moments`, moved here). Admin labels updated (`components/admin/MembersManagerView.tsx`).
- **"บอกสิ่งที่ชอบ"** unchanged: at least 3 สาย for everyone (owner).
- **Summary for moments-only members** (only `share_moments` / `browse_moments` picked, `isSocialOnly`): "ต่อไป แค่ 3 ขั้น" shows ติดตามเพื่อน · กดใจ คอมเมนต์ · แชร์โมเมนต์แรก; "โมเมนต์จากเพื่อนสายเดียวกัน" (6 moments, 3 across) and "คนที่น่าติดตาม" (follow buttons) come first; the ตี้ / ชาเลนจ์ / place picks follow under "ถ้าอยากออกไปด้วย". Everyone else sees the summary as before.
- **Home band, moments path** (`components/home/JourneyBand.tsx`, rose): ① ติดตามเพื่อน (suggested members with follow buttons, "ติดตามแล้ว N/3", "ไปขั้นต่อไป →" after the first follow) → ② ส่งใจให้โมเมนต์ที่ชอบ ("ไปที่ฟีด"; moves on as soon as a like or comment is sent in the feed, through the `cch:moment-reacted` window event from `call` in `HomeMomentFeed`) → ③ แชร์โมเมนต์แรก (opens the composer). The band goes away after the first moment, as before. When the member joins a ตี้ or a challenge, the usual ① ② ③ takes over. New `GET /api/moments/journey` (docs/API.md). `FollowRow` is shared by the band and the summary.
- **Province list:** "ปกติอยู่แถวไหน" shows plain province names (names like "หาดใหญ่ • สงขลา" stay on travel tiles only).
- Walked in headless Chrome: preview run as moments-only (laptop), a real sign-up through the summary (a follow from the summary counted on home), band ① → ② → ③ with a live like, phone 390px. Test accounts `walk-social-…@example.com` / `walk-react-…@example.com` were created in `data/chill_database.json` (runtime data, not committed).
- **"บอกสิ่งที่ชอบ" side panel, counts instead of ตี้ (owner 2026-10-23, option B):** the list "ตี้ที่ตรงกับคุณตอนนี้" (matched only by the first สาย's mood, then widened to any popular ตี้, before the province is known) could show a newcomer something they don't like. It now shows "ตี้ที่เปิดรับอยู่ ในสายที่คุณเลือก" as one chip per picked สาย with open ตี้ ("บอร์ดเกม & ปาร์ตี้ 2 ตี้"); สาย with none stay out. The summary's ตี้ pick now tries the picked สาย first (near home, then anywhere) before the mood and popular fallbacks. New `lifestyleCategory` filter on `GET /api/events` (docs/API.md; groups as on the ค้นพบ tabs, `getCommunityEventCategory`). Background of the step: friends setting off together (`public/images/onboarding/friends-start.jpg`) instead of the Koh Phi Phi beach.
- Note for anyone testing: after editing `lib/db/**` restart `next dev`; the db singleton keeps the old filter code through hot reload.
- **Step-1 cards reordered and renamed (owner 2026-10-23):** Chill = หาชาเลนจ์ สนุกๆ (สะสม XP รับของรางวัล) · ออกไปใช้ชีวิต ที่ใหม่ๆ (`explore_spots`, คาเฟ่ วิวสวย ทริปสั้นๆ) · เดินงานสนุก สุดสัปดาห์ (งานแฟร์ งานวิ่ง งานคอน); Connect = เข้าตี้ เจอเพื่อนใหม่ (กิจกรรมกลุ่มคอเดียวกัน) · แชร์ความประทับใจ · ส่องโมเมนต์ เพื่อนๆ. Ids unchanged. The pillar list on the photo side follows the landing order: ตี้ · ชาเลนจ์ · โมเมนต์ · พิกัดเที่ยว · งานแฟร์.
- **Step-1 hint (owner 2026-10-23):** one grey line under the cards, "เลือกได้มากกว่า 1 ข้อ เลือกสิ่งที่ใช่ เพื่อสัมผัสทุกประสบการณ์การใช้ชีวิตกับเรา" (the step has no visible title, so nothing said that several cards may be picked).
- **"บอกสิ่งที่ชอบ" side panel, people instead of ตี้ (owner 2026-10-23, replaces the ตี้ counts above):** one line "เพื่อนสายเดียวกัน N คน รออยู่ที่นี่แล้ว" (active members who picked at least one of the same สาย; shown only above 1,000 people, otherwise "มาร่วมเป็นส่วนหนึ่งของคอมมูนิตี้สำหรับคุณรุ่นใหม่ แล้วออกไปใช้ชีวิตกัน"), no per-สาย detail. Below it "โมเมนต์จากเพื่อนๆ" (was "ความประทับใจที่เพื่อนๆ ส่งต่อ", renamed on the summary too) drawn like the landing's "เพื่อน & โมเมนต์": a stories row of five friends and one post card (photo, name, "ไปที่ …", caption, likes, comments, one comment). It is a fixed example (`STORY_SAMPLES`, `POST_SAMPLE`; photos in `public/images/` and `public/images/onboarding/people/`), not live posts, so it always reads well (owner 2026-10-23). The panel keeps one height however many สาย are picked. New `GET /api/members/interest-count?ids=…` (docs/API.md). The `lifestyleCategory` filter on `/api/events` stays (used by the summary's ตี้ pick).
- **Summary redesign (owner 2026-10-23, "ออกไปใช้ชีวิตกัน"):** one job: "you are in", then the pledge and one first step, all on one laptop screen. Right: "ยินดีต้อนรับ คุณ …" + "ก้าวแรกของคุณ เริ่มจากตรงนี้"; one first-step card (`FirstStepCard`: words lead, photo beside them) with why it was picked ("เพราะคุณชอบถ่ายรูป", from the `lifestyleCategory` that matched; a challenge first for members whose goals say challenge, `flavourFromGoals`); the other two picks as small "หรือ …" links; moments-only members get "ติดตามเพื่อนสายเดียวกัน" with follow buttons instead; the pledge (2×2) right above the button. Removed: the "ต่อไป แค่ 3 ขั้น" stickers and the moments grid. Left: a tilted member card (photo, name, province · month joined, the สาย as stickers, "ยินดีต้อนรับ!") at eye level under "พร้อมออกไปใช้ชีวิตกัน" with the smaller line "พบเจอมิตรภาพใหม่ และส่งต่อความประทับใจ". Phones: the สาย as chips under the welcome. Walked: ตี้, challenge and moments flavours at 1280×860 (no scroll), phone 390px (short scroll, button stays pinned).
- **Full-flow walk fixes (owner 2026-10-23):** (1) the summary's first step carries to home: on "รับคำมั่น" the first pick (ตี้ or challenge, with its reason and, for a ตี้, the event) is stored in the browser under `cch_first_step_<memberId>` (`FIRST_STEP_KEY` in `components/home/JourneyBand.tsx`); band step ① opens on that tab with that item first and the same reason. (2) "โมเมนต์แรกของคุณ" on บอกเราเกี่ยวกับคุณ uses a fixed café photo (`FIRST_MOMENT_SAMPLE`) instead of a random live moment. (3) Phones on บอกสิ่งที่ชอบ get the welcome line and the sample stories row above the สาย cards; the photo band's small prints (บอกเราเกี่ยวกับคุณ only) use the same samples. The onboarding no longer loads live moments at all. Walked sign-up → 4 steps → home on laptop and phone: the summary's "City Run Morning · เพราะคุณชอบงานวิ่ง" is the first ตี้ in the home band.
- **บอกเราเกี่ยวกับคุณ uplift (owner 2026-10-23):** "โมเมนต์แรกของคุณ" now follows the first สาย picked that has an example (`FIRST_MOMENT_BY_SAI`: run, café, food, board games, travel, photo, music, wellness, sports; otherwise the café default) and adds the province to its caption ("วิ่งเช้าวันแรกกับเพื่อนใหม่ สดชื่นสุดๆ ที่เชียงใหม่"). Required fields get a green tick once answered, and "อีก N ข้อ" / "ครบแล้ว" sits beside the button. Photo line: "ใส่รูปจริง เพื่อนจะทักง่ายขึ้น ไม่ใส่ก็ได้". Phones get the example as one small card above the form. Summary headline is now "พร้อมออกไปใช้ชีวิตกัน".
- **เลือกสิ่งที่ใช่ on phones (owner 2026-10-23):** goal cards are one row each, all the same size (80px photo left, title and subtitle right in dark text); no more stretched third card. iPad and up keep the photo cards.

### BE-101 · Landing: เพื่อน & โมเมนต์ first, join band under it, fixed example when real moments are few (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- **Order** (`app/HomeView.tsx`, visitors): hero → เพื่อน & โมเมนต์ (unchanged size; no bridge line, owner: the next section is one short scroll away) → เลือกกิจกรรมตามสายที่ชอบ → ชาเลนจ์ → the join band "สุดสัปดาห์นี้ ออกไปด้วยกันไหม?" (after the ตี้ and XP its words name) → ไปไหนดี → งานแฟร์. Why: the hero says "คอมมูนิตี้ของคนชอบออกไปใช้ชีวิต", so people and their moments come first as proof, then how to start, then the invitation.
- **Fixed example** (`data/landingMomentsSample.ts`, a copy of what the wall showed on 2026-10-23): `components/FriendsMomentsWall.tsx` shows it when fewer than 5 real moments with photos come back (or the request fails), so the section never looks empty after launch. In that mode its links go to `/moments`, not to the sample ids or profiles; only place links to catalog spots stay.
- **Hero "ดูตี้ที่เปิดรับอยู่"** now scrolls to the section heading (`#journey-meetups`), so "เลือกกิจกรรมตามสายที่ชอบ" and the สาย cards show above the ตี้ photos (owner 2026-10-23).
- **Top-bar search opens the first tab with results (owner 2026-10-23, `components/discover/SiteSearch.tsx`):** on landing, /moments and every page using the site search, Enter or the button asks `GET /api/discover/counts` and opens ค้นพบ on ตี้, else งานแฟร์, else ที่เที่ยว (e.g. น่าน, กระบี่, สงขลา open on places). Nothing anywhere, or the count fails: ตี้ as before.

### BE-102 · Challenges follow the สาย picked in onboarding (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- Challenges already use the 18 ตี้ สาย (since 2026-10-16); this connects them to the member's onboarding answers (`preferences.interests.communityCategories`).
- **Onboarding summary:** the challenge pick ranks challenges in the สาย picked first (in the order picked) and says "เพราะคุณชอบ…"; covers fall back to `badgeCoverImg`, as the home band does (most challenges have no `image`).
- **Member home:** the challenges list (band step ① ชาเลนจ์ tab and the right column) puts the member's สาย first, then the most joined.
- **/challenges:** for members, their สาย tabs come first with a small orange dot ("สายของคุณ" in the title and for screen readers). `DiscoverCategoryTabs` takes `mineIds`.
- Tabs only list สาย that have challenges, so /challenges shows 5 now (คาเฟ่, งานวิ่ง, ท่องเที่ยว, ฮีลใจ, ศิลปะ); the other 13 appear when challenges are added (LAUNCH_CHECKLIST).
- **Admin** (`components/admin/QuestsManagerView.tsx`): a new challenge no longer defaults to the non-existent `social`; the สาย select starts on "เลือกสาย" and is required. The list shows the สาย name instead of its id.
- **ค้นพบ pages too (owner 2026-10-23):** /community, /fairs and /spots put the member's own categories first with the same dot (`communityCategories`, `fairCategories`, `spotVibes` from onboarding; fairs and places are the ones onboarding inferred from the สาย). Nothing is selected for them: every category stays one tap away. One hook, `lib/useMyInterests.ts`, feeds the three pages and /challenges.

### BE-103 · Sign-up to join keeps the ตี้; email verification said up front (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- Found by walking landing → ตี้ → sign up → onboarding → join: the join intent was lost, onboarding suggested a different ตี้, and "verify your email" appeared only as a 3-second toast after "ยืนยันการเข้าร่วม".
- `RequireMembershipModal` and `AuthModal` take `returnTo`; the ตี้ page passes `/community/<id>?join=1`, and on return the page opens the join dialog by itself (then drops `join=1`).
- Onboarding (`app/onboarding/page.tsx`) reads that ตี้ on the server; the summary leads with "ตี้ที่คุณเลือกไว้" and the finish button returns there. Its สาย is pre-picked in step 2.
- The join dialog shows what the account still needs (`components/JoinReadinessNotice.tsx`: confirm email, with "ส่งลิงก์ยืนยันอีกครั้ง", or accept the pledge) and disables the button until then.
- The verification email carries `next` (a same-site path, checked with `safeReturnPath` when sending and when opening); "ยืนยันอีเมลแล้ว" offers "กลับไปเข้าร่วมตี้ต่อ". The profile line and the verified screen now say verification is needed to join ตี้ too. `/login`'s back link goes back to the ตี้ when it came from one.
- Removed "แชร์ของคุณ" from the landing's friends row (visitors have nothing to share yet; owner).

### BE-104 · One header for the four detail pages, link strip, live related ตี้ (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- Owner-approved draft: https://claude.ai/artifact/Le2sWRDHC6vGeCRne4dRWT (detail pages for ก่อน / ระหว่าง / จบ).
- `components/detail/DetailHero.tsx`: photo left (4:3, whole photo, no more cropped 320px band), pillar tag, chips, one `<h1>`, the facts needed to decide, one blue main action. Used by `/community/[id]`, `/fairs/[id]`, `/spots/[id]`; the challenge page was the model and keeps its layout. Server-rendered (title, facts and action are in the HTML; JSON-LD unchanged).
- Main actions: ตี้ = ลงทะเบียนเข้าร่วม (ดูบัตร / แชตกลุ่ม after joining); งานแฟร์ = บันทึกงานนี้ (+ เว็บไซต์งาน or ซื้อบัตร); ที่เที่ยว = บันทึกที่นี่ (+ นำทาง). Buttons follow DESIGN_SYSTEM (blue primary); the phone bar on the ตี้ page is blue too.
- `components/detail/PillarLinks.tsx`: the strip under the header (challenge it counts toward, place it meets at, moments) read from `GET /api/visits?targets=`.
- Removed the 5-photo grid, the "(Fullscreen Lightbox)" hint and the duplicate facts in the side cards.
- The "ตี้อื่น" row on a ตี้ page used the bundled sample list (ticketed fairs showed up); it now lists open ตี้ from `/api/events?type=community&status=recruiting`, same สาย first.

### BE-105 · After a ตี้: review, "อยากเจออีก", moment (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- `components/detail/AfterTeePanel.tsx` on the ตี้ page, once the host confirmed the member came (or the ตี้ ended): stars + tags + short text (`POST /api/events/{id}/review`, existing), "อยากเจอใครอีก", "แชร์โมเมนต์จากตี้นี้".
- New: `GET/POST /api/events/{id}/meet-again` (`lib/social/meetAgain.ts`). Only the host and checked-in participants can pick each other; picks are private; a mutual pick opens a two-person chat room `pair~a~b` (`lib/social/chat.ts`) and notifies the other person (`match` notification). Picks are removed with the account.
- `useMyActivity()` now carries `reviewedEventIds`, and joined events carry `checkedInAt` / `hasHostCheckIn`.

### BE-106 · Challenges count only checkable proof (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- Owner rule: proof of going matters for ตี้ (host check-in) and challenges; going to a place or fair on your own is personal and needs no proof.
- "มาที่นี่แล้ว" (`marked`) never counts toward a challenge any more, whatever the rule says (`minEvidenceOf`).
- A moment at a place or fair records `evidence` (`lib/moments/evidence.ts`): `auto` when the phone's location at posting time is within 300 m of the place (fresh, accurate fix), else `pending` until staff pass it. Pending photos do not count. Older posts without `evidence` count as before.
- The composer asks for the location when posting at a place or fair and says what happens. Staff see "รอตรวจ" with the reason and pass it ("ผ่าน นับเป็นการไป") in Moments → ใช้นับชาเลนจ์ (`accept_evidence` now also passes a pending photo).
- Limit (web prototype): the browser cannot prove a photo came from the camera, and a location can be faked; staff review and partner QR codes later cover that (LAUNCH_CHECKLIST).

### BE-107 · The rest of the detail-page draft: during, waiting list, questions, attendance, recurring dates, reviews, checklist (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- **Recurring ตี้ by date** (`lib/social/recurring.ts`): a recurring ตี้ is a series; each date becomes its own event `<seriesId>--YYYY-MM-DD` (field `seriesId`) the first time someone joins it, so tickets, check-in, chat, reviews and the waiting list work per date. `GET /api/events/{id}/dates` lists the next 8 dates with seats; `POST /api/auth/member/activity {action:'join', eventId, date}` joins one. Dates are hidden from listings (`queryEngine` and the `/api/events` fallback) and their pages use the series as canonical URL. Page: `components/detail/SeriesDates.tsx` ("เลือกวันที่จะไป"); the header and the phone bar point there, the side booking card is hidden on a series. **The running dev server needs one restart** for the listing filter (the database object is kept across hot reloads).
- **During (the day):** `components/detail/DayOfPanel.tsx` for participants (countdown, ticket, way there, group chat, "แจ้งว่าไปสาย" posts in the chat, who has arrived); `components/detail/HostCheckIn.tsx` for the host (ticket code or confirm each person, with their attendance record). `GET /api/events/{id}/attendees` adds `arrived` (only for people in the ตี้) and `attendance`.
- **Attendance record** (`lib/social/attendance.ts`): "มาตามนัด x/y" over ended ตี้ run by a member host; shown on attendee tiles and in the host's list. No-shows are people not confirmed by the host who did not cancel.
- **Waiting list** (`lib/social/waitlist.ts`, `GET/POST /api/events/{id}/waitlist`): a full ตี้ offers "ต่อคิวรายชื่อสำรอง"; when a seat frees up the first in line is notified (`seat`) and the seat is held for 2 hours (others get "ที่ว่างนี้กันไว้ให้คนในรายชื่อสำรองอยู่"). No scheduler: the queue moves on whenever it is read or changed.
- **Questions to the host** (`lib/social/eventQuestions.ts`, `GET/POST /api/events/{id}/questions`): public Q&A on every ตี้, server-rendered for search engines; members ask, the host answers (notifications `question` / `answer`), the asker can delete, the host can hide.
- **Rating places and fairs:** `POST /api/visits {action:'mark', rating, review}` takes a short review; `GET /api/visits?reviews=spot:ID` lists them. `components/detail/VisitReviews.tsx` on both pages (form for members who marked "มาที่นี่แล้ว").
- **Challenge checklist:** `GET /api/quests/{id}/checklist` → counted / pending / rejected per place; `components/detail/ChallengeChecklist.tsx` on the challenge page for members who joined ("ส่งรูปใหม่" for rejected ones).
- Account deletion also removes waiting-list entries and the member's questions.

### BE-108 · Fair dates as a range; fixed photos in the /moments header (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- **New shared helper** `formatEventDateRange(event)` in `lib/dateUtils.ts`: "23 ต.ค. - 1 พ.ย. 2569", "29 - 31 ต.ค. 2569", or one day when there is no `endDate`; always B.E.
- Used for fairs (`eventType: 'public_venue'`) on grid cards (`components/EventGrid.tsx`), the hero fair list (`components/HeroSection.tsx`), the fair detail page, its share text and its meta description. Before, these showed only the start date. Meetups keep `event.date` (a recurring ตี้ stores its repeat-until day in `endDate`).
- `/moments` header collage (`components/moments/MomentShowcase.tsx`) now uses three fixed photos from `public/images/onboarding/` instead of the newest moments, so it no longer changes with what members post.
- Landing "งานแฟร์ งานวิ่ง งานคอน ช่วงนี้" (`app/HomeView.tsx`): phones now show a 56px poster beside the date and let the title run to two lines; the dates use the shared range ("15 - 26 ต.ค.", year dropped).
- Removed the hand-made seed fair `fair-book-expo-2026` (from `data/mockData.ts` and `data/chill_database.json`): it duplicated the QSNCC-sourced "BOOK EXPO THAILAND 2026" with wrong dates (15–26 ต.ค. vs the official 23 ต.ค. – 1 พ.ย.).
- Landing "สายเที่ยว สายชิล ไปไหนดี?": the place count moved into the head link ("ดูทั้งหมด 2,043 แห่ง →", count hidden on phones) like the fairs head; the separate "ที่เที่ยวทั้งหมด" chip under the row is gone.
- Member home journey band (`components/home/JourneyBand.tsx`, `components/home/MemberLiveHome.tsx`): now the permanent call to go out. No "ข้าม" button and no skip key (`cch_journey_skipped_*` is no longer read), and it stays after the first moment, running the loop ① pick ② go ③ share. Step ③ asks only for a ตี้ that ended after the member's newest moment; the moments-only path (follow, react, first post) ends at the first moment. The old greeting and "next up" block no longer show on home, since the band greets and shows the next ตี้.
- Journey band wording and height: step ① says "หาตี้ต่อไปของคุณ" / "เลือกชาเลนจ์ต่อไป" once the member has joined something or shared a moment ("แรก" only before); step ③ says "แชร์โมเมนต์จากวันนั้น". The step ① pick cards use 16:9 photos and a one-line title, so the band is about as tall as at step ②.

### BE-109 · Journey band: three tabs, four ways out, fold to one line (owner 2026-10-23)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-23 · `claude`
- `components/home/JourneyBand.tsx` rebuilt. The steps ① เลือกกิจกรรมที่ใช่ ② ออกไปใช้ชีวิต ③ แชร์โมเมนต์ are tabs; the band opens on the one that needs the member (a plan within a day → ②, somewhere to share → ③, any plan → ②, else ①). Tick on ① when there is a plan, a dot on ② / ③ when something waits.
- ① picks across ตี้, ชาเลนจ์, ที่เที่ยว, งานแฟร์, three at a time, with "สุ่มใหม่" (fresh three not seen yet). Places and fairs get "อยากไป" (the saved list, `activityActions.setSaved`), which opens ② on that plan; ตี้ and challenges are joined on their own page. Heading "เลือกกิจกรรมแรกของคุณ" only before the member has been out, then "อยากไปไหนต่อดี?".
- ② shows every plan, soonest first, one at a time with ‹ ›: joined ตี้, own ตี้ ("ตี้ที่คุณเปิด", "ดูคนที่ลงชื่อ"), saved fairs, challenges under way, saved places. Places and fairs (a fair from its first day) are marked "ไปมาแล้ว" here (`POST /api/visits` action `mark`), which opens ③. "หาอีกอย่าง" goes back to ①.
- ③ asks for a moment from where they just went (a ตี้ that ended, a place or fair marked, within 14 days and after the newest moment); else "วันนี้ไปไหนมา?".
- "พับ" folds the band to one line with the next thing ("② ตี้ · พรุ่งนี้ · 12:00 · …"), remembered per member in `localStorage` (`cch_journey_folded_<id>`); it opens again by itself when what the band would show changes. Every tab keeps one height from iPad up (285px on desktop).
- New `MemberLiveHome` props from `app/HomeView.tsx`: `savedSpotIds`, `allSpots`, `allEvents`, `bandSpots`, `bandFairs` (30 each to pick from). The moments-only path (follow, react, first post) is unchanged.
- Walked signed in with a throwaway account in headless Chrome (desktop and phone): pick → อยากไป → ② → ไปมาแล้ว → ③, fold, reload, open. Account deleted afterwards.

### BE-110 · Landing hero height, full ตี้ on lists, two quick filters, one home fix (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- Landing hero (`app/HomeView.tsx`) is the height of the `/moments` hero: same padding and collage sizes (350px from laptop up). On phones the live line ("ไปตี้กันแล้ว 1,147 ครั้ง") rides on the collage as a sticker (`LiveJoinsLine short`), so the phone hero is 428px against 421px.
- Member home: the host's own ตี้ was in `mine` twice (a host is also among the joined), so the journey band showed it twice. `myEvents` is now one per id.
- Cards (`components/EventGrid.tsx`): a full ตี้ says "เต็มแล้ว"; "ใกล้เต็ม" and "เหลือ N ที่" only while seats remain (it said "เหลือ 1 ที่" on full ones).
- `/community`: full ตี้ sort after open ones in every order, and two pills next to เข้าร่วมฟรี: "ยังมีที่ว่าง" (the existing `seats=open`) and "ออนไลน์" (the same as ออนไลน์ in the province menu). "มาคนเดียวได้" / "มือใหม่ก็มาได้" were left out on purpose: the ตั้งตี้ form ticks both by default, so they would filter nearly nothing.
- Not in this push: the journey band rework (`JourneyBand.tsx`, `MemberLiveHome.tsx`), paused by the owner for a design pass.

### BE-111 · Detail pages drawn like the challenge page (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- The owner liked `/challenges/[id]` for being clean; ตี้, งานแฟร์ and ที่เที่ยว said the same facts 2-4 times in chips, a sticky box and the top bar. Now every fact is said once.
- `components/detail/DetailHero.tsx`: 16:10 photo with one small white label (as on the challenge), a grey `kicker` line instead of `chips`, facts as one grey row (`DetailFact` is `{ icon, text }` now), `heroButton.quiet` for share and the like. `PillarChip` / `StatusChip` are gone. New `DetailTable` (grey key/value rows like กติกาและเงื่อนไข) and `ItineraryList`.
- All three pages: a back link instead of breadcrumbs and top-bar buttons; save, share and the main action once in the header; the right column holds only what the header does not say (ตี้: the host · งานแฟร์: the organizer · ที่เที่ยว: contact) then `VisitPanel`. The challenge link is shown only in `VisitPanel` (with the member's own progress); `PillarLinks` no longer fetches it. Generic sample bullets ("จุดเด่น", "สิ่งที่ควรเตรียม & กฎ" on every ตี้ and fair) removed; real `whatToBring`, transit, parking, facilities and highlights sit in one "ก่อนไป" table.
- ตี้ order: รายละเอียด → กำหนดการ (the host's `itinerary`, which no page showed before) → ก่อนไป (with a กติกา row from `/safety`) → จุดนัดพบ → ถามคนจัด → ใครจะไปบ้าง. Fairs show `itinerary` too, reviews only once the fair has started, and no "0 กลุ่ม". Places lose only the travel-perks box (sample partner deals); Smart Plan and nearby dining stay.
- Spot Buddy trips (`lib/social/spotTrips.ts`) store the date as "12 ต.ค. 2569" like other ตี้, not the `YYYY-MM-DD` the form sends (docs/API.md updated).
- Next (owner, tonight): finish the remaining sub-page design and link the journey together.

### BE-112 · Journey walk fixes, one related-card row on every detail page (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- Walked the member journey with the demo account (join a ตี้ → My Hub → ticket → past ตี้ review / อยากเจออีก / moment → challenge → rewards). Two bugs fixed:
  - A ตี้ or fair page said "นับในชาเลนจ์" for challenges whose period does not include the event's date (a 26 ต.ค. ตี้ offered a challenge that starts 5 ม.ค.). `rewardsForTargets` in `lib/social/questProgress.ts` now keeps only challenges whose period overlaps the event; places are unchanged. docs/API.md updated.
  - Challenge `quest-1792000872542` had its `targetGoal` saved as "????" in `data/discovery_content.json`; replaced with Thai text.
- New `components/detail/RelatedCards.tsx` (with `teeCard` / `fairCard`): the quiet card of "ชาเลนจ์อื่นที่น่าลอง" (photo, date, title, one bottom row) is now the related row on ตี้, งานแฟร์ and ชาเลนจ์ pages, 2 per row on phones instead of one full-width card each. ตี้ show seats left and price; fairs show province and price (no head count). `EventGrid` is no longer used on detail pages.
- `components/VisitPanel.tsx`: the challenge lines sit in their own block "นับในชาเลนจ์" above the moments box, instead of inside it; the line says "ไปครบ N ตี้ / งาน / แห่ง" by page type.
- Challenge page: the targets heading names the kind ("ตี้ที่นับในชาเลนจ์นี้", "งานแฟร์ที่นับในชาเลนจ์นี้", else "ที่ที่นับในชาเลนจ์นี้").
- Owner 2026-10-24: the grey line above the title ("หมวด · โดย …") is gone on all four detail pages; the category did not help a decision and the host / organizer repeated the card below. `DetailHero` takes `highlight` instead of `kicker`: one bold coloured line under the title — ตี้ "7/8 คน · เหลือ 1 ที่" (orange when 2 or fewer, grey when full or ended), place "เปิดอยู่ / ปิดให้บริการแล้ว", fair "กำลังจัดอยู่ตอนนี้ / งานจบแล้ว" (no head count). The people fact left the grey row on ตี้.
- Owner decision: `/moments/[id]` stays a page you open and go back from; no onward sections.
- Next: drafts for `/rewards` and `/profile` (old boxed style), then `/safety` copy.

### BE-113 · The งานแฟร์ pillar is now "อีเวนต์" (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- The pillar holds fairs, expos, runs, concerts and sports, so the owner renamed it from "งานแฟร์" to **อีเวนต์** on every screen: discover tab, back links, photo label, related row, list page buttons and toasts, My Hub, moments, tickets, challenge rule labels, onboarding, admin console, API messages and legal text. "งานแฟร์" stays only where it names one kind among others ("งานแฟร์ งานวิ่ง งานคอน", the /fairs h1, home section heading, seed and scraper text).
- `/fairs` metadata title: "อีเวนต์ช่วงนี้: งานแฟร์ งานวิ่ง คอนเสิร์ต" (in a province: "อีเวนต์ใน… ช่วงนี้: …"), so searches for the kinds still find the page.
- URL `/fairs` and data `eventType: 'public_venue'` are unchanged; moving to `/events` would need redirects and is deferred.
- Not changed yet: `components/home/JourneyBand.tsx` and `MemberLiveHome.tsx`, which hold the paused band work; rename their labels when that work resumes.
- AGENTS.md (pillar facts), DESIGN_SYSTEM.md and docs/PRODUCT_DIRECTION.md updated.

### BE-114 · /rewards drawn like the challenge page (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- `app/rewards/page.tsx` rewritten in the open style of `/challenges/[id]`: h1 "แลกของรางวัล", the member's XP in one line with how to earn more (ไปตี้ +50 · แชร์โมเมนต์ +30 · ทำชาเลนจ์ครบ), category chips and "แลกได้ตอนนี้", then quiet cards (partner · title · สิทธิ์ · XP pill and "ขาดอีก N XP" / "แลกได้เลย" / "แลกแล้ว"), 2 per row on phones.
- Removed: breadcrumbs, the hard-coded "Level 2: Active Explorer" badge (it was the same for everyone), the search box (8 items), the catalog/vouchers tab bar, the decorative gradients, the fake "SCAN TO REDEEM" QR picture and the page's own footer.
- One dialog per reward (`DialogShell`): details, conditions, then "แลกด้วย N XP" which asks once to confirm; once redeemed it shows the code with a copy button. "คูปองของฉัน" is a second view opened from the top (`?tab=my_vouchers` still works): a list of codes to show at the shop.
- Same data and API as before (`useMyRewards`, `POST /api/rewards`); the catalog is still sample data in `data/rewardsData.ts`.

### BE-115 · /safety in a friendly voice, place page tidy, heart hidden once joined (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- `app/safety/page.tsx`: open layout like the challenge page, no English in brackets and no "Trust & Safety Architecture" badge. Order: ก่อนออกไป (4 numbered tips) → กติกาของทุกตี้ (grey `DetailTable`: where to meet, where not, Spot Buddy trip rules, host scans the ticket) → สิ่งที่เราไม่ยอมให้เกิด → เจอปัญหา บอกเราได้เลย (report, block from the profile, call 191) → เราเป็นพื้นที่กลาง (with a link to /legal for the binding terms). Metadata unchanged.
- Place page: the related row uses `RelatedCards` (new `spotCard`: district and province, entry price; "ไม่ระบุ" leaves the corner empty), heading without the decorative emoji. `VisitReviews` now renders nothing when there are no reviews and the member cannot write one (no more "รีวิว · ยังไม่มีรีวิว").
- ตี้ page: the heart (save) button is hidden for a member who joined or hosts the ตี้; it is already on their schedule. The action row fits one line again.

### BE-116 · /profile open and people first (owner 2026-10-24)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-24 · `claude`
- `app/profile/ProfileScreen.tsx`: the seven boxes are now open sections divided by a line on white, like the challenge page. Order: header → ตี้ที่จัด → รีวิวจากคนที่ไป → เหรียญจากชาเลนจ์ → โมเมนต์ → เกี่ยวกับ (grey rows) → owner only: อยากเป็นคนชวน, บัญชีของฉัน.
- Header adds the facts a visitor decides on: "★ 4.9 จาก 12 รีวิว · จัดมาแล้ว N ตี้" (links to the reviews). Follow is the one button; report and block are quiet text buttons.
- ตี้ที่จัด uses `RelatedCards` (now with optional `allHref`, `allLabel`, `className`, and cards without a link for ตี้ still waiting for review). The owner sees "จัดการในมายฮับ" (was "จัดการใน My Hub").
- The trust checklist shows only until the account is trusted; after that the badges say it. "อยากเป็นคนชวน" is one line with "ส่งคำขอ"; the form opens in a dialog. A visitor sees the moments section only when there are moments.
- Seen on the way: one Spot Buddy trip in the data still has the date "2026-10-12" (saved before BE-111 fixed the format); it shows as is.

### BE-117 · Profile menu tidy, no "เมนู" button on wide screens (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `components/Navbar.tsx` profile menu: the name card opens my profile ("ดูโปรไฟล์ของฉัน ›", replacing the row "โปรไฟล์ส่วนตัวของฉัน" and the role label "สมาชิกทั่วไป"); rows มายฮับ · สร้างกิจกรรม (kept: it offers all four kinds) · แลกของรางวัล with the member's XP (read from `GET /api/rewards` when the menu opens) · ตั้งค่าบัญชี (→ `/profile?id=me#account`, was the privacy policy) · ออกจากระบบ. Grey icons, 14px text, 40px rows, slate border. The green "online" dot on the avatar is gone (there is no online status).
- The "เมนู" drawer button now shows only between lg and xl (where the top bar has no section links); from xl the top bar has ค้นพบ / โมเมนต์ / ชาเลนจ์ and the profile menu has มายฮับ. Phones keep the bottom bar.
- `app/profile/ProfileScreen.tsx`: "บัญชีของฉัน" has `id="account"`.

### BE-118 · My profile, a designed page (owner 2026-10-25: "ขึ้นมาระดับ 9++")
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `app/profile/ProfileScreen.tsx` hero: a soft cover in the pillar colours (no image needed), a large avatar over its edge (gradient initial when there is no photo), name, province and member since, a larger bio line (owner sees "+ เล่าเกี่ยวกับตัวเอง…" when empty), quiet green ticks for the checked badges, then a row of big numbers that each jump to their section: ตี้ที่ไปมาแล้ว (own only, from host check-ins in `GET /api/visits?mine=1`) · ตี้ที่จัด · ★ รีวิว · โมเมนต์ · เหรียญ · ผู้ติดตาม · XP (own only, from `GET /api/rewards`, links to /rewards).
- Owner tools: "ดูแบบที่คนอื่นเห็น" shows the page exactly as a visitor sees it (public fields only, owner parts hidden) under a dark bar with "กลับไปแก้ไข"; "โปรไฟล์ครบ N%" ring with the missing steps as chips (photo, bio, interests, about, email, pledge), gone at 100%; owner-only parts sit under a small "เห็นแค่คุณ" label at the end.
- Layout like the detail pages (max-w-6xl): hero full width (numbers beside the name from lg), then two columns from lg — main: โปรไฟล์ครบ N% → ตี้ที่จัด (3 across) → รีวิว → โมเมนต์; side: สายที่ชอบ → เกี่ยวกับ → เหรียญ → the "เห็นแค่คุณ" tray (อยากเป็นคนชวน, บัญชีของฉัน as settings rows). Phones stack main then side.
- Sections: สายที่ชอบ (chips in each pillar's colour) → ตี้ที่จัด → รีวิว → เหรียญ (round violet medals) → โมเมนต์ (4:5 grid; empty: one dashed "แชร์โมเมนต์แรกของคุณ") → เกี่ยวกับ (two columns, label over value; hidden fields carry a small "ซ่อนอยู่" tag for the owner). The trust checklist shows only for a new account (email or pledge missing).

### BE-119 · Profile shows only who I am; settings page; edit in three tabs (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- New `/profile/settings` (`app/profile/settings/`, noindex): the trust checklist, "อยากเป็นคนชวน" and "บัญชีของฉัน" moved here from the end of the profile. Reached from a gear beside "แก้ไขโปรไฟล์" and from "ตั้งค่าบัญชี" in the profile menu (was `/profile#account`). `TrustCard`, `HostCard`, `AccountCard` are exported from `ProfileScreen.tsx`.
- Profile: checked badges are one quiet grey line; numbers that are 0 are left out; side column = เกี่ยวกับ → สายที่ชอบ → เหรียญ → a small "โปรไฟล์ครบ N%" card whose steps open the right tab (email → settings). "แก้ไข" links on เกี่ยวกับ and สายที่ชอบ open the dialog on that tab.
- `EditProfileDialog` has tabs ตัวฉัน (photo, name, intro, อยากเจอคนแบบไหน) · เกี่ยวกับ (province from master data, facts, show/hide age and gender) · สายที่ชอบ (the same สาย cards as onboarding's "บอกสิ่งที่ชอบ"). Saving สาย calls `savePreferences` and adds the places and events that go with them (`SAI_SPOTS` / `SAI_FAIRS`, now exported from `app/onboarding/OnboardingFlow.tsx`), as onboarding does. The show/hide control is a quiet eye.
- The profile's สายที่ชอบ shows only the สาย the member picked, with each สาย's icon and colour; inferred places and events are no longer listed as if the member had said them.

### BE-120 · Profile laid out like an Airbnb profile (owner 2026-10-25: "เข้าใจง่าย minimal")
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `app/profile/ProfileScreen.tsx`: no cover. Left: an identity card (sticky from lg) with the photo, name, province / age / gender, member since, the numbers one per line (zeros left out), the checked badges as a list, and one action (แก้ไขโปรไฟล์ for the owner, ติดตาม for a visitor); report and block sit as quiet links under the card. Right: owner-only one-line "โปรไฟล์ครบ N%" bar with the next step → "เกี่ยวกับ …" heading, the intro, facts as short lines with icons ("ทำงานเป็น นักออกแบบ", "อยู่ย่าน ลาดพร้าว") → สายที่ชอบ chips → ตี้ที่จัด → รีวิว (two columns) → เหรียญ → โมเมนต์ (empty: one line for the owner, nothing for visitors). Phones stack the card on top.
- The gear and the "ดูแบบที่คนอื่นเห็น" button left the profile: settings are in the profile menu, and the preview link is in the edit dialog's header (`EditProfileDialog` `onPreview`).

### BE-121 · Profile at scale; /rewards laid out like the profile, no purple (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- Profile lists that can grow: ตี้ที่จัด sorted (waiting for review first for the owner, then coming up soonest first, then ended newest first), 6 shown with "ดูเพิ่ม (N)" for everyone; โมเมนต์ shows the real total (`pagination.totalCount`), 9 first, then 12 more per "ดูเพิ่ม" (reads the next page of `/api/moments?author=` or `?tab=mine`); the link to everyone's feed is gone; รีวิว shows the latest 4 with "ดูรีวิวทั้งหมด N" opening a dialog; เหรียญ shows 10 then "ดูอีก N เหรียญ".
- New `GET /api/members/[id]/reviews` (up to 200) and `hostReviewSummary` now returns the latest 4 (docs/API.md updated).
- `app/rewards/page.tsx`: a wallet card on the left (sticky from lg): XP ของคุณ in large type, "ได้ XP จาก" (ไปตี้ +50, แชร์โมเมนต์ +30, ทำชาเลนจ์ครบ), "ดูชาเลนจ์ที่เปิดอยู่", and "คูปองของฉัน (N)". Right: h1, outlined category chips, cards with a grey category icon, partner, title, สิทธิ์, "150 XP" and a thin bar of how close the member is ("ขาดอีก 100" / "แลกได้เลย" / "แลกแล้ว"). Purple is gone here, in the profile XP number and in the profile menu.

### BE-122 · Rewards that feel like a gift; E2E walk of every journey, fixes (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `app/rewards/page.tsx`: the wallet is a sunny yellow ticket (flat `#FFD84D`, a tear line with notches, a few still confetti bits), "ตอนนี้แลกได้ N ชิ้น" or "อีก N XP แลก <next reward> ได้" with an orange bar; category tiles in light colours (cafe amber, board games sky, sports emerald, workshops rose, merch orange); affordable cards get a yellow ring and a yellow "แลกได้เลย" pill. Redeeming opens a celebration (confetti burst, gift pops in, "แลกสำเร็จแล้ว!", the code on a dashed coupon, "ดูคูปองของฉัน"). Coupons are dashed yellow tickets; on a phone the coupons view hides the "ได้ XP จาก" half. New keyframes `animate-confetti` and `animate-pop-in` in `app/globals.css` (hidden with reduced motion). Flat colours only; the one blue action stays blue.
- Walked end to end in headless Chrome: visitor pages, sign-up form → onboarding → pledge → email link, joining a ตี้, My Hub, a host applying, being approved, creating a ตี้ with the form, checking a member in with the ticket code, review, moment with a photo, finishing a challenge (+XP, medal, notification), redeeming a reward, saving an event, like, comment, follow, desktop and phone. Fixed:
  - Profile menu "สร้างกิจกรรม" (`components/Navbar.tsx`) now always opens the chooser of all four kinds from the Navbar itself, on every page (it was missing on pages that passed no handler and skipped the chooser on home). `onOpenCreateEvent` is deprecated and ignored.
  - Links to the trust and host cards pointed at `/profile#trust` / `/profile#host`, which moved to `/profile/settings` (create dialog, event detail, group chat, verify-email). The settings page scrolls to the hash once loaded.
  - Create dialog: an approved host's ตี้ (published at once) can start from tomorrow instead of 3 days ahead; picking a ตี้ category swaps the first sample cover for one that fits its mood.
  - `components/detail/AfterTeePanel.tsx`: the host's panel opens on the day of the ตี้, not before; its "แชร์โมเมนต์จากตี้นี้" is gone (the moments box beside it has the same button).
  - My Hub: a host with no plans as a guest but an upcoming ตี้ opens on "งานที่จัด"; "ตี้คอมมูนิตี้"/"คอมมูนิตี้" labels now say ตี้; the visitor preview's challenge row shows its image. Saved events load with the new `GET /api/events?ids=` (they were looked up in the first 100 events only).
  - Verify-email success without a pending action offers "หาตี้แรกของคุณ" first.
- Test data: 80 test accounts (`@example.com`, from this and earlier walks) were deleted with the admin delete, which removes their joins, visits, reviews, moments and the rest; the test ตี้ and its photo too. Data files were backed up first.
- Open: the paused journey band (`components/home/JourneyBand.tsx`) still says งานแฟร์ and shows XP in purple; it changes when that work resumes.

### BE-123 · ตี้ categories: popular first, บาร์ & ไนท์ไลฟ์ added, clearer names, moods hidden (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- Order (`data/masterHub.ts` list and `sortOrder` in `data/master_data.json`, now the same): คาเฟ่, ตะลุยกิน, ดนตรี, วิ่ง, บาร์, บอร์ดเกม, ท่องเที่ยว, กีฬาทีม, ถ่ายรูป, วิดีโอเกม, ศิลปะ, ฮีลใจ, เต้น, ทำอาหาร, สัตว์เลี้ยง, บิวตี้, หนังสือ, อาชีพ, จิตอาสา. The public rails read the static list's order; the forms and admin read `sortOrder`, so a drag in admin does not reorder the public rails yet.
- New built-in `bars_nightlife` "บาร์ & ไนท์ไลฟ์" (mood chill, slate, Martini). Its text describes the night out, not the drink (Thai alcohol advertising law), and says 20+. Keyword matching puts it after board games (a pub quiz stays a game night) and before music (a jazz bar is a night out); "party/ปาร์ตี้" moved here from board games.
- Renamed (ids unchanged): คาเฟ่ & นั่งชิล, ชวนวิ่ง & ฟิตเนส ("งานวิ่ง" is an อีเวนต์), วิดีโอเกม อนิเมะ & ป๊อปคัลเจอร์, บอร์ดเกม & เกมกลุ่ม, บิวตี้ & แฟชั่น, สัตว์เลี้ยง & คนรักสัตว์; ดนตรีสด left the music description.
- Moods (chill/move/heal/learn) are no longer shown: the create dialog and the admin create form list the categories flat, the admin event editor picks a ตี้ category / อีเวนต์ type instead of a mood. The server still sets `category` (mood) from the category; kept for grouping later. The taxonomy page still edits each category's mood.
- `/community` "ไปคนเดียวได้" / "มือใหม่" guesses (when the host did not say) use a set of categories instead of the moods; bars are not in it.
- `/community/[id]` กติกา row adds the 20+ and night-out care line for a bars ตี้.

### BE-124 · Sample ตี้ carry every detail field, so the detail page can be judged in full (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `data/chill_database.json`: the 58 sample ตี้ got their empty fields filled by category and area (กำหนดการ 4 rows from the start time, สิ่งที่ควรเตรียม, การยกเลิก, เหมาะกับ, ขั้นต่ำ 3 คน, จุดนัด, การเดินทาง by nearest BTS/MRT); nothing already set was changed. Up to 4 made-up people per ตี้ in `participants` (`userId` `sample-guest-*`, `note: sample`), never more than its count. Listed for removal in docs/LAUNCH_CHECKLIST.md.
- `app/community/[id]/CommunityDetailView.tsx`: a sample ตี้ shows its own สิ่งที่ควรเตรียม and การเดินทาง when it has them (it hid the first and showed canned transit text); the canned text stays only for samples without them.
- Not filled: questions to the host (they must come from real members), the day-of and after-ตี้ panels (they follow the viewer and the date), price tiers.

### BE-125 · Create dialog: DD/MM/YYYY dates, 24-hour times, place suggestions, more "เหมาะกับ" (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `components/CreateEventModal.tsx`: dates are typed as DD/MM/YYYY (ค.ศ.) with a calendar button that opens the browser's picker (`DateInput`); times are typed as 24-hour HH:MM (`TimeInput`), also in the กำหนดการ rows. The browser's own boxes followed the device language and showed 10/31/2026 and 06:00 AM. Values sent are unchanged (YYYY-MM-DD, HH:MM).
- The สถานที่ field of a ตี้ suggests places while typing (`PlaceSuggest`): published spots whose name holds the word (from `GET /api/spots?q=`, the chosen province first) and the event venues from master data. Picking a spot fills the province, area and map pin and sends `placeId`; typing again unlinks it. Anything else can still be typed.
- `app/api/events/route.ts`: `placeId` is checked against published spots and `placeTitle` set from the record (see docs/API.md). Kept apart from `spotId` so a ตี้ at a place does not get the Spot Buddy trip rules.
- `/community/[id]`: a ตี้ with `placeId` links to the place ("ที่นัดเจอ"); the "เหมาะกับ" row starts with who may come (ทุกเพศ / เฉพาะผู้หญิง / เฉพาะผู้ชาย, ทุกวัย or the age range; these form fields were never shown before), then the chips.
- New chips (`EventItem` booleans): สายอินโทรเวิร์ตมาได้, พาเพื่อนมาได้, ใช้ภาษาอังกฤษได้, พาเด็กมาได้ (in-person only).
- Not done, for the owner to decide: linking a ตี้ to an อีเวนต์ ("ไปงานด้วยกัน"), because fair pages already have walk-together groups (`lib/social/fairGroups.ts`); and a "ตี้ที่นัดที่นี่" list on the place page.

### BE-126 · Fixes from an E2E walk of creating a ตี้; create buttons for members only (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- Create buttons on `/community` (ตั้งตี้เอง), `/spots` (แนะนำที่ใหม่) and `/challenges` (เสนอชาเลนจ์) show to signed-in members only; `/fairs` (เพิ่มอีเวนต์) only to approved organizers and venue owners, the people the server lets add one.
- Walked in headless Chrome (en-US): sign-up → create a ตี้ through all four steps (DD/MM/YYYY date, 24-hour times, place picked from the suggestions) → approve → detail page on desktop and 390px. Stored fields and the page matched. Test member and ตี้ deleted afterwards.
- Fixes: the card and the event modal no longer show a made-up host score of 4.9 when the host has no rating (`components/EventGrid.tsx`, `components/EventDetailModal.tsx`); the review step lists เหมาะกับ and การเดินทาง; "ของที่ต้องเตรียม" and "มือใหม่มาได้" are the same words in the form, the review and the page; the header and cards show the place without the "(จุดนัดพบ: …)" the form appends (`lib/placeName.ts`), also in the page description and the JSON-LD `Place.name`.
- Not checked: the embedded Google map stayed blank in headless Chrome.

### BE-127 · อีเวนต์ review: related events, venue-first places, run details, organizer E2E (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `/fairs/[id]`: "อีเวนต์อื่นที่น่าไป" reads live data (the same group asked for with the new `fairCategory` query, then a wider list, same province first); it read the bundled samples only, matched by the old meetup mood. The header shows the venue before the hall (`fairPlace` in `lib/placeName.ts`, also on cards). The organizer link says สมัครวิ่ง for runs, ดูรายละเอียดงาน when the price is unknown. Imported อีเวนต์ head their box "ข้อมูลจาก" (the venue or calendar we read), not "ผู้จัดงาน". Web addresses in อีเวนต์ descriptions are links (`renderDescriptionContent(text, { linkify: true })`; ตี้ keep plain text). Runs say "นัดไปวิ่งด้วยกัน" / "ตั้งกลุ่มไปวิ่ง" for the walk-together groups (kept, owner).
- `GET /api/events` takes `fairCategory` (docs/API.md).
- ThaiRun scraper (`lib/scrapers/thairun.ts`) also reads `races { distance ticketTypes { price } }` (found by probing; introspection is off): the description lists organizer, distances, fee range and sign-up status, and `price` is the fee range. The 34 stored races still on ThaiRun were refreshed through the admin API; 16 no longer listed kept their text.
- Words: "งานแฟร์ งานวิ่ง งานคอน" became "เอ็กซ์โป งานวิ่ง คอนเสิร์ต" (/fairs heading, home rows, onboarding); the home kind label fair → เอ็กซ์โป.
- Create dialog for อีเวนต์ (walked as an approved organizer in headless Chrome, then the test account and event were deleted): the review lists the website/ticket link; the pledge for อีเวนต์ speaks of the organizer, not a ตี้; the default province is กรุงเทพฯ (it was กรุงเทพมหานคร, not an option of the select, so the select looked right but sent another spelling).
- Note: the db adapter is a server-wide singleton, so changes to `lib/db/queryEngine.ts` need a dev-server restart.

### BE-128 · Runs: distances, fee and sign-up as rows (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- ThaiRun's API has no event text (description fields are empty; the details are on the poster), so the run facts are now fields: `raceDistances`, `registrationOpen` (`EventItem`, scraper, admin `update_fields`), with `price` as the fee range. `/fairs/[id]` shows them as rows ระยะ / ค่าสมัคร / การรับสมัคร in "สิ่งที่ควรทราบ"; "เกี่ยวกับงาน" is one line pointing to ThaiRun for route, shirt and medal.
- 44 of the 50 stored races were refreshed by slug (closed sign-ups included); 6 the API no longer returns by slug keep their earlier multi-line text.

### BE-129 · /spots fixes and automatic curation (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `/spots/[id]`: one row การเดินทาง from the Tourism Directory's ways to get there (it was split into a wrong รถสาธารณะ and a "ที่จอดรถ: รถยนต์" row); facilities kept only when useful (`lib/spotFacilities.ts`, the source repeats a VAT refund desk, pet lodging and hotels on hundreds of places); "ไม่ระบุ" price left out of the header; "บางรัก, กรุงเทพฯ" without "จังหวัด"; "ตี้ที่นัดที่นี่" lists open ตี้ with this `placeId` (`GET /api/events?placeId=`).
- Smart Plan (`components/SmartSpotPlanCard.tsx`): stops from the published catalog within 30 km, no same place under another name, a shorter plan when few places are near (it used the bundled samples: 120 km stops, Lumpini twice). Nearby dining no longer promises "5-10 นาที".
- /spots rail hides vibe groups with fewer than 10 browsable places (bars, galleries, rooftops for now).
- Automatic curation (`lib/spotCuration.ts`, `lib/spotCurationStore.ts`): every published place gets a score (photo, text, Tourism Directory views or Wikipedia monthly views, fit for 18-35, trip province, practical info, minus offices and community groups), a tier and reasons in Thai. Featured = top 12% + the best 3 of each province; hidden = weakest 25% (left out of browsing and rail counts, still found by search and by link). /spots orders by tier then score (`lib/spotRanking.ts`). Admin API: `recompute_curation`, `set_curation {spotId, tier|null, note}` (override survives recomputes). Runs again after spot imports and publishing. Public `/api/spots` carries only tier and score. Now: 393 featured, 473 hidden of 2,043.
- Imports: places with a real photo and 60+ characters of text are published right away (no team to review); the OSM importer ranks by number of Wikipedia languages and stores `wikiMonthlyViews` (paced 1 request/s). 66 of 95 existing OSM places backfilled.
- Not done yet: admin UI for the curation (buttons are API-only), running the OSM importer for the big cities, cafes/bars that have no Wikipedia page (no storable popularity source; Google Places content may not be stored).

### BE-130 · Nearby cafes on /spots/[id]: one readable list within 3 km (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `components/NearbyDiningSection.tsx`: a one-column list (photo, full name, rating · kind · distance, specialty) nearest first, only places within 3 km (the catalog fallback had no limit: 6.7 km "รอบย่าน"); the 2-column cards cut every name, the hours and the button. Header "ร้านกาแฟและร้านอร่อยใกล้ๆ" + "ดูเพิ่มบนแผนที่"; the repeated footnote is gone; "ข้อมูลร้านและคะแนน: Google Maps" when the rows come from Google.

### BE-131 · Smart Plan on /spots/[id]: "ไปที่นี่แล้ว ไปต่อไหนดี" leads to a ตี้ (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `lib/spotDayPlan.ts` (new) builds a 2-3 stop plan from the catalog: places within 30 km, each a different vibe, the place being viewed first, the rest in shortest-route order, times from opening hours; "เปลี่ยนจุดนี้" swaps one stop.
- `components/SmartSpotPlanCard.tsx` rewritten as an open section with two buttons: **ชวนเพื่อนตั้งตี้** (signed out → RequireMembership "เพื่อชวนเพื่อนไปตามแผนนี้"; signed in → the create dialog opens straight on the ตี้ form with the place, pin and the plan's schedule filled in) and **เปิดเส้นทาง** (Google Maps by coordinates).
- `CreateEventModal` takes `initialPlace` and `initialItinerary`; a handed-over plan wins over a saved draft's schedule. `components/SmartSpotPlanModal.tsx` deleted (no other user).

### BE-132 · Launch campaign "สะสม XP ครบ 500 ลุ้น iPhone Duo ฟรี" + E2E walk fixes (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- **SAMPLE campaign** (`data/launchCampaign.ts`), 25 ต.ค. – 31 ธ.ค. 2569, draw 15 ม.ค. 2570: three seed challenges, one per pillar — `launch-tee` (1 ตี้ with host check-in, 150 XP), `launch-spots` (moments at 3 places, 150 XP), `launch-fair` (a moment at 1 อีเวนต์, 100 XP) — and the catalog reward `reward-launch-iphone` (500 XP, a draw entry). The full path earns 570–600 XP (400 from challenges + visits), so a member who does all three can enter.
- `components/LaunchCampaignBanner.tsx` on /challenges (server HTML, under the header): the three steps with own progress, XP bar toward 500, then "แลกสิทธิ์ลุ้นเลย" or "ดูรหัสสิทธิ์ของฉัน"; signed out it offers sign-up. Hidden outside the campaign dates.
- Rewards: `drawEntry` on a catalog item = no stock count, "จับรางวัล …" instead of "เหลือ N สิทธิ์", and a per-member entry code `CC-XXXXXX` (`redemptions[].code` from `GET/POST /api/rewards`, `useMyRewards().codes`). `/rewards?reward=ID` opens that reward. The unused localStorage XP helpers (which started everyone at 650 XP) were removed from `data/rewardsData.ts`.
- **E2E walk** (API + headless browser at 390px, throwaway accounts deleted afterwards): register → verify → pledge → onboarding → join 3 launch challenges → host applies, staff approve → ตี้ goes live → join → ticket → host check-in → 3 place moments (staff accept the photos) → 1 place moment with a fresh GPS fix (passes on its own) → อีเวนต์ moment (no venue pin → staff accept) → all 3 challenges finished, badges on the profile, notifications → prize entry redeemed, second redeem refused (409) → ตี้ review. All passed.
- **Fixed on the way:** (1) the member home crashed ("This page couldn't load") on a ตี้ without `time`: `POST /api/events` now requires `time` for a ตี้ (400 "กรุณาระบุเวลาเริ่มและเวลาจบของตี้"; an อีเวนต์ without one gets "ดูเวลาที่หน้างาน") and `components/home/planHelpers.tsx` / `OpenMeetupTiles.tsx` read a missing time as empty; (2) VisitPanel faces were keyed by display name, which is not unique (React duplicate-key warning); (3) Smart Plan's button opened the "อยากสร้างอะไร" chooser instead of the ตี้ form.
- **Seen, by design, not changed:** a new host's ตี้ waits for review until staff approve the host application. Moments `capture.at` must be epoch milliseconds (an ISO string makes the fix "stale").
- **Open:** the member home has two `<h1>` from the paused JourneyBand work (members-only page, not indexed); left with that paused work.

### BE-133 · New accounts: no daily moment limit, no same-IP flag (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- New (not yet trusted) accounts may post any number of moments a day, so a brand-new member can finish the launch campaign on day one. The 20-comments-a-day limit and the "no links or phone numbers in the first 7 days" rule stay (`lib/members/safety.ts` `guardPosting`, `lib/members/trust.ts`).
- Sign-up no longer stores an IP fingerprint or raises `shared_ip`; old `shared_ip` flags are ignored by `hasOpenRisk`, so those accounts are no longer held back. The rule is one account per email (checked on sign-up and on social login; an unverified email of another account is never attached).
- /profile trust step copy no longer mentions "วันละ 3 โมเมนต์". `docs/API.md` risk-flag list updated.

### BE-134 · Campaign strip on the home page (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- `components/CampaignStrip.tsx`: one slim yellow line under the visitor hero on `/` ("สะสม XP ครบ 500 ลุ้น iPhone Duo ฟรี", "ดูวิธีร่วมสนุก") linking to `/challenges#launch-campaign` (the banner there now carries that id). Text and dates come from `data/launchCampaign.ts`; outside the dates it renders nothing, so the next campaign is a data change. Server HTML, real link.
- Not on the member home yet (members see the full banner on /challenges).
- Marketing pass the same day: headline is now "แค่ออกไปใช้ชีวิต ก็ลุ้น iPhone Duo ฟรี" (also on the /challenges banner), new `stripText` and `cta` ("เริ่มสะสมสิทธิ์") in `data/launchCampaign.ts`, and a drawn phone (inline SVG) rising above the strip. Then: `prizeImage` is a SAMPLE product render the owner supplied (`public/campaign/iphone-duo.png`, white background, 3:2) on a tilted white tile like the hero collage; must be replaced before launch (LAUNCH_CHECKLIST); the drawn phone is the fallback when it is empty. Strip made slimmer (smaller padding and headline). Copy says ลุ้น, never รับ: it is a draw.

### BE-135 · Campaign challenges: welcome, weekly moment themes, new hosts (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- New rule fields in `QuestRule` (`data/mockData.ts`), counted in `lib/social/questProgress.ts`, worded in `lib/questDisplay.ts`, editable in the admin challenge form: `newMemberDays` (only visits within N days of sign-up) and `asHost` (counts ตี้ the member hosted where N guests were checked in). Documented in `docs/API.md` ("Challenge rules").
- SAMPLE seed challenges: `welcome-first-tee` ("ตี้แรก มีของ", 14 days, 150 XP + a free drink code from the sample partner Ari Specialty Coffee Club; with `launch-tee` the first ตี้ pays twice), five weekly moment themes (`theme-hidden-cafe` 26 ต.ค.–1 พ.ย., `theme-green-park`, `theme-art-day`, `theme-market`, `theme-sunset-view`, 80 XP each), `theme-year-end-tee` (ธันวาคม, 100 XP) and `host-starter` (open a ตี้, 3 guests checked in, 300 XP).
- A host challenge page shows "เปิดตี้ของคุณ" with "ตั้งตี้ของฉัน" (`/community?create=1` opens the create dialog, signing in first if needed) instead of places to go.
- Campaign challenges now use community category ids; `SEED_QUEST_TEXT_VERSION` 7 copies them into the stored seeds.

### BE-136 · Campaigns in the admin console; ตั๋วเพื่อนซี้, ยกแก๊งไปตี้, weekend passports (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- **Campaigns** are stored data now (`lib/campaigns/store.ts`, `data/campaigns.json`, seeded from `data/launchCampaign.ts` when empty). Admin → เนื้อหา → **แคมเปญ** (`?m=campaigns`, `components/admin/CampaignsManagerView.tsx`): words, dates, prize picture, catalog reward, step and extra challenges, publish and home strip switches, with a live strip preview, plus stats per campaign (sign-ups, first ตี้ within 14 days, sign-ups through invite links and how many went with their inviter, prize entries, joined/finished per challenge). A headline saying "รับฟรี" is refused. API: `/api/admin/campaigns` in `docs/API.md`.
- `/` and `/challenges` read the running campaign on the server (`liveCampaign()`) and pass it to `CampaignStrip` / `LaunchCampaignBanner` (server HTML). The banner lists the campaign's running extra challenges under "สะสม XP เพิ่มได้อีก".
- **ตั๋วเพื่อนซี้**: every member has an invite link (`GET /api/auth/member/invite`, `/?ref=CODE`); `components/InviteRefCapture.tsx` (root layout) keeps the code in the `cch_ref` cookie for 30 days and sign-up (email or social) sets `Member.invitedBy`. `components/InviteFriendsCard.tsx` sits on the owner's own /profile and on friend challenge pages: link, copy, share, and the friends who joined with "ไปตี้ด้วยกันแล้ว". Reward only when both are checked in at the same ตี้ (`friend-ticket`, 150 XP each), never for the sign-up.
- **ยกแก๊งไปตี้** (`squad-tee`, 100 XP): a ตี้ with at least 2 friends checked in too. Friends = invite links either way, or members who follow each other (`lib/social/friends.ts`). Rule fields `withFriends`, `friendsVia`.
- **พาสปอร์ตสุดสัปดาห์** (`weekend-passport-nov`, `weekend-passport-dec`, 200 XP): rule `perWeekend` counts Saturdays–Sundays with a counted visit (photo moment or check-in), 4 per month.
- **E2E walk** (API, throwaway accounts and ตี้ deleted afterwards; a server restart after moving one account's sign-up date back 20 days): host challenge 0/1 until the third check-in, then done (300 XP); welcome done + partner code `FIRST-TEE-…`; the 20-day-old account does not get the welcome challenge but does get `launch-tee`; invite code links two new accounts; inviter and friend finish `friend-ticket`, a member who came alone does not; inviter with two friends finishes `squad-tee`, the friend with one friend does not; a Sunday check-in counts for a weekend rule; campaign stats show 5 sign-ups, 4 first ตี้ in 14 days, 2 invited / 2 activated, 2 of 3 finished. Admin page, /challenges banner, member home strip and /profile invite card seen in a headless browser.

### BE-137 · Member home crash fix; campaign shouted again on the member home (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- The member home crashed ("Cannot read properties of undefined (reading 'normalize')") on a ตี้ without `hostName` (one created through the API without it). `POST /api/events` now fills `hostName` / `hostAvatar` from the member when missing, and `tidyDisplayName` treats a missing name as empty.
- `MemberLiveHome` shows `CampaignStrip` (placement changed again in BE-138), with the member's own progress: "XP ของคุณ N / 500 · อีก X XP" and a bar, then "แลกสิทธิ์ลุ้นเลย" once they have enough, then "คุณมีสิทธิ์ลุ้นแล้ว · ประกาศผล …" with "ดูรหัสสิทธิ์". Props `campaign`, `campaignEntered` from `app/HomeView.tsx`.


### BE-138 · Campaign slot on the member home: under the journey band, four states (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- The member home's campaign slot sits **under the journey band** (what you do next first, then what it earns you) and is loud only when there is a decision: ① joined none of the campaign's challenges → full card "เริ่มสะสมสิทธิ์"; ② collecting → one slim line (prize thumbnail, campaign name, XP bar, "อีก N", ดูวิธีสะสม); ③ enough XP → full card again, "สะสมครบแล้ว แลกสิทธิ์ลุ้นได้เลย" + "แลกสิทธิ์ลุ้นเลย"; ④ entered → slim "คุณมีสิทธิ์ลุ้นแล้ว · ประกาศผล …" for 3 days, then nothing. Visitors keep the full card under the hero. Every next campaign uses the same slot and states; staff only switch "แสดงแถบบนหน้าแรก".
- `CampaignStrip` takes `member?: CampaignMemberState { xp, started, enteredAt?, now }` (replaces `xp` / `entered`); `app/HomeView.tsx` works it out (`started` = joined any of the campaign's step or extra challenges). `useMyRewards` now also returns `redeemedAt` by reward id (from `redemptions[].createdAt`).
- Walked in a headless browser with a throwaway member at 1440 and 390 px: ① new member, ② after joining `launch-tee`, ③ at 200 XP with the campaign pointed at a 150 XP reward for the test, ④ after redeeming; reward restored and test data deleted afterwards.
- Next (with the paused journey band work): the band's cards say "+150 XP นับในแคมเปญ".

### BE-139 · กลุ่มชาเลนจ์เปิดตัว in the admin challenge list; form keeps every rule (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude`
- Admin → ชาเลนจ์ & ภารกิจ groups challenges by campaign: a campaign filter next to the status tabs ("ทุกแคมเปญ", each campaign with its count, "ไม่อยู่ในแคมเปญ") and on each row a yellow badge "<campaign> · ขั้นตอนหลัก/สะสมเพิ่ม" plus the rule kind (สมาชิกใหม่ 14 วัน, โฮสต์ มีคนเช็กอิน ≥3, ชวนเพื่อนผ่านลิงก์, ไปกับเพื่อน ≥2 คน, นับสุดสัปดาห์ 4 ครั้ง). Reads `GET /api/admin/campaigns?lite=1`. The launch group holds 15 challenges; the six kinds were not created again (they already exist as seed challenges).
- **Fixed:** the admin form counted one kind only, so saving the weekend passport cut its rule to places. The "นับจาก" choice now has "ทุกอย่าง (สถานที่ ตี้ และอีเวนต์)" (no category chips for it); `weekend-passport-nov` was set back. Seed hub rewards now name "Chill & Connect Hub", as the form writes.
- Checked in a headless browser: each of the six kinds (welcome-first-tee, theme-hidden-cafe, host-starter, friend-ticket, squad-tee, weekend-passport-nov) opened in the form and saved, with rule, dates, XP, category, badge and reward unchanged afterwards.

### BE-140 · E2E walk: the four sections linked through moments (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude` (uncommitted)
- Walked with throwaway accounts (host, member A, member B who signed up through A's invite link), real uploads and real pages; 35/35 checks pass, and the spot, อีเวนต์, ตี้, challenge, profile and moment pages were seen in a headless browser (1280 px; ตี้ page also at 390 px) with no script errors. Everything created was deleted afterwards.
  - **ที่เที่ยว:** moments with a GPS fix at 3 places → on each place's feed, in "who has been", `launch-spots` 3/3 with A's own photos as the challenge's memories.
  - **อีเวนต์:** a moment at today's run (no map pin) waits for staff, shows in the evidence queue, counts after `accept_evidence`.
  - **ตี้:** host check-in finishes `launch-tee`, `welcome-first-tee` (partner code) and `friend-ticket` for both friends; the ตี้'s moment is on its page.
  - **XP and rewards:** 870 XP (170 from visits, 700 from challenges), prize entry `CC-…`; notifications of type `challenge`; profile shows 5 medals and 5 moments; B's "following" feed shows A's moments; a moment page links its place.
- **Fixed on the way:** (1) place, ตี้ and อีเวนต์ pages listed challenges that had not started under "นับในชาเลนจ์" (a visit today would not count): `rewardsForTargets` now leaves them out; (2) "ลองชาเลนจ์ถัดไปไหม" after finishing suggested a challenge starting in 68 days: it now picks a running one (not a host challenge); (3) a ตี้ created without a picture showed a broken cover: `POST /api/events` gives it a category cover (`defaultEventImage` in `lib/eventImageResolver.ts`; the create form already always sends one).
- **Seen, by design, not changed:** the moment page keeps only its place link at the top (owner 2026-10-24); stored seed challenges made before BE-139 still name the organiser "Chill & Connect" (the form writes "Chill & Connect Hub"); medals all use the same icon.

### BE-141 · One light toast on every member page (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational) · 2026-10-25 · `claude` (uncommitted)
- The owner found the short messages black, with icons that did not fit (signing out showed a green check or sparkles). There were 15 hand-drawn copies in four positions. Now every member page uses `components/Toast.tsx`: white, thin border, soft shadow, top centre under the top bar, a slight slide-in (`animate-toast-in`, `app/globals.css`); a green check only for something done, a rose alert for a failure, no icon for information. `showToast(message)` calls are unchanged: the tone is read from the words (`toastToneOf`).
- Swapped in: about, /challenges and its detail, /community and detail, /fairs and detail, home (`HomeView`, `HomeMomentFeed`), /journey-simple, /myhub, /rewards, /spots and detail, moments (`MomentsChrome`), the place dialog (`SpotDetailModal`, kept inside the dialog). The "counted toward a challenge" notice after posting (`CountedQuestNotice`) is now a warm yellow card with an orange button. Admin toasts are unchanged (already white). Rule added to DESIGN_SYSTEM.md (Components → Short messages).
- Seen in a headless browser at 1280 and 390 px with the demo account: saving a place (check icon) and signing out (no icon); the place was unsaved again afterwards.

### BE-142 · อีเวนต์ moved from /fairs to /events (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (action: pull before editing these pages) · 2026-10-25 · `claude`
- The owner wanted the อีเวนต์ pillar at `/events`. `app/fairs/**` is now `app/events/**` (list `/events`, detail `/events/[id]`); file names inside (`FairsListView.tsx`, `FairDetailView.tsx`) are unchanged. The old client-side "smart router" at `app/events/[id]` (forwarded to `/community` or `/fairs`) is gone: the detail page now sends a ตี้ id with a 308 to `/community/[id]` and returns 404 for unknown ids.
- `next.config.ts`: `/fairs` → `/events` and `/fairs/:id` → `/events/:id`, both permanent (308, query kept); the old `/events` → `/` redirect is removed.
- Every link in pages, components and `lib/` (sitemap, canonical, breadcrumb JSON-LD, notifications/visit links, admin "open" links) now points at `/events`. Data is unchanged: `eventType: 'public_venue'`, visit target `fair`, discover kind `fairs`.
- Docs updated: AGENTS.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, docs/API.md, docs/LAUNCH_CHECKLIST.md.
- Checked on the dev server: `/events` and a detail page 200 with canonical `/events/…` and Event JSON-LD; `/fairs` and `/fairs/<id>?x=1` 308 to the new address; a ตี้ id under `/events` 308 to `/community`; unknown id 404; sitemap and the home, /events, /community, /spots, /about pages contain no `/fairs` link.

### BE-143 · Database schema created in Supabase (owner 2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational, no action) · 2026-10-25 · `claude`
- The approved design (`docs/DATABASE_DESIGN.md`) is now 57 tables in a private `app` schema, from `db/migrations/0001…0008`, applied with `npm run db:migrate`. The website does **not** use it yet; pages and APIs still read the JSON files. Next: import today's data, then switch the repositories one at a time (API shapes stay the same).
- Security: RLS on every table, Supabase's public roles locked out, the website connects as `app_runtime` (data only; cannot change structure or rewrite `audit_log` / `xp_ledger`). `npm run db:verify` checks all of it (11/11 pass).
- New env var `DATABASE_URL` (website login) in `.env.local`, made by `npm run db:runtime-login`; needs copying to Vercel before the switch.

### BE-144 · Today's data imported into Supabase (2026-10-25)
- **From → To:** Backend (Claude) → Frontend (informational, no action) · 2026-10-25 · `claude`
- `npm run db:import` (`db/import-from-json.mjs`) loaded the JSON files into the database in one transaction: 245 members (incl. 205 seed guests made into sample members), 257 ตี้/อีเวนต์, 2,179 places, 35 challenges, 9 rewards, 24 moments, 228 participants, 724 audit rows and the rest. Text dates became real times (Bangkok). The website still reads the JSON files; nothing changes on screen.
- Migration 0009: online events may have no province; rewards get `partner_code`.
- Next: switch repositories one at a time, then rerun the E2E walks. The JSON files keep being the live data until each switch, so run `npm run db:import -- --replace` right before switching.

### BE-145 · Core data runs on the database (2026-10-26)
- **From → To:** Backend (Claude) → Frontend (informational, no action) · 2026-10-26 · `claude`
- With `DATA_STORE=postgres` (now in `.env.local`), members, ตี้ / อีเวนต์, participants, places and challenges are read and written in Supabase. API shapes are unchanged: 17 public reads were compared with JSON mode and match field for field. Other stores stay on JSON for now.
- Joining is now safe across servers (one transaction per join, row lock on the ตี้).
- Behaviour change: deleting a host's account removes the ตี้ they host. Before, the ตี้ stayed without a host.
- Vercel needs `DATA_STORE=postgres` and `DATABASE_URL` with port **5432** (session pooler) before it uses the database; until then it keeps the JSON files.

### BE-146 · Bug tracker check: Thai font and ตี้ time range (2026-10-26)
- BUG-01: `font-sans` (on most page wrappers) was Tailwind's system font stack, so pages did not use IBM Plex Sans Thai. `app/globals.css` now points `--font-sans` at the webfont.
- BUG-03: a ตี้ ending before it starts (18:00 to 17:00) is refused on step 2 of the create form and by `POST /api/events`. Past midnight is still allowed if it ends by 06:00. New shared helper: `isValidTimeRange` in `lib/dateUtils.ts`.
- BUG-02 and BUG-04 are not bugs in the current code: the share button stays grey with "เลือกรูปก่อนนะ" until a photo is added; the profile menu's สร้างกิจกรรม opens the four-kind chooser (แนะนำสถานที่ included), and page buttons like ตั้งตี้เอง open their own form on purpose.

### BE-147 · Bug tracker check, part 2: landing hero line, create form, dead images (2026-10-26)
- Landing hero: "สัปดาห์นี้ไปตี้กันแล้ว N ครั้ง" waited ~5 s because `/api/activity` read participants one ตี้ at a time from the database. New `db.listParticipantsByEvent(ids)` reads them in one query; visitor counts are kept on the server for 60 s.
- BUG-05/10: pressing ส่ง without the agreement ticked now turns the box red, shows a line under it and scrolls it into view. Challenges get their own agreement wording.
- BUG-06: three dead Unsplash images replaced (Art & Collectibles Expo, TFBO, Watercolor ตี้) in the JSON files and Supabase, and in the default image list. The landing อีเวนต์ row falls back to a default photo when an image fails.
- BUG-08: tapping a template prompt "[...]" in the description editor selects the whole prompt, so typing replaces it.
- BUG-09: the form marks optional fields "(ไม่บังคับ)"; "เหมาะกับ" was missing the mark.
- Not bugs: BUG-07 (shared trial account is on purpose, removal on the launch checklist), BUG-11 (the chooser already links to the host request in account settings), BUG-12 (social login waits for OAuth keys, on the launch checklist).
- Walked in headless Chrome on 2026-10-26 with a throwaway member (deleted afterwards, nothing submitted): BUG-01, 03, 05/10, 06, 08 pass on the local server. The walk caught the agreement warning line being cut off below the fold; the scroll now waits a frame and aligns the box's bottom.

### BE-148 · Overnight ตี้ have no cut-off hour (owner 2026-10-26)
- `isValidTimeRange` in `lib/dateUtils.ts` now only refuses an end time equal to the start. An earlier end means the ตี้ runs into the next day at any hour (BE-146's "ends by 06:00" is gone); social proof and the community sort out late ตี้. The create form and `POST /api/events` now say "เวลาเลิกต้องไม่ตรงกับเวลาเริ่ม".
- Spot Buddy trips keep their daytime rule (`lib/spotTripRules.ts`), unchanged.

### BE-149 · Speed after the database move (2026-10-26)
- Members are read many at once: new `memberRepository.findByIds(ids)` (one query) replaces one-by-one loops in moments, chat, notifications, stories, ตี้ questions, fair groups, reviews, friends, suggested members and the live ticker. One round trip to Supabase is ~30 ms, so 40 people went from 1.2 s to 0.07 s.
- `memberRepository.findById` keeps a member for 10 s; member writes and ตี้ join/leave clear it. Whole-member lists (feeds, counts) are kept 30 s. Callers always get their own copy.
- `cacheManager.getOrSet` now serves an expired value while a fresh one loads (`staleMs`) and lets requests arriving together share one read. Writes still clear the cache at once.
- Single ตี้/place/challenge lookups use the cached list when it is there. `db.listParticipations` now carries `checkedInAt`, so visits, attendance, Spot Buddy and campaigns no longer read each participation again.
- Browser: `lib/clientMemory.ts` remembers the last rewards, month, interests, live ticker, Home feed first page and stories while the member moves between pages (wiped when the member changes); `next.config.ts` keeps pages seen in the last 30 s (`experimental.staleTimes.dynamic`).
- `vercel.json` pins functions to Singapore (`sin1`), next to the database (ap-southeast-1). Without it Vercel's default is the US, ~200 ms per query.
- Measured on the dev server, warm: /api/moments 850 → 23 ms, /moments 1.9 s → 0.12 s, /api/members/suggested 260 → 14 ms, /api/rewards 320 → 80 ms, /api/moments/journey 107 → 10 ms, /api/activity 120 → 40 ms.

### BE-150 · Sitemap and canonical check (2026-10-26)
- Walked every sitemap URL on the local server: all 200, each with its own canonical, none noindex, one h1 each. Private pages (/myhub, /profile, /onboarding, auth pages) are noindex; filtered lists (?q=, ?type=, ?page=) point their canonical at the plain list.
- Fixed: the home page had no canonical (`app/page.tsx` now sets `/`, so /?invite= and /?share= links fold into it).
- Added: province pages that show something (/community, /events, /spots `?province=`), which already had their own title and canonical but were not in the sitemap (96 URLs).
- `lastModified` is now only set where a real date is known (ตี้/อีเวนต์ created date, moments); it was "now" for every URL.

### BE-151 · Bug tracker, part 3: BUG-13, 14, 15 (2026-10-26)
- BUG-13: a member's new ตี้ that waits for staff no longer goes back to the page (which put a card linking to a page that 404s until approval). The form shows the "ส่งให้ทีมงานแล้ว" popup, like challenges. Hosts whose ตี้ publish at once are unchanged.
- BUG-14: joining is saved on the account and My Hub reads it from there (checked through the API on Supabase). XP for a ตี้ comes from the host's check-in, not from joining, on purpose. Likely cause on the tester's side: the Vercel site kept data in each server's own temp file before DATA_STORE=postgres, so a join and the next page could land on different copies.
- BUG-15: leaving a ตี้ the account is already off (another tab, another server copy) now reloads the account's list and shows the join button again, instead of the "คุณยังไม่ได้เข้าร่วมตี้นี้" message.
- BUG-03 stays as BE-148 (owner 2026-10-26): an earlier end time means an overnight ตี้. BUG-09 (red * on required fields) waits for the owner: the form marks optional fields "(ไม่บังคับ)" instead.

### BE-152 · Security hardening: dependencies, description HTML, headers, scanners (2026-10-26)
- Next.js 16.3.1 → 16.4.3 (two remote-code-execution advisories, one in the AVIF image optimizer we use) and `npm audit fix`; `zod` inside `@vercel/blob` raised through an `overrides` entry in `package.json`. `npm audit`: 0 vulnerabilities.
- Event descriptions are cleaned with `sanitizeRichHtml` (`lib/safeHtml.ts`, which existed but was not used) when saved (`createAdminEvent` / `updateAdminEvent` in `lib/eventsStore.ts`), when shown (`renderDescriptionContent`) and when loaded into the editor (`components/RichTextEditor.tsx`). Before this a member could put a script in a ตี้ description. Only plain formatting tags and http(s) links survive; `class`/`style` attributes are dropped.
- Security headers on every response (`next.config.ts`): Content-Security-Policy, HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy. Static CSP (no nonces) so pages keep their caching. **Frontend action:** a new outside script, font, API call from the browser or iframe needs its domain added to the policy, or the browser blocks it. Images from any https host and Google Maps frames are allowed.
- GitHub: `.github/dependabot.yml` (weekly npm updates against main, security fixes at once) and `.github/workflows/codeql.yml` (code scanning on push to main/claude, PRs and weekly). Results under the repo's Security tab.
- Checked: production build, every main page and a ตี้ / อีเวนต์ / place detail page in headless Chrome with no CSP blocks or errors; the cleaner against 11 attack strings.
- Follow-up (same day, found in the E2E walk): `connect-src` now also allows `data:` and `blob:`. The photo compressor fetches its own `data:` URL before uploading, so with `'self'` alone posting a moment with a photo failed.

### BE-153 · E2E walk: journey fixes for guests and members (2026-10-26)
Walked as a guest and as members at phone (390) and desktop (1366) size in headless Chrome against a production build: sign-up from a ตี้, onboarding, join, ticket, leave, waitlist, My Hub, saved places and อีเวนต์, challenges, moments (post, like, comment), profile and settings, auth edges, host create → staff approve → guest joins → host QR check-in → XP and challenge, search, 175 internal links. Test accounts and the test ตี้ were deleted afterwards.
- **Moment composer on phones:** the bottom nav (`components/MobileNav.tsx`, was `z-50`) sat over the sheet's โพสต์ button, so it could not be tapped. Nav is now `z-40`, under every dialog and sheet.
- **Signed-in discover pages wider than the phone** (/community 543 px, /events 860, /spots 901, /challenges 540 on a 390 screen): the sr-only "สายของคุณ" labels in `components/discover/DiscoverCategoryTabs.tsx` escaped the scroll row. The row is `relative` now.
- **Place catalog downloaded twice on the member home** (21 requests of ~300 KB each, twice): `lib/usePublishedSpots.ts` kept its "fetch once" cache in module variables and the module sits in several chunks. The cache is on `globalThis` now. The hook also takes `enabled`; the visitor landing no longer downloads the catalog at all (it only showed the number of places, now from `/api/discover/counts`).
- **My Hub week view:** a member with a plan later on saw "ลองหาตี้ที่ชอบ…" and "ทั้งหมด (0)" under "ถัดไปของคุณ". A free week now says "สัปดาห์นี้ยังว่างอยู่ · นัดถัดไปของคุณคือ <date>" with "ดูนัดทั้งหมด" (list view). Plans the member dropped no longer count in the week strip (still in the month view and the past list with "ยกเลิก").
- **Ticket of an online ตี้:** no "scan at the meeting point" text and no map button; it says to join through the link in the group chat and tell the host the code.
- **Check-in window** (`lib/members/activity.ts`): a host could check someone in weeks early, which gives XP and finishes challenges with real rewards. Check-in now opens on the ตี้'s start date (`409` before; see docs/API.md).
- Not changed, for the owner: the journey band copy ("เลือกที่แรกจากหน้าชาเลนจ์" on a ตี้ challenge, "Connect 0" after a check-in) is in the paused band files; the deferred items are in docs/LAUNCH_CHECKLIST.md.

### BE-154 · Hosts hear about their ตี้, lighter place list for home and My Hub (2026-10-26)
- **Host notifications** (`lib/social/notifications.ts`, bell): `approved` when staff publish a member's ตี้ or อีเวนต์ (links to its page), `rejected` when staff turn it down (links to My Hub, where it shows "ไม่ผ่านการตรวจ"), `joined` when someone joins the host's ตี้ (one per person per ตี้, even after leave and rejoin). Sent from `updateEventApproval` / `approveAllPendingEvents` in `lib/eventsStore.ts` (only when the status changes) and `joinEvent` in `lib/members/activity.ts`. The "ส่งให้ทีมงานแล้ว" popup now adds "ตรวจเสร็จแล้วจะแจ้งที่กระดิ่งนะ" for ตี้ and อีเวนต์. No reason is sent with a rejection yet (no field in admin); on the launch checklist.
- **Place list for the member home and My Hub:** new `GET /api/spots?home=1` (`lib/homeSpots.ts`): the best-ranked places, the best of each vibe and the member's saved and visited places, ~50 places and ~200 KB in one request, instead of the whole catalog (21 requests, ~6 MB). `useHomeSpots` and `useSpotCatalog('home')` in `lib/usePublishedSpots.ts`. The /spots list and place pages still load the whole catalog (launch checklist).
- Checked: types and lint; `?home=1` on the dev server (51 places, 0.01–0.1 s); notifications with a made-up host id (approve then reject leaves one notice, a repeat join stays one, cleanup leaves nothing). Not walked in the browser yet.

### BE-155 · Landing words: "ดูตี้ตามสายที่ชอบ", hero button "หากิจกรรมที่ใช่" (owner 2026-10-26)
- The landing section with the สาย cards was "เลือกกิจกรรมตามสายที่ชอบ"; it only lists ตี้, so it is now "ดูตี้ตามสายที่ชอบ" (`app/HomeView.tsx`, comments in `app/onboarding/OnboardingFlow.tsx`, `components/CategoryStickerCards.tsx`, `DESIGN_SYSTEM.md`). Challenges stay their own section below.
- The hero button "ดูตี้ที่เปิดรับอยู่" is now "หากิจกรรมที่ใช่" (it repeats step ① of the hero photos), so a visitor does not read the site as ตี้ only. It still scrolls to the ตี้ section.

### BE-156 · Landing walk: phone chips, guest wording, อีเวนต์ row (owner 2026-10-26)
- ตี้ tiles (`components/OpenMeetupTiles.tsx`): on phones the date chip stacks day and time and stays clear of the heart (it showed "06:0"). Desktop unchanged.
- Guest challenge heading: "ชาเลนจ์สนุก ลองทำดูไหม?" (the landing is for visitors only; "แนะนำสำหรับคุณ" was not true for them).
- สาย cards on the landing: those with no open ตี้ go last and fade (`fadeEmpty` on `CategoryStickerCards`; onboarding keeps every card the same).
- Header (`components/Navbar.tsx`): guests on phones under 430 px see the logo without the name (still read by screen readers), so เข้าสู่ระบบ and สมัครฟรี fit.
- อีเวนต์ row: the kind word ("เอ็กซ์โป") only shows when the title looks like an expo, fair or exhibition; other events (ceremonies, festivals) get no kind word. The landing shows 6 instead of 4, two of each kind in turn; the member home keeps 4.

### BE-157 · Home campaign warning, place cards that name a town (owner 2026-10-26)
- Campaigns admin: the home strip shows one campaign (live, "แสดงแถบบนหน้าแรก", latest start wins; shared rule `homeCampaignOf` in `lib/campaigns/types.ts`, used by `liveCampaign` too). A campaign marked for the home page that loses to another now says "ไม่ได้แสดงบนหน้าแรก: “…” แสดงอยู่" in the list, the shown one says "แสดงบนหน้าแรกอยู่", and the editor warns when ticking the box while another is shown.
- Landing "สายเที่ยว สายชิล ไปไหนดี?": "พัทยา • ชลบุรี" and "เขาใหญ่ • นครราชสีมา" opened the whole province. `TopDestinationItem.searchTerm` (`components/TopDestinationsRail.tsx`) adds `&q=พัทยา` / `&q=เขาใหญ่` to the link (11 and 18 places instead of 46 and 38). Shorter taglines for both (also in `lib/masterData.ts`). The /spots province rails still filter by province only.

### BE-158 · One site footer, no made-up numbers on /about (2026-10-26)
- `components/SiteFooter.tsx` is the footer of the landing, /about, /challenges, My Hub and place pages (five copies before, three with English taglines). Tagline "ทำให้ทุกการออกไปใช้ชีวิตมีความหมาย", the four links, `className` for spacing, `children` for the landing's sign-up line.
- /about: the stats band (10,000+ users a day, 1,000+, 3,500+, "Safe Space 100%") and the other "ปลอดภัย 100%" claims are gone; the site has no real users yet and cannot promise 100% safety. The page still needs the redesign (positioning, HubXP, English labels).

### BE-159 · About page redesigned; terms, privacy and safety guide brought up to date (owner 2026-10-26)
- `/about` rebuilt around the positioning "คอมมูนิตี้ของคนชอบออกไปใช้ชีวิต / ทำให้ทุกการออกไปใช้ชีวิตมีความหมาย": hero, the four parts (ตี้, ชาเลนจ์, โมเมนต์, ที่เที่ยว & อีเวนต์) as open alternating rows with photos and links, the loop in five steps, "ดูแลกันแบบเพื่อน" (only things the site really does) and a sign-up ending. No boxed grids, no English labels, no numbers we cannot back (except "กว่า 2,000 แห่ง", which is true).
- Terms (`components/TermsPrivacyModal.tsx`): Spot Buddy rules; new "6. สำหรับคนจัดตี้" (honest details, check in only people who came, deleting the account deletes hosted ตี้); "7. XP เหรียญ และของรางวัล" adds campaign rules pages and taking rewards back for cheating.
- Privacy: tickets and check-ins, reviews, "อยากเจออีก", chat and ตี้ questions, follows, visits, location when posting a place/อีเวนต์ moment (only the distance is kept, never coordinates), challenge progress, reward codes and invite links; hosts see their participant list; providers may keep data outside Thailand; account deletion lists everything it removes. `TERMS_VERSION` stays `2026-10-draft` (no re-consent during the prototype).
- `/safety`: new "ตี้ตอนดึก" and "ตี้ออนไลน์" sections, and the shared footer.

### BE-160 · Sign-up wording, campaign strip switch (owner 2026-10-26)
- Landing sign-up band and the end of /about: "มาออกไปด้วยกันนะ เพื่อนๆ รอคุณอยู่" / "สมัครฟรี แล้วเริ่มออกไปใช้ชีวิต ติดตามเรื่องราวจากเพื่อนๆ และแบ่งปันเรื่องราวของคุณ" (was "สุดสัปดาห์นี้ ออกไปด้วยกันไหม?").
- Campaigns admin: each campaign has a "ซ่อนแถบหน้าแรก" / "แสดงบนหน้าแรก" button that flips `showOnHome` without opening the editor (same save action). The home page reads the campaign per request, so the strip goes away on the next visit, on the landing and the member home.

### BE-161 · Landing polish: honest hero line, full อีเวนต์ titles, even place cards, light images (owner 2026-10-26)
- Hero live line (`LiveJoinsLine`, `components/home/LiveActivity.tsx`): real joins only (no sample padding); under 1,000 a week it says "เพื่อนๆ กำลังรอคุณอยู่" ("เพื่อนๆ รอคุณอยู่" on the phone sticker), live dot kept. The member-home activity line still adds the sample numbers (launch checklist).
- อีเวนต์ row: the "กำลังจัดอยู่ / เร็วๆ นี้" status leads the second line on every screen, so desktop titles show in full.
- Place cards: shorter taglines for กรุงเทพฯ, เชียงใหม่, กระบี่, น่าน (also in `lib/masterData.ts`), one line each at 1366 px.
- Images: new `lib/optimizedImage.ts` sends /public photos and organisers' posters through the Next.js optimizer at card size. Hero collage and faces use `next/image`. Remote resizing only for ThaiRun, IMPACT, QSNCC (Prismic) and visit.bangkok (`images.remotePatterns` in `next.config.ts`, same list); any other host gets 400. Landing images measured on a throttled phone (1.6 Mbps): about 8 MB before (four ~1 MB hero/wall photos, two ~1 MB ThaiRun posters as 64 px thumbnails) → 1.6 MB after; the largest left are sample Unsplash photos.

### BE-162 · /moments: back to where you left off, tab links, lighter page, shorter phone header (2026-10-26)
- Back from a moment returns to the same tab, the cards loaded so far and the scroll position, by the browser's Back or the "โมเมนต์ทั้งหมด" link (`components/moments/momentsReturn.ts`, this tab's sessionStorage; hearts, saves and comments given on the moment's page carry over; a deleted moment drops out). A moment opened from anywhere else still links to plain `/moments`.
- Tabs are real `<a href="/moments?type=…">` links (crawlable, open in a new tab); a plain click switches in place and adds a history entry, so Back steps through the tabs.
- Tab counts come from one read (`countMomentsByType` in `lib/moments/service.ts`) instead of five; the page now reads moments twice instead of six times.
- `/moments` has `CollectionPage` + `ItemList` JSON-LD for the first 24 moments (`momentCollectionJsonLd` in `lib/structuredData.ts`).
- Phone header shorter (smaller collage, heading and gaps): the first row of photos is fully on screen at 390×844 (photo top 455 px, was about 600). Tablet and desktop unchanged.
- Walked in headless Chrome on a production build: tab switch, Back through tabs, return by Back and by the link at shallow and deep scroll, fresh visit starts at the top, no sideways scroll.
- Follow-up the same day: a toast that comes right after another gets its full three seconds (`MomentsChrome`); deleting your own comment asks "ลบความคิดเห็นนี้ไหม · ลบเลย · ยกเลิก" first; signing in on the grid fills the member's hearts into the cards already loaded instead of reloading page 1, so a reader scrolled down stays put. Signed-in walk (dev server, throwaway member, deleted after): sign in from a heart while scrolled down (position and cards kept, own hearts shown), like from the grid, unlike on the moment's page and see it on the card after Back, comment, cancel and confirm delete, no sideways scroll.

### BE-163 · Brand logo from `public/brand-logo.jpg` (owner 2026-10-26)
- `components/BrandLogo.tsx` now shows `public/brand-logo.jpg` (through the Next.js image optimizer, the source is 2048 px / 1.1 MB) in the same rounded white frame; sizes and props unchanged, so every caller (top bar, menu, footer, login, onboarding, legal, verify, reset) picks it up. The `variant` prop is kept but ignored, so `/preview-logo` now shows the same logo for every option.
- Browser and app icons rebuilt from the same file: `app/icon.png` (512), `app/apple-icon.png` (180), `app/favicon.ico` (16/32/48, PNG inside, RGBA as Next requires) and `public/brand-logo.png` (512, used in the page metadata).
- `public/brand-logo-2.jpg` is in the folder but unused.

### BE-164 · /challenges polish toward 9.5 (2026-10-26)
- Phone: the campaign banner's "สะสม XP เพิ่มได้อีก" chips show from `sm` up only (`LaunchCampaignBanner`); a guest reaches the first challenge about a screen sooner (page 4,821 → 3,547 px at 390).
- List view shows 10 rows, then "ดูเพิ่ม (n)" like the ค้นพบ lists (`ChallengeList` `pageSize`, reset when a filter changes). My Hub passes no `pageSize`, so it still shows every row.
- Month headings say what happens in that month: "ปิดเดือน…" (running, by closing day), "เริ่มเดือน…", "จบเดือน…". Before, a row for 26 ต.ค. – 1 พ.ย. sat under a bare "พฤศจิกายน".
- The empty result's "ดูชาเลนจ์ทั้งหมด" now clears every filter (it left the pills on, so it could do nothing).
- `/challenges` has `CollectionPage` + `ItemList` JSON-LD for the open challenges (`challengeCollectionJsonLd`; shares `collectionJsonLd` with /moments).
- Photos: list rows, the "เริ่มเร็วๆ นี้" strip, cards and the detail hero go through `optimizedImage` (the local HYROX photo was 1.1 MB at every size); the detail hero has the challenge title as `alt`. A place photo that fails to load on the detail page leaves the plain frame instead of a broken-image icon.
- Toast: a message right after another gets its full three seconds. Dead code removed from `ChallengesListView` (unused icons, a cancel dialog nothing opened, join handler and membership dialog nothing called).
- Walked on the dev server, guest and a throwaway member (deleted after), 390 and 1366: join from the detail page, "กำลังทำ 1" in the header, "ที่ฉันทำอยู่", "ดูเพิ่ม", no sideways scroll, no script errors.

### BE-165 · /challenges: landing tiles, show more, compact campaign banner (owner 2026-10-27)
- One tile for challenges everywhere: new `components/ChallengeTile.tsx` (tilted square photo, XP sticker, title, one coloured line) is used by the landing row (`ChallengePicks`, look unchanged) and the /challenges card view, at the landing's widths (2 / 3 / 4 / 6 columns). `components/ChallengeCard.tsx` (16:9 print, prize ticket, "ดูชาเลนจ์ →") is deleted; the whole tile is the link.
- On /challenges the tile's coloured line is the prize the host named (`questPrizeLabel`, the admin short label: amber gift for a shop prize, violet medal for a medal), otherwise the landing's friendly reason; a date line follows. Joined: violet ring, and the progress bar in place of the line.
- Card view: "แสดงเพิ่มเติม" (`ShowMoreButton`, as on /community, /events, /spots) in place of page numbers, whole rows per batch (12 phone, 16 at 4 columns, 18 at 6). List view keeps "ดูเพิ่ม (n)" like the ค้นพบ date lists.
- `LaunchCampaignBanner` redesigned compact: what it is + the one action side by side, the three steps as one row of chips (full titles on wide screens, short names on smaller ones). Height at 1640: 360 → 166 px; phone 284 px. The "สะสม XP เพิ่มได้อีก" chips are gone from the banner (those challenges are in the list below; `extraQuestIds` is unchanged and still counts for the campaign). Members see XP x / 500 with a thin bar and "ดูกติกา" / "แลกสิทธิ์ลุ้นเลย" / "ดูรหัสสิทธิ์ของฉัน".
- Checked in headless Chrome on the dev server at 1640, 1024 and 390, guest and a throwaway member (deleted after): no sideways scroll, no script errors, show more adds whole rows, the landing row looks as before.
- Later the same day (owner): the home page leads the campaign, so on /challenges `LaunchCampaignBanner` is now one thin line: headline + status ("ครบ 3 ชาเลนจ์ · ถึง …" for guests, "ทำแล้ว x/3 ชาเลนจ์ · อีก n XP" for members) and one pill (สมัครเลย / ดูกติกา / แลกสิทธิ์ / ดูรหัสสิทธิ์). The step chips and the XP bar are gone; on a phone the headline and status stack, about 56 px.

### BE-166 · /rewards: wider page, room for partner names (owner 2026-10-27)
- `app/rewards/page.tsx` uses the /challenges width (`max-w-7xl`, 1536 px on 2xl) instead of `max-w-6xl`, and the reward grid gets a 4th column on 2xl, so wide screens no longer leave a blank band on the right.
- The category tile on each reward card is smaller (44 → 28 px) so the partner's name has room; the full name is in the tooltip. At 1366 and 1730 most names now fit; the three longest sample names (about 30 letters) still end in "…".

### BE-167 · One switch hides the campaign bar everywhere (owner 2026-10-27)
- `app/challenges/page.tsx` now reads `liveCampaign({ home: true })`, so the admin "ซ่อนแถบ" switch (`showOnHome`) hides the bar on /challenges as well as on the landing page and member home. Admin labels now say "แสดงแถบบนหน้าแรกและหน้าชาเลนจ์". A hidden campaign still runs: its challenges still count and its prize stays on /rewards.
- Type brought onto the DESIGN_SYSTEM scale (section 6): card title `text-sm sm:text-base` with `min-h-[2.5rem]`; partner, amount and "ขาดอีก" are regular `text-xs text-slate-500` secondary lines (they were semibold/bold); the XP price is a key value `font-semibold` (was `text-lg font-bold`); sidebar "ได้ XP จาก" is a side heading `text-base font-bold`; the "ดูชาเลนจ์ที่เปิดอยู่" link is `font-medium`. With the partner at 12px, every sample name now fits.
- /challenges card view: "แสดงเพิ่มเติม" batch on a wide screen is 24 tiles (4 rows of 6) instead of 18 (owner 2026-10-27); phone and tablet unchanged.
- List view "เริ่มเร็วๆ นี้" strip (`components/ChallengeList.tsx`, also in My Hub) now uses `ChallengeTile` like the card view; the prize-line rule moved to `prizeReasons()` in `components/ChallengeTile.tsx` so both share it. `scroll-px-3` keeps the first tilted tile and its XP sticker from being cut at the edge.
- Card view order follows the list view: running challenges by closing day, then the ones starting soon by starting day, then ended.
- Header: for guests "ดูของรางวัล ›" is a link at the end of the subtitle (no lone pill); members keep the XP pill and "+" on the title row at every width ("เสนอชาเลนจ์" text from sm). Below md the card/list switch sits beside the search box. Checked at 390 (device emulation), 768 and 1440: no sideways scroll, nothing on a row of its own.
- Signed-in walk (demo member, joined 2 challenges then left both): `ChallengeTile` shows "ร่วมแล้ว · อีก N วันเริ่ม" for a joined challenge that has not started (was an empty 0/n bar). "ที่ฉันทำอยู่" shows only when the member joined something; below sm it sits in the header in place of the XP pill (XP is in มายฮับ on the bottom bar), so the filter row stays one row. Checked at 390 and 1440, no sideways scroll.

### BE-168 · /community: landing tiles plus a host, rating and price line (owner 2026-10-27)
- New `components/MeetupTile.tsx`: the landing's ตี้ tile (square photo, day + time and seats on it, title, place, faces of who is going) as one component. `OpenMeetupTiles` (landing and member home) now uses it; the look there is unchanged.
- /community card view uses `MeetupTile` with `showHost`: one quiet line under the title with the host's avatar and name, ★ rating and price ("ฟรี" in green), because trust and cost decide whether to join. Grid at the landing's widths (2 / 3 / 4 / 6 columns), "แสดงเพิ่มเติม" in whole rows (12 phone, 16 at 4 columns, 24 at 6).
- Tile states: joined = orange ring and "ร่วมแล้ว" in place of the seats; full = "เต็มแล้ว" (before, a full ตี้ said "เหลือ 0 ที่"); ended = grey photo and "จบแล้ว", no heart. Online ตี้ show the online place once.
- The friendly day ("วันนี้", "เสาร์นี้") needs the browser's clock, so the server HTML shows the plain day ("ส. 26 ธ.ค.") and /community switches after mount; no hydration mismatch across time zones.
- `EventGrid` is unchanged and still serves /events, admin, the /community empty state and the list view is still `EventDateList`.
- Each tile fetches its attendees for the faces (as on the landing), so a /community batch makes up to 24 small requests. Fine for the prototype; on the launch list if it shows up as slow.
- Checked in headless Chrome on the dev server at 1440 and 390, signed out: no sideways scroll; landing row looks as before.

### BE-169 · Image links limited to safe schemes (CodeQL, 2026-10-27)
CodeQL flagged "DOM text reinterpreted as HTML" on the `<img src>` in `components/MeetupTile.tsx` and `components/ChallengeTile.tsx`. `optimizedImage()` (`lib/optimizedImage.ts`) passed unknown strings straight through; it now returns `''` unless the link starts with `https://`, `http://`, a site path `/…`, `data:image/` or `blob:`. Passed-through links also go through `encodeURI` (escapes already in the link are kept), the sanitizer CodeQL recognizes. All current data matches, so no visible change. Frontend: keep sending image links through `optimizedImage()`.

### BE-170 · /community toward 9.5: date order, saves on the account, one request for faces (2026-10-27)
Owner asked for /community at 9.5. Changes (`app/community/CommunityListView.tsx`, `app/community/page.tsx`, `components/MeetupTile.tsx`):
- **Soonest first.** The list ran by creation date, so 26 Dec sat above 6 Dec. It now runs by date (full ตี้ still last; "ที่ผ่านมาแล้ว" shows the latest first). Server HTML uses the same order.
- **Hearts save to the account.** /community wrote hearts to a browser-only key (`favorite_events`) that never reached the account or My Hub. Hearts now use `activityActions.setSaved` and read `savedEventIds`, as the detail page does; "ที่บันทึกไว้ (n)" counts the account's list. Toasts reworded without emoji. **`/events` (FairsListView) has the same old browser-only hearts — not changed yet.**
- **One request for the faces under the tiles.** Each tile fetched `/api/events/{id}/attendees` (24 requests and ~100 reads per screen). New `GET /api/events/faces?ids=` (`faceStacksOf` in `lib/members/activity.ts`, two reads per batch); the tile batches the ids on screen. Also used by the landing's `OpenMeetupTiles`. Avatars go through `optimizedImage`.
- **Day moved off the photo (owner 2026-10-27).** The tile photo keeps only the heart and the seats badge; the day and time lead the place line in orange, followed by the short area ("พฤ. 29 ต.ค. 06:00 · สุขุมวิท"): zone label from `BANGKOK_ZONES`, else the province, "ออนไลน์" for online. Same line count as before, nothing cut on a phone. Full place stays on the detail page. Applies wherever `MeetupTile` is used (landing ตี้ row too); with `reason` (member home) the reason line follows it.
- **Search data:** `CollectionPage` + `ItemList` JSON-LD of the next 30 ตี้ (`meetupCollectionJsonLd` in `lib/structuredData.ts`).
- **Sample photos:** 13 sample ตี้ shared a photo with another (barbell ×4, running shoes ×3…); each now has its own Unsplash photo (data change through the admin API, no code).
- Removed dead code: unused club, vibe and time filters, the `user_created_events` browser merge, unused imports.
Walked signed in on a production build (desktop 1440 and phone 390): heart saves to the account and fills, saved filter lists it, joined ตี้ shows ring + "ร่วมแล้ว", no sideways scroll.

### BE-171 · Every ตี้ names its area (owner 2026-10-27)
The ตี้ tile now shows "day time · area" (BE-170), so the area is required. `components/CreateEventModal.tsx`: "ย่านหรือเขต" is required for in-person ตี้ (≥ 2 characters, ≤ 40, hint says it shows on the tile; picking a catalog place still fills it). `POST /api/events` answers `400` for a ตี้ without `zone` (online ตี้ send `online`). `components/SpotBuddyGatheringModal.tsx` sends the place's district, else its province. `MeetupTile` shows a typed area as it is ("คลองเตย"); sample ids map to the zone list, unknown sample ids fall back to the province. Existing ตี้ without a zone are not changed (the tile shows their province). Admin create (`/api/admin/events`) is unchanged.

### BE-172 · List view of /community uses the ตี้ tile (owner 2026-10-27)
- The "สัปดาห์นี้" strip now uses the same `MeetupTile` as the card view (heart, seats, host line, day · area, faces) through a new optional `renderTile` prop on `components/discover/EventDateList.tsx`; /events keeps its strip cards. The dated rows show the ตี้'s short area (`areaLabel`, exported from `MeetupTile`) instead of province · full place.
- (Colourful 3D category icons were tried and reverted the same day: the owner prefers the line icons.)

### BE-173 · One ตี้ tile and one challenge tile everywhere (owner 2026-10-27)
The boxed related cards for ตี้ and challenges are replaced by the tiles of /community and /challenges, at the same grid (2 / 3 / 4 / 6 columns) and six per row:
- New `components/detail/RelatedTiles.tsx`: `RelatedMeetupTiles` (MeetupTile with host line, joined ring) and `RelatedChallengeTiles` (ChallengeTile with reason + dates).
- Used under the ตี้ detail page ("ตี้ที่คุณอาจสนใจ"), on place pages ("ตี้ที่นัดที่นี่"), on profiles ("ตี้ที่จัด": a ตี้ in review shows "รอทีมงานตรวจ" / "ไม่ผ่านการตรวจ" and no link) and under the challenge page ("ชาเลนจ์อื่นที่น่าลอง").
- `MeetupTile` gains optional `badge` and `href` (null = no link). `teeCard` removed from RelatedCards, which now serves อีเวนต์ and ที่เที่ยว only.
- `lib/social/questDetail.ts` `related` now returns whole challenges (up to 6); see docs/API.md.
- Measured at 1440px: /community tile 183px, detail pages 161px (their column is narrower), before 255px.
- Left as they are on purpose: My Hub schedule rows, badge lists, the member home's progress rows, and the single "ลองชาเลนจ์ถัดไปไหม" card — rows and prompts, not tile grids.
- _Follow-up (owner 2026-10-27):_ challenge tiles stand straight in grids (/challenges, under the challenge page, My Hub); only the landing's single row (`ChallengePicks`) keeps the tilted photo via the new `tilt` prop on `ChallengeTile`. The XP sticker keeps its tilt everywhere.

### BE-174 · Nav tab ค้นพบ renamed กิจกรรม (owner 2026-10-27)
The top bar (`components/Navbar.tsx`, both entries) and the phone bottom bar (`components/MobileNav.tsx`) now say **กิจกรรม** for the tab that opens /community, /events and /spots. The word ค้นพบ stays where it is a verb in a sentence, and in code comments. Tab id stays `explore`.

### BE-175 · /events toward 9.5: poster tiles, date order, saves on the account (owner 2026-10-27)
- **Tile:** new `components/FairTile.tsx`, built like the ตี้ tile so switching tabs feels like one page (owner chose this over a 3:4 tile, 2026-10-27): the same square photo; a tall poster shows whole over a blurred copy of itself, a plain photo fills the square. Every tile has one badge on the photo, as every ตี้ shows its seats: the entry price ("เข้าชมฟรี", "฿800", "เริ่ม ฿1,200", "ราคาตามผู้จัด" when not given), or "จบแล้ว". Under it: title, then "date · venue" in one line with the pin ("กำลังจัด · ถึง 28 ต.ค." while it runs, browser clock only); big halls get short names (ศูนย์ฯ สิริกิติ์, อิมแพ็ค, ไบเทค). Grid 2 / 3 / 4 / 6 like /community; the list view strip uses the same tile. `EventGrid` is no longer used on /events.
- **Detail page:** "อีเวนต์อื่นที่น่าไป" under `/events/[id]` is now 6 `FairTile`s at the ตี้ grid (`RelatedFairTiles` in `components/detail/RelatedTiles.tsx`), was 4 boxed `RelatedCards`. `fairCard` removed from `RelatedCards.tsx` (only /spots uses it now).
- **Posters show whole, header too (owner 2026-10-28):** new `components/PosterPhoto.tsx` fills its frame with a photo, but an image taller than wide is shown whole over a blurred copy of itself. Used by `FairTile` and by the shared `components/detail/DetailHero.tsx`, so the header photo of ตี้, อีเวนต์ and place pages changes only when the image is a tall poster; square and wide photos look as before.
- **Order:** soonest first (on now leads); ended ones latest first. Was creation order.
- **Saves:** hearts go to the account (`activityActions.setSaved('event', …)`), as on /community and the อีเวนต์ detail page. `localStorage` `favorite_events` / `joined_fair_sub_ids` no longer read on /events.
- **Date filter** now uses `endDate`, so a fair running across the picked day is found.
- **`?category=<id>`** opens the list on that category.
- **Search:** `/events` server HTML carries a `CollectionPage` JSON-LD of the next 30 อีเวนต์ (`fairCollectionJsonLd` in `lib/structuredData.ts`).
- **Links:** `EventDateList` linked อีเวนต์ rows to `/fairs/…` (a redirect); now `/events/…`.
Walked on a production build, guest and demo member, 390 and 1440 px: no sideways scroll, one h1, save → account → saved filter → unsave all work.

### BE-176 · Speed: tab switches, page weight and the place catalog (owner 2026-10-28)
Owner found switching ตี้ / อีเวนต์ / ที่เที่ยว slow on the local dev server and asked for performance tuning overnight. Measured on a production build at phone width, 4× slower CPU and a 6 Mbit/s, 150 ms connection.
- **Places are filtered on the server.** /spots used to download all ~2,000 places (21 requests, ~7 MB) and filter them in the browser. New `lib/spotBrowse.ts` + `GET /api/spots/browse` (see docs/API.md) apply the same filters, order and tab counts on the server's cached catalog and send only the places on screen (24 per batch). Hearts on /spots now go to the account (`activityActions.setSaved('spot', …)`) like the other pages.
- **Place pages no longer download the catalog** (they did it three times: nearby places, cafés nearby, day plan). `nearbyPool()` in `lib/spotBrowse.ts` sends just the candidates with the page. `SmartSpotPlanCard` and `NearbyDiningSection` take them as props.
- **Lighter lists.** `lib/listItems.ts` trims list items (no detail-only fields, description cut to 280 characters). /events and /community send only what is still to come; past ones load when someone picks "ที่ผ่านมา". /community no longer downloads its whole list a second time after load.
- **Sample data off the browser.** Importing one small value from `data/spotsData.ts` or `data/mockData.ts` shipped all their sample places/events (~400 KB and ~200 KB) to every page. Moved out: `MASTER_77_PROVINCES` (use from `data/masterHub`), `data/zones.ts` (`BANGKOK_ZONES`, `calculateDistanceKm`), `lib/nearbySpots.ts` (`getDistanceKm`, `getNearbySpots`, `getNearbyRecommendationInfo`), `lib/spotVibe.ts` (`getSpotVibeCategory`), `data/topDestinations.ts`, `data/topVenues.ts`. The old files re-export them, so server code is unchanged. Detail pages get bundled sample events/places from the server page (`bundledEvent()` in `lib/publicContent.ts`) instead of looking them up in the browser. `useSpotCatalog` moved to `lib/useSpotCatalog.ts` (only My Hub needs the sample places now). **Rule for new code:** in browser components import only types from `data/spotsData.ts` and `data/mockData.ts`.
- **Code loaded when needed.** The create dialog (`components/LazyCreateEventModal.tsx`, ~80 KB) loads on first open; the /spots list-view rows and /community's empty state no longer pull in framer-motion (`components/discover/EmptyResults.tsx`).
- **Loading screens.** `app/{community,events,spots}/loading.tsx` (`components/discover/DiscoverLoading.tsx`) show the top bar, the tapped tab already marked and grey tiles at once; `app/{community,events,spots}/[id]/loading.tsx` (`components/detail/DetailLoading.tsx`) do the same for detail pages.
- **Tab count for ที่เที่ยว** now counts what /spots lists (hidden-tier places only when searched for): 1,570, was 2,043, and comes from the cached index instead of re-reading every place per request.
- **Cold start of /moments 11.3 s → 0.6 s:** `ensureSampleMembers()` looked up and rewrote each sample author once per sample moment, one after another; now once per author, in parallel, and only when something changed.

Results (production build): JavaScript per page, compressed: home 429 → 303 KB, /community 423 → 251, /events 383 → 254, /spots 414 → 245 (+ no 7 MB download), place page 414 → 292, /challenges and /moments ~260. A tab tap shows the new tab within 50–85 ms on the throttled phone. On `next dev` the first visit to a page still compiles it (~1–7 s once); later visits 0.1–0.4 s. Walked: /spots (show more, search, list view, saved filter signed in, near me), past ตี้/อีเวนต์, empty state + reset, create dialog, place/ตี้/อีเวนต์ detail pages incl. bundled samples.

### BE-177 · /events and /spots toward 9.5: one tile on all three tabs, filters in the link, place page tidy (owner 2026-10-28)
- **Place tile:** new `components/SpotTile.tsx`, built like `FairTile` / `MeetupTile`: square photo, one green price badge, heart top right, title, then "distance · area" (near me) or "★ rating · area". /spots, its loading screen and "ที่เที่ยวใกล้เคียง" under a place page (`RelatedSpotTiles`, 6 tiles) use it in the 2 / 3 / 4 / 6 grid. `SpotCard` stays for My Hub and admin; `components/detail/RelatedCards.tsx` had no users left and is removed.
- **Whole rows:** /spots loads 12 / 12 / 16 / 24 / 24 places per batch like /events (was 25 on wide screens, leaving one tile alone on the last row of the 6-column grid). A place with no price shows no badge instead of "ไม่ระบุ".
- **Filters in the link:** new `lib/useFiltersInUrl.ts`. /events keeps `q`, `category`, `province`, `venue`, `price`, `status` (ended / all), `from`, `to`; /spots keeps `q`, `category`, `province`, `price`. Back, reload and shared links open the same list.
- **Opening hours:** `lib/openHours.ts` `tidyOpenHours()` folds the Tourism Directory's day-by-day list with one time into "ทุกวัน 16:30-23:00 น.". The place page shows it and its open/closed line reads it, so "ส.-อา." inside the long list no longer says "ปิดทำการวันนี้ · เปิดเฉพาะ เสาร์ - อาทิตย์" on weekdays.
- **Smart Plan:** each hop is at most 15 km (`MAX_LEG_KM` in `lib/spotDayPlan.ts`); a plan had a 34 km, 100-minute second leg.
Checked on `next dev` (server HTML: one h1, tiles render; phone screenshots of /spots, /events, a place page). Not yet walked signed in on a production build.
- **อีเวนต์ page (`app/events/[id]/FairDetailView.tsx`):** the buddy, pass and group-chat dialogs load on first open (`next/dynamic`), not with the page. The header always has a price line, "ราคาตามผู้จัด" when the organizer gives none, as the tile says. Server HTML checked: one h1, `Event` JSON-LD, canonical. Page weight not re-measured (needs a production build).

### BE-178 · ตี้ category icons from the owner's icon pack (owner 2026-10-28)
- New `components/icons/MeetupCategoryIcons.tsx`: the 19 ตี้ category drawings plus ทั้งหมด from the owner's Chill & Connect icon pack, generated from its SVG files, each in its own color. `meetupCategoryIcon(id)` returns the icon for a ตี้ category id ("all" for ทั้งหมด), or undefined for a category added in admin without a drawing (that one keeps its line icon).
- Used in the category tabs on /community and /challenges (`DiscoverCategoryTabs`, 36 px), the landing's "ดูตี้ตามสายที่ชอบ" cards (`CategoryStickerCards`) and the onboarding สาย cards (both 28 / 36 px). The 14 px chips in onboarding keep line icons; the drawings are too fine at that size.
- อีเวนต์ and place categories keep their line icons (the pack has none for them). `DiscoverCategoryTabs` checks the page kind, because some อีเวนต์ ids repeat ตี้ ids (`travel_outdoor`).
- **อีเวนต์ tile price (owner 2026-10-28):** `FairTile` shows no badge when the price is unknown (was "ราคาตามผู้จัด"), like the place tile; never "เข้าชมฟรี" unless the source says free. The อีเวนต์ page keeps its "ราคาตามผู้จัด" line beside the organizer's link.
- **Place icons (owner 2026-10-28, second pack with 31 drawings):** the icons now live in `components/icons/CategoryIcons.tsx` (was `MeetupCategoryIcons.tsx`), one entry per drawing with two maps: `meetupCategoryIcon(id)` and `spotCategoryIcon(id)`. The /spots category tabs use the 11 new place drawings; คาเฟ่, ร้านอร่อย, บาร์, หอศิลป์ and สปา share the ตี้ drawing. อีเวนต์ tabs still use line icons until their 6 missing drawings come.
- **อีเวนต์ icons (owner 2026-10-28, third pack with 37 drawings):** `fairCategoryIcon(id)`; the /events tabs use the 6 new drawings (เทศกาลดนตรี, ตลาด & คราฟต์, ละครเวที, เทศกาล & ประเพณี, บ้าน & ไลฟ์สไตล์, งานแฟร์ & เอ็กซ์โป) and share the ตี้ drawing for the other 11 (กีฬา & อีสปอร์ต uses the racket one). All three ค้นพบ tabs and /challenges now use drawn icons.

### BE-179 · Detail pages on phones and iPads, tab switching, detail speed (owner 2026-10-29)
- **Bottom menu on every detail page:** the ตี้ and ชาเลนจ์ pages used to swap the menu for their action bar. `MobileNav` takes an `actionBar` that sits as a white card above the menu, so both show (main padding `pb-48` under `lg`).
- **"นับในชาเลนจ์" + "โมเมนต์จากเพื่อนๆ" after the details:** on ตี้, อีเวนต์ and place pages under `lg` the aside is `display: contents` and the `VisitPanel` wrapper is `order-1`, so it sits just above the related tiles. Desktop keeps it in the right column.
- **Related tiles show whole rows:** `components/detail/RelatedTiles.tsx` hides the tiles after the last full row at each grid width (6 tiles on an iPad's 4 columns showed 4 + 2, now 4). Fewer tiles than one row all show. A custom `gridClassName` (profile) is left alone.
- **กิจกรรม tabs switch without the grey screen:** `DiscoverHeader` fully prefetches the other two tabs (`prefetch={true}`) once the search box has been still for 0.8 s. Prefetch runs only in a production build, so `next dev` still shows the loading screen.
- **Detail speed:** "ตี้ที่คุณอาจสนใจ" and "อีเวนต์อื่นที่น่าไป" are picked on the server (`relatedMeetups` / `relatedFairs` in `lib/publicContent.ts`) and sent with the page, in place of browser fetches of 24 ตี้ / 60 อีเวนต์ after load. The tiles are now in the server HTML. The ตี้ page loads the ticket and chat dialogs only when they open.
- **Sign-up dialog copy (owner 2026-10-29):** `RequireMembershipModal` shows the `actionTitle` alone as its title (no "เข้าสู่ระบบ" in front), written in a friend's voice for the button that opened it, e.g. "เก็บตี้นี้ไว้ ไม่ให้พลาด", "อีกนิดเดียว ก็ได้ไปตี้นี้แล้ว", "มาแล้ว? เก็บไว้เป็นความทรงจำ". Subtitle "สมัครฟรี แป๊บเดียวก็เสร็จ", button "เริ่มเลย ฟรี", footer "เป็นสมาชิกอยู่แล้ว? เข้าสู่ระบบ". The three perks stay as they were for now. Old words in titles (MyHub, Bucket List, Travel Scrapbook, XP) are gone. New callers pass a whole sentence, not "เพื่อ…".
  - **Undone, then reworded (owner 2026-10-29):** title "สมัครสมาชิก " + `actionTitle` ("เพื่อ…"), subtitle "สมัครฟรีง่ายๆ ไม่มีค่าใช้จ่าย", button "สมัครเลย", footer "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ". Callers pass "เพื่อ…" again.

### BE-180 · Landing and member home: speed walk, work moved to the server (owner 2026-10-29)
Measured on a production build with phone throttling (4× CPU, ~6 Mbps, 150 ms), every action on both pages walked.

| | Before | After |
|---|---|---|
| Visitor page HTML | 550 KB (77 KB gz) | 349 KB (54 KB gz) |
| Visitor JS / images | 304 KB / 1,020 KB | 270 KB / ~700 KB |
| Visitor main-thread blocking | 515–665 ms | 430–500 ms |
| Visitor requests after load | 5 | 2 |
| Member requests after load | 17, last at ~6 s | 9, last at ~2.2–2.5 s |
| Member main-thread blocking | ~700 ms | 135–230 ms |
| Member images | ~5.3 MB (five ~1 MB originals) | ~1.2 MB (largest 193 KB) |

- **The server reads the member** (`getPageMember` in `lib/members/session.ts`). A member's page comes with their home data (`lib/homeData.ts`: place picks plus their saved and visited places, saved or marked อีเวนต์ no longer upcoming, onboarding สาย and goals). Before, it fetched the whole event list (2 pages, 244 KB), the place picks (195 KB) and the preferences after load. Signing in on the page itself still loads them in the browser.
- **Session seed:** `seedMemberSession` (`lib/useMemberSession.ts`) gives the server's answer to the shared store before the first render, so the home page skips `GET /api/auth/member`. A signed-in member sees a grey placeholder (`MemberHomeSkeleton`) instead of the visitor landing flashing first.
- **Smaller page data:** events go as list items. Of the อีเวนต์, only the row goes, plus the soonest 30 for a member's band (`homeEvents` / `pickFairRow` in `lib/homeFairs.ts`, shared with the browser). The อีเวนต์ count and the place count come with the page (was `/api/discover/counts`).
- **สาย worked out on the server:** each ตี้ is sent with `lifestyleCategory` set, so the สาย cards no longer run keyword matching about 900 times in the browser (~120 ms on a phone).
- **Member home code loads for members only** (`next/dynamic` in `HomeView`, preloaded when the server says signed in).
- **Live activity line:** one shared fetch and poll (`components/home/LiveActivity.tsx`). The landing mounted it twice and the member home once, each polling every 30 s.
- **No bundled sample places in the browser:** `useSpotCatalog` no longer ships `MOCK_SPOTS` (~90 KB gz). My Hub had it, and every page linking to My Hub prefetched it. `homeSpotsFor` resolves a saved sample place on the server instead.
- **Photos:**
  - `optimizedImage` sizes Unsplash links by their own parameters (`w`, `q=70`, `auto=format`).
  - The server sends member-home event, challenge and place photos already resized to 640 px, because `MemberLiveHome` and `JourneyBand` show `image` as it comes.
  - `HomeView` does the same for the member's own joined ตี้.
  - `MomentPhotos` resizes photos that are not uploads.
  - The campaign prize PNG (200 KB) is sent at 384 px.
- **Walked and working:** hero buttons, สาย cards (60–100 ms), save heart → sign-up dialog (~45 ms), sign-up and login dialogs, demo login from the dialog, band tabs, feed tabs (~300 ms), like/unlike, comments, composer open/close, and links to ตี้ / ชาเลนจ์ / อีเวนต์ / ที่เที่ยว / มายฮับ (0.5–0.9 s; back to home ~160 ms). No overflow at 390 / 820 / 1280.
- **Left as is:** the member home still shifts 0.074 (CLS, under the 0.1 "good" line) when the journey band's data arrives. That is inside `JourneyBand.tsx` / `MemberLiveHome.tsx`, which hold the paused band work and were not touched.

### BE-181 · Scraper: failing event sources fixed or explained, two new readers, ICONSIAM (owner 2026-10-29)
Backend only; no API shape change, no frontend action. Of 13 sources, 8 failed on their last run (2026-10-04).

| Source | Before | Now (dry run 2026-10-29) |
|---|---|---|
| ThaiTicketMajor | failed (no JSON-LD on the list page) | new reader `lib/scrapers/thaiTicketMajor.ts`: links from `/concert/` and `/sport/`, then each show page's Event JSON-LD. 52 shows read, 12 not ended. Venue name only (the JSON-LD street address is TTM's office); province from a list of known venues |
| Ticketmelon | failed (no JSON-LD) | new reader `lib/scrapers/ticketmelon.ts`: the 60 most recently changed pages in `sitemap-event{n}.xml`, event from `__NEXT_DATA__`. Thailand only (it also sells in MY/PH). 38 events, all with province and coordinates |
| ICONSIAM (new) | — | generic JSON-LD reader on `https://www.iconsiam.com/th`: 5 current events (character exhibitions, pop-up cafés) |
| BITEC | failed (layout) | the existing reader works again: 12 events |
| Eventpop, The Concert | failed | **not readable**: the lists come from the sites' private APIs, the HTML has no events. Defaults now `inactive` with the reason in the description. Needs a partner feed |
| SET, BMA (pr-bangkok.com) | failed | not an event calendar (SET home page; a PR news site). Defaults `inactive`; Visit Bangkok covers BMA festivals |
| OSM + Wikipedia (spots) | failed (Overpass 504) | unchanged: every Overpass server timed out from the office network today; Wikidata answered. Retry from another network |

- **Shared JSON-LD reading** moved to `lib/scrapers/jsonLd.ts` (`extractRecords`, `mapJsonLdEvent`, `hasEnded`…), used by the generic reader and site readers. Changes for every JSON-LD source: ended events are skipped; HTML entities and tags are removed from titles and descriptions; a midnight time (`T00:00:00Z`) counts as a date only; an end time of 23:59 is dropped; the price is the range over all offers (`฿1,200 - ฿7,900`, was the first offer as `TH 6900`); English province names become Thai (`thaiProvinceName`, which now also reads "Chang Wat …" and "Krung Thep Maha Nakhon").
- **robots.txt follows redirects** (RFC 9309, up to 5 hops, each checked against private addresses). A redirect to an ordinary page (ICONSIAM sends `/robots.txt` to its home page) means no rules; before, any redirect failed the whole source.
- **Built-in sources take name, description and icon from code** (`getAllDataSources`), not only when the URL changed. The stored on/off status is still the admin's, so the four unreadable sources stay on until switched off in "การดึงข้อมูล".

### BE-182 · Bangkok places: 38 hand-picked places for Gen Y/Z (owner 2026-10-29)
Data only, no code change; no frontend action. Owner decisions: Bangkok first, open data only, Claude picks and writes (no AI API), photos from the place's own website allowed, publish when the score is high enough, nearby food comes live from Google.

- **How:** Claude picked ~140 known Bangkok places in the thin vibes. Each was matched to an Overture Maps place (release 2026-10-21), so it is confirmed open and has coordinates. Photo and text come from the place's own site (og:image, robots.txt respected) or Wikimedia Commons via Wikidata. The district comes from Nominatim. Places without a usable photo were dropped (logos, icons, stock, promo banners, a hacked site), as were places whose Overture point was wrong.
- **Result:** 38 places created through `POST /api/admin/spots` (`create`, then `update` for credit), ids `spot-custom-1793253…`, published. Counts: 4 cafés, 7 bars/rooftops, 8 art and shows, Lhong 1919, 7 markets, Yaowarat and Jay Fai, 6 museums/library, 3 activities. `sourceName` credits "คัดโดย Chill & Connect · พิกัด Overture Maps · รูป …"; Commons photos name the author and licence, and `sourceUrl` is the photo's page.
- **Interest signal:** monthly Wikipedia views (Jul–Sep 2026, en + th) are stored as `wikiMonthlyViews` on the 18 places that have an article. Without it, Museum Siam and the National Museum fell into "hidden". After recompute: 1 featured, 33 standard, 4 hidden (Total VR, Madame Tussauds, Neilson Hays, Kamthieng).
- **Bangkok on /spots:** 82 → 112 browsable. Art 2 → 10, cafés 5 → 9, bars 0 → 7, markets 6 → 13, museums 6 → 9, street food 0 → 2.
- **Limits found:** most cafés and bars only list Facebook/Instagram, which give no photo without login. Overture has no opening hours or popularity, so `openHours` says to check the place's site. Rooftop bars count as nightlife (title has "Bar"), so the rooftop vibe is still empty.
- **Duplicates already in the catalog** (not touched): BACC ×3, Lumphini ×2, Suan Rot Fai ×2, Suan Luang Rama IX ×2, Wat Phra Kaew ×2.
- **Production:** written to the local JSON store; run `npm run db:import` to copy it to Supabase.

### BE-183 · ตี้ and อีเวนต์ pages to 9.5, guest pages walk, page weight (owner 2026-10-29)
Walked as a guest on a production build (phone 390 px and desktop 1440 px): ตี้, อีเวนต์, /spots, a place page, /challenges, a challenge page, /login, /about, /safety, /legal.
- **A ตี้ ends at its end time, joining closes at its start (owner chose this):** `lib/dateUtils.ts` gains `meetupTimes`, `hasMeetupStarted` and `isClosedToJoin`, read on the Bangkok clock from `date` + `time`; an end earlier than the start runs into the next day (BE-148). `isEventEnded` (both copies, also `lib/db/queryEngine.ts`) now uses the end time for one-day ตี้ instead of midnight. Joining (`atomicJoinEvent` in both adapters) and the waiting list refuse a started ตี้ (`event_ended`, "ตี้นี้เริ่มไปแล้ว ปิดรับคนเพิ่มแล้ว"). Lists that offer ตี้ to join (`/community`, landing, related tiles, public `GET /api/events` without `includeEnded`) leave out started ones. The ตี้ page says "ตี้กำลังเริ่มแล้ว" and "ปิดรับแล้ว ตี้เริ่มไปแล้ว"; people already in keep their ticket and chat. Before this, a 06:00–08:00 ตี้ still took sign-ups at 22:30 the same day and led /community.
- **Phone action bar:** `MobileNav`'s detail-page bar shows only after the page's own buttons (`[data-hero-actions]` on `DetailHero` and the challenge page) scroll away, so the two never share a screen.
- **"นับในชาเลนจ์"** (`VisitPanel`): two at first, the ones the member is doing on top, then "ดูอีก N ชาเลนจ์".
- **Hero facts** (`DetailHero`): one per line on phones. Buttons are a little narrower on phones; share is icon-only there on ตี้ and อีเวนต์ pages.
- **อีเวนต์ page:** the poster shows whole (anything taller than 16:10); the bottom menu marks กิจกรรม (also on place pages); the save note no longer promises a reminder "before the day" while the งาน is on.
- **Place page opening status:** read from every part of the hours and its days ("จ.-ศ. … · ส.-อา. …"), with nights past midnight; says when it opens next ("เปิดพรุ่งนี้ 17:00 น."). It said "open" on a Thursday for a Fri–Sat market.
- **Page weight:** the detail hero goes through the image optimizer (a 1.1 MB PNG on /community/2, now ~60 KB); /spots destination circles and /events venue circles too (/spots was 11.7 MB on a phone, now 0.57 MB); challenge page place and memory photos too.
- **Search:** pages without their own picture now keep the site's share image (`pageMetadata` in `lib/site.ts`; /community, /spots, /challenges, /about, /safety had none). /login's title is its h1 (`AuthPanel isPage`).
- **Not changed, for the owner:** sample-data notes in the reply (the challenge "ทะเลหมอกต้นหนาว" shows a lake photo; a naval training centre is a featured place); /login shows three "เร็วๆ นี้" social buttons above the email form.
- **Member home, same day (owner):** the top bar has หน้าแรก first for signed-in members (`Navbar`); the "ของฉัน" links land on their own My Hub section (`#my-schedule`, `#my-passport`, `#my-saved`; My Hub waits for the section to load, scrolls to it and rings it briefly); the "สด" live line is gone from the feed (no more 30 s polling of `/api/activity` on the home page; `LiveTicker` is now unused); a moment's place/ตี้/อีเวนต์ link is one slim line ("📍 สวนป่าเบญจกิติ · ไปที่นี่บ้าง →", `ink` colour added to `MOMENT_TARGETS`). Note: `MemberLiveHome.tsx` also holds the paused journey-band lines, so stage only these hunks.
- **Member home to 9.5 (owner 2026-10-29, replaces the pinned right column kept in BE-093):** two columns on laptops, the feed and "ของฉัน" (greeting, next plans, shortcuts) pinned beside it, the page 1040 px wide. ตี้ invites, challenges, อีเวนต์ and ที่เที่ยว come as cards between the posts on every screen, as on phones; the right column (cut off at the bottom, hidden scroll) and `MeetupsBlock` are gone. Journey band: aligned to the same width, the call-out on one line on wide screens, the decorative circle gone, one `<h1>` (the wide copy is `role="heading"`), "[ตัวอย่าง]" no longer shown in titles. Feed title stays on one line on phones (tabs wrap under it). Production walk: 8 API calls on load, each once (the doubles seen on `next dev` are React's dev double effects).
- **"ชาเลนจ์ยอดฮิตตอนนี้" in the feed (owner 2026-10-29):** the same `ChallengeTile` as /challenges (XP sticker, photo, title, one reason) instead of a list: three across on wider screens, a swipe row on phones.
- **Feed cards follow the member (owner 2026-10-29):** `lib/homeInterests.ts` scores สาย, place kinds and อีเวนต์ kinds from the onboarding answers (picked ×2) and from what the member did since: joined or hosted ตี้ and อีเวนต์ (×3), saved ones (×1), joined challenges and saved places (×2). It also orders the card kinds: onboarding goals (+3: `earn_xp` → challenges, `explore_fairs` → อีเวนต์, `explore_spots` → places, `join_community` → ตี้) plus activity, default ตี้ > ชาเลนจ์ > อีเวนต์ > ที่เที่ยว. `HomeView` ranks the ตี้, challenges, อีเวนต์ and places with it (equal ones keep date / popularity order); a ตี้ reason says "เพราะคุณชอบ…" (picked) or "เพราะคุณสนใจ…" (learned). Placement (`feedCards` in `MemberLiveHome`): after posts 2, 5, 8 and 11 one card per kind in the member's order, then one every 6 posts, never the same item twice, a kind that ran out is skipped; a second round has its own heading ("ชาเลนจ์อื่นที่น่าลอง"…). On a short feed the first four go at its end (`HomeMomentFeed tailUpTo`). `MemberHomeData` now also sends `spotVibes` and `fairCategories`.
- **Journey band off the member home (owner 2026-10-30: "a page easy to understand matters more than putting everything in"):** its parts were repeated elsewhere (① picks = the feed cards and กิจกรรม, ③ share = the post box, the counts = "ของฉัน" and My Hub). Home now opens on the feed. Laptops: "ของฉัน" beside it holds the greeting with Chill · Connect · XP, ถัดไปของคุณ and the shortcuts. Phones: the greeting row, then one slim line only when there is something next (`UpNextLine`: "ไปมาแล้ว? แชร์โมเมนต์จาก …" for a ตี้ that ended in the last 2 days, hidden on this device once posted; otherwise the next plan). One `<h1>` ("สวัสดี …", the laptop copy is `role="heading"`). Countdown says "อีก N วัน" from 3 days out (was "อีก 40 วัน 14 ชม."). `JourneyBand.tsx` stays for the helpers onboarding imports; band-only props removed from `MemberLiveHome`. This also drops the "งานแฟร์" tab word the band still had.

### BE-184 · Member home: campaign beside the feed, no double links (owner 2026-10-30)
Walked signed in on the dev server (phone 390 px, laptop 1366 × 900 and × 768): the shared test account (with plans) and a brand-new account (deleted after).
- **Campaign off the top (owner):** `CampaignStrip` gains `layout="side"`, the same card stacked (date, prize, headline, button) for the 300 px column; on laptops it sits under "ของฉัน", on phones it comes between the posts after the first cards (`PHONE_CAMPAIGN_SLOT` in `MemberLiveHome`), never above the greeting. Staff still turn it off with "showOnHome" (it is off in `data/campaigns.json` now, so it does not show until turned on).
- **The side column scrolls on its own** when greeting, three plans, shortcuts and the campaign are taller than the screen (it was 939 px tall on a 768-900 px screen, cutting off the campaign button).
- **One link per place (clarity rule):** "ดูตารางทั้งหมด" left "ถัดไปของคุณ" (the schedule is "ตารางของฉัน" under ของฉัน); the greeting shows XP only, the way to rewards is "ของรางวัล" under ของฉัน.
- **"ตี้และที่เที่ยวที่บันทึก" → "กิจกรรมที่บันทึก"** (owner), as the saved list holds อีเวนต์ too.

### BE-185 · Stories made like a phone story (owner 2026-10-30)
The "เพิ่มสตอรี่" form was a small dialog (photo box, a text field, two buttons). Now it is `components/moments/StoryComposer.tsx`, full screen:
- **Tap "+ สตอรี่" and the photo picker opens at once** (a browser that refuses shows "เลือกรูปจากเครื่อง"). The photo shows whole at 9:16 on a blurred copy of itself, as viewers will see it.
- **"Aa" writes the text on the photo** (still one line, at most 120 characters); **the pin is the "อยู่ที่ไหน" sticker**: search ตี้, อีเวนต์ and places (the same searches as the moment form) and pick one; one share button at the bottom right.
- **The viewer shows the text and the sticker where they were made** (middle of the photo, `StoryCaption` / `StorySticker` shared with the composer); the sticker opens the ตี้, อีเวนต์ or place page. The author's bottom bar keeps views and ลบสตอรี่.
- **Server:** a story may carry `target: { type: community|fair|spot, id, title }` (`lib/social/stories.ts`, `docs/API.md`); a sticker with a missing part or an id that is not a plain slug is dropped. Not checked against the catalogs (as moments are not).
- **Left out on purpose (clarity rule):** music, filters, drawing, tagging people, close friends, moving the text around.
- Walked as the test account on a phone (pick, text, sticker, share, view, delete); the test story and its uploads are removed.
- **Text on the photo, owner follow-up same day:** no dark box behind it (a soft text shadow keeps it readable); drag it anywhere, turn it with two fingers on a phone or the round handle at its corner with a mouse; a tap without moving opens it for editing. The place and turn are saved with the story (`captionLayout { x, y, rotate }`, `docs/API.md`) and the viewer draws the text there. The sticker stays in a fixed spot under the middle. The empty parts of the top and bottom bars let touches through, so text near the edges can still be grabbed. Mouse drag and turn walked on a laptop screen; the two-finger turn is not walked in the headless browser and needs a try on a real phone.
- **Text colours (owner, same day):** seven, white, black, yellow, orange, pink, blue and green, as a row of dots above the keyboard while typing (`lib/storyTextColors.ts`, shared by the composer and the server; `captionColor`, `docs/API.md`). Black text gets a light edge, the others a dark one. Walked: yellow text dragged and turned, saved and shown the same in the viewer.

### BE-186 · My Hub toward 9.5, round one: rules and repeats (owner 2026-10-30)
Walked signed in (test account, phone 390 px and laptop 1366 px) before and after.
- **The schedule opens where there is something to see:** still on สัปดาห์ (owner, BE-092), but a free week with more plans later opens on รายการ, which shows them (the test account's two December ตี้ were hidden behind "สัปดาห์นี้ยังว่างอยู่"). Once the member picks a view, it stays (`pickedView` / `scheduleView` in `app/myhub/page.tsx`).
- **One black button ("ดูบัตร" in ถัดไปของคุณ, owner 2026-10-14):** "ดูนัดทั้งหมด", "หากิจกรรม" and "เปิดดูตารางชาเลนจ์" are white buttons; "ดูนัดทั้งหมด" shows only when the list has more to show. The month grid's picked day is blue, today a blue ring, a challenge deadline purple (no black date boxes).
- **A lone "ทั้งหมด (0)" chip row is hidden.**
- **One "start a challenge" line:** the "ชาเลนจ์ & XP" strip no longer says "ยังไม่ได้เริ่มชาเลนจ์…"; the passport's "เริ่มชาเลนจ์แรก รับแสตมป์แรก" is the one way in.
- **Phone order:** ถัดไปของคุณ → กำหนดการ → เดือนนี้ของฉัน → พาสปอร์ต → saved (the schedule came after last month's history).
- **"ที่สนใจ" → "กิจกรรมที่บันทึก"**, the name of the home page link that lands there; its cards are "ที่เที่ยว" and "ตี้และอีเวนต์" (was "งานที่บันทึกไว้").
- **"[ตัวอย่าง]" left out of titles in เดือนนี้ของฉัน** (`MyMonthSection`), as on other screens.
- **Next rounds (not done):** the boxed white cards against the open member home; the phone schedule header has two stacked switches (when, and how to view); walk a brand-new member, the host side ("งานที่จัด") and the month view.

### BE-187 · Admin: global search, dashboard links that land filtered, naming (owner 2026-10-30)
Admin console only; no frontend action.
- **Global search (Ctrl/⌘ + K, or the search box in the header):** jumps to any admin page, and finds ตี้, อีเวนต์, places, challenges and (for roles that manage members) members by name. Picking a result opens that list already searched for it (`components/admin/AdminCommandPalette.tsx`, using the existing admin list APIs).
- **Filters ride in the URL** (`?m=…&q=…&pillar=…&image=…&queue=…&filter=…`, `ADMIN_FILTER_PARAMS` in `AdminSidebar.tsx`), so the views open where they were sent and back/forward restores them.
- **Dashboard:** each pillar count opens the review queue on that tab; "สถานที่ไม่มีรูป" opens places filtered to missing photos; thin provinces and bad coordinates open ความครอบคลุม & แผนที่. A new "ความปลอดภัย & ชุมชน" row shows open safety reports, reported moments, host applications and members with risk signals, each opening its filtered list.
- **Naming (DESIGN_SYSTEM.md):** the admin says ตี้ (was คอมมูนิตี้) and อีเวนต์ (was งานมหกรรม & เอ็กซ์โป) in the menu, badges, tabs and hints; no emojis in the scraper's category `<option>` text.
- **หมวดหมู่ & แท็ก shows the drawn icon pack** (`components/icons/CategoryIcons.tsx`, imported read-only) for place, ตี้ and อีเวนต์ categories, the same drawings as the public tabs; the stored line icon (`iconKey`) is now labeled the fallback and is still used for the 4 moods, which have no drawing.
- **สถานที่จัดงาน: 22 more built-in venues** (`MASTER_VENUE_OPTIONS` in `data/masterHub.ts`, saved to `data/master_data.json`), picked from the places the scraped อีเวนต์ use most: IMPACT Arena, Thunder Dome, Rajamangala, Supachalasai, Lumpinee boxing stadium, RBSC, ICONSIAM, Paragon Hall, CentralWorld, UOB LIVE, Union Hall, Samyan Mitrtown Hall, Thailand Cultural Centre, Chulalongkorn, Benjakitti, Lumpini, Vachirabenjatas, Sanam Luang, plus CMECC, KICE, PEACH Pattaya and Chang Arena. Seed venues may now carry their own province, coordinates and photo. They appear as suggestions in the event form through `useMasterData().venues`; no frontend change needed. Coordinates are approximate (left empty where unsure) and should be checked with the map link in admin.

### BE-188 · Code scanning: the story composer draws the picked photo on a canvas (owner 2026-10-30)
CodeQL flagged two High "DOM text reinterpreted as HTML" alerts on `StoryPhoto` in `components/moments/StoryComposer.tsx`: the picked file's object URL flowed into `<img src>`. An allow-list regex on `src` did not clear them, so the composer now shows the picked photo with `PickedPhoto` (two canvases fed by `createImageBitmap`, same layout and blur), and no object URL is made. `StoryPhoto` stays for the viewer, where `src` is a stored story image (`isUploadedImage` in `lib/social/stories.ts`). Looks the same to members. No frontend action.
### BE-189 · สถานที่จัดงาน: photos for 19 more venues (owner 2026-10-30)
Admin and data only; no frontend action. Only 7 of the 27 built-in venues had a photo. 19 more now do (`public/images/venues/<id>.jpg`, about 70-160 KB each, 1000 px): IMPACT Arena, Thunder Dome, Rajamangala, Supachalasai, Lumpinee boxing stadium, RBSC, ICONSIAM, CentralWorld, UOB LIVE (EmSphere), Union Mall, Samyan Mitrtown, Thailand Cultural Centre, Chula Centenary Park, Lumpini, Vachirabenjatas, Sanam Luang, CMECC, PEACH (Royal Cliff), Chang Arena. Only "อื่นๆ" stays without one.
- **Source:** each venue's Wikidata photo on Wikimedia Commons (open licences: CC BY / CC BY-SA, one public domain), every photo checked by eye.
- **Credit kept:** venues gain `imageCredit` (author · licence · Commons link), set in the seed (`MASTER_VENUE_OPTIONS`) and in `data/master_data.json`; the admin venue form shows it as "เครดิตรูป". Anyone who later shows these photos on a public page should show the credit with them (CC BY needs it).
### BE-190 · My Hub toward 9.5, round two: open layout, two schedule views (owner 2026-10-30)
`app/myhub/page.tsx` only; no frontend action. Built from the draft "ร่างมายฮับ แบบเปิดโล่ง".
- **No white boxes:** sections sit on a white page split by a thin line, like the member home. The month grid keeps its frame.
- **The schedule has two views, รายการ | เดือน** (owner: three with สัปดาห์ was too many). The week strip, the smart opening view of BE-186 and the "สัปดาห์นี้ยังว่างอยู่" empty state are gone; the page opens on the list.
- **One header line:** "กำหนดการ" and รายการ | เดือน share a line on every screen; กำลังจะมาถึง / ที่ผ่านมา are underlined text tabs under it (was a second pill switch stacked on the phone). ของฉัน | งานที่จัด are underlined tabs too.
- **Type chips only when there is a choice:** with one type (only ตี้) the row is hidden; it shows with two types or more.
- **XP under the name:** "50 XP · ชาเลนจ์ของฉัน ›" sits under the page title; the "ชาเลนจ์ & XP" box is gone, and "กำลังทำอยู่" (challenges under way) no longer repeats the XP.
- **Still open:** walk a brand-new member (empty "เริ่มที่ไหนดี") and the host side on a laptop.

### BE-191 · Platform name is now Chillwaa, site address www.chillwaa.com (owner 2026-10-31)
No frontend action; all user-facing text changed in this commit.
- **Name:** every screen, page title, email, legal text and data credit says **Chillwaa** (was "Chill & Connect Hub" / "Chill & Connect"). `SITE_NAME` in `lib/site.ts` is `'Chillwaa'`; use it for new titles instead of typing the name.
- **Address:** `SITE_URL` falls back to `https://www.chillwaa.com` (`NEXT_PUBLIC_SITE_URL` still overrides it on previews). Privacy contact is `privacy@chillwaa.com`.
- **Old name kept for search:** "Chill & Connect" stays as `alternateName` in the Organization and WebSite JSON-LD and as a keyword, so people who know the old name still find the site.
- **Unchanged on purpose:** internal `source` values `'Chill & Connect Official'` / `'Chill & Connect Community'` (matched in `lib/contentOrigin.ts`, never shown), the repo/package name, bot User-Agents and code comments.
- **Supabase:** 26 rows in `app.quests` (creator name, partner name) renamed in place.
- **Social accounts (owner 2026-10-31):** Instagram `chillwaa_official`, TikTok `@chillwaa.official`, linked as `sameAs` in the Organization JSON-LD (`app/layout.tsx`). No Facebook page yet. Contact Gmail `chillwaa.official@gmail.com`; the site shows `privacy@chillwaa.com`, which needs forwarding to it before launch.
- **Wordmark (owner 2026-10-31):** new `components/BrandWordmark.tsx`: "Chill···Waa", "Chill" green, "Waa" orange (the two colours of the logo arcs), three dots between that grow and turn from green to orange (calm to wow, friends meeting halfway) and hop in turn on hover inside a `group` link (`animate-dot-hop` in `app/globals.css`, off with reduced motion). Tagline "Curated Lifestyle & Meaningful Activities" kept under it. The name is ExtraBold (800): Latin letters only, so the Thai 700 cap does not apply; Thai text still never goes above font-bold. Used in the top bar, onboarding, login/legal/reset/verify headers and the footer; use the component wherever the name appears as a logo.
- **Name meaning on /about (owner 2026-10-31):** new section "ทำไมต้องชื่อ Chillwaa" after the opening: big wordmark, the dots story, and the three Japanese readings of "waa" (輪 วงเพื่อน, わあ ว้าว!, 和 ความกลมกลืน). The same answer is a FAQ entry in the root layout JSON-LD ("ชื่อ Chillwaa มีความหมายว่าอะไร?") for Google and AI search.
- **/about parts in outing order (owner 2026-10-31):** "สี่อย่างที่พาเราออกไปด้วยกัน" now runs ตี้ → ที่เที่ยว & อีเวนต์ → ชาเลนจ์ → โมเมนต์ (friends first, then going out, then sharing). ตี้ is reworded to "ชวนก๊วนไปด้วยกัน": your own friends first, new people optional, so the page no longer opens on meeting strangers.
- **Logo file (owner 2026-10-31):** `public/brand-logo.svg` (owner's clear-background vector). `BrandLogo` now shows it bare next to the wordmark, no white frame; `framed` brings back the rounded app-icon frame for places where the mark stands alone. Browser-tab and phone icons still use the old `favicon.png` / `brand-logo.png`.
- **Icons (owner 2026-10-31):** browser-tab and phone icons rebuilt from `public/brand-logo.svg` on a soft cream-peach to light-mint gradient (#FFF4EC → #E9F8F1): `app/favicon.ico` (16/32/64), `app/icon.png` (512), `app/apple-icon.png` + `public/apple-touch-icon.png` (180, square: iOS turns clear corners black), `public/favicon.png`, `public/brand-logo.png`. The Organization JSON-LD `logo` now points at `brand-logo.png` (was the hero photo). A 1080 px profile picture for IG/TikTok was handed to the owner, not stored in the repo.

### BE-192 · Log in with LINE (owner 2026-10-31)
- **LINE joins Google, Apple and Facebook** on the log-in and sign-up screens, first in the list (most Thai members have LINE). Same flow as the others: `GET /api/auth/member/oauth/line?returnTo=…`, LINE Login v2.1 with PKCE + nonce, `id_token` issuer/audience/nonce checked (`lib/members/oauth.ts`). `OAuthProvider` / `LoginMethod` now include `'line'`; `providers.line` in `GET /api/auth/member`; `docs/API.md` updated.
- **Turn it on:** create a LINE Login channel in the LINE Developers console, register the callback `https://www.chillwaa.com/api/auth/member/oauth/line/callback` (plus `http://localhost:3000/...` for local), and set `LINE_CHANNEL_ID` + `LINE_CHANNEL_SECRET`. Until then the button shows "เร็วๆ นี้". Email comes only after LINE approves the channel's email permission (OpenID Connect → Email address permission); without it LINE members sign up with no email (the account still works; it just can't be matched to an existing email account).
- **Database:** `db/migrations/0012_line_login.sql` widens the provider and last-login-method checks to allow `'line'`. Run `npm run db:migrate` before the first LINE sign-in on Supabase.
- Admin members page: LINE count and a readiness row; profile page lists LINE as a log-in method.
- **Onboarding shows the account picture:** a member who signs in with LINE, Google or Facebook now sees that picture in the "บอกเราเกี่ยวกับคุณ" step and the previews (it was saved but never shown, so the circle looked empty). Picking a photo still replaces it.
- Facebook Graph API version moved from v19.0 (past support) to v23.0.
- **Onboarding last step to 9.5 (owner 2026-10-31):** members from LINE/Google/Facebook get their first name only in "ชื่อที่อยากให้เรียก" (the provider's full name carried the surname onto the welcome and public profile); the button reads "ตกลงตามนี้ ไปกันเลย" (was "รับคำมั่น แล้วออกไปใช้ชีวิตกัน", which read as receiving a promise); the crowded "หรือ ชาเลนจ์… · พิกัดเที่ยว…" line under the first ตี้ is gone, so the page leads to one first step. Sample ตี้ "Acoustic Coffee Session" now shows a coffee-with-friends photo instead of a concert crowd (seed files + Supabase row).
- **Browser Back in onboarding:** works like "ย้อนกลับ" (previous step; on the first step it stays). Before, it left the flow, and after a social sign-in it landed on the provider's used-up consent page ("Something went wrong" on Facebook). Walked in headless Chrome with a throwaway member (deleted after).
- **Unfinished onboarding is finished on return (owner 2026-10-31):** a member without saved answers (`onboarded: false`) is sent to `/onboarding?returnTo=…` after any sign-in (email, demo, LINE, Google, Facebook; it was only brand-new accounts) and, while signed in, from any page except `/onboarding`, `/login`, `/legal`, `/verify-email`, `/reset-password` and `/admin` (`components/OnboardingResume.tsx` in the root layout, using the shared session, no extra request). Answers count as saved at "บอกเราเกี่ยวกับคุณ", before the pledge. Walked in headless Chrome: `/` and `/moments` go to onboarding, `/legal` stays, after saving answers both open normally.
- **Onboarding step 1 without Chill / Connect (owner 2026-10-31, name is Chillwaa now):** one grid of six cards in site order (ตี้, ชาเลนจ์, แชร์โมเมนต์, ส่องโมเมนต์, ที่ใหม่ๆ, อีเวนต์), a visible question "มาที่นี่ อยากทำอะไรบ้าง?" with "เลือกได้หลายข้อ" under it (the long hint below the cards is gone), and "เลือกแล้ว N" beside ถัดไป like the later steps. Goal ids unchanged, so saved answers still read right; the `group` field and `GOAL_GROUPS` are removed. Card words: "ไปที่ใหม่ๆ", "เดินอีเวนต์ สุดสัปดาห์".
- **Member home "กิจกรรมที่บันทึก" count:** now counts the account's saves (`savedEventIds` + `savedSpotIds`, the same list My Hub shows). It counted `favorite_events` / `favorite_spots` in browser storage, so a new member in a browser used by another account (e.g. the demo) saw that account's 5. The phone bottom bar badge uses the account count too.
- **"ลองใช้เลย ไม่ต้องสมัคร" removed (owner 2026-10-31):** LINE, Google and Facebook sign-in work, so the shared demo account is gone: the button in `AuthPanel`, `POST /api/auth/member/demo`, `lib/members/demoLogin.ts`, `demoLogin` in `GET /api/auth/member` and the session seed, and `loginDemo` in `useMemberSession`. `DEMO_LOGIN` in Vercel no longer does anything and can be deleted. The demo member ("ผู้ทดลองใช้", mem_demo_tester) was then deleted from Supabase with its sample ตี้ "[ตัวอย่าง] เดินเล่นสวนเบญจกิติยามเย็น" (only sample members had joined); a JSON backup of every row was kept outside the repo.
- **Old name off the member pages:** the home greeting counter reads "ตี้ N · ที่เที่ยว N" (was "Chill N · Connect N", ตี้ now leads), the first-step line "ไปตี้แรกกับเพื่อนๆ รับ +50 XP", and My Hub's month section "ตี้ที่ไปมา N" / "ที่เที่ยวที่ไปมา N". The line under the logo is "ชวนเพื่อน ออกไปใช้ชีวิต" (was "Curated Lifestyle & Meaningful Activities"; the owner has not picked a final tagline, one line in `components/BrandWordmark.tsx`). "Chill & Connect" stays as `alternateName` in the site JSON-LD so searches for the old name still find the site.
- **Onboarding step 1, second pass (owner 2026-10-31):** easy choices first. Row 1: ส่องโมเมนต์ เพื่อนๆ · หากิจกรรม สนุกๆ (อีเวนต์) · ร่วมกิจกรรม รับรางวัล (ชาเลนจ์); row 2: เข้าตี้ เจอเพื่อนใหม่ · ไปที่ใหม่ๆ · แชร์ความประทับใจ. Cards are taller on computers (4:5) so the six photos fill the column; no extra cards (nine would repeat these). The logo is no longer a link during real onboarding (it still is in preview), since leaving would only bounce back.
- **Profile name in onboarding (owner 2026-10-31):** the field is "ชื่อที่เพื่อนๆ จะเห็น" (was "ชื่อที่อยากให้เรียก") with "แสดงบนโปรไฟล์ โมเมนต์ และในตี้ เปลี่ยนได้ทีหลัง" under it; it was always the profile name. Names may repeat (Thai nicknames do; a unique @handle would be a separate field if ever needed). Names that read as the team are refused everywhere a name is set (`reservedNameProblem` in `lib/displayName.ts`: Chillwaa / ชิลล์วา, Chill & Connect, admin / แอดมิน, ทีมงาน, เจ้าหน้าที่, official, staff): onboarding, `PATCH /api/auth/member/profile` and sign-up answer "ชื่อนี้อ่านแล้วเหมือนทีมงาน Chillwaa ลองตั้งชื่ออื่นนะ"; a provider name like that is not carried over at social sign-up.
- **Onboarding speed (owner 2026-10-31), measured on `next build` + `next start` with a Chrome walk:** the summary's picks now load while the answers save (they were fetched only after both saves; picks take ~50 ms), and the name/photo and answers saves run together. When the summary opens, home and the recommended cards are prefetched (`router.prefetch`). Walk from this machine: "ถัดไป" to summary 1.1–1.3 s (was ~1.9 s), "ตกลงตามนี้" to home 0.63 s (pledge 0.42 s + home 0.16 s). What is left is database round trips: one member update makes ~9 queries in a transaction, and the profile and preferences saves lock the same member row, so they wait for each other. From Thailand each query crosses to Supabase in Singapore; on Vercel (`sin1`, same region as Supabase) each is ~1–2 ms, so the live site should be several times faster. `next dev` adds compile time on first visit, so judge speed on the deployed site. Possible later cut if needed: return the merged member from `pgMemberRepository.update` instead of reading it back, and send the pledge alongside navigation.

### BE-193 · Sponsored cards, home columns, CodeQL photo alert (owner 2026-10-31)
- **Sponsored cards (owner 2026-10-31, instead of Google ads for now):** a venue, studio or organiser pays for one of their own ตี้, อีเวนต์, places or challenges to be the third card on its list page, with a white "สนับสนุน" chip on the photo, top left (top right on challenge tiles, past the XP sticker), so the tile keeps its height (`components/SponsoredBadge.tsx`, `sponsored` prop on MeetupTile / FairTile / SpotTile / ChallengeTile). One per page; when two are live for a page the latest start wins. The card is the item's own tile, so it still opens and joins as usual. Staff set it in admin → การ์ดสนับสนุน (`components/admin/SponsoredSlotsView.tsx`, `GET/POST /api/admin/sponsored`, store `data/sponsored.json` via `lib/sponsored/store.ts`; on serverless it lives in /tmp like campaigns, so it needs a database table before launch).
- **When it shows:** ตี้, อีเวนต์, ชาเลนจ์: only when the item is in the filtered list (it is moved up, never added to results it does not fit), card view only (the dated list views keep their date order; /challenges opens in the list view, so its sponsored card shows after switching to cards). ที่เที่ยว: the list comes a batch at a time, so the page gets the place on its own and shows it with no search, category, free-only, saved or near-me filter, and in a picked province only when the place is there. `withSponsored()` in `lib/sponsored/types.ts` does the placing.
- **Member home on laptops:** the column with the greeting, ของฉัน, ถัดไปของคุณ and the campaign is now on the left, as in My Hub, under the logo (the page uses the top bar width, `max-w-7xl 2xl:max-w-[1600px]`), with the feed centred in the rest. ของฉัน now comes before ถัดไปของคุณ (owner 2026-10-31). Phones unchanged.
- **CodeQL "DOM text reinterpreted as HTML" (onboarding photo, 4 alerts):** the picked photo or the account picture now goes through `safeImageSrc()` (`lib/optimizedImage.ts`: only http(s), site, `data:image/` and `blob:` links, escaped) before `<img src>`; same in `app/profile/EditProfileDialog.tsx`.

### BE-194 · Small fixes from the 9.5 check (owner 2026-10-31)
- **Log-in and sign-up:** only the social ways that work are shown (Apple "เร็วๆ นี้" was a greyed button on the first screen); the hint under the email form names only those (`components/auth/AuthPanel.tsx`).
- **Tab titles:** /rewards "ของรางวัล", /myhub "มายฮับ" (both showed the site title).
- **Removed test pages:** /journey-simple, /preview-hero, /preview-logo (reachable from outside; /preview-hero had two h1).

### BE-195 · /rewards toward 9.5: photo tiles, XP tickets, the prize draw on top (owner 2026-10-31)
- **Reward tiles are the site tile** (`app/rewards/page.tsx`): square photo, 2 / 3 / 4 a row (was one text card a row on phones), the XP on a tilted yellow ticket like the challenge stickers, name and partner below. Signed in: a yellow ring and "แลกได้เลย" on the photo when there is enough XP, "แลกแล้ว" when taken, otherwise a warm bar with "ขาด N". The reward dialog shows the photo too.
- **The prize draw** (an item with `drawEntry`) is one big card above the tiles, its product photo blended into the card.
- **Data:** `RewardShopItem.image` (optional; tiles without one show the category icon). SAMPLE photos from Unsplash for the 8 vouchers, `/campaign/iphone-duo.png` for the draw; on the launch checklist to swap for partners' own photos.

### BE-196 · Landing, wordmark on phones, tagline, cookies in the privacy policy (owner 2026-10-31)
- **Landing (guests):** the mid-page sign-up band "มาออกไปด้วยกันนะ เพื่อนๆ รอคุณอยู่" is gone; สมัครฟรี stays in the sticky top bar and the footer line (`app/HomeView.tsx`). The same band at the end of /about is kept.
- **Top bar on phones:** guests see the name Chill···Waa next to the logo again from 360px up (was hidden below 430px); below 360px the logo stands alone (`components/Navbar.tsx`). Checked at 320/360/375/393: สมัครฟรี stays 16px from the edge.
- **Tagline under the logo:** "คอมมูนิตี้คนชอบออกไปใช้ชีวิต" (was "ชวนเพื่อน ออกไปใช้ชีวิต", which shut out people who come alone) in `components/BrandWordmark.tsx`; one line on desktop, still hidden on phones. Matches the site description in `app/layout.tsx`.
- **Privacy policy:** new section "4. คุกกี้" (rights move to 5) in `components/TermsPrivacyModal.tsx`: only needed cookies (log-in, OAuth state, invite link `cch_ref` 30 days), no ad or outside tracking. Launch checklist: a consent banner before adding analytics, Pixel or AdSense.

### BE-197 · Landing อีเวนต์ row keeps six on every device (owner 2026-11-01)
- **Bug:** on an iPad the row "เอ็กซ์โป งานวิ่ง คอนเสิร์ต ช่วงนี้" showed 2 of 6. The server sent exactly six; the browser then dropped those ended by its own clock (Bangkok, while Vercel runs on UTC, or a tab left open overnight), with no spares to fill the gap.
- **Fix:** `homeEvents` in `lib/homeFairs.ts` sends twice the row (12) and the browser re-picks six from what is still on. Server HTML still shows six.

### BE-198 · Challenge page to 9.5: the doing state leads to where to go (owner 2026-11-01)
- **Gap under the reward box (phones):** the reward column's `space-y-10` left a 40px margin under the box even while the places below it were hidden, so the gap was 80px; now 40 like every other section (`app/challenges/[id]/ChallengeDetailView.tsx`).
- **Joined (doing):** the hero gets one main button, "ดูที่ที่นับ" (ตี้/อีเวนต์ wording when the challenge counts only those; "ตั้งตี้ของฉัน" for a host challenge), which scrolls to the places; before, the quiet "ยกเลิก" button led. The places move to the top of the main column on every screen (desktop no longer leaves the left column short beside them), the reward box stays pinned on the right, and the join steps are hidden (step 1 was "กดร่วม").
- **Checklist** (`components/detail/ChallengeChecklist.tsx`): hidden until the first visit is counted or waiting, so a new joiner no longer sees five "ยังไม่ได้ไป" rows repeating the hero's 0/n bar.
- **กติกาและเงื่อนไข** folds into a `<details>` closed by default (7 rows that mostly repeat the steps and reward box); still in the server HTML.
- **Place and memory tiles:** title 13px with `leading-snug` (was 14px, and the clamped second line was cut off and ran into the date), plus a small space above the date line.
- Walked guest + a new member at 1280 and 500 wide; test account deleted. Not seen: the earned and ended states (no test data for them).

### BE-199 · Detail pages as wide as the top bar (owner 2026-11-01)
- ตี้, อีเวนต์, ที่เที่ยว and ชาเลนจ์ detail pages (and their shared loading skeleton `components/detail/DetailLoading.tsx`) go from `max-w-6xl` (1152px) to `max-w-7xl` (1280px), so the content lines up with the logo and the list pages instead of stepping inward. Screens under 1152px are unchanged; on 2xl screens the top bar grows to 1600px but detail pages stay at 1280 so the photo and two columns stay together. Checked at 1440 and 1024, no sideways scroll.

### BE-200 · ตี้ page: meeting point with the schedule, the map section is only how to get there (owner 2026-11-01)
- `ItineraryList` (`components/detail/DetailHero.tsx`) takes an optional `meetingPoint`: a "นัดเจอที่ …" line on top of the times, heading "กำหนดการ & จุดนัดพบ" (or "จุดนัดพบ" with no schedule). Only the ตี้ page passes it (meeting point, or the place when none is set); the อีเวนต์ page is unchanged, online ตี้ pass nothing.
- The map section on `/community/[id]` is now "การเดินทาง" (was "จุดนัดพบ & การเดินทาง"); its "จุดนัด" line is gone, and the small "การเดินทาง" label under the heading shows only beside the parking note.
- Same day, owner: `ItineraryList` drawn as a timeline (time column, a dot per step on a thin line, the first dot blue) and the meeting point as its own line with a round blue pin and a small "จุดนัดพบ" label. The อีเวนต์ page uses the same timeline.

### BE-201 · ตี้ / อีเวนต์ / ที่เที่ยว pages: challenges and moments fold to one line (owner 2026-11-01)
- `components/VisitPanel.tsx`: "นับในชาเลนจ์" is one purple line (closed by default) with up to three challenge photos, a purple count badge on them, and the best reward ("ได้สูงสุด +280 XP · มีของรางวัลจากร้าน", or "คุณทำอยู่ N ชาเลนจ์" for a member doing one). Opening it shows every challenge as the same `ChallengeTile` as /challenges (XP sticker, the member's progress bar when joined), 2 per row on phones, 3 from `sm`. The old "นับแล้ว" chip per challenge is gone; the progress bar carries it.
- "โมเมนต์จากเพื่อนๆ" folds to one slim line ("ยังไม่มีโมเมนต์ · มาแชร์เป็นคนแรกกัน") only while there are no moments and the member has not marked the place; with photos it stays open as before. The share form and the "counted" notice now render outside the box so they work from either state.
- API: `GET /api/visits` challenge lines gain `image?` (the challenge cover), `docs/API.md` updated; `lib/social/questProgress.ts`.

### BE-202 · หน้าแรก in the top bar for visitors too (owner 2026-11-01)
- `components/Navbar.tsx`: the wide-screen top bar (xl and up) now starts with หน้าแรก for everyone, not only members, and before the session is known (no shift when it loads). Checked at 1280 and 1440 as a guest: the search box keeps 245px and its placeholder, no sideways scroll. Phones are unchanged (their bottom bar is separate).

### BE-203 · Category tabs show how many each holds (owner 2026-11-01)
- `components/discover/DiscoverCategoryTabs.tsx` (/community, /events, /spots, /challenges): each tab's icon carries its count as a small tilted sticker in the pillar color (ทั้งหมด in grey), like the landing's category cards; 1,000 and up reads "1.6k". The member's own-สาย dot moved to the icon's left corner; the row got 8px on top so the sticker is not cut. Screen readers hear the count after the name.

### BE-204 · Member home: search starts in the member's province, right column on wide screens (owner 2026-11-01)
- **Province:** `PublicMember` gains `province?` (the member's own province id from their preferences; `lib/members/types.ts`, `docs/API.md`). The top bar search (`components/discover/SiteSearch.tsx`) starts there for a signed-in member, on every page; a province picked by hand stays until the page is left. Guests still start at ทั่วประเทศ.
- **Right column** (`components/home/MemberLiveHome.tsx`, 2xl / 1536px and up only; owner picked it over a wider feed or a centred pair): "ตี้ใน<province>" (up to three, soonest first, the member's plans left out, matched with `eventInProvince` so กรุงเทพฯ and กรุงเทพมหานคร both count), falling back to "ตี้ที่น่าไป" when the province has none or is unset; the campaign moves here from the left column on those screens. Narrower screens unchanged. Walked at 1680 and 1536 with a Chiang Mai then Bangkok test member (deleted).

### BE-205 · กิจกรรม pages start in the member's province; ชาเลนจ์ before โมเมนต์ (owner 2026-11-01)
- New `lib/useOwnProvince.ts` (`useOwnProvinceDefault`), used by /community, /events and /spots: a signed-in member with a province lands on it, once, when the link names no province and nothing else is picked. `?province=all` still opens ทั่วประเทศ; guests and the server HTML are unchanged (search engines read the whole list). Checked as a Bangkok member: all three pages and their h1 read "ใน กรุงเทพฯ".
- Top bar (xl) and the slide-out menu now read หน้าแรก · กิจกรรม · ชาเลนจ์ · โมเมนต์ (`components/Navbar.tsx`). The phone bottom bar (`components/MobileNav.tsx`) is unchanged.

### BE-206 · Member home right column as folded lines (owner 2026-11-01)
- `components/home/MemberLiveHome.tsx` (2xl / 1536px and up): the right column is four folded lines, closed at first and one open at a time: "ตี้ใน<province>" (or "ตี้ที่น่าไป"), "ชาเลนจ์ยอดฮิต", "อีเวนต์ช่วงนี้", "ที่เที่ยวน่าไป". Each line: up to three photos with a count badge (the tiles inside, at most 6), the title and one line that sells (soonest date, best XP, first place). Opened, it shows the site's own tiles (MeetupTile, ChallengeTile, FairTile, SpotTile), two per row, and "ดูทั้งหมด". Pillar tints per DESIGN_SYSTEM.md. The campaign stays its own line under them.
- On those screens the ตี้/ชาเลนจ์/อีเวนต์/ที่เที่ยว cards between the posts are hidden (`2xl:hidden`), so the feed is only moments and nothing shows twice; the first-ตี้ picks for a member without plans stay in the feed. Laptops, tablets and phones unchanged (checked at 1280: the 3 cards still show). Replaces BE-204's single "ตี้ใน…" list.
- Same day, owner: an opened fold has "สุ่มชุดใหม่" beside "ดูทั้งหมด" when its list holds more than six. It steps through the list six at a time and starts over after the last set (so a tap never repeats what was showing); the line's hook still speaks for the whole list (the soonest ตี้/อีเวนต์, the best XP). Tested as a member: all four folds change to six new tiles with no overlap.

### BE-207 · Profile like IG: posts / followers / following, and tabs (owner 2026-11-01)
- `app/profile/ProfileScreen.tsx`: under the name, one row of โพสต์ · ผู้ติดตาม · กำลังติดตาม (zeros shown; โพสต์ opens the moments tab). The list below keeps ตี้ที่ไปมาแล้ว, ตี้ที่จัด (opens its tab), reviews, เหรียญ and XP; โมเมนต์ and ผู้ติดตาม moved up.
- The separate "ตี้ที่จัด" and "โมเมนต์" sections are now one tabbed section after the story: โมเมนต์ (photo grid, "ดูเพิ่ม"; an owner with none gets "แชร์โมเมนต์แรก") · ตี้ที่ไป · ตี้ที่จัด (review badges for the owner, "จัดการในมายฮับ"). A tab shows only when it has something (the owner always has โมเมนต์); the first one opens.
- API: `GET /api/members/{id}` and the own `publicView` gain `wentTo` (new `lib/social/pastMeetups.ts`): ended ตี้ the member went to (host check-in or a moment there), newest first, at most 24. Upcoming ones never show, so a profile does not tell where its member will be next. `docs/API.md` updated.
- Checked: a sample member with all three tabs at 1280 and 500 wide, and a new member's own profile (row 0/0/0, one โมเมนต์ tab with the first-post line; test account deleted).
- Same day, owner: ตั๋วเพื่อนซี้ is no longer a big yellow section on the own profile; a small "ชวนเพื่อนด้วยตั๋วเพื่อนซี้" link under "แก้ไขโปรไฟล์" opens the same `InviteFriendsCard` in a dialog ("ชวนเพื่อนมาไปตี้ด้วยกัน"). Nothing linked to the old `#invite` anchor.
- Same day, owner: a fourth tab **ชาเลนจ์** (the finished challenges' medals, with the challenge name under each; replaces the "เหรียญจากชาเลนจ์" section). อีเวนต์ and ที่เที่ยว stay out of the tabs (a list of someone's places shows their routine; moments already show the places they chose to share).
- The left card no longer lists ตี้ที่ไปมาแล้ว, ตี้ที่จัด or เหรียญ (the tabs carry those counts; the old ตี้ count also differed from the tab's, which holds ended ตี้ only). It keeps ★ reviews and the owner's XP. The own-profile visits request went with it.
- สายที่ชอบ chips: white with a thin border and dark text, the drawn สาย icon (`meetupCategoryIcon`, as on the category tabs) as the only colour (owner: the coloured chips outshone the rest of the profile).
- Not seen in a browser: the ชาเลนจ์ tab, since no member in the sample data has finished a challenge yet.
- Same day, owner: the owner's XP line on the profile card carries "แลกของรางวัล ›" (amber, to /rewards) on the right of the same line. Like every number there it shows only above 0, so a brand-new member sees neither; checked that a 0-XP account has no line. Not seen with XP above 0 in a browser (no test account with XP).

### BE-208 · Full check on a production build: E2E, every API, security, speed, SEO and AI search (2026-11-01, owner away)
Walked on `next build` + `next start` (port 3100, throwaway AUTH_SECRET/ADMIN_PASSWORD, SKIP_EMAIL_VERIFICATION for the test member; test accounts and the test upload deleted).
- **E2E in a browser** (500 and 1280 wide): 15 guest pages and 10 signed-in pages (home, My Hub, profile, settings, rewards, check-in, lists, detail pages). No JS errors, no failed requests, no broken images, no sideways scroll, one h1 each.
- **Every API** (80 routes, 123 calls): public reads, every write refused without a session (incl. upload), a member end to end (sign up, preferences, profile, pledge, save, join/leave ตี้ and challenge, visits, follow/block, like, upload, post and delete a moment, notifications, account delete), cross-site requests with a member cookie refused (403), member cookie refused by admin APIs, admin login/17 reads/logout. All as expected. `npm audit`: 0 vulnerabilities.
- **Fixes (uncommitted for review):**
  - Security: `/api/upload` needs a member or staff session (was open to anyone, rate-limited by IP only; `docs/API.md`). `X-Powered-By` header off (`next.config.ts`).
  - Storage: deleting your own moment now deletes its photo files too, unless another post or a story shows them (`app/api/moments/[id]/route.ts`, `deleteOwnMoment` returns the images).
  - Speed: moment photos and story rings from this site go through the image optimizer (`momentImageSrc` uses `optimizedImage`; StoriesRail rings at 128px). /moments 5.0 → 1.0 MB.
  - SEO/AI: the site-wide FAQPage JSON-LD is gone (its questions were on no page, one answer made up "80%" and used the old 4 moods); Organization description now says what Chillwaa is. New `/llms.txt` (`app/llms.txt/route.ts`) for AI search. `/admin` is noindex (`app/admin/layout.tsx`). Paid ตี้/อีเวนต์ JSON-LD gain `offers` (price or range from "฿…"/"… บาท", sold out when full or over).
- **Checked fine:** sitemap 2,347 URLs (province pages canonical to themselves), every public page has title, description, canonical, OG image, server-rendered text and JSON-LD by kind (Event, TouristAttraction, SocialMediaPosting, CollectionPage, Breadcrumb); private pages noindex; security headers (CSP, HSTS, frame DENY, nosniff); member cookie SameSite=Lax, admin cookie Strict; landing 35 ms warm.
- **Open (owner):** place photos from files.thailandtourismdirectory.go.th load full size (0.4–4 MB each; /spots up to 7.9 MB phone when scrolled to the end); two ways in `docs/LAUNCH_CHECKLIST.md` §5. `sameAs` social accounts must be real (§7).

### BE-209 · Phone bar order, live site not on the database, folding screens (owner 2026-11-01)
- **Phone and tablet bottom bar:** ชาเลนจ์ now comes before โมเมนต์ (`components/MobileNav.tsx`), matching the top bar and slide-out menu from BE-205.
- **Live site check (chillwaa.vercel.app):** one new account's cookie read as signed in 12 times of 48 and as nobody 36 times; the onboarding saves answered 401 `กรุณาเข้าสู่ระบบ`, and the account never reached Supabase. Each server keeps members in its own temp file, so Vercel has no correct `DATA_STORE=postgres` / `DATABASE_URL` (port 5432). This is the cause of "can't pass step 3" and of "sent to onboarding, then the sign-up popup". No code change: the owner sets both variables and redeploys. The same flow passes locally on Postgres.
- **Still on files after that switch:** moments, stories, notifications, chat and challenge joins (`lib/moments/jsonMomentRepository.ts`, `lib/social/jsonStore.ts`), so they stay per server on Vercel until moved.
- **Folding screens:** 13 sizes from 320 to 1180 wide (Galaxy Z Fold 8 and leaked foldable iPhone sizes, folded and open, both ways) on guest and signed-in pages in Chrome: no sideways scroll, bottom bar fits, onboarding ถัดไป tappable. Open: visitors at 1024–1279 wide have no menu (no bottom bar, top links start at `xl`, hamburger is members only). Owner to decide.

### BE-210 · Hamburger removed, bottom bar up to 1279 wide (owner 2026-11-01)
- **Removed:** the hamburger button and its slide-out menu, plus the `showMenuOnMobile` prop (`components/Navbar.tsx`). The footer still has about and legal links; the profile menu keeps My Hub, rewards, settings and log out.
- **Bottom bar:** `components/MobileNav.tsx` now shows below `xl` for visitors and members, so 1024–1279 wide (Fold 8 open in landscape, iPad in landscape) has a menu. From `xl` the top bar's links take over.
- **New bar on pages that only had the hamburger:** profile, settings, check-in, not found, and the ตี้ page's loading and not-found states.
- **Page bottoms:** bottom space under pages and footers now lasts until `xl`. Before this, list pages dropped it at `sm`, so from 640 wide the bar sat on top of "แสดงเพิ่มเติม" and footer links.
- **Checked in Chrome** at 11 sizes from 344 to 1280 wide, guest and signed in: no hamburger, exactly one menu at each width, no sideways scroll, nothing under the bar at the end of a page. The member home feed loads more as it scrolls, so it has no end to measure.
- **Open:** the live site still splits sessions after the owner's Vercel change (BE-209); it is not yet reading the database.

### BE-211 · Signed-in member read fresh; foldable popups and forms checked (owner 2026-11-01)
- **Live site now on Supabase:** after the owner set `DATA_STORE` and `DATABASE_URL` and redeployed, one cookie read as signed in 48 of 48 times and the onboarding saves answered 200.
- **Cross-server cache:** right after a save, 25 of 32 reads still said "not onboarded", because each Vercel server holds members for 10 seconds and a write clears only its own copy. A refresh then could send a member back to onboarding, and writes built on an old copy could undo a recent change. `lib/members/session.ts` now uses the new `memberRepository.findFresh()`; feeds keep the short cache through `findById`/`findByIds`. It adds one database read per signed-in request. Rerun the live test after this deploys: one server locally cannot show the difference.
- **Other per-server caches stay:** ตี้, places and challenges lists are cached 15–60 seconds per server, so seat counts can lag; joining still locks the row.
- **Checked in Chrome at 8 sizes from 344 to 1279 wide:** login, sign-up, terms, join prompt, moment and story composers, notifications, profile menu, create chooser and the first step of all four create forms, edit profile, ticket and QR, group chat. Action bar on ตี้, place and challenge pages at 6 sizes. First load of 14 pages at 6 sizes (84 loads): no crash, no sideways scroll, one h1.
- **Open:** folded landscape (658x416) with the top bar, action bar and bottom bar leaves about half the screen for content; it works. Not run: Safari, real devices, later steps of the create forms, the อีเวนต์ page's action bar.
