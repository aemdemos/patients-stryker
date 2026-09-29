/* eslint-disable */
/* global WebImporter */

/**
 * Parser: source .dimensional-box → EDS `panel` block.
 *
 * On this ENT page the only dimensional-box is the patient-satisfaction stats
 * box: a single box holding three paragraphs (each "N% of patients …"). It maps
 * to ONE panel item (one block row / one cell) using the `left` variant, so the
 * three stat paragraphs stack left-aligned inside a single shadowed box.
 *
 * The panel block's decorate() turns each block row into a panel-body <li>; the
 * gold-label styling (bold+italic → --color-accent) is applied by the block CSS,
 * driven by the bold+italic markup the cleanup transformer produced from the
 * source's gold spans.
 */
export default function parse(element, { document }) {
  // collect the meaningful content (paragraphs / headings) inside the box
  const content = [...element.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > ul, :scope > ol')];
  const cell = content.length ? content : [...element.childNodes];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Panel',
    variants: ['left'],
    cells: [[cell]],
  });
  element.replaceWith(block);
}
