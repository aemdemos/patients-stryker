/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `hero` block, banner variant.
 * Base block: hero. Source: us/en/ivs/index.html (.fullWidthImageHero).
 *
 * Target authored table (single-column rows), header "Hero (banner)":
 *   row 1: desktop image
 *   row 2: mobile image
 *   row 3: h1 headline ("Pain doesn't hold the power. You do.") + "FIND A DOCTOR" CTA
 *
 * Heading note: the source hero DOM has TWO h1s — an SEO/page-title heading in
 * `.hero-space` ("Homepage") and the VISIBLE banner headline nested in
 * `.c-largeheadline` ("Pain doesn't hold the power. You do."). Only the visible
 * headline is authored design; the "Homepage" title is SEO/title chrome already
 * carried by the page's Metadata (title) block, so it is NOT emitted here.
 *
 * DM note: the DESKTOP hero image (homepage-hero_1920x640) is served from a
 * <picture><source srcset> that is stripped during cleaning, so it is recovered
 * from the known Scene7 URL (metadata.json .images.mapping). The MOBILE image
 * (hompeage-hero_1200x680) survives as the <img>. Both imgs are converted to DM
 * anchors later by ivs-home-dm.js (afterTransform).
 */

const DESKTOP_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/homepage-hero_1920x640-1?$max_width_1410$';
const MOBILE_DM_URL = 'https://media-assets.stryker.com/is/image/stryker/hompeage-hero_1200x680-1?$max_width_720$';

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

  // Visible banner headline lives in .c-largeheadline; the .hero-space h1 is the
  // SEO page title (already in the Metadata title). Author only the visible one.
  //
  // AUTHORED EMPHASIS + TWO-TONE. hero.banner styling is markup-driven (styles.css):
  // `<strong>` in a heading → Futura, base colour (black); `<em><strong>` → Futura
  // GOLD (--color-accent). The source headline is TWO-TONE — a black lead sentence
  // and a gold tail ("Pain doesn't hold the power." black + "You do." gold, both
  // Futura). An earlier version wrapped the WHOLE headline in <em><strong>, which
  // made it entirely gold — a fidelity regression the style validator flagged as a
  // collapsed segmentation. So split at the tail and emit the two tones separately.
  //
  // The source marks the tones with inconsistent span nesting across its headings,
  // so there's no reliable structural rule; the split point is defined here for
  // this fixed singleton (the validator's segmentation check guards any regression).
  const visibleEl = element.querySelector('.c-largeheadline h1, .largeheadline h1');
  const pageTitleEl = element.querySelector('.hero-space h1');
  const visibleText = (visibleEl && visibleEl.textContent.trim())
    || (pageTitleEl && pageTitleEl.textContent.trim()) || 'Pain doesn’t hold the power. You do.';

  // Two-tone split: gold tail = "You do." (final short clause), black lead = rest.
  const GOLD_TAIL = 'You do.';
  const heading = document.createElement('h1');
  const idx = visibleText.lastIndexOf(GOLD_TAIL);
  if (idx > 0) {
    const leadText = visibleText.slice(0, idx).trim();
    // Lead: Futura black → <strong> (no <em>, so no gold).
    const leadStrong = document.createElement('strong');
    leadStrong.textContent = `${leadText} `;
    heading.append(leadStrong);
    // Tail: Futura gold → <em><strong>.
    const goldEm = document.createElement('em');
    const goldStrong = document.createElement('strong');
    goldStrong.textContent = GOLD_TAIL;
    goldEm.append(goldStrong);
    heading.append(goldEm);
  } else {
    // Fallback (unexpected copy): keep the whole headline Futura via <strong>.
    const strong = document.createElement('strong');
    strong.textContent = visibleText;
    heading.append(strong);
  }

  const contentCell = [heading];

  // Subheading — the source renders "Through a variety of minimally invasive
  // treatment options…" as an <h2> (dark Egyptienne serif, weight 500). Emit it
  // as an <h2> so it keeps that SEMANTIC ROLE and inherits `.hero.banner h2`
  // styling (matching the source). Emitting a <p> here made it default 14px body
  // text — a real fidelity regression the style validator flagged as a
  // heading→body re-tag once cross-role diffing was enabled.
  const subEl = element.querySelector('.c-largeheadline h2, .largeheadline h2');
  const subText = subEl && subEl.textContent.trim();
  if (subText) {
    const h2 = document.createElement('h2');
    h2.textContent = subText;
    contentCell.push(h2);
  }

  // "FIND A DOCTOR" CTA link (source renders it as a gold button). Wrap its text
  // in <em><strong> so decorateButtons() promotes it to a gold .button.accent.
  const ctaAnchor = element.querySelector('.curatedcta a[href], a.btn-gold[href], a.btn[href]');
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
