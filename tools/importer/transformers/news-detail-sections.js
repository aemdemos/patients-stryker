/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: www.stryker.com news articles (template news-detail) — page structure.
 *
 * beforeTransform rebuilds <body> as the article's authorable content, in source order:
 *   1. title section: the page H1 (`.h1-title`, only when the source has one — no H1 is
 *      created) and the H5 publish date (`.c-publish-date`)
 *   2. lead media: the single-slide `.c-autocarousel` (own section; the hero-image-slide
 *      parser turns it into `Hero (image-slide)`), or a standalone image (own section)
 *   3. article sections: rich text, standalone images and `.c-standalone-video` (left for
 *      the video parser). A run of centred content (centred rich text, `.c-curatedcta`
 *      buttons) becomes its own section with the `center` section style.
 *   3a. a video with a Large Headline beside it (col-sm-8 + col-sm-4 row, e.g. the
 *       StrykerTalks podcasts) → `Columns (columns-67-33, large-headline, gray-lead)`, full
 *       width: the video link, then the headline as a Heading 2 statement in the grey box;
 *       the page gets `theme: full-width` (title and small print full width, as on the source)
 * A `spacer` section follows the title section when it holds the H1, unless the article
 * opens with a lead image directly below the date (outside a column layout).
 *   3b. section separators (`.c-section-separator` rule) → the `separator` style on the
 *       section that follows the rule
 *   4. related-content cards (`.c-customizeable`): their heading plus the grid, left for
 *      the cards-corp-teaser parser, in a section of their own (full width)
 *   5. `.c-disclaimer` references (numbered paragraphs → an ordered list, so the
 *      citation superscripts link to them) and document code → a small-print `disclaimer` section
 * The "Last Updated" line is not content (scripts/corp.js renders it from `published`).
 *
 * Text normalisation (news-detail spec): source font spans are dropped (body text is
 * Humanist 14px); a rich text whose copy is all in one size span (fontsize-1-25em,
 * fontsize-1-5em, fontsize-1-75em) or font span (urw-egyptienne) gets the matching section
 * style (p-1-25, p-1-5, p-1-75, serif), and an h3 all in urw-egyptienne adds `h-serif`; a
 * paragraph that is plain bold (<b>) as a whole gets a section of its own with the
 * `bold-body` style (bold in the body font); inline `span.futura-bold` becomes
 * <strong><em> (Futura bold) and `<b>` <strong> (body-font bold), gold buttons (a.btn-gold) become bold + italic links (the
 * authoring convention for the gold .button.accent), other buttons bold links, and
 * standalone links (span.standalone-link) bold + underline links (a.link-strong).
 * Asset links (/content/dam/...) point at www.stryker.com, where the files live; links
 * that open in a new tab on the source get the `#_blank` marker.
 */

import { videoLink } from '../parsers/video.js';

const SOURCE_ORIGIN = 'https://www.stryker.com';

const COMPONENTS = [
  '.c-autocarousel',
  '.c-standalone-image',
  '.c-rich-text-editor',
  '.c-standalone-video',
  '.c-curatedcta',
  '.c-largeheadline',
  '.c-section-title',
  '.c-customizeable',
  '.c-section-separator',
  '.sectionseparator',
].join(', ');

