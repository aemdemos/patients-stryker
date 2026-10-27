#!/usr/bin/env node
/*
 * Authored-text coverage check: for each imported page, every text authored in AEM (page
 * export in .migration/xf-mapping; for fragment documents under /us/en/fragments/ the XF
 * export in .migration/xf-content) that is visible on the source must appear in the import
 * output. XF content is checked in the fragment documents, not on the pages using them.
 * Catches content an importer silently drops (e.g. a standalone image's title).
 *
 * Page exports come from the AEM author instance, so they may hold unpublished text. Every
 * text missing from the output is looked up on the live source page: text that is not on
 * the live page either is reported as "author-only" and does not fail the check.
 *
 * Usage: node tools/importer/migration-index/check-coverage.js <output content dir> [page path …]
 *   <output content dir>  where the import wrote the pages (e.g. content, or a pilot
 *                         WORKSPACE_PATH/content); every .plain.html under it is checked when
 *                         no page paths are given
 * Exit code 1 when any page misses authored text.
 */
import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import {
  PAGES_DIR, XF_DIR, CF_DIR, walk, forEachNode, isComponent, pageExportFile, readJson,
} from './lib.js';

// component properties that hold visible authored text, per component (rich text: HTML)
const TEXT_PROPS = {
  'stryker/components/content/text': ['text'],
  'stryker/components/content/standaloneimage': ['title', 'description'],
  'stryker/components/content/section-title': ['title'],
  'stryker/components/content/title': ['title', 'description'],
  'stryker/components/content/curatedcta': ['CTATitle'],
  'stryker/components/content/h1-title': ['title'],
  'stryker/components/content/largeheadline': ['line1', 'line2'],
  'stryker/components/content/standalonevideo': ['subtitle', 'description'],
  'stryker/components/content/accordion': ['accTitle'],
  'stryker/components/content/table': ['title', 'description', 'tableData'],
  'stryker/components/structure/disclaimer': ['disclaimer'],
};
// components whose own text is not page content (rendered from data, or skipped by decision)
const SKIP_UNDER = /(experienceFragment|contentFragment|customizable|carouselslide|tagcrumb|pageshortdescription|contactbutton|secondarycta|jumpbarnav)$/;

const norm = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/_{3,}/g, ' ')
  .replace(/[►▶»›•·]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

// list numbering and footnote marks that the import turns into list items / superscripts
const core = (t) => t.replace(/^(\*+|\d+\s*[:.)])\s*/, '').trim();

/** Authored, visible text snippets of one page export. */
function authoredTexts(json) {
  const out = [];
  forEachNode(json, (node, key, ctx) => {
    if (!isComponent(node)) return;
    const type = node['sling:resourceType'];
    const props = TEXT_PROPS[type];
    if (!props) return;
    if (node.hideComponent === 'true' || node.hideSectionTitleComp === 'true') return;
    if (ctx.parents.some((p) => SKIP_UNDER.test(p['sling:resourceType']))) return;
    props.forEach((prop) => {
      if (typeof node[prop] !== 'string') return;
      // rich text: check each block (paragraph, heading, list item) on its own
      const blocks = node[prop].split(/<\/(?:p|h[1-6]|li|div|td)>/i).map(norm).filter((t) => t.length > 2);
      blocks.forEach((t) => out.push({
        text: t, component: key, type: type.split('/').pop(), area: ctx.area,
      }));
    });
  });
  return out;
}

const [dir, ...only] = process.argv.slice(2);
if (!dir) {
  process.stderr.write('usage: check-coverage.js <output content dir> [page path …]\n');
  process.exit(2);
}
const files = only.length
  ? only.map((p) => join(dir, `${p.replace(/\.html$/, '')}.plain.html`))
  : walk(dir).filter((f) => f.endsWith('.plain.html'));

