/*
 * Web action `live`: a live copy of a page's source page (www.stryker.com), rendered now by the
 * backend's browser at the width being viewed, for the review tool's Live pane. stryker.com
 * refuses to be shown inside another site (X-Frame-Options, CSP) and answers 404 to plain
 * requests, so the browser opens it and gives its rendered page: every script removed (nothing
 * runs: no trackers, no ALTCHA, no analytics on stryker.com), a <base> to stryker.com (its
 * stylesheets, images and fonts load from there; its fonts allow any site). Not clickable as on
 * stryker.com (menus, tabs, carousels as rendered); not evidence (the shots are).
 * GET ?page=/us/en/…&vp=1440 [&fresh=1] [&source=https://www.stryker.com/….html] with header
 * x-review-invite → { html, at, source, finalUrl, status, title, cached }
 * The source: the migration scope table's (space main), else the newest shot's, else the given
 * one (a stryker.com page). Copies are kept 10 minutes (fresh=1: render again).
 */
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import { loadScope } from '../lib/scope.mjs';
import { readHistory } from '../lib/shots.mjs';
import { launch, openPage, loadSource } from '../lib/browser.mjs';

const KEEP_MS = 10 * 60 * 1000;
const MAX_HTML = 900000;
const SOURCE = /^https:\/\/www\.stryker\.com\/[^?#]+\.html$/;
const pre = (space) => (space === 'std' ? '' : `${space}/`);
const cacheFile = (space, source, vp) => `${pre(space)}live/${Buffer.from(source).toString('base64url')}/${vp}.json`;

// the browser stays open in a warm container (the next copy is faster)
let browserP = null;
let warmSince = null;
async function browser() {
  if (browserP) {
    const b = await browserP.catch(() => null);
    if (b && b.connected) return { b, cold: false };
  }
  browserP = launch();
  warmSince = new Date().toISOString();
  return { b: await browserP, cold: true };
}

/** the rendered page as a copy: no scripts, a <base> to stryker.com (runs in the browser) */
function copyOf(finalUrl) {
  const doc = document.documentElement.cloneNode(true);
  doc.querySelectorAll('script, noscript, link[rel="modulepreload"], link[rel="preload"][as="script"], meta[http-equiv], base')
    .forEach((n) => n.remove());
  doc.querySelectorAll('#onetrust-consent-sdk, #onetrust-banner-sdk').forEach((n) => n.remove());
  // videos played by the page's scripts from an in-browser stream (blob:, Dynamic Media) can't
  // play in the copy: their poster image, at the player's size, instead of an empty box
  doc.querySelectorAll('video').forEach((v) => {
    const src = v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || '';
    if (!src.startsWith('blob:') && src) return;
    const player = v.closest('.s7dm-dynamic-media, .s7videoviewer') || v;
    const live = document.getElementById(v.id);
    const box = (live?.closest('.s7dm-dynamic-media, .s7videoviewer') || live || v).getBoundingClientRect?.() || { width: 0, height: 0 };
    const img = document.createElement('img');
    img.src = v.getAttribute('poster') || '';
    img.alt = '';
    img.setAttribute('style', `display: block; width: 100%; ${box.height ? `aspect-ratio: ${Math.round(box.width)} / ${Math.round(box.height)};` : ''} object-fit: cover;`);
    if (img.src) player.replaceWith(img);
  });
  // (inline handlers never run without scripts; they go too, so nothing looks clickable that isn't)
  doc.querySelectorAll('*').forEach((n) => [...n.attributes].filter((a) => /^on/i.test(a.name)).forEach((a) => n.removeAttribute(a.name)));
  const base = document.createElement('base');
  base.href = finalUrl;
  doc.querySelector('head').prepend(base);
  return `<!DOCTYPE html>\n${doc.outerHTML}`;
}

async function sourceOf(files, space, page, given) {
  const { rows } = await loadScope(space, files);
  const row = rows.find((r) => r.eds === page);
  if (row) return row.source;
  const h = await readHistory(files, space, page);
  const newest = h.versions[h.versions.length - 1];
  if (newest?.url) return newest.url;
  return SOURCE.test(given || '') ? given : null;
}

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  const t0 = Date.now();
  const timing = {};
  const mark = (k) => { timing[k] = Date.now() - t0; };
  // (the schedule's warm-up: start the browser, render nothing)
  if (params.op === 'warm') {
    const { cold } = await browser();
    return reply(params, 200, { warm: true, cold, since: warmSince, took: Date.now() - t0 });
  }
  try {
    const stores = await open(params);
    const { files } = stores;
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    const vp = Number(params.vp);
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    if (![1440, 860, 375].includes(vp)) return fail(params, 400, 'bad-width', 'vp: 1440, 860 or 375');
    if (!inScope(invite.scope, page)) return fail(params, 403, 'out-of-scope', 'This page is not part of your review.');
    const space = spaceOf(invite.scope);
    const source = await sourceOf(files, space, page, params.source);
    if (!source) return fail(params, 404, 'no-source', 'No source page is known for this page.');
    mark('ready');
    const file = cacheFile(space, source, vp);
    if (!params.fresh) {
      try {
        const kept = JSON.parse((await files.read(file)).toString());
        if (Date.now() - Date.parse(kept.at) < KEEP_MS) return reply(params, 200, { ...kept, cached: true });
      } catch (e) {
        // none kept
      }
    }
    const { b, cold } = await browser();
    mark('browser');
    const lite = params.full !== '1';
    const tab = await openPage(b, vp, { lite });
    let out;
    try {
      const status = await loadSource(tab, source, lite ? {
        wait: 300, pause: 40, waitUntil: 'domcontentloaded', settle: 4000,
      } : { wait: 1500, settle: 4000 });
      mark('loaded');
      const finalUrl = tab.url();
      const html = await tab.evaluate(copyOf, finalUrl);
      mark('copied');
      if (html.length > MAX_HTML) return fail(params, 413, 'too-large', 'This page is too large for a live copy.');
      out = {
        html, at: new Date().toISOString(), source, finalUrl, status, title: await tab.title(), vp,
      };
    } catch (e) {
      return fail(params, e.source ? 502 : 500, e.source ? 'source' : 'render', String(e.message || e).slice(0, 200));
    } finally {
      await tab.close().catch(() => null);
    }
    await files.write(file, JSON.stringify(out));
    mark('kept');
    return reply(params, 200, {
      ...out, cached: false, timing: { ...timing, coldBrowser: cold, lite },
    });
  } catch (e) {
    browserP = null;
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
