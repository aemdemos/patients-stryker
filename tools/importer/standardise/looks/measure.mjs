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
 *   [--out /tmp/run-outputs/looks-v2] [--columns | --text] [--only <path>,<path>] [--limit n]
 *   [--reverse]
 *   [--force]
 * Blocks in closed tabs or accordions are measured after opening them.
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { createHash } from 'crypto';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const sha1 = (x) => createHash('sha1').update(x).digest('hex');
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
// (--columns: the layout containers instead of the blocks: every Columns block and flex section,
// cell by cell, in their own output folder)
const COLUMNS = args.includes('--columns');
// (--text: the page's text instead of its blocks: every run of default content and every Columns
// cell, its text styles per role; one pass over the whole page, no screenshots)
const TEXT = args.includes('--text');
// (--source: the original instead of the as-is pages: the saved stryker.com copies of
// save-source.mjs at the width being measured, scripts off, their saved stylesheets, live images
// and fonts; the components of SOURCE_TYPES are marked as blocks of the matching type, so they
// are measured and grouped as the as-is blocks are)
const SOURCE = args.includes('--source');
const SOURCE_PAGES = opt('--source-pages', '/tmp/run-outputs/source-pages');
const SCRIPT_TAGS = /<script\b[\s\S]*?<\/script>/gi;
// (--components, with --source: every component of the original, at every depth (in column
// cells, fragments, tabs, accordions, panels), each marked with its AEM name and measured as what
// it is: column controls cell by cell, the others as blocks; page-level waits only; screenshots
// of the layouts, blocks and bands, not of text and small pieces)
const COMPONENTS = SOURCE && args.includes('--components');
const NO_SHOTS = ['text', 'section-title', 'sectionseparator', 'title', 'largeheadline', 'standaloneimage',
  'curatedcta', 'secondarycta', 'contactbutton', 'buttonset', 'pageshortdescription', 'tagcrumb',
  'disclaimer', 'publishdate', 'localpagenavigation', 'h1-title', 'tagline'];
const SOURCE_TYPES = {
  // the hero: every component of the page's hero area (the first area of the main content, before
  // the customizable area), whatever its type (pagehero, carouselslidegroup, fullWidthImageHero,
  // hero, an experience fragment …); of a carousel, the slide on show
  'hero-corp': 'hero-area',
};
let defaultOut = '/tmp/run-outputs/looks-v2';
if (COLUMNS) defaultOut = '/tmp/run-outputs/looks-columns';
if (TEXT) defaultOut = '/tmp/run-outputs/looks-text';
if (SOURCE) defaultOut = '/tmp/run-outputs/looks-source';
if (COMPONENTS) defaultOut = '/tmp/run-outputs/looks-components';
const out = opt('--out', defaultOut);
const only = opt('--only', '') ? opt('--only').split(',') : null;
const limit = Number(opt('--limit', 0)) || Infinity;
const SKIP = ['columns', 'fragment', 'header', 'footer', 'header-corp', 'footer-corp'];
// (ALTCHA and the captcha by their paths, anywhere; trackers by their servers only: a page's own
// image named facebook_logo is no tracker)
const CAPTCHA = /altcha|captcha/i;
const TRACKERS = /googletagmanager|google-analytics|adobedtm|demdex|omtrdc|doubleclick|facebook|linkedin|hotjar|onetrust|cookielaw|qualtrics/i;
const BLOCKED = (url) => CAPTCHA.test(url.href) || TRACKERS.test(url.hostname);