const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE']);
const KEEP_ATTRS = { A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'] };

function text(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function rename(el, tagName) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function absoluteAsset(href) {
  return href && href.startsWith('/content/dam/') ? `${SOURCE_ORIGIN}${href}` : href;
}

/**
 * A source link that opens in a new tab (target="_blank"), and every link to a PDF,
 * gets the author `#_blank` marker (scripts.js decorateLinkTargets sets target="_blank"
 * from it). The address itself is kept (PDFs stay on www.stryker.com, see
 * absoluteAsset). Links that already carry a #hash, mailto: and tel: are left as they are.
 */
function newTabHref(source, href) {
  if (!href || href.includes('#') || /^(mailto|tel):/i.test(href)) return href;
  const isPdf = /\.pdf(\?|$)/i.test(href);
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  return isPdf || newTab ? `${href}#_blank` : href;
}

// source copy spans → the corp section style that sets the same copy size / font
const SIZE_STYLES = [
  // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph)
  ['fontsize-8em', 'disclaimer'],
  ['fontsize-1-25em', 'p-1-25'],
  ['fontsize-1-5em', 'p-1-5'],
  ['fontsize-1-75em', 'p-1-75'],
];
const FONT_STYLES = [
  ['urw-egyptienne', 'serif'],
];

/**
 * The copy section styles of a rich-text fragment: when the whole text of every
 * paragraph and list item sits in one source size span (e.g. span.fontsize-1-25em,
 * 17.5px) the matching size style (p-1-25), and when it all sits in one source font
 * span (span.urw-egyptienne) the matching font style (serif). Copy that is only partly
 * styled keeps the defaults (14px Humanist).
 * @returns {string|null} the styles, comma-separated ('' for default copy, null when the
 *   fragment has no paragraph or list item)
 */
function copyStyles(root) {
  const candidates = root.matches && root.matches('p, li') ? [root] : [...root.querySelectorAll('p, li')];
  const copy = candidates.filter((el) => text(el) && !el.querySelector('p, li'));
  if (!copy.length) return null;
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  const covers = (cls) => copy.every((el) => {
    const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
    return squash(spans.map((span) => span.textContent).join('')) === squash(el.textContent);
  });
  const size = SIZE_STYLES.find(([cls]) => covers(cls));
  const font = FONT_STYLES.find(([cls]) => covers(cls));
  return [size && size[1], font && font[1]].filter(Boolean).join(', ');
}

/**
 * Cleans a copied rich-text fragment in place: bold/italic to <strong>/<em>, font spans
 * dropped, attributes stripped, empty paragraphs removed. Returns whether every
 * paragraph of the fragment is centred and its copy section styles (copyStyles).
 */
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
  return value.replace(/[\s\u00a0]+/g, '');
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

function cleanRichText(root, { wholeParagraphs = false } = {}) {
  const blocks = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => text(el));
  const centred = blocks.length > 0
    && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute('style') || ''));
  const size = copyStyles(root);
  const doc = root.ownerDocument;

  // a line break typed inside the formatting ("<span class=futura-bold>About Stryker<br></span>",
  // possibly followed by empty size spans, or nested: <b><span>…<br></span></b>) belongs
  // after it: inside <strong> it would be lost on import, merging the label into the next
  // line. Innermost formatting first, so the break moves out of every level; done before
  // the plain-bold labels are found (a "<b>About Stryker<br></b>" label is on its own line).
  // A space typed at the end of the formatting ("2023&nbsp;</span>–") stays between the words.
  const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== 'BR'
    && !node.textContent.trim() && !node.querySelector('img, br');
  const trailingSpace = /[\s\u00a0]+$/;
  [...root.querySelectorAll('span.futura-bold, b, i, em, strong')].reverse().forEach((el) => {
    let last = el.lastChild;
    while (last && (last.nodeName === 'BR' || emptyElement(last)
      || (last.nodeType === 3 && !last.textContent.trim()))) {
      if (emptyElement(last)) {
        // an empty element that only held a space (e.g. <sup>&nbsp;</sup>) keeps the space
        if (/[\s\u00a0]/.test(last.textContent) && !(el.nextSibling && /^[\s\u00a0]/.test(el.nextSibling.textContent))) {
          el.after(doc.createTextNode(' '));
        }
        last.remove();
      } else el.after(last);
      last = el.lastChild;
    }
    if (last && last.nodeType === 3 && trailingSpace.test(last.textContent)) {
      last.textContent = last.textContent.replace(trailingSpace, '');
      el.after(doc.createTextNode(' '));
    }
  });
  tagPlainBoldLabels(root, wholeParagraphs);

  // standalone links (span.standalone-link: Futura bold, uppercase, teal, with a
  // triangle — e.g. "Read the full report") → bold + underline link, the authoring
  // convention for that CTA (a.link-strong): <strong><a><u>text</u></a></strong>
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

  // span.futura-bold in a paragraph or list item → <strong><em> (Futura bold, upright, body
  // colour in news-detail.css); <b> → <strong> (bold in the body font). Headings keep a
  // plain <strong>.
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
  root.querySelectorAll('strong, em').forEach((el) => { if (!el.textContent.trim() && !el.querySelector('img, br')) el.remove(); });

  root.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('href', newTabHref(a, absoluteAsset(a.getAttribute('href'))));
  });
  root.querySelectorAll('*').forEach((el) => {
    const keep = KEEP_ATTRS[el.tagName] || [];
    [...el.attributes].forEach((attr) => { if (!keep.includes(attr.name)) el.removeAttribute(attr.name); });
  });

  // trailing <br> and empty paragraphs (&nbsp; spacers)
  root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
    while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) {
      el.lastChild.remove();
    }
    if (!text(el) && !el.querySelector('img')) el.remove();
  });
  return { centred, size };
}

