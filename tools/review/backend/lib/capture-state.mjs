/*
 * The capture's own record (Files <space>/capture/state.json), written by the capture action
 * only (one run at a time: <space>/capture/lock.json):
 *   { firstSeen: { <page>: ISO }  when a page was first seen published without a shot,
 *     problems: { <page>: { source, reason, at, tries } }  sources to correct (404, redirect),
 *     lastRun: { at, took, done: [...], failed: [...], waiting }, health: { at, ok, detail } }
 */
import { listAll } from './listall.mjs';
const pre = (space) => (!space || space === 'std' ? '' : `${space}/`);
export const stateFile = (space) => `${pre(space)}capture/state.json`;
export const lockFile = (space) => `${pre(space)}capture/lock.json`;

export async function readCaptureState(files, space) {
  try {
    const s = JSON.parse((await files.read(stateFile(space))).toString());
    return {
      firstSeen: {}, problems: {}, lastRun: null, health: null, ...s,
    };
  } catch (e) {
    return {
      firstSeen: {}, problems: {}, lastRun: null, health: null,
    };
  }
}

export const writeCaptureState = (files, space, s) => files.write(stateFile(space), JSON.stringify(s));

/** the pages that have a shot history (file names of <space>/shots/) */
export async function pagesWithShots(files, space) {
  const list = await listAll(files, `${pre(space)}shots/`);
  return new Set(list.map((f) => f.name.split('/').pop().replace(/\.json$/, ''))
    .map((b) => Buffer.from(b, 'base64url').toString()));
}

/** where a tile of a version stored by the backend is: <space>/shot-tiles/<page b64>/<id>/<vp>/<file> */
export const tileFile = (space, page, id, vp, file) => `${pre(space)}shot-tiles/${Buffer.from(page).toString('base64url')}/${id}/${vp}/${file}`;
