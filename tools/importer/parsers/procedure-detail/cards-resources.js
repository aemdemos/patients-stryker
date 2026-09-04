/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block, resources variant.
 * Base block: cards. Source: balloon-kyphoplasty.html
 *   (.tabs .c-tabs .tabs-content .cols4 .colctrl) — the Resources brochure grid.
 *
 * Library convention: 2 columns, first row is the block name. Each subsequent
 * row is one card: cell 1 = image (mandatory), cell 2 = text content. Per the
 * authored `cards.resources` contract (content/drafts/cards-resources) each card is:
 *   cell 1: the brochure cover image as a BARE DM image — the source wraps the
 *           <img> in the brochure-PDF anchor, but we DISCARD that wrapping anchor
 *           and keep only the <img>. procedure-detail-dm.js then converts the
 *           bare DM <img> into an UNLINKED DM anchor (`<a href="DM-url">alt</a>`),
 *           which dm-support.js rebuilds into a responsive <picture>. (A linked
 *           image — DM URL stashed in the anchor's title — is NOT matched by
 *           dm-support.js's DM_SELECTOR and would render as a text link with no
 *           image, which is the bug this fixes.) The brochure PDF stays reachable
 *           via the "LEARN MORE" link in cell 2.
 *   cell 2: the "LEARN MORE" call-to-action link (brochure PDF href)
 *
 * The .cols4 grid has 4 .col-md-3 slots but only the first two carry real
 * brochure content (EN + ES); the trailing two are empty placeholders and are
 * skipped. Header "Cards (resources)".
 */

export default function parse(element, { document }) {
  const cells = [];

  // Each brochure card is a grid column; only populated ones have a .curatedcta.
  const cols = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-3"]');
  cols.forEach((col) => {
    const img = col.querySelector('.cta-img img, img');
    const learnMore = col.querySelector('a.btn[href], a.btn-teal[href]');

    if (!img && !learnMore) return; // skip empty placeholder slots

    // Image cell: the BARE <img>, deliberately unwrapped from the source's outer
    // brochure-PDF anchor. procedure-detail-dm.js converts a bare DM <img> into an
    // unlinked DM anchor that dm-support.js turns into a <picture>. Keeping the
    // PDF anchor would produce a linked image (DM URL in title) that dm-support.js
    // ignores — rendering a bare text link with no cover image.
    const imageCell = img || '';

    // Body cell: the LEARN MORE call-to-action link. The source renders it as a
    // teal button (`.btn.btn-teal` = --color-primary). Wrap the label in <strong>
    // so decorateButtons() promotes the link to `.button.primary` (the teal
    // button), per the project's emphasis→button contract — a bare link stays a
    // plain teal text link and would NOT be styled.
    const bodyCell = [];
    if (learnMore) {
      const label = learnMore.textContent.trim();
      learnMore.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = label;
      learnMore.append(strong);
      const p = document.createElement('p');
      p.append(learnMore);
      bodyCell.push(p);
    }

    cells.push([imageCell, bodyCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (resources)', cells });
  element.replaceWith(block);
}
