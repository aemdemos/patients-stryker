/*
 * The review's sign-in (start.html, branch da-app-v3, 27 Nov 2026), opened as a Document
 * Authoring app: https://da.live/app/strykerenterprise/stryker-com/tools/review/start
 * [?ref=<branch>][&next=<a page of the tool>]. DA signs the person in with Adobe and says hello
 * with their Adobe token (DA's SDK, a module script of the page: it listens before the load
 * event, after which DA says hello); the backend (`signin`) checks it with Adobe and, for a person
 * of the review, gives a review session. "Open the review" (a click: browsers let a frame take
 * over the whole window only on one) opens the tool in the whole window on the person's host:
 * the AOE team on the branch preview (*.aem.page: preview content, unpublished pages too, with
 * Sidekick signed in), reviewers on the published site (*.aem.live: what is live), with the
 * session in the address's hash (store.js keeps it and takes it out of the address).
 */
import { REVIEW } from './config.js';

const DA_SDK_URL = 'https://da.live/nx/utils/sdk.js';
const SITE = { org: 'strykerenterprise', site: 'stryker-com' };
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

const params = new URLSearchParams(window.location.search);
// the page to open: one of the tool's (else its start page)
const asked = params.get('next') || '';
const next = /^\/tools\/review\/[a-z-]+(\.html)?(\?[^#]*)?$/.test(asked) ? asked : '/tools/review/launch.html';

/** the branch: DA's (context.ref), else this host's */
const branchOf = (ctx) => ctx?.ref || (window.location.hostname.match(/^([a-z0-9-]+)--/) || [])[1] || 'main';

/** the person's host: the AOE team on the branch preview, reviewers on the published site */
function hostFor(role, ref) {
  if (ref === 'local') return 'http://localhost:3000';
  return `https://${ref}--${SITE.site}--${SITE.org}.aem.${role === 'aoe' ? 'page' : 'live'}`;
}

function show(state, detail = '', actions = []) {
  $('.sg-state').textContent = state;
  $('.sg-detail').textContent = detail;
  $('.sg-actions').replaceChildren(...actions);
}

/** DA's hello within the time given (null: not in DA) */
async function helloFromDa(ms) {
  try {
    const { default: sdk } = await import(DA_SDK_URL);
    return await Promise.race([sdk, new Promise((r) => { setTimeout(() => r(null), ms); })]);
  } catch (e) {
    return null;
  }
}

async function run() {
  const hello = await helloFromDa(8000);
  if (!hello) {
    const ref = branchOf(null);
    const da = `https://da.live/app/${SITE.org}/${SITE.site}/tools/review/start?${new URLSearchParams({ ...(ref === 'main' ? {} : { ref }), next })}`;
    show('Sign in through Document Authoring', 'The review opens from its address in Document Authoring, which signs you in with your Adobe account.', [
      el('a', { class: 'sg-btn', href: da, target: '_top' }, 'Sign in'),
    ]);
    return;
  }
  if (!hello.token) {
    show('No Adobe sign-in came from Document Authoring', 'Sign in to Document Authoring, then open this page again.');
    return;
  }
  let resp;
  let body = null;
  try {
    resp = await fetch(`${REVIEW.backend}/signin?space=${encodeURIComponent(REVIEW.space)}`, { headers: { authorization: `Bearer ${hello.token}` } });
    body = await resp.json().catch(() => null);
  } catch (e) {
    show('The review could not be reached', 'Try again in a moment.', [el('button', { type: 'button', class: 'sg-btn', onclick: () => window.location.reload() }, 'Try again')]);
    return;
  }
  if (resp.status === 403 && body?.error?.code === 'not-in-review') {
    show(`You're signed in as ${body.email}`, 'This email isn\'t part of the review. Ask the AOE team to add it, or sign in to Document Authoring with the account they invited.');
    return;
  }
  if (resp.status !== 200) {
    show('You could not be signed in', body?.error?.message || `The review answered ${resp.status}.`);
    return;
  }
  const ref = branchOf(hello.context);
  const target = `${hostFor(body.role, ref)}${next}#session=${encodeURIComponent(body.session)}`;
  const role = body.role === 'aoe' ? 'AOE team' : 'Reviewer';
  show(
    `Signed in as ${body.name}`,
    `${body.email} · ${role} · for 12 hours, until ${new Date(body.expires).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.${body.role === 'aoe' ? ' The review opens on the branch preview: Sidekick must be signed in to the site.' : ''}`,
    [el('button', {
      type: 'button',
      class: 'sg-btn sg-open',
      onclick: () => window.open(target, '_top'),
    }, 'Open the review')],
  );
  $('.sg-open').focus();
}

run();
