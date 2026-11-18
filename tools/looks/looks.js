/*
 * Block looks inspection page: every instance of a block type, grouped by how it looks
 * (tools/importer/standardise/looks/group.mjs → data/<type>.json), largest group first; per group
 * the look in words, the authored variants it holds, groups that are nearly the same, and every
 * instance's screenshot in one long row (desktop or phone), linked to its page.
 * Screenshots come from shots/<type>/, copied there (git-ignored) by group.mjs.
 * Open: /tools/looks/index.html?type=cards-corp
 */
const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(window.location.search);
const LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname) || /^preview-aemcoder\.adobe\.io$/.test(window.location.hostname);
const pageLink = (path) => (LOCAL ? `/content/rs${path}` : `/rs${path}`);
const NAMES = {
  'cards-corp': 'Cards', 'hero-corp': 'Hero', video: 'Video', 'sticky-nav': 'Sticky Nav', 'related-categories': 'Related Categories', 'marketo-form': 'Marketo form', table: 'Table', accordion: 'Accordion', statistics: 'Statistics', 'chart-corp': 'Chart', 'gallery-corp': 'Gallery',
};
// (what a merged instance lacks, in words)
const LACK_NAMES = {
  image: 'without image', 'type title': 'without titles', 'type body': 'without body text', 'type link': 'without links', 'type button': 'without button text', buttons: 'without buttons',
};
const lackOf = (missing = []) => missing.map((k) => LACK_NAMES[k] || `without ${k}`).join(', ');
const PART_NAMES = {
  frame: 'Frame', layout: 'Layout', image: 'Image', 'type title': 'Titles', 'type body': 'Body text', 'type link': 'Links', 'type button': 'Button text', buttons: 'Buttons', panels: 'Panels',
};

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat()
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
}

let data = null;
let vp = 'd';
let view = params.get('view') === 'layout' ? 'layout' : 'size';

const SIZE_NOTE = 'Text sizes in bands: S up to 16 px, M up to 26, L up to 38, XL up to 56, XXL above.';

function groupBox(g) {
  return el(
    'section',
    { class: 'lk-groupbox', id: `g${g.id}` },
    el(
      'div',
      { class: 'lk-head' },
      el('h2', {}, `#${g.id}`),
      el('span', { class: 'lk-count' }, `${g.instances} instance${g.instances > 1 ? 's' : ''} on ${g.pages} page${g.pages > 1 ? 's' : ''}`),
      el('span', { class: 'lk-meta' }, `authored as: ${g.classes.map(([c, n]) => `${c} (${n})`).join(', ')}`),
    ),
    el('dl', { class: 'lk-parts' }, ...Object.entries(g.parts).flatMap(([k, v]) => [el('dt', {}, PART_NAMES[k] || k), el('dd', {}, v)])),
    // (with sizes in bands: the exact styles the group holds)
    g.exactTypes ? el('details', { class: 'lk-exact' }, el('summary', {}, 'Exact text styles in this group'), el('dl', { class: 'lk-parts' }, ...Object.entries(g.exactTypes).flatMap(([r, list]) => [
      el('dt', {}, PART_NAMES[`type ${r}`] || r),
      el('dd', {}, list.map(([t, n]) => `${t} (${n})`).join(' · ')),
    ]))) : null,
    g.close.length ? el('p', { class: 'lk-meta lk-close' }, 'Nearly the same as: ', ...g.close.flatMap((c, i) => [
      i ? ' · ' : '',
      el('a', { href: `#g${c.id}` }, `#${c.id}`),
      ` (${PART_NAMES[c.part] || c.part}: ${c.theirs})`,
    ])) : null,
    g.lacking?.length ? el('p', { class: 'lk-meta lk-lacking' }, `Includes the same look with a part missing: ${g.lacking.map(([k, n]) => `${n} ${lackOf([k])}`).join(' · ')} (tagged below, after the complete ones)`) : null,
    // (complete instances first, then the ones lacking a part)
    el('div', { class: 'lk-strip' }, ...[...g.items].sort((a, c) => (a.missing?.length || 0) - (c.missing?.length || 0)).map((it) => {
      const shot = vp === 'm' ? it.phoneShot : it.shot;
      const tip = `${it.title} · ${it.text.slice(0, 120)}`;
      // (the screenshot and the title open the page as it is now; the source link the live
      // stryker.com page)
      return el(
        'div',
        { class: 'lk-shot' },
        el(
          'a',
          {
            class: 'lk-shot-img', href: pageLink(it.page), target: '_blank', rel: 'noopener', title: tip,
          },
          shot ? el('img', { src: `./${shot}`, loading: 'lazy', alt: `${it.title}, block ${it.n + 1}` }) : el('span', { class: 'lk-none' }, 'no screenshot'),
        ),
        el(
          'span',
          { class: 'lk-caption' },
          el('a', {
            class: 'lk-page', href: pageLink(it.page), target: '_blank', rel: 'noopener', title: `Open ${it.title} (as-is page)`,
          }, `${it.title}${it.inFragment ? ' (fragment)' : ''}`),
          it.source ? el('a', {
            class: 'lk-source', href: it.source, target: '_blank', rel: 'noopener', title: 'Open the live stryker.com page',
          }, 'stryker.com ↗') : null,
        ),
        it.missing?.length ? el('span', { class: 'lk-tag' }, lackOf(it.missing)) : null,
      );
    })),
  );
}

