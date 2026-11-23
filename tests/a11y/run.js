/**
 * Runner for the axe-core accessibility scan: npm run test:a11y -- --help
 *
 * Parses the command line, then starts Playwright (project "axe") with the
 * choices passed as A11Y_* environment variables, which a11y.test.js reads.
 * The A11y PR workflow calls it as: npm run test:a11y <url>
 */
const { spawn } = require('child_process');
const { resolve } = require('path');
const { parseArgs } = require('util');

const HELP = `
Accessibility scan: checks rendered pages with axe-core against WCAG 2.0, 2.1
and 2.2 Level A/AA rules.

Usage
  npm run test:a11y -- [options] <url>   scan one page
  npm run test:a11y -- [options]         scan the paths in tests/a11y/a11y.config.js

  Put "--" before the options: "npm run test:a11y --help" (without "--")
  shows npm's own help instead of this one.

Arguments
  <url>   full URL of the page to scan (http:// or https://)

Options
  --base-url <url>   host for the configured paths (default: http://localhost:3000)
  -h, --help         show this help

  Environment variable (useful in CI); the option on the command line wins:
    A11Y_BASE_URL = --base-url

Examples
  npm run test:a11y -- http://localhost:3000/us/en/ivs/
  npm run test:a11y
  npm run test:a11y -- --base-url https://main--patients-stryker--aemdemos.aem.page

Results
  One line per page. Critical and serious violations fail the scan (non-zero exit
  code) and are listed with the affected elements; moderate and minor ones are
  printed as warnings. Rule tags, failing impact levels and the configured paths
  are set in tests/a11y/a11y.config.js.

Keyboard tests (source page vs EDS page): npm run test:a11y:keyboard -- --help
More: README.md, section "Accessibility testing".
`;

function fail(message) {
  console.error(`Error: ${message}\nRun "npm run test:a11y -- --help" for usage.`);
  process.exit(1);
}

let parsed;
try {
  parsed = parseArgs({
    args: process.argv.slice(2),
    options: { 'base-url': { type: 'string' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
} catch (e) {
  const option = (e.message.match(/'(-[^']+)'/) || [])[1];
  fail(e.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && option ? `unknown option "${option}"` : e.message);
}
const { values, positionals } = parsed;
if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (positionals.length > 1) fail('expected one URL');
const url = positionals[0];
if (url && !/^https?:\/\//i.test(url)) fail(`"${url}" is not a full URL (it must start with http:// or https://)`);
if (values['base-url'] && !/^https?:\/\//i.test(values['base-url'])) fail('--base-url must start with http:// or https://');

const env = { ...process.env };
if (url) env.A11Y_URL = url;
if (values['base-url']) env.A11Y_BASE_URL = values['base-url'];

// Resolve the local playwright binary directly — avoids shell:true and its deprecation warning
const pw = resolve('node_modules', '.bin', 'playwright');
// --project=axe: the keyboard tests have their own runner (run-keyboard.js)
const child = spawn(pw, ['test', '--project=axe'], { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));
