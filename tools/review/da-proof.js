/*
 * The DA app proof (27 Nov 2026, branch da-app-v3): can the review tool, opened as a Document
 * Authoring app, know who is signed in from the Adobe sign-in alone? Checks, in order: opened in
 * DA (the SDK's hello, from da.live), where the app runs (DA's preview host or the published
 * site), who DA says is signed in, who Adobe says (the backend's whoami action asks Adobe IMS
 * with the token DA gave), that a faked sign-in is refused, and whether a migrated page loads in
 * a frame on the app's host and can be read (the tool's side by side needs that). Reads only.
 */
import { REVIEW } from './config.js';

const DA_SDK_URL = 'https://da.live/nx/utils/sdk.js';
const SITE = { org: 'strykerenterprise', site: 'stryker-com' };
// a migrated page to show in a frame (any published page of the review)
const SAMPLE_PAGE = '/us/en/about';

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
  let from = '';
  const seen = (e) => {
    if (e.data?.ready && e.ports?.length && !from) from = e.origin;
  };
  window.addEventListener('message', seen);
  try {
    const { default: sdk } = await import(DA_SDK_URL);
    const hello = await Promise.race([sdk, new Promise((r) => { setTimeout(() => r(null), ms); })]);
    return hello ? { ...hello, from } : null;
  } catch (e) {
    return null;
  } finally {
    window.removeEventListener('message', seen);
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

/** a migrated page in a frame on this host: loaded, and readable by the tool (same origin) */
function framePage() {
  return new Promise((resolve) => {
    const box = $('.dp-frame-box');
    const frame = $('.dp-frame');
    box.hidden = false;
    $('.dp-frame-label').textContent = `${SAMPLE_PAGE} on ${window.location.host}`;
    const timer = setTimeout(() => resolve({ loaded: false }), 20000);
    frame.addEventListener('load', () => {
      clearTimeout(timer);
      let title = '';
      let heading = '';
      let readable = false;
      try {
        const d = frame.contentDocument;
        title = d.title;
        heading = d.querySelector('h1')?.textContent?.trim() || '';
        readable = true;
      } catch (e) {
        readable = false;
      }
      resolve({
        loaded: true, readable, title, heading,
      });
    }, { once: true });
    frame.src = SAMPLE_PAGE;
  });
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
  if (/\.preview\.da\.live$/.test(host)) where = 'Document Authoring\'s preview of the site (DA content as it is now, for signed-in DA users)';
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

  const f = await framePage();
  if (!f.loaded) report('A migrated page in a frame on this host', false, `${SAMPLE_PAGE} did not load within 20 s.`);
  else if (!f.readable) report('A migrated page in a frame on this host', false, 'It loads, but the tool could not read it (another origin): side by side and Scroll Sync would not work.');
  else report('A migrated page in a frame on this host', !!(f.title || f.heading), `Loaded and readable: "${f.heading || f.title}". The tool's side by side and Scroll Sync can work here.`);
}

function copyText() {
  const lines = results.map((r) => `${{ true: '[ok]', false: '[FAILED]', null: '[info]' }[String(r.ok)]} ${r.title}${r.detail ? `: ${r.detail}` : ''}`);
  return [`DA app proof, ${new Date().toISOString()}, ${navigator.userAgent}`, ...lines].join('\n');
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
