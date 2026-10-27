#!/usr/bin/env node
/*
 * Authored-text coverage check: for each imported page, every text authored in AEM (page
 * export in .migration/xf-mapping) that is visible on the source must appear in the import
 * output. Catches content an importer silently drops (e.g. a standalone image's title).
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
  PAGES_DIR, walk, forEachNode, isComponent, pageExportFile, readJson,
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
async function liveText(exportFile) {
  const url = `https://www.stryker.com/${relative(PAGES_DIR, exportFile).replace(/\.json$/, '.html')}`;
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
  const exportFile = pageExportFile(page);
  if (!exportFile || !existsSync(file)) return `skip     ${page} (${exportFile ? 'no output' : 'no AEM export'})`;
  const html = readFileSync(file, 'utf8');
  // the source answered with its 404 page (wrong source URL): nothing of the page was imported
  if (/<div>og:title<\/div><div>404<\/div>|<div>Title<\/div><div>404<\/div>/i.test(html)) {
    failed += 1;
    return `404      ${page} (the import fetched the source's 404 page — check the source URL)`;
  }
  const output = norm(html).replace(/\[\[[a-z-]+\]|\]/g, ' ').replace(/\s+/g, ' ');
  const texts = authoredTexts(readJson(exportFile));
  // a snippet counts as present when its first 60 characters appear in the output
  const absent = texts.filter((t) => !output.includes(core(t.text).slice(0, 60)));
  const live = absent.length ? await liveText(exportFile) : null;
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
