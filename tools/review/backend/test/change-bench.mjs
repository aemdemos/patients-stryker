#!/usr/bin/env node
/*
 * The daily change check's pilot (Stage): how fast and how steady the content fingerprint of
 * source pages is, per way of loading them (capture action, op bench: nothing kept). Each chunk
 * of pages is one action run (started without waiting, then its result read): timings per page,
 * the run's duration and memory (GB-seconds, what App Builder counts), and the fingerprints.
 * usage: node tools/review/backend/test/change-bench.mjs --pages <pages.json> --mode <name>
 *   [--tabs 1] [--chunk 10] [--parallel 1] [--out <file.json>]
 * modes: full (as the shots: everything, scrolled, settled), visual (full + image fingerprint),
 *   lite (no images, media or fonts, DOM ready, short waits), nojs (lite and JavaScript off)
 */
import { readFileSync, writeFileSync } from 'fs';
import { TEST, apiOf } from '../target.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const MODES = {
  full: { js: true, lite: false, waitUntil: 'load', wait: 1500, pause: 150, settle: 4000, scroll: true },
  visual: {
    js: true, lite: false, waitUntil: 'load', wait: 1500, pause: 150, settle: 4000, scroll: true, visual: true,
  },
  lite: { js: true, lite: true, waitUntil: 'domcontentloaded', wait: 300, pause: 40, settle: 2000, scroll: true },
  nojs: { js: false, lite: true, waitUntil: 'domcontentloaded', wait: 0, pause: 0, settle: 0, scroll: false },
};
const name = opt('--mode', 'lite');
const mode = MODES[name];
if (!mode) throw new Error(`--mode: ${Object.keys(MODES).join(', ')}`);
const pages = JSON.parse(readFileSync(opt('--pages'), 'utf8'));
const tabs = Number(opt('--tabs', '1'));
const chunk = Number(opt('--chunk', '10'));
const parallel = Number(opt('--parallel', '1'));
const ns = opt('--ns', TEST.ns);
const API = `https://${apiOf(ns)}/api/v1/namespaces/${ns}`;

async function runChunk(list) {
  const resp = await fetch(`${API}/actions/std-review/capture?blocking=false`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'bench', pages: list, mode, tabs, etags: args.includes('--etags') }),
  });
  const { activationId } = await resp.json();
  for (let i = 0; i < 200; i += 1) {
    await new Promise((r) => { setTimeout(r, 3000); });
    const a = await fetch(`${API}/activations/${activationId}`);
    if (a.status === 200) {
      const act = await a.json();
      const memory = act.annotations?.find((x) => x.key === 'limits')?.value?.memory || 2048;
      const body = act.response?.result?.body;
      if (!body?.pages) console.error(`run of ${list.length} pages: ${act.response?.status} ${JSON.stringify(act.response?.result).slice(0, 300)}`);
      return { ...(body || {}), duration: act.duration, gbs: (act.duration / 1000) * (memory / 1024) };
    }
  }
  throw new Error(`activation ${activationId}: no result`);
}

const chunks = [];
for (let i = 0; i < pages.length; i += chunk) chunks.push(pages.slice(i, i + chunk));
const t0 = Date.now();
const runs = [];
let next = 0;
await Promise.all(Array.from({ length: parallel }, async () => {
  while (next < chunks.length) {
    const c = chunks[next];
    next += 1;
    runs.push(await runChunk(c));
  }
}));
const wall = Date.now() - t0;
const all = runs.flatMap((r) => r.pages || []);
const ok = all.filter((p) => !p.error);
const ms = ok.map((p) => p.ms).sort((a, b) => a - b);
const q = (f) => ms[Math.min(ms.length - 1, Math.floor(ms.length * f))];
const gbs = runs.reduce((n, r) => n + (r.gbs || 0), 0);
const summary = {
  mode: name, tabs, chunk, parallel, pages: all.length, errors: all.filter((p) => p.error).length,
  perPage: { median: q(0.5), p90: q(0.9), max: ms[ms.length - 1] },
  runTimePerPage: Math.round(runs.reduce((n, r) => n + r.duration, 0) / all.length),
  wallPerPage: Math.round(wall / all.length),
  gbsPerPage: +(gbs / all.length).toFixed(2),
  launchMs: Math.round(runs.reduce((n, r) => n + (r.launchMs || 0), 0) / runs.length),
  visualMs: ok.some((p) => p.visualMs) ? Math.round(ok.reduce((n, p) => n + p.visualMs, 0) / ok.length) : 0,
  errorSample: all.filter((p) => p.error).slice(0, 3).map((p) => `${p.page}: ${p.error}`),
};
console.log(JSON.stringify(summary));
if (opt('--out')) writeFileSync(opt('--out'), JSON.stringify({ summary, pages: all }, null, 1));