/** The rich-text content of a component as top-level block elements. */
/**
 * Paragraphs that are plain bold (<b>, not span.futura-bold) as a whole: on the source
 * they stay in the body font (Humanist bold). Both kinds of bold become <strong> on
 * import, so these get the `bold-body` section style instead.
 */
function plainBoldParagraphs(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.querySelectorAll('p')].filter((p) => {
    const all = squash(p.textContent);
    if (!all || p.querySelector('.futura-bold')) return false;
    const bold = [...p.querySelectorAll('b')].filter((b) => !b.parentElement.closest('b'));
    return squash(bold.map((b) => b.textContent).join('')) === all;
  }));
}

/**
 * h3 headings set in Egyptienne on the source (the whole text in span.urw-egyptienne, no
 * bold): the template's h3 is Futura bold, so their section gets the `h-serif` style.
 */
function serifHeadings(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.querySelectorAll('h3')].filter((h) => {
    if (!text(h) || h.querySelector('.futura-bold, b, strong')) return false;
    const spans = [...h.querySelectorAll('.urw-egyptienne')].filter((span) => !span.parentElement.closest('.urw-egyptienne'));
    return squash(spans.map((span) => span.textContent).join('')) === squash(h.textContent);
  }));
}

// press-release boilerplate labels; a few pages set them as h3 headings, the rest as a
// Futura bold label paragraph
const LABEL_HEADING = /^(about stryker|media contacts?|contacts?|investor contacts?)\s*:?$/i;

/**
 * "About Stryker" / "Media contact" headings → a paragraph with the same content, so they
 * import like on the other news pages (span.futura-bold → <p><em><strong>, Futura bold).
 */
function labelHeadingsToParagraphs(root) {
  root.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
    if (!LABEL_HEADING.test(text(h))) return;
    const p = root.ownerDocument.createElement('p');
    while (h.firstChild) p.append(h.firstChild);
    // the heading's own size span (e.g. fontsize-8em) is not copy size: the label is 14px
    p.querySelectorAll('span[class*="fontsize-"]').forEach(unwrap);
    if (!p.querySelector('.futura-bold')) {
      p.querySelectorAll('b, strong').forEach(unwrap);
      const bold = root.ownerDocument.createElement('span');
      bold.className = 'futura-bold';
      while (p.firstChild) bold.append(p.firstChild);
      p.append(bold);
    }
    h.replaceWith(p);
  });
}

function richTextNodes(component, doc) {
  const box = doc.createElement('div');
  const source = component.querySelector(':scope > div') || component;
  box.innerHTML = source.innerHTML;
  labelHeadingsToParagraphs(box);
  const plainBold = plainBoldParagraphs(box);
  const serifHeads = serifHeadings(box);
  // copy styles per top-level element, so one serif lead paragraph in an otherwise
  // plain rich text keeps its font (its own section)
  const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
  const { centred, size } = cleanRichText(box);
  const nodes = [];
  [...box.childNodes].forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
      nodes.push(node);
    } else if (node.nodeType === 1 && node.tagName === 'IMG') {
      const p = doc.createElement('p');
      p.append(node);
      nodes.push(p);
    } else if (node.nodeType === 1 && node.tagName === 'DIV') {
      nodes.push(...[...node.children].filter((el) => BLOCK_TAGS.has(el.tagName)));
    } else if (text(node)) {
      const p = doc.createElement('p');
      p.append(node.cloneNode(true));
      nodes.push(p);
    }
  });
  nodes.forEach((node) => {
    if (plainBold.has(node)) node.boldBody = true;
    if (serifHeads.has(node)) node.serifHeading = true;
  });
  // elements without copy of their own (headings, images) follow the copy around them
  let last = null;
  nodes.forEach((node) => {
    const style = elementStyles.get(node);
    node.copyStyle = style === undefined || style === null ? last : style;
    if (node.copyStyle !== null) last = node.copyStyle;
  });
  const first = nodes.find((node) => node.copyStyle !== null);
  nodes.forEach((node) => {
    if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : (size || '');
  });
  return { nodes, centred, size };
}

