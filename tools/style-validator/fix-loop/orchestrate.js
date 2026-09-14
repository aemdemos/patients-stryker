#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-continue, no-await-in-loop, no-console */
/* eslint-disable no-underscore-dangle, object-curly-newline, max-len */
/*
 * Autonomous text-style fix-loop ORCHESTRATOR (deterministic harness).
 *
 * The loop is: pick the worst loop-eligible style cluster -> an agent applies ONE
 * fix (in the import parsers/transformers or zone-scoped template CSS) -> rebundle
 * -> re-import the affected pages -> re-validate -> keep going until no
 * loop-eligible clusters remain or progress stalls.
 *
 * This script owns every DETERMINISTIC step so the AI is invoked once per
 * issue-type, not per page, and never touches the guard rails:
 *   - `plan`      : read the latest validator report, print loop-eligible
 *                   clusters worst-first with a fix-surface hint + affected pages.
 *   - `reimport`  : rebundle the import script + re-import the given pages.
 *   - `check`     : re-run the validator, append the loop-eligible count to the
 *                   history log, and ENFORCE guard rails (must-not-regress,
 *                   stop-on-worsen, max-iterations). Exit code signals the driver
 *                   whether to continue (0 = progress/clean), or stop (3 = stall/
 *                   regression, 4 = max iterations).
 *
 * The AI fix step itself is performed by the coding agent between `plan` and
 * `reimport` — a Node script cannot invoke an LLM. This keeps the harness
 * reusable and testable while the agent supplies the per-cluster reasoning.
 *
 * Usage:
 *   node tools/style-validator/fix-loop/orchestrate.js plan     --config <cfg>
 *   node tools/style-validator/fix-loop/orchestrate.js reimport --pages a,b,c
 *   node tools/style-validator/fix-loop/orchestrate.js check    --config <cfg> [--max 8]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..', '..');
const REPORT = resolve(REPO, 'migration-work/importer/text-style-diff.json');
const STATE_DIR = resolve(REPO, 'migration-work/importer/fix-loop');
const LOG = join(STATE_DIR, 'log.json');
const VALIDATOR = resolve(__dirname, '..', 'validate-text-style.js');

// Path to the excat content-import scripts (rebundle + run-bulk-import), same as
// the importer uses. Override with EXCAT_IMPORT_SCRIPTS.
const IMPORT_SCRIPTS = process.env.EXCAT_IMPORT_SCRIPTS
  || '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
      args[key] = val;
    } else args._.push(a);
  }
  return args;
}

function readReport() {
  if (!existsSync(REPORT)) throw new Error(`No validator report at ${REPORT}. Run the validator first.`);
  return JSON.parse(readFileSync(REPORT, 'utf8'));
}

function readLog() {
  if (!existsSync(LOG)) return { iterations: [] };
  return JSON.parse(readFileSync(LOG, 'utf8'));
}

function writeLog(log) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(LOG, JSON.stringify(log, null, 2));
}

/** Heuristic: which surface most likely owns a delta. Advisory only. */
function fixSurfaceHint(cluster) {
  const fieldsChanged = new Set(cluster.delta.map((d) => d.field));
  const onlyMarkupDrivable = [...fieldsChanged].every((f) => ['fontFamily', 'fontWeight', 'fontStyle'].includes(f));
  const goldColor = cluster.delta.some((d) => d.field === 'color' && /255, 181, 0/.test(d.source));
  if ((onlyMarkupDrivable || goldColor) && cluster.roleBuckets.every((r) => r === 'heading' || r === 'body')) {
    return 'import emphasis markup (parser/transformer normalizeEmphasis) — family/weight/gold round-trips via <strong>/<em>';
  }
  if (fieldsChanged.has('fontSize') || fieldsChanged.has('textDecorationLine')
    || cluster.delta.some((d) => d.field === 'color')) {
    return 'zone-scoped template CSS — size/underline/non-accent color cannot round-trip through markup';
  }
  return 'inspect: parser markup or template CSS depending on which computes the source value';
}

