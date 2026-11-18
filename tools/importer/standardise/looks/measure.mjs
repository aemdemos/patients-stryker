#!/usr/bin/env node
/*
 * Base variants from measured looks (roadmap step 1): renders every as-is page (/rs) on the local
 * preview at desktop (1440) and phone (375) width and records, for every block on it (Columns and
 * the Fragment wrapper aside; the blocks inside fragments are measured), how it LOOKS: its frame,
 * its repeating unit (card, slide, item), the image's share, shape and place against the text,
 * the typography per role (title, body, link, button), its buttons, its counts, and a screenshot
 * at both widths. Raw values are kept (group.mjs buckets them), so the grouping can change without
 * rendering again. One page at a time; resumable (pages already measured are skipped).
 * usage: node tools/importer/standardise/looks/measure.mjs [--base http://localhost:3000]
 *   [--out /tmp/run-outputs/looks-v2] [--only <path>,<path>] [--limit n] [--reverse] [--force]
 * Blocks in closed tabs or accordions are measured after opening them.
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import { createRequire } from 'module';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const out = opt('--out', '/tmp/run-outputs/looks-v2');
const only = opt('--only', '') ? opt('--only').split(',') : null;
const limit = Number(opt('--limit', 0)) || Infinity;
const SKIP = ['columns', 'fragment', 'header', 'footer', 'header-corp', 'footer-corp'];
const BLOCKED = /altcha|captcha|googletagmanager|google-analytics|adobedtm|demdex|omtrdc|doubleclick|facebook|linkedin|hotjar|onetrust|cookielaw|qualtrics/;

const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
let list = pages.map((p) => p.path).filter((p) => !only || only.includes(p)).slice(0, limit);
// (a second runner can take the list from the end: both skip pages already measured)
if (args.includes('--reverse')) list = list.reverse();
mkdirSync(join(out, 'pages'), { recursive: true });
mkdirSync(join(out, 'shots'), { recursive: true });
const slug = (p) => p.replace(/^\//, '').replace(/\//g, '~');

/** what a block looks like: runs in the page, on the block element */
function measureBlock(el) {
  const hex = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return c || '';
    const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
    if (Number(a) === 0) return 'transparent';
    return `#${[r, g, b].map((x) => Number(x).toString(16).padStart(2, '0')).join('')}`;
  };
  const box = (x) => {
    const r = x.getBoundingClientRect();
    return {
      left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height,
    };
  };
  const visible = (x) => {
    const r = x.getBoundingClientRect();
    const s = getComputedStyle(x);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  // the block's own content: a block nested in it (cards in an accordion panel) is measured as a
  // block of its own, and doesn't make this block's look (the screenshot still shows it)
  const own = (x) => x.closest('.block') === el;
  const cs = getComputedStyle(el);
  const sec = el.closest('.section');
  const scs = sec ? getComputedStyle(sec) : null;
  const b = box(el);
  const surface = (s) => ({
    bg: hex(s.backgroundColor),
    bgImage: s.backgroundImage !== 'none',
    border: Number.parseFloat(s.borderTopWidth) > 0 || Number.parseFloat(s.borderLeftWidth) > 0
      ? `${s.borderTopWidth}/${s.borderLeftWidth} ${hex(s.borderTopColor)}` : '',
    radius: Number.parseFloat(s.borderTopLeftRadius) || 0,
    shadow: s.boxShadow !== 'none',
    padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]
      .map((v) => Number.parseFloat(v) || 0),
  });
  // the repeating unit: the container whose visible children are the most numerous and alike
  let units = [el];
  let best = 1;
  [...el.querySelectorAll('*')].filter(own).forEach((c) => {
    const kids = [...c.children].filter(visible).filter(own);
    if (kids.length < 2) return;
    const tag = kids[0].tagName;
    if (!kids.every((k) => k.tagName === tag)) return;
    // (text runs inside one paragraph are not units: a unit holds an image or several elements)
    if (!kids.every((k) => k.querySelector('img, picture, video, iframe') || k.children.length > 1)) return;
    if (kids.length > best) {
      best = kids.length;
      units = kids;
    }
  });
  // (a list of cards, slides or items comes first, even with one item: otherwise a single card's
  // halves, image and text, would be taken for units)
  const cardList = [...el.querySelectorAll('ul, ol')].filter(own).find((l) => [...l.children]
    .some((li) => visible(li) && li.querySelector('img, picture, video, iframe')));
  if (cardList) units = [...cardList.children].filter(visible);
  const ub = units.map(box);
  const perRow = ub.filter((u) => Math.abs(u.top - ub[0].top) < 6).length;
  const gap = ub.length > 1 && Math.abs(ub[1].top - ub[0].top) < 6
    ? ub[1].left - (ub[0].left + ub[0].width) : null;
  const unit = units[0];
  // text leaves: elements with their own visible text
  const allLeavesOf = (root) => [...root.querySelectorAll('*')].filter((x) => visible(x)
    && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));
  const leavesOf = (root) => allLeavesOf(root).filter(own);
  const isButton = (a) => {
    if (!a) return false;
    const s = getComputedStyle(a);
    return a.classList.contains('button') || hex(s.backgroundColor) !== 'transparent' || Number.parseFloat(s.borderTopWidth) > 0;
  };
  const roleOf = (x) => {
    // (a tab's label: its own role, the tab bar is a look of its own)
    if (x.closest('[role="tab"]')) return 'tab';
    const a = x.closest('a');
    if (a) return isButton(a) ? 'button' : 'link';
    // (an accordion item's label is its title, whether it sits in a heading or only in the toggle)
    if (x.closest('h1, h2, h3, h4, h5, h6, [aria-expanded]')) return 'title';
    return 'body';
  };
  const styleOf = (x) => {
    const s = getComputedStyle(x);
    return {
      family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase(),
      size: Number.parseFloat(s.fontSize),
      weight: Number(s.fontWeight) || 400,
      color: hex(s.color),
      upper: s.textTransform === 'uppercase',
      italic: s.fontStyle === 'italic',
      align: getComputedStyle(x.closest('p, h1, h2, h3, h4, h5, h6, li, div') || x).textAlign,
      lineHeight: Number.parseFloat(s.lineHeight) || null,
    };
  };
  const typography = (root) => {
    const roles = {};
    leavesOf(root).forEach((x) => {
      const role = roleOf(x);
      const len = [...x.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').length;
      const st = styleOf(x);
      const key = JSON.stringify(st);
      roles[role] = roles[role] || {};
      roles[role][key] = (roles[role][key] || 0) + len;
    });
    // per role: its three most used styles (by the text they carry), with their share
    return Object.fromEntries(Object.entries(roles).map(([role, styles]) => {
      const total = Object.values(styles).reduce((a, c) => a + c, 0);
      const top = Object.entries(styles).sort((a, c) => c[1] - a[1]).slice(0, 3)
        .map(([key, len]) => ({
          ...JSON.parse(key), share: Math.round((len / total) * 100) / 100,
        }));
      return [role, { styles: top, chars: total }];
    }));
  };
  // the image of the unit: the largest visible one, its share, shape and place against the text
  const imgs = [...unit.querySelectorAll('img, video, iframe')].filter(visible).filter(own);
  const img = imgs.sort((a, c) => box(c).width * box(c).height - box(a).width * box(a).height)[0];
  let image = null;
  if (img) {
    const ib = box(img);
    const ubx = box(unit);
    // the text's own boxes (not its element's: a link may hold both the image and the text)
    const texts = leavesOf(unit).flatMap((x) => [...x.childNodes]
      .filter((t) => t.nodeType === 3 && t.textContent.trim().length > 1)
      .map((t) => {
        const range = document.createRange();
        range.selectNodeContents(t);
        const r = range.getBoundingClientRect();
        return {
          left: r.left + window.scrollX,
          top: r.top + window.scrollY,
          width: r.width,
          height: r.height,
        };
      }))
      .filter((r) => r.width > 0 && r.height > 0);
    let place = 'alone';
    if (texts.length) {
      const t = {
        left: Math.min(...texts.map((x) => x.left)),
        top: Math.min(...texts.map((x) => x.top)),
        right: Math.max(...texts.map((x) => x.left + x.width)),
        bottom: Math.max(...texts.map((x) => x.top + x.height)),
      };
      if (ib.top + ib.height <= t.top + 6) place = 'above';
      else if (ib.top >= t.bottom - 6) place = 'below';
      else if (ib.left + ib.width <= t.left + 6) place = 'left';
      else if (ib.left >= t.right - 6) place = 'right';
      else place = 'behind';
    }
    image = {
      tag: img.tagName.toLowerCase(),
      share: Math.round((ib.width / Math.max(ubx.width, 1)) * 100) / 100,
      aspect: Math.round((ib.width / Math.max(ib.height, 1)) * 100) / 100,
      place,
      fit: getComputedStyle(img).objectFit,
    };
  }
  const anchors = [...el.querySelectorAll('a')].filter(visible).filter(own);
  const buttons = anchors.filter(isButton).map((a) => {
    const s = getComputedStyle(a);
    return {
      kind: hex(s.backgroundColor) !== 'transparent' ? 'filled' : 'outline',
      bg: hex(s.backgroundColor),
      border: hex(s.borderTopColor),
      color: hex(s.color),
      radius: Number.parseFloat(s.borderTopLeftRadius) || 0,
      upper: s.textTransform === 'uppercase',
    };
  });
  // a tab bar: how the selected tab is marked against the others (colour, underline, background)
  const tabsOf = () => {
    const tabs = [...el.querySelectorAll('[role="tab"]')].filter(own).filter(visible);
    if (!tabs.length) return null;
    // (the mark may sit on the tab or on the label inside it: the first visible line counts; the
    // text's colour and weight are the label's own)
    const mark = (t) => {
      const all = [t, ...t.querySelectorAll('*')];
      const line = (side) => all.map((x) => getComputedStyle(x))
        .filter((st) => Number.parseFloat(st[`border${side}Width`]) > 0)
        .map((st) => hex(st[`border${side}Color`]))
        .find((c) => c && c !== 'transparent') || '';
      const label = leavesOf(t)[0] || t;
      const ls = getComputedStyle(label);
      const bg = all.map((x) => hex(getComputedStyle(x).backgroundColor))
        .find((c) => c && c !== 'transparent') || 'transparent';
      return {
        color: hex(ls.color),
        bg,
        underline: line('Bottom'),
        overline: line('Top'),
        weight: Number(ls.fontWeight) || 400,
      };
    };
    const selected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    const other = tabs.find((t) => t !== selected);
    return { count: tabs.length, selected: mark(selected), other: other ? mark(other) : null };
  };
  // the content's box: everything visible in the block (the screenshot is cropped to it)
  const inner = [...el.querySelectorAll('img, picture, video, iframe, svg, a, button, input, select, textarea, table, canvas'), ...allLeavesOf(el), ...units]
    .filter(visible).map(box);
  const content = inner.length ? {
    left: Math.min(...inner.map((x) => x.left)),
    top: Math.min(...inner.map((x) => x.top)),
    right: Math.max(...inner.map((x) => x.left + x.width)),
    bottom: Math.max(...inner.map((x) => x.top + x.height)),
  } : {
    left: b.left, top: b.top, right: b.left + b.width, bottom: b.top + b.height,
  };
  return {
    content,
    type: el.dataset.blockName,
    classes: [...el.classList].filter((c) => !['block', el.dataset.blockName].includes(c) && !c.endsWith('-block')),
    inFragment: !!el.closest('.fragment, .fragment-wrapper'),
    box: b,
    frame: {
      widthShare: Math.round((b.width / window.innerWidth) * 100) / 100,
      ...surface(cs),
      section: scs ? { bg: hex(scs.backgroundColor), bgImage: scs.backgroundImage !== 'none', classes: [...sec.classList].filter((c) => !['section'].includes(c)) } : null,
    },
    units: {
      count: units.length,
      perRow,
      widthShare: Math.round((ub[0].width / Math.max(b.width, 1)) * 100) / 100,
      gap: gap === null ? null : Math.round(gap),
      // (the grid's own gap: what a single unit would have next to it)
      gapCss: units[0] === el ? null
        : Number.parseFloat(getComputedStyle(units[0].parentElement).columnGap) || 0,
      ...surface(getComputedStyle(unit === el ? el : unit)),
    },
    image,
    typography: typography(el),
    buttons,
    counts: {
      units: units.length, images: [...el.querySelectorAll('img, video, iframe')].filter(visible).filter(own).length, texts: leavesOf(el).length, links: anchors.length, buttons: buttons.length,
    },
    text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    nested: [...el.querySelectorAll('.block')].map((x) => x.dataset.blockName).filter(Boolean),
    tabs: tabsOf(),
  };
}

