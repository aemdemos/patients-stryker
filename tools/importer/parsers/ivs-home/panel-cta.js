/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, cta variant (spotlights).
 * Base block: panel. Source: us/en/ivs/index.html
 *   (.cols2 > .colctrl:has(.dimensional-box) > .row > .col-sm-6) — one of the two
 *   side-by-side spotlight boxes (Vertebral compression fractures; Radiofrequency
 *   ablation), each a `.dimensional-box` rich-text card + a trailing `.buttonset`
 *   "LEARN MORE" link.
 *
 * Target authored table (single content column), header "Panel (cta, wide)":
 *   one content cell holding, in order:
 *     - h3 spotlight title
 *     - lead paragraph (superscript reference link preserved)
 *     - "LEARN MORE" link paragraph (LAST, link-only → lifted to a gold button)
 *
 * Variants:
 *   - `cta`  — lifts the trailing link-only <p> into a gold button below the box,
 *     so the CTA link must be the LAST, link-only paragraph in the cell.
 *   - `wide` — REQUIRED. At ≥600px the bare `cta` variant lays its content out as
 *     a 2-column grid (designed for the resources page's two-up box). Each of our
 *     spotlights holds a single content unit, so without `wide` it fills only one
 *     of the two grid columns — i.e. HALF of its half of the flex section ("half
 *     of half"). `wide` overrides the internal grid to a single full-width column
 *     so each panel occupies its whole half of the flex section.
 */

export default function parse(element, { document }) {
  const contentCell = [];

  // Heading + lead copy live in the rich-text box (.dimensional-box).
  const heading = element.querySelector('.dimensional-box h3, .c-rich-text-editor h3, h3');
  if (heading) contentCell.push(heading);

  const para = element.querySelector('.dimensional-box p, .c-rich-text-editor p, p');
  if (para) contentCell.push(para);

  // "LEARN MORE" button link — in the .buttonset below the box. Must be the LAST,
  // link-only paragraph so panel.js liftCta() promotes it. Wrap the link text in
  // <em><strong> (bold+italic) so decorateButtons() renders it as the gold
  // .button.accent (a bare link would stay a plain teal text link).
  const ctaLink = element.querySelector('.buttonset a[href], .button-group a[href], a.btn-gold[href]');
  if (ctaLink) {
    const ctaText = ctaLink.textContent.trim();
    ctaLink.textContent = '';
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    strong.textContent = ctaText;
    em.append(strong);
    ctaLink.append(em);
    const p = document.createElement('p');
    p.append(ctaLink);
    contentCell.push(p);
  }

  if (!heading && !para) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (cta, wide)', cells });
  element.replaceWith(block);
}
