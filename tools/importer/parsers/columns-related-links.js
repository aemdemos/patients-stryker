/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the related-links columns block. Base: columns.
 * Source: https://patients.stryker.com/ww/en/stroke-awareness/resources.html
 * Selector: .bg-light-gray .cols3
 * Generated: 2026-08-27
 *
 * This region is authored on the resources page as a 3-column grid (Understanding
 * stroke / Patient information / Regional information), each column = a bold label
 * paragraph, optional body copy, and one or more links. On the target site this
 * shared content lives in a reusable FRAGMENT document
 * (/fragments/stroke-awareness-related-links) and is referenced via the fragment
 * block on the resources page. This parser builds that fragment's body.
 *
 * Table shape follows the EDS "Columns" convention: a header row with just the
 * block name, then ONE content row of THREE cells (one per source column) — the
 * same 3-cell single-row layout as the already-migrated sibling stroke-awareness
 * index page's related-links `columns` block.
 *
 * Each source column is a Bootstrap `.col-md-4`. Within it, `.text.parbase`
 * wrappers hold the label/body/link paragraphs. We flatten each column to its
 * meaningful nodes (dropping the source's spacer `<p>&nbsp;&nbsp;</p>` and the
 * bold label's decorative wrapper spans), producing one cell per column.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll('.col-xs-12.col-sm-6.col-md-4'));
  if (!columns.length) {
    // Nothing to build — unwrap so downstream cleanup can proceed.
    element.replaceWith(...element.childNodes);
    return;
  }

  const rowCells = columns.map((col) => {
    const cell = document.createElement('div');
    const paras = Array.from(col.querySelectorAll('p'));
    // Track whether the previous emitted paragraph was body copy — the "Learn more"
    // CTA is a link-only paragraph that FOLLOWS a body sentence (unlike the regional
    // link list, where links follow the heading directly). The source uppercases
    // that CTA (it's a .standalone-link), so we emit its text uppercased here.
    let prevWasBody = false;
    paras.forEach((p) => {
      const text = p.textContent.replace(/ /g, ' ').trim();
      const hasLink = !!p.querySelector('a');
      // Drop empty spacer paragraphs (source uses `&nbsp;&nbsp;` between blocks).
      if (!text && !hasLink) return;

      const label = p.querySelector('.futura-bold');
      if (label && !hasLink) {
        // Bold label ("Understanding stroke") — emit as a heading so it renders
        // like the sibling index page's related-links column titles.
        const h3 = document.createElement('h3');
        h3.textContent = label.textContent.replace(/ /g, ' ').trim();
        cell.append(h3);
        prevWasBody = false;
        return;
      }

      const out = document.createElement('p');
      if (hasLink) {
        const isCta = prevWasBody; // link-after-body => the "Learn more" CTA
        // Preserve the anchor(s); strip the decorative wrapper spans.
        Array.from(p.querySelectorAll('a')).forEach((a, i) => {
          if (i > 0) out.append(document.createElement('br'));
          const clean = document.createElement('a');
          clean.setAttribute('href', a.getAttribute('href'));
          const linkText = a.textContent.replace(/ /g, ' ').trim();
          clean.textContent = isCta ? linkText.toUpperCase() : linkText;
          out.append(clean);
        });
        prevWasBody = false;
      } else {
        out.textContent = text;
        prevWasBody = true;
      }
      cell.append(out);
    });
    return cell;
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    cells: [rowCells],
  });
  element.replaceWith(block);
}
