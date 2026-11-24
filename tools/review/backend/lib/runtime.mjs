/*
 * Calls to I/O Runtime from inside an action, with the action's own credential (the environment
 * of every action: __OW_API_HOST, __OW_API_KEY, __OW_NAMESPACE): start the capture, set up the
 * schedules. Never used outside the backend.
 */
const host = () => process.env.__OW_API_HOST || 'https://adobeioruntime.net';
const auth = () => `Basic ${Buffer.from(process.env.__OW_API_KEY || '').toString('base64')}`;
export const namespace = () => process.env.__OW_NAMESPACE || '';

export async function ow(method, path, body) {
  const resp = await fetch(`${host()}/api/v1/namespaces/${path}`, {
    method,
    headers: { authorization: auth(), 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = { text: text.slice(0, 300) };
  }
  return { status: resp.status, body: json };
}

/** the capture action, started without waiting (a Refresh: the shot comes within minutes) */
export const startCapture = (space) => ow('POST', `_/actions/std-review/capture?blocking=false`, { op: 'run', space });

/**
 * one schedule: a trigger fed by the alarms package (cron) and a rule to an action, the payload
 * as its params; enabled false removes them. Setting up again replaces the old one.
 */
async function scheduleOne({
  name, action, cron, payload, enabled,
}) {
  const ns = namespace();
  const trigger = `/${ns}/${name}`;
  const out = [];
  out.push([`${name} feed delete`, (await ow('POST', 'whisk.system/actions/alarms/alarm?blocking=true', {
    authKey: process.env.__OW_API_KEY, lifecycleEvent: 'DELETE', triggerName: trigger,
  })).status]);
  out.push([`${name} rule delete`, (await ow('DELETE', `_/rules/${name}-rule`)).status]);
  out.push([`${name} trigger delete`, (await ow('DELETE', `_/triggers/${name}`)).status]);
  if (!enabled) return out;
  out.push([`${name} trigger`, (await ow('PUT', `_/triggers/${name}?overwrite=true`, {
    parameters: Object.entries(payload).map(([key, value]) => ({ key, value })),
    annotations: [{ key: 'feed', value: '/whisk.system/alarms/alarm' }],
  })).status]);
  const feed = await ow('POST', 'whisk.system/actions/alarms/alarm?blocking=true', {
    authKey: process.env.__OW_API_KEY, lifecycleEvent: 'CREATE', triggerName: trigger, cron, trigger_payload: payload,
  });
  out.push([`${name} feed`, feed.status]);
  out.push([`${name} rule`, (await ow('PUT', `_/rules/${name}-rule?overwrite=true`, {
    trigger, action: `/${ns}/std-review/${action}`,
  })).status]);
  return out;
}

/**
 * the backend's schedules: the capture (first shots, every 15 minutes), the live copies'
 * warm-up (every 5 minutes a container of the live action keeps its browser running, so a
 * reviewer's first Live copy doesn't wait for a container and a browser to start) and the
 * daily backup of every entry
 */
export async function schedule({ cron = '*/15 * * * *', warm = '*/5 * * * *', enabled = true, space = 'main' } = {}) {
  return [
    ...await scheduleOne({
      name: 'review-capture', action: 'capture', cron, payload: { op: 'run', space }, enabled,
    }),
    ...await scheduleOne({
      name: 'review-live-warm', action: 'live', cron: warm, payload: { op: 'warm' }, enabled,
    }),
    // every day at 02:15 UTC: every entry of both reviews to Files (lib/backup.mjs)
    ...await scheduleOne({
      name: 'review-backup', action: 'admin', cron: '15 2 * * *', payload: { op: 'backup' }, enabled,
    }),
  ];
}