const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
let list = pages.map((p) => p.path).filter((p) => !only || only.includes(p)).slice(0, limit);
// (a second runner can take the list from the end: both skip pages already measured)
if (args.includes('--reverse')) list = list.reverse();
mkdirSync(join(out, 'pages'), { recursive: true });
mkdirSync(join(out, 'shots'), { recursive: true });
const slug = (p) => p.replace(/^\//, '').replace(/\//g, '~');

/**
 * a layout container (a Columns block or a flex section): its rows and their cells, each cell's
 * share of the width, place and content, the gaps and the alignment. Runs in the page.
 */
function measureColumns(el) {
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
    const st = getComputedStyle(x);
    return r.width > 1 && r.height > 1 && st.visibility !== 'hidden' && st.display !== 'none';
  };
  const isSection = el.classList.contains('section');
  // (a column control of the original: its rows are in the element holding its .row)
  const host = (el.dataset.component && el.querySelector(':scope .row')?.parentElement) || el;
  const b = box(el);
  // a cell's content: its media, the blocks in it, its text (headings, paragraphs, lists), buttons
  const contentOf = (cell) => {
    const blocks = [...cell.querySelectorAll('.block')].filter(visible)
      .map((x) => x.dataset.blockName).filter(Boolean);
    const inBlock = (x) => x.closest('.block') && x.closest('.block') !== el;
    const own = (sel) => [...cell.querySelectorAll(sel)].filter(visible).filter((x) => !inBlock(x));
    const text = own('p, li, h1, h2, h3, h4, h5, h6').filter((x) => x.textContent.trim().length > 1);
    const st = getComputedStyle(cell);
    return {
      images: own('img').length,
      videos: own('video, iframe').length,
      blocks,
      headings: own('h1, h2, h3, h4, h5, h6').length,
      texts: text.length,
      chars: text.reduce((n, x) => n + x.textContent.trim().length, 0),
      buttons: own('a.button, .button-container a').length,
      bg: hex(st.backgroundColor),
      border: Number.parseFloat(st.borderTopWidth) > 0 || Number.parseFloat(st.borderLeftWidth) > 0,
    };
  };
  // rows: a Columns block's rows; a flex section is one row of its wrappers
  const rowEls = isSection ? [el] : [...host.children].filter(visible);
  const rows = rowEls.map((row) => {
    const cells = [...row.children].filter(visible).filter((c) => !c.classList.contains('section-metadata'));
    const cb = cells.map(box);
    // (shares of the row: a Columns row can be wider than its block, by its negative margins)
    const rb = box(row);
    return {
      align: getComputedStyle(row).alignItems,
      cells: cells.map((c, i) => ({
        share: Math.round((cb[i].width / Math.max(rb.width, 1)) * 100) / 100,
        left: Math.round(cb[i].left - rb.left),
        top: Math.round(cb[i].top - rb.top),
        height: Math.round(cb[i].height),
        content: contentOf(c),
      })),
      // the space between cells side by side (same top)
      gaps: cb.slice(1).map((x, i) => (Math.abs(x.top - cb[i].top) < 6
        ? Math.round(x.left - (cb[i].left + cb[i].width)) : null)),
      stacked: cb.length > 1
        && cb.every((x, i) => i === 0 || x.top >= cb[i - 1].top + cb[i - 1].height - 6),
    };
  });
  const sec = isSection ? el : el.closest('.section');
  const scs = sec ? getComputedStyle(sec) : null;
  return {
    content: {
      left: b.left, top: b.top, right: b.left + b.width, bottom: b.top + b.height,
    },
    type: el.dataset.component || (isSection ? 'flex-section' : 'columns'),
    ...(el.dataset.component ? { component: el.dataset.component } : {}),
    classes: [...el.classList].filter((c) => !['block', 'section', 'columns'].includes(c)
      && !c.endsWith('-container') && !c.endsWith('-wrapper')),
    inFragment: !!el.parentElement?.closest('.fragment, .fragment-wrapper'),
    inTabs: !!el.closest('.tabs, [role="tabpanel"]'),
    inAccordion: !!el.closest('.accordion'),
    box: b,
    frame: {
      widthShare: Math.round((b.width / window.innerWidth) * 100) / 100,
      section: scs ? {
        bg: hex(scs.backgroundColor),
        bgImage: scs.backgroundImage !== 'none',
        classes: [...sec.classList].filter((c) => c !== 'section'),
      } : null,
    },
    rows,
    text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
  };
}

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
  // (a hero on the original is one unit: its picture sits in a grid column of its own, which the
  // rule above would take for the unit)
  if (el.dataset.source && el.dataset.blockName === 'hero-corp') units = [el];
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
  // (a block with a surface of its own, a background, border or shadow, is shown whole)
  const own0 = surface(cs);
  const framed = own0.bg !== 'transparent' || own0.bgImage || own0.border || own0.shadow;
  const inner = [...el.querySelectorAll('img, picture, video, iframe, svg, a, button, input, select, textarea, table, canvas'), ...allLeavesOf(el), ...units, ...(framed ? [el] : [])]
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
    // (on the original: the AEM component it is)
    ...(el.dataset.component ? { component: el.dataset.component } : {}),
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
  // (the original: its components marked as blocks; no EDS sections to wait for)
  if (SOURCE) {
    await page.evaluate((types) => {
      const GRID = /(^|\s)(parsys|aem-Grid|responsivegrid|row|page-section)(\s|$)/;
      // the components of an area: its children, through the parsys / grid wrappers
      const componentsOf = (el) => [...el.children].flatMap((c) => {
        const cls = String(c.className);
        // (plain divs without a class are wrappers too: the hero and customizable areas)
        if ((!cls.trim() || GRID.test(cls)) && !/aem-GridColumn/.test(cls)) return componentsOf(c);
        return [c];
      });
      const mark = (el, name, component) => {
        el.classList.add('block');
        el.dataset.blockName = name;
        el.dataset.source = '1';
        el.dataset.component = component;
      };
      if (types === 'components') {
        const AREAS = '.parsys, .aem-Grid, .responsivegrid';
        const markIn = (root) => componentsOf(root).forEach((c) => {
          if (!c.textContent.trim() && !c.querySelector('img, video, iframe, svg, canvas')) return;
          const component = String(c.className).trim().split(/\s+/)[0];
          if (!component) return;
          mark(c, component, component);
          // the component's own areas (not those of a component inside it)
          c.querySelectorAll(AREAS).forEach((a) => {
            let x = a.parentElement;
            while (x && x !== c && !x.matches(AREAS) && !x.dataset.component) x = x.parentElement;
            if (x === c) markIn(a);
          });
          // a column control's cells hold their components directly
          if (/^cols/.test(component)) {
            c.querySelectorAll(':scope .row > [class*="col-"]').forEach((cell) => {
              if (cell.closest('[data-component]') === c && !cell.querySelector(AREAS)) markIn(cell);
            });
          }
        });
        const main = document.querySelector('.main.content');
        if (main) markIn(main);
        return;
      }
      Object.entries(types).forEach(([name, sel]) => {
        if (sel !== 'hero-area') {
          document.querySelectorAll(sel).forEach((el) => mark(el, name, sel));
          return;
        }
        const main = document.querySelector('.main.content');
        if (!main) return;
        // the leading run of hero components at the top of the content (in the hero area, or the
        // first of the customizable area on pages without one); an experience fragment counts
        // only first; the run stops at the first other component
        const HEROES = ['pagehero', 'carouselslidegroup', 'fullWidthImageHero', 'hero', 'longtexthero',
          'hero-large-carousel', 'fullWidthImage'];
        const all = componentsOf(main).filter((c) => c.getBoundingClientRect().height > 1
          && !/breadcrumb/.test(c.className));
        const lead = [];
        all.every((c, i) => {
          const component = String(c.className).trim().split(/\s+/)[0];
          const isHero = HEROES.includes(component) || (i === 0 && component === 'experienceFragment');
          if (isHero) lead.push([c, component]);
          return isHero;
        });
        lead.forEach(([c, component]) => {
          const slide = c.querySelector('.carouselslide.slick-current') || c.querySelector('.carouselslide');
          mark(slide || c, name, component);
        });
      });
    }, COMPONENTS ? 'components' : SOURCE_TYPES);
  }
  if (!SOURCE) {
    await page.waitForFunction(() => {
      const s = [...document.querySelectorAll('main .section')];
      return s.length && s.every((x) => x.dataset.sectionStatus === 'loaded');
    }, null, { timeout: 20000 }).catch(() => null);
  }
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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, bypassCSP: SOURCE,
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.route(BLOCKED, (r) => r.abort());
  if (SOURCE) {
    // the saved copy for the current width, its saved stylesheets; the rest live (images, fonts)
    await page.route('**/*', (route) => {
      const req = route.request();
      const u = new URL(req.url());
      if (BLOCKED(u)) return route.abort();
      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        const file = join(SOURCE_PAGES, String(page.viewportSize().width), 'pages', `${sha1(u.href.split('#')[0])}.html`);
        if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not saved' });
        // (the page as rendered, without its own scripts: only the measuring runs; scripts off
        // altogether would stop the measuring's own timers)
        const html = readFileSync(file, 'utf8').replace(SCRIPT_TAGS, '');
        return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
      }
      if (req.resourceType() === 'script') return route.abort();
      if (req.resourceType() === 'stylesheet') {
        const file = join(SOURCE_PAGES, 'assets', sha1(u.href));
        if (existsSync(file)) {
          const meta = JSON.parse(readFileSync(`${file}.json`, 'utf8'));
          return route.fulfill({
            status: meta.status, contentType: meta.contentType, body: readFileSync(file),
          });
        }
      }
      return route.continue();
    });
  }
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
async function shotOf(m, path, h) {
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
  // (and when both time out, the block element itself)
  const ofElement = () => h.screenshot({
    path, type: 'jpeg', quality: 62, timeout: 20000,
  });
  await take().catch(inWindow).catch((e) => (h ? ofElement() : Promise.reject(e)));
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
    // (on the original: a closed tab pane, a collapsed accordion panel)
    const pane = e.closest('.tab-content');
    if (pane && !pane.checkVisibility()) {
      pane.classList.add('default-open');
      pane.style.setProperty('display', 'block', 'important');
      did = true;
    }
    const collapsed = e.closest('.panel-collapse.collapse:not(.in)');
    if (collapsed) {
      collapsed.classList.add('in');
      collapsed.style.setProperty('display', 'block', 'important');
      collapsed.style.setProperty('height', 'auto', 'important');
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
    // (the original's accordion: Bootstrap panels, `in` when open)
    const collapses = [...e.querySelectorAll('.panel-collapse.collapse')]
      .filter((x) => x.closest('[data-component]') === e);
    if (collapses.length) {
      const open = collapses.filter((x) => x.classList.contains('in')).length;
      collapses.forEach((x) => {
        x.classList.add('in');
        x.style.setProperty('display', 'block', 'important');
        x.style.setProperty('height', 'auto', 'important');
      });
      return { count: collapses.length, openAtStart: open };
    }
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
  // (numbers that count up when they come into view: the block is measured once its text and size
  // have stood still for 0.6 s, at most 5 s)
  await h.evaluate((e) => new Promise((resolve) => {
    const end = Date.now() + 5000;
    let last = '';
    let since = Date.now();
    const check = () => {
      const now = `${e.textContent}|${Math.round(e.getBoundingClientRect().height)}`;
      if (now !== last) {
        last = now;
        since = Date.now();
      }
      if (Date.now() - since >= 600 || Date.now() > end) resolve();
      else setTimeout(check, 150);
    };
    check();
  }));
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

/**
 * the page's text units: every default-content run (in sections, tab and accordion panels, flex
 * sections) and every Columns cell; per unit its text styles by role (h1 … h6, body, list, link,
 * button), each style with the share of the role's text it carries. Hidden text (closed tabs and
 * accordions) is measured too: its computed style is there. Runs in the page.
 */
function measureText() {
  const hex = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return c || '';
    const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
    if (Number(a) === 0) return 'transparent';
    return `#${[r, g, b].map((x) => Number(x).toString(16).padStart(2, '0')).join('')}`;
  };
  const OWNERS = ['columns', 'tabs', 'accordion', 'fragment'];
  // a unit belongs to the page's text unless it sits in a block other than a container
  const inOtherBlock = (x) => {
    let b = x.closest('.block');
    while (b) {
      if (!OWNERS.includes(b.dataset.blockName)) return true;
      b = b.parentElement?.closest('.block');
    }
    return false;
  };
  const roleOf = (x) => {
    const a = x.closest('a');
    if (a) return a.classList.contains('button') || a.closest('.button-container, .button-wrapper') ? 'button' : 'link';
    const h = x.closest('h1, h2, h3, h4, h5, h6');
    if (h) return h.tagName.toLowerCase();
    if (x.closest('li')) return 'list';
    return 'body';
  };
  const styleOf = (x) => {
    const st = getComputedStyle(x);
    return {
      family: st.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase(),
      size: Math.round(Number.parseFloat(st.fontSize) * 10) / 10,
      weight: Number(st.fontWeight) || 400,
      color: hex(st.color),
      upper: st.textTransform === 'uppercase',
      italic: st.fontStyle === 'italic',
      lineHeight: Math.round(Number.parseFloat(st.lineHeight) || 0),
      letterSpacing: Number.parseFloat(st.letterSpacing) || 0,
    };
  };
  const unitsOf = () => {
    const wrappers = [...document.querySelectorAll('main .default-content-wrapper')]
      .filter((w) => !w.closest('header, footer') && !inOtherBlock(w));
    const cells = [...document.querySelectorAll('main .columns.block > div > div')]
      .filter((c) => !c.closest('header, footer') && !inOtherBlock(c));
    return [...wrappers.map((w) => ['default', w]), ...cells.map((c) => ['cell', c])];
  };
  return unitsOf().map(([kind, el], n) => {
    // (the unit's number on the element: the sample screenshots find it by it, --shots-for)
    el.dataset.textUnit = String(n);
    const roles = {};
    let chars = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const len = t.textContent.trim().length;
      // the leaf: the element holding the text itself (not a block nested in a cell)
      const leaf = t.parentElement;
      if (len > 1 && leaf && leaf.closest('.block') === el.closest('.block')) {
        const role = roleOf(leaf);
        const key = JSON.stringify(styleOf(leaf));
        roles[role] = roles[role] || {};
        roles[role][key] = (roles[role][key] || 0) + len;
        chars += len;
      }
    }
    const typography = Object.fromEntries(Object.entries(roles).map(([role, styles]) => {
      const total = Object.values(styles).reduce((a, c) => a + c, 0);
      const top = Object.entries(styles).sort((a, c) => c[1] - a[1]).slice(0, 3)
        .map(([key, len]) => ({
          ...JSON.parse(key), share: Math.round((len / total) * 100) / 100,
        }));
      return [role, { styles: top, chars: total }];
    }));
    const block = kind === 'cell' ? el.closest('.columns') : null;
    const sec = el.closest('.section');
    const r = el.getBoundingClientRect();
    return {
      n,
      kind,
      container: block ? 'columns' : (sec?.classList.contains('flex') && 'flex') || 'section',
      variant: block ? [...block.classList].filter((c) => !['columns', 'block'].includes(c) && !c.startsWith('columns-')) : [],
      section: sec ? [...sec.classList].filter((c) => c !== 'section' && !c.endsWith('-container')) : [],
      inTabs: !!el.closest('.tabs, [role="tabpanel"]'),
      inAccordion: !!el.closest('.accordion'),
      inFragment: !!el.closest('.fragment, .fragment-wrapper'),
      hidden: !el.checkVisibility(),
      box: {
        left: Math.round(r.left + window.scrollX),
        top: Math.round(r.top + window.scrollY),
        width: Math.round(r.width),
        height: Math.round(r.height),
      },
      chars,
      typography,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
    };
  }).filter((u) => u.chars > 0);
}

