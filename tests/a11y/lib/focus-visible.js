/**
 * Visible focus: after the Tab walk, every stop is captured unfocused and then
 * focused, back to back. If the pixels around the element are identical, focus
 * causes no visible change.
 *
 * - Unfocused first: on-blur behaviour (e.g. form validation turning a border red)
 *   must not count as a focus indicator.
 * - The walk has already focused every stop once, so both captures show the
 *   same "visited" state of the page.
 * - Focus is set by script while the page is in keyboard mode (no mouse is ever
 *   used), so :focus-visible styles apply as they do for a Tab press; the check
 *   records whether :focus-visible matched.
 * - Both captures scroll the element to the middle of the viewport; screenshots
 *   stop CSS animations and hide the text caret.
 * - "Covered" (fully hidden behind e.g. a sticky header) is measured during the
 *   walk, where the browser itself scrolled the element on Tab.
 */

const PAD = 8;
const SHOT = { animations: 'disabled', caret: 'hide', timeout: 10000 };

function clipFor(rect, viewport) {
  const x = Math.max(0, Math.floor(rect.x - PAD));
  const y = Math.max(0, Math.floor(rect.y - PAD));
  const right = Math.min(viewport.width, Math.ceil(rect.x + rect.w + PAD));
  const bottom = Math.min(viewport.height, Math.ceil(rect.y + rect.h + PAD));
  if (right - x < 2 || bottom - y < 2) return null;
  return {
    x, y, width: right - x, height: bottom - y,
  };
}

/** Called during the walk while `stop` is focused: is it fully covered? */
export async function checkObscured(page, stop) {
  if (stop.inFrame || (stop.hidden && stop.hidden.length)) return false;
  return page.evaluate((id) => {
    const H = window.kbdHelpers;
    const el = H.get(id);
    return !!el && H.obscured(el);
  }, stop.id);
}

const moved = (a, b) => ['x', 'y', 'w', 'h'].some((k) => Math.abs(a[k] - b[k]) > 1);

/**
 * @param obscured Map stop index → true when the element was covered on focus
 * @returns {{checked: number, missing: object[], notChecked: object[]}}
 */
export async function checkFocusVisible(page, stops, viewport, obscured, brief) {
  const missing = [];
  const notChecked = [];
  let checked = 0;
  for (const stop of stops) {
    if (stop.inFrame) {
      notChecked.push({ ...brief(stop), reason: 'inside an iframe' });
    } else if (stop.hidden && stop.hidden.length) {
      checked += 1;
      missing.push({ ...brief(stop), reason: `element hidden while focused (${stop.hidden.join(', ')})` });
    } else if (obscured.get(stop.i)) {
      checked += 1;
      missing.push({ ...brief(stop), reason: 'covered by another element when focused (e.g. a sticky header)' });
    } else {
      await page.evaluate(() => window.kbdHelpers.blurActive());
      const before = await page.evaluate((id) => window.kbdHelpers.prepareCapture(id), stop.id);
      const clip = before && clipFor(before.rect, viewport);
      if (!clip) {
        notChecked.push({ ...brief(stop), reason: before ? 'outside the viewport' : 'element removed' });
      } else {
        const unfocused = await page.screenshot({ ...SHOT, clip }).catch(() => null);
        const state = await page.evaluate((id) => {
          const H = window.kbdHelpers;
          const el = H.get(id);
          el.focus({ preventScroll: true });
          return { active: H.isActive(id), focusVisible: el.matches(':focus-visible') };
        }, stop.id);
        const after = await page.evaluate((id) => window.kbdHelpers.prepareCapture(id), stop.id);
        if (!unfocused || !state.active || !after) {
          notChecked.push({ ...brief(stop), reason: 'could not be focused again' });
        } else if (moved(after.rect, before.rect)) {
          checked += 1; // moves or resizes on focus: visible
        } else {
          checked += 1;
          const focused = await page.screenshot({ ...SHOT, clip }).catch(() => null);
          if (focused && focused.equals(unfocused)) {
            let reason = after.style === before.style ? 'no change on focus' : 'styles change on focus but nothing visible changes';
            if (!state.focusVisible) reason += ' (:focus-visible did not match)';
            missing.push({ ...brief(stop), reason });
          }
        }
      }
    }
  }
  await page.evaluate(() => window.kbdHelpers.blurActive());
  return { checked, missing, notChecked };
}
