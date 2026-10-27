#!/usr/bin/env node
/*
 * migration-index — turns the AEM JSON exports in .migration/ into
 *   importer data (bundled), in tools/importer/data/:
 *     xf-index.js, cf-index.js, page-facts/<template>.js
 *   decision catalogs: tools/importer/data/catalog/*.json, cf-to-export.txt
 * Run after every re-export:  npm run build:migration-index
 * See AGENTS.md "Corp source exports".
 */
import { join } from 'path';
import { writeFileSync } from 'fs';
import {
  DATA, XF_DIR, loadPages, readJson, writeModule, writeJson, count, sortCounts,
} from './lib.js';
import buildXfIndex from './xf.js';
import buildPageFacts from './page-facts.js';
import buildCatalogs from './catalogs.js';

const log = (line) => process.stdout.write(`${line}\n`);
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const pages = loadPages();
const xf = buildXfIndex(pages);
xf.variations = Object.keys(xf.FRAGMENTS).map((path) => {
  const v = xf.manifest.fragments.flatMap((f) => f.variations).find((x) => x.path === path);
  return { path, json: readJson(join(XF_DIR, v.file)) };
});
const facts = buildPageFacts(pages);
const catalogs = buildCatalogs(pages, xf);
const { generated } = xf.manifest;

/* ---------- importer data ---------- */
const sizes = {};
sizes['xf-index.js'] = writeModule(join(DATA, 'xf-index.js'), [
  'Experience Fragment index from .migration/ (pages: author export; XFs: publish export).',
  `XF export generated ${generated}.`,
  'FRAGMENTS: XF variation path → EDS path, status, nested refs, DM assets, pages using it.',
  'PAGES: source page path → its XF references in authored order (kind fragment | slide).',
  'SKIPPED: referenced paths that are not importable XFs (redirect, not-an-xf, unpublished).',
], {
  FRAGMENTS: Object.fromEntries(Object.entries(xf.FRAGMENTS)
    .map(([path, f]) => [path, { ...f, pages: f.pages.length }])),
  PAGES: xf.PAGES,
  SKIPPED: xf.SKIPPED,
});

sizes['cf-index.js'] = writeModule(join(DATA, 'cf-index.js'), [
  'Content fragments (DAM) used inside XFs → EDS fragment path, fields (once exported) and every use.',
], { CONTENT_FRAGMENTS: xf.CONTENT_FRAGMENTS });

Object.entries(facts.byTemplate).forEach(([template, byPage]) => {
  sizes[`page-facts/${template}.js`] = writeModule(join(DATA, 'page-facts', `${template}.js`), [
    `Page facts of the "${template}" AEM template: metadata, anchors, disclaimer, forms, tabs,`,
    'card-list targets and images without alt text, per source page path.',
  ], { default: byPage });
});

/* ---------- catalogs ---------- */
const fragments = Object.entries(xf.FRAGMENTS);
const shared = fragments.filter(([, f]) => f.pages.length > 1);
const pageRefs = Object.values(xf.PAGES).flat();
const refPaths = (r) => [r.xf, r.desktop, r.mobile].filter(Boolean);
const statusOf = (p) => (xf.FRAGMENTS[p] ? 'published' : xf.SKIPPED[p].status);
const refList = pageRefs.flatMap(refPaths).map((p) => ({ xf: p, status: statusOf(p) }));
const xfPerTemplate = {};
Object.entries(xf.PAGES).forEach(([page, refs]) => {
  const { template } = catalogs.site.pages[page];
  const set = xfPerTemplate[template] || new Set();
  refs.flatMap(refPaths).filter((p) => xf.FRAGMENTS[p]).forEach((p) => set.add(p));
  xfPerTemplate[template] = set;
});
const statusCounts = {};
refList.forEach((r) => count(statusCounts, r.status));
const xfMissingAlt = [];
xf.variations.forEach(({ path, json }) => {
  const images = [];
  JSON.stringify(json, (k, v) => {
    if (v && typeof v === 'object' && v.srcFileRef && !String(v.alt || '').trim()) images.push(v.srcFileRef);
    return v;
  });
  if (images.length) xfMissingAlt.push({ xf: path, images });
});

