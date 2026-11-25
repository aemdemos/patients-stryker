/*
 * Block options — an Experience Workspace / DA sidebar extension. Authors pick a block's
 * options (e.g. hero-corp's headline box, column, height) from named choices instead of
 * typing option names into the block's name row. The choices come from options.js and the
 * Block Library sheet panel-options (tools/library-options.js); a preview
 * renders the block with the new options using the site's own code (the Text style panel's
 * preview page).
 *
 * Experience Workspace: the block holding the cursor is read from the live document and
 * replaced with its new options (sendHTML replace, as the Block Inspector extension does).
 * DA editor: it shares no document, so the author selects the block's name row
 * ("hero-corp (image-slide, …)") and the panel rewrites that text.
 */
import {
  BLOCK_OPTIONS, SECTION_OPTIONS, knownOptions, withLibrary,
} from './options.js';
import { allLibraryOptions } from '../library-options.js';
import { REVIEW_NOTE, documentPath, outsideReview } from '../review-pages.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';
const PREVIEW = '/tools/text-markers/preview.html';
const VIEWS = { desktop: 1200, phone: 375 };

const toClassName = (s) => s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v !== undefined) node.setAttribute(k, v === true ? '' : v);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

// the built-in options with the Block Library sheet panel-options merged in (set before render)
let blockOptions = BLOCK_OPTIONS;
let sdk = null;
let live = null; // Experience Workspace: { html, selection: { blockIndex }, editable }
let sourceCache = { at: 0, html: '' };
// the block being edited: { name, options: [...], html, sectionStyles, sectionHtml, hasMeta,
// from: 'live' | 'header' }
let current = null;
let draft = []; // the options as the author is changing them
let sectionDraft = []; // the section's styles as the author is changing them
const touched = new Set(); // groups the author changed (their older free values are dropped)
let view = 'desktop';
let previewReady = false;
let previewHeight = 160;

let root;
let statusEl;
let titleEl;
let groupsEl;
let otherEl;
let applyButton;
let previewFrame;
let frameBox;
let noticeEl;
let sectionEl;
// re-renders the block's groups and the section's (set below, once both renderers exist)
let renderGroups = () => {};

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

/* ---------------------------------------------------------------- the document */

function sourceBlocks(doc) {
  return [...doc.querySelectorAll('main > div > div[class]')]
    .filter((b) => !/^(section-metadata|metadata|da-metadata|library-metadata)$/.test(b.classList[0]));
}

// the section roles: a tab, an accordion panel, a carousel slide (consecutive sections join)
const SECTION_ROLES = ['tab-panel', 'accordion-panel', 'carousel'];

function stylesOfSection(section) {
  const meta = section?.querySelector(':scope > .section-metadata');
  const row = meta && [...meta.children]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'style');
  return row ? row.children[1].textContent.split(',').map(toClassName).filter(Boolean) : [];
}

function sectionStylesOf(block) {
  return stylesOfSection(block.parentElement);
}

/** the section holding a block: its styles, markup and whether it has a Section Metadata table */
function sectionOf(block) {
  const section = block?.parentElement;
  if (!section) return { sectionStyles: [], sectionHtml: '', hasMeta: false };
  // the roles of the sections before and after it (a tab set, accordion or carousel continues)
  const neighbourRoles = [section.previousElementSibling, section.nextElementSibling]
    .flatMap((s) => stylesOfSection(s)).filter((st) => SECTION_ROLES.includes(st));
  return {
    sectionStyles: sectionStylesOf(block),
    sectionHtml: section.outerHTML,
    hasMeta: !!section.querySelector(':scope > .section-metadata'),
    neighbourRoles,
  };
}

/** a block's name row as authored: "hero-corp (image-slide, box-gold)" → name + options */
function parseHeader(text) {
  const m = text.trim().match(/^([a-z0-9][a-z0-9 -]*?)\s*(?:\(([^)]*)\))?$/i);
  if (!m) return null;
  return { name: toClassName(m[1]), options: (m[2] || '').split(',').map(toClassName).filter(Boolean) };
}

async function daSource() {
  if (Date.now() - sourceCache.at < 4000) return sourceCache.html;
  const ctx = sdk.context || sdk.project || {};
  let html = '';
  if (ctx.org && ctx.repo && ctx.path && typeof sdk.actions.daFetch === 'function') {
    try {
      const resp = await sdk.actions.daFetch(`https://admin.da.live/source/${ctx.org}/${ctx.repo}${ctx.path}.html`);
      if (resp.ok) html = await resp.text();
    } catch { html = ''; }
  }
  sourceCache = { at: Date.now(), html };
  return html;
}

