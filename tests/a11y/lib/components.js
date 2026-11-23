/**
 * Keyboard operation of interactive components, found by ARIA pattern (not by
 * block name) so the same checks run on the source page and the EDS page.
 *
 * Every key result is { result: 'pass' | 'fail' | 'n/a', note?, severity }.
 * severity 'failure' fails the EDS test; 'warning' is reported only.
 *
 * The page stays read-only: the page helpers cancel off-page link clicks and
 * form submission; Enter is never pressed in form fields. If a key still
 * navigates away (script navigation), the page is reloaded and the check fails.
 */

const settle = (page, ms = 300) => page.waitForTimeout(ms);

// failing these keys is a failure; anything not listed is a warning
const FAILURE_KEYS = {
  menu: ['Enter', 'Space', 'Escape', 'ArrowDown'],
  disclosure: ['Enter', 'Space'],
  accordion: ['Enter', 'Space'],
  'hidden-submenu': ['Open'],
  tabs: ['ArrowRight', 'ArrowLeft', 'Enter', 'Space'],
  carousel: ['Next (Enter)', 'Next (Space)', 'Previous (Enter)', 'Previous (Space)', 'Slide picker (Enter)'],
  modal: ['Open (Enter)', 'Focus moves in', 'Focus stays inside', 'Escape', 'Focus returns'],
  'open-dialog': ['Focus stays inside', 'Escape'],
  field: ['Reachable', 'Typing', 'Space', 'Arrow keys'],
};

const res = (kind, key, result, note) => ({
  result,
  ...(note ? { note } : {}),
  severity: (FAILURE_KEYS[kind] || []).includes(key) ? 'failure' : 'warning',
});

// ---------- discovery (runs in the page) ----------

