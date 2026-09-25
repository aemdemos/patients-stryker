/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ivs-home section breaks + Section Metadata.
 *
 * Inserts an <hr> before every section (except the first) and a Section Metadata
 * block for each section that carries a `style` and/or an `anchor`. Section
 * selectors, styles, and anchors come verbatim from page-templates.json
 * (DOM-verified during page analysis):
 *
 *   1. hero         .fullWidthImageHero                       style: —            anchor: —
 *   2. anchor-nav   .c-navigation-bar                         style: —            anchor: —
 *   3. intro-video  .cols2:has(.standalonevideo)              style: flex         anchor: overview
 *   4. hope         .text.parbase:has(.bg-gold .fontsize…)    style: —            anchor: —
 *   5. pain-cards   .cols4                                    style: —            anchor: —
 *   6. statistics   .cols3                                    style: —            anchor: —
 *   7. spotlights   .cols2:has(.dimensional-box)              style: flex         anchor: —
 *   8. testimonials .fullbleedpanel:has(.bg-dark-teal…)       style: dark         anchor: testimonials
 *   9. find-doctor  .text.parbase:has(.bg-gold a[…locator])   style: —            anchor: find-a-doctor
 *  10. marketo      .marketoform                              style: —            anchor: resources
 *  11. disclaimer   .c-disclaimer.page-section:not(.container) style: compact     anchor: disclaimer
 *
 * The `anchor` value becomes `data-anchor` on the section (scripts.js
 * decorateSectionMetadata), which the sticky-nav block resolves as its scroll
 * target. A section that has an anchor but no style still gets a Section Metadata
 * block (anchor-only).
 *
 * Two-hook pattern: insert bare <hr> markers in beforeTransform (while every
 * section element still exists, before parsers replace them), then anchor each
 * section's Section Metadata to the surviving marker (or original element) in
 * afterTransform. Iterate in reverse so live-element inserts never shift
 * not-yet-processed sections.
 *
 * NOTE the marketo section (10) anchors to `.marketoform`, which the ivs-home
 * marketo transformer replaces with a `marketo-form` block in afterTransform. The
 * marketo transformer runs BEFORE this one in the registry, so in beforeTransform
 * the scaffold still exists to anchor the <hr>; by afterTransform the marker <hr>
 * is what we attach metadata to (never the replaced element).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
// Marks the leading <hr> of a section that needs an empty SPACER section inserted
// above it (a section whose only content is `Section Metadata: style=spacer`,
// rendered as a fixed-height empty gap by styles.css `.section.spacer`).
const SPACER_MARKER_ATTR = 'data-excat-spacer-before';

// True when a section needs a Section Metadata block (style and/or anchor).
function hasMetadata(section) {
  return Boolean(section.style || section.anchor);
}

// Build the Section Metadata cells for a section (style and/or anchor rows).
function metadataCells(section) {
  const cells = {};
  if (section.style) cells.style = section.style;
  if (section.anchor) cells.anchor = section.anchor;
  return cells;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      // First section: no leading break. It also never carries metadata here
      // (hero/section 1 has neither style nor anchor).
      if (i === 0) continue;
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match — skip, never guess

      const hr = element.ownerDocument.createElement('hr');
      if (hasMetadata(section)) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      // Flag this break so afterTransform can insert an empty spacer section
      // above it (the section's own break already exists here to anchor to).
      if (section.spacerBefore) hr.setAttribute(SPACER_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // section's Section Metadata to whichever still exists: the marker <hr> placed
    // above, or (fallback) the original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!hasMetadata(section)) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchorEl = marker || element.querySelector(section.selector);
      if (!anchorEl) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
        name: 'Section Metadata',
        cells: metadataCells(section),
      });
      anchorEl.after(metadataBlock);

      if (marker) marker.removeAttribute(SECTION_MARKER_ATTR);
    }

    // Insert empty SPACER sections. This is its own section — a leading <hr>
    // break plus a `Section Metadata: style=spacer` block with no other content —
    // rendered as a fixed-height empty gap (styles.css `.section.spacer`). Placed
    // BEFORE the flagged section's break so it sits between the previous section
    // and the target. Iterate in reverse so inserts don't shift pending markers.
    const spacerMarkers = [...element.querySelectorAll(`[${SPACER_MARKER_ATTR}]`)];
    for (let i = spacerMarkers.length - 1; i >= 0; i -= 1) {
      const targetBreak = spacerMarkers[i];
      const doc = element.ownerDocument;
      const spacerBreak = doc.createElement('hr');
      const spacerMeta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: 'spacer' },
      });
      // Order: [spacer <hr>][spacer metadata][target section's own <hr>]…
      targetBreak.before(spacerBreak, spacerMeta);
      targetBreak.removeAttribute(SPACER_MARKER_ATTR);
    }
  }
}
