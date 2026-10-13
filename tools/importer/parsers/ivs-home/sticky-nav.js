/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `sticky-nav` block.
 * Base block: sticky-nav. Source: us/en/ivs/index.html
 *   (.c-navigation-bar .nav-wrap nav.container) — the in-page anchor bar.
 *
 * NOTE: at import time the wrapper is `.nav-wrap` (the `.sticky` class is added by
 * the site's own JS on scroll, so it is NOT present in the static/imported DOM) —
 * the page-template selector matches `.nav-wrap` accordingly.
 *
 * Each source item is <a class="anchor" data-linking="ANCHOR"> wrapping
 * <em>LABEL</em>, with the target section id in `data-linking` (overview,
 * testimonials, find-a-doctor, resources, disclaimer) — the same ids the sections
 * transformer stamps into Section Metadata. The sticky-nav block authoring model
 * is one row per item: [ label, #anchor ].
 *
 * Target authored table, header "Sticky Nav": one row per item —
 *   cell 1 = label, cell 2 = "#anchor".
 */

// Fallback label→anchor map for any item missing a data-linking attribute.
const LABEL_TO_ANCHOR = {
  overview: 'overview',
  testimonials: 'testimonials',
  'find a doctor': 'find-a-doctor',
  resources: 'resources',
  disclaimer: 'disclaimer',
};

export default function parse(element, { document }) {
  // `element` is `.nav-wrap`; the items are its <a class="anchor"> links.
  const anchors = element.querySelectorAll('nav a.anchor, a.anchor, nav a');
  const cells = [];

  anchors.forEach((a) => {
    const label = a.textContent.trim().replace(/\s+/g, ' ');
    if (!label) return;
    // Prefer the explicit data-linking target; fall back to the label map.
    const anchorId = (a.getAttribute('data-linking') || '').trim()
      || LABEL_TO_ANCHOR[label.toLowerCase()];
    if (!anchorId) return; // skip unknown/non-anchor items (e.g. the menu toggle "X")

    const labelCell = document.createElement('p');
    labelCell.textContent = label;
    const targetCell = document.createElement('p');
    targetCell.textContent = `#${anchorId}`;

    cells.push([[labelCell], [targetCell]]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Sticky Nav', cells });
  // Replace the matched `.nav-wrap` in place. The surrounding `.c-navigation-bar`
  // chrome (menu toggle + page-title <h3>) is stripped by ivs-home-cleanup.js so
  // only the block remains in the nav section.
  element.replaceWith(block);
}
