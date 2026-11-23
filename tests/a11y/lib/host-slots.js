/**
 * Cross-worker cap on concurrent pages per host.
 *
 * Playwright workers are separate processes, so the cap uses lock directories:
 * slot N for a host is taken by creating <locksDir>/<host>/slot-N (mkdir is
 * atomic). A slot whose owner process has exited is reclaimed.
 */
import fs from 'fs';
import path from 'path';

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

function ownerAlive(slotDir) {
  try {
    const pid = Number(fs.readFileSync(path.join(slotDir, 'pid'), 'utf8'));
    if (!pid) return false;
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM means the process exists but belongs to someone else
    return e.code === 'EPERM';
  }
}

function tryTake(slotDir) {
  try {
    fs.mkdirSync(slotDir);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    // the owner may not have written its pid yet: only reclaim slots older than 5s
    const age = Date.now() - fs.statSync(slotDir).mtimeMs;
    if (age < 5000 || ownerAlive(slotDir)) return false;
    fs.rmSync(slotDir, { recursive: true, force: true });
    try {
      fs.mkdirSync(slotDir);
    } catch (e2) {
      return false;
    }
  }
  fs.writeFileSync(path.join(slotDir, 'pid'), String(process.pid));
  return true;
}

/**
 * Waits for a free slot for `host`.
 * @returns {Promise<{release: Function, waitedMs: number}>}
 */
export default async function acquireHostSlot(locksDir, host, limit, timeoutMs) {
  const hostDir = path.join(locksDir, host.replace(/[^a-z0-9.-]/gi, '_'));
  fs.mkdirSync(hostDir, { recursive: true });
  const started = Date.now();
  const slots = Array.from({ length: Math.max(1, limit) }, (_, i) => path.join(hostDir, `slot-${i}`));
  const attempt = async () => {
    const slotDir = slots.find((dir) => tryTake(dir));
    if (slotDir) {
      return {
        waitedMs: Date.now() - started,
        release: () => fs.rmSync(slotDir, { recursive: true, force: true }),
      };
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for a free page slot on ${host}`);
    }
    await sleep(500);
    return attempt();
  };
  return attempt();
}