/** the text mode: the whole page at one width, all units in one pass */
async function textPass(url, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  return page.evaluate(measureText);
}

/** runs fn on each item, one after the other (each waits for the one before) */
const inOrder = (items, fn) => items
  .reduce((prev, x, i) => prev.then(() => fn(x, i)), Promise.resolve());

const nameOf = (h) => h.evaluate((e) => {
  if (e.closest('header, footer')) return null;
  if (e.classList.contains('section')) return 'flex-section';
  return e.dataset.blockName;
});
// (the containers in --columns mode, the blocks otherwise)
let SELECTOR = COLUMNS ? 'main .columns.block, main .section.flex' : 'main .block';
if (SOURCE) SELECTOR = '.block';
const keep = (name) => {
  if (!name) return false;
  if (COMPONENTS) return true;
  if (SOURCE) return name in SOURCE_TYPES;
  return COLUMNS ? ['columns', 'flex-section'].includes(name) : !SKIP.includes(name);
};
const measureOf = COLUMNS ? measureColumns : measureBlock;
/** a component's key: its type and the start of its text (the phone copy can hold other pieces) */
const keyOf = (h) => h.evaluate((e) => `${e.dataset.component || e.dataset.blockName}|${(e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)}`);

/** what measures a component of the original: column controls cell by cell, the others as blocks */
const measureFor = async (h) => {
  if (!COMPONENTS) return h.evaluate(measureOf);
  const component = await h.evaluate((e) => e.dataset.component || '');
  return h.evaluate(/^cols/.test(component) ? measureColumns : measureBlock);
};

