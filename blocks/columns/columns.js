import decorateDMAssets from '../../scripts/dm-support.js';

export default function decorate(block) {
  // convert DM links to <picture>/<video> before restructuring — the canvas
  // re-renders fields from source, so run here (idempotent), not just decorateMain
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
      // The DA/EW canvas wraps each field in an inline editor that re-renders from
      // source, overwriting a converted DM <picture>/<video> with the raw link.
      // Climb out of any wrappers that hold ONLY this media (the editor mount, or
      // the authored <p>) up to the column cell, then drop it into a clean <p> so
      // no editable mount point remains over it and the img-col styling still
      // applies. Only single-media wrappers are unwrapped, so cell text is never
      // touched; harmless on the published site.
      col.querySelectorAll('picture, .dm-video-wrapper').forEach((media) => {
        let node = media;
        while (node.parentElement
          && node.parentElement !== col
          && node.parentElement.childElementCount === 1
          && node.parentElement.textContent.trim() === '') {
          node = node.parentElement;
        }
        if (node !== media && node.parentElement === col) {
          const p = document.createElement('p');
          p.append(media);
          node.replaceWith(p);
        }
      });

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
