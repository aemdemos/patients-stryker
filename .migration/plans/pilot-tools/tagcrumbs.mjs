// the live "Related categories" boxes (.c-tagcrumb) of pages → each group's items next to the
// page's tags, to build the tag list (tag ID → label, link):
//   node tagcrumbs.mjs <page list> <out.json>
// Pages are fetched from www.stryker.com (static HTML has the box); the tags come from the
// page export (cq:tags). One page at a time.
import { readFileSync, writeFileSync } from 'fs';
import { resolvePage } from './resolve.mjs';

const [list, out] = process.argv.slice(2);
const pages = readFileSync(list, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const exportsRoot = new URL('../../xf-mapping/', import.meta.url);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const result = [];
for (const p of pages) {
  const { aem, eds } = resolvePage(p);
  const exp = JSON.parse(readFileSync(new URL(`.${aem}.json`, exportsRoot), 'utf8'));
  // eslint-disable-next-line no-await-in-loop
  const html = await (await fetch(`https://www.stryker.com${aem}.html`)).text();
  const box = html.slice(html.indexOf('class="c-tagcrumb'));
  const end = box.indexOf('<!-- END: Two Columns -->');
  const part = end > 0 ? box.slice(0, end) : box.slice(0, 20000);
  const groups = html.includes('class="c-tagcrumb') ? part.split('c-tagcrumb-list-item-wrapper').slice(1).map((g) => [...g.matchAll(/<li class="c-tagcrumb-item"><a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ link: m[1], label: decode(m[2].replace(/<[^>]+>/g, '')) }))) : null;
  result.push({
    eds, aem, tags: exp['cq:tags'] || [], hidden: (exp.tagcrumb || {}).hideComponent === 'true', groups,
  });
}
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(`${result.length} pages, ${result.filter((r) => r.groups).length} with a box`);
