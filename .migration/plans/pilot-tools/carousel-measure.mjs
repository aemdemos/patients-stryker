// The first multi-slide hero carousel on a page (stryker.com .c-autocarousel slick / our Hero
// Corp carousel) at given widths: box, slides, arrows (box, colours, icon), dots, autoplay
// (the active slide after a wait). usage: node carousel-measure.mjs <url> <widths>
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
  const measure = () => {
    const root = [...document.querySelectorAll('.c-autocarousel, .hero-corp-carousel')]
      .find((c) => c.querySelectorAll('.carouselslide:not(.slick-cloned), .hero-corp-carousel-slide').length > 1);
    if (!root) return 'no multi-slide carousel';
    const box = (e) => {
      if (!e) return '-';
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return `x${Math.round(r.left)} y${Math.round(r.top + window.scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} vis ${cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0} bg ${cs.backgroundColor} color ${cs.color} font ${cs.fontSize} ti ${cs.textIndent} op ${cs.opacity}`;
    };
    const slides = [...root.querySelectorAll('.carouselslide:not(.slick-cloned), .hero-corp-carousel-slide')];
    const active = slides.findIndex((s) => s.classList.contains('slick-active') || s.classList.contains('slick-current') || s.getAttribute('aria-hidden') === 'false');
    const prev = root.querySelector('.slick-prev, .hero-corp-carousel-prev');
    const next = root.querySelector('.slick-next, .hero-corp-carousel-next');
    const pseudo = (e) => (e ? `${getComputedStyle(e, '::before').content} ${getComputedStyle(e, '::before').fontSize} ${getComputedStyle(e, '::before').color}` : '-');
    const dots = root.querySelector('.slick-dots, .hero-corp-carousel-dots');
    return `root ${box(root)}\n  slides ${slides.length} active ${active} slide0 ${box(slides[0])}\n  prev ${box(prev)} icon ${pseudo(prev)} text "${prev ? prev.textContent.trim() : ''}"\n  next ${box(next)} icon ${pseudo(next)}\n  dots ${box(dots)} items ${dots ? dots.children.length : 0}`;
  };
  console.log(width, await page.evaluate(measure));
  await page.waitForTimeout(7000);
  console.log(width, 'after 7s active:', await page.evaluate(() => {
    const root = [...document.querySelectorAll('.c-autocarousel, .hero-corp-carousel')]
      .find((c) => c.querySelectorAll('.carouselslide:not(.slick-cloned), .hero-corp-carousel-slide').length > 1);
    if (!root) return '-';
    const slides = [...root.querySelectorAll('.carouselslide:not(.slick-cloned), .hero-corp-carousel-slide')];
    return slides.findIndex((s) => s.classList.contains('slick-active') || s.classList.contains('slick-current') || s.getAttribute('aria-hidden') === 'false');
  }));
  await page.close();
}
await browser.close();
