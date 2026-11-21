/* global WebImporter */
/*
 * Readable settings writer: a corp document in the class form (number-carrying classes,
 * class-name bracket tags) → the readable-settings form (scripts/corp-settings.js):
 * number-carrying classes → Section Metadata settings rows, whole-element bracket tags →
 * Headings / Text rows, the other bracket tags → text style names or values, [[spacing]]
 * markers → Box lines, and `style-settings: on` in the page metadata.
 *
 * convertReadable(root) works on a document in the .plain.html form (sections as <div>s,
 * blocks as div.<name>); .cbr/local-scripts/settings-convert.mjs runs it on documents.
 * writeReadableSettings(main, document) runs it in an import script, on the import DOM
 * (sections between <hr>s, blocks as tables), as the library's last step.
 */
import decorateSpanTags from '../../../scripts/span-tags.js';
import * as S from '../../../scripts/corp-settings.js';
import { writeColonMarkers, ensureDescription } from './colon-writer.js';

const toClassName = (name) => name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/**
 * Converts a document in the .plain.html form, in place.
 * @param {Element} root the document's content: its sections as child <div>s
 * @returns {string[]} the report: per section the rows written, what stayed legacy
 */
export function convertReadable(root) {
  const doc = root.ownerDocument;
  const report = [];
  if (root.querySelector('span')) report.push('warning: the page already has spans');
  decorateSpanTags(root);

  const inv = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
  const TEXT = inv(S.TEXT_STYLES);
  const COPY = inv(S.COPY_SIZES);
  const LABEL = inv(S.LABEL_SIZES);
  const label = (n) => n.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('-');
  const SPACING = /^(padding|margin)-(top|bottom|left|right)-(minus-)?(\d+)(?:-(\d+))?(px)?$/;
  const INSET = /^(top|bottom|left|right)-(\d+)(?:-(\d+))?$/;
  const num = (int, dec) => (dec ? `${int}.${dec}` : int);

  // spacing tokens → `top 5%, sides 20%` entries (kind prefixed when asked)
  const formatSpacing = (tokens, withKind) => {
    const byKind = {};
    tokens.forEach((t) => {
      const [, kind, side, minus, int, dec, px] = t.match(SPACING);
      (byKind[kind] = byKind[kind] || {})[side] = `${minus ? '-' : ''}${num(int, dec)}${px ? 'px' : '%'}`;
    });
    const parts = {};
    Object.entries(byKind).forEach(([kind, s]) => {
      const e = [];
      const pre = withKind ? `${kind} ` : '';
      if (s.top && s.top === s.bottom && s.top === s.left && s.top === s.right) {
        e.push(`${pre}all ${s.top}`);
      } else {
        if (s.top) e.push(`${pre}top ${s.top}`);
        if (s.bottom) e.push(`${pre}bottom ${s.bottom}`);
        if (s.left && s.left === s.right) e.push(`${pre}sides ${s.left}`);
        else {
          if (s.left) e.push(`${pre}left ${s.left}`);
          if (s.right) e.push(`${pre}right ${s.right}`);
        }
      }
      parts[kind] = e.join(', ');
    });
    return parts;
  };
  const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

  const hasMedia = (cell) => cell.querySelector('picture, img, video, iframe')
    || [...cell.querySelectorAll('a[href]')].some((a) => /media-assets\.stryker\.com|scene7|\.m3u8|youtube|vimeo/.test(a.href));
  const textColumn = (columns) => {
    const cells = [...(columns.firstElementChild?.children || [])];
    const text = cells.map((c, i) => (hasMedia(c) ? 0 : i + 1)).filter(Boolean);
    return text.length === 1 ? text[0] : 0;
  };

  // classes of the bracket spans around a text node, up to its container
  const styleSet = (node, container) => {
    const set = new Set();
    for (let el = node.parentElement; el && el !== container; el = el.parentElement) {
      if (el.tagName === 'SPAN') el.classList.forEach((c) => set.add(c));
    }
    return set;
  };
  const textNodes = (el) => {
    const w = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
    const nodes = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
    return nodes;
  };
  // an element whose content starts with a line break inside its bracket spans
  // (`[[color-light-gray]<br>…]`, the operon-d770 large headline): lifting the spans' style
  // would leave the break first, and the document drops a line break at a paragraph's start
  const leadsWithBreak = (el) => {
    let n = el.firstChild;
    while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
    return !!n && n.nodeType === 1 && n.tagName === 'SPAN' && (() => {
      let m = n.firstChild;
      while (m && m.nodeType === 3 && !m.nodeValue.trim()) m = m.nextSibling;
      return !!m && (m.nodeName === 'BR' || (m.nodeName === 'SPAN' && leadsWithBreak(n)));
    })();
  };
  // a text style shared by every text run of the targets → its names; the classes leave the spans
  const liftStyle = (targets) => {
    const nodes = targets.flatMap((t) => textNodes(t).map((n) => [n, t]));
    if (!nodes.length || targets.some(leadsWithBreak)) return null;
    const sets = nodes.map(([n, t]) => styleSet(n, t));
    const common = [...sets[0]].filter((c) => TEXT[c] && sets.every((s) => s.has(c)));
    if (!common.length) return null;
    targets.forEach((t) => t.querySelectorAll('span').forEach((span) => {
      common.forEach((c) => span.classList.remove(c));
      if (!span.classList.length) span.replaceWith(...span.childNodes);
    }));
    const colors = common.filter((c) => c.startsWith('color-'));
    return [...colors, ...common.filter((c) => !colors.includes(c))].map((c) => label(TEXT[c])).join(', ');
  };

  const sections = [...root.children].filter((el) => el.tagName === 'DIV');
  sections.forEach((sec, i) => {
    const name = `S${i + 1}`;
    let meta = sec.querySelector(':scope > .section-metadata');
    if (sec.querySelector(':scope > .metadata')) return;
    const rows = [];
    let styleCell = null;
    let styles = [];
    meta?.querySelectorAll(':scope > div').forEach((row) => {
      if (row.children[0]?.textContent.trim().toLowerCase() === 'style') {
        [, styleCell] = row.children;
        styles = styleCell.textContent.split(',').map((s) => s.trim()).filter(Boolean);
      }
    });
    const hero = sec.querySelector(':scope > .hero-corp');
    const columns = [...sec.querySelectorAll(':scope > .columns')];
    const keep = [];
    const secSpacing = [];
    let copy = '';
    let lbl = '';
    let widths = '';
    let hsize = '';
    let auto = '';
    let blank = '';
    let pieces = '';
    const column = [];
    // p-1-75 → `1.75×` (the size as a multiple of the body copy / heading)
    const multiple = (s, prefix) => {
      const m = s.match(/^([a-z]+)-(\d+)(?:-(\d+))?$/);
      return m && m[1] === prefix ? `${num(m[2], m[3])}×` : '';
    };
    styles.forEach((s) => {
      if (SPACING.test(s)) secSpacing.push(s);
      else if (COPY[s]) copy = label(COPY[s]);
      else if (LABEL[s]) lbl = label(LABEL[s]);
      else if (multiple(s, 'p')) copy = multiple(s, 'p');
      else if (multiple(s, 'label')) lbl = multiple(s, 'label');
      else if (multiple(s, 'h')) hsize = multiple(s, 'h');
      else if (/^autoplay-\d+$/.test(s)) auto = `${Number(s.slice(9)) / 1000} s`;
      else if (/^lines-\d+$/.test(s) && styles.includes('spacer')) blank = s.slice(6);
      else if (/^flex-cols-\d+(-\d+)+$/.test(s)) pieces = s.slice(10).split('-').join(' + ');
      else if (/^col-\d+-\d+$/.test(s)) column.unshift(`width ${s.slice(4).replace('-', '/')}`);
      else if (/^col-at-\d+-\d+$/.test(s)) column.push(`from ${s.slice(7).replace('-', '/')}`);
      else if (s === 'col-phone') column.push('phones too');
      else if (/^flex-\d+(-\d+)+$/.test(s) && !columns.length) widths = s.slice(5).split('-').map((w) => `${w}%`).join(' / ');
      else keep.push(s);
    });

    let spacing = secSpacing;
    let inset = '';
    if (hero) {
      const cls = [...hero.classList];
      const heroSpacing = cls.filter((c) => SPACING.test(c));
      const insets = cls.filter((c) => INSET.test(c));
      if (secSpacing.length) {
        // section spacing would land on the hero's box: keep it a class
        keep.push(...secSpacing);
        spacing = [];
        report.push(`${name}: section spacing next to a hero kept as classes`);
      }
      if (heroSpacing.length && !secSpacing.length) {
        spacing = heroSpacing;
        hero.classList.remove(...heroSpacing);
      }
      if (insets.length) {
        inset = insets.map((c) => {
          const [, side, int, dec] = c.match(INSET);
          return `${side} ${num(int, dec)}%`;
        }).join(', ');
        hero.classList.remove(...insets);
      }
    }
    const fs = formatSpacing(spacing, false);
    if (fs.padding) rows.push(['Padding', fs.padding]);
    if (fs.margin) rows.push(['Margin', fs.margin]);
    if (inset) rows.push(['Text box', inset]);

    // Columns blocks: one Column widths row when all share the widths, else one per block;
    // per block Text box, Grid, Cell colours; the 2nd block's rows are `… (2)` and so on (the
    // 1st block's are `… (1)` next to a hero, whose plain Text box is its own)
    const GRID = /^grid-(?:([tm])-)?((?:of\d+-)?(?:(?:o\d+-)?n?\d+|h)(?:-(?:o\d+-)?n?\d+|-h)*)$/;
    const gridPart = (bp, value) => {
      const of = value.match(/^of(\d+)-(.+)$/);
      const items = (of ? of[2] : value).split('-').map((t) => {
        if (t === 'h') return 'hidden';
        if (t.startsWith('o')) return `skip ${t.slice(1)}`;
        if (t.startsWith('n')) return `new line ${t.slice(1)}`;
        return t;
      });
      return `${bp}: ${items.join(', ')}${of ? ` of ${of[1]}` : ''}`;
    };
    const colWidths = columns.map((col) => [...col.classList].find((c) => /^columns-\d+(-\d+)+$/.test(c)));
    const sharedWidths = colWidths.length && colWidths[0]
      && colWidths.every((c) => c === colWidths[0]);
    if (sharedWidths) {
      widths = colWidths[0].slice(8).split('-').map((x) => `${x}%`).join(' / ');
      columns.forEach((col) => col.classList.remove(colWidths[0]));
    }
    columns.forEach((col, ci) => {
      const k = ci + 1;
      const suffix = k > 1 || hero ? ` (${k})` : '';
      const cls = [...col.classList];
      if (!sharedWidths && colWidths[ci]) {
        rows.push([`Column widths (${k})`, colWidths[ci].slice(8).split('-').map((x) => `${x}%`).join(' / ')]);
        col.classList.remove(colWidths[ci]);
      }
      const byCell = {};
      const colours = [];
      const borders = [];
      const grid = {};
      cls.forEach((c) => {
        const m = c.match(/^cell-(\d+)-(.+)$/);
        if (m && SPACING.test(m[2])) {
          (byCell[m[1]] = byCell[m[1]] || []).push(m[2]);
          col.classList.remove(c);
        } else if (m && /^(bg-[a-z-]+|dark)$/.test(m[2])) {
          colours.push([m[1], m[2]]);
          col.classList.remove(c);
        } else if (m && /^image-border(-[a-z]+)?$/.test(m[2])) {
          borders.push([m[1], m[2] === 'image-border' ? 'teal' : m[2].slice(13)]);
          col.classList.remove(c);
        }
        const g = c.match(GRID);
        if (g) {
          const [, bp, value] = g;
          grid[bp || 'd'] = value;
          col.classList.remove(c);
        }
      });
      const coloured = new Set(colours.map(([n]) => n));
      const parts = Object.entries(byCell).map(([cell, tokens]) => {
        // a 3% margin is the same box as 3% padding only without a colour (margins stay
        // outside a coloured cell, scripts/corp-spacing.js)
        const forms = coloured.has(cell) ? [S.BOXED] : [S.BOXED,
          S.BOXED.map((t) => (t === 'padding-left-3' ? 'margin-left-3' : t)),
          S.BOXED.map((t) => (t === 'padding-right-3' ? 'margin-right-3' : t))];
        if (forms.some((f) => same(f, tokens))) {
          return Number(cell) === textColumn(col) ? 'boxed' : `column ${cell}: boxed`;
        }
        const f = formatSpacing(tokens, true);
        // entries without a kind are padding
        const value = [f.padding, f.margin].filter(Boolean).join(', ').replace(/padding /g, '');
        return `column ${cell}: ${value}`;
      });
      if (parts.length) rows.push([`Text box${suffix}`, parts.join('; ')]);
      const gridParts = [['d', 'desktop'], ['t', 'tablet'], ['m', 'phone']]
        .filter(([bp]) => grid[bp]).map(([bp, bpName]) => gridPart(bpName, grid[bp]));
      if (gridParts.length) rows.push([`Grid${suffix.replace(' (1)', '')}`, gridParts.join(' · ')]);
      if (colours.length) {
        rows.push([`Cell colours${suffix.replace(' (1)', '')}`, colours.map(([n, c]) => `${n}: ${label(c === 'dark' ? 'dark' : c.slice(3))}`).join(', ')]);
      }
      if (borders.length) {
        rows.push([`Image borders${suffix.replace(' (1)', '')}`, borders.map(([n, c]) => `${n}: ${label(c)}`).join(', ')]);
      }
    });
    if (widths) rows.push(['Column widths', widths]);
    if (column.length) rows.push(['Column', column.join(', ')]);
    if (copy) rows.push(['Copy size', copy]);
    if (lbl) rows.push(['Label size', lbl]);
    if (hsize) rows.push(['Heading size', hsize]);
    if (auto) rows.push(['Autoplay', auto]);
    if (blank) rows.push(['Blank lines', blank]);
    if (pieces) rows.push(['Columns', pieces]);

    const headings = [...sec.querySelectorAll(':scope > :is(h1, h2, h3, h4, h5, h6)')];
    // (blank lines and column breaks carry no style of their own)
    const texts = [...sec.querySelectorAll(':scope > p, :scope > ul > li, :scope > ol > li, :scope > .accordion > div > div:nth-child(2)')]
      .filter((el) => !/^(\[\[blank line\]\]|column break)$/i.test(el.textContent.trim()));
    const h = headings.length ? liftStyle(headings) : null;
    if (h) rows.push(['Headings', h]);
    const t = texts.length ? liftStyle(texts) : null;
    if (t) rows.push(['Text', t]);

    if (!rows.length && keep.length === styles.length) return;
    if (!meta) {
      meta = doc.createElement('div');
      meta.className = 'section-metadata';
      sec.append(meta);
    }
    if (styleCell) {
      if (keep.length) styleCell.textContent = keep.join(', ');
      else styleCell.parentElement.remove();
    }
    rows.forEach(([k, v]) => {
      const row = doc.createElement('div');
      const a = doc.createElement('div');
      const b = doc.createElement('div');
      a.textContent = k;
      b.textContent = v;
      row.append(a, b);
      meta.append(row);
    });
    report.push(`${name}: ${rows.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
  });

  // the remaining bracket spans back to bracket tags: text styles by name, sizes as values
  // (size-1-75em → 1.75×, size-5-5vw → 5.5vw), spacing markers as Box lines
  const nameOf = (c) => {
    if (TEXT[c]) return label(TEXT[c]);
    const m = c.match(/^size-(\d+)(?:-(\d+))?(em|vw)$/);
    return m ? `${num(m[1], m[2])}${m[3] === 'vw' ? 'vw' : '×'}` : null;
  };
  const named = (span) => [...span.classList].every(nameOf);
  let legacy = 0;
  let byName = 0;
  let boxes = 0;
  [...root.querySelectorAll('span')].forEach((span) => {
    if (!root.contains(span)) return;
    let classes = [...span.classList];
    const p = span.parentElement;
    if (classes[0] === 'spacing' && p?.tagName === 'P' && p.childNodes.length === 1 && !span.textContent.trim()) {
      // (a box colour first: bg-gold → Gold, dark → Dark)
      const colour = /^(bg-[a-z-]+|dark)$/.test(classes[1] || '') ? classes[1] : '';
      const tokens = classes.slice(colour ? 2 : 1);
      if (tokens.every((tk) => SPACING.test(tk))) {
        const f = formatSpacing(tokens, true);
        const value = [colour ? label(colour.replace(/^bg-/, '')) : '', f.padding, f.margin]
          .filter(Boolean).join(', ').replace(/padding /g, '');
        p.textContent = tokens.length || colour ? `Box: ${value}` : 'Box end';
        boxes += 1;
        return;
      }
    }
    let content = [...span.childNodes].filter((n) => n.nodeType !== 3 || n.nodeValue !== '');
    const only = content.length === 1 && content[0].tagName === 'SPAN' ? content[0] : null;
    if (named(span) && only && named(only)) {
      classes = [...classes, ...only.classList];
      content = [...only.childNodes];
    }
    const tag = classes.every(nameOf) ? classes.map(nameOf) : classes;
    if (classes.every(nameOf)) byName += 1; else legacy += 1;
    span.replaceWith(`[[${tag.join(',')}]`, ...content, ']');
  });
  report.push(`bracket tags: ${byName} by name or value, ${legacy} kept with legacy classes; ${boxes} Box lines`);

  // heading ids as the backend derives them from the authored text
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((hd) => {
    const slug = hd.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (hd.id) hd.id = slug;
  });

  const md = root.querySelector('.metadata');
  if (md) {
    const row = doc.createElement('div');
    const a = doc.createElement('div');
    const b = doc.createElement('div');
    a.textContent = 'style-settings';
    b.textContent = 'on';
    row.append(a, b);
    md.append(row);
  }
  return report;
}

/**
 * The import DOM in the .plain.html form: sections (between <hr>s) as <div>s, block tables as
 * div.<name>.<variants> with a <div> per row and cell. The nodes move (not copies); `blocks`
 * keeps each block's table, name and cells for the way back.
 */
function toPlain(main, document) {
  const root = document.createElement('div');
  const blocks = new Map();
  let section = document.createElement('div');
  root.append(section);
  [...main.childNodes].forEach((node) => {
    if (node.nodeName === 'HR') {
      section = document.createElement('div');
      root.append(section);
    } else if (node.nodeName === 'TABLE') {
      const rows = [...node.rows];
      const header = rows[0].cells[0].textContent.trim();
      const [, name, variants] = header.match(/^([^(]*?)\s*(?:\((.*)\))?$/) || [null, header, ''];
      const div = document.createElement('div');
      div.className = [name, ...(variants || '').split(',')].map((v) => toClassName(v.trim())).filter(Boolean).join(' ');
      const cells = rows.slice(1).map((tr) => {
        const row = document.createElement('div');
        div.append(row);
        return [...tr.cells].map((td) => {
          const cell = document.createElement('div');
          cell.append(...td.childNodes);
          row.append(cell);
          return td;
        });
      });
      blocks.set(div, { table: node, name, cells });
      section.append(div);
    } else {
      section.append(node);
    }
  });
  // what is left are the <hr>s and the emptied tables (kept in `blocks` for the way back)
  main.replaceChildren();
  return { root, blocks };
}

/** Back to the import DOM: each section's nodes into main, <hr> between sections. */
function toImport(main, document, root, blocks) {
  [...root.children].forEach((section, i) => {
    if (i) main.append(document.createElement('hr'));
    [...section.childNodes].forEach((node) => {
      const kind = node.nodeType === 1 ? node.className : '';
      if (kind === 'section-metadata' || kind === 'metadata') {
        // metadata tables: rebuilt from their rows (the writer adds and changes rows)
        const cells = [...node.children]
          .map((row) => [row.children[0].textContent, [...row.children[1].childNodes]]);
        const name = kind === 'metadata' ? 'Metadata' : 'Section Metadata';
        if (cells.length) main.append(WebImporter.Blocks.createBlock(document, { name, cells }));
        return;
      }
      const block = blocks.get(node);
      if (!block) {
        main.append(node);
        return;
      }
      // a block keeps its table: the cells' content back, the header with the variants left
      const variants = [...node.classList].slice(1);
      block.table.rows[0].cells[0].textContent = variants.length ? `${block.name} (${variants.join(', ')})` : block.name;
      [...node.children].forEach((row, r) => [...row.children].forEach((cell, c) => {
        block.cells[r][c].append(...cell.childNodes);
      }));
      main.append(block.table);
    });
  });
}

/**
 * The library's last step in an import script: the page (or fragment) body in the class form →
 * the readable-settings form, in place.
 * @param {Element} main the import body (sections between <hr>s, blocks as tables)
 * @param {Document} document the import document
 * @returns {string[]} the writer's report
 */
export function writeReadableSettings(main, document) {
  // debugging the class form of a library import: off with window.CORP_WRITER_OFF
  if (typeof window !== 'undefined' && window.CORP_WRITER_OFF) return [];
  const { root, blocks } = toPlain(main, document);
  // the source's own spans are still in the import DOM; the document keeps only their text (an
  // icon span becomes its :icon: code), so they go before the bracket tags become spans
  root.querySelectorAll('span:not(.icon)').forEach((span) => span.replaceWith(...span.childNodes));
  const report = convertReadable(root);
  // the text styles as colon markers, and a Description the server needn't derive (colon-writer)
  report.push(...writeColonMarkers(root), ...ensureDescription(root));
  toImport(main, document, root, blocks);
  return report;
}
