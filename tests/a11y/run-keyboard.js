const { spawn } = require('child_process');
const { resolve } = require('path');

// npm run test:a11y:keyboard                           → configured pairs
// npm run test:a11y:keyboard -- <eds-url> [source-url] → a single pair
// A11Y_WORKERS sets the number of parallel workers (default: workers in keyboard.config.js)
const [eds, source] = process.argv.slice(2);
const env = { ...process.env, A11Y_KEYBOARD_RUN: '1' };
if (eds) env.A11Y_KBD_EDS = eds;
if (source) env.A11Y_KBD_SOURCE = source;

const args = ['test', '--project=keyboard', '--reporter=./tests/a11y/keyboard.reporter.js'];
if (process.env.A11Y_WORKERS) args.push(`--workers=${process.env.A11Y_WORKERS}`);

// Resolve the local playwright binary directly — avoids shell:true and its deprecation warning
const pw = resolve('node_modules', '.bin', 'playwright');
const child = spawn(pw, args, { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));
