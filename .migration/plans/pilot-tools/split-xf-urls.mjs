// A run's XF URLs → the template's own XFs (only that template shows them: its fragment
// importer builds them) and the shared ones (other templates show them too: the shared
// fragment importer import-xf-fragments.js builds them). The template is the TEMPLATE of the
// template's fragment importer (tools/importer/<template>/xf-fragments.js).
// usage: node split-xf-urls.mjs <xf-urls.txt> <fragment importer folder> <own out> <shared out>
import { readFileSync, writeFileSync } from 'fs';

const R = '/backups/aemdemos/patients-stryker/repo';
const [list, folder, ownOut, sharedOut] = process.argv.slice(2);
const src = readFileSync(`${R}/tools/importer/${folder}/xf-fragments.js`, 'utf-8');
const template = (src.match(/const TEMPLATE = '([^']+)'/) || [])[1];
if (!template) throw new Error(`no TEMPLATE in ${folder}/xf-fragments.js`);
const { xfKey, xfInfo } = await import(`${R}/tools/importer/xf-fragment-path.js`);

const own = [];
const shared = [];
for (const url of readFileSync(list, 'utf-8').split('\n').filter(Boolean)) {
  // a hosted XF (<host>.html?xf=<XF path>) is looked up by its XF path
  const hosted = new URL(url).searchParams.get('xf');
  const info = xfInfo(xfKey(hosted || url));
  const others = ((info && info.templates) || []).filter((t) => t !== template);
  (others.length ? shared : own).push(url);
}
writeFileSync(ownOut, own.map((u) => `${u}\n`).join(''));
writeFileSync(sharedOut, shared.map((u) => `${u}\n`).join(''));
console.log(`${template}: ${own.length} own XFs, ${shared.length} shared`);
