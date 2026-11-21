#!/usr/bin/env node
/*
 * Authored-style coverage check: for each imported page, the styling authored on the source
 * (image borders, alignment, indents, blank lines, coloured text boxes, links opening in a new
 * tab, lists, headings, images) must be carried by the import output. The text coverage check
 * (check-coverage.js) finds lost text; this finds text and images that arrive without the
 * styling the source gives them, e.g. a rule that works for a component on its own but not
 * inside a column.
 *
 * Source: the rendered page snapshots of the fast import's page cache (what the importer
 * reads), loaded with their cached stylesheets, so only what the live page shows counts.
 * Output: the documents of an import run (the page and the fragment documents it links to).
 * A styled source element is looked up in the output by its text (images by their asset);
 * its output context (inline [[…]] tags, section styles and settings, block options, cell)
 * must carry the style. Elements whose text is not found are counted apart (the text check's
 * business).
 *
 * Also lists the classes and inline style properties in the authored content that no import
 * rule names (--unknown): candidates for styling not handled yet.
 *
 * Usage: node tools/importer/migration-index/check-style-coverage.mjs --run <import run dir>
 *          --cache <page cache dir> [--rules a,b] [--pages <path>,…] [--unknown] [--json <file>]
 *   <import run dir>  holds content/ and tools/importer/reports/ (fast-import.mjs --out)
 *   <page cache dir>  fast-import.mjs --cache (pages/ and assets/)
 * Exit code 1 when any page misses a style.
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { createRequire } from 'module';
import { join } from 'path';
import { REPO, walk } from './lib.js';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const run = opt('--run');
const cache = opt('--cache');
if (!run || !cache) {
  console.error('usage: check-style-coverage.mjs --run <import run dir> --cache <page cache dir>'
    + ' [--rules a,b] [--pages p,…] [--unknown] [--json file]');
  process.exit(2);
}
const onlyRules = opt('--rules') ? opt('--rules').split(',') : null;
const onlyPages = opt('--pages') ? opt('--pages').split(',') : null;
const unknown = args.includes('--unknown');
const jsonOut = opt('--json');

const hash = (s) => createHash('sha1').update(s).digest('hex');
const content = join(run, 'content');

// the pages of the run (not the fragment documents): url → document path, from the reports
const pages = walk(join(run, 'tools/importer/reports'))
  .filter((f) => f.endsWith('.report.json'))
  .map((f) => JSON.parse(readFileSync(f, 'utf8')))
  .filter((r) => r.status === 'success' && r.url && !/[?&](xf|cf|modal)=/.test(r.url) && !r.path.includes('/fragments/'))
  .filter((r) => !onlyPages || onlyPages.some((p) => r.path.endsWith(p.replace(/^\//, ''))))
  .sort((a, b) => a.path.localeCompare(b.path));

/** A page's document and the fragment documents it links to (and theirs), as html. */
function outputDocs(path) {
  const docs = [];
  const seen = new Set();
  const add = (p) => {
    if (seen.has(p)) return;
    seen.add(p);
    const file = join(content, `${p}.plain.html`);
    if (!existsSync(file)) return;
    const html = readFileSync(file, 'utf8');
    docs.push({ path: p, html });
    [...html.matchAll(/href="(?:https?:\/\/[^"/]+)?(\/[^"#?]*\/fragments\/[^"#?]*)"/g)]
      .forEach((m) => add(m[1].replace(/^\//, '').replace(/\/$/, '')));
  };
  add(path);
  return docs;
}

// what the import rules name: a class they never mention is a candidate for --unknown
const ruleSource = walk(join(REPO, 'tools/importer/corp')).filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(f, 'utf8')).join('\n');

/* ---------- in the page: the source's styled elements ---------- */

// (runs in the browser, on the live snapshot)
function sourceFeatures({ wantUnknown }) {
  const root = document.querySelector('#aem-specific-data') || document.body;
  const OUT = 'header, footer, nav, .breadcrumb, .c-marketo-form, .c-stryker-form, .marketo-form-content, script, style, noscript, template';
  const norm = (s) => String(s || '').replace(/[\u00a0]/g, ' ').replace(/[\u200b]/g, '').replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  // shown on the live page: as markLivePage (inactive tab panes and collapsed panels count)
  const shown = (el) => {
    for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
      if (!e.matches('.tab-content, .panel-collapse') && getComputedStyle(e).display === 'none') return false;
    }
    return true;
  };
  const inContent = (el) => !el.closest(OUT) && shown(el);
  const asset = (src) => {
    try {
      const u = new URL(src, document.baseURI);
      return decodeURIComponent(u.pathname.split('/').pop()).replace(/\.[a-z0-9]+$/i, '').toLowerCase();
    } catch { return ''; }
  };
  const features = [];
  const add = (rule, el, key, detail = '', link = '') => {
    if (key) {
      features.push({
        rule, key, detail, link,
      });
    }
  };
  const rich = [...root.querySelectorAll('.c-rich-text-editor')].filter(inContent);

  // images (visible, Dynamic Media or DAM) and their borders
  [...root.querySelectorAll('img[src]')].filter(inContent).forEach((img) => {
    const src = img.getAttribute('src');
    if (!/\/is\/image\/|\/content\/dam\//.test(src)) return;
    const key = asset(src);
    const a = img.closest('a[href]');
    add('image', img, key, '', a ? a.href : '');
    const border = [...img.classList].find((c) => c.startsWith('bor-'));
    if (border) add('image-border', img, key, border);
  });

  rich.forEach((box) => {
    const blocks = [...box.querySelectorAll('p, h1, h2, h3, h4, h5, h6')];
    blocks.forEach((el) => {
      const t = norm(el.textContent);
      if (t.length >= 3) {
        const align = getComputedStyle(el).textAlign;
        if (align === 'center' || align === 'right') add(`align-${align}`, el, t.slice(0, 80));
        const left = (el.getAttribute('style') || '').match(/margin-left:\s*(\d+)px/i);
        if (left && Number(left[1]) > 0 && !el.closest('li, td, th')) add('indent', el, t.slice(0, 80), `${left[1]}px`);
        if (/^H[1-6]$/.test(el.tagName) && !el.closest('li, td, th')) add('heading', el, t.slice(0, 80), el.tagName.toLowerCase());
      } else if (el.tagName === 'P' && !el.closest('li, td, th')
        && !el.querySelector('img, picture, iframe, video, input, svg')
        && !el.textContent.replace(/[\s\u00a0\u200b]/g, '')
        && (/\u00a0/.test(el.textContent) || el.querySelector('br'))) {
        // blank lines in the columns of a column control with nothing else: only the tallest
        // column counts (the control is as high as it; the import keeps that many)
        const col = el.closest('.colctrl > .row > div');
        const empty = col && !norm(col.textContent) && !col.querySelector('img, video, iframe');
        const ctrls = [...root.querySelectorAll('.colctrl')];
        const group = empty ? `${ctrls.indexOf(col.closest('.colctrl'))}:${[...col.parentElement.children].indexOf(col)}` : '';
        add('blank-line', el, 'blank line', group);
      }
    });
    [...box.querySelectorAll('li')].forEach((li) => {
      const t = norm(li.textContent);
      if (t.length >= 3) add('list', li, t.slice(0, 80));
    });
    // a coloured text box (has-background bg-…) with text in it
    const inner = box.querySelector(':scope > div.has-background');
    if (inner) {
      const colour = [...inner.classList].find((c) => /^bg-/.test(c));
      const first = [...inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].map((e) => norm(e.textContent)).find((t) => t.length >= 3);
      if (colour && first) add('box-colour', inner, first.slice(0, 80), colour);
    }
  });

  // links opening in a new tab
  [...root.querySelectorAll('a[target="_blank" i][href]')].filter(inContent).forEach((a) => {
    const t = norm(a.textContent);
    const href = a.getAttribute('href');
    if (t.length >= 2 && !/^(mailto|tel|javascript):/i.test(href) && !href.startsWith('#')) add('new-tab', a, t.slice(0, 80));
  });

  let classes = [];
  let props = [];
  if (wantUnknown) {
    const all = [...root.querySelectorAll('*')].filter((el) => !el.closest(OUT));
    classes = [...new Set(all.filter(shown).flatMap((el) => [...el.classList]))];
    props = [...new Set(rich.flatMap((box) => [...box.querySelectorAll('[style]')])
      .flatMap((el) => (el.getAttribute('style') || '').split(';')
        .map((d) => d.split(':'))
        .filter(([, v]) => v && v.trim() && v.trim() !== '%')
        .map(([p, v]) => `${p.trim().toLowerCase()}: ${v.trim().toLowerCase().replace(/[\d.]+/g, 'N')}`)))];
  }
  return { features, classes, props };
}

/* ---------- in the page: where the output puts each one ---------- */

// (runs in the browser, on the output documents)
function outputCheck({ docs, features }) {
  const norm = (s) => String(s || '').replace(/[\u00a0]/g, ' ').replace(/[\u200b]/g, '').replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  // the text without the readable [[…]] tags
  const plain = (s) => norm(String(s || '').replace(/\[\[[^\]]*\]/g, '').replace(/\]/g, ''));
  const label = (s) => String(s || '').toLowerCase().replace(/^bg-/, '').replace(/[^a-z]/g, '');
  // source box classes → the style names the import writes (corp-component-handlers.js BOXES)
  const BOX = {
    'bg-lighter-gray': 'bg-gray', 'bg-gray': 'bg-silver', 'bg-orange': 'bg-dark-gold', 'bg-dark-teal-gradient': 'dark',
  };
  const parsed = docs.map((d) => ({ path: d.path, body: new DOMParser().parseFromString(`<body>${d.html}</body>`, 'text/html').body }));
  const asset = (src) => {
    try {
      const u = new URL(src, 'https://x.invalid/');
      return decodeURIComponent(u.pathname.split('/').pop()).replace(/\.[a-z0-9]+$/i, '').toLowerCase();
    } catch { return ''; }
  };
  const sectionOf = (el, body) => {
    let s = el;
    while (s && s.parentElement !== body) s = s.parentElement;
    return s;
  };
  // an element's output context: tags, section styles / settings, block options, cell number
  const contextOf = (el, body) => {
    const section = sectionOf(el, body);
    const meta = section && section.querySelector(':scope > .section-metadata');
    const settings = {};
    if (meta) {
      [...meta.children].forEach((row) => {
        const [k, v] = [...row.children].map((c) => c.textContent.trim());
        if (k) settings[k.toLowerCase()] = v || '';
      });
    }
    const styles = (settings.style || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const block = el.closest('div[class]:not(.section-metadata)');
    const blockClasses = block && section && section.contains(block) ? [...block.classList] : [];
    let cell = null;
    if (blockClasses.length) {
      const row = [...block.children].find((r) => r.contains(el));
      const c = row && [...row.children].find((x) => x.contains(el));
      cell = c ? [...row.children].indexOf(c) + 1 : null;
    }
    const tags = [...el.textContent.matchAll(/\[\[([^\]]+)\]/g)]
      .flatMap((m) => m[1].split(',')).map((t) => t.trim().toLowerCase());
    // the Box line the element sits under (Box: Gold, all 3% … Box end), in its container
    let box = '';
    let top = el;
    while (top.parentElement && !/^(DIV|BODY)$/.test(top.parentElement.tagName)) top = top.parentElement;
    for (let p = top.previousElementSibling; p; p = p.previousElementSibling) {
      const line = p.tagName === 'P' ? p.textContent.trim() : '';
      if (/^box end$/i.test(line)) break;
      const m = line.match(/^box:\s*([^,]+)/i);
      if (m) {
        box = m[1].trim();
        break;
      }
    }
    return {
      styles, settings, blockClasses, cell, tags, box, doc: '',
    };
  };
  const describe = (c) => [
    c.tags.length ? `tags ${c.tags.join(',')}` : '',
    c.styles.length ? `style ${c.styles.join(', ')}` : '',
    c.blockClasses.length ? `block ${c.blockClasses.join(' ')}${c.cell ? ` cell ${c.cell}` : ''}` : '',
    ...Object.entries(c.settings).filter(([k]) => k !== 'style').map(([k, v]) => `${k}: ${v}`),
  ].filter(Boolean).join(' | ') || 'no tags, styles or settings';

  // the output elements that hold text, and the images (links to the asset, or img)
  const textEls = [];
  const images = [];
  let blankLines = 0;
  parsed.forEach(({ path, body }) => {
    body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, a').forEach((el) => {
      textEls.push({
        el, body, path, text: plain(el.textContent),
      });
    });
    // (a linked image keeps the image URL in the link's title, scripts/dm-support.js)
    const IMAGE = /\/is\/image\/|\/content\/dam\/|media-assets|\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
    body.querySelectorAll('a[href], a[title], img[src]').forEach((el) => {
      [el.getAttribute('href'), el.getAttribute('title'), el.getAttribute('src')]
        .filter((src) => src && IMAGE.test(src))
        .forEach((src) => images.push({
          el, body, path, key: asset(src),
        }));
    });
    blankLines += [...body.querySelectorAll('p')].filter((p) => p.textContent.trim() === '[[Blank line]]').length;
    body.querySelectorAll('.section-metadata > div').forEach((row) => {
      const [k, v] = [...row.children].map((c) => c.textContent.trim());
      if (/^blank lines$/i.test(k || '')) blankLines += Number(v) || 0;
      // a colour band holding only a blank line is a stripe (corp-component-handlers.js)
      if (/^style$/i.test(k || '') && /\bstripe\b/.test(v || '')) blankLines += 1;
    });
  });
  const findText = (key, tags = null) => {
    const of = textEls.filter((t) => (!tags || tags.includes(t.el.tagName)) && t.text);
    const hits = of.filter((t) => t.text === key || t.text.startsWith(key.slice(0, 60)));
    if (hits.length) return hits;
    return of.filter((t) => key.length >= 20 && t.text.includes(key.slice(0, 40)));
  };
  // aligned by a tag, a section style, a block option or the section's Text setting
  const aligned = (c, a) => c.tags.some((t) => t === a || t === `align-${a}`) || c.styles.includes(a)
    || c.blockClasses.includes(a) || new RegExp(`\\b${a}\\b`, 'i').test(c.settings.text || '');
  const centred = (c) => aligned(c, 'center');
  const righted = (c) => aligned(c, 'right');

  const results = [];
  let sourceBlank = 0;
  const parallel = {};
  features.forEach((f) => {
    if (f.rule === 'blank-line') {
      if (!f.detail) sourceBlank += 1;
      else {
        const [ctrl, col] = f.detail.split(':');
        parallel[ctrl] = parallel[ctrl] || {};
        parallel[ctrl][col] = (parallel[ctrl][col] || 0) + 1;
      }
      return;
    }
    const out = { ...f };
    if (f.rule === 'image' || f.rule === 'image-border') {
      const hits = images.filter((i) => i.key === f.key);
      // a linked social image becomes an :icon: link to the same address (news-shared-fragments)
      const page = (href) => String(href || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/(\.html)?\/?([?#].*)?$/, '');
      const icon = f.link && textEls.some((t) => t.el.tagName === 'A' && /^:[a-z0-9-]+:$/.test(t.el.textContent.trim())
        && page(t.el.getAttribute('href')) === page(f.link));
      if (!hits.length && icon) out.status = 'ok';
      else if (!hits.length) out.status = f.rule === 'image' ? 'missing' : 'not-found';
      else if (f.rule === 'image') out.status = 'ok';
      else {
        const ctxs = hits.map((h) => contextOf(h.el, h.body));
        const ok = ctxs.some((c) => c.styles.some((s) => s.startsWith('image-border'))
          || c.blockClasses.some((s) => s.startsWith('image-border'))
          || c.tags.some((t) => t.startsWith('image-border') || t === 'border')
          || Object.entries(c.settings).some(([k, v]) => /border/.test(k) && (!c.cell || new RegExp(`\\b${c.cell}\\b`).test(v))));
        out.status = ok ? 'ok' : 'wrong';
        out.found = describe(ctxs[0]);
        out.doc = hits[0].path;
      }
      results.push(out);
      return;
    }
    const tags = {
      heading: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'], list: ['LI'], 'new-tab': ['A'],
    }[f.rule] || ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'A'];
    const hits = findText(f.key, tags);
    if (!hits.length) {
      // a heading or list item that is there, but as another element
      const other = f.rule === 'heading' || f.rule === 'list' ? findText(f.key) : [];
      out.status = other.length ? 'wrong' : 'not-found';
      if (other.length) {
        out.found = `a ${other[0].el.tagName.toLowerCase()}`;
        out.doc = other[0].path;
      }
      results.push(out);
      return;
    }
    const ctxs = hits.map((h) => contextOf(h.el, h.body));
    const ok = {
      'align-center': (c) => centred(c),
      'align-right': (c) => righted(c),
      indent: (c) => c.tags.includes('indent'),
      heading: () => true,
      list: () => true,
      'new-tab': (c, h) => /#_blank$/.test(h.el.getAttribute('href') || ''),
      'box-colour': (c) => c.styles.includes(BOX[f.detail] || f.detail)
        || label(c.box) === label(BOX[f.detail] || f.detail)
        || c.blockClasses.includes(`box-${label(BOX[f.detail] || f.detail)}`)
        || Object.entries(c.settings).some(([k, v]) => /^cell colours/.test(k)
          && v.split(',').some((part) => {
            const [n, col] = part.split(':').map((x) => x.trim());
            const want = label(BOX[f.detail] || f.detail);
            return (!c.cell || Number(n) === c.cell) && label(col) === want;
          })),
    }[f.rule];
    const good = hits.findIndex((h, i) => ok(ctxs[i], h));
    out.status = good >= 0 ? 'ok' : 'wrong';
    out.found = describe(ctxs[good >= 0 ? good : 0]);
    out.doc = hits[good >= 0 ? good : 0].path;
    results.push(out);
  });
  Object.values(parallel).forEach((cols) => { sourceBlank += Math.max(...Object.values(cols)); });
  if (sourceBlank) {
    results.push({
      rule: 'blank-line',
      key: `${sourceBlank} in the source`,
      status: blankLines >= sourceBlank ? 'ok' : 'wrong',
      found: `${blankLines} in the output`,
    });
  }
  return results;
}

/* ---------- run ---------- */

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const perRule = {};
const perPage = [];
const classPages = new Map();
const propPages = new Map();
let n = 0;
async function checkPage(report) {
  n += 1;
  const file = join(cache, 'pages', `${hash(report.url)}.html`);
  if (!existsSync(file)) return;
  const page = await context.newPage();
  try {
    const html = readFileSync(file, 'utf8');
    await page.route('**/*', (route) => {
      const req = route.request();
      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
      }
      const asset = join(cache, 'assets', hash(req.url()));
      if (req.resourceType() === 'stylesheet' && existsSync(asset) && existsSync(`${asset}.json`)) {
        const meta = JSON.parse(readFileSync(`${asset}.json`, 'utf8'));
        return route.fulfill({
          status: meta.status, contentType: meta.contentType, body: readFileSync(asset),
        });
      }
      return route.abort();
    });
    await page.goto(report.url, { waitUntil: 'load', timeout: 45000 });
    const src = await page.evaluate(sourceFeatures, { wantUnknown: unknown });
    const features = src.features
      .filter((f) => !onlyRules || onlyRules.some((r) => f.rule.startsWith(r)));
    // (one result per styled element; the same text styled twice counts twice)
    const results = await page.evaluate(outputCheck, { docs: outputDocs(report.path), features });
    results.forEach((r) => {
      const s = perRule[r.rule] || (perRule[r.rule] = {
        total: 0, ok: 0, wrong: 0, missing: 0, 'not-found': 0, pages: new Set(), examples: [],
      });
      s.total += 1;
      s[r.status] += 1;
      if (r.status === 'wrong' || r.status === 'missing') {
        s.pages.add(report.path);
        if (s.examples.length < 8) s.examples.push({ page: report.path, ...r });
      }
    });
    perPage.push({ path: report.path, url: report.url, results: results.filter((r) => r.status !== 'ok') });
    const note = (map, key) => map.set(key, (map.get(key) || new Set()).add(report.path));
    src.classes.forEach((c) => note(classPages, c));
    src.props.forEach((p) => note(propPages, p));
  } catch (e) {
    perPage.push({ path: report.path, url: report.url, error: String(e.message || e).split('\n')[0] });
  } finally {
    await page.close().catch(() => {});
  }
  if (n % 50 === 0) console.error(`${n} / ${pages.length}`);
}
await pages.reduce((chain, report) => chain.then(() => checkPage(report)), Promise.resolve());
await browser.close();

const failing = perPage.filter((p) => p.error || p.results.some((r) => r.status === 'wrong' || r.status === 'missing'));
console.log(`${pages.length} pages, ${failing.length} with styles missing in the output\n`);
console.log('rule              styled  ok      wrong   missing  not found (text)  pages');
Object.entries(perRule).sort().forEach(([rule, s]) => {
  console.log(`${rule.padEnd(17)} ${String(s.total).padEnd(7)} ${String(s.ok).padEnd(7)} ${String(s.wrong).padEnd(7)} ${String(s.missing).padEnd(8)} ${String(s['not-found']).padEnd(17)} ${s.pages.size}`);
});
Object.entries(perRule).sort().forEach(([rule, s]) => {
  if (!s.examples.length) return;
  console.log(`\n## ${rule}: ${s.wrong + s.missing} on ${s.pages.size} pages, e.g.`);
  s.examples.forEach((e) => console.log(`  /${e.page}: "${e.key}"${e.detail ? ` (${e.detail})` : ''} → ${e.status}${e.found ? `: ${e.found}` : ''}${e.doc && e.doc !== e.page ? ` [in ${e.doc}]` : ''}`));
});
perPage.filter((p) => p.error).forEach((p) => console.log(`ERROR /${p.path}: ${p.error}`));

if (unknown) {
  // classes the import rules never mention, minus the source's layout / form / script families
  const FAMILY = /^(mkto|col-|aem-|fontsize-|c-|u-|icon-|glyphicon|slick|cmp-|form-|alert-|has-|js-|xf-|cq-|parsys|ng-|hidden-|visible-|pull-|btn|tab|nav|carousel|modal|panel|accordion|video|vjs|s7|zoid|slide|slider|rgb)/;
  const named = (c) => new RegExp(`['"\`.\\s(\\[]${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`\\s,)\\]:]`).test(ruleSource);
  console.log('\n## classes no import rule names (pages, example)');
  [...classPages].filter(([c]) => !FAMILY.test(c) && !named(c))
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([c, set]) => console.log(`  ${String(set.size).padStart(4)} ${c.padEnd(32)} /${[...set][0]}`));
  console.log('\n## inline style properties in rich text (pages, example)');
  [...propPages].sort((a, b) => b[1].size - a[1].size)
    .forEach(([p, set]) => console.log(`  ${String(set.size).padStart(4)} ${p.padEnd(40)} /${[...set][0]}`));
}
if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({
    rules: Object.fromEntries(Object.entries(perRule)
      .map(([k, s]) => [k, { ...s, pages: [...s.pages] }])),
    pages: perPage,
  }, null, 2));
}
process.exit(failing.length ? 1 : 0);
