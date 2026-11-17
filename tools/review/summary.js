/*
 * Review tool: the review feedback as work items for the AOE team (Agentic Outcome Engineers).
 * The review's entries (backend rows), merged like the tool merges them (newest per item +
 * kind), turned into items an engineer can act on, each with its target, its reach and its
 * evidence (the reviewers' rows, with links that open the tool at the block or pin):
 *   decision    a design choice (group or single blocks): data for the apply step
 *   variant     comments / layout notes on a design or text set: CSS of that design, all instances
 *   conversion  QA notes (text, image, link, other) on a design: the conversion rules
 *   page        page comments and notes on no block: that page only
 *   question    reviewers disagree: back to the customer
 * The kind is a first guess from the row type; the agent's reading (themes file) can split an item
 * into themes with their own kind. AOE status rows (kind `status:<kind>` on the reviewer's item)
 * show on each piece of evidence and in the tool. DOM only (DOMParser); used by summarise.mjs.
 */
import {
  variantsOf, groupKey, sectionGroupKey, groupLabel,
} from './groups.js';
import { merge, CONFIG } from './store.js';
import { keyOf } from './sync.js';
import { pageKeys, toPosition } from './blockkeys.js';
import {
  threadState, roleOf, actionOf, threadKindOf,
} from './threads.js';

export const TEST_REVIEWERS = /^(tool test( b)?|save-route test|browser test|screenshot|sample .*)$/i;
export const AOE = 'AOE';
export const KINDS = {
  decision: 'Design decisions (apply step)',
  variant: 'Variant changes (design CSS, every instance)',
  conversion: 'Conversion fixes (rules, then re-run)',
  page: 'Single-page fixes',
  question: 'Questions back to the customer',
};
export const STATES = {
  open: 'open', progress: 'in progress', done: 'done', wontdo: "won't do", resolved: 'resolved',
};
const THREAD_STATES = {
  internal: 'in discussion, not sent to the AOE team yet', 'waiting-aoe': 'waiting for the AOE team', 'waiting-reviewer': 'sent back to the reviewers', resolved: 'resolved',
};
const NAMES = {
  columns: 'Columns',
  'cards-corp': 'Cards',
  'hero-corp': 'Hero',
  video: 'Video',
  'page-nav': 'Page Nav',
  section: 'Text',
  accordion: 'Accordion',
  tabs: 'Tabs',
  table: 'Table',
  statistics: 'Statistics',
  chart: 'Chart',
  gallery: 'Gallery',
  marketo: 'Marketo',
  'related-categories': 'Related Categories',
  fragment: 'Fragment',
};
const CATEGORIES = {
  text: 'Text', layout: 'Layout', image: 'Image', link: 'Link', other: 'Other',
};
const CHOICE_KINDS = ['variant', 'width', 'background', 'text'];
const BACKGROUNDS = ['grey-band', 'gold-box', 'purple-band', 'blue-band'];

export const design = (v) => (v === '' || v === null || v === undefined ? 'default' : String(v).replace(/-/g, ' '));
export const typeName = (name) => NAMES[name] || name;
const set = (v) => v !== null && v !== undefined;
const decode = (v) => {
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
};
/** `item|kind` → [item, kind] (items may hold `|`) */
const splitKey = (key) => {
  const at = key.lastIndexOf('|');
  return [key.slice(0, at), key.slice(at + 1)];
};

/** a link that opens the review tool (branch preview) at a page, block, section or pin */
export function toolLink(page, extra = {}) {
  const q = new URLSearchParams({ page, ...extra });
  return `https://${CONFIG.toolHost}/tools/review/index.html?${q}`;
}

const styleOf = (section) => {
  const row = [...section.querySelectorAll(':scope > .section-metadata > div')]
    .find((r) => r.firstElementChild?.textContent.trim() === 'style');
  return row ? row.lastElementChild.textContent.split(',').map((x) => x.trim()) : [];
};

/**
 * A standard page's authored blocks and text sections (ids as in the tool: `s<section>b<block>`
 * and `s<section>`), with their standard design and group.
 */
