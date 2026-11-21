#!/usr/bin/env node
/*
 * Containers prototype (2026-11-19): standard pages rewritten so that layouts, tabs and accordion
 * items are section styles (scripts/containers.js) instead of Columns blocks, heading-split
 * `tabbed` sections and text-only Accordion blocks. Words, links and images stay the same.
 * - a Columns block → its own `layout` section (preset from the variant: halves / thirds /
 *   quarters / fifths / sixths / wide-first / wide-last, `middle` kept), each cell a column, the
 *   cells separated by `Column break` lines; the content before and after it stays in sections
 *   of their own (`continued`, so no gap opens)
 * - a `tabbed` section → one `tab` section per tab (its heading first), the content before the
 *   first tab in a section of its own; a tab's columns go to `continued` sections. A tab starts
 *   at a heading with one of the page's tab titles on stryker.com (the export's tabsGrid), else
 *   at each heading of the section's deepest level (the rule of the `tabbed` sections)
 * - an `accordion-panel` section's columns → `continued` sections after it
 * - a text-only Accordion block → one `accordion-panel` section per item (its label as a heading)
 * The prototypes go under <content>/std/drafts/containers/ (local only).
 * usage: node tools/importer/standardise/containers.mjs --content content --pages <path>,<path>
 */
import { createRequire } from 'module';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'fs';
import { join, dirname, basename } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const content = opt('--content', 'content');
const pages = (opt('--pages') || '').split(',').filter(Boolean);
if (!pages.length) {
  console.error('usage: containers.mjs --content <dir> --pages <path>,<path>');
  process.exit(2);
}

/**
 * the page's tab titles as authored on stryker.com (the tabs components' tabsGrid in the export,
 * .migration/xf-mapping): a heading of that text starts a tab; none: the deepest heading level
 */
function tabTitles(path) {
  const file = join('.migration/xf-mapping', `${path}.json`);
  if (!existsSync(file)) return [];
  const titles = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (o.tabsGrid && typeof o.tabsGrid === 'object') {
      Object.values(o.tabsGrid).forEach((t) => {
        if (t?.tabTitle) titles.push(t.tabTitle.trim());
      });
    }
    Object.values(o).forEach(walk);
  };
  walk(JSON.parse(readFileSync(file, 'utf8')));
  return titles;
}

