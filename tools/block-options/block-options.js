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
  BLOCK_OPTIONS, knownOptions, withLibrary,
} from './options.js';
import { allLibraryOptions } from '../library-options.js';
import { COLOUR_GROUPS, colourGroupOf, paintSwatches } from '../colour-groups.js';
import {
  el, tokensOf, selectedIn, choiceButton, choiceLayout,
} from '../panel-ui.js';
import {
  sectionInfo, sectionFactsOf, normalisedSection, orderedSection, copySectionStyle,
  renderSectionGroups,
} from '../section-style/section-logic.js';
import { REVIEW_NOTE, documentPath, outsideReview } from '../review-pages.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';
const PREVIEW = '/tools/text-markers/preview.html';
const VIEWS = { desktop: 1200, phone: 375 };

const toClassName = (s) => s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

// the built-in options with the Block Library sheet panel-options merged in (set before render)
let blockOptions = BLOCK_OPTIONS;
let sdk = null;
let live = null; // Experience Workspace: { html, selection: { blockIndex }, editable }
let sourceCache = { at: 0, html: '' };
// the block being edited: { name, options: [...], html, sectionStyles, sectionHtml, hasMeta,
// from: 'live' | 'header' }
let current = null;
let draft = []; // the options as the author is changing them
let cardDraft = []; // Cards (corp): each card's own colour (box-…), '' = the row's Card box
let sectionDraft = []; // the section's styles as the author is changing them
const touched = new Set(); // groups the author changed (their older free values are dropped)
let view = 'desktop';
let previewReady = false;
let previewHeight = 160;

let root;
let statusEl;
let titleEl;
let stateEl;
let groupsEl;
let otherEl;
let applyButton;
let previewFrame;
let frameBox;
let noticeEl;
let sectionEl;
// re-renders the block's groups and the section's (set below, once both renderers exist)
let renderGroups = () => {};

// the instruction shown while no block is selected ('' until the panel is connected)
let idleStatus = '';

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
  statusEl.hidden = !text;
}

/* ---------------------------------------------------------------- the document */

function sourceBlocks(doc) {
  return [...doc.querySelectorAll('main > div > div[class]')]
    .filter((b) => !/^(section-metadata|metadata|da-metadata|library-metadata)$/.test(b.classList[0]));
}

/** the section holding a block (sectionInfo) */
const sectionOf = (block) => sectionInfo(block?.parentElement);

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

/** `when` names a layout (the group shows only with it) or another group (shown once that
 * group has a choice, e.g. which cell holds the box) */
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
  // any video, YouTube included (for choices about the row's layout, not the player)
  facts.anyVideo = facts.video || !!block.querySelector('iframe') || [...block.querySelectorAll('a[href]')]
    .some((a) => /youtube\.com\/|youtu\.be\//i.test(a.getAttribute('href')));
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
    media: facts.images || facts.anyVideo ? '' : 'needs an image or a video in the row',
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
  const groups = def()?.groups || []; // a block without options (e.g. Sticky navigation): none
  const order = groups.flatMap((g) => (g.options || g.flags).flatMap(([v]) => tokensOf(v)));
  const known = options.filter((o) => order.includes(o))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...known, ...options.filter((o) => !order.includes(o))];
}

/* ---------------------------------------------------------------- choices */

/* ---------------------------------------------------------------- card colours */

// Cards (corp): a card row may start with a cell holding one colour name, the card's own box
// colour over the row's Card box (blocks/cards-corp/cards-corp.js reads it the same way)
const CARD_WORDS = {
  'light-gray': 'gray',
  'dark-gray': 'dark',
  'dark-blue-gradient': 'blue-gradient',
  'dark-purple-gradient': 'purple-gradient',
  'dark-teal-gradient': 'teal-gradient',
  'dark-orange-gradient': 'orange-gradient',
  'golden-gradient': 'gold-gradient',
};
const cardBoxChoices = () => (def()?.groups.find((g) => g.id === 'box')?.options || [])
  .filter(([v]) => /^box-/.test(v));
const hasCardColours = () => current?.name === 'cards-corp' && cardBoxChoices().length > 0;

