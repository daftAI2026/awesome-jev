# Awesome JEV directory UI

This document owns the directory's product-specific composition and behavior. Apply the stable visual tokens and review rules in [design.md](design.md); do not duplicate them here. The implementation lives in `src/App.tsx` and `src/components/*`.

## Reader and data

The current page helps readers find curated TypeSafe Jev / System One GitHub projects, judge their recorded summary and metadata, and inspect the original repository. It reads [`data/github.json`](../data/github.json). A distinct Jev news view reads [`data/news.json`](../data/news.json); X and YouTube records remain stored but hidden. Keep UI chrome localized in `src/i18n/locales/*` and retain source titles and summaries in their original language.

The opening viewport should reveal identity, searchable inventory, active controls, and the start of results. Keep the result set dominant rather than placing a marketing masthead ahead of the reader's task.

## Page composition

- The full-width sticky header contains the site title and three equal-size icon controls: source-repository link, theme menu, and language menu. Both menus mark the current choice. Theme offers System, Light, and Dark; System follows operating-system changes, and selecting it clears any saved override. An effective color change uses a brief native crossfade where supported, but skips motion when the reader requests reduced motion. The language menu lists English and 简体中文, and both explicit theme and language choices persist across reloads. The header has no routine bottom divider.
- The centered content frame contains a full-width ASCII wordmark, two-line tagline, and data-update time when build history supplies one. Never manufacture a timestamp. The wordmark fits by CSS container width from first paint rather than resizing after hydration.
- On desktop, GitHub use categories occupy a left rail beside the main results. On smaller screens the same navigation opens a left Sheet. All projects, Top 100 by stars, and Jev news are separate shortcuts above the category list; Top 100 uses the global star rank, not the current search or sort order. Counts come from their respective data stores.
- Main controls are an underline search field, Stars / Date / Name sort, and cards / list view. Search is GitHub-only; query and the selected shortcut or category filter the results, sort orders them, and view changes their presentation. The Stars button has no ambiguous inventory count. Preserve the query when no items match.
- The cards view places each consecutive group of cards left-to-right on one reading row, even when card heights differ. It keeps cards at natural height rather than stretching them; preserving strict rank/date order takes priority over filling every short-card gap. Narrow screens use a single column. Once desktop card heights and positions are measured, offscreen card content can be skipped without losing its measured space; the full directory remains in the DOM. The list view is a ranked table-like list of rank, project, and stars, not an activity dashboard.
- The footer ends the directory with a brief source note. Keep the opening and closing of the page connected even when the filtered result set is short.

The news shortcut swaps the main result area, not the header or design system. It has local text search, source attribution, newest-first order, and an incremental “show more” control rather than rendering an unbounded archive at once. News cards link to AIHOT's item page. They do not claim to display the article body or media, because the official API does not expose those fields; see [news.md](news.md) for the source and usage boundary.

## Card ordering algorithm

`CardMasonry` receives items **after** search, filter, and sort. It must not change that sequence. On a desktop-sized grid, the column count comes from the CSS breakpoint (two or three), not from card content. The layout measures each card's natural height, converts it to a four-pixel grid-row span with a 16-pixel gap, and processes consecutive groups of `columns` cards:

1. Place the group's cards in columns 1, 2, 3 from left to right at the **same** grid row. Thus ranks 1–3 occupy the first reading row and ranks 4–6 the second, regardless of description length.
2. Advance the next group's starting row by the **largest** span in the current group. Never fill the shortest column with a later item; doing so makes visual ranks appear as 5, 6, 4.
3. Keep each card at natural height. The unused space below a shorter card is intentional: variable card heights cannot simultaneously have zero gaps and strict row-by-row reading order.

On narrow screens, cards use one-column document flow. The desktop layout records each measured height as an intrinsic-size fallback before enabling offscreen `content-visibility`, so skipped cards keep their space during scrolling and theme changes. Source order, keyboard order, and visual reading order therefore agree.

## Project evidence

GitHub cards show title, summary, source repository / language, recorded stars / forks / issues, and tags when available. Star rank is one quiet badge at the card's top-right. Counts and sort keys come from `sourceMeta`; never substitute invented values. Peer cards keep the same type roles and metadata order even when summaries have unequal lengths.

An ordinary click on a card or list row opens the single shared project preview. The anchor still points to the original GitHub URL for no-script fallback and modified clicks. The preview shows only stored facts: title, repo identifier, summary, category, language, available counts, optional pinned review-source link, and tags. It does not fetch or render a third-party README. Make the summary the main reading block; counts are compact evidence, not a three-column dashboard. Do not repeat the rank badge.

The preview has a dim backdrop and one restrained surface. A narrow dialog scrolls its content without covering it with the header or outbound action. The GitHub action is explicitly labeled. Backdrop click, Escape, and the close control dismiss the preview and return focus to its triggering card or row.

## Boundaries and checks

Only recorded URLs and remote media belong to their sources. Do not invent entries, tweet IDs, screenshots, or claims. Do not add analytics, remote icon kits, or an unrelated visual theme. Keep the full JSON and generated README available for audit without making them the first-read UI.

Verify both view modes, filtering, empty search, modified-click fallback, preview dismissal and focus return, desktop and narrow reflow, and light/dark parity. Check the real rendered page rather than assuming that a build alone validates composition.