const report = {
  generated,
  counts: {
    pages: pages.length,
    fragments: xf.manifest.fragments.length,
    variations: fragments.length,
    pageReferences: refList.length,
    uniquePageReferences: new Set(refList.map((r) => r.xf)).size,
    referenceStatus: sortCounts(statusCounts),
    slides: pageRefs.filter((r) => r.kind === 'slide').length,
    sharedVariations: shared.length,
    nestedReferences: fragments.reduce((s, [, f]) => s + f.refs.length, 0),
    contentFragments: Object.keys(xf.CONTENT_FRAGMENTS).length,
    contentFragmentsExported: Object.values(xf.CONTENT_FRAGMENTS).filter((c) => c.fields).length,
    redirects: (xf.manifest.redirects || []).length,
  },
  mostShared: shared.sort((a, b) => b[1].pages.length - a[1].pages.length).slice(0, 40)
    .map(([path, f]) => ({ xf: path, eds: f.eds, pages: f.pages.length })),
  skipped: xf.SKIPPED,
  nested: fragments.filter(([, f]) => f.refs.length || f.cfs.length)
    .map(([path, f]) => ({ xf: path, refs: f.refs, contentFragments: f.cfs })),
  xfPerTemplate: Object.fromEntries(Object.entries(xfPerTemplate)
    .map(([t, set]) => [t, { count: set.size, xfs: [...set].sort() }])
    .sort((a, b) => b[1].count - a[1].count)),
  missingAlt: { pages: facts.missingAlt, xfs: xfMissingAlt },
};
sizes['catalog/xf-report.json'] = writeJson(join(DATA, 'catalog/xf-report.json'), report);
sizes['catalog/typography.json'] = writeJson(join(DATA, 'catalog/typography.json'), catalogs.typography);
sizes['catalog/components.json'] = writeJson(join(DATA, 'catalog/components.json'), catalogs.components);
sizes['catalog/site.json'] = writeJson(join(DATA, 'catalog/site.json'), catalogs.site);

// XF import lists per template: the published XFs its pages reference inline (kind
// fragment, not hero / carousel slides), plus the XFs nested in those
const xfUrls = {};
Object.entries(xf.PAGES).forEach(([page, refs]) => {
  const { template } = catalogs.site.pages[page];
  const set = xfUrls[template] || new Set();
  const add = (path) => {
    if (!xf.FRAGMENTS[path] || set.has(path)) return;
    set.add(path);
    xf.FRAGMENTS[path].refs.forEach(add);
  };
  refs.filter((r) => r.kind === 'fragment').forEach((r) => add(r.xf));
  xfUrls[template] = set;
});
Object.entries(xfUrls).forEach(([template, set]) => {
  writeFileSync(join(DATA, `catalog/xf-urls-${template}.txt`), `${[...set].sort()
    .map((path) => `https://www.stryker.com${path}.html`).join('\n')}\n`);
});

// content-fragment import list: one URL per content fragment, the publish page of an XF
// that renders it plus ?cf=<path> (import-cf-fragments.js builds that fragment's document)
writeFileSync(join(DATA, 'catalog/cf-urls.txt'), `${Object.entries(xf.CONTENT_FRAGMENTS)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([cf, c]) => `https://www.stryker.com${c.uses[0].xf}.html?cf=${cf}`).join('\n')}\n`);

const cfList = Object.keys(xf.CONTENT_FRAGMENTS).sort();
writeFileSync(join(DATA, 'catalog/cf-to-export.txt'), [
  '# Content fragments used inside XFs. Export each as {path}/jcr:content.infinity.json',
  '# and save it at .migration/cf-content/<path without /content/dam/>.json, then rebuild.',
  ...cfList, '',
].join('\n'));

/* ---------- summary ---------- */
const c = report.counts;
log(`[migration-index] ${c.pages} pages, ${c.fragments} XFs / ${c.variations} variations, ${c.redirects} redirects`);
log(`  page XF references: ${c.pageReferences} (${c.uniquePageReferences} unique), ${c.slides} slides; status ${JSON.stringify(c.referenceStatus)}`);
log(`  shared variations (2+ pages): ${c.sharedVariations}; nested refs: ${c.nestedReferences}`);
log(`  content fragments: ${c.contentFragments} (${c.contentFragmentsExported} exported)`);
log(`  typography combinations: ${catalogs.typography.length}; component types: ${Object.keys(catalogs.components).length}`);
log(`  pages with images missing alt: ${facts.missingAlt.length}; XF variations: ${xfMissingAlt.length}`);
Object.entries(sizes).forEach(([file, size]) => log(`  ${file}: ${kb(size)}`));
