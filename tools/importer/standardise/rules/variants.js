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
// (a flex section's `Columns | 1 + 2`, its pieces per source column, is structure: it stays)
const BLOCK_ROWS = ['Column widths', 'Text box', 'Grid', 'Cell colours', 'Image borders', 'Column'];
// a section's type and spacing rows (go when the section holds only Columns)
const SECTION_ROWS = ['Copy size', 'Label size', 'Heading size', 'Text', 'Headings', 'Blank lines', 'Padding', 'Margin'];
// type styles (go when the section holds only Columns)
const TYPE_STYLES = ['serif', 'h-serif', 'bold-body', 'center', 'blue', 'btn-blue', 'large-headline', 'gray-lead'];
const TYPE_STYLE = /^(p|h|label|ps)-[\d-]+$/;

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
// an element's text without the readable tags
const plainText = (el) => el.textContent.replace(/\[\[[^\]]*\]|\]/g, '').replace(/\s+/g, ' ').trim();
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
export function stripTags(root, skip = () => false) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!skip(n)) nodes.push(n);
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
        // (text for screen readers only: its tag stays, it is not presentation)
        const keep = tokens.includes('visually-hidden');
        stack.push({
          gold, keep, node, offset: res.length,
        });
        if (keep) res += m[0];
        else out.tags += 1;
        i += m[0].length;
        changed = true;
      } else if (s[i] === ']' && stack.length) {
        const open = stack.pop();
        if (open.keep) res += ']';
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
  [...root.querySelectorAll(':is(p, li) :is(em, i)')].filter((em) => !skip(em) && !em.closest('[data-promote]')).forEach((em) => {
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
function markTitles(block, variant, skip = () => false) {
  [...block.querySelectorAll('p')].filter((p) => !skip(p)).forEach((p) => {
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
    // (a heading is short: a long sized paragraph stays copy)
    if (outside.replace(/[\s.,:;!?*]/g, '') || max < 21 || plainText(p).length > CAPTION) return;
    // (a banner's statement lines: 35px and up are its h2; its copy stays copy)
    if (variant === 'banner' || variant === 'banner-light') {
      if (max >= 35) p.dataset.promote = 'H2';
      return;
    }
    if (variant === 'product-hero') return;
    if (variant === 'statement') {
      if (max >= 28) p.dataset.promote = 'H2';
      return;
    }
    if (variant === 'default') {
      p.dataset.promote = max >= 28 ? 'H2' : 'H3';
      return;
    }
    p.dataset.promote = variant === 'feature-statement' && max >= 28 ? 'H2' : 'H3';
  });
}

/**
 * A title line joined to its copy by a line break (`<p><em><strong>T</strong></em><br>copy</p>`):
 * when the line before the break is Bold + Italic (gold) or in size tags of 21px and up, it is
 * split off as a heading (h2 from 28px or in a statement, else h3); a plain Bold lead-in stays.
 * @returns {number} how many were split
 */
function splitTitles(root, skip = () => false, statement = false) {
  let n = 0;
  [...root.querySelectorAll('p')].filter((p) => !skip(p)).forEach((p) => {
    const nodes = [...p.childNodes].filter((x) => !(x.nodeType === 3 && !x.nodeValue.trim()));
    const [first, br, ...rest] = nodes;
    if (!first || first.nodeType !== 1 || !br || br.nodeName !== 'BR' || !rest.length) return;
    if (!first.matches('strong, b, em, i') || first.querySelector('a, img, picture')) return;
    const inner = first.firstElementChild;
    const boldItalic = !!inner && first.children.length === 1
      && ((first.matches('em, i') && inner.matches('strong, b')) || (first.matches('strong, b') && inner.matches('em, i')));
    const max = Math.max(0, ...[...first.textContent.matchAll(/\[\[([^\]]+)\]/g)]
      .flatMap((m) => m[1].split(',').map(tokenPx)).filter(Boolean));
    if (!boldItalic && max < 21) return;
    if (plainText(first).length > CAPTION || !plainText(first)) return;
    const h = p.ownerDocument.createElement(statement || max >= 28 ? 'H2' : 'H3');
    p.before(h);
    h.append(first);
    br.remove();
    n += 1;
  });
  return n;
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
  if (!['resources', 'product-hero', 'accordion', 'statistics'].includes(variant)) counts.titles += splitTitles(block, () => false, variant === 'feature-statement');
  if (!['resources', 'accordion', 'statistics'].includes(variant)) markTitles(block, variant);
  const t = stripTags(block);
  ['tags', 'gold', 'goldLost', 'blanks', 'labels'].forEach((k) => { counts[k] += t[k]; });
  counts.titles += promoteTitles(block);
}

/** the standard section placements (styles-corp.css): width and start, in container shares */
export const PLACEMENTS = {
  'half-left': [1 / 2, 0],
  'half-right': [1 / 2, 1 / 2],
  'third-left': [1 / 3, 0],
  'two-thirds-left': [2 / 3, 0],
  'quarter-left': [1 / 4, 0],
  'centre-third': [1 / 3, 1 / 3],
};
const fraction = (t) => {
  const m = String(t || '').match(/(\d+)\s*\/\s*(\d+)/);
  return m ? Number(m[1]) / Number(m[2]) : null;
};
/** `Column | width 1/2, from 1/2` → the nearest placement */
export function placementOf(value) {
  const w = fraction((value.match(/width\s+([\d/ ]+)/i) || [])[1]);
  const start = fraction((value.match(/from\s+([\d/ ]+)/i) || [])[1]) || 0;
  if (!w || w >= 0.95) return null;
  const distance = ([pw, ps]) => Math.abs(pw - w) + Math.abs(ps - start);
  return Object.entries(PLACEMENTS).map(([k, v]) => [k, distance(v)])
    .sort((a, b) => a[1] - b[1])[0][0];
}
/** `Column widths | 33% / 67%` of two parts → wide-first / wide-last (null: equal) */
export function wideOf(value) {
  const parts = String(value || '').split('/').map((x) => parseFloat(x)).filter((x) => !Number.isNaN(x));
  if (parts.length !== 2 || Math.abs(parts[0] - parts[1]) < 10) return null;
  return parts[0] > parts[1] ? 'wide-first' : 'wide-last';
}
const addStyle = (section, value) => {
  let meta = section.querySelector(':scope > .section-metadata');
  const doc = section.ownerDocument;
  if (!meta) {
    meta = doc.createElement('div');
    meta.className = 'section-metadata';
    section.append(meta);
  }
  let row = [...meta.children].find((r) => text(r.firstElementChild) === 'style');
  if (!row) {
    row = doc.createElement('div');
    ['style', ''].forEach((t) => {
      const c = doc.createElement('div');
      c.textContent = t;
      row.append(c);
    });
    meta.prepend(row);
  }
  const styles = text(row.lastElementChild).split(',').map((x) => x.trim()).filter(Boolean);
  if (!styles.includes(value)) styles.push(value);
  row.lastElementChild.textContent = styles.join(', ');
};

/**
 * Section layouts before the other passes: a `Column` row (content in one column of an AEM
 * column control) → a placement style; a flex section's `Column widths` (or its flex-67-33 /
 * flex-33-67 style) → wide-first / wide-last. The rows go.
 */
function standardLayouts(body, counts) {
  [...body.children].forEach((section) => {
    const rows = settingsRows(section);
    const columnsBlocks = [...section.children].filter((c) => c.classList.contains('columns'));
    rows.forEach(([key, value, row]) => {
      if (key === 'Column') {
        const place = placementOf(value);
        if (place) {
          addStyle(section, place);
          counts.layouts[place] = (counts.layouts[place] || 0) + 1;
        }
        row.remove();
        counts.rows += 1;
      }
    });
    const style = settingsRows(section).find(([key]) => key === 'style');
    const styles = style ? style[1].split(',').map((x) => x.trim()) : [];
    if (!styles.includes('flex')) return;
    let wide = null;
    if (styles.includes('flex-67-33')) wide = 'wide-first';
    if (styles.includes('flex-33-67')) wide = 'wide-last';
    const widths = settingsRows(section).find(([key]) => key === 'Column widths');
    if (!wide && widths && !columnsBlocks.length) wide = wideOf(widths[1]);
    if (widths && !columnsBlocks.length) {
      widths[2].remove();
      counts.rows += 1;
    }
    if (style && (styles.includes('flex-67-33') || styles.includes('flex-33-67'))) {
      style[2].lastElementChild.textContent = styles.filter((x) => !/^flex-\d/.test(x)).join(', ');
    }
    if (wide) {
      addStyle(section, wide);
      counts.layouts[wide] = (counts.layouts[wide] || 0) + 1;
    }
  });
}

/** the four standard section backgrounds (styles/styles-corp.css) and what becomes each */
export const BACKGROUNDS = {
  'grey-band': ['bg-light-gray', 'bg-silver'],
  'gold-box': ['bg-gold', 'bg-golden-gradient'],
  'purple-band': ['bg-dark-purple-gradient', 'bg-purple', 'bg-dark-orange-gradient'],
  'blue-band': ['bg-dark-blue-gradient', 'dark', 'bg-dark-gray', 'bg-blue', 'bg-teal'],
};
// background modifiers that go with the old backgrounds (the standard ones have one look)
const BG_MODIFIERS = ['gradient-inverse', 'gradient-top-to-bottom', 'stripe', 'shadow-box', 'fade'];
// a band's / box's own spacing rows (the standard spacing replaces them)
const BG_ROWS = ['Padding', 'Margin', 'Blank lines'];

/**
 * Every section's background on one of the four standard ones: bg-white goes (the page is
 * white), the others map onto grey-band / gold-box / purple-band / blue-band; their modifiers,
 * `boxed` (the gold box and the bands own their shape) and their spacing rows go.
 */
function standardBackgrounds(body, counts) {
  [...body.children].forEach((section) => {
    const rows = settingsRows(section);
    const style = rows.find(([key]) => key === 'style');
    if (!style) return;
    const [, value, row] = style;
    const styles = value.split(',').map((x) => x.trim()).filter(Boolean);
    const old = styles.filter((x) => x === 'bg-white' || Object.values(BACKGROUNDS).flat().includes(x));
    if (!old.length) return;
    const target = Object.keys(BACKGROUNDS).find((k) => BACKGROUNDS[k].includes(old.find((x) => x !== 'bg-white')));
    const kept = styles.filter((x) => !old.includes(x) && !BG_MODIFIERS.includes(x) && !(target && x === 'boxed'));
    if (target) kept.push(target);
    counts.backgrounds[target || 'none'] = (counts.backgrounds[target || 'none'] || 0) + 1;
    if (kept.length) row.lastElementChild.textContent = kept.join(', ');
    else row.remove();
    if (target) {
      rows.filter(([key]) => BG_ROWS.includes(key)).forEach(([, , r]) => {
        r.remove();
        counts.rows += 1;
      });
    }
    const meta = section.querySelector(':scope > .section-metadata');
    if (meta && !meta.children.length) meta.remove();
  });
}

// section styles of the default content that go: sizes, fonts, alignment, box spacing, button
// colours, image borders, spacer sizes (the standard keeps divider, the statement (Large
// Headline), disclaimer, the four backgrounds and the structural styles)
const TEXT_DROP = ['serif', 'h-serif', 'bold-body', 'center', 'blue', 'btn-blue', 'btn-purple', 'gray-lead',
  'boxed', 'references-spaced', 'no-gap', 'shadow-box', 'fade', 'stripe', 'image-border-black',
  'image-border-grey', 'large', 'xlarge', 'xxlarge', 'spacer'];
const TEXT_DROP_RE = /^(p|h|label|ps)-[\d-]+$|^col-|^flex-\d/;
// a text section's type, spacing and placement rows
const TEXT_ROWS = ['Copy size', 'Label size', 'Heading size', 'Text', 'Headings', 'Blank lines', 'Padding',
  'Margin', 'Column', 'Column widths'];

// the standard text sets of default content (section styles; styles-corp.css "the standard text
// sets"): the set of a look (font family, size in px)
export const TEXT_SETS = {
  '': 'Default (Humanist 14)',
  'text-large': 'Large (Humanist 17.5)',
  'text-x-large': 'Extra large (Humanist 21)',
  'text-serif': 'Serif (Egyptienne 21)',
  'text-serif-subtitle': 'Serif subtitle (Egyptienne 24.5)',
  'text-serif-title': 'Serif title (Egyptienne 28)',
};
export function textSetOf(font, size) {
  if (font === 'serif') {
    if (size <= 22.75) return 'text-serif';
    return size <= 26.25 ? 'text-serif-subtitle' : 'text-serif-title';
  }
  if (size <= 15.75) return '';
  return size <= 19.25 ? 'text-large' : 'text-x-large';
}

/**
 * The text set of a section's own text, and its accent lines: each paragraph's original look
 * (the section's serif style and copy size, the paragraph's own font and size tags); the set of
 * the most frequent look; a serif line in a sans set, or a clearly larger serif line in a serif
 * set, becomes the set's accent line (wholly Italic). Titles (promoted), labels, gold lines,
 * buttons and short lines don't count. Before the tags go.
 */
function standardTextSet(section, { serif, copyPx }, skip, counts) {
  const look = (el) => {
    const tokens = [...el.textContent.matchAll(/\[\[([^\]]+)\]/g)]
      .flatMap((m) => m[1].split(',').map((t) => t.trim().toLowerCase()));
    let font = serif ? 'serif' : 'sans';
    let size = copyPx;
    tokens.forEach((t) => {
      if (t === 'serif') font = 'serif';
      else if (t === 'sans' || t === 'humanist') font = 'sans';
      else if (tokenPx(t)) size = tokenPx(t);
    });
    return { font, size };
  };
  const paras = [...section.querySelectorAll('p, li')].filter((el) => !skip(el) && !el.closest('[data-promote]'))
    .filter((el) => {
      const words = plainText(el);
      if (words.length < 25 || el.dataset.promote) return false;
      const only = el.children.length === 1 && el.firstElementChild;
      if (only && only.matches('strong, b, em, i') && plainText(only) === words) return false;
      if (el.querySelector('a') && plainText(el.querySelector('a')) === words) return false;
      return true;
    })
    .map((el) => ({ el, ...look(el) }));
  // a title promoted from a serif line (light, not bold, on the source) is an Italic heading:
  // the set's accent look (Bold + Italic would be gold, so not when it holds Bold)
  [...section.querySelectorAll('p[data-promote]')].filter((el) => !skip(el))
    .filter((el) => look(el).font === 'serif' && !el.querySelector('strong, b, a, img, picture'))
    .forEach((el) => {
      const em = el.ownerDocument.createElement('em');
      em.append(...el.childNodes);
      el.append(em);
      counts.serifTitles += 1;
    });
  if (!paras.length) return;
  const votes = {};
  paras.forEach((q) => {
    const set = textSetOf(q.font, q.size);
    votes[set] = (votes[set] || 0) + 1;
  });
  const set = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  const base = paras.find((q) => textSetOf(q.font, q.size) === set);
  paras.forEach((q) => {
    const accent = q.font === 'serif' && (base.font === 'sans' || q.size > base.size + 3);
    if (!accent || q.el.tagName !== 'P' || q.el.querySelector('strong, b, a, img, picture')) return;
    const em = q.el.ownerDocument.createElement('em');
    em.append(...q.el.childNodes);
    q.el.append(em);
    counts.accents += 1;
  });
  if (set) addStyle(section, set);
  counts.textSets[set || 'default'] = (counts.textSets[set || 'default'] || 0) + 1;
}

/**
 * The default content (text outside blocks) of every section on the standard: its lines and
 * tags go (gold → Bold + Italic, labels → Bold, visually hidden text stays), a title-sized
 * paragraph becomes a heading (h2 from 28px, else h3; not in a statement or disclaimer), the
 * section's type / spacing / placement rows and styles go; an empty spacer section goes
 * (marked data-std-remove). A page gets `type-scale: standard` (body.type-standard).
 */
function standardText(body, counts, page) {
  [...body.children].forEach((section) => {
    const own = [...section.children].filter((c) => !c.classList.contains('section-metadata'));
    const rows = settingsRows(section);
    const style = rows.find(([key]) => key === 'style');
    const styles = style ? style[1].split(',').map((x) => x.trim()).filter(Boolean) : [];
    // an empty spacer section: the standard section spacing replaces it
    if (styles.includes('spacer') && !own.some((c) => c.textContent.trim() || c.querySelector('img, picture, iframe'))) {
      section.dataset.stdRemove = 'true';
      counts.spacers += 1;
      return;
    }
    const inBlock = (n) => {
      const el = n.nodeType === 1 ? n : n.parentElement;
      return !el || !!el.closest('div[class]:not(.section-metadata)') || !!el.closest('.section-metadata');
    };
    const loose = own.filter((c) => !c.matches('div[class]'));
    if (loose.length) {
      // (in a flex section with a `Columns` row a Column break line is structure: it ends a
      // column's text, corp.js groupFlexColumns; it stays like the row)
      const grouped = styles.includes('flex') && rows.some(([key]) => key === 'Columns');
      const structural = (el) => grouped && /^column break$/i.test(el.textContent.trim());
      const lineOnly = (el) => LINE.test(el.textContent.replace(/\s+/g, ' ').trim());
      loose.filter((el) => lineOnly(el) && !structural(el)).forEach((el) => {
        el.remove();
        counts.lines += 1;
      });
      const statement = styles.includes('large-headline');
      // the section's copy size (its row goes below): large copy made its bold lines titles
      const copyRow = rows.find(([key]) => key === 'Copy size');
      const copyName = copyRow ? copyRow[1].trim().toLowerCase() : '';
      const copyPx = ({ large: 17.5, 'x-large': 21 })[copyName] || tokenPx(copyName) || 14;
      // the section's colour rows: Gold is the convention's Bold + Italic (other colours go)
      const rowValue = (key) => ((rows.find(([k]) => k === key) || [])[1] || '')
        .split(',').map((x) => x.trim().toLowerCase());
      const textGold = rowValue('Text').includes('gold');
      const headingsGold = rowValue('Headings').includes('gold');
      const goldWrap = (el) => {
        if (el.querySelector('a, img, picture') || !plainText(el)) return;
        if (el.querySelector(':scope > :is(strong, b):only-child > :is(em, i):only-child, :scope > :is(em, i):only-child > :is(strong, b):only-child')) return;
        const strong = el.ownerDocument.createElement('strong');
        const em = el.ownerDocument.createElement('em');
        em.append(...el.childNodes);
        strong.append(em);
        el.append(strong);
        counts.gold += 1;
      };
      if (headingsGold) loose.filter((el) => el.matches('h1, h2, h3, h4, h5, h6')).forEach(goldWrap);
      const goldTitle = (p) => textGold || /\[\[[^\]]*\bgold\b/i.test(p.textContent);
      if (!styles.includes('disclaimer')) {
        counts.titles += splitTitles(section, inBlock, statement);
        markTitles(section, statement ? 'statement' : 'default', inBlock);
        // a short paragraph wholly Bold + Italic is a gold title (the source's gold label line)
        [...section.querySelectorAll('p:not([data-promote])')].filter((p) => !inBlock(p)).forEach((p) => {
          const only = p.children.length === 1 && p.firstElementChild;
          const inner = only && only.children.length === 1 && only.firstElementChild;
          const boldItalic = inner && ((only.matches('em, i') && inner.matches('strong, b')) || (only.matches('strong, b') && inner.matches('em, i')));
          const words = plainText(p);
          if (!boldItalic || words !== plainText(inner) || !words || words.length > CAPTION) return;
          // (a black label, Bold + Italic in corp copy, stays a label: only gold lines are titles)
          if (p.querySelector('a, img, picture') || !goldTitle(p)) return;
          p.dataset.promote = statement ? 'H2' : 'H3';
        });
        // in large copy (21px and up) a short wholly Bold line is the section's title; a wholly
        // Bold + Italic line too (the corp black label: gold lines were promoted above), its
        // Italic dropped (Bold + Italic in a heading is gold)
        if (copyPx >= 21) {
          [...section.querySelectorAll('p:not([data-promote])')].filter((p) => !inBlock(p)).forEach((p) => {
            const only = p.children.length === 1 && p.firstElementChild;
            const inner = only && only.children.length === 1 ? only.firstElementChild : null;
            const words = plainText(p);
            const bold = only && only.matches('strong, b');
            const italic = only && only.matches('em, i') && inner && inner.matches('strong, b')
              && plainText(inner) === words;
            if (!(bold || italic) || plainText(only) !== words || !words) return;
            if (words.length > CAPTION || p.querySelector('a, img, picture')) return;
            const em = italic ? only : [...only.querySelectorAll('em, i')].find((e) => plainText(e) === words);
            if (em) em.replaceWith(...em.childNodes);
            p.dataset.promote = copyPx >= 28 || statement ? 'H2' : 'H3';
          });
        }
      }
      if (!statement && !styles.includes('disclaimer')) {
        standardTextSet(section, { serif: styles.includes('serif'), copyPx }, inBlock, counts);
      }
      const t = stripTags(section, inBlock);
      ['tags', 'gold', 'goldLost', 'blanks', 'labels'].forEach((k) => { counts[k] += t[k]; });
      counts.titles += promoteTitles(section);
      counts.textSections += 1;
    }
    // rows and styles (a Columns block's own rows are the block pass's)
    rows.forEach(([key, , row]) => {
      const name = key.replace(/ \(\d+\)$/, '');
      if (TEXT_ROWS.includes(name) && row.parentElement) {
        row.remove();
        counts.rows += 1;
      } else if (key === 'style') {
        // (the row as it is now: the text set was added to it above)
        const now = row.lastElementChild.textContent.split(',').map((x) => x.trim()).filter(Boolean);
        const kept = now.filter((x) => !TEXT_DROP.includes(x) && !TEXT_DROP_RE.test(x));
        if (kept.length === now.length) return;
        counts.styles += now.length - kept.length;
        if (kept.length) row.lastElementChild.textContent = kept.join(', ');
        else row.remove();
      }
    });
    const meta = section.querySelector(':scope > .section-metadata');
    if (meta && !meta.children.length) meta.remove();
  });
  // the page on the standard type (fragments follow the page they are on)
  const metadata = body.querySelector('.metadata');
  if (page && metadata && ![...metadata.children].some((r) => r.firstElementChild?.textContent.trim() === 'type-scale')) {
    const row = body.ownerDocument.createElement('div');
    ['type-scale', 'standard'].forEach((v) => {
      const cell = body.ownerDocument.createElement('div');
      cell.textContent = v;
      row.append(cell);
    });
    metadata.append(row);
  }
}

// Page Nav (blocks/page-nav): navigation within the page or its page family
export const NAV_VARIANTS = {
  'page-nav': 'Jump links',
  'page-nav sticky': 'Sticky bar',
  'page-nav local': 'Page family',
};

const anchorHref = (a) => {
  const href = (a.getAttribute('href') || '').trim();
  return /^#./.test(href) ? href : null;
};

/**
 * A jump bar: a Columns block of one row whose every filled cell is one in-page (#) link and
 * nothing else (the product pages' `[[Futura]]` CONTACT US | ABOUT | … bar).
 * @returns {{label: string, href: string}[]|null} its links, else null
 */
export function jumpLinksOf(block) {
  if (!block.classList.contains('columns') || block.children.length !== 1) return null;
  const cells = [...block.firstElementChild.children]
    .filter((c) => plainText(c) || c.querySelector('img, picture, iframe'));
  if (cells.length < 2) return null;
  const items = cells.map((cell) => {
    const links = cell.querySelectorAll('a[href]');
    if (links.length !== 1 || !anchorHref(links[0])) return null;
    if (plainText(cell) !== plainText(links[0])) return null;
    return { label: plainText(links[0]), href: anchorHref(links[0]) };
  });
  return items.every((i) => i && i.label) ? items : null;
}

/**
 * Navigation on Page Nav: Sticky Nav → `page-nav sticky` / `page-nav local` (its other
 * options kept), a jump bar → `page-nav`, one row per link (its tags and line breaks go), and
 * the bar's Columns rows with it.
 */
function standardNavs(body, counts) {
  const doc = body.ownerDocument;
  [...body.children].forEach((section) => {
    [...section.children].forEach((block) => {
      if (block.classList.contains('sticky-nav')) {
        const variant = block.classList.contains('local') ? 'page-nav local' : 'page-nav sticky';
        const options = [...block.classList].filter((c) => !['sticky-nav', 'local', 'sticky'].includes(c));
        block.className = [variant, ...options].join(' ');
        counts.navs[variant] = (counts.navs[variant] || 0) + 1;
        return;
      }
      const items = jumpLinksOf(block);
      if (!items) return;
      const nav = doc.createElement('div');
      nav.className = 'page-nav';
      items.forEach(({ label, href }) => {
        const row = doc.createElement('div');
        const cell = doc.createElement('div');
        const a = doc.createElement('a');
        a.setAttribute('href', href);
        a.textContent = label;
        cell.append(a);
        row.append(cell);
        nav.append(row);
      });
      counts.tags += (block.textContent.match(/\[\[[^\]]+\]/g) || []).length;
      block.replaceWith(nav);
      counts.navs['page-nav'] = (counts.navs['page-nav'] || 0) + 1;
      if (section.querySelector(':scope > .columns')) return;
      settingsRows(section).forEach(([key, , row]) => {
        if (BLOCK_ROWS.includes(key.replace(/ \(\d+\)$/, ''))) {
          row.remove();
          counts.rows += 1;
        }
      });
    });
  });
}

/**
 * `[[Futura]…]` links (resource and product link lists): the Futura bold link of the
 * conventions — Bold, and Bold + Underline when the link is alone in its paragraph (Bold alone
 * would make it a button there). The tag itself goes with the other tags.
 */
function futuraLinks(body, counts) {
  const doc = body.ownerDocument;
  [...body.querySelectorAll('a[href]')].forEach((a) => {
    const tokens = [...a.textContent.matchAll(/\[\[([^\]]+)\]/g)]
      .flatMap((m) => m[1].split(',').map((t) => t.trim().toLowerCase()));
    if (!tokens.includes('futura')) return;
    if (!a.closest('strong, b') && !a.querySelector('strong, b')) {
      const strong = doc.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    }
    const holder = a.closest('p, li, h1, h2, h3, h4, h5, h6, td, div');
    const alone = holder && holder.matches('p') && plainText(holder) === plainText(a);
    if (alone && !a.closest('u') && !a.querySelector('u')) {
      const u = doc.createElement('u');
      u.append(...a.childNodes);
      a.append(u);
    }
    counts.futuraLinks += 1;
  });
}

/**
 * A section of only a visually hidden heading (`[[visually-hidden]…]`, the page title above a
 * banner hero): the tag goes, the section gets the `visually-hidden` style.
 */
function hiddenHeadings(body, counts) {
  [...body.children].forEach((section) => {
    const own = [...section.children].filter((c) => !c.classList.contains('section-metadata'));
    if (own.length !== 1 || !own[0].matches('h1, h2, h3, h4, h5, h6')) return;
    const heading = own[0];
    const raw = heading.textContent.trim();
    if (!/^\[\[\s*visually-hidden\s*\]/i.test(raw) || !raw.endsWith(']')) return;
    const walker = heading.ownerDocument.createTreeWalker(heading, 4);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    const first = nodes.find((n) => n.nodeValue.trim());
    const last = [...nodes].reverse().find((n) => n.nodeValue.trim());
    first.nodeValue = first.nodeValue.replace(/\[\[\s*visually-hidden\s*\]/i, '');
    last.nodeValue = last.nodeValue.replace(/\]\s*$/, '');
    addStyle(section, 'visually-hidden');
    counts.hidden += 1;
  });
}

// the chart palette (blocks/chart-corp: the Statistics colour keywords) and its colours
export const CHART_PALETTE = {
  teal: [76, 125, 122],
  gold: [255, 181, 0],
  'dark-gold': [175, 109, 4],
  navy: [28, 86, 135],
  sage: [178, 180, 174],
  purple: [133, 69, 138],
};
// source colours whose nearest palette colour is not their family (the light purple bars)
const CHART_FAMILY = { '206,181,208': 'purple' };

/** an authored chart colour (keyword, #rgb, #rrggbb, rgb(), rgba() on white) → palette keyword */
export function chartKeyword(value) {
  const v = value.trim().toLowerCase();
  if (CHART_PALETTE[v]) return v;
  let rgb = null;
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  const fn = v.match(/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*(\d*\.?\d+)(%?)\s*)?\)$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else if (fn) {
    const alpha = fn[4] === undefined ? 1 : Number(fn[4]) / (fn[5] ? 100 : 1);
    rgb = fn.slice(1, 4).map((c) => Math.round(Number(c) * alpha + 255 * (1 - alpha)));
  }
  if (!rgb) return null;
  if (CHART_FAMILY[rgb.join(',')]) return CHART_FAMILY[rgb.join(',')];
  const dist = (key) => CHART_PALETTE[key].reduce((n, x, i) => n + (x - rgb[i]) ** 2, 0);
  return Object.keys(CHART_PALETTE).sort((a, b) => dist(a) - dist(b))[0];
}

/**
 * Charts on the standard: every data colour a palette keyword, no authored height (the
 * standard chart height). Chart type, title, format, max, axis title and labels are content.
 */
function standardCharts(body, counts) {
  body.querySelectorAll('.chart-corp').forEach((block) => {
    [...block.children].forEach((row) => {
      const cells = [...row.children];
      if (cells.length === 2 && text(cells[0]).toLowerCase() === 'height') {
        row.remove();
        counts.rows += 1;
        return;
      }
      if (cells.length < 3 || !text(cells[2])) return;
      const keyword = chartKeyword(text(cells[2]));
      if (keyword && keyword !== text(cells[2])) {
        cells[2].textContent = keyword;
        counts.chartColours += 1;
      }
    });
  });
}

/**
 * Every Columns and Cards block of the document on a standard variant.
 * @param {Element} body the document's body (sections as top-level divs), changed in place
 * @returns {{blocks: {section: number, block: number, type: string, from: string,
 *   variant: string}[], counts: object, changes: string[]}}
 */
export function transformDocument(body, { page = true } = {}) {
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
    backgrounds: {},
    spacers: 0,
    textSections: 0,
    layouts: {},
    navs: {},
    futuraLinks: 0,
    hidden: 0,
    chartColours: 0,
    textSets: {},
    accents: 0,
    serifTitles: 0,
  };
  standardNavs(body, counts);
  standardCharts(body, counts);
  futuraLinks(body, counts);
  hiddenHeadings(body, counts);
  standardLayouts(body, counts);
  [...body.children].forEach((section, si) => {
    const own = [...section.children].filter((c) => !c.classList.contains('section-metadata'));
    const columns = own.filter((c) => c.classList.contains('columns'));
    const cards = own.filter((c) => c.classList.contains('cards-corp'));
    const heroes = own.filter((c) => c.classList.contains('hero-corp'));
    const accordions = own.filter((c) => c.classList.contains('accordion'));
    const statistics = own.filter((c) => c.classList.contains('statistics'));
    // Video: two variants, `video` (click to play) and `video autoplay` (a muted loop), no border
    // option (the standard has none: styles-corp.css, type-scale: standard pages)
    own.filter((c) => c.classList.contains('video')).forEach((block) => {
      const from = block.className;
      const variant = block.classList.contains('autoplay') ? 'video autoplay' : 'video';
      block.className = variant;
      blocks.push({
        section: si, block: own.indexOf(block), type: 'video', from, variant,
      });
    });
    // Accordion: the one design, its text cleaned. Statistics: every figure gold (the colour
    // cell says gold), the column count from the figures (statistics.js), no left option
    accordions.forEach((block) => {
      cleanContent(block, 'accordion', counts);
      blocks.push({
        section: si, block: own.indexOf(block), type: 'accordion', from: block.className, variant: 'accordion',
      });
      block.className = 'accordion';
    });
    statistics.forEach((block) => {
      const from = block.className;
      cleanContent(block, 'statistics', counts);
      [...block.children].forEach((row) => {
        const cells = [...row.children];
        if (cells.length >= 3) cells[0].textContent = 'gold';
      });
      block.className = 'statistics count-up count-once';
      blocks.push({
        section: si, block: own.indexOf(block), type: 'statistics', from, variant: 'statistics',
      });
    });
    if (!columns.length && !cards.length && !heroes.length) return;
    // (a section holding only standard blocks: its type rows and styles are theirs)
    const STANDARD = ['columns', 'cards-corp', 'hero-corp'];
    const onlyStandard = own.every((c) => STANDARD.some((n) => c.classList.contains(n)));
    const hero = heroes.length > 0;
    // a Columns block's own rows: plain for the first (Column widths: for all when no block has its
    // own), `(k)` for the k-th
    const ownRows = settingsRows(section);
    const numbered = ownRows.some(([key]) => /^Column widths \(\d+\)$/.test(key));
    const rowFor = (name, k) => (ownRows.find(([key]) => key === `${name} (${k})`)
      || (k === 1 || (name === 'Column widths' && !numbered) ? ownRows.find(([key]) => key === name) : null) || [])[1];
    columns.forEach((block, bi) => {
      const variant = variantOf(block);
      const from = block.className;
      // two cells of unequal width keep the wide one; text set well down beside a tall image is
      // centred (the AEM way: the text column's top inset)
      const filled = [...(block.firstElementChild?.children || [])].filter((c) => cellKind(c) !== 'empty');
      const wide = filled.length === 2 && variant !== 'page-intro' ? wideOf(rowFor('Column widths', bi + 1)) : null;
      const box = rowFor('Text box', bi + 1) || '';
      const textCol = filled.findIndex((c) => cellKind(c) === 'text') + 1;
      const inset = (box.match(new RegExp(`column ${textCol}:[^;]*?top (\\d+(?:\\.\\d+)?)%`)) || [])[1];
      const middle = variant === 'media-text' && columns.length === 1 && textCol && Number(inset) >= 10;
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
      block.className = `columns ${variant}${wide ? ` ${wide}` : ''}`;
      if (wide) counts.layouts[`columns ${wide}`] = (counts.layouts[`columns ${wide}`] || 0) + 1;
      if (middle) {
        addStyle(section, 'middle');
        counts.layouts.middle = (counts.layouts.middle || 0) + 1;
      }
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
    // (a slide without a heading in large copy, 21px and up: its wholly Bold or Bold + Italic
    // lines are its title, as Heading 2; the Italic of a black line goes, gold stays gold)
    const copyRow = ownRows.find(([key]) => key === 'Copy size');
    const copyName = copyRow ? copyRow[1].trim().toLowerCase() : '';
    const heroCopyPx = ({ large: 17.5, 'x-large': 21 })[copyName] || tokenPx(copyName) || 14;
    heroes.forEach((block) => {
      const variant = heroVariantOf(block);
      const from = block.className;
      if (heroCopyPx >= 21 && !block.querySelector('h1, h2, h3, h4, h5, h6')) {
        [...block.querySelectorAll('p')].forEach((p) => {
          const words = plainText(p);
          const only = p.children.length === 1 && p.firstElementChild;
          if (!only || !only.matches('strong, b, em, i') || plainText(only) !== words || !words) return;
          if (words.length > CAPTION || p.querySelector('a, img, picture')) return;
          if (!p.querySelector('strong, b') && !only.matches('strong, b')) return;
          if (!/\[\[[^\]]*\bgold\b/i.test(p.textContent)) {
            [...p.querySelectorAll('em, i')].forEach((em) => em.replaceWith(...em.childNodes));
          }
          const h2 = p.ownerDocument.createElement('h2');
          h2.append(...p.childNodes);
          p.replaceWith(h2);
          counts.titles += 1;
        });
      }
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
  standardBackgrounds(body, counts);
  standardText(body, counts, page);
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
  if (counts.spacers) changes.push(`${counts.spacers} empty spacer sections removed`);
  const bgs = Object.entries(counts.backgrounds);
  if (bgs.length) changes.push(`backgrounds: ${bgs.map(([k, n]) => `${k} ${n}`).join(', ')}`);
  return { blocks, counts, changes };
}
