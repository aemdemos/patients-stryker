#!/usr/bin/env node
/*
 * Calls the review backend's private admin action (the project's credential is added by the
 * environment). Prints the JSON answer.
 * usage: node tools/review/backend/admin.mjs <op> [--name "…"] [--paths /us/en/a,/us/en/b]
 *   [--days 30] [--no-groups] [--results] [--role aoe] [--page /us/en/…] [--id <invite id>] [--json '<params>' | --json-file <file>]
 *   [--space std|main] [--host <branch>--stryker-com--strykerenterprise.aem.page] [--ns 892544-strykerstdreview-stage]
 * --space: the review the op works in (std, the standard pages, the default; main, the client
 * review of the migrated pages on main); --host: the invitation links to the tool on that preview
 * ops: setup | invite | revoke | invites | export | status | import | purge-invite | purge-test |
 *   shot-requests | shot-history | shot-add | shot-fail
 */
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const op = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const ns = opt('--ns', '892544-strykerstdreview-stage');
if (!op) {
  console.error('usage: admin.mjs <setup|invite|revoke|invites|export|status|import|purge-invite|purge-test> [options]');
  process.exit(2);
}
// (--json-file: params too large for a command line argument, e.g. shot-add)
const json = opt('--json-file') ? readFileSync(opt('--json-file'), 'utf8') : opt('--json');
const params = { op, ...(json ? JSON.parse(json) : {}) };
if (opt('--name')) params.name = opt('--name');
if (opt('--paths')) params.paths = opt('--paths').split(',').map((p) => p.trim());
if (opt('--days')) params.days = Number(opt('--days'));
if (args.includes('--no-groups')) params.groups = false;
if (args.includes('--results')) params.results = true;
if (opt('--role')) params.role = opt('--role');
if (opt('--page')) params.page = opt('--page');
if (opt('--id')) params.id = opt('--id');
if (opt('--space')) params.space = opt('--space');
if (opt('--host')) params.host = opt('--host');

/** the admin action's answer (blocking call; long ones are fetched by activation id) */
export async function admin(p, namespace = ns) {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${namespace}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

const out = await admin(params);
console.log(JSON.stringify(out, null, 1));
if (out?.error) process.exit(1);
