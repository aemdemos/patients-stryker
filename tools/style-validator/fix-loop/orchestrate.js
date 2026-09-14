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

// The validator config is required — the tool is project-agnostic, so there is
// no built-in default config path. Callers pass `--config <file>`.
function requireConfig(args) {
  if (!args.config) throw new Error('Missing --config <validator-config.json>. This tool ships no default config (it is project-agnostic).');
  return resolve(args.config);
}

function readLog() {
  if (!existsSync(LOG)) return { iterations: [] };
  const log = JSON.parse(readFileSync(LOG, 'utf8'));
  // Tolerate a log written by a different command (e.g. `run` writes
  // baseline/afterApply, not iterations) — always expose an iterations array.
  if (!Array.isArray(log.iterations)) log.iterations = [];
  return log;
}

function writeLog(log) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(LOG, JSON.stringify(log, null, 2));
}

/** Heuristic: which surface most likely owns a delta. Advisory only — the AI
 * confirms the actual cause. The general rule: authored inline emphasis (bold/
 * italic) round-trips through markup, so family/weight/style differences on
 * heading/body text are often best fixed in the IMPORT parsers/transformers (by
 * emitting the right <strong>/<em>). Font-SIZE, text-decoration, and arbitrary
 * colors cannot be expressed by markup alone, so they belong in scoped CSS
 * (template CSS for a templated page, styles/themes.css for a singleton). */
function fixSurfaceHint(cluster) {
  const fieldsChanged = new Set(cluster.delta.map((d) => d.field));
  const onlyMarkupDrivable = [...fieldsChanged].every((f) => ['fontFamily', 'fontWeight', 'fontStyle'].includes(f));
  if (onlyMarkupDrivable && cluster.roleBuckets.every((r) => r === 'heading' || r === 'body')) {
    return 'likely import emphasis markup (parser/transformer) — family/weight/style round-trips via <strong>/<em>';
  }
  if (fieldsChanged.has('fontSize') || fieldsChanged.has('textDecorationLine')
    || cluster.delta.some((d) => d.field === 'color')) {
    return 'scoped CSS (template CSS or styles/themes.css) — size/decoration/color cannot round-trip through markup';
  }
  return 'inspect: import markup or scoped CSS depending on which computes the source value';
}

/** High-confidence structural spacing clusters, ordered top-to-bottom. Empty
 * while the SERIES GATE is closed (spacing is held until text-style is clean),
 * so spacing is neither counted nor actioned until text is resolved. */
function spacingClusters(report) {
  const sp = report.spacing || {};
  if (sp.active === false) return []; // held for text-style
  const clusters = sp.clusters || [];
  return clusters.filter((c) => !c.directionInconsistent)
    .sort((a, b) => a.minAnchorTop - b.minAnchorTop);
}