/** the desktop look: every block measured, with a screenshot */
async function desktop(path, url, result) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const handles = await page.$$(SELECTOR);
  await inOrder(handles, async (h) => {
    const name = await nameOf(h);
    if (!keep(name)) return;
    const n = result.blocks.length;
    await reveal(h);
    const panels = await openPanels(h);
    // (all components of the original: the page-level waits only, its images are in the copy)
    const images = COMPONENTS ? null : await showImages(h);
    const m = await measureFor(h);
    m.n = n;
    if (COMPONENTS) m.key = await keyOf(h);
    if (images) m.imagesShown = images;
    if (panels) m.panels = panels;
    const shot = join('shots', m.type, `${slug(path)}__${n}-d.jpg`);
    const shoot = !(COMPONENTS && NO_SHOTS.includes(m.type));
    if (shoot) mkdirSync(join(out, 'shots', m.type), { recursive: true });
    if (m.box.width <= 1 || m.box.height <= 1) m.hidden = true;
    else if (shoot) {
      await shotOf(m, join(out, shot), h)
        .then((ok) => { if (ok) m.shot = shot; })
        .catch((e) => result.errors.push(`shot ${n}: ${e.message.slice(0, 80)}`));
    }
    result.blocks.push(m);
  });
}

/** the phone look: the same blocks in the same order, a screenshot and the unit layout */
async function phone(path, url, result) {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const handles = await page.$$(SELECTOR);
  const names = await Promise.all(handles.map(nameOf));
  const kept = handles.filter((h, i) => keep(names[i]));
  const keptNames = names.filter(keep);
  // (all components of the original: matched by key, each desktop measurement once)
  const byKey = {};
  if (COMPONENTS) result.blocks.forEach((b) => { (byKey[b.key] = byKey[b.key] || []).push(b); });
  await inOrder(kept, async (h, k) => {
    const m = COMPONENTS ? (byKey[await keyOf(h)] || []).shift() : result.blocks[k];
    if (!m || (!COMPONENTS && m.type !== keptNames[k])) return;
    await reveal(h);
    await openPanels(h);
    const images = COMPONENTS ? null : await showImages(h);
    const p = await measureFor(h);
    m.phone = (COLUMNS || p.rows) ? { rows: p.rows, box: p.box, imagesShown: images } : {
      units: p.units, image: p.image, typography: p.typography, box: p.box, imagesShown: images,
    };
    if (p.box.width > 1 && p.box.height > 1 && !(COMPONENTS && NO_SHOTS.includes(m.type))) {
      const shot = join('shots', m.type, `${slug(path)}__${m.n}-m.jpg`);
      await shotOf(p, join(out, shot), h)
        .then((ok) => { if (ok) m.phone.shot = shot; })
        .catch(() => null);
    }
  });
}

