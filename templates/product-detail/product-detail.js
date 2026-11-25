/*
 * product-detail — www.stryker.com product pages (`template: product-detail`); called with the
 * document by scripts/corp.js loadTemplate. Product pages use the standard blocks, section
 * styles and Text style (product-detail.css holds the rest).
 *
 * In review (draft pages, docs/standardisation): linked icons in a row. stryker.com's contact
 * aside (Quick links beside the form) shows its social icons side by side; the migration writes
 * each as an image line then its link line (a Dynamic Media image link can't also carry the
 * target), so each pair becomes one linked image, the `image-link` rule, and two or more
 * linked images in a row stand side by side as an icon row (the standard icon-row size and gap).
 */
import { linkImage } from '../../scripts/corp.js';

const isLinkedImage = (el) => el?.matches('p') && el.children.length === 1
  && el.firstElementChild.matches('a[href]') && el.firstElementChild.querySelector(':scope > picture')
  && !el.textContent.trim();

/**
 * Pairs each image line with the link line after it, then groups runs of linked images.
 * @param {Element} wrapper A section's default content
 */
function iconRows(wrapper) {
  // only the migration's pairs: the link line repeats the image's text (its alt), so an image
  // followed by a call to action keeps both
  [...wrapper.querySelectorAll(':scope > p')].forEach((p) => {
    const alt = p.querySelector(':scope > picture img')?.alt.trim();
    const next = p.nextElementSibling;
    if (p.isConnected && alt && next?.textContent.trim() === alt) linkImage(p);
  });
  let run = [];
  const flush = () => {
    if (run.length > 1) {
      const row = document.createElement('div');
      row.className = 'product-detail-icon-row';
      run[0].before(row);
      row.append(...run);
    }
    run = [];
  };
  [...wrapper.children].forEach((el) => {
    if (isLinkedImage(el)) run.push(el);
    else flush();
  });
  flush();
}

export default function decorate(doc) {
  if (!doc.body.classList.contains('std-draft')) return;
  doc.querySelectorAll('main .section .default-content-wrapper').forEach(iconRows);
}