function cmdPlan() {
  const report = readReport();
  const styleEligible = (report.clusters || []).filter((c) => c.loopEligible);
  // Non-size style clusters are the ones the loop acts on (size is human review).
  const styleActionable = styleEligible
    .filter((c) => c.delta.some((d) => d.field !== 'fontSize'));
  const held = report.spacing && report.spacing.heldForTextStyle;
  const spacing = spacingClusters(report); // [] while the series gate is closed

  if (!styleActionable.length && !spacing.length) {
    if (held) {
      // Should not happen (gate opens exactly when styleActionable hits 0), but be
      // explicit: text is clean, so re-validate to release the held spacing set.
      console.log('Text-style clean; spacing gate open. Re-run `check` to surface spacing. ✅');
    } else {
      console.log('No actionable text-style or spacing issues. Nothing to fix. ✅');
    }
    return 0;
  }

  // SERIES: text-style FIRST. While any actionable text-style cluster remains, the
  // spacing pass is HELD (a spacing symptom can have a font-size root cause), so
  // the next target is always a text-style cluster. Only once text is clean does
  // spacing become actionable — then TOP-TO-BOTTOM by page position (an upper
  // section's fix often cascades to gaps below). One fix per iteration.
  if (styleActionable.length) {
    console.log(`=== TEXT-STYLE (resolve first — ${styleActionable.length} cluster(s)) ===`);
    if (held) console.log(`(spacing held: ${report.spacing.stats.highConfidenceClusters} cluster(s) waiting until text-style is clean)\n`);
    styleActionable.forEach((c, i) => {
      const s = c.samples[0] || {};
      const marker = i === 0 ? ' ← NEXT' : '';
      console.log(`#${i + 1}  [${c.pages.length} page(s): ${c.pages.join(', ')}]  ${c.key}${marker}`);
      console.log(`    e.g. "${(s.text || '').slice(0, 50)}"  hint: ${fixSurfaceHint(c)}`);
    });
  } else {
    console.log(`=== SPACING (text-style clean — top-to-bottom, ${spacing.length} cluster(s)) ===`);
    spacing.forEach((c, i) => {
      const s = c.instances[0] || {};
      const marker = i === 0 ? ' ← NEXT' : '';
      console.log(`#${i + 1}  [@${c.breakpoint}px, ${c.pageCount} page(s): ${c.pages.join(', ')}]  Δ~${c.medianDelta > 0 ? '+' : ''}${c.medianDelta}px${marker}`);
      console.log(`    transition: ${c.transition}`);
      console.log(`    e.g. "${(s.fromText || '').slice(0, 30)}" → "${(s.toText || '').slice(0, 30)}"  src ${s.sourceGap}px vs mig ${s.migratedGap}px`);
      console.log('    fix: usually the section margin/padding at this breakpoint (template CSS for a templated page, styles/themes.css for a singleton); occasionally a structural markup cause in the import scripts.');
    });
  }
  console.log('\nNext: fix the NEXT target at its root cause, then — if you changed MARKUP —');
  console.log('`reimport --pages <affected>`; always finish with `check`.');
  return 0;
}

function cmdReimport(args) {
  const pages = (args.pages || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!pages.length) throw new Error('reimport needs --pages a,b,c (page names from the config).');
  // The import script to rebundle: config `importScript`, else derived from the
  // template auto-detected in the report (tools/importer/import-<template>.js).
  // Singletons / CSS-only projects can set `"importScript": null` to skip
  // re-import entirely (markup changes aren't applicable — fixes are CSS).
  const cfgForImport = JSON.parse(readFileSync(requireConfig(args), 'utf8'));
  if (Object.prototype.hasOwnProperty.call(cfgForImport, 'importScript') && !cfgForImport.importScript) {
    console.log('[reimport] no import script for this config (CSS-only / singleton) — skipping re-import.');
    return 0;
  }
  let importJs = cfgForImport.importScript;
  if (!importJs) {
    let tmpl = null;
    try { const ft = readReport().fixTarget; if (ft && ft.kind === 'template' && ft.name) tmpl = ft.name; } catch { /* no report */ }
    if (!tmpl) throw new Error('reimport: cannot determine the import script — set "importScript" in the config, or run the validator so the report detects a template.');
    importJs = `tools/importer/import-${tmpl}.js`;
  }
  const bundleJs = importJs.replace(/\.js$/, '.bundle.js');
  console.log(`[reimport] rebundling ${importJs}…`);
  execFileSync('bash', [join(IMPORT_SCRIPTS, 'aem-import-bundle.sh'), '--importjs', importJs], { cwd: REPO, stdio: 'inherit' });

  // Map page names → source URLs from the validator config.
  const urls = pages
    .map((name) => cfgForImport.pairs.find((p) => p.name === name))
    .filter(Boolean)
    .map((p) => p.source);
  const urlsFile = join(STATE_DIR, 'reimport-urls.txt');
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(urlsFile, `${urls.join('\n')}\n`);
  console.log(`[reimport] importing ${urls.length} page(s)…`);
  execFileSync('node', [join(IMPORT_SCRIPTS, 'run-bulk-import.js'),
    '--import-script', bundleJs,
    '--urls', urlsFile], { cwd: REPO, stdio: 'inherit' });
  return 0;
}

