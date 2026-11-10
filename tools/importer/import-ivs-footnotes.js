/* global WebImporter */
// www.stryker.com Interventional Spine footnotes (#516): the footnotes index
// (/us/en/interventional-spine/footnotes) and its detail pages
// (/us/en/interventional-spine/footnotes/<slug>), base template.

// PARSER IMPORTS
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import { pageHeroes } from './transformers/long-page-detail-corp-components.js';
import xfFragmentPath from './xf-fragment-path.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'ivs-footnotes',
  description: 'www.stryker.com Interventional Spine footnotes (#516), base template. Detail pages: the shared "❮ BACK" link as a Fragment block; the page hero (gold H1, document code subhead) then, in a `separator` section, each revision as a bold `[[text-1-25]…]` label, a `[[body-font]**…**]` date line and its numbered references. Index: the hero, then an Accordion (divided) in a `separator` section, one row per document (label "<code> <title>"; body: the current-revision lines, references, disclaimer and a bold + italic "View past revisions" link, the gold button).',
  urls: [
    'https://www.stryker.com/us/en/interventional-spine/footnotes.html',
    'https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html',
  ],
  blocks: [
    { name: 'accordion', instances: ['.c-accordion .panel-group'] },
  ],
};

// the "❮ BACK" link XF above the hero of each detail page
export const BACK_XF = '/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master';

const transformers = [cleanupTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

const clean = (s) => (s || '').replace(/[\s\u00a0]+/g, ' ').trim();
const text = (el) => (el ? clean(el.textContent) : '');

/** `published` (YYYY-MM-DD) from the source's #hiddenPublishedDate (MM/DD/YYYY). */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

/**
 * A copy of a paragraph or list item's inline content: its text (non-breaking spaces as
 * spaces), links, bold, italic, superscript and subscript, without the source's font spans
 * and leading / trailing line breaks.
 */
function inlineCopy(document, from, to) {
  const copy = (src, dst) => src.childNodes.forEach((n) => {
    if (n.nodeType === 3) dst.append(document.createTextNode(n.textContent.replace(/\u00a0/g, ' ')));
    else if (n.nodeName === 'BR') dst.append(document.createElement('br'));
    else if (['A', 'STRONG', 'B', 'EM', 'I', 'SUP', 'SUB'].includes(n.nodeName)) {
      const tag = { B: 'strong', I: 'em' }[n.nodeName] || n.nodeName.toLowerCase();
      const el = document.createElement(tag);
      if (n.nodeName === 'A') el.href = n.getAttribute('href');
      copy(n, el);
      dst.append(el);
    } else if (n.nodeType === 1) copy(n, dst);
  });
  copy(from, to);
  const blank = (n) => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()));
  while (blank(to.lastChild)) to.lastChild.remove();
  while (blank(to.firstChild)) to.firstChild.remove();
  const { firstChild: first, lastChild: last } = to;
  if (first && first.nodeType === 3) first.textContent = first.textContent.trimStart();
  if (last && last.nodeType === 3) last.textContent = last.textContent.trimEnd();
  return to;
}

/** A line set in bold as a whole: `<b>` (Humanist bold on the source) */
const isBoldLine = (p) => {
  const b = p.querySelector('b, strong');
  return !!b && !p.querySelector('.futura-bold') && text(b) === text(p);
};

/**
 * The footnote copy of a rich-text component, as default content: a revision label
 * (Futura bold, 1.25em) as a bold `[[text-1-25]…]` paragraph, a bold line (Humanist bold:
 * "Revision Date: …") as `[[body-font]**…**]`, paragraphs and numbered references as they
 * are. Empty spacer paragraphs are dropped.
 */
