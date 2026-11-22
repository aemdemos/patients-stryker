/* global WebImporter */
/*
 * www.stryker.com components → EDS content: the handlers of the corp section builder
 * (tools/importer/corp-section-builder.js), one per row of the approved decision table
 * tools/importer/decisions/component-map.json (outcome + contentModel). A handler gets the
 * component's wrapper element and the builder context, and returns builder items.
 *
 * Add a component by adding a handler under its wrapper class (or `#id`) in COMPONENTS.
 * Components without one are kept as cleaned default content (fallback) and reported.
 */
import {
  BLOCK_TAGS, text, rename, unwrap, absoluteAsset, newTabHref, cleanRichText, copyStyles,
  plainBoldParagraphs, serifHeadings, headingSizeStyle, contentCopy, colourClass, markRuns,
  BLANK_LINE,
} from './corp-richtext.js';
import { standaloneImageNodes, isEmptyXf } from './corp-components.js';
import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import { videoLink } from './parsers/video.js';
import procareModalPath from '../corp-modal-path.js';
import { SETS as DM_SETS } from '../data/dm-sets.js';

const SOURCE = 'https://www.stryker.com';

/* ---------- helpers ---------- */

const block = (doc, name, cells) => WebImporter.Blocks.createBlock(doc, { name, cells });

const linkTo = (doc, href, label = href) => {
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  a.textContent = label;
  return a;
};

const para = (doc, ...children) => {
  const p = doc.createElement('p');
  p.append(...children);
  return p;
};

