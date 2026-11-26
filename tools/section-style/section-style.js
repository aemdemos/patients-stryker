/*
 * Section style — an Experience Workspace / DA sidebar extension for the part of the page
 * between two section breaks. It finds the section from the cursor (a block in it) or from a
 * few selected words of its text, so sections without blocks can be styled too; it shows the
 * section's styles as the chosen values, only the choices that fit the section with what each
 * one does, a preview of the whole section, and how to add space between sections (spacer
 * sections). The choices are the ones the Section area of Block options offers
 * (SECTION_OPTIONS, tools/section-style/section-logic.js): one list for both panels.
 *
 * Like Block options, the panel doesn't write the section: it copies the Section Metadata to
 * paste (the editor lets an extension replace only the block or line at the cursor).
 */
import {
  el, choiceButton, choiceLayout,
} from '../panel-ui.js';
import {
  sectionInfo, sectionFactsOf, normalisedSection, orderedSection, copySectionStyle,
  renderSectionTasks,
} from './section-logic.js';
import { paintSwatches } from '../colour-groups.js';
import { REVIEW_NOTE, documentPath, outsideReview } from '../review-pages.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';
const PREVIEW = '/tools/text-markers/preview.html';
const VIEWS = { desktop: 1200, phone: 375 };
const SKIP = /^(section-metadata|metadata|da-metadata|library-metadata)$/;
// the spacer sections (the patients section style `spacer`): an empty section, a fixed gap
const SPACERS = [
  ['spacer', 'Small (about 30px)'],
  ['spacer, large', 'Large (about 60px)'],
  ['spacer, xlarge', 'X-large (about 90px)'],
  ['spacer, xxlarge', 'XX-large (about 120px)'],
];

let sdk = null;
let liveHtml = '';
let liveBlockIndex = null;
let sourceCache = { at: 0, html: '' };
// the section being styled: { index, count, sectionHtml, sectionStyles, hasMeta,
// neighbourRoles, label, holds }
let current = null;
let draft = [];
let view = 'desktop';
let previewReady = false;
let previewHeight = 160;
let lastSelection = '';

let statusEl;
let titleEl;
let stateEl;
let whereEl;
let groupsEl;
let actionsEl;
let previewFrame;
let frameBox;
let noticeEl;

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
  statusEl.hidden = !text;
}

/* ---------------------------------------------------------------- the document */

// style codes the editor hands over in page form (EDS icons) read as their text
function parseDoc(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('span.icon').forEach((icon) => {
    const name = [...icon.classList].find((c) => /^icon-(start-[a-z0-9-]+|end)$/.test(c));
    if (name) icon.replaceWith(doc.createTextNode(`:${name.slice(5)}:`));
  });
  return doc;
}

const squash = (text) => text.replace(/:(?:start-[a-z0-9-]+|end):/g, '').replace(/\s+/g, '');

async function savedSource() {
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

/** what a section holds, as an author reads it: "text, Columns, Video" */
function holdsOf(section) {
  const parts = [];
  [...section.children].forEach((child) => {
    if (child.matches('.section-metadata')) return;
    const name = child.tagName === 'DIV' && child.classList[0];
    const label = name ? name.replace(/-corp$/, '').replace(/-/g, ' ') : 'text';
    if (parts[parts.length - 1] !== label) parts.push(label);
  });
  return parts.length ? parts.join(', ') : 'nothing (an empty section)';
}

/** a section's name: the first words of its first heading, else of its text (links aside) */
function labelOf(section) {
  const parts = [...section.children].filter((c) => !c.matches('.section-metadata'));
  const textOf = (node) => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('a').forEach((a) => { if (!/\s/.test(a.textContent.trim())) a.remove(); });
    copy.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
    return copy.textContent.replace(/:(?:start-[a-z0-9-]+|end):/g, ' ').replace(/\s+/g, ' ').trim();
  };
  const heading = parts.flatMap((p) => [...(p.matches('h1, h2, h3, h4, h5, h6') ? [p] : p.querySelectorAll('h1, h2, h3, h4, h5, h6'))])
    .map(textOf).find(Boolean);
  const text = heading || parts.map(textOf).filter(Boolean).join(' ');
  const words = text.split(' ');
  return words.length > 8 ? `${words.slice(0, 8).join(' ')} …` : text;
}

