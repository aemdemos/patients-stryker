/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `hero` block, banner variant.
 * Base block: hero. Source: balloon-kyphoplasty.html (.fullWidthImageHero).
 *
 * Target authored table (single-column rows), header "Hero (banner)":
 *   row 1: desktop image
 *   row 2: mobile image
 *   row 3: h1 heading (the VISIBLE banner headline only) + "Find a doctor" CTA link
 *
 * Heading note: the source hero DOM has TWO h1s — an SEO/page-title heading in
 * `.hero-space` ("Balloon kyphoplasty | Interventional Spine", the same text as
 * the page <title>) and the visible banner headline in `.largeheadline`
 * ("Balloon kyphoplasty"). Only the visible headline is authored design; the
 * "| Interventional Spine" qualifier is SEO/title chrome and is already carried
 * by the page's Metadata (title) block, so we do NOT emit it as a hero
 * subheading (doing so put a spurious extra line under the banner headline).
 *
 * DM note: the DESKTOP hero image (balloon-kyphoplasty-hero_1920x640) is served
 * from a <picture><source srcset> that is stripped during cleaning, so it is
 * recovered from the known Scene7 URL (metadata.json .images.mapping). The MOBILE
 * image (balloon-kyphoplasty-mobile-hero_1200x680) survives as the <img>. Both
 * imgs are converted to DM anchors later by procedure-detail-dm.js (afterTransform).
 */

const DESKTOP_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/balloon-kyphoplasty-hero_1920x640-rev1-1?$max_width_1410$';
const MOBILE_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/balloon-kyphoplasty-mobile-hero_1200x680-rev-1?$max_width_720$';

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

  // The hero contains TWO h1s: an SEO/page-title ("Balloon kyphoplasty |
  // Interventional Spine", in .hero-space) and the VISIBLE banner headline nested
  // in .largeheadline ("Balloon kyphoplasty"). Author only the visible headline;
  // the page-title qualifier is SEO/title chrome (already in the Metadata title),
  // NOT part of the visible hero design — so it is intentionally not emitted here.
  //
  // AUTHORED EMPHASIS: hero.banner styling is driven by markup, not source classes.
  // The headline gets its gold Futura treatment only when wrapped <em><strong> (see
  // .hero.banner h1 in hero.css + styles.css), and decorateButtons() in scripts.js
  // only turns a CTA link into the gold .button.accent when the anchor text is
  // wrapped <em><strong> (bold+italic → accent). The source renders both via its own
  // CSS, so we reproduce the emphasis markup here to match the hero-banner draft.
  const visibleEl = element.querySelector('.largeheadline h1, .c-largeheadline h1');
  const pageTitleEl = element.querySelector('.hero-space h1');
  const visibleText = (visibleEl && visibleEl.textContent.trim())
    || (pageTitleEl && pageTitleEl.textContent.trim()) || 'Balloon kyphoplasty';
  const heading = document.createElement('h1');
  const headingEm = document.createElement('em');
  const headingStrong = document.createElement('strong');
  headingStrong.textContent = visibleText;
  headingEm.append(headingStrong);
  heading.append(headingEm);

  // "Find a doctor" CTA link (source renders it as a gold button, text "FIND A
  // DOCTOR"). Wrap the anchor's text in <em><strong> so decorateButtons() promotes
  // it to a gold .button.accent, matching the hero-banner draft.
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
