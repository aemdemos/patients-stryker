import decorateDMAssets from '../../scripts/dm-support.js';

// YouTube link signatures (watch, short youtu.be and nocookie embeds)
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i;

/**
 * Extracts the 11-character video id from a YouTube URL (watch?v=, youtu.be/ID,
 * /embed/ID, /shorts/ID).
 * @param {string} href the authored YouTube URL
 * @returns {string} the id, or '' when there is none
 */
function youTubeId(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const m = url.pathname.match(/\/(?:embed|shorts|v)\/([\w-]{11})|^\/([\w-]{11})$/);
    return (m && (m[1] || m[2])) || '';
  } catch {
    return '';
  }
}

/**
 * Renders a YouTube link that stands alone in its paragraph as a 16:9 nocookie player,
 * the embed the video block uses (blocks cannot nest, so columns renders its own).
 * Descriptive link text becomes the player title.
 * @param {Element} block The columns block
 */
function decorateYouTube(block) {
  block.querySelectorAll('p > a[href]').forEach((a) => {
    const p = a.parentElement;
    const text = a.textContent.trim();
    if (!YOUTUBE.test(a.href) || p.textContent.trim() !== text) return;
    const id = youTubeId(a.href);
    if (!id) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'columns-youtube';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    iframe.title = /^https?:\/\//i.test(text) ? 'YouTube video player' : text;
    iframe.loading = 'lazy';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    wrapper.append(iframe);
    p.replaceWith(wrapper);
  });
}

export default function decorate(block) {
  // convert DM links to <picture>/<video> before restructuring — the canvas
  // re-renders fields from source, so run here (idempotent), not just decorateMain
  decorateDMAssets(block);
  decorateYouTube(block);

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
        let node = media;
        while (node.parentElement
          && node.parentElement !== col
          && node.parentElement.childElementCount === 1
          && node.parentElement.textContent.trim() === '') {
          node = node.parentElement;
        }
        if (node !== media && node.parentElement === col) {
          if (col.childElementCount === 1) {
            // image-only cell (e.g. 50-50): drop the media straight into the cell
            // so the tagging below marks the CELL as .columns-img-col — matching
            // the published structure that layout rules target (e.g. the zip theme
            // absolutely-positions .columns-50-50 > div > div.columns-img-col).
            node.replaceWith(media);
          } else {
            // mixed cell (e.g. icon-grid): keep the image as a block-level <p>
            // sibling so it and the text paragraphs stay siblings (img-col ~ p).
            const p = document.createElement('p');
            p.append(media);
            node.replaceWith(p);
          }
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

      // fully Bold paragraphs (labels, questions) and Heading 2s are tagged so styles can
      // tell them from text that only opens in bold (e.g. "John: …"), which CSS cannot
      col.querySelectorAll('p, h2').forEach((el) => {
        const strong = el.querySelector(':scope > strong:only-child');
        if (strong && strong.textContent.trim() === el.textContent.trim()) {
          el.classList.add('columns-bold');
        }
      });
    });
  });
}
