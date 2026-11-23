/**
 * Runner for the keyboard accessibility tests: npm run test:a11y:keyboard -- --help
 *
 * Parses the command line, then starts Playwright (project "keyboard") with the
 * choices passed as A11Y_* environment variables, which keyboard.test.js reads.
 * Every option can also be set with its environment variable (e.g. in CI).
 */
const { spawn } = require('child_process');
const { resolve } = require('path');
const { pathToFileURL } = require('url');
const { parseArgs } = require('util');

const OPTIONS = {
  name: { type: 'string', env: 'A11Y_KBD_NAME' },
  viewport: { type: 'string', env: 'A11Y_VIEWPORTS' },
  workers: { type: 'string', env: 'A11Y_WORKERS' },
  'source-concurrency': { type: 'string', env: 'A11Y_SOURCE_CONCURRENCY' },
  'base-url': { type: 'string', env: 'A11Y_BASE_URL' },
  help: { type: 'boolean', short: 'h' },
};

function help(config) {
  const viewports = config.viewports.map((v) => `${v.name} (${v.width}px)`).join(', ');
  const pairs = config.pairs.map((p) => p.name).join(', ');
  return `
Keyboard accessibility tests: test a source page and its EDS page with the
keyboard, then compare the results.

Usage
  npm run test:a11y:keyboard -- [options] <source-url> <eds-url>   compare one pair
  npm run test:a11y:keyboard -- [options] <eds-url>                one EDS page, no comparison
  npm run test:a11y:keyboard -- [options]                          pairs in keyboard.config.mjs

  Put "--" before the options: "npm run test:a11y:keyboard --help" (without "--")
  shows npm's own help instead of this one.

Arguments
  <source-url>   the original page (full URL)
  <eds-url>      the EDS page: a full URL, or a path joined with --base-url

Options
  --name <name>              short name for the pair in the output and file names
                             (default: last part of the EDS path, e.g. "ivs")
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
  npm run test:a11y:keyboard -- --name ivs --viewport desktop --workers 1 <source-url> <eds-url>
  npm run test:a11y:keyboard -- --base-url https://main--patients-stryker--aemdemos.aem.page

Configured pairs (tests/a11y/keyboard.config.mjs): ${pairs}

Results
  The terminal shows one line per page, the EDS failures and the source vs EDS
  differences. JSON files are written to ${config.resultsDir}/:
    <name>__<viewport>__source.json, <name>__<viewport>__eds.json   one per page
    <name>__<viewport>.compare.json                                 one per pair

More: README.md, section "Keyboard tests (source page vs EDS page)" — what each
check does, pass/fail rules and limits.
`;
}

function fail(message) {
  console.error(`Error: ${message}\nRun "npm run test:a11y:keyboard -- --help" for usage.`);
  process.exit(1);
}

(async () => {
  const config = (await import(pathToFileURL(resolve(__dirname, 'keyboard.config.mjs')).href)).default;

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
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(help(config));
    return;
  }
  if (positionals.length > 2) fail('expected at most two URLs: <source-url> <eds-url>');
  if (values.name && !positionals.length) fail('--name needs a URL (configured pairs have their own names)');
  if (values.viewport) {
    const known = config.viewports.map((v) => v.name);
    const unknown = values.viewport.split(',').map((v) => v.trim()).filter((v) => !known.includes(v));
    if (unknown.length) fail(`unknown viewport "${unknown.join(', ')}" (use: ${known.join(', ')})`);
  }
  ['workers', 'source-concurrency'].forEach((k) => {
    if (values[k] && !(Number(values[k]) >= 1)) fail(`--${k} must be a number of 1 or more`);
  });

  const env = { ...process.env, A11Y_KEYBOARD_RUN: '1' };
  Object.entries(OPTIONS).forEach(([k, o]) => { if (o.env && values[k]) env[o.env] = values[k]; });
  const [source, eds] = positionals.length === 2 ? positionals : [null, positionals[0]];
  if (eds) env.A11Y_KBD_EDS = eds;
  if (source) env.A11Y_KBD_SOURCE = source;

  const args = ['test', '--project=keyboard', '--reporter=./tests/a11y/keyboard.reporter.js'];
  if (env.A11Y_WORKERS) args.push(`--workers=${env.A11Y_WORKERS}`);

  // Resolve the local playwright binary directly — avoids shell:true and its deprecation warning
  const pw = resolve('node_modules', '.bin', 'playwright');
  const child = spawn(pw, args, { env, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 1));
})();
