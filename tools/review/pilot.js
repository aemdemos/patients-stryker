/*
 * The review extension pilot (the AOE team, extension/): what it does, whether it is installed in
 * this browser (and whether a newer version is out), how to install it, the download. One text for
 * the start page's pilot box and the review tool's Extension button. DOM only (no innerHTML).
 */
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
};

export const ZIP = './review-live-extension.zip';
export const ABOUT = 'A small browser extension (Chrome or Edge) lets the review tool show the real, clickable stryker.com page next to the migrated one (Compare with: Live), with Scroll Sync: menus, tabs and carousels work. Notes still go on the migrated page or the Screenshot.';

/** the installed version in this browser ('' when none), from the extension's mark on the page */
export const installed = () => document.documentElement.dataset.reviewLive || '';

/** the version on offer (the extension's manifest next to the download) */
export async function latest() {
  try {
    const r = await fetch('./extension/manifest.json', { cache: 'no-cache' });
    return r.ok ? (await r.json()).version || '' : '';
  } catch (e) {
    return '';
  }
}

const older = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
  }
  return false;
};

/** the state line: not installed, installed, or an update to install */
export function stateText(have, offer) {
  if (!have) return { text: 'Not installed in this browser.', state: 'off' };
  if (offer && older(have, offer)) return { text: `Installed: version ${have}; version ${offer} is out: download it and update (below).`, state: 'update' };
  return { text: `Installed in this browser (version ${have}): pick Live under Compare with.`, state: 'on' };
}

/** the install steps (a list) */
export const steps = () => el('ol', { class: 'pl-steps' }, ...[
  ['Download the zip (the button) and unzip it.'],
  ['Open ', el('code', {}, 'chrome://extensions'), ' (Edge: ', el('code', {}, 'edge://extensions'), ') and turn on Developer mode.'],
  ['Click Load unpacked and choose the unzipped folder.'],
  ['Reload the review tool: Live appears under Compare with.'],
].map((parts) => el('li', {}, ...parts)));

export const NOTE = 'It only lifts stryker.com\'s "don\'t show me inside other sites" rule when a review page shows it, and tells the tool where the page is scrolled to; it asks for no access to other sites. Updating: unzip the new version over the old folder, then Reload on the extension\'s card.';

/** the download button */
export const downloadButton = (cls = '') => el('a', {
  class: `pl-download ${cls}`.trim(), href: ZIP, download: '', title: 'review-live-extension.zip',
}, '⬇ Download the extension (zip)');
