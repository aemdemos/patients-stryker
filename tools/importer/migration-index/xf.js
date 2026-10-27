/*
 * XF and content-fragment index: which fragments exist, where each one goes in EDS,
 * and which fragments every page uses, in authored order.
 */
import { join } from 'path';
import { existsSync } from 'fs';
import {
  XF_ROOT, CF_ROOT, xfToFragmentPath, cfToFragmentPath,
} from '../xf-path-rule.js';
import {
  XF_DIR, CF_DIR, REF_KEYS, SLIDE_TYPE, readJson, forEachNode, isComponent, shortType,
  templateName, asset, cleanText,
} from './lib.js';

const CF_TYPE = 'stryker/components/content/contentFragment';

/** The nested XF / content-fragment references and DM image assets of one XF variation. */
function scanVariation(json) {
  const refs = [];
  const cfs = [];
  const assets = [];
  const cfUses = [];
  forEachNode(json, (node) => {
    REF_KEYS.forEach((k) => {
      const v = node[k];
      if (typeof v !== 'string') return;
      if (v.startsWith(XF_ROOT)) refs.push(v);
      else if (v.startsWith(CF_ROOT)) {
        cfs.push(v);
        if (node['sling:resourceType'] === CF_TYPE) {
          cfUses.push({
            cf: v,
            elementNames: node.elementNames || null,
            displayMode: node.displayMode || null,
            variationName: node.variationName || null,
            text: cleanText(node.text, 300),
          });
        }
      }
    });
    const image = node.fileReference || node.srcFileRef;
    if (isComponent(node) && typeof image === 'string' && image.startsWith('/content/dam/')) assets.push(asset(image));
  });
  return {
    refs: [...new Set(refs)],
    cfs: [...new Set(cfs)],
    assets: [...new Set(assets)].slice(0, 5),
    cfUses,
  };
}

/** The XF-reference status of a path, given the manifest. */
function statusOf(path, published, redirects, notXf) {
  if (published.has(path)) return 'published';
  if (redirects.has(path)) return 'redirect';
  if (notXf.has(path)) return 'not-an-xf';
  return path.startsWith(XF_ROOT) ? 'unpublished' : 'not-an-xf';
}

export default function buildXfIndex(pages) {
  const manifest = readJson(join(XF_DIR, '_manifest.json'));
  const redirects = new Set((manifest.redirects || []).map((r) => r.from));
  const notXf = new Set((manifest.unresolvedReferences || [])
    .filter((u) => u.status === 'not_an_xf').map((u) => u.ref));

  // FRAGMENTS: every exported variation
  const FRAGMENTS = {};
  const cfUses = [];
  manifest.fragments.forEach((xf) => {
    const siblings = xf.variations.map((v) => v.name);
    xf.variations.forEach((v) => {
      const file = join(XF_DIR, v.file);
      const scan = existsSync(file) ? scanVariation(readJson(file)) : {
        refs: [], cfs: [], assets: [], cfUses: [],
      };
      scan.cfUses.forEach((u) => cfUses.push({ ...u, xf: v.path }));
      FRAGMENTS[v.path] = {
        eds: v.edsPath || xfToFragmentPath(v.path),
        xf: xf.path,
        title: v.title || xf.title || null,
        master: !!v.master,
        siblings,
        status: 'published',
        refs: scan.refs,
        cfs: scan.cfs,
        assets: scan.assets,
        pages: [],
        parents: [],
      };
    });
  });
  const published = new Set(Object.keys(FRAGMENTS));
  const status = (p) => statusOf(p, published, redirects, notXf);

  Object.entries(FRAGMENTS).forEach(([path, f]) => f.refs.forEach((ref) => {
    if (FRAGMENTS[ref]) FRAGMENTS[ref].parents.push(path);
  }));

  // PAGES: ordered XF references of every page
  const PAGES = {};
  const SKIPPED = {};
  pages.forEach(({ path, json }) => {
    const list = [];
    forEachNode(json, (node, key, ctx) => {
      if (!isComponent(node)) return;
      const type = node['sling:resourceType'];
      const own = REF_KEYS.filter((k) => typeof node[k] === 'string' && node[k].startsWith(XF_ROOT));
      if (!own.length) return;
      // compact on purpose (bundled): EDS path and status are looked up in FRAGMENTS / SKIPPED
      let entry;
      if (type === SLIDE_TYPE) {
        entry = { kind: 'slide' };
        if (node.experienceFragmentPath) entry.desktop = node.experienceFragmentPath;
        if (node.experienceFragmentPathMobile) entry.mobile = node.experienceFragmentPathMobile;
      } else {
        entry = { kind: 'fragment', xf: node.fragmentPath || node.fragmentVariationPath || node[own[0]] };
        if (node.text) entry.text = cleanText(node.text, 100);
      }
      entry.area = ctx.area;
      entry.type = shortType(type);
      [entry.xf, entry.desktop, entry.mobile].filter(Boolean).forEach((p) => {
        if (FRAGMENTS[p]) FRAGMENTS[p].pages.push(path);
        else SKIPPED[p] = { status: status(p), pages: [...(SKIPPED[p]?.pages || []), path] };
      });
      list.push(entry);
    });
    if (list.length) PAGES[path] = list;
  });
  Object.values(FRAGMENTS).forEach((f) => { f.pages = [...new Set(f.pages)]; });

  // content fragments: one fragment document each, with every use and its field set
  const CONTENT_FRAGMENTS = {};
  cfUses.forEach((u) => {
    const entry = CONTENT_FRAGMENTS[u.cf] || {
      eds: cfToFragmentPath(u.cf), fields: null, title: null, uses: [],
    };
    const { cf, ...use } = u;
    entry.uses.push(use);
    CONTENT_FRAGMENTS[u.cf] = entry;
  });
  // export of {cf}/jcr:content.infinity.json, saved at
  // .migration/cf-content/<path without /content/dam/>.json
  Object.entries(CONTENT_FRAGMENTS).forEach(([cf, entry]) => {
    const file = join(CF_DIR, `${cf.slice('/content/dam/'.length)}.json`);
    if (!existsSync(file)) return;
    // the asset export ({cf}.infinity.json) wraps the content in jcr:content; accept both
    const json = readJson(file);
    const content = json['jcr:content'] || json;
    const master = content?.data?.master || {};
    entry.title = content['jcr:title'] || null;
    entry.model = content?.data?.['cq:model'] || null;
    entry.fields = Object.fromEntries(Object.entries(master)
      .filter(([k]) => !k.startsWith('jcr:') && !k.startsWith('cq:') && !k.includes('@')));
  });

  return {
    FRAGMENTS, PAGES, SKIPPED, CONTENT_FRAGMENTS, manifest, templateOf: templateName,
  };
}
