// The Marketo form's rows on a page (scrolled to the form: our block loads Marketo when it
// comes into view): per field its label and input x / width, and the margins / padding / width
// of the wrappers between the input and the row. usage: node form-fields.mjs <url> [width] [field]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width = '1200', field = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.querySelector('.marketo-form, .c-marketo-form')?.scrollIntoView());
await page.waitForTimeout(6000);
console.log(await page.evaluate((name) => {
  const form = document.querySelector('form.mktoForm');
  if (!form) return 'no form';
  const x = (e) => Math.round(e.getBoundingClientRect().left);
  const w = (e) => Math.round(e.getBoundingClientRect().width);
  const rows = [...form.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((i) => i.offsetParent).map((input) => {
    const label = form.querySelector(`label[for="${input.id}"]`);
    let line = `${(input.name || input.id).padEnd(24)} label x${label ? x(label) : '-'} w${label ? w(label) : '-'} input x${x(input)} w${w(input)}`;
    if (name && input.name === name) {
      const chain = [];
      for (let e = input; e && e !== form; e = e.parentElement) {
        const cs = getComputedStyle(e);
        chain.push(`${e.tagName}.${String(e.className).slice(0, 40)} x${x(e)} w${w(e)} m ${cs.margin} p ${cs.padding} float ${cs.float} display ${cs.display}`);
      }
      line += `\n    ${chain.join('\n    ')}`;
    }
    return line;
  });
  return rows.join('\n');
}, field));
await browser.close();