/**
 * The section style of an image the source sets in a one-third / one-half grid column
 * with the other columns of the row empty: col-sm-4 → `image-1-3`, col-sm-6 →
 * `image-1-2` (styles-corp.css caps the image box at that column's width); '' otherwise.
 */
function imageColumnStyle(component) {
  const col = component.closest('[class*="col-sm-"]');
  const match = col && col.className.match(/\bcol-sm-(4|6)\b/);
  if (!match) return '';
  const others = [...col.parentElement.children].filter((el) => el !== col);
  if (others.some((el) => text(el) || el.querySelector('img, video, iframe'))) return '';
  return match[1] === '4' ? 'image-1-3' : 'image-1-2';
}

function imageNodes(component, doc) {
  return [...component.querySelectorAll('img')].map((source) => {
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    const p = doc.createElement('p');
    p.append(img);
    return p;
  });
}

function buttonNodes(component, doc) {
  return [...component.querySelectorAll('a[href]')].filter((a) => text(a)).map((source) => {
    const a = doc.createElement('a');
    a.setAttribute('href', newTabHref(source, absoluteAsset(source.getAttribute('href'))));
    a.textContent = text(source);
    const strong = doc.createElement('strong');
    if (source.classList.contains('btn-gold')) {
      const em = doc.createElement('em');
      em.append(a);
      strong.append(em);
    } else {
      strong.append(a);
    }
    const p = doc.createElement('p');
    p.append(strong);
    return p;
  });
}

/**
 * A large headline outside the slide: each non-empty line as a paragraph (a heading in a
 * line gives its text, not the heading). The line spans become divs first: cleanRichText
 * unwraps spans, which would empty them.
 */
function headlineNodes(component, doc) {
  const box = doc.createElement('div');
  box.innerHTML = component.innerHTML;
  const lines = [...box.querySelectorAll('.line')].map((line) => rename(line, 'div'));
  lines.forEach((line) => line.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(unwrap));
  cleanRichText(box);
  return (lines.length ? lines : [box]).map((line) => {
    if (!text(line)) return null;
    const p = doc.createElement('p');
    while (line.firstChild) p.append(line.firstChild);
    return p;
  }).filter(Boolean);
}

/**
 * A Large Headline in the one-third column next to a video (the col-sm-8 / col-sm-4
 * row of the StrykerTalks podcast pages), or null.
 */
function videoAside(video) {
  const col = video.closest('[class*="col-sm-8"]');
  const row = col && col.parentElement;
  const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-4\b/.test(el.className));
  const headline = aside && aside.querySelector('.c-largeheadline');
  return headline && text(headline) ? headline : null;
}

/** The video + headline row as `Columns (columns-67-33, large-headline, gray-lead)`. */
function videoHeadlineColumns(video, headline, doc) {
  const link = videoLink(video, doc);
  const lines = headlineNodes(headline, doc);
  if (!link || !lines.length) return null;
  const media = doc.createElement('p');
  media.append(link);
  const statement = [rename(lines[0], 'h2'), ...lines.slice(1)];
  return WebImporter.Blocks.createBlock(doc, {
    name: 'Columns (columns-67-33, large-headline, gray-lead)',
    cells: [[media, statement]],
  });
}

/**
 * References authored as numbered paragraphs ("1: Author…", "2: …") become an ordered
 * list, so the article's citation superscripts link to them: scripts.js
 * decorateFootnotes links <sup>N</sup> to the Nth item of the last <ol> on the page.
 * Only a run numbered 1, 2, 3… in order is converted; the source's "N:" / "N." prefix is kept (the
 * list numbers the items). Other paragraphs (e.g. the document code) are left as they are.
 */
