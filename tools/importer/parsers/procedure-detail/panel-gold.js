/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, gold variant.
 * Base block: panel. Source: balloon-kyphoplasty.html
 *   (.text.parbase .c-rich-text-editor .bg-gold) — a mid-page gold CTA band.
 *
 * Target authored table (single content column), header "Panel (gold)":
 *   one content cell holding the CTA text:
 *     "Tired of living in pain? Let's find a doctor who can help."
 *   where the second phrase links to physicianlocator.strykerivs.com.
 */

export default function parse(element, { document }) {
  const contentCell = [];

  // The gold band's copy is a single <p> (question + linked call to action).
  const paras = element.querySelectorAll(':scope > p, p');
  paras.forEach((p) => {
    if (p.textContent.trim()) contentCell.push(p);
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