/** the colour a card row's colour cell names (box-…), or '' */
function cardColourOf(row) {
  const cell = row.firstElementChild;
  if (!cell || row.children.length < 2 || cell.querySelector('picture, img, a, iframe, video')) return '';
  const word = cell.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/grey/g, 'gray')
    .replace(/^box-/, '');
  const value = `box-${CARD_WORDS[word] || word}`;
  return cardBoxChoices().some(([v]) => tokensOf(v)[0] === value) ? value : '';
}

/** the cards of a Cards (corp) block: each one's colour and first words */
function cardsOf(html) {
  if (!html) return [];
  const block = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
  return [...(block?.children || [])].map((row) => {
    const colour = cardColourOf(row);
    const cells = [...row.children].slice(colour ? 1 : 0);
    // the card's words as the author reads them: without Text style codes or lone symbols
    const words = cells.map((c) => c.textContent.replace(/:(?:start-[a-z0-9-]+|end):/g, ' ').trim())
      .filter(Boolean).join(' ').split(/\s+/)
      .filter((w) => /[\p{L}\p{N}]/u.test(w));
    return { colour, words: `${words.slice(0, 5).join(' ')}${words.length > 5 ? ' …' : ''}` };
  });
}

const cardsChanged = () => hasCardColours()
  && cardDraft.join(',') !== cardsOf(current.html).map((c) => c.colour).join(',');

/** writes the card colours into a block: the colour cell set, changed or removed per card */
function withCardColours(block) {
  if (!hasCardColours()) return;
  [...block.children].forEach((row, i) => {
    if (cardColourOf(row)) row.firstElementChild.remove();
    const value = cardDraft[i];
    const choice = value && cardBoxChoices().find(([v]) => tokensOf(v)[0] === value);
    if (!choice) return;
    const cell = block.ownerDocument.createElement('div');
    [, cell.textContent] = choice;
    row.prepend(cell);
  });
}

/* ---------------------------------------------------------------- preview */

