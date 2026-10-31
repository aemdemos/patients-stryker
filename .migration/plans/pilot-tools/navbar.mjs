// The jump bar (stryker.com .c-navigation-bar / our Sticky Nav) at given widths: bar box,
// each item's x / width, and the free space left / right of the items.
// usage: node navbar.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);
  console.log(width, await page.evaluate(() => {
    const bar = document.querySelector('.sticky-nav, .c-navigation-bar');
    if (!bar) return 'no bar';
    const items = [...bar.querySelectorAll('a')].filter((a) => a.offsetParent && a.getBoundingClientRect().width > 0);
    const r = bar.getBoundingClientRect();
    const first = items[0].getBoundingClientRect();
    const last = items[items.length - 1].getBoundingClientRect();
    const list = items[0].closest('ul, ol, div');
    return `bar x${Math.round(r.left)} w${Math.round(r.width)} | items ${items.length} from ${Math.round(first.left)} to ${Math.round(last.right)} | left gap ${Math.round(first.left - r.left)} right gap ${Math.round(r.right - last.right)} | ${items.map((a) => `${a.innerText.trim().slice(0, 12)}@${Math.round(a.getBoundingClientRect().left)}+${Math.round(a.getBoundingClientRect().width)}`).join(' ')} | list ${list.tagName}.${String(list.className).slice(0, 30)} justify ${getComputedStyle(list).justifyContent} align ${getComputedStyle(list).textAlign}`;
  }));
  await page.close();
}
await browser.close();
