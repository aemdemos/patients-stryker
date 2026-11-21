/*
 * Readable style settings (prototype): on pages with `style-settings: on` metadata, authors
 * write the AEM-measured values as Section Metadata rows and inline text styles by name
 * instead of number-carrying class names. This turns them into the class names the corp
 * styling already reads (corp-spacing.js, corp-type.js, styles-corp.css, hero-corp), so a
 * page renders exactly like its class-authored copy:
 *   Padding | top 5%, bottom 5%, sides 20%      Margin | top 2%
 *     the section's default content box, or its hero's text box
 *   Text box | top 3%, left 15%, right 45%      the hero's text box inset
 *   Text box | column 1: top 10%, bottom 5%     a Columns cell's box (`; ` between cells);
 *   Text box | boxed                            3% on every side of the text column
 *   Column widths | 33% / 67%                   the section's Columns blocks, or a flex section
 *   Grid | desktop: 3, 6, 3 · tablet: 4, 8 · phone: skip 1, 10, hidden    Columns grid options
 *     (units of 12, or `… of 6`; `skip N` an offset, `new line N`, `hidden`)
 *   Cell colours | 1: Purple, 2: Blue, 3: Teal  a column's box colour (Columns cells)
 *   Image borders | 1: Black, 2: Teal  the 1px border of a column's images (Columns cells)
 *   Text box (2), Column widths (2), Grid (2), Cell colours (2)   the section's 2nd Columns block
 *   Column | width 5/6, from 1/6, phones too    a lone AEM column's width and start
 *   Copy size | Large       Label size | Large   by name, or as a multiple: Copy size | 1.75×
 *   Heading size | 1.25×                        Autoplay | 5 s   (carousel)
 *   Headings | Display, Gold                    every heading of the section's default content
 *   Text | Large                                its paragraphs and list items, accordion answers
 *   [[Gold,Title]…]                             text styles by name, inside the text
 *   [[1.75×]…]  [[Gold,5.5vw]…]                 a size as a value: × the surrounding size, or vw
 *   Box: top 3%, sides 3%   …   Box end         a padded box inside text or a block cell
 *   [[Blank line]]                              an empty line of text (its own paragraph)
 *   Blank lines | 2                             a spacer section's blank lines (style spacer)
 *   Columns | 1 + 2                             a flex section's pieces per source column
 * The name lists below are the registry: one place says what each name is.
 */

/** text styles: name → the bracket-tag class it stands for */
export const TEXT_STYLES = {
  display: 'size-3vw',
  headline: 'size-2-5vw',
  title: 'size-2vw',
  lead: 'size-1-5vw',
  fluid: 'size-1vw',
  large: 'size-1-25em',
  serif: 'serif',
  sans: 'body-font',
  futura: 'futura-bold',
  // a whole paragraph or heading: its alignment, or a 40px indent (styles-corp.css)
  center: 'align-center',
  right: 'align-right',
  indent: 'indent',
};
/* colours by their own name: Gold → color-gold */
['gold', 'white', 'light-gray', 'blue', 'purple', 'teal', 'grey', 'silver', 'dark-gold', 'black', 'navy']
  .forEach((color) => { TEXT_STYLES[color] = `color-${color}`; });

/** Copy size → section style */
export const COPY_SIZES = { small: 'p-0-8', large: 'p-1-25', 'x-large': 'p-1-5' };

/** Label size → section style */
export const LABEL_SIZES = { large: 'label-1-75' };

/** `Text box | boxed`: the box the source gives a Columns text column */
export const BOXED = ['padding-top-3', 'padding-bottom-3', 'padding-left-3', 'padding-right-3'];

const SIDES = {
  top: ['top'], bottom: ['bottom'], left: ['left'], right: ['right'], sides: ['left', 'right'], all: ['top', 'bottom', 'left', 'right'],
};

/** 3.6 → `3-6`, -8 → `minus-8` (the corp-spacing token form) */
const tokenNumber = (value) => `${value < 0 ? 'minus-' : ''}${String(Math.abs(value)).replace('.', '-')}`;

