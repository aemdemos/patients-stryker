/*
 * Standardise pilot: the content transfer rules of the Columns block. A Columns instance (a
 * section of the readable-settings document, before decoration) → the same content in one of
 * the standard Columns variants. DOM only (no browser or Node APIs), so the same code builds
 * the candidates in the browser (scripts/standardise-preview.js) and rewrites the documents in
 * Node (apply.mjs, on a Playwright page as the DOM).
 *
 * The standards are layout standards. What a standard keeps: the cells and their content, design
 * names (section styles such as serif or a background, Cell colours and Image borders by their
 * palette names, text styles such as [[Gold]] or [[Large]]) and the authored text sizes
 * ([[1.75×]], [[5vw]], Copy size): typography is its own standardisation step, a named type
 * scale. Design boxes stay too: coloured Box lines (by their colour, with the standard's padding)
 * and the boxed-last / gold-first cards. What it drops: the measured layout values (Text box
 * paddings, Grid, Column widths other than its own options, the measured and white Box lines,
 * blank lines inside the cells, the section's padding and margin when it holds only the block);
 * a Media + text column set well down (centred beside the image) becomes Text in the middle.
 * Every change is reported in plain words.
 */

export const STANDARDS = {
  'std-media-text': {
    label: 'Media + text',
    description: 'An image or video beside its text, side by side from 600px, stacked on phones (image first). '
      + 'Options: Narrow image (one third) or Wide image (two thirds); Text in the middle (the text '
      + 'centred beside the image).',
  },
  'std-cards': {
    label: 'Cards',
    description: '2 to 4 equal columns, each an image above its text; 2 per row from 600px, all in a row from 900px.',
  },
  'std-text': {
    label: 'Text columns',
    description: '2 to 4 equal text columns; 2 per row from 600px, all in a row from 900px.',
  },
};

const MEDIA = /\/is\/image\/|\/is\/content\/|media-assets|\.m3u8|youtube\.com|youtu\.be|vimeo\.com|\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
// the named block options a standard keeps (type scale, alignment, the design boxes: a white
// shadow card last, a gold box first)
const KEEP_OPTIONS = ['large-headline', 'center', 'boxed-last', 'gold-first'];
// the box colours of Box lines (scripts/corp-settings.js BOX_COLOURS): a coloured box stays,
// with the standard's padding; white (no colour on the page) goes with the measured boxes
const BOX_COLOURS = ['white', 'gold', 'light-gray', 'gray', 'blue', 'purple', 'teal', 'silver',
  'dark-gold', 'golden-gradient', 'dark-gray', 'dark-purple-gradient', 'dark-blue-gradient',
  'dark-orange-gradient', 'dark'];
// Media + text: a text column set this far down (top padding + margin; AEM gives them in % of
// the column, so they count here as % of the block: 15% of a two-thirds column = 10%), the AEM
// way of centring the text beside a tall image, takes the Text in the middle option
const MIDDLE = 5;
// settings rows that are design names (kept) and measured values (dropped)
const KEEP_ROWS = ['Cell colours', 'Image borders'];
const DROP_ROWS = ['Text box', 'Grid', 'Column widths', 'Columns'];
const NUMBER = /^[\d.]+(×|vw)$/;
// rows of the whole section (the others are a Columns block's own: Text box, Grid, Cell colours,
// Image borders, plain for the first block and `(k)` for the k-th)
const SHARED_ROWS = ['style', 'id', 'Padding', 'Margin', 'Column widths', 'Column', 'Columns', 'Copy size',
  'Label size', 'Heading size', 'Headings', 'Text', 'Blank lines', 'Autoplay'];

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

const isMediaLink = (a) => MEDIA.test(`${a.getAttribute('href') || ''} ${a.getAttribute('title') || ''}`);

/** A cell's own words: its text without media links, Box lines, blank lines, column breaks. */
function cellWords(cell) {
  const copy = cell.cloneNode(true);
  [...copy.querySelectorAll('a[href]')].filter(isMediaLink).forEach((a) => a.remove());
  [...copy.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')].filter((el) => {
    const t = text(el);
    return t === '[[Blank line]]' || /^box(:| end)/i.test(t) || t === 'Column break';
  }).forEach((el) => el.remove());
  // (text may sit right in the cell, without a paragraph)
  return text(copy).replace(/\[\[[^\]]*\]|\]/g, '').trim();
}

