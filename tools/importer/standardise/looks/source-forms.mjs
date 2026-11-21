#!/usr/bin/env node
/*
 * Forms that are only on stryker.com: the AEM Division contact form ("Contact Us", an email form)
 * was left out of the migration until the client gives Marketo IDs, so it isn't on the as-is pages.
 * This crops it out of the review tool's stryker.com snapshots (1440 + 375; tools/review/
 * capture-snapshots.mjs), finding it by its description text, and writes a group for the looks page
 * (group.mjs --extra). Pages come from the source exports (.migration/xf-mapping, local only).
 * usage: node tools/importer/standardise/looks/source-forms.mjs
 *   [--snapshots /tmp/run-outputs/review-snapshots] [--out tools/looks]
 */
import { createRequire } from 'module';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'fs';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const SNAP = opt('--snapshots', '/tmp/run-outputs/review-snapshots');
const OUT = opt('--out', 'tools/looks');
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
const slug = (p) => p.replace(/^\//, '').replace(/\//g, '~');
const clean = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

/** the Division contact form components of a page export */
const formsOf = (o) => {
  if (Array.isArray(o)) return o.flatMap(formsOf);
  if (!o || typeof o !== 'object') return [];
  const own = String(o['sling:resourceType'] || '').endsWith('divisioncontactus') ? [o] : [];
  return [...own, ...Object.values(o).flatMap(formsOf)];
};

// where the form sits in a snapshot: its description line, then the form's height below it
// (desktop: title above, two field columns, ~740 px; phone: one column, ~1400 px)
const AREA = {
  1440: { above: 120, below: 740 },
  375: { above: 110, below: 1250 },
};

const browser = await chromium.launch();
const shotDir = join(OUT, 'shots', 'forms');
mkdirSync(shotDir, { recursive: true });

/** crop y .. y + h of a snapshot (its tiles stacked) to a file */
async function crop(dir, meta, y, h, file) {
  const page = await browser.newPage({ viewport: { width: meta.width, height: 800 } });
  try {
    const imgs = meta.tiles.map((t) => `data:image/jpeg;base64,${readFileSync(join(dir, t.file)).toString('base64')}`);
    await page.setContent(`<body style="margin:0">${imgs.map((src) => `<img src="${src}" style="display:block">`).join('')}</body>`);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    const top = Math.max(0, y);
    await page.screenshot({
      path: file,
      type: 'jpeg',
      quality: 62,
      fullPage: true,
      clip: {
        x: 0, y: top, width: meta.width, height: Math.min(h, meta.height - top),
      },
    });
  } finally {
    await page.close();
  }
}

const items = [];
const missing = [];
await pages.reduce((prev, p) => prev.then(async () => {
  const exportFile = `.migration/xf-mapping${p.path}.json`;
  const metaFile = `tools/review/snapshot-meta${p.path}.json`;
  if (!existsSync(exportFile) || !existsSync(metaFile)) return;
  const forms = formsOf(JSON.parse(readFileSync(exportFile, 'utf8')));
  if (!forms.length) return;
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  const desc = clean(forms[0].formDescription).replace(/^\*\s*/, '').slice(0, 30);
  const shots = {};
  await [1440, 375].reduce((p2, vp) => p2.then(async () => {
    const m = meta[vp];
    const leaf = desc && m?.leaves.find((l) => l.key.slice(2).replace(/^\*\s*/, '').startsWith(desc));
    if (!leaf) return;
    const file = `${slug(p.path)}__division-${vp === 1440 ? 'd' : 'm'}.jpg`;
    const { above, below } = AREA[vp];
    const dir = join(SNAP, p.path, String(vp));
    await crop(dir, m, leaf.y - above, above + below, join(shotDir, file));
    shots[vp] = `shots/forms/${file}`;
  }), Promise.resolve());
  if (!shots[1440]) {
    missing.push(p.path);
    return;
  }
  items.push({
    page: p.path,
    title: p.title,
    n: 0,
    classes: ['division contact form (stryker.com)'],
    inFragment: false,
    shot: shots[1440],
    phoneShot: shots[375],
    source: meta['1440'].url,
    notMigrated: true,
    text: `${forms[0].formTitle || ''} ${clean(forms[0].formDescription)}`.trim().slice(0, 160),
  });
}), Promise.resolve());
await browser.close();

const group = {
  label: 'Division contact form (stryker.com only: not migrated)',
  instances: items.length,
  pages: items.length,
  parts: {
    frame: 'full; plain',
    layout: 'title over a rule; description on the left third, fields on the right two thirds',
    fields: 'two per row, grey filled boxes, Egyptienne bold labels above; message across both columns',
    buttons: 'filled #4c7d7a caps (Submit)',
  },
  classes: [['division contact form (stryker.com)', items.length]],
  lacking: [],
  extras: [],
  close: [],
  items,
};
mkdirSync(join(OUT, 'data', 'extra'), { recursive: true });
writeFileSync(join(OUT, 'data', 'extra', 'forms-division.json'), JSON.stringify({ groups: [group] }));
console.log(`division contact form: ${items.length} pages cropped${missing.length ? `; not found in the snapshot: ${missing.join(', ')}` : ''}`);