/** the section for the panel: where it is, what it holds, its styles */
function sectionState(sections, section) {
  return {
    ...sectionInfo(section),
    index: sections.indexOf(section),
    count: sections.length,
    label: labelOf(section),
    holds: holdsOf(section),
  };
}

/**
 * The section to style: the one holding the block at the cursor (Experience Workspace), or the
 * one section whose text holds the selected words.
 * @param {string} html The document
 * @param {string} words The selected words ('' when none)
 */
function findSection(html, words) {
  if (!html) return null;
  const doc = parseDoc(html);
  const main = doc.querySelector('main') || doc.body;
  const sections = [...main.querySelectorAll(':scope > div')];
  if (liveHtml && liveBlockIndex !== null) {
    const block = [...main.querySelectorAll(':scope > div > div[class]')]
      .filter((b) => !SKIP.test(b.classList[0]))[liveBlockIndex];
    if (block) return sectionState(sections, block.parentElement);
  }
  const target = squash(words || '');
  if (!target) return null;
  const hits = sections.filter((s) => squash(s.textContent).includes(target));
  return hits.length === 1 ? sectionState(sections, hits[0]) : null;
}

async function readSelection() {
  try {
    const html = await Promise.race([
      sdk.actions.getSelection(),
      new Promise((resolve) => { setTimeout(() => resolve(''), 1500); }),
    ]);
    return html ? parseDoc(html).body.textContent : '';
  } catch {
    return '';
  }
}

/* ---------------------------------------------------------------- preview */

