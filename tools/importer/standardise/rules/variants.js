/*
 * Standardisation: every Columns block of a document → one of the six standard Columns variants
 * (blocks/columns/columns-corp.css "the standard Columns variants"), with its content and none
 * of its presentation:
 * - the variant from the content's shape: page-intro stays; Large Headline with an image →
 *   feature-statement; images only → image-row; an image (a short caption allowed) beside text
 *   → media-text; cells that each hold an image and text → card-grid; text only → text-columns;
 *   other mixes → the nearest (see variantOf);
 * - the block's classes: `columns <variant>` only (widths, borders, boxes, Large Headline …);
 * - the readable tags inside the block go: sizes, fonts, colours, alignment, `[[Blank line]]`;
 *   gold (`[[Gold]…]`) becomes Bold + Italic, the authoring convention for gold (not when the
 *   text is Bold + Italic already, or the tag spans paragraphs: then it is counted);
 * - Box / Box end / Column break lines and empty cells go;
 * - the section's settings rows: the Columns' own (Column widths, Text box, Grid, Cell colours,
 *   Image borders, Columns) go; in a section holding only Columns, its type and spacing rows
 *   (Copy / Label / Heading size, Text, Headings, Blank lines, Padding, Margin) and type styles
 *   (serif, bold-body, center …) go too. Backgrounds, dividers, ids and structural styles
 *   (tabbed, accordion-panel, carousel …) stay: section styles are their own later pass.
 * DOM only, so the same code runs in the browser and in Node (on a Playwright page).
 */

export const VARIANTS = {
  'media-text': 'Media + text',
  'card-grid': 'Cards',
  'text-columns': 'Text columns',
  'feature-statement': 'Feature statement',
  'image-row': 'Image row',
  'page-intro': 'Product intro',
};

const MEDIA = /\/is\/image\/|\/is\/content\/|media-assets|\.m3u8|youtube\.com|youtu\.be|vimeo\.com|\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
const LINE = /^(box(:| end)|column break$|\[\[blank line\]\]$)/i;
const CAPTION = 120;
const GOLD = ['gold', 'dark-gold'];
// the Columns' own settings rows (plain, or `(k)` for the section's k-th Columns)
const BLOCK_ROWS = ['Column widths', 'Text box', 'Grid', 'Cell colours', 'Image borders', 'Columns', 'Column'];
// a section's type and spacing rows (go when the section holds only Columns)
const SECTION_ROWS = ['Copy size', 'Label size', 'Heading size', 'Text', 'Headings', 'Blank lines', 'Padding', 'Margin'];
// type styles (go when the section holds only Columns)
const TYPE_STYLES = ['serif', 'h-serif', 'bold-body', 'center', 'blue', 'btn-blue', 'large-headline', 'gray-lead'];
const TYPE_STYLE = /^(p|h|label|ps)-[\d-]+$/;

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const isMediaLink = (a) => MEDIA.test(`${a.getAttribute('href') || ''} ${a.getAttribute('title') || ''}`);

function cellWords(cell) {
  const copy = cell.cloneNode(true);
  [...copy.querySelectorAll('a[href]')].filter(isMediaLink).forEach((a) => a.remove());
  [...copy.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')].filter((el) => LINE.test(text(el)))
    .forEach((el) => el.remove());
  return text(copy).replace(/\[\[[^\]]*\]|\]/g, '').trim();
}

/** media, text, media+text or empty */
export function cellKind(cell) {
  const media = cell.querySelector('img, picture, video, iframe') || [...cell.querySelectorAll('a[href]')].some(isMediaLink);
  const words = cellWords(cell).length > 0;
  if (media && words) return 'media+text';
  if (media) return 'media';
  return words ? 'text' : 'empty';
}
const captioned = (cell) => cellKind(cell) === 'media+text' && cellWords(cell).length <= CAPTION;

/** a row's variant, from its filled cells */
function rowVariant(cells) {
  const kinds = cells.map(cellKind).filter((k) => k !== 'empty');
  const filled = cells.filter((c) => cellKind(c) !== 'empty');
  if (!kinds.length) return null;
  if (kinds.every((k) => k === 'media')) return 'image-row';
  if (kinds.every((k) => k === 'text')) return 'text-columns';
  if (filled.length === 2) {
    const mediaSide = filled.filter((c) => cellKind(c) === 'media' || captioned(c)).length;
    const textSide = filled.filter((c) => cellKind(c) === 'text').length;
    if (mediaSide === 1 && textSide === 1) return 'media-text';
    // an image beside a cell holding an image and text: the image and its text
    if (kinds.includes('media')) return 'media-text';
  }
  if (kinds.every((k) => k === 'media+text')) return 'card-grid';
  // a mix: text beside cards → cards; images beside cards → cards
  return 'card-grid';
}