// Combined progress metric: text-style non-size field mismatches PLUS the count
// of high-confidence structural spacing clusters. Both strictly decrease as
// issues are fixed, so the loop stops only when BOTH dimensions are clean.
function combinedMetric(report) {
  const style = report.eligibleNonSizeFieldMismatches || 0;
  const spacing = spacingClusters(report).length;
  return { style, spacing, total: style + spacing };
}

function cmdCheck(args) {
  const config = requireConfig(args);
  const maxIterations = Number(args.max || 12);
  const log = readLog();

  // Re-run the validator (writes a fresh report). Exit 2 = issues remain.
  console.log('[check] re-validating…');
  try {
    execFileSync('node', [VALIDATOR, '--config', config], { cwd: REPO, stdio: 'inherit' });
  } catch (e) {
    if (e.status !== 2) throw e;
  }
  const report = readReport();
  const m = combinedMetric(report);

  const prev = log.iterations.length ? log.iterations[log.iterations.length - 1].total : Infinity;
  log.iterations.push({ n: log.iterations.length + 1, ...m });
  writeLog(log);

  console.log(`\n[check] combined metric: ${m.total} (was ${prev === Infinity ? 'n/a' : prev}) = ${m.style} text-style non-size mismatch(es) + ${m.spacing} spacing cluster(s)`);

  if (m.total === 0) { console.log('[check] CLEAN ✅ — text-style and spacing both clear. Residual font-size / direction-inconsistent items are human review.'); return 0; }
  if (log.iterations.length >= maxIterations) { console.log(`[check] STOP — hit max iterations (${maxIterations}).`); return 4; }
  if (m.total >= prev) { console.log('[check] STOP — no progress (must-not-regress guard). Remaining items may not be safely fixable; inspect.'); return 3; }
  console.log('[check] progress made — continue.');
  return 0;
}

// Resolve the CSS file that generated fixes for these pages are written to, from
// the report's auto-detected fixTarget (`template` → templates/<t>/<t>.css;
// `theme` → styles/themes.css). `--css <path>` overrides. Throws when neither is
// available so a caller never silently writes to the wrong stylesheet — the CLI
// can pass `--css` or run the validator first so a fixTarget exists.
function resolveTargetCss(args) {
  if (args.css) return resolve(REPO, args.css);
  try {
    const ft = (readReport().fixTarget) || {};
    if ((ft.kind === 'template' || ft.kind === 'theme') && ft.cssPath) return resolve(REPO, ft.cssPath);
  } catch { /* no report yet */ }
  throw new Error('Cannot resolve target CSS: pass --css <path>, or run the validator first so the report has a fixTarget (template/theme auto-detected from page metadata).');
}

// Regenerate the auto-fix CSS block from the current report (safe fields; size
// only with --include-size). CSS-only — no re-import needed.
function cmdApply(args) {
  const cfg = JSON.parse(readFileSync(requireConfig(args), 'utf8'));
  const allPages = cfg.pairs.map((p) => p.name).join(',');
  const gen = resolve(__dirname, 'apply-css-fixes.js');
  const cssArgs = [gen,
    '--report', REPORT,
    '--css', resolveTargetCss(args),
    '--all-pages', allPages];
  if (args['include-size']) cssArgs.push('--include-size');
  execFileSync('node', cssArgs, { cwd: REPO, stdio: 'inherit' });
  return 0;
}

// Empty the managed AUTO-FIX block so a baseline validation reflects the page
// WITHOUT generated fixes. Idempotent.
const AF_BEGIN = '/* === AUTO-FIX (text-style-validator) — do not edit inside; regenerated by apply-css-fixes.js === */';
const AF_END = '/* === END AUTO-FIX === */';
function clearAutoFixBlock(args = {}) {
  const cssPath = resolveTargetCss(args);
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
  const config = requireConfig(args);
  const runValidator = () => {
    try { execFileSync('node', [VALIDATOR, '--config', config], { cwd: REPO, stdio: 'inherit' }); } catch (e) { if (e.status !== 2) throw e; }
  };

  console.log('[run] baseline validation (auto-fix block cleared)…');
  clearAutoFixBlock(args);
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
  clearAutoFixBlock(args);
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