/* ---------------------------------------------------------------- options */

const def = () => current && blockOptions[current.name];
const layoutOf = (options) => {
  const layout = def()?.groups.find((g) => g.required);
  return layout && layout.options.map(([v]) => v).find((v) => options.includes(v));
};

/** the block's options with older names read as their new choices (the block's `aliases`) */
function normalised(name, options) {
  const aliases = blockOptions[name]?.aliases;
  if (!aliases) return [...options];
  const out = options.flatMap((o) => aliases[o] || [o]);
  return out.filter((o, i) => out.indexOf(o) === i);
}

/** a choice may set several classes ("box-white shadow"): the class names it adds */
const tokensOf = (value) => value.split(/\s+/).filter(Boolean);

/** the choice of a group the options hold: the one whose classes are all there (the fullest) */
function selectedIn(group, options) {
  return group.options.map(([v]) => v)
    .filter((v) => v && tokensOf(v).every((t) => options.includes(t)))
    .sort((a, b) => tokensOf(b).length - tokensOf(a).length)[0] || '';
}

/** `when` names a layout (the group shows only with it) or another group (shown, greyed out
 * until that group has a choice, e.g. which cell holds the box) */
function shown(group) {
  if (!group.when) return true;
  const other = def().groups.find((g) => g.id === group.when && g.options);
  return other ? true : group.when === layoutOf(draft);
}
const visibleGroups = () => def().groups.filter(shown);

/* ---------------------------------------------------------------- fit */

const DM_IMAGE = /media-assets\.stryker\.com\/is\/image\//i;
const DM_VIDEO = /media-assets\.stryker\.com\/is\/content\/|\.(mp4|m3u8)(\?|$)/i;
const isImage = (n) => n.matches?.('picture, img') || (n.matches?.('a[href]') && DM_IMAGE.test(n.getAttribute('href')))
  || !!n.querySelector?.('picture, img, a[href*="media-assets.stryker.com/is/image/"]');

/**
 * What the selected block holds, for the `needs` of the options: its cells per row, images,
 * captions (text right under an image in a cell), an image in the first cell with text beside
 * it, links and lists of links, text.
 * @param {string} html The block's markup
 */
