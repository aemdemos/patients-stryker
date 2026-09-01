/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-brochure. Base: cards. Variant class: brochure.
 * Source: https://patients.stryker.com/ww/en/stroke-awareness/resources.html
 * Selector: .cols4
 * Generated: 2026-08-27
 *
 * Matches the EDS "Cards" convention: 2 columns, one row per card, image cell
 * first + text (body) cell second. Every card here has an image, so the
 * 2-column form (not the "no images" 1-column form) is correct.
 *
 * Used TWICE on the page, both via this one parser (same brochure variant):
 *   (a) Downloads — 4 cards, each = <h2> title (Brochure/Poster/Quickscreen/
 *       Table tent) + cover image + a "Digital | Print" paragraph (two PDF links).
 *   (b) Social media — 4 cards, each = NO title + banner image + a single
 *       "Banner N" download link.
 *
 * Per the migration plan the social cards keep an EMPTY body-heading position so
 * both grids share the brochure layout; we simply omit the heading node when the
 * card has none (the body cell still exists, carrying the links), so both grids
 * produce the same 2-column [image][body] card table.
 *
 * Cell model (matches blocks/cards/cards.js decorate): a card is TWO cells —
 * an image cell (a div whose only child is a picture) and a body cell (title +
 * links). cards.js classifies `div.children.length === 1 && div.querySelector
 * ('picture')` as .cards-card-image and everything else as .cards-card-body.
 *
 * Card unit: each card is a Bootstrap column (`.col-xs-12.col-sm-6.col-md-3`)
 * whose `.row` holds a heading `.text` block (downloads only), a
 * `.standaloneimage` (the cover/banner), and a links `.text` block that is a
 * SIBLING of the image — so we anchor on each `.standaloneimage` (one per card,
 * reliable count) and gather the card's heading + links from its enclosing
 * column, not from the image element itself. This works on the well-formed live
 * DOM (what the validator loads) for both grids.
 *
 * Images emitted as raw <img>; patients-stryker-dm-images.js (afterTransform)
 * rewrites DM/Scene7 imgs to media-assets anchors on the live import.
 */
export default function parse(element, { document }) {
  const imageBlocks = Array.from(element.querySelectorAll('.standaloneimage'));

  const cells = [];

  imageBlocks.forEach((imgBlock) => {
    const img = imgBlock.querySelector('img');
    if (!img) return;

    // The card column enclosing this image (fallback to the image block itself).
    const card = imgBlock.closest('[class*="col-"]') || imgBlock;

    // Title: the card's heading (downloads grid). Social cards have none.
    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');

    // Links: download anchors belonging to THIS card (Digital | Print, or a
    // single "Banner N"), excluding any anchor that merely wraps the image.
    const links = Array.from(card.querySelectorAll('a'))
      .filter((a) => !a.querySelector('img') && a.textContent.trim());

    // Build the image cell: a wrapper div whose sole child is the image so
    // cards.js recognises it as the .cards-card-image cell.
    const imageCell = document.createElement('div');
    imageCell.append(img);

    // Build the body cell: heading (when present) followed by the links row.
    // Social cards deliberately have no heading — the body cell still carries
    // the single "Banner N" link so both grids share the 2-column layout.
    const bodyCell = document.createElement('div');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.append(...heading.childNodes);
      bodyCell.append(h);
    }
    if (links.length) {
      const p = document.createElement('p');
      links.forEach((a, i) => {
        if (i > 0) p.append(document.createTextNode(' | '));
        p.append(a);
      });
      bodyCell.append(p);
    }

    cells.push([imageCell, bodyCell]);
  });

  // Empty-block guard: no cards resolved.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards',
    variants: ['brochure'],
    cells,
  });
  element.replaceWith(block);
}
