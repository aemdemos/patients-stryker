#!/usr/bin/env node
/*
 * How far the as-is pages are from the original, for one block type: per page, the look of its
 * blocks of that type on the original (measure.mjs --source) against the as-is (measure.mjs), in
 * page order, part by part (group.mjs's parts: frame, layout, image, text styles, buttons). Lists
 * every difference and counts them per part; blocks missing on one side are listed too.
 * usage: node tools/importer/standardise/looks/compare-source.mjs <block type>
 *   [--source /tmp/run-outputs/looks-source] [--asis /tmp/run-outputs/looks-v2] [--out <json>]
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const type = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const SRC = opt('--source', '/tmp/run-outputs/looks-source');
const ASIS = opt('--asis', '/tmp/run-outputs/looks-v2');
const OUT = opt('--out', `/tmp/run-outputs/looks-source/compare-${type}.json`);

const FAMILY = (f) => (f || '').replace(/ for stryker/, '').replace(/ 712/, '').trim();
const band = (px) => {
  if (px <= 16) return 'S';
  if (px <= 26) return 'M';
  if (px <= 38) return 'L';
  if (px <= 56) return 'XL';
  return 'XXL';
};
const share = (s) => {
  if (s >= 0.95) return 'full';
  if (s >= 0.7) return 'most';
  if (s >= 0.4) return 'half';
  return 'small';
};
const width = (w) => {
  if (w >= 0.95) return 'full';
  if (w >= 0.8) return 'wide';
  if (w >= 0.55) return 'contained';
  return 'narrow';
};
// the parts that matter for a look, coarse enough that rounding is no difference
const partsOf = (b) => ({
  frame: `${width(b.frame.widthShare)}${b.frame.bg !== 'transparent' ? ` bg ${b.frame.bg}` : ''}${b.frame.shadow ? ' shadow' : ''}`,
  image: b.image ? `${b.image.place}, ${share(b.image.share)} width` : 'no image',
  ...Object.fromEntries(['title', 'body', 'button'].filter((r) => b.typography?.[r]).map((r) => [`type ${r}`,
    b.typography[r].styles.filter((x) => x.share >= 0.2).slice(0, 2)
      .map((x) => `${FAMILY(x.family)} ${band(x.size)} ${x.weight >= 600 ? 'bold' : 'regular'} ${x.color}`).sort()
      .join(' + ')])),
  buttons: b.buttons?.[0] ? `${b.buttons[0].kind} ${b.buttons[0].bg}` : 'none',
});
const load = (dir) => Object.fromEntries(readdirSync(join(dir, 'pages')).map((f) => {
  const d = JSON.parse(readFileSync(join(dir, 'pages', f), 'utf8'));
  return [d.page, (d.blocks || []).filter((b) => b.type === type && !b.hidden)];
}));
const src = load(SRC);
const asis = load(ASIS);
const rows = [];
const perPart = {};
let same = 0;
let compared = 0;
Object.keys(src).forEach((page) => {
  const a = asis[page] || [];
  const s = src[page];
  if (s.length !== a.length) {
    rows.push({
      page, kind: 'count', source: s.length, asis: a.length,
    });
  }
  s.slice(0, a.length).forEach((sb, i) => {
    compared += 1;
    const sp = partsOf(sb);
    const ap = partsOf(a[i]);
    const keys = [...new Set([...Object.keys(sp), ...Object.keys(ap)])];
    const diff = keys.filter((k) => sp[k] !== ap[k]).map((k) => ({ part: k, source: sp[k] || '(none)', asis: ap[k] || '(none)' }));
    if (!diff.length) same += 1;
    diff.forEach((d) => { perPart[d.part] = (perPart[d.part] || 0) + 1; });
    if (diff.length) {
      rows.push({
        page, n: i, kind: 'look', diff,
      });
    }
  });
});
writeFileSync(OUT, JSON.stringify({
  type, compared, same, perPart, rows,
}, null, 1));
console.log(`${type}: ${compared} compared, ${same} the same on both, ${compared - same} differ; blocks missing or extra on ${rows.filter((r) => r.kind === 'count').length} pages`);
Object.entries(perPart).sort((x, y) => y[1] - x[1]).forEach(([k, n]) => console.log(`  ${k}: ${n} differ`));
console.log(`(details: ${OUT})`);