export function pageModel(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const blocks = {};
  const sections = {};
  [...doc.body.children].forEach((section, si) => {
    const styles = styleOf(section);
    const skey = sectionGroupKey(section);
    if (skey) sections[`s${si}`] = { set: skey.split('|')[1], group: skey };
    [...section.children].filter((c) => c.matches('div[class]') && !c.matches('.section-metadata, .metadata'))
      .forEach((block, bi) => {
        const { list, widths } = variantsOf(block);
        const name = block.classList[0];
        const variant = list.length ? list[0] : [...block.classList].slice(1).join(' ');
        blocks[`s${si}b${bi}`] = {
          name,
          variant,
          fits: list,
          widths,
          width: widths.length ? ([...block.classList].find((c) => c === 'wide-first' || c === 'wide-last') || '') : null,
          background: BACKGROUNDS.find((x) => styles.includes(x)) || '',
          group: groupKey(block),
        };
      });
  });
  return {
    doc, blocks, sections, keys: pageKeys(doc.body),
  };
}

/** where a note's anchor (sync.js key) is in the authored page: block id, section id or null */
export function locate(model, key) {
  if (!key) return null;
  const { body } = model.doc;
  const file = (url) => (url || '').split('?')[0].split('/').pop();
  // images: an <img> or a Dynamic Media link (href or title) with the file name; text: the
  // innermost elements with the key (cell text is not wrapped in <p> before decoration). The first
  // one, as the tool finds the anchor on the page
  const hits = key.startsWith('i:')
    ? [...body.querySelectorAll('img, a')].filter((el) => [el.getAttribute('src'), el.getAttribute('href'), el.getAttribute('title')]
      .some((u) => u && file(u) === key.slice(2)))
    : [...body.querySelectorAll('*')].filter((el) => keyOf(el) === key);
  const el = hits.find((h) => !hits.some((o) => o !== h && h.contains(o)));
  if (!el) return null;
  let child = el;
  while (child.parentElement && child.parentElement.parentElement !== body) {
    child = child.parentElement;
  }
  const section = child.parentElement;
  if (!section || section.parentElement !== body) return null;
  const si = [...body.children].indexOf(section);
  if (child.matches('div[class]') && !child.matches('.section-metadata, .metadata')) {
    const bi = [...section.children]
      .filter((c) => c.matches('div[class]') && !c.matches('.section-metadata, .metadata')).indexOf(child);
    return `s${si}b${bi}`;
  }
  return `s${si}`;
}

/** instances per design on all standard pages: `name|variant`, `section|set` → blocks, pages */
export function designCounts(models) {
  const out = {};
  const add = (key, path) => {
    out[key] = out[key] || { blocks: 0, pages: new Set() };
    out[key].blocks += 1;
    out[key].pages.add(path);
  };
  Object.entries(models).forEach(([path, m]) => {
    Object.values(m.blocks).forEach((b) => add(`${b.name}|${b.variant}`, path));
    Object.values(m.sections).forEach((s) => add(`section|${s.set}`, path));
  });
  return Object.fromEntries(Object.entries(out)
    .map(([k, v]) => [k, { blocks: v.blocks, pages: v.pages.size }]));
}

/** a design target in words: "Columns media text", "Text sections, serif title text set" */
const targetTitle = (t) => (t.block === 'section' ? `Text sections, ${design(t.design.replace(/^text-/, ''))} text set` : `${typeName(t.block)} ${design(t.design)}`);
const reachText = (r) => (r ? `${r.blocks} ${r.blocks === 1 ? 'instance' : 'instances'} on ${r.pages} ${r.pages === 1 ? 'page' : 'pages'}` : 'unknown');

/**
 * Review rows → work items.
 * @param {object} o
 * @param {object[]} o.rows the review's rows ({ page, item, kind, value, reviewer, time })
 * @param {object} o.models path → pageModel() of every standard page
 * @param {object} o.titles path → page title
 * @param {object} o.groups groups.json `groups`
 * @param {object} [o.themes] the agent's readings:
 *   { items: { <id>: { summary, themes, questions, time } } }
 * @param {boolean} [o.includeTests] keep the test reviewers' rows
 */
