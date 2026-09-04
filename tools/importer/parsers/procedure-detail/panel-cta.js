/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, cta variant.
 * Base block: panel. Source: balloon-kyphoplasty.html
 *   (.cols2 > .colctrl .row > .col-sm-6:nth-child(2)) — the Benefits card column,
 *   which holds the .dimensional-box rich text and the trailing .buttonset CTA.
 *
 * Target authored table (single content column), header "Panel (cta, wide)":
 *   one content cell holding, in order:
 *     - h3 "Benefits of the treatment"
 *     - <ul> of 6 benefit bullets (superscript reference links preserved)
 *     - "Potential risks" link paragraph
 *     - "TALK TO YOUR DOCTOR" link paragraph
 *
 * Variants:
 *   - `cta`  — the bordered benefits card styling; its decorate() lifts the
 *     trailing link-only <p> into a gold button below the box (so the CTA link
 *     must be the LAST, link-only paragraph in the cell).
 *   - `wide` — REQUIRED here. At ≥600px the bare `cta` variant lays its content
 *     out as a 2-column grid (designed for the resources page's two-up box); our
 *     benefits panel has a single content unit, so without `wide` it fills only
 *     one of the two grid columns ("half of the half"). `wide` overrides the grid
 *     to a single full-width column so the panel occupies the whole right half of
 *     the flex section.
 */

export default function parse(element, { document }) {
  const contentCell = [];

  // Heading + benefit list live in the rich-text editor box (.dimensional-box).
  const heading = element.querySelector('.c-rich-text-editor h3, h3');
  if (heading) contentCell.push(heading);

  const list = element.querySelector('.c-rich-text-editor ul, ul');
  if (list) contentCell.push(list);

  // "Potential risks" inline link (inside the rich-text box, wrapped in <u>).
  const risksLink = element.querySelector('a[href="#potential-risks"], a[href*="potential-risks"]');
  if (risksLink) {
    const p = document.createElement('p');
    p.append(risksLink);
    contentCell.push(p);
  }

  // "TALK TO YOUR DOCTOR" button link — lives in a separate .buttonset below the
  // box. Must be the LAST, link-only paragraph so panel.js liftCta() promotes it.
  // Wrap the link text in <em><strong> (bold+italic) so decorateButtons() renders
  // it as the gold .button.accent — the same gold CTA style as the hero button and
  // the source's gold "TALK TO YOUR DOCTOR" button (a bare link stays a plain
  // teal text link).
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

  if (!heading && !list) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (cta, wide)', cells });
  element.replaceWith(block);
}
