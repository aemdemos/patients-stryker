/*
 * Decision catalogs built from the exports (committed, not bundled):
 *  - typography: every formatting combination used in authored rich text
 *  - components: every component type with its properties, values and layout settings
 *  - site: every page with its template, component makeup and migration state
 */
import { existsSync } from 'fs';
import { join } from 'path';
import {
  REPO, forEachNode, isComponent, shortType, templateName, leafRuns, count, sortCounts,
  CONTAINER_TYPES, readJson,
} from './lib.js';

const SKIP_PROPS = /^(jcr:|cq:lastModified|cq:lastReplicat|sling:resourceType$|text$|textIsRich$)/;
const RICH_TEXT_TYPES = new Set(['stryker/components/content/text', 'stryker/components/structure/disclaimer']);

/* ---------- typography ---------- */

function addRuns(catalog, html, where) {
  leafRuns(html).forEach((run) => {
    const key = [run.block, run.classes.join(' ') || '-', run.color || '-', run.inline.join(',') || '-'].join(' | ');
    const entry = catalog[key] || {
      block: run.block,
      classes: run.classes,
      color: run.color || null,
      inline: run.inline,
      runs: 0,
      chars: 0,
      pages: new Set(),
      templates: {},
      examples: [],
    };
    entry.runs += 1;
    entry.chars += run.text.length;
    entry.pages.add(where.page);
    count(entry.templates, where.template);
    if (entry.examples.length < 3 && !entry.examples.some((e) => e.page === where.page)) {
      entry.examples.push({ page: where.page, text: run.text.slice(0, 80) });
    }
    catalog[key] = entry;
  });
}

function richTexts(json, visit) {
  forEachNode(json, (node) => {
    if (!isComponent(node)) return;
    const type = node['sling:resourceType'];
    if (RICH_TEXT_TYPES.has(type) || node.textIsRich === 'true') {
      [node.text, node.disclaimer].filter((t) => typeof t === 'string').forEach(visit);
    }
  });
}

/* ---------- components ---------- */

function responsivePattern(resp) {
  return Object.entries(resp).filter(([k]) => !k.startsWith('jcr:'))
    .map(([bp, v]) => `${bp}:${['width', 'offset', 'behavior'].filter((k) => v[k] !== undefined).map((k) => `${k[0]}${v[k]}`).join('/')}`)
    .sort()
    .join(' ');
}

const hasComponentChild = (node) => Object.values(node).some((v) => isComponent(v)
  && (!CONTAINER_TYPES.test(v['sling:resourceType']) || hasComponentChild(v)));

function addComponents(catalog, json, where) {
  forEachNode(json, (node, key, ctx) => {
    if (!isComponent(node)) return;
    const type = shortType(node['sling:resourceType']);
    const entry = catalog[type] || {
      count: 0,
      templates: {},
      props: {},
      responsive: {},
      hidden: 0,
      empty: 0,
      inXf: 0,
      areas: {},
      parents: {},
      examples: [],
    };
    entry.count += 1;
    count(entry.templates, where.template);
    count(entry.areas, ctx.area);
    if (where.xf) entry.inXf += 1;
    const parent = ctx.parents[ctx.parents.length - 1];
    if (parent) count(entry.parents, shortType(parent['sling:resourceType']));
    if (node.hideComponent === 'true' || node.hideSectionTitleComp === 'true') entry.hidden += 1;
    if (CONTAINER_TYPES.test(node['sling:resourceType']) && !hasComponentChild(node)) entry.empty += 1;
    if (node['cq:responsive']) count(entry.responsive, responsivePattern(node['cq:responsive']));
    Object.entries(node).forEach(([k, v]) => {
      if (SKIP_PROPS.test(k) || (v && typeof v === 'object' && !Array.isArray(v))) return;
      const prop = entry.props[k] || { count: 0, values: {} };
      prop.count += 1;
      const value = Array.isArray(v) ? v.join(',') : String(v);
      count(prop.values, value.length <= 60 ? value : '(long)');
      entry.props[k] = prop;
    });
    if (entry.examples.length < 3 && !entry.examples.includes(where.page)) {
      entry.examples.push(where.page);
    }
    catalog[type] = entry;
  });
}

