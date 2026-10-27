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
  plainBoldParagraphs, serifHeadings, contentCopy, colourClass,
} from './corp-richtext.js';
import { standaloneImageNodes } from './corp-components.js';
import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import { videoLink } from './parsers/video.js';

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

// rendered background classes of a text / headline box → section style
const BOXES = [
  ['bg-gold', 'bg-gold'], ['bg-light-gray', 'bg-light-gray'], ['bg-lighter-gray', 'bg-gray'],
  ['bg-dark-gray', 'bg-dark-gray'], ['dimensional-box', 'dimensional'],
];
const boxOf = (el) => (BOXES.find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;

/** The largest fontsize-<n>-vw / fontsize-<n>vw size in an element (3-5 → 3.5), or 0. */
function vwSize(el) {
  return [...el.querySelectorAll('[class*="vw"]')].reduce((max, span) => {
    const m = span.className.match(/fontsize-(\d+)(?:-(\d+))?-?vw/);
    return m ? Math.max(max, Number(`${m[1]}.${m[2] || 0}`)) : max;
  }, 0);
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

/** Rich text (cleaned) → block nodes, each with its copy style (as the news rules). */
export function richTextNodes(source, doc) {
  const box = contentCopy(source, doc);
  const plainBold = plainBoldParagraphs(box);
  const serifHeads = serifHeadings(box);
  // copy styles per top-level element: one serif lead paragraph keeps its own font
  const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
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
  return { nodes, centred };
}

/** Counters → one Statistics (count-up, cols-N) block. */
function statistics(counters, ctx, columns = counters.length) {
  const rows = counters.map((c) => [c.colour, c.value, c.desc]);
  return block(ctx.doc, `Statistics (count-up, cols-${Math.min(Math.max(columns, 1), 4)})`, rows);
}

/** Section-level nodes of items (in one section: tabs panels, flex sections). */
export function inlineNodes(items, ctx) {
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
      if (item.type === 'own' && (item.styles || []).length) ctx.report.notes.push(`section style ${item.styles.join(', ')} of a nested ${item.kind} dropped`);
      out.push(...item.nodes);
    } else if (item.type === 'group') out.push(...inlineNodes(item.items, ctx));
    else if (item.type === 'anchor') ctx.report.notes.push(`anchor #${item.id} inside a nested section, dropped`);
  });
  flushCounters();
  return out;
}

/* ---------- column controls (component-map rows columncontrol/cols*) ---------- */

const hasContent = (items) => items.some((it) => it.type !== 'flow' || it.nodes.length);
const isTitle = (node) => /^H[1-6]$/.test(node.tagName)
  || (node.tagName === 'P' && node.querySelector('strong') && text(node.querySelector('strong')) === text(node));
const isCta = (node) => node.tagName === 'P' && node.querySelectorAll('a').length === 1
  && text(node.querySelector('a')) === text(node);

/** Branch F: image first, then a title and a CTA, no video. */
function isCard(items) {
  if (!items.every((it) => it.type === 'flow')) return false;
  if (!items.length || items[0].role !== 'image') return false;
  const rest = items.slice(1).flatMap((it) => it.nodes);
  return rest.length >= 2 && isTitle(rest[0]) && isCta(rest[rest.length - 1]);
}

/** A cell's content: flow nodes, and blocks that have a cell form (video links). */
function cellNodes(items, ctx) {
  return items.flatMap((it) => {
    if (it.type === 'flow') return it.nodes;
    if (it.type === 'block' && it.cellNodes) return it.cellNodes;
    if (it.type === 'separator') {
      ctx.report.notes.push('section separator inside a column, dropped');
      return [];
    }
    return [];
  });
}

/** The copy style shared by every text node of the cells, or ''. */
function sharedCopyStyle(cells) {
  const styles = new Set(cells.flat().filter((n) => n.copyStyle !== undefined)
    .map((n) => n.copyStyle || ''));
  return styles.size === 1 ? [...styles][0] : '';
}

