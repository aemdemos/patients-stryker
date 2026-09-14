/* eslint-disable */
/* global WebImporter */

/**
 * Parser for panel. Base: panel. Variant class: cta wide.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: .col-xs-12.col-sm-6:has(.dimensional-box)
 * Generated: 2026-09-11
 *
 * The "Benefits of the treatment" box — matches the already-migrated IVS sibling
 * (content/us/en/ivs/treatments/disc-decompression.plain.html), whose equivalent
 * benefits box is a `panel cta wide`: a left-aligned Futura-bold heading, a
 * benefits list, a "Potential risks" underline link, and a "TALK TO YOUR DOCTOR"
 * gold CTA button lifted below the box.
 *
 * Source structure: the RIGHT column of the flex side-by-side section
 * (`.col-sm-6:has(.dimensional-box)`) holds TWO sibling pieces:
 *   1. ".dimensional-box" — the white box: h3 + benefits <ul> + "Potential risks"
 *      link paragraph.
 *   2. a ".buttonset" sibling with the "TALK TO YOUR DOCTOR" PDF button
 *      (a.btn-gold) — OUTSIDE the box in the source, but part of the same panel
 *      unit visually. We pull it into the panel cell so the `cta` variant lifts it
 *      into the gold ".panel-cta" button below the box (blocks/panel/panel.js
 *      liftCta finds the trailing link-only <p>).
 *
 * The CTA anchor is wrapped in <em><strong> so decorateButtons() promotes it to
 * the gold .button.accent (matching the sibling's TALK button encoding). The
 * "Potential risks" link keeps its authored underline (a plain teal link).
 *
 * Single-column panel: one row, one cell holding heading + list + risks link +
 * the lifted CTA paragraph.
 */
export default function parse(element, { document }) {
  const box = element.querySelector('.dimensional-box');
  if (!box) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cell = [];

  // Heading, list, and the "Potential risks" link paragraph from the box, in order.
  const heading = box.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.append(...heading.childNodes);
    cell.push(h);
  }

  const list = box.querySelector('ul, ol');
  if (list) cell.push(list);

  // "Potential risks" link paragraph (anchor to #potential-risks) — keep as-is.
  const risksP = Array.from(box.querySelectorAll(':scope > p')).find((p) => {
    const a = p.querySelector('a[href]');
    return a && /potential risks/i.test(a.textContent);
  });
  if (risksP) cell.push(risksP);

  // "TALK TO YOUR DOCTOR" CTA — a sibling of the box. Rebuild as a link-only <p>
  // wrapped in <em><strong> so liftCta picks it up and decorateButtons() makes it
  // the gold button.
  const talk = Array.from(element.querySelectorAll('a[href]'))
    .find((a) => !box.contains(a) && a.textContent.trim());
  if (talk) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.setAttribute('href', talk.getAttribute('href'));
    a.textContent = talk.textContent.replace(/\s+/g, ' ').trim();
    strong.append(a);
    em.append(strong);
    p.append(em);
    cell.push(p);
  }

  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'panel',
    variants: ['cta', 'wide'],
    cells: [[cell]],
  });
  element.replaceWith(block);
}