/** Bracket colour class of an inline style colour (`color: rgb(…)`), or ''. */
function styleColour(el) {
  const m = ((el && el.getAttribute('style')) || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (!m) return '';
  const v = m[1].trim().toLowerCase();
  const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  const hex = rgb ? rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
    : (v.match(/^#([0-9a-f]{6})$/) || [])[1] || '';
  return colourClass(hex);
}

// rendered background classes of a text / headline box → section style (stryker.com palette:
// .bg-* in base.min.css; colours outside it are not rendered, so they have no style)
const BOXES = [
  ['dimensional-box', 'dimensional'],
  ['bg-gold', 'bg-gold'], ['bg-light-gray', 'bg-light-gray'], ['bg-lighter-gray', 'bg-gray'],
  ['bg-dark-gray', 'bg-dark-gray'], ['bg-white', 'bg-white'], ['bg-blue', 'bg-blue'],
  ['bg-purple', 'bg-purple'], ['bg-teal', 'bg-teal'], ['bg-gray', 'bg-silver'],
  ['bg-orange', 'bg-dark-gold'],
  // gradient boxes (stryker.com .bg-*-gradient on .has-background, e.g. the spinejack "Contact
  // us" banner): the panel gradient styles, `dark` for the teal one (approved 2026-11-05)
  ['bg-golden-gradient', 'bg-golden-gradient'], ['bg-dark-purple-gradient', 'bg-dark-purple-gradient'],
  ['bg-dark-blue-gradient', 'bg-dark-blue-gradient'], ['bg-dark-orange-gradient', 'bg-dark-orange-gradient'],
  ['bg-dark-teal-gradient', 'dark'],
];
const isGradient = (style) => /-gradient$|^dark$/.test(style || '');
const boxOf = (el) => (BOXES.find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
/** The background colour style of a box (the dimensional box's own colour included). */
const boxColour = (el) => (BOXES.slice(1)
  .find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
/**
 * Hero Corp box-<colour>: the coloured box behind the text of a slide or banner (its Large
 * Headline / rich text has a background, e.g. environmental-programs: white), approved
 * 2026-10-29. null without one.
 */
const heroBox = (overlay) => {
  const box = overlay && overlay.querySelector('.c-largeheadline > .has-background, .c-rich-text-editor > .has-background');
  const colour = boxColour(box);
  // Hero Corp box options are solid colours only
  return colour && !isGradient(colour) ? `box-${colour.replace(/^bg-/, '')}` : null;
};

/**
 * The section styles of a box on its own: its colour and `boxed` (the background covers the
 * box in the column with the box padding, not the full width), `shadow-box` for the
 * dimensional box (approved 2026-10-29).
 */
const boxStyles = (el) => {
  const colour = boxColour(el);
  const shadow = !!(el && el.classList.contains('dimensional-box'));
  // a gradient's direction (AEM gradientDirection: left-to-right by default, top-to-bottom;
  // gradientDirectionInverse), as rendered: .top-to-bottom / .inverse
  const gradient = isGradient(colour);
  return [colour || '', colour || shadow ? 'boxed' : '', shadow ? 'shadow-box' : '',
    gradient && el.classList.contains('top-to-bottom') ? 'gradient-top-to-bottom' : '',
    gradient && el.classList.contains('inverse') ? 'gradient-inverse' : ''].filter(Boolean);
};

/** The largest fontsize-<n>-vw / fontsize-<n>vw size in an element (3-5 → 3.5), or 0. */
function vwSize(el) {
  return [...el.querySelectorAll('[class*="vw"]')].reduce((max, span) => {
    const m = span.className.match(/fontsize-(\d+)(?:-(\d+))?-?vw/);
    return m ? Math.max(max, Number(`${m[1]}.${m[2] || 0}`)) : max;
  }, 0);
}

// AEM box spacing fields as rendered (style="padding-top: 4%; …") → tokens (decisions
// property-map: carried exactly, lift and shift); scripts/corp-spacing.js applies them
const SPACING_PROPS = ['padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'margin-top', 'margin-bottom', 'margin-left', 'margin-right'];

/**
 * The box spacing of a rendered text / Large Headline box: padding-top-4 (padding-top 4% of the
 * column), padding-left-3-6 (3.6%), margin-top-minus-8 (-8%), padding-top-10px. Empty fields
 * ("padding-top: %;") and values the browser ignores (e.g. "10px%") have no effect on live, so
 * none here.
 */
export function spacingOf(box) {
  const style = (box && box.getAttribute && box.getAttribute('style')) || '';
  // the browser's reading of the style, as on live: a box whose style a live script changed
  // is serialised with shorthands (the gradient boxes: "padding: 3% 3% 2%; background-image:
  // …", arise-1000-ex "Product features"), which the longhand pattern alone would miss
  const parsed = box && box.style && typeof box.style.getPropertyValue === 'function' ? box.style : null;
  return SPACING_PROPS.flatMap((prop) => {
    const value = parsed ? parsed.getPropertyValue(prop) : '';
    const m = value ? value.match(/^(-?\d+(?:\.\d+)?)(%|px)$/)
      : style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)(%|px)\\s*(?:;|$)`));
    if (!m || Number(m[1]) === 0) return [];
    return [`${prop}-${m[1].replace('-', 'minus-').replace('.', '-')}${m[2] === 'px' ? 'px' : ''}`];
  });
}

/** The spacing tokens of the first spaced box among items (a hero text box), or []. */
const itemsSpacing = (items) => ((items || []).find((it) => it.type === 'flow' && (it.spacing || []).length) || {}).spacing || [];

/** A [[spacing,…]] paragraph: the start of a spaced box in a cell (no tokens = the end). */
function spacingMarker(doc, tokens) {
  const p = doc.createElement('p');
  p.textContent = `[[${['spacing', ...tokens].join(',')}]]`;
  return p;
}

/** The colour of an item's own text box (bg-gold, dark …), or '' (boxStyles). */
const ownColour = (it) => (it.type === 'flow' && (it.styles || []).includes('boxed')
  && it.styles[0] !== 'boxed' ? it.styles[0] : '');

/**
 * Flow items of one container (a cell, a flex section) → nodes with [[spacing]] markers
 * around the spaced boxes. With `colours`, a coloured text box among other content gets its
 * colour in the marker too (the Box line's colour: target-xtra's gold "86%" box above a
 * footnote, sternalplate's blue tiles under their images; approved 2026-11-09)
 */
function markedNodes(items, nodesOf, doc, { colours = false } = {}) {
  let open = false;
  return items.flatMap((it) => {
    const colour = colours ? ownColour(it) : '';
    // (a dimensional box keeps its shadow: Box: White, Shadow … — product-security's CVD tabs)
    const shadow = colour && (it.styles || []).includes('shadow-box') ? ['shadow'] : [];
    const tokens = it.type === 'flow' ? [...(colour ? [colour] : []), ...shadow, ...(it.spacing || [])] : [];
    const nodes = nodesOf(it);
    if (!nodes.length) return [];
    if (tokens.length) {
      open = true;
      return [spacingMarker(doc, tokens), ...nodes];
    }
    if (open) {
      open = false;
      return [spacingMarker(doc, []), ...nodes];
    }
    return nodes;
  });
}

/** A button paragraph: gold → Bold + Italic link, other colours → Bold link (conventions). */
function buttonNode(doc, source, label) {
  const a = linkTo(doc, newTabHref(source, absoluteAsset(source.getAttribute('href'))), label);
  const strong = doc.createElement('strong');
  if (source.classList.contains('btn-gold')) {
    const em = doc.createElement('em');
    em.append(a);
    strong.append(em);
  } else {
    strong.append(a);
  }
  return para(doc, strong);
}

/**
 * Inline content directly in a rich-text box (text, <sup>, links … not in a paragraph, e.g.
 * the page hero p.content copied without its <p>) → paragraphs; a double <br> starts a
 * new paragraph, as it reads on the source.
 */
function wrapInlineRuns(box, doc) {
  let run = null;
  [...box.childNodes].forEach((node) => {
    // a <br> already dropped as the second half of a paragraph break
    if (node.parentNode !== box) return;
    if (node.nodeType === 1 && (BLOCK_TAGS.has(node.tagName) || node.tagName === 'DIV')) {
      run = null;
      return;
    }
    if (node.nodeType === 1 && node.tagName === 'BR' && run) {
      let next = node.nextSibling;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
      if (next && next.nodeName === 'BR') {
        next.remove();
        node.remove();
        run = null;
        return;
      }
    }
    if (!run) {
      if (node.nodeType === 3 && !node.textContent.trim()) return;
      run = doc.createElement('p');
      node.before(run);
    }
    run.append(node);
  });
}

/**
 * A blank line (a paragraph of only &nbsp;, spaces or line breaks: stryker.com spaces text
 * with them, one 19.25px line + 15px each) → the `[[Blank line]]` paragraph of the readable
 * conventions (scripts/corp-settings.js), approved 2026-11-08. A paragraph of one &nbsp;
 * comes already written as one (markLivePage: the Helix importer drops it otherwise).
 */
export { BLANK_LINE };
/** The line between two columns of text in a flex section (scripts/corp.js), approved 2026-11-08 */
export const COLUMN_BREAK = 'Column break';
const isBlankParagraph = (p) => !p.closest('li, td, th')
  && !p.querySelector('img, picture, iframe, video, input, svg')
  && (p.textContent === BLANK_LINE || !p.textContent.replace(/[\s\u00a0\u200b]/g, ''));
/** n blank-line paragraphs */
const blankLines = (doc, n) => Array.from({ length: n }, () => {
  const p = doc.createElement('p');
  p.textContent = BLANK_LINE;
  return p;
});

/** Rich text (cleaned) → block nodes, each with its copy style (as the news rules). */
export function richTextNodes(source, doc) {
  const box = contentCopy(source, doc);
  wrapInlineRuns(box, doc);
  // blank lines are kept where they are (the cleaner drops empty paragraphs)
  const blanks = [...box.querySelectorAll('p')].filter(isBlankParagraph);
  blanks.forEach((p) => { p.textContent = BLANK_LINE; });
  const plainBold = plainBoldParagraphs(box);
  const serifHeads = serifHeadings(box);
  // text with a plain <b> run (Humanist bold on the source, not span.futura-bold): read before
  // the cleaner turns every bold into <strong>
  const plainB = (b) => !b.closest('.futura-bold') && !b.querySelector('.futura-bold');
  const inlineBold = new Set([...box.querySelectorAll('p, li, ul, ol')]
    .filter((el) => [...el.querySelectorAll('b')].some(plainB)));
  // h2 / h3 authored 1.25x / 1.5x (their size class goes with the cleaning)
  const headingSizes = new Map([...box.querySelectorAll('h2, h3')]
    .map((h) => [h, headingSizeStyle(h)]).filter(([, s]) => s));
  // copy styles per top-level element: one serif lead paragraph keeps its own font
  const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
  blanks.forEach((p) => elementStyles.set(p, null));
  // each run's own size / font, for what the section styles cannot carry (finishRuns)
  markRuns(box);
  // (a blank line has no run of its own: no size tag around it)
  blanks.forEach((p) => { p.textContent = BLANK_LINE; });
  const { centred, size } = cleanRichText(box);
  const nodes = [];
  [...box.childNodes].forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) nodes.push(node);
    else if (node.nodeType === 1 && node.tagName === 'IMG') nodes.push(para(doc, node));
    else if (node.nodeType === 1 && node.tagName === 'DIV') {
      nodes.push(...[...node.children].filter((el) => BLOCK_TAGS.has(el.tagName)));
    } else if (text(node)) nodes.push(para(doc, node.cloneNode(true)));
  });
  nodes.forEach((node) => {
    if (plainBold.has(node)) node.boldBody = true;
    if (inlineBold.has(node)) node.inlineBold = true;
    if (serifHeads.has(node)) node.serifHeading = true;
    if (headingSizes.has(node)) node.headingSize = headingSizes.get(node);
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
  return { nodes, centred };
}

/** Counters → one Statistics (count-up, count-once, cols-N) block: stryker.com counters
 * count up once and keep their numbers (the block's default recounts on every view). */
export function statistics(counters, ctx, columns = counters.length, countUp = true) {
  const rows = counters.map((c) => (c.colour ? [c.colour, c.value, c.desc] : [c.value, c.desc]));
  const cols = `cols-${Math.min(Math.max(columns, 1), 4)}`;
  // left-aligned counters (numberCounterAlignment text-left): the left option (approved)
  const left = counters.some((c) => c.left) ? ', left' : '';
  return block(ctx.doc, `Statistics (${countUp ? 'count-up, count-once, ' : ''}${cols}${left})`, rows);
}

/** [[align-center]…] on the paragraphs and headings with text inside a node (a block). */
function tagCentredIn(node, doc) {
  [...node.querySelectorAll('p, h1, h2, h3, h4, h5, h6')].forEach((n) => {
    const t = text(n);
    if (!t || t === BLANK_LINE || /^box(:| end)/i.test(t) || /^\[\[(align-|spacing)/.test(n.textContent)) return;
    // (an image link line stays as it is: images are centred by their cell)
    const only = n.children.length === 1 && n.firstElementChild.tagName === 'A' && text(n.firstElementChild) === t
      && /\/is\/image\/|\.(png|jpe?g)/i.test(n.firstElementChild.getAttribute('href') || '');
    if (only) return;
    n.prepend(doc.createTextNode('[[align-center]'));
    n.append(doc.createTextNode(']'));
  });
}

/** Section-level nodes of items (in one section: tabs panels, flex sections). */
export function inlineNodes(items, ctx, { marks = true } = {}) {
  if (marks && items.some((it) => it.type === 'flow' && ((it.spacing || []).length || ownColour(it)))) {
    const nodesOf = (it) => inlineNodes([it], ctx, { marks: false });
    return markedNodes(items, nodesOf, ctx.doc, { colours: true });
  }
  const out = [];
  let counters = [];
  const flushCounters = () => {
    // consecutive counters: one Statistics block
    if (counters.length) out.push(statistics(counters, ctx));
    counters = [];
  };
  items.forEach((item) => {
    if (item.type !== 'counter') flushCounters();
    if (item.type === 'counter') counters.push(item);
    else if (item.type === 'flow') out.push(...item.nodes);
    else if (item.type === 'block') out.push(item.block);
    else if (['own', 'fragment', 'form'].includes(item.type)) {
      // a centred block in a tab panel or flex section (ivas-elite's kits): its texts get
      // [[align-center]…] tags, the section style cannot reach them
      const styles = (item.styles || []).filter((s) => s !== 'center');
      if (item.type === 'own' && styles.length !== (item.styles || []).length) {
        item.nodes.forEach((node) => tagCentredIn(node, ctx.doc));
      }
      if (item.type === 'own' && styles.length) ctx.report.notes.push(`section style ${styles.join(', ')} of a nested ${item.kind} dropped`);
      out.push(...item.nodes);
    } else if (item.type === 'group') out.push(...inlineNodes(item.items, ctx));
    else if (item.type === 'anchor') ctx.report.notes.push(`anchor #${item.id} inside a nested section, dropped`);
    else if (item.type === 'spacer' && item.lines) out.push(...blankLines(ctx.doc, item.lines));
  });
  flushCounters();
  return out;
}

/* ---------- column controls (component-map rows columncontrol/cols*) ---------- */

const hasContent = (items) => items.some((it) => it.type !== 'spacer' && (it.type !== 'flow' || it.nodes.length));
/**
 * An empty component slot: stryker.com spaces content with empty components that still take
 * their place in the parsys, an empty column control (1px + the 20 / 30px component gap) or a
 * hidden section title (0 + the gap); arise-1000-ex has five. The builder turns consecutive
 * slots into one spacer section (corp: one component gap per slot).
 */
const SLOT = (lines = 0) => ({ type: 'spacer', slots: 1, lines });
// blank-only text components (spacer items of lines only) inside other content: their lines
const linesOnly = (it) => it.type === 'spacer' && !it.slots && it.lines > 0;
const asBlankLines = (it, doc) => (linesOnly(it)
  ? {
    type: 'flow', role: 'blank', nodes: blankLines(doc, it.lines), box: it.box,
  } : it);
const isTitle = (node) => /^H[1-6]$/.test(node.tagName)
  || (node.tagName === 'P' && node.querySelector('strong') && text(node.querySelector('strong')) === text(node));
const isCta = (node) => node.tagName === 'P' && node.querySelectorAll('a').length === 1
  && text(node.querySelector('a')) === text(node);

/** Every text item of a container is centred throughout (its section can be `center`). */
function allCentred(items) {
  const texts = items.filter((it) => it.type === 'flow' && it.role === 'text');
  return texts.length > 0 && texts.every((it) => it.centred);
}

/**
 * Texts centred throughout in a container whose section style cannot centre them (a flex
 * column or a card next to left-aligned ones; pneumoclear's figures): [[align-center]…] on
 * their paragraphs and headings, as for a centred line in a left text (corp-richtext.js)
 */
function centreTagged(items, doc) {
  items.filter((it) => it.type === 'flow' && it.role === 'text' && it.centred).forEach((it) => {
    it.nodes.filter((n) => /^(P|H[1-6])$/.test(n.tagName) && text(n) && text(n) !== BLANK_LINE
      && !/^\[\[align-/.test(n.textContent)).forEach((n) => {
      n.prepend(doc.createTextNode('[[align-center]'));
      n.append(doc.createTextNode(']'));
    });
    it.centred = false;
  });
}

/** Branch F: image first, then a title and a CTA, no video. */
function isCard(items) {
  if (!items.every((it) => it.type === 'flow')) return false;
  if (!items.length || items[0].role !== 'image') return false;
  const rest = items.slice(1).flatMap((it) => it.nodes);
  return rest.length >= 2 && isTitle(rest[0]) && isCta(rest[rest.length - 1]);
}

/** A cell's content: flow nodes, and blocks that have a cell form (video links). */
function cellNodes(items, ctx, { marks = false, colours = false } = {}) {
  if (marks) return markedNodes(items, (it) => cellNodes([it], ctx), ctx.doc, { colours });
  return items.flatMap((it) => {
    if (it.type === 'flow') return it.nodes;
    if (it.type === 'block' && it.cellNodes) return it.cellNodes;
    if (linesOnly(it)) return blankLines(ctx.doc, it.lines);
    if (it.type === 'separator') {
      ctx.report.notes.push('section separator inside a column, dropped');
      return [];
    }
    return [];
  });
}

// a label: a paragraph that is one bold run (Futura <strong><em> or plain <strong>)
const isLabel = (node) => node.tagName === 'P' && node.querySelector('strong')
  && text(node.querySelector('strong')) === text(node) && !node.querySelector('a, picture, img');
const sizeOf = (style) => (style || '').split(', ').find((s) => /^p-\d/.test(s)) || '';
// label sizes with a section style (styles/styles-corp.css label-*)
const LABEL_STYLES = { 'p-1-5': 'label-1-5', 'p-1-75': 'label-1-75', 'p-2': 'label-2' };

/**
 * The section styles of a Columns block: the copy style shared by every text node of the
 * cells but the labels (labels are often set larger than the copy beside them), plus the
 * labels' size when they share one that differs from the copy.
 */
function sharedCopyStyle(cells, ctx) {
  const nodes = cells.flat().filter((n) => n.copyStyle !== undefined);
  // the copy style of most of the text (a block has one set of section styles): e.g. a
  // short serif title over the body copy keeps the body's style; the others are reported
  const weights = new Map();
  nodes.filter((n) => !isLabel(n)).forEach((n) => {
    const style = n.copyStyle || '';
    weights.set(style, (weights.get(style) || 0) + text(n).length);
  });
  if (!weights.size) {
    // only labels (e.g. image + caption tiles): their shared size is the block's copy size
    const sizes = new Set(nodes.filter(isLabel).map((n) => sizeOf(n.copyStyle)));
    return sizes.size === 1 ? [...sizes][0] : '';
  }
  const [copy] = [...weights.entries()].sort((a, b) => b[1] - a[1])[0];
  if (weights.size > 1) {
    const others = [...weights.keys()].filter((s) => s !== copy).map((s) => s || 'default');
    ctx.report.notes.push(`Columns: mixed copy styles, kept ${copy || 'default'} (also ${others.join(' / ')})`);
  }
  const labelSizes = new Set(nodes.filter(isLabel).map((n) => sizeOf(n.copyStyle)));
  const [labelSize] = [...labelSizes];
  if (labelSizes.size !== 1 || !labelSize || labelSize === sizeOf(copy)) return copy;
  if (LABEL_STYLES[labelSize]) return [copy, LABEL_STYLES[labelSize]].filter(Boolean).join(', ');
  ctx.report.notes.push(`Columns: label size ${labelSize} has no label style, labels take the copy size`);
  return copy;
}

/**
 * The section styles of block cells (Columns, a hero overlay): the shared copy style, and
 * h-serif when every h2 / h3 in them is serif.
 */
function cellStyles(cells, ctx) {
  const copy = sharedCopyStyle(cells, ctx);
  const heads = cells.flat().filter((n) => /^H[23]$/.test(n.tagName));
  // a heading that is bold throughout (span.futura-bold): Futura whatever the section font; a
  // footnote marker after it (<sup><b>2</b></sup>, early-mobility-benefits-icu) doesn't count
  const boldRuns = (h) => [...h.children].filter((c) => c.tagName !== 'SUP');
  const allBold = (h) => {
    const runs = boldRuns(h);
    const outside = [...h.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    return runs.length === 1 && runs[0].tagName === 'STRONG' && !outside && !h.querySelector('em');
  };
  const serif = heads.some((n) => n.serifHeading)
    && heads.every((n) => n.serifHeading || allBold(n));
  if (!serif && heads.some((n) => n.serifHeading)) ctx.report.notes.push('serif and Futura h2 / h3 in one block, kept in Futura');
  // without h-serif a bold-throughout h2 is a plain corp h2 (Futura bold by default,
  // typography-map futura-heading), not the Columns bold display heading; a corp h3 is
  // Egyptienne by default, so its bold stays
  if (!serif) {
    heads.filter((h) => h.tagName === 'H2' && allBold(h)).forEach((h) => unwrap(boldRuns(h)[0]));
  }
  // plain bold in the cells (Humanist bold, e.g. "Reorder #7502"): bold-body
  const boldBody = cells.flat().some((n) => n.inlineBold || n.boldBody);
  // the h2 / h3 size when every one of them is authored at the same larger size
  const sizes = new Set(heads.map((n) => n.headingSize || ''));
  const headingSize = sizes.size === 1 ? [...sizes][0] : '';
  return [...(copy ? copy.split(', ') : []), serif ? 'h-serif' : '', headingSize, boldBody ? 'bold-body' : ''].filter(Boolean);
}

// a fraction of the 12-column grid → its style suffix (8 → 2-3)
const FRACTIONS = {
  3: '1-4', 4: '1-3', 6: '1-2', 8: '2-3', 9: '3-4', 10: '5-6',
};
// where a column starts, in twelfths → its col-at-<start> suffix (an article body centred at
// 8/12 after 2, going-the-distance-for-front-line-heroes; 10/12 after 1)
const STARTS = { ...FRACTIONS, 1: '1-12', 2: '1-6' };

/**
 * The section styles of a column with content of its own in an otherwise empty column
 * control (widths in twelfths): col-<width> and, when it does not start at the left,
 * col-at-<start> (e.g. a 2/3 column at the left → col-2-3; the right half → col-1-2,
 * col-at-1-2), and col-phone when the column keeps that place on phones too (an AEM grid
 * column with no phone width of its own). Full-width or unknown splits: none.
 */
function columnStyles(widths, index, ctx, starts = null, phone = false) {
  if (!widths || !widths[index]) return [];
  const width = widths[index];
  const start = starts ? starts[index] : widths.slice(0, index).reduce((sum, w) => sum + w, 0);
  if (width >= 12) return [];
  if (!FRACTIONS[width] || (start && !STARTS[start])) {
    ctx.report.notes.push(`one filled column of ${width}/12 at ${start}/12: no column style, full width`);
    return [];
  }
  return [`col-${FRACTIONS[width]}`, ...(start ? [`col-at-${STARTS[start]}`] : []), ...(phone ? ['col-phone'] : [])];
}

/**
 * A column control (or a responsive-grid row) → items, by the approved branch order:
 * A all empty → nothing; B one column → its content; counters only → Statistics; C a form
 * beside content → flex section (flex-67-33 / flex-33-67 by the split); D a block beside
 * content → flex section; E an XF beside content → flex section; F image + title + CTA per
 * column → Cards Corp; G → Columns (variant by the split, modifiers by the cell content).
 * @param {object[][]} columns the items of each column
 * @param {object} split { variant, flex, cards } of the column control
 * @param {number[]} [widths] the columns' widths in twelfths (rendered col-md-N, else col-sm-N)
 * @param {number[]} [starts] where each column starts, in twelfths (grid rows with offsets)
 */
export function columnItems(columns, split, ctx, widths = null, starts = null) {
  const { doc } = ctx;
  const anchors = [];
  // (an empty slot inside a column only lengthens that column: dropped; blank lines stay in a
  // column with other content, as text; the branch and options below are chosen without them)
  const withBlanks = columns.map((items) => {
    const kept = items.filter((it) => {
      if (it.type === 'anchor') anchors.push(it);
      return it.type !== 'anchor' && (it.type !== 'spacer' || linesOnly(it));
    });
    return hasContent(kept) ? kept.map((it) => asBlankLines(it, doc)) : kept.filter((it) => it.type !== 'spacer');
  });
  const cols = withBlanks.map((items) => items.filter((it) => it.role !== 'blank'));
  const filled = cols.filter(hasContent);
  if (!filled.length) return anchors;
  if (filled.length === 1) {
    // B: one column with content: its content, at that column's width and position
    // (lift and shift: e.g. a news article body in the 2/3 column of a 2/3 + 1/3 control)
    const at = cols.indexOf(filled[0]);
    const phone = !!(split.phoneKeeps && split.phoneKeeps[at]);
    const styles = columnStyles(widths, at, ctx, starts, phone);
    if (!styles.length) return [...anchors, { type: 'boundary' }, ...withBlanks[at], { type: 'boundary' }];
    return [...anchors, { type: 'group', styles, items: withBlanks[at] }];
  }

  // the product intro's right column: its button(s) above the tag crumb go in the Related
  // Categories block's first row, so the column is the block (live: "Request information"
  // over "Related categories" in the col-sm-4, medpor-neurosurgery)
  filled.forEach((items, i) => {
    const last = items[items.length - 1];
    const header = last && last.type === 'block' && last.block.querySelector('tr > *');
    if (!header || !/^Related Categories$/i.test(text(header))) return;
    const before = items.slice(0, -1).filter((it) => hasContent([it]));
    if (!before.length || !before.every((it) => it.type === 'flow' && it.role === 'cta')) return;
    const row = ctx.doc.createElement('tr');
    const cell = ctx.doc.createElement('td');
    cell.append(...before.flatMap((it) => it.nodes));
    row.append(cell);
    header.parentElement.after(row);
    // the buttons' colour goes with them (btn-purple: medpor's "Request information")
    last.styles = [...(last.styles || []), ...before.flatMap((it) => it.styles || [])];
    filled[i] = [last];
  });
  const all = filled.flat();
  if (filled.every((items) => items.every((it) => it.type === 'counter'))) {
    return [...anchors, {
      type: 'own', kind: 'statistics', styles: [], nodes: [statistics(all, ctx, filled.length)],
    }];
  }

  // a flex section keeps its buttons' colour (btn-purple / btn-blue, a section style)
  const buttonColours = (items) => [...new Set(items.flatMap((it) => (it.styles || [])
    .filter((s) => /^btn-/.test(s))))];
  // (texts centred throughout: the section's center style when all are, else their own tags;
  // 1788-platform's cards, pneumoclear's figures)
  const flex = (styles, items) => {
    const centre = allCentred(items);
    if (!centre) centreTagged(items, doc);
    return {
      type: 'own',
      kind: 'flex',
      styles: ['flex', ...styles, ...(centre ? ['center'] : []), ...buttonColours(items)],
      nodes: inlineNodes(items, ctx),
    };
  };
  const formCol = filled.findIndex((items) => items.some((it) => it.type === 'form'));
  if (formCol >= 0) {
    // C: the form column's text above / below the form goes in the sections around it
    const items = filled[formCol];
    const at = items.findIndex((it) => it.type === 'form');
    const before = items.slice(0, at).filter((it) => hasContent([it]));
    const after = items.slice(at + 1).filter((it) => hasContent([it]));
    const inFlex = filled.map((col, i) => (i === formCol ? [items[at]] : col)).flat();
    return [
      ...anchors, { type: 'boundary' }, ...before,
      flex(split.flex ? [split.flex] : [], inFlex),
      { type: 'boundary' }, ...after, { type: 'boundary' },
    ];
  }
  const inCell = (it) => it.type === 'flow' || it.type === 'separator' || (it.type === 'block' && it.cellNodes);
  if (!all.every(inCell)) {
    // D / E: a flex section has equal columns; a grid row of unequal widths stays stacked
    // (its columns' content mixes in the section's wrappers, so widths cannot follow)
    if (split.grid && split.unequal) {
      ctx.report.notes.push(`responsive grid row (${split.variant}) with blocks or fragments: no layout for unequal widths, stacked`);
      return columns.flat();
    }
    // tabs alone in the last column: the flex section keeps their tabbed style, the other
    // columns' content comes before the first tab title, so scripts.js buildTabbedSections
    // leaves it beside the tabs (approved 2026-10-31; emergency-medical-services: video |
    // Westland / Delhi / Vernon). Not when another column has headings as deep as the titles
    const last = filled[filled.length - 1];
    if (last.length === 1 && last[0].type === 'own' && last[0].kind === 'tabs') {
      const others = inlineNodes(filled.slice(0, -1).flat(), ctx);
      const level = Number((last[0].nodes.find((n) => /^H[1-6]$/.test(n.tagName)) || { tagName: 'H6' }).tagName[1]);
      if (!others.some((n) => /^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) >= level)) {
        return [...anchors, {
          type: 'own', kind: 'flex', styles: ['flex', ...last[0].styles], nodes: [...others, ...last[0].nodes],
        }];
      }
      ctx.report.notes.push('tabs beside content with headings as deep as the tab titles: tabbed style dropped');
    }
    // two columns that are one wrapper each (all text in one, a single block or fragment in
    // the other): the section's two wrappers are the columns, so the split's widths can
    // follow (product intro col-sm-8 + Related Categories col-sm-4: flex-67-33, medpor)
    const oneWrapper = (items) => items.every(inCell)
      || items.filter((it) => hasContent([it])).length === 1;
    if (split.flex && filled.length === 2 && filled.every(oneWrapper)) {
      return [...anchors, flex([split.flex], all)];
    }
    // columns of several pieces (text + a chart, a table, an accordion …): the pieces of each
    // column (EDS wrappers: a run of default content, or a block) stay together as that column,
    // flex-cols-<n>-<n> (scripts/corp.js; surpass-evolve: text | chart + footnote), with the
    // split's widths. A column ending in text before one starting with text gets a `Column
    // break` line between them (the two would be one wrapper; vcf-accessories)
    const centreAll = allCentred(all);
    if (!centreAll) centreTagged(all, doc);
    const colNodes = filled.map((items) => inlineNodes(items, ctx));
    const isBlock = (node) => node.tagName === 'TABLE';
    const pieces = colNodes.map((nodes) => nodes
      .filter((node, i) => i === 0 || isBlock(node) || isBlock(nodes[i - 1])).length);
    if (pieces.some((n) => n > 1) && pieces.every((n) => n > 0)) {
      colNodes.slice(1).forEach((nodes, i) => {
        const before = colNodes[i];
        if (!isBlock(nodes[0]) && !isBlock(before[before.length - 1])) {
          const line = ctx.doc.createElement('p');
          line.textContent = COLUMN_BREAK;
          before.push(line);
        }
      });
      const splitWidths = split.flex && filled.length === 2 ? [split.flex] : [];
      return [...anchors, {
        type: 'own',
        kind: 'flex',
        styles: ['flex', ...splitWidths, `flex-cols-${pieces.join('-')}`, ...(centreAll ? ['center'] : []), ...buttonColours(all)],
        nodes: colNodes.flat(),
      }];
    }
    return [...anchors, flex([], all)];
  }

  if (split.cards && filled.length >= 2 && filled.every(isCard)) {
    // F: Cards Corp, one row per column: image | title + text + CTA
    const centre = allCentred(filled.flat());
    if (!centre) centreTagged(filled.flat(), doc);
    const rows = filled.map((items) => [items[0].nodes, items.slice(1).flatMap((it) => it.nodes)]);
    return [...anchors, {
      type: 'own', kind: 'cards', styles: centre ? ['center'] : [], nodes: [block(doc, `Cards Corp (${split.cards})`, rows)],
    }];
  }

  // G: Columns, one row, one cell per column (empty columns keep their cell). A cell whose
  // content is one spaced box (or boxes with the same spacing) gets cell-<N>-<token> options;
  // other spaced boxes are marked inside the cell ([[spacing,…]])
  const modifiers = [];
  const cells = cols.map((items, i) => {
    const content = items.filter((it) => (it.type === 'flow' && it.nodes.length) || (it.type === 'block' && it.cellNodes));
    const spaced = content.filter((it) => (it.spacing || []).length);
    // the column's box colour (every box in it the same colour): cell-<N>-<colour>, e.g.
    // cell-1-bg-purple (insignia key benefits, flowtriever clinical evidence), approved 2026-11-05
    const colours = content.map((it) => ((it.styles || []).includes('boxed') && it.styles[0] !== 'boxed' ? it.styles[0] : null));
    const cellColour = colours.length && colours[0] && colours.every((c) => c === colours[0]);
    if (cellColour) modifiers.push(`cell-${i + 1}-${colours[0]}`);
    // coloured boxes among other content: the colour on their Box lines
    const boxedInside = !cellColour && colours.some(Boolean);
    // the column's image border (every image in it the same: variax-2-foot's bor-black plates,
    // 45 product pages): cell-<N>-image-border(-black / -grey); a standalone image's own
    // border is its section style, which a cell cannot carry
    const borders = content.filter((it) => it.role === 'image').map((it) => (it.styles || []).find((st) => st.startsWith('image-border')) || null);
    if (borders.length && borders[0] && borders.every((b) => b === borders[0])) modifiers.push(`cell-${i + 1}-${borders[0]}`);
    // (the cell itself holds the column's blank lines too)
    const cell = withBlanks[i];
    if (boxedInside) return cellNodes(cell, ctx, { marks: true, colours: true });
    if (!spaced.length) return cellNodes(cell, ctx);
    const same = new Set(spaced.map((it) => it.spacing.join(' '))).size === 1;
    if (same && spaced.length === content.length) {
      modifiers.push(...spaced[0].spacing.map((t) => `cell-${i + 1}-${t}`));
      return cellNodes(cell, ctx);
    }
    return cellNodes(cell, ctx, { marks: true });
  });
  // large-headline sets the Large Headline type scale on every cell (serif copy and lists,
  // grey italic lines): only when no column is ordinary rich text (about 80 column controls
  // put a Large Headline next to rich text, e.g. jr45/july); the h1 scale applies anyway
  const headline = cols.some((items) => items.some((it) => it.role === 'headline'));
  // rich text in any column, also under a Large Headline in the same column (its lines carry
  // their own sizes and fonts as tags): core-2-console "Everyone claims…", safeair, high-speed-
  // drills, where large-headline set that copy in the 21px serif (Humanist 14px on the source)
  const richText = cols.some((items) => items.some((it) => it.role === 'text'));
  if (headline && !richText) modifiers.push('large-headline');
  if (headline && richText) ctx.report.notes.push('Columns: Large Headline next to rich text, large-headline modifier left out');
  const flows = (items) => items.filter((it) => it.type === 'flow' && it.nodes.length);
  const first = flows(cols[0]);
  const last = flows(cols[cols.length - 1]);
  if (first.length && first.every((it) => it.box === 'bg-gold')) modifiers.push('gold-first');
  if (last.length && last[0].box === 'bg-light-gray') modifiers.push('gray-lead');
  if (last.length && last.every((it) => it.box === 'dimensional')) modifiers.push('boxed-last');
  if (cols.every((items) => flows(items).every((it) => it.role === 'image'))) modifiers.push('media-pair');
  // (named boxes only: the builder also keeps each item's source .page-section in `box`)
  const boxes = cols.flatMap((items) => flows(items)).filter((it) => typeof it.box === 'string');
  const used = { 'bg-gold': 'gold-first', 'bg-light-gray': 'gray-lead', dimensional: 'boxed-last' };
  boxes.filter((it) => !modifiers.includes(used[it.box])).forEach((it) => {
    ctx.report.notes.push(`Columns: ${it.box} box not reproduced (no variant for it in that cell): ${text(it.nodes[0] || doc.createElement('p')).slice(0, 40)}`);
  });
  const variants = [split.variant, ...modifiers].filter(Boolean);
  const name = variants.length ? `Columns (${variants.join(', ')})` : 'Columns';
  // centred text in every column with text (source text-align: center: the anchorage-2 link
  // grid, image captions under centred images): the section style center, as for default
  // content; otherwise each centred text gets its own [[align-center]…] tags (the cells' nodes
  // are the items' nodes; hoffmann-lrf, infinity, ivas-elite)
  const texts = (items) => flows(items).filter((it) => !['image', 'blank'].includes(it.role));
  const withText = cols.filter((items) => texts(items).length);
  const centred = withText.filter((items) => texts(items).every((it) => it.centred));
  const centre = withText.length > 0 && centred.length === withText.length;
  if (!centre) centreTagged(cols.flat(), doc);
  return [...anchors, {
    type: 'own', kind: 'columns', styles: [...cellStyles(cells, ctx), ...(centre ? ['center'] : [])], nodes: [block(doc, name, [cells])],
  }];
}

// AEM column-control splits (component-map rows)
const SPLITS = {
  cols2: { variant: 'columns-50-50', cards: 'two-up' },
  'cols2_2-3_1-3': { variant: 'columns-67-33', flex: 'flex-67-33' },
  'cols2_1-3_2-3': { variant: 'columns-33-67', flex: 'flex-33-67' },
  cols3: { variant: '', cards: 'three-up' },
  cols4: { variant: '' },
};
// responsive-grid rows by their column widths
const GRID_SPLITS = {
  '6,6': SPLITS.cols2, '8,4': SPLITS['cols2_2-3_1-3'], '4,8': SPLITS['cols2_1-3_2-3'], '4,4,4': SPLITS.cols3, '3,3,3,3': SPLITS.cols4,
};

/** A column control column's width at a bootstrap size (xs, sm, md), in twelfths; 0 when unset. */
const colWidth = (col, size) => Number((col.className.match(new RegExp(`\\bcol-${size}-(\\d+)\\b`)) || [])[1]) || 0;

/**
 * The phone layout of a column control as Columns grid options, when it is not the one the
 * corp Columns give its cells below 600px (four cells two per row, fewer cells stacked): the
 * columns' col-xs widths, with the desktop widths (col-md, else col-sm) as the grid. The
 * history-of-cutting-blades timeline (col-xs-12 col-sm-6 col-md-3) is one per row on phones,
 * not two. Other widths keep the variant's layout (the grid's tablet range, 600–1199px, is
 * not the source's 840 / 1024px steps).
 * @param {Element[]} columns the control's column elements
 * @returns {string[]} the grid options, or none
 */
function phoneGrid(columns) {
  const desktop = columns.map((col) => colWidth(col, 'md') || colWidth(col, 'sm'));
  const phone = columns.map((col) => colWidth(col, 'xs') || 12);
  if (!desktop.every(Boolean) || desktop.reduce((a, b) => a + b, 0) > 12) return [];
  const usual = columns.length === 4 ? 6 : 12;
  if (phone.every((w) => w === usual)) return [];
  return [`grid-${desktop.join('-')}`, `grid-m-${phone.join('-')}`];
}

function columnControl(el, ctx) {
  const split = [...el.classList].find((c) => /^cols\d?/.test(c)) || 'cols';
  const row = el.querySelector(':scope > .colctrl > .row') || el.querySelector('.row');
  const columns = row ? [...row.children].filter((c) => /\bcol-/.test(c.className)) : [];
  const items = columns.map((col) => ctx.collect(col));
  // the desktop widths (col-md, else col-sm): a lone filled column keeps its width from 1024px
  // (EDS 900px) and up, e.g. an image in the 3/12 column of a 4-column control
  // (stryker-named-a-best-workplace-in-europe-for-second-consecutive: col-sm-6 col-md-3)
  const widths = columns.map((col) => colWidth(col, 'md') || colWidth(col, 'sm'));
  // an empty column control (any split): an empty slot, with the anchors it holds and the
  // blank lines of its tallest column (evolve-radial-head-system: two blank lines = 69px + 30px)
  if (!hasContent(items.flat())) {
    const lines = Math.max(0, ...items.map((col) => col.filter(linesOnly)
      .reduce((sum, it) => sum + it.lines, 0)));
    return [...items.flat().filter((it) => it.type === 'anchor'), SLOT(lines)];
  }
  // cols: one column = a section boundary
  if (split === 'cols' || columns.length < 2) {
    // only blank lines and a separator (1788-platform: two blank lines above the line before a
    // Large Headline): the empty slot of those lines, then the separator
    const all = items.flat();
    if (all.every((it) => ['anchor', 'separator', 'spacer'].includes(it.type))) {
      const lines = all.filter(linesOnly).reduce((sum, it) => sum + it.lines, 0);
      return [...all.filter((it) => it.type === 'anchor'), SLOT(lines), ...all.filter((it) => it.type === 'separator')];
    }
    // (blank lines next to other content stay inside the box: blank-line paragraphs)
    const flat = all.map((it) => asBlankLines(it, ctx.doc));
    return hasContent(flat) ? [{ type: 'boundary' }, ...flat, { type: 'boundary' }] : flat;
  }
  if (!SPLITS[split]) ctx.report.notes.push(`column control ${split}: no Columns variant, imported as plain Columns`);
  const spec = SPLITS[split] || {};
  const grid = phoneGrid(columns);
  const layout = grid.length ? { ...spec, variant: [spec.variant, ...grid].filter(Boolean).join(', '), grid: true } : spec;
  return columnItems(items, layout, ctx, widths.every(Boolean) ? widths : null);
}

/**
 * The Columns grid options of a responsive-grid row (blocks/columns: grid-…): the columns'
 * widths in grid units at each breakpoint, `o<N>` an offset before a column, `n` a column
 * that starts a new line, `h` a hidden one; `of<N>` the grid's columns when not 12 (nested
 * grid). grid-t-… (tablet) and grid-m-… (phone) only where they differ from the default:
 * as on AEM, a breakpoint without its own class keeps the default value, column by column.
 * @param {object[]} specs the columns' gridSpec
 * @param {number} total the grid's columns
 */
export function gridOptions(specs, total) {
  const value = (spec, bp, key) => spec[bp][key] ?? spec.d[key];
  const tokens = (bp) => specs.map((spec) => {
    const beh = value(spec, bp, 'beh');
    if (beh === 'hide') return 'h';
    const o = value(spec, bp, 'o');
    return `${o ? `o${o}-` : ''}${beh === 'newline' ? 'n' : ''}${value(spec, bp, 'w')}`;
  }).join('-');
  const d = tokens('d');
  const t = tokens('t');
  const m = tokens('m');
  return [
    `grid-${total === 12 ? '' : `of${total}-`}${d}`,
    ...(t !== d ? [`grid-t-${t}`] : []),
    ...(m !== d ? [`grid-m-${m}`] : []),
  ];
}

function gridRow(columns, widths, ctx, { specs = [], total = 12 } = {}) {
  const offsets = specs.some((spec) => spec.d.o);
  const split = total === 12 && !offsets ? GRID_SPLITS[widths.join(',')] : null;
  if (split) {
    // the split variants stack below 600px and keep the default widths from 600px; a row
    // laid out otherwise on tablet / phone also gets the grid options (they set the layout)
    const grid = gridOptions(specs, total);
    const stacked = `grid-m-${specs.map(() => 12).join('-')}`;
    if (!grid.some((option) => option.startsWith('grid-t-')) && grid.includes(stacked)) {
      return columnItems(columns, split, ctx, widths);
    }
    const variant = [split.variant, ...grid].filter(Boolean).join(', ');
    return columnItems(columns, { ...split, variant, grid: true }, ctx, widths);
  }
  // any other row: Columns with the source widths, offsets and breakpoints (a single filled
  // column keeps its width and position as column styles when it is a fraction of 12)
  const starts = [];
  specs.reduce((at, spec) => {
    starts.push(at + (spec.d.o || 0));
    return at + (spec.d.o || 0) + spec.d.w;
  }, 0);
  const twelfths = total === 12 ? { widths, starts } : null;
  // phones: a column with no phone width or offset of its own keeps its desktop place
  const keepsPhone = (spec) => spec.m.w === null && spec.m.o === null && !spec.m.beh;
  const grid = {
    variant: gridOptions(specs, total).join(', '),
    grid: true,
    unequal: offsets || new Set(widths).size > 1,
    phoneKeeps: specs.map(keepsPhone),
  };
  return columnItems(columns, grid, ctx, twelfths?.widths, twelfths?.starts);
}

/* ---------- components ---------- */

function textComponent(el, ctx) {
  const source = el.querySelector('.c-rich-text-editor > div') || el.querySelector('.c-rich-text-editor') || el;
  const { nodes, centred } = richTextNodes(source, ctx.doc);
  if (!nodes.length) {
    // (an empty box with vertical padding / margin: the authors' spacer — sage/urine-management,
    // padding-top 7% and 5% before the PrimoFit video, ~170px on live)
    const gap = spacingOf(source).filter((t) => /^(padding|margin)-(top|bottom)-/.test(t));
    return gap.length ? [{
      type: 'spacer', slots: 0, lines: 0, box: boxOf(source), pull: gap,
    }] : [];
  }
  const box = boxOf(source);
  // only blank lines: an empty slot of that many lines (a spacer, or blank lines in a cell)
  if (nodes.every((n) => text(n) === BLANK_LINE)) {
    // (a negative bottom margin on them pulls what follows up: the home page awards, two
    // blank lines at margin-bottom -10% before "View all awards"; the spacer keeps it)
    const pull = spacingOf(source).filter((t) => /^margin-bottom-minus-/.test(t));
    return [{
      type: 'spacer', slots: 0, lines: nodes.length, box, pull,
    }];
  }
  const item = {
    type: 'flow', role: 'text', nodes, centred, box, spacing: spacingOf(source),
  };
  // a coloured / dimensional box on its own (not in a column): its section shows the box
  item.styles = boxStyles(source);
  return [item];
}

// image border classes (base.min.css .c-standalone-image img.bor-*) → section styles
const BORDERS = {
  'bor-teal': 'image-border',
  'bor-black': 'image-border-black',
  'bor-gray': 'image-border-grey',
  'bor-dark_gray': 'image-border-grey',
  'bor-dark_gray_40T': 'image-border-grey',
  // (live #1c5687 and #fff: axs-lift, fortress-wall-system)
  'bor-blue': 'image-border-blue',
  'bor-white': 'image-border-white',
};
function standaloneImage(el, ctx) {
  const nodes = standaloneImageNodes(el, ctx.doc);
  if (!nodes.length) return [];
  const img = el.querySelector('img[class*="bor-"]');
  const cls = img && [...img.classList].find((c) => c.startsWith('bor-'));
  if (cls && !BORDERS[cls]) ctx.report.notes.push(`image border ${cls}: no style, imported without border`);
  const border = cls && BORDERS[cls];
  return [{
    type: 'flow', role: 'image', nodes, ...(border ? { styles: [border], own: true } : {}),
  }];
}

function buttons(el, ctx) {
  const { doc } = ctx;
  // a curated CTA's title (h4.cta-title, often linked) and description (p.cta-description)
  // above its button
  const head = [];
  // an image above it that links nowhere (.cta-img without a link: prime-series "Improved
  // local monitoring"); a linked one is an image button, below
  const images = [...el.querySelectorAll('.cta-img img[src]')].filter((source) => !source.closest('a[href]')).map((source) => {
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    if (!source.getAttribute('alt')) ctx.report.notes.push(`image without alt text: ${source.getAttribute('src')}`);
    return para(doc, img);
  });
  const title = el.querySelector('.cta-title');
  if (title && text(title)) {
    const h = doc.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h4');
    const a = title.querySelector('a[href]');
    // the title is Egyptienne Light, a linked one black (stryker.com .c-curatedcta .cta-title,
    // e.g. surgical/learn "Contact us")
    const label = (value, link) => `[[${link ? 'serif,color-black' : 'serif'}]${value}]`;
    h.append(a ? linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute('href'))), label(text(a), true)) : doc.createTextNode(label(text(title))));
    head.push(h);
  }
  // a subtitle above the button (p.cta-subtitle.subheading: Futura bold, black, 17.5px on
  // phones and 21px from 480px; performance-series-blades "Stryker Precision Saw",
  // 1st-metatarso-phalangeal-mtp-arthrodesis "Anchorage CP MTP plate") → a Bold Heading 3,
  // whose corp sizes are those (17.5px, 21px from 600px)
  el.querySelectorAll('.cta-subtitle').forEach((d) => {
    if (!text(d)) return;
    const h3 = doc.createElement('h3');
    const strong = doc.createElement('strong');
    strong.textContent = text(d);
    h3.append(strong);
    head.push(h3);
  });
  el.querySelectorAll('.cta-description').forEach((d) => { if (text(d)) head.push(para(doc, doc.createTextNode(text(d)))); });
  const nodes = [...el.querySelectorAll('a[href]')].filter((a) => !a.closest('.cta-title, .cta-description')).map((a) => {
    // a text CTA (a.action-link: Futura bold uppercase teal with a triangle, as span.standalone-
    // link; 419 curated CTAs, e.g. infinity "LINKEDIN") → bold + underline link (link-strong),
    // not a button
    if (text(a) && a.classList.contains('action-link')) {
      const u = doc.createElement('u');
      u.textContent = text(a);
      const link = linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute('href'))), '');
      link.append(u);
      const strong = doc.createElement('strong');
      strong.append(link);
      return para(doc, strong);
    }
    if (text(a)) return buttonNode(doc, a, text(a));
    // an image button (.cta-img): the image, linked
    const source = a.querySelector('img');
    if (!source) return null;
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    const link = linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute('href'))), '');
    link.append(img);
    if (!source.getAttribute('alt')) ctx.report.notes.push(`image button without alt text: ${source.getAttribute('src')}`);
    return para(doc, link);
  }).filter(Boolean);
  // purple / blue buttons: the btn-purple / btn-blue section style (approved 2026-10-29)
  const colour = ['btn-purple', 'btn-blue'].find((c) => el.querySelector(`a.${c}`));
  return [
    ...(images.length ? [{ type: 'flow', role: 'image', nodes: images }] : []),
    ...(head.length ? [{ type: 'flow', role: 'text', nodes: head }] : []),
    ...(nodes.length ? [{
      type: 'flow', role: 'cta', nodes, ...(colour ? { styles: [colour], own: true } : {}),
    }] : []),
  ];
}