/**
 * A column control (or a responsive-grid row) → items, by the approved branch order:
 * A all empty → nothing; B one column → its content; counters only → Statistics; C a form
 * beside content → flex section (flex-67-33 / flex-33-67 by the split); D a block beside
 * content → flex section; E an XF beside content → flex section; F image + title + CTA per
 * column → Cards Corp; G → Columns (variant by the split, modifiers by the cell content).
 * @param {object[][]} columns the items of each column
 * @param {object} split { variant, flex, cards } of the column control
 */
export function columnItems(columns, split, ctx) {
  const { doc } = ctx;
  const anchors = [];
  const cols = columns.map((items) => items.filter((it) => {
    if (it.type === 'anchor') anchors.push(it);
    return it.type !== 'anchor';
  }));
  const filled = cols.filter(hasContent);
  if (!filled.length) return anchors;
  if (filled.length === 1) return [...anchors, { type: 'boundary' }, ...filled[0], { type: 'boundary' }];

  const all = filled.flat();
  if (filled.every((items) => items.every((it) => it.type === 'counter'))) {
    return [...anchors, {
      type: 'own', kind: 'statistics', styles: [], nodes: [statistics(all, ctx, filled.length)],
    }];
  }

  const flex = (styles, items) => ({
    type: 'own', kind: 'flex', styles: ['flex', ...styles], nodes: inlineNodes(items, ctx),
  });
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
  if (all.some((it) => !inCell(it) && it.type !== 'fragment')) return [...anchors, flex([], all)]; // D
  if (all.some((it) => it.type === 'fragment')) return [...anchors, flex([], all)]; // E

  if (split.cards && filled.length >= 2 && filled.every(isCard)) {
    // F: Cards Corp, one row per column: image | title + text + CTA
    const rows = filled.map((items) => [items[0].nodes, items.slice(1).flatMap((it) => it.nodes)]);
    return [...anchors, {
      type: 'own', kind: 'cards', styles: [], nodes: [block(doc, `Cards Corp (${split.cards})`, rows)],
    }];
  }

  // G: Columns, one row, one cell per column (empty columns keep their cell)
  const cells = cols.map((items) => cellNodes(items, ctx));
  const modifiers = [];
  if (cols.some((items) => items.some((it) => it.role === 'headline'))) modifiers.push('large-headline');
  const flows = (items) => items.filter((it) => it.type === 'flow' && it.nodes.length);
  const first = flows(cols[0]);
  const last = flows(cols[cols.length - 1]);
  if (first.length && first.every((it) => it.box === 'bg-gold')) modifiers.push('gold-first');
  if (last.length && last[0].box === 'bg-light-gray') modifiers.push('gray-lead');
  if (last.length && last.every((it) => it.box === 'dimensional')) modifiers.push('boxed-last');
  if (cols.every((items) => flows(items).every((it) => it.role === 'image'))) modifiers.push('media-pair');
  const boxes = cols.flatMap((items) => flows(items)).filter((it) => it.box);
  const used = { 'bg-gold': 'gold-first', 'bg-light-gray': 'gray-lead', dimensional: 'boxed-last' };
  boxes.filter((it) => !modifiers.includes(used[it.box])).forEach((it) => {
    ctx.report.notes.push(`Columns: ${it.box} box not reproduced (no variant for it in that cell): ${text(it.nodes[0] || doc.createElement('p')).slice(0, 40)}`);
  });
  const variants = [split.variant, ...modifiers].filter(Boolean);
  const name = variants.length ? `Columns (${variants.join(', ')})` : 'Columns';
  const copy = sharedCopyStyle(cells);
  return [...anchors, {
    type: 'own', kind: 'columns', styles: copy ? copy.split(', ') : [], nodes: [block(doc, name, [cells])],
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

function columnControl(el, ctx) {
  const split = [...el.classList].find((c) => /^cols\d?/.test(c)) || 'cols';
  const row = el.querySelector(':scope > .colctrl > .row') || el.querySelector('.row');
  const columns = row ? [...row.children].filter((c) => /\bcol-/.test(c.className)) : [];
  const items = columns.map((col) => ctx.collect(col));
  // cols: one column = a section boundary
  if (split === 'cols' || columns.length < 2) {
    const flat = items.flat();
    return hasContent(flat) ? [{ type: 'boundary' }, ...flat, { type: 'boundary' }] : flat;
  }
  if (!SPLITS[split]) ctx.report.notes.push(`column control ${split}: no Columns variant, imported as plain Columns`);
  return columnItems(items, SPLITS[split] || {}, ctx);
}

function gridRow(columns, widths, ctx) {
  const split = GRID_SPLITS[widths.join(',')];
  if (!split) {
    ctx.report.notes.push(`responsive grid row ${widths.join('+')}: no Columns variant, stacked`);
    return columns.flat();
  }
  return columnItems(columns, split, ctx);
}

/* ---------- components ---------- */

function textComponent(el, ctx) {
  const source = el.querySelector('.c-rich-text-editor > div') || el.querySelector('.c-rich-text-editor') || el;
  const { nodes, centred } = richTextNodes(source, ctx.doc);
  if (!nodes.length) return [];
  const box = boxOf(source);
  const item = {
    type: 'flow', role: 'text', nodes, centred, box,
  };
  // a coloured box on its own (not in a column): the section takes the background
  if (box && box !== 'dimensional') item.styles = [box];
  if (box === 'dimensional') item.styles = [];
  return [item];
}

function standaloneImage(el, ctx) {
  const nodes = standaloneImageNodes(el, ctx.doc);
  return nodes.length ? [{ type: 'flow', role: 'image', nodes }] : [];
}

function buttons(el, ctx) {
  const nodes = [...el.querySelectorAll('a[href]')].filter((a) => text(a))
    .map((a) => buttonNode(ctx.doc, a, text(a)));
  return nodes.length ? [{ type: 'flow', role: 'cta', nodes }] : [];
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
  (lines.length ? lines : [root]).forEach((line) => {
    const box = contentCopy(line, doc);
    const futuraVw = !!line.querySelector('.futura-bold') && vwSize(line) > 0;
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
    cleanRichText(box);
    [...box.children].filter((n) => text(n) || n.querySelector('img')).forEach((n) => {
      let node = n;
      if (!ctx.h1 && futuraVw && !nodes.length && n.tagName !== 'H1') {
        node = rename(n, 'h1');
        ctx.h1 = true;
      }
      nodes.push(node);
    });
  });
  if (!nodes.length) return [];
  const size = vwSize(root);
  const box = boxOf(root);
  const styles = [box && box !== 'dimensional' ? box : '', size >= 2 ? 'large-headline' : ''].filter(Boolean);
  return [{
    type: 'flow', role: 'headline', nodes, box, size, styles,
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
    items.push({ type: 'flow', role: 'text', nodes: [h] });
  }
  return items;
}

function experienceFragment(el, ctx) {
  const match = ctx.xfMatches && ctx.xfMatches.get(el);
  if (match) {
    const a = linkTo(ctx.doc, match.eds);
    return [{
      type: 'fragment', kind: 'fragment', styles: [], nodes: [block(ctx.doc, 'Fragment', [[a]])],
    }];
  }
  ctx.report.notes.push(`XF not matched to the index, kept inline: ${text(el).slice(0, 50)}`);
  return ctx.collect(el);
}

function carousel(el, ctx) {
  const { doc } = ctx;
  const slides = [...el.querySelectorAll('.carouselslide:not(.slick-cloned)')];
  if (!slides.length || !el.querySelector('img')) return [];
  if (slides.length > 1) ctx.report.notes.push(`carousel with ${slides.length} slides: only the first is imported (Hero Corp has one slide)`);
  const overlay = slides[0].querySelector('.overlayparsys');
  // a product hero overlay holds rich text + buttons (a news slide: a Large Headline only)
  let overlayNodes;
  if (overlay && overlay.querySelector('.c-rich-text-editor, .curatedcta')) {
    overlayNodes = inlineNodes(ctx.collect(overlay), ctx);
    if (overlayNodes.some((n) => n.tagName === 'H1')) ctx.h1 = true;
  }
  const holder = doc.createElement('div');
  holder.append(el.cloneNode(true));
  heroImageSlideParser(holder.firstElementChild, { document: doc, overlayNodes });
  return [{
    type: 'own', kind: 'hero', styles: [], nodes: [...holder.children],
  }];
}

/** Jump bar (jumpbarnav) → Sticky Nav: one row per anchor, label | #id. */
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
  'bg-golden-gradient': 'bg-golden-gradient',
};

function fullBleedPanel(el, ctx) {
  const panel = el.querySelector('.c-full-bleed-panel') || el;
  const items = ctx.collect(panel);
  if (!hasContent(items.filter((it) => it.type !== 'anchor' && it.type !== 'boundary'))) return items.filter((it) => it.type === 'anchor');
  const cls = [...panel.classList].find((c) => PANELS[c]);
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
  const colour = COUNTER_COLOURS[styleColour(number)] || 'teal';
  const label = el.querySelector('.container > .text-left, .container > div:last-child');
  const desc = doc.createElement('p');
  if (label) {
    const copy = contentCopy(label, doc);
    cleanRichText(copy);
    copy.querySelectorAll('strong, em').forEach(unwrap);
    const target = copy.querySelector('p') || copy;
    desc.append(...target.childNodes);
  }
  return [{
    type: 'counter', colour, value, desc,
  }];
}

function standaloneVideo(el, ctx) {
  const link = videoLink(el, ctx.doc);
  if (!link) return [];
  return [{
    type: 'block', block: block(ctx.doc, 'Video', [[link]]), cellNodes: [para(ctx.doc, link.cloneNode(true))],
  }];
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
    const href = absoluteAsset(link.getAttribute('href'));
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
  if (!grid.querySelector('.item img')) return [];
  const out = [];
  const heading = grid.querySelector('h2');
  if (heading && text(heading)) {
    const h2 = doc.createElement('h2');
    h2.textContent = text(heading);
    out.push({ type: 'flow', role: 'text', nodes: [h2] });
  }
  const holder = doc.createElement('div');
  const copy = grid.cloneNode(true);
  copy.querySelectorAll('h2').forEach((h) => h.remove());
  holder.append(copy);
  cardsCorpTeaserParser(copy, { document: doc });
  out.push({ type: 'block', block: holder.firstElementChild });
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
  const panels = panes.map((pane) => inlineNodes(ctx.collect(pane), ctx));
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
    type: 'own', kind: 'tabs', styles: ['tabbed'], nodes,
  }];
}

/** Page short description: hidden on most pages (skipped as hidden); visible → lead content. */
function shortDescription(el, ctx) {
  const { nodes } = richTextNodes(el, ctx.doc);
  return nodes.length ? [{ type: 'flow', role: 'text', nodes }] : [];
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

const skip = () => [];

// AEM components by wrapper class (or #id)
export const COMPONENTS = {
  carouselslidegroup: carousel,
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
  standalonevideo: standaloneVideo,
  interactivemedia: interactiveMedia,
  sectionseparator: () => [{ type: 'separator' }],
  curatedcta: buttons,
  buttonset: buttons,
  secondarycta: buttons,
  contactbutton: buttons,
  customizable: cardList,
  resourcesanddownload: resources,
  '#product-detail-container': shortDescription,
  tagcrumb: skip,
};

/** The corp handlers for createBuilder: components, responsive-grid rows, the fallback. */
export const CORP_HANDLERS = { components: COMPONENTS, row: gridRow, fallback };
