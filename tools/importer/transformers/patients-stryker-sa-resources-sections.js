/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: sa-resources section breaks + Section Metadata.
 *
 * Template-scoped: acts ONLY on the sa-resources template (guarded by
 * payload.template.name). The legal-page template has no sections, so this
 * transformer is naturally inert there — the guard makes that explicit and also
 * keeps it a no-op during the PostToolUse hook, which always validates against
 * the first template (legal-page) regardless of the URL/DOM snapshot used.
 *
 * The sa-resources page (migration-work/cleaned.html) is modelled as 6 sections
 * (see tools/importer/page-templates.json → sa-resources.sections):
 *
 *   0 hero          .carouselslidegroup          style: none   (first — no break)
 *   1 intro         .cols2 .colctrl              style: flex compact
 *   2 downloads     .cols4                        style: none
 *   3 social        .cols4                        style: none   (2nd .cols4)
 *   4 related-links .bg-light-gray .cols3        style: light-gray
 *   5 disclaimer    .c-disclaimer                 style: compact (1st .c-disclaimer)
 *
 * Expected output: 5 section-break <hr> (one before every non-first section) and
 * 3 Section Metadata blocks (intro / related-links / disclaimer).
 *
 * Two source complications handled here, both verified against cleaned.html:
 *  1. Ambiguous selectors — ".cols4" matches both downloads (L296) and social
 *     (L501); ".c-disclaimer" matches L880 (authorable copy), L885 (doc code) and
 *     L892 (auto "Last Updated" chrome). A plain querySelector(selector) would
 *     return the SAME first element for downloads and social. We resolve each
 *     section to the first as-yet-UNCLAIMED match in document order so each
 *     section anchors to a distinct element.
 *  2. Source dividers — the page ships its own ".sectionseparator > hr" dividers
 *     (L286/287, L489/490, L651/652). Left in place they'd become extra markdown
 *     "---" breaks on top of the 5 we insert, producing the wrong section count.
 *     We strip ".sectionseparator" up front so our inserted bare <hr> are the
 *     single source of section breaks. The site-wide cleanup transformer does not
 *     remove <hr>, so our bare <hr> survive to markdown.
 *
 * Section-break marker + afterTransform anchoring follows the reference pattern:
 * block parsers run between beforeTransform and afterTransform and replace the
 * section elements (hero/panel/cards/fragment), so styled sections' metadata is
 * anchored to the marker <hr> inserted in beforeTransform, which survives.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

/**
 * Convert a template section style ("flex compact", "light-gray", "compact")
 * into a Section Metadata style cell. decorateSectionMetadata() (scripts.js)
 * splits the cell on COMMAS and toClassName()s each token, so a space-separated
 * value like "flex compact" must be emitted as "flex, compact" to yield the two
 * separate section classes `.flex` and `.compact` (there is no `.flex-compact`
 * rule). Single-word / already-hyphenated styles pass through unchanged.
 */
function styleToCell(style) {
  return String(style).trim().split(/\s+/).join(', ');
}

export default function transform(hookName, element, payload) {
  // Template-scoped guard (see header). Inert for every non-sa-resources template.
  if (!payload || !payload.template || payload.template.name !== 'sa-resources') return;

  const sections = payload.template.sections || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    // 1. Remove the source dividers so our inserted breaks are authoritative.
    WebImporter.DOMUtils.remove(element, ['.sectionseparator']);

    // 2. Resolve each section to a distinct element (first UNCLAIMED match in
    //    document order). Store live element references so later insertions don't
    //    invalidate earlier ones.
    const claimed = new Set();
    sections.forEach((section) => {
      section._anchor = null;
      const matches = element.querySelectorAll(section.selector);
      for (const m of matches) {
        if (!claimed.has(m)) {
          claimed.add(m);
          section._anchor = m;
          break;
        }
      }
    });

    // 3. Insert breaks in reverse so an insertion never shifts a not-yet-processed
    //    anchor. A styled break carries the marker attr so afterTransform can find
    //    it after parsers have replaced the underlying section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      let anchor = section._anchor;
      if (!anchor) continue; // selector didn't match this page — skip, never guess

      // The social section's "Social media" <h2> is authored as a `.text.parbase`
      // sibling immediately BEFORE the social `.cols4` (cleaned.html L492-501). Its
      // section break must sit ABOVE that heading — otherwise the heading stays in
      // the previous (downloads) section and the divider rule lands between the
      // heading and its cards. Walk back over the source's spacer `.text` blocks to
      // the heading block and anchor the break there.
      if (section.id === 'social') {
        let prev = anchor.previousElementSibling;
        let headingBlock = null;
        while (prev && prev.matches('.text.parbase')) {
          if (prev.querySelector('h1, h2, h3, h4, h5, h6')) { headingBlock = prev; break; }
          prev = prev.previousElementSibling;
        }
        if (headingBlock) anchor = headingBlock;
      }

      const hr = element.ownerDocument.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      anchor.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now (in the real import) replaced hero/panel/cards/fragment
    // section elements. Anchor each styled section's metadata to the marker <hr>
    // placed in beforeTransform (or, for a styled first section, the original
    // element — not applicable here since section 0 is unstyled).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
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
