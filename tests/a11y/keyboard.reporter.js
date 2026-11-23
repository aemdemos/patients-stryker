import path from 'path';
import { compareResults, pageVerdict } from './lib/compare.js';

/**
 * Keyboard test reporter: prints each page as it finishes, then (once every
 * test has finished) the result per page and the source vs EDS differences.
 * Fails the run when the comparison finds a failure that a single page cannot
 * know about (e.g. skip link on the source page but not on EDS).
 */
const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;

function pageLine(p) {
  if (p.error) return `error: ${p.error}`;
  const { failures, warnings } = pageVerdict(p);
  const fv = p.focusVisible || { missing: [], checked: 0 };
  const comps = Object.values(p.components || {}).flat();
  const keyResults = comps.flatMap((c) => Object.values(c.keys));
  const pass = keyResults.filter((k) => k.result === 'pass').length;
  const fail = keyResults.filter((k) => k.result === 'fail').length;
  return [
    `${p.tabOrder.count} stops${p.tabOrder.completed ? '' : ' (incomplete)'}`,
    `traps ${(p.traps || []).filter((t) => t.failure).length}`,
    `no visible focus ${fv.missing.length}/${fv.checked}`,
    `skip link ${p.skipLink ? p.skipLink.status : '-'}`,
    `components ${comps.length} (${pass} key checks pass, ${fail} fail)`,
    `${failures.length} failure(s), ${warnings.length} warning(s)`,
  ].join(' · ');
}

class KeyboardReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.dir = path.resolve('test-results/keyboard');
  }

  printsToStdio() {
    return true;
  }

  onBegin(config, suite) {
    this.started = Date.now();
    const project = config.projects.find((p) => p.name === 'keyboard');
    if (project) this.dir = project.outputDir;
    const n = suite.allTests().length;
    console.log(`\nKeyboard tests: ${n} page test(s) (each page × site × viewport), ${config.workers} worker(s)`);
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

  onEnd() {
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
    console.log(`\nResult files (JSON): ${path.relative(process.cwd(), this.dir) || this.dir}`);
    const total = this.failed + escalated;
    console.log(`${total ? `${this.failed} failed${escalated ? ` (+${escalated} from comparison)` : ''}, ` : ''}${this.passed} passed in ${fmt(Date.now() - this.started)}`);
    return escalated ? { status: 'failed' } : undefined;
  }
}

export default KeyboardReporter;
