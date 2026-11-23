/*
 * Calls to I/O Runtime from inside an action, with the action's own credential (the environment
 * of every action: __OW_API_HOST, __OW_API_KEY, __OW_NAMESPACE): start the capture, set up its
 * schedule. Never used outside the backend.
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
 * the capture's schedule: a trigger fed by the alarms package (cron), a rule to the capture
 * action; enabled false removes them
 */
export async function schedule({ cron = '*/15 * * * *', enabled = true, space = 'main' } = {}) {
  const ns = namespace();
  const trigger = `/${ns}/review-capture`;
  const out = [];
  // (the feed first gets a DELETE: setting up again replaces the old schedule)
  out.push(['feed delete', (await ow('POST', 'whisk.system/actions/alarms/alarm?blocking=true', {
    authKey: process.env.__OW_API_KEY, lifecycleEvent: 'DELETE', triggerName: trigger,
  })).status]);
  out.push(['rule delete', (await ow('DELETE', '_/rules/review-capture-rule')).status]);
  out.push(['trigger delete', (await ow('DELETE', '_/triggers/review-capture')).status]);
  if (!enabled) return out;
  out.push(['trigger', (await ow('PUT', '_/triggers/review-capture?overwrite=true', {
    parameters: [{ key: 'op', value: 'run' }, { key: 'space', value: space }],
    annotations: [{ key: 'feed', value: '/whisk.system/alarms/alarm' }],
  })).status]);
  const feed = await ow('POST', 'whisk.system/actions/alarms/alarm?blocking=true', {
    authKey: process.env.__OW_API_KEY, lifecycleEvent: 'CREATE', triggerName: trigger, cron, trigger_payload: { op: 'run', space },
  });
  out.push(['feed', feed.status, JSON.stringify(feed.body).slice(0, 200)]);
  out.push(['rule', (await ow('PUT', '_/rules/review-capture-rule?overwrite=true', {
    trigger, action: `/${ns}/std-review/capture`,
  })).status]);
  return out;
}