/**
 * The variant of a Columns block.
 * @param {Element} block the block (not decorated)
 * @returns {string} a key of VARIANTS
 */
export function variantOf(block) {
  if (block.classList.contains('page-intro')) return 'page-intro';
  const rows = [...block.children].map((r) => [...r.children]);
  const all = rows.flat();
  const media = all.some((c) => ['media', 'media+text'].includes(cellKind(c)));
  if (block.classList.contains('large-headline')) return media ? 'feature-statement' : 'text-columns';
  const votes = {};
  rows.map(rowVariant).filter(Boolean).forEach((v) => { votes[v] = (votes[v] || 0) + 1; });
  const first = rowVariant(rows[0] || []);
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1] || (a[0] === first ? -1 : 1))[0];
  return best ? best[0] : 'text-columns';
}

/**
 * Drops the readable tags inside an element; gold becomes Bold + Italic.
 * @returns {{tags: number, gold: number, goldLost: number, blanks: number}}
 */
export function stripTags(root) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  const stack = [];
  const pairs = [];
  const out = {
    tags: 0, gold: 0, goldLost: 0, blanks: 0, labels: 0,
  };
  nodes.forEach((node) => {
    const s = node.nodeValue;
    let res = '';
    let i = 0;
    let changed = false;
    while (i < s.length) {
      const blank = s.slice(i).match(/^\[\[\s*blank line\s*\]\]/i);
      const m = s.slice(i).match(/^\[\[([^\]]+)\]/);
      if (blank) {
        out.blanks += 1;
        i += blank[0].length;
        changed = true;
      } else if (m) {
        const tokens = m[1].split(',').map((t) => t.trim().toLowerCase());
        const gold = tokens.some((t) => GOLD.includes(t));
        stack.push({ gold, node, offset: res.length });
        out.tags += 1;
        i += m[0].length;
        changed = true;
      } else if (s[i] === ']' && stack.length) {
        const open = stack.pop();
        if (open.gold && !stack.some((x) => x.gold)) {
          pairs.push({
            startNode: open.node, startOffset: open.offset, endNode: node, endOffset: res.length,
          });
        }
        i += 1;
        changed = true;
      } else {
        res += s[i];
        i += 1;
      }
    }
    if (changed) node.nodeValue = res;
  });
  // (offsets were taken in the new text of each node: a node's earlier pairs end before its
  // later ones start, so wrapping from the last pair back keeps the others' positions)
  const blockOf = (n) => n.parentElement && n.parentElement.closest('p, li, h1, h2, h3, h4, h5, h6, td, th, div');
  pairs.reverse().forEach((pr) => {
    if (blockOf(pr.startNode) !== blockOf(pr.endNode)) {
      out.goldLost += 1;
      return;
    }
    const range = doc.createRange();
    range.setStart(pr.startNode, Math.min(pr.startOffset, pr.startNode.nodeValue.length));
    range.setEnd(pr.endNode, Math.min(pr.endOffset, pr.endNode.nodeValue.length));
    if (range.collapsed || !range.toString().trim()) return;
    const holder = range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    const within = (tag) => !!holder.closest(tag) && root.contains(holder.closest(tag));
    if ((within('strong') || within('b')) && (within('em') || within('i'))) {
      (holder.closest('strong') || holder.closest('b')).dataset.gold = 'true';
      out.gold += 1;
      return;
    }
    // (only what is missing: Italic inside Bold text, Bold inside Italic text, else both)
    const bold = within('strong') || within('b');
    const italic = within('em') || within('i');
    const outer = doc.createElement(bold ? 'em' : 'strong');
    let inner = outer;
    if (!bold && !italic) {
      inner = doc.createElement('em');
      outer.append(inner);
    }
    inner.append(range.extractContents());
    outer.dataset.gold = 'true';
    range.insertNode(outer);
    out.gold += 1;
  });
  // Bold + Italic copy that was not gold (the corp Futura bold label: corp copy kept its colour)
  // is Bold: Bold + Italic is gold now, the authoring convention
  [...root.querySelectorAll(':is(p, li) :is(em, i)')].forEach((em) => {
    const bold = em.closest('strong, b') || em.querySelector('strong, b');
    if (!bold || bold.closest('[data-gold]') || bold.querySelector('[data-gold]') || em.closest('[data-gold]')) return;
    // (a Bold + Italic link is the gold button / link of the conventions: it stays)
    if (em.closest('a') || em.querySelector('a') || bold.closest('a') || bold.querySelector('a')) return;
    em.replaceWith(...em.childNodes);
    out.labels += 1;
  });
  root.querySelectorAll('[data-gold]').forEach((e) => e.removeAttribute('data-gold'));
  // (wrapping can leave empty text nodes and empty inline elements behind)
  [...root.querySelectorAll('strong, em, b, i, span')].filter((e) => !e.textContent && !e.querySelector('img, picture, br'))
    .forEach((e) => e.remove());
  return out;
}

