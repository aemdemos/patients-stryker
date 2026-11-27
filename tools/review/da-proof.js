/*
 * The DA app proof (27 Nov 2026, branch da-app-v3): can the review tool, opened as a Document
 * Authoring app, know who is signed in from the Adobe sign-in alone? Checks, in order: opened in
 * DA (the SDK's hello, from da.live), where the app runs (DA's preview host or the published
 * site), who DA says is signed in, who Adobe says (the backend's whoami action asks Adobe IMS
 * with the token DA gave), that a faked sign-in is refused, and whether a migrated page loads in
 * a frame on the app's host and can be read (the tool's side by side needs that). Reads only.
 */
import { REVIEW } from './config.js';

// DA's SDK: loaded by the page itself (a module script in da-proof.html, so it listens before the
// page's load event: DA says hello 750 ms after it, and an import started here later missed it on
// a first, uncached load; 27 Nov 2026); the import below gets that same copy
const DA_SDK_URL = 'https://da.live/nx/utils/sdk.js';

const SITE = { org: 'strykerenterprise', site: 'stryker-com' };
const PUBLISHED = `https://main--${SITE.site}--${SITE.org}.aem.live`;
// a migrated page to show in the frames: the first page of this host's index, else this one
const FALLBACK_PAGE = '/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d';
// where DA's hello came from (listening from the start, like the SDK)
let helloOrigin = '';
window.addEventListener('message', (e) => {
  if (e.data?.ready && e.ports?.length && !helloOrigin) helloOrigin = e.origin;
});

const $ = (s) => document.querySelector(s);
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat()
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
}

const results = [];
/** a check's line: ok (true), failed (false), information (null) */
function report(title, ok, detail = '') {
  results.push({ title, ok, detail });
  const mark = { true: '✓', false: '✗', null: 'i' }[String(ok)];
  $('.dp-checks').append(el(
    'li',
    { class: `dp-check dp-${{ true: 'ok', false: 'fail', null: 'info' }[String(ok)]}` },
    el('span', { class: 'dp-mark', 'aria-hidden': 'true' }, mark),
    el('span', {}, el('b', {}, title), detail ? el('span', { class: 'dp-detail' }, detail) : null),
  ));
}

/** the branch this copy runs from (…--stryker-com--strykerenterprise.<host>) */
const branch = () => (window.location.hostname.match(/^([a-z0-9-]+)--stryker-com--/) || [])[1] || 'main';
const daAppUrl = () => `https://da.live/app/${SITE.org}/${SITE.site}/tools/review/da-proof${branch() === 'main' ? '' : `?ref=${branch()}`}`;

/** the SDK's hello within the time given, and the origin it came from (null: not in DA) */
async function helloFromDa(ms) {
  try {
    const { default: sdk } = await import(DA_SDK_URL);
    const hello = await Promise.race([sdk, new Promise((r) => { setTimeout(() => r(null), ms); })]);
    // (the SDK resolves inside its own message listener, before ours has seen the same message)
    await new Promise((r) => { setTimeout(r, 0); });
    return hello ? { ...hello, from: helloOrigin } : null;
  } catch (e) {
    return null;
  }
}

async function whoami(token) {
  try {
    const resp = await fetch(`${REVIEW.backend}/whoami`, { headers: { authorization: `Bearer ${token}` } });
    return { status: resp.status, body: await resp.json().catch(() => ({})) };
  } catch (e) {
    return { status: 0, body: { error: { message: String(e.message || e) } } };
  }
}

/** a page of the site to show: the first of this host's index, else a known published page */
async function samplePage() {
  try {
    const r = await fetch('/us/en/query-index.json');
    const rows = r.ok ? (await r.json()).data || [] : [];
    const path = rows.find((x) => x.path && x.path !== '/us/en/search')?.path;
    if (path) return { path, from: 'the first page of this host\'s page index' };
  } catch (e) {
    // (no index on this host)
  }
  return { path: FALLBACK_PAGE, from: 'a known published page (this host has no page index)' };
}

/** what a same-origin page in a frame shows once decorated (up to 15 s): heading, text, 404 */
function readFrame(frame) {
  return new Promise((resolve) => {
    const started = Date.now();
    const look = () => {
      let d;
      try {
        d = frame.contentDocument;
      } catch (e) {
        resolve({ readable: false });
        return;
      }
      const main = d?.querySelector('main');
      const text = (main?.innerText || '').replace(/\s+/g, ' ').trim();
      const heading = d?.querySelector('main h1')?.textContent?.trim() || '';
      const missing = /not found/i.test(d?.title || '') || /^404/.test(text);
      if (missing || (heading && text.length > 200) || Date.now() - started > 15000) {
        resolve({
          readable: true,
          title: d?.title || '',
          heading,
          chars: text.length,
          missing,
          quirks: d?.compatMode === 'BackCompat',
        });
      } else setTimeout(look, 500);
    };
    look();
  });
}

/** the page in a frame on this host (readable by the tool?) and, beside it, the published page */
function framePage(path) {
  return new Promise((resolve) => {
    $('.dp-frame-box').hidden = false;
    $('.dp-frame-label').textContent = `${path}: left on ${window.location.host} (what the tool would show), right the published page on ${new URL(PUBLISHED).host} (to compare by eye)`;
    const [own, published] = document.querySelectorAll('.dp-frame');
    published.src = `${PUBLISHED}${path}`;
    const timer = setTimeout(() => resolve({ loaded: false }), 30000);
    own.addEventListener('load', async () => {
      clearTimeout(timer);
      resolve({ loaded: true, ...(await readFrame(own)) });
    }, { once: true });
    own.src = path;
  });
}