/** the stryker.com address of a page (the review tool's snapshot facts hold it) */
function sourceUrlOf(path) {
  const file = `tools/review/snapshot-meta${path}.json`;
  if (!existsSync(file)) return null;
  const meta = JSON.parse(readFileSync(file, 'utf8'));
  return meta['1440']?.url || meta['375']?.url || null;
}

// (--shots-for <file>: the text mode's sample screenshots only: the listed units of each page,
// [{page, n}], at 1440 and 375, into <out>/shots/text; nothing is measured)
const SHOTS_FOR = opt('--shots-for', '');
if (SHOTS_FOR) {
  const wanted = JSON.parse(readFileSync(SHOTS_FOR, 'utf8'));
  const byPage = wanted.reduce((m, x) => ({ ...m, [x.page]: [...(m[x.page] || []), x] }), {});
  // (the original's components: into shots/text-source, found by their number on desktop and by
  // their key on phones, as measured)
  const folder = COMPONENTS ? 'text-source' : 'text';
  mkdirSync(join(out, 'shots', folder), { recursive: true });
  let k = 0;
  await inOrder(Object.entries(byPage), async ([path, xs]) => {
    const url = COMPONENTS ? sourceUrlOf(path) : `${base}/content/rs${path}`;
    if (!url) return;
    await inOrder([[1440, 1000, 'd'], [375, 800, 'm']], async ([w, hgt, tag]) => {
      try {
        let find;
        if (COMPONENTS) {
          await page.setViewportSize({ width: w, height: hgt });
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          await settle(page);
          // (the kept ones, as measured: the components outside header and footer)
          const all = await page.$$(SELECTOR);
          const names = await Promise.all(all.map(nameOf));
          const handles = all.filter((h, i) => keep(names[i]));
          const keys = await Promise.all(handles.map(keyOf));
          find = (x) => (tag === 'd' ? handles[x.n] : handles[keys.indexOf(x.key)]);
        } else {
          await textPass(url, w, hgt);
          find = () => null;
        }
        await inOrder(xs, async (x) => {
          const { n } = x;
          const h = COMPONENTS ? find(x) : await page.$(`[data-text-unit="${n}"]`);
          if (!h) return;
          await h.scrollIntoViewIfNeeded().catch(() => null);
          await h.screenshot({
            path: join(out, 'shots', folder, `${slug(path)}__${n}-${tag}.jpg`), type: 'jpeg', quality: 62, timeout: 20000,
          }).catch(() => null);
        });
      } catch (e) {
        console.log(`${path} ${tag}: ${e.message.slice(0, 80)}`);
      }
    });
    k += 1;
    if (k % 20 === 0) console.log(`${new Date().toISOString().slice(11, 19)} ${k}/${Object.keys(byPage).length} pages`);
  });
  await browser.close();
  process.exit(0);
}

let done = 0;
const started = Date.now();
const todo = list.filter((path) => args.includes('--force') || !existsSync(join(out, 'pages', `${slug(path)}.json`)));
done = list.length - todo.length;
await inOrder(todo, async (path) => {
  const file = join(out, 'pages', `${slug(path)}.json`);
  // (a second runner may have measured it meanwhile: checked again now, not only at the start)
  if (!args.includes('--force') && existsSync(file)) {
    done += 1;
    return;
  }
  const url = SOURCE ? sourceUrlOf(path) : `${base}/content/rs${path}`;
  if (!url) {
    done += 1;
    return;
  }
  const result = {
    page: path, measured: new Date().toISOString(), blocks: [], errors: [],
  };
  try {
    if (TEXT) {
      result.units = await textPass(url, 1440, 1000);
      const phoneUnits = await textPass(url, 375, 800);
      // (the same units in the same order on phones: their styles there)
      result.units.forEach((u, i) => {
        const p = phoneUnits[i];
        if (p && p.text === u.text) u.phone = { typography: p.typography, box: p.box };
      });
    } else {
      await desktop(path, url, result);
      await phone(path, url, result);
    }
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
