// where a text is authored: authored.mjs <page path> <text> [<text> …]
// Searches the page export and the exports of the XFs it uses; prints each component holding
// the text (its path in the JSON, resource type, the styling properties) and the authored
// HTML around the text.
import { readFileSync, existsSync } from 'fs';
import { resolvePage, pageXfs } from './resolve.mjs';

const [path, ...needles] = process.argv.slice(2);
const page = resolvePage(path);
const files = [new URL(`../../xf-mapping${page.aem}.json`, import.meta.url).pathname];
pageXfs(page).forEach((xf) => {
  const f = new URL(`../../xf-content/${xf.replace('/content/experience-fragments/', '')}.json`, import.meta.url).pathname;
  if (existsSync(f)) files.push(f);
});
const SKIP = /^(jcr:|cq:|sling:|text$|textIsRich$)/;
const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
files.forEach((file) => {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const walk = (node, at) => {
    if (!node || typeof node !== 'object') return;
    Object.entries(node).forEach(([k, v]) => {
      if (typeof v !== 'string') return;
      const plain = norm(v);
      needles.forEach((n) => {
        if (!plain.includes(n)) return;
        const props = Object.fromEntries(Object.entries(node)
          .filter(([p, x]) => typeof x === 'string' && !SKIP.test(p) && x.length < 120));
        const raw = v.indexOf(n.slice(0, 10));
        const snippet = raw >= 0 ? v.slice(Math.max(0, raw - 400), raw + 200) : v.slice(0, 600);
        console.log(`== ${n} | ${file.split('/.migration/')[1]} | ${at}.${k}`);
        console.log(`   ${node['sling:resourceType'] || ''} ${JSON.stringify(props).slice(0, 400)}`);
        console.log(`   ${snippet.replace(/\s+/g, ' ')}`);
      });
    });
    Object.entries(node).forEach(([k, v]) => { if (v && typeof v === 'object') walk(v, `${at}/${k}`); });
  };
  walk(json, '');
});
