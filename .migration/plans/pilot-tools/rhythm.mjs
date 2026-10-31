// Vertical rhythm of a preview page: per section its margin-bottom and padding, and per tag
// (inside default content, Columns cells, Hero Corp boxes) the margin-top / margin-bottom
// values found, with counts. usage: node rhythm.mjs <url> [width]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const count = {};
  const add = (key) => { count[key] = (count[key] || 0) + 1; };
  document.querySelectorAll('main > .section').forEach((s) => {
    const cs = getComputedStyle(s);
    add(`section mb ${cs.marginBottom} pt ${cs.paddingTop} pb ${cs.paddingBottom}`);
  });
  const scopes = {
    default: 'main > .section > .default-content-wrapper > :is(p, h1, h2, h3, h4, h5, h6, ul, ol)',
    columns: 'main .columns > div > div > :is(p, h1, h2, h3, h4, h5, h6, ul, ol)',
    hero: 'main .hero-corp > div:last-child > :is(p, h1, h2, h3, h4, h5, h6, ul, ol)',
  };
  Object.entries(scopes).forEach(([name, sel]) => {
    document.querySelectorAll(sel).forEach((el) => {
      const cs = getComputedStyle(el);
      add(`${name} ${el.tagName} mt ${cs.marginTop} mb ${cs.marginBottom} lh ${(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(3)}`);
    });
  });
  return count;
});
Object.entries(out).sort().forEach(([k, v]) => console.log(`${String(v).padStart(4)}  ${k}`));
await browser.close();