const settle = async (page) => {
  await page.waitForFunction(() => {
    const s = [...document.querySelectorAll('main .section')];
    return s.length && s.every((x) => x.dataset.sectionStatus === 'loaded');
  }, null, { timeout: 20000 }).catch(() => null);
  // scroll through, so lazy images load, then back to the top
  await page.evaluate(() => new Promise((resolve) => {
    const step = (y) => {
      if (y >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
        resolve();
        return;
      }
      window.scrollTo(0, y);
      setTimeout(() => step(y + 700), 120);
    };
    step(0);
  }));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, {
    timeout: 10000,
  }).catch(() => null);
  // floating page elements (back to top, cookie bars) stay out of the screenshots
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach((x) => {
      if (!x.closest('.block') && getComputedStyle(x).position === 'fixed') {
        x.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  });
  await page.waitForTimeout(500);
};

let browser;
let page;
async function session() {
  if (browser) await browser.close().catch(() => null);
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.route(BLOCKED, (r) => r.abort());
  // (the local preview serves content pages without a doctype: quirks mode measures line heights
  // wrong; the page is served with one)
  await page.route(/\/content\/rs\/.*[^.]{4}$|\/content\/rs\/[^.]*$/, async (r) => {
    if (r.request().resourceType() !== 'document') return r.continue();
    const resp = await r.fetch();
    const body = await resp.text();
    return r.fulfill({ response: resp, body: /^\s*<!doctype/i.test(body) ? body : `<!DOCTYPE html>\n${body}` });
  });
}
await session();

