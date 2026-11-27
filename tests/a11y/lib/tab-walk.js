/**
 * Tab order, keyboard traps, skip link and cookie banner checks.
 * All checks press real keys and read the focused element afterwards.
 */

const settle = (page, ms = 300) => page.waitForTimeout(ms);

/** Short, comparable description of a tab stop. */
export const brief = (s) => ({
  i: s.i,
  role: s.role,
  name: s.name,
  tag: s.tag,
  href: s.href,
  container: s.container,
  ...(s.inFrame ? { frame: s.frameUrl || s.frame } : {}),
});

/**
 * The focused element, following focus into iframes (one level deep).
 * Returns { isBody: true } when nothing on the page has focus.
 */
export async function activeInfo(page) {
  const info = await page.evaluate(() => window.kbdHelpers && window.kbdHelpers.activeInfo());
  if (!info || !info.isIframe) return info;
  try {
    const handle = await page.evaluateHandle(() => window.kbdHelpers.deepActive());
    const element = handle.asElement();
    const frame = element ? await element.contentFrame() : null;
    await handle.dispose();
    if (frame) {
      const inner = await frame.evaluate(() => window.kbdHelpers && window.kbdHelpers.activeInfo());
      if (inner && !inner.isBody) {
        return {
          ...inner,
          key: `${info.key}>${inner.key}`,
          inFrame: true,
          frameUrl: frame.url().split('?')[0],
          // position and visibility are those of the iframe on the page
          rect: info.rect,
          fixed: info.fixed,
          hidden: info.hidden,
          container: info.container,
        };
      }
    }
  } catch (e) {
    // cross-process frame not reachable: report the iframe itself
  }
  return { ...info, inFrame: true };
}

/**
 * Presses Tab from the top of the page until focus returns to the start.
 * onStop(stop) runs while each new stop is focused (used for focus captures).
 */
export async function walkForward(page, cfg, onStop) {
  const stops = [];
  const seen = new Map();
  let completed = false;
  let trap = null;
  let repeats = 0;
  let presses = 0;
  while (presses < cfg.maxTabs) {
    presses += 1;
    await page.keyboard.press('Tab');
    const info = await activeInfo(page);
    if (!info || info.isBody) {
      if (stops.length) {
        completed = true;
        break;
      }
    } else if (stops.length && info.key === stops[0].key) {
      completed = true;
      break;
    } else if (stops.length && info.key === stops[stops.length - 1].key) {
      repeats += 1;
      if (repeats >= cfg.trapRepeat - 1) {
        trap = { type: 'stuck', from: stops.length - 1, to: stops.length - 1 };
        break;
      }
    } else if (seen.has(info.key)) {
      trap = { type: 'loop', from: seen.get(info.key), to: stops.length - 1 };
      break;
    } else {
      repeats = 0;
      const stop = { ...info, i: stops.length };
      seen.set(stop.key, stop.i);
      stops.push(stop);
      if (onStop) await onStop(stop);
    }
  }
  return {
    stops, completed, trap, presses, limitReached: !completed && !trap,
  };
}

const dialogOf = (page) => page.evaluate(() => {
  const H = window.kbdHelpers;
  const a = H.deepActive();
  const d = a && a.closest('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]');
  return d && H.isVisible(d) ? H.mark(d) : null;
});

/**
 * Describes a trap found by the forward walk: can Shift+Tab leave it, and if it is
 * an open modal, does Escape release it (allowed: modals may hold focus).
 */
export async function analyseTrap(page, walk) {
  const { trap, stops } = walk;
  const members = stops.slice(trap.from, trap.to + 1);
  const keys = new Set(members.map((m) => m.key));
  const dialogId = await dialogOf(page);
  let escapedBackward = false;
  for (let n = 0; n < members.length + 2 && !escapedBackward; n += 1) {
    await page.keyboard.press('Shift+Tab');
    const info = await activeInfo(page);
    if (!info || info.isBody || !keys.has(info.key)) escapedBackward = true;
  }
  let releasedByEscape = false;
  if (dialogId) {
    await page.keyboard.press('Escape');
    await settle(page, 400);
    releasedByEscape = await page.evaluate((id) => !window.kbdHelpers.isVisible(window.kbdHelpers.get(id)), dialogId);
  }
  return {
    type: trap.type,
    direction: 'forward',
    location: members[0] ? members[0].container : 'unknown',
    stops: members.map(brief),
    inDialog: !!dialogId,
    escapedBackward,
    releasedByEscape,
    failure: !(dialogId && releasedByEscape),
  };
}