function discover({ max, maxFields }) {
  const H = window.kbdHelpers;
  const interactive = (el) => el.matches('a[href], button, summary, input, select, textarea, [role="button"], [role="link"], [role="menuitem"], [tabindex]:not([tabindex="-1"])');
  const label = (el) => H.accName(el).slice(0, 60);
  const where = (el) => {
    const c = el.closest('header, nav, main, footer, aside, [role="dialog"]');
    return c ? c.tagName.toLowerCase() : 'body';
  };
  const out = {
    menus: [],
    disclosures: [],
    accordions: [],
    hiddenSubmenus: [],
    tablists: [],
    carousels: [],
    modalOpeners: [],
    openDialogs: [],
    fields: [],
  };
  const push = (list, item) => { if (list.length < max) list.push(item); };
  const dialogSel = '[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"], .modal';

  // disclosure-type triggers (aria-expanded, details/summary)
  const seen = new Set();
  document.querySelectorAll('[aria-expanded], summary').forEach((el) => {
    if (!interactive(el) || !H.isVisible(el)) return;
    const role = el.getAttribute('role');
    if (role === 'tab' || role === 'combobox' || el.matches('input, select, textarea') || el.closest('[role="tablist"]')) return;
    const haspopup = (el.getAttribute('aria-haspopup') || '').toLowerCase();
    if (haspopup === 'dialog' || haspopup === 'listbox') return;
    const id = H.mark(el);
    if (seen.has(id)) return;
    seen.add(id);
    const controls = (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)
      .map((i) => document.getElementById(i)).filter(Boolean);
    const roleMenu = controls.some((c) => c.getAttribute('role') === 'menu');
    const tag = el.tagName.toLowerCase();
    const item = {
      id,
      tag,
      role: role || (tag === 'a' ? 'link' : 'button'),
      name: label(el),
      isLink: tag === 'a' && el.hasAttribute('href'),
      roleMenu,
      where: where(el),
    };
    if (tag === 'summary' || el.closest('h1, h2, h3, h4, h5, h6') || el.closest('[class*="accordion" i]')) {
      push(out.accordions, { ...item, kind: 'accordion' });
    } else if (roleMenu || haspopup === 'menu' || haspopup === 'true' || el.closest('header, nav, [role="navigation"], [role="banner"]')) {
      push(out.menus, { ...item, kind: 'menu' });
    } else {
      push(out.disclosures, { ...item, kind: 'disclosure' });
    }
  });

  // navigation submenus without any aria-expanded trigger (hover / focus menus)
  document.querySelectorAll('header li, nav li, [role="navigation"] li').forEach((li) => {
    if (li.hasAttribute('aria-expanded') || li.querySelector('[aria-expanded]')) return;
    const link = li.querySelector(':scope > a[href], :scope > button, :scope > * > a[href]');
    const sub = li.querySelector(':scope > ul, :scope > ol, :scope > div');
    if (!link || !sub || sub.contains(link) || !H.isVisible(link) || H.isVisible(sub)) return;
    const subLinks = sub.querySelectorAll('a[href]').length;
    if (!subLinks) return;
    push(out.hiddenSubmenus, {
      kind: 'hidden-submenu', id: H.mark(link), subId: H.mark(sub), name: label(link), subLinks, where: where(li),
    });
  });

  // tab lists (tabs may be owned via aria-owns rather than nested)
  document.querySelectorAll('[role="tablist"]').forEach((tl) => {
    const owned = (tl.getAttribute('aria-owns') || '').split(/\s+/).filter(Boolean)
      .map((i) => document.getElementById(i)).filter(Boolean);
    const tabs = [...new Set([...tl.querySelectorAll('[role="tab"]'), ...owned.filter((e) => e.getAttribute('role') === 'tab')])]
      .filter((t) => H.isVisible(t));
    if (tabs.length < 2) return;
    push(out.tablists, {
      kind: 'tabs', id: H.mark(tl), tabIds: tabs.map((t) => H.mark(t)), name: tabs.map(label).join(' / ').slice(0, 60), where: where(tl),
    });
  });

  // carousels: aria-roledescription or common slider class names; outermost only
  const carouselRe = /(^|[\s_-])(carousel|slider|slideshow|swiper|slick|owl-carousel|splide|glide|flickity)([\s_-]|$)/i;
  const candidates = [...document.querySelectorAll('[aria-roledescription], [class]')].filter((el) => {
    const rd = (el.getAttribute('aria-roledescription') || '').toLowerCase();
    if (rd.includes('carousel') || rd.includes('slideshow')) return true;
    return typeof el.className === 'string' && carouselRe.test(el.className);
  }).filter((el) => H.isVisible(el) && el.getBoundingClientRect().height > 40);
  const roots = candidates.filter((el) => !candidates.some((o) => o !== el && o.contains(el)));
  roots.forEach((root) => {
    const scope = root.querySelector('button, [role="button"], a[href]') ? root : (root.parentElement || root);
    const controls = [...scope.querySelectorAll('button, [role="button"], [role="tab"], a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((c) => H.isVisible(c));
    const text = (c) => `${H.accName(c)} ${typeof c.className === 'string' ? c.className : ''}`;
    const find = (re) => controls.find((c) => re.test(text(c)));
    const next = find(/next|forward|right|›|»/i);
    const prev = find(/prev|previous|back|left|‹|«/i);
    const pause = find(/pause|stop|play/i);
    const dot = controls.find((c) => c !== next && c !== prev && c !== pause
      && (c.getAttribute('role') === 'tab' || /dot|bullet|indicator|pager|go to slide|slide \d/i.test(text(c)))
      && c.getAttribute('aria-current') !== 'true' && c.getAttribute('aria-selected') !== 'true'
      && !/active|current|selected/i.test(typeof c.className === 'string' ? c.className : ''));
    const btn = (c) => (c ? { id: H.mark(c), name: label(c), isLink: c.tagName === 'A' && c.getAttribute('role') !== 'button' } : null);
    push(out.carousels, {
      kind: 'carousel',
      id: H.mark(root),
      name: (root.getAttribute('aria-label') || (typeof root.className === 'string' ? root.className.split(/\s+/)[0] : 'carousel')).slice(0, 60),
      next: btn(next),
      prev: btn(prev),
      pause: btn(pause),
      dot: btn(dot),
      where: where(root),
    });
  });

  // modal openers: aria-haspopup=dialog, data-(bs-)toggle=modal, or a control/link pointing at a dialog
  const targets = new Set();
  document.querySelectorAll('[aria-haspopup="dialog"], [data-toggle="modal"], [data-bs-toggle="modal"], [aria-controls], a[href^="#"]').forEach((el) => {
    if (!interactive(el) || !H.isVisible(el)) return;
    let target = null;
    const sel = el.getAttribute('data-target') || el.getAttribute('data-bs-target');
    if (sel) { try { target = document.querySelector(sel); } catch (e) { target = null; } }
    const ctrl = el.getAttribute('aria-controls');
    if (!target && ctrl) target = document.getElementById(ctrl.split(/\s+/)[0]);
    const href = el.getAttribute('href');
    if (!target && href && href.length > 1 && href.startsWith('#')) {
      try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (e) { target = null; }
    }
    const isDialog = target && target.matches(dialogSel);
    if (!isDialog && el.getAttribute('aria-haspopup') !== 'dialog') return;
    const targetId = target ? H.mark(target) : null;
    if (targetId && targets.has(targetId)) return;
    if (targetId) targets.add(targetId);
    push(out.modalOpeners, {
      kind: 'modal', id: H.mark(el), name: label(el), targetId, isLink: el.tagName === 'A' && el.getAttribute('role') !== 'button', where: where(el),
    });
  });
  document.querySelectorAll(dialogSel).forEach((d) => {
    if (!H.isVisible(d)) return;
    push(out.openDialogs, {
      kind: 'open-dialog', id: H.mark(d), name: (d.getAttribute('aria-label') || label(d)).slice(0, 60), where: where(d),
    });
  });

  // form fields
  const fieldEls = [...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea')]
    .filter((f) => !f.disabled && H.isVisible(f));
  const radioGroups = new Set();
  fieldEls.forEach((f) => {
    if (out.fields.length >= maxFields) return;
    const type = (f.tagName === 'INPUT' ? (f.getAttribute('type') || 'text') : f.tagName).toLowerCase();
    if (type === 'radio') {
      const group = `${f.form ? H.mark(f.form) : 'doc'}|${f.name}`;
      if (f.name && radioGroups.has(group)) return;
      radioGroups.add(group);
    }
    const strict = H.accName(f, { withPlaceholder: false });
    out.fields.push({
      kind: 'field',
      id: H.mark(f),
      type,
      name: (H.accName(f) || f.name || type).slice(0, 60),
      named: !!strict,
      placeholderOnly: !strict && !!f.getAttribute('placeholder'),
      readOnly: !!f.readOnly,
      where: where(f),
    });
  });
  return out;
}

// ---------- shared steps ----------

async function press(ctx, key, ms) {
  await ctx.page.keyboard.press(key === 'Space' ? ' ' : key);
  await settle(ctx.page, ms);
  return ctx.checkNavigation();
}

const focusEl = (ctx, id) => ctx.page.evaluate((i) => window.kbdHelpers.focus(i), id);
const activeWithin = (ctx, id) => ctx.page.evaluate((i) => window.kbdHelpers.activeWithin(i), id);
const isActive = (ctx, id) => ctx.page.evaluate((i) => window.kbdHelpers.isActive(i), id);
const visible = (ctx, id) => ctx.page.evaluate((i) => window.kbdHelpers.isVisible(window.kbdHelpers.get(i)), id);
const clickEl = (ctx, id) => ctx.page.evaluate((i) => {
  const el = window.kbdHelpers.get(i);
  if (el) el.click();
}, id);
const blockedCount = (ctx) => ctx.page.evaluate(() => window.kbdHelpers.blocked.length);

const triggerState = (ctx, id) => ctx.page.evaluate((i) => {
  const H = window.kbdHelpers;
  const el = H.get(i);
  if (!el || !el.isConnected) return null;
  const expanded = el.tagName === 'SUMMARY'
    ? !!(el.parentElement && el.parentElement.open)
    : el.getAttribute('aria-expanded') === 'true';
  const ctrl = (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)
    .map((c) => document.getElementById(c)).filter(Boolean);
  return { expanded, controlsVisible: ctrl.length ? ctrl.some((c) => H.isVisible(c)) : null };
}, id);

const sameState = (a, b) => !!a && !!b && a.expanded === b.expanded && a.controlsVisible === b.controlsVisible;

async function restoreTrigger(ctx, id, initial) {
  if (sameState(await triggerState(ctx, id), initial)) return;
  await press(ctx, 'Escape');
  if (sameState(await triggerState(ctx, id), initial)) return;
  await clickEl(ctx, id);
  await settle(ctx.page);
  if (!sameState(await triggerState(ctx, id), initial)) ctx.dirty = true;
}

async function openTrigger(ctx, item) {
  const s = await triggerState(ctx, item.id);
  if (s && s.expanded) return true;
  await focusEl(ctx, item.id);
  if (await press(ctx, 'Enter')) return false;
  let now = await triggerState(ctx, item.id);
  if (now && now.expanded) return true;
  await clickEl(ctx, item.id);
  await settle(ctx.page);
  now = await triggerState(ctx, item.id);
  return !!(now && now.expanded);
}

// ---------- component checks ----------

async function toggleWith(ctx, item, key) {
  const initial = await triggerState(ctx, item.id);
  if (!initial) return res(item.kind, key, 'n/a', 'element no longer on the page');
  if (!await focusEl(ctx, item.id)) return res(item.kind, key, 'fail', 'cannot be focused');
  const blockedBefore = await blockedCount(ctx);
  if (await press(ctx, key)) return res(item.kind, key, 'fail', `${key} navigates to another page`);
  const after = await triggerState(ctx, item.id);
  const changed = after && !sameState(after, initial);
  const blockedLink = (await blockedCount(ctx)) > blockedBefore;
  await restoreTrigger(ctx, item.id, initial);
  if (changed) return res(item.kind, key, 'pass');
  return res(item.kind, key, 'fail', blockedLink ? `${key} follows the link instead of toggling` : `${key} does not toggle it`);
}

async function escapeCloses(ctx, item) {
  const initial = await triggerState(ctx, item.id);
  if (!initial) return res(item.kind, 'Escape', 'n/a', 'element no longer on the page');
  if (!await openTrigger(ctx, item)) {
    await restoreTrigger(ctx, item.id, initial);
    return res(item.kind, 'Escape', 'n/a', 'could not be opened');
  }
  if (await press(ctx, 'Escape')) return res(item.kind, 'Escape', 'fail', 'Escape navigates away');
  const after = await triggerState(ctx, item.id);
  // closed = back to the closed state (a controlled element may stay visible, e.g.
  // a hamburger whose aria-controls is the whole nav)
  const closed = after && !after.expanded
    && (initial.expanded || after.controlsVisible === initial.controlsVisible);
  const focusBack = await activeWithin(ctx, item.id);
  await restoreTrigger(ctx, item.id, initial);
  if (!closed) return res(item.kind, 'Escape', 'fail', 'Escape does not close it');
  if (!focusBack) return res(item.kind, 'Escape', 'fail', 'closes, but focus does not return to the trigger');
  return res(item.kind, 'Escape', 'pass');
}

async function menuArrows(ctx, item) {
  const initial = await triggerState(ctx, item.id);
  if (!await openTrigger(ctx, item)) {
    await restoreTrigger(ctx, item.id, initial);
    return res(item.kind, 'ArrowDown', 'n/a', 'could not be opened');
  }
  const inMenu = () => ctx.page.evaluate(() => {
    const a = window.kbdHelpers.deepActive();
    return a && a.closest('[role="menu"]') ? `${a.getAttribute('role')}|${a.kbdId || window.kbdHelpers.mark(a)}` : null;
  });
  const first = await inMenu();
  await press(ctx, 'ArrowDown');
  const second = await inMenu();
  await restoreTrigger(ctx, item.id, initial);
  if (second && second !== first) return res(item.kind, 'ArrowDown', 'pass');
  return res(item.kind, 'ArrowDown', 'fail', 'arrow keys do not move through the menu items');
}

async function accordionTabIntoPanel(ctx, item) {
  const initial = await triggerState(ctx, item.id);
  if (!await openTrigger(ctx, item)) {
    await restoreTrigger(ctx, item.id, initial);
    return res(item.kind, 'Tab into panel', 'n/a', 'could not be opened');
  }
  const panelId = await ctx.page.evaluate((i) => {
    const H = window.kbdHelpers;
    const el = H.get(i);
    let panel = null;
    const ctrl = el.getAttribute('aria-controls');
    if (ctrl) panel = document.getElementById(ctrl.split(/\s+/)[0]);
    if (!panel && el.tagName === 'SUMMARY') panel = el.parentElement;
    if (!panel) return null;
    const focusables = [...panel.querySelectorAll(H.FOCUSABLE)].filter((f) => f !== el && H.isVisible(f));
    return focusables.length ? H.mark(panel) : null;
  }, item.id);
  if (!panelId) {
    await restoreTrigger(ctx, item.id, initial);
    return res(item.kind, 'Tab into panel', 'n/a', 'panel has no focusable content');
  }
  await focusEl(ctx, item.id);
  await press(ctx, 'Tab');
  const inside = await activeWithin(ctx, panelId);
  await restoreTrigger(ctx, item.id, initial);
  return inside
    ? res(item.kind, 'Tab into panel', 'pass')
    : res(item.kind, 'Tab into panel', 'fail', 'Tab skips the opened panel');
}

async function checkTrigger(ctx, item) {
  const keys = {};
  const buttonLike = !item.isLink || item.role === 'button';
  keys.Enter = await toggleWith(ctx, item, 'Enter');
  keys.Space = buttonLike ? await toggleWith(ctx, item, 'Space') : res(item.kind, 'Space', 'n/a', 'link: Space is not expected');
  if (item.kind !== 'accordion') keys.Escape = await escapeCloses(ctx, item);
  if (item.roleMenu) keys.ArrowDown = await menuArrows(ctx, item);
  if (item.kind === 'accordion') keys['Tab into panel'] = await accordionTabIntoPanel(ctx, item);
  return keys;
}

async function checkHiddenSubmenu(ctx, item) {
  await focusEl(ctx, item.id);
  await settle(ctx.page);
  let how = null;
  if (await visible(ctx, item.subId)) how = 'opens on focus';
  if (!how) {
    await press(ctx, 'ArrowDown');
    if (await visible(ctx, item.subId)) how = 'opens with ArrowDown';
  }
  await press(ctx, 'Escape');
  await ctx.page.evaluate(() => window.kbdHelpers.blurActive());
  return {
    Open: how
      ? res(item.kind, 'Open', 'pass', how)
      : res(item.kind, 'Open', 'fail', `submenu (${item.subLinks} links) does not open with the keyboard (no aria-expanded trigger; opens on hover only)`),
  };
}

async function checkTabs(ctx, item) {
  const keys = {};
  const ids = item.tabIds;
  const n = ids.length;
  const selectedIndex = () => ctx.page.evaluate((list) => list.findIndex((i) => window.kbdHelpers.get(i).getAttribute('aria-selected') === 'true'), ids);
  const original = Math.max(0, await selectedIndex());
  const arrow = async (key, from, expected) => {
    await focusEl(ctx, ids[from]);
    await press(ctx, key, 200);
    return (await isActive(ctx, ids[expected]))
      ? res('tabs', key, 'pass')
      : res('tabs', key, 'fail', `${key} does not move to the ${key === 'Home' ? 'first' : key === 'End' ? 'last' : 'next'} tab`);
  };
  keys.ArrowRight = await arrow('ArrowRight', original, (original + 1) % n);
  keys.ArrowLeft = await arrow('ArrowLeft', (original + 1) % n, original);
  keys.Home = await arrow('Home', n - 1, 0);
  keys.End = await arrow('End', 0, n - 1);
  const activate = async (key) => {
    const current = await selectedIndex();
    const target = ids.findIndex((_, i) => i !== current);
    await focusEl(ctx, ids[target]);
    await press(ctx, key);
    return (await selectedIndex()) === target
      ? res('tabs', key, 'pass')
      : res('tabs', key, 'fail', `${key} does not select the focused tab`);
  };
  keys.Enter = await activate('Enter');
  keys.Space = await activate('Space');
  const sel = Math.max(0, await selectedIndex());
  const panelId = await ctx.page.evaluate((i) => {
    const t = window.kbdHelpers.get(i);
    const p = document.getElementById((t.getAttribute('aria-controls') || '').split(/\s+/)[0]);
    return p ? window.kbdHelpers.mark(p) : null;
  }, ids[sel]);
  if (panelId) {
    await focusEl(ctx, ids[sel]);
    await press(ctx, 'Tab');
    keys['Tab into panel'] = (await activeWithin(ctx, panelId))
      ? res('tabs', 'Tab into panel', 'pass')
      : res('tabs', 'Tab into panel', 'fail', 'Tab does not move into the selected panel');
  } else {
    keys['Tab into panel'] = res('tabs', 'Tab into panel', 'n/a', 'tab has no aria-controls panel');
  }
  // restore the originally selected tab
  if ((await selectedIndex()) !== original) {
    await clickEl(ctx, ids[original]);
    await settle(ctx.page);
  }
  return keys;
}

const carouselSignature = (ctx, id) => ctx.page.evaluate((i) => {
  const H = window.kbdHelpers;
  const root = H.get(i);
  if (!root) return '';
  const rr = root.getBoundingClientRect();
  return [...root.querySelectorAll('img, h1, h2, h3, h4, h5, h6, p, [class*="slide" i]')].filter((e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return cx >= rr.left && cx <= rr.right && cy >= rr.top && cy <= rr.bottom && H.isVisible(e);
  }).map((e) => `${e.currentSrc || e.textContent.trim().slice(0, 30)}@${Math.round(e.getBoundingClientRect().left - rr.left)}`)
    .join('|');
}, id);

async function checkCarousel(ctx, item) {
  const keys = {};
  await ctx.page.evaluate((i) => window.kbdHelpers.get(i).scrollIntoView({ block: 'center', behavior: 'instant' }), item.id);
  const s0 = await carouselSignature(ctx, item.id);
  await settle(ctx.page, ctx.cfg.autoplayWaitMs);
  const autoplay = (await carouselSignature(ctx, item.id)) !== s0;
  if (autoplay) {
    if (!item.pause) {
      keys.Pause = res('carousel', 'Pause', 'fail', 'moves on its own and has no pause control');
    } else {
      await focusEl(ctx, item.pause.id);
      await press(ctx, item.pause.isLink ? 'Enter' : 'Space');
      const a = await carouselSignature(ctx, item.id);
      await settle(ctx.page, 4000);
      keys.Pause = (await carouselSignature(ctx, item.id)) === a
        ? res('carousel', 'Pause', 'pass')
        : res('carousel', 'Pause', 'fail', 'pause control does not stop it');
    }
  }
  const control = async (label, btn, key) => {
    if (!btn) return;
    if (key === 'Space' && btn.isLink) {
      keys[`${label} (Space)`] = res('carousel', `${label} (Space)`, 'n/a', 'link: Space is not expected');
      return;
    }
    await focusEl(ctx, btn.id);
    const before = await carouselSignature(ctx, item.id);
    if (await press(ctx, key, 900)) {
      keys[`${label} (${key})`] = res('carousel', `${label} (${key})`, 'fail', 'navigates away');
      return;
    }
    const changed = (await carouselSignature(ctx, item.id)) !== before;
    keys[`${label} (${key})`] = changed
      ? res('carousel', `${label} (${key})`, 'pass', autoplay ? 'carousel also autoplays: result may be affected' : undefined)
      : res('carousel', `${label} (${key})`, 'fail', 'slide does not change');
  };
  await control('Next', item.next, 'Enter');
  await control('Next', item.next, 'Space');
  await control('Previous', item.prev, 'Enter');
  await control('Previous', item.prev, 'Space');
  await control('Slide picker', item.dot, 'Enter');
  if (!item.next && !item.prev && !item.dot) {
    keys.Controls = res('carousel', 'Controls', 'fail', 'no keyboard controls found (previous / next / slide picker)');
  }
  return keys;
}

const DIALOG_SEL = '[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"], .modal';

async function containment(ctx, kind, dialogId) {
  const count = await ctx.page.evaluate((i) => {
    const H = window.kbdHelpers;
    return [...H.get(i).querySelectorAll(H.FOCUSABLE)].filter((f) => H.isVisible(f)).length;
  }, dialogId);
  for (let n = 0; n < Math.min(count + 2, 15); n += 1) {
    await press(ctx, 'Tab', 100);
    if (!await activeWithin(ctx, dialogId)) return res(kind, 'Focus stays inside', 'fail', 'Tab moves focus out of the dialog');
  }
  return res(kind, 'Focus stays inside', 'pass');
}

async function closeDialog(ctx, dialogId) {
  if (!await visible(ctx, dialogId)) return;
  await ctx.page.evaluate(({ i }) => {
    const H = window.kbdHelpers;
    const d = H.get(i);
    const close = [...d.querySelectorAll('button, [role="button"], a')].find((b) => /close|dismiss|×|✕/i.test(`${H.accName(b)} ${b.className}`));
    if (close) close.click();
  }, { i: dialogId });
  await settle(ctx.page, 500);
  if (await visible(ctx, dialogId)) ctx.dirty = true;
}

async function checkModal(ctx, item) {
  const keys = {};
  const before = await ctx.page.evaluate((sel) => [...document.querySelectorAll(sel)]
    .filter((d) => window.kbdHelpers.isVisible(d)).map((d) => window.kbdHelpers.mark(d)), DIALOG_SEL);
  await focusEl(ctx, item.id);
  if (await press(ctx, 'Enter', 700)) return { 'Open (Enter)': res('modal', 'Open (Enter)', 'fail', 'Enter navigates away') };
  const dialogId = await ctx.page.evaluate(({ sel, target, skip }) => {
    const H = window.kbdHelpers;
    const t = target ? H.get(target) : null;
    if (t && H.isVisible(t)) return H.mark(t);
    const d = [...document.querySelectorAll(sel)].find((el) => H.isVisible(el) && !skip.includes(H.mark(el)));
    return d ? H.mark(d) : null;
  }, { sel: DIALOG_SEL, target: item.targetId, skip: before });
  if (!dialogId) return { 'Open (Enter)': res('modal', 'Open (Enter)', 'fail', 'Enter does not open the dialog') };
  keys['Open (Enter)'] = res('modal', 'Open (Enter)', 'pass');
  keys['Focus moves in'] = (await activeWithin(ctx, dialogId))
    ? res('modal', 'Focus moves in', 'pass')
    : res('modal', 'Focus moves in', 'fail', 'focus stays outside the open dialog');
  keys['Focus stays inside'] = await containment(ctx, 'modal', dialogId);
  await press(ctx, 'Escape', 500);
  const closed = !await visible(ctx, dialogId);
  keys.Escape = closed ? res('modal', 'Escape', 'pass') : res('modal', 'Escape', 'fail', 'Escape does not close the dialog');
  if (closed) {
    keys['Focus returns'] = (await activeWithin(ctx, item.id))
      ? res('modal', 'Focus returns', 'pass')
      : res('modal', 'Focus returns', 'fail', 'focus does not return to the button that opened it');
  } else {
    await closeDialog(ctx, dialogId);
  }
  return keys;
}

async function checkOpenDialog(ctx, item) {
  const keys = {};
  await ctx.page.evaluate((i) => {
    const H = window.kbdHelpers;
    const f = [...H.get(i).querySelectorAll(H.FOCUSABLE)].find((el) => H.isVisible(el));
    if (f) f.focus();
  }, item.id);
  keys['Focus stays inside'] = await containment(ctx, 'open-dialog', item.id);
  await press(ctx, 'Escape', 500);
  const closed = !await visible(ctx, item.id);
  keys.Escape = closed ? res('open-dialog', 'Escape', 'pass') : res('open-dialog', 'Escape', 'fail', 'Escape does not close the dialog');
  if (!closed) await closeDialog(ctx, item.id);
  return keys;
}

const TEXT_TYPES = ['text', 'email', 'tel', 'search', 'url', 'password', 'number', 'textarea'];

async function checkField(ctx, item, reachable) {
  const keys = {};
  keys.Reachable = reachable === null
    ? res('field', 'Reachable', 'n/a', 'Tab walk did not finish')
    : res('field', 'Reachable', reachable ? 'pass' : 'fail', reachable ? undefined : 'not in the Tab order');
  if (item.named) keys.Named = res('field', 'Named', 'pass');
  else keys.Named = res('field', 'Named', 'fail', item.placeholderOnly ? 'placeholder only, no label' : 'no accessible name');
  const { page } = ctx;
  const get = () => page.evaluate((i) => {
    const el = window.kbdHelpers.get(i);
    return el ? { value: el.value, checked: el.checked } : null;
  }, item.id);
  if (TEXT_TYPES.includes(item.type) && !item.readOnly) {
    const orig = await get();
    await focusEl(ctx, item.id);
    await page.keyboard.press('ControlOrMeta+A');
    const typed = item.type === 'number' ? '7' : 'kbd7';
    await page.keyboard.type(typed);
    const now = await get();
    await page.evaluate(({ i, v }) => { window.kbdHelpers.get(i).value = v; }, { i: item.id, v: orig.value });
    keys.Typing = now && now.value.includes(typed)
      ? res('field', 'Typing', 'pass')
      : res('field', 'Typing', 'fail', 'typed text does not appear');
  } else if (item.type === 'checkbox') {
    const orig = await get();
    await focusEl(ctx, item.id);
    await press(ctx, 'Space', 150);
    const now = await get();
    if (now && now.checked !== orig.checked) await press(ctx, 'Space', 150);
    keys.Space = now && now.checked !== orig.checked
      ? res('field', 'Space', 'pass')
      : res('field', 'Space', 'fail', 'Space does not tick the checkbox');
  } else if (item.type === 'radio') {
    const group = await page.evaluate((i) => {
      const H = window.kbdHelpers;
      const el = H.get(i);
      const scope = el.form || document;
      const radios = [...scope.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`)].filter((r) => H.isVisible(r));
      return { ids: radios.map((r) => H.mark(r)), checked: radios.map((r) => r.checked) };
    }, item.id);
    if (group.ids.length < 2) {
      keys['Arrow keys'] = res('field', 'Arrow keys', 'n/a', 'single radio button');
    } else {
      await focusEl(ctx, group.ids[0]);
      await press(ctx, 'ArrowDown', 150);
      const moved = await isActive(ctx, group.ids[1]);
      await page.evaluate(({ ids, checked }) => ids.forEach((i, n) => { window.kbdHelpers.get(i).checked = checked[n]; }), group);
      keys['Arrow keys'] = moved
        ? res('field', 'Arrow keys', 'pass')
        : res('field', 'Arrow keys', 'fail', 'arrow keys do not move between the options');
    }
  } else if (item.type === 'select') {
    const info = await page.evaluate((i) => {
      const el = window.kbdHelpers.get(i);
      return { value: el.value, options: el.options.length, multiple: el.multiple };
    }, item.id);
    if (info.options < 2 || info.multiple) {
      keys['Arrow keys'] = res('field', 'Arrow keys', 'n/a', 'fewer than two options');
    } else {
      await focusEl(ctx, item.id);
      if (await press(ctx, 'ArrowDown', 200)) {
        keys['Arrow keys'] = res('field', 'Arrow keys', 'pass', 'changing the option navigates to another page');
      } else {
        const now = await get();
        await page.evaluate(({ i, v }) => { window.kbdHelpers.get(i).value = v; }, { i: item.id, v: info.value });
        keys['Arrow keys'] = now && now.value !== info.value
          ? res('field', 'Arrow keys', 'pass')
          : res('field', 'Arrow keys', 'fail', 'arrow keys do not change the option');
      }
    }
  }
  await page.evaluate(() => window.kbdHelpers.blurActive());
  return keys;
}

// ---------- runner ----------

const LISTS = [
  ['menus', checkTrigger],
  ['disclosures', checkTrigger],
  ['accordions', checkTrigger],
  ['hiddenSubmenus', checkHiddenSubmenu],
  ['tablists', checkTabs],
  ['carousels', checkCarousel],
  ['modalOpeners', checkModal],
  ['openDialogs', checkOpenDialog],
  ['fields', null],
];

/**
 * Runs every component check. `ctx` = { page, cfg, checkNavigation, reload }.
 * `stopIds` = element ids reached by the Tab walk (null if it did not finish).
 */
export default async function runComponentChecks(ctx, stopIds) {
  const opts = { max: ctx.cfg.maxPerComponent, maxFields: ctx.cfg.maxFormFields };
  let found = await ctx.page.evaluate(discover, opts);
  // reachability is known only for the page session that was walked
  const reach = found.fields.map((f) => (stopIds ? stopIds.has(f.id) : null));
  const results = {};
  const counts = {};
  for (const [list, check] of LISTS) {
    results[list] = [];
    counts[list] = found[list].length;
    for (let idx = 0; idx < counts[list]; idx += 1) {
      const item = found[list][idx];
      if (item) {
        let keys;
        try {
          keys = check ? await check(ctx, item) : await checkField(ctx, item, reach[idx]);
        } catch (e) {
          keys = { Error: { result: 'n/a', note: e.message.split('\n')[0], severity: 'warning' } };
          ctx.dirty = true;
        }
        results[list].push({
          kind: item.kind, name: item.name, where: item.where, keys,
        });
        if (ctx.dirty) {
          // state could not be restored: reload and find the same components again
          await ctx.reload();
          ctx.dirty = false;
          found = await ctx.page.evaluate(discover, opts);
        }
      }
    }
  }
  return results;
}
