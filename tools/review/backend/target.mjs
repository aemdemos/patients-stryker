/*
 * The review's two App Builder workspaces, for the scripts and tests on this machine (not
 * bundled into the actions):
 * - Production (`892544-strykerstdreview`): the live review (customers, the AOE team), since
 *   24 Nov 2026. The everyday operations act on it (admin.mjs, set-status.mjs, summarise.mjs,
 *   the shot scripts): LIVE.
 * - Stage (`892544-strykerstdreview-stage`): the test workspace, test data only. Deploys and
 *   the test suites go there by default: TEST. A change reaches Production only after its tests
 *   passed on Stage, with deploy.mjs --production (RUNBOOK / backend README, "Releasing").
 * REVIEW_TARGET=stage|production points both at one workspace; --ns names one directly.
 * Each workspace's Runtime key is in Settings for its own host (Settings keeps one per host):
 * Stage's for adobeioruntime.net, Production's for runtime.adobe.io (the same Runtime API).
 */
export const WORKSPACES = {
  production: { name: 'production', ns: '892544-strykerstdreview', api: 'runtime.adobe.io' },
  stage: { name: 'stage', ns: '892544-strykerstdreview-stage', api: 'adobeioruntime.net' },
};
const pick = (name) => {
  if (!WORKSPACES[name]) throw new Error(`REVIEW_TARGET: stage or production, not "${name}"`);
  return WORKSPACES[name];
};
/** where tests and deploys go: Stage */
export const TEST = pick(process.env.REVIEW_TARGET || 'stage');
/** where the everyday operations act: Production */
export const LIVE = pick(process.env.REVIEW_TARGET || 'production');

/** the Runtime API host whose key opens a namespace */
export const apiOf = (ns) => (Object.values(WORKSPACES).find((w) => w.ns === ns) || TEST).api;

/** a private action's blocking call (admin, capture); the tests' workspace unless named */
export const actionUrl = (ns = TEST.ns, action = 'admin') => `https://${apiOf(ns)}/api/v1/namespaces/${ns}/actions/std-review/${action}?blocking=true&result=true`;

/** the web actions (public; the invitation in a header) */
export const webBase = (ns = TEST.ns) => `https://${ns}.adobeioruntime.net/api/v1/web/std-review`;