/** The kind of a cell's content: media, text, media+text or empty. */
export function cellKind(cell) {
  const media = cell.querySelector('img, picture') || [...cell.querySelectorAll('a[href]')].some(isMediaLink);
  const words = cellWords(cell).length > 0;
  if (media && words) return 'media+text';
  if (media) return 'media';
  return words ? 'text' : 'empty';
}

/** A media cell with a short caption (a title or a line under the image or video). */
const CAPTION = 120;
const captioned = (cell) => cellKind(cell) === 'media+text' && cellWords(cell).length <= CAPTION;

// named variants that are a standard already (the product intro under the hero: every
// product page has it, the product-detail template owns it)
export const ALREADY_STANDARD = { 'page-intro': 'Page intro' };

/**
 * The standard a block already is, or null: a named standard variant, or one of the standards
 * (a block standardised before: its own options stay, it is not offered a standard again).
 */
export function alreadyStandard(block) {
  const std = Object.keys(STANDARDS).find((c) => block.classList.contains(c));
  if (std) return STANDARDS[std].label;
  const key = Object.keys(ALREADY_STANDARD).find((c) => block.classList.contains(c));
  return key ? ALREADY_STANDARD[key] : null;
}

/** The standards a Columns block can take, given its first row's cells. */
export function eligible(block) {
  if (alreadyStandard(block)) return [];
  const row = block.firstElementChild;
  const cells = row ? [...row.children] : [];
  const kinds = cells.map(cellKind);
  const filled = kinds.filter((k) => k !== 'empty');
  const out = [];
  // media + text: one media cell (a short caption allowed) and one text cell
  const mediaSide = cells.filter((c, i) => kinds[i] === 'media' || captioned(c));
  if (kinds.length === 2 && mediaSide.length === 1 && kinds.includes('text')) out.push('std-media-text');
  if (filled.length >= 2 && filled.length <= 4 && filled.every((k) => k === 'media+text')) out.push('std-cards');
  if (filled.length >= 2 && filled.length <= 4 && filled.every((k) => k === 'text')) out.push('std-text');
  return out;
}

/** A section's settings rows: [key, value, row element]. */
function settingsRows(section) {
  const meta = section.querySelector(':scope > .section-metadata');
  return meta ? [...meta.children].map((row) => {
    const [k, v] = [...row.children];
    return [text(k), text(v), row];
  }) : [];
}

/**
 * (Not used by the layout standards: for the typography step, a named type scale.)
 * Drops the size values from the readable [[…]] tags inside an element: `[[Gold,1.75×]x]` →
 * `[[Gold]x]`, `[[1.75×]x]` → `x` (the opener and its closing bracket). Tags span elements
 * (`[[Gold]<em>…</em>]`), so the text nodes are read in order as one stream.
 * @returns {number} how many size values were dropped
 */
export function dropSizeTags(root) {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  const stack = [];
  let dropped = 0;
  nodes.forEach((node) => {
    let s = node.nodeValue;
    let out = '';
    let i = 0;
    while (i < s.length) {
      const m = s.slice(i).match(/^\[\[([^\]]+)\]/);
      if (m && m[1] !== 'Blank line') {
        const tokens = m[1].split(',').map((t) => t.trim());
        const kept = tokens.filter((t) => !NUMBER.test(t));
        dropped += tokens.length - kept.length;
        stack.push(kept.length > 0);
        if (kept.length) out += `[[${kept.join(',')}]`;
        i += m[0].length;
      } else if (s[i] === ']' && stack.length) {
        if (stack.pop()) out += ']';
        i += 1;
      } else {
        out += s[i];
        i += 1;
      }
    }
    if (out !== s) {
      s = out;
      node.nodeValue = s;
    }
  });
  return dropped;
}

/**
 * How far down a box setting starts its text: top padding + top margin, in % (`top 15%`,
 * `all 5%, margin top 3%` → 8). Entries in other units or for other sides count 0.
 */
function topInset(spec) {
  return spec.split(',').map((e) => e.trim().toLowerCase().match(/^(?:margin )?(?:top|all) (-?[\d.]+)%$/))
    .filter(Boolean).reduce((sum, m) => sum + parseFloat(m[1]), 0);
}

/**
 * The text column's top inset in a Media + text block: its `Text box` part (`column 2: top 15%`)
 * plus a Box line that opens the cell (`Box: top 10%, bottom 10%`).
 */
