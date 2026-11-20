/* global WebImporter */
// www.stryker.com empty archive pages and 2018/2019 event pages (#527), built like the legal pages
// (long-page-detail-corp builder) with the page title and the hero carousel of the event pages.
import { preprocess, transformPage } from './legal.js';

const text = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

// .c-hero-large-header h1 → the page title the builder takes (`.h1-title h1`)
function heroTitle(document) {
  document.querySelectorAll('.c-hero-large-header').forEach((header) => {
    const h1 = header.querySelector('h1');
    const title = document.createElement('div');
    title.className = 'h1-title';
    if (h1 && text(h1)) {
      const heading = document.createElement('h1');
      heading.textContent = text(h1);
      title.append(heading);
    }
    (header.closest('.hero-large-carousel') || header).before(title);
    if (!header.closest('.hero-large-carousel')) header.remove();
  });
}

// A newly opened link keeps the `#_blank` author marker (scripts.js decorateLinkTargets).
function linkOf(source, document) {
  const a = document.createElement('a');
  const href = source.getAttribute('href') || '';
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  a.href = newTab && !href.includes('#') ? `${href}#_blank` : href;
  return a;
}

// Each slide of .c-hero-large-carousel → its own section: Columns (columns-50-50) on the dark band,
// product image (linked as on the source) | title (H2) and its link (bold + underline). The
// rotation is lost; a carousel with no slide is dropped.
function carousel(document) {
  document.querySelectorAll('.c-hero-large-carousel').forEach((component) => {
    const slides = [...component.querySelectorAll('.slide-container')].map((slide) => {
      const image = slide.querySelector('.slide-image img');
      const imageLink = slide.querySelector('.slide-image a');
      const title = slide.querySelector('.slide-title');
      const link = slide.querySelector('a.slide-link');
      const first = [];
      if (image) {
        const img = image.cloneNode(true);
        if (imageLink) {
          const a = linkOf(imageLink, document);
          a.append(img);
          first.push(a);
        } else {
          first.push(img);
        }
      }
      const second = [];
      if (title && text(title)) {
        const h2 = document.createElement('h2');
        h2.textContent = text(title);
        second.push(h2);
      }
      if (link && text(link)) {
        const a = linkOf(link, document);
        a.textContent = text(link);
        const strong = document.createElement('strong');
        const u = document.createElement('u');
        u.append(a);
        strong.append(u);
        const p = document.createElement('p');
        p.append(strong);
        second.push(p);
      }
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'Columns (columns-50-50)',
        cells: [[first, second]],
      });
      block.setAttribute('data-keep', 'section');
      block.setAttribute('data-no-merge', '');
      block.setAttribute('data-section-style', 'bg-dark-gray');
      return block;
    });
    const holder = component.closest('.hero-large-carousel') || component;
    holder.replaceWith(...slides);
  });
}

export default {
  preprocess,
  transform: (payload) => {
    heroTitle(payload.document);
    carousel(payload.document);
    return transformPage(payload, 'events');
  },
};