function sizePreview() {
  const width = VIEWS[view];
  const scale = Math.min(1, frameBox.clientWidth / width);
  // all of the render up to 45% of the panel's height; a taller one (a block stacked on
  // phones) scrolls inside the preview page itself
  const visible = Math.min(Math.ceil(previewHeight * scale), Math.round(window.innerHeight * 0.45));
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${Math.ceil(visible / scale)}px`;
  previewFrame.style.transform = `scale(${scale})`;
  frameBox.style.height = `${visible}px`;
}

function updatePreview() {
  if (!previewReady || !current?.html) return;
  const doc = new DOMParser().parseFromString(current.html, 'text/html');
  const block = doc.body.firstElementChild;
  block.className = [current.name, ...ordered(draft)].join(' ');
  withCardColours(block);
  sizePreview();
  previewFrame.contentWindow.postMessage({
    action: 'tm-preview-render', block: block.outerHTML, sectionStyles: sectionDraft, words: '', marker: '',
  }, window.location.origin);
}

function renderCardColours(facts) {
  const cards = cardsOf(current.html);
  if (!hasCardColours() || !cards.length || (facts && !facts.text)) return;
  const fieldset = el(
    'fieldset',
    { class: 'tm-group' },
    el('legend', {}, 'Card colours'),
    el('p', { class: 'tm-hint' }, 'A card’s own box colour, over the row’s Card box (stryker.com’s coloured cards).'),
  );
  cards.forEach((card, i) => {
    const value = cardDraft[i] || '';
    const select = el('select', {
      'aria-label': `Card ${i + 1} colour`,
      onchange: (e) => {
        cardDraft[i] = e.target.value;
        renderGroups();
        updatePreview();
      },
    }, el('option', { value: '' }, 'Row colour'));
    COLOUR_GROUPS.forEach((group) => {
      const choices = cardBoxChoices().filter(([v]) => colourGroupOf(v) === group.id);
      if (!choices.length) return;
      select.append(el('optgroup', { label: group.label }, ...choices
        .map(([v, label]) => el('option', { value: tokensOf(v)[0] }, label))));
    });
    select.value = value;
    const dot = el('span', { class: 'tm-dot', 'aria-hidden': 'true', 'data-swatch': value || undefined });
    fieldset.append(el(
      'label',
      { class: 'tm-card-colour' },
      dot,
      el('span', {}, `Card ${i + 1}${card.words ? `: ${card.words}` : ''}`),
      select,
    ));
  });
  groupsEl.append(fieldset);
}

/* ---------------------------------------------------------------- the section */

/**
 * The Section area follows the selected block's section: only the section styles that can
 * apply to it (section-logic.js, shared with the Section style panel), then Copy.
 */
function renderSection() {
  sectionEl.replaceChildren();
  sectionEl.hidden = !current;
  if (!current) return;
  const near = current.neighbourRoles || [];
  const facts = sectionFactsOf(current.sectionHtml, near, sectionDraft);
  sectionEl.append(
    el('h2', { class: 'tm-section-title' }, 'Section'),
    el('p', { class: 'tm-hint' }, 'The part of the page this block sits in, between two section breaks. These choices change the whole section, not only the block (Section Metadata → Style).'),
  );
  const groupsShown = renderSectionGroups(sectionEl, {
    draft: sectionDraft,
    facts,
    near,
    onChange: (next) => {
      sectionDraft = next;
      renderGroups();
      updatePreview();
    },
  });
  if (!groupsShown) {
    sectionEl.append(el('p', { class: 'tm-hint' }, 'No section style applies to this section as it is.'));
  }
  // a change from the section as authored (older names count as changed once they'd be renamed)
  const changed = orderedSection(sectionDraft).join(',') !== orderedSection(current.sectionStyles).join(',');
  const codeEl = el('code', { class: 'tm-code', hidden: true });
  const copy = el('button', {
    type: 'button',
    disabled: !changed,
    onclick: () => copySectionStyle({
      text: orderedSection(sectionDraft).join(', '), hasMeta: current.hasMeta, codeEl, setStatus,
    }),
  }, changed ? 'Copy section style' : 'No section changes');
  sectionEl.append(
    el('div', { class: 'tm-actions' }, copy),
    codeEl,
    el('p', { class: 'tm-hint' }, current.hasMeta
      ? 'Copies the new Style text: paste it over the Style row of the section’s Section Metadata.'
      : 'Copies a Section Metadata table: paste it at the end of the section.'),
  );
}

/* ---------------------------------------------------------------- panel */

const listOf = (options) => (options.length ? options.join(', ') : 'no options');

/**
 * The selected block's groups: only the choices that fit it (and those it already has); a group
 * with none of them is not shown. A choice's tooltip says what it does.
 */
function renderBlockGroups() {
  groupsEl.replaceChildren();
  otherEl.replaceChildren();
  stateEl.textContent = '';
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
    // the whole group: what it needs, or the group it follows (which cell holds the box)
    const after = group.when && def().groups.find((g) => g.id === group.when && g.options);
    const groupUnfit = (after && !selectedIn(after, draft)) || !!unfit(group.needs, facts);
    const fits = (meta, on) => on || (!groupUnfit && !unfit(meta?.needs, facts));
    const titleOf = (value, meta) => [meta?.hint, value ? `Option “${value}”` : 'No option']
      .filter(Boolean).join('\n');
    let row;
    if (group.flags) {
      const flags = group.flags.filter(([value, , meta]) => fits(meta, draft.includes(value)));
      if (!flags.length) return;
      row = el('div', { class: 'tm-choices', role: 'group', 'aria-label': group.label }, ...flags
        .map(([value, label, meta]) => el('label', { class: 'tm-check', title: titleOf(value, meta) }, el('input', {
          type: 'checkbox',
          checked: draft.includes(value),
          onchange: (e) => {
            toggle(value, e.target.checked, group);
            renderGroups();
            updatePreview();
          },
        }), label)));
    } else {
      const selected = selectedIn(group, draft);
      const choices = group.options
        .filter(([value, , meta]) => value && fits(meta, value === selected));
      if (!choices.length) return;
      const none = group.options.find(([value]) => !value);
      const list = [...(none ? [none] : []), ...choices];
      row = choiceLayout(group.label, list, (value, label, meta) => choiceButton(
        value,
        label,
        meta,
        value === selected,
        () => {
          pick(group, value);
          renderGroups();
          updatePreview();
        },
      ));
    }
    groupsEl.append(el('fieldset', { class: 'tm-group' }, el('legend', {}, group.label), row));
  });
  renderCardColours(facts);
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
  const applied = ordered(normalised(current.name, current.options));
  const optionsChanged = ordered(draft).join(',') !== applied.join(',');
  const changed = optionsChanged || cardsChanged();
  applyButton.disabled = !changed;
  applyButton.textContent = changed ? 'Apply options' : 'No changes';
  stateEl.textContent = changed
    ? `Not applied yet: ${listOf(ordered(draft))}${cardsChanged() ? ' (and card colours)' : ''}`
    : `On the block: ${listOf(applied)}`;
}

renderGroups = () => {
  renderBlockGroups();
  renderSection();
  paintSwatches(root, previewFrame);
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
      if (next.html !== current.html) cardDraft = cardsOf(next.html).map((c) => c.colour);
      current = next;
      if (styles) sectionDraft = normalisedSection(next.sectionStyles);
      renderGroups();
      updatePreview();
    }
    return;
  }
  current = next;
  // a newly selected block replaces the "click in a block" instruction; it returns without one
  if (idleStatus && (!next || statusEl.textContent === idleStatus)) setStatus(next ? '' : idleStatus);
  draft = next ? normalised(next.name, next.options) : [];
  cardDraft = next ? cardsOf(next.html).map((c) => c.colour) : [];
  sectionDraft = next ? normalisedSection(next.sectionStyles) : [];
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
  const cards = cardsChanged();
  let note = '';
  if (current.from === 'live') {
    const doc = new DOMParser().parseFromString(live.html, 'text/html');
    const block = sourceBlocks(doc)[live.selection.blockIndex];
    block.className = [current.name, ...options].join(' ');
    withCardColours(block);
    const result = await sdk.actions.sendHTML(block.outerHTML, {
      replace: true, expected: { html: live.html, blockIndex: live.selection.blockIndex },
    });
    if (!result?.ok) {
      setStatus(`The block was not changed: ${result?.message || result?.error || 'the editor refused the change'}. Click in the block and try again.`, 'error');
      return;
    }
    current = { ...current, html: block.outerHTML };
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
    // the card colours are cells of the block, which only Experience Workspace's guarded
    // replace can write: here the author types them
    if (cards) {
      note = ' Card colours are not written in this editor: type the colour name (e.g. “Gold gradient”) in a new first cell of the card’s row, or use Experience Workspace.';
      cardDraft = cardsOf(current.html).map((c) => c.colour);
    }
  }
  touched.clear();
  draft = [...options];
  current = { ...current, options };
  renderGroups();
  setStatus(`Applied: ${current.name}${options.length ? ` (${options.join(', ')})` : ''}${cards && !note ? ', card colours' : ''}.${note}`, note ? 'info' : 'ok');
}

function render() {
  root = document.querySelector('.tm');
  statusEl = el('p', { class: 'tm-status', role: 'status' });
  titleEl = el('p', { class: 'tm-block-name' });
  stateEl = el('p', { class: 'tm-hint tm-applied' });
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
    // pinned at the top while the author scrolls the choices: the block, what it has, its preview
    el(
      'div',
      { class: 'tm-sticky' },
      titleEl,
      stateEl,
      el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': 'Preview width' }, ...viewButtons),
      frameBox,
      el('div', { class: 'tm-actions' }, applyButton),
    ),
    statusEl,
    groupsEl,
    otherEl,
    sectionEl,
    el('p', { class: 'tm-hint tm-pointer' }, 'Styling a few words? Select them and use Text style.'),
  );
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== previewFrame.contentWindow) return;
    if (e.data?.action === 'tm-preview-ready') {
      previewReady = true;
      paintSwatches(root, previewFrame);
      updatePreview();
    }
    if (e.data?.action === 'tm-preview-rendered') {
      previewHeight = Math.max(60, e.data.height);
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
      idleStatus = 'Click in a block to see its options.';
      setStatus(idleStatus);
    } else {
      // DA editor: no shared document; the author selects the block's name row
      idleStatus = 'Select a block’s name row (e.g. “hero-corp (image-slide, …)”) to see its options.';
      setStatus(idleStatus);
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
