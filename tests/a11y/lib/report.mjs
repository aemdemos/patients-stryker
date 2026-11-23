/**
 * Builds report.html for one keyboard run from its JSON files (run.json,
 * pages/*.json, compare/*.json). The report is a single file: inline CSS, no
 * scripts, no outside requests; expandable sections use <details>.
 */
import fs from 'fs';
import path from 'path';
import { pageVerdict, pageStats } from './compare.mjs';
import { readJson } from './run-store.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const link = (url) => (url ? `<a href="${esc(url)}">${esc(url)}</a>` : '—');
const anchor = (s) => `pair-${String(s).replace(/[^a-z0-9-]/gi, '-')}`;
const fmtDuration = (ms) => (ms == null ? '—' : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`);

const CSS = `
:root { color-scheme: light; --ok: #0a6b2d; --bad: #b00020; --warn: #8a5a00; --muted: #555; --line: #d0d0d0; }
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; background: #fff; }
main { max-width: 1200px; margin: 0 auto; padding: 24px; }
h1 { font-size: 1.6rem; margin: 0 0 4px; }
h2 { font-size: 1.3rem; margin: 40px 0 8px; border-bottom: 2px solid #1a1a1a; padding-bottom: 4px; }
h3 { font-size: 1.05rem; margin: 20px 0 6px; }
a { color: #0047b3; overflow-wrap: anywhere; }
a:focus-visible, summary:focus-visible { outline: 3px solid #0047b3; outline-offset: 2px; }
.muted { color: var(--muted); }
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 2px 16px; margin: 12px 0 0; }
.meta dt { font-weight: 600; }
.meta dd { margin: 0; overflow-wrap: anywhere; }
.totals { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; padding: 0; list-style: none; }
.totals li { border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; min-width: 130px; }
.totals strong { display: block; font-size: 1.5rem; }
table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; font-size: 0.95rem; }
th, td { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f2f2f2; }
td.num { text-align: right; white-space: nowrap; }
.badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; border: 1px solid currentcolor; white-space: nowrap; }
.pass { color: var(--ok); }
.fail { color: var(--bad); }
.warn { color: var(--warn); }
.na { color: var(--muted); }
details { border: 1px solid var(--line); border-radius: 6px; margin: 10px 0; padding: 0 12px; }
details[open] { padding-bottom: 12px; }
summary { cursor: pointer; padding: 10px 0; font-weight: 600; }
ul.findings { margin: 4px 0 12px; padding-left: 20px; }
.urls { margin: 4px 0 12px; }
footer { margin-top: 48px; font-size: 0.9rem; }
`;

function badge(state) {
  const map = {
    pass: ['pass', 'Pass'], fail: ['fail', 'Fail'], error: ['fail', 'Error'], tested: ['na', 'Tested'], 'not tested': ['na', 'Not tested'],
  };
  const [cls, text] = map[state] || ['na', state];
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

function siteRow(label, page) {
  if (!page) return `<tr><th scope="row">${esc(label)}</th><td colspan="8" class="na">Not tested</td></tr>`;
  const s = pageStats(page);
  if (s.error) return `<tr><th scope="row">${esc(label)}</th><td colspan="8" class="fail">Could not be tested: ${esc(s.error)}</td></tr>`;
  return `<tr><th scope="row">${esc(label)}</th>
    <td class="num">${s.stops}${s.complete ? '' : ' (incomplete)'}</td>
    <td class="num">${s.traps}</td>
    <td class="num">${s.noVisibleFocus} of ${s.focusChecked}</td>
    <td>${esc(s.skipLink || '—')}</td>
    <td class="num">${s.components}</td>
    <td class="num">${s.keyChecksPassed} pass / ${s.keyChecksFailed} fail</td>
    <td class="num">${s.failures}</td>
    <td class="num">${s.warnings}</td></tr>`;
}

function findingsList(items, cls) {
  if (!items.length) return '<p class="muted">None.</p>';
  return `<ul class="findings">${items.map((f) => `<li class="${cls}"><strong>${esc(f.check)}:</strong> ${esc(f.message)}${
    // the message already names up to 3 elements; list them all only when there are more
    f.items && f.items.length > 3 ? `<br><span class="muted">All: ${esc(f.items.slice(0, 12).map((i) => i.name || i.tag || (i.from && `${i.from.name} → ${i.to.name}`) || '').filter(Boolean).join(' · '))}${f.items.length > 12 ? ` … +${f.items.length - 12} more` : ''}</span>` : ''
  }</li>`).join('')}</ul>`;
}

const statusCell = (x) => `<span class="${x.status === 'pass' ? 'pass' : 'fail'}">${esc(x.status)}</span>${x.detail ? ` <span class="muted">— ${esc(x.detail)}</span>` : ''}`;

function viewportSection(pair, viewport, source, eds, compare) {
  const edsStats = eds ? pageStats(eds) : null;
  let edsState = 'not tested';
  if (edsStats) {
    if (edsStats.error) edsState = 'error';
    else edsState = edsStats.failures ? 'fail' : 'pass';
  }
  const counts = compare ? {
    regressions: compare.differences.filter((d) => d.label === 'Regression').length,
    improvements: compare.differences.filter((d) => d.label === 'Improvement').length,
    both: compare.differences.filter((d) => d.label === 'Both fail').length,
  } : null;
  const summaryText = [
    `${viewport}`,
    `EDS ${edsState}`,
    edsStats && !edsStats.error ? `${edsStats.failures} failure(s)` : null,
    counts ? `${counts.regressions} regression(s), ${counts.improvements} improvement(s), ${counts.both} both fail` : null,
  ].filter(Boolean).join(' · ');

  const edsVerdict = eds ? pageVerdict(eds) : { failures: [], warnings: [] };
  const sourceVerdict = source ? pageVerdict(source) : { failures: [], warnings: [] };
  const parts = [];
  parts.push(`<table><caption class="muted">Summary per site</caption><thead><tr>
    <th scope="col">Site</th><th scope="col">Tab stops</th><th scope="col">Traps</th><th scope="col">No visible focus</th>
    <th scope="col">Skip link</th><th scope="col">Components</th><th scope="col">Key checks</th>
    <th scope="col">Failures</th><th scope="col">Warnings</th></tr></thead>
    <tbody>${siteRow('Source', source)}${siteRow('EDS', eds)}</tbody></table>`);
  parts.push(`<h3>EDS failures</h3>${findingsList(edsVerdict.failures, 'fail')}`);
  if (compare && compare.escalations.length) {
    parts.push(`<h3>Failures from the comparison</h3>${findingsList(compare.escalations, 'fail')}`);
  }
  if (compare) {
    parts.push('<h3>Differences between source and EDS</h3>');
    parts.push(compare.differences.length
      ? `<table><thead><tr><th scope="col">Label</th><th scope="col">Check</th><th scope="col">Source</th><th scope="col">EDS</th></tr></thead><tbody>${
        compare.differences.map((d) => `<tr><td class="${d.label === 'Improvement' ? 'pass' : 'fail'}">${esc(d.label)}</td><td>${esc(d.check)}</td><td>${statusCell(d.source)}</td><td>${statusCell(d.eds)}</td></tr>`).join('')
      }</tbody></table>`
      : '<p class="muted">No differences in the checks found on both sites.</p>');
    const oneSite = (list) => (list.length
      ? `<ul class="findings">${list.map((x) => `<li>${esc(x.check)}: <span class="${x.status === 'pass' ? 'pass' : 'fail'}">${esc(x.status)}</span>${x.detail ? ` <span class="muted">— ${esc(x.detail)}</span>` : ''}</li>`).join('')}</ul>`
      : '<p class="muted">None.</p>');
    parts.push(`<details><summary>Checks found on one site only (source ${compare.onlySource.length}, EDS ${compare.onlyEds.length})</summary>
      <h4>Only on source</h4>${oneSite(compare.onlySource)}<h4>Only on EDS</h4>${oneSite(compare.onlyEds)}</details>`);
    const stops = (list) => (list.length ? `<ul class="findings">${list.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '<p class="muted">None.</p>');
    parts.push(`<details><summary>Tab stops found on one site only (source ${compare.tabStops.onlySource.length}, EDS ${compare.tabStops.onlyEds.length})</summary>
      <h4>Only on source</h4>${stops(compare.tabStops.onlySource)}<h4>Only on EDS</h4>${stops(compare.tabStops.onlyEds)}</details>`);
  }
  parts.push(`<details><summary>EDS warnings (${edsVerdict.warnings.length})</summary>${findingsList(edsVerdict.warnings, 'warn')}</details>`);
  if (source) {
    parts.push(`<details><summary>Source issues, for information (${sourceVerdict.failures.length} failure-level, ${sourceVerdict.warnings.length} warnings)</summary>
      ${findingsList(sourceVerdict.failures, 'fail')}${findingsList(sourceVerdict.warnings, 'warn')}</details>`);
  }
  const files = [
    source && `pages/${pair}__${viewport}__source.json`,
    eds && `pages/${pair}__${viewport}__eds.json`,
    compare && `compare/${pair}__${viewport}.json`,
  ].filter(Boolean);
  parts.push(`<p class="muted">Full data: ${files.map((f) => `<a href="${esc(f)}">${esc(f)}</a>`).join(' · ')}</p>`);

  return `<details${edsState === 'fail' || edsState === 'error' ? ' open' : ''}><summary>${esc(summaryText)}</summary>${parts.join('\n')}</details>`;
}

