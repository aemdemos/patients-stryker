/*
 * Standardise pilot (branch standardise-v3): the review overlay. Loaded by scripts.js only on a
 * preview host (*.aem.page, localhost) with ?standardise in the URL; never in production.
 *
 * Page mode (?standardise=1): every Columns block of the page gets a bar with its standard
 * candidates (the same content in each standard Columns variant it fits, built by the transfer
 * rules and decorated like the page), a side-by-side compare, the live stryker.com page at the
 * same text, and what the standard changes in plain words. The reviewer picks a standard or
 * keeps the block as it is (legacy).
 * Board mode (?standardise=board[&cluster=<id>]): every pilot block of one cluster in rows, its
 * original next to its candidates, one choice for the whole group with exceptions; without a
 * cluster, the list of clusters (largest first).
 *
 * Choices and the time spent stay in the browser (localStorage) and are exported as JSON.
 * Nothing here measures against live or uses internal tools: the reviewer compares by eye.
 */
import { loadCSS, loadSections } from './aem.js';
import fetchPlainHtml from './plain-html.js';

const BASE = window.hlx?.codeBasePath || '';
const STORE = 'std-pilot';
const CANDIDATES = `${BASE}/tools/importer/standardise/data/candidates.json`;
const RULES = `${BASE}/tools/importer/standardise/rules/columns.js`;

const local = window.location.pathname.startsWith('/content/');
const pagePath = () => window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
const href = (path) => (local ? `/content${path}` : path);

/* ---------- storage ---------- */

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch (e) {
    return {};
  }
}
function save(state) {
  localStorage.setItem(STORE, JSON.stringify(state));
}
function store() {
  const state = load();
  state.decisions = state.decisions || {};
  state.clusters = state.clusters || {};
  state.effort = state.effort || [];
  return state;
}

/* ---------- small DOM helpers (no innerHTML) ---------- */

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat().filter((c) => c !== null && c !== undefined).forEach((c) => e.append(c));
  return e;
}
const words = (s) => String(s || '').replace(/\[\[[^\]]*\]|\]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- documents and candidates ---------- */

const docs = new Map();
async function sourceDoc(path) {
  if (!docs.has(path)) {
    docs.set(path, fetchPlainHtml(path).then((r) => (r.ok ? r.text() : ''))
      .then((t) => new DOMParser().parseFromString(`<body>${t}</body>`, 'text/html').body));
  }
  return docs.get(path);
}

/** The source section and block of an instance. */
async function sourceOf(instance) {
  const body = await sourceDoc(instance.doc);
  const section = body.children[instance.section];
  const blocks = section ? [...section.querySelectorAll(':scope > div[class]')]
    .filter((b) => !b.classList.contains('section-metadata')) : [];
  return { section, block: blocks[instance.block] };
}

/** A source section decorated like the page: a .section element, ready to insert. */
let decorate = null;
async function render(section) {
  const main = document.createElement('main');
  main.append(document.importNode(section, true));
  decorate(main);
  await loadSections(main);
  return main.querySelector(':scope > .section');
}

/** The rendered Columns block of the page that holds an instance's content (first unused match). */
function findRendered(rules, block, used) {
  const free = [...document.querySelectorAll('main .columns.block')].filter((b) => !used.has(b));
  const want = rules.matchText(block).slice(0, 60);
  const exact = free.find((b) => {
    const have = rules.matchText(b, true);
    return have.startsWith(want) || (have.length >= 20 && want.startsWith(have.slice(0, 60)));
  });
  if (exact) return exact;
  // else the most similar block by words and media names, if similar enough
  const tokens = rules.matchTokens(block);
  const [best] = free.map((b) => [b, rules.similarity(tokens, rules.matchTokens(b, true))])
    .sort((x, y) => y[1] - x[1]);
  return best && best[1] >= 0.6 ? best[0] : null;
}

/* ---------- the choice an instance has ---------- */

