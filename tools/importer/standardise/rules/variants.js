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
      loose.filter((el) => LINE.test(el.textContent.replace(/\s+/g, ' ').trim())).forEach((el) => {
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
        // in large copy (21px and up) a short wholly Bold line is the section's title
        if (copyPx >= 21) {
          [...section.querySelectorAll('p:not([data-promote])')].filter((p) => !inBlock(p)).forEach((p) => {
            const only = p.children.length === 1 && p.firstElementChild;
            const words = plainText(p);
            if (!only || !only.matches('strong, b') || plainText(only) !== words || !words) return;
            if (words.length > CAPTION || p.querySelector('a, img, picture')) return;
            p.dataset.promote = copyPx >= 28 || statement ? 'H2' : 'H3';
          });
        }
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
        const kept = styles.filter((x) => !TEXT_DROP.includes(x) && !TEXT_DROP_RE.test(x));
        if (kept.length === styles.length) return;
        counts.styles += styles.length - kept.length;
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
  };
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
