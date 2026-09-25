/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, gold variant — "There's hope ahead" band.
 * Base block: panel. Source: us/en/ivs/index.html
 *   (.c-rich-text-editor .bg-gold:has(.fontsize-1-25em)) — a full-width gold band
 *   with an h2 "There's hope ahead" and an h4 "What pain are you dealing with?"
 *   that introduces the pain-type card grid below it.
 *
 * Target authored table (single content column), header "Panel (gold)":
 *   one content cell holding the heading(s).
 */

export default function parse(element, { document }) {
  const contentCell = [];

  // The gold band's copy is a heading pair (h2 + h4). Keep any heading/paragraph.
  const nodes = element.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p');
  nodes.forEach((n) => {
    if (n.textContent.trim()) contentCell.push(n);
  });

  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (gold)', cells });
  element.replaceWith(block);
}
