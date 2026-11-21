# Authoring rules inventory: what remains with readable settings (2026-11-05)

What an author or developer still has to know to author and maintain www.stryker.com pages if the readable-settings model is adopted. Counts are from the imported corp content (1,394 documents: pages and fragments, drafts excluded; `.cbr/local-scripts/convention-usage.py`). Sketch and prototype: `.migration/authoring-sketch-lifepak-15.md`.

## Summary

| Layer | What it is | Size | Visible to authors as | Status |
|---|---|---|---|---|
| 1. Blocks | Standard EDS blocks with a content contract | about 20 blocks | block tables | normal EDS |
| 2. Names | Section styles and block variants (what a thing *is*) | ~57 section-style families, ~40 variant names | `Style` row, `Block (variant)` | normal EDS; most corp ones missing from the Block Library |
| 3. Settings | Measured AEM values as readable rows | 10 rows + `Box:` lines | Section Metadata rows | prototype, replaces ~660 distinct numeric classes |
| 4. Text styles | Inline styles by name or value | 21 names + `N×` / `Nvw` values | `[[Gold,1.75×]…]` | prototype, replaces the size/colour bracket classes |
| 5. **Implicit conventions** | Formatting or structure that triggers styling or behaviour, **without a name** | **27 rules** (below) | nothing: the author has to know them | this is what remains to be decided |
| 6. Page behaviour | Code no author touches | 6 | — | fine |

Layers 1–4 are explicit: the name or row says what happens. Layer 5 is the "JS-based conventions" the maintainers fear; it is a short, countable list.

## Layer 5: implicit conventions (the remaining rules)

### A. Formatting → styling (author formats text, code styles it)

| # | Authored | Becomes | Uses / docs | Where | Shared with patients |
|---|---|---|---|---|---|
| A1 | Link alone on its line, **bold** | primary button | 645 / 375 | `scripts.js` decorateButtons | yes |
| A2 | Link alone, *italic* | secondary button | 5 / 1 | same | yes |
| A3 | Link alone, ***bold + italic*** | accent button | 222 / 180 | same | yes |
| A4 | Link, **bold + underline** | flat CTA with ► arrow | 1,466 / 392 | same + `styles-corp.css` | yes (arrow corp only) |
| A5 | A bold link inside a sentence | stays an inline link | 1 / 1 | same | yes — **broken on both sites**: renders as a button (the `link-inline` class it sets has no style) |
| A6 | Heading fully underlined | heading with a rule under it (gold with `[[Rule-gold]]`) | 579 / 305 | `scripts.js` decorateUnderlinedHeadings + corp CSS | yes (rule look corp) |
| A7 | Paragraph fully bold, in Columns | caption under an image / label with a blank line above | 228 / 86 | `columns.js` `.columns-bold` + `columns-corp.css` | no |
| A8 | Paragraph fully italic, in `large-headline` Columns | small grey venue line | 30 / 28 | `columns-corp.css` | no — **fragile**: a paragraph with just one italic phrase in it turns grey too (`em:only-child` ignores the text around it) |
| A9 | Bold paragraph alone in a `label-*` section | label size | (in the `label-*` sections) | `styles-corp.css` | no |
| A10 | Bold in a `bold-body` section | keeps the body font instead of Futura | 166 sections | `styles-corp.css` | no |
| A11 | Underlined link in a `contact-aside` section; image link alone there | arrow link; icon-size image | 26 sections | `styles-corp.css` | no |
| A12 | `<strong>` vs `<b>` | Futura bold vs running-font bold | `<b>`: 0 in content | `styles-corp.css` | no — **dead in content** (DA writes `<strong>`) |
| A13 | Heading 2 with bold + italic words, in Columns | gold display heading | 0 found | `columns-corp.css` | no — **unused** (the rule still works) |
| A14 | A paragraph containing code | navy callout box, white text; small print in a `disclaimer` section | 0 on corp pages | `styles.css` + `styles-corp.css` | yes (a patients rule) |

### B. Smart links (a link's address triggers behaviour)

| # | Authored | Becomes | Uses / docs | Where |
|---|---|---|---|---|
| B1 | URL ending `#_blank` | opens in a new tab | 2,321 / 547 | `scripts.js` decorateLinkTargets (shared) |
| B2 | Link to a `/modals/` document | opens a modal; an image linked alone = modal tile with arrow | 40 / 40 | `corp.js` |
| B3 | Link alone to `google.com/maps?q=` | embedded map | 1 / 1 | `map-embed.js` |
| B4 | **Any** link to a `/fragments/` document (not a modal, not inside a Fragment, Tabs or Hero block) | its paragraph is replaced by the fragment | 946 / 385 | `scripts.js` buildAutoBlocks (shared) |
| B5 | Dynamic Media link (media-assets / scene7) | image or video, lifted out of the paragraph when alone | 4,522 / 1,213 | `dm-support.js` (shared) |
| B6 | `/widgets/` link | widget block | — | `scripts.js` (shared) |
| B7 | A link whose **title** is a Dynamic Media image address | the image, as the link (modal tiles, icon links) | 267 / 140 | `dm-support.js` (shared) — **hidden**: the title is invisible in the editor |