/** a screenshot cropped to the block's content (at most 2400 px tall) */
async function shotOf(m, path) {
  const c = m.content;
  const x = Math.max(0, c.left - 8);
  const y = Math.max(0, c.top - 8);
  const width = Math.min(c.right - c.left + 16, page.viewportSize().width - x);
  const height = Math.min(c.bottom - c.top + 16, 2400);
  if (width < 4 || height < 4) return false;
  const take = () => page.screenshot({
    path,
    type: 'jpeg',
    quality: 62,
    fullPage: true,
    timeout: 20000,
    clip: {
      x, y, width, height,
    },
  });
  // (a full-page screenshot now and then times out on a page with a playing video: then the
  // block is scrolled to the top of the window and taken from what the window shows)
  const inWindow = async () => {
    const vh = page.viewportSize().height;
    await page.evaluate((top) => window.scrollTo(0, top), y);
    const scrolled = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    return page.screenshot({
      path,
      type: 'jpeg',
      quality: 62,
      timeout: 20000,
      clip: {
        x, y: y - scrolled, width, height: Math.min(height, vh - (y - scrolled)),
      },
    });
  };
  await take().catch(inWindow);
  return true;
}

/** a block in a closed tab or accordion: open it first (as a reader would) */
async function reveal(h) {
  const opened = await h.evaluate((e) => {
    let did = false;
    const panel = e.closest('[role="tabpanel"]');
    if (panel && panel.getAttribute('aria-hidden') === 'true') {
      document.querySelector(`[aria-controls="${panel.id}"]`)?.click();
      did = true;
    }
    const details = e.closest('details');
    if (details && !details.open) {
      details.open = true;
      did = true;
    }
    // (a block in a closed accordion panel)
    const item = e.parentElement?.closest('.accordion-item');
    const button = item?.querySelector('[aria-expanded="false"]');
    if (button && !item.classList.contains('accordion-item-open')) {
      button.click();
      did = true;
    }
    return did;
  });
  if (opened) await page.waitForTimeout(400);
}

