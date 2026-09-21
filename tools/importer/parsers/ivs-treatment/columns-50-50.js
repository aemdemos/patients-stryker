/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-50-50. Base: columns. Variant class: columns-50-50.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: ".c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h3):not(:has(h4))"
 * Generated: 2026-09-11
 *
 * The "What is LSS?" section: a dark teal gradient full-bleed panel with a text
 * column (h3 + two paragraphs) beside the anatomical diagram image. The reference
 * lays these out as two EQUAL columns, so this maps to the columns block's
 * `columns-50-50` variant. The dark section styling comes from the
 * section-metadata Style: dark applied by the sections transformer.
 *
 * blocks/columns/columns.js reads the first row's cells as the columns and tags
 * `columns-{n}-cols`; the explicit `columns-50-50` variant class sets the equal
 * split. We emit ONE row with TWO cells: [text column][image column].
 *
 * The image is emitted as a raw <img> (DM/Scene7 src) so
 * patients-stryker-dm-images.js rewrites it to a media-assets anchor.
 */
export default function parse(element, { document }) {
  const row = element.querySelector('.colctrl .row') || element.querySelector('.row');
  const columns = row
    ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className))
    : [];

  const cells = [];
  columns.forEach((col) => {
    const cellNodes = [];

    // Text blocks (heading + paragraphs) in order.
    col.querySelectorAll('.text.parbase, .c-rich-text-editor').forEach((rte) => {
      if (rte.querySelector('.c-rich-text-editor')) return;
      Array.from(rte.children).forEach((wrapper) => {
        Array.from(wrapper.children).forEach((node) => {
          if (!node.textContent.replace(/ /g, ' ').trim()
            && !(node.querySelector && node.querySelector('img, picture'))) return;
          // The source authors the "What is LSS?" heading as an <h3> and the
          // reference renders it as an <h3> too — keep it as-is so the dark
          // section's gold title (<h3>) and body caption (<h4>) stay distinct
          // heading levels with their own, separate sizes.
          cellNodes.push(node);
        });
      });
    });

    // Image column: a raw <img>.
    const img = col.querySelector('.standaloneimage img, img');
    if (img && !cellNodes.includes(img)) cellNodes.push(img);

    if (cellNodes.length) cells.push(cellNodes);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    variants: ['columns-50-50'],
    cells: [cells],
  });
  element.replaceWith(block);
}
