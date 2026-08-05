/*
 * Columns block — parent + repeatable "column" item model (UE).
 * Each authored column is a top-level child of the block. We wrap them in a
 * single flex row so the layout CSS (.columns > div > div) applies, and tag
 * image-only columns. Image authoring per column is toggled in UE by the
 * column's own "Text only" layout via the component model `condition`.
 */
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

export default function decorate(block) {
  const columns = [...block.children];
  block.classList.add(`columns-${columns.length}-cols`);

  const row = document.createElement('div');
  columns.forEach((col) => {
    // keep UE instrumentation and any author-set variant class on the column
    const cell = document.createElement('div');
    if (col.className) cell.className = col.className;
    moveInstrumentation(col, cell);
    while (col.firstElementChild) cell.append(col.firstElementChild);

    // a column whose only content is an image is treated as an image column
    const pic = cell.querySelector('picture');
    if (pic) {
      const picWrapper = pic.closest('div');
      if (picWrapper && picWrapper.children.length === 1) {
        picWrapper.classList.add('columns-img-col');
      }
    }
    row.append(cell);
  });

  block.replaceChildren(row);
}
