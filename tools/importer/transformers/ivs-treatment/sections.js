/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ivs-treatment section breaks + Section Metadata.
 *
 * Template-scoped: acts ONLY on the ivs-treatment template (guarded by
 * payload.template.name). Inert for every other template.
 *
 * The mild page (migration-work/cleaned.html) is modelled as 10 sections
 * (tools/importer/page-templates.json → ivs-treatment.sections):
 *
 *   0 hero              .pDiv.bg-shadow                        style: none   (first — no break)
 *   1 get-back-benefits .cols2:has(.dimensional-box)          style: flex
 *   2 what-is-lss       dark teal panel (LSS, no h4)          style: dark
 *   3 proven-results    intro .text + .cols2 stat charts      style: none
 *   4 before-after      dark teal panel (has h4)              style: dark, full-bleed
 *   5 how-it-works      heading .text + .cols3                style: none
 *   6 tired-of-pain     .has-background.bg-gold               style: none  (block-owned gold band)
 *   7 resources         h2 + .cols4                            style: none
 *   8 potential-risks   .has-background.bg-lighter-gray       style: light-gray
 *   9 disclaimer        .c-disclaimer (paras + footnotes ol)  style: compact
 *
 * Mirrors the migrated IVS sibling content/us/en/ivs/treatments/disc-decompression:
 * flex (get-back + benefits), dark (LSS + before/after), gold panel (owns its own
 * band, no section style), light-gray (potential risks), compact (disclaimer).
 *
 * Section-break marker + afterTransform anchoring follows the sa-resources
 * reference pattern: block parsers run between beforeTransform and afterTransform
 * and REPLACE the section elements, so a styled section's metadata is anchored to
 * the marker <hr> inserted in beforeTransform (which survives the parser swap).
 *
 * The mild source ships its own ".sectionseparator > hr" dividers; left in place
 * they'd become extra markdown "---" breaks. We strip ".sectionseparator" up front
 * so our inserted bare <hr> are the single source of section breaks.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

/**
 * Convert a template section style ("dark, full-bleed") into a Section Metadata
 * style cell. decorateSectionMetadata() (scripts.js) splits the cell on COMMAS and
 * toClassName()s each token, so a comma value passes through; a space-separated
 * value would need commas. Styles here are already comma-separated where needed.
 */
function styleToCell(style) {
  return String(style)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
}

export default function transform(hookName, element, payload) {
  // Template-scoped guard. Inert for every non-ivs-treatment template.
  if (!payload || !payload.template || payload.template.name !== 'ivs-treatment') return;

  const sections = payload.template.sections || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    // 1. Remove the source dividers so our inserted breaks are authoritative.
    WebImporter.DOMUtils.remove(element, ['.sectionseparator']);

    // 2. Resolve each section to a distinct element (first UNCLAIMED match in
    //    document order). Each section.selector is a comma-separated list of
    //    candidate selectors — try each until one matches an unclaimed element.
    const claimed = new Set();
    sections.forEach((section) => {
      section._anchor = null;
      const candidates = String(section.selector).split(',').map((s) => s.trim()).filter(Boolean);
      for (const sel of candidates) {
        let matched = false;
        const matches = element.querySelectorAll(sel);
        for (const m of matches) {
          if (!claimed.has(m)) {
            claimed.add(m);
            section._anchor = m;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    });

    // 3. Insert breaks in reverse so an insertion never shifts a not-yet-processed
    //    anchor. A styled break carries the marker attr so afterTransform can find
    //    it after parsers have replaced the underlying section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const anchor = section._anchor;
      if (!anchor) continue; // selector didn't match this page — skip, never guess

      const hr = element.ownerDocument.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      anchor.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Optional single leading spacer section: one empty section tagged Style
    // `spacer, large` (styles/styles.css `main > .section.spacer.large` → a fixed
    // ~60px gap, 2× the base spacer unit). Matches the source's ~60px offset above
    // the hero with a single empty section, not a stack. Prepended as the FIRST
    // section: [Section Metadata: spacer, large] <hr> [hero …]. Gated on
    // template.topSpacer.
    if (payload.template.topSpacer) {
      const doc = element.ownerDocument;
      const hr = doc.createElement('hr');
      const spacerMeta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: 'spacer, large' },
      });
      // Insert the break first, then the metadata before it, so the empty spacer
      // section (metadata only) sits above the break and the hero follows.
      element.prepend(hr);
      element.prepend(spacerMeta);
    }

    // Optional spacer section BELOW the hero: same `spacer, large` (~60px) empty
    // section, placed between the hero and the first content section, to match the
    // reference site's spacing under the hero. Anchored to the section-break <hr>
    // of the section that follows the hero (sections[1]) — its marker <hr> (if the
    // section is styled) or, as a fallback, its resolved selector. Inserted as
    // [<hr>] [Section Metadata: spacer, large] immediately before that break so the
    // spacer becomes its own section between the hero and sections[1]. Gated on
    // template.heroBottomSpacer.
    if (payload.template.heroBottomSpacer && sections.length > 1) {
      const doc = element.ownerDocument;
      const after = sections[1];
      let nextBreak = after.style
        ? element.querySelector(`[${SECTION_MARKER_ATTR}="${after.id}"]`)
        : null;
      if (!nextBreak) {
        const candidates = String(after.selector).split(',').map((s) => s.trim()).filter(Boolean);
        for (const sel of candidates) {
          nextBreak = element.querySelector(sel);
          if (nextBreak) break;
        }
      }
      if (nextBreak) {
        const spacerMeta = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: 'spacer, large' },
        });
        const hr = doc.createElement('hr');
        // Order before the follow-on break: [hr] [spacerMeta] [nextBreak] so the
        // hero closes at [hr], the spacer sits alone, then the next section starts.
        nextBreak.before(spacerMeta);
        spacerMeta.before(hr);
      }
    }

    // Parsers have now replaced the styled section elements. Anchor each styled
    // section's metadata to the marker <hr> placed in beforeTransform.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const candidates = String(section.selector).split(',').map((s) => s.trim()).filter(Boolean);
      let fallback = null;
      for (const sel of candidates) {
        fallback = element.querySelector(sel);
        if (fallback) break;
      }
      const anchor = marker || fallback;
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
        name: 'Section Metadata',
        cells: { style: styleToCell(section.style) },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // unstyled section 0 never gets a leading break
      }
    }
  }
}