function resolved(state, instance) {
  const own = state.decisions[instance.id];
  if (own) return { ...own, from: 'page' };
  const group = instance.cluster && state.clusters[instance.cluster];
  if (group && !(group.exceptions || []).includes(instance.id)) return { choice: group.choice, from: 'group' };
  if (instance.preselect) return { choice: instance.preselect, from: 'same-look' };
  return null;
}

/* ---------- export ---------- */

function exportDecisions() {
  const state = store();
  const data = { exported: new Date().toISOString(), reviewer: state.reviewer || '', ...state };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `standardise-decisions-${Date.now()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
}

function panel(title, ...children) {
  const box = el('div', { class: 'std-panel' }, el('p', { class: 'std-panel-title' }, title), ...children);
  document.body.append(box);
  return box;
}

function reviewerField(state) {
  return el('label', { class: 'std-reviewer' }, 'Reviewer ', el('input', {
    type: 'text',
    value: state.reviewer || '',
    onchange: (e) => {
      const s = store();
      s.reviewer = e.target.value;
      save(s);
    },
  }));
}

/* ---------- page mode ---------- */

async function pageMode(data, rules) {
  const path = pagePath();
  const page = data.pages[path];
  if (!page) {
    panel('Standardise', el('p', {}, 'This page is not one of the pilot pages.'));
    return;
  }
  const started = Date.now();
  let choices = 0;
  const used = new Set();
  const rows = [];
  // (one block after the other: the rendered blocks are matched in page order)
  await page.instances.reduce((chain, instance) => chain.then(async () => {
    const { section, block } = await sourceOf(instance);
    if (!block) return;
    const rendered = findRendered(rules, block, used);
    if (!rendered) return;
    used.add(rendered);
    // a block alone in its section swaps with its section (the section's own numbers change
    // too); beside other content only the block swaps, so the neighbours stay as they are
    // (a fragment's content sits in the page's section: a fragment block always swaps alone)
    const alone = !instance.fragment && rules.aloneInSection(section, instance.block);
    rows.push({
      instance,
      section,
      block,
      rendered,
      alone,
      original: alone ? rendered.closest('.section') : rendered.closest('.columns-wrapper') || rendered,
    });
  }), Promise.resolve());

  const layer = el('div', { class: 'std-layer' });
  document.body.append(layer);
  const progress = el('p', { class: 'std-progress' });
  const update = () => {
    const state = store();
    const decided = rows.filter((r) => resolved(state, r.instance)).length;
    progress.textContent = `${decided} of ${rows.length} blocks decided on this page`;
  };

  rows.forEach((row) => {
    const { instance, section, block } = row;
    const standard = rules.alreadyStandard(block);
    const options = rules.eligible(block);
    const cluster = data.clusters[instance.cluster];
    const candidates = {};
    const changes = el('ul', { class: 'std-changes' });
    const buttons = el('div', { class: 'std-buttons' });
    const bar = el('div', { class: 'std-bar', 'data-std-id': instance.id });
    row.original.dataset.stdId = instance.id;

    const show = async (choice, compare = false) => {
      Object.values(candidates).forEach((c) => { c.hidden = true; });
      row.original.hidden = false;
      row.current = row.original;
      changes.replaceChildren();
      [...buttons.children].forEach((b) => b.classList.toggle('std-current', b.dataset.choice === choice));
      if (!choice || choice === 'legacy') return;
      if (!candidates[choice]) {
        const { section: result, changes: list } = rules.transform(section, instance.block, choice);
        const out = row.alone ? await render(result)
          : await render(rules.isolate(result, instance.block))
            .then((s) => s.querySelector('.columns-wrapper') || s.querySelector('.columns'));
        out.classList.add('std-candidate');
        out.dataset.stdFor = instance.id;
        out.dataset.stdChoice = choice;
        out.dataset.stdLabel = `${rules.STANDARDS[choice].label} (candidate)`;
        out.dataset.stdChanges = JSON.stringify(list);
        row.original.after(out);
        candidates[choice] = out;
      }
      const c = candidates[choice];
      c.hidden = false;
      row.current = compare ? row.original : c;
      row.original.hidden = !compare;
      row.original.classList.toggle('std-compare-original', compare);
      JSON.parse(c.dataset.stdChanges).forEach((t) => changes.append(el('li', {}, t)));
      if (!changes.children.length) changes.append(el('li', {}, 'nothing to change: it already looks standard'));
    };

    const choose = (choice, scope = 'page') => {
      const state = store();
      choices += 1;
      if (scope === 'group' && instance.cluster) {
        state.clusters[instance.cluster] = { choice, at: new Date().toISOString(), exceptions: [] };
        delete state.decisions[instance.id];
      } else {
        state.decisions[instance.id] = {
          choice,
          cluster: instance.cluster,
          hash: instance.hash,
          page: path,
          at: new Date().toISOString(),
        };
      }
      save(state);
      bar.dataset.choice = choice;
      update();
    };

    if (standard) {
      bar.append(el('p', { class: 'std-note' }, `Already a standard: ${standard}`));
    } else {
      buttons.append(el('button', { type: 'button', 'data-choice': 'legacy', onclick: () => { show('legacy'); choose('legacy'); } }, 'Keep as is'));
      options.forEach((key) => {
        buttons.append(el('button', {
          type: 'button',
          'data-choice': key,
          onclick: () => { show(key); choose(key); },
          onmouseenter: () => show(key, true),
        }, rules.STANDARDS[key].label));
      });
      if (!options.length) bar.append(el('p', { class: 'std-note' }, 'No standard fits this content: keep as is (legacy)'));
      if (options.length) {
        buttons.append(el('button', {
          type: 'button',
          class: 'std-group',
          title: 'Use this choice for the whole group',
          onclick: () => {
            const { choice } = bar.dataset;
            if (choice) choose(choice, 'group');
          },
        }, 'For the group'));
      }
      bar.append(buttons);
    }
    const heading = block.querySelector('h1, h2, h3, h4, p');
    const textStart = words(heading ? heading.textContent : block.textContent).split(' ').slice(0, 6).join(' ');
    buttons.append(el('a', {
      href: `${page.live}#:~:text=${encodeURIComponent(textStart)}`, target: '_blank', rel: 'noopener', class: 'std-live',
    }, 'Live page'));
    if (standard) bar.append(buttons);
    // the group and what changes, folded (the bar stays small over the block)
    bar.append(el(
      'details',
      { class: 'std-details' },
      el('summary', {}, 'Details'),
      cluster ? el('p', { class: 'std-cluster' }, `Group: ${cluster.label} · ${cluster.size} blocks on the site`) : null,
      instance.fragment ? el('p', { class: 'std-note' }, 'Shared content: the choice applies on every page that shows it') : null,
      changes,
    ));
    layer.append(bar);
    row.bar = bar;

    const state = store();
    const now = resolved(state, instance);
    if (now) {
      bar.dataset.choice = now.choice;
      bar.dataset.from = now.from;
      if (now.from === 'group') bar.prepend(el('p', { class: 'std-badge' }, 'decided for the whole group'));
      if (now.from === 'same-look') bar.prepend(el('p', { class: 'std-badge' }, 'looks the same as today'));
      show(now.choice);
    }
  });

  // the bars sit at the top right of their block's section, in a layer over the page
  const place = () => rows.forEach((row) => {
    const r = (row.current || row.original).getBoundingClientRect();
    // a block in a closed tab or accordion panel: its bar shows when the block does
    row.bar.hidden = !r.height;
    row.bar.style.top = `${r.top + window.scrollY}px`;
    row.bar.style.left = `${Math.max(0, r.right - row.bar.offsetWidth)}px`;
  });
  place();
  new ResizeObserver(place).observe(document.querySelector('main'));
  window.addEventListener('resize', place);
  // (a tab switch need not change the page's size)
  document.addEventListener('click', () => setTimeout(place, 100));

  update();
  const missing = page.instances.length - rows.length;
  panel(
    'Standardise: page review',
    reviewerField(store()),
    progress,
    missing > 0 ? el('p', { class: 'std-note' }, `${missing} more block${missing > 1 ? 's are' : ' is'} not shown on this page `
      + '(for example in a pop-up): decide on the group boards') : null,
    el('button', {
      type: 'button',
      onclick: () => {
        const state = store();
        state.effort.push({
          kind: 'page', key: path, seconds: Math.round((Date.now() - started) / 1000), choices, at: new Date().toISOString(),
        });
        save(state);
        progress.textContent = `${progress.textContent} · page done`;
      },
    }, 'Done with this page'),
    el('button', { type: 'button', onclick: exportDecisions }, 'Export decisions'),
    el('button', {
      type: 'button',
      onclick: (e) => {
        layer.hidden = !layer.hidden;
        e.target.textContent = layer.hidden ? 'Show the bars' : 'Hide the bars';
      },
    }, 'Hide the bars'),
    el('a', { href: `${href('/std/drafts/standards')}?standardise=board` }, 'Group boards'),
  );
}