function factsOf(html) {
  const facts = {
    cells: 0,
    rows: 0,
    images: false,
    caption: false,
    imageFirst: false,
    links: false,
    linkLists: false,
    text: false,
    video: false,
    sheetLink: false,
    lists: false,
  };
  if (!html) return null;
  const block = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
  if (!block) return null;
  facts.rows = block.children.length;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    facts.cells = Math.max(facts.cells, cells.length);
    cells.forEach((cell, i) => {
      const parts = [...cell.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
      const imageAt = parts.findIndex((n) => n.nodeType === 1 && isImage(n));
      if (imageAt >= 0) facts.images = true;
      const isText = (n) => n.textContent.trim() && !(n.nodeType === 1 && isImage(n));
      if (imageAt >= 0 && parts.slice(imageAt + 1).some(isText)) facts.caption = true;
      const besides = cells.slice(1).some((c) => c.textContent.trim());
      if (i === 0 && imageAt >= 0 && besides) facts.imageFirst = true;
    });
  });
  facts.links = [...block.querySelectorAll('a[href]')].some((a) => !DM_IMAGE.test(a.getAttribute('href')));
  facts.linkLists = !!block.querySelector('li a[href]');
  facts.lists = !!block.querySelector('ul, ol');
  facts.text = !!block.textContent.trim();
  facts.video = !!block.querySelector('video') || [...block.querySelectorAll('a[href]')]
    .some((a) => DM_VIDEO.test(a.getAttribute('href')));
  // the block holds only a link to a sheet (its .json): Table `sheet`
  const links = [...block.querySelectorAll('a[href]')];
  facts.sheetLink = links.length === 1 && /\.json([?#]|$)/.test(links[0].getAttribute('href'))
    && block.textContent.trim() === links[0].textContent.trim();
  return facts;
}

/** why a choice can't apply to the selected block ('' when it fits) */
function unfit(needs, facts) {
  if (!needs || !facts) return '';
  const cells = facts.cells === 1 ? '1 cell' : `${facts.cells} cells`;
  const reasons = {
    'cells-2': facts.cells === 2 ? '' : `needs 2 cells (this row has ${cells})`,
    'cells-2+': facts.cells >= 2 ? '' : 'needs 2 or more cells',
    'cells-3': facts.cells === 3 ? '' : `needs 3 cells (this row has ${cells})`,
    'cells-3+': facts.cells >= 3 ? '' : `needs 3 or more cells (this row has ${cells})`,
    'cells-4': facts.cells === 4 ? '' : `needs 4 cells (this row has ${cells})`,
    images: facts.images ? '' : 'needs images in the row',
    caption: facts.caption ? '' : 'needs a photo with a caption under it',
    'image-first': facts.imageFirst ? '' : 'needs an image in the first cell and text beside it',
    links: facts.links ? '' : 'needs links in the row',
    'link-lists': facts.linkLists ? '' : 'needs a list of links',
    text: facts.text ? '' : 'needs text in the row',
    video: facts.video ? '' : 'needs a video link in the first row',
    'rows-2+': facts.rows >= 2 ? '' : 'needs 2 or more numbers (rows)',
    'rows-4+': facts.rows >= 4 ? '' : `needs 4 or more numbers (this block has ${facts.rows})`,
    'rows-6+': facts.rows >= 6 ? '' : `needs 6 or more numbers (this block has ${facts.rows})`,
    lists: facts.lists ? '' : 'needs a list in a panel',
    'sheet-link': facts.sheetLink ? '' : 'needs a link to a sheet (its .json) as the only content',
    'dm-video': facts.video ? '' : 'needs a Dynamic Media video (a YouTube video plays as YouTube sets it)',
    box: def().groups.some((g) => g.id === 'box' && selectedIn(g, draft))
      ? '' : `pick a ${def().groups.find((g) => g.id === 'box')?.label || 'box'} first`,
    'gradient-box': def().groups.some((g) => g.id === 'box' && /-gradient$/.test(selectedIn(g, draft)))
      ? '' : 'needs a gradient box colour',
    bars: draft.includes('pie') ? 'needs a column or bar chart (a pie always shows its values)' : '',
  };
  return needs.map((n) => reasons[n]).find(Boolean) || '';
}

/** the options no group knows (older free values, or ones the panel has no choice for) */
function otherOptions(options) {
  const known = knownOptions(def());
  return options.filter((o) => !known.has(o) && !def().groups
    .some((g) => g.replaces && touched.has(g.id) && g.replaces.test(o)));
}

function pick(group, value) {
  const values = group.options.flatMap(([v]) => tokensOf(v));
  touched.add(group.id);
  draft = draft.filter((o) => !values.includes(o) && !(group.replaces && group.replaces.test(o)));
  if (value) draft.push(...tokensOf(value));
  // a choice that can't go with another group's (both draw the cell's one box) clears it
  if (value && group.clears && (!group.clearsWhen || group.clearsWhen.includes(value))) {
    draft = draft.filter((o) => !group.clears.test(o));
  }
  // a group shown only with this one's choice (e.g. which cell has the box) goes with it
  if (!value) {
    def().groups.filter((g) => g.when === group.id && g.options).forEach((g) => {
      const dependent = g.options.flatMap(([v]) => tokensOf(v));
      draft = draft.filter((o) => !dependent.includes(o));
    });
  }
}

function toggle(flag, on, group) {
  draft = draft.filter((o) => o !== flag);
  if (on) draft.push(flag);
  // a switch group's older names (e.g. a video's `no-border`) go once the author uses it
  if (group?.replaces) {
    touched.add(group.id);
    draft = draft.filter((o) => !group.replaces.test(o));
  }
}

/** the options in a stable order: the groups' order, then the others as authored */
function ordered(options) {
  const order = def().groups.flatMap((g) => (g.options || g.flags).flatMap(([v]) => tokensOf(v)));
  const known = options.filter((o) => order.includes(o))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...known, ...options.filter((o) => !order.includes(o))];
}

/* ---------------------------------------------------------------- preview */

