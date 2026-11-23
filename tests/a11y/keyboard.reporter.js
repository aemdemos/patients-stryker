import path from 'path';
import { compareResults, pageVerdict, pageStats } from './lib/compare.mjs';
import {
  readJson, writeJson, updateIndex, isoLocal,
} from './lib/run-store.mjs';
import buildReport from './lib/report.mjs';

/**
 * Keyboard test reporter: prints each page as it finishes, then (once every
 * test has finished) the result per page and the source vs EDS differences.
 *
 * With a run folder (A11Y_KBD_RUN_DIR, set by run-keyboard.js) it also writes the
 * comparison files, the totals and status in run.json, index.json / latest.json
 * and report.html. Fails the run when the comparison finds a failure that a single
 * page cannot know about (e.g. a skip link on the source page but not on EDS).
 */
const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;
const rel = (p) => path.relative(process.cwd(), p) || p;

function pageLine(p) {
  const s = pageStats(p);
  if (s.error) return `error: ${s.error}`;
  return [
    `${s.stops} stops${s.complete ? '' : ' (incomplete)'}`,
    `traps ${s.traps}`,
    `no visible focus ${s.noVisibleFocus}/${s.focusChecked}`,
    `skip link ${s.skipLink || '-'}`,
    `components ${s.components} (${s.keyChecksPassed} key checks pass, ${s.keyChecksFailed} fail)`,
    `${s.failures} failure(s), ${s.warnings} warning(s)`,
  ].join(' · ');
}

/** Totals and one result row per pair and viewport, stored in run.json. */
function summarise(run, pages, comparisons) {
  const results = [];
  run.pairs.forEach((pair) => run.options.viewports.forEach((viewport) => {
    const find = (site) => pages.find((p) => p.pair === pair.name && p.viewport === viewport && p.site === site);
    const source = find('source');
    const eds = find('eds');
    const c = comparisons.find((x) => x.pair === pair.name && x.viewport === viewport);
    const count = (label) => (c ? c.differences.filter((d) => d.label === label).length : null);
    let edsResult = 'not tested';
    if (eds) edsResult = eds.error ? 'error' : (pageVerdict(eds).failures.length || (c && c.escalations.length) ? 'fail' : 'pass');
    let sourceResult = 'not tested';
    if (source) sourceResult = source.error ? 'error' : 'tested';
    results.push({
      pair: pair.name,
      viewport,
      eds: edsResult,
      source: sourceResult,
      edsFailures: eds && !eds.error ? pageVerdict(eds).failures.length + (c ? c.escalations.length : 0) : null,
      regressions: count('Regression'),
      improvements: count('Improvement'),
      bothFail: count('Both fail'),
      files: {
        source: source ? `pages/${pair.name}__${viewport}__source.json` : null,
        eds: eds ? `pages/${pair.name}__${viewport}__eds.json` : null,
        compare: c ? `compare/${pair.name}__${viewport}.json` : null,
      },
    });
  }));
  const sum = (k) => results.reduce((n, r) => n + (r[k] || 0), 0);
  const totals = {
    pairs: run.pairs.length,
    pages: pages.length,
    errors: pages.filter((p) => p.error).length,
    edsFailed: results.filter((r) => r.eds === 'fail' || r.eds === 'error').length,
    regressions: sum('regressions'),
    improvements: sum('improvements'),
    bothFail: sum('bothFail'),
  };
  return { results, totals };
}

class KeyboardReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.runDir = process.env.A11Y_KBD_RUN_DIR || null;
    this.dir = this.runDir || path.resolve('test-results/keyboard');
  }

  printsToStdio() {
    return true;
  }

  onBegin(config, suite) {
    this.started = Date.now();
    if (!this.runDir) {
      const project = config.projects.find((p) => p.name === 'keyboard');
      if (project) this.dir = project.outputDir;
    }
    const n = suite.allTests().length;
    console.log(`\nKeyboard tests: ${n} page test(s) (each page × site × viewport), ${config.workers} worker(s)`);
    console.log(`Run folder: ${rel(this.dir)}`);
    console.log('Options and docs: npm run test:a11y:keyboard -- --help\n');
  }

  onTestEnd(test, result) {
    const mark = result.status === 'passed' ? '✓' : '✘';
    if (result.status === 'passed') this.passed += 1;
    else this.failed += 1;
    console.log(`  ${mark}  ${test.title}  (${fmt(result.duration)})`);
    if (result.status !== 'passed') {
      result.errors.forEach((error) => {
        const message = (error.message || '').split('\n')[0].trim();
        if (message) console.log(`     ${message}`);
      });
    }
  }

  onEnd(fullResult) {
    const { pages, comparisons } = compareResults(this.dir);
    const byGroup = new Map();
    pages.forEach((p) => {
      const k = `${p.pair} › ${p.viewport}`;
      if (!byGroup.has(k)) byGroup.set(k, []);
      byGroup.get(k).push(p);
    });
    let escalated = 0;
    const urls = new Map();
    pages.forEach((p) => {
      if (!urls.has(p.pair)) urls.set(p.pair, {});
      urls.get(p.pair)[p.site] = p.url;
    });
    console.log('\nPages tested');
    urls.forEach((u, name) => {
      console.log(`  ${name}`);
      if (u.source) console.log(`    source  ${u.source}`);
      if (u.eds) console.log(`    eds     ${u.eds}`);
    });
    byGroup.forEach((list, k) => {
      console.log(`\n${k}`);
      list.sort((a, b) => a.site.localeCompare(b.site)).reverse().forEach((p) => {
        console.log(`  ${p.site.padEnd(6)} ${pageLine(p)}`);
        if (p.site === 'eds') {
          pageVerdict(p).failures.forEach((f) => console.log(`         ✘ ${f.check}: ${f.message}`));
        }
      });
      const c = comparisons.find((x) => `${x.pair} › ${x.viewport}` === k);
      if (!c) return;
      c.escalations.forEach((e) => {
        escalated += 1;
        console.log(`         ✘ ${e.check}: ${e.message}`);
      });
      console.log(`  tab stops: source ${c.tabStops.source}, eds ${c.tabStops.eds}`
        + ` (only on source: ${c.tabStops.onlySource.length}, only on eds: ${c.tabStops.onlyEds.length})`);
      if (!c.differences.length) console.log('  no differences in shared checks');
      c.differences.forEach((d) => {
        const detail = d.eds.detail || d.source.detail;
        console.log(`  ${d.label.padEnd(11)} ${d.check}${detail ? ` — ${detail}` : ''}`);
      });
      const failingOnly = (list2) => list2.filter((x) => x.status === 'fail').length;
      if (c.onlySource.length || c.onlyEds.length) {
        console.log(`  only on source: ${c.onlySource.length} check(s), ${failingOnly(c.onlySource)} failing;`
          + ` only on eds: ${c.onlyEds.length} check(s), ${failingOnly(c.onlyEds)} failing`);
      }
    });

    const failed = this.failed > 0 || escalated > 0;
    console.log('');
    if (this.runDir) {
      const runFile = path.join(this.runDir, 'run.json');
      const run = readJson(runFile);
      if (run) {
        const { results, totals } = summarise(run, pages, comparisons);
        const status = fullResult.status === 'interrupted' || fullResult.status === 'timedout'
          ? 'interrupted'
          : (failed ? 'failed' : 'passed');
        Object.assign(run, {
          status,
          finishedAt: isoLocal(),
          durationMs: Date.now() - this.started,
          totals,
          results,
          report: 'report.html',
        });
        writeJson(runFile, run);
        try {
          const report = buildReport(this.runDir);
          console.log(`Report:     ${rel(report)}`);
        } catch (e) {
          run.report = null;
          writeJson(runFile, run);
          console.log(`Report could not be built: ${e.message}`);
        }
        updateIndex(path.dirname(this.runDir), run);
      }
      console.log(`Run folder: ${rel(this.runDir)} (run.json, pages/, compare/)`);
    } else {
      console.log(`Result files (JSON): ${rel(this.dir)} (temporary: use npm run test:a11y:keyboard to keep results)`);
    }
    const total = this.failed + escalated;
    console.log(`${total ? `${this.failed} failed${escalated ? ` (+${escalated} from comparison)` : ''}, ` : ''}${this.passed} passed in ${fmt(Date.now() - this.started)}`);
    return escalated ? { status: 'failed' } : undefined;
  }
}

export default KeyboardReporter;
