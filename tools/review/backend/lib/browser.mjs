/*
 * The backend's browser (actions capture and live): Chromium 133 for Amazon Linux 2 with Debian
 * 10's NSS / NSPR shipped in the action (the Runtime container is Debian 10, see deploy.mjs and
 * browser/), and how every stryker.com page is opened: ALTCHA / captcha and trackers blocked,
 * the cookie banner hidden, scrolled through so lazy content loads.
 */
import { join } from 'path';
import { rmSync } from 'fs';

const PACK = 'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar';
// blocked: ALTCHA / captcha by path (on any host), the cookie banner and trackers by host
const BLOCK_PATH = /altcha|captcha/i;
const BLOCK_HOST = /altcha|captcha|cookielaw|onetrust|googletagmanager|google-analytics|doubleclick|facebook|licdn|linkedin|qualtrics|zoominfo|zi-scripts|stackadapt|demdex|omtrdc|serving-sys|tribalfusion|quantserve|mathtag|intentsify|dpmsrv|usbrowserspeed|contextweb|smtrk|domdex|quantcount|adobedtm/;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';

export async function launch() {
  // (the pack's Amazon Linux 2 libraries: unpacked only "on Lambda with Node 18"; a warm
  // container may keep another version's browser in /tmp)
  process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';
  rmSync('/tmp/chromium', { force: true });
  const chromium = (await import('@sparticuz/chromium-min')).default;
  const puppeteer = (await import('puppeteer-core')).default;
  const exe = await chromium.executablePath(PACK);
  // Debian 10's NSS / NSPR (shipped with the action), before Amazon Linux 2's
  process.env.LD_LIBRARY_PATH = `${join(__dirname, 'libs')}:${process.env.LD_LIBRARY_PATH || ''}`;
  return puppeteer.launch({
    args: chromium.args.filter((a) => !['--single-process', '--no-zygote'].includes(a)).concat(['--disable-dev-shm-usage']),
    executablePath: exe,
    headless: 'shell',
    defaultViewport: { width: 1440, height: 900 },
  });
}

/** a new page at a width, with the blocking and the user agent of every capture */
export async function openPage(browser, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(UA);
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    let u;
    try {
      u = new URL(r.url());
    } catch (e) {
      r.continue();
      return;
    }
    if (BLOCK_PATH.test(u.pathname) || BLOCK_HOST.test(u.hostname)) r.abort();
    else r.continue();
  });
  return page;
}

const sameUrl = (a, b) => {
  const u = (x) => {
    const p = new URL(x);
    return `${p.host}${p.pathname}`;
  };
  return u(a) === u(b);
};

/**
 * goes to a source page and lets it finish: 200 and no redirect to another page (else an error
 * with source: true, the reason for the AOE team), the cookie banner hidden, scrolled through
 * (lazy images, count-ups), back at the top → the response's status
 */
export async function loadSource(page, url, { wait = 2500 } = {}) {
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  const status = resp ? resp.status() : 0;
  if (status !== 200) throw Object.assign(new Error(`the source answers ${status || 'nothing'}`), { source: true });
  if (!sameUrl(page.url(), url)) throw Object.assign(new Error(`the source redirects to ${page.url()}`), { source: true });
  await page.addStyleTag({ content: '#onetrust-consent-sdk, #onetrust-banner-sdk { display: none !important; }' });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => { setTimeout(r, 150); });
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => { setTimeout(r, wait); });
  return status;
}
