/* eslint-disable */
/* global WebImporter */

/**
 * Parser: ENT-homepage intro hero (source .c-page-hero) → EDS `columns` block,
 * variant `columns-50-50`.
 *
 * Source shape:
 *   .c-page-hero > .c-page-hero-content > .row
 *     .col-sm-6   ← text cell (h1 "ENT" + h2 subtitle + intro paragraph)
 *     .col-sm-6   ← image cell (hero image)
 *
 * Emits one columns block (columns-50-50) preserving source column order
 * (text cell first, image cell second). Same cell-collection approach as the
 * general columns parser: unwrap layout/rich-text wrappers to keep the real
 * headings/paragraphs/pictures.
 */
export default function parse(element, { document }) {
  const row = element.querySelector('.c-page-hero-content .row, .row');
  if (!row) return;

  const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
  const filled = cols.filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
  if (filled.length < 2) return;

  const cells = cols.map((col) => {
    const frag = document.createElement('div');
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (el.matches('picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol')) {
            frag.append(el);
          } else {
            pick(el);
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          frag.append(child);
        }
      });
    };
    pick(col);
    return [...frag.childNodes];
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    variants: ['columns-50-50'],
    cells: [cells],
  });
  element.replaceWith(block);
}