/** the results from before the move to the review host (carried in the address) */
function before() {
  try {
    const v = new URLSearchParams(window.location.hash.slice(1)).get('before');
    return v ? decodeURIComponent(escape(atob(v))) : '';
  } catch (e) {
    return '';
  }
}

function copyText() {
  const lines = results.map((r) => `${{ true: '[ok]', false: '[FAILED]', null: '[info]' }[String(r.ok)]} ${r.title}${r.detail ? `: ${r.detail}` : ''}`);
  const now = [`DA app proof, ${new Date().toISOString()}, ${window.location.host}, ${navigator.userAgent}`, ...lines].join('\n');
  return before() ? `${before()}\n\n--- after the move ---\n${now}` : now;
}

async function run() {
  const hello = await helloFromDa(8000);
  if (!hello) {
    report('Opened in Document Authoring', false, 'This page was opened on its own. Open it from Document Authoring instead:');
    $('.dp-checks').append(el('li', { class: 'dp-open' }, el('a', { href: daAppUrl(), target: '_top' }, daAppUrl())));
    return;
  }
  report('Opened in Document Authoring', true, `Hello received from ${hello.from || 'an unknown origin'}${hello.from === 'https://da.live' ? '' : ' (expected https://da.live)'}.`);
  const { context = {}, token, email } = hello;
  const { host } = window.location;
  let where = host;
  if (/\.aem\.page$/.test(host)) where = 'the review host (the branch preview, where the tool runs today): the app moved here and DA\'s hello came again';
  else if (/\.preview\.da\.live$/.test(host)) where = 'Document Authoring\'s preview of the site (DA content as it is now, for signed-in DA users)';
  else if (/\.aem\.live$/.test(host)) where = 'the published site (what is live)';
  report('Where the app runs', null, `${host}: ${where}. Site ${context.org}/${context.repo}, branch ${context.ref}.`);
  report('Document Authoring says you are', email ? null : false, email || 'No email in DA\'s hello.');
  if (!token) {
    report('An Adobe sign-in came with it', false, 'DA sent no token: are you signed in to Document Authoring?');
    return;
  }
  report('An Adobe sign-in came with it', true, 'DA gave the app your Adobe token (it stays in this page and goes to the review backend only).');

  const me = await whoami(token);
  if (me.status === 200) {
    const same = !email || me.body.email.toLowerCase() === email.toLowerCase();
    report('Adobe confirms who you are (checked by the review backend)', same, `${me.body.name ? `${me.body.name}, ` : ''}${me.body.email}${me.body.expiresAt ? ` · this sign-in valid until ${new Date(me.body.expiresAt).toLocaleString()}` : ''}${same ? '' : ` (DA said ${email})`}`);
  } else {
    report('Adobe confirms who you are (checked by the review backend)', false, `${me.status || 'no answer'}: ${me.body?.error?.message || ''}`);
  }
  // a faked sign-in: the same token with its signature changed
  const parts = token.split('.');
  const sig = parts[2] || '';
  const faked = [parts[0], parts[1], `${sig.slice(0, -4)}${sig.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`].join('.');
  const fake = await whoami(faked);
  report('A faked sign-in is refused', fake.status === 401, fake.status === 401 ? 'Adobe refused a copy of your token with a changed signature.' : `Answer ${fake.status}: expected 401.`);
  const none = await whoami('');
  report('No sign-in is refused', none.status === 401, none.status === 401 ? 'Refused.' : `Answer ${none.status}: expected 401.`);

  const sample = await samplePage();
  const f = await framePage(sample.path);
  const what = `${sample.path} (${sample.from})`;
  if (!f.loaded) report('A migrated page in a frame on this host', false, `${what} did not load within 30 s.`);
  else if (!f.readable) report('A migrated page in a frame on this host', false, `${what} loads, but the tool cannot read it (another origin): side by side and Scroll Sync would not work.`);
  else if (f.missing) report('A migrated page in a frame on this host', false, `${what}: this host answers "page not found" (${f.title}).`);
  else if (!f.heading || f.chars < 200) report('A migrated page in a frame on this host', false, `${what} loads and can be read, but shows almost nothing: heading "${f.heading}", ${f.chars} characters of text.`);
  else report('A migrated page in a frame on this host', true, `${what} loads and the tool can read it: heading "${f.heading}", ${f.chars} characters of text. Below, compare it with the published page.`);
  if (f.readable && !f.missing) {
    report('The page renders in standards mode', !f.quirks, f.quirks
      ? 'No: this host serves the page without a doctype, so the browser uses quirks mode (lines with mixed text sizes come out shorter than on the real page, with the same computed line height).'
      : 'Yes: it has a doctype, like the real page.');
  }
  // DA's preview host: move the app to the review host (DA says hello again after every load
  // of the app's frame), where the tool runs today and its pages are the real ones
  if (!/\.aem\.page$/.test(host)) {
    const target = `https://${branch()}--${SITE.site}--${SITE.org}.aem.page/tools/review/da-proof.html#before=${encodeURIComponent(btoa(unescape(encodeURIComponent(copyText()))))}`;
    $('.dp-checks').append(el(
      'li',
      { class: 'dp-hop' },
      el('p', {}, el('b', {}, 'Last step: '), 'the tool would move itself to the review host, where its pages are the real ones. Copy the results above first if you like, then:'),
      el('button', { type: 'button', class: 'dp-copy', onclick: () => window.location.assign(target) }, 'Continue on the review host'),
    ));
  }
}

run().finally(() => {
  const btn = $('.dp-copy');
  btn.disabled = false;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyText());
      $('.dp-copied').textContent = 'Copied: paste it into the chat.';
    } catch (e) {
      $('.dp-copied').textContent = 'Copying is not allowed here: select the list and copy it.';
    }
  });
});
