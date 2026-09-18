# Import Pipeline for the `procedure-detail` Template

**Goal:** Build the import infrastructure (page-template entry + block parsers + transformer + import script) that imports the representative IVS treatment page `balloon-kyphoplasty.html`, structured so it can later cover the other IVS treatment pages.

**Decisions locked in:**
- **Template name:** `procedure-detail`. All non-shared importer files live in a `procedure-detail/` folder. The existing runtime template folder `templates/treatment-detail/` (verified against this page), its `page.json` dropdown option, and its body-class hook get **renamed to `procedure-detail`**; the draft's `template: treatment-detail` becomes `procedure-detail`.
- **URL scope:** `balloon-kyphoplasty.html` only for now.

## Source Zones → EDS Block Mapping

Top-to-bottom (global header nav + global footer stripped on import; rendered by existing `header`/`footer` blocks):

1. **Hero / title** → **`hero` block, `hero-banner` variant** — desktop image + mobile image + `<h1>` title + "Find a doctor" link.
2. **Intro hook + Benefits** → **`flex`-class section**: default-content text on the **left** (intro `h3` + lead paragraph + benefits `h3` + bullet `<ul>` + "Potential risks"/"Talk to your doctor" links) and a **`panel` block (`cta` variant)** on the **right**.
3. **Clinical-evidence callout** → **`panel` block (`dark`, `wide` variants)** alone in its section, with the rest of the section's background set to the same dark-gray color.
4. **"How it works" (3 steps)** → default-content `h3` heading + **`cards` block** (3 cards: step image + `h4` before/during/after + paragraph).
5. **Mid-page CTA** → **`panel` block (`gold` variant)** — "*Tired of living in pain? Let's find a doctor who can help.*".
6. **Resources** → default-content `h2` "Resources" heading + **`cards` block (`resources` variant)**, 2 cards (brochure cover image + "LEARN MORE" link, EN + ES).
7. **Potential risks + references** → **default content** inside a section tagged `Style: compact` — `h4` + warning paragraphs + trademark/reference citations, small print.
8. **Header / footer** → auto (existing `header`/`footer` blocks) — stripped on import.

Block variants used: `hero` (`hero-banner`), `panel` (`cta`, `dark wide`, `gold`), `cards`, `cards resources`. To confirm during build: that `hero-banner`, `panel cta`, and `panel dark`/`wide` variants exist in `blocks/` + UE models; add any missing variant code only if needed.

## Deliverables

1. **`tools/importer/page-templates.json`** — add a `procedure-detail` template entry: representative + sole URL = `balloon-kyphoplasty.html`, description, and `blocks[]` with DOM selectors for zones 1-7.
2. **`tools/importer/parsers/procedure-detail/*.js`** — block parsers (`hero.js`, `panel-cta.js`, `panel-dark.js`, `panel-gold.js`, `cards.js`, `cards-resources.js`) plus the zone-2 `flex` section split; default-content zone 7 needs no parser.
3. **`tools/importer/transformers/procedure-detail/*.js`** — procedure-detail-specific cleanup + section splitting (`flex`, `compact`, dark-gray band) + Dynamic Media/Scene7 image handling. Shared, site-wide cleanup (`patients-stryker-cleanup.js`) is reused as-is, not duplicated.
4. **`tools/importer/import-procedure-detail.js`** + bundled `.bundle.js` — wires shared + procedure-detail transformers and parsers, embeds `PAGE_TEMPLATE`, stamps `template: procedure-detail` into the Metadata block, emits sanitized paths (modeled on `import-legal-page.js`).
5. **Runtime template rename** — `templates/treatment-detail/` → `templates/procedure-detail/` (`.js` + `.css` + body-class hook), plus update the `page.json` template option and the `content/drafts/treatment-template.plain.html` `template` value to `procedure-detail`.

## Process

- Refresh the stale `migration-work/` artifacts (currently a *resources* page) via page analysis on balloon-kyphoplasty to confirm section/block selectors and the panel variants above.
- Generate + validate parsers and the procedure-detail transformer.
- Assemble and bundle the import script.
- Execute import for **balloon-kyphoplasty only**; verify output in local preview against source.
- Report results.

## Checklist

- [ ] Refresh `migration-work/` artifacts via page analysis on balloon-kyphoplasty
- [ ] Confirm/create block variants: hero `hero-banner`; panel `cta`, `dark`, `wide`, `gold`
- [ ] Rename runtime template `treatment-detail` → `procedure-detail` (folder, `.js`, `.css`, body-class hook)
- [ ] Update `page.json` template option and draft `template` value to `procedure-detail`
- [ ] Add `procedure-detail` entry to `tools/importer/page-templates.json` (balloon-kyphoplasty URL + block selectors)
- [ ] Write/validate parsers in `tools/importer/parsers/procedure-detail/`: `hero`, `panel-cta`, `panel-dark`, `panel-gold`, `cards`, `cards-resources`, + zone-2 `flex` split
- [ ] Create `tools/importer/transformers/procedure-detail/` cleanup (sections, dark-gray band, DM images); reuse shared `patients-stryker-cleanup.js`
- [ ] Create `import-procedure-detail.js` and bundle it
- [ ] Execute import for balloon-kyphoplasty only; verify in preview vs source
- [ ] `npm run lint` passes clean
- [ ] Report results

_Execution requires Execute mode — I'll begin as soon as the mode is switched._
