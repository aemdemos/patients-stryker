/*
 * The daily source change check (pilot on Stage from 25 Nov 2026; backend README, "Source change
 * history"). Two checks, screenshots only for a confirmed change:
 * - every day, each source page's content fingerprint (lib/fingerprint.mjs), from one gentle
 *   lite load: every version of a part seen is known (variants), a part never seen counts only
 *   when a confirming load shows the same new content;
 * - once a week, spread out (each night about 1/7 of the pages, by a hash of the path), its
 *   visual fingerprint (a difference hash per screen of 900 px at 1440, moving things hidden):
 *   a look that differs from the last one counts only when a confirming load differs too.
 * (Not used: the site's CSS / JS versions as a trigger, 24 Nov 2026: a file changes with any
 * edit, even a comment, and says nothing about which pages look different.)
 * In Files:
 *   <space>/changes/scope.json            { pages: [{ page, source, template }] }: the pages checked
 *   <space>/changes/pages/<b64 page>.json { page, source, known: [part hashes seen], content:
 *        [the latest load's parts: key, text, images, links, embeds], look: { hash: [per
 *        screen], day }, day, misses, log: [{ day, at, result, diff, … }] }
 *   (a change or a variant logs its diff: per part, the text around the difference before and
 *   after, images / links / embeds added and removed)
 *   <space>/changes/site.json             { lastRun, runs }
 * A page's log results: baseline (the history starts: 3 loads, every version of a part seen is
 * known), unchanged, variant (a part seen once, not on the confirming load: dynamic, learned),
 * changed { parts, look, shot, unsteady, redirect, redirectEnded }, redirects { to } (the source
 * answers but sends visitors to another address: its own state, not a failure; a redirect that
 * starts, changes or ends is a change), unreachable { reason }, gone (3 days unreachable);
 * a day's line also says what the weekly visual check found (look: baseline | same | noise).
 * site.json also keeps `sources`: { redirects: { <page>: { to, since } }, unreachable: { <page>:
 * { reason, since, misses } } }, for the status page (no page records read there).
 */
export const pre = (space) => (!space || space === 'std' ? '' : `${space}/`);
export const scopeFile = (space) => `${pre(space)}changes/scope.json`;
export const pageFile = (space, page) => `${pre(space)}changes/pages/${Buffer.from(page).toString('base64url')}.json`;
export const siteFile = (space) => `${pre(space)}changes/site.json`;
export const checkLockFile = (space) => `${pre(space)}changes/lock.json`;
export const dayOf = (iso = new Date().toISOString()) => iso.slice(0, 10);
export const GONE_AFTER = 3;
// the visual check: a screen counts as different above this many bits of its 64 (the pilot:
// two loads of an unchanged page stay within it), or when the page's height changes by more
// than a screen
export const LOOK_BITS = 10;
export const LOOK_EVERY_DAYS = 7;

export async function readJson(files, name, fallback) {
  try {
    return JSON.parse((await files.read(name)).toString());
  } catch (e) {
    return fallback;
  }
}
export const writeJson = (files, name, value) => files.write(name, JSON.stringify(value));

export const readScope = (files, space) => readJson(files, scopeFile(space), { pages: [] });
export const readSite = (files, space) => readJson(files, siteFile(space), { runs: [] });
export const readPageState = (files, space, page) => readJson(files, pageFile(space, page), null);

/** a load's content as kept in the page's record (the latest only: what a change is diffed against) */
export const keptContent = (content) => content.parts.map((p) => ({
  key: p.key, text: p.text, images: p.images, links: p.links, embeds: p.embeds,
}));

/**
 * what changed, part by part (the parts by position): a short excerpt of the text around the
 * first difference, before and after; images, links and embeds added and removed
 */
