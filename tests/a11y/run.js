const { spawn } = require('child_process');
const { resolve } = require('path');

const url = process.argv[2];
const env = { ...process.env };
if (url) env.A11Y_URL = url;

// Resolve the local playwright binary directly — avoids shell:true and its deprecation warning
const pw = resolve('node_modules', '.bin', 'playwright');
// --project=axe: the keyboard tests have their own runner (run-keyboard.js)
const child = spawn(pw, ['test', '--project=axe'], { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));
