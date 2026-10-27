/*
 * www.stryker.com rich text → corp authoring conventions, shared by every corp importer.
 * Site-wide decision table: tools/importer/decisions/typography-map.json (approved 2026-10-27).
 *
 * Started from the news-detail import (transformers/news-detail-sections.js, #451, the rules
 * behind the migrated news pages) and extended with the approved site-wide rules:
 *   - copy size: the effective size of the copy (nested .fontsize-<x>em classes multiply,
 *     fontsize-8em = 0.8em) → the nearest of p-0-8, p-1-25, p-1-5, p-1-75, p-2, p-2-5
 *     (1em = base copy, no style); span.urw-egyptienne copy → serif
 *   - headings set in span.urw-egyptienne (any level) → h-serif
 *   - coloured text → [[color-<name>]…] bracket tags: the exact corp colour, other colours
 *     rounded to the perceptually closest one (CIELAB); black = default text, dropped
 *   - <i> / <em> stay italic (<em>), as on the source
 */

export const SOURCE_ORIGIN = 'https://www.stryker.com';
export const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE']);
const KEEP_ATTRS = {
  A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'],
};

export function text(el) {
  return (el.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

const squash = (value) => value.replace(/[\s\u00a0]+/g, '');

export function rename(el, tagName) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

export function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

/**
 * A detached copy of an element's content in a new <div> (the source is left as it is), for
 * cleaning: the DOM equivalent of `box.innerHTML = source.innerHTML`.
 */
export function contentCopy(source, doc = source.ownerDocument) {
  const box = doc.createElement('div');
  source.childNodes.forEach((node) => box.append(doc.importNode(node, true)));
  return box;
}

/**
 * References authored as numbered paragraphs ("1: Author…", "2: …") become an ordered
 * list, so the citation superscripts link to them: scripts.js decorateFootnotes links
 * <sup>N</sup> to the Nth item of the last <ol> on the page. Only a run numbered 1, 2, 3…
 * in order is converted; the source's "N:" / "N." prefix stays in the text (the
 * `references-spaced` style hides the list marker). Other paragraphs (e.g. the document
 * code) are left as they are.
 * @returns {Element[]} the nodes, with `converted` set when a list was made
 */
export function footnoteList(nodes, doc) {
  const NUMBERED = /^\s*(\d+)\s*[:.)]\s*/;
  const out = [];
  let ol = null;
  nodes.forEach((node) => {
    const match = node.tagName === 'P' && node.textContent.match(NUMBERED);
    const next = ol ? ol.children.length + 1 : 1;
    if (match && Number(match[1]) === next) {
      if (!ol) {
        ol = doc.createElement('ol');
        out.push(ol);
      }
      const li = doc.createElement('li');
      while (node.firstChild) li.append(node.firstChild);
      ol.append(li);
      return;
    }
    ol = null;
    out.push(node);
  });
  out.converted = out.some((node) => node.tagName === 'OL' && !nodes.includes(node));
  return out;
}

export function absoluteAsset(href) {
  return href && href.startsWith('/content/dam/') ? `${SOURCE_ORIGIN}${href}` : href;
}

/**
 * A source link that opens in a new tab (target="_blank"), and every link to a PDF,
 * gets the author `#_blank` marker (scripts.js decorateLinkTargets sets target="_blank"
 * from it). The address itself is kept (PDFs stay on www.stryker.com, see
 * absoluteAsset). Links that already carry a #hash, mailto: and tel: are left as they are.
 */
export function newTabHref(source, href) {
  if (!href || href.includes('#') || /^(mailto|tel):/i.test(href)) return href;
  const isPdf = /\.pdf(\?|$)/i.test(href);
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  return isPdf || newTab ? `${href}#_blank` : href;
}

/* ---------- copy size and font ---------- */

// effective copy size (× the 14px base) → section style; 1 = base copy, no style
const SIZE_STEPS = [[0.8, 'p-0-8'], [1, ''], [1.25, 'p-1-25'], [1.5, 'p-1-5'], [1.75, 'p-1-75'], [2, 'p-2'], [2.5, 'p-2-5']];
const FONT_STYLES = [
  ['urw-egyptienne', 'serif'],
];

/** .fontsize-<x>em factor of a class (fontsize-1-25em → 1.25; fontsize-8em → 0.8), else 1. */
function sizeFactor(cls) {
  const m = cls.match(/^fontsize-(\d+)(?:-(\d+))?em$/);
  if (!m) return 1;
  if (!m[2] && Number(m[1]) > 4) return Number(m[1]) / 10;
  return Number(`${m[1]}.${m[2] || 0}`);
}

/** The section style of an effective size: the nearest step (above 2.5 → p-2-5). */
function sizeStyle(factor) {
  const [[style]] = SIZE_STEPS.map(([f, s]) => [s, Math.abs(Math.log(factor / f))])
    .sort((a, b) => a[1] - b[1]);
  return style;
}

/**
 * The effective size of an element's copy: the product of the nested .fontsize-*em classes
 * over all of its text, when every text node has the same one; null when sizes are mixed.
 */
function effectiveSize(el) {
  const sizes = new Set();
  const walker = el.ownerDocument.createTreeWalker(el, 4); // NodeFilter.SHOW_TEXT
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (squash(n.textContent)) {
      let factor = 1;
      for (let e = n.parentElement; e && e !== el.parentElement; e = e.parentElement) {
        factor = [...e.classList].reduce((f, c) => f * sizeFactor(c), factor);
      }
      sizes.add(Math.round(factor * 100) / 100);
    }
  }
  return sizes.size === 1 ? [...sizes][0] : null;
}

