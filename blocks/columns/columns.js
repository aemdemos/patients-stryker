/*
 * Columns block — fixed-fields model (UE).
 * The block renders as one row of column cells; each cell may contain an
 * optional image (authored as a DM link, or a future asset-picker <picture>)
 * followed by text. The "text-only" variant (class on the block) hides image
 * authoring in UE via the component model `condition`; this decorator just lays
 * the columns out and tags image-only cells.
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  cols.forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic) {
      const picWrapper = pic.closest('div');
      if (picWrapper && picWrapper.children.length === 1) {
        picWrapper.classList.add('columns-img-col');
      }
    }
  });
}