### C. Footnotes

| # | Authored | Becomes | Uses / docs | Where |
|---|---|---|---|---|
| C1 | Superscript number(s) `1`, `1,2`, `1-4` | link to the matching reference | 1,441 / 363 | `scripts.js` decorateFootnotes (shared) |
| C2 | Symbol `*` `†` `‡` `§` + definitions in a `compact` section | link to the definition | 24 / 14 | `scripts.js` decorateSymbolFootnotes (shared) |

### D. Structure (a section style changes how the content inside is read)

| # | Section style | Content rule | Uses | Where |
|---|---|---|---|---|
| D1 | `accordion-panel` | the heading at the top is the panel label; consecutive sections are one accordion | 239 | `corp.js` |
| D2 | `tabbed` | the deepest heading level are tab titles, the content after each its panel | 136 | `scripts.js` (shared) |
| D3 | `carousel` | consecutive hero sections are one carousel; the first holds the options (autoplay, fade, banner) | 36 | `corp-carousel.js` |
| D4 | `continued` | stacks flush with the section before (one source box split in two) | 365 | `styles-corp.css` |

These have names, so they are not hidden — but the *content rule inside* (which heading becomes what) is a convention.

## Layer 6: page behaviour (nothing to author)

Back-to-top button, home JSON-LD, last-modified line, hero image prefetch, HCP banner (from metadata), loading of leading empty sections. All in `corp.js`.

## What this suggests

1. **A1–A6, B1, B4–B6, C1–C2 are shared with the patients site** and already documented for authors on the DA authoring-conventions page (A1–A6). They are the site's existing language; keep them, document the corp differences (the ► arrow, the gold rule).
2. **A7–A11 are corp-only formatting tricks inside blocks or sections.** These are the hidden ones. Each could become an explicit name: a text style (`[[Caption]]`, `[[Venue]]`), or part of an existing variant's documented contract (Columns: "a bold paragraph under an image is its caption"). Five rules, ~450 uses.
3. **A12 is dead** in the imported content and **A13 unused**: remove them (with a blast-radius check) or confirm where they are still needed. **A5 needs a fix** (shared), **A8 a safer selector**.
4. **B2–B3 and D1–D4 are documented behaviours**, fine as long as the Block Library describes them (D1–D4 are section styles: their library entries should state the content rule).

So after the settings and text styles, the remaining rule set is: the shared conventions authors already have (13 with A14), five corp formatting tricks to make explicit, one more hidden shared rule (B7, the image in a link title), one dead rule (A12) and one unused one (A13), and six named behaviours to document.

## Found while building the examples page (2026-11-05)

Demo page: `content/drafts/style-settings/authoring-rules` (local draft, every rule with a live example).

- **A5 is broken on both sites**: a bold link in a sentence renders as a button.
- **A8 is fragile**: one italic phrase in a large-headline Columns paragraph turns the whole paragraph grey.
- **A14** (code → navy callout) and **B7** (image from the link title) were missing from the first inventory.
- **B4 is broader** than "a link whose text is the path": any fragment link is replaced.
- **A13 still works**; it is unused, not dead.
- The social-icons fragment (a Columns `media-pair` of image links) collapses to nothing outside a form column: the SpineJack 9px-icon finding, reproduced.
- Prototype fix: size values in brackets inside code samples were rewritten; code is now left alone.
- **Section backgrounds don't apply inside fragments, tabs or accordion panels**: `light-gray`, `bg-gold`, `bg-purple` and the gradients are styled as `main > .section.<style>` only. Checked 2026-11-05: **not** the cause of finding A in `.migration/visual-review-5-pages.md` (those boxes are not in fragments; the causes are in the import, see that file). Still a real limit for coloured sections inside fragments, tabs and accordion panels.
- **Box lines / `[[spacing]]` boxes in default content** become a `div.corp-spacing-box` that page decoration then treats as a block and tries to load (`blocks/corp-spacing-box` 404, console error). The box still renders; affects every page with spacing boxes in default content.
- The examples page now has a documentation block, `Authoring example`: the example document rendered as a page (left, in a frame) next to the same document as the DA editor shows it (right). Example documents: `content/drafts/style-settings/rules/`.
