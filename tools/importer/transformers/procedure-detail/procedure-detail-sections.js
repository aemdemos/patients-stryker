/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: procedure-detail section breaks + Section Metadata.
 *
 * The procedure-detail template has 8 sections (tools/importer/page-templates.json).
 * This inserts an <hr> before every section except the first, and a Section Metadata
 * block for each section that carries a `style`. Section selectors and styles come
 * verbatim from page-templates.json (already DOM-verified during page analysis):
 *
 *   1. hero            .fullWidthImageHero                                  style: (none)
 *   2. intro-benefits  .cols2 > .colctrl                                    style: flex
 *   3. evidence        .fullbleedpanel .c-full-bleed-panel                  style: dark
 *   4. how-it-works    .sectionseparator                                    style: (none)
 *   5. midpage-cta     .text.parbase .c-rich-text-editor .bg-gold           style: (none)
 *   6. resources       .tabs                                                style: (none)
 *   7. risks           .text.parbase .c-rich-text-editor .bg-light-gray     style: light-gray
 *   8. footnotes       .c-disclaimer.page-section:not(.container)           style: compact
 *
 * Follows the canonical two-hook pattern (references/generate-import-transformer.md):
 * insert bare <hr> markers in beforeTransform (while every section element still
 * exists, before block parsers replace them), then anchor each styled section's
 * Section Metadata to the surviving marker (or original element) in afterTransform.
 * Iterate in reverse so live-element inserts never shift not-yet-processed sections.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break, no metadata
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = element.ownerDocument.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or (first section, no marker) the original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
