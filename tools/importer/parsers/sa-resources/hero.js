/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero. Base: hero. Variant class: band.
 * Source: https://patients.stryker.com/ww/en/stroke-awareness/resources.html
 * Selector: .carouselslidegroup
 * Generated: 2026-08-27
 *
 * This page's hero is NOT the tall portrait "poster" banner of the sibling
 * stroke-awareness index. Measured on the live source at 1280px it is a thin
 * ~100px gradient BAND (image native 1440x112) with the "Resources" headline
 * (dark serif, ~51px) overlaid on the left, vertically centred. That is exactly
 * the project's `band` hero variant (blocks/hero/hero.css): the authored image's
 * own aspect ratio drives the bar height (no forced crop) and the headline is
 * overlaid left/centre — so we use `band`, not `fullbleed poster` (which forces
 * a 3:1 crop and renders ~4x too tall here).
 *
 * Row structure (single-column rows, per blocks/hero/hero.js setupHero, which
 * band reuses for image stacking):
 *   | <desktop image> |
 *   | <mobile image>  |
 *   | <h1 + supporting copy> |
 * setupHero folds the optional mobile image into a responsive <picture>, so we
 * keep both image rows.
 *
 * Source structure: a carousel slide whose ".experienceFragment-ef" container
 * holds the DESKTOP banner image ("World Stroke Day October 29") and a separate
 * ".experienceFragment-ef-mobile" container holds the MOBILE image; the H1
 * "Resources" is overlaid in ".overlayparsys .largeheadline". The two container
 * classes are distinct tokens, so scoping by class isolates each image even
 * though the mobile block is nested inside the desktop fragment.
 *
 * Images are emitted as raw <img>; patients-stryker-dm-images.js (afterTransform)
 * rewrites DM/Scene7 <img> to media-assets anchors on the live import, and
 * scripts/dm-support.js renders them back to <picture> at load — the same
 * convention the hero cells use in index.plain.html.
 */
export default function parse(element, { document }) {
  // Desktop banner: first image inside the desktop experience fragment.
  const desktopImg = element.querySelector(
    '.experienceFragment-ef .standaloneimage img, .experienceFragment-ef img',
  );
  // Mobile banner: image inside the mobile experience fragment (distinct token).
  const mobileImg = element.querySelector(
    '.experienceFragment-ef-mobile .standaloneimage img, .experienceFragment-ef-mobile img',
  );

  // Overlaid headline ("Resources") and any supporting copy line.
  const heading = element.querySelector('.largeheadline h1, .overlayparsys h1, h1');
  // Source paints "Resources" in gold (#ffb500) Futura bold. This project encodes
  // a gold Futura heading as the bold+italic marker (<h1><em><strong>…), which the
  // global heading rules (styles.css) render upright, gold, and in the display face
  // — the same convention as the migrated stroke-awareness index hero. Rewrap the
  // heading's text so it renders gold rather than the default serif white.
  if (heading && !heading.querySelector('em, strong')) {
    const text = heading.textContent.replace(/\s+/g, ' ').trim();
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    strong.textContent = text;
    em.append(strong);
    heading.replaceChildren(em);
  }
  const copyLines = Array.from(
    element.querySelectorAll('.largeheadline p, .overlayparsys p'),
  ).filter((p) => p.textContent.trim());

  const cells = [];

  // Row: desktop image (own single-column row).
  if (desktopImg) cells.push([desktopImg]);

  // Row: mobile image (optional single-column row) — only when it is a distinct
  // asset from the desktop image.
  if (mobileImg && mobileImg !== desktopImg) cells.push([mobileImg]);

  // Row: heading + supporting copy in one cell.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...copyLines);
  if (contentCell.length) cells.push([contentCell]);

  // Empty-block guard: nothing usable extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero',
    variants: ['band'],
    cells,
  });
  element.replaceWith(block);
}
