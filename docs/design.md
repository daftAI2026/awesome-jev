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

Default to stillness. Motion is justified only when it explains a state change, and it must respect `prefers-reduced-motion`. Reject decorative gradients, glows, blobs, textures, glass, fake depth, stock illustrations, and arbitrary third-party marks.

## Review before shipping

Render the actual page, not only component previews. Inspect the first viewport and full page in light and dark, on desktop and narrow mobile. Check hierarchy, data fidelity, alignment, readable wrapping, focus visibility, keyboard use, and outbound links. Preserve semantic landmarks, one descriptive `h1`, source order, accessible names, and a skip link. Reflow before hiding overflow or shrinking controls; meet WCAG AA.

The test is whether a reader can identify the task, scan the evidence, and act without noticing the styling machinery.
