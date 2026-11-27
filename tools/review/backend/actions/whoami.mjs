/*
 * Web action `whoami` (27 Nov 2026, the DA app proof, branch da-app-v3): who is signed in, as
 * Adobe says. The review tool run as a Document Authoring app gets the user's Adobe (IMS) access
 * token from DA (DA_SDK); it sends it here (authorization: Bearer …) and this action asks Adobe
 * IMS for the profile: a valid token gives the user's verified email, a faked or expired one is
 * refused by Adobe. The token is used for that one call only: never stored, logged or returned.
 * Only tokens issued to the apps listed in CLIENTS (DA's) count: a token another Adobe app got
 * for the user is not taken as a sign-in to the review.
 * GET → { email, name, userId, client, expiresAt, checkedBy } or 401 { error }
 */

const IMS = 'https://ims-na1.adobelogin.com';
// the apps whose tokens count: Document Authoring
const CLIENTS = ['darkalley'];
// the hosts the tool runs on: the branch previews and published sites of the review's site, its
// DA preview (where DA serves apps to signed-in users), the local preview
const ORIGINS = [
  /^https:\/\/[a-z0-9-]+--stryker-com--strykerenterprise\.aem\.(page|live)$/,
  /^https:\/\/[a-z0-9-]+--stryker-com--strykerenterprise\.preview\.da\.live$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function cors(params) {
  const origin = params.__ow_headers?.origin || '';
  if (!ORIGINS.some((re) => re.test(origin))) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'authorization',
    'access-control-max-age': '600',
    vary: 'origin',
  };
}
const reply = (params, statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors(params) },
  body,
});
const fail = (params, statusCode, code, message) => reply(params, statusCode, { error: { code, message } });

/** the token's claims, read only to see which app it was issued to and when it ends (Adobe checks it) */
function claimsOf(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  } catch (e) {
    return {};
  }
}

export async function main(params) {
  if ((params.__ow_method || '').toLowerCase() === 'options') return reply(params, 204, '');
  const token = String(params.__ow_headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return fail(params, 401, 'no-token', 'Open the tool from Document Authoring: no Adobe sign-in came with the request.');
  const claims = claimsOf(token);
  if (!CLIENTS.includes(claims.client_id)) {
    return fail(params, 401, 'other-app', 'This Adobe sign-in was not made by Document Authoring.');
  }
  try {
    const resp = await fetch(`${IMS}/ims/profile/v1`, { headers: { authorization: `Bearer ${token}` } });
    if (!resp.ok) return fail(params, 401, 'not-accepted', `Adobe did not accept the sign-in (${resp.status}).`);
    const p = await resp.json();
    if (!p.email) return fail(params, 401, 'no-email', 'Adobe gave no email for this sign-in.');
    const created = Number(claims.created_at) || 0;
    const life = Number(claims.expires_in) || 0;
    return reply(params, 200, {
      email: p.email,
      name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' '),
      userId: p.userId,
      emailVerified: p.emailVerified,
      client: claims.client_id,
      expiresAt: created && life ? new Date(created + life).toISOString() : null,
      checkedBy: 'Adobe IMS',
    });
  } catch (e) {
    return fail(params, 502, 'ims', 'Adobe could not be asked just now.');
  }
}