// the desktop size (px) of a size token in 14px copy (rules/typography.js has the full rule)
const NAMED = {
  small: 11.2,
  body: 14,
  large: 17.5,
  lead: 21,
  subtitle: 24.5,
  title: 28,
  headline: 35,
  display: 42,
  statement: 56,
  hero: 70,
  fluid: 14,
};
function tokenPx(token) {
  const t = token.trim().toLowerCase();
  const m = t.match(/^([\d.]+)\s*(×|x|vw)$/);
  if (m) return Number(m[1]) * 14;
  return NAMED[t] || null;
}

/**
 * Paragraphs that are headings in all but name: the whole text in size tags of at least
 * Lead (21px). Marked to become the variant's title (h3), or in a feature-statement its
 * statement (h2, 28px and up). A paragraph that is only a link (a button) stays.
 */
function markTitles(block, variant) {
  [...block.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('img, picture') || (p.querySelector('a') && !p.textContent.replace(p.querySelector('a').textContent, '').replace(/\[\[[^\]]*\]|\]/g, '').trim())) return;
    let depth = 0;
    let outside = '';
    let max = 0;
    (p.textContent.match(/\[\[[^\]]+\]|\]|[^[\]]+|\[/g) || []).forEach((part) => {
      if (part.startsWith('[[')) {
        depth += 1;
        part.slice(2, -1).split(',').map(tokenPx).filter(Boolean)
          .forEach((px) => { max = Math.max(max, px); });
      } else if (part === ']') depth = Math.max(0, depth - 1);
      else if (!depth) outside += part;
    });
    if (outside.replace(/[\s.,:;!?*]/g, '') || max < 21) return;
    // (a banner's statement lines: 35px and up are its h2; its copy stays copy)
    if (variant === 'banner' || variant === 'banner-light') {
      if (max >= 35) p.dataset.promote = 'H2';
      return;
    }
    if (variant === 'product-hero') return;
    p.dataset.promote = variant === 'feature-statement' && max >= 28 ? 'H2' : 'H3';
  });
}

function promoteTitles(block) {
  let n = 0;
  block.querySelectorAll('p[data-promote]').forEach((p) => {
    const h = p.ownerDocument.createElement(p.dataset.promote);
    h.append(...p.childNodes);
    p.replaceWith(h);
    n += 1;
  });
  return n;
}

function settingsRows(section) {
  const meta = section.querySelector(':scope > .section-metadata');
  return meta ? [...meta.children].map((row) => {
    const [k, v] = [...row.children];
    return [text(k), text(v), row];
  }) : [];
}

/** the two standard Cards variants (blocks/cards-corp/cards-corp.css) */
export const CARD_VARIANTS = {
  resources: 'Resources',
  teaser: 'Teaser',
};

/** the Cards variant of a cards-corp block: Resources stay, everything else is a Teaser */
export const cardVariantOf = (block) => (block.classList.contains('resources') ? 'resources' : 'teaser');

/** the three standard Hero variants (blocks/hero-corp/hero-corp.css) */
export const HERO_VARIANTS = {
  'product-hero': 'Product hero',
  banner: 'Banner',
  'banner-light': 'Banner (light text)',
};
const LIGHT = ['white', 'light-gray', 'silver'];

/**
 * The Hero variant of a hero-corp block: the product hero (image right), else a banner; a
 * banner whose text was light (a White / Light-Gray / Silver tag, a dark box) has light text.
 */
export function heroVariantOf(block) {
  if (block.classList.contains('image-right')) return 'product-hero';
  const tags = [...block.textContent.matchAll(/\[\[([^\]]+)\]/g)].flatMap((m) => m[1].split(',').map((t) => t.trim().toLowerCase()));
  if (tags.some((t) => LIGHT.includes(t)) || block.classList.contains('box-dark-gray')) return 'banner-light';
  return 'banner';
}

/** a block's content without its presentation (lines, tags; title paragraphs → headings) */
function cleanContent(block, variant, counts) {
  // lines (Box, Box end, Column break, blank lines on their own) go
  [...block.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => LINE.test(text(el))).forEach((el) => {
    el.remove();
    counts.lines += 1;
  });
  if (variant !== 'resources') markTitles(block, variant);
  const t = stripTags(block);
  ['tags', 'gold', 'goldLost', 'blanks', 'labels'].forEach((k) => { counts[k] += t[k]; });
  counts.titles += promoteTitles(block);
}

/**
 * Every Columns and Cards block of the document on a standard variant.
 * @param {Element} body the document's body (sections as top-level divs), changed in place
 * @returns {{blocks: {section: number, block: number, type: string, from: string,
 *   variant: string}[], counts: object, changes: string[]}}
 */
