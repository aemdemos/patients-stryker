# Product-detail import (www.stryker.com, 677 pages) — status 2026-10-30

All 677 pages and the 332 XFs they use are imported into the local preview (pages under
`/drafts/reimport/…`, fragments under `/us/en/fragments/…`); nothing is in Document
Authoring yet. The raw import output with the real paths (`/us/en/…`, ready to upload) is in
`.migration/plans/pilot-tools/out/pd-full/content` (git-ignored). Runs:
`.migration/plans/pilot-tools/full-import.sh product-detail <list> <run>` (resumable).

## Checks
- coverage 1,002 of 1,009 documents; the 7 others have their text, only spaced or typed
  differently in the source (e.g. "themore", "versatility ,")
- no `.html` / `/index` links; no product page exists in DA yet; 6 of the 332 fragments do
  (compare them with DA before uploading)
- 221 images without alt text on 214 pages: `product-detail-missing-alt.md`

## Fixes found on the full run (pages re-imported)
- the template's columns under the hero (`#product-detail-container`): rich text was lost
  (74 pages); now walked as a two-column control; its parts without an AEM wrapper are
  mapped: short description (rich text), Contact button (button), secondary CTA (bold +
  underline link), tag crumb (Related Categories)
- `#marketo-form` buttons removed by the shared cleanup as Marketo beacons (Vocera pages)
- product subtitle h2 1.25em in the image-right hero; default-size text in sections that
  take a larger copy size (Related categories links); `<div>` lines; control characters
- Related Categories (approved 2026-10-30): `blocks/related-categories` reads the page's
  `tags` metadata (article:tag metas) and the tag list sheet `/us/en/tags` (Tag | Label |
  Link, 183 tags: `tools/importer/data/catalog/tag-list.json`, built by
  `pilot-tools/build-tag-list.py` from the exports and the live boxes). 304 pages; the live
  boxes are reproduced exactly on 268 of 308, 38 differ only in order (the block follows the
  page's tag order), 2 in their items; 4 boxes are hidden on live and left out

## To do before / when uploading
- the tag list sheet to DA (`/us/en/tags`), with the pages
- Block Library entry for Related Categories
- report notes still open: 28 pages with a 2-column responsive-grid row stacked (no Columns
  variant), 22 promo tiles whose modal content is not imported
