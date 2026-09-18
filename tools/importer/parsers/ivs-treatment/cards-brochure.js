/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-brochure. Base: cards. Variant class: resources.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: .cols4
 * Generated: 2026-09-11
 *
 * The "Resources" grid — matches the already-migrated IVS sibling
 * (content/us/en/ivs/treatments/disc-decompression.plain.html), whose resources
 * grid is `cards resources`: each card is a brochure thumbnail image (DM) linking
 * to a PDF, plus a bold "LEARN MORE" link. Two cards here (EN + ES brochures).
 *
 * Cell model (blocks/cards/cards.js decorate): each card is one row with TWO
 * cells — an image cell (a div whose sole child is a picture → .cards-card-image)
 * and a body cell (title/links → .cards-card-body). The `resources` variant
 * renders the thumbnail above a teal "LEARN MORE" button.
 *
 * Source structure: each populated card is a `.col-md-3` column holding a
 * `.cta-img > a > img` thumbnail (the image link) and a separate `.curatedcta`
 * with the `a.btn-teal` "LEARN MORE" link. Empty `.col-md-3` spacer columns
 * (no image) are skipped. We anchor on each thumbnail image; the "LEARN MORE"
 * text link becomes the body cell. Both links point at the same PDF.
 *
 * Images emitted as raw <img> (DM/Scene7 src); patients-stryker-dm-images.js
 * (afterTransform) rewrites them to media-assets anchors.
 */
export default function parse(element, { document }) {
  const row = element.querySelector('.colctrl .row') || element.querySelector('.row');
  const columns = row
    ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className))
    : [];

  const cells = [];
  columns.forEach((col) => {
    const img = col.querySelector('.cta-img img, img');
    if (!img) return; // skip empty spacer columns

    // "LEARN MORE" text link (the btn-teal anchor), not the image-wrapping anchor.
    const learnMore = Array.from(col.querySelectorAll('a[href]'))
      .find((a) => !a.querySelector('img') && a.textContent.trim());

    const imageCell = document.createElement('div');
    imageCell.append(img);

    const bodyCell = document.createElement('div');
    if (learnMore) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.setAttribute('href', learnMore.getAttribute('href'));
      a.textContent = learnMore.textContent.replace(/\s+/g, ' ').trim();
      strong.append(a);
      p.append(strong);
      bodyCell.append(p);
    }

    cells.push([imageCell, bodyCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards',
    variants: ['resources'],
    cells,
  });
  element.replaceWith(block);
}
