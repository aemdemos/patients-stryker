#!/usr/bin/env node
/*
 * Builds and deploys the review backend's actions to App Builder (I/O Runtime) with the OpenWhisk
 * REST API; the workspace's runtime credential is added by the environment (Settings: Stage's
 * for adobeioruntime.net, Production's for runtime.adobe.io, the same API: --api), never passed
 * here. Each action is bundled into one file with esbuild; the
 * libraries are installed outside the project (--deps, default /tmp/run-outputs/review-backend-deps)
 * from this folder's package.json.
 * The capture action is a zip: its bundle plus the browser (browser/package.json, installed in
 * --browser-deps) and Debian 10's NSS / NSPR (browser/debian-libs.json, checked by SHA-256).
 * usage: node tools/review/backend/deploy.mjs [--production] [--ns <namespace>] [--deps <dir>]
 *   (default Stage, the test workspace; --production: the live review, once the tests passed on
 *   Stage; backend/target.mjs)
 *   [--browser-deps <dir>] [--only state,save,results,overview,admin,capture] [--dry-run]
 */
import {
  existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync,
} from 'fs';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TEST, WORKSPACES, apiOf } from './target.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
// Stage unless --production (the live review: only code whose tests passed on Stage) or --ns
const ns = opt('--ns', args.includes('--production') ? WORKSPACES.production.ns : TEST.ns);
const deps = opt('--deps', '/tmp/run-outputs/review-backend-deps');
const browserDeps = opt('--browser-deps', '/tmp/run-outputs/review-capture-deps');
const only = opt('--only', '') ? opt('--only').split(',') : null;
const dry = args.includes('--dry-run');
const HOST = opt('--api', apiOf(ns));
const API = `https://${HOST}/api/v1/namespaces/${ns}`;
const PACKAGE = 'std-review';

// web: reviewer-facing (invitation token); private: only with the project's credential
const ACTIONS = {
  state: { web: true },
  save: { web: true },
  results: { web: true, timeout: 120000 },
  overview: { web: true, timeout: 120000 },
  shots: { web: true },
  invites: { web: true },
  pages: { web: true },
  tile: { web: true },
  images: { web: true },
  // who is signed in, as Adobe says (the DA app proof, branch da-app-v3)
  whoami: { web: true },
  admin: { web: false, timeout: 300000 },
  // the browser: 2 GB, 5 minutes (a run stops starting pages after 3.5); one run per container
  // (runs at the same time in one container share its CPU: each page then takes ~10x longer)
  capture: {
    web: false, timeout: 300000, memory: 2048, browser: true, concurrency: 1,
  },
  // the daily source change check: the capture action's code in a 1 GB container (what it
  // loads is light: no images, media or fonts for the daily content check; App Builder counts
  // memory x duration), its own action so the capture keeps its 2 GB
  check: {
    file: 'capture', web: false, timeout: 300000, memory: 1024, browser: true, concurrency: 1,
  },
  // a live copy of a source page for the tool (the browser; a web action answers within 60 s)
  live: {
    web: true, timeout: 60000, memory: 2048, browser: true,
  },
};

// (installed again when any library of package.json is missing)
const wanted = Object.keys(JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).dependencies);
if (wanted.some((lib) => !existsSync(join(deps, 'node_modules', ...lib.split('/'))))) {
  mkdirSync(deps, { recursive: true });
  copyFileSync(join(HERE, 'package.json'), join(deps, 'package.json'));
  console.log(`installing the libraries into ${deps} …`);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent'], { cwd: deps, stdio: 'inherit' });
}
const esbuild = createRequire(join(deps, 'package.json'))('esbuild');

