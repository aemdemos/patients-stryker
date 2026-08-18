/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ENT-homepage section handling. Runs in afterTransform (after the
 * parsers have built the columns/panel blocks and the condition parser has
 * inserted its own Section Metadata tables).
 *
 * Responsibilities:
 *   1. Remove the "Testimonials" section (a video embed — no existing block;
 *      out of scope for this import). Drops the H2 "Testimonials" and the
 *      testimonial description paragraph, plus any leftover video player markup.
 *   2. Insert EDS section breaks (<hr>) so the page reads as:
 *        Hero → "ENT patient conditions" heading → [4 condition sections] →
 *        risk/safety link → References/disclaimer.
 *      The 4 condition sections already carry their own section-metadata
 *      (Style=compact) from the condition parser; each is preceded by a break.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const doc = element.ownerDocument;
  const root = element;

  // --- 1. remove the Testimonials section ----------------------------------
  // The source Testimonials block is an H2 "Testimonials" followed by a video
  // player and a descriptive paragraph. Remove the heading, the paragraph, and
  // any residual video/iframe/application markup.
  const testimonialsH2 = [...root.querySelectorAll('h1, h2, h3')]
    .find((h) => h.textContent.trim().toLowerCase() === 'testimonials');
  if (testimonialsH2) {
    // remove the descriptive paragraph that follows (Clark Darrah testimonial)
    let sib = testimonialsH2.nextElementSibling;
    const toRemove = [testimonialsH2];
    while (sib && !/^H[1-6]$/.test(sib.tagName) && sib.tagName !== 'HR') {
      // stop before the trailing risk/safety link paragraph
      if (sib.querySelector && sib.querySelector('a[href*="risk-and-safety" i]')) break;
      toRemove.push(sib);
      sib = sib.nextElementSibling;
    }
    toRemove.forEach((n) => n.remove());
  }

  // The site-cleanup transformer strips the Scene7 player and often the
  // "Testimonials" heading too, leaving the testimonial description paragraph
  // orphaned. Remove that paragraph directly by its distinctive content so it
  // never survives regardless of whether the heading was still present above.
  [...root.querySelectorAll('p')].forEach((p) => {
    const t = p.textContent.trim();
    if (/^Clark Darrah, a Stryker employee/i.test(t)
      || /\bThis testimonial reflects our mission\b/i.test(t)) {
      p.remove();
    }
  });

  // any leftover video-player scaffolding
  WebImporter.DOMUtils.remove(root, ['iframe', 'video', '[data-video]', '.video, .c-video']);

  // --- 2. section breaks ----------------------------------------------------
  // Insert an <hr> before an anchor node, hoisted above any block wrapper the
  // parsers produced (a break inside a block table is invalid and gets stripped).
  const insertBreakBefore = (node) => {
    let anchor = node;
    let n = node;
    while (n && n !== root) {
      if (n.tagName === 'TABLE'
        || (n.classList && (n.classList.contains('columns') || n.classList.contains('panel')))) {
        anchor = n;
      }
      n = n.parentElement;
    }
    if (!anchor.parentElement) return;
    if (anchor.previousElementSibling && anchor.previousElementSibling.tagName === 'HR') return;
    anchor.parentElement.insertBefore(doc.createElement('hr'), anchor);
  };

  // break before the "ENT patient conditions" heading (starts the conditions area)
  const entHeading = [...root.querySelectorAll('h1, h2, h3')]
    .find((h) => h.textContent.trim().toLowerCase() === 'ent patient conditions');
  if (entHeading) insertBreakBefore(entHeading);

  // break before each condition's columns block (each condition = its own section).
  // The condition parser emits columns(50-50) → panel(blue) → link → metadata; the
  // break goes before the columns block that starts each condition.
  root.querySelectorAll('.columns.columns-50-50').forEach((cols) => {
    // skip the hero columns (it has no following panel sibling in its section)
    insertBreakBefore(cols);
  });

  // break before the risk/safety link
  const riskLink = [...root.querySelectorAll('a[href*="risk-and-safety" i]')][0];
  if (riskLink) insertBreakBefore(riskLink.closest('p') || riskLink);

  // break before the References/disclaimer region
  const refs = [...root.querySelectorAll('p')].find((p) => {
    const t = p.textContent.trim();
    return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
  });
  if (refs) insertBreakBefore(refs);
}
