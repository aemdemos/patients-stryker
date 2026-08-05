/*
 * Columns block — fixed-field model (UE).
 * All columns are authored in a single panel (Column 1/2/3 Image + Text).
 * Variants (class on the block):
 *   - no variant  → default columns layout
 *   - image-top   → image sits above the text with extra spacing
 *   - text-only   → image fields hidden in UE (via the model `condition`)
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  cols.forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic) {
      const picWrapper = pic.closest('div');
      if (picWrapper && picWrapper.children.length === 1) {
        // picture is only content in column
        picWrapper.classList.add('columns-img-col');
      }
    }
  });
}