/**
 * Walks back with Shift+Tab from the end of the page and compares the order
 * with the forward walk.
 */
export async function walkBackward(page, walk, cfg) {
  const expected = walk.stops.map((s) => s.key).reverse();
  const keys = [];
  const names = [];
  let repeats = 0;
  let trap = null;
  const limit = walk.stops.length + 5;
  for (let n = 0; n < limit; n += 1) {
    await page.keyboard.press('Shift+Tab');
    const info = await activeInfo(page);
    if (!info || info.isBody) {
      if (keys.length) break;
    } else if (keys.length && info.key === keys[0]) {
      break;
    } else if (keys.length && info.key === keys[keys.length - 1]) {
      repeats += 1;
      if (repeats >= cfg.trapRepeat - 1) {
        trap = {
          type: 'stuck',
          direction: 'backward',
          location: info.container,
          stops: [brief(info)],
          failure: true,
        };
        break;
      }
    } else {
      repeats = 0;
      keys.push(info.key);
      names.push(info.name || info.tag);
    }
  }
  const firstMismatch = expected.findIndex((k, i) => keys[i] !== k);
  const matches = firstMismatch === -1 && keys.length === expected.length;
  let mismatch = null;
  if (!matches) {
    const idx = firstMismatch === -1 ? Math.min(keys.length, expected.length) : firstMismatch;
    const expectedStop = walk.stops[walk.stops.length - 1 - idx];
    mismatch = {
      index: idx,
      expected: expectedStop ? expectedStop.name || expectedStop.tag : '(end)',
      actual: names[idx] || '(end)',
    };
  }
  return {
    count: keys.length, matches, mismatch, trap, keys,
  };
}

/** Positive tabindex, hidden focusable stops and jumps against the visual order. */
export async function analyseStops(page, walk, viewport, cfg) {
  const positiveTabindex = await page.evaluate(() => [...document.querySelectorAll('[tabindex]')]
    .filter((el) => el.tabIndex > 0)
    .map((el) => {
      const d = window.kbdHelpers.describe(el);
      return { tag: d.tag, name: d.name, tabindex: el.tabIndex };
    }));
  const hiddenFocusable = walk.stops
    .filter((s) => s.hidden && s.hidden.length)
    .map((s) => ({ ...brief(s), reasons: s.hidden }));
  const visualJumps = [];
  const threshold = Math.round(viewport.height * cfg.visualJumpRatio);
  let prev = null;
  walk.stops.forEach((s) => {
    if (s.fixed || s.inFrame || (s.hidden && s.hidden.length)) return;
    if (prev && s.rect.y < prev.rect.y - threshold) {
      visualJumps.push({ from: brief(prev), to: brief(s), upPx: prev.rect.y - s.rect.y });
    }
    prev = s;
  });
  return { positiveTabindex, hiddenFocusable, visualJumps };
}

/**
 * Skip link: one of the first three stops links to a target on the same page,
 * and Enter moves focus there (or the next Tab continues from there).
 */
