/*
 * The section choices both panels offer — Block options (its Section area) and Section style:
 * reading a section's styles and what it holds, which choices fit it, the author's changes,
 * the choices' buttons and the Section Metadata the author pastes. The choices themselves are
 * SECTION_OPTIONS in tools/block-options/options.js (one list for both panels).
 */
import { SECTION_OPTIONS } from '../block-options/options.js';
import {
  el, tokensOf, selectedIn, choiceButton, choiceLayout,
} from '../panel-ui.js';

const toClassName = (s) => s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

// the section roles: a tab, an accordion panel, a carousel slide (consecutive sections join)
export const SECTION_ROLES = ['tab-panel', 'accordion-panel', 'carousel'];
// the conditions that are another section choice (checked against the author's choices)
const SECTION_CHOICE_NEEDS = ['flex', 'accordion-panel', 'carousel', 'split', 'background', 'gradient'];
// the groups that turn a section into one of them, folded away unless the section or a
// neighbour has a role: most sections are none of these
const ROLE_GROUPS = ['role', 'accordion', 'carousel', 'band'];
const ROLE_LABELS = { 'tab-panel': 'a tab', 'accordion-panel': 'an accordion panel', carousel: 'a carousel slide' };

/**
 * A section's styles: from its Section Metadata table (Style row), or in page form (the table
 * already turned into the section's classes, as Edge Delivery serves it) from its classes.
 */
export function stylesOfSection(section) {
  const meta = section?.querySelector(':scope > .section-metadata');
  if (!meta) return section ? [...section.classList].filter((c) => c !== 'section') : [];
  const row = [...meta.children]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'style');
  return row ? row.children[1].textContent.split(',').map(toClassName).filter(Boolean) : [];
}

/** a section: its styles, markup, whether it has a Section Metadata table, its neighbours' roles */
export function sectionInfo(section) {
  if (!section) return { sectionStyles: [], sectionHtml: '', hasMeta: false };
  // the roles of the sections before and after it (a tab set, accordion or carousel continues)
  const neighbourRoles = [section.previousElementSibling, section.nextElementSibling]
    .flatMap((s) => stylesOfSection(s)).filter((st) => SECTION_ROLES.includes(st));
  return {
    sectionStyles: stylesOfSection(section),
    sectionHtml: section.outerHTML,
    // a styled section in page form came from a table too
    hasMeta: !!section.querySelector(':scope > .section-metadata') || stylesOfSection(section).length > 0,
    neighbourRoles,
  };
}

/**
 * What a section has, for the section choices' `needs`: its parts (each block, and each run of
 * text between blocks), whether it opens with a heading, its blocks and buttons.
 * @param {string} html The section's markup
 * @param {string[]} near The roles of the sections next to it
 * @param {string[]} draft The section's styles as the author is changing them
 */
export function sectionFactsOf(html, near = [], draft = []) {
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
      || (!!section.querySelector(':scope > .columns') && (near.includes('carousel') || draft.includes('carousel'))),
    columnsBlock: !!section.querySelector(':scope > .columns'),
    // a button: a link alone on its line (authoring conventions), in the text or a block
    buttons: [...section.querySelectorAll('p')].some((p) => {
      const a = p.querySelector('a');
      return a && p.textContent.trim() === a.textContent.trim();
    }),
  };
}

/** why a section choice can't apply ('' when it fits) */
export function sectionUnfit(needs, facts, draft = []) {
  if (!needs) return '';
  if (!facts) return 'the section can’t be read: click in it again';
  const parts = facts.parts === 1 ? '1 part' : `${facts.parts} parts`;
  const reasons = {
    'parts-2+': facts.parts >= 2 ? '' : `needs 2 or more parts in the section (blocks, or the text between them): this section has ${parts}`,
    'heading-first': facts.headingFirst ? '' : 'needs a heading at the top of the section (it becomes the label)',
    'slide-block': facts.slideBlock ? '' : 'needs a Hero (corp) block in the section, or a Columns row next to a carousel slide (a split slide)',
    'columns-block': facts.columnsBlock ? '' : 'needs a Columns block in the section (the image and the title)',
    flex: draft.includes('flex') ? '' : 'pick Side by side first',
    'accordion-panel': draft.includes('accordion-panel') ? '' : 'make the section an accordion panel first',
    carousel: draft.includes('carousel') ? '' : 'make the section a carousel slide first',
    split: draft.includes('split') ? '' : 'turn on Split slide first',
    background: draft.some((o) => /^box-/.test(o)) ? '' : 'pick a background first',
    gradient: draft.some((o) => /^box-.+-gradient$/.test(o)) ? '' : 'pick a gradient background first',
    buttons: facts.buttons ? '' : 'needs a button in the section (a link alone on its line)',
  };
  return needs.map((n) => reasons[n]).find(Boolean) || '';
}