function render() {
  const main = $('.lk-main');
  if (!data) {
    main.replaceChildren(el('p', { class: 'lk-none' }, 'No data for this block type yet.'));
    return;
  }
  const families = data.families || [];
  $('.lk-summary').textContent = `${data.instances} instances in ${data.groups.length} groups${families.length ? ` (${families.length} layouts)` : ''} · ${data.measuredPages} pages measured`;
  const note = data.sizes === 'bands' ? el('p', { class: 'lk-meta lk-note' }, SIZE_NOTE) : null;
  if (view !== 'layout' || !families.length) {
    main.replaceChildren(...[note, ...data.groups.map(groupBox)].filter(Boolean));
    return;
  }
  // by layout: each layout family (same frame, layout and image) with its groups, largest first
  const byId = Object.fromEntries(data.groups.map((g) => [g.id, g]));
  main.replaceChildren(...[note, ...families.map((f) => el(
    'section',
    { class: 'lk-family', id: `f${f.id}` },
    el(
      'h2',
      { class: 'lk-family-head' },
      `Layout ${f.id}: ${f.instances} instance${f.instances > 1 ? 's' : ''} in ${f.groups.length} group${f.groups.length > 1 ? 's' : ''}`,
      el('span', { class: 'lk-meta' }, ` · ${Object.entries(f.parts).map(([k, v]) => `${PART_NAMES[k] || k}: ${v}`).join(' · ')}`),
    ),
    ...f.groups.map((id) => groupBox(byId[id])),
  ))].filter(Boolean));
}

async function load(type) {
  const resp = await fetch(`./data/${type}.json`);
  data = resp.ok ? await resp.json() : null;
  document.title = `${NAMES[type] || type}: looks`;
  render();
  if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
}

async function start() {
  const resp = await fetch('./data/index.json');
  const index = resp.ok ? await resp.json() : { types: [] };
  const type = params.get('type') || index.types[0]?.type || 'cards-corp';
  $('.lk-type').replaceChildren(...index.types.map((t) => el('option', { value: t.type }, `${NAMES[t.type] || t.type} (${t.instances})`)));
  $('.lk-type').value = type;
  $('.lk-type').addEventListener('change', (e) => {
    const p = new URLSearchParams(window.location.search);
    p.set('type', e.target.value);
    window.history.replaceState(null, '', `?${p}`);
    load(e.target.value);
  });
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.view === view));
    b.addEventListener('click', () => {
      view = b.dataset.view;
      document.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const p = new URLSearchParams(window.location.search);
      p.set('view', view);
      window.history.replaceState(null, '', `?${p}`);
      render();
    });
  });
  document.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => {
    vp = b.dataset.vp;
    document.querySelectorAll('[data-vp]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  $('.lk-size').addEventListener('input', (e) => document.body.style.setProperty('--lk-h', `${e.target.value}px`));
  await load(type);
}

start();