/**
 * Large Headline: line1 + line2 in order; authored headings keep their level, plain lines
 * become paragraphs. Formatting through the corp rich-text rules. When the page has no h1,
 * the first Futura vw line becomes the h1.
 */
function largeHeadline(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-largeheadline > .largeheadline') || el;
  const lines = [...root.querySelectorAll('.line')];
  const nodes = [];
  let centred = false;
  (lines.length ? lines : [root]).forEach((line) => {
    const box = contentCopy(line, doc);
    const futuraVw = !!line.querySelector('.futura-bold') && vwSize(line) > 0;
    // Egyptienne h2 / h3 (the source default without span.futura-bold), read before cleaning
    const serifHeads = serifHeadings(box);
    // a line set in a centred block (often a <div style="text-align: center">, which the
    // rich-text cleaner renames without its style)
    const squashed = (e) => text(e).replace(/\s+/g, '');
    const centredText = [...line.querySelectorAll('[style*="text-align"]')]
      .filter((e) => /text-align:\s*center/i.test(e.getAttribute('style')))
      .map(squashed).join('');
    if (squashed(line) && centredText === squashed(line)) centred = true;
    // inline runs between block elements become paragraphs
    let run = null;
    [...box.childNodes].forEach((node) => {
      if (node.nodeType === 1 && (BLOCK_TAGS.has(node.tagName) || node.tagName === 'DIV')) {
        run = null;
        return;
      }
      if (!run) {
        run = doc.createElement('p');
        node.before(run);
      }
      run.append(node);
    });
    // an h4 line is Futura bold on live unless its text is set in Egyptienne (the innermost
    // font class): bold, as the Columns large-headline title is the light serif when plain
    // (24 of the 34 Large Headline h4s, e.g. inspace "Understanding InSpace")
    box.querySelectorAll('h4').forEach((h) => {
      const walker = doc.createTreeWalker(h, 4); // NodeFilter.SHOW_TEXT
      let serif = true;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const font = n.textContent.trim() && n.parentElement.closest('.urw-egyptienne, .futura-bold');
        if (n.textContent.trim() && (!font || !font.classList.contains('urw-egyptienne') || !h.contains(font))) serif = false;
      }
      if (serif || !text(h)) return;
      const span = doc.createElement('span');
      span.className = 'futura-bold';
      while (h.firstChild) span.append(h.firstChild);
      h.append(span);
    });
    // each run's own size / font (vw lines), for what the section styles cannot carry; plain
    // Large Headline copy is Egyptienne on live
    markRuns(box, { serifDefault: true });
    if (cleanRichText(box).centred) centred = true;
    [...box.children].filter((n) => text(n) || n.querySelector('img')).forEach((n) => {
      let node = n;
      if (n.tagName === 'H1') ctx.h1 = true;
      if (!ctx.h1 && futuraVw && !nodes.length && n.tagName !== 'H1') {
        node = rename(n, 'h1');
        // Futura bold in a paragraph is bold + italic (<strong><em>); in a heading that is the
        // gold convention, and the line is black on live: plain bold
        node.querySelectorAll('strong > em').forEach(unwrap);
        ctx.h1 = true;
      }
      if (node === n && serifHeads.has(n)) node.serifHeading = true;
      nodes.push(node);
    });
  });
  if (!nodes.length) return [];
  const size = vwSize(root);
  const box = boxOf(root);
  // a Large Headline with a background of its own (.has-background) is a box in its column
  // (boxed: axs-infinity-ls golden, bone-mill orange: x30 w1380 at 1440px); its colour from the
  // full-bleed panel around it is a band (the panel's section style: anchorage-2, inbone).
  // A smaller headline box is a box too
  const own = boxColour(root);
  const styles = size >= 2
    ? [own || '', own ? 'boxed' : '', 'large-headline'].filter(Boolean)
    : boxStyles(root);
  return [{
    type: 'flow', role: 'headline', nodes, box, size, styles, centred, spacing: spacingOf(root),
  }];
}

function sectionTitle(el, ctx) {
  const title = el.querySelector('.c-section-title');
  const id = title && title.id;
  const heading = title && title.querySelector('.title-container h1, .title-container h2, .title-container h3, .title-container h4');
  const items = id ? [{ type: 'anchor', id }] : [];
  if (heading && text(heading) && el.getAttribute('data-corp-hidden') !== 'true') {
    // rendered with a gold bottom border: the Underline heading convention
    const h = ctx.doc.createElement(heading.tagName.toLowerCase());
    const u = ctx.doc.createElement('u');
    u.textContent = text(heading);
    h.append(u);
    // a subtitle under the title (e.g. an h3 description on the training video pages)
    const rest = [...heading.parentElement.children].filter((n) => n !== heading && text(n));
    const more = rest.flatMap((n) => {
      const box = contentCopy(n, ctx.doc);
      cleanRichText(box);
      return [rename(box, BLOCK_TAGS.has(n.tagName) ? n.tagName.toLowerCase() : 'p')];
    });
    items.push({ type: 'flow', role: 'text', nodes: [h, ...more] });
  } else if (title && el.getAttribute('data-corp-hidden') !== 'true'
    && title.getAttribute('data-corp-hidden') !== 'true') {
    // a hidden title (hideSectionTitleComp) keeps its component box: an empty slot
    items.push(SLOT());
  }
  return items;
}

/**
 * Block content inside a block cell (a Hero Corp slide overlay): blocks cannot nest, so a
 * nested block (WebImporter table) gives its cells' content in place, e.g. a page hero in a
 * slide XF (Columns page-intro: trevo-nxt) or an XF in it (Fragment: its link, which the page
 * loads as a fragment: sternalplate); 2 pages rendered the block name as text.
 */
function cellContent(nodes, doc) {
  return nodes.flatMap((node) => {
    if (node.tagName !== 'TABLE') return [node];
    return [...node.querySelectorAll(':scope > tbody > tr > td, :scope > tr > td')].flatMap((td) => {
      const kids = [...td.childNodes].filter((n) => n.nodeType === 1 || text(n));
      if (kids.every((n) => n.nodeType === 1 && BLOCK_TAGS.has(n.tagName))) return kids;
      return kids.length ? [para(doc, ...kids)] : [];
    });
  });
}

/**
 * fullWidthImage: a banner image (desktop crop in the picture's
 * min-width source, mobile crop in its img) with an optional text box. With text: Hero Corp
 * (image-slide, text-above), as live: the text box over the image from 841px (600px here),
 * above the image on phones; the Large Headline lines carry their own vw sizes (tags).
 * Without text: the image as default content.
 */
function fullWidthImage(el, ctx) {
  const { doc } = ctx;
  const img = el.querySelector('.imgBoxId img') || el.querySelector('img');
  const box = el.querySelector('.textBoxId');
  // the text box's own spacing goes on the block (Hero Corp options, scripts/corp-spacing.js)
  const boxItems = box ? ctx.collect(box) : [];
  const overlay = boxItems.length
    ? cellContent(inlineNodes(boxItems, ctx, { marks: false }), doc) : [];
  if (!img && !overlay.length) return [];
  const source = img && img.closest('picture') && img.closest('picture').querySelector('source[media*="min-width"]');
  const image = (src) => {
    const i = doc.createElement('img');
    i.setAttribute('src', absoluteAsset(src));
    i.setAttribute('alt', img.getAttribute('alt') || '');
    return i;
  };
  const desktop = img && image((source && source.getAttribute('srcset').split(/[\s,]/)[0]) || img.getAttribute('src'));
  const mobile = img && source && image(img.getAttribute('src'));
  if (!overlay.length) return [{ type: 'flow', role: 'image', nodes: [para(doc, desktop)] }];
  // the text box: col-sm-N wide from the left (right-<100 - N/12>), a bottom-text box anchored
  // to the image bottom (the Hero Corp text-above / bottom-<n> options, fullWidthImageHero)
  const bottom = box && box.classList.contains('bottom-text');
  const variants = ['image-slide', bottom ? 'bottom-0' : 'text-above'];
  // the banner in the page container (.pDiv.container: 15px gutters, at most 1410px), not full
  // bleed (spinejack-system, All-inside-meniscal-repair-system: x30 w1380 at 1440px)
  const pdiv = el.matches('.pDiv') ? el : el.querySelector('.pDiv');
  if (pdiv && pdiv.classList.contains('container')) variants.push('contained');
  // the banner card's shadow (stryker.com .pDiv.bg-shadow / .imgBoxId.bg-shadow: 10px at 30%;
  // multigen2, optablate-bvn, spinejack, s3: 23 product pages)
  if (el.querySelector('.pDiv.bg-shadow, .imgBoxId.bg-shadow') || el.matches('.pDiv.bg-shadow')) variants.push('shadow');
  const cols = box && [...box.classList].map((c) => c.match(/^col-sm-(\d+)$/)).find(Boolean);
  if (cols && Number(cols[1]) < 12) variants.push(`right-${Math.round(100 - (Number(cols[1]) * 100) / 12)}`);
  // the lines carry their own sizes ([[size-<n>vw]] tags): no size-<n> / copy-size-<n>
  if (heroBox(box)) variants.push(heroBox(box));
  variants.push(...itemsSpacing(boxItems));
  const rows = [desktop && [desktop], mobile && [mobile], [overlay]].filter(Boolean);
  return [{
    type: 'own', kind: 'hero', styles: cellStyles([overlay], ctx), nodes: [block(doc, `Hero Corp (${variants.join(', ')})`, rows)],
  }];
}

