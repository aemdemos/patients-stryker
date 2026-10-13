/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `columns` block, default variant (bvn-ablation singleton).
 * Source: .cols4 outside the Resources tabs — the 4-step "How it works" row.
 * Each step is a standalone DM image above a single numbered paragraph.
 *
 * Target structure = block library "Columns – Steps (4 up)"
 * (/.da/library/blocks/columns, item 3): ONE row, one cell per step, each cell
 *   | step image | numbered paragraph ("1. ...") |
 * stacked in that order. The columns block adds `columns-4-cols` and lays the
 * steps out 1-up → 2 x 2 → four across. DM images become anchors later
 * (patients-stryker-dm-images.js, afterTransform); the link text is the alt.
 */

export default function parse(element, { document }) {
  // Page topic for the step-image alt text (the hero is parsed before this).
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const topic = ((ogTitle && ogTitle.getAttribute('content')) || document.title.split('|')[0]).trim();

  const row = [];
  element.querySelectorAll('.row > [class*="col-md-3"]').forEach((col) => {
    const img = col.querySelector('.standaloneimage img, img');
    const paras = [...col.querySelectorAll('.c-rich-text-editor p')].filter((p) => p.textContent.trim());
    if (!img && paras.length === 0) return; // empty placeholder slot
    // The source step images carry a placeholder alt/title ("xxx"). An empty alt
    // can't round-trip (DM images are authored as links whose text becomes the
    // alt), so give each a short label that doesn't repeat the step paragraph.
    if (img && /^x*$/i.test((img.getAttribute('alt') || '').trim())) {
      img.setAttribute('alt', `${topic}, step ${row.length + 1}`);
      img.removeAttribute('title');
    }
    const cell = [];
    if (img) {
      const p = document.createElement('p');
      p.append(img);
      cell.push(p);
    }
    cell.push(...paras);
    row.push(cell);
  });

  if (row.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [row] });
  element.replaceWith(block);
}