/**
 * Spacing tokens of a settings value.
 * @param {string} value e.g. `top 5%, sides 20%` or `padding top 3%, margin left 3%`
 * @param {string} kind `padding` or `margin` when the entries don't name it
 * @returns {string[]} e.g. ['padding-top-5', 'padding-left-20', 'padding-right-20']
 */
export function spacingTokens(value, kind) {
  return value.split(',').flatMap((entry) => {
    const m = entry.trim().toLowerCase()
      .match(/^(?:(padding|margin)\s+)?(top|bottom|left|right|sides|all)\s+(-?\d+(?:\.\d+)?)\s*(%|px)$/);
    if (!m) return [];
    const [, own, side, num, unit] = m;
    return SIDES[side].map((s) => `${own || kind}-${s}-${tokenNumber(Number(num))}${unit === 'px' ? 'px' : ''}`);
  });
}

/**
 * Hero text box inset tokens: `top 3%, left 15%` → ['top-3', 'left-15'].
 * @param {string} value The setting
 * @returns {string[]} The tokens
 */
function insetTokens(value) {
  return value.split(',').flatMap((entry) => {
    const m = entry.trim().toLowerCase().match(/^(top|bottom|left|right)\s+(\d+(?:\.\d+)?)\s*%$/);
    return m ? [`${m[1]}-${tokenNumber(Number(m[2]))}`] : [];
  });
}

/** The classes a list of text style names stands for (unknown names are skipped). */
const styleClasses = (names) => names
  .map((n) => TEXT_STYLES[n.trim().toLowerCase()])
  .filter(Boolean);

/**
 * The nested spans of a set of text style classes, as bracket tags make them: colours on the
 * outer span, size and font on the inner one.
 * @param {string[]} classes The classes
 * @returns {{outer: Element, inner: Element}} The spans (the same span when one is enough)
 */
function styleSpans(classes) {
  const colors = classes.filter((c) => c.startsWith('color-'));
  const rest = classes.filter((c) => !c.startsWith('color-'));
  const make = (list) => {
    const span = document.createElement('span');
    span.className = list.join(' ');
    return span;
  };
  if (!colors.length || !rest.length) {
    const span = make(classes);
    return { outer: span, inner: span };
  }
  const outer = make(colors);
  const inner = make(rest);
  outer.append(inner);
  return { outer, inner };
}

/**
 * Wraps every text run of an element in the spans of a text style. Spaces at either end of a
 * run stay outside, where they are when the run is written as a bracket tag.
 * @param {Element} el The element
 * @param {string[]} classes The text style's classes
 */
function wrapRuns(el, classes) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  nodes.forEach((textNode) => {
    let node = textNode;
    const lead = node.nodeValue.length - node.nodeValue.trimStart().length;
    if (lead) node = node.splitText(lead);
    const trail = node.nodeValue.length - node.nodeValue.trimEnd().length;
    if (trail) node.splitText(node.nodeValue.length - trail);
    const { outer, inner } = styleSpans(classes);
    node.replaceWith(outer);
    inner.append(node);
  });
}

/**
 * Bracket tags written with text style names (`[[Gold,Title]…]`, spans by now): their
 * classes become the ones the names stand for.
 * @param {Element} main The container
 */
function decorateNamedTags(main) {
  const names = Object.keys(TEXT_STYLES);
  const known = (c) => names.includes(c) || c.startsWith('value-');
  main.querySelectorAll('span').forEach((span) => {
    const own = [...span.classList];
    if (!own.length || !own.every(known)) return;
    const classes = own.map((c) => (c.startsWith('value-') ? c.slice(6) : TEXT_STYLES[c]));
    const { outer, inner } = styleSpans(classes);
    inner.append(...span.childNodes);
    span.replaceWith(outer);
  });
}

/** a size value of a bracket tag → its class: `1.75×` → size-1-75em, `5.5vw` → size-5-5vw */
function sizeValue(token) {
  const m = token.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(×|x|vw)$/);
  if (!m) return '';
  return `size-${tokenNumber(Number(m[1]))}${m[2] === 'vw' ? 'vw' : 'em'}`;
}

