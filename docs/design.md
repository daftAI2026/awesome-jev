<!--
[INPUT]: 现有语义主题、组件原语与已验收交互
[OUTPUT]: 页面、分享图、工作台、Agents 页脚与 MCP 接入的视觉契约
[POS]: docs 的视觉权威；实现 token 仍归 src/index.css
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Awesome JEV visual system

This is the stable visual contract for [awesomejev.cc](https://awesomejev.cc). It adapts the visual judgment in [Vercel's design guidance](https://vercel.com/design.md) to our product without importing Vercel branding, report components, or `vbg-*` CSS. Directory-specific layout and behavior belong in [directory-ui.md](directory-ui.md).

The implementation authority is [`src/index.css`](../src/index.css), Tailwind CSS 4, and the installed shadcn base-nova primitives. This document explains how to use those tokens; it does not create a second token system. When a documented value and rendered CSS disagree, fix the discrepancy rather than treating prose as a substitute for code.

## Priorities

1. Preserve source facts and the reader's task. Clarity and evidence matter more than novelty.
2. Preserve the existing React, Tailwind, shadcn, Geist, and Phosphor foundation.
3. Establish hierarchy through type, alignment, and space before adding color or surfaces.
4. Make light, dark, desktop, and narrow layouts equally usable.

The result should feel calm, precise, technically literate, and restrained. Do not manufacture confidence with decoration or exaggerated claims.

## Tokens and shape

Use semantic CSS variables from `src/index.css`, not raw color values in components. `background` / `foreground` own the canvas and text; `muted` / `muted-foreground` subordinate information; `border` boundaries; `card` and `popover` interactive surfaces; `primary` actions; `ring` focus. The existing `.dark` and system-dark rules own theme switching. Add no parallel brand palette or Vercel stylesheet.

Spacing uses Tailwind's 4px unit. Prefer these scale values over arbitrary pixel literals:

| Tailwind step | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pixels | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 |

- Within one content group, start near 8–16px; separate larger groups with 24–32px. Increase distance only when the information relationship earns it.
- Give each gap one owner: a stack, grid, or section, not competing margins on every child.
- Align repeated peers to common edges, baselines, type roles, and value positions. Reflow uneven content instead of leaving accidental empty rectangles.
- Keep prose at a comfortable line length and size. Do not shrink text to preserve a grid.

The site's standard surface radii follow the two-step geometry in [Vercel's published foundation](https://vercel.com/geist/vercel-brand.css): **6px for compact controls, 8px for cards and dialogs**. In our Tailwind theme, `rounded-sm` / `rounded-md` map to 6px and `rounded-lg` / `rounded-xl` map to 8px. Fully rounded tags or avatars are a deliberate semantic exception, not another card radius. Avoid one-off values such as 10px.

## Type and hierarchy

Use Geist Sans for prose, headings, labels, controls, and numbers. Reserve Geist Mono for code, commands, paths, raw tokens, and short identifiers; do not set a whole sentence in Mono because it contains one identifier. Use tabular numerals where values are compared or aligned.

Use existing Tailwind type steps and a small weight range. Equivalent items share size, line-height, and weight; a longer title does not receive a smaller font. A heading sits close to the text it introduces. A source or caption sits close to the evidence it qualifies. Between distinct sections, use a visibly larger but still measured gap. Prefer sentence-case labels and concrete actions over decorative overlines or generic praise.

## Canvas, evidence, and motion

One continuous canvas is the default. A card, border, or contrasting surface must explain selection, interaction, warning, or a real grouping that space cannot communicate. Avoid cards inside cards and ornamental shadows. Use color sparingly, only for meaning, and never as the sole state cue.

Show source-backed values, their units, and necessary qualifiers together. Do not invent precision or encode ranking with decorative graphics. If peers cannot share one honest visual scale, use aligned text instead. Prefer direct labels over legends and icon-only controls.

UI primitives use Tailwind’s standard `transition`, not `transition-all`: inherited `visibility` is a rendering gate, not an interaction animation. Keep existing color, focus-ring, opacity and press translation feedback.

Default to stillness. Motion is justified only when it explains a state change, and it must respect `prefers-reduced-motion`. Reject decorative gradients, glows, blobs, textures, glass, fake depth, stock illustrations, and arbitrary third-party marks.

Project and news previews share `PreviewDialogFrame`. The full project card, ranking row and news card mark `data-preview-origin`; the actual clicked anchor remains the focus-return target. Measure the marked source's center and fit scale on entry, then animate to the existing centered popup. On exit, measure the same source element again, so scrolling or resizing does not send the preview to a stale point. Use the popup's untransformed CSS center and layout dimensions, not its in-flight bounding box. `src/lib/preview-motion.ts` owns only this geometry; Motion's official memoized `arc()` (`strength: 0.25`) owns the curved path, with a 240ms eased transition and uniform scale rather than stretched text, rotation or bounce. There is no fixed-offset origin. Missing, disconnected, zero-size or fully offscreen sources fade at the centered position instead of flying toward a fictional target.

The backdrop fades without spatial motion. Base UI's official Motion composition (`AnimatePresence`, `Portal keepMounted`, `Popup render`) preserves the exit subtree even when route-owned news data becomes null. The popup uses Motion's `useAnimationControls`/`usePresence`: synchronously `set()` the measured entry transform before `start()`, then remeasure on requested removal and signal `safeToRemove()` after the flight. This survives the router's Activity effect reconnection without consuming the source keyframe. The installed `useAnimate` DOM implementation ignores `path`; use the motion-component controls path rather than copying arc interpolation or upgrading unrelated dependencies. During presence retention, explicitly keep Popup/Backdrop `hidden={false}`: Base UI's automatic close detection cannot hide a JS-driven flight early, including history-driven controlled closes. `actionsRef.unmount()` after all exits releases the retained lifecycle. Reduced-motion readers get zero translation/scale and zero-duration transitions. Keep existing focus restoration, scroll lock, dismissal and masked history. Side navigation and standalone pages do not gain this animation.

Subscribe to the native reduced-motion media query through React's `useSyncExternalStore`, so a preference change takes effect without reloading. The installed Motion 13.4.2 `useReducedMotion()` retains its initial value despite the documentation's reactive promise; do not rely on it for this live preference contract. The server snapshot is conservatively reduced motion; closed portals do not emit preview content into SSR HTML.

Read the latest `safeToRemove()` through React's `useEffectEvent` when the flight finishes. Presence completion callbacks can change identity during parent rerenders; they are not animation inputs and must not restart an in-progress exit or extend its duration. The flight effect responds to presence and motion preference changes, while cleanup stops interrupted flights and prevents obsolete completions from removing a reopened preview.

Reopening during an exit continues from the in-flight transform without snapping, but captures the newly selected card as the next return target. Capture source identity only while present: an exit must not replace its source with a focus fallback. When the actual trigger is disconnected or has no layout boxes, return `#main` as Base UI's focus recovery container rather than a vanished card. Base UI selects its first tabbable child, or the container itself when no tabbable child exists; ordinary closes still return focus to the clicked anchor.

## Review before shipping

Render the actual page, not only component previews. Inspect the first viewport and full page in light and dark, on desktop and narrow mobile. Check hierarchy, data fidelity, alignment, readable wrapping, focus visibility, keyboard use, and outbound links. Preserve semantic landmarks, one descriptive `h1`, source order, accessible names, and a skip link. Reflow before hiding overflow or shrinking controls; meet WCAG AA.

The test is whether a reader can identify the task, scan the evidence, and act without noticing the styling machinery.

## Not-found pages

Unknown addresses, missing catalog projects, and missing news IDs share `src/components/NotFoundPage.tsx`. Keep the real HTTP 404 response: do not redirect to a successful homepage or create a synthetic catalog entry. Error pages use `noindex` and have no canonical URL.

Use the same continuous canvas, Geist Sans, semantic theme tokens, 56px site header, and existing theme/language menus. A left-aligned 404 status is the visual anchor; one descriptive heading and source-specific explanation follow. Show only the requested pathname in Geist Mono, never the query string or hash. Long paths wrap rather than widening the viewport.

One primary link returns to the current language's project directory. A separated, quiet navigation group offers Top 100 and Jev news. Preserve keyboard focus, a skip link, and English/Chinese/Japanese route variants. Keep status, explanation and recovery actions together. Desktop places one Jev decision-sorter figure beside them inside the existing 1160px frame. Narrow screens put the figure after recovery actions. This requested explanatory SVG is the only illustration exception: four neutral surface tones use existing semantic tokens, with one lit context card and no new palette, decorative frame or entrance animation. The figure leads with its heading and explanation, crops unused SVG canvas without changing geometry, and places the static routing example below a quiet divider. At desktop widths both columns use the same three-row subgrid: recovery spans the first two rows; the figure separates explanation and machine; both dividers occupy the third row with the same 32px top margin. Divider alignment must survive translated copy without pixel offsets. It has no separate control toolbar. Its caption distinguishes local examples from live inference. See [jev-figure.md](jev-figure.md) for the model, parts and motion contract.

The synchronous theme bootstrap may add a theme class to `<html>` before hydration. Suppress hydration attribute warnings only on that document element; do not suppress mismatches across error-page content or move theme selection after first paint.

## Share images and unified workbench

Share images use the white canvas, black/grayscale foreground, ASCII wordmark, Geist Sans body and Geist Mono project identity. PNGs are 1200 × 630. The full-site image shows the current complete GitHub count; project images show the actual project title, canonical owner/repository and bounded author summary. Every image carries a readable `awesomejev.cc` footer. This image palette is independent of the workbench/page theme. No illustrations, gradients, third-party marks, fabricated stats or per-project visual themes. Wrap long names without shrinking the title; only image summaries are bounded, while HTML metadata retains its text. A complete fixed-weight (400) Noto CJK Static Asset is an on-demand renderer fallback, not a new UI font.

`/{locale?}/og-workbench` remains the single development-only tool route. A 192px desktop side rail selects OG, SEO or page preview; below `lg` the existing Base UI Sheet opens the same navigation. Header, theme/language controls, semantic Tailwind tokens, Geist, 6px control and 8px surface radii are shared, with no new palette, shadows or entrance animation. The title is Workbench rather than a second product identity.

Target selection precedes tools. OG preserves two aligned site/project PNG panels and explicit HTML/PNG inspection. SEO uses readable status/value rows and distinguishes failures, manual review and expected exclusions, not a decorative score or invented chart. Page preview uses actual same-origin pages at 390px/1280px with horizontal overflow when necessary and adjacent change-location notes; source page UI stays authoritative. Focusable controls and three language variants are required. OG and this iteration's SEO/preview do not inspect news.

All tools stay outside prerender enumeration and sitemap. Production GET/HEAD, including tool/query variants, return 404 before catalog access. Public OG image endpoints remain accessible.

## Agents footer

Keep the community-directory notice. Copy the Agents region from the live [OpenFree Footer](https://openfree.tools/), not the intermediate Billflare adaptation. Change only site-specific document links, name and public question. Retain the project’s Geist and semantic theme tokens.

Match the source layout: 40px top spacing, 28px border-to-heading padding, 14px heading/document/explanation text, 12px heading-to-links spacing, document gaps of 24px horizontally and 12px vertically. The chat row has 28px vertical padding and 20px between explanation and buttons. Below `sm`, stack the explanation and the complete button row; above it, place text left and buttons right. Five buttons stay in one row, with 36px squares, 6px corners, 8px gaps and 20px contained icons. Preserve ChatGPT, Claude, Perplexity, Gemini, Grok in that order and the source provider endpoints.

Use the actual source SVGs, including the four-color Gemini star and Grok app mark. OpenAI/Grok invert in dark mode, matching the source. Do not append Google AI Mode to the Gemini button label, and do not add a disclaimer paragraph. Safe new-window links and keyboard focus remain. Source provenance and machine-document boundaries belong in [agents.md](agents.md).

## Directory pagination

Retain card heights, masonry/list layouts, Geist and the existing neutral theme. Use the shadcn base-nova Pagination composition with our Base UI Button and Phosphor carets. Place bounded controls only below each result section, with a centered 12px tabular result range. Use existing outline active-page and ghost inactive-page variants, visible focus, and disabled boundary controls. At narrow widths, keep the complete row on one line and hide only Previous/Next visible text; localized accessible names remain. Do not add scrolling animations, page-size menus or another table/data-fetching framework.

## MCP setup page

`/mcp`, `/zh/mcp` and `/ja/mcp` share `McpPage`. Use the existing 56px header, theme/language menus, Geist and one continuous semantic-theme canvas. Keep the reading column within `max-w-3xl`. The address and client configuration are the visual anchors; tools and data boundaries remain plain text separated by space or a quiet divider.

Use the shared shadcn base-nova `Tabs`, `TabsList`, `TabsTrigger` and `TabsContent`. Keep this order: Claude / Claude Code, ChatGPT / Codex, Cursor / VS Code, Gemini CLI / Hermes, then generic Streamable HTTP. Keep one row at every viewport. A width-constrained outer element owns native horizontal scrolling; tabs never wrap or shrink. The generic protocol stays in the same strip after a quiet separator. Align every 16px icon and label to the left. Explain in one localized sentence below the section title that chat apps and coding tools have different setup flows, even when they share a brand.

Base UI owns arrow-key navigation and tab-to-panel association. Activate on focus; Arrow keys and Home/End keep the focused tab in view through instant nearest-edge scrolling. No carousel controls or scroll animation is required. Use the existing semantic muted surface and background selection, with 8px group and 6px control radii, no shadow and a minimum 40px trigger. Each panel shows three steps, one copyable native configuration and the client's official documentation. Distinguish Gemini CLI from the Gemini website. ChatGPT's setup names its current Plugins flow and preserves account/workspace access limits.

Only Claude, Cursor and VS Code expose documented prefilled add-server links. Keep their fixed public URL payloads in `mcp-config`. Label the action Add in the client, not completed one-click installation. Tell the user to review and confirm in that client. Preserve copy/manual setup. ChatGPT has no invented listing link: a personal custom connection does not mean public publication. Codex keeps its native CLI command and requires no plugin wrapper.

Pair client names with 16px local monochrome marks, without changing the colored footer assets. Claude / Claude Code use Anthropic's official Slate/Ivory manufacturer symbols; ChatGPT / Codex reuse the OpenAI manufacturer mark. Do not present manufacturer marks as client-exclusive logos. Cursor and Gemini CLI use official light/dark monochrome pairs. VS Code uses Microsoft's original currentColor Codicons glyph, not a recolored blue product logo. OpenAI and Codicons use dark-theme inversion only on their already monochrome original files. Hermes uses its official desktop mono PNG. Do not apply grayscale or brightness filters to colored brand assets. Generic Streamable HTTP uses Phosphor's Globe. Decorative images have empty alternative text because the adjacent name identifies the tab. Keep client commands and asset references in `mcp-config`; load no external image URL or new icon library. Source records belong in `public/agent-logos/README.md`. No account dashboard, credits, API-key form or invented one-click install link belongs on this public read-only page.

Use the existing `Button` for copy actions. Announce copy success through a live status. Clipboard failure leaves selectable text and a manual-copy instruction. Switching clients resets its configuration's copy state. Wrap long addresses and code; constrain horizontal overflow to the tab strip, never the whole page. Preserve the skip link, one descriptive heading, source order, visible keyboard focus and existing footer entry. Add the same-language MCP link directly after Saved in the directory's upper navigation group, on desktop and in the mobile sheet; this link is not a catalog filter. Do not change the footer for this navigation addition.

No decorative motion is added. Existing button press and focus feedback remain. Explain snapshot freshness, query transmission, read-only tools and client-side costs beside the `/mcp.md` link. Do not present the Markdown document as a required Skill or promise support on every client plan.
