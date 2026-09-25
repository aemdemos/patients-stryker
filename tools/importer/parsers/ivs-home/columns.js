/* eslint-disable */
/* global WebImporter */

/**
 * Parser: IVS-home text + video `.cols2` regions → EDS `columns` block.
 * Source: us/en/ivs/index.html
 *   - intro (.cols2:has(.standalonevideo), section anchor #overview)
 *   - Janet + Lynn testimonials (.cols2 inside .c-full-bleed-panel.bg-dark-teal-gradient)
 *
 * Each region is a 2-column Bootstrap grid: a rich-text column (heading + copy)
 * and a `.standalonevideo` column holding a Scene7 Dynamic Media video viewer.
 * The viewer renders as a runtime `blob:` <video src> with NO recoverable asset
 * URL in the static DOM, so the DM video URL is recovered from the viewer's
 * container id (metadata.json posters identify the underlying AVS asset). We emit
 * the video as a plain link to the DM `/is/content/` HLS stream (with a `?poster=`
 * frame); the `columns` block + dm-support.js render it as a native <video>.
 *
 * Produces a 2-cell columns block (text | video-link). The columns block's
 * decorate() derives the column count from that row and marks the media cell.
 */

// Recover each video's DM stream + poster from its Scene7 viewer container id.
// The blob: <video src> carries no asset name; these ids are stable per-viewer
// (verified in migration-work/cleaned.html + metadata.json image mapping).
const VIDEO_BY_CONTAINER = {
  // Intro — "IVS Purpose Video"
  dynamicmedia_65056368: {
    src: 'https://media-assets.stryker.com/is/content/stryker/IVS%20Purpose%20Video-1-AVS.m3u8',
    poster: 'https://media-assets.stryker.com/is/image/stryker/IVS%20Purpose%20Video-1-AVS',
  },
  // Janet testimonial — VCF patient testimonial
  dynamicmedia_267939408: {
    src: 'https://media-assets.stryker.com/is/content/stryker/1659642804_VCF-Patient-Testimonial_Janet-Kliebert-FINAL_Resized-1-AVS.m3u8',
    poster: 'https://media-assets.stryker.com/is/image/stryker/1659642804_VCF-Patient-Testimonial_Janet-Kliebert-FINAL_Resized-1-AVS',
  },
  // Lynn testimonial — mild® procedure
  dynamicmedia_66170736: {
    src: 'https://media-assets.stryker.com/is/content/stryker/Martha-Lynn-mild-patient-testimonial-thumbnail.m3u8',
    poster: 'https://media-assets.stryker.com/is/image/stryker/Martha-Lynn-mild-patient-testimonial-thumbnail',
  },
};

// Build the DM video link for a `.standalonevideo` column, keyed on the Scene7
// viewer container id. Returns an <a> to the HLS stream (poster in the query), or
// null if the column holds no recognised viewer.
function videoLink(col, document) {
  const viewer = col.querySelector('[id^="dynamicmedia_"]');
  const id = viewer && viewer.id.match(/^(dynamicmedia_\d+)/);
  const entry = id && VIDEO_BY_CONTAINER[id[1]];
  if (!entry) return null;
  const href = `${entry.src}?poster=${encodeURIComponent(entry.poster)}`;
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = href;
  return a;
}

// Headings whose source copy is TWO-TONE (a gold accent tail the source styles
// via a nested span). The block flattens nested spans to plain text on the
// markdown round-trip, dropping the gold — so re-emit the tail as <em><strong>,
// which styles.css renders as the Futura gold accent inside a heading. Keyed on
// the plain heading text → the exact gold tail substring. Extend per two-tone
// heading. (The style validator's segmentation check guards regressions.)
const HEADING_GOLD_TAILS = {
  'making every moment matter.': 'matter.',
};

// Rebuild a heading's text as two tones: plain lead + <em><strong> gold tail.
// No-op when the heading isn't a known two-tone one.
function applyTwoTone(heading, document) {
  const text = heading.textContent.replace(/\s+/g, ' ').trim();
  const tail = HEADING_GOLD_TAILS[text.toLowerCase()];
  if (!tail) return;
  const idx = text.toLowerCase().lastIndexOf(tail.toLowerCase());
  if (idx <= 0) return;
  const lead = text.slice(0, idx).trim();
  heading.textContent = '';
  // Lead: Futura bold, base colour (black) → <strong> (styles.css: `h* strong`
  // → display font). The source's "futura-bold" span makes the WHOLE phrase
  // Futura; only the tail is gold. Emitting a bare text node here left the lead
  // in the h3's base Egyptienne serif — a mismatch the validator flagged.
  const leadStrong = document.createElement('strong');
  leadStrong.textContent = `${lead} `;
  heading.append(leadStrong);
  // Tail: Futura gold → <em><strong>.
  const em = document.createElement('em');
  const strong = document.createElement('strong');
  strong.textContent = text.slice(idx);
  em.append(strong);
  heading.append(em);
}

// Collect the meaningful text nodes/elements from a rich-text column, unwrapping
// the Bootstrap .row / rich-text-editor wrappers.
function textCell(col, document) {
  const frag = document.createElement('div');
  const pick = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        const el = child;
        if (el.matches('h1, h2, h3, h4, h5, h6, p, ul, ol')) {
          if (/^H[1-6]$/.test(el.tagName)) applyTwoTone(el, document);
          frag.append(el);
        } else if (!el.matches('.standalonevideo')) {
          pick(el);
        }
      } else if (child.nodeType === 3 && child.textContent.trim()) {
        frag.append(child);
      }
    });
  };
  pick(col);
  return [...frag.childNodes];
}

export default function parse(element, { document }) {
  const row = element.querySelector('.colctrl .row, .row');
  if (!row) return;

  const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
  if (cols.length < 2) return;

  // Build one cell per source column. A column containing a `.standalonevideo`
  // viewer becomes a video link; every other column keeps its text content.
  const cells = cols.map((col) => {
    if (col.querySelector('.standalonevideo')) {
      const link = videoLink(col, document);
      if (link) return [link];
    }
    return textCell(col, document);
  });

  // guard: need at least two cells with real content
  const filled = cells.filter((cell) => cell.length > 0);
  if (filled.length < 2) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    cells: [cells],
  });
  element.replaceWith(block);
}