function sizePreview() {
  const width = VIEWS[view];
  const scale = Math.min(1, frameBox.clientWidth / width);
  // all of the section up to 45% of the panel's height; a taller one scrolls inside the preview
  const visible = Math.min(Math.ceil(previewHeight * scale), Math.round(window.innerHeight * 0.45));
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${Math.ceil(visible / scale)}px`;
  previewFrame.style.transform = `scale(${scale})`;
  frameBox.style.height = `${visible}px`;
}

function updatePreview() {
  frameBox.hidden = !current;
  if (!previewReady || !current) return;
  sizePreview();
  previewFrame.contentWindow.postMessage({
    action: 'tm-preview-render', section: current.sectionHtml, sectionStyles: orderedSection(draft), words: '', marker: '',
  }, window.location.origin);
}

/* ---------------------------------------------------------------- panel */

const listOf = (styles) => (styles.length ? styles.join(', ') : 'no section style');

/** a spacer section to paste between two sections: a section break, the table, a section break */
async function copySpacer(style) {
  const table = el('table', {}, el('tr', {}, el('td', { colspan: '2' }, 'Section Metadata')), el('tr', {}, el('td', {}, 'style'), el('td', {}, style)));
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([`<hr>${table.outerHTML}<hr>`], { type: 'text/html' }),
      'text/plain': new Blob([`---\nSection Metadata\nstyle\t${style}\n---`], { type: 'text/plain' }),
    })]);
    setStatus(`Copied a spacer section (“${style}”). Click at the end of the section above the gap and paste: a section break, the Section Metadata table and a section break make an empty section that only adds space. If the breaks don’t come with it, add them around the table.`, 'ok');
  } catch {
    setStatus(`Add an empty section with a Section Metadata table, Style “${style}”, between the two sections.`, 'info');
  }
}

/** the spacer sizes to copy (inside the "Line above / more space" task) */
function renderSpacers() {
  return el(
    'div',
    { class: 'tm-group' },
    el('p', { class: 'tm-hint' }, el('strong', {}, 'More space between two sections'), ' is an empty section of its own with the style “spacer” (as on the patients site). Pick its size to copy it, then paste it between the two sections.'),
    choiceLayout('Spacer size', SPACERS.map(([style, label]) => [style, label, { hint: `Copies a spacer section: style “${style}”` }]), (style, label, meta) => choiceButton(style, label, meta, false, () => copySpacer(style))),
  );
}

// the choices by what an author wants to do with the section, with a stryker.com example
const TASKS = [
  {
    title: 'Colour behind it',
    example: 'A coloured box or band behind the whole section, e.g. Pangea’s gold band with the numbers.',
    groups: ['background', 'background-look', 'gradient'],
  },
  {
    title: 'Put its parts side by side',
    example: 'The section’s blocks and text next to each other instead of one under the other, e.g. text beside a Panel box.',
    groups: ['side', 'side-phones'],
  },
  {
    title: 'Line above / more space',
    example: 'A grey line above the section, as wide as the content, e.g. Connected OR’s separators. For more space, add a spacer section.',
    groups: [{ id: 'text', values: ['divider'] }],
    extra: renderSpacers,
  },
  {
    title: 'Centre or narrow the text',
    groups: [{ id: 'text', values: ['text-center', 'narrow'] }],
  },
  {
    title: 'Button colour',
    example: 'The section’s buttons (a link alone on its line) in another colour.',
    groups: ['buttons'],
  },
  {
    title: 'Show only on desktop or on phones',
    groups: ['show'],
  },
  {
    title: 'Make it a tab, accordion panel or carousel slide',
    example: 'Sections of the same kind in a row become one tab set, accordion or carousel.',
    groups: ['role', 'accordion', 'carousel', 'band'],
    roles: true,
  },
];

/** where the copied style goes, drawn as the document shows it */
function pastePicture(hasMeta, text) {
  return el(
    'div',
    { class: 'tm-paste' },
    el('p', { class: 'tm-hint' }, 'Paste it ', hasMeta ? 'over the Style row of this section’s Section Metadata table:' : 'as a new table at the end of this section:'),
    el('div', { class: 'tm-paste-doc' }, '… the section’s text and blocks …'),
    el(
      'table',
      { class: 'tm-paste-table' },
      el('tr', {}, el('td', { colspan: '2' }, 'Section Metadata')),
      el('tr', {}, el('td', {}, 'style'), el('td', { class: 'tm-paste-here' }, text || '…')),
    ),
    el('div', { class: 'tm-paste-break' }, '--- section break ---'),
  );
}

function renderGroups() {
  groupsEl.replaceChildren();
  actionsEl.replaceChildren();
  if (!current) {
    titleEl.textContent = '';
    stateEl.textContent = '';
    whereEl.replaceChildren();
    updatePreview();
    return;
  }
  titleEl.textContent = `This section: ${current.index + 1} of ${current.count}, “${current.label || 'empty'}”`;
  const changed = orderedSection(draft).join(',') !== orderedSection(current.sectionStyles).join(',');
  stateEl.textContent = `Holds ${current.holds}. ${changed ? `Not applied yet: ${listOf(orderedSection(draft))} (copy it in step 3 below)` : `On the section: ${listOf(current.sectionStyles)}`}`;
  const near = current.neighbourRoles || [];
  groupsEl.append(el('p', { class: 'tm-step' }, el('strong', {}, '2  What do you want to do?'), ' Only what fits this section is shown.'));
  const shown = renderSectionTasks(groupsEl, {
    draft,
    facts: sectionFactsOf(current.sectionHtml, near, draft),
    near,
    tasks: TASKS,
    onChange: (next) => {
      draft = next;
      renderGroups();
    },
  });
  if (!shown) groupsEl.append(el('p', { class: 'tm-hint' }, 'No section style applies to this section as it is.'));
  const text = orderedSection(draft).join(', ');
  const codeEl = el('code', { class: 'tm-code', hidden: true });
  actionsEl.append(
    el('button', {
      type: 'button',
      class: 'tm-primary',
      disabled: !changed,
      onclick: () => copySectionStyle({
        text, hasMeta: current.hasMeta, codeEl, setStatus,
      }),
    }, changed ? 'Copy section style' : 'No changes yet'),
    codeEl,
  );
  whereEl.replaceChildren(
    el('p', { class: 'tm-step' }, el('strong', {}, '3  Copy and paste'), changed ? '' : ' — pick something in step 2 first.'),
    actionsEl,
    ...(changed ? [pastePicture(current.hasMeta, text)] : []),
  );
  paintSwatches(groupsEl, previewFrame);
  updatePreview();
}

function setSection(next) {
  const same = current && next && current.index === next.index
    && current.sectionHtml === next.sectionHtml;
  if (same) return;
  const keepDraft = current && next && current.index === next.index
    && current.sectionStyles.join(',') === next.sectionStyles.join(',');
  current = next;
  if (!keepDraft) draft = next ? normalisedSection(next.sectionStyles) : [];
  renderGroups();
}

async function check() {
  if (!sdk || document.hidden) return;
  const words = await readSelection();
  const html = liveHtml || await savedSource();
  const key = `${liveBlockIndex}|${words}|${html.length}`;
  if (key === lastSelection) return;
  lastSelection = key;
  const next = findSection(html, words);
  if (next) {
    setStatus('');
    setSection(next);
  } else if (!current) {
    setStatus(words ? 'These words are in more than one section, or in none: select a few more words of the section’s text.' : 'Click in a block of the section, or select a few words of its text.', 'info');
  }
}

function render() {
  const root = document.querySelector('.tm');
  statusEl = el('p', { class: 'tm-status', role: 'status' });
  titleEl = el('p', { class: 'tm-block-name' });
  stateEl = el('p', { class: 'tm-hint tm-applied' });
  whereEl = el('div', { class: 'tm-where' });
  groupsEl = el('div', { class: 'tm-choices-wrap' });
  actionsEl = el('div', { class: 'tm-actions' });
  previewFrame = el('iframe', { class: 'tm-preview', title: 'Preview', src: `${PREVIEW}?v=${Date.now()}` });
  frameBox = el('div', { class: 'tm-frame', hidden: true }, previewFrame);
  noticeEl = el('p', { class: 'tm-hint tm-notice', hidden: true }, REVIEW_NOTE);
  const viewButtons = Object.keys(VIEWS).map((name) => el('button', {
    type: 'button',
    class: 'tm-choice',
    role: 'radio',
    'aria-checked': String(name === view),
    'data-view': name,
    onclick: () => {
      view = name;
      viewButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.view === name)));
      updatePreview();
    },
  }, name === 'desktop' ? 'Desktop' : 'Phone'));
  root.append(
    el('h1', {}, 'Section style'),
    el(
      'div',
      { class: 'tm-intro' },
      el('p', {}, 'A ', el('strong', {}, 'section'), ' is everything between two section breaks (---). Use this panel for the ', el('strong', {}, 'whole section'), '; for one block use Block options, for a few words Text style.'),
      el('p', { class: 'tm-step' }, el('strong', {}, '1  Point at the section:'), ' click in one of its blocks, or select a few words of its text.'),
    ),
    noticeEl,
    el(
      'div',
      { class: 'tm-sticky' },
      titleEl,
      stateEl,
      el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': 'Preview width' }, ...viewButtons),
      frameBox,
    ),
    groupsEl,
    whereEl,
    // the step's result (copied, where to paste) or what to do first, under step 3
    statusEl,
    el('p', { class: 'tm-hint tm-pointer' }, 'Changing one block (its colours, boxes, layout)? Use Block options. A few words? Text style.'),
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
      setStatus('Open this panel from the editor to style a section.', 'info');
      return;
    }
    sdk = resolved;
    noticeEl.hidden = !outsideReview(documentPath(sdk));
    if (sdk.capabilities?.liveDocument === 1 && typeof sdk.actions.subscribeLiveDocument === 'function') {
      sdk.actions.subscribeLiveDocument(({ html, selection }) => {
        liveHtml = html || '';
        liveBlockIndex = Number.isInteger(selection?.blockIndex) ? selection.blockIndex : null;
        check();
      });
    }
    setStatus('Click in a block of the section, or select a few words of its text.');
    setInterval(check, 1000);
    window.addEventListener('focus', check);
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}.`, 'error');
  }
}

render();
connect();
