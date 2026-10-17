import decorateDMAssets from '../../scripts/dm-support.js';
import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * True when an element holds visible copy. A rendered DM video's wrapper carries its player
 * labels (time, button names), which are not copy.
 * @param {Element} el the element
 * @returns {boolean}
 */
function hasCopy(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode;
    if (text.textContent.trim() && !text.parentElement.closest('.dm-video-wrapper')) return true;
  }
  return false;
}

export default function decorate(block) {
  // convert DM links to <picture>/<video> before restructuring — the canvas
  // re-renders fields from source, so run here (idempotent), not just decorateMain
  decorateDMAssets(block);

  // -corp (P2c-2): a cell paragraph that is only a YouTube link becomes the frozen `video`
  // block — the live cols2 rows pair a 6/12 player with a 6/12 title (hallux-valgus-correction),
  // and the runtime auto-block only sees default content, never block cells.
  block.querySelectorAll('p > a[href]').forEach((link) => {
    const p = link.parentElement;
    if (link.closest('.video') || p.children.length !== 1
      || p.textContent.trim() !== link.textContent.trim()) return;
    let host = '';
    try { host = new URL(link.getAttribute('href'), window.location.href).hostname; } catch { return; }
    if (!/(?:^|\.)(?:youtube(?:-nocookie)?\.com|youtu\.be)$/i.test(host)) return;
    const video = buildBlock('video', { elems: [link] });
    p.replaceWith(video);
    decorateBlock(video);
    loadBlock(video);
  });

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // text-only columns (no image, plain section, not 50-50) use smaller mobile
  // type than the image/variant layouts — tag them so the CSS can target a
  // single class instead of a chain of :not()/:has() conditions.
  const variantSection = block.closest('.serif, .light-gray, .dark');
  if (!block.querySelector('picture') && !block.classList.contains('columns-50-50') && !variantSection) {
    block.classList.add('columns-text');
  }

  // Published content sometimes flattens citation superscripts inside compact
  // code callouts (e.g. "...sinusitis4" instead of "...sinusitis<sup>4</sup>").
  // Rebuild the trailing citation as <sup> so footnote linking can run normally.
  if (block.closest('.section.compact')) {
    block.querySelectorAll('p > code').forEach((code) => {
      if (code.querySelector('sup')) return;

      const raw = code.textContent || '';
      const match = raw.match(/^(.*?)(\d+(?:\s*,\s*\d+)*)\s*$/);
      if (!match) return;

      const body = match[1];
      const refs = match[2];
      if (!/[A-Za-z)]\s*$/.test(body)) return;

      const sup = document.createElement('sup');
      sup.textContent = refs.replace(/\s+/g, '');
      code.replaceChildren(document.createTextNode(body), sup);
    });
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
        // -corp: a linked image (a > picture) keeps its anchor — the anchor is the
        // unit that climbs and lands, never the bare picture (live colctrl images link).
        const anchor = media.parentElement?.tagName === 'A'
          && media.parentElement.childElementCount === 1
          && media.parentElement.textContent.trim() === '' ? media.parentElement : null;
        const unit = anchor || media;
        if (anchor && !anchor.getAttribute('aria-label')) {
          // a11y (link-name): a linked image with empty alt — name the link after the
          // cell's heading or the link title (the live colctrl image links behave alike)
          const img = media.querySelector ? media.querySelector('img') : null;
          if (!(img && img.getAttribute('alt'))) {
            const h = col.querySelector('h2, h3, h4, h5');
            const name = anchor.getAttribute('title') || (h && h.textContent.trim()) || '';
            if (name) anchor.setAttribute('aria-label', name);
          }
        }
        let node = unit;
        while (node.parentElement
          && node.parentElement !== col
          && node.parentElement.childElementCount === 1
          && !hasCopy(node.parentElement)) {
          node = node.parentElement;
        }
        if (node !== unit && node.parentElement === col) {
          if (col.childElementCount === 1) {
            // image-only cell (e.g. 50-50): drop the media straight into the cell
            // so the tagging below marks the CELL as .columns-img-col — matching
            // the published structure that layout rules target (e.g. the zip theme
            // absolutely-positions .columns-50-50 > div > div.columns-img-col).
            node.replaceWith(unit);
          } else {
            // mixed cell (e.g. icon-grid): keep the image as a block-level <p>
            // sibling so it and the text paragraphs stay siblings (img-col ~ p).
            const p = document.createElement('p');
            p.append(unit);
            node.replaceWith(p);
          }
        }
      });

      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('p') || (pic.parentElement?.tagName === 'A' ? pic.parentElement.parentElement : pic.parentElement);
        if (picWrapper && picWrapper.children.length === 1 && picWrapper.textContent.trim() === '') {
          // picture is the only content of its own wrapper (a <p> or a <div>),
          // whether or not that wrapper has heading/text siblings elsewhere in the column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
