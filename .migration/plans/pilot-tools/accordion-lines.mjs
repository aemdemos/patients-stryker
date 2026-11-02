// Accordion rules on a page (stryker.com accordion component / our Accordion block): every
// element inside the first accordion with a visible border or an <hr>, with its box, border
// sides / colour and text start, plus each label's box. usage: node accordion-lines.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3000);
  console.log(width, await page.evaluate(() => {
    const acc = document.querySelector('.accordion.block, .c-accordion, [class*="accordion"]:not(script)');
    if (!acc) return 'no accordion';
    const out = [`root ${acc.tagName}.${String(acc.className).slice(0, 50)}`];
    const y = (r) => `${Math.round(r.top + window.scrollY)}-${Math.round(r.bottom + window.scrollY)} x${Math.round(r.left)} w${Math.round(r.width)}`;
    [acc, ...acc.querySelectorAll('*')].forEach((e) => {
      const cs = getComputedStyle(e);
      const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none');
      if (!sides.length && e.tagName !== 'HR' && !/label|title|header|button|summary/i.test(`${e.className} ${e.tagName}`)) return;
      if (!e.getBoundingClientRect().height && e.tagName !== 'HR') return;
      const border = sides.map((s) => `${s[0]}${cs[`border${s}Width`]} ${cs[`border${s}Color`]}`).join(' ');
      out.push(`${e.tagName}.${String(e.className).slice(0, 40)} ${y(e.getBoundingClientRect())} ${border ? `border ${border}` : ''} ${e.tagName === 'HR' ? `hr bg ${cs.backgroundColor} color ${cs.color}` : ''} text "${(e.innerText || '').trim().slice(0, 25)}"`);
    });
    return out.slice(0, 40).join('\n  ');
  }));
  await page.close();
}
await browser.close();