export const sectionChoices = () => SECTION_OPTIONS.groups.flatMap((g) => g.options || g.flags);

/**
 * The section's styles with older names read as the standard choices (SECTION_OPTIONS.aliases).
 * Old combinations read as stryker.com shows them: a colour with the dimensional box
 * (`bg-gold, boxed`) is one box in that colour with a soft shadow, at the content width (not a
 * band); both gradient words (`gradient-top-to-bottom, gradient-inverse`) are bottom to top.
 */
export function normalisedSection(styles) {
  const aliases = SECTION_OPTIONS.aliases || {};
  let out = [...new Set(styles.flatMap((st) => aliases[st] || [st]))];
  const boxes = out.filter((o) => /^box-/.test(o));
  if (boxes.length > 1) {
    const keep = boxes.find((o) => o !== 'box-white') || boxes[0];
    out = out.filter((o) => !/^box-/.test(o) || o === keep);
  }
  if (styles.some((st) => /^(boxed|shadow-box)$/.test(st))) out = out.filter((o) => o !== 'full-bleed');
  if (out.includes('gradient-up')) out = out.filter((o) => o !== 'gradient-reverse');
  return out;
}

/** a section choice that is on although its own condition (another section choice) is off */
function unmetChoice(draft) {
  return sectionChoices().find(([value, , meta]) => {
    const tokens = tokensOf(value);
    const needs = (meta?.needs || []).filter((n) => SECTION_CHOICE_NEEDS.includes(n));
    const on = tokens.length && tokens.every((t) => draft.includes(t));
    return on && sectionUnfit(needs, {}, draft);
  });
}

/** drops the section choices whose condition no longer holds (phones without side by side …) */
function pruneSection(draft) {
  let out = draft;
  for (let unmet = unmetChoice(out); unmet; unmet = unmetChoice(out)) {
    const tokens = tokensOf(unmet[0]);
    out = out.filter((o) => !tokens.includes(o));
  }
  return out;
}

/** the section's styles with one group's choice picked */
export function pickSection(draft, group, value) {
  const values = group.options.flatMap(([v]) => tokensOf(v));
  const out = draft.filter((o) => !values.includes(o));
  if (value) out.push(...tokensOf(value));
  return pruneSection(out);
}

/** the section's styles with a switch turned on or off */
export function toggleSection(draft, flag, on) {
  const out = draft.filter((o) => o !== flag);
  if (on) out.push(flag);
  return pruneSection(out);
}

/** the section styles in a stable order: the others as authored, then the choices' order */
export function orderedSection(styles) {
  const order = sectionChoices().flatMap(([v]) => tokensOf(v));
  const others = styles.filter((o) => !order.includes(o));
  const known = styles.filter((o) => order.includes(o))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...new Set([...others, ...known])];
}

/**
 * Copies a section style to paste into Section Metadata: the Style text when the section has a
 * Section Metadata table, otherwise a whole Section Metadata table. The panels don't write the
 * section themselves: the editor's guarded replace changes only the block at the cursor, and
 * the Section Metadata table is not a block it can address.
 * @param {{text: string, hasMeta: boolean, codeEl: Element, setStatus: Function,
 *   where?: string}} what The style, whether the section has a table, where to show it
 *   when the clipboard is unavailable, the panel's status, where to paste a new table
 */
