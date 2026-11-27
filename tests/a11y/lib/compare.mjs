/**
 * Turns page results into a verdict (failures / warnings) and compares the
 * source and EDS results of each pair. Runs after all tests have finished
 * (from the keyboard reporter) by reading the per-page JSON files, so the
 * order in which pages ran does not matter.
 */
import fs from 'fs';
import path from 'path';

const KIND_LABEL = {
  menu: 'Menu',
  disclosure: 'Disclosure',
  accordion: 'Accordion',
  'hidden-submenu': 'Submenu',
  tabs: 'Tabs',
  carousel: 'Carousel',
  modal: 'Modal',
  'open-dialog': 'Dialog',
  field: 'Form field',
};

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const names = (list, n = 3) => list.slice(0, n).map((s) => `"${s.name || s.tag}"`).join(', ')
  + (list.length > n ? ` +${list.length - n} more` : '');

/** Failures and warnings for one page result. */
export function pageVerdict(r) {
  const failures = [];
  const warnings = [];
  const add = (severity, check, message, items) => {
    (severity === 'failure' ? failures : warnings).push({ check, message, ...(items ? { items } : {}) });
  };
  if (r.error) {
    add('failure', 'Page', `could not be tested: ${r.error}`);
    return { failures, warnings };
  }
  if (r.cookieBanner && r.cookieBanner.present) {
    if (!r.cookieBanner.dismissedByKeyboard) add('warning', 'Cookie banner', 'cannot be dismissed with the keyboard');
    if (r.cookieBanner.reachedAfterTabs === null) add('warning', 'Cookie banner', 'not reached within 15 Tab presses');
  }
  const t = r.tabOrder || {};
  (r.traps || []).forEach((trap) => {
    if (trap.failure) add('failure', 'Keyboard trap', `${trap.direction} ${trap.type} in ${trap.location}: ${names(trap.stops)}`, trap.stops);
    else add('warning', 'Keyboard trap', `open dialog holds focus (Escape releases it) in ${trap.location}`);
  });
  if (t.limitReached) add('warning', 'Tab order', `walk stopped after ${t.count} stops (maxTabs limit)`);
  if (r.reverse && !r.reverse.matches && !r.reverse.trap) {
    add('warning', 'Shift+Tab order', `differs from the Tab order at stop ${r.reverse.mismatch.index} (expected "${r.reverse.mismatch.expected}", got "${r.reverse.mismatch.actual}")`);
  }
  if (t.positiveTabindex && t.positiveTabindex.length) add('warning', 'Positive tabindex', `${t.positiveTabindex.length} element(s): ${names(t.positiveTabindex)}`, t.positiveTabindex);
  if (t.visualJumps && t.visualJumps.length) {
    add('warning', 'Visual order', `${t.visualJumps.length} jump(s) back up the page, first: "${t.visualJumps[0].from.name}" → "${t.visualJumps[0].to.name}" (${t.visualJumps[0].upPx}px)`, t.visualJumps);
  }
  const fv = r.focusVisible;
  if (fv && fv.missing.length) {
    add('failure', 'Visible focus', `no visible focus on ${fv.missing.length} of ${fv.checked} stops: ${names(fv.missing)}`, fv.missing);
  }
  if (r.skipLink && r.skipLink.status === 'missing') add('warning', 'Skip link', 'missing');
  if (r.skipLink && r.skipLink.status === 'broken') add('warning', 'Skip link', `broken: ${r.skipLink.reason}`);
  Object.values(r.components || {}).flat().forEach((c) => {
    Object.entries(c.keys).forEach(([key, k]) => {
      if (k.result !== 'fail') return;
      add(k.severity, `${KIND_LABEL[c.kind] || c.kind} "${c.name}"`, `${key}: ${k.note || 'fails'}`);
    });
  });
  if (r.guard && r.guard.navigations && r.guard.navigations.length) {
    add('warning', 'Navigation', `${r.guard.navigations.length} key press(es) navigated away; the page was reloaded`);
  }
  return { failures, warnings };
}

/** Flat list of comparable checks: id → { status, detail }. */
function checkMap(r) {
  const m = new Map();
  if (r.error) return m;
  const set = (id, status, detail) => m.set(id, { status, ...(detail ? { detail } : {}) });
  const t = r.tabOrder || {};
  set('Tab order completes', t.completed ? 'pass' : 'fail', `${t.count} stops`);
  const traps = (r.traps || []).filter((x) => x.failure);
  set('No keyboard traps', traps.length ? 'fail' : 'pass', traps.length ? traps.map((x) => x.location).join(', ') : undefined);
  if (r.reverse) set('Shift+Tab order matches Tab order', r.reverse.matches ? 'pass' : 'fail');
  if (r.focusVisible) {
    const fv = r.focusVisible;
    set('Visible focus', fv.missing.length ? 'fail' : 'pass', `${fv.missing.length} of ${fv.checked} stops without visible focus`);
  }
  set('No positive tabindex', t.positiveTabindex && t.positiveTabindex.length ? 'fail' : 'pass');
  set('Tab order follows the visual order', t.visualJumps && t.visualJumps.length ? 'fail' : 'pass', t.visualJumps ? `${t.visualJumps.length} jump(s)` : undefined);
  if (r.skipLink) set('Skip link', r.skipLink.status === 'works' ? 'pass' : 'fail', r.skipLink.status);
  if (r.cookieBanner && r.cookieBanner.present) set('Cookie banner dismissable by keyboard', r.cookieBanner.dismissedByKeyboard ? 'pass' : 'fail');
  Object.values(r.components || {}).flat().forEach((c) => {
    Object.entries(c.keys).forEach(([key, k]) => {
      if (k.result === 'n/a') return;
      set(`${KIND_LABEL[c.kind] || c.kind} "${norm(c.name)}" · ${key}`, k.result, k.note);
    });
  });
  return m;
}