export function transformDocument(body) {
  const blocks = [];
  const counts = {
    tags: 0,
    gold: 0,
    goldLost: 0,
    labels: 0,
    titles: 0,
    blanks: 0,
    lines: 0,
    emptyCells: 0,
    rows: 0,
    styles: 0,
  };
  [...body.children].forEach((section, si) => {
    const own = [...section.children].filter((c) => !c.classList.contains('section-metadata'));
    const columns = own.filter((c) => c.classList.contains('columns'));
    const cards = own.filter((c) => c.classList.contains('cards-corp'));
    const heroes = own.filter((c) => c.classList.contains('hero-corp'));
    if (!columns.length && !cards.length && !heroes.length) return;
    // (a section holding only standard blocks: its type rows and styles are theirs)
    const STANDARD = ['columns', 'cards-corp', 'hero-corp'];
    const onlyStandard = own.every((c) => STANDARD.some((n) => c.classList.contains(n)));
    const hero = heroes.length > 0;
    columns.forEach((block) => {
      const variant = variantOf(block);
      const from = block.className;
      cleanContent(block, variant, counts);
      // empty cells go (a row keeps one)
      [...block.children].forEach((row) => {
        [...row.children].filter((c) => cellKind(c) === 'empty' && !c.querySelector('img, picture')).forEach((c) => {
          if (row.children.length > 1) {
            c.remove();
            counts.emptyCells += 1;
          }
        });
        if (!row.children.length || [...row.children].every((c) => cellKind(c) === 'empty')) row.remove();
      });
      block.className = `columns ${variant}`;
      blocks.push({
        section: si, block: own.indexOf(block), type: 'columns', from, variant,
      });
    });
    // Cards: one card per row (image cell, body cell) as authored; an empty image cell stays
    cards.forEach((block) => {
      const variant = cardVariantOf(block);
      const from = block.className;
      cleanContent(block, variant, counts);
      block.className = `cards-corp ${variant}`;
      blocks.push({
        section: si, block: own.indexOf(block), type: 'cards', from, variant,
      });
    });
    // Hero: one slide (image rows, the text cell) as authored; its options go (text position,
    // sizes, contained, shadow, boxes): `hero-corp image-slide <variant>`
    heroes.forEach((block) => {
      const variant = heroVariantOf(block);
      const from = block.className;
      cleanContent(block, variant, counts);
      block.className = `hero-corp image-slide ${variant}`;
      blocks.push({
        section: si, block: own.indexOf(block), type: 'hero', from, variant,
      });
    });
    // settings rows (a hero's Text box is its own, it goes with its options)
    settingsRows(section).forEach(([key, value, row]) => {
      const name = key.replace(/ \(\d+\)$/, '');
      const blockRow = (columns.length && BLOCK_ROWS.includes(name) && !(hero && name === 'Text box' && key === name))
        || (hero && name === 'Text box');
      if (blockRow || (onlyStandard && SECTION_ROWS.includes(name))) {
        row.remove();
        counts.rows += 1;
      } else if (onlyStandard && key === 'style') {
        const styles = value.split(',').map((x) => x.trim()).filter(Boolean);
        const kept = styles.filter((x) => !TYPE_STYLES.includes(x) && !TYPE_STYLE.test(x));
        if (kept.length === styles.length) return;
        counts.styles += styles.length - kept.length;
        if (kept.length) row.lastElementChild.textContent = kept.join(', ');
        else row.remove();
      }
    });
    const meta = section.querySelector(':scope > .section-metadata');
    if (meta && !meta.children.length) meta.remove();
  });
  const changes = [];
  const by = {};
  blocks.forEach((b) => { by[b.variant] = (by[b.variant] || 0) + 1; });
  const label = (k) => VARIANTS[k] || CARD_VARIANTS[k] || HERO_VARIANTS[k];
  if (blocks.length) changes.push(`${blocks.length} blocks → ${Object.entries(by).map(([k, n]) => `${label(k)} ${n}`).join(', ')}`);
  if (counts.tags) changes.push(`${counts.tags} tags removed (${counts.gold} gold → Bold + Italic${counts.goldLost ? `, ${counts.goldLost} gold across paragraphs lost` : ''})`);
  if (counts.titles) changes.push(`${counts.titles} title-sized paragraphs → headings`);
  if (counts.labels) changes.push(`${counts.labels} Bold + Italic labels → Bold`);
  if (counts.lines + counts.blanks) changes.push(`${counts.lines + counts.blanks} box / blank lines removed`);
  if (counts.rows + counts.styles) changes.push(`${counts.rows} settings rows and ${counts.styles} type styles removed`);
  return { blocks, counts, changes };
}
