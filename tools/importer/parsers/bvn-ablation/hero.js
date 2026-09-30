/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `hero` block, banner variant (bvn-ablation singleton).
 * Copied from parsers/procedure-detail/hero.js so later template changes can't
 * alter this page's re-import. Source: .fullWidthImageHero.
 *
 * Target authored table (single-column rows), header "Hero (banner)":
 *   row 1: desktop image (the <picture><source srcset> ≥840px URL)
 *   row 2: mobile image (the <img> src)
 *   row 3: visible h1 + "Find a doctor" CTA link
 *
 * The source hero has TWO h1s: the SEO page-title in .hero-space ("Basivertebral
 * nerve ablation | Interventional Spine") and the visible banner headline in
 * .largeheadline. Only the visible one is authored; the title lives in Metadata.
 * Both images are turned into DM anchors later by patients-stryker-dm-images.js.
 */

const DESKTOP_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/bvn-hero_1920x640-1?$max_width_1410$';
const MOBILE_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/bvn-hero_1200x680-1?$max_width_720$';

export default function parse(element, { document }) {
  const picture = element.querySelector('.imgBoxId picture, .full-width-img picture, picture');
  const srcImg = element.querySelector('.imgBoxId img, .full-width-img img, picture img');
  const alt = (srcImg && srcImg.getAttribute('alt')) || '';

  // Desktop image: prefer a live <source srcset> desktop URL, else the recovered DM URL.
  let desktopSrc = '';
  const source = picture && picture.querySelector('source[srcset]');
  if (source) desktopSrc = source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
  if (!desktopSrc) desktopSrc = DESKTOP_DM_URL;
  const desktopImg = document.createElement('img');
  desktopImg.setAttribute('src', desktopSrc);
  desktopImg.setAttribute('alt', alt);

  // Mobile image: the surviving <img> src on the live page, else recovered DM URL.
  const mobileSrc = (srcImg && srcImg.getAttribute('src')) || MOBILE_DM_URL;
  const mobileImg = document.createElement('img');
  mobileImg.setAttribute('src', mobileSrc);
  mobileImg.setAttribute('alt', alt);

  // Author the visible headline only. hero.banner paints it gold Futura when it
  // is wrapped <em><strong> (hero.css / styles.css), so reproduce that emphasis.
  const visibleEl = element.querySelector('.largeheadline h1, .c-largeheadline h1');
  const pageTitleEl = element.querySelector('.hero-space h1');
  const visibleText = (visibleEl && visibleEl.textContent.trim())
    || (pageTitleEl && pageTitleEl.textContent.split('|')[0].trim()) || 'Basivertebral nerve ablation';
  const heading = document.createElement('h1');
  const headingEm = document.createElement('em');
  const headingStrong = document.createElement('strong');
  headingStrong.textContent = visibleText;
  headingEm.append(headingStrong);
  heading.append(headingEm);

  // "Find a doctor" CTA: <em><strong> text → decorateButtons() gold .button.accent.
  const ctaAnchor = element.querySelector('.curatedcta a[href], a.btn-gold[href], a.btn[href]');
  const contentCell = [heading];
  if (ctaAnchor) {
    const ctaText = ctaAnchor.textContent.trim();
    ctaAnchor.textContent = '';
    const ctaEm = document.createElement('em');
    const ctaStrong = document.createElement('strong');
    ctaStrong.textContent = ctaText;
    ctaEm.append(ctaStrong);
    ctaAnchor.append(ctaEm);
    const p = document.createElement('p');
    p.append(ctaAnchor);
    contentCell.push(p);
  }

  const cells = [];
  cells.push([desktopImg]);
  cells.push([mobileImg]);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (banner)', cells });
  element.replaceWith(block);
}
