// source URL (export file name) and XF URLs (fragment + slide + nested) of a page.
// The page path may use the EDS names or the AEM names: each folder and the file are matched
// against the export names by their EDS form (lowercase, non-alphanumerics → '-').
// Prints the EDS path of the page (used for the preview copy).
import { readdirSync, writeFileSync } from 'fs';
import { pageXfRefs, xfInfo } from '../../../tools/importer/xf-fragment-path.js';

const edsName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const root = new URL('../../xf-mapping/', import.meta.url);
const segments = process.argv[2].replace(/^\/+/, '').replace(/\.html$/, '').split('/');
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
const aemPath = `/${aem.join('/')}`;
const edsPath = `/${aem.map(edsName).join('/')}`;

const xfs = new Set();
const walk = (x) => {
  if (xfs.has(x)) return;
  xfs.add(x);
  ((xfInfo(x) || {}).refs || []).forEach(walk);
};
[aemPath, edsPath].forEach((p) => pageXfRefs(p).forEach((r) => {
  const targets = r.kind === 'slide' ? [r.desktop, r.mobile] : [r];
  targets.forEach((t) => { if (t && t.eds) walk(t.xf); });
}));
writeFileSync('/tmp/pilotPD/urls.txt', `https://www.stryker.com${aemPath}.html\n`);
writeFileSync('/tmp/pilotPD/xf-urls.txt', xfs.size ? `${[...xfs].map((x) => `https://www.stryker.com${x}.html`).join('\n')}\n` : '');
console.error(`${aemPath}: ${xfs.size} XFs`);
console.log(edsPath);
