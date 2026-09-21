# Awesome JEV design contract

Product UI contract for [awesomejev.cc](https://awesomejev.cc). Stack: Vite + React 19 + TypeScript, Tailwind CSS 4, shadcn **base-nova**, Geist Sans / Geist Mono, Phosphor icons.

Use this file when designing, building, or substantially changing the directory site: boards, search, cards, sort, empty states, Open Graph, and any new surface. Shape the argument and the interface together; do not restyle a data dump or assemble generic components.

## Product context

Awesome JEV is a searchable directory of curated **GitHub projects**, **X posts**, and **YouTube explainers** about TypeSafe AI’s System One model **Jev** (typed decisions, SDKs, demos, integrations). The README awesome-list and the site read from [`data/github.json`](../data/github.json) and [`data/youtube.json`](../data/youtube.json) and [`data/x.json`](../data/x.json) (posts).

Make the artifact precise, calm, direct, technically literate, and restrained. Build confidence through clarity and proof. Never manufacture confidence through hype, decoration, novelty, or exaggerated claims.

Content is TypeSafe System One / **Jev**. Never JAV / Japanese AV framing.

Start with the reader’s job: find a relevant project or post, scan its summary and meta, and leave to the source. Identity, search, and the current result set must be obvious in the first viewport.

## Priority order

When requirements compete, protect them in this order:

1. Preserve supplied facts in `data/github.json`, `data/youtube.json`, and `data/x.json` (titles, summaries, stars, dates, URLs). Do not invent tweet IDs or PLACEHOLDER rows.
2. Preserve the host stack: Vite, React, Tailwind, shadcn base-nova, `src/` conventions, Cloudflare Workers static deploy.
3. Make the reader’s question and the current result set immediately clear.
4. Establish the product through Geist typography, the 4px grid, monochrome surfaces, and restraint.
5. Choose a composition specific to this directory; avoid a generic SaaS landing page or a card-grid template dump.
6. Refine responsive behavior and interaction without weakening the hierarchy.

## Integrate with this project

Edit the files that naturally own the experience (`src/App.tsx`, `src/components/*`, `src/index.css`, `index.html`, `scripts/generate-og.ts`). Do not force a new framework, a parallel theme, or a second icon kit.

- Primitives: shadcn base-nova under `@/components/ui/*` (`Card`, `Button`, `Badge`, `Input`, `ToggleGroup`, `Alert`, `Separator`, `Select`).
- Icons: Phosphor only (`@phosphor-icons/react`).
- Type: Geist already loaded in `src/index.css` via `@fontsource-variable/geist` and `@fontsource/geist-mono`.
- Counts: live from data (`countGithubProjects`), never hardcode the project badge or OG total.
- Search: Fuse.js over `data/github.json`.
- Tokens: existing shadcn semantic CSS variables. Do not introduce a parallel token layer or a third-party brand stylesheet.

Network allowlist for the site itself: GitHub / X outbound links, the Cloudflare deploy, and user-supplied remote thumbnails / mp4s (`sourceMeta.mediaUrls`, `sourceMeta.videoUrls`). Do not add analytics, chart libraries, icon CDNs, or stock assets without authorization.

## Work in four passes

### Frame the reader’s job

Privately establish:

- Who opens this, to find or decide what?
- What is the strongest supported inventory (GitHub count, sections, latest posts)?
- What evidence makes an entry credible (summary, stars, language, date)?
- What should remain available for audit (full source JSON files, README list) without dominating the first read?

Order by reader need, not source order. Support two reading speeds:

- **Executive path:** title, GitHub count, search, section headings, and card titles communicate the directory quickly.
- **Audit path:** README sections, `data/github.json`, and collector docs preserve the record.

Write UI chrome in the locale files (`src/i18n/locales/*`). Keep project titles and summaries in their source language; the UI does not translate item copy.

### Choose the composition

The first viewport is the directory, not a masthead followed by marketing setup. Identity, search, and the start of the result list must share the opening. If the reader saw only this viewport, they should remember they can search a Jev project list, not merely the title or mood.

Match the opening to the job:

- **Browse GitHub:** section heading, sort, and cards are co-primary.
- **Browse X:** date/likes sort and social cards are co-primary.
- **Filter / search:** the query and the result count lead; empty search is honest, not decorative.

Choose geometry before components:

- Rank (stars, likes) → shared numeric column or badge treatment, tabular numerals.
- Recency → date meta, not a timeline ornament.
- Type (GitHub vs X) → zone toggle, not colored tiles.
- Language / tags → quiet badges, never a rainbow.

Compose the page as one field. One page-level throughline: a searchable inventory. Surround search with enough open space to keep it findable. End with the footer quietly; do not let the page stop after a sparse last card.

Use a squint test: at a glance, title, search, and the first cards should be obvious. If every block has equal weight, redesign before coding.

### Visual system

Treat this section as the design authority for the product. Use Tailwind + shadcn tokens for exact values. Use these instructions for composition and when primitives are appropriate.

#### Shell

Sticky header: full-viewport `h-14 bg-background` with `px-4`, no bottom border, no `max-w-6xl`. Title left, GitHub + language right. Hero: `max-w-6xl`. OG ASCII wordmark is full content width and scales to fit (never crop). Tagline sits under it, centered, in `text-muted-foreground` (`text-xl` / `sm:text-2xl`). Two lines at a natural break; do not wrap mid-phrase. Do not invert the masthead. Search is a full-width underline field in the main column, with rank tabs beneath it. GitHub also has a cards/list view toggle (Phosphor `SquaresFour` / `List`); list is a ranked table of #, project, stars — no invented activity charts. Source filter (GitHub / X / YouTube) is a left rail on large screens and a left Sheet on small screens — not a floating chip. Search is GitHub-only. Footer: short directory note and launch-post pointer. No third-party logos or decorative marks.

Keep skip-to-content. One `h1`. Source order is reading order.

#### Spacing (4px base)

All padding, margin, and gap values must land on the **4px grid**:

| Token | px | Typical utility |
| --- | --- | --- |
| 1 | 4 | `gap-1` / `p-1` |
| 2 | 8 | `gap-2` |
| 3 | 12 | `gap-3` |
| 4 | 16 | `gap-4` / `p-4` |
| 6 | 24 | `gap-6` / `p-6` |
| 8 | 32 | `gap-8` |
| 10 | 40 | `gap-10` |
| 16 | 64 | `gap-16` |
| 24 | 96 | `gap-24` |

Rhythm:

- **Within a group:** 8px (`gap-2`)
- **Between groups:** 16px (`gap-4`)
- **Between sections:** 32–40px (`gap-8` / `gap-10`)
- **Card padding:** prefer 24px (`p-6`); compact 16px (`p-4`)

Avoid off-grid values such as `gap-1.5` (6px), `mt-0.5` (2px), `mb-5` / `px-5` (20px), or `0.625rem` radius (10px). Snap to the nearest token above.

Tailwind’s default spacing unit is already 4px (`spacing.1 = 0.25rem`). Prefer scale utilities over arbitrary `text-[13px]` / `p-[5px]` unless there is a documented exception.

Give every gap one owner. A stack, grid, or section sets the gap; children must not add competing default margins.

#### Radius

Prefer **8px** (`rounded-lg` / `--radius: 0.5rem`) or **12px** (`rounded-xl` / `0.75rem`). Do not use 10px.

#### Typography and rhythm

Use Geist Sans for prose, headings, labels, controls, counts, dates, and financial-style figures. Use Geist Mono only for code, commands, paths, raw tokens, and short identifiers (repo ids, tweet ids). Set only the identifier in Mono, not its sentence.

Prefer `text-xs` / `text-sm` / `text-base` over one-off pixel sizes. Headings and body share the published weight scale; emphasis is scarce. Use tabular numerals for aligned star / like counts. Equivalent peers always share role, size, weight, and numeric treatment; never resize one card title because its string is longer.

Build vertical rhythm from relationships:

- Heading → its first paragraph: close.
- Card title → summary → meta: identical across peers.
- Content group → new section: clearly larger.

Keep body text at a comfortable reading size. Rewrite before shrinking. Separate paragraphs with space; never use first-line indents.

Write sentence-case UI labels that state the reader’s action (`Search`, `Stars`, `GitHub Open Source`). Avoid all-caps eyebrows, overlines, decorative section numbers, and em dashes.

#### Color, surfaces, and boundaries

Design in monochrome. Use color only when it adds meaning to state or action, and pair it with a non-color cue. Light and dark follow the existing CSS (`:root` / `.dark`); do not add a visible theme switcher unless the product already has one.

Tokens live in `src/index.css`: `background`, `foreground`, `muted`, `border`, `card`, `primary`, `destructive`, `ring`, `chart-1`…`chart-5`. No second brand accent beyond foreground/background contrast.

The page is normally one continuous canvas. Earn a surface or boundary only when it communicates selection, interaction, or a grouping that spacing cannot express. Prefer spacing, alignment, and typography before borders or boxes.

Do not wrap every section in a card. Avoid nested panels. Keep radii restrained and consistent with `--radius`.

Hard reject decorative gradients, gradient text, glows, blobs, stripes, textures, grid backgrounds, glass, paper simulations, colored side rails, ornamental shadows, and fake depth.

#### Data and evidence

Directory cards are evidence, not decoration:

- GitHub: title, summary, stars, forks, language, tags, outbound repo URL. Star rank sits in `CardAction` at the top-right as a quiet outline `Badge` with the number.
- X: Twitter-like card — avatar, display name, handle, date; summary; media; bottom row of replies / reposts / likes / bookmarks (no view counts). Optional remote `mediaUrls` / `videoUrls` (never commit binary media). Native `<video controls>` for the first mp4; no autoplay.
- Counts and sort keys come from `sourceMeta`. Do not fake precision.

Show units and comparators near the evidence they qualify (★ stars next to the number). Peer cards share type roles, meta positions, and action alignment. A row whose meta wraps while siblings have unused width is a layout failure.

Prefer text labels to icon-only chrome unless an established Phosphor icon makes the action faster to recognize (GitHub mark, sort). Do not place icons in colored tiles.

#### Interaction

Search, zone toggles, and sort are the working tools. They belong in the first viewport. Native controls, visible labels, visible focus, keyboard and screen-reader access. Preserve the query when results are empty; do not silently clear it.

Motion: default to stillness. Add motion only when it explains a state change. Respect `prefers-reduced-motion`. No auto-scrolling marquees, simulated typing, or decorative pulse.

#### Media

X thumbnails use the first remote `sourceMeta.mediaUrls` entry. Tweet videos use the first remote `sourceMeta.videoUrls` mp4 with that thumbnail as `poster`. Never add stock imagery, decorative AI illustrations, abstract shapes, or fake screenshots. Open Graph uses `public/og.png` (1200×630), generated from `scripts/generate-og.ts` + `public/og.svg`. Absolute URL: `https://awesomejev.cc/og.png`.

### Inspect and revise privately

Render the actual result. Inspect the first viewport, full page, and both light and dark. Verify desktop and a narrow mobile width.

Review in this order:

1. **First read:** If the reader saw only the first viewport, would they remember they can search a Jev directory?
2. **Language:** Can a newcomer explain what the page is from the title, count, and first cards? Did simplification avoid broader claims than the source supports?
3. **Composition:** Is there one dominant object (the list)? Is any empty space accidental?
4. **Typography:** Are roles consistent, peer values equal, baselines aligned, and vertical rhythm relational?
5. **Evidence:** Do cards share exact title / summary / meta geometry? Are counts live from data?
6. **Restraint:** Can any surface, border, pill, icon, or section be removed without losing meaning? If yes, remove it.
7. **Themes and reflow:** Light and dark equivalent? No overflow or character-level wrapping on small screens?
8. **Trust and access:** Landmarks, focus, labels, skip link, and outbound links sound?

Keep this work internal. Deliver the implementation, not a score or self-critique.

## Reject generated-design reflexes

Do not ship any of these defaults:

- All-caps or tracked eyebrows, kickers, overlines, and decorative numbered section labels.
- Em dashes in UI chrome.
- Decorative gradients, glows, blobs, stripes, textures, glass, or ornamental shadows.
- Generic centered hero copy followed by a card grid.
- A badge or pill for ordinary metadata that a quiet line of meta would carry.
- Cards nested inside cards, or borders used to repair weak hierarchy.
- Arbitrary icon tiles, oversized icons, or mixed icon styles.
- Tiny muted prose, arbitrary font sizes, inconsistent peer values, or misaligned baselines.
- Visible theme controls, stock imagery, fake screenshots, or decorative third-party brand marks.
- Hardcoded inventory numbers.

Restraint is precise hierarchy, excellent typography, clear evidence, strong alignment, and deliberate tension. It is not merely black, white, thin rules, and large empty margins.

## Accessibility and responsive behavior

Use landmarks, one descriptive `h1`, ordered headings, a skip link, native controls, accessible names, and visible focus. Meet WCAG AA and never rely on color alone. Treat source order as reading order.

Do not conceal page overflow. Give grid and flex children `min-width: 0`; reflow before shrinking. Preserve readable type and control sizes. The page must remain usable in light and dark and across desktop and narrow screens.

The target is judgment, not decoration.