function cmdPlan() {
  const report = readReport();
  const eligible = (report.clusters || []).filter((c) => c.loopEligible);
  if (!eligible.length) {
    console.log('No loop-eligible clusters. Nothing to fix. ✅');
    return 0;
  }
  console.log(`${eligible.length} loop-eligible cluster(s), worst-first:\n`);
  eligible.forEach((c, i) => {
    const s = c.samples[0] || {};
    console.log(`#${i + 1}  [${c.pages.length} page(s): ${c.pages.join(', ')}]  roles: ${c.roleBuckets.join('/')}`);
    console.log(`    delta:  ${c.key}`);
    console.log(`    sample: "${(s.text || '').slice(0, 70)}"  (ctx: ${s.migratedContext})`);
    console.log(`    source fp:   ${JSON.stringify(s.sourceFingerprint)}`);
    console.log(`    migrated fp: ${JSON.stringify(s.migratedFingerprint)}`);
    console.log(`    hint:   ${fixSurfaceHint(c)}\n`);
  });
  console.log('Next: agent fixes cluster #1, then `reimport --pages <its pages>` and `check`.');
  return 0;
}

function cmdReimport(args) {
  const pages = (args.pages || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!pages.length) throw new Error('reimport needs --pages a,b,c (page names from the config).');
  // Rebundle the procedure-detail import script, then re-import each page's URL.
  const importJs = 'tools/importer/import-procedure-detail.js';
  console.log('[reimport] rebundling…');
  execFileSync('bash', [join(IMPORT_SCRIPTS, 'aem-import-bundle.sh'), '--importjs', importJs], { cwd: REPO, stdio: 'inherit' });

  // Map page names → source URLs from the validator config.
  const cfg = JSON.parse(readFileSync(resolve(args.config || 'tools/style-validator/configs/procedure-detail.json'), 'utf8'));
  const urls = pages
    .map((name) => cfg.pairs.find((p) => p.name === name))
    .filter(Boolean)
    .map((p) => p.source);
  const urlsFile = join(STATE_DIR, 'reimport-urls.txt');
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(urlsFile, `${urls.join('\n')}\n`);
  console.log(`[reimport] importing ${urls.length} page(s)…`);
  execFileSync('node', [join(IMPORT_SCRIPTS, 'run-bulk-import.js'),
    '--import-script', 'tools/importer/import-procedure-detail.bundle.js',
    '--urls', urlsFile], { cwd: REPO, stdio: 'inherit' });
  return 0;
}

function cmdCheck(args) {
  const config = resolve(args.config || 'tools/style-validator/configs/procedure-detail.json');
  const maxIterations = Number(args.max || 8);
  const log = readLog();

  // Re-run the validator (writes a fresh report).
  console.log('[check] re-validating…');
  // Progress is measured by NON-SIZE field mismatches: the fields the auto-fixer
  // actually addresses (font-size is intentionally not auto-pinned, so it must
  // not count toward "no progress"). Strictly decreases as fields are fixed;
  // multi-field fixes that leave a size residual still register progress.
  let metric; let eligibleCount;
  try {
    execFileSync('node', [VALIDATOR, '--config', config], { cwd: REPO, stdio: 'inherit' });
    metric = 0; eligibleCount = 0; // exit 0 → nothing loop-eligible
  } catch (e) {
    if (e.status === 2) {
      const report = readReport();
      metric = report.eligibleNonSizeFieldMismatches;
      eligibleCount = report.loopEligibleCount;
    } else throw e;
  }

  const prev = log.iterations.length ? log.iterations[log.iterations.length - 1].metric : Infinity;
  log.iterations.push({ n: log.iterations.length + 1, metric, eligibleCount });
  writeLog(log);

  console.log(`\n[check] non-size field mismatches: ${metric} (was ${prev === Infinity ? 'n/a' : prev}); loop-eligible clusters: ${eligibleCount}`);

  if (metric === 0) { console.log('[check] CLEAN ✅ — no auto-fixable (non-size) mismatches remain. Any residual clusters are font-size (human review).'); return 0; }
  if (log.iterations.length >= maxIterations) { console.log(`[check] STOP — hit max iterations (${maxIterations}).`); return 4; }
  if (metric >= prev) { console.log('[check] STOP — no progress (must-not-regress guard). Remaining deltas aren\'t auto-fixable; inspect for human handling.'); return 3; }
  console.log('[check] progress made — continue.');
  return 0;
}

