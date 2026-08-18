# Sinusitis Page Migration Plan (`/us/en/ent/sinusitis`)

Migrate `https://patients.stryker.com/us/en/ent/sinusitis.html` to EDS on branch `55-page-sinusitis`, authored at DA path `/us/en/ent/sinusitis`. Tracking: issue #55. Mapping **approved**; open questions **resolved** by the user from the live source.

> **Execution requires Execute mode.** This artifact is the finalized plan; implementation begins once switched out of plan mode. Implement section by section, showing a diff after each (no batching), starting with the `video` block.

## Guiding decisions (validated against the repo)

- **Reuse-first.** One genuinely new block (video, YouTube branch only); everything else is existing blocks/variants or default content.
- **Footnotes/refs** — `decorateFootnotes()` exists in `scripts.js` (confirmed: links every `<sup>` digit to `#fn-N` in the last `<ol>` with ≥ maxRef items). Author `<sup>` markers + a plain 12-item `<ol>`; wiring is free. **Still re-verify on this branch before relying on it (§13 caveat below).**
- **DM images are bare autolinks** (`dm-support.js` renders `/is/image/` → `<picture>`); author as a link whose text = href, alone in a cell. No download/commit/re-host.
- **Accordion contract confirmed** (`accordion.js`): one row per item, cell 1 = question, cell 2 = answer body (nested `<ul>` supported). Strip source `+` glyphs.
- **`<hr>` → `---`** section breaks. **No** header/footer/breadcrumb/side-nav authored (project chrome + nav fragments). ENT sub-nav is navigation, not content.
- **No legacy markup** (`c-rich-text-editor`, inline `style`, `futura-bold`, `fontsize-*`, `#ffb500`). Gold from an existing token; caps authored as literal text, **no** CSS `text-transform`.

## Video block — scope decision: YouTube-only now (user-approved)

Implement `blocks/video` with **YouTube support only** on this branch. **Do NOT** migrate the DM/Scene7 video path (it lives in `dm-support.js`: lazy hls.js `@1.5.17`+SRI, `preferHls`, DASH rejection, `videoTypeFor`, progressive fallback; 4+ live pages depend on it — out of scope, real regression risk).

