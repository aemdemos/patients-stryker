/* eslint-disable */
/* global WebImporter */

/**
 * Parser for panel-cta. Base: panel. Variant class: gold.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: .has-background.bg-gold
 * Generated: 2026-09-11
 *
 * The "Tired of living in pain?" gold CTA band — matches the already-migrated IVS
 * sibling (content/us/en/ivs/treatments/disc-decompression.plain.html), whose
 * equivalent band is a `panel gold`: a centered gold bar with the prompt text, a
 * line break, and a bold "Let's find a doctor who can help." link.
 *
 * Source structure (.has-background.bg-gold): a single centered <p> holding
 * "Tired of living in pain?" + <br> + a bold link. We reproduce that as one
 * panel cell containing the prompt text, a <br>, and the bold link (kept bold, not
 * buttonized — the sibling renders it as a plain bold link inside the gold band).
 *
 * Single-column panel: one row, one cell.
 */
export default function parse(element, { document }) {
  const anchor = element.querySelector('a[href]');
  const cell = [];

  // Rebuild the prompt line: leading text + <br> + bold link, matching the sibling.
  const p = document.createElement('p');

  // Prompt text = the band's text with the link text removed.
  const linkText = anchor ? anchor.textContent.replace(/\s+/g, ' ').trim() : '';
  let promptText = element.textContent.replace(/\s+/g, ' ').trim();
  if (linkText) promptText = promptText.replace(linkText, '').trim();

  if (promptText) {
    p.append(document.createTextNode(promptText));
    p.append(document.createElement('br'));
  }
  if (anchor) {
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.setAttribute('href', anchor.getAttribute('href'));
    a.textContent = linkText;
    strong.append(a);
    p.append(strong);
  }

  if (!p.childNodes.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  cell.push(p);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'panel',
    variants: ['gold'],
    cells: [[cell]],
  });
  element.replaceWith(block);
}