/** True when the outermost `.cls` spans of `el` hold all of its text. */
function coveredBy(el, cls) {
  const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
  return squash(spans.map((span) => span.textContent).join('')) === squash(el.textContent);
}

/**
 * The copy section styles of a rich-text fragment: when every paragraph and list item has
 * the same effective size, the matching size style (e.g. p-1-25 for 17.5px), and when it
 * all sits in one source font span (span.urw-egyptienne) the matching font style (serif).
 * Copy with mixed sizes keeps the defaults (14px Humanist).
 * @returns {string|null} the styles, comma-separated ('' for default copy, null when the
 *   fragment has no paragraph or list item)
 */
export function copyStyles(root) {
  const candidates = root.matches && root.matches('p, li') ? [root] : [...root.querySelectorAll('p, li')];
  const copy = candidates.filter((el) => text(el) && !el.querySelector('p, li'));
  if (!copy.length) return null;
  const sizes = new Set(copy.map(effectiveSize));
  const size = sizes.size === 1 && !sizes.has(null) ? sizeStyle([...sizes][0]) : '';
  const font = FONT_STYLES.find(([cls]) => copy.every((el) => coveredBy(el, cls)));
  return [size, font && font[1]].filter(Boolean).join(', ');
}

/* ---------- colour ---------- */

// bracket colour classes (styles/styles.css span.color-*) by their exact hex
const COLOURS = {
  ffb500: 'color-gold',
  '1c5687': 'color-blue',
  '85458a': 'color-purple',
  '4c7d7a': 'color-teal',
  '27455c': 'color-navy',
  545857: 'color-grey',
  ffffff: 'color-white',
};
const NEUTRAL = new Set(['color-white', 'color-grey', '']);

/** A CSS colour value as 6-digit lowercase hex (no #), or '' when it cannot be read. */
function toHex(value) {
  const v = (value || '').trim().toLowerCase();
  if (v === 'white') return 'ffffff';
  if (v === 'black') return '000000';
  let m = v.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => c + c).join('');
  m = v.match(/^#([0-9a-f]{6})$/);
  if (m) return m[1];
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
  return '';
}

