/* eslint-disable */
/* global WebImporter */

/**
 * Parser for panel. Base: panel. Variant class: light.
 * Source: https://patients.stryker.com/ww/en/stroke-awareness/resources.html
 * Selector: .dimensional-box
 * Generated: 2026-08-27
 *
 * The source ".dimensional-box" (a white, soft-shadowed box in the intro right
 * column) holds two paragraphs:
 *   1. an availability note ("These items are also available in French, German ...")
 *   2. a "Please contact us to request one of these versions." line with a
 *      mailto: link.
 * No image. Single-column panel: one row, one cell holding both paragraphs.
 * blocks/panel/panel.js tags each content cell .panel-body and applies its skin;
 * the `light` variant selects the lighter panel styling.
 */
export default function parse(element, { document }) {
  // Direct-child paragraphs of the box (skip empty spacer paragraphs).
  const paragraphs = Array.from(element.querySelectorAll(':scope > p'))
    .filter((p) => p.textContent.trim());

  // Fallback: if the box wraps its copy deeper, grab any non-empty paragraphs.
  const contentEls = paragraphs.length
    ? paragraphs
    : Array.from(element.querySelectorAll('p')).filter((p) => p.textContent.trim());

  // Empty-block guard.
  if (!contentEls.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentEls]); // 1-column: one row, one cell holding all paragraphs

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'panel',
    variants: ['light'],
    cells,
  });
  element.replaceWith(block);
}