export async function copySectionStyle({
  text, hasMeta, codeEl, setStatus, where = 'Click at the end of this section (after its last block or text, before the section break) and paste.',
}) {
  if (hasMeta && !text) {
    setStatus('No section style left: clear the Style row of this section’s Section Metadata (delete the table if Style is its only row).', 'info');
    return;
  }
  try {
    if (hasMeta) {
      await navigator.clipboard.writeText(text);
      setStatus(`Copied “${text}”. In this section’s Section Metadata table, select the text of the Style row and paste over it.`, 'ok');
    } else {
      const table = el('table', {}, el('tr', {}, el('td', { colspan: '2' }, 'Section Metadata')), el('tr', {}, el('td', {}, 'style'), el('td', {}, text)));
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([table.outerHTML], { type: 'text/html' }),
        'text/plain': new Blob([`Section Metadata\nstyle\t${text}`], { type: 'text/plain' }),
      })]);
      setStatus(`Copied a Section Metadata table with the style “${text}”. ${where}`, 'ok');
    }
  } catch {
    codeEl.textContent = text;
    codeEl.hidden = false;
    setStatus(`Copy this into the Style row of the section’s Section Metadata: ${text}`, 'info');
  }
}

/**
 * One group of section choices as buttons (or switches), only the choices that fit the section
 * (and those it has); null when none fits. `values` limits the group to some of its choices.
 */
function groupFieldset(group, {
  draft, facts, explain, onChange, values, legend = true,
}) {
  const isOn = (value) => !!value && tokensOf(value).every((t) => draft.includes(t));
  const offered = (value, meta) => isOn(value) || !sectionUnfit(meta?.needs, facts, draft);
  const titleOf = (value, meta) => [meta?.hint, value ? `Style “${value.replace(' ', ', ')}”` : 'No style']
    .filter(Boolean).join('\n');
  const choices = (group.options || group.flags)
    .filter(([value]) => value && (!values || values.includes(value)));
  const visible = choices.filter(([value, , meta]) => offered(value, meta));
  if (!visible.length) return null;
  const fieldset = el('fieldset', { class: 'tm-group' }, legend ? el('legend', {}, group.label) : null);
  let row = el('div', { class: 'tm-choices', role: 'group', 'aria-label': group.label });
  if (group.flags) {
    visible.forEach(([value, label, meta]) => {
      row.append(el('label', { class: 'tm-check', title: titleOf(value, meta) }, el('input', {
        type: 'checkbox',
        checked: draft.includes(value),
        onchange: (e) => onChange(toggleSection(draft, value, e.target.checked)),
      }), label));
    });
  } else {
    const selected = selectedIn(group, draft);
    const none = group.options.find(([value]) => !value);
    const list = [...(none ? [none] : []), ...visible];
    row = choiceLayout(group.label, list, (value, label, meta) => {
      const button = choiceButton(value, label, meta, value === selected, () => {
        onChange(pickSection(draft, group, value));
      });
      button.title = titleOf(value, meta);
      return button;
    });
  }
  fieldset.append(row);
  // Section style: what each choice does, written out (colours speak for themselves)
  const colours = visible.every(([value]) => /^box-/.test(value));
  if (explain && !colours) {
    fieldset.append(el('ul', { class: 'tm-explain' }, ...visible
      .filter(([, , meta]) => meta?.hint)
      .map(([, label, meta]) => el('li', {}, el('strong', {}, label), ` — ${meta.hint}`))));
  }
  return fieldset;
}

/**
 * The section choices that fit a section, as buttons and switches: only the styles that can
 * apply to it (side by side when it holds 2 or more parts, tab or accordion panel when it opens
 * with a heading, carousel slide when it holds a Hero (corp) or Columns block), a follow-up
 * choice only once its main choice is picked; a style the section already has always shows.
 * The roles (tab, accordion panel, carousel slide) are folded away unless used nearby.
 * @param {Element} container Where the groups go
 * @param {{draft: string[], facts: object, near: string[], explain?: boolean,
 *   onChange: (draft: string[]) => void}} state The author's styles, what the section holds,
 *   its neighbours' roles, whether to write out what each choice does, the change handler
 * @returns {number} How many groups are shown
 */