/** sRGB hex → CIELAB. */
function lab(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  });
  const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const x = t((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = t(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = t((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/**
 * Bracket colour class of a hex colour: the exact corp colour, else the perceptually closest
 * (CIELAB ΔE) of the corp colours and black; neutral greys only round to white / grey / black.
 * @returns {string} class, or '' for the default text colour (no tag)
 */
export function colourClass(hex) {
  if (!hex) return '';
  if (COLOURS[hex] !== undefined) return COLOURS[hex];
  const target = lab(hex);
  const neutral = Math.abs(target[1]) < 3 && Math.abs(target[2]) < 6;
  const [[best]] = [...Object.entries(COLOURS), ['000000', '']]
    .filter(([, cls]) => !neutral || NEUTRAL.has(cls))
    .map(([h, cls]) => [cls, Math.hypot(...lab(h).map((v, i) => v - target[i]))])
    .sort((a, b) => a[1] - b[1]);
  return best;
}

/** The inline colour of an element (style color or <font color>), as hex, or ''. */
function inlineColour(el) {
  if (el.tagName === 'FONT' && el.getAttribute('color')) return toHex(el.getAttribute('color'));
  const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  return m ? toHex(m[1]) : '';
}

/** Wraps the sibling nodes [first..last] in a bracket tag; whitespace stays outside. */
function wrapInTag(first, last, cls) {
  const doc = first.ownerDocument;
  if (first.nodeType === 3) {
    const lead = first.textContent.match(/^\s*/)[0];
    if (lead) {
      first.before(doc.createTextNode(lead));
      first.textContent = first.textContent.slice(lead.length);
    }
  }
  if (last.nodeType === 3) {
    const tail = last.textContent.match(/\s*$/)[0];
    if (tail) {
      last.after(doc.createTextNode(tail));
      last.textContent = last.textContent.slice(0, last.textContent.length - tail.length);
    }
  }
  first.before(doc.createTextNode(`[[${cls}]`));
  last.after(doc.createTextNode(']'));
}

/**
 * Coloured text → bracket tags. An element with an inline colour gets its own text wrapped
 * as [[color-<name>]…]; children with a colour of their own (black included) are left out and
 * handled on their own. Black / default colours get no tag.
 */
export function mapColours(root) {
  const coloured = [...root.querySelectorAll('[style*="color"], font[color]')]
    .filter((el) => inlineColour(el));
  const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
  const freeText = (node) => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1 || own.get(node)) return '';
    return [...node.childNodes].map(freeText).join('');
  };
  coloured.forEach((el) => {
    const cls = colourClass(own.get(el));
    if (!cls) return;
    let run = [];
    const flush = () => {
      if (run.some((n) => squash(freeText(n)))) wrapInTag(run[0], run[run.length - 1], cls);
      run = [];
    };
    [...el.childNodes].forEach((child) => {
      if (child.nodeType === 1 && own.get(child)) flush();
      else run.push(child);
    });
    flush();
  });
}

/* ---------- bold, links, cleanup ---------- */

/**
 * The text next to a node on its own line: its siblings up to the next <br> (or the
 * start / end of the parent) in one direction.
 */
function sameLineText(node, direction) {
  let value = '';
  let sibling = node[direction];
  while (sibling && sibling.nodeName !== 'BR') {
    value += sibling.textContent;
    sibling = sibling[direction];
  }
  return squash(value);
}

/**
 * Plain-bold (<b>) labels on a line of their own ("For investor inquiries:") are in the
 * body font on the source, while bold labels are Futura on the site. Both become
 * <strong> on import, so these are wrapped in the `[[body-font]…]` bracket tag
 * (scripts/span-tags.js → span.body-font, styles-corp.css). A paragraph that is plain
 * bold as a whole gets the `bold-body` section style instead, unless wholeParagraphs is
 * set (small print, which stays one section).
 */
function tagPlainBoldLabels(root, wholeParagraphs) {
  const doc = root.ownerDocument;
  [...root.querySelectorAll('b')].forEach((b) => {
    if (b.closest('.futura-bold') || b.querySelector('.futura-bold') || b.parentElement.closest('b')) return;
    if (!text(b) || sameLineText(b, 'previousSibling') || sameLineText(b, 'nextSibling')) return;
    const block = b.closest('p, li, h1, h2, h3, h4, h5, h6');
    if (!block || block.matches('h1, h2, h3, h4, h5, h6')) return;
    if (!wholeParagraphs && text(block) === text(b)) return;
    b.before(doc.createTextNode('[[body-font]'));
    b.after(doc.createTextNode(']'));
  });
}

/**
 * Cleans a copied rich-text fragment in place: text-only <div>s to paragraphs, colours to
 * bracket tags, bold/italic to
 * <strong>/<em>, font spans dropped, attributes stripped, empty paragraphs removed.
 * @returns {{centred: boolean, size: string|null}} whether every paragraph of the fragment
 *   is centred, and its copy section styles (copyStyles)
 */
export function cleanRichText(root, { wholeParagraphs = false, divParagraphs = true } = {}) {
  // text authored in a bare <div> (no paragraph inside, e.g. a "* …" footnote line) is a
  // paragraph: the section builders only keep block elements, so it would be lost.
  // (divParagraphs: false for callers that hold on to their own <div> lines)
  if (divParagraphs) {
    [...root.querySelectorAll('div')].reverse().forEach((div) => {
      if (text(div) && !div.querySelector('p, div, ul, ol, h1, h2, h3, h4, h5, h6, table')) rename(div, 'p');
    });
  }
  const blocks = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => text(el));
  const centred = blocks.length > 0
    && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute('style') || ''));
  const size = copyStyles(root);
  tagPlainBoldLabels(root, wholeParagraphs);

  // standalone links (span.standalone-link: Futura bold, uppercase, teal, with a
  // triangle — e.g. "Read the full report") → bold + underline link, the authoring
  // convention for that CTA (a.link-strong): <strong><a><u>text</u></a></strong>
  const doc = root.ownerDocument;
  const standalone = new Set();
  root.querySelectorAll('.standalone-link').forEach((span) => {
    const a = span.closest('a') || span.querySelector('a');
    if (a) standalone.add(a);
  });
  standalone.forEach((a) => {
    const u = doc.createElement('u');
    while (a.firstChild) u.append(a.firstChild);
    a.append(u);
    const strong = doc.createElement('strong');
    a.replaceWith(strong);
    strong.append(a);
  });

  // colours, before the formatting spans that may carry them are renamed or unwrapped
  mapColours(root);

  // a line break typed inside the formatting ("<span class=futura-bold>About Stryker<br></span>",
  // possibly followed by empty size spans) belongs after it: inside <strong> it would be
  // lost on import, merging the label into the next line
  const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== 'BR'
    && !node.textContent.trim() && !node.querySelector('img, br');
  root.querySelectorAll('span.futura-bold, b, i, em, strong').forEach((el) => {
    let last = el.lastChild;
    while (last && (last.nodeName === 'BR' || emptyElement(last)
      || (last.nodeType === 3 && !last.textContent.trim()))) {
      if (emptyElement(last)) last.remove();
      else el.after(last);
      last = el.lastChild;
    }
  });
  // span.futura-bold in a paragraph or list item → <strong><em> (Futura bold, upright, body
  // colour); <b> → <strong> (bold in the body font). Headings keep a plain <strong>.
  root.querySelectorAll('span.futura-bold').forEach((el) => {
    if (!el.closest('p, li') || el.closest('h1, h2, h3, h4, h5, h6')) {
      rename(el, 'strong');
      return;
    }
    const strong = rename(el, 'strong');
    const em = root.ownerDocument.createElement('em');
    while (strong.firstChild) em.append(strong.firstChild);
    strong.append(em);
  });
  root.querySelectorAll('b').forEach((el) => rename(el, 'strong'));
  root.querySelectorAll('i').forEach((el) => rename(el, 'em'));
  root.querySelectorAll('span, font').forEach(unwrap);
  // bold inside bold (e.g. <b><span class="futura-bold">) is one bold run
  root.querySelectorAll('strong strong, em em').forEach(unwrap);
  // a heading that is bold throughout keeps the bold (Futura); empty formatting goes
  root.querySelectorAll('strong, em').forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img, br')) el.remove();
  });

  root.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('href', newTabHref(a, absoluteAsset(a.getAttribute('href'))));
  });
  root.querySelectorAll('*').forEach((el) => {
    const keep = KEEP_ATTRS[el.tagName] || [];
    [...el.attributes].forEach((attr) => {
      if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
    });
  });

  // trailing <br> and empty paragraphs (&nbsp; spacers)
  root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
    while (el.lastChild && (el.lastChild.nodeName === 'BR'
      || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) {
      el.lastChild.remove();
    }
    if (!text(el) && !el.querySelector('img')) el.remove();
  });
  return { centred, size };
}

/**
 * Paragraphs that are plain bold (<b>, not span.futura-bold) as a whole: on the source
 * they stay in the body font (Humanist bold). Both kinds of bold become <strong> on
 * import, so these get the `bold-body` section style instead.
 */
export function plainBoldParagraphs(root) {
  return new Set([...root.querySelectorAll('p')].filter((p) => {
    const all = squash(p.textContent);
    if (!all || p.querySelector('.futura-bold')) return false;
    const bold = [...p.querySelectorAll('b')].filter((b) => !b.parentElement.closest('b'));
    return squash(bold.map((b) => b.textContent).join('')) === all;
  }));
}

/**
 * Headings set in Egyptienne on the source (the whole text in span.urw-egyptienne, no
 * bold): corp headings are Futura bold, so their section gets the `h-serif` style.
 */
export function serifHeadings(root) {
  return new Set([...root.querySelectorAll('h2, h3, h4, h5, h6')].filter((h) => {
    if (!text(h) || h.querySelector('.futura-bold, b, strong')) return false;
    return coveredBy(h, 'urw-egyptienne');
  }));
}
