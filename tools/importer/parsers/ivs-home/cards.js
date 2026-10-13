/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block, `linked` variant.
 * Base block: cards. Source: us/en/ivs/index.html (.cols4 > .colctrl) — the
 * "What pain are you dealing with?" 4-up pain-type grid.
 *
 * Each source column (.col-md-3) holds a rich-text linked heading (e.g.
 * "Back and neck pain" → /us/en/ivs/conditions/back-pain.html) and a
 * `.standaloneimage` whose <img> is wrapped in the SAME page link.
 *
 * Target authored table, header "Cards (linked)": each row is one card —
 *   cell 1 = image (mandatory), cell 2 = linked heading.
 * The `linked` variant makes the whole card navigate to the heading's href.
 *
 * DM note: card images are Scene7 (*-mobile-hero_1200x680). They are converted
 * to DM anchors later by ivs-home-dm.js (afterTransform) and rebuilt into
 * <picture> at render time.
 */

export default function parse(element, { document }) {
  const cells = [];

  // Each card is a top-level column (.col-md-3) inside the grid row.
  const cards = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-3"]');
  cards.forEach((card) => {
    const img = card.querySelector('.standaloneimage img, img');
    // Heading link (rich-text): an anchor wrapping the pain-type label.
    const headingLink = card.querySelector('.c-rich-text-editor a[href], .text a[href], a[href]');

    if (!img && !headingLink) return; // skip empty/placeholder columns

    const imageCell = img || '';

    // Rebuild the heading as an <h3> carrying the label link, so cards.js
    // (`linked` variant) makes the whole card navigate there. Use the label text
    // and the in-site href; the image's own wrapping link is dropped (the block
    // makes the card clickable from the heading href).
    const bodyCell = [];
    if (headingLink) {
      const label = headingLink.textContent.trim();
      const href = headingLink.getAttribute('href');
      const h = document.createElement('h3');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label;
      h.append(a);
      bodyCell.push(h);
    }

    cells.push([imageCell, bodyCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (linked)', cells });
  element.replaceWith(block);
}
