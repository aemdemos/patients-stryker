// Opens the ProCare tile modal on a live stryker.com page and measures the dialog at 375 / 768 /
// 1440: dialog box, padding, background, backdrop, close button, title.
// usage: node modal-measure.mjs <url>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of (process.argv[3] || "375,768,1440").split(",").map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());
  const tile = await page.evaluate(() => {
    const img = document.querySelector('.c-procare-tile-image');
    const r = img.getBoundingClientRect();
    const icon = document.querySelector('.c-procare-tile-icon');
    const ir = icon.getBoundingClientRect();
    const ics = getComputedStyle(icon);
    const ib = getComputedStyle(icon, '::before');
    return `tile img ${Math.round(r.width)}x${Math.round(r.height)} x${Math.round(r.x)}; icon ${Math.round(ir.width)}x${Math.round(ir.height)} at ${Math.round(ir.x - r.x)},${Math.round(ir.y - r.y)} bg ${ics.backgroundColor} color ${ics.color} radius ${ics.borderRadius} font ${ib.fontSize} content ${ib.content}`;
  });
  await page.click('.c-procare-tile-image');
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return 'none';
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return `${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.x)},${Math.round(r.y)} pad ${cs.padding} bg ${cs.backgroundColor} border ${cs.border} radius ${cs.borderRadius} shadow ${cs.boxShadow.slice(0, 50)}`;
    };
    const t = q('#c-procare-tile-modal .c-procare-tile-title');
    const tcs = getComputedStyle(t);
    const close = q('#c-procare-tile-modal .c-procare-tile-close');
    const ccs = getComputedStyle(close);
    const cb = getComputedStyle(close, '::before');
    return [
      `dialog ${box(q('#c-procare-tile-modal .modal-dialog'))}`,
      `content ${box(q('#c-procare-tile-modal .modal-content'))}`,
      `body ${box(q('#c-procare-tile-modal .modal-body'))}`,
      `info ${box(q('#c-procare-tile-modal .c-procare-tile-info'))}`,
      `backdrop ${box(q('.modal-backdrop'))} opacity ${q('.modal-backdrop') && getComputedStyle(q('.modal-backdrop')).opacity}`,
      `title ${box(t)} font ${tcs.fontFamily.slice(0, 30)} ${tcs.fontSize} ${tcs.fontWeight} color ${tcs.color} border-bottom ${tcs.borderBottom} margin ${tcs.margin}`,
      `close ${box(close)} color ${ccs.color} font ${cb.fontSize} content ${cb.content}`,
      `h4 ${(() => { const h = q('#c-procare-tile-modal h4'); const c = getComputedStyle(h); return `${c.fontFamily.slice(0, 25)} ${c.fontSize} ${c.fontWeight} ${c.color} margin ${c.margin}`; })()}`,
      `p ${(() => { const h = q('#c-procare-tile-modal .phone-number, #c-procare-tile-modal p'); const c = getComputedStyle(h); return `${c.fontFamily.slice(0, 25)} ${c.fontSize} ${c.fontWeight} ${c.color} margin ${c.margin}`; })()}`,
      `table ${box(q('#c-procare-tile-modal table'))}`,
      `h4s ${[...document.querySelectorAll('#c-procare-tile-modal h4')].map((h) => { const r = h.getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)}`; }).join(' ')}`,
      `button ${box(q('#c-procare-tile-modal a.btn'))} color ${getComputedStyle(q('#c-procare-tile-modal a.btn')).backgroundColor}`,
      `addinfo ${box(q('#c-procare-tile-modal .c-procare-tile-addinfo'))}`,
      `contact ${box(q('#c-procare-tile-modal .c-procare-tile-contact'))} mb ${getComputedStyle(q('#c-procare-tile-modal .c-procare-tile-contact')).marginBottom}`,
      `groups ${[...document.querySelectorAll('#c-procare-tile-modal .c-procare-tile-contact-group > div')].map((g) => { const r = g.getBoundingClientRect(); const c = getComputedStyle(g); return `${Math.round(r.y)}+${Math.round(r.height)} mb ${c.marginBottom}`; }).join(' | ')}`,
      `ptags ${(() => { const p = q('#c-procare-tile-modal .phone-number'); const c = getComputedStyle(p); return `lh ${c.lineHeight} mb ${c.marginBottom}`; })()} addinfo p ${(() => { const p = q('#c-procare-tile-modal .c-procare-tile-addinfo p'); const c = getComputedStyle(p); return `lh ${c.lineHeight} mb ${c.marginBottom} mt ${c.marginTop}`; })()}`,
      `table mt ${getComputedStyle(q('#c-procare-tile-modal .c-table')).marginTop} mb ${getComputedStyle(q('#c-procare-tile-modal .c-table')).marginBottom}; addinfo mb ${getComputedStyle(q('#c-procare-tile-modal .c-procare-tile-addinfo')).marginBottom}`,
    ];
  });
  console.log(`== ${width}`);
  console.log('  ', tile);
  out.forEach((l) => console.log('  ', l));
  await page.close();
}
await browser.close();