function textInset(block, textBox, column) {
  let inset = 0;
  (textBox || '').split(';').forEach((part) => {
    const m = part.trim().match(/^column (\d+):\s*(.+)$/i);
    if (m && Number(m[1]) === column) inset += topInset(m[2]);
  });
  const cell = block.firstElementChild.children[column - 1];
  const first = cell && [...cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')]
    .find((el) => text(el) && text(el) !== '[[Blank line]]');
  const box = first && text(first).match(/^box:\s*(.+)$/i);
  if (box) inset += topInset(box[1]);
  return inset;
}

/**
 * The Box lines of a block, standardised: a coloured box (`Box: Gold, top 5%, left 5%`) keeps
 * its colour only (`Box: Gold`, the standard's padding); the other boxes go, and the line that
 * closed a kept box becomes its `Box end`.
 * @returns {{ removed: number, kept: string[] }}
 */
function standardBoxes(block) {
  const open = new Set();
  const kept = [];
  let removed = 0;
  [...block.querySelectorAll('p')].filter((p) => /^box(:| end)/i.test(text(p))).forEach((p) => {
    const m = text(p).match(/^box:\s*([^,]+)/i);
    const colour = m && BOX_COLOURS.includes(m[1].trim().toLowerCase()) ? m[1].trim() : '';
    if (colour && colour.toLowerCase() !== 'white') {
      p.textContent = `Box: ${colour}`;
      open.add(p.parentElement);
      kept.push(colour);
    } else if (open.has(p.parentElement)) {
      p.textContent = 'Box end';
      open.delete(p.parentElement);
    } else {
      p.remove();
      removed += 1;
    }
  });
  return { removed, kept };
}

/** Removes the paragraphs of the given kinds (Box lines, blank lines) inside an element. */
function dropLines(root, test) {
  let n = 0;
  [...root.querySelectorAll('p')].filter((p) => test(text(p))).forEach((p) => {
    p.remove();
    n += 1;
  });
  return n;
}

/**
 * The section with its blockIndex-th block (among the section's blocks) in a standard.
 * @param {Element} sectionEl the section (a top-level <div> of the document, not decorated)
 * @param {number} blockIndex the block's place among the section's blocks
 * @param {string} standard a key of STANDARDS
 * @returns {{ section: Element, changes: string[], ok: boolean }}
 */
export function transform(sectionEl, blockIndex, standard) {
  const section = sectionEl.cloneNode(true);
  const blocks = [...section.querySelectorAll(':scope > div[class]')]
    .filter((b) => !b.classList.contains('section-metadata'));
  const block = blocks[blockIndex];
  const changes = [];
  if (!block || !block.classList.contains('columns')) return { section, changes: ['not a Columns block'], ok: false };
  if (!eligible(block).includes(standard)) {
    return { section, changes: [`this content does not fit ${STANDARDS[standard]?.label || standard}`], ok: false };
  }
  // which of the section's Columns this is: its settings rows are the plain ones (1st) or `(k)`
  const k = blocks.filter((b) => b.classList.contains('columns')).indexOf(block) + 1;
  const hero = !!section.querySelector(':scope > .hero-corp');
  const numbered = settingsRows(section).map(([key]) => key.match(/^(.*?) \((\d+)\)$/)).filter(Boolean);
  const ownKeys = new Set(numbered.filter((m) => Number(m[2]) === k).map((m) => m[1]));
  const widthsShared = !numbered.some((m) => m[1] === 'Column widths');
  // the rows this block reads, as corp-settings applies them (see isolate)
  const mine = (key) => {
    const m = key.match(/^(.*?) \((\d+)\)$/);
    if (m) return Number(m[2]) === k ? m[1] : null;
    if (ownKeys.has(key) || (hero && key === 'Text box')) return null;
    if (key === 'Column widths') return widthsShared || k === 1 ? key : null;
    return k === 1 ? key : null;
  };
  // a shared Column widths row is the neighbours' too: each other Columns block gets its own copy
  const columnsBlocks = blocks.filter((b) => b.classList.contains('columns'));
  const sharedWidths = widthsShared && settingsRows(section).find(([key]) => key === 'Column widths');
  if (sharedWidths && columnsBlocks.length > 1) {
    columnsBlocks.forEach((b, i) => {
      if (b === block) return;
      const copy = sharedWidths[2].cloneNode(true);
      copy.firstElementChild.textContent = `Column widths (${i + 1})`;
      sharedWidths[2].before(copy);
    });
  }

  // the block's classes: columns + the standard + the named options it keeps
  const before = [...block.classList].slice(1);
  const kept = before.filter((c) => KEEP_OPTIONS.includes(c));
  const lost = before.filter((c) => !KEEP_OPTIONS.includes(c) && !c.startsWith('std-'));
  block.className = ['columns', standard, ...kept].join(' ');
  if (lost.length) changes.push(`layout ${lost.join(', ')} replaced by ${STANDARDS[standard].label}`);

  // (an empty trailing cell stays: 2 cards in a 3-column grid keep the width of the 3-up rows
  // beside them, as on the source)

  // settings rows: the block's measured ones go; Column widths becomes the media + text option
  const rows = settingsRows(section);
  // Media + text: a text column set well down (centred beside a tall image) → Text in the middle
  if (standard === 'std-media-text') {
    const column = [...block.firstElementChild.children].findIndex((c) => cellKind(c) === 'text') + 1;
    const textBox = rows.find(([key]) => mine(key) === 'Text box');
    const widths = rows.find(([key]) => mine(key) === 'Column widths');
    const share = (widths && parseFloat(widths[1].split('/')[column - 1]))
      || 100 / block.firstElementChild.children.length;
    const inset = textInset(block, textBox && textBox[1], column);
    if ((inset * share) / 100 >= MIDDLE) {
      block.classList.add('text-middle');
      changes.push(`text set ${inset}% down → Text in the middle`);
    }
  }
  // a coloured column holding several boxes (Cell colours 1: Gold + Box lines: the source's
  // separate gold tiles) → that many coloured boxes, the column itself without colour
  rows.filter(([key]) => mine(key) === 'Cell colours').forEach(([, value, row]) => {
    const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
    const left = parts.filter((part) => {
      const [n, colour] = part.split(':').map((x) => x.trim());
      const cells = [...block.children].map((r) => r.children[Number(n) - 1]).filter(Boolean);
      const lines = cells.flatMap((c) => [...c.querySelectorAll('p')]).filter((p) => /^box:/i.test(text(p)));
      if (lines.length < 2 || !BOX_COLOURS.includes((colour || '').toLowerCase())) return true;
      lines.forEach((p) => { p.textContent = `Box: ${colour}`; });
      // (gold-first would colour the whole column again, behind the boxes)
      if (n === '1') block.classList.remove('gold-first');
      changes.push(`column ${n} (${colour}) shown as its ${lines.length} ${colour} boxes`);
      return false;
    });
    if (left.length === parts.length) return;
    if (left.length) row.lastElementChild.textContent = left.join(', ');
    else row.remove();
  });
  rows.forEach(([key, value, row]) => {
    const name = mine(key);
    if (!name || !row.parentElement) return;
    if (name === 'Column widths' && standard === 'std-media-text') {
      const parts = value.split('/').map((p) => parseFloat(p));
      const cells = [...block.firstElementChild.children];
      const image = cells.findIndex((c) => cellKind(c) === 'media' || captioned(c));
      const share = parts[image];
      if (share && share < 45) block.classList.add('narrow-image');
      else if (share && share > 55) block.classList.add('wide-image');
      if (share && (share < 45 || share > 55)) changes.push(`column widths ${value} → ${share < 45 ? 'Narrow image' : 'Wide image'}`);
      else if (parts.length && new Set(parts).size > 1) changes.push(`column widths ${value} → equal`);
      row.remove();
    } else if (DROP_ROWS.includes(name) && !KEEP_ROWS.includes(name)) {
      changes.push(`${name.toLowerCase()} (${value}) removed`);
      row.remove();
    }
  });

  // the cells' own spacing (text sizes stay: typography is its own step, see the README)
  const boxes = standardBoxes(block);
  if (boxes.removed) changes.push('boxes inside the columns removed');
  if (boxes.kept.length) changes.push(`${[...new Set(boxes.kept)].join(', ')} box${boxes.kept.length > 1 ? 'es' : ''} kept, standard padding`);
  const blanks = dropLines(block, (t) => t === '[[Blank line]]');
  if (blanks) changes.push(`${blanks} blank line${blanks > 1 ? 's' : ''} removed`);

  // a section holding only this block: its own box numbers go too (padding, margin)
  const others = [...section.children].filter((el) => el !== block && !el.classList.contains('section-metadata'));
  // (with other content beside it, the section's rows stay: they are the neighbours' too)
  settingsRows(section).forEach(([key, value, row]) => {
    if (others.length) return;
    if (key === 'Padding' || key === 'Margin') {
      changes.push(`section ${key.toLowerCase()} (${value}) removed`);
      row.remove();
    }
  });
  const meta = section.querySelector(':scope > .section-metadata');
  if (meta && !meta.children.length) meta.remove();
  return { section, changes, ok: true };
}

/**
 * A block's text as a page shows it, letters and digits only: without Box lines, blank lines,
 * the readable tags and the link text of media links (an image link's file name). For finding
 * a document's block on the rendered page.
 */
const mediaLink = (a) => [a.getAttribute('href'), a.getAttribute('title')].find((u) => MEDIA.test(u || ''));
const assetName = (url) => decodeURIComponent(String(url).split('?')[0].split('/').pop())
  .replace(/\.\w+$/, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

function visibleCopy(block, rendered) {
  const copy = block.cloneNode(true);
  if (rendered) {
    // the players' and widgets' own labels are not the author's text
    copy.querySelectorAll('.dm-video-wrapper, button').forEach((e) => e.remove());
  } else {
    [...copy.querySelectorAll('a')].filter(mediaLink).forEach((a) => a.remove());
    dropLines(copy, (t) => /^box(:| end)/i.test(t) || t === '[[Blank line]]');
  }
  return copy;
}

export function matchText(block, rendered = false) {
  return visibleCopy(block, rendered).textContent.replace(/\[\[[^\]]*\]|\]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

/**
 * A block's words and media names, for a looser match when the text differs (players, links
 * a page turns into videos, image-only blocks): the Dice similarity of two token sets.
 */
export function matchTokens(block, rendered = false) {
  const words = visibleCopy(block, rendered).textContent.replace(/\[\[[^\]]*\]|\]/g, ' ')
    .toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1);
  const media = rendered
    ? [...block.querySelectorAll('img[src], [data-dm-src]')].map((e) => e.getAttribute('src') || e.dataset.dmSrc)
    : [...block.querySelectorAll('a')].map(mediaLink).filter(Boolean);
  return new Set([...words, ...media.map((u) => `media:${assetName(u)}`)]);
}
export function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  let both = 0;
  a.forEach((t) => { if (b.has(t)) both += 1; });
  return (2 * both) / (a.size + b.size);
}

