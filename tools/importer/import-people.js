/* global WebImporter */
// www.stryker.com People pages → template people (#515): the leader bios
// (/us/en/about/our-management/leaders/<id>), director bios
// (/us/en/about/our-board-of-directors/directors/<id>) and the leaders index.

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import xfFragmentPath from './xf-fragment-path.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'people',
  description: 'www.stryker.com People pages (#515). Bio pages: the shared Back link as a Fragment block; H1 (gold first name) + role in a `serif, p-1-75, h1-1-25` section; Columns [bio | portrait]. Leaders index: H1 + intro (`serif, p-2`), then per group an H2 (corp draws its grey rule) and a Cards Corp (people) block of [portrait | name / role / Meet link] tiles. `published` from the source date; `last-updated: show` where the source shows its Last Updated line.',
  urls: [
    'https://www.stryker.com/us/en/about/our-management/leaders.html',
    'https://www.stryker.com/us/en/about/our-management/leaders/1004.html',
    'https://www.stryker.com/us/en/about/our-board-of-directors/directors/1064.html',
  ],
  blocks: [],
};

// the Back link XF each kind of bio page shows above the bio
const BACK_XFS = {
  leaders: '/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master',
  directors: '/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master',
};

const transformers = [cleanupTransformer, dmImagesTransformer];

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

/**
 * The page date as `published` (YYYY-MM-DD) from the source's hidden published date
 * (#hiddenPublishedDate, MM/DD/YYYY).
 */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/**
 * A two-tone name: the gold run (source span color #ffb500, minus any black span nested
 * in it) is the first name, the rest of the text the last name.
 * @returns {{first: string, last: string}}
 */
function splitName(el) {
  const full = text(el);
  const gold = el.querySelector('[style*="ffb500" i]');
  if (!gold) return { first: '', last: full };
  const copy = gold.cloneNode(true);
  copy.querySelectorAll('[style*="color"]').forEach((n) => n.remove());
  const first = text(copy);
  if (!first || !full.startsWith(first)) return { first: '', last: full };
  return { first, last: clean(full.slice(first.length)) };
}

/** `**[[color-gold]First] Last**` into `parent` */
function appendName(document, parent, { first, last }) {
  const strong = document.createElement('strong');
  strong.textContent = [first && `[[color-gold]${first}]`, last].filter(Boolean).join(' ');
  parent.append(strong);
}

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

function image(document, img) {
  const out = document.createElement('img');
  out.src = img.getAttribute('src');
  out.alt = img.getAttribute('alt') || '';
  return out;
}

/**
 * A copy of a bio paragraph: its text and links, without the source's font spans, trailing
 * line breaks and non-breaking spaces.
 */
function bioParagraph(document, p) {
  const out = document.createElement('p');
  const copy = (from, to) => from.childNodes.forEach((n) => {
    if (n.nodeType === 3) to.append(document.createTextNode(n.textContent.replace(/\u00a0/g, ' ')));
    else if (n.nodeName === 'BR') to.append(document.createElement('br'));
    else if (['A', 'STRONG', 'B', 'EM', 'I', 'SUP', 'SUB'].includes(n.nodeName)) {
      const el = document.createElement(n.nodeName === 'B' ? 'strong' : n.nodeName.toLowerCase());
      if (n.nodeName === 'A') el.href = n.getAttribute('href');
      copy(n, el);
      to.append(el);
    } else if (n.nodeType === 1) copy(n, to);
  });
  copy(p, out);
  const blank = (n) => n && (n.nodeName === 'BR'
    || (n.nodeType === 3 && !n.textContent.trim()));
  while (blank(out.lastChild)) out.lastChild.remove();
  while (blank(out.firstChild)) out.firstChild.remove();
  const { firstChild: first, lastChild: last } = out;
  if (first && first.nodeType === 3) first.textContent = first.textContent.trimStart();
  if (last && last.nodeType === 3) last.textContent = last.textContent.trimEnd();
  return out.textContent.trim() ? out : null;
}

/** a paragraph that holds only a document code (source span.fontsize-8em) */
function isDocCode(p) {
  const span = p.querySelector('.fontsize-8em');
  return !!span && !!text(p) && text(span) === text(p);
}

/** the document codes and `.c-disclaimer` text as a closing small-print section */
function disclaimerSection(document, src) {
  const paras = [
    ...[...src.querySelectorAll('.c-rich-text-editor p')].filter(isDocCode),
    ...src.querySelectorAll('.c-disclaimer p:not(#publishedDate)'),
  ].map((p) => bioParagraph(document, p)).filter(Boolean);
  if (!paras.length) return [];
  return [document.createElement('hr'), ...paras, sectionMetadata(document, 'disclaimer')];
}

