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
  frame: 'Frame', layout: 'Layout', image: 'Image', 'type title': 'Titles', 'type body': 'Body text', 'type link': 'Links', 'type button': 'Button text', buttons: 'Buttons',
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

function render() {
  const main = $('.lk-main');
  if (!data) {
    main.replaceChildren(el('p', { class: 'lk-none' }, 'No data for this block type yet.'));
    return;
  }
  $('.lk-summary').textContent = `${data.instances} instances in ${data.groups.length} groups · ${data.measuredPages} pages measured`;
  main.replaceChildren(...data.groups.map((g) => el(
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
    g.close.length ? el('p', { class: 'lk-meta lk-close' }, 'Nearly the same as: ', ...g.close.flatMap((c, i) => [
      i ? ' · ' : '',
      el('a', { href: `#g${c.id}` }, `#${c.id}`),
      ` (${PART_NAMES[c.part] || c.part}: ${c.theirs})`,
    ])) : null,
    g.lacking?.length ? el('p', { class: 'lk-meta lk-lacking' }, `Includes the same look with a part missing: ${g.lacking.map(([k, n]) => `${n} ${lackOf([k])}`).join(' · ')} (tagged below, after the complete ones)`) : null,
    // (complete instances first, then the ones lacking a part)
    el('div', { class: 'lk-strip' }, ...[...g.items].sort((a, c) => (a.missing?.length || 0) - (c.missing?.length || 0)).map((it) => {
      const shot = vp === 'm' ? it.phoneShot : it.shot;
      return el(
        'a',
        {
          class: 'lk-shot', href: pageLink(it.page), target: '_blank', rel: 'noopener', title: `${it.title} · ${it.text.slice(0, 120)}`,
        },
        shot ? el('img', { src: `./${shot}`, loading: 'lazy', alt: `${it.title}, block ${it.n + 1}` }) : el('span', { class: 'lk-none' }, 'no screenshot'),
        el('span', {}, `${it.title}${it.inFragment ? ' (fragment)' : ''}`),
        it.missing?.length ? el('span', { class: 'lk-tag' }, lackOf(it.missing)) : null,
      );
    })),
  )));
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
  document.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => {
    vp = b.dataset.vp;
    document.querySelectorAll('[data-vp]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  $('.lk-size').addEventListener('input', (e) => document.body.style.setProperty('--lk-h', `${e.target.value}px`));
  await load(type);
}

start();