export function summarise({
  rows, models, titles, groups, themes = { items: {} }, includeTests = false,
}) {
  const real = rows.filter((r) => r.kind !== 'test' && (includeTests || !TEST_REVIEWERS.test(r.reviewer || '')));
  // entries saved under a block key (blockkeys.js) → the block's position on the page now; a key
  // not on the page any more (the block's content changed) is a re-check, below
  const gone = [];
  const located = real.map((r) => {
    const model = models[r.page];
    if (!model || !/^[bt]:/.test(r.item)) return r;
    const pos = toPosition(r.item, model.keys);
    if (!pos) {
      gone.push(r);
      return null;
    }
    return { ...r, item: pos };
  }).filter(Boolean);
  const review = located.filter((r) => r.reviewer !== AOE);
  const statusRows = located.filter((r) => r.reviewer === AOE && r.kind.startsWith('status:'));
  // the item a position is saved under (its key), for statuses and links
  const stored = (page, pos) => models[page]?.keys.byId[pos] || pos;
  const link = (page, extra = {}) => toolLink(page, Object.fromEntries(Object.entries(extra)
    .map(([k, v]) => [k, k === 'block' || k === 'section' ? stored(page, v) : v])));
  const counts = designCounts(models);
  const items = new Map();
  const itemOf = (id, init) => {
    if (!items.has(id)) items.set(id, { id, ...init(), evidence: [] });
    return items.get(id);
  };
  // threads (threads.js): the opener and its messages; the state from the handovers
  const isAoe = (r) => roleOf(r) === 'aoe';
  const threadOf = (page, item, kind) => {
    const rowsOf = located
      .filter((r) => r.page === page && r.item === item && threadKindOf(r.kind) === kind);
    const t = threadState(rowsOf);
    return {
      ...t,
      messages: rowsOf.filter((r) => r.kind !== kind)
        .sort((a, b) => (a.time < b.time ? -1 : 1)).map((r) => {
          const v = decode(r.value) || {};
          return {
            by: r.reviewer,
            role: roleOf(r),
            time: r.time,
            text: r.kind.startsWith('status:') ? v.reason : v.text,
            action: actionOf(r),
            status: r.kind.startsWith('status:') ? v : v.status,
          };
        }),
    };
  };
  const statusOf = (page, item, kind) => threadOf(page, item, kind).status;
  const evidence = (e, extra) => ({
    ref: `${e.page}#${stored(e.page, e.item)}|${e.kind}`,
    page: e.page,
    title: titles[e.page] || e.page,
    item: stored(e.page, e.item),
    at: e.item,
    kind: e.kind,
    reviewer: e.reviewer,
    time: e.time,
    status: statusOf(e.page, e.item, e.kind),
    thread: ['comment', 'note'].includes(e.kind) ? threadOf(e.page, e.item, e.kind) : undefined,
    ...extra,
  });

  // per page and for the groups (page `*`): the newest row per item + kind
  const byPage = new Map();
  review.forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });
  const state = new Map([...byPage].map(([p, list]) => [p, merge(list)]));
  const groupState = state.get('*') || new Map();

  /* ---------- questions: reviewers disagree (their newest values differ) ---------- */
  byPage.forEach((list, page) => {
    const per = new Map();
    list.filter((r) => CHOICE_KINDS.includes(r.kind)).forEach((r) => {
      const key = `${r.item}|${r.kind}`;
      if (!per.has(key)) per.set(key, new Map());
      const mine = per.get(key).get(r.reviewer);
      if (!mine || mine.time < r.time) per.get(key).set(r.reviewer, r);
    });
    per.forEach((byReviewer, key) => {
      const values = new Set([...byReviewer.values()].map((r) => r.value));
      if (values.size < 2) return;
      const [item, kind] = splitKey(key);
      const m = models[page];
      let where;
      if (item.startsWith('group:')) where = groupLabel(item.slice(6));
      else {
        const b = m?.blocks[item];
        where = `${b ? `${typeName(b.name)} ${item}` : `text section ${item}`} on ${titles[page] || page}`;
      }
      const q = itemOf(`question:${page}:${key}`, () => ({
        kind: 'question',
        title: `Reviewers disagree on the ${kind} of ${where}`,
        target: { page, item, choice: kind },
      }));
      byReviewer.forEach((r) => q.evidence.push(evidence(r, {
        text: `${r.reviewer}: ${design(decode(r.value))}`,
        link: page === '*' ? null : link(page, item.startsWith('s') ? { block: item } : {}),
      })));
    });
  });

  /* ---------- questions: saved for a block whose content changed (key not found) ---------- */
  const goneLatest = new Map();
  gone.filter((r) => r.reviewer !== AOE && r.kind !== 'reviewed').forEach((r) => {
    const k = `${r.page}|${r.item}|${r.kind}`;
    if (!goneLatest.has(k) || goneLatest.get(k).time < r.time) goneLatest.set(k, r);
  });
  goneLatest.forEach((r) => {
    const [, type] = r.item.split(':');
    const what = r.item.startsWith('t:') ? 'a text section' : `a ${typeName(type)} block`;
    const q = itemOf(`question:gone:${r.page}:${r.item}|${r.kind}`, () => ({
      kind: 'question',
      title: `Re-check: a ${r.kind} saved for ${what} on ${titles[r.page] || r.page} that is no longer there (its content changed)`,
      target: {
        page: r.page, item: r.item, choice: r.kind, gone: true,
      },
    }));
    q.evidence.push({
      ref: `${r.page}#${r.item}|${r.kind}`,
      page: r.page,
      title: titles[r.page] || r.page,
      item: r.item,
      kind: r.kind,
      reviewer: r.reviewer,
      time: r.time,
      status: null,
      where: what,
      text: typeof decode(r.value) === 'string' ? decode(r.value) : JSON.stringify(decode(r.value)),
      link: toolLink(r.page),
    });
  });

  /* ---------- decisions: groups ---------- */
  const groupChoice = new Map();
  const chosen = [...groupState.values()]
    .filter((e) => e.item.startsWith('group:') && ['variant', 'text', 'width'].includes(e.kind) && set(e.value));
  [...new Set(chosen.map((e) => e.item))].forEach((item) => {
    const key = item.slice('group:'.length);
    const picks = Object.fromEntries(chosen.filter((e) => e.item === item).map((e) => [e.kind, e]));
    const main = picks.variant || picks.text;
    const width = picks.width?.value;
    groupChoice.set(key, { value: main ? main.value : undefined, width });
    const info = groups[key] || {};
    const what = [main && design(main.value), width !== undefined && (width ? design(width) : 'equal widths')]
      .filter(Boolean).join(', ');
    const d = itemOf(`decision:group:${key}`, () => ({
      kind: 'decision',
      title: `${groupLabel(key)} → ${what}`,
      target: {
        group: key, choice: main?.kind, value: main?.value, width,
      },
      reach: { blocks: info.blocks, pages: info.pages },
      exceptions: [],
    }));
    Object.values(picks).forEach((e) => d.evidence.push(evidence({ ...e, page: '*' }, {
      where: 'all blocks like this', text: `${e.kind}: ${e.kind === 'width' && !e.value ? 'equal widths' : design(e.value)}`, link: null,
    })));
  });

  /* ---------- per page: single choices, comments, notes ---------- */
  const designOf = (b, m, id) => {
    const own = m.get(`${id}|variant`);
    if (own && set(own.value)) return own.value;
    const g = b.group && groupChoice.get(b.group);
    return g && set(g.value) ? g.value : b.variant;
  };
  state.forEach((m, page) => {
    if (page === '*') return;
    const model = models[page];
    if (!model) return;
    m.forEach((e) => {
      const block = model.blocks[e.item];
      const section = model.sections[e.item];

      // a choice that does not fit the block any more (the page changed after it was saved, e.g.
      // the block numbers moved): re-check with the reviewer, never apply it
      const fits = !block || !set(e.value)
        || (e.kind === 'variant' && block.fits.includes(e.value))
        || (e.kind === 'width' && block.widths.includes(e.value))
        || !['variant', 'width'].includes(e.kind);
      if (!fits) {
        const q = itemOf(`question:stale:${page}:${e.item}|${e.kind}`, () => ({
          kind: 'question',
          title: `Re-check: ${e.kind} "${design(e.value)}" was saved for ${e.item} on ${titles[page] || page}, which is now ${typeName(block.name)} ${design(block.variant)}`,
          target: {
            page, item: e.item, choice: e.kind, stale: true,
          },
        }));
        q.evidence.push(evidence({ ...e, page }, {
          where: `${typeName(block.name)} ${e.item}`, text: `${design(e.value)} (does not fit this block)`, link: link(page, { block: e.item }),
        }));
      }
      // single choices on a block (a value equal to its own design is no decision)
      if (fits && block && ['variant', 'width', 'background'].includes(e.kind) && set(e.value) && e.value !== block[e.kind]) {
        const from = e.kind === 'variant' ? block.variant : block[e.kind];
        const id = `decision:block:${block.name}:${e.kind}:${from}>${e.value}`;
        const d = itemOf(id, () => ({
          kind: 'decision',
          title: `${typeName(block.name)} ${e.kind === 'variant' ? '' : `${e.kind} `}${design(from)} → ${design(e.value)} on single blocks`,
          target: {
            block: block.name, choice: e.kind, from, value: e.value,
          },
          blocks: new Set(),
        }));
        d.blocks.add(`${page}#${e.item}`);
        d.evidence.push(evidence({ ...e, page }, { where: `${typeName(block.name)} ${e.item}`, text: `${design(from)} → ${design(e.value)}`, link: link(page, { block: e.item }) }));
        // a block whose group has another choice is an exception to it
        const g = block.group && groupChoice.get(block.group);
        if (g && set(g.value) && e.kind === 'variant' && g.value !== e.value) {
          const gi = items.get(`decision:group:${block.group}`);
          if (gi) gi.exceptions.push({ page, block: e.item, value: e.value });
        }
      }
      // single choices on a text section
      if (section && ['text', 'background'].includes(e.kind) && set(e.value) && e.value !== (e.kind === 'text' ? section.set : '')) {
        const from = e.kind === 'text' ? section.set : '';
        const d = itemOf(`decision:section:${e.kind}:${from}>${e.value}`, () => ({
          kind: 'decision',
          title: `Text section ${e.kind === 'text' ? 'text set' : 'background'} ${design(from)} → ${design(e.value)} on single sections`,
          target: {
            block: 'section', choice: e.kind, from, value: e.value,
          },
          blocks: new Set(),
        }));
        d.blocks.add(`${page}#${e.item}`);
        d.evidence.push(evidence({ ...e, page }, { where: `Text ${e.item}`, text: `${design(from)} → ${design(e.value)}`, link: link(page, { section: e.item }) }));
      }

      // comments on a block or a text section → the design it shows
      if (e.kind === 'comment' && e.value && (block || section)) {
        const target = block ? { block: block.name, design: designOf(block, m, e.item) } : { block: 'section', design: section.set };
        const key = `${target.block}|${target.design}`;
        const v = itemOf(`variant:${target.block}:${target.design}`, () => ({
          kind: 'variant',
          title: targetTitle(target),
          target,
          reach: counts[key],
        }));
        v.evidence.push(evidence({ ...e, page }, {
          where: `${typeName(target.block)} ${e.item}`, text: e.value, link: link(page, block ? { block: e.item } : { section: e.item }),
        }));
      }
      if (e.item === 'page' && e.kind === 'comment' && e.value) {
        const p = itemOf(`page:${page}`, () => ({ kind: 'page', title: titles[page] || page, target: { page } }));
        p.evidence.push(evidence({ ...e, page }, { where: 'page', text: e.value, link: link(page) }));
      }

      // QA notes (open ones; resolved and deleted ones are counted only)
      if (e.kind === 'note' && e.value && !e.value.deleted && e.value.status !== 'resolved') {
        const n = e.value;
        const at = locate(model, n.anchor?.key);
        const b = at && model.blocks[at];
        const s = at && !b ? model.sections[at] : null;
        const extra = {
          where: (b && `${typeName(b.name)} ${at}`) || (s && `Text ${at}`) || 'page',
          text: n.text,
          category: CATEGORIES[n.cat] || n.cat,
          width: n.vp === 375 ? 'phone' : 'desktop',
          link: link(page, { vp: n.vp, note: n.id }),
        };
        if (!b && !s) {
          const p = itemOf(`page:${page}`, () => ({ kind: 'page', title: titles[page] || page, target: { page } }));
          p.evidence.push(evidence({ ...e, page }, extra));
          return;
        }
        const target = b ? { block: b.name, design: designOf(b, m, at) } : { block: 'section', design: s.set };
        const key = `${target.block}|${target.design}`;
        const layout = n.cat === 'layout';
        const id = `${layout ? 'variant' : 'conversion'}:${target.block}:${target.design}`;
        const it = itemOf(id, () => ({
          kind: layout ? 'variant' : 'conversion',
          title: targetTitle(target),
          target,
          reach: counts[key],
        }));
        it.evidence.push(evidence({ ...e, page }, extra));
      }
    });
  });

  /* ---------- reach, status, the agent's reading ---------- */
  const order = Object.keys(KINDS);
  const list = [...items.values()].map((it) => {
    const out = { ...it };
    if (it.blocks) {
      out.reach = { blocks: it.blocks.size, pages: new Set([...it.blocks].map((x) => x.split('#')[0])).size };
      delete out.blocks;
    }
    out.pages = [...new Set(it.evidence.map((e) => e.page))].filter((p) => p !== '*');
    const states = it.evidence.map((e) => (e.thread?.state === 'resolved' ? 'resolved' : e.status?.state || 'open'));
    const uniq = [...new Set(states)];
    out.state = uniq.length === 1 ? uniq[0] : 'partly';
    // the threads: how many wait for the AOE team, for the reviewers, are closed
    const threads = it.evidence.map((e) => e.thread).filter(Boolean);
    if (threads.length) {
      out.threads = Object.fromEntries(['waiting-aoe', 'waiting-reviewer', 'resolved'].map((k) => [k, threads.filter((t) => t.state === k).length]));
    }
    const reading = themes.items?.[it.id];
    if (reading) {
      const refs = new Set(it.evidence.map((e) => e.ref));
      out.reading = {
        ...reading,
        // newer evidence than the reading, or evidence it names that is gone: read again
        stale: it.evidence.some((e) => e.time > (reading.time || '')
          || (e.thread?.messages || []).some((m) => m.role === 'reviewer' && m.time > (reading.time || '')))
          || (reading.themes || []).some((t) => (t.refs || []).some((r) => !refs.has(r))),
      };
    }
    return out;
  }).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)
    || (b.reach?.blocks || 0) - (a.reach?.blocks || 0)
    || b.evidence.length - a.evidence.length);

  const reviewers = [...new Set(review.filter((r) => !isAoe(r)).map((r) => r.reviewer))];
  return {
    generated: new Date().toISOString(),
    source: {
      rows: rows.length,
      used: review.length,
      // saved for blocks whose content changed (their keys are not on the pages any more)
      gone: gone.length,
      aoeStatusRows: statusRows.length,
      skipped: rows.length - real.length,
      reviewers,
      latest: review.reduce((t, r) => (r.time > t ? r.time : t), ''),
    },
    counts: Object.fromEntries(order.map((k) => [k, list.filter((i) => i.kind === k).length])),
    items: list,
  };
}