function buildBio(document, src, kind) {
  const nodes = [];
  const fragment = xfFragmentPath(BACK_XFS[kind]);
  if (fragment) {
    const a = document.createElement('a');
    a.href = fragment;
    a.textContent = fragment;
    nodes.push(WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[a]] }));
    nodes.push(document.createElement('hr'));
  }

  const h1Src = src.querySelector('h1');
  const rte = h1Src.closest('.c-rich-text-editor');
  const h1 = document.createElement('h1');
  appendName(document, h1, splitName(h1Src));
  nodes.push(h1);

  // the role is the first paragraph's 1.75em run; a director's second line after it
  // (14px copy on the source) opens the bio
  const paras = [...rte.querySelectorAll('p')];
  const roleP = paras.shift();
  const roleSpan = roleP && roleP.querySelector('.fontsize-1-75em');
  const bio = [];
  if (roleP) {
    const role = document.createElement('p');
    role.textContent = text(roleSpan || roleP);
    nodes.push(role);
    if (roleSpan) {
      const rest = roleP.cloneNode(true);
      rest.querySelector('.fontsize-1-75em').remove();
      const extra = bioParagraph(document, rest);
      if (extra) bio.push(extra);
    }
  }
  nodes.push(sectionMetadata(document, 'serif, p-1-75, h1-1-25'));
  nodes.push(document.createElement('hr'));

  paras.filter((p) => !isDocCode(p)).forEach((p) => {
    const out = bioParagraph(document, p);
    if (out) bio.push(out);
  });
  const imgSrc = rte.closest('.aem-Grid')?.querySelector('.c-standalone-image img')
    || src.querySelector('.c-standalone-image img');
  const imgCell = imgSrc ? [image(document, imgSrc)] : [];
  nodes.push(WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [[bio, imgCell]] }));
  return nodes;
}

function buildTile(document, tile) {
  const img = tile.querySelector('.c-standalone-image img');
  const link = tile.querySelector('.standalone-link a[href]')
    || [...tile.querySelectorAll('.c-rich-text-editor a[href]')].pop();
  const nameEl = tile.querySelector('.c-rich-text-editor .futura-bold');
  const nameP = nameEl && nameEl.closest('p');
  const body = [];
  if (nameEl) {
    const p = document.createElement('p');
    appendName(document, p, splitName(nameEl));
    body.push(p);
  }
  const role = nameP && nameP.querySelector('.urw-egyptienne');
  if (role && text(role)) {
    const p = document.createElement('p');
    p.textContent = text(role);
    body.push(p);
  }
  if (link) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    const u = document.createElement('u');
    a.href = link.getAttribute('href');
    // "Meet debra" / "Meet TINA" → "Meet Debra" / "Meet Tina" (it renders uppercase)
    u.textContent = text(link).replace(/^(\S+\s+)(\S)(\S*)/, (m, w, c, r) => `${w}${c.toUpperCase()}${r.toLowerCase()}`);
    a.append(u);
    strong.append(a);
    p.append(strong);
    body.push(p);
  }
  return [img ? [image(document, img)] : [], body];
}

function buildIndex(document, src) {
  const nodes = [];
  const h1Src = src.querySelector('h1');
  const h1 = document.createElement('h1');
  const strong = document.createElement('strong');
  strong.textContent = text(h1Src);
  h1.append(strong);
  nodes.push(h1);
  h1Src.closest('.c-rich-text-editor').querySelectorAll('p').forEach((p) => {
    if (!text(p)) return;
    const out = document.createElement('p');
    out.textContent = text(p);
    nodes.push(out);
  });
  nodes.push(sectionMetadata(document, 'serif, p-2'));

  // each section title opens a group; the tiles that follow it are its cards
  const items = [...src.querySelectorAll('.c-section-title h2, .buildingblock')];
  const groups = [];
  items.forEach((el) => {
    if (el.tagName === 'H2') groups.push({ title: text(el), tiles: [] });
    else if (groups.length && el.querySelector('.c-standalone-image img')) {
      groups[groups.length - 1].tiles.push(el);
    }
  });
  groups.forEach(({ title, tiles }, i) => {
    // the source's empty text component between groups
    if (i) nodes.push(document.createElement('hr'), sectionMetadata(document, 'spacer, xxlarge'));
    nodes.push(document.createElement('hr'));
    const h2 = document.createElement('h2');
    h2.textContent = title;
    nodes.push(h2);
    nodes.push(WebImporter.Blocks.createBlock(document, {
      name: 'Cards Corp (people)',
      cells: tiles.map((tile) => buildTile(document, tile)),
    }));
  });
  return nodes;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const published = publishedDate(document);
    const dateLine = document.querySelector('#publishedDate');
    const showDate = !!dateLine && !dateLine.classList.contains('hidden');
    const meta = WebImporter.Blocks.getMetadata(document);

    const kind = (source.pathname.match(/\/(leaders|directors)\/[^/]+$/) || [])[1];
    const main = document.createElement('div');
    main.append(...(kind ? buildBio(document, document.body, kind)
      : buildIndex(document, document.body)), ...disclaimerSection(document, document.body));
    document.body.replaceChildren(main);

    executeTransformers('afterTransform', main, payload);

    // `site: corp` and the " | Stryker" title suffix come from the corp bulk metadata;
    // site + template are repeated on the page so it renders the same anywhere
    main.appendChild(document.createElement('hr'));
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (published) meta.published = published;
    if (published && showDate) meta['last-updated'] = 'show';
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
        kind: kind || 'index',
        'last-updated': published && showDate ? 'show' : '',
      },
    }];
  },
};