- [ ] Build `blocks/video/video.js` + `video.css` + `ue/models/blocks/video.json`; add to section filter; `npm run build:json`.
- [ ] **YouTube branch:** click-to-load facade → `youtube-nocookie.com` iframe, `rel=0`, `enablejsapi=1`, `autoplay=1` on click, accessible `title`; 16:9 box reserved up front (zero CLS). Poster `https://i.ytimg.com/vi/aviNNbsEoC4/hqdefault.jpg`, `object-fit: cover` (crop 4:3 → 16:9); red rounded play button. **DOM APIs only** (no `innerHTML`).
- [ ] Detect source type at top and **dispatch**, leaving a clearly-commented seam for the future `/is/content/` DM case — no redesign needed later, no duplication of dm-support logic.
- [ ] Design reference: PR #82 facade (`scripts/youtube-support.js`, branch `50-50-columns-video`). Read issue #98, PR #82, branch `50-50-columns-video` before coding.
- [ ] **Leave `dm-support.js` untouched.** Do **not** add YouTube passes to `scripts.js` (that was #82's approach; #98 supersedes it). Do **not** implement #98's section flex/50-50 layout — but don't fight a flex section later.
- [ ] Video id `aviNNbsEoC4`. PR description: note this is a **partial** #98 (YouTube branch only); DM consolidation remains open/tracked.

## Section-by-section mapping (approved; §1/§2/§12 resolved)

| # | Source section | Chosen block / handling | Status |
|---|---|---|---|
| 1 | H1 "Sinusitis" + H2 stat lede + intro `p` | **Default content** (`h1`/`h2`/`p`) — no hero image on source | Existing |
| 2 | Inline thumbnail (`sinusitis-thumbnail`, 666×392) | **Default-content image** (bare DM link) — inline in flow, NOT `columns-50-50` | Existing |
| 3 | CAUSES (`h2`+`p`+`ul`) | Default content | Existing |
| 4 | SYMPTOMS (`h2`+`p`+8-item `ul`) | Default content | Existing |
| 5 | Hero/body image (`condition-sinusitis-hero`, alt `condition-sinusitis-hero`) + `<hr>` | Default-content image (bare DM link), then `---` | Existing |
| 6 | TREATMENT (`h2`+lead+3 bold-label bullets) + `<hr>` | Default content (`ul` w/ `<strong>` labels), then `---` | Existing |
| 7 | Balloon dilation option (`h2`+Q+`p`+3 bullets) | Default content | Existing |
| 8 | YouTube video + `<hr>` | **`video` block** (new, YouTube branch), then `---` | **New block** |
| 9 | WHAT TO EXPECT (`h2`+`p`+5 bullets) | Default content | Existing |
| 10 | Safety line (link) | Default-content `p` with link | Existing |
| 11 | FAQ (6 Q&A, nested lists, `*` footnote) | **`accordion`** — verbatim answers incl. nested `<ul>`s, `*` footnote in #3 | Existing |
| 12 | CTA "IMPORTANT RISK AND SAFETY INFORMATION…" | **Buttonized link** (`decorateButtons`) — source is a plain standalone link, NOT `panel cta` | Existing |
| 13 | References (12-item `ol`, some ncbi links) | Plain `<ol>` → auto `.footnotes` **(re-verify on branch first)** | Existing |
| 14 | Disclaimer + `ENT-XPR-SYK-624152` + "Last Updated December/2025" | Default content `p`s | Existing |
| 15 | Header/footer/breadcrumb/side-nav | **Not authored** | N/A |
| — | Metadata | `Metadata` table: Title `Sinusitis \| Stryker`; Description from `<head>` (confirm) else intro; OG/image defaults per project | Existing |

## Resolved decisions (from user's live-source inspection)

- **§1** plain default content (no hero band/banner). **§2** inline default image (no columns). **§12** buttonized link (no panel cta).
- **Caps headings** authored as literal uppercase text; gold from existing token; no `text-transform`, no hex.
- **Images** bare DM autolinks: `…/is/image/stryker/sinusitis-thumbnail?$preset_666_392$` and `…/is/image/stryker/condition-sinusitis-hero?$max_width_1440$`.
- **Meta description** — confirm source `<head>` when Bash is available; derive from intro if none.

## Checklist

- [ ] Switch to Execute mode
- [ ] Confirm branch `55-page-sinusitis` checked out and synced with remote
- [ ] **Re-verify `decorateFootnotes()` exists/behaves on this branch**; if not, author references as a plain `<ol>` and say so (do not invent a mechanism)
- [ ] Fetch + read live source; capture verbatim copy, all `<sup>` markers, 12 references, FAQ answers (nested lists + `*` footnote); confirm `<head>` meta description
- [ ] Read issue #98, PR #82, branch `50-50-columns-video` for the facade design reference
- [ ] Build `blocks/video` (YouTube branch + commented DM seam) + `ue/models/blocks/video.json`; add to section filter; `npm run build:json`; leave `dm-support.js` and `scripts.js` untouched
- [ ] Author page at `content/us/en/ent/sinusitis` — section by section, `---` breaks, block tables, bare DM image links, verbatim copy, literal caps
- [ ] Author `Metadata` table (title/description/OG)
- [ ] Verify footnote `<sup>` → References linking on the rendered page
- [ ] `npm run lint:fix` then `npm run lint` → zero errors
- [ ] Diff after each section (no batching)
- [ ] Verify at `https://55-page-sinusitis--patients-stryker--aemdemos.aem.page/us/en/ent/sinusitis`; compare side-by-side with source; report intentional visual deltas
- [ ] PR description: partial #98 (YouTube-only), DM consolidation still open
- [ ] Confirm choices are generic/reusable for sibling ENT pages (rhinitis, ETD, nasal airway obstruction)