const LABEL = {
  'pass>fail': 'Regression',
  'fail>pass': 'Improvement',
  'fail>fail': 'Both fail',
};

/** Compares the source and EDS results of one pair at one viewport. */
export function comparePair(source, eds) {
  const s = checkMap(source);
  const e = checkMap(eds);
  const differences = [];
  const onlySource = [];
  const onlyEds = [];
  new Set([...s.keys(), ...e.keys()]).forEach((id) => {
    const a = s.get(id);
    const b = e.get(id);
    if (a && b) {
      const label = LABEL[`${a.status}>${b.status}`];
      if (label) differences.push({ label, check: id, source: a, eds: b });
    } else if (a) onlySource.push({ check: id, ...a });
    else onlyEds.push({ check: id, ...b });
  });
  const order = ['Regression', 'Both fail', 'Improvement'];
  differences.sort((x, y) => order.indexOf(x.label) - order.indexOf(y.label));

  // tab stops matched by role + accessible name
  const bag = (r) => {
    const counts = new Map();
    ((r.tabOrder && r.tabOrder.stops) || []).forEach((st) => {
      const k = `${st.role}: ${norm(st.name) || st.tag}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return counts;
  };
  const sb = bag(source);
  const eb = bag(eds);
  const minus = (x, y) => [...x.entries()].flatMap(([k, n]) => Array(Math.max(0, n - (y.get(k) || 0))).fill(k));

  const escalations = [];
  if (source.skipLink && eds.skipLink && source.skipLink.status !== 'missing' && eds.skipLink.status === 'missing') {
    escalations.push({ check: 'Skip link', message: 'the source page has a skip link, the EDS page does not' });
  }
  return {
    schemaVersion: 1,
    pair: eds.pair,
    viewport: eds.viewport,
    sourceUrl: source.url,
    edsUrl: eds.url,
    tabStops: {
      source: source.tabOrder ? source.tabOrder.count : null,
      eds: eds.tabOrder ? eds.tabOrder.count : null,
      onlySource: minus(sb, eb),
      onlyEds: minus(eb, sb),
    },
    differences,
    onlySource,
    onlyEds,
    escalations,
  };
}

/** Counts for one page result (used by the terminal summary and the HTML report). */
export function pageStats(p) {
  const { failures, warnings } = pageVerdict(p);
  if (p.error) {
    return {
      error: p.error, failures: failures.length, warnings: warnings.length,
    };
  }
  const fv = p.focusVisible || { missing: [], checked: 0 };
  const comps = Object.values(p.components || {}).flat();
  const keys = comps.flatMap((c) => Object.values(c.keys));
  return {
    stops: p.tabOrder.count,
    complete: p.tabOrder.completed,
    traps: (p.traps || []).filter((t) => t.failure).length,
    noVisibleFocus: fv.missing.length,
    focusChecked: fv.checked,
    skipLink: p.skipLink ? p.skipLink.status : null,
    components: comps.length,
    keyChecksPassed: keys.filter((k) => k.result === 'pass').length,
    keyChecksFailed: keys.filter((k) => k.result === 'fail').length,
    failures: failures.length,
    warnings: warnings.length,
  };
}

/**
 * Reads the page results in `<runDir>/pages/` and writes one comparison per pair
 * and viewport to `<runDir>/compare/<name>__<viewport>.json`.
 */
export function compareResults(runDir) {
  const pagesDir = path.join(runDir, 'pages');
  const compareDir = path.join(runDir, 'compare');
  if (!fs.existsSync(pagesDir)) return { pages: [], comparisons: [] };
  const pages = fs.readdirSync(pagesDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(pagesDir, f), 'utf8')));
  const groups = new Map();
  pages.forEach((p) => {
    const k = `${p.pair}__${p.viewport}`;
    if (!groups.has(k)) groups.set(k, {});
    groups.get(k)[p.site] = p;
  });
  const comparisons = [];
  fs.mkdirSync(compareDir, { recursive: true });
  groups.forEach((g, k) => {
    if (!g.source || !g.eds || g.source.error || g.eds.error) return;
    const c = comparePair(g.source, g.eds);
    fs.writeFileSync(path.join(compareDir, `${k}.json`), `${JSON.stringify(c, null, 2)}\n`);
    comparisons.push(c);
  });
  return { pages, comparisons };
}
