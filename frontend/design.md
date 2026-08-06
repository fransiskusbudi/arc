# Design — Arc

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Produced by `hallmark redesign frontend/src` — Pass B2, replacing the prior
**Almanac** system wholesale with a bespoke **Railway** wayfinding system. This
is a functional app, not a marketing site, so the macrostructure catalogue is
adapted rather than applied literally; see **Macrostructure family** below.

## Inferred design context

- **Audience** — the user themself: a data/AI professional actively job hunting. Comfortable with dense data, keyboard-driven workflows, spreadsheets. No hand-holding needed.
- **Use case** — track applications through a pipeline (lead → applied → interviewing → offer/rejected/withdrawn/declined), keep follow-ups from slipping, read conversion analytics by source. Single-user internal tool, not a multi-tenant product.
- **Tone** — austere, precise, quiet. Not editorial-literary (that was Almanac/Newsreader) — this is a wayfinding system: a printed timetable that happens to be software.

## Genre
editorial (austere/institutional register, not literary)

## Theme
**Railway** (custom, bespoke) — the job search as a railway journey. Every surface maps onto the metaphor: Pipeline is a journey line with stations, the dashboard follow-up panel is a departures board, statuses are service states with signal lamps, applications are a timetable. Heritage references (DNA only, never cloned): British Rail corporate identity (Rail Alphabet, rail blue era), SBB/CFF departure boards, Swiss transport wayfinding.

Axes: paper-band **light** (dark variant: dark, same warm anchor) · display-style **grotesque-sans** (Archivo) · accent-hue **warm** (vermillion signal red, ~30°).

## Macrostructure family

Arc has no marketing pages — it's the product itself. Applied here as an adapted *structural family*:

- **Auth page (Login):** the station entrance — wordmark set like a station sign (large Archivo, uppercase, letter-spaced), single credential card, one signal-coloured (accent) CTA.
- **App shell (Dashboard · Applications · Applications Detail):** **Workbench**-derived, re-skinned as wayfinding surfaces. Dashboard = departures board (follow-ups) + station statistics (charts). Applications/Detail = timetable, hairline row rules, tabular mono numerals.
- **Pipeline:** its own archetype — a **journey line**, not a kanban board. Horizontal track with station markers (LEAD/APPLIED/INTERVIEWING/OFFER), DONE as a dashed sideline branching off. Cards are flat, hairline-ruled rows, not floating card boxes.

## Navigation
**N3 Side-rail**, re-skinned as **station fascia**: wordmark set like a station sign, nav items in mono uppercase with a signal lamp marking the active station (not a filled bar, not a border-only indicator — a literal lamp, consistent with the status-lamp language used everywhere else). Collapses to a top bar with the same items stacked at ≤ 640px.

## Footer
**N/A.** Internal app shell — no footer.

## Typography
- Display: **Archivo**, weight 500–700, roman only, uppercase for company names / wordmark / station labels, tight tracking. Strong grotesque for "station signs."
- Body: **IBM Plex Sans**, weight 400 (body/UI), 500/600 for labels and buttons.
- Mono (timetables): **IBM Plex Mono** — stat figures, table numerals, status lamps' labels, dates, wordmark accents. `font-variant-numeric: tabular-nums` wherever a number appears.
- Display tracking: `-0.005em` (tighter, grotesque). Mono labels: `0.06–0.1em` uppercase.
- Type scale anchor: 1.25 (major third), 16px body floor. Unchanged from prior system.
- **Newsreader and JetBrains Mono are retired.** Do not reintroduce — this is not the Vault/Almanac family.

## Spacing
Tailwind's default 4px-base spacing scale, unchanged.

## Colour
OKLCH, warm anchor (paper/ink hue ≈ 50–75). One sparing signal accent — vermillion (~oklch 55% 0.19 30, hue 30) — used only for: active nav lamp, focus rings, links-on-hover, primary CTA on Login (the one "go" signal). ≤ 3% of any viewport.

Status is a **separate, functional colour channel**, re-cast as **service states**: lead→scheduled (ink gray) · applied→on time (deep green) · interviewing→in transit (olive-gold) · offer→arrived (deep green-adjacent, diamond lamp — distinguished from "on time" by lamp shape, not colour alone) · rejected→cancelled (rust) · withdrawn→withdrawn (cool gray) · declined→diverted (cool gray, distinguished by label). Display labels for status live in `STATUS_LABELS` (`src/components/StatusBadge.tsx`); the underlying `Status` enum used for API calls is unchanged.

### Dark theme — "Night service"
Same warm anchor hue, never inverted, never blue-black. Paper ~oklch(17% 0.02 50), not pure black. Elevation gets *lighter* per level. Accent and status lamps re-tuned brighter for AA on dark, described as "glowing softly." Applied via `[data-theme="dark"]`, toggled from the side-rail/mobile header, persisted to `localStorage` (`arc-theme`), applied by a no-FOUC inline script in `index.html` before first paint.

## Motion
- Easings unchanged: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in` `cubic-bezier(0.7, 0, 0.84, 0)`, `--ease-in-out` `cubic-bezier(0.65, 0, 0.35, 1)`.
- Duration scale tightened for the austere register: short 160ms (was 190ms), long 320ms (was 360ms).
- Reveal pattern: none on page load. Modal open/close and dropdown/menu use the standard recipes.
- Reduced-motion fallback: opacity-only, ≤ 150ms.

## Microinteractions stance
- Silent success (save/delete just update the row — no toast).
- Optimistic update + revert-on-error (kept from prior pass), not a toast/undo pattern.
- Full 8-state discipline on every input, select, textarea, and button.

## CTA voice
- Primary (app-wide): filled ink button (`bg-ink text-paper`), rectangular (radius ≤4px), one-line label, verb-first.
- Primary (Login only): filled **signal accent** button (`bg-accent text-accent-ink`) — the one deliberate accent CTA, framed as "the signal to go."
- Secondary: hairline-outlined button, transparent fill.
- Destructive: hairline-outlined, status-rejected (cancelled/rust) ink text — no filled red button.

## Per-page allowances
- App pages MUST NOT use hero enrichment — function carries the page.
- No eyebrows / numbered section labels anywhere, except the station "platform / departure / in transit / arrival / sideline" sub-labels on Pipeline, which are genuinely part of the wayfinding structure, not decorative kickers.

## What pages MUST share
- Wordmark (Archivo, bold, uppercase, "ARC" set like a station sign).
- The vermillion signal accent and its ≤3% placement.
- Archivo + IBM Plex Sans + IBM Plex Mono.
- CTA voice.
- N3 side-rail / station-fascia nav shell (Login is the one exception — no shell, pre-auth).
- Zero box-shadows, zero gradients, zero blur, radius ≤4px (lamps round/diamond only).

## What pages MAY differ on
- Panel composition within the Workbench family (stat strip vs. tabular spec sheet vs. journey line).
- Chart vs. table content.

## Exports

### tokens.css
See `tokens.css` next to this file for the full token set (colour, font, space, text, ease, dur, radius) in the canonical Hallmark format.
