/* eslint-disable */
/* global WebImporter */

/**
 * Parser for fragment. Base: fragment.
 * Source: https://patients.stryker.com/ww/en/stroke-awareness/resources.html
 * Selector: .bg-light-gray .cols3
 * Generated: 2026-08-27
 *
 * The related-links section (a 3-column grid of "Understanding stroke",
 * "Patient information", "Regional information" link lists in a gray band) is
 * migrated as a REUSABLE fragment reference rather than inline content. The
 * fragment document itself is authored separately at
 *   /fragments/stroke-awareness-related-links
 * so this block collapses the whole source grid into a single-cell fragment
 * block whose one cell holds a link to that path. The fragment block
 * (blocks/fragment/fragment.js) fetches `${path}.plain.html` and inlines it.
 */
const FRAGMENT_PATH = '/fragments/stroke-awareness-related-links';

export default function parse(element, { document }) {
  const link = document.createElement('a');
  link.href = FRAGMENT_PATH;
  link.textContent = FRAGMENT_PATH;

  const cells = [];
  cells.push([link]); // 1-column: one row, one cell holding the fragment link

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'fragment',
    cells,
  });
  element.replaceWith(block);
}
