// The Marketo form, the aside next to it (stryker.com col-sm-4 XF / our fragment) and what
// follows, at given widths: top / bottom of each and the gaps. usage: node form-aside.mjs <url> <widths>
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
    const y = (el) => (el ? `${Math.round(el.getBoundingClientRect().top + window.scrollY)}-${Math.round(el.getBoundingClientRect().bottom + window.scrollY)} x${Math.round(el.getBoundingClientRect().left)} w${Math.round(el.getBoundingClientRect().width)}` : '-');
    const form = document.querySelector('.marketo-form, .c-marketo-form');
    const label = [...document.querySelectorAll('p, b, strong')].find((e) => e.innerText && e.innerText.trim() === 'Quick Links');
    const aside = label && (label.closest('.fragment-wrapper') || label.closest('.col-sm-4, .col-md-4') || label.parentElement);
    const host = (form && (form.closest('.section') || form.closest('.colctrl, .cols2_2-3_1-3') || form.parentElement));
    const next = host && host.nextElementSibling;
    const links = aside ? [...aside.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top + window.scrollY)) : [];
    const lastLink = aside && [...aside.querySelectorAll('a')].pop();
    return `form ${y(form)} | aside ${y(aside)} label ${y(label)} links at ${links.join(',')} last ${y(lastLink)} | host ${y(host)} mb ${host ? getComputedStyle(host).marginBottom : '-'} | next ${next ? `${next.className.slice(0, 40)} ${y(next)}` : '-'}`;
  }));
  await page.close();
}
await browser.close();