function footnoteNodes(document, container) {
  const out = [];
  container.querySelectorAll(':scope > p, :scope > ol, :scope > ul').forEach((src) => {
    if (!text(src)) return;
    if (src.matches('ol, ul')) {
      const list = document.createElement(src.tagName.toLowerCase());
      src.querySelectorAll(':scope > li').forEach((li) => {
        if (text(li)) list.append(inlineCopy(document, li, document.createElement('li')));
      });
      out.push(list);
      return;
    }
    const p = document.createElement('p');
    const label = src.querySelector('.futura-bold');
    if (label && text(label) === text(src)) {
      const strong = document.createElement('strong');
      strong.textContent = src.querySelector('.fontsize-1-25em') ? `[[text-1-25]${text(src)}]` : text(src);
      p.append(strong);
    } else if (isBoldLine(src)) {
      const strong = document.createElement('strong');
      strong.textContent = text(src);
      p.append(document.createTextNode('[[body-font]'), strong, document.createTextNode(']'));
    } else inlineCopy(document, src, p);
    out.push(p);
  });
  return out;
}

/** The rich-text components of a container (their inner content box) */
const richTexts = (root) => [...root.querySelectorAll('.c-rich-text-editor')]
  .map((rte) => rte.querySelector(':scope > div') || rte);

/** The page hero (gold H1, document code, grey rule) via the corp page-hero converter */
function hero(document, src) {
  const component = src.querySelector('.c-page-hero');
  if (!component) return { nodes: [], rule: false };
  const box = document.createElement('div');
  box.append(component.cloneNode(true));
  pageHeroes(box, document, {
    text,
    richText: (doc, nodes) => {
      const wrap = doc.createElement('div');
      wrap.setAttribute('data-hero', '');
      wrap.append(...nodes);
      return wrap;
    },
  });
  const nodes = [...box.querySelectorAll('[data-hero] > *')];
  return { nodes, rule: !!box.querySelector('.sectionseparator') };
}

function buildDetail(document, src) {
  const nodes = [];
  const fragment = xfFragmentPath(BACK_XF);
  if (fragment && src.querySelector('.experiencefragment a[href]')) {
    const a = document.createElement('a');
    a.href = fragment;
    a.textContent = fragment;
    nodes.push(WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[a]] }));
    nodes.push(document.createElement('hr'));
  }
  const { nodes: heroNodes, rule } = hero(document, src);
  nodes.push(...heroNodes, document.createElement('hr'));
  richTexts(src)
    .filter((box) => !box.closest('.experiencefragment, .c-page-hero'))
    .forEach((box) => nodes.push(...footnoteNodes(document, box)));
  if (rule) nodes.push(sectionMetadata(document, 'separator'));
  return nodes;
}

/**
 * The accordion of the index, one row per document: its body the current-revision lines,
 * references and disclaimer, then "View past revisions" (source: gold button) as a bold +
 * italic link on its own line (the gold accent button).
 */
function buildIndex(document, src) {
  const { nodes: heroNodes, rule } = hero(document, src);
  const nodes = [...heroNodes, document.createElement('hr')];
  const group = src.querySelector('.panel-group');
  if (group) {
    group.querySelectorAll(':scope > .panel').forEach((panel) => {
      const body = panel.querySelector('.panel-body');
      if (!body) return;
      const content = document.createElement('div');
      richTexts(body).forEach((box) => content.append(...footnoteNodes(document, box)));
      body.querySelectorAll('a.btn-gold[href]').forEach((btn) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        const em = document.createElement('em');
        const a = document.createElement('a');
        a.href = btn.getAttribute('href');
        a.textContent = text(btn);
        em.append(a);
        strong.append(em);
        p.append(strong);
        content.append(p);
      });
      body.replaceChildren(content);
    });
    const holder = document.createElement('div');
    holder.append(group);
    accordionParser(group, { document, name: 'Accordion (divided)' });
    nodes.push(...holder.childNodes);
  }
  if (rule) nodes.push(sectionMetadata(document, 'separator'));
  return nodes;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const published = publishedDate(document);
    const meta = WebImporter.Blocks.getMetadata(document);
    const src = document.querySelector('[role="main"]') || document.body;

    const isIndex = !!src.querySelector('.c-accordion .panel-group');
    const main = document.createElement('div');
    main.append(...(isIndex ? buildIndex(document, src) : buildDetail(document, src)));
    document.body.replaceChildren(main);

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    meta.site = 'corp';
    if (published) meta.published = published;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = source.pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: meta.Title || document.title,
        template: PAGE_TEMPLATE.name,
        kind: isIndex ? 'index' : 'detail',
      },
    }];
  },
};