/** Writes <runDir>/report.html and returns its path. */
export default function buildReport(runDir) {
  const run = readJson(path.join(runDir, 'run.json'));
  if (!run) throw new Error(`run.json not found in ${runDir}`);
  const pagesDir = path.join(runDir, 'pages');
  const pages = fs.existsSync(pagesDir)
    ? fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(pagesDir, f))).filter(Boolean)
    : [];
  const page = (pair, viewport, site) => pages.find((p) => p.pair === pair && p.viewport === viewport && p.site === site) || null;
  const compareOf = (pair, viewport) => readJson(path.join(runDir, 'compare', `${pair}__${viewport}.json`));
  const viewports = run.options.viewports;
  const t = run.totals || {};

  const rows = [];
  const sections = [];
  run.pairs.forEach((pair) => {
    const vpSections = [];
    viewports.forEach((vp) => {
      const source = page(pair.name, vp, 'source');
      const eds = page(pair.name, vp, 'eds');
      const compare = compareOf(pair.name, vp);
      const edsStats = eds ? pageStats(eds) : null;
      let edsState = 'not tested';
      if (edsStats) edsState = edsStats.error ? 'error' : (edsStats.failures ? 'fail' : 'pass');
      const count = (label) => (compare ? compare.differences.filter((d) => d.label === label).length : '—');
      rows.push(`<tr>
        <th scope="row"><a href="#${anchor(pair.name)}">${esc(pair.name)}</a></th>
        <td>${esc(vp)}</td>
        <td>${badge(edsState)}${compare && compare.escalations.length ? ' <span class="fail">+ comparison failure</span>' : ''}</td>
        <td class="num">${edsStats && !edsStats.error ? edsStats.failures : '—'}</td>
        <td class="num">${count('Regression')}</td>
        <td class="num">${count('Improvement')}</td>
        <td class="num">${count('Both fail')}</td>
        <td>${source ? (source.error ? badge('error') : badge('tested')) : badge('not tested')}</td></tr>`);
      vpSections.push(viewportSection(pair.name, vp, source, eds, compare));
    });
    sections.push(`<section aria-labelledby="${anchor(pair.name)}">
      <h2 id="${anchor(pair.name)}">${esc(pair.name)}</h2>
      <dl class="meta urls"><dt>Source</dt><dd>${link(pair.source)}</dd><dt>EDS</dt><dd>${link(pair.eds)}</dd></dl>
      ${vpSections.join('\n')}</section>`);
  });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keyboard accessibility report — ${esc(run.label)} — ${esc(run.startedAt)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
<h1>Keyboard accessibility report</h1>
<p class="muted">Source pages compared with their EDS pages, tested with the keyboard.</p>
<dl class="meta">
  <dt>Run</dt><dd>${esc(run.runId)}</dd>
  <dt>Status</dt><dd>${badge(run.status === 'passed' ? 'pass' : (run.status === 'failed' ? 'fail' : run.status))}</dd>
  <dt>Started</dt><dd>${esc(run.startedAt)}</dd>
  <dt>Duration</dt><dd>${esc(fmtDuration(run.durationMs))}</dd>
  <dt>Git</dt><dd>${esc(run.git.branch || '—')} @ ${esc(run.git.commit || '—')}</dd>
  <dt>Viewports</dt><dd>${esc(viewports.join(', '))}</dd>
  <dt>Workers</dt><dd>${esc(run.options.workers)}</dd>
  ${run.options.csv ? `<dt>CSV</dt><dd>${esc(run.options.csv)}</dd>` : ''}
  <dt>Command</dt><dd><code>${esc(run.command)}</code></dd>
</dl>
<ul class="totals" aria-label="Totals">
  <li><strong>${esc(t.pairs ?? run.pairs.length)}</strong>pairs</li>
  <li><strong>${esc(t.pages ?? pages.length)}</strong>pages tested</li>
  <li><strong class="${t.edsFailed ? 'fail' : 'pass'}">${esc(t.edsFailed ?? '—')}</strong>EDS results failing</li>
  <li><strong class="${t.regressions ? 'fail' : ''}">${esc(t.regressions ?? '—')}</strong>regressions</li>
  <li><strong class="${t.improvements ? 'pass' : ''}">${esc(t.improvements ?? '—')}</strong>improvements</li>
  <li><strong>${esc(t.bothFail ?? '—')}</strong>both fail</li>
  <li><strong class="${t.errors ? 'fail' : ''}">${esc(t.errors ?? 0)}</strong>pages not testable</li>
</ul>
<h2 id="overview">Overview</h2>
<table>
<thead><tr><th scope="col">Pair</th><th scope="col">Viewport</th><th scope="col">EDS result</th><th scope="col">EDS failures</th>
<th scope="col">Regressions</th><th scope="col">Improvements</th><th scope="col">Both fail</th><th scope="col">Source</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>
<p class="muted"><strong>Regression</strong>: passes on source, fails on EDS. <strong>Improvement</strong>: fails on source, passes on EDS.
<strong>Both fail</strong>: fails on both. Source results are for information only; an EDS page fails on a keyboard trap,
no visible focus, a component that does not respond to its keys, or a missing skip link when the source has one.</p>
${sections.join('\n')}
<footer class="muted">
<p>Result format version ${esc(run.schemaVersion)} (tests/a11y/RESULTS.md). Checks, pass/fail rules and limits:
README.md, section "Keyboard tests (source page vs EDS page)". Automated checks do not replace a manual review
of focus contrast, tab order logic and screen reader output.</p>
</footer>
</main>
</body>
</html>
`;
  const file = path.join(runDir, 'report.html');
  fs.writeFileSync(file, html);
  return file;
}
