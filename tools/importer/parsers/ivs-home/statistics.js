/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `statistics` block.
 * Base block: statistics. Source: us/en/ivs/index.html — TWO sibling `.cols3`
 * rows (3 `.col-md-4` metric cells each) forming one 6-metric dashboard.
 *
 * Each source cell is: a big number in an <h2> (span.fontsize-2-5em) + a
 * descriptive <p> (with a superscript reference link to #disclaimer).
 *
 * The statistics block authoring model is one row per stat:
 *   [ color-keyword, value, description ]
 * The source carries no per-stat colour, so we assign the homepage's authored
 * palette by position (matching the sticky-nav homepage prototype):
 *   gold, dark-gold, teal, navy, sage, purple.
 *
 * MERGE: both `.cols3` rows are combined into ONE `statistics (cols-3)` block so
 * the six metrics form a single dashboard (two 3-up rows via the cols-3 grid).
 * The parser is invoked once per `.cols3 > .colctrl` instance; the FIRST call
 * consumes every sibling `.cols3` and removes the rest (the import runner skips
 * the now-detached later instance).
 */

const PALETTE = ['gold', 'dark-gold', 'teal', 'navy', 'sage', 'purple'];

// Collect the metric cells (.col-md-4 / col-sm-*) from one .cols3 grid.
function statCells(colctrl) {
  const row = colctrl.querySelector('.row');
  if (!row) return [];
  return [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
}

export default function parse(element, { document }) {
  // `element` is a `.cols3 > .colctrl`. Find its `.cols3` and every sibling
  // `.cols3` so all metrics merge into a single block.
  const firstCols3 = element.closest('.cols3');
  if (!firstCols3 || !firstCols3.parentElement) return;

  const grids = [...firstCols3.parentElement.children].filter((c) => c.classList && c.classList.contains('cols3'));
  // Only the first grid builds the block; later grids are handled here and then removed.
  if (grids[0] !== firstCols3) return;

  const cells = [];
  let idx = 0;
  grids.forEach((grid) => {
    const colctrl = grid.querySelector('.colctrl') || grid;
    statCells(colctrl).forEach((cell) => {
      const valueEl = cell.querySelector('h2, h3, .fontsize-2-5em');
      const descEl = cell.querySelector('p');
      const value = valueEl && valueEl.textContent.trim();
      if (!value && !descEl) return;

      const color = PALETTE[idx % PALETTE.length];
      idx += 1;

      const valueCell = document.createElement('p');
      valueCell.textContent = value || '';

      const descCell = descEl || document.createElement('p');
      cells.push([color, [valueCell], [descCell]]);
    });
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Statistics (cols-3)', cells });
  firstCols3.replaceWith(block);
  // remove the now-consumed sibling grids
  grids.slice(1).forEach((g) => g.remove());
}
