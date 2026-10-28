#!/usr/bin/env node
/*
 * Property table: every styling / layout property authors set on www.stryker.com components
 * (page exports + XF exports in .migration/), with its values, how often each is used, on
 * which templates, and live example pages per value; merged with the decision per property
 * (tools/importer/decisions/property-map.json: current importer handling + proposal).
 *
 * Writes tools/importer/data/catalog/properties.json (all properties, long tail included)
 * and tools/importer/decisions/property-table.md (the review table).
 * Run: node tools/importer/migration-index/property-table.js
 */
import { existsSync } from 'fs';
import { join } from 'path';
import {
  REPO, DATA, XF_DIR, loadPages, readJson, writeJson, forEachNode, isComponent, shortType,
  templateName, count, sortCounts,
} from './lib.js';
import buildXfIndex from './xf.js';

const SOURCE = 'https://www.stryker.com';
const DECISIONS = join(REPO, 'tools/importer/decisions/property-map.json');
const TABLE = join(REPO, 'tools/importer/decisions/property-table.md');
// live status of the example pages (check-examples.js); a value links its first live example
const STATUS = join(DATA, 'catalog/example-status.json');
const EXAMPLES = 3;
const VALUES = 12;

// bookkeeping (who / when / how AEM stores it): not authored styling
const BOOKKEEPING = /^(jcr:|cq:|sling:|textIsRich$|accPosId$|tabPosId$|edsExperienceFragmentPath|edsFragment)/;
// content (text, links, references, ids): handled by the content rules, not styling
const CONTENT = /(text|title|Title|alt|description|Description|label|Label|caption|heading|Heading|subtitle|message|name$|Name$|link|Link|url|Url|URL|path|Path|ref$|Ref$|id$|Id$|ID$|date|Date|tags|email|phone|address|assetID|fileName|srcFile|query|search|formId|line\d)/;
const isContentValue = (v) => v.length > 60 || /^(\/content\/|https?:|mailto:|tel:)/.test(v) || /<[a-z]/i.test(v);

const live = (page) => `${SOURCE}${page.replace(/\/index$/, '/index')}.html`;

function collect() {
  const pages = loadPages();
  const xf = buildXfIndex(pages);
  const props = {};
  const add = (node, where) => {
    const type = shortType(node['sling:resourceType']);
    Object.entries(node).forEach(([k, v]) => {
      if (BOOKKEEPING.test(k) || (v && typeof v === 'object' && !Array.isArray(v))) return;
      const value = Array.isArray(v) ? v.join(',') : String(v);
      const key = `${type}.${k}`;
      const entry = props[key] || {
        component: type,
        property: k,
        count: 0,
        pages: new Set(),
        templates: {},
        values: {},
        content: 0,
      };
      entry.count += 1;
      where.pages.forEach((p) => entry.pages.add(p));
      count(entry.templates, where.template);
      if (isContentValue(value)) entry.content += 1;
      const val = entry.values[value.length <= 60 ? value : '(long)'] || { count: 0, examples: [] };
      val.count += 1;
      where.pages.forEach((p) => {
        if (val.examples.length < EXAMPLES && !val.examples.includes(p)) val.examples.push(p);
      });
      entry.values[value.length <= 60 ? value : '(long)'] = val;
      props[key] = entry;
    });
  };
  pages.forEach(({ path, json }) => {
    const where = { pages: [path], template: templateName(json) };
    forEachNode(json, (node) => { if (isComponent(node)) add(node, where); });
  });
  // XF content: its examples are the pages that show the XF
  Object.entries(xf.FRAGMENTS).forEach(([path, f]) => {
    const v = xf.manifest.fragments.flatMap((fr) => fr.variations).find((x) => x.path === path);
    if (!v || !existsSync(join(XF_DIR, v.file))) return;
    const json = readJson(join(XF_DIR, v.file));
    const where = { pages: f.pages.slice(0, EXAMPLES), template: 'xf' };
    forEachNode(json, (node) => { if (isComponent(node)) add(node, where); });
  });
  return { props, generated: xf.manifest.generated, pageCount: pages.length };
}