function footnoteList(nodes, doc) {
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
      // the source's own "1:" / "1." prefix stays in the text (references-spaced hides
      // the list marker), so each entry reads as on the source
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

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || payload.template.name !== 'news-detail') return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const sections = [];
  let current = null;
  let separatorNext = false;
  const startSection = (kind, sectionStyle) => {
    const style = separatorNext
      ? ['separator', sectionStyle].filter(Boolean).join(', ')
      : sectionStyle;
    separatorNext = false;
    current = { kind, style, nodes: [] };
    sections.push(current);
    return current;
  };

  // 1. title section
  const title = startSection('title');
  const h1 = main.querySelector('.h1-title h1');
  if (h1 && text(h1)) {
    const heading = doc.createElement('h1');
    heading.innerHTML = h1.innerHTML;
    cleanRichText(heading);
    title.nodes.push(heading);
  }
  const date = main.querySelector('.c-publish-date h5');
  if (date && text(date)) {
    const h5 = doc.createElement('h5');
    h5.textContent = text(date);
    title.nodes.push(h5);
  }

  // 2.-3. lead media and article components, in source order (outermost only; a
  // slide's own image and headline belong to the carousel)
  const components = [...main.querySelectorAll(COMPONENTS)].filter((el) => {
    const parent = el.parentElement && el.parentElement.closest(COMPONENTS);
    return !parent && !el.closest('header, footer, .modal');
  });

  const consumed = new Set();
  // a lead image placed directly below the date (not in a column layout) starts 15px
  // below it on the source: no spacer then
  let leadBelowDate = false;
  components.forEach((component) => {
    if (consumed.has(component)) return;
    const isFirst = current === title;
    if (component.matches('.c-autocarousel')) {
      if (!component.querySelector('img')) return;
      startSection('hero').nodes.push(component);
      current = null;
      return;
    }
    if (component.matches('.c-standalone-image')) {
      const nodes = imageNodes(component, doc);
      if (!nodes.length) return;
      // the lead image, or an image in a narrow source column, is a section of its own
      const columnStyle = imageColumnStyle(component);
      if (isFirst && !component.closest('.colctrl')) leadBelowDate = true;
      if (isFirst || columnStyle) {
        startSection(isFirst ? 'lead' : 'image', columnStyle || undefined).nodes.push(...nodes);
        current = null;
        return;
      }
      // an image joins the article section it follows, whatever its copy size
      if (!current || !current.kind.startsWith('body')) startSection('body');
      current.nodes.push(...nodes);
      return;
    }
    // the importer drops <hr> elements before the transform, so the rule is also found by
    // its AEM wrapper (.sectionseparator)
    if (component.matches('.c-section-separator, .sectionseparator')) {
      // a horizontal rule between parts of the article (e.g. before "About AVS"): the
      // next section starts with it — `separator` section style (1px grey rule on top).
      // (A section holding only the rule would be dropped by the importer.)
      separatorNext = true;
      current = null;
      return;
    }
    if (component.matches('.c-customizeable')) {
      // related-content cards: own full-width section — its heading as default
      // content, the grid left for the cards-corp-teaser parser
      if (!component.querySelector('.item img')) return;
      const section = startSection('cards');
      const heading = component.querySelector('h2');
      if (heading && text(heading)) {
        const h2 = doc.createElement('h2');
        h2.textContent = text(heading);
        section.nodes.push(h2);
        heading.remove();
      }
      section.nodes.push(component);
      current = null;
      return;
    }
    if (component.matches('.c-standalone-video')) {
      if (!component.querySelector('[data-asset-path], iframe[src]')) return;
      const aside = videoAside(component);
      const columns = aside && videoHeadlineColumns(component, aside, doc);
      if (columns) {
        consumed.add(aside);
        // the source runs the title and small print full width on these pages too: the
        // import script sets `theme: full-width` (templates/news-detail/news-detail-themes.css)
        element.setAttribute('data-news-theme', 'full-width');
        startSection('columns').nodes.push(columns);
        current = null;
        return;
      }
      if (!current || current.kind !== 'body') startSection('body');
      current.nodes.push(component);
      return;
    }
    if (component.matches('.c-curatedcta')) {
      const nodes = buttonNodes(component, doc);
      if (!nodes.length) return;
      // a button is centred when the source centres it (an offset grid column, e.g. the
      // ICU "Nominate a hero" CTA) or it follows centred text; otherwise it stays
      // left-aligned under the article text (e.g. "Listen to the podcast episode")
      const offset = component.closest('[class*="aem-GridColumn--offset--default--"]');
      const centred = (offset && !/aem-GridColumn--offset--default--0\b/.test(offset.className))
        || (current && current.kind.startsWith('center'));
      if (centred) {
        if (!current || !current.kind.startsWith('center')) startSection('center', 'center');
      } else if (!current || !current.kind.startsWith('body')) {
        startSection('body');
      }
      current.nodes.push(...nodes);
      return;
    }
    const { nodes, centred, size } = component.matches('.c-rich-text-editor')
      ? richTextNodes(component, doc)
      : { nodes: headlineNodes(component, doc), centred: false };
    if (!nodes.length) return;
    // a run of rich text with the same alignment and copy styles is one section; the
    // copy styles sit next to `center` (e.g. `center, p-1-25, serif`). A plain-bold
    // paragraph (boldBody) gets a section of its own with `bold-body`.
    nodes.forEach((node) => {
      const copyStyle = node.copyStyle !== undefined ? node.copyStyle : size;
      const extra = [copyStyle || '', node.boldBody ? 'bold-body' : ''].filter(Boolean);
      const styles = [centred ? 'center' : '', ...extra].filter(Boolean);
      const kind = [centred ? 'center' : 'body', ...extra].join(' ');
      // an Egyptienne h3 adds `h-serif` to its section (it stays with the copy around it);
      // a Futura h3 in the same run starts a new section
      const h3Font = node.tagName === 'H3' ? (node.serifHeading ? 'serif' : 'futura') : null;
      if (!current || current.kind !== kind || (h3Font && current.h3Font && current.h3Font !== h3Font)) {
        startSection(kind, styles.join(', ') || undefined);
      }
      if (h3Font) {
        if (h3Font === 'serif' && current.h3Font !== 'serif') {
          current.style = [current.style, 'h-serif'].filter(Boolean).join(', ');
        }
        current.h3Font = h3Font;
      }
      current.nodes.push(node);
    });
  });

  // 4. disclaimer: references (when the article has them) and the document code, in
  // source order. The page's own "Last Updated" wrapper (#publishedDate) is not content.
  const disclaimers = [...doc.querySelectorAll('.c-disclaimer')]
    .filter((el) => !el.querySelector('#publishedDate') && !el.parentElement.closest('.c-disclaimer') && text(el));
  const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
    const box = doc.createElement('div');
    box.innerHTML = disclaimer.innerHTML;
    cleanRichText(box, { wholeParagraphs: true });
    return [...box.children].filter((el) => BLOCK_TAGS.has(el.tagName));
  }), doc);
  // small print: the corp `disclaimer` section style (11.2px copy; references as
  // "N: " entries 15px apart, then the document code)
  // references authored as "1: …" paragraphs keep that look: `references-spaced`
  const disclaimerStyle = disclaimerNodes.converted ? 'disclaimer, references-spaced' : 'disclaimer';
  if (disclaimerNodes.length) startSection('disclaimer', disclaimerStyle).nodes.push(...disclaimerNodes);

  // the title section (when it holds the H1) is followed by a `spacer` section: the
  // article starts 46px below the date on the source (30px spacer + the 15px title gap) —
  // except a lead image placed directly below the date, 15px below it
  if (title.nodes.some((node) => node.tagName === 'H1') && !leadBelowDate) {
    sections.splice(sections.indexOf(title) + 1, 0, { kind: 'spacer', style: 'spacer', nodes: [] });
  }

  // rebuild the body: sections separated by <hr>, each with its Section Metadata (a
  // `spacer` section is the metadata alone)
  const out = [];
  sections.filter((section) => section.nodes.length || section.kind === 'spacer').forEach((section, i) => {
    if (i > 0) out.push(doc.createElement('hr'));
    out.push(...section.nodes);
    if (section.style) {
      out.push(WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      }));
    }
  });
  element.replaceChildren(...out);
}
