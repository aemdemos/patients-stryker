// page path (EDS or AEM names) → { aem, eds } from the export file names (each segment matched
// by its EDS form: lowercase, non-alphanumerics → '-'), and the XF URLs the page uses
import { readdirSync } from 'fs';
import { pageXfRefs, xfInfo } from '../../../tools/importer/xf-fragment-path.js';

export const edsName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const root = new URL('../../xf-mapping/', import.meta.url);

export function resolvePage(path) {
  const segments = path.replace(/^\/+/, '').replace(/\.html$/, '').split('/');
  let dir = root;
  const aem = [];
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    const entries = readdirSync(dir, { withFileTypes: true })
      .filter((d) => (last ? d.isFile() && d.name.endsWith('.json') : d.isDirectory()));
    const name = (n) => (last ? n.replace(/\.json$/, '') : n);
    const hit = entries.find((d) => name(d.name) === seg) || entries.find((d) => edsName(name(d.name)) === edsName(seg));
    if (!hit) throw new Error(`no export for ${seg} in ${dir.pathname}`);
    aem.push(name(hit.name));
    if (!last) dir = new URL(`${hit.name}/`, dir);
  });
  return { aem: `/${aem.join('/')}`, eds: `/${aem.map(edsName).join('/')}` };
}

/** The XF variation paths a page uses (fragments, slides desktop + mobile, nested XFs). */
export function pageXfs({ aem, eds }) {
  const xfs = new Set();
  const walk = (x) => {
    if (xfs.has(x)) return;
    xfs.add(x);
    ((xfInfo(x) || {}).refs || []).forEach(walk);
  };
  [aem, eds].forEach((p) => pageXfRefs(p).forEach((r) => {
    const targets = r.kind === 'slide' ? [r.desktop, r.mobile] : [r];
    targets.forEach((t) => { if (t && t.eds) walk(t.xf); });
  }));
  return [...xfs];
}