const OPENER = /\[\[([^\][]+)\]/g;
const slug = (text) => text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/**
 * Size values in bracket tags (`[[Gold,1.75×]…]`): rewritten as `value-` classes before the
 * bracket tags are parsed (bracket class names can't hold `.` or `×`). A heading whose id was
 * derived from its authored text gets the id of the rewritten text, so the bracket decoration
 * still re-derives it from the visible text.
 * @param {Element} main The container
 */
export function rewriteSizeValues(main) {
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    // code samples stay as typed (bracket tags skip code too)
    if (node.nodeValue.includes('[[') && !node.parentElement.closest('code, pre')) nodes.push(node);
  }
  nodes.forEach((node) => {
    const heading = node.parentElement.closest('h1, h2, h3, h4, h5, h6');
    const before = heading?.textContent;
    node.nodeValue = node.nodeValue.replace(OPENER, (full, raw) => {
      const tokens = raw.split(',').map((t) => t.trim());
      if (!tokens.some(sizeValue)) return full;
      return `[[${tokens.map((t) => (sizeValue(t) ? `value-${sizeValue(t)}` : t)).join(',')}]`;
    });
    if (heading?.id && slug(before).replace(/-/g, '') === heading.id.replace(/-/g, '')) {
      heading.id = slug(heading.textContent);
    }
  });
}

// the box colours of Box lines and Cell colours (blocks/columns/columns-corp.css cell-bg-*)
const BOX_COLOURS = ['white', 'gold', 'light-gray', 'gray', 'blue', 'purple', 'teal', 'silver',
  'dark-gold', 'golden-gradient', 'dark-gray', 'dark-purple-gradient', 'dark-blue-gradient',
  'dark-orange-gradient', 'dark'];

/**
 * `Box: top 3%, sides 3%` (`Box: Gold, all 3%` with the box colour) and `Box end` lines:
 * the `[[spacing,…]]` marker paragraphs the box
 * spacing reads (corp-spacing.js), the box running from one line to the next.
 * @param {Element} main The container
 */
function decorateBoxLines(main) {
  main.querySelectorAll('p').forEach((p) => {
    const line = p.textContent.trim();
    const m = line.match(/^box:\s*(.+)$/i);
    const entries = m ? m[1].split(',').map((e) => e.trim()) : [];
    // a colour first (`Box: Gold, all 3%`, the Cell colours names)
    const colour = entries.length && BOX_COLOURS.includes(entries[0].toLowerCase())
      ? entries.shift().toLowerCase() : '';
    // every entry must read as spacing, so an ordinary sentence starting `Box:` stays text
    const valid = m && (colour || entries.length)
      && entries.every((entry) => spacingTokens(entry, 'padding').length);
    if (!/^box end$/i.test(line) && !valid) return;
    const tokens = valid ? [
      ...(colour ? [colour === 'dark' ? 'dark' : `bg-${colour}`] : []),
      ...spacingTokens(entries.join(','), 'padding'),
    ] : [];
    const span = document.createElement('span');
    span.className = ['spacing', ...tokens].join(' ');
    p.replaceChildren(span);
  });
}

/**
 * The text column of a Columns block: the one cell of its first row without media.
 * @param {Element} columns The block
 * @returns {number} Its 1-based index, 0 when there isn't exactly one
 */
function textColumn(columns) {
  const cells = [...(columns.firstElementChild?.children || [])];
  const text = cells.map((cell, i) => (cell.querySelector('picture, img, video, iframe') ? 0 : i + 1)).filter(Boolean);
  return text.length === 1 ? text[0] : 0;
}

/**
 * Applies one section's settings rows (data-* attributes set from its Section Metadata).
 * @param {Element} section The section
 */
/**
 * `Grid` row → the Columns grid options (blocks/columns/columns.js decorateGrid):
 * `desktop: 3, 6, 3 · tablet: 4, 8 · phone: skip 1, 10, hidden` → grid-3-6-3 grid-t-4-8
 * grid-m-o1-10-h; `… of 6` for another unit count, `new line 6` for a column on a new line.
 * @param {string} value The setting
 * @returns {string[]} The options
 */