/** The live source page's visible text (normalised), or null when it cannot be fetched. */
// fragment documents (/us/en/fragments/…) → their XF variation export and publish URL
const manifest = readJson(join(XF_DIR, '_manifest.json'));
const XF_BY_EDS = new Map(manifest.fragments.flatMap((f) => f.variations)
  .map((v) => [v.edsPath, { file: join(XF_DIR, v.file), url: `https://www.stryker.com${v.path}.html` }]));

/** Every non-empty field of a content-fragment export (all are kept: card or Metadata). */
function cfTexts(json) {
  const master = (json['jcr:content'] || json)?.data?.master || {};
  return Object.entries(master).filter(([k, v]) => !k.startsWith('jcr:') && !k.includes('@') && typeof v === 'string')
    .flatMap(([k, v]) => v.split(/<\/(?:p|li|div)>/i).map(norm).filter((t) => t.length > 2)
      .map((t) => ({ text: t, component: k, type: 'contentfragment' })));
}

/** The AEM export and live URL of an output document (page or fragment), or null. */
function sourceOf(page) {
  const cf = page.match(/^\/us\/en\/fragments\/content-fragments\/(.+)$/);
  if (cf) {
    // the export file names are the DAM names; the EDS path is the cleaned-up form
    const file = walk(join(CF_DIR, 'stryker/content-fragments'))
      .find((f) => f.endsWith('.json') && f.slice(join(CF_DIR, 'stryker/content-fragments').length + 1, -5)
        .toLowerCase().replace(/[^a-z0-9/]+/g, '-').replace(/-+(?=\/|$)|(?<=\/)-+/g, '') === cf[1]);
    return file ? { file, url: null, cf: true } : null;
  }
  if (page.startsWith('/us/en/fragments/')) return XF_BY_EDS.get(page) || null;
  const file = pageExportFile(page);
  return file && { file, url: `https://www.stryker.com/${relative(PAGES_DIR, file).replace(/\.json$/, '.html')}` };
}

async function liveText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = (await res.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
    return norm(html);
  } catch {
    return null;
  }
}

let failed = 0;
const results = files.map(async (file) => {
  const page = `/${relative(dir, file).replace(/\.plain\.html$/, '')}`;
  const source = sourceOf(page);
  if (!source || !existsSync(file)) return `skip     ${page} (${source ? 'no output' : 'no AEM export'})`;
  const html = readFileSync(file, 'utf8');
  // the source answered with its 404 page (wrong source URL): nothing of the page was imported
  if (/<div>og:title<\/div><div>404<\/div>|<div>Title<\/div><div>404<\/div>/i.test(html)) {
    failed += 1;
    return `404      ${page} (the import fetched the source's 404 page — check the source URL)`;
  }
  const output = norm(html).replace(/\[\[[a-z-]+\]|\]/g, ' ').replace(/\s+/g, ' ');
  const texts = source.cf ? cfTexts(readJson(source.file)) : authoredTexts(readJson(source.file));
  // a snippet counts as present when its first 60 characters appear in the output
  const absent = texts.filter((t) => !output.includes(core(t.text).slice(0, 60)));
  const live = absent.length && source.url ? await liveText(source.url) : null;
  const onLive = (t) => live === null || live.includes(core(t.text).slice(0, 60));
  const authorOnly = absent.filter((t) => !onLive(t));
  const missing = absent.filter((t) => !authorOnly.includes(t));
  if (missing.length) failed += 1;
  const lines = [`${missing.length ? 'MISSING' : 'ok     '}  ${page} (${texts.length - missing.length}/${texts.length})`];
  missing.forEach((m) => lines.push(`           - [${m.type} ${m.component}] "${m.text.slice(0, 90)}"`));
  authorOnly.forEach((m) => lines.push(`           ~ author-only, not on the live page: [${m.type}] "${m.text.slice(0, 70)}"`));
  return lines.join('\n');
});
Promise.all(results).then((lines) => {
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exit(failed ? 1 : 0);
});
