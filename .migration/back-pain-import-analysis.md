# Import Analysis — Back Pain Condition Page

**Source:** https://patients.stryker.com/us/en/ivs/conditions/back-pain.html
**Date:** 2026-08-06
**Purpose:** Per-section breakdown of which EDS blocks the page maps to — reuse, needs a variant, or must be created — before importing.

---

## 1. Summary

The page is a long condition-education page: a full-width hero, an intro, seven two-column "condition" sections (description | symptoms + related-treatment links), a find-a-doctor form, a tabbed Resources area of brochure cards, and a references/disclaimer list.

After import it would render as: hero banner with the page title → intro heading + paragraph → 7 two-column condition blocks → a "find a doctor" callout → Resources brochure cards → references list. Site chrome (header, footer, cookie SDK, back-to-top, tracking) and the dynamic Marketo form drop out.

**Net-new work:** most sections reuse existing blocks (hero, columns, panel, cards, default content), but two net-new items surfaced on closer inspection:
1. a **panel dark/gradient variant** for the condition sections' left column (`bg-dark-teal-gradient` — the current panel is white only), and
2. a **tabs** block for the Resources section (optional — can be flattened to stacked cards instead).

---

## 2. Existing block inventory (branch: cards-cta)

| Block | Variants available |
|---|---|
| accordion | — |
| cards | `resources` |
| columns | `image-top` |
| footer | — |
| fragment | — |
| header | — |
| hero | `fullbleed` |
| panel | (default), `cta` |
| richtext | — |
| statistics | `cols-2`, `cols-3`, `cols-4` |
| widget | — |

---

## 3. Per-section mapping

| # | Section (source) | Content | Block | Status | Action |
|---|---|---|---|---|---|
| 1 | **Hero** (`fullWidthImageHero` + `hero-space`) | Full-width background image, H1 "Back pain", FIND A DOCTOR CTA | `hero` (`fullbleed`) | ✅ exists | Reuse. Source H1 is transparent-overlaid; imports as a normal visible H1. |
| 2 | **Intro** (`c-largeheadline` / rich text) | "Identifying your condition" H3 + paragraph | default content | ✅ n/a | No block — plain section content. |
| 3 | **Condition sections ×7** (`cols2`, 2-col rows) | **Left col:** a dark-teal gradient box (`has-background bg-dark-teal-gradient`) with H3 title (gold/white, `<sup>` citation) + description paragraphs. **Right col (3 stacked pieces):** (a) a standalone illustration image (`c-standalone-image`); (b) a white **`dimensional-box`** with H4 "Symptoms of…" + `<ul>`; (c) a plain rich-text "Related treatment" label + UPPERCASE link(s). | `columns` (2-col layout) + **`panel` ×2** (dark-teal left, white right) + default content (image, related-treatment link) | ⚠️ mostly exists; needs 1 variant | 2-col layout → `columns` ✅. Right "Symptoms" box → `panel` default (white) ✅. Left box → **`panel` needs a new dark/gradient variant** (current panel is white only). Image → default content. "Related treatment" → default content paragraph + link. |
| 4 | **"Tired of living in pain?"** callout | Sentence + bold link | default content | ✅ n/a | No block — paragraph. |
| 5 | **Find-a-doctor form** (`c-marketo-form`) | Lead-gen form + doctor locator | — | ❌ not migratable | Dynamic third-party form; replace with a CTA/link (or future form block). |
| 6 | **Resources** (`c-tabs`) | H2 "Resources" + tab nav + panels of brochure cards (PDF cover image → PDF, + LEARN MORE button) | `tabs` (new) + `cards` `resources` | ⚠️ create / TBD | Brochure cards → `cards(resources)` ✅. **Tabs container = TBD**: create a `tabs` block, or flatten into stacked `cards(resources)` groups (drops tab UI). |
| 7 | **Disclaimer + references** (`c-disclaimer`) | `*` footnote line + references `<ol>` | default content + global footnotes | ✅ n/a | Superscript citations auto-link via the existing `decorateFootnotes` (scripts.js). |

---

## 4. Blocks to reuse / vary / create

### ✅ Reuse as-is
- **hero** (`fullbleed`) — top banner.
- **cards** (`resources`) — the brochure cards inside Resources.
- **columns** — the 2-column layout of the 7 condition sections.
- **panel** (default, white) — the right-hand **`dimensional-box`** "Symptoms of…" box in each condition section (7 instances). This is the exact source element `panel` was built for.
- **default content** — intro; the condition-section illustration images (`c-standalone-image`) and "Related treatment" links; "Tired of living in pain?" callout; references list.
- **Global footnote decoration** — handles the `<sup>` citations in the condition text and disclaimer (no block, no per-page authoring).

### ⚠️ Reuse but needs a new variant
- **panel — dark-teal gradient variant** — the condition sections' **left column** is a `has-background bg-dark-teal-gradient` box (dark teal gradient bg, white body, gold heading). The panel block exists but only has white default + `cta`; this needs a **new variant** (e.g. `panel gradient` / `panel dark`). Alternatively, render the left column as plain section content with a section-background — decision needed.

### ❌ Must be created (or explicitly skipped)
- **tabs block** — **TBD.** Only needed if the Resources section keeps its tab UI. Alternative: flatten to stacked `cards(resources)` groups (no new block).
- **Marketo form** — cannot migrate (dynamic). Replace with CTA/link.

---

## 5. Import caveats
- **Related-treatment links** (UPPERCASE) are plain `<a>` in the source (inside a `fontsize-1-25em` span), not buttons — they import as text links unless a parser promotes them.
- **Hero H1** is transparent/overlaid on the source; it surfaces as a normal H1 post-import.
- **Standard chrome** (header, footer, OneTrust cookie SDK, back-to-top, tracking pixels) is stripped by the existing `patients-stryker-cleanup` transformer.

---

## 6. Open decisions (drive net-new work)
1. **Panel dark/gradient variant** — the condition sections' left column (`bg-dark-teal-gradient`). Create a new `panel` variant, or render the left column as plain content on a colored section background.
2. **Resources tabs** — create a `tabs` block vs. flatten to stacked cards.

Every other section maps to an existing block as-is (see §3/§4).
