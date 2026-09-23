# Jev news integration

The site keeps GitHub projects as its primary directory. The sidebar's **Jev news** entry reuses the main card area for a separate, source-attributed news view. It does not mix news into `data/github.json`, the generated README, or the GitHub ranking. The news view uses the existing semantic colors, Geist type, card radius, and spacing; it does not import AIHOT styling.

## Source contract and media boundary

The scheduled collector uses [AIHOT REST API v1](https://aihot.news/agent), specifically `/api/v1/items?mode=all&window=7d&by=timeline&q=Jev&limit=100`. This matches the public Jev search's rolling window more closely than `by=published`. The official [OpenAPI schema](https://aihot.news/openapi-v1.json) supplies title, optional summary, source name, AIHOT reading URL, original URL, publication time, and discovery time. It does **not** supply article body, image URLs, video URLs, thumbnails, or an item-detail media API.

News cards therefore display only API-contracted text and metadata. A card opens its AIHOT reading page, where AIHOT may show an image preview or direct the reader to the original post for video playback. We do not scrape AIHOT HTML, hotlink/copy third-party media, or make a local replica of its article detail. No TanStack data-fetching dependency is needed: the page lazy-loads a build-time JSON chunk only after selecting News, then reveals cards in batches of 60. GitHub's initial bundle does not eagerly include the news archive.

## Incremental update and history limit

`mode=all` only exposes a rolling seven-day window; there is no official public endpoint for every historical item. The selected snapshot has older **selected** items, not the entire historical public pool. The first API run can therefore seed only the current window. Later six-hour runs start a fresh query and follow the API's opaque `nextCursor` only **within that run**. A rolling-window cursor is not persisted across days. The AIHOT website search can show older results, but its HTML is neither this collector's stable contract nor a workaround for the source's body/media authorization boundary.

The collector validates the whole response before writing, merges by stable AIHOT ID, skips duplicate original URLs, updates changed known rows, and appends new rows without reordering the existing JSON. An API error, repeated cursor, or pagination safety-limit hit fails the run and leaves the previous file intact. The site sorts saved rows by publication time (discovery time as fallback), while storage remains append-oriented for small Git diffs. Rows older than the first successful sync cannot be reconstructed from `mode=all`; the page must not claim to be an exhaustive historical archive. The API has no exact withdrawal/change feed for `mode=all`, so removal or correction of older rows requires manual review.

The GitHub Action is scheduled for minute 43 every six hours and commits only `data/news.json` when explicitly enabled. No AIHOT key, Jev key, MCP server, or browser scraper is required. Its write job is gated by repository variable `AIHOT_NEWS_ENABLED=true`; without it, scheduled and manual workflows do not publish AIHOT content. A normal build validates `data/news.json` and includes it in the site data-update time when it changes.

## Usage scope

[AIHOT's terms](https://aihot.news/terms) permit qualifying unsponsored, non-commercial open-source/public-interest use without applying, while treating public mirrors and bulk public redistribution separately. This implementation remains a Jev-specific, source-attributed section of an independent directory: it shows API summaries and outbound reading links, not full articles or media, and offers no news API or bulk export. The maintainer has chosen to operate it under the public-interest scope. Reassess before expanding it into a general AIHOT mirror, charging, adding sponsorship, or syndicating its data. The repository variable is a technical on/off switch, not a statement of endorsement or a substitute for any permission that a materially different use might require.
