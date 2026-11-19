#!/usr/bin/env node
/*
 * Text styles from measured text (measure.mjs --text): every style that carries a fifth or more
 * of a role's text in a text unit (a run of default content or a Columns cell), grouped by how it
 * looks, whatever the markup (a bold 28px paragraph and a 28px h2 are the same style): family,
 * size (2px steps), bold or regular, capitals, italic. Per style: how many units use it, the tags
 * that carry it, where it appears (page text, which Columns variant, flex sections, tabs,
 * accordions), its colours, its size on phones, and sample units (for screenshots: text-shots.mjs).
 * Writes the looks page data (tools/looks/data/text-styles.json), largest first.
 * usage: node tools/importer/standardise/looks/group-text.mjs [--in /tmp/run-outputs/looks-text]
 *   [--out tools/looks/data] [--samples 12]
 */
import {
  readFileSync, writeFileSync, readdirSync, mkdirSync,
} from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const IN = opt('--in', '/tmp/run-outputs/looks-text');
const OUT = opt('--out', 'tools/looks/data');
const SAMPLES = Number(opt('--samples', 12));
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
const titles = Object.fromEntries(pages.map((p) => [p.path, p.title]));
const slug = (p) => p.replace(/^\//, '').replace(/\//g, '~');

const FAMILY = (f) => (f || '').replace(/ for stryker/, '').replace(/ 712/, '').trim();
const size2 = (s) => Math.round((s || 0) / 2) * 2;
const styleKey = (st) => [
  FAMILY(st.family), `${size2(st.size)}px`, st.weight >= 600 ? 'bold' : 'regular',
  st.upper ? 'caps' : '', st.italic ? 'italic' : '',
].filter(Boolean).join(' ');
const TAGS = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6', body: 'paragraph', list: 'list', link: 'link', button: 'button',
};
const contextOf = (u) => {
  let where = 'page text';
  if (u.container === 'columns') where = `Columns ${u.variant.join(' ') || '(default)'}`;
  else if (u.container === 'flex') where = 'flex section';
  return [where, u.inTabs && 'in tabs', u.inAccordion && 'in accordion', u.inFragment && 'in a fragment']
    .filter(Boolean).join(', ');
};
const count = (m, k, n = 1) => { m[k] = (m[k] || 0) + n; };
const top = (m, n = 6) => Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, n);

const styles = new Map();
let measured = 0;
let unitsTotal = 0;
readdirSync(join(IN, 'pages')).forEach((f) => {
  const d = JSON.parse(readFileSync(join(IN, 'pages', f), 'utf8'));
  measured += 1;
  (d.units || []).forEach((u) => {
    unitsTotal += 1;
    Object.entries(u.typography).forEach(([role, v]) => {
      v.styles.filter((st) => st.share >= 0.2).forEach((st, i) => {
        const key = styleKey(st);
        if (!styles.has(key)) {
          styles.set(key, {
            key,
            units: 0,
            chars: 0,
            pages: new Set(),
            tags: {},
            contexts: {},
            colours: {},
            phone: {},
            samples: [],
          });
        }
        const s = styles.get(key);
        s.units += 1;
        s.chars += Math.round(v.chars * st.share);
        s.pages.add(d.page);
        count(s.tags, TAGS[role] || role);
        count(s.contexts, contextOf(u));
        count(s.colours, st.color);
        const ph = u.phone?.typography?.[role]?.styles?.[i];
        if (ph) count(s.phone, `${size2(ph.size)}px`);
        // (samples from different pages, visible ones first)
        if (!u.hidden && s.samples.length < SAMPLES && !s.samples.some((x) => x.page === d.page)) {
          s.samples.push({
            page: d.page, n: u.n, kind: u.kind, role, text: u.text, context: contextOf(u),
          });
        }
      });
    });
  });
});

const groups = [...styles.values()].sort((a, c) => c.units - a.units).map((s, i) => ({
  id: i + 1,
  instances: s.units,
  pages: s.pages.size,
  parts: {
    style: s.key,
    'used as': top(s.tags).map(([k, n]) => `${k} ${Math.round((n / s.units) * 100)}%`).join(' · '),
    where: top(s.contexts, 4).map(([k, n]) => `${k} (${n})`).join(' · '),
    phone: top(s.phone, 3).map(([k, n]) => `${k} (${n})`).join(' · ') || '—',
  },
  colours: top(s.colours, 8),
  classes: top(s.contexts, 3),
  lacking: [],
  extras: [],
  close: [],
  items: s.samples.map((x) => ({
    page: x.page,
    title: titles[x.page] || x.page,
    n: x.n,
    classes: [],
    inFragment: false,
    shot: `shots/text/${slug(x.page)}__${x.n}-d.jpg`,
    phoneShot: `shots/text/${slug(x.page)}__${x.n}-m.jpg`,
    text: x.text,
    context: x.context,
  })),
}));
mkdirSync(OUT, { recursive: true });
const result = {
  type: 'text-styles',
  blocks: ['text'],
  generated: new Date().toISOString(),
  remoteShots: true,
  measuredPages: measured,
  instances: unitsTotal,
  groups,
  families: [],
};
writeFileSync(join(OUT, 'text-styles.json'), JSON.stringify(result));
let index = { types: [] };
try {
  index = JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8'));
} catch (e) {
  index = { types: [] };
}
index.types = [
  ...index.types.filter((t) => t.type !== 'text-styles'),
  { type: 'text-styles', instances: unitsTotal, groups: groups.length },
];
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log(`text styles: ${groups.length} styles in ${unitsTotal} text units on ${measured} pages`);
groups.slice(0, 25).forEach((g) => {
  console.log(`  #${g.id} ${g.instances} units on ${g.pages} pages · ${g.parts.style} · ${g.parts['used as']}`);
});