/**
 * a block with panels of its own (an accordion): which start open is part of its look, and its
 * panels are opened so what they hold is measured and shown
 */
async function openPanels(h) {
  const panels = await h.evaluate((e) => {
    const buttons = [...e.querySelectorAll('.accordion-item [aria-expanded]')]
      .filter((b) => b.closest('.block') === e);
    if (!buttons.length) return null;
    const open = buttons.filter((b) => b.getAttribute('aria-expanded') === 'true').length;
    buttons.filter((b) => b.getAttribute('aria-expanded') === 'false').forEach((b) => b.click());
    return { count: buttons.length, openAtStart: open };
  });
  if (panels) await page.waitForTimeout(500);
  return panels;
}

/**
 * the block's images, loaded before it is measured: a lazy image in a closed tab loads only once
 * the tab opens, and an image that hasn't loaded has no size and shows blank in the screenshot.
 * Returns how many visible images there are and how many are still blank.
 */
async function showImages(h) {
  await h.evaluate((e) => {
    e.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    e.scrollIntoView({ block: 'center' });
  });
  // (a block that loads when it comes into view, like a Marketo form, may still be empty: it gets
  // up to 8 s to appear; a block that is hidden on purpose doesn't wait)
  await h.evaluate((e) => new Promise((resolve) => {
    const end = Date.now() + 8000;
    const check = () => {
      const shown = !e.checkVisibility() || e.getBoundingClientRect().height > 1;
      if (shown || Date.now() > end) resolve();
      else setTimeout(check, 200);
    };
    check();
  }));
  await h.evaluate((e) => new Promise((resolve) => {
    const end = Date.now() + 10000;
    const check = () => {
      const pending = [...e.querySelectorAll('img')].filter((i) => i.checkVisibility() && !i.complete);
      if (!pending.length || Date.now() > end) resolve();
      else setTimeout(check, 150);
    };
    check();
  }));
  await page.waitForTimeout(200);
  return h.evaluate((e) => {
    const imgs = [...e.querySelectorAll('img')].filter((i) => i.checkVisibility());
    return { total: imgs.length, blank: imgs.filter((i) => !i.naturalWidth).length };
  });
}

