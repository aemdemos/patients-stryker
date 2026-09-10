import decorateDMAssets from '../../scripts/dm-support.js';

export default function decorate(block) {
  // Convert authored DM links (<a href>) to <picture> on the block itself, so
  // rendering works independent of page-level decoration or the UE environment.
  // Must precede the picture-detection loop below. Idempotent (see dm-support.js).
  decorateDMAssets(block);

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // text-only columns (no image, plain section, not 50-50) use smaller mobile
  // type than the image/variant layouts — tag them so the CSS can target a
  // single class instead of a chain of :not()/:has() conditions.
  const variantSection = block.closest('.serif, .light-gray, .dark');
  if (!block.querySelector('picture') && !block.classList.contains('columns-50-50') && !variantSection) {
    block.classList.add('columns-text');
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('p') || pic.parentElement;
        if (picWrapper && picWrapper.children.length === 1 && picWrapper.textContent.trim() === '') {
          // picture is the only content of its own wrapper (a <p> or a <div>),
          // whether or not that wrapper has heading/text siblings elsewhere in the column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