export async function checkSkipLink(page, walk) {
  const candidate = walk.stops.slice(0, 3)
    .find((s) => !s.inFrame && s.href && /^#./.test(s.href));
  if (!candidate) return { status: 'missing' };
  const target = await page.evaluate((id) => {
    const H = window.kbdHelpers;
    const el = H.get(id);
    if (!el) return null;
    let name = el.getAttribute('href').slice(1);
    try { name = decodeURIComponent(name); } catch (e) { /* keep raw */ }
    const t = document.getElementById(name) || document.getElementsByName(name)[0];
    return t ? H.mark(t) : null;
  }, candidate.id);
  if (!target) return { status: 'broken', reason: 'link target not found', link: brief(candidate) };
  await page.evaluate((id) => window.kbdHelpers.focus(id), candidate.id);
  await page.keyboard.press('Enter');
  await settle(page);
  if (await page.evaluate((id) => window.kbdHelpers.activeWithin(id), target)) {
    return { status: 'works', how: 'Enter moves focus to the target', link: brief(candidate) };
  }
  await page.keyboard.press('Tab');
  const continues = await page.evaluate((id) => {
    const H = window.kbdHelpers;
    const t = H.get(id);
    const a = H.deepActive();
    if (!t || !a) return false;
    // focus is after the target: the DOCUMENT_POSITION_FOLLOWING (4) bit is set
    return t.contains(a) || (t.compareDocumentPosition(a) % 8) >= 4;
  }, target);
  await page.evaluate(() => window.kbdHelpers.blurActive());
  return continues
    ? { status: 'works', how: 'the next Tab continues from the target', link: brief(candidate) }
    : { status: 'broken', reason: 'focus does not move to the target', link: brief(candidate) };
}

const DEFAULT_BANNERS = [
  { banner: '#onetrust-banner-sdk', dismiss: '#onetrust-reject-all-handler, #onetrust-accept-btn-handler' },
  { banner: '#CybotCookiebotDialog', dismiss: '#CybotCookiebotDialogBodyButtonDecline, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll' },
  { banner: '#truste-consent-track, #truste-consent-content', dismiss: '#truste-consent-required, #truste-consent-button' },
  { banner: '.cc-window', dismiss: '.cc-deny, .cc-dismiss' },
];

/**
 * Reports the cookie banner's keyboard behaviour (can Tab reach it, does Enter
 * on its dismiss button close it), then makes sure it is gone.
 * Returns { present: false } when no banner is shown.
 */
export async function checkCookieBanner(page, siteBanner, waitMs) {
  const defs = siteBanner ? [siteBanner] : DEFAULT_BANNERS;
  // consent banners often appear a few seconds after load
  await page.waitForFunction((sels) => sels.some((s) => {
    const el = document.querySelector(s);
    return el && window.kbdHelpers.isVisible(el);
  }), defs.map((d) => d.banner), { timeout: waitMs }).catch(() => {});
  for (const def of defs) {
    const found = await page.evaluate(({ banner, dismiss }) => {
      const H = window.kbdHelpers;
      const b = document.querySelector(banner);
      if (!b || !H.isVisible(b)) return null;
      const d = (dismiss && (b.querySelector(dismiss) || document.querySelector(dismiss))) || null;
      return {
        bannerId: H.mark(b),
        dismissId: d ? H.mark(d) : null,
        dismissName: d ? H.accName(d) : null,
      };
    }, def);
    if (found) {
      let reachedAfterTabs = null;
      for (let n = 1; n <= 15 && reachedAfterTabs === null; n += 1) {
        await page.keyboard.press('Tab');
        if (await page.evaluate((id) => window.kbdHelpers.activeWithin(id), found.bannerId)) {
          reachedAfterTabs = n;
        }
      }
      let dismissedByKeyboard = false;
      if (found.dismissId) {
        await page.evaluate((id) => window.kbdHelpers.focus(id), found.dismissId);
        await page.keyboard.press('Enter');
        await settle(page, 800);
        dismissedByKeyboard = await page.evaluate((id) => !window.kbdHelpers.isVisible(window.kbdHelpers.get(id)), found.bannerId);
      }
      if (!dismissedByKeyboard && found.dismissId) {
        await page.evaluate((id) => window.kbdHelpers.get(id).click(), found.dismissId);
        await settle(page, 800);
      }
      return {
        present: true,
        selector: def.banner,
        dismissName: found.dismissName,
        reachedAfterTabs,
        dismissedByKeyboard,
      };
    }
  }
  return { present: false };
}

/** Hides a banner that is still shown after dismissal (e.g. consent not stored). */
export async function hideCookieBanner(page, selector) {
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove());
  }, selector);
}
