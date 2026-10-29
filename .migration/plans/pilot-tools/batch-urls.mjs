// pilot list(s) → <out>/urls.txt (source page URLs), <out>/xf-urls.txt (their XFs, once) and
// <out>/pages.tsv (aem path <tab> eds path): node batch-urls.mjs <out dir> <list> [list …]
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolvePage, pageXfs } from './resolve.mjs';

const [out, ...lists] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const pages = lists.flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean));
const resolved = [];
pages.forEach((p) => {
  try {
    resolved.push(resolvePage(p));
  } catch (e) {
    process.stderr.write(`skipped ${p}: ${e.message}\n`);
  }
});
const xfs = [...new Set(resolved.flatMap(pageXfs))].sort();
writeFileSync(`${out}/urls.txt`, `${resolved.map((r) => `https://www.stryker.com${r.aem}.html`).join('\n')}\n`);
writeFileSync(`${out}/xf-urls.txt`, xfs.length ? `${xfs.map((x) => `https://www.stryker.com${x}.html`).join('\n')}\n` : '');
writeFileSync(`${out}/pages.tsv`, `${resolved.map((r) => `${r.aem}\t${r.eds}`).join('\n')}\n`);
process.stdout.write(`${resolved.length} pages, ${xfs.length} XFs\n`);