async function call(method, path, body) {
  const resp = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${method} ${path}: ${resp.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** the browser's folder for the capture zip: node_modules, libs/ (Debian 10's NSS / NSPR) */
function browserFolder() {
  const B = join(HERE, 'browser');
  if (!existsSync(join(browserDeps, 'node_modules', 'puppeteer-core'))) {
    mkdirSync(browserDeps, { recursive: true });
    copyFileSync(join(B, 'package.json'), join(browserDeps, 'package.json'));
    console.log(`installing the browser into ${browserDeps} …`);
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent', '--omit=dev'], { cwd: browserDeps, stdio: 'inherit' });
  }
  const libs = join(browserDeps, 'libs');
  if (!existsSync(join(libs, 'libnss3.so'))) {
    mkdirSync(libs, { recursive: true });
    JSON.parse(readFileSync(join(B, 'debian-libs.json'), 'utf8')).packages.forEach(({ url, sha256 }) => {
      const deb = join(browserDeps, url.split('/').pop());
      execFileSync('curl', ['-s', '-f', '-o', deb, url]);
      const got = createHash('sha256').update(readFileSync(deb)).digest('hex');
      if (got !== sha256) throw new Error(`${url}: SHA-256 ${got}, expected ${sha256}`);
      execFileSync('python3', ['-I', join(B, 'extract-deb-libs.py'), deb, libs], { stdio: 'ignore' });
    });
  }
  return browserDeps;
}

const names = Object.keys(ACTIONS).filter((n) => !only || only.includes(n));
// the package: its parameters kept as they are (the database credential, __ims_oauth_s2s, set
// once by a developer, see DATABASE.md; never printed or changed here)
if (!dry) {
  // only a namespace the credential opens (another one answers empty lists, not an error)
  const visible = await (await fetch(`https://${HOST}/api/v1/namespaces`)).json().catch(() => []);
  if (!Array.isArray(visible) || !visible.includes(ns)) {
    throw new Error(`the namespace ${ns} is not open to the credential of ${HOST} (it opens: ${[].concat(visible).join(', ') || 'none'}): nothing deployed`);
  }
  // a package that isn't there yet: created; any other failure to read it stops the deploy (it
  // would otherwise be written again without its parameters)
  const had = await call('GET', `/packages/${PACKAGE}`).catch((e) => {
    if (/: 404 /.test(e.message)) return null;
    throw e;
  });
  await call('PUT', `/packages/${PACKAGE}?overwrite=true`, { publish: false, parameters: had?.parameters || [] });
}
for (const name of names) {
  const a = ACTIONS[name];
  const out = await esbuild.build({
    entryPoints: [join(HERE, 'actions', `${a.file || name}.mjs`)],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    write: false,
    nodePaths: [join(deps, 'node_modules')],
    // (the browser's libraries stay files of the zip)
    external: a.browser ? ['@sparticuz/chromium-min', 'puppeteer-core'] : [],
    logLevel: 'warning',
  });
  let code = out.outputFiles[0].text;
  let binary = false;
  if (a.browser) {
    const folder = browserFolder();
    writeFileSync(join(folder, 'index.js'), code);
    writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: name, private: true, main: 'index.js' }));
    const zip = join(dirname(folder), `${name}.zip`);
    rmSync(zip, { force: true });
    execFileSync('python3', ['-I', join(HERE, 'browser', 'zip-dir.py'), folder, zip], { stdio: 'ignore' });
    code = readFileSync(zip).toString('base64');
    binary = true;
  }
  const annotations = [{ key: 'web-export', value: a.web }];
  if (a.web) annotations.push({ key: 'web-custom-options', value: true }, { key: 'final', value: true });
  const body = {
    exec: {
      kind: 'nodejs:20', code, main: 'main', ...(binary ? { binary: true } : {}),
    },
    limits: { timeout: a.timeout || 60000, memory: a.memory || 256, ...(a.concurrency ? { concurrency: a.concurrency } : {}) },
    annotations,
  };
  if (dry) console.log(`(dry run) ${name}: ${(code.length / 1024).toFixed(0)} KB, ${a.web ? 'web' : 'private'}`);
  else {
    const r = await call('PUT', `/actions/${PACKAGE}/${name}?overwrite=true`, body);
    console.log(`${name}: deployed version ${r.version}, ${(code.length / 1024).toFixed(0)} KB, ${a.web ? `web: https://${ns}.adobeioruntime.net/api/v1/web/${PACKAGE}/${name}` : 'private'}`);
  }
}
console.log(`libraries: ${JSON.stringify(JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).dependencies)}`);
