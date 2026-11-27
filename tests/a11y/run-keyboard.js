/**
 * Runner for the keyboard accessibility tests: npm run test:a11y:keyboard -- --help
 *
 * 1. Parses the command line (options can also come from A11Y_* environment variables).
 * 2. Works out the page pairs (URLs, --csv file or keyboard.config.mjs).
 * 3. Creates a new run folder a11y-results/keyboard/<YYYY-MM-DD_HHMMSS>_<label>/
 *    with run.json, and registers it in index.json.
 * 4. Starts Playwright (project "keyboard"); the tests read run.json and write their
 *    results into the run folder, the reporter adds the comparison and report.html.
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');
const { parseArgs } = require('util');

const OPTIONS = {
  csv: { type: 'string', env: 'A11Y_KBD_CSV' },
  name: { type: 'string', env: 'A11Y_KBD_NAME' },
  label: { type: 'string', env: 'A11Y_KBD_LABEL' },
  viewport: { type: 'string', env: 'A11Y_VIEWPORTS' },
  workers: { type: 'string', env: 'A11Y_WORKERS' },
  'source-concurrency': { type: 'string', env: 'A11Y_SOURCE_CONCURRENCY' },
  'base-url': { type: 'string', env: 'A11Y_BASE_URL' },
  help: { type: 'boolean', short: 'h' },
};

const importLib = (file) => import(pathToFileURL(path.resolve(__dirname, file)).href);

function help(config) {
  const viewports = config.viewports.map((v) => `${v.name} (${v.width}px)`).join(', ');
  const pairs = config.pairs.map((p) => p.name).join(', ');
  return `
Keyboard accessibility tests: test a source page and its EDS page with the
keyboard, then compare the results.

Usage
  npm run test:a11y:keyboard -- [options] <source-url> <eds-url>   compare one pair
  npm run test:a11y:keyboard -- [options] <eds-url>                one EDS page, no comparison
  npm run test:a11y:keyboard -- [options] --csv <file>             every pair in a CSV file
  npm run test:a11y:keyboard -- [options]                          pairs in keyboard.config.mjs

  Put "--" before the options: "npm run test:a11y:keyboard --help" (without "--")
  shows npm's own help instead of this one.

Arguments
  <source-url>   the original page (full URL)
  <eds-url>      the EDS page: a full URL, or a path joined with --base-url

Options
  --csv <file>               test the pairs in a CSV file. Header row: source,eds,name
                             (name optional; empty source = EDS page only; lines
                             starting with # are ignored). Example:
                             tests/a11y/keyboard-pages.example.csv
  --name <name>              short name for one pair in the output and file names
                             (default: last part of the EDS path, e.g. "ivs")
  --label <text>             label of the run, used in the run folder name
                             (default: --name / CSV file name / pair name / "pairs")
  --viewport <names>         viewports to test, comma-separated: ${config.viewports.map((v) => v.name).join(', ')}
                             (default: all — ${viewports})
  --workers <n>              pages tested in parallel (default: ${config.workers}).
                             Each worker starts its own browser: use 1 on small machines
  --source-concurrency <n>   most pages open at once on one source host
                             (default: ${config.sourceConcurrency}; keeps load on a live site low)
  --base-url <url>           host for EDS paths (default: http://localhost:3000)
  -h, --help                 show this help

  Environment variables do the same (useful in CI); an option on the command line wins:
${Object.entries(OPTIONS).filter(([, o]) => o.env).map(([k, o]) => `    ${o.env.padEnd(26)} = --${k}`).join('\n')}

Examples
  npm run test:a11y:keyboard -- https://patients.stryker.com/us/en/ivs/index.html http://localhost:3000/us/en/ivs/
  npm run test:a11y:keyboard -- --csv my-pages.csv --viewport desktop --workers 1
  npm run test:a11y:keyboard -- --label after-header-fix <source-url> <eds-url>
  npm run test:a11y:keyboard -- --base-url https://main--patients-stryker--aemdemos.aem.page

Configured pairs (tests/a11y/keyboard.config.mjs): ${pairs}

Results (kept for every run, never overwritten; not in git)
  ${config.resultsRoot}/<YYYY-MM-DD_HHMMSS>_<label>/
    report.html                                 open in a browser: overview and details
    run.json                                    when, options, git commit, pairs, totals
    pages/<name>__<viewport>__<site>.json       one per page
    compare/<name>__<viewport>.json             source vs EDS, one per pair and viewport
  ${config.resultsRoot}/index.json                  every run, newest first
  ${config.resultsRoot}/latest.json                 the newest run

  Rebuild a report from its JSON files:
    npm run test:a11y:keyboard:report -- [run-folder]   (default: the latest run)

More: README.md, section "Keyboard tests (source page vs EDS page)" — what each
check does, pass/fail rules and limits. Result format: tests/a11y/RESULTS.md
`;
}

function fail(message) {
  console.error(`Error: ${message}\nRun "npm run test:a11y:keyboard -- --help" for usage.`);
  process.exit(1);
}

const git = (...args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
};

(async () => {
  const config = (await importLib('keyboard.config.mjs')).default;
  const pairsLib = await importLib('lib/pairs.mjs');
  const store = await importLib('lib/run-store.mjs');

  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: Object.fromEntries(Object.entries(OPTIONS).map(([k, o]) => [k, { type: o.type, ...(o.short ? { short: o.short } : {}) }])),
      allowPositionals: true,
    });
  } catch (e) {
    const option = (e.message.match(/'(-[^']+)'/) || [])[1];
    fail(e.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && option ? `unknown option "${option}"` : e.message);
  }
  const { values: cli, positionals } = parsed;
  if (cli.help) {
    console.log(help(config));
    return;
  }
  // an option on the command line wins over its environment variable
  const opt = Object.fromEntries(Object.entries(OPTIONS)
    .map(([k, o]) => [k, cli[k] !== undefined ? cli[k] : (o.env && process.env[o.env]) || undefined]));

  // ---- checks ----
  if (positionals.length > 2) fail('expected at most two URLs: <source-url> <eds-url>');
  if (opt.csv && positionals.length) fail('use either --csv or URLs, not both');
  if (opt.name && !positionals.length) fail('--name needs a URL (CSV rows and configured pairs have their own names)');
  const knownViewports = config.viewports.map((v) => v.name);
  const viewports = opt.viewport
    ? opt.viewport.split(',').map((v) => v.trim()).filter(Boolean)
    : knownViewports;
  const unknown = viewports.filter((v) => !knownViewports.includes(v));
  if (unknown.length) fail(`unknown viewport "${unknown.join(', ')}" (use: ${knownViewports.join(', ')})`);
  ['workers', 'source-concurrency'].forEach((k) => {
    if (opt[k] && !(Number(opt[k]) >= 1)) fail(`--${k} must be a number of 1 or more`);
  });
  const baseUrl = opt['base-url'] || 'http://localhost:3000';
  if (!pairsLib.isFullUrl(baseUrl)) fail('--base-url must start with http:// or https://');

  // ---- pairs ----
  let pairs;
  if (opt.csv) {
    const csv = pairsLib.readCsv(path.resolve(opt.csv), baseUrl);
    if (csv.errors) {
      console.error(`Error: problems in ${opt.csv}:\n${csv.errors.map((e) => `  ${e}`).join('\n')}`);
      console.error('Expected a header row "source,eds,name" (name optional). Example: tests/a11y/keyboard-pages.example.csv');
      process.exit(1);
    }
    ({ pairs } = csv);
  } else if (positionals.length) {
    const [source, eds] = positionals.length === 2 ? positionals : [null, positionals[0]];
    if (source && !pairsLib.isFullUrl(source)) fail(`"${source}" is not a full URL (the source URL must start with http:// or https://)`);
    if (!pairsLib.isFullUrl(eds) && !eds.startsWith('/')) fail(`"${eds}" is not a full URL or a path starting with /`);
    const edsUrl = pairsLib.absoluteEds(eds, baseUrl);
    pairs = [{ name: pairsLib.safeName(opt.name) || pairsLib.shortName(edsUrl), source, eds: edsUrl }];
  } else {
    pairs = config.pairs.map((p) => ({ name: p.name, source: p.source || null, eds: pairsLib.absoluteEds(p.eds, baseUrl) }));
  }
  pairs = pairs.map(({ name, source, eds }) => ({ name, source: source || null, eds }));

  // ---- run folder ----
  const root = path.resolve(config.resultsRoot);
  const label = pairsLib.runLabel({
    label: opt.label, csv: opt.csv, pairs, fromConfig: !opt.csv && !positionals.length,
  });
  const started = new Date();
  const { runId, dir } = store.createRunDir(root, label, started);
  const workers = Number(opt.workers) || config.workers;
  const run = {
    schemaVersion: store.SCHEMA_VERSION,
    tool: 'keyboard-a11y',
    runId,
    label,
    startedAt: store.isoLocal(started),
    finishedAt: null,
    durationMs: null,
    status: 'running',
    command: `npm run test:a11y:keyboard -- ${process.argv.slice(2).join(' ')}`.trim(),
    git: { branch: git('rev-parse', '--abbrev-ref', 'HEAD'), commit: git('rev-parse', '--short', 'HEAD') },
    options: {
      viewports,
      workers,
      sourceConcurrency: Number(opt['source-concurrency']) || config.sourceConcurrency,
      baseUrl,
      csv: opt.csv || null,
    },
    pairs,
    totals: null,
    results: [],
    report: null,
  };
  store.writeJson(path.join(dir, 'run.json'), run);
  store.updateIndex(root, run);

  // ---- Playwright ----
  const env = { ...process.env, A11Y_KEYBOARD_RUN: '1', A11Y_KBD_RUN_DIR: dir };
  const args = ['test', '--project=keyboard', '--reporter=./tests/a11y/keyboard.reporter.js', `--workers=${workers}`];
  // Resolve the local playwright binary directly — avoids shell:true and its deprecation warning
  const pw = path.resolve('node_modules', '.bin', 'playwright');
  const child = spawn(pw, args, { env, stdio: 'inherit' });
  child.on('exit', (code) => {
    // the reporter marks the run passed/failed; anything else means it was stopped
    const final = store.readJson(path.join(dir, 'run.json'), run);
    if (final.status === 'running') {
      final.status = 'interrupted';
      final.finishedAt = store.isoLocal();
      store.writeJson(path.join(dir, 'run.json'), final);
      store.updateIndex(root, final);
    }
    process.exit(code ?? 1);
  });
})();