function finishComponents(catalog) {
  return Object.fromEntries(Object.entries(catalog).sort((a, b) => b[1].count - a[1].count)
    .map(([type, e]) => [type, {
      ...e,
      templates: sortCounts(e.templates),
      areas: sortCounts(e.areas),
      parents: sortCounts(e.parents),
      responsive: sortCounts(e.responsive),
      props: Object.fromEntries(Object.entries(e.props).sort((a, b) => b[1].count - a[1].count)
        .map(([k, p]) => [k, {
          count: p.count,
          values: Object.fromEntries(Object.entries(sortCounts(p.values)).slice(0, 12)),
        }])),
    }]));
}

/* ---------- site ---------- */

function pageComponents(json) {
  const types = new Set();
  forEachNode(json, (node) => {
    if (!isComponent(node)) return;
    const type = node['sling:resourceType'];
    if (/\/parsys$|\/responsivegrid$|\/columncontrol\/col\d+$/.test(type) || /\/col\d+$/.test(type)) return;
    types.add(shortType(type));
  });
  return [...types].sort();
}

function importTemplates() {
  const file = join(REPO, 'tools/importer/page-templates.json');
  const map = {};
  if (!existsSync(file)) return map;
  (readJson(file).templates || []).forEach((t) => (t.urls || []).forEach((u) => {
    try {
      map[new URL(u).pathname.replace(/\.html$/, '')] = t.name;
    } catch { /* not a URL */ }
  }));
  return map;
}

export default function buildCatalogs(pages, xf) {
  const typography = {};
  const components = {};
  const templateOf = new Map(pages.map((p) => [p.path, templateName(p.json)]));
  const usedBy = {};
  Object.entries(xf.FRAGMENTS).forEach(([path, f]) => {
    const viaParents = f.parents.flatMap((p) => xf.FRAGMENTS[p]?.pages || []);
    usedBy[path] = [...new Set([...f.pages, ...viaParents].map((p) => templateOf.get(p)))].sort();
  });

  pages.forEach(({ path, json }) => {
    const where = { page: path, template: templateName(json) };
    richTexts(json, (html) => addRuns(typography, html, where));
    addComponents(components, json, where);
  });
  xf.variations.forEach(({ path, json }) => {
    const where = { page: path, template: `xf:${(usedBy[path] || []).join('+') || 'unused'}`, xf: true };
    richTexts(json, (html) => addRuns(typography, html, where));
    addComponents(components, json, where);
  });

  const typo = Object.values(typography).sort((a, b) => b.chars - a.chars).map((e) => ({
    ...e, pages: e.pages.size, templates: sortCounts(e.templates),
  }));
  const totalChars = typo.reduce((s, e) => s + e.chars, 0);
  let running = 0;
  typo.forEach((e) => {
    running += e.chars;
    e.cumulativeShare = Math.round((running / totalChars) * 1000) / 10;
  });

  // site
  const templates = importTemplates();
  const site = { pages: {}, templates: {} };
  pages.forEach(({ path, json }) => {
    const template = templateName(json);
    const types = pageComponents(json);
    const refs = xf.PAGES[path] || [];
    const contentFile = join(REPO, 'content', `${path}.plain.html`);
    site.pages[path] = {
      template,
      title: json['jcr:title'] || null,
      components: types,
      fragments: refs.filter((r) => r.kind === 'fragment').length,
      slides: refs.filter((r) => r.kind === 'slide').length,
      migrated: existsSync(contentFile) || existsSync(join(REPO, 'content', path, 'index.plain.html')),
      importTemplate: templates[path] || null,
    };
    const t = site.templates[template] || { pages: 0, migrated: 0, groups: {} };
    t.pages += 1;
    if (site.pages[path].migrated) t.migrated += 1;
    const signature = types.join(' ');
    const group = t.groups[signature] || { count: 0, pages: [] };
    group.count += 1;
    if (group.pages.length < 5) group.pages.push(path);
    t.groups[signature] = group;
    site.templates[template] = t;
  });
  Object.values(site.templates).forEach((t) => {
    t.groups = Object.entries(t.groups).sort((a, b) => b[1].count - a[1].count)
      .map(([signature, g]) => ({ ...g, components: signature.split(' ').filter(Boolean) }));
  });
  site.templates = Object.fromEntries(Object.entries(site.templates)
    .sort((a, b) => b[1].pages - a[1].pages));

  return { typography: typo, components: finishComponents(components), site };
}
