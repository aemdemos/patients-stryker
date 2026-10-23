/* eslint-disable */
/* global WebImporter */

/**
 * Parser: www.stryker.com single-slide `.c-autocarousel` → `Hero (image-slide)`.
 *
 * Source shape (one slide per carousel on every news article):
 *   .carouselslide
 *     .experienceFragment-ef        img  (desktop crop, 3:1)
 *     .experienceFragment-ef-mobile img  (mobile crop)
 *     .overlayparsys.mobile_Overlay|mobile_Bottom style="top:15%; margin-left:56%;
 *        width:calc(100% - 56% - 10%)"  → .largeheadline .line > .fontsize-2vw > .futura-bold
 *
 * Block (blocks/hero/hero.js, image-slide), one column:
 *   | Hero (image-slide, top-15, left-56, right-10, size-2[, text-below]) |
 *   | <desktop image> |
 *   | <mobile image>  |   (when the slide has one)
 *   | <headline>      |   heading kept as on the source; a plain headline line stays a
 *                           paragraph (no H1 is created)
 * The variant options carry the source headline box: top/left/right inset in % of the
 * image, size-<n> the fontsize-<n>vw class (2-5 = 2.5), text-below for mobile_Bottom.
 * Bold (span.futura-bold) becomes <strong>. Image alt text is copied as-is (an empty alt
 * stays empty — the DM transformer imports it as a bare link).
 */

function copyImage(source, document) {
  const img = document.createElement('img');
  img.setAttribute('src', source.getAttribute('src'));
  img.setAttribute('alt', source.getAttribute('alt') || '');
  return img;
}

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** The headline lines as <hN>/<p>, with source bold as <strong>. */
function headline(overlay, document) {
  const out = [];
  const headings = [...overlay.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const lines = headings.length ? headings : [...overlay.querySelectorAll('.line, p')];
  lines.forEach((line) => {
    if (!clean(line.textContent)) return;
    const el = document.createElement(/^H[1-6]$/.test(line.tagName) ? line.tagName.toLowerCase() : 'p');
    const box = document.createElement('div');
    box.innerHTML = line.innerHTML;
    box.querySelectorAll('span.futura-bold, b').forEach((span) => {
      const strong = document.createElement('strong');
      while (span.firstChild) strong.append(span.firstChild);
      span.replaceWith(strong);
    });
    box.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
    box.querySelectorAll('strong strong').forEach((s) => s.replaceWith(...s.childNodes));
    box.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attr) => { if (!(node.tagName === 'A' && attr.name === 'href')) node.removeAttribute(attr.name); });
    });
    // trim the source's surrounding whitespace text nodes
    while (box.firstChild && box.firstChild.nodeType === 3 && !box.firstChild.textContent.trim()) box.firstChild.remove();
    while (box.lastChild && box.lastChild.nodeType === 3 && !box.lastChild.textContent.trim()) box.lastChild.remove();
    while (box.firstChild) el.append(box.firstChild);
    out.push(el);
  });
  return out;
}

/** A % value of the overlay's inline style as a class token (7.5 → 7-5). */
function percent(style, re) {
  const m = style.match(re);
  return m ? String(parseFloat(m[1])).replace('.', '-') : null;
}

export default function parse(element, { document }) {
  const slide = element.querySelector('.carouselslide:not(.slick-cloned)') || element;
  const desktop = slide.querySelector('.experienceFragment-ef img');
  const mobile = slide.querySelector('.experienceFragment-ef-mobile img');
  const overlay = slide.querySelector('.overlayparsys');
  const first = desktop || mobile || slide.querySelector('img');
  if (!first) return;

  const variants = ['image-slide'];
  const cells = [[copyImage(first, document)]];
  if (desktop && mobile) cells.push([copyImage(mobile, document)]);

  if (overlay) {
    const lines = headline(overlay, document);
    if (lines.length) cells.push([lines]);

    const style = overlay.getAttribute('style') || '';
    const top = percent(style, /top:\s*(\d+(?:\.\d+)?)%/i);
    const left = percent(style, /margin-left:\s*(\d+(?:\.\d+)?)%/i);
    const right = percent(style, /width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i);
    if (top !== null) variants.push(`top-${top}`);
    if (left !== null) variants.push(`left-${left}`);
    if (right !== null) variants.push(`right-${right}`);

    const sized = overlay.querySelector('[class*="fontsize-"][class*="vw"]');
    const size = sized && sized.className.match(/fontsize-(\d+)(?:-(5))?-?vw/);
    if (size) variants.push(size[2] ? `size-${size[1]}-5` : `size-${size[1]}`);

    if (overlay.classList.contains('mobile_Bottom')) variants.push('text-below');
  }

  element.replaceWith(WebImporter.Blocks.createBlock(document, {
    name: `Hero (${variants.join(', ')})`,
    cells,
  }));
}