function sizePreview() {
  const width = VIEWS[view];
  const scale = Math.min(1, frameBox.clientWidth / width);
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${previewHeight}px`;
  previewFrame.style.transform = `scale(${scale})`;
  frameBox.style.height = `${Math.ceil(previewHeight * scale)}px`;
}

function updatePreview() {
  if (!previewReady || !current?.html) return;
  const doc = new DOMParser().parseFromString(current.html, 'text/html');
  const block = doc.body.firstElementChild;
  block.className = [current.name, ...ordered(draft)].join(' ');
  sizePreview();
  previewFrame.contentWindow.postMessage({
    action: 'tm-preview-render', block: block.outerHTML, sectionStyles: sectionDraft, words: '', marker: '',
  }, window.location.origin);
}

/* ---------------------------------------------------------------- the section */

const SECTION_CHOICE_NEEDS = ['flex', 'accordion-panel', 'carousel', 'split'];
// the groups that turn a section into one of them, folded away unless the section or a
// neighbour has a role: most sections are none of these
const ROLE_GROUPS = ['role', 'accordion', 'carousel', 'band'];
const ROLE_LABELS = { 'tab-panel': 'a tab', 'accordion-panel': 'an accordion panel', carousel: 'a carousel slide' };

/**
 * What the section holding the block has, for the section choices' `needs`: its parts (each
 * block, and each run of text between blocks), whether it opens with a heading, its blocks.
 * @param {string} html The section's markup
 */
function sectionFactsOf(html, near = []) {
  if (!html) return null;
  const section = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
  if (!section) return null;
  const children = [...section.children].filter((c) => !c.matches('.section-metadata'));
  let parts = 0;
  let inText = false;
  children.forEach((c) => {
    const isBlock = c.tagName === 'DIV' && c.classList.length;
    if (isBlock || !inText) parts += 1;
    inText = !isBlock;
  });
  return {
    parts,
    headingFirst: /^H[1-6]$/.test(children[0]?.tagName || ''),
    // a Hero (corp) block is a carousel slide; a Columns row only as a split slide of a
    // carousel that is already there (this section or the one next to it)
    slideBlock: !!section.querySelector(':scope > .hero-corp')
      || (!!section.querySelector(':scope > .columns') && (near.includes('carousel') || sectionDraft.includes('carousel'))),
    columnsBlock: !!section.querySelector(':scope > .columns'),
  };
}

/** why a section choice can't apply ('' when it fits) */
function sectionUnfit(needs, facts) {
  if (!needs) return '';
  if (!facts) return 'the section can’t be read: click in the block again';
  const parts = facts.parts === 1 ? '1 part' : `${facts.parts} parts`;
  const reasons = {
    'parts-2+': facts.parts >= 2 ? '' : `needs 2 or more parts in the section (blocks, or the text between them): this section has ${parts}`,
    'heading-first': facts.headingFirst ? '' : 'needs a heading at the top of the section (it becomes the label)',
    'slide-block': facts.slideBlock ? '' : 'needs a Hero (corp) block in the section, or a Columns row next to a carousel slide (a split slide)',
    'columns-block': facts.columnsBlock ? '' : 'needs a Columns block in the section (the image and the title)',
    flex: sectionDraft.includes('flex') ? '' : 'pick Side by side first',
    'accordion-panel': sectionDraft.includes('accordion-panel') ? '' : 'make the section an accordion panel first',
    carousel: sectionDraft.includes('carousel') ? '' : 'make the section a carousel slide first',
    split: sectionDraft.includes('split') ? '' : 'turn on Split slide first',
  };
  return needs.map((n) => reasons[n]).find(Boolean) || '';
}

const sectionChoices = () => SECTION_OPTIONS.groups.flatMap((g) => g.options || g.flags);

/** a section choice that is on although its own condition (another section choice) is off */
function unmetChoice() {
  return sectionChoices().find(([value, , meta]) => {
    const tokens = tokensOf(value);
    const needs = (meta?.needs || []).filter((n) => SECTION_CHOICE_NEEDS.includes(n));
    const on = tokens.length && tokens.every((t) => sectionDraft.includes(t));
    return on && sectionUnfit(needs, {});
  });
}

/** drops the section choices whose condition no longer holds (phones without side by side …) */
function pruneSection() {
  for (let unmet = unmetChoice(); unmet; unmet = unmetChoice()) {
    const tokens = tokensOf(unmet[0]);
    sectionDraft = sectionDraft.filter((o) => !tokens.includes(o));
  }
}

function pickSection(group, value) {
  const values = group.options.flatMap(([v]) => tokensOf(v));
  sectionDraft = sectionDraft.filter((o) => !values.includes(o));
  if (value) sectionDraft.push(...tokensOf(value));
  pruneSection();
}

function toggleSection(flag, on) {
  sectionDraft = sectionDraft.filter((o) => o !== flag);
  if (on) sectionDraft.push(flag);
  pruneSection();
}

/** the section styles in a stable order: the others as authored, then the choices' order */
function orderedSection(styles) {
  const order = sectionChoices().flatMap(([v]) => tokensOf(v));
  const others = styles.filter((o) => !order.includes(o));
  const known = styles.filter((o) => order.includes(o))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...new Set([...others, ...known])];
}

/**
 * Copies the section's new styles to paste into its Section Metadata: the Style text when the
 * section has a Section Metadata table, otherwise a whole Section Metadata table. The panel
 * doesn't write the section itself: the editor's guarded replace changes only the block at the
 * cursor, and the Section Metadata table is not a block it can address.
 */
async function copySection() {
  const text = orderedSection(sectionDraft).join(', ');
  const codeEl = sectionEl.querySelector('.tm-code');
  if (current.hasMeta && !text) {
    setStatus('No section style left: clear the Style row of this section’s Section Metadata (delete the table if Style is its only row).', 'info');
    return;
  }
  try {
    if (current.hasMeta) {
      await navigator.clipboard.writeText(text);
      setStatus(`Copied “${text}”. In this section’s Section Metadata table, select the text of the Style row and paste over it.`, 'ok');
    } else {
      const table = el('table', {}, el('tr', {}, el('td', { colspan: '2' }, 'Section Metadata')), el('tr', {}, el('td', {}, 'style'), el('td', {}, text)));
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([table.outerHTML], { type: 'text/html' }),
        'text/plain': new Blob([`Section Metadata\nstyle\t${text}`], { type: 'text/plain' }),
      })]);
      setStatus(`Copied a Section Metadata table with the style “${text}”. Click at the end of this section (after its last block or text, before the section break) and paste.`, 'ok');
    }
  } catch {
    codeEl.textContent = text;
    codeEl.hidden = false;
    setStatus(`Copy this into the Style row of the section’s Section Metadata: ${text}`, 'info');
  }
}

/**
 * The Section area follows the selected block's section: it shows only the section styles
 * that can apply to it (side by side when the section holds 2 or more parts, tab or accordion
 * panel when it opens with a heading, carousel slide when it holds a Hero (corp) or Columns
 * block), and a follow-up choice (on phones, starts open, autoplay, split band) only once its
 * main choice is picked. A style the section already has always shows, so it can be removed.
 * The styles that can't apply are listed, with why, under "Other section styles".
 */
function renderSection() {
  sectionEl.replaceChildren();
  sectionEl.hidden = !current;
  if (!current) return;
  const facts = sectionFactsOf(current.sectionHtml, current.neighbourRoles || []);
  const isOn = (value) => !!value && tokensOf(value).every((t) => sectionDraft.includes(t));
  const offered = (value, meta) => isOn(value) || !sectionUnfit(meta?.needs, facts);
  // listed with why it isn't offered: a choice hidden by the section's content; a follow-up
  // whose main choice is off (on phones, starts open, split …) is left out silently
  const structural = (meta) => {
    const needs = meta?.needs || [];
    const follows = needs.filter((n) => SECTION_CHOICE_NEEDS.includes(n));
    return needs.some((n) => !SECTION_CHOICE_NEEDS.includes(n)) && !sectionUnfit(follows, facts);
  };
  const hidden = [];
  const titleOf = (value, meta) => [meta?.hint, value ? `Style “${value.replace(' ', ', ')}”` : 'No style']
    .filter(Boolean).join('\n');
  sectionEl.append(
    el('h2', { class: 'tm-section-title' }, 'Section'),
    el('p', { class: 'tm-hint' }, 'The part of the page this block sits in, between two section breaks. These choices change the whole section, not only the block (Section Metadata → Style).'),
  );
  let groupsShown = 0;
  const roleBox = el('details', { class: 'tm-more tm-roles' });
  SECTION_OPTIONS.groups.forEach((group) => {
    const choices = (group.options || group.flags).filter(([value]) => value);
    const visible = choices.filter(([value, , meta]) => offered(value, meta));
    choices.filter(([value, , meta]) => !offered(value, meta) && structural(meta))
      .forEach(([, label, meta]) => hidden.push([label, sectionUnfit(meta.needs, facts)]));
    if (!visible.length) return;
    groupsShown += 1;
    const fieldset = el('fieldset', { class: 'tm-group' }, el('legend', {}, group.label));
    const row = el('div', { class: 'tm-choices', role: group.flags ? 'group' : 'radiogroup', 'aria-label': group.label });
    if (group.flags) {
      visible.forEach(([value, label, meta]) => {
        row.append(el('label', { class: 'tm-check', title: titleOf(value, meta) }, el('input', {
          type: 'checkbox',
          checked: sectionDraft.includes(value),
          onchange: (e) => {
            toggleSection(value, e.target.checked);
            renderGroups();
            updatePreview();
          },
        }), label));
      });
    } else {
      const selected = selectedIn(group, sectionDraft);
      const none = group.options.find(([value]) => !value);
      [...(none ? [none] : []), ...visible].forEach(([value, label, meta]) => {
        row.append(el('button', {
          type: 'button',
          role: 'radio',
          class: 'tm-choice',
          'aria-checked': String(value === selected),
          title: titleOf(value, meta),
          onclick: () => {
            pickSection(group, value);
            renderGroups();
            updatePreview();
          },
        }, label));
      });
    }
    fieldset.append(row);
    (ROLE_GROUPS.includes(group.id) ? roleBox : sectionEl).append(fieldset);
  });
  if (roleBox.querySelector('fieldset')) {
    const near = (current.neighbourRoles || []).map((r) => ROLE_LABELS[r]).filter(Boolean);
    roleBox.prepend(el('summary', {}, 'Turn this section into a tab, accordion panel or carousel slide'));
    if (near.length) roleBox.append(el('p', { class: 'tm-hint' }, `The section next to it is ${[...new Set(near)].join(' and ')}: make this one the same to add it.`));
    roleBox.open = SECTION_ROLES.some((r) => sectionDraft.includes(r)) || near.length > 0;
    sectionEl.append(roleBox);
  }
  if (!groupsShown) {
    sectionEl.append(el('p', { class: 'tm-hint' }, 'No section style applies to this section as it is.'));
  }
  if (hidden.length) {
    sectionEl.append(el(
      'details',
      { class: 'tm-more' },
      el('summary', {}, `Other section styles (${hidden.length}): why they aren’t offered here`),
      el('ul', { class: 'tm-hint' }, ...hidden.map(([label, why]) => el('li', {}, `${label}: ${why}.`))),
    ));
  }
  const changed = orderedSection(sectionDraft).join(',') !== orderedSection(current.sectionStyles).join(',');
  const copy = el('button', { type: 'button', onclick: copySection, disabled: !changed }, changed ? 'Copy section style' : 'No section changes');
  sectionEl.append(
    el('div', { class: 'tm-actions' }, copy),
    el('code', { class: 'tm-code', hidden: true }),
    el('p', { class: 'tm-hint' }, current.hasMeta
      ? 'Copies the new Style text: paste it over the Style row of the section’s Section Metadata.'
      : 'Copies a Section Metadata table: paste it at the end of the section.'),
  );
}

/* ---------------------------------------------------------------- panel */

function renderBlockGroups() {
  groupsEl.replaceChildren();
  otherEl.replaceChildren();
  if (!current) {
    titleEl.textContent = 'No block selected';
    applyButton.disabled = true;
    frameBox.hidden = true;
    return;
  }
  if (!def()) {
    titleEl.textContent = `${current.name}: no options defined in this panel yet`;
    applyButton.disabled = true;
    frameBox.hidden = true;
    return;
  }
  titleEl.textContent = `${def().label} (${current.name})`;
  frameBox.hidden = !current.html;
  const facts = factsOf(current.html);
  visibleGroups().forEach((group) => {
    const fieldset = el('fieldset', { class: 'tm-group' }, el('legend', {}, group.label));
    const row = el('div', { class: 'tm-choices', role: group.flags ? 'group' : 'radiogroup', 'aria-label': group.label });
    // the whole group: what it needs, or the group it follows (which cell holds the box)
    const after = group.when && def().groups.find((g) => g.id === group.when && g.options);
    const groupReason = (after && !selectedIn(after, draft) ? `pick a ${after.label} first` : '')
      || unfit(group.needs, facts);
    const reasonOf = (value, meta, on) => {
      if (!value || on) return ''; // 'none' and a choice the block already has stay available
      return groupReason || unfit(meta?.needs, facts);
    };
    // the tooltip: why it is greyed out first, then what it does, then the option name
    const titleOf = (value, meta, reason) => [reason ? `Not available here: ${reason}.` : '', meta?.hint,
      value ? `Option “${value}”` : 'No option'].filter(Boolean).join('\n');
    // greyed out but not `disabled`, so the tooltip shows in every browser; clicks are ignored
    const unavailable = (reason) => (reason ? { 'aria-disabled': 'true' } : {});
    let greyed = 0;
    if (group.flags) {
      group.flags.forEach(([value, label, meta]) => {
        const on = draft.includes(value);
        const reason = reasonOf(value, meta, on);
        if (reason) greyed += 1;
        row.append(el('label', { class: `tm-check${reason ? ' tm-unfit' : ''}`, title: titleOf(value, meta, reason) }, el('input', {
          type: 'checkbox',
          checked: on,
          ...unavailable(reason),
          onclick: (e) => { if (reason) e.preventDefault(); },
          onchange: (e) => {
            toggle(value, e.target.checked, group);
            renderGroups();
            updatePreview();
          },
        }), label));
      });
    } else {
      const selected = selectedIn(group, draft);
      group.options.forEach(([value, label, meta]) => {
        const reason = reasonOf(value, meta, value === selected);
        if (reason) greyed += 1;
        row.append(el('button', {
          type: 'button',
          role: 'radio',
          class: `tm-choice${reason ? ' tm-unfit' : ''}`,
          'aria-checked': String(value === selected),
          ...unavailable(reason),
          title: titleOf(value, meta, reason),
          onclick: () => {
            if (reason) return;
            pick(group, value);
            renderGroups();
            updatePreview();
          },
        }, label));
      });
    }
    fieldset.append(row);
    // a whole group greyed out for one reason (e.g. "pick a Cell box first"): said once under it;
    // single choices say why in their tooltip
    const choices = (group.flags || group.options).filter(([v]) => v).length;
    if (groupReason && greyed && greyed === choices) {
      fieldset.append(el('p', { class: 'tm-hint tm-reason' }, `Greyed out: ${groupReason}.`));
    }
    groupsEl.append(fieldset);
  });
  const others = otherOptions(draft);
  if (others.length) {
    otherEl.append(el('p', { class: 'tm-hint' }, 'Other options on this block (kept as they are; older position or spacing values are replaced when you pick in the matching group):'));
    const row = el('div', { class: 'tm-choices' });
    others.forEach((o) => row.append(el('button', {
      type: 'button',
      class: 'tm-choice',
      title: `Remove “${o}”`,
      onclick: () => { draft = draft.filter((x) => x !== o); renderGroups(); updatePreview(); },
    }, `${o} ✕`)));
    otherEl.append(row);
  }
  const changed = ordered(draft).join(',') !== ordered(normalised(current.name, current.options)).join(',');
  applyButton.disabled = !changed;
  applyButton.textContent = changed ? 'Apply options' : 'No changes';
}

renderGroups = () => {
  renderBlockGroups();
  renderSection();
};

function setBlock(next) {
  const same = current && next && current.name === next.name
    && current.options.join(',') === next.options.join(',') && current.from === next.from;
  if (same) {
    // the content changed (e.g. an image added, or the section's style pasted): what fits may
    // change too
    const styles = next.sectionStyles.join(',') !== current.sectionStyles.join(',');
    const content = (next.html && next.html !== current.html)
      || next.sectionHtml !== current.sectionHtml
      || (next.neighbourRoles || []).join(',') !== (current.neighbourRoles || []).join(',');
    if (content || styles) {
      current = next;
      if (styles) sectionDraft = [...next.sectionStyles];
      renderGroups();
      updatePreview();
    }
    return;
  }
  current = next;
  draft = next ? normalised(next.name, next.options) : [];
  sectionDraft = next ? [...next.sectionStyles] : [];
  touched.clear();
  renderGroups();
  updatePreview();
}

/* Experience Workspace: the block holding the cursor, from the live document */
function onLiveDocument(value) {
  live = value;
  const doc = new DOMParser().parseFromString(value.html || '', 'text/html');
  const block = sourceBlocks(doc)[value.selection?.blockIndex];
  if (!block) { setBlock(null); return; }
  const [name, ...options] = [...block.classList];
  setBlock({
    name, options, html: block.outerHTML, ...sectionOf(block), from: 'live',
  });
}

/* DA editor: the block's name row, selected by the author */
async function readHeaderSelection() {
  let html = '';
  try {
    html = await Promise.race([
      sdk.actions.getSelection(),
      new Promise((resolve) => { setTimeout(() => resolve(''), 1500); }),
    ]);
  } catch { html = ''; }
  const text = html ? new DOMParser().parseFromString(html, 'text/html').body.textContent : '';
  const header = text && parseHeader(text);
  if (!header || !blockOptions[header.name]) {
    if (current?.from === 'header') setBlock(null);
    return;
  }
  const doc = new DOMParser().parseFromString(await daSource(), 'text/html');
  const block = sourceBlocks(doc).find((b) => b.classList[0] === header.name
    && [...b.classList].slice(1).join(',') === header.options.join(','));
  setBlock({
    ...header, html: block?.outerHTML || '', ...sectionOf(block), from: 'header',
  });
}

async function apply() {
  if (!current || !sdk) return;
  const options = ordered(draft);
  if (current.from === 'live') {
    const doc = new DOMParser().parseFromString(live.html, 'text/html');
    const block = sourceBlocks(doc)[live.selection.blockIndex];
    block.className = [current.name, ...options].join(' ');
    const result = await sdk.actions.sendHTML(block.outerHTML, {
      replace: true, expected: { html: live.html, blockIndex: live.selection.blockIndex },
    });
    if (!result?.ok) {
      setStatus(`The block was not changed: ${result?.message || result?.error || 'the editor refused the change'}. Click in the block and try again.`, 'error');
      return;
    }
    if (typeof result.html === 'string') onLiveDocument(result);
  } else {
    // the name row is still the selection (it is replaced as text, inside its cell)
    const html = await sdk.actions.getSelection().catch(() => '');
    const text = html ? new DOMParser().parseFromString(html, 'text/html').body.textContent : '';
    const header = parseHeader(text || '');
    if (!header || header.name !== current.name) {
      setStatus('Select the block’s name row again (e.g. “hero-corp (image-slide, …)”), then apply.', 'error');
      return;
    }
    sdk.actions.sendText(`${current.name}${options.length ? ` (${options.join(', ')})` : ''}`);
    sourceCache.at = 0;
    current = { ...current, options };
  }
  touched.clear();
  draft = [...options];
  current = { ...current, options };
  renderGroups();
  setStatus(`Applied: ${current.name}${options.length ? ` (${options.join(', ')})` : ''}`, 'ok');
}

function render() {
  root = document.querySelector('.tm');
  statusEl = el('p', { class: 'tm-status', role: 'status' });
  titleEl = el('p', { class: 'tm-block-name' });
  groupsEl = el('div', { class: 'tm-choices-wrap' });
  otherEl = el('div', { class: 'tm-group' });
  applyButton = el('button', { type: 'button', class: 'tm-primary', onclick: apply }, 'No changes');
  previewFrame = el('iframe', { class: 'tm-preview', title: 'Preview', src: `${PREVIEW}?v=${Date.now()}` });
  frameBox = el('div', { class: 'tm-frame' }, previewFrame);
  noticeEl = el('p', { class: 'tm-hint tm-notice', hidden: true }, REVIEW_NOTE);
  sectionEl = el('div', { class: 'tm-section', hidden: true });
  const viewButtons = Object.keys(VIEWS).map((name) => el('button', {
    type: 'button',
    class: 'tm-choice',
    role: 'radio',
    'aria-checked': String(name === view),
    onclick: () => {
      view = name;
      viewButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.view === name)));
      updatePreview();
    },
    'data-view': name,
  }, name === 'desktop' ? 'Desktop' : 'Phone'));
  root.append(
    el('h1', {}, 'Block options'),
    noticeEl,
    titleEl,
    el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': 'Preview width' }, ...viewButtons),
    frameBox,
    el('div', { class: 'tm-actions' }, applyButton),
    statusEl,
    groupsEl,
    otherEl,
    sectionEl,
    el('p', { class: 'tm-hint tm-pointer' }, 'Styling a few words? Select them and use Text style.'),
  );
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== previewFrame.contentWindow) return;
    if (e.data?.action === 'tm-preview-ready') { previewReady = true; updatePreview(); }
    if (e.data?.action === 'tm-preview-rendered') {
      previewHeight = Math.max(60, Math.min(e.data.height, 1600));
      sizePreview();
    }
  });
  window.addEventListener('resize', sizePreview);
  renderGroups();
}

async function connect() {
  setStatus('Connecting to the editor…');
  try {
    const { default: DA_SDK } = await import(SDK_URL);
    const resolved = await Promise.race([
      DA_SDK,
      new Promise((resolve) => { setTimeout(() => resolve(null), 4000); }),
    ]);
    if (!resolved?.actions) {
      setStatus('Open this panel from the editor to change block options.', 'info');
      return;
    }
    sdk = resolved;
    noticeEl.hidden = !outsideReview(documentPath(sdk));
    if (sdk.capabilities?.liveDocument === 1 && sdk.capabilities?.sendHTMLReplace === 1) {
      sdk.actions.subscribeLiveDocument(onLiveDocument);
      setStatus('Click in a block to see its options.');
    } else {
      // DA editor: no shared document; the author selects the block's name row
      setStatus('Select a block’s name row (e.g. “hero-corp (image-slide, …)”) to see its options.');
      let busy = false;
      setInterval(async () => {
        if (busy || document.hidden) return;
        busy = true;
        await readHeaderSelection();
        busy = false;
      }, 1000);
    }
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}.`, 'error');
  }
}

blockOptions = withLibrary(BLOCK_OPTIONS, await allLibraryOptions());
render();
connect();
