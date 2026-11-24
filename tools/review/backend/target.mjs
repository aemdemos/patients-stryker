/*
 * Where the review's backend runs, for the scripts and tests on this machine (not bundled into
 * the actions). Production since 24 Nov 2026; Stage (where it ran before) only with --ns
 * 892544-strykerstdreview-stage or REVIEW_TARGET=stage.
 * Each workspace's Runtime key is in Settings for its own host (Settings keeps one per host):
 * Stage's for adobeioruntime.net, Production's for runtime.adobe.io (the same Runtime API).
 */
export const WORKSPACES = {
  production: { ns: '892544-strykerstdreview', api: 'runtime.adobe.io' },
  stage: { ns: '892544-strykerstdreview-stage', api: 'adobeioruntime.net' },
};
export const TARGET = WORKSPACES[process.env.REVIEW_TARGET || 'production'];
export const NS = TARGET.ns;

/** the Runtime API host whose key opens a namespace */
export const apiOf = (ns = NS) => (Object.values(WORKSPACES).find((w) => w.ns === ns) || TARGET).api;

/** a private action's blocking call (admin, capture) */
export const actionUrl = (ns = NS, action = 'admin') => `https://${apiOf(ns)}/api/v1/namespaces/${ns}/actions/std-review/${action}?blocking=true&result=true`;

/** the web actions (public; the invitation in a header) */
export const webBase = (ns = NS) => `https://${ns}.adobeioruntime.net/api/v1/web/std-review`;
