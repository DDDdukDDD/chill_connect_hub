# Design System: Chill & Connect Hub

The single source of truth for how the product looks and reads. It covers the public site and the admin console.

**How to use this file**

- Read it before you add or edit any UI.
- **Every rule here is mandatory for new and edited code.** Rules are written so they can be checked, not interpreted.
- **Older code that breaks a rule:** fix it when you touch that file. Do not add new violations, and do not copy an old pattern because it already exists. Known gaps are listed in [section 12](#12-known-gaps-in-existing-code).
- If a rule blocks a good design, change the rule here first (with the owner's agreement) and note it in [section 13](#13-revision-notes). Never work around it silently.
- Announce changes to this file in [docs/HANDOFF.md](docs/HANDOFF.md).

---

## 1. Principles

1. **Calm and clear.** Generous whitespace, few borders, one clear action per screen.
2. **Content carries the color.** Photos, cards and category chips are colorful; the interface around them is neutral.
3. **Honest.** The UI never claims a feature, reward or safeguard that the product does not have.
4. **Written for a visitor, not for the system.** Text speaks about what the person wants to do, not about platform modules.
5. **Premium through restraint and craft,** not decoration. [Section 14](#14-signature-what-makes-it-feel-premium) says how.

---

## 2. Pillars

The product has five content areas. Each has one color, used only as described in [section 3](#3-color).

| Pillar | Route | Data rule | Color | Soft tint | Main components |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Community meetups | `/community` | `eventType: 'community'`. Shows attendee count (`4/10 คน`) and recruitment status (`เปิดรับสมัคร` / `เต็มแล้ว`) | Sunset Amber `#F26430` (dark `#D04A1B`) | `#FFF4EE` | `EventGrid`, `CommunityCategoryRail` |
| Fairs and expos | `/fairs` | `eventType: 'public_venue'`. **No** attendee count, **no** recruitment status, **no** bottom attendee bar. Shows venue, organizer and date range | Slate Blue `#2B527A` (dark `#1F3D5C`) | `#EEF4FA` | `EventGrid`, `FairCategoryRail` |
| Lifestyle spots | `/spots` | `LifestyleSpotItem` plus the published catalog, 7 vibe categories, 77 provinces | Forest Green `#4A7C59` (dark `#2D5A3C`) | `#EBF3ED` | `SpotCard`, `SpotCategoryRail` |
| Challenges | `/challenges` | Quests that give XP and badges | Royal Violet `#7C3AED` | `#F5F3FF` | quest cards |
| Moments | `/moments` | Member photo posts | Rose Pink `#F43F5E` | `#FFF1F2` | `CommunityMomentsStrip`, `MomentsStoriesRail`, `JourneyMomentCard` |

Filters in one section never affect another section.

---

## 3. Color

### Action colors (buttons and links)

| Role | Value |
| :--- | :--- |
| Primary action | Royal Blue `#2563EB`, hover `#1D4ED8` |
| Secondary action | `slate-900`, hover `slate-800` |
| Quiet action | `slate-100`, hover `slate-200`, text `slate-700` |
| Text link | `#2563EB`, hover `#1D4ED8` with underline |

### Neutrals

| Role | Value |
| :--- | :--- |
| Page background | white; standalone screens (login, onboarding) use warm `#FAF7F2` |
| Surface (cards, dialogs) | white |
| Border | `slate-200`; warm screens use `#E8E2D8` for header and footer lines |
| Heading text | `slate-900` |
| Body text | `slate-700` / `slate-600` |
| Helper text | `slate-500`. Do not use `slate-400` for text people must read |

### Pillar colors

- **Allowed on:** cards, category chips and rails, badges, icons inside a card, and section headings of that pillar.
- **Never on:** action buttons, links, or screens that belong to no pillar (login, onboarding, account, dialogs shared across pillars).
- Forest Green is the Spots color and the logo color. It is **not** a general brand color for buttons.

### Status colors

Always pair the color with an icon and text. Never show a state by color alone.

| State | Background / border / text |
| :--- | :--- |
| Error | `rose-50` / `rose-200` / `rose-700` |
| Success | `emerald-50` / `emerald-200` / `emerald-800` |
| Warning or test mode | `amber-50` / `amber-200` / `amber-900` |
| Information | `blue-50` / `blue-100` / `#1D4ED8` |

### Gradients

- **Allowed:** a dark transparent overlay on a photo, only to keep text on the photo readable.
- **Not allowed:** gradients on buttons, badges, pills, banners or text-box backgrounds. Use a flat color.

---

## 4. Buttons

| Level | Classes | Use for |
| :--- | :--- | :--- |
| Primary | `bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm` | The one main action of a screen or dialog: search, log in, create account, next, save |
| Secondary | `bg-slate-900 hover:bg-slate-800 text-white` | A second strong action: page-header "create" buttons, the Navbar login trigger, "sign up with email" |
| Quiet | `bg-slate-100 hover:bg-slate-200 text-slate-700` | Back, cancel, close, skip |
| Provider | `bg-white border border-slate-300 text-slate-800` | Google / Apple / Facebook sign-in |
| Danger | `bg-rose-600 hover:bg-rose-700 text-white` | Only the final confirmation of something that cannot be undone (delete account). Logging out is not a danger action |
| Disabled | `bg-slate-200 text-slate-400 cursor-not-allowed` | Any level when unavailable |

- One primary button per screen or dialog.
- Shape: `rounded-full` for standalone buttons, `rounded-2xl` inside dense toolbars.
- A button label stays on one line (`whitespace-nowrap`). If it does not fit at 360px, shorten the label.
- A button that starts a request shows a spinner and a "กำลัง…" label, and is disabled until the request ends.

---

## 5. Selected state

Never use a solid black fill (`bg-black`, `bg-slate-900`) for a selected item.

| Where | Selected style |
| :--- | :--- |
| Filters, tabs and chips inside a pillar page | The pillar's soft tint as background, the pillar color as border, the pillar's dark color as text. Example for Spots: `bg-[#EBF3ED] border-[#4A7C59] text-[#2D5A3C]` |
| Forms and pillar-neutral screens (login, onboarding, dialogs) | `border-[#2563EB] ring-1 ring-[#2563EB]` plus a check mark. Chips may add `bg-blue-50 text-[#1D4ED8]` |
| Segmented switch (two or three options) | Track `bg-slate-100`; selected segment `bg-white text-slate-900 shadow-2xs` |

Show selection once. Do not combine a border, a fill, a check mark and an icon change on the same item.

---

## 6. Typography

**Fonts:** IBM Plex Sans Thai (Thai) and Plus Jakarta Sans (Latin), loaded in `app/layout.tsx`. Do not add other font families.

**Minimum size: 11px.** No text below `text-[11px]`, in any component.

| Level | Classes | Size (mobile → desktop) | Use for |
| :--- | :--- | :--- | :--- |
| Page H1 | `text-2xl sm:text-3xl md:text-4xl font-black` | 24 → 36px | Homepage hero, detail-page titles. Step titles of a wizard stop at `sm:text-3xl` |
| Section H2 | `text-xl sm:text-2xl font-black` | 20 → 24px | Pillar and section headings |
| Dialog title | `text-lg sm:text-xl md:text-2xl font-black` | 18 → 24px | Dialog and pass titles |
| Card title | `text-sm sm:text-base font-extrabold` | 14 → 16px | Titles in feeds, with `line-clamp-2 min-h-[2.5rem]` so cards in a row align |
| Body | `text-sm font-medium` | 14px | Paragraphs and descriptions |
| Key value | `text-xs sm:text-sm font-bold` | 12 → 14px | Dates, times, places, prices, ticket ids |
| Form label | `text-xs sm:text-sm font-bold text-slate-800` | 12 → 14px | The label above an input |
| Spec label | `text-[11px] sm:text-xs font-semibold text-slate-500` | 11 → 12px | Inline labels such as `วันที่จัดกิจกรรม:` |
| Badge / pill | `text-[11px] sm:text-xs font-extrabold` | 11 → 12px | Category tags, trust pills, counters |

**Thai line breaks**

- Thai has no spaces between words, so browsers may break a line inside a word. Text must never break mid-word.
- For labels and short text, write a space between phrases and render with `PhraseText` (`components/auth/PhraseText.tsx`). Lines then wrap only at those spaces.
- If text still wraps badly, shorten it or widen the container. Do not shrink the font below the scale.

**Language**

- UI text is Thai. Do not add an English translation in parentheses (`เข้าสู่ระบบ (Log in)` is wrong).
- English is fine for proper names and terms people already use: Google, XP, LGBTQ+.

---

## 7. Shape, spacing and layout

| Item | Rule |
| :--- | :--- |
| Card radius | `rounded-2xl` |
| Dialog and standalone-panel radius | `rounded-3xl` or `rounded-[32px]` |
| Buttons, chips, pills | `rounded-full` |
| Inputs | `rounded-2xl` |
| Border | 1px `slate-200`. Avoid 2px borders except for a selected ring |
| Shadow | Cards `shadow-2xs` or `shadow-sm`; dialogs `shadow-2xl`. No colored shadows |
| Breakpoints | Design mobile first. Main steps: default (phones), `sm` 640px, `lg` 1024px |
| Narrowest screen | 360px. **No horizontal scroll on any page**, and no element wider than the screen |
| Touch targets | Buttons at least 40px high; chips at least 32px |

---

## 8. Components

### Cards

- Do not put a category badge on top of a card image. The section already says what it is.
- Fair cards show no attendee bar and no "open" status strip.
- Voucher and privilege cards stay compact: `max-w-[270px]`, `min-h-[105px]`.

### Empty state

A slim horizontal strip, never a large box: `bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200`, with one short sentence and a small `ดูทั้งหมด` reset button.

### Forms

- Every input has a visible `<label>` linked with `htmlFor` / `id`.
- Set `autoComplete` on name, email and password fields.
- Input classes: `px-4 py-3 border border-slate-300 rounded-2xl text-sm font-semibold`, focus `border-[#2563EB] ring-2 ring-[#2563EB]/20`.
- Validate on submit. Show the message under the field in `text-xs font-bold text-rose-600`, and server errors in an error box with `role="alert"`.
- Mark optional fields with `(ไม่บังคับ)` or `(ไม่บอกก็ได้)`. Do not mark required fields with a red star.
- Consent and age check boxes start **unticked**.
- Never pre-fill personal data with a sample value (for example a default birth date).

### Dialogs

- `role="dialog"`, `aria-modal="true"`, labelled by the title.
- Esc closes it, focus stays inside it, and focus returns to the trigger on close.
- Overlay `bg-black/65`; panel white, up to `max-w-[520px]`, `max-h-[92vh] overflow-y-auto`.
- The close button is a quiet round button in the top-right corner.
- Account dialogs (login, sign-up, log out, terms and privacy, join prompts) use `DialogShell` and `dialogButton` from `components/auth/DialogShell.tsx`, which implement all of the above. Reuse them for new dialogs.
- A confirmation has a quiet "ยกเลิก" on the left and the action on the right. Focus starts on the safe choice.

### Scrollbars

Slim 6px scrollbars with a transparent track and a soft slate thumb are set globally in `app/globals.css`. Do not hide scrollbars on content that scrolls vertically.

### Icons and emoji

- Icons come from `lucide-react` only, drawn as line icons.
- **No emoji** in headings, titles, buttons, option cards, `<option>` text, or titles stored in data (`ปั้นเซรามิก` is right, `ปั้นเซรามิก 🎨` is wrong).
- No raw unicode arrows (`↗`, `→`). Use `<ArrowRight />`.
- Never print raw markdown (`**text**`) in the UI. Use `<strong>` or `RichTextEditor`.
- An icon must add meaning. Do not add an icon tile to every row for decoration.

### Homepage modes

The homepage has two modes: Classic at `/` (the default) and Journey at `/journey`. The switch lives in the menu drawer only, so the page itself stays uncluttered.

### Trust pills

Small white pills (`bg-white/90 border shadow-2xs`) may state a quality signal in a hero, with a lucide icon. They must describe something true today ([section 9](#9-writing)).

### Hero images

Bright, sharp photos of real Thai places. A dark overlay is allowed for text contrast ([Gradients](#gradients)).

---

## 9. Writing

- **Speak from the visitor's side.** Ask what they feel like doing (`ช่วงนี้ อยากทำอะไรบ้าง`), not which module they want (`เลือกหมวดหมู่กิจกรรมคอมมูนิตี้`).
- **No claims about things that do not exist.** Do not mention AI matching, chat rooms, identity checks, rewards or points unless the feature works today.
- **One name per thing.** Points are **XP**. Do not also call them Points, Connect Points or เหรียญ.
- **Short and plain.** One idea per sentence. No marketing filler.
- **Errors say what to do next,** in a friendly tone: `เลือกสักข้อก่อนนะ`.
- **No fake people or data** presented as real: no sample member names as the signed-in user, no stock photos as a member's avatar.

**Sample data while the product is a prototype (owner's decision, 2026-10-10)**

- Sample content is allowed during development so the screens can be judged with realistic data: sample ratings, sample member privileges and discounts, sample posts, sample counts.
- It must be removed or replaced with real data **before launch**. Every known case is listed in [section 12](#12-known-gaps-in-existing-code) under "Sample data to remove before launch"; add new cases there when you create them.
- This does not cover the signed-in member's own identity (name, avatar, email) or legal text (terms, privacy policy, consent). Those are always real.

---

## 10. Accessibility

- Text contrast at least 4.5:1 against its background.
- Every icon-only button has an `aria-label` in Thai.
- Toggle buttons expose their state with `aria-pressed` or `aria-selected`.
- Decorative icons have `aria-hidden="true"`.
- Everything works with the keyboard, and focus is visible (`focus-visible:ring-2`).
- State is never shown by color alone ([Status colors](#status-colors)).

---

## 11. Checklist before you hand over UI work

- [ ] One primary (blue) button per screen; no pillar color or gradient on buttons.
- [ ] Pillar colors appear only on cards, chips, badges and that pillar's headings.
- [ ] Selected items follow [section 5](#5-selected-state); nothing selected is solid black.
- [ ] No text smaller than 11px; sizes come from the scale in [section 6](#6-typography).
- [ ] No emoji, no `↗`, no English in parentheses, no raw `**`.
- [ ] No Thai word breaks mid-word; no button label wraps.
- [ ] Checked at 360px and at desktop width: no horizontal scroll, nothing cut off.
- [ ] Fair cards show no attendee count; community cards show count and status.
- [ ] Text claims only what works today, and uses "XP".
- [ ] Inputs have labels and `autoComplete`; dialogs close with Esc.
- [ ] Filters in one section do not change another section.
- [ ] The screen passes the six questions of the premium test ([section 14.9](#149-the-premium-test)).

---

## 12. Known gaps in existing code

Measured on 2026-10-10 in user-facing files (`app/`, `components/`, admin excluded). Fix these when you touch the file.

| Rule | Current state |
| :--- | :--- |
| Minimum 11px | `text-[10px]` in 319 places, `text-[9px]` in 30 |
| No gradients on UI surfaces | `bg-gradient-to-*` in 133 places (some are allowed photo overlays) |
| No pillar color on buttons | Forest Green `bg-[#4A7C59]` in 52 places, many of them buttons |
| No solid black for selected items | `bg-slate-900` in 198 places; those used as a selected state need the pillar tint |
| No horizontal scroll at 360px | Fixed on 2026-10-10 (the header row in `components/Navbar.tsx` needed 429px). Keep checking new pages at 360px |
| No looping decoration | 15 pulsing dots on the homepage, 16 on `/community` |

**Sample data to remove before launch** (allowed during development, see [section 9](#9-writing))

| Where | What |
| :--- | :--- |
| `components/EventGrid.tsx` | A host with no rating shows "4.9" |
| Homepage "Member Privileges" | Sample offers: "ลด 10%", "จอยตี้ฟรี", "ลด 15%" |
| `/moments` | The 24 seeded sample posts and their like counts (`isSample`) |
| Community meetups | Sample events whose dates roll forward so the feed is never empty |
| Host and member names on sample events and posts | Sample people |

A page-by-page audit with rendered counts is in [docs/HANDOFF.md](docs/HANDOFF.md) item BE-020.

Compliant references to copy from: `components/auth/AuthPanel.tsx`, `app/onboarding/OnboardingFlow.tsx`.

---

## 13. Revision notes

**2026-10-10: rewritten as one rule set** (owner's decisions, edited by Claude Code)

The file had two halves written at different times that disagreed. The owner decided:

1. **Buttons:** Royal Blue primary, slate secondary. Forest Green is the Spots and logo color, not a button color.
2. **Selected state:** the pillar tint inside pillar pages, a blue border with a check mark on forms and neutral screens. Never solid black. The earlier rule "active filter chips are `slate-900`" is withdrawn.
3. **Minimum text size:** 11px everywhere. The earlier 10px allowance for micro badges is withdrawn.
4. **Gradients:** only as a dark overlay on photos.

Also changed:

- **Fonts corrected** to the ones the app loads (IBM Plex Sans Thai, Plus Jakarta Sans). The file used to name Inter, Prompt and Outfit.
- **Homepage modes:** the "Compact / Classic" rule was rewritten as "Homepage modes" in section 8 to match the code (Classic at `/`, Journey at `/journey`).
- **Removed** untestable wording ("Global Luxury 9.8+") and merged the two philosophy sections into [section 1](#1-principles).
- **Added** neutrals, status colors, forms, dialogs, Thai line breaks, language, writing, accessibility, layout limits and the known-gaps list.
- **Pillars** are now one table of five (Moments included); the two earlier lists disagreed on order and count.

**2026-10-10: section 14 added** (owner request)

- The earlier phrase "Global Luxury 9.8+" could not be checked, so it is replaced by [section 14](#14-signature-what-makes-it-feel-premium): signature elements, photography, type, space, depth, motion, details, per-screen limits and a six-question premium test.
- A "Danger" button level and the shared `DialogShell` were added to sections 4 and 8.

---

## 14. Signature: what makes it feel premium

Sections 1 to 13 stop the product from looking bad. This section is what makes it look expensive.

**The idea: luxury is restraint plus craft.** Fewer elements, each one finished with care. A screen never becomes premium by adding decoration (gradients, glows, emoji, badges). It becomes premium through strong photography, confident type, generous space, and details that are exactly right.

### 14.1 Signature elements

These make a screen recognisably Chill & Connect. Use them; do not invent look-alikes.

| Element | What it is | Reference |
| :--- | :--- | :--- |
| The two words | "Chill" (time for yourself) and "Connect" (going out to meet people) as section labels: the Latin word large, a short Thai line beside it | Onboarding step 1 |
| Pillar tag | A white pill with a 6px dot in the pillar color and the pillar name, placed on a photo's top-left corner | `PillarTag` in `OnboardingFlow.tsx` |
| Editorial photo card | The photo fills the card; title and one meta line sit on the photo over a dark overlay; `rounded-3xl` | `PickCard` |
| Feature set of three | One large card and two small ones (stacked beside it on desktop, under it on phones) | Onboarding last screen |
| Split screen | For focused flows: a full-height photo with one brand line on one side, the task on the other | Onboarding |
| "Because you…" line | When content is chosen for a person, show why with their own words as chips (`เพราะคุณชอบ …`) and greet them by name | Onboarding last screen |

### 14.2 Photography

Photos carry the emotion; the interface stays quiet around them.

- **Subject:** real Thai places and people doing the activity. One clear subject per photo.
- **Light:** bright daylight or golden hour. No dark, flat or heavily filtered photos.
- **Never:** text or logos baked into the image, collages, clip art, or a photo that does not match the item (a sneaker on a coffee event).
- **Ratios:** cards 4:3, feature cards 16:10, thumbnails 1:1, tall side panels free. Always `object-cover`.
- **Text on a photo** always sits on a dark overlay that reaches at least `black/80` behind the text.
- **Loading:** every image box has a `bg-slate-100` placeholder and a fixed ratio, so nothing jumps when the photo arrives. Local images go through `next/image`.
- An item without a good photo uses the pillar's category image, never a broken or empty box.

### 14.3 Type with confidence

- **Display line** (one per screen at most, for a hero or brand statement): `text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight`, two lines at most.
- Pair a large line with one quiet supporting line (`text-sm text-slate-500`). Do not stack three sizes of heading.
- **Two weights per block:** one heavy (`font-extrabold` or `font-black`) and one regular (`font-medium`). No more.
- **Numbers** in prices, dates, counters and XP use `tabular-nums`.
- **Body lines** stay under about 70 characters (`max-w-prose` or a narrower column).
- The Thai font stops at weight 700 while the Latin font goes heavier, so in a mixed headline the Latin words look bolder. That contrast is part of the brand in the two words (14.1); elsewhere keep mixed Thai and Latin text at `font-bold` so it reads evenly.

### 14.4 Space and rhythm

- All spacing comes from the 4px scale (Tailwind's default steps). No arbitrary pixel values for gaps.
- **Between sections:** at least `py-12`, and `sm:py-16` on larger screens.
- **Between unrelated groups inside a section:** at least 24px (`gap-6`).
- **Inside a card:** 16px on phones, 20 to 24px on desktop.
- **One focal point per screen.** If two things compete for attention, make one smaller or move it.
- Content width stops at `max-w-7xl`; a text column stops at about 640px.
- Everything in a column shares one left edge.

### 14.5 Depth

Only three layers exist:

| Layer | Treatment |
| :--- | :--- |
| Page | Flat white or warm `#FAF7F2` |
| Card | White, `border border-slate-200`, at most `shadow-sm` |
| Overlay (dialogs, menus) | White, `shadow-2xl`, over `bg-black/65` |

- **Frosted glass** (`bg-white/90` to `/95` with `backdrop-blur`) is allowed only for a bar that sticks over scrolling content and for pills that sit on a photo.
- No colored shadows or glows, no inner shadows, no borders thicker than 1px except the selected ring.

### 14.6 Motion

Motion is quiet and short. It confirms an action or introduces content; it never decorates.

| Use | Rule |
| :--- | :--- |
| Hover and press | 150 to 200ms. Press scales to `0.98` |
| Content entering | 300 to 350ms, ease-out, fade plus a rise of 8 to 10px |
| Several items entering | Stagger 60 to 90ms, five items at most |
| Photo hover | Scale to `1.05` over 300 to 500ms inside a clipped box |
| Loading | A spinner on the button that was pressed; skeleton blocks for lists |

- **Never:** looping, bouncing or pulsing decoration (`animate-pulse` and `animate-bounce` on badges or buttons), parallax, or auto-playing carousels that move text.
- Every animation is switched off under `prefers-reduced-motion`.

### 14.7 Details that show care

- Every clickable element has a hover state, a visible focus ring and `cursor-pointer`.
- Icons are 16px beside text and 20px in a tile, with a 6 to 8px gap to their label.
- Long titles are cut with `line-clamp`, never allowed to push a card taller than its neighbours.
- Empty, loading and error states are designed, not left to chance.
- A value that can be missing (rating 0, no photo, no date) is hidden, not shown as "0" or "-".

### 14.8 Limits per screen

| Thing | Limit |
| :--- | :--- |
| Primary buttons | 1 |
| Accent colors visible outside photos | 2 |
| Text sizes inside one card | 3 |
| Badges on one card | 2 |
| Chips in a row before "more" | 5 |
| Different card styles in one section | 1 |

### 14.9 The premium test

Ask these before calling a screen done. Each must be a clear yes.

1. **Squint test:** with your eyes half closed, is there exactly one thing that stands out?
2. **Remove test:** is there nothing left that could be deleted without losing meaning?
3. **Five-second test:** does the first screen say what this is and who it is for, without scrolling?
4. **Photo test:** does the main photo make you want to be there?
5. **Edge test:** do the elements line up on shared edges?
6. **Phone test:** does it feel just as finished at 360px?

Reference screens that pass: `/onboarding?preview=1` and the account dialogs.