function kind(entry) {
  if (CONTENT.test(entry.property) || entry.content > entry.count / 2) return 'content';
  return 'styling';
}

function build() {
  const { props, generated, pageCount } = collect();
  const decisions = existsSync(DECISIONS) ? readJson(DECISIONS).properties || {} : {};
  const rows = Object.entries(props).map(([key, e]) => ({
    key,
    component: e.component,
    property: e.property,
    kind: kind(e),
    count: e.count,
    pages: e.pages.size,
    templates: sortCounts(e.templates),
    distinct: Object.keys(e.values).length,
    values: Object.entries(e.values).sort((a, b) => b[1].count - a[1].count)
      .map(([value, v]) => ({ value, count: v.count, examples: v.examples.map(live) })),
    decision: decisions[key] || null,
  })).sort((a, b) => b.count - a.count);
  writeJson(join(DATA, 'catalog/properties.json'), { generated, pages: pageCount, properties: rows });
  return { rows, generated, pageCount };
}

/* ---------- review table ---------- */

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const status = existsSync(STATUS) ? readJson(STATUS) : {};
const liveExample = (v) => v.examples.find((u) => status[u] === 200 || !(u in status));
const link = (v) => {
  const label = esc(v.value === '' ? '(empty)' : v.value);
  const url = liveExample(v);
  return url ? `[${label}](${url})` : `${label} (no live example)`;
};

function table({ rows, generated, pageCount }) {
  const styling = rows.filter((r) => r.kind === 'styling' && r.count >= 20);
  const tail = rows.filter((r) => r.kind === 'styling' && r.count < 20);
  const state = (r) => (r.decision ? r.decision.status || 'proposed' : 'to decide');
  const lines = [
    '# Property table: authored styling and layout on www.stryker.com',
    '',
    `Generated by \`node tools/importer/migration-index/property-table.js\` from the AEM exports (${pageCount} pages + published XFs, export ${generated}).`,
    'Decisions live in `tools/importer/decisions/property-map.json`; edit them there (or answer in the chat) and re-run.',
    '',
    'Each value links to a live page that uses it (up to three per value in `data/catalog/properties.json`).',
    'Values that come from XF content link to pages that show the XF. The exports come from the author',
    'instance, so a few example pages may not be live.',
    '',
    '**Handling:**',
    '- **mapped**: the importer carries it (the column says how)',
    '- **partly**: some values or contexts only',
    '- **not mapped**: lost on import',
    '- **no effect**: renders nothing (e.g. a transparent background)',
    '- **content**: handled by the content rules',
    '',
    `${styling.length} styling / layout properties are used 20+ times (${tail.length} rarer ones are listed at the end).`,
    '',
    '| # | Component · property | Uses (pages) | Values (uses) → example page | Handling today | Proposal | Status |',
    '|---|---|---|---|---|---|---|',
  ];
  styling.forEach((r, i) => {
    const shown = r.values.slice(0, VALUES).map((v) => `${link(v)} (${v.count})`).join(', ');
    const more = r.distinct > VALUES ? `, … ${r.distinct - VALUES} more` : '';
    const d = r.decision || {};
    lines.push(`| ${i + 1} | \`${r.component}\` · **${r.property}** | ${r.count} (${r.pages}) | ${shown}${more} | ${esc(d.handling ? `${d.handling}${d.how ? `: ${d.how}` : ''}` : '–')} | ${esc(d.proposal || '–')} | ${state(r)} |`);
  });
  lines.push('', '## Rarer properties (fewer than 20 uses)', '', '| Component · property | Uses | Values → example page |', '|---|---|---|');
  tail.forEach((r) => {
    const shown = r.values.slice(0, 4).map((v) => `${link(v)} (${v.count})`).join(', ');
    lines.push(`| \`${r.component}\` · ${r.property} | ${r.count} | ${shown}${r.distinct > 4 ? ', …' : ''} |`);
  });
  return `${lines.join('\n')}\n`;
}

const result = build();
const { writeFileSync } = await import('fs');
writeFileSync(TABLE, table(result));
process.stdout.write(`properties: ${result.rows.length} (styling ${result.rows.filter((r) => r.kind === 'styling').length}); table: ${TABLE}\n`);
