// pages of a list whose live static HTML contains any of the given strings:
//   node live-has.mjs <page list> <out list> <string> [string …]
// one page at a time; resolves AEM names from the exports
import { readFileSync, writeFileSync } from 'fs';
import { resolvePage } from './resolve.mjs';

const [list, out, ...needles] = process.argv.slice(2);
const pages = readFileSync(list, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const hits = [];
const counts = Object.fromEntries(needles.map((n) => [n, 0]));
for (const p of pages) {
  const { aem } = resolvePage(p);
  // eslint-disable-next-line no-await-in-loop
  const html = await (await fetch(`https://www.stryker.com${aem}.html`)).text();
  const found = needles.filter((n) => html.includes(n));
  found.forEach((n) => { counts[n] += 1; });
  if (found.length) hits.push(p);
}
writeFileSync(out, `${hits.join('\n')}\n`);
console.log(`${hits.length} of ${pages.length} pages`, counts);