/** Whether the blockIndex-th block is the only content of its section (besides its settings). */
export function aloneInSection(sectionEl, blockIndex) {
  const blocks = [...sectionEl.querySelectorAll(':scope > div[class]')]
    .filter((b) => !b.classList.contains('section-metadata'));
  return [...sectionEl.children].every((c) => c === blocks[blockIndex] || c.classList.contains('section-metadata'));
}

/**
 * A copy of the section holding only its blockIndex-th block and that block's settings: its
 * `(k)` rows become the plain ones (it is the section's first Columns now), the other Columns'
 * rows go, the section-wide rows (SHARED_ROWS) stay. For showing one block on its own (boards,
 * the gallery).
 */
export function isolate(sectionEl, blockIndex) {
  const section = sectionEl.cloneNode(true);
  const blocks = [...section.querySelectorAll(':scope > div[class]')]
    .filter((b) => !b.classList.contains('section-metadata'));
  const block = blocks[blockIndex];
  if (!block) return section;
  const k = blocks.filter((b) => b.classList.contains('columns')).indexOf(block) + 1;
  const hero = !!section.querySelector(':scope > .hero-corp');
  [...section.children].forEach((c) => {
    if (c !== block && !c.classList.contains('section-metadata')) c.remove();
  });
  const rows = settingsRows(section);
  const numbered = rows.map(([key]) => key.match(/^(.*?) \((\d+)\)$/)).filter(Boolean);
  const own = new Set(numbered.filter((m) => Number(m[2]) === k).map((m) => m[1]));
  // (corp-settings: a plain Column widths is every block's only when no block has its own; a
  // plain Text box is the hero's when the section has one)
  const widthsShared = !numbered.some((m) => m[1] === 'Column widths');
  const notMine = (key) => own.has(key)
    || (hero && key === 'Text box')
    || (k > 1 && !SHARED_ROWS.includes(key))
    || (k > 1 && key === 'Column widths' && !widthsShared);
  rows.forEach(([key, , row]) => {
    const m = key.match(/^(.*?) \((\d+)\)$/);
    if (m) {
      const [, name, n] = m;
      if (Number(n) === k) row.firstElementChild.textContent = name;
      else row.remove();
    } else if (notMine(key)) {
      row.remove();
    }
  });
  return section;
}
