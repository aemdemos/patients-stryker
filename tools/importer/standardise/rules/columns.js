/*
 * Standardise pilot: the content transfer rules of the Columns block. A Columns instance (a
 * section of the readable-settings document, before decoration) → the same content in one of
 * the standard Columns variants. DOM only (no browser or Node APIs), so the same code builds
 * the candidates in the browser (scripts/standardise-preview.js) and rewrites the documents in
 * Node (apply.mjs, on a Playwright page as the DOM).
 *
 * What a standard keeps: the cells and their content, design names (section styles such as
 * serif or a background, Cell colours and Image borders by their palette names, named text
 * styles such as [[Gold]] or [[Large]]). What it drops: the measured values (Text box
 * paddings, Grid, Column widths other than its own options, size values such as [[1.75×]] or
 * [[5vw]], Box lines, blank lines inside the cells). Every change is reported in plain words.
 */

export const STANDARDS = {
  'std-media-text': {
    label: 'Media + text',
    description: 'An image or video beside its text, side by side from 600px, stacked on phones (image first). '
      + 'Options: Narrow image (one third) or Wide image (two thirds).',
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
// the named block options a standard keeps (type scale, alignment)
const KEEP_OPTIONS = ['large-headline', 'center'];
// settings rows that are design names (kept) and measured values (dropped)
const KEEP_ROWS = ['Cell colours', 'Image borders'];
const DROP_ROWS = ['Text box', 'Grid', 'Column widths', 'Columns'];
const NUMBER = /^[\d.]+(×|vw)$/;

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** The kind of a cell's content: media, text, media+text or empty. */
export function cellKind(cell) {
  const links = [...cell.querySelectorAll('a[href]')];
  const media = cell.querySelector('img, picture')
    || links.some((a) => MEDIA.test(a.getAttribute('href')) || MEDIA.test(a.getAttribute('title') || ''));
  const words = [...cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')]
    .filter((el) => !el.querySelector('h1, h2, h3, h4, h5, h6, p, li'))
    .some((el) => {
      const t = text(el);
      if (!t || t === '[[Blank line]]' || /^box(:| end)/i.test(t) || t === 'Column break') return false;
      const a = el.querySelector('a[href]');
      return !(a && text(a) === t && MEDIA.test(`${a.getAttribute('href')} ${a.getAttribute('title') || ''}`));
    });
  if (media && words) return 'media+text';
  if (media) return 'media';
  return words ? 'text' : 'empty';
}

// named variants that are a standard already (the product intro under the hero: every
// product page has it, the product-detail template owns it)
export const ALREADY_STANDARD = { 'page-intro': 'Page intro' };

/** The standard a block already is, or null. */
export function alreadyStandard(block) {
  const key = Object.keys(ALREADY_STANDARD).find((c) => block.classList.contains(c));
  return key ? ALREADY_STANDARD[key] : null;
}

/** The standards a Columns block can take, given its first row's cells. */
export function eligible(block) {
  if (alreadyStandard(block)) return [];
  const row = block.firstElementChild;
  const kinds = row ? [...row.children].map(cellKind) : [];
  const filled = kinds.filter((k) => k !== 'empty');
  const out = [];
  if (kinds.length === 2 && [...filled].sort().join() === 'media,text') out.push('std-media-text');
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
 * Drops the size values from the readable [[…]] tags inside an element: `[[Gold,1.75×]x]` →
 * `[[Gold]x]`, `[[1.75×]x]` → `x` (the opener and its closing bracket). Tags span elements
 * (`[[Gold]<em>…</em>]`), so the text nodes are read in order as one stream.
 * @returns {number} how many size values were dropped
 */
function dropSizeTags(root) {
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
  const mine = (key) => {
    const m = key.match(/^(.*?) \((\d+)\)$/);
    if (m) return Number(m[2]) === k ? m[1] : null;
    return k === 1 || key === 'Column widths' ? key : null;
  };

  // the block's classes: columns + the standard + the named options it keeps
  const before = [...block.classList].slice(1);
  const kept = before.filter((c) => KEEP_OPTIONS.includes(c));
  const lost = before.filter((c) => !KEEP_OPTIONS.includes(c) && !c.startsWith('std-'));
  block.className = ['columns', standard, ...kept].join(' ');
  if (lost.length) changes.push(`layout ${lost.join(', ')} replaced by ${STANDARDS[standard].label}`);

  // the empty trailing cells of a row (a 4-column control with 2 cards) go
  [...block.children].forEach((row) => {
    while (row.children.length > 2 && row.lastElementChild && cellKind(row.lastElementChild) === 'empty') {
      row.lastElementChild.remove();
      changes.push('an empty column removed');
    }
  });

  // settings rows: the block's measured ones go; Column widths becomes the media + text option
  const rows = settingsRows(section);
  rows.forEach(([key, value, row]) => {
    const name = mine(key);
    if (!name) return;
    if (name === 'Column widths' && standard === 'std-media-text') {
      const parts = value.split('/').map((p) => parseFloat(p));
      const cells = [...block.firstElementChild.children];
      const image = cells.findIndex((c) => cellKind(c) === 'media');
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

  // the cells' own measured formatting
  const sizes = dropSizeTags(block);
  if (sizes) changes.push(`${sizes} text size${sizes > 1 ? 's' : ''} set to the standard`);
  const boxes = dropLines(block, (t) => /^box(:| end)/i.test(t));
  if (boxes) changes.push('boxes inside the columns removed');
  const blanks = dropLines(block, (t) => t === '[[Blank line]]');
  if (blanks) changes.push(`${blanks} blank line${blanks > 1 ? 's' : ''} removed`);

  // a section holding only this block: its own box numbers go too (padding, margin, number sizes)
  const others = [...section.children].filter((el) => el !== block && !el.classList.contains('section-metadata'));
  settingsRows(section).forEach(([key, value, row]) => {
    if (others.length === 0 && (key === 'Padding' || key === 'Margin')) {
      changes.push(`section ${key.toLowerCase()} (${value}) removed`);
      row.remove();
    } else if (/^(Copy size|Heading size|Label size)$/.test(key) && NUMBER.test(value)) {
      changes.push(`${key.toLowerCase()} ${value} set to the standard`);
      row.remove();
    }
  });
  const meta = section.querySelector(':scope > .section-metadata');
  if (meta && !meta.children.length) meta.remove();
  return { section, changes, ok: true };
}
