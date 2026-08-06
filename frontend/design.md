# Design — Arc

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Produced by `hallmark redesign frontend/src` (multi-page flow — this is a functional
app, not a marketing site, so the macrostructure catalogue is adapted rather than
applied literally; see **Macrostructure family** below).

## Inferred design context

Print mode — the design-context gate could not be asked interactively. Inferred from the brief:

- **Audience** — the user themself: a data/AI professional actively job hunting. Comfortable with dense data, keyboard-driven workflows, spreadsheets. No hand-holding needed.
- **Use case** — track applications through a pipeline (lead → applied → interviewing → offer/rejected/withdrawn/declined), keep follow-ups from slipping, read conversion analytics by source. Single-user internal tool, not a multi-tenant product.
- **Tone** — editorial, restrained. Explicit anti-slop brief: no dark purple gradients, no glassmorphism, no neon. Light paper, serif display with mono numerals, hairlines, one sparing accent.

## Genre
editorial

## Theme
**Almanac** — light cool paper, mono labels, dense tabular layout, functional like a reference book. Matches the brief almost verbatim (light paper · serif + mono numerals · hairlines · one sparing accent).

Axes: paper-band **light** · display-style **roman-serif** · accent-hue **cool** (blue, ~250°).

## Macrostructure family

Arc has no marketing pages — it's the product itself. The 21 Hallmark macrostructures are landing-page shapes; applied here as an adapted *structural family* rather than literal picks:

- **Auth page (Login):** own minimal pattern — a single centred credential card, generous negative space, no marketing chrome. Closest in spirit to Letter's intimacy, without the salutation.
- **App shell (Dashboard · Applications · Applications Detail):** **Workbench**-derived — the app's real data panels (stat strip, charts, tables) stand in for Workbench's "screenshots in frames." Hairline-bordered panels, functional density, minimal copy. Within the family: Dashboard leans on a numbered stat strip (T4 knob: 4-up) before its two chart panels; Applications and Detail lean on the **F3 Tabular spec sheet** archetype for their data rows (hairline rules between rows, tabular numerics).

## Navigation
**N3 Side-rail** — the Almanac genre default for docs/reference-density products. Left rail: wordmark (mono, small caps), two nav destinations (Dashboard, Applications), user email + log out pinned to the rail foot. Text-only active indicator (a hairline left border in accent, not a filled bar) — keeps the accent sparing. Collapses to a top bar with the same items stacked at ≤ 60rem (see per-page responsive notes).

## Footer
**N/A.** This is an internal app shell, not a marketing site — there is no sitemap, no newsletter, no closing statement to make. Forcing one of the eight footer archetypes here would be exactly the kind of genre-blind template Hallmark exists to avoid. Deliberate omission, not a miss.

## Typography
- Display: **Newsreader**, weight 500 (headings), roman only — optical-size serif, editorial without drama.
- Body: **IBM Plex Sans**, weight 400 (body/UI), 500/600 for labels and buttons.
- Mono (outlier): **JetBrains Mono** — stat figures, table numeric-ish columns, status tags, wordmark, dates. `font-variant-numeric: tabular-nums` wherever a number appears.
- Display tracking: `-0.01em`. Mono labels: `0.08em` uppercase.
- Type scale anchor: 1.25 (major third), 16px body floor.

## Spacing
Tailwind's default 4px-base spacing scale is used directly (`p-4`, `gap-6`, …) — it already matches Hallmark's 4pt scale, so no parallel `--space-*` utility layer was introduced into JSX. The full named scale is still recorded in `tokens.css` for portability.

## Colour
OKLCH, cool anchor (hue ≈ 240–250). One sparing brand accent (ink-blue, hue 250) used only for: active nav indicator, links, focus rings, primary button fill/border. ≤ 3% of any viewport.

Status is a **separate, functional colour channel** — seven pipeline stages (lead/applied/interviewing/offer/rejected/withdrawn/declined) must stay scannable at a glance, which a single accent cannot carry. Status tags use muted, low-chroma inks as text + hairline outline (no saturated fills) — informational, not decorative. This is a deliberate, named exception to "one accent," not scope creep. See `tokens.css` for exact values.

### Dark theme
Same anchor hue (240 paper/ink, 250 accent) — never inverted, never re-hued. Applied via `[data-theme="dark"]` on `<html>`, toggled from the side-rail/mobile header, default follows `prefers-color-scheme`, persisted to `localStorage` (`arc-theme`), applied by a no-FOUC inline script in `index.html` before first paint. Elevation gets *lighter* per level (paper 15% → paper-2 19% → paper-3 23%), not darker. Ink/accent/status lightness raised to stay legible on dark paper; accent chroma held (not the muted-down web-safe move) since it is checked at 7.97:1 against dark paper. All colour pairs verified ≥4.45:1 (light) / ≥6.83:1 (dark) — see token block in `tokens.css`.

## Motion
- Easings: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in` `cubic-bezier(0.7, 0, 0.84, 0)`, `--ease-in-out` `cubic-bezier(0.65, 0, 0.35, 1)`.
- Duration scale: **0.85×** (Almanac's multiplier — functional, like a reference book).
- Reveal pattern: none on page load (app, not a marketing page — content is just there). Modal open/close and dropdown/menu use the standard recipes at 0.85× duration.
- Reduced-motion fallback: opacity-only, ≤ 150ms.

## Microinteractions stance
- Silent success (save/delete just update the row — no toast).
- Optimistic delete + Undo toast (5–10s), not a confirm dialog, for row deletes.
- Hover delay 800ms · focus delay 0ms on any tooltip.
- Full 8-state discipline on every input, select, textarea, and button (default · hover · focus · active · disabled · loading · error · success).

## CTA voice
- Primary: filled ink button (`bg-ink text-paper`), rectangular (small radius, not pill), one-line label, verb-first ("Save", "New application").
- Secondary: hairline-outlined button, transparent fill.
- Destructive: hairline-outlined, status-rejected ink text — no filled red button.

## Per-page allowances
- App pages (Dashboard/Applications/Detail/Login) MUST NOT use hero enrichment — function carries the page, per the app-pages rule in the multi-page flow.
- No eyebrows / numbered section labels anywhere — nothing here is genuinely ordinal.

## What pages MUST share
- Wordmark (JetBrains Mono, small caps, "ARC").
- The accent colour and its ≤3% placement.
- Newsreader + IBM Plex Sans + JetBrains Mono.
- CTA voice (rectangular, small radius, hairline or filled-ink).
- N3 side-rail nav shell (Login is the one exception — no shell, pre-auth).

## What pages MAY differ on
- Panel composition within the Workbench family (stat strip vs. tabular spec sheet).
- Chart vs. table content.

## Exports

### tokens.css
See `tokens.css` next to this file for the full token set (colour, font, space, text, ease, dur, radius) in the canonical Hallmark format.