/**
 * fullWidthImageHero (component-map: Hero Corp image-slide, text-above / bottom-<n>): the page
 * title above (.hero-space h1, gold on the source: its colour as a colour tag), then the
 * banner with its text box as fullWidthImage.
 */
function fullWidthImageHero(el, ctx) {
  const items = [];
  const title = el.querySelector('.hero-space h1, .hero-space h2');
  // a title line set transparent (rgba(…, 0): 31 heroes) is invisible on live but is the page's
  // heading for search engines and screen readers: kept, visually hidden ([[visually-hidden]],
  // approved 2026-11-01; nse/products/silverglide "SILVERGlide")
  const transparent = title && /color:\s*(transparent|rgba\([^)]*,\s*0\s*\))/i.test(title.getAttribute('style') || '');
  if (title && text(title) && transparent) {
    const h = ctx.doc.createElement(title.tagName.toLowerCase());
    h.textContent = `[[visually-hidden]${text(title)}]`;
    if (title.tagName === 'H1') ctx.h1 = true;
    items.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  if (title && text(title) && !transparent) {
    const box = contentCopy(title, ctx.doc);
    // the heading's own inline colour (style on the h1) as a span the cleaner maps to a tag
    const colour = title.getAttribute('style');
    if (colour && /color/i.test(colour)) {
      const span = ctx.doc.createElement('span');
      span.setAttribute('style', colour);
      span.append(...box.childNodes);
      box.append(span);
    }
    cleanRichText(box);
    // the hero title is Futura bold at every width (stryker.com .hero-space h1, measured on
    // surgical/learn): the Bold heading convention
    if (!box.querySelector('strong')) {
      const strong = ctx.doc.createElement('strong');
      strong.append(...box.childNodes);
      box.append(strong);
    }
    if (title.tagName === 'H1') ctx.h1 = true;
    items.push({ type: 'flow', role: 'text', nodes: [rename(box, title.tagName.toLowerCase())] });
  }
  // (in the source's order: the title area after the banner on some pages — meniscal-repair,
  // live y707 under the 273–687 banner — before it on others, suture-and-tape-offerings)
  const banner = el.querySelector('.pDiv');
  // (4: DOCUMENT_POSITION_FOLLOWING alone, the title after the banner and not inside it)
  const after = !!(title && banner && banner.compareDocumentPosition(title) === 4);
  const hero = fullWidthImage(banner || el, ctx);
  return after ? [...hero, ...items] : [...items, ...hero];
}

/**
 * h1-title (component-map: h1): the page title, a plain h1 — Egyptienne 28px on phones, Futura
 * bold from 600px as live (styles-corp.css, the default-content h1).
 */
function h1Title(el, ctx) {
  const source = el.querySelector('h1');
  if (!source || !text(source)) return [];
  const box = contentCopy(source, ctx.doc);
  cleanRichText(box);
  ctx.h1 = true;
  return [{ type: 'flow', role: 'text', nodes: [rename(box, 'h1')] }];
}

function experienceFragment(el, ctx) {
  const match = ctx.xfMatches && ctx.xfMatches.get(el);
  if (match) {
    const a = linkTo(ctx.doc, match.eds);
    return [{
      type: 'fragment', kind: 'fragment', styles: [], nodes: [block(ctx.doc, 'Fragment', [[a]])],
    }];
  }
  if (isEmptyXf(el)) return [];
  ctx.report.notes.push(`XF not matched to the index, kept inline: ${text(el).slice(0, 50)}`);
  return ctx.collect(el);
}

function carousel(el, ctx) {
  const { doc } = ctx;
  const slides = [...el.querySelectorAll('.carouselslide:not(.slick-cloned)')];
  if (!slides.length) return [];
  const index = ctx.slideIndex || 0;
  ctx.slideIndex = index + slides.length;
  // a carousel of several slides: one Hero Corp per slide, each slide's section with the
  // `carousel` style (scripts/corp.js buildCarouselSections rotates consecutive ones, approved
  // 2026-11-01); the first slide carries the source options: autoplay-<ms> (data-autoplay +
  // data-autoplayspeed) and fade (data-transition)
  const widget = el.querySelector('[data-widget="stryker-autocarousel"]');
  const options = ['carousel'];
  if (widget && widget.getAttribute('data-autoplay') === 'true') {
    const ms = Number(widget.getAttribute('data-autoplayspeed')) || 3000;
    options.push(`autoplay-${Math.max(ms, 1000)}`);
  }
  if (widget && widget.getAttribute('data-transition') === 'true') options.push('fade');
  const multi = slides.length > 1;
  let first = true;
  const slideStyles = () => {
    if (!multi) return [];
    const out = first ? options : ['carousel'];
    first = false;
    return out;
  };
  return slides.flatMap((slide, i) => {
    // slide XFs that cannot be imported (e.g. a mobile variation never published) are
    // reported; the live page shows what it can, nothing is invented
    const ref = (ctx.slideRefs || [])[index + i];
    if (ref) {
      ['desktop', 'mobile'].forEach((side) => {
        const target = ref[side];
        if (target && !target.eds) ctx.report.notes.push(`${side} slide XF ${target.xf} is ${target.status}: not imported`);
      });
    }
    // the overlay through the component handlers (rich text, buttons, Large Headline lines
    // with their colours and their own sizes as [[size-<n>vw]] / [[size-<n>em]] tags)
    const overlay = slide.querySelector('.overlayparsys');
    if (!slide.querySelector('img') && !slide.dataset.xfDesktop && !(overlay && text(overlay))) return [];
    const overlayItems = overlay ? ctx.collect(overlay) : [];
    // a slide XF that is a whole composition (its own copy, image and button: gmrs "GMRS Global
    // Modular Replacement System", insignia, triathlon-revision; Hero Corp only takes a slide
    // fragment's image) and no overlay: the fragment itself, the mobile XF in its place below
    // 600px (section styles desktop-only / mobile-only, source 841px)
    const copyText = (selector) => {
      const area = slide.querySelector(selector);
      if (!area) return '';
      const copy = area.cloneNode(true);
      copy.querySelectorAll('script, style, [class*="s7"]').forEach((e) => e.remove());
      return text(copy);
    };
    // a phone slide XF that was never published (hosted: built from the page's rendering,
    // which has no phone slide): live shows the slide's image only from 841px (insignia,
    // 1788-platform; the user's call, 2026-11-09)
    const phoneSlideMissing = !!(ref && ref.mobile
      && ref.mobile.xf !== (ref.desktop && ref.desktop.xf)
      && (!ref.mobile.eds || ref.mobile.hosted) && !copyText('.experienceFragment-ef-mobile'));
    if (slide.dataset.xfDesktop && !(overlay && text(overlay)) && copyText('.experienceFragment-ef')) {
      const fragment = (path, styles) => ({
        type: 'fragment', kind: 'fragment', styles, nodes: [block(doc, 'Fragment', [[linkTo(doc, path)]])],
      });
      const carouselStyles = slideStyles();
      // in a carousel a slide is one section: the desktop composition at every width
      const both = !carouselStyles.length && slide.dataset.xfMobile && copyText('.experienceFragment-ef-mobile');
      // (no phone slide: the whole composition is desktop-only, as live shows nothing there)
      const unpublishedMobile = !carouselStyles.length && phoneSlideMissing;
      if (both) {
        return [
          fragment(slide.dataset.xfDesktop, [...carouselStyles, 'desktop-only']),
          fragment(slide.dataset.xfMobile, [...carouselStyles, 'mobile-only']),
        ];
      }
      return [fragment(slide.dataset.xfDesktop, [...carouselStyles, ...(unpublishedMobile ? ['desktop-only'] : [])])];
    }
    // a slide whose XF the page does not render (unpublished, redirect): its overlay copy is
    // still on the live page, kept as text (sonopet-iq "Introducing Pulse Control")
    if (!slide.querySelector('img') && !slide.dataset.xfDesktop) {
      ctx.report.notes.push(`slide without an image (its XF not rendered): overlay copy kept as text: ${text(overlay).slice(0, 40)}`);
      return overlayItems;
    }
    const overlayNodes = overlay
      ? cellContent(inlineNodes(overlayItems, ctx, { marks: false }), doc) : undefined;
    if (overlayNodes && overlayNodes.some((n) => n.tagName === 'H1')) ctx.h1 = true;
    // no size-<n> / copy-size-<n> options: each line carries its own size (a line without a
    // vw size keeps the page type, as live: inspace "A breakthrough in the shoulder…" h1 28px)
    const variants = [];
    // the slide image in the right half of the slide XF's grid: the product hero layout
    // (any column that starts in the grid's right half: offset 6 / width 6, and offset 7 / width 5
    // on Bari10A, Prime TC and Prime Series, which otherwise became a full-width image behind the
    // text)
    const startsRight = (col) => Number(
      /aem-GridColumn--offset--default--(\d+)/.exec(col.className)?.[1],
    ) >= 6;
    if ([...slide.querySelectorAll('.experienceFragment-ef [class*="aem-GridColumn--offset--default--"]')]
      .some(startsRight)) variants.push('image-right');
    if (heroBox(overlay)) variants.push(heroBox(overlay));
    // (no phone slide: below 600px the overlay copy alone, without the image)
    if (phoneSlideMissing && !slideStyles().length) variants.push('no-phone-image');
    // the text box's own spacing (Hero Corp options, scripts/corp-spacing.js)
    variants.push(...itemsSpacing(overlayItems));
    const holder = doc.createElement('div');
    holder.append(slide.cloneNode(true));
    heroImageSlideParser(holder.firstElementChild, {
      document: doc,
      overlayNodes: overlayNodes && overlayNodes.length ? overlayNodes : undefined,
      variants,
      vwSize: false,
    });
    // the overlay's copy style and serif headings, as for Columns cells
    return [{
      type: 'own',
      kind: 'hero',
      styles: [...slideStyles(), ...(overlayNodes ? cellStyles([overlayNodes], ctx) : [])],
      nodes: [...holder.children],
    }];
  });
}

/** Jump bar (jumpbarnav, or the template's own .c-navigation-bar) → Sticky Nav: label | #id. */
function jumpBar(el, ctx) {
  const rows = [...el.querySelectorAll('a[data-linking]')].filter((a) => text(a))
    .map((a) => [text(a), `#${a.getAttribute('data-linking')}`]);
  return rows.length ? [{
    type: 'own', kind: 'nav', styles: [], nodes: [block(ctx.doc, 'Sticky Nav', rows)],
  }] : [];
}

// full-bleed panel background classes → section styles (component-map fullbleedpanel)
const PANELS = {
  'bg-light-gray': 'bg-light-gray',
  'bg-gold': 'bg-gold',
  'bg-dark-gray': 'bg-dark-gray',
  'bg-white': 'bg-white',
  'bg-dark-teal-gradient': 'dark',
  'bg-dark-purple-gradient': 'bg-dark-purple-gradient',
  'bg-dark-blue-gradient': 'bg-dark-blue-gradient',
  'bg-dark-orange-gradient': 'bg-dark-orange-gradient',
  'bg-golden-gradient': 'bg-golden-gradient',
  'bg-blue': 'blue',
  // the panel's bg-purple is the Stryker purple (#85458a); its bg-gray the silver (#b2b4ae,
  // e.g. target-tetra), not the light bg-gray band
  'bg-purple': 'bg-purple',
  'bg-gray': 'bg-silver',
};

/**
 * Large hero carousel (component-map hero-large-carousel, approved: one Columns (columns-50-50)
 * band per slide; reuses the corp carousel, 2026-11-01): the header title as the h1, then each
 * slide as its own section with the `carousel` style and the slide's band (PANELS): title (h2,
 * the light serif) and subtitle | product image, linked when the slide links. Measured on
 * nse/products/malis-disposable-non-stick-bipolar-forceps (4 slides, no autoplay, slides in).
 */
function heroLargeCarousel(el, ctx) {
  const { doc } = ctx;
  const out = [];
  const title = el.querySelector('.c-hero-large-header .title');
  if (title && text(title)) {
    // Futura bold 21px on the source: Bold, 0.75 × the h1
    const h1 = doc.createElement('h1');
    const strong = doc.createElement('strong');
    strong.textContent = `[[size-0-75em]${text(title)}]`;
    h1.append(strong);
    ctx.h1 = true;
    out.push({ type: 'flow', role: 'text', nodes: [h1] });
  }
  const slides = [...el.querySelectorAll('.slide:not(.slick-cloned)')].filter((s) => text(s) || s.querySelector('img'));
  slides.forEach((slide, i) => {
    const container = slide.querySelector('.slide-container') || slide;
    const band = [...container.classList].map((c) => PANELS[c]).find(Boolean);
    const textCell = [];
    const heading = slide.querySelector('.slide-title');
    if (heading && text(heading)) {
      const h2 = doc.createElement('h2');
      const copy = contentCopy(heading, doc);
      cleanRichText(copy);
      h2.append(...copy.childNodes);
      textCell.push(h2);
    }
    const subtitle = slide.querySelector('.slide-subtitle');
    if (subtitle && text(subtitle)) {
      const copy = contentCopy(subtitle, doc);
      cleanRichText(copy);
      textCell.push(para(doc, ...copy.childNodes));
    }
    const link = slide.querySelector('a.slide-link[href]');
    if (link && text(link)) textCell.push(buttonNode(doc, link, text(link)));
    const img = slide.querySelector('.slide-image-container.hidden-xs img, .slide-image img');
    const imageCell = [];
    if (img) {
      const image = doc.createElement('img');
      image.setAttribute('src', img.getAttribute('src'));
      image.setAttribute('alt', (img.getAttribute('alt') || '').trim());
      if (!img.getAttribute('alt')) ctx.report.notes.push(`carousel slide image without alt text: ${img.getAttribute('src')}`);
      imageCell.push(para(doc, image));
    }
    out.push({
      type: 'own',
      kind: 'columns',
      // banner: this component's look (gold arrow tabs at the edges, no dots, centred copy)
      styles: ['carousel', ...(i ? [] : ['banner']), ...(band ? [band] : []), 'h-serif'],
      nodes: [block(doc, 'Columns (columns-50-50)', [[textCell, imageCell]])],
    });
  });
  if (slides.length < 2) {
    out.forEach((item) => {
      if (item.styles) item.styles = item.styles.filter((st) => !['carousel', 'banner'].includes(st));
    });
  }
  return out;
}

function fullBleedPanel(el, ctx) {
  const panel = el.querySelector('.c-full-bleed-panel') || el;
  const items = ctx.collect(panel);
  const cls = [...panel.classList].find((c) => PANELS[c]);
  if (!hasContent(items.filter((it) => it.type !== 'anchor' && it.type !== 'boundary'))) {
    const anchors = items.filter((it) => it.type === 'anchor');
    // an empty coloured panel shown with its section spacing (page-section) is a band: the
    // 34px gold stripe under the news heroes (section style stripe, approved 2026-10-31);
    // without page-section it has no height on live
    if (cls && cls !== 'bg-white' && panel.classList.contains('page-section')) {
      return [...anchors, {
        type: 'own', kind: 'stripe', styles: [PANELS[cls], 'stripe'], nodes: [],
      }];
    }
    return anchors;
  }
  if (!cls && /\bbg-/.test(panel.className)) ctx.report.notes.push(`full-bleed panel background ${panel.className}: no section style`);
  return [{ type: 'group', styles: cls ? [PANELS[cls]] : [], items }];
}

/** Remote component (microapp) → widget link in its own section (component-map). */
function remoteComponent(el, ctx) {
  const input = el.querySelector('input.hdnSelComp');
  const value = (input && input.getAttribute('value')) || '';
  const [id, url] = value.split('|');
  if (!url) return [];
  const query = new URLSearchParams({ url: url.trim(), id: id.trim() }).toString();
  const a = linkTo(ctx.doc, `/widgets/remote-component?${query}`, id.trim());
  return [{
    type: 'own', kind: 'widget', styles: [], nodes: [para(ctx.doc, a)],
  }];
}

/**
 * Marketo form → Marketo Form block; the base URL and Munchkin ID of the forms2 script the
 * live page loads (markLivePage), the captcha rows when the live form has one.
 */
function marketoForm(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-marketo-form') || el;
  const form = root.querySelector('form[id^="mktoForm_"]');
  const alert = root.querySelector('[id^="alert_"]');
  const facts = (ctx.facts && ctx.facts.forms) || [];
  ctx.formIndex = (ctx.formIndex || 0) + 1;
  const formId = (form && form.id.replace('mktoForm_', ''))
    || (alert && alert.id.replace('alert_', '')) || (facts[ctx.formIndex - 1] || {}).formId;
  if (!formId) {
    ctx.report.notes.push('Marketo form without a form ID, dropped');
    return [];
  }
  const base = root.getAttribute('data-corp-marketo-base') || '//lp.stryker.com';
  const munchkin = (base.match(/\/\/(\d{3}-[A-Z]{3}-\d{3})\./) || [])[1] || '338-WAP-571';
  const rows = [['Base URL', base], ['Munchkin ID', munchkin], ['Form ID', formId]];
  const captcha = root.getAttribute('data-corp-captcha');
  if (captcha) {
    rows.push(['Captcha Script', `${SOURCE}/etc.clientlibs/stryker/components/content/altcha/altcha.js`]);
    rows.push(['Captcha Challenge URL', new URL(captcha, SOURCE).href]);
  }
  return [{
    type: 'form', kind: 'form', styles: [], nodes: [block(doc, 'Marketo Form', rows)],
  }];
}

// counter colours (bracket colour classes) → Statistics colour keywords
const COUNTER_COLOURS = {
  'color-gold': 'gold', 'color-blue': 'navy', 'color-navy': 'navy', 'color-teal': 'teal', 'color-purple': 'purple',
};

/** Number counter → a Statistics row (count-up): colour keyword | number | label. */
function numberCounter(el, ctx) {
  const { doc } = ctx;
  const box = el.querySelector('[data-numbercounter-end-number]');
  const number = el.querySelector('.numbercounter-number');
  if (!box && !number) return [];
  const end = box ? box.getAttribute('data-numbercounter-end-number') : '';
  const kind = box ? box.getAttribute('data-numbercounter-number-type') : '';
  const currency = box ? box.getAttribute('data-numbercounter-currency-type') || '' : '';
  const shown = number ? text(number) : '';
  // the rendered final value when the count has finished, else the authored end value
  let value = shown && shown.replace(/[^\d.]/g, '') === end ? shown : end;
  if (value === end && kind === '3') value = `${end}%`;
  if (value === end && kind === '2') value = `${currency}${end}`;
  // the number's own vw size (span.numbercounter-number.fontsize-<n>vw: 2.5vw to 9vw on the
  // site, e.g. isolibrium 6vw, 84px at 1440) → a [[size-<n>vw]] tag
  const vwClass = number && [...number.classList].find((c) => /^fontsize-\d+(-\d+)?-?vw$/.test(c));
  if (vwClass) value = `[[${vwClass.replace(/^fontsize-/, 'size-').replace(/-vw$/, 'vw')}]${value}]`;
  const colour = COUNTER_COLOURS[styleColour(number)] || 'teal';
  const label = el.querySelector('.container > .text-left, .container > div:last-child');
  let desc = doc.createElement('p');
  if (label) {
    // the label's rich text with its fonts and sizes (Futura bold, Egyptienne, vw sizes: the
    // runs finishRuns tags), as any text component
    const { nodes } = richTextNodes(label, doc);
    if (nodes.length === 1) [desc] = nodes;
    else if (nodes.length) {
      desc = doc.createElement('div');
      desc.append(...nodes);
    }
  }
  const left = !!el.querySelector('.container > .text-left');
  return [{
    type: 'counter', colour, value, desc, left,
  }];
}