/** runs fn on each item, one after the other (each waits for the one before) */
const inOrder = (items, fn) => items
  .reduce((prev, x, i) => prev.then(() => fn(x, i)), Promise.resolve());

const nameOf = (h) => h.evaluate((e) => (e.closest('header, footer') ? null : e.dataset.blockName));

/** the desktop look: every block measured, with a screenshot */
async function desktop(path, url, result) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const handles = await page.$$('main .block');
  await inOrder(handles, async (h) => {
    const name = await nameOf(h);
    if (!name || SKIP.includes(name)) return;
    const n = result.blocks.length;
    await reveal(h);
    const panels = await openPanels(h);
    const images = await showImages(h);
    const m = await h.evaluate(measureBlock);
    m.n = n;
    m.imagesShown = images;
    if (panels) m.panels = panels;
    const shot = join('shots', m.type, `${slug(path)}__${n}-d.jpg`);
    mkdirSync(join(out, 'shots', m.type), { recursive: true });
    if (m.box.width > 1 && m.box.height > 1) {
      await shotOf(m, join(out, shot))
        .then((ok) => { if (ok) m.shot = shot; })
        .catch((e) => result.errors.push(`shot ${n}: ${e.message.slice(0, 80)}`));
    } else m.hidden = true;
    result.blocks.push(m);
  });
}

/** the phone look: the same blocks in the same order, a screenshot and the unit layout */
async function phone(path, url, result) {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const handles = await page.$$('main .block');
  const names = await Promise.all(handles.map(nameOf));
  const kept = handles.filter((h, i) => names[i] && !SKIP.includes(names[i]));
  const keptNames = names.filter((x) => x && !SKIP.includes(x));
  await inOrder(kept, async (h, k) => {
    const m = result.blocks[k];
    if (!m || m.type !== keptNames[k]) return;
    await reveal(h);
    await openPanels(h);
    const images = await showImages(h);
    const p = await h.evaluate(measureBlock);
    m.phone = {
      units: p.units, image: p.image, typography: p.typography, box: p.box, imagesShown: images,
    };
    if (p.box.width > 1 && p.box.height > 1) {
      const shot = join('shots', m.type, `${slug(path)}__${k}-m.jpg`);
      await shotOf(p, join(out, shot))
        .then((ok) => { if (ok) m.phone.shot = shot; })
        .catch(() => null);
    }
  });
}

let done = 0;
const started = Date.now();
const todo = list.filter((path) => args.includes('--force') || !existsSync(join(out, 'pages', `${slug(path)}.json`)));
done = list.length - todo.length;
await inOrder(todo, async (path) => {
  const file = join(out, 'pages', `${slug(path)}.json`);
  const url = `${base}/content/rs${path}`;
  const result = {
    page: path, measured: new Date().toISOString(), blocks: [], errors: [],
  };
  try {
    await desktop(path, url, result);
    await phone(path, url, result);
  } catch (e) {
    result.errors.push(e.message.slice(0, 200));
  }
  // a page the browser failed on is not recorded (a later run measures it); the browser restarts
  const fatal = result.errors.find((e) => /closed|crashed|Target page|ERR_CONNECTION|Timeout .*goto/i.test(e));
  if (fatal) {
    console.log(`${path}: ${fatal.slice(0, 100)} (not recorded; restarting the browser)`);
    await session();
  } else writeFileSync(file, JSON.stringify(result));
  done += 1;
  if (done % 10 === 0 || done === list.length) {
    const rate = (Date.now() - started) / Math.max(1, done);
    const left = Math.round(((list.length - done) * rate) / 60000);
    console.log(`${new Date().toISOString().slice(11, 19)} ${done}/${list.length} pages · ~${left} min left`);
  }
});
await browser.close();
console.log('done');
