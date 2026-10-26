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
 *   4. related-content cards (`.c-customizeable`): their heading plus the grid, left for
 *      the cards-corp-teaser parser, in a section of their own (full width)
 *   5. `.c-disclaimer` references and document code → a small-print `compact` section
 * The "Last Updated" line is not content (scripts/corp.js renders it from `published`).
 *
 * Text normalisation (news-detail spec): source font spans are dropped (body text is
 * Humanist 14px); a rich text whose copy is all in one size span (fontsize-1-25em,
 * fontsize-1-75em) or font span (urw-egyptienne) gets the matching section style
 * (p-1-25, p-1-75, serif); `span.futura-bold` and `<b>` become <strong> (news-detail.css decides
 * Humanist vs Futura bold), gold buttons (a.btn-gold) become bold + italic links (the
 * authoring convention for the gold .button.accent), other buttons bold links, and
 * standalone links (span.standalone-link) bold + underline links (a.link-strong).
 * Asset links (/content/dam/...) point at www.stryker.com, where the files live; links
 * that open in a new tab on the source get the `#_blank` marker.
 */

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
 * A source link that opens in a new tab (target="_blank") gets the author `#_blank`
 * marker (scripts.js decorateLinkTargets sets target="_blank" from it). Links that
 * already carry a #hash, mailto: and tel: are left as they are.
 */
function newTabHref(source, href) {
  if (!href || (source.getAttribute('target') || '').toLowerCase() !== '_blank') return href;
  if (href.includes('#') || /^(mailto|tel):/i.test(href)) return href;
  return `${href}#_blank`;
}

// source copy spans → the corp section style that sets the same copy size / font
const SIZE_STYLES = [
  ['fontsize-1-25em', 'p-1-25'],
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
 * @returns {string} the styles, comma-separated ('' when none)
 */
function copyStyles(root) {
  const copy = [...root.querySelectorAll('p, li')].filter((el) => text(el) && !el.querySelector('p, li'));
  if (!copy.length) return '';
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
function cleanRichText(root) {
  const blocks = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => text(el));
  const centred = blocks.length > 0
    && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute('style') || ''));
  const size = copyStyles(root);

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

  root.querySelectorAll('span.futura-bold, b').forEach((el) => rename(el, 'strong'));
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
function richTextNodes(component, doc) {
  const box = doc.createElement('div');
  const source = component.querySelector(':scope > div') || component;
  box.innerHTML = source.innerHTML;
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
  return { nodes, centred, size };
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

/** A large headline outside the slide: each non-empty line as a paragraph. */
function headlineNodes(component, doc) {
  const box = doc.createElement('div');
  box.innerHTML = component.innerHTML;
  const lines = [...box.querySelectorAll('.line')];
  cleanRichText(box);
  return (lines.length ? lines : [box]).map((line) => {
    if (!text(line)) return null;
    const p = doc.createElement('p');
    while (line.firstChild) p.append(line.firstChild);
    return p;
  }).filter(Boolean);
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || payload.template.name !== 'news-detail') return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const sections = [];
  let current = null;
  const startSection = (kind, style) => {
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

  components.forEach((component) => {
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
      if (isFirst) {
        startSection('lead').nodes.push(...nodes);
        current = null;
        return;
      }
      // an image joins the article section it follows, whatever its copy size
      if (!current || !current.kind.startsWith('body')) startSection('body');
      current.nodes.push(...nodes);
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
      if (!current || current.kind !== 'body') startSection('body');
      current.nodes.push(component);
      return;
    }
    if (component.matches('.c-curatedcta')) {
      const nodes = buttonNodes(component, doc);
      if (!nodes.length) return;
      if (!current || !current.kind.startsWith('center')) startSection('center', 'center');
      current.nodes.push(...nodes);
      return;
    }
    const { nodes, centred, size } = component.matches('.c-rich-text-editor')
      ? richTextNodes(component, doc)
      : { nodes: headlineNodes(component, doc), centred: false };
    if (!nodes.length) return;
    // a run of rich text with the same alignment and copy styles is one section; the
    // copy styles sit next to `center` (e.g. `center, p-1-25, serif`)
    const style = [centred ? 'center' : '', size || ''].filter(Boolean).join(', ') || undefined;
    const kind = `${centred ? 'center' : 'body'}${size ? ` ${size}` : ''}`;
    if (!current || current.kind !== kind) startSection(kind, style);
    current.nodes.push(...nodes);
  });

  // 4. disclaimer: references (when the article has them) and the document code, in
  // source order. The page's own "Last Updated" wrapper (#publishedDate) is not content.
  const disclaimers = [...doc.querySelectorAll('.c-disclaimer')]
    .filter((el) => !el.querySelector('#publishedDate') && !el.parentElement.closest('.c-disclaimer') && text(el));
  const disclaimerNodes = disclaimers.flatMap((disclaimer) => {
    const box = doc.createElement('div');
    box.innerHTML = disclaimer.innerHTML;
    cleanRichText(box);
    return [...box.children].filter((el) => BLOCK_TAGS.has(el.tagName));
  });
  // small print: the shared `compact` section style (11.2px copy, plain links)
  if (disclaimerNodes.length) startSection('disclaimer', 'compact').nodes.push(...disclaimerNodes);

  // rebuild the body: sections separated by <hr>, each with its Section Metadata
  const out = [];
  sections.filter((section) => section.nodes.length).forEach((section, i) => {
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
