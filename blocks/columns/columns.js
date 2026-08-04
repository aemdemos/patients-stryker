/*
 * Columns block — field-based model (UE).
 * Each column cell may contain an optional image (authored as a DM link, or a
 * future asset-picker <picture>) followed by text content (heading/body/lists).
 * The "text-only" variant (class on the block) hides image authoring in UE via
 * the component model `condition`; this decorator just lays the columns out.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  const cols = row ? [...row.children] : [];
  block.classList.add(`columns-${cols.length}-cols`);

  cols.forEach((col) => {
    // a column whose only content is an image is treated as an image column
    const pic = col.querySelector('picture');
    if (pic) {
      const picWrapper = pic.closest('div');
      if (picWrapper && picWrapper.children.length === 1) {
        picWrapper.classList.add('columns-img-col');
      }
    }
  });
}
