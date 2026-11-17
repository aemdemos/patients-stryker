#!/usr/bin/env node
/*
 * Builds and deploys the review backend's actions to App Builder (I/O Runtime) with the OpenWhisk
 * REST API; the workspace's runtime credential is added by the environment (Settings, host
 * adobeioruntime.net), never passed here. Each action is bundled into one file with esbuild; the
 * libraries are installed outside the project (--deps, default /tmp/run-outputs/review-backend-deps)
 * from this folder's package.json.
 * usage: node tools/review/backend/deploy.mjs [--ns 892544-strykerstdreview-stage] [--deps <dir>]
 *   [--only state,save,results,admin] [--dry-run]
 */
import {
  existsSync, mkdirSync, copyFileSync, readFileSync,
} from 'fs';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const ns = opt('--ns', '892544-strykerstdreview-stage');
const deps = opt('--deps', '/tmp/run-outputs/review-backend-deps');
const only = opt('--only', '') ? opt('--only').split(',') : null;
const dry = args.includes('--dry-run');
const API = `https://adobeioruntime.net/api/v1/namespaces/${ns}`;
const PACKAGE = 'std-review';

// web: reviewer-facing (invitation token); private: only with the project's credential
const ACTIONS = {
  state: { web: true },
  save: { web: true },
  results: { web: true, timeout: 120000 },
  admin: { web: false, timeout: 300000 },
};

if (!existsSync(join(deps, 'node_modules', '@adobe', 'aio-lib-state'))) {
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

const names = Object.keys(ACTIONS).filter((n) => !only || only.includes(n));
if (!dry) await call('PUT', `/packages/${PACKAGE}?overwrite=true`, { publish: false });
for (const name of names) {
  const a = ACTIONS[name];
  const out = await esbuild.build({
    entryPoints: [join(HERE, 'actions', `${name}.mjs`)],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    write: false,
    nodePaths: [join(deps, 'node_modules')],
    logLevel: 'warning',
  });
  const code = out.outputFiles[0].text;
  const annotations = [{ key: 'web-export', value: a.web }];
  if (a.web) annotations.push({ key: 'web-custom-options', value: true }, { key: 'final', value: true });
  const body = {
    exec: { kind: 'nodejs:20', code, main: 'main' },
    limits: { timeout: a.timeout || 60000, memory: 256 },
    annotations,
  };
  if (dry) console.log(`(dry run) ${name}: ${(code.length / 1024).toFixed(0)} KB, ${a.web ? 'web' : 'private'}`);
  else {
    const r = await call('PUT', `/actions/${PACKAGE}/${name}?overwrite=true`, body);
    console.log(`${name}: deployed version ${r.version}, ${(code.length / 1024).toFixed(0)} KB, ${a.web ? `web: https://${ns}.adobeioruntime.net/api/v1/web/${PACKAGE}/${name}` : 'private'}`);
  }
}
console.log(`libraries: ${JSON.stringify(JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).dependencies)}`);