export function renderSectionGroups(container, {
  draft, facts, near = [], explain = false, onChange,
}) {
  let groupsShown = 0;
  const roleBox = el('details', { class: 'tm-more tm-roles' });
  SECTION_OPTIONS.groups.forEach((group) => {
    const fieldset = groupFieldset(group, {
      draft, facts, explain, onChange,
    });
    if (!fieldset) return;
    groupsShown += 1;
    (ROLE_GROUPS.includes(group.id) ? roleBox : container).append(fieldset);
  });
  if (roleBox.querySelector('fieldset')) {
    const nearLabels = near.map((r) => ROLE_LABELS[r]).filter(Boolean);
    roleBox.prepend(el('summary', {}, 'Turn this section into a tab, accordion panel or carousel slide'));
    if (nearLabels.length) roleBox.append(el('p', { class: 'tm-hint' }, `The section next to it is ${[...new Set(nearLabels)].join(' and ')}: make this one the same to add it.`));
    roleBox.open = SECTION_ROLES.some((r) => draft.includes(r)) || nearLabels.length > 0;
    container.append(roleBox);
  }
  return groupsShown;
}

/**
 * The section choices by what the author wants to do (Section style): each task a fold with
 * an example, holding the groups (or some of a group's choices) that do it; a task shows when
 * one of its choices fits the section, and is open when the section has one of them.
 * @param {Element} container Where the tasks go
 * @param {{draft: string[], facts: object, near: string[], onChange: Function,
 *   tasks: Array<{title: string, example?: string, groups: Array<string|{id: string,
 *   values: string[]}>, extra?: () => Element}>, open?: string,
 *   onOpen?: (title: string, byAuthor: boolean) => void}} state The section, the tasks, the
 *   one task open and what to tell when another opens (byAuthor: the author's click)
 * @returns {number} How many tasks are shown
 */
export function renderSectionTasks(container, {
  draft, facts, near = [], onChange, tasks, open, onOpen,
}) {
  let shown = 0;
  tasks.forEach((task) => {
    const parts = task.groups.map((g) => {
      const { id, values } = typeof g === 'string' ? { id: g } : g;
      const group = SECTION_OPTIONS.groups.find((x) => x.id === id);
      // a task of one group needs no group title: the task says what it is
      return group && groupFieldset(group, {
        draft, facts, explain: true, onChange, values, legend: task.groups.length > 1,
      });
    }).filter(Boolean);
    const extra = task.extra?.();
    if (!parts.length && !extra) return;
    shown += 1;
    const values = task.groups.flatMap((g) => {
      const group = SECTION_OPTIONS.groups.find((x) => x.id === (typeof g === 'string' ? g : g.id));
      const list = (group?.options || group?.flags || []).map(([v]) => v).filter(Boolean);
      return typeof g === 'string' ? list : list.filter((v) => g.values.includes(v));
    });
    const on = values.filter((v) => tokensOf(v).every((t) => draft.includes(t)));
    const labelOf = (v) => sectionChoices().find(([x]) => x === v)?.[1] || v;
    const now = on.length ? on.map(labelOf).join(', ') : '';
    const box = el(
      'details',
      { class: 'tm-more tm-task' },
      el('summary', {}, task.title, now ? el('span', { class: 'tm-task-now' }, ` — now: ${now}`) : null),
      task.example ? el('p', { class: 'tm-hint' }, task.example) : null,
      ...parts,
      extra,
    );
    const nearLabels = task.roles ? near.map((r) => ROLE_LABELS[r]).filter(Boolean) : [];
    if (nearLabels.length) box.append(el('p', { class: 'tm-hint' }, `The section next to it is ${[...new Set(nearLabels)].join(' and ')}: make this one the same to add it.`));
    // one task open at a time (`open`, kept by the panel); without it, the tasks in use open
    box.open = open === undefined ? on.length > 0 || nearLabels.length > 0 : open === task.title;
    if (onOpen) {
      // the author's click (not the panel opening it while drawing the list)
      let byAuthor = false;
      box.querySelector('summary').addEventListener('click', () => { byAuthor = true; });
      box.addEventListener('toggle', () => {
        const fromAuthor = byAuthor;
        byAuthor = false;
        if (box.open) {
          container.querySelectorAll(':scope > details.tm-task[open]').forEach((other) => {
            if (other !== box) other.open = false;
          });
          onOpen(task.title, fromAuthor);
        } else if (!container.querySelector(':scope > details.tm-task[open]')) {
          onOpen('', fromAuthor);
        }
      });
    }
    box.dataset.task = task.title;
    container.append(box);
  });
  return shown;
}