export function gridOptions(value) {
  const prefix = { desktop: '', tablet: 't-', phone: 'm-' };
  return value.split(/[·;]/).flatMap((part) => {
    const m = part.trim().match(/^(desktop|tablet|phone)\s*:\s*(.+?)(?:\s+of\s+(\d+))?$/i);
    if (!m) return [];
    const tokens = m[2].split(',').map((t) => t.trim().toLowerCase()).flatMap((t) => {
      if (t === 'hidden') return ['h'];
      const skip = t.match(/^skip\s+(\d+)$/);
      if (skip) return [`o${skip[1]}`];
      const line = t.match(/^new line\s+(\d+)$/);
      if (line) return [`n${line[1]}`];
      return /^\d+$/.test(t) ? [t] : [];
    });
    if (!tokens.length) return [];
    return [`grid-${prefix[m[1].toLowerCase()]}${m[3] ? `of${m[3]}-` : ''}${tokens.join('-')}`];
  });
}

/**
 * `Cell colours | 1: Purple, 2: Light-Gray` → cell-1-bg-purple cell-2-bg-light-gray
 * (`Dark`, the teal gradient: cell-N-dark)
 */
function cellColourOptions(value) {
  return value.split(',').flatMap((part) => {
    const m = part.trim().match(/^(\d+)\s*:\s*([a-z-]+)$/i);
    if (!m) return [];
    const name = m[2].toLowerCase();
    return [`cell-${m[1]}-${name === 'dark' ? 'dark' : `bg-${name}`}`];
  });
}

/**
 * `Image borders | 1: Black, 2: Teal` → cell-1-image-border-black cell-2-image-border (the
 * images of those cells get the 1px border, styles-corp.css)
 */
function imageBorderOptions(value) {
  return value.split(',').flatMap((part) => {
    const m = part.trim().match(/^(\d+)\s*:\s*(teal|black|grey|blue|white)$/i);
    if (!m) return [];
    const name = m[2].toLowerCase();
    return [`cell-${m[1]}-image-border${name === 'teal' ? '' : `-${name}`}`];
  });
}

/** `Column | width 5/6, from 1/6, phones too` → col-5-6 col-at-1-6 col-phone */
function columnStyles(value) {
  const v = value.toLowerCase();
  const width = v.match(/width\s+(\d+)\s*\/\s*(\d+)/);
  const from = v.match(/from\s+(\d+)\s*\/\s*(\d+)/);
  return [width ? `col-${width[1]}-${width[2]}` : '', from ? `col-at-${from[1]}-${from[2]}` : '',
    /phones too/.test(v) ? 'col-phone' : ''].filter(Boolean);
}

/**
 * A Columns block's rows: `Text box`, `Column widths`, `Grid`, `Cell colours` for the first
 * block (`(1)` too), `… (2)` for the second, and so on.
 * @param {Element} col The block
 * @param {number} k Its place among the section's Columns blocks (1-based)
 * @param {DOMStringMap} data The section's settings
 * @param {boolean} hero The section has a hero (its plain `Text box` is the hero's)
 */
function decorateColumns(col, k, data, hero) {
  // `Text box (2)` is data-text-box-2, dataset key textBox-2 (a number after a hyphen stays)
  const own = (name) => data[`${name}-${k}`] ?? data[`${name}${k}`];
  const row = (name) => own(name) ?? (k === 1 && !(hero && name === 'textBox') ? data[name] : undefined);
  const textBox = row('textBox');
  if (textBox) {
    textBox.split(';').forEach((part) => {
      const m = part.trim().match(/^(?:column\s+(\d+)\s*:\s*)?(.+)$/i);
      if (!m) return;
      const cell = Number(m[1]) || textColumn(col);
      const tokens = m[2].trim().toLowerCase() === 'boxed' ? BOXED : spacingTokens(m[2], 'padding');
      if (cell) col.classList.add(...tokens.map((t) => `cell-${cell}-${t}`));
    });
  }
  // one Column widths row for all the section's blocks when no block has its own
  const shared = !Object.keys(data).some((key) => /^columnWidths-?\d+$/.test(key));
  const widths = row('columnWidths') ?? (shared ? data.columnWidths : undefined);
  if (widths) {
    const parts = widths.split('/').map((w) => parseFloat(w)).filter((w) => w > 0);
    col.classList.add(`columns-${parts.join('-')}`);
  }
  const grid = row('grid');
  if (grid) col.classList.add(...gridOptions(grid));
  const colours = row('cellColours');
  if (colours) col.classList.add(...cellColourOptions(colours));
  const borders = row('imageBorders');
  if (borders) col.classList.add(...imageBorderOptions(borders));
}