// Regenerate the auto-fix CSS block from the current report (safe fields; size
// only with --include-size). CSS-only — no re-import needed.
function cmdApply(args) {
  const cfg = JSON.parse(readFileSync(resolve(args.config || 'tools/style-validator/configs/procedure-detail.json'), 'utf8'));
  const allPages = cfg.pairs.map((p) => p.name).join(',');
  const gen = resolve(__dirname, 'apply-css-fixes.js');
  const cssArgs = [gen,
    '--report', REPORT,
    '--css', resolve(REPO, 'templates/procedure-detail/procedure-detail.css'),
    '--all-pages', allPages];
  if (args['include-size']) cssArgs.push('--include-size');
  execFileSync('node', cssArgs, { cwd: REPO, stdio: 'inherit' });
  return 0;
}

// Empty the managed AUTO-FIX block so a baseline validation reflects the page
// WITHOUT generated fixes. Idempotent.
const AF_BEGIN = '/* === AUTO-FIX (text-style-validator) — do not edit inside; regenerated by apply-css-fixes.js === */';
const AF_END = '/* === END AUTO-FIX === */';
function clearAutoFixBlock() {
  const cssPath = resolve(REPO, 'templates/procedure-detail/procedure-detail.css');
  let css = readFileSync(cssPath, 'utf8');
  const b = css.indexOf(AF_BEGIN);
  if (b < 0) return;
  const e = css.indexOf(AF_END, b);
  css = `${css.slice(0, b)}${AF_BEGIN}\n\n${AF_END}${css.slice(e + AF_END.length)}`;
  writeFileSync(cssPath, css);
}

function metricFromReport() {
  const report = readReport();
  return { metric: report.eligibleNonSizeFieldMismatches, eligible: report.loopEligibleCount };
}

// Fully-auto driver. CSS fixes are ONE-SHOT (unlike re-import fixes they can't
// reveal new issues), so this is NOT an iterative loop: it (1) clears the
// managed block and validates a BASELINE, (2) applies the generated fixes once,
// (3) re-validates and confirms the auto-fixable (non-size) metric strictly
// dropped — reverting the block if it somehow didn't. Size clusters are left for
// a human by design.
function cmdRun(args) {
  const config = resolve(args.config || 'tools/style-validator/configs/procedure-detail.json');
  const runValidator = () => {
    try { execFileSync('node', [VALIDATOR, '--config', config], { cwd: REPO, stdio: 'inherit' }); } catch (e) { if (e.status !== 2) throw e; }
  };

  console.log('[run] baseline validation (auto-fix block cleared)…');
  clearAutoFixBlock();
  runValidator();
  const before = metricFromReport();
  console.log(`[run] baseline: non-size field mismatches = ${before.metric}`);

  console.log('[run] applying auto-fixes…');
  cmdApply(args);

  console.log('[run] confirmation validation…');
  runValidator();
  const after = metricFromReport();
  writeLog({ baseline: before, afterApply: after });
  console.log(`[run] after apply: non-size field mismatches = ${after.metric} (was ${before.metric})`);

  if (after.metric < before.metric) {
    console.log(`[run] ✅ auto-fixes reduced non-size mismatches by ${before.metric - after.metric}. Residual ${after.metric} are not safely auto-fixable (size/artifact) — human review.`);
    return 0;
  }
  console.log('[run] ⚠️ auto-fixes did not reduce the metric — reverting the generated block.');
  clearAutoFixBlock();
  return 3;
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  try {
    if (cmd === 'plan') return process.exit(cmdPlan());
    if (cmd === 'apply') return process.exit(cmdApply(args));
    if (cmd === 'reimport') return process.exit(cmdReimport(args));
    if (cmd === 'check') return process.exit(cmdCheck(args));
    if (cmd === 'run') return process.exit(cmdRun(args));
    console.error('Usage: orchestrate.js <plan|apply|reimport|check|run> [--config <cfg>] [--pages a,b] [--max N] [--include-size]');
    return process.exit(1);
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return process.exit(1);
  }
}

main();