/* ---------- board mode ---------- */

async function boardMode(data, rules, clusterId) {
  const main = document.querySelector('main');
  const board = el('div', { class: 'section std-board' });
  main.prepend(board);
  // (&half=B: only the blocks of that review half's pages; a block shared by both halves once)
  const half = new URLSearchParams(window.location.search).get('half');
  const keep = half ? `&half=${half}` : '';
  const seen = new Set();
  const scope = Object.values(data.pages)
    .filter((p) => !half || p.half === half)
    .flatMap((p) => p.instances.map((i) => ({ ...i, live: p.live })))
    .filter((i) => !seen.has(i.id) && seen.add(i.id));
  const count = (id) => scope.filter((i) => i.cluster === id).length;
  if (!clusterId) {
    board.append(el('h1', {}, 'Standardise: group boards'));
    board.append(el('p', {}, 'One board per group of Columns blocks that look alike, largest first. '
      + 'Decide once for the group, mark the exceptions, then confirm on the pages.'));
    const state = store();
    const list = el('ol', {});
    // only the groups whose blocks fit a standard (pre-selection records what each block fits)
    const fits = new Set(scope.filter((i) => !i.eligible || i.eligible.length)
      .map((i) => i.cluster));
    const groups = Object.entries(data.clusters).filter(([id]) => fits.has(id));
    const others = new Set(scope.map((i) => i.cluster).filter(Boolean)).size - groups.length;
    if (others) {
      board.append(el('p', {}, `${others} other groups fit no standard: they stay as they are (decide on the pages if needed).`));
    }
    groups.sort((a, b) => b[1].size - a[1].size).forEach(([id, c]) => {
      const decided = state.clusters[id];
      list.append(el(
        'li',
        {},
        el('a', { href: `?standardise=board&cluster=${id}${keep}` }, c.label),
        ` · ${count(id)} on the pilot pages, ${c.size} on the site${decided ? ` · decided: ${decided.choice}` : ''}`,
      ));
    });
    board.append(list);
    return;
  }
  const cluster = data.clusters[clusterId];
  const started = Date.now();
  const instances = scope.filter((i) => i.cluster === clusterId);
  board.append(
    el('h1', {}, `Group ${clusterId}`),
    el('p', {}, `${cluster.label} · ${cluster.size} blocks on the site, ${instances.length} on the pilot pages`),
  );
  const state = store();
  const exceptions = new Set((state.clusters[clusterId] || {}).exceptions || []);
  let options = [];
  await instances.reduce((chain, instance) => chain.then(async () => {
    const { section, block } = await sourceOf(instance);
    if (!block) return;
    const eligible = rules.eligible(block);
    if (!options.length) options = eligible;
    const row = el('div', { class: 'std-row', 'data-std-id': instance.id });
    const pageName = instance.id.split('#')[0].split('/').pop();
    row.append(el(
      'p',
      { class: 'std-row-title' },
      `${pageName} `,
      el('a', { href: instance.live, target: '_blank', rel: 'noopener' }, 'live'),
      ' ',
      el('a', { href: `${href(instance.id.split('#')[0])}?standardise=1` }, 'page'),
      el('label', {}, el('input', {
        type: 'checkbox',
        ...(exceptions.has(instance.id) ? { checked: '' } : {}),
        onchange: (e) => {
          const s = store();
          s.clusters[clusterId] = s.clusters[clusterId] || { exceptions: [] };
          const ex = new Set(s.clusters[clusterId].exceptions || []);
          if (e.target.checked) ex.add(instance.id); else ex.delete(instance.id);
          s.clusters[clusterId].exceptions = [...ex];
          save(s);
        },
      }), ' exception (decide on its page)'),
    ));
    const cells = el('div', { class: 'std-row-cells' });
    // the block on its own, with its settings (not the whole section)
    const original = await render(rules.isolate(section, instance.block));
    cells.append(el('div', { class: 'std-cell' }, el('p', { class: 'std-cell-title' }, 'As it is'), original));
    await eligible.reduce((c2, key) => c2.then(async () => {
      const { section: result, changes } = rules.transform(section, instance.block, key);
      const out = await render(rules.isolate(result, instance.block));
      cells.append(el(
        'div',
        { class: 'std-cell' },
        el('p', { class: 'std-cell-title' }, rules.STANDARDS[key].label),
        out,
        el('p', { class: 'std-cell-changes' }, changes.join('; ') || 'nothing to change'),
      ));
    }), Promise.resolve());
    row.append(cells);
    board.append(row);
  }), Promise.resolve());
  const decided = (state.clusters[clusterId] || {}).choice;
  const buttons = el(
    'div',
    { class: 'std-buttons' },
    [['legacy', 'Keep as is'], ...options.map((k) => [k, rules.STANDARDS[k].label])].map(([key, label]) => el('button', {
      type: 'button',
      'data-choice': key,
      class: decided === key ? 'std-current' : '',
      onclick: (e) => {
        const s = store();
        const prev = s.clusters[clusterId] || { exceptions: [] };
        s.clusters[clusterId] = { ...prev, choice: key, at: new Date().toISOString() };
        s.effort.push({
          kind: 'board', key: clusterId, seconds: Math.round((Date.now() - started) / 1000), choices: 1, at: new Date().toISOString(),
        });
        save(s);
        [...e.target.parentElement.children].forEach((b) => b.classList.toggle('std-current', b === e.target));
      },
    }, label)),
  );
  panel(
    `Standardise: group ${clusterId}`,
    reviewerField(store()),
    el('p', {}, 'Choice for the whole group:'),
    buttons,
    el('button', { type: 'button', onclick: exportDecisions }, 'Export decisions'),
    el('a', { href: `?standardise=board${keep}` }, 'All groups'),
  );
}

/**
 * @param {string} mode the ?standardise value: board, else page mode
 * @param {function} decorateMain scripts.js decorateMain (passed in: no import cycle)
 */
export default async function start(mode, decorateMain) {
  decorate = decorateMain;
  await loadCSS(`${BASE}/scripts/standardise-preview.css`);
  const [data, rules] = await Promise.all([
    fetch(CANDIDATES).then((r) => r.json()),
    import(RULES),
  ]);
  const params = new URLSearchParams(window.location.search);
  if (mode === 'board') await boardMode(data, rules, params.get('cluster'));
  else await pageMode(data, rules);
}
