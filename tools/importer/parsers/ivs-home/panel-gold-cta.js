/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, gold variant — "Tired of living in pain?" band.
 * Base block: panel. Source: us/en/ivs/index.html
 *   (.c-rich-text-editor .bg-gold:has(a[href*='physicianlocator'])) — the lower
 *   gold CTA band, precedes the doctor-finder form (section anchor #find-a-doctor).
 *
 * Target authored table (single content column), header "Panel (gold)":
 *   one content cell holding the CTA copy:
 *     "Tired of living in pain? Let's find a doctor who can help."
 *   where the second phrase links to physicianlocator.strykerivs.com.
 *
 * Distinct file from panel-gold.js so the two gold bands map to separate
 * page-template block entries (different selectors); both emit "Panel (gold)".
 */

export default function parse(element, { document }) {
  const contentCell = [];

  const paras = element.querySelectorAll(':scope > p, p');
  paras.forEach((p) => {
    if (p.textContent.trim()) contentCell.push(p);
  });

  // fall back to headings if the copy isn't in a <p>
  if (contentCell.length === 0) {
    const headings = element.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
    headings.forEach((h) => { if (h.textContent.trim()) contentCell.push(h); });
  }

  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (gold)', cells });
  element.replaceWith(block);
}