/** runs in the page: one document's HTML → the prototype's, and what was converted */
function convert([html, titles]) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const counts = {
    columns: 0, tabs: 0, accordions: 0, sections: 0,
  };
  const el = (tag, attrs = {}, ...kids) => {
    const e = doc.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    e.append(...kids);
    return e;
  };
  const row = (k, v) => el('div', {}, el('div', {}, k), el('div', {}, v));
  // a section's metadata rows: style (split) and the others (id …), in order
  const metaOf = (section) => {
    const meta = section.querySelector(':scope > .section-metadata');
    const rows = meta
      ? [...meta.children].map((r) => [r.children[0]?.textContent.trim(), r.children[1]]) : [];
    meta?.remove();
    const style = rows.find(([k]) => k.toLowerCase() === 'style');
    return {
      styles: style ? style[1].textContent.split(',').map((x) => x.trim()).filter(Boolean) : [],
      rows: rows.filter(([k]) => k.toLowerCase() !== 'style'),
    };
  };
  // a section: its nodes and metadata (styles; other rows only on the first piece)
  const section = (nodes, styles, rows = []) => {
    const out = el('div', {}, ...nodes);
    const meta = el('div', { class: 'section-metadata' });
    if (styles.length) meta.append(row('style', [...new Set(styles)].join(', ')));
    rows.forEach(([k, v]) => meta.append(row(k, v.cloneNode(true))));
    if (meta.children.length) out.append(meta);
    counts.sections += 1;
    return out;
  };
  // inline content (a bare link, text) of a cell → a paragraph
  const blockish = (n) => n.nodeType === 1 && /^(P|H[1-6]|UL|OL|DIV|TABLE|BLOCKQUOTE|PRE|HR|PICTURE)$/.test(n.tagName);
  const cellNodes = (cell) => {
    const out = [];
    let p = null;
    [...cell.childNodes].forEach((n) => {
      if (n.nodeType === 3 && !n.textContent.trim()) return;
      if (blockish(n)) {
        out.push(n);
        p = null;
      } else {
        if (!p) {
          p = el('p');
          out.push(p);
        }
        p.append(n);
      }
    });
    return out;
  };
  const PRESETS = {
    1: [], 2: ['halves'], 3: ['thirds'], 4: ['quarters'], 5: ['fifths'], 6: ['sixths'],
  };
  const isMedia = (cell) => !!cell.querySelector('a[href*="/is/image/"], a[href*="/is/content/"], picture, img')
    && !cell.querySelector('h1, h2, h3, h4, h5, h6, li') && cell.textContent.trim().length < 200;
  // a Columns block → layout styles + nodes (cells separated by Column break lines)
  const layoutOf = (block) => {
    const cls = [...block.classList];
    const rows = [...block.children];
    const cells = rows.flatMap((r) => [...r.children]);
    const perRow = rows[0] ? rows[0].children.length : cells.length;
    let preset = PRESETS[Math.min(perRow, 6)] || ['quarters'];
    if (cls.includes('wide-first')) preset = ['wide-first'];
    if (cls.includes('wide-last')) preset = ['wide-last'];
    // (media + text: a wide or narrow image is the image's column, two thirds or one third)
    if (perRow === 2 && (cls.includes('wide-image') || cls.includes('narrow-image'))) {
      const imageFirst = isMedia(rows[0].children[0]);
      const wideFirst = cls.includes('wide-image') ? imageFirst : !imageFirst;
      preset = [wideFirst ? 'wide-first' : 'wide-last'];
    }
    const styles = ['layout', ...preset, ...(cls.includes('middle') || cls.includes('text-middle') ? ['middle'] : [])];
    const nodes = cells.flatMap((cell, i) => [...(i ? [el('p', {}, 'Column break')] : []), ...cellNodes(cell)]);
    counts.columns += 1;
    return { styles, nodes };
  };
  const CONTAINER = ['tabbed', 'accordion-panel', 'tab'];
  // a section's nodes split at its Columns blocks → sections: the first with `first` styles,
  // the others `continued` (each keeps the section's other styles)
  const split = (nodes, base, firstStyles, rows) => {
    const pieces = [];
    let run = [];
    const flush = () => {
      if (!run.length) return;
      pieces.push({ nodes: run, styles: [] });
      run = [];
    };
    nodes.forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'DIV' && n.classList.contains('columns')) {
        flush();
        pieces.push(layoutOf(n));
      } else run.push(n);
    });
    flush();
    return pieces.map((pc, i) => section(pc.nodes, [
      ...(i ? ['continued'] : firstStyles),
      ...base.filter((s) => !(i && s === 'divider')),
      ...pc.styles,
    ], i ? [] : rows));
  };
  // a text-only Accordion block → accordion-panel sections (label → h3)
  const accordionOf = (block, base) => {
    counts.accordions += 1;
    return [...block.children].map((item) => {
      const [label, body] = item.children;
      const h = el('h3');
      h.append(...[...(label?.childNodes || [])].map((n) => n.cloneNode(true)));
      return section([h, ...(body ? cellNodes(body) : [])], ['accordion-panel', ...base]);
    });
  };

  const out = [];
  [...doc.body.children].forEach((sec) => {
    if (sec.tagName !== 'DIV' || sec.querySelector(':scope > .metadata')) {
      out.push(sec);
      return;
    }
    const { styles, rows } = metaOf(sec);
    const base = styles.filter((s) => !CONTAINER.includes(s));
    const nodes = [...sec.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
    if (styles.includes('tabbed')) {
      // tabs: the deepest heading level of the section's own headings starts a tab
      const heads = nodes.filter((n) => /^H[1-6]$/.test(n.tagName));
      const level = Math.max(...heads.map((h) => Number(h.tagName[1])));
      const named = heads.filter((h) => titles.includes(h.textContent.trim()));
      const startsTab = (n) => (named.length ? named.includes(n) : n.tagName === `H${level}`);
      const intro = [];
      const tabs = [];
      nodes.forEach((n) => {
        if (startsTab(n)) tabs.push([n]);
        else if (tabs.length) tabs[tabs.length - 1].push(n);
        else intro.push(n);
      });
      counts.tabs += 1;
      if (intro.length) out.push(...split(intro, base, [], rows));
      tabs.forEach((t, i) => out.push(...split(t, base, ['tab'], intro.length || i ? [] : rows)));
      return;
    }
    if (styles.includes('accordion-panel')) {
      out.push(...split(nodes, base, ['accordion-panel'], rows));
      return;
    }
    // a text-only accordion block in a section: before / items / after
    const acc = nodes.find((n) => n.tagName === 'DIV' && n.classList.contains('accordion'));
    if (acc) {
      const at = nodes.indexOf(acc);
      if (at) out.push(...split(nodes.slice(0, at), base, [], rows));
      out.push(...accordionOf(acc, base));
      if (at < nodes.length - 1) out.push(...split(nodes.slice(at + 1), base, ['continued'], []));
      return;
    }
    out.push(...split(nodes, base, [], rows));
  });
  doc.body.replaceChildren(...out);
  return { html: doc.body.innerHTML, counts };
}

const browser = await chromium.launch();
const page = await browser.newPage();
await pages.reduce((prev, path) => prev.then(async () => {
  const src = join(content, 'std', `${path}.plain.html`);
  const { html, counts } = await page.evaluate(convert, [readFileSync(src, 'utf8'), tabTitles(path)]);
  const dest = join(content, 'std', 'drafts', 'containers', `${basename(path)}.plain.html`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(`${path} → ${dest}: ${JSON.stringify(counts)}`);
}), Promise.resolve());
await browser.close();