function decorateSection(section) {
  const {
    padding, margin, textBox, columnWidths, copySize, labelSize, headingSize, autoplay,
    headings, text, column, blankLines, columns: pieces,
  } = section.dataset;
  // a spacer's blank lines: `Blank lines | 2` → lines-2 (styles-corp.css)
  const lines = parseInt(blankLines, 10);
  if (lines > 0) section.classList.add(`lines-${lines}`);
  const hero = section.querySelector('.hero-corp');
  const columns = section.querySelectorAll('.columns');
  const spacing = [...spacingTokens(padding || '', 'padding'), ...spacingTokens(margin || '', 'margin')];
  (hero || section).classList.add(...spacing);

  if (textBox && hero) hero.classList.add(...insetTokens(textBox));
  columns.forEach((col, i) => decorateColumns(col, i + 1, section.dataset, !!hero));
  if (columnWidths && !columns.length) {
    section.classList.add(`flex-${columnWidths.split('/').map((w) => parseFloat(w)).filter((w) => w > 0).join('-')}`);
  }
  if (column) section.classList.add(...columnStyles(column));
  // `Columns | 1 + 2`: how many of the section's pieces each source column holds (corp.js)
  const counts = (pieces || '').split('+').map((n) => parseInt(n, 10));
  if (counts.length > 1 && counts.every((n) => n > 0)) section.classList.add(`flex-cols-${counts.join('-')}`);
  // a size by name, or as a multiple (`1.75×`) → `<prefix>-1-75`
  const size = (map, prefix, value) => {
    const v = (value || '').trim().toLowerCase();
    const m = v.match(/^(\d+(?:\.\d+)?)\s*[×x]$/);
    return map[v] || (m ? `${prefix}-${tokenNumber(Number(m[1]))}` : '');
  };
  [size(COPY_SIZES, 'p', copySize), size(LABEL_SIZES, 'label', labelSize), size({}, 'h', headingSize)]
    .filter(Boolean).forEach((cls) => section.classList.add(cls));
  const seconds = (autoplay || '').match(/^(\d+(?:\.\d+)?)\s*s/i);
  if (seconds) section.classList.add(`autoplay-${Math.round(Number(seconds[1]) * 1000)}`);

  // the section's text, also in the panels of a `tabbed` section (scripts.js
  // buildTabbedSections has moved it into the tabs block by now)
  const content = section.querySelectorAll(':scope > .default-content-wrapper, .tabs [data-tabs-section]');
  if (headings) {
    const classes = styleClasses(headings.split(','));
    content.forEach((wrapper) => wrapper.querySelectorAll(':scope > :is(h1, h2, h3, h4, h5, h6)')
      .forEach((h) => wrapRuns(h, classes)));
  }
  if (text) {
    const classes = styleClasses(text.split(','));
    content.forEach((wrapper) => wrapper.querySelectorAll(':scope > p, :scope > ul > li, :scope > ol > li')
      .forEach((el) => wrapRuns(el, classes)));
    section.querySelectorAll('.accordion > div > div:nth-child(2)').forEach((cell) => wrapRuns(cell, classes));
  }
}

/**
 * `[[Blank line]]` paragraphs: one empty line of text (the source's &nbsp; paragraphs that
 * space text), a paragraph holding a no-break space (styles-corp.css p.blank-line).
 * @param {Element} main The container
 */
function decorateBlankLines(main) {
  main.querySelectorAll('p').forEach((p) => {
    if (!/^\[\[\s*blank line\s*\]\]$/i.test(p.textContent.trim())) return;
    p.textContent = '\u00a0';
    p.classList.add('blank-line');
  });
}

/**
 * Applies the readable style settings of a container (main, or a fragment): after the
 * section metadata, before the spacing and type decoration read the classes.
 * @param {Element} main The container
 */
export default function decorateSettings(main) {
  decorateNamedTags(main);
  decorateBoxLines(main);
  decorateBlankLines(main);
  main.querySelectorAll(':scope > .section').forEach(decorateSection);
}