/* ---------- the readable report ---------- */

const cell = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const day = (t) => (t ? t.slice(0, 16).replace('T', ' ') : '');
const stateText = (s, thread) => {
  const parts = [];
  if (thread) parts.push(THREAD_STATES[thread.state]);
  if (s) parts.push([STATES[s.state] || s.state, s.release && `in ${s.release}`, s.reason].filter(Boolean).join(', '));
  return parts.join(' · ') || 'open';
};

/** the summary as Markdown (the report for people; work-items.json holds the same for agents) */
export function toMarkdown(result) {
  const out = [];
  const { source } = result;
  out.push('# Review feedback: work items for the AOE team', '');
  out.push(`Generated ${day(result.generated)} from ${source.used} review rows by ${source.reviewers.length} ${source.reviewers.length === 1 ? 'reviewer' : 'reviewers'} (${source.reviewers.join(', ') || 'none'}), latest ${day(source.latest)}; ${source.aoeStatusRows} AOE status rows; ${source.skipped} test rows left out${source.gone ? `; ${source.gone} for blocks whose content changed (re-check questions)` : ''}.`, '');
  out.push('Kinds are a first guess from the row type; where the agent read the feedback, its reading (themes, suggested kind, open questions) is shown and marked as such. Links open the review tool at the block or pin.', '');
  out.push('| Kind | Items | Open |', '|---|---|---|');
  Object.entries(KINDS).forEach(([k, label]) => {
    const list = result.items.filter((i) => i.kind === k);
    out.push(`| ${label} | ${list.length} | ${list.filter((i) => i.state !== 'done' && i.state !== 'wontdo').length} |`);
  });
  out.push('');
  Object.entries(KINDS).forEach(([k, label]) => {
    const list = result.items.filter((i) => i.kind === k);
    if (!list.length) return;
    out.push(`## ${label}`, '');
    list.forEach((it) => {
      out.push(`### ${it.title}`, '');
      out.push(`- **Id:** \`${it.id}\``);
      if (it.reach) out.push(`- **Reach:** ${reachText(it.reach)}${k === 'variant' || k === 'conversion' ? ' (every instance of this design on the standard pages)' : ''}`);
      const on = it.pages.length ? `on ${it.pages.length} ${it.pages.length === 1 ? 'page' : 'pages'}` : 'for all blocks like this';
      out.push(`- **Feedback:** ${it.evidence.length} ${it.evidence.length === 1 ? 'row' : 'rows'} ${on}`);
      out.push(`- **Status:** ${it.state === 'partly' ? 'partly done (see the rows)' : STATES[it.state] || it.state}`);
      if (it.exceptions?.length) out.push(`- **Exceptions** (blocks with their own choice): ${it.exceptions.map((x) => `${x.page} ${x.block} → ${design(x.value)}`).join('; ')}`);
      if (it.reading) {
        const r = it.reading;
        out.push('', `> **Agent reading** (${r.by || 'agent'}, ${day(r.time)})${r.stale ? ' · **stale: new feedback since, read again**' : ''}`);
        if (r.summary) out.push(`> ${cell(r.summary)}`);
        (r.themes || []).forEach((t) => out.push(`> - **${cell(t.title)}** (${KINDS[t.kind] ? t.kind : 'kind?'}, ${(t.refs || []).length} ${(t.refs || []).length === 1 ? 'row' : 'rows'})${t.action ? `: ${cell(t.action)}` : ''}`));
        (r.questions || []).forEach((q) => out.push(`> - Question: ${cell(q)}`));
      }
      out.push('', '| Page | Where | Feedback | Category | Width | By | When | Status |', '|---|---|---|---|---|---|---|---|');
      it.evidence.forEach((e) => {
        const page = e.link ? `[${cell(e.title)}](${e.link})` : cell(e.title === '*' ? 'all pages' : e.title);
        out.push(`| ${page} | ${cell(e.where || e.item)} | ${cell(e.text)} | ${cell(e.category)} | ${cell(e.width)} | ${cell(e.reviewer)} | ${day(e.time)} | ${cell(stateText(e.status, e.thread))} |`);
      });
      out.push('');
    });
  });
  if (!result.items.length) out.push('No feedback yet.', '');
  return out.join('\n');
}
