// box tree of one element on live and in the preview, for measuring a component:
//   node probe.mjs <width> <page path> <live selector> <preview selector> [depth] [text needle]
// The page path is resolved like the pilot lists (AEM or EDS names). With a text needle, the
// first element matching the selector that contains the text is used. Prints each element's
// tag.class, position (relative to the probed element), size, font, margin and padding.
import { createRequire } from 'module';
import { resolvePage } from './resolve.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [width, path, liveSel, oursSel, depth = '3', needle = ''] = process.argv.slice(2);
const page0 = resolvePage(path);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 } });
const urls = [[`https://www.stryker.com${page0.aem}.html`, liveSel], [`http://localhost:3000/content/drafts/reimport${page0.eds}`, oursSel]];
try {
  for (const [url, sel] of urls) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(2500);
      await page.evaluate(async () => {
        for (let y = 0; y < 40; y += 1) {
          window.scrollTo(0, y * 700);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((d) => { setTimeout(d, 40); });
        }
      });
      await page.waitForTimeout(1000);
      const out = await page.evaluate(({ s, d, n }) => {
        const el = [...document.querySelectorAll(s)].find((e) => !n || e.textContent.includes(n));
        if (!el) return `no element for ${s}`;
        const top = el.getBoundingClientRect();
        const lines = [];
        const walk = (e, level) => {
          const cs = getComputedStyle(e);
          const b = e.getBoundingClientRect();
          const own = [...e.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join(' ').slice(0, 30);
          lines.push(`${'  '.repeat(level)}${e.tagName}.${String(e.className).slice(0, 40)} x${Math.round(b.left - top.left)} y${Math.round(b.top - top.top)} ${Math.round(b.width)}x${Math.round(b.height)} ${cs.fontFamily.split(',')[0].replace(/"/g, '')} ${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight} ${cs.color} m[${cs.margin}] p[${cs.padding}]${cs.borderBottomWidth !== '0px' ? ` bb[${cs.borderBottom}]` : ''}${own ? ` «${own}»` : ''}`);
          if (level < d) [...e.children].forEach((c) => walk(c, level + 1));
        };
        walk(el, 0);
        return lines.join('\n');
      }, { s: sel, d: Number(depth), n: needle });
      console.log(`== ${url.slice(0, 60)}`);
      console.log(out);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
