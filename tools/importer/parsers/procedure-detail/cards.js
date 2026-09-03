/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block, default variant (no class).
 * Base block: cards. Source: balloon-kyphoplasty.html (.cols3 > .colctrl) — the
 * "How it works" 3-step row.
 *
 * Library convention: table has 2 columns, first row is the block name. Each
 * subsequent row is one card: cell 1 = image (mandatory), cell 2 = text content
 * (heading + description). Matches header "Cards".
 *
 * DM note: step images are Scene7 (balloon-kyphoplasty_step-1/2/3_640x380). They
 * are converted to DM anchors later by procedure-detail-dm.js (afterTransform)
 * and rebuilt into <picture> at render time.
 */

export default function parse(element, { document }) {
  const cells = [];

  // Each step card is a top-level column (.col-sm-6.col-md-4) inside the row.
  const cards = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-4"]');
  cards.forEach((card) => {
    const img = card.querySelector('.standaloneimage img, img');
    const heading = card.querySelector('.c-rich-text-editor h4, h4');
    const para = card.querySelector('.c-rich-text-editor p, p');

    if (!img && !heading) return; // skip empty/placeholder columns

    const imageCell = img || '';

    const bodyCell = [];
    if (heading) bodyCell.push(heading);
    if (para) bodyCell.push(para);

    cells.push([imageCell, bodyCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
