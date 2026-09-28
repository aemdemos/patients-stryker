/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block, default variant (bvn-ablation singleton).
 * Source: .cols4 outside the Resources tabs — the 4-step "How it works" row.
 * Each step is a standalone DM image above a single numbered paragraph (no h4,
 * unlike the procedure-detail 3-step cards).
 *
 * Target authored table (2 cells per row), header "Cards":
 *   | step image | numbered paragraph |
 * DM images become anchors later (patients-stryker-dm-images.js, afterTransform).
 */

export default function parse(element, { document }) {
  const cells = [];

  // Page topic for the step-image alt text (the hero is parsed before this).
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const topic = ((ogTitle && ogTitle.getAttribute('content')) || document.title.split('|')[0]).trim();

  element.querySelectorAll('.row > [class*="col-md-3"]').forEach((col) => {
    const img = col.querySelector('.standaloneimage img, img');
    const paras = [...col.querySelectorAll('.c-rich-text-editor p')].filter((p) => p.textContent.trim());
    if (!img && paras.length === 0) return; // empty placeholder slot
    // The source step images carry a placeholder alt/title ("xxx"). An empty alt
    // can't round-trip (DM images are authored as links whose text becomes the
    // alt), so give each a short label that doesn't repeat the step paragraph.
    if (img && /^x*$/i.test((img.getAttribute('alt') || '').trim())) {
      img.setAttribute('alt', `${topic}, step ${cells.length + 1}`);
      img.removeAttribute('title');
    }
    cells.push([img || '', paras]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