export function contentDiff(before, after, keys) {
  if (!before) return null;
  const at = (list, key) => list.find((p) => p.key === key) || { text: '', images: [], links: [], embeds: [] };
  const sets = (a, b) => ({ added: b.filter((x) => !a.includes(x)).slice(0, 10), removed: a.filter((x) => !b.includes(x)).slice(0, 10) });
  return keys.map((key) => {
    const a = at(before, key);
    const b = at(after, key);
    const out = { key };
    if (a.text !== b.text) {
      let s = 0;
      while (s < a.text.length && a.text[s] === b.text[s]) s += 1;
      let ea = a.text.length;
      let eb = b.text.length;
      while (ea > s && eb > s && a.text[ea - 1] === b.text[eb - 1]) {
        ea -= 1;
        eb -= 1;
      }
      const from = Math.max(0, s - 60);
      out.text = { before: a.text.slice(from, Math.min(ea + 60, from + 300)), after: b.text.slice(from, Math.min(eb + 60, from + 300)) };
    }
    ['images', 'links', 'embeds'].forEach((f) => {
      const d = sets(a[f] || [], b[f] || []);
      if (d.added.length || d.removed.length) out[f] = d;
    });
    return out;
  });
}

/** a page's record and one load → the parts never seen */
export function differences(state, fp) {
  const known = new Set(state?.known || []);
  return { parts: fp.parts.filter((p) => !known.has(p.hash)) };
}

/**
 * the first load's new parts against a confirming load → confirmed: a part whose new content is
 * the same on both loads; unsteady: a part (same position) new on both loads but different each
 * time (changed, and moving)
 */
export function confirm(first, fp2, state) {
  const second = new Set(fp2.parts.map((p) => p.hash));
  const known = new Set(state?.known || []);
  const parts = first.parts.filter((p) => second.has(p.hash));
  const unsteady = first.parts.filter((p) => !second.has(p.hash)
    && fp2.parts.some((q) => q.key === p.key && !known.has(q.hash) && q.hash !== p.hash));
  return { parts, unsteady };
}

/** two visual fingerprints (a hash per screen) → whether the page looks different */
export function looksDifferent(a, b) {
  if (!a?.length || !b?.length) return false;
  if (Math.abs(a.length - b.length) > 1) return true;
  const bits = (x, y) => {
    let v = BigInt(`0x${x}`) ^ BigInt(`0x${y}`);
    let n = 0;
    while (v) {
      n += Number(v & 1n);
      v >>= 1n;
    }
    return n;
  };
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (bits(a[i], b[i]) > LOOK_BITS) return true;
  }
  return false;
}

/** whether a page's weekly visual check is due today: its night of the week (by its path), or a week since the last */
export function lookDue(state, page, today) {
  const dayNumber = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  if (state?.look?.day) return dayNumber - Math.floor(Date.parse(`${state.look.day}T00:00:00Z`) / 86400000) >= LOOK_EVERY_DAYS;
  let h = 0;
  for (const c of page) h = (h * 31 + c.charCodeAt(0)) % 1000003;
  return h % LOOK_EVERY_DAYS === dayNumber % LOOK_EVERY_DAYS;
}

/** a log line (one per day per page; the newest kept last) */
export function addLog(state, entry) {
  const log = (state.log || []).filter((l) => l.day !== entry.day || l.result === 'changed' || entry.result === 'changed');
  log.push(entry);
  return { ...state, log, day: entry.day };
}

/** a page's history for the tool: since when it is checked, the last check, every change */
export function historyOf(state) {
  if (!state) return null;
  const log = state.log || [];
  const last = log[log.length - 1] || null;
  return {
    since: log[0]?.day || null,
    last: last && { day: last.day, result: last.result, reason: last.reason || null },
    lookChecked: state.look?.day || null,
    redirect: state.redirect || null,
    redirectSince: state.redirect ? (log.find((l) => l.redirect === state.redirect)?.day || null) : null,
    changes: log.filter((l) => l.result === 'changed' || l.result === 'baseline').map((l) => ({
      day: l.day, at: l.at, result: l.result, parts: l.parts?.length || 0, look: !!l.look, shot: l.shot || null, unsteady: !!l.unsteady, redirect: l.redirect || null, redirectEnded: l.redirectEnded || null,
    })),
    unreachable: state.misses || 0,
    gone: last?.result === 'gone',
  };
}