/**
 * Fast facts (component-map row fastfacts → Statistics): the title, then one stat per
 * .c-fastfacts-item (number | text). Static on live, so no count-up; two per row from
 * 841px (col-sm-6) as cols-2. No colour keyword: the section's text colour applies.
 */
function fastFacts(el, ctx) {
  const { doc } = ctx;
  const facts = [...el.querySelectorAll('.c-fastfacts-item')].map((item) => {
    const desc = doc.createElement('p');
    desc.textContent = text(item.querySelector('.c-fastfacts-text'));
    return { value: text(item.querySelector('.c-fastfacts-number')), desc };
  }).filter((f) => f.value || text(f.desc));
  if (!facts.length) return [];
  // Statistics (fast-facts): the panel's look (number beside its text, Egyptienne); the
  // title is the block's first row (its ruled heading belongs to the component)
  const title = el.querySelector('.c-fastfacts-title');
  const rows = facts.map((c) => [c.value, c.desc]);
  if (title && text(title)) {
    const h = doc.createElement('h2');
    h.textContent = text(title);
    rows.unshift([h]);
  }
  const columns = el.querySelector('.c-fastfacts-item.col-sm-6') ? 2 : facts.length;
  return [{ type: 'block', block: block(doc, `Statistics (fast-facts, cols-${Math.min(Math.max(columns, 1), 4)})`, rows) }];
}

function standaloneVideo(el, ctx) {
  const link = videoLink(el, ctx.doc);
  if (!link) return [];
  // the source border (black-border, unless hide-border) is the default: no-border otherwise;
  // a video that autoplays on live (muted, looping): autoplay (approved 2026-10-29)
  const comp = el.querySelector('.c-standalone-video') || el;
  const options = [
    comp.classList.contains('black-border') && !comp.classList.contains('hide-border') ? '' : 'no-border',
    el.querySelector('video[autoplay]') ? 'autoplay' : '',
  ].filter(Boolean);
  const name = options.length ? `Video (${options.join(', ')})` : 'Video';
  const items = [{
    type: 'block', block: block(ctx.doc, name, [[link]]), cellNodes: [para(ctx.doc, link.cloneNode(true))],
  }];
  // the video's title / description under the player (.desc-content, e.g. an h3 on
  // /us/en/sports-medicine/products/inspace): kept as text after the video
  const desc = el.querySelector('.desc-content');
  if (desc && text(desc)) {
    const copy = contentCopy(desc, ctx.doc);
    cleanRichText(copy);
    const nodes = [...copy.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')]
      .filter((node) => !node.parentElement.closest('p, ul, ol') && text(node));
    if (nodes.length) items.push({ type: 'flow', role: 'text', nodes });
  }
  return items;
}

/**
 * Interactive image (Scene7 hotspots) → the image as a DM link, then a list of its hotspot
 * links (labels and targets from the page facts: the viewer draws them client-side).
 */
function interactiveMedia(el, ctx) {
  const { doc } = ctx;
  const viewer = el.querySelector('[data-asset-path]');
  if (!viewer) return [];
  const asset = viewer.getAttribute('data-asset-path');
  const server = viewer.getAttribute('data-imageserver') || 'https://media-assets.stryker.com/is/image/';
  const img = doc.createElement('img');
  img.setAttribute('src', `${server}${asset.split('/').map(encodeURIComponent).join('/')}?$max_width_1440$`);
  img.setAttribute('alt', '');
  ctx.report.notes.push(`interactive image ${asset}: no alt text in the export (authors add it)`);
  const nodes = [para(doc, img)];
  const facts = ((ctx.facts && ctx.facts.interactiveMedia) || []).find((m) => m.asset === asset);
  const spots = (facts && facts.hotspots) || [];
  if (spots.length) {
    const ul = doc.createElement('ul');
    spots.forEach((spot) => {
      const anchor = spot.href.match(/^quickview:.*(#[\w-]+)$/);
      const href = anchor ? anchor[1] : spot.href.replace(/^https?:\/\/author-[^/]+/, '');
      const li = doc.createElement('li');
      li.append(linkTo(doc, href, spot.label));
      ul.append(li);
    });
    nodes.push(ul);
  } else {
    ctx.report.notes.push(`interactive image ${asset}: no hotspots in the page facts`);
  }
  return [{ type: 'flow', role: 'image', nodes }];
}

/** Resources and downloads → Heading 2 (title) + Cards Corp (resources, six-up). */
function resources(el, ctx) {
  const { doc } = ctx;
  const items = [...el.querySelectorAll('.item-list .item')].filter((item) => item.querySelector('a[href]'));
  if (!items.length) return [];
  const rows = items.map((item) => {
    const img = item.querySelector('img');
    const title = item.querySelector('.title, h5');
    const link = (title && title.closest('a[href]')) || item.querySelector('a[href]');
    const thumb = img ? absoluteAsset(img.getAttribute('src')) : '';
    // a link to a video file with the #_blank marker stays a link (not a player), as on live
    const href = newTabHref(link, absoluteAsset(link.getAttribute('href')));
    const h5 = doc.createElement('h5');
    h5.append(linkTo(doc, href, text(title || link) || (img && img.getAttribute('alt')) || href));
    return [thumb ? para(doc, linkTo(doc, thumb.startsWith('/') ? `${SOURCE}${thumb}` : thumb)) : '', h5];
  });
  const out = [];
  const heading = el.querySelector('.title-container h2, .title-container h3');
  if (heading && text(heading)) {
    const h2 = doc.createElement('h2');
    const u = doc.createElement('u');
    u.textContent = text(heading);
    h2.append(u);
    out.push({ type: 'flow', role: 'text', nodes: [h2] });
  }
  out.push({
    type: 'block', block: block(doc, 'Cards Corp (resources, six-up)', rows),
  });
  return out;
}

/** Card list (customizable) → its heading + Cards Corp (teaser) (cards-corp-teaser parser). */
function cardList(el, ctx) {
  const { doc } = ctx;
  const grid = el.querySelector('.c-customizeable') || el;
  const items = [...grid.querySelectorAll('.item')].filter((item) => text(item));
  if (!items.length) return [];
  const out = [];
  const heading = grid.querySelector('h2');
  if (heading && text(heading)) {
    // a title with the gold rule (h2.border-bottom-gold: "Related", "Articles") → Underline
    const h2 = doc.createElement('h2');
    const label = heading.classList.contains('border-bottom-gold') ? doc.createElement('u') : h2;
    label.textContent = text(heading);
    if (label !== h2) h2.append(label);
    out.push({ type: 'flow', role: 'text', nodes: [h2] });
  }
  // the list's description line (h3.c-customizable-description, e.g. "Classroom courses")
  const description = grid.querySelector('.c-customizable-description');
  if (description && text(description)) {
    const h = doc.createElement(/^H[1-6]$/.test(description.tagName) ? description.tagName.toLowerCase() : 'p');
    h.textContent = text(description);
    out.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  // each card's image: its own, else (an img the live page fills in later by asset id) the
  // target page's own image from its export (page facts cardLists), else none
  const targets = ((ctx.facts && ctx.facts.cardLists) || []).flatMap((list) => list.items || []);
  const imageSrc = (item) => {
    const img = item.querySelector('img');
    if (img && img.getAttribute('src')) return img.getAttribute('src');
    const href = item.querySelector('a[href]');
    if (!img || !href) return '';
    const path = new URL(href.getAttribute('href'), 'https://www.stryker.com').pathname.replace(/\.html$/, '');
    const target = targets.find((t) => t.path === path && t.image);
    return target ? absoluteAsset(encodeURI(target.image)) : '';
  };
  const sources = items.map(imageSrc);
  const name = items.some((item) => item.classList.contains('col-sm-4')) ? 'Cards Corp (teaser, three-up)' : 'Cards Corp (teaser)';
  if (sources.every(Boolean)) {
    const holder = doc.createElement('div');
    const copy = grid.cloneNode(true);
    copy.querySelectorAll('h2').forEach((h) => h.remove());
    [...copy.querySelectorAll('.item')].filter((item) => text(item))
      .forEach((item, i) => item.querySelector('img').setAttribute('src', sources[i]));
    holder.append(copy);
    cardsCorpTeaserParser(copy, { document: doc });
    // (the parser names the block Cards Corp (teaser): the option goes into its name cell)
    const walker = doc.createTreeWalker(holder, 4); // NodeFilter.SHOW_TEXT
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.textContent.trim() === 'Cards Corp (teaser)') {
        n.textContent = name;
        break;
      }
    }
    out.push({ type: 'block', block: holder.firstElementChild });
    return out;
  }
  // some cards without an image (e.g. video links): those get an empty image cell, as
  // cards-corp builds for index rows without an image; no card is left out
  const rows = items.map((item, i) => {
    const body = [];
    const title = item.querySelector('h3');
    const link = title && title.querySelector('a[href]');
    if (title) {
      const h3 = doc.createElement('h3');
      h3.append(link ? linkTo(doc, link.getAttribute('href'), text(link)) : doc.createTextNode(text(title)));
      body.push(h3);
    }
    // the description as rich text: its links and line breaks stay (services-and-solutions
    // OnSite "Contact your local Endoscopy Sales Representative", a link on its own line)
    item.querySelectorAll('.desc-container > p').forEach((p) => {
      if (!text(p)) return;
      const box = contentCopy(p, doc);
      cleanRichText(box);
      body.push(rename(box, 'p'));
    });
    const cta = item.querySelector('a.action-link[href]');
    if (cta && text(cta)) {
      const u = doc.createElement('u');
      u.textContent = text(cta);
      const a = linkTo(doc, cta.getAttribute('href'), '');
      a.append(u);
      const strong = doc.createElement('strong');
      strong.append(a);
      body.push(para(doc, strong));
    }
    if (!sources[i]) return ['', body];
    const img = doc.createElement('img');
    img.setAttribute('src', sources[i]);
    img.setAttribute('alt', (item.querySelector('img') || { getAttribute: () => '' }).getAttribute('alt') || '');
    return [img, body];
  });
  out.push({ type: 'block', block: block(doc, name, rows) });
  return out;
}

/**
 * Tabs → a `tabbed` section (scripts.js buildTabbedSections): each tab title as a heading
 * of the section's deepest heading level, followed by the tab's content (text and blocks).
 */
function tabs(el, ctx) {
  const { doc } = ctx;
  const titles = [...el.querySelectorAll('.tabs-nav .tab-link')].map(text);
  const panes = [...el.querySelectorAll('.tabs-content > .tab-content')];
  const collected = panes.map((pane) => ctx.collect(pane));
  // all tabs share one section: it takes the copy styles that every text and nested block
  // of the panes has (their own section styles cannot nest), e.g. p-1-25 on all product tabs
  const sets = collected.flat().flatMap((it) => {
    if (it.type === 'own' && it.styles && it.styles.length) return [it.styles];
    if (it.type === 'flow' && it.role === 'text') {
      return it.nodes.map((n) => String(n.copyStyle || '').split(',').map((s) => s.trim()).filter(Boolean));
    }
    return [];
  });
  const copyStyle = (s) => /^(p-\d|serif$|bold-body$|label-|h-serif$|h-\d-)/.test(s);
  const inAll = (s) => copyStyle(s) && sets.every((set) => set.includes(s));
  const shared = sets.length ? sets[0].filter(inAll) : [];
  const panels = collected.map((items) => inlineNodes(items, ctx));
  if (!panels.some((nodes) => nodes.length)) return [];
  const deepest = panels.flat().reduce((max, n) => (/^H[1-6]$/.test(n.tagName) ? Math.max(max, Number(n.tagName[1])) : max), 2);
  const level = Math.min(6, deepest + 1);
  const nodes = [];
  panels.forEach((panel, i) => {
    const title = titles[i] || ((ctx.facts && ctx.facts.tabs && ctx.facts.tabs[0]) || [])[i] || `Tab ${i + 1}`;
    const h = doc.createElement(`h${level}`);
    h.textContent = title;
    nodes.push(h, ...panel);
    if (!panel.length) ctx.report.notes.push(`tab "${title}" has no content`);
  });
  return [{
    type: 'own', kind: 'tabs', styles: ['tabbed', ...shared], nodes,
  }];
}

/** Page short description: hidden on most pages (skipped as hidden); visible → lead content. */
function shortDescription(el, ctx) {
  // the product-detail template's two columns under the hero (col-sm-6 + col-sm-6): their
  // components through the walk (the rich text, the secondary CTA, the tag crumb), not as one
  // rich text, which kept only shallow paragraphs (229 lines on 78 product pages, e.g.
  // connected-or-ip "The future of integration is here."); then the column-control rules:
  // both filled → side by side (a block beside text: flex section), one filled → its half
  const columns = [...el.querySelectorAll(':scope > .row > [class*="col-sm-"]')];
  if (columns.length !== 2) return ctx.collect(el);
  // the template-slot handlers wrap their items in a column group: the control decides here
  const items = columns.map((col) => ctx.collect(col).flatMap((it) => (it.type === 'group' ? it.items : [it])));
  const widths = columns.map((col) => Number((col.className.match(/\bcol-sm-(\d+)\b/) || [])[1]) || 0);
  return columnItems(items, SPLITS.cols2, ctx, widths.every(Boolean) ? widths : null);
}

/**
 * The product template's secondary CTA (.c-secondary-cta a.action-link, "Additional
 * resources"): the bold + underline link (a.link-strong, the arrow CTA convention).
 */
function secondaryCta(el, ctx) {
  const nodes = [...el.querySelectorAll('a[href]')].filter((a) => text(a)).map((a) => {
    const link = linkTo(ctx.doc, newTabHref(a, absoluteAsset(a.getAttribute('href'))), '');
    const u = ctx.doc.createElement('u');
    u.textContent = text(a);
    link.append(u);
    const strong = ctx.doc.createElement('strong');
    strong.append(link);
    return para(ctx.doc, strong);
  });
  return nodes.length ? [{ type: 'flow', role: 'cta', nodes }] : [];
}

/**
 * The product template's tag crumb ("Related categories", stryker.com .c-tagcrumb, shown
 * unless hidden on the page) → the Related Categories block holding its heading: the block
 * builds the categories from the page's `tags` metadata and the tag list sheet (approved
 * 2026-10-30).
 */
function relatedCategories(el, ctx) {
  const title = text(el.querySelector('.c-tagcrumb-title') || ctx.doc.createElement('h4')) || 'Related categories';
  if (!el.querySelector('.c-tagcrumb-item a[href]')) return [];
  return [{ type: 'block', block: block(ctx.doc, 'Related Categories', [[title]]) }];
}

/**
 * Any other component: its visible content as cleaned default content (block elements and
 * images), hidden parts (modals) and controls left out. Reported by the builder.
 */
function fallback(el, ctx) {
  const { doc } = ctx;
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[data-corp-hidden="true"], script, style, button, input, noscript').forEach((n) => n.remove());
  copy.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.querySelector('img') || !doc.getElementById(a.getAttribute('href').slice(1))) unwrap(a);
  });
  const box = doc.createElement('div');
  box.append(copy);
  cleanRichText(box);
  const nodes = [...box.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, table, img')]
    .filter((n) => !n.parentElement.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, table'))
    .map((n) => (n.tagName === 'IMG' ? para(doc, n) : n))
    .filter((n) => text(n) || n.querySelector('img'));
  return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
}

/**
 * Accordion → Accordion block (label | panel content) when every panel holds default
 * content only; panels with blocks (columns, cards, video …) → one `accordion-panel`
 * section per panel, label as its first heading (scripts/corp.js builds the
 * `accordion with-nested-blocks` block from them).
 */
function accordion(el, ctx) {
  const { doc } = ctx;
  const panels = [...el.querySelectorAll('.panel-group > .panel')].map((panel) => ({
    title: text(panel.querySelector('.panel-title') || doc.createElement('p')),
    items: ctx.collect(panel.querySelector('.panel-body') || panel),
    // open on load on the source (AEM defaultExpanded, rendered .panel-collapse.in)
    open: !!panel.querySelector(':scope > .panel-collapse.in'),
  })).filter((p) => p.title || hasContent(p.items));
  if (!panels.length) return [];
  // a panel open on load: its label in bold (authoring convention: bold label = open,
  // approved 2026-10-31; nailing-portfolio "Surgeon resources")
  const label = (p, holder = doc.createElement('span')) => {
    if (!p.open) {
      holder.textContent = p.title;
      return holder;
    }
    const strong = doc.createElement('strong');
    strong.textContent = p.title;
    holder.append(strong);
    return holder;
  };
  // the accordion's own title (h3.component-subheading "FAQs": ld-304, sync-badge), above it
  const heading = el.querySelector('.c-accordion > .container > .component-subheading');
  const title = [];
  if (heading && text(heading)) {
    const h = doc.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3');
    const u = heading.classList.contains('border-bottom-gold') ? doc.createElement('u') : h;
    u.textContent = text(heading);
    if (u !== h) h.append(u);
    title.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  // (empty slots and blank lines in a panel decide nothing: a panel keeps its blank lines)
  const flowOnly = panels.every((p) => p.items.every((it) => ['flow', 'anchor', 'spacer'].includes(it.type)));
  if (flowOnly) {
    const rows = panels.map((p) => [
      para(doc, ...label(p).childNodes),
      p.items.flatMap((it) => (linesOnly(it) ? blankLines(doc, it.lines) : it.nodes || [])),
    ]);
    return [...title, {
      type: 'own', kind: 'accordion', styles: [], nodes: [block(doc, 'Accordion', rows)],
    }];
  }
  return [...title, ...panels.map((p) => {
    const h = label(p, doc.createElement('h3'));
    return {
      type: 'own', kind: 'accordion-panel', styles: ['accordion-panel'], nodes: [h, ...inlineNodes(p.items, ctx)],
    };
  })];
}

/**
 * Page hero (pagehero, hero) → Columns (columns-50-50, page-intro[, border-bottom]):
 * title as a Bold + Italic H1, subhead as H2, content paragraphs | image.
 */
function pageHero(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-page-hero, .c-hero') || el;
  const title = root.querySelector('.title');
  const cell = [];
  if (title && text(title)) {
    const h1 = doc.createElement('h1');
    const strong = doc.createElement('strong');
    const em = doc.createElement('em');
    em.textContent = text(title);
    strong.append(em);
    h1.append(strong);
    cell.push(h1);
    ctx.h1 = true;
  }
  const subhead = root.querySelector('.subhead');
  if (subhead && text(subhead)) {
    const h2 = doc.createElement('h2');
    h2.append(...contentCopy(subhead, doc).childNodes);
    cleanRichText(h2);
    cell.push(h2);
  }
  // p.content and what follows it in its column: a list in the copy closes the <p> when the page
  // is parsed, so the list and the text after it are its siblings (sustainability/products/
  // masimo-lncs "Features and benefits include:" + list + closing sentence)
  root.querySelectorAll('.content').forEach((content) => {
    const box = doc.createElement('div');
    box.append(content.cloneNode(true));
    for (let n = content.nextSibling; n && !(n.nodeType === 1 && n.matches('.title, .subhead, .content'));
      n = n.nextSibling) {
      if (n.nodeType === 1 || text(n)) box.append(n.cloneNode(true));
    }
    const { nodes } = richTextNodes(box, doc);
    cell.push(...nodes.filter((node) => text(node)));
  });
  if (!cell.length) return [];
  const img = root.querySelector('picture img, img');
  const cells = [cell];
  if (img) {
    // the largest rendition (the picture's first source), as on the desktop page
    const source = root.querySelector('picture source[srcset]');
    const image = doc.createElement('img');
    image.setAttribute('src', (source && source.getAttribute('srcset').split(/[\s,]/)[0]) || img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
    if (!img.getAttribute('alt')) ctx.report.notes.push(`page hero image without alt text: ${image.getAttribute('src')}`);
    cells.push([para(doc, image)]);
  }
  const variants = ['columns-50-50', 'page-intro'];
  if (root.querySelector('.border-bottom-gold')) variants.push('border-bottom');
  return [{
    type: 'own', kind: 'page-intro', styles: [], nodes: [block(doc, `Columns (${variants.join(', ')})`, [cells])],
  }];
}

/**
 * Long-text hero (longtexthero, decisions/component-map.json) → Columns (columns-50-50,
 * page-intro, grid-m-12-h): a plain H1 (the black Futura title, 24.5px), the subtitle H2 when
 * there is one, the description as a Large Serif line (stryker.com h3.description: 21px
 * Egyptienne Light), the long copy | the image, hidden on phones as on the source (hidden-xs).
 * isuite-live-video, isuite-ehr-connectivity.
 */
function longTextHero(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-longtexthero') || el;
  const cell = [];
  const title = root.querySelector('h1');
  if (title && text(title)) {
    const h1 = doc.createElement('h1');
    h1.textContent = text(title);
    cell.push(h1);
    ctx.h1 = true;
  }
  const subtitle = root.querySelector('h2');
  if (subtitle && text(subtitle)) {
    const h2 = doc.createElement('h2');
    h2.textContent = text(subtitle);
    cell.push(h2);
  }
  const description = root.querySelector('.description');
  if (description && text(description)) {
    const p = doc.createElement('p');
    p.textContent = `[[1.5×,Serif]${text(description)}]`;
    cell.push(p);
  }
  const copy = root.querySelector('.longtext');
  if (copy) cell.push(...richTextNodes(copy, doc).nodes.filter((node) => text(node)));
  if (!cell.length) return [];
  const cells = [cell];
  const img = root.querySelector('img');
  if (img) {
    const image = doc.createElement('img');
    image.setAttribute('src', img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
    if (!img.getAttribute('alt')) ctx.report.notes.push(`long-text hero image without alt text: ${img.getAttribute('src')}`);
    cells.push([para(doc, image)]);
  }
  // (the grid's phone row needs its desktop row: 6 + 6, the image hidden below 600px)
  const variants = ['columns-50-50', 'page-intro', ...(img && img.closest('.hidden-xs') ? ['grid-6-6', 'grid-m-12-h'] : [])];
  return [{
    type: 'own', kind: 'page-intro', styles: [], nodes: [block(doc, `Columns (${variants.join(', ')})`, [cells])],
  }];
}

/**
 * Table → Table block; a first row that is bold throughout is the header, else no-header.
 * @param {string[]} [extra] more variants (striped)
 */
function table(el, ctx, extra = []) {
  const { doc } = ctx;
  const source = el.querySelector('table');
  if (!source) return [];
  const rows = [...source.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => {
    const box = contentCopy(td, doc);
    cleanRichText(box);
    return [...box.childNodes];
  }));
  if (!rows.length) return [];
  const first = source.querySelector('tr');
  const header = [...first.children].every((td) => !text(td) || [...td.querySelectorAll('b, strong, th')].some((b) => text(b) === text(td)) || td.tagName === 'TH');
  if (header) {
    rows[0] = rows[0].map((nodes) => nodes.map((n) => {
      if (n.nodeType === 1) n.querySelectorAll('strong').forEach(unwrap);
      return n.nodeType === 1 && n.tagName === 'STRONG' ? doc.createTextNode(n.textContent) : n;
    }));
  }
  const out = [];
  // (or the component's own subheading above the table: procare "Choosing your plan")
  const caption = [...el.querySelectorAll('.title-container h2, .title-container h3, .table-title, h2.component-subheading, h3.component-subheading')]
    .find((h) => !h.closest('table'));
  if (caption && text(caption)) {
    const h = doc.createElement('h3');
    // the subheading is Futura bold on live (procare "Choosing your plan"): the Bold heading
    // convention; the other captions are the serif heading
    if (caption.matches('.component-subheading')) {
      const strong = doc.createElement('strong');
      strong.textContent = text(caption);
      h.append(strong);
    } else h.textContent = text(caption);
    out.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  // the stryker.com table component (.c-table) is striped everywhere (measured: patents,
  // lifecycle-support, symmetry-plus, tmj-concepts, lp15-acpa)
  const striped = el.matches('.c-table') || !!el.querySelector('.c-table') || !!el.closest('.c-table');
  const variants = [...new Set([...(header ? [] : ['no-header']), ...extra, ...(striped ? ['striped'] : [])])];
  out.push({ type: 'block', block: block(doc, variants.length ? `Table (${variants.join(', ')})` : 'Table', rows) });
  return out;
}

/**
 * Patent tables (base: /us/en/about/patents/*, trademarks) → the Table block (component-map):
 * the cells' content without the empty, aria-hidden phone labels (.cell-mobile-title). No
 * table has a header (the thead is empty), so Table (no-header) keeps every row; striped as
 * the source (grey odd rows, no rules).
 */
function patentTables(el, ctx) {
  el.querySelectorAll('.cell-mobile-title').forEach((n) => n.remove());
  return table(el, ctx, ['striped']);
}

/**
 * Curated link list → Columns (related-links) (component-map): one link per paragraph, the
 * source's unbulleted list at its line rhythm (/us/en/about/patents); empty items left out.
 */
function curatedLinkList(el, ctx) {
  const { doc } = ctx;
  const links = [...el.querySelectorAll('li a[href]')].filter((a) => text(a));
  if (!links.length) return [];
  const cell = links.map((a) => para(doc, linkTo(doc, a.getAttribute('href'), text(a))));
  links.filter((a) => /author-[^/]*adobecqms\.net/.test(a.getAttribute('href')))
    .forEach((a) => ctx.report.notes.push(`curated link list: link to the AEM author kept as on live: ${text(a)}`));
  return [{ type: 'block', block: block(doc, 'Columns (related-links)', [[cell]]) }];
}

/** The page's title for a widget's link text: the document title without " | Stryker". */
const pageTitle = (doc) => text(doc.querySelector('title') || doc.createElement('p')).replace(/\s*\|\s*Stryker\s*$/i, '');

/**
 * Adobe Sign web form → /widgets/adobe-sign?wid=<widgetID>&height=<min height> in its own
 * section (component-map; the widget frames the esignWidget at that height). The link text
 * is the page title. A form without its frame (an empty instance) is left out.
 */
function adobeSignForm(el, ctx) {
  const { doc } = ctx;
  const frame = el.querySelector('iframe[src*="esignWidget"]');
  if (!frame) return [];
  const wid = new URL(frame.getAttribute('src'), SOURCE).searchParams.get('wid');
  if (!wid) return [];
  const height = ((frame.getAttribute('style') || '').match(/min-height:\s*(\d+)px/) || [])[1];
  const query = new URLSearchParams({ wid, ...(height ? { height } : {}) }).toString();
  return [{
    type: 'own', kind: 'widget', styles: [], nodes: [para(doc, linkTo(doc, `/widgets/adobe-sign?${query}`, pageTitle(doc) || 'Adobe Sign form'))],
  }];
}

/* Cvent calendar names by calendar id (export selectedCventName; the rendered page does not
   carry it, component-map cventcomponent) */
const CVENT_NAMES = { '01eecf27-dc87-4879-b868-6acf7d84ac51': 'Med Ed Events Calendar - External US' };

/**
 * Cvent events calendar → /widgets/cvent?widget-id=<id>&calendar-id=<id> in its own section
 * (component-map; the widget links to Cvent's calendar page, which refuses framing).
 */
function cventCalendar(el, ctx) {
  const { doc } = ctx;
  const box = el.querySelector('[data-widget-id][data-calendar-id]');
  if (!box) return [];
  const calendarId = box.getAttribute('data-calendar-id');
  const query = new URLSearchParams({ 'widget-id': box.getAttribute('data-widget-id'), 'calendar-id': calendarId }).toString();
  return [{
    type: 'own', kind: 'widget', styles: [], nodes: [para(doc, linkTo(doc, `/widgets/cvent?${query}`, CVENT_NAMES[calendarId] || pageTitle(doc) || 'Events calendar'))],
  }];
}

/**
 * News and announcements → News List Corp (component-map: generated from the query index, no
 * static snapshot): its title (Heading 2, "Filter by:"), then the rows Path (the page itself:
 * every source list searches its own page), Filters (the rendered tabs, `Label (tag)`, or
 * none), Page size (the rendered list size) and Show dates (true when the items show a date).
 */
function newsList(el, ctx) {
  const { doc } = ctx;
  const root = el.matches('[data-widget="stryker-news"]') ? el : el.querySelector('[data-widget="stryker-news"]');
  if (!root) return [];
  const out = [];
  const title = root.querySelector('.title-container h2, .title-container h3');
  if (title && text(title)) {
    const h = doc.createElement('h2');
    h.textContent = text(title);
    out.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  const filterTabs = [...root.querySelectorAll('.stryker-tabs span.tab-link[data-tags]')]
    .filter((s) => s.getAttribute('data-tags') !== 'show-all-news' && text(s))
    .map((s) => `${text(s)} (${s.getAttribute('data-tags').trim().replace(/^\/etc\/tags\/([^/]+)\//, '$1:')})`);
  const filters = doc.createElement('div');
  if (filterTabs.length) {
    const ul = doc.createElement('ul');
    filterTabs.forEach((t) => {
      const li = doc.createElement('li');
      li.textContent = t;
      ul.append(li);
    });
    filters.append(ul);
  } else filters.textContent = 'none';
  // (the page's document name, not under our root: the list reads the locale's query index)
  const path = WebImporter.FileUtils.sanitizePath(new URL(ctx.source, SOURCE).pathname.replace(/\.html?$/, ''))
    .replace(/\/index$/, '');
  const dated = [...root.querySelectorAll('.news h5')].some((h) => text(h));
  out.push({
    type: 'block',
    block: block(doc, 'News List Corp', [
      ['Path', path],
      ['Filters', filters],
      ['Page size', root.getAttribute('data-list-size') || '20'],
      ['Show dates', dated ? 'true' : 'false'],
    ]),
  });
  return out;
}

/** The legacy image component (image parbase): its image as default content, alt as authored. */
function legacyImage(el, ctx) {
  const img = el.querySelector('img[src]');
  if (img && !img.getAttribute('alt')) ctx.report.notes.push(`image without alt text: ${img.getAttribute('src')}`);
  return fallback(el, ctx);
}

/** Local page navigation → Sticky Nav (local): parent link, then label | page link. */
function localNav(el, ctx) {
  const { doc } = ctx;
  const nav = el.querySelector('nav.greedy');
  const links = nav ? [...nav.querySelectorAll('ul.links a[href]')].filter((a) => text(a)) : [];
  const parent = nav && nav.querySelector('a.parent-node[href]');
  // a nav without child pages still shows its parent title (orthopaedic-instruments/systems/
  // orthopaedic: "Home" only)
  if (!links.length && !(parent && text(parent))) return [];
  const rows = [];
  if (parent && text(parent)) rows.push([linkTo(doc, parent.getAttribute('href'), text(parent))]);
  // the link cell shows the page path (as the link will read after the .html rewrite)
  const path = (href) => href.replace(/^https?:\/\/www\.stryker\.com/, '').replace(/\/index\.html(?=$|[?#])/, '/').replace(/\.html(?=$|[?#])/, '');
  links.forEach((a) => rows.push([text(a), linkTo(doc, a.getAttribute('href'), path(a.getAttribute('href')))]));
  // the grey rule above the nav (rule-separator) is the default; hideTopLine: no-rule
  const name = el.querySelector('.rule-separator') ? 'Sticky Nav (local)' : 'Sticky Nav (local, no-rule)';
  return [{
    type: 'own', kind: 'nav', styles: [], nodes: [block(doc, name, rows)],
  }];
}

/**
 * Cross-promotional tile (template c-tiles, the ProCare tile): the tile image linked to the
 * modal's fragment document (corp-modal-path.js; the document comes from
 * import-modal-fragments.js). On the page the linked image is the tile (scripts/corp.js
 * decorateModalTiles) and opens the modal (blocks/modal). Empty on most pages.
 */
function promoTile(el, ctx) {
  const img = el.querySelector('.c-cross-promotional-tile img');
  if (!img) return [];
  const image = ctx.doc.createElement('img');
  image.setAttribute('src', img.getAttribute('src'));
  image.setAttribute('alt', img.getAttribute('alt') || '');
  const title = el.querySelector('.c-procare-tile-modal .c-procare-tile-title, #c-procare-tile-modal .c-procare-tile-title');
  const path = title && procareModalPath(text(title));
  if (!path) {
    ctx.report.notes.push(`cross-promotional tile without a modal title, kept as its image: ${img.getAttribute('alt') || img.getAttribute('src')}`);
    return [{ type: 'flow', role: 'image', nodes: [para(ctx.doc, image)] }];
  }
  // a linked image (the DM images transformer keeps the image URL in the link's title)
  const a = ctx.doc.createElement('a');
  a.setAttribute('href', path);
  a.append(image);
  return [{ type: 'flow', role: 'image', nodes: [para(ctx.doc, a)] }];
}

/** A component title (h2.component-subheading): a Heading 2, its gold rule as Underline. */
function componentTitle(h, doc) {
  const h2 = doc.createElement('h2');
  if (h.classList.contains('border-bottom-gold')) {
    const u = doc.createElement('u');
    u.textContent = text(h);
    h2.append(u);
  } else h2.textContent = text(h);
  return h2;
}

/**
 * Latest news (component-map latestnews, approved: Cards Corp teaser, today's articles frozen):
 * the title (Underline), then one teaser card per article the component renders: its image,
 * title, description and the "Read More" link, as on the source
 * (/us/en/orthopaedic-instruments/systems/orthopaedic "Articles").
 */
function latestNews(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-latestnews') || el;
  const items = [...root.querySelectorAll('.latestnews-container > .item')].filter((item) => text(item));
  if (!items.length) return [];
  const out = [];
  const heading = root.querySelector('h2');
  if (heading && text(heading)) out.push({ type: 'flow', role: 'text', nodes: [componentTitle(heading, doc)] });
  const rows = items.map((item) => {
    const body = [];
    const title = item.querySelector('h3');
    if (title && text(title)) {
      const h3 = doc.createElement('h3');
      h3.textContent = text(title);
      body.push(h3);
    }
    item.querySelectorAll(':scope > p.model, :scope > p.description').forEach((p) => {
      if (text(p)) body.push(para(doc, doc.createTextNode(text(p))));
    });
    const cta = item.querySelector('a.news-link[href], a.action-link[href]');
    if (cta && text(cta)) {
      const u = doc.createElement('u');
      u.textContent = text(cta);
      const a = linkTo(doc, cta.getAttribute('href'), '');
      a.append(u);
      const strong = doc.createElement('strong');
      strong.append(a);
      body.push(para(doc, strong));
    }
    const img = item.querySelector('img[src]');
    if (!img) return ['', body];
    const image = doc.createElement('img');
    image.setAttribute('src', img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
    return [image, body];
  });
  out.push({ type: 'block', block: block(doc, 'Cards Corp (teaser)', rows) });
  // the component's own button under the cards (about/governance/product-security "VIEW ALL
  // ARTICLES", portfolios/…/advanced-digital-healthcare)
  const more = root.querySelector('.c-latestnews-btn a[href]');
  if (more && text(more)) out.push({ type: 'flow', role: 'cta', nodes: [buttonNode(doc, more, text(more))] });
  return out;
}

/**
 * Title component (component-map title): the title as a Heading 2 with its rule (Underline)
 * and the optional subtitle as the Heading 3 it is on the source.
 */
function titleComponent(el, ctx) {
  const { doc } = ctx;
  const box = el.querySelector('.title-container') || el;
  const nodes = [];
  const title = box.querySelector('h2');
  if (title && text(title)) nodes.push(componentTitle(title, doc));
  box.querySelectorAll(':scope > h3').forEach((h) => {
    if (!text(h)) return;
    const h3 = doc.createElement('h3');
    h3.textContent = text(h);
    nodes.push(h3);
  });
  return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
}

/**
 * Division contact form (component-map divisioncontactus, approved): the AEM email form has no
 * EDS counterpart; it becomes a Marketo Form once the client supplies the form IDs per business
 * unit. Until then: the title (Underline) and the description, the form left out (reported).
 */
function divisionContactUs(el, ctx) {
  const { doc } = ctx;
  const form = el.querySelector('form') || el;
  const nodes = [];
  const title = form.querySelector('h2');
  if (title && text(title)) nodes.push(componentTitle(title, doc));
  const description = form.querySelector('.form-description');
  if (description) {
    const copy = description.cloneNode(true);
    copy.querySelectorAll('.form-control-asterix').forEach((star) => star.remove());
    if (text(copy)) {
      const p = doc.createElement('p');
      p.textContent = text(copy);
      nodes.push(p);
    }
  }
  ctx.report.notes.push('division contact form: no Marketo form ID for it yet (client), the form is left out');
  return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
}

/**
 * Mixed media gallery (component-map mixedmediagallery, approved): Gallery Corp, one row per
 * set member, a Dynamic Media image in set order. The members come from data/dm-sets.js (the
 * Scene7 set, drawn client-side on the source); they have no alt text (reported).
 */
function mixedMediaGallery(el, ctx) {
  const { doc } = ctx;
  const viewer = el.querySelector('[data-asset-path]');
  const asset = viewer && viewer.getAttribute('data-asset-path');
  const set = asset && DM_SETS[asset];
  if (!set || !set.members.length) {
    if (asset) ctx.report.notes.push(`gallery ${asset}: no members in data/dm-sets.js (npm run build:dm-sets), left out`);
    return [];
  }
  const server = viewer.getAttribute('data-imageserver') || 'https://media-assets.stryker.com/is/image/';
  const rows = set.members.map((member) => {
    const img = doc.createElement('img');
    img.setAttribute('src', `${server}${member.name.split('/').map(encodeURIComponent).join('/')}?$max_width_1440$`);
    img.setAttribute('alt', '');
    return [para(doc, img)];
  });
  ctx.report.notes.push(`gallery ${asset}: ${rows.length} images without alt text (authors add it)`);
  return [{
    type: 'own', kind: 'gallery', styles: [], nodes: [block(doc, 'Gallery Corp', rows)],
  }];
}

/**
 * A Dynamic Media viewer on its own (dam/components/scene7/dynamicmedia, established: a
 * default-content image): the viewer's asset as an image.
 */
function dynamicMedia(el, ctx) {
  const { doc } = ctx;
  const viewer = el.querySelector('[data-asset-path]');
  const asset = viewer && viewer.getAttribute('data-asset-path');
  if (!asset) return [];
  const server = viewer.getAttribute('data-imageserver') || 'https://media-assets.stryker.com/is/image/';
  const img = doc.createElement('img');
  img.setAttribute('src', `${server}${asset.split('/').map(encodeURIComponent).join('/')}?$max_width_1440$`);
  img.setAttribute('alt', '');
  ctx.report.notes.push(`dynamic media viewer ${asset}: image without alt text (authors add it)`);
  return [{ type: 'flow', role: 'image', nodes: [para(doc, img)] }];
}

/**
 * Featured content grid (component-map featuredcontentgrid, approved): the title (Underline),
 * the intro as a paragraph, then Columns (related-links): per item its linked Heading 4, the
 * description and the More link on its own line (Underline: the chevron link).
 */
function featuredContentGrid(el, ctx) {
  const { doc } = ctx;
  const items = [];
  const title = el.querySelector('h2.component-subheading');
  const intro = el.querySelector('.intro');
  const lead = [];
  if (title && text(title)) lead.push(componentTitle(title, doc));
  if (intro && text(intro)) {
    const p = doc.createElement('p');
    p.textContent = text(intro);
    lead.push(p);
  }
  if (lead.length) items.push({ type: 'flow', role: 'text', nodes: lead });
  const cells = [...el.querySelectorAll('.grid-item-wrapper')].map((item) => {
    const nodes = [];
    const head = item.querySelector('a h4, h4');
    const link = head && head.closest('a');
    if (head && text(head)) {
      const h4 = doc.createElement('h4');
      h4.append(link ? linkTo(doc, link.getAttribute('href'), text(head)) : doc.createTextNode(text(head)));
      nodes.push(h4);
    }
    const description = item.querySelector('.page-description');
    if (description && text(description)) {
      const p = doc.createElement('p');
      p.textContent = text(description);
      nodes.push(p);
    }
    const more = item.querySelector('a.more[href]');
    if (more) {
      const u = doc.createElement('u');
      u.textContent = text(more);
      const a = linkTo(doc, more.getAttribute('href'), '');
      a.textContent = '';
      a.append(u);
      nodes.push(para(doc, a));
    }
    return nodes;
  }).filter((nodes) => nodes.length);
  if (cells.length) {
    items.push({
      type: 'own', kind: 'columns', styles: [], nodes: [block(doc, 'Columns (related-links)', [cells])],
    });
  }
  return items;
}

/**
 * Banner campaign (component-map bannercampaign, approved): the banner image, linked when the
 * source links it (a new tab kept as #_blank). Missing alt text is reported.
 */
function bannerCampaign(el, ctx) {
  const { doc } = ctx;
  const source = el.querySelector('.c-banner-campaign-content img');
  if (!source) return [];
  const img = doc.createElement('img');
  const largest = el.querySelector('.c-banner-campaign-content source[srcset]');
  img.setAttribute('src', (largest && largest.getAttribute('srcset').split(/\s+/)[0]) || source.getAttribute('src'));
  img.setAttribute('alt', source.getAttribute('alt') || '');
  if (!source.getAttribute('alt')) ctx.report.notes.push(`banner image without alt text: ${img.getAttribute('src')}`);
  const link = source.closest('a[href]');
  if (!link) return [{ type: 'flow', role: 'image', nodes: [para(doc, img)] }];
  const a = linkTo(doc, newTabHref(link, link.getAttribute('href')), '');
  a.textContent = '';
  a.append(img);
  return [{ type: 'flow', role: 'image', nodes: [para(doc, a)] }];
}

// engagement CTA icons that exist in icons/ (Twitter / X and the contact message icon do not)
const ENGAGEMENT_ICONS = { facebook: ':facebook:', linkedin: ':linkedin:' };

/**
 * Engagement CTA (component-map engagementcta, approved): one Bold link per paragraph, the
 * network's icon before the label when it exists (:facebook: / :linkedin:); a purple or blue
 * button gets its section style (btn-purple / btn-blue).
 */
function engagementCta(el, ctx) {
  const { doc } = ctx;
  const links = [...el.querySelectorAll('.engagementCTAcluster a.btn[href]')];
  if (!links.length) return [];
  const nodes = links.map((source) => {
    const icon = ENGAGEMENT_ICONS[String(source.id).toLowerCase()];
    const label = text(source);
    const a = linkTo(doc, newTabHref(source, source.getAttribute('href')), [icon, label].filter(Boolean).join(' ') || source.id);
    const strong = doc.createElement('strong');
    strong.append(a);
    return para(doc, strong);
  });
  const colour = links[0].classList.contains('bg-purple') ? 'btn-purple' : (links[0].classList.contains('bg-blue') && 'btn-blue');
  return [{
    type: 'flow', role: 'cta', own: !!colour, styles: colour ? [colour] : [], nodes,
  }];
}

/**
 * Animated bar chart (component-map animatedbarchart, approved): Chart Corp (column or bar):
 * Title, Subtitle, Format, Max, Axis title and Labels rows, then one row per shown series item:
 * label | value | the source colour.
 */
function animatedBarChart(el, ctx) {
  const { doc } = ctx;
  const value = (cls) => (el.querySelector(`input.${cls}`) || { value: '' }).value.trim();
  const items = [...el.querySelectorAll('select.hdnChartSeries option')].map((option) => {
    const [colour, label, show] = text(option).split('|');
    return {
      label: (label || '').trim(), value: option.getAttribute('value'), colour: (colour || '').trim(), show: show !== 'false',
    };
  }).filter((item) => item.show && item.label);
  if (!items.length) return [];
  const format = value('numberType') === 'Currency' ? `Currency ${value('currency')}` : value('numberType');
  const rows = [
    ['Title', value('chartTitle')],
    ['Subtitle', value('chartSubTitle')],
    ['Format', format],
    ['Max', value('maxValue')],
    ['Axis title', value('yAxisTitle')],
    ['Labels', value('dataLabelDisplay') === 'false' ? 'false' : 'true'],
    // the authored chart height (chartHeight, 0 = the default; surpass-evolve 300 / 400px)
    ['Height', Number(value('chartHeight')) > 0 ? value('chartHeight') : ''],
  ].filter(([, v]) => v);
  items.forEach((item) => rows.push([item.label, item.value, item.colour]));
  const variant = /bar/i.test(value('chartType')) ? 'Chart Corp (bar)' : 'Chart Corp';
  return [{
    type: 'own', kind: 'chart', styles: [], nodes: [block(doc, variant, rows)],
  }];
}

/**
 * The legacy AEM video component (div.video): a video shown on the page → Video block (the
 * DAM file); the copies the source never shows (0×0 players, the component used to carry a
 * script) are skipped.
 */
function legacyVideo(el, ctx) {
  const { doc } = ctx;
  const player = el.querySelector('video');
  const path = (String(el.innerHTML).match(/var mediaPath = '([^']+)'/) || [])[1];
  const visible = player && Number(player.getAttribute('width')) > 0 && Number(player.getAttribute('height')) > 0;
  if (!path || !visible) return [];
  const href = path.replace(/\\u002D/g, '-').replace(/\\\//g, '/');
  return [{
    type: 'block', block: block(doc, 'Video', [[linkTo(doc, absoluteAsset(href), href.split('/').pop())]]),
  }];
}

/** The block nodes of a rich text box: its headings, paragraphs and lists, cleaned. */
function boxNodes(el, doc) {
  const box = contentCopy(el, doc);
  cleanRichText(box);
  return [...box.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')]
    .filter((node) => !node.parentElement.closest('p, ul, ol') && text(node));
}

/**
 * The content of a ProCare modal (.c-procare-tile-info, the product template's tile) → items
 * of its fragment document (import-modal-fragments.js): the title as a Heading 2, the contact
 * columns as Columns (columns-50-50; labels Heading 4, as the source), the coverage table, the
 * closing copy and its Learn More button.
 * @param {Element} info the modal's .c-procare-tile-info
 */
export function procareModalItems(info, ctx) {
  const { doc } = ctx;
  const items = [];
  const title = info.querySelector('.c-procare-tile-title');
  if (title && text(title)) {
    const h2 = doc.createElement('h2');
    h2.textContent = text(title);
    items.push({ type: 'flow', role: 'text', nodes: [h2] });
  }
  const contact = info.querySelector('.c-procare-tile-contact');
  if (contact) {
    const cols = [...contact.children].filter((col) => /\bcol-/.test(col.className));
    const columns = cols.map((col) => {
      const nodes = boxNodes(col, doc);
      return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
    });
    items.push(...columnItems(columns, { variant: 'columns-50-50' }, ctx, cols.map(() => 6)));
  }
  info.querySelectorAll('.c-table').forEach((el) => items.push(...table(el, ctx)));
  info.querySelectorAll('.c-procare-tile-addinfo').forEach((el) => {
    const nodes = boxNodes(el, doc);
    if (nodes.length) items.push({ type: 'flow', role: 'text', nodes });
  });
  const button = info.querySelector(':scope > a.btn[href]');
  if (button && text(button)) items.push({ type: 'flow', role: 'text', nodes: [buttonNode(doc, button, text(button))] });
  return items;
}

const skip = () => [];

/**
 * Publish date (news-detail template slot, component-map publishdate, approved 2026-10-28):
 * the date under the title as a Heading 5, as live (Futura bold 14px); it is also the
 * `published` metadata (corp-import.js).
 */
function publishDate(el, ctx) {
  const line = el.querySelector('h5') || el;
  if (!text(line)) return [];
  const h5 = ctx.doc.createElement('h5');
  h5.textContent = text(line);
  return [{ type: 'flow', role: 'text', nodes: [h5] }];
}

/**
 * A template slot (news-detail: the lead image and intro text slots sit in the template's
 * col-sm-8 column, not in a column control) keeps that column's width, like the one filled
 * column of a column control (columnStyles).
 */
const inTemplateColumn = (handler) => (el, ctx) => {
  const items = handler(el, ctx);
  const col = el.closest('[class*="col-sm-"]');
  const width = col && Number((col.className.match(/\bcol-sm-(\d+)\b/) || [])[1]);
  const styles = width && width < 12 && items.length ? columnStyles([width], 0, ctx) : [];
  return styles.length ? [{ type: 'group', styles, items }] : items;
};

/**
 * Event location (news-detail template slot, component-map eventlocationproperties: default
 * content): the location line under the date as a Heading 5, as live; empty on most pages.
 */
function eventLocation(el, ctx) {
  const line = el.querySelector('h5') || el;
  if (!text(line)) return [];
  const h5 = ctx.doc.createElement('h5');
  h5.textContent = text(line);
  return [{ type: 'flow', role: 'text', nodes: [h5] }];
}

/**
 * Filtered content type grid (the product grid of the specialty, capability and portfolio
 * templates, c-filtered-content-type-grid; its AEM wrapper filteredcontenttypegrid) → its
 * section title, then Cards Corp (product-item, five-up): one card per product tile, the tile's
 * image and its title as a linked Heading 4, as the source's .product-item (image over a grey
 * rule, Egyptienne Light title, five per row on desktop: 252px tiles at 1440). The tag filters
 * and the "No items were found" line are the live page's script, not content.
 */
function filteredGrid(el, ctx) {
  const { doc } = ctx;
  const grid = el.matches('.c-filtered-content-type-grid') ? el
    : el.querySelector('.c-filtered-content-type-grid') || el;
  const items = [...grid.querySelectorAll('.product-item')].filter((item) => text(item));
  if (!items.length) return [];
  const out = [];
  const title = grid.querySelector('.c-section-title');
  if (title && text(title)) {
    out.push(...sectionTitle(title.parentElement, ctx).filter((it) => it.type === 'flow'));
  }
  const rows = items.map((item) => {
    const link = item.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';
    const heading = item.querySelector('h4, .component-subheading');
    const label = text(heading || link || item);
    const h4 = doc.createElement('h4');
    h4.append(href ? linkTo(doc, href, label) : doc.createTextNode(label));
    const img = item.querySelector('img');
    if (!img || !img.getAttribute('src')) return ['', [h4]];
    const image = doc.createElement('img');
    image.setAttribute('src', img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
    if (!img.getAttribute('alt')) ctx.report.notes.push(`product tile image without alt text: ${img.getAttribute('src')}`);
    return [para(doc, image), [h4]];
  });
  out.push({ type: 'block', block: block(doc, 'Cards Corp (product-item, five-up)', rows) });
  return out;
}

/**
 * One product tile (image over a rule, linked title) as a Cards Corp (product-item) row; `bold`:
 * the title in Futura bold (Bold), as the product groups show it.
 */
function productTileRow(item, ctx, bold = false) {
  const { doc } = ctx;
  const link = item.querySelector('a[href]');
  const href = link ? link.getAttribute('href') : '';
  const heading = item.querySelector('h4, .component-subheading');
  const label = text(heading || link || item);
  const h4 = doc.createElement('h4');
  const title = href ? linkTo(doc, href, label) : doc.createTextNode(label);
  if (bold) {
    const strong = doc.createElement('strong');
    strong.append(title);
    h4.append(strong);
  } else h4.append(title);
  const img = item.querySelector('img');
  if (!img || !img.getAttribute('src')) return ['', [h4]];
  const image = doc.createElement('img');
  image.setAttribute('src', img.getAttribute('src'));
  image.setAttribute('alt', img.getAttribute('alt') || '');
  if (!img.getAttribute('alt')) ctx.report.notes.push(`product tile image without alt text: ${img.getAttribute('src')}`);
  return [para(doc, image), [h4]];
}

/**
 * Product groups (c-productgroups: procedure and package pages' "Related products") → its title,
 * then per group its subheading (the light grey rule: Underline) and Cards Corp (product-item):
 * one card per product, four per row as the source (col-md-3). Empty ones give nothing.
 */
function productGroups(el, ctx) {
  const { doc } = ctx;
  const root = el.matches('.c-productgroups') ? el : el.querySelector('.c-productgroups') || el;
  const groups = [...root.querySelectorAll('.clearfix')].filter((g) => g.querySelector('a[href]'));
  if (!groups.length) return [];
  const out = [];
  const title = root.querySelector('h2');
  if (title && text(title)) out.push({ type: 'flow', role: 'text', nodes: [componentTitle(title, doc)] });
  groups.forEach((group) => {
    const sub = group.querySelector('h3');
    if (sub && text(sub)) {
      const h3 = doc.createElement('h3');
      const u = doc.createElement('u');
      u.textContent = text(sub);
      h3.append(u);
      out.push({ type: 'flow', role: 'text', nodes: [h3] });
    }
    const items = [...group.querySelectorAll('.filtered, .product-item')].filter((item) => text(item));
    if (items.length) {
      const rows = items.map((item) => productTileRow(item, ctx, true));
      out.push({ type: 'block', block: block(doc, 'Cards Corp (product-item)', rows) });
    }
  });
  return out;
}

/**
 * Banner title and tagline (c-tagline: the page title strip of package, portfolio and tier-1
 * pages, .m-banner-simple) → a section of its own with its banner colour (bg-gold …): the title
 * as the Heading 1 (Bold, 0.75 × the h1: Futura bold 21px, as live), the message as a Heading 2
 * in the serif (h-serif) at 4vw (live 28px on phones, 56px from 1440px). Empty ones give nothing.
 */
function tagline(el, ctx) {
  const { doc } = ctx;
  const title = el.querySelector('.c-tagline-title');
  const message = el.querySelector('.c-tagline-message');
  const has = (node) => !!node && !!text(node);
  if (!has(title) && !has(message)) return [];
  const nodes = [];
  // a banner set to black text (text-black, e.g. about/contact/recall on the purple gradient)
  const black = !!el.querySelector('.m-banner-simple.text-black');
  const colour = black ? ',color-black' : '';
  if (has(title)) {
    const h1 = doc.createElement('h1');
    const strong = doc.createElement('strong');
    strong.textContent = text(title);
    h1.append(doc.createTextNode(`[[size-0-75em${colour}]`), strong, doc.createTextNode(']'));
    nodes.push(h1);
    ctx.h1 = true;
  }
  if (has(message)) {
    const h2 = doc.createElement('h2');
    h2.textContent = `[[size-4vw${colour}]${text(message)}]`;
    nodes.push(h2);
  }
  const banner = el.querySelector('.m-banner-simple');
  const bg = banner && [...banner.classList].find((c) => /^bg-/.test(c));
  return [{
    type: 'own', kind: 'tagline', styles: [...(bg ? [bg] : []), ...(has(message) ? ['h-serif'] : [])], nodes,
  }];
}

/**
 * Product listing (c-productlisting, package pages) → Columns (columns-50-50), one row per
 * product: its image (linked) | its title as a linked Heading 2 and its description.
 */
function productListing(el, ctx) {
  const { doc } = ctx;
  const products = [...el.querySelectorAll('.product')].filter((p) => text(p) || p.querySelector('img'));
  if (!products.length) return [];
  const rows = products.map((product) => {
    const [first, second] = product.querySelectorAll(':scope > .cell');
    const img = (first || product).querySelector('img');
    const media = [];
    if (img && img.getAttribute('src')) {
      const image = doc.createElement('img');
      image.setAttribute('src', img.getAttribute('src'));
      image.setAttribute('alt', img.getAttribute('alt') || '');
      media.push(para(doc, image));
    }
    const body = [];
    const heading = (second || product).querySelector('h2, h3');
    const link = heading && heading.querySelector('a[href]');
    if (heading && text(heading)) {
      const h2 = doc.createElement('h2');
      h2.append(link ? linkTo(doc, link.getAttribute('href'), text(heading)) : doc.createTextNode(text(heading)));
      body.push(h2);
    }
    const description = (second || product).querySelector('.description');
    if (description && text(description)) {
      body.push(para(doc, doc.createTextNode(text(description))));
    }
    return [media, body];
  });
  return [{ type: 'block', block: block(doc, 'Columns (columns-50-50)', rows) }];
}

/**
 * Event details (c-event-detail-component, the event-detail template) → Columns (columns-67-33):
 * the title (Heading 2), the meeting time, location and country (Heading 5 + their lines), the
 * details and registration (Heading 5 with the gold rule: Underline; the register link as the
 * primary button: Bold, alone on its line) | the event's map (a Google Maps link, which the site
 * embeds) when the address is a place: virtual events (Online, Virtual, N/A) get no map, where
 * the source shows Google's guess. The print button is the page's script, not content.
 */
function eventDetail(el, ctx) {
  const { doc } = ctx;
  const left = [];
  const title = el.querySelector('h2');
  if (title && text(title)) {
    const h2 = doc.createElement('h2');
    h2.textContent = text(title);
    left.push(h2);
  }
  const blank = (node) => !text(node).replace(/\u00a0/g, '').trim();
  // (the contact and the registration too, as on live: o-r-safety-series-journey-to-zero-smoke-5
  // "Contact" with its name and e-mail, "Registration" with Register here)
  el.querySelectorAll('.event-datetime-wrap, .event-location-wrap, .event-contact-wrap, .event-details-wrap, .event-disclaimer-wrap, .event-registration-wrap').forEach((wrap) => {
    const small = wrap.matches('.event-disclaimer-wrap');
    [...wrap.children].forEach((node) => {
      if (node.closest('[data-corp-hidden="true"]')) return;
      if (/^H[1-6]$/.test(node.tagName)) {
        if (!text(node)) return;
        const h5 = doc.createElement('h5');
        if (node.classList.contains('border-bottom-gold')) {
          const u = doc.createElement('u');
          u.textContent = text(node);
          h5.append(u);
        } else h5.textContent = text(node);
        left.push(h5);
        return;
      }
      // (not the page's own buttons: Print event details is a script, Add to calendar an AEM
      // servlet, /bin/stryker/ical)
      const btns = [...node.querySelectorAll('a.btn[href]')]
        .filter((a) => !/^(#|\/bin\/)/.test(a.getAttribute('href')) && !a.closest('[data-corp-hidden="true"]'));
      if (node.querySelector('a.btn[href]') && !btns.length) return;
      if (btns.length) {
        btns.forEach((a) => {
          const strong = doc.createElement('strong');
          strong.append(linkTo(doc, newTabHref(a, a.getAttribute('href')), text(a)));
          left.push(para(doc, strong));
        });
        return;
      }
      if (node.tagName !== 'P' || blank(node)) return;
      const p = doc.createElement('p');
      p.append(...contentCopy(node, doc).childNodes);
      if (small) {
        // the disclaimer: small print (live 11.2px), its bold label in the body font
        p.querySelectorAll('b').forEach((b) => rename(b, 'strong'));
        p.querySelectorAll('strong').forEach((b) => {
          b.before(doc.createTextNode('[[body-font]'));
          b.after(doc.createTextNode(']'));
        });
        p.prepend(doc.createTextNode('[[size-0-8em]'));
        p.append(doc.createTextNode(']'));
      }
      left.push(p);
    });
  });
  if (!left.length) return [];
  // the sidebar under the map: its headings ("Related links": Heading 5) and links, one a line
  const side = [];
  el.querySelectorAll('.event-sidebar h1, .event-sidebar h2, .event-sidebar h3, .event-sidebar h4, .event-sidebar h5, .event-sidebar a[href]').forEach((node) => {
    if (!text(node) || node.closest('.map, [data-corp-hidden="true"]')) return;
    if (node.tagName === 'A') {
      side.push(para(doc, linkTo(doc, newTabHref(node, node.getAttribute('href')), text(node))));
      return;
    }
    const h5 = doc.createElement('h5');
    h5.textContent = text(node);
    side.push(h5);
  });
  const cells = [left];
  const map = el.querySelector('.map[data-address]');
  const address = map ? map.getAttribute('data-address').replace(/&nbsp;|\u00a0/g, ' ')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^(n\/a|online|virtual( event)?)$/i.test(s))
    .join(', ') : '';
  // (a place: more than the country)
  if (!address.includes(',')) return [{ type: 'flow', role: 'text', nodes: [...left, ...side] }];
  const href = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
  cells.push([para(doc, linkTo(doc, href, address)), ...side]);
  return [{ type: 'block', block: block(doc, 'Columns (columns-67-33)', [cells]) }];
}

/** A CSS url() of an inline background image, its CSS escapes (`\2f ` for `/`) decoded. */
function backgroundImage(el) {
  const m = ((el && el.getAttribute('style')) || '').match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
  if (!m) return '';
  return m[2].replace(/\\([0-9a-f]{1,6})\s?/gi, (s, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1').trim();
}

/**
 * High-level CTA (category tiles of the capability template, c-high-level-cta) → Cards Corp
 * (category): per tile its image (the link's background image) and its label as the card link,
 * as the source (a shadowed 442:293 image, the teal label bar; 2 / 3 per row). Empty ones (most
 * capability pages carry the slot without tiles) give nothing.
 */
function highLevelCta(el, ctx) {
  const { doc } = ctx;
  const tiles = [...el.querySelectorAll('.c-high-level-cta-container')].filter((t) => text(t));
  if (!tiles.length) return [];
  const rows = tiles.map((tile) => {
    const label = tile.querySelector('.c-high-level-cta-label') || tile.querySelector('a[href]');
    const href = label && label.getAttribute('href');
    const name = text(label || tile);
    const body = para(doc, href ? linkTo(doc, href, name) : doc.createTextNode(name));
    const src = backgroundImage(tile.querySelector('.c-high-level-cta-link'));
    if (!src) return ['', [body]];
    const image = doc.createElement('img');
    image.setAttribute('src', src);
    image.setAttribute('alt', '');
    return [para(doc, image), [body]];
  });
  return [{ type: 'block', block: block(doc, 'Cards Corp (category)', rows) }];
}

/**
 * Contact us (c-contactus: base, tier2 landing and contact-division pages) → its title (the gold
 * rule: Underline), then Columns (columns-50-50): the contact details | the map. Each contact
 * group is its label as a Heading 4 and its lines in one paragraph (the phone numbers as
 * links, one per line, as live); the map is a Google Maps link alone in its paragraph, which the
 * site embeds (scripts/map-embed.js, the source's Maps embed at zoom 15). A component with no
 * details gives nothing (some pages carry it empty).
 */
function contactUs(el, ctx) {
  const { doc } = ctx;
  const root = el.matches('.c-contactus') ? el : el.querySelector('.c-contactus') || el;
  const info = root.querySelector('.info') || root;
  const details = [];
  // the contact groups in source order: a group's heading ("Address", "Customer support":
  // Heading 3), lines without a label as they are (the address), each label (Heading 4) with
  // its lines in one paragraph (the phone numbers as links, one per line, as live)
  let lines = null;
  let labelGroup = null;
  const flush = () => {
    if (lines && text(lines)) details.push(lines);
    lines = null;
    labelGroup = null;
  };
  const lineNodes = (line) => {
    const link = line.querySelector('a[href]');
    if (!(link && text(line) === text(link))) return [...contentCopy(line, doc).childNodes];
    // (a phone link's number only: tel:269%20488%207419%20%20Fax → tel:2694887419)
    const href = link.getAttribute('href');
    const tel = href.match(/^tel:(.*)$/i);
    // (the contact phone links are black on the source: .c-contactus .contact-group a.tel;
    // the black-link colour tag, as the rich-text rules write it)
    const linkText = link.classList.contains('tel') ? `[[color-black]${text(link)}]` : text(link);
    return [linkTo(doc, tel ? `tel:${decodeURIComponent(tel[1]).replace(/[^\d+]/g, '')}` : href, linkText)];
  };
  info.querySelectorAll('h3.component-subheading, .contact-label, .contact-group p').forEach((node) => {
    if (!text(node)) return;
    if (node.tagName === 'H3') {
      flush();
      // (Bold: Futura bold, as live h3.component-subheading)
      const h3 = doc.createElement('h3');
      const strong = doc.createElement('strong');
      strong.textContent = text(node);
      h3.append(strong);
      details.push(h3);
      return;
    }
    if (node.matches('.contact-label')) {
      flush();
      // (Heading 4: Futura bold, 14px on phones, 17.5px from 600px, as live h4.contact-label on
      // desktop; live sets it in the body font below 480px)
      const h4 = doc.createElement('h4');
      h4.textContent = text(node);
      details.push(h4);
      lines = doc.createElement('p');
      labelGroup = node.closest('.contact-group');
      return;
    }
    if (lines && node.closest('.contact-group') === labelGroup) {
      if (lines.childNodes.length) lines.append(doc.createElement('br'));
      lines.append(...lineNodes(node));
      return;
    }
    flush();
    details.push(para(doc, ...lineNodes(node)));
  });
  flush();
  if (!details.length) return [];
  const out = [];
  const title = root.querySelector('h2');
  if (title && text(title)) out.push({ type: 'flow', role: 'text', nodes: [componentTitle(title, doc)] });
  const map = root.querySelector('.map[data-address]');
  // (the map's address attribute is HTML: its lines joined as the source's embed query does)
  const address = map ? map.getAttribute('data-address')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,$/, '') : '';
  const cells = [details];
  if (address) {
    const href = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    cells.push([para(doc, linkTo(doc, href, address))]);
  }
  // its own section: a heading size set by the copy after it (smart-care "Contact a Stryker
  // Smart Care representative", 1.25x) must not scale the contact headings (live 21px)
  const nodes = [...out.flatMap((it) => it.nodes), block(doc, 'Columns (columns-50-50, contact)', [cells])];
  return [{
    type: 'own', kind: 'contact', styles: [], nodes,
  }];
}

/**
 * Group list (c-grouplist) → its title (Heading 2, Underline), then Columns (link-groups) as
 * the component-map says. Titled lists (.list-container with a Heading 3, half width on the
 * source: tech-support): one cell per list, its Heading 3 and its links, two cells a row
 * (columns-50-50). An untitled list split in columns on the source (one full-width container
 * with 4 col-md-3 lists, /us/en/about "Our businesses"): one cell per column, one row.
 */
function groupList(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-grouplist') || el;
  const linkList = (scope) => {
    const links = [...scope.querySelectorAll('li a[href]')].filter((a) => text(a));
    if (!links.length) return null;
    const ul = doc.createElement('ul');
    links.forEach((a) => {
      const li = doc.createElement('li');
      li.append(linkTo(doc, a.getAttribute('href'), text(a)));
      ul.append(li);
    });
    return ul;
  };
  const lists = [...root.querySelectorAll('.list-container')];
  const split = lists.length === 1 && !lists[0].querySelector('h3')
    && lists[0].querySelectorAll('ul').length > 1;
  const out = [];
  const title = root.querySelector(':scope > h2');
  if (title && text(title)) out.push({ type: 'flow', role: 'text', nodes: [componentTitle(title, doc)] });
  if (split) {
    const cells = [...lists[0].querySelectorAll('ul')].map(linkList).filter(Boolean).map((ul) => [ul]);
    if (!cells.length) return [];
    out.push({ type: 'block', block: block(doc, 'Columns (link-groups)', [cells]) });
    return out;
  }
  const cells = lists.map((list) => {
    const nodes = [];
    const h = list.querySelector('h3');
    if (h && text(h)) {
      const h3 = doc.createElement('h3');
      h3.textContent = text(h);
      nodes.push(h3);
    }
    const ul = linkList(list);
    if (ul) nodes.push(ul);
    return nodes;
  }).filter((nodes) => nodes.length);
  if (!cells.length) return [];
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));
  if (rows[rows.length - 1].length < 2) rows[rows.length - 1].push('');
  out.push({ type: 'block', block: block(doc, 'Columns (columns-50-50, link-groups)', rows) });
  return out;
}

/**
 * Testimonial (c-testimonial, e.g. /us/en/about "History") → default content (component-map):
 * the heading as a Heading 2 at 28px (1.14 × the corp 24.5px Heading 2), the banner message in
 * the serif at 4vw (live 28px on phones, 56px from 840px) as inline size tags (a paragraph's
 * copy size stops at 2.5×), then the button. Its band colour is the section's (the full-bleed
 * panel around it).
 */
function testimonial(el, ctx) {
  const { doc } = ctx;
  const heading = el.querySelector('.testimonial-heading');
  const message = el.querySelector('.banner-message');
  if (!(heading && text(heading)) && !(message && text(message))) return [];
  const tagged = (tag, tokens, from) => {
    const node = doc.createElement(tag);
    node.append(doc.createTextNode(`[[${tokens}]`), ...contentCopy(from, doc).childNodes, doc.createTextNode(']'));
    node.normalize();
    return node;
  };
  const nodes = [];
  if (heading && text(heading)) nodes.push(tagged('h2', 'size-1-14em', heading));
  if (message && text(message)) nodes.push(tagged('p', 'serif,size-4vw', message));
  const out = [{ type: 'flow', role: 'text', nodes }];
  const cta = el.querySelector('.btn-container a.btn[href]');
  if (cta && text(cta)) out.push({ type: 'flow', role: 'cta', nodes: [buttonNode(doc, cta, text(cta))] });
  return out;
}

/* share platforms (data-platform) → the Social Share Corp icons */
const SHARE_ICONS = {
  facebook: 'facebook', linkedin: 'linkedin', email: 'email', 'copy-url': 'copy-link',
};

/**
 * Social sharing (c-socialsharing, news articles) → Social Share Corp (component-map): one
 * `:icon:` row per platform in the source order; syk-social-share-g → gray,
 * syk-social-share-ra → right.
 */
function socialSharing(el, ctx) {
  const root = el.querySelector('.c-socialsharing') || el;
  const icons = [...root.querySelectorAll('[data-platform]')]
    .map((a) => SHARE_ICONS[a.getAttribute('data-platform')]).filter(Boolean);
  if (!icons.length) return [];
  const variants = [
    ...(root.classList.contains('syk-social-share-g') ? ['gray'] : []),
    ...(root.classList.contains('syk-social-share-ra') ? ['right'] : []),
  ];
  const name = variants.length ? `Social Share Corp (${variants.join(', ')})` : 'Social Share Corp';
  return [{ type: 'block', block: block(ctx.doc, name, [...new Set(icons)].map((i) => [`:${i}:`])) }];
}

/** A template slot that renders nothing when unset; any content left is reported as usual. */
const emptySlot = (el, ctx) => (text(el) || el.querySelector('img, iframe, video') ? ctx.unknown(el) : []);

/* event calendars: the folder each one lists (export eventcalendar searchPath; the rendered
   page does not carry it), by source page */
const EVENT_CALENDAR_PATHS = {
  '/us/en/sports-medicine/calendar': '/us/en/global-events/sports-medicine',
  '/us/en/training-and-education/training-and-education-calendar': '/us/en/global-events',
};

/**
 * Event calendar (c-event) → Event Calendar Corp (component-map eventcalendar): the rows Path
 * (the folder it lists, the page itself when unset) and Title (the rendered heading).
 */
function eventCalendar(el, ctx) {
  const { doc } = ctx;
  const root = el.querySelector('.c-event') || el;
  if (!root.querySelector('#eventCalendarWrap')) return emptySlot(el, ctx);
  const page = new URL(ctx.source, SOURCE).pathname.replace(/\.html?$/, '');
  const path = WebImporter.FileUtils.sanitizePath(EVENT_CALENDAR_PATHS[page] || page).replace(/\/index$/, '');
  const title = root.querySelector('.title-container h2');
  const rows = [['Path', path]];
  if (title && text(title)) rows.push(['Title', text(title)]);
  return [{ type: 'block', block: block(doc, 'Event Calendar Corp', rows) }];
}

/**
 * Corporate contact us (an AEM email form, /us/en/about/contact/recall) → its title (Heading 2,
 * Underline), the topic sub-heading (Heading 4) and the form intro (Heading 3), as on the
 * source; the form itself waits for the client's Marketo form ID (component-map
 * corporatecontactus: Marketo Form; as the division contact form), reported.
 */
function corporateContactUs(el, ctx) {
  const { doc } = ctx;
  const form = el.querySelector('form');
  if (!form) return [];
  const nodes = [];
  const title = form.querySelector('h2');
  if (title && text(title)) nodes.push(componentTitle(title, doc));
  form.querySelectorAll('h4, h3').forEach((h) => {
    if (!text(h)) return;
    const copy = doc.createElement(h.tagName.toLowerCase());
    copy.textContent = text(h);
    nodes.push(copy);
  });
  ctx.report.notes.push('corporate contact form left out: needs its Marketo form ID');
  return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
}

/**
 * Pie chart (component-map pieChart, approved: Chart Corp (pie)): Labels and Height rows, then
 * one row per slice: label | value | the source colour (option text "label + value + rgba").
 */
function pieChart(el, ctx) {
  const value = (cls) => (el.querySelector(`input.${cls}`) || { value: '' }).value.trim();
  const slices = [...el.querySelectorAll('select.chartData option')].map((option) => {
    const [label, , colour] = text(option).split(/\s*\+\s*/);
    return { label: (label || '').trim(), value: option.getAttribute('value'), colour: (colour || '').trim() };
  }).filter((s) => s.label && s.value !== null);
  if (!slices.length) return [];
  const rows = [
    ['Labels', value('dataLabel') && value('dataLabel') !== 'none' ? 'true' : 'false'],
    ['Height', Number(value('chartHeight')) > 0 ? value('chartHeight') : ''],
  ].filter(([, v]) => v);
  slices.forEach((s) => rows.push([s.label, s.value, s.colour]));
  return [{
    type: 'own', kind: 'chart', styles: [], nodes: [block(ctx.doc, 'Chart Corp (pie)', rows)],
  }];
}

/**
 * The search page (div.search-page, /us/en/search) → as the corp search page before it (theme
 * search): spacer, the title (Heading 1), "Showing results for:" (Heading 2), the Search block
 * and the no-results copy with its suggestions, spacer.
 */
function searchPage(el, ctx) {
  const { doc } = ctx;
  const header = el.querySelector('.search-header');
  if (!header) return [];
  const nodes = [];
  const h1 = header.querySelector('h1');
  if (h1 && text(h1)) {
    const h = doc.createElement('h1');
    h.textContent = text(h1);
    nodes.push(h);
    ctx.h1 = true;
  }
  const h2 = header.querySelector('h2');
  if (h2 && text(h2)) {
    const h = doc.createElement('h2');
    h.textContent = text(h2);
    nodes.push(h);
  }
  const input = header.querySelector('input.search-control');
  nodes.push(block(doc, 'Search', [[(input && input.getAttribute('placeholder')) || 'Search this site']]));
  const message = [...header.children].find((c) => c.tagName === 'DIV' && c.querySelector('ul'));
  if (message) {
    [...message.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
      .forEach((n) => nodes.push(para(doc, doc.createTextNode(n.textContent.trim()))));
    const ul = doc.createElement('ul');
    message.querySelectorAll('li').forEach((li) => {
      const item = doc.createElement('li');
      item.textContent = text(li).replace(/^•\s*/, '');
      ul.append(item);
    });
    nodes.push(ul);
  }
  return [
    { type: 'spacer', slots: 1 },
    {
      type: 'own', kind: 'search', styles: [], nodes,
    },
    { type: 'spacer', slots: 1 },
  ];
}

/** Geolocation (select-your-location): its "United States" button as a button. */
function geolocation(el, ctx) {
  const a = el.querySelector('a.btn[href]');
  return a && text(a) ? [{ type: 'flow', role: 'cta', nodes: [buttonNode(ctx.doc, a, text(a))] }] : [];
}

/** Site map (c-map, /us/en/site-map) → Sitemap Corp (component-map sitemap): Path /us/en. */
function siteMap(el, ctx) {
  if (!el.querySelector('a[href]')) return [];
  return [{ type: 'block', block: block(ctx.doc, 'Sitemap Corp', [['Path', '/us/en']]) }];
}

// AEM components by wrapper class (or #id)
export const COMPONENTS = {
  carouselslidegroup: carousel,
  'hero-large-carousel': heroLargeCarousel,
  'h1-title': h1Title,
  fullWidthImage,
  fullWidthImageHero,
  jumpbarnav: jumpBar,
  cols: columnControl,
  experienceFragment,
  'section-title': sectionTitle,
  text: textComponent,
  standaloneimage: standaloneImage,
  largeheadline: largeHeadline,
  fullbleedpanel: fullBleedPanel,
  remotecomponent: remoteComponent,
  marketoform: marketoForm,
  tabs,
  numbercounter: numberCounter,
  fastfacts: fastFacts,
  standalonevideo: standaloneVideo,
  interactivemedia: interactiveMedia,
  // a white rule (white-hr) is invisible on live: a plain section break; grey / unset: divider
  sectionseparator: (el) => (el.querySelector('.white-hr') ? [{ type: 'boundary' }] : [{ type: 'separator' }]),
  curatedcta: buttons,
  buttonset: buttons,
  secondarycta: buttons,
  contactbutton: buttons,
  customizable: cardList,
  resourcesanddownload: resources,
  '#product-detail-container': shortDescription,
  // a tag crumb placed as a component (ent/products/clarifix-cryotherapy-device, in a column):
  // the Related Categories block as the template's own; hidden ones are skipped by the walk
  tagcrumb: relatedCategories,
  latestnews: latestNews,
  // the product template's parts rendered without their AEM wrapper: the tag crumb (Related
  // Categories), the short description (rich text), the contact button and the secondary CTA
  'c-tagcrumb': relatedCategories,
  'c-page-short-description': textComponent,
  'c-contact-button': buttons,
  'c-secondary-cta': secondaryCta,
  accordion,
  pagehero: pageHero,
  hero: pageHero,
  longtexthero: longTextHero,
  table,
  localpagenavigation: localNav,
  localpagenavigationchild: localNav,
  'c-navigation-bar': jumpBar,
  'c-tiles': promoTile,
  title: titleComponent,
  divisioncontactus: divisionContactUs,
  mixedmediagallery: mixedMediaGallery,
  dynamicmedia: dynamicMedia,
  featuredcontentgrid: featuredContentGrid,
  bannercampaign: bannerCampaign,
  engagementcta: engagementCta,
  animatedbarchart: animatedBarChart,
  video: legacyVideo,
  // news-detail template slots (no AEM wrapper): the lead image and the intro rich text, the
  // publish date and the event location under the title, and the template's "back" link
  // (navigation, not authored)
  'c-standalone-image': inTemplateColumn(standaloneImage),
  'c-rich-text-editor': inTemplateColumn(textComponent),
  'c-publish-date': publishDate,
  'c-event-location-properties': eventLocation,
  'c-back-button': skip,
  // specialty, capability, portfolio and news-landing template slots: the page hero (the same
  // markup as the product page hero) and the filtered product grid
  'c-page-hero': pageHero,
  'c-filtered-content-type-grid': filteredGrid,
  filteredcontenttypegrid: filteredGrid,
  'c-high-level-cta': highLevelCta,
  // base, tier2 landing and contact-division pages: the contact details with their map
  'c-contactus': contactUs,
  // the event-detail template's event
  'c-event-detail-component': eventDetail,
  // procedure and package pages: related products in groups
  'c-productgroups': productGroups,
  'c-productlisting': productListing,
  // the title strip of package, portfolio and tier-1 pages
  'c-tagline': tagline,
  // base pages: patent tables, link lists, the Adobe Sign forms, the Cvent calendar, the news
  // lists (and news-landing pages), the legacy image component
  patenttables: patentTables,
  'c-patenttables': patentTables,
  curatedlinklist: curatedLinkList,
  'c-curated-link-list': curatedLinkList,
  adobesignwebform: adobeSignForm,
  'c-adobesignwebform-content': adobeSignForm,
  cventcomponent: cventCalendar,
  'c-cventComponent': cventCalendar,
  newsandannouncements: newsList,
  'c-newsandannouncements': newsList,
  image: legacyImage,
  // round 7: components seen without their AEM wrapper (or a _v1 one), group lists,
  // testimonials, the featured content item (component-map: skip) and empty template slots
  'c-resourcesanddownload': resources,
  resourcesanddownload_v1: resources,
  grouplist: groupList,
  'c-grouplist': groupList,
  testimonial,
  'c-testimonial': testimonial,
  featuredcontentitem: skip,
  'c-featured-content-item': skip,
  'c-title': (el, ctx) => (text(el) ? titleComponent(el, ctx) : []),
  'c-tabs': (el, ctx) => (el.querySelector('.tabs-nav .tab-link') ? tabs(el, ctx) : emptySlot(el, ctx)),
  'c-banner-campaign': (el, ctx) => (el.querySelector('img') ? bannerCampaign(el, ctx) : emptySlot(el, ctx)),
  eventcalendar: eventCalendar,
  'c-event': eventCalendar,
  corporatecontactus: corporateContactUs,
  'c-corporate-contact-us': corporateContactUs,
  geolocation,
  'c-geolocation': geolocation,
  'c-ourcompany': emptySlot,
  'c-carousel-item': emptySlot,
  pieChart,
  'search-page': searchPage,
  sitemap: siteMap,
  'c-map': siteMap,
  socialsharing: socialSharing,
  'c-socialsharing': socialSharing,
  featuredcontentcontext: emptySlot,
  'c-feature-content-context': emptySlot,
};

/** The corp handlers for createBuilder: components, responsive-grid rows, the fallback. */
export const CORP_HANDLERS = { components: COMPONENTS, row: gridRow, fallback };
