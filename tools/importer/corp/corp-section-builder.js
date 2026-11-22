/* global WebImporter */
/*
 * www.stryker.com page → EDS sections, template-agnostic (every corp importer).
 *
 * The builder walks the rendered page (or experience fragment) in authored order. Every AEM
 * component is found by its wrapper class (div.text, div.cols2, div.experienceFragment, …)
 * and handed to the handler registered for it (tools/importer/corp-component-handlers.js,
 * one per row of tools/importer/decisions/component-map.json). Layout wrappers (parsys,
 * aem-Grid, rows, columns) are walked through. A handler returns items:
 *   flow      default content (paragraphs, headings, images, buttons); nodes carry their copy
 *             style (copyStyle, boldBody, serifHeading) and the item its role / box / size
 *   block     a block that joins the current section (Video); cellNodes = its form in a
 *             Columns cell (the video link)
 *   own       nodes in a section of their own (hero, columns, tabs, widgets …), with styles
 *   fragment  a Fragment block (an XF on the page) in a section of its own
 *   form      a Marketo Form block in a section of its own
 *   counter   a number counter (Statistics row), see corp-component-handlers.js
 *   anchor    a section id for the next section (hidden section titles: deepLinkingId)
 *   separator the next section starts with a rule (section style divider)
 *   boundary  the next content starts a new section (a one-column column control)
 *   group     items inside a full-bleed panel: every section they make gets the panel style
 * Components without a handler are kept as cleaned default content and reported.
 * The items are then placed into sections (place) and rendered as <hr>-separated sections
 * with Section Metadata (style, id).
 */
import { text, finishRuns, BLANK_LINE } from './corp-richtext.js';

// elements that are never content
const NOT_CONTENT = new Set(['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT', 'INPUT', 'TEMPLATE', 'META', 'BUTTON']);

/**
 * The layout of a responsive-grid column, from its aem-GridColumn classes: per breakpoint
 * (default, tablet, phone) the width, offset and behaviour (newline, hide, none), or null
 * where the class is not set. Null for an element without a default width.
 */
export function gridSpec(el) {
  const cls = String(el.className);
  const get = (re) => (cls.match(re) || [])[1] ?? null;
  const at = (bp) => {
    const w = get(new RegExp(`\\baem-GridColumn--${bp}--(\\d+)\\b`));
    const o = get(new RegExp(`\\baem-GridColumn--offset--${bp}--(\\d+)\\b`));
    return {
      w: w === null ? null : Number(w),
      o: o === null ? null : Number(o),
      beh: get(new RegExp(`\\baem-GridColumn--${bp}--(newline|hide|none)\\b`)),
    };
  };
  const spec = { d: at('default'), t: at('tablet'), m: at('phone') };
  return spec.d.w ? spec : null;
}

/** The number of columns of a responsive grid (aem-Grid--N; a nested grid has its column's). */
const gridTotal = (el) => Number((String(el.className).match(/\baem-Grid--(\d+)\b/) || [])[1]) || 12;

/** A grid's columns at a breakpoint (aem-Grid--<bp>--N), its default else. */
const gridTotalAt = (el, bp) => Number((String(el.className).match(new RegExp(`\\baem-Grid--${bp}--(\\d+)\\b`)) || [])[1]) || gridTotal(el);

/**
 * A grid column that is only a nested grid filling one line (the stryker.com building block:
 * about "Fast facts", each fact a 3/12 block after a 1/12 offset holding icon 1/3 + text 2/3):
 * its columns placed in the outer grid instead — widths and offsets scaled from the nested
 * grid to the outer column's width at each breakpoint, the outer offset before the first —
 * so the outer row is one row of all of them (skip 1, 1, 2, skip 1, 1, 2 …). Null when the
 * column holds anything else, or a width does not scale to whole grid units.
 * @param {Element} col the outer grid column
 * @param {object} spec its gridSpec
 * @returns {{el: Element, spec: object}[]|null}
 */
function nestedColumns(col, spec) {
  const grids = [...col.querySelectorAll('.aem-Grid')];
  const inner = grids[0];
  if (!inner || grids.some((g) => g !== inner && !inner.contains(g))) return null;
  // (nothing beside the nested grid)
  const squash = (el) => (el.textContent || '').replace(/\s+/g, '');
  if (squash(col) !== squash(inner) || col.querySelectorAll('img').length !== inner.querySelectorAll('img').length) return null;
  const cols = [...inner.children].filter((c) => c.getAttribute('data-corp-hidden') !== 'true');
  const specs = cols.map(gridSpec);
  if (cols.length < 2 || specs.some((s) => !s)) return null;
  const BPS = { d: 'default', t: 'tablet', m: 'phone' };
  const val = (s, bp, key) => s[bp][key] ?? s.d[key];
  const totals = Object.fromEntries(Object.entries(BPS)
    .map(([bp, name]) => [bp, gridTotalAt(inner, name)]));
  // (one line at the default breakpoint)
  if (specs.reduce((sum, s) => sum + (s.d.o || 0) + s.d.w, 0) !== totals.d) return null;
  const scale = (n, bp) => (n * (val(spec, bp, 'w') || 0)) / totals[bp];
  const out = cols.map((c, i) => {
    const combined = {};
    Object.keys(BPS).forEach((bp) => {
      const w = scale(val(specs[i], bp, 'w') || 0, bp);
      const o = scale(val(specs[i], bp, 'o') || 0, bp) + (i === 0 ? (val(spec, bp, 'o') || 0) : 0);
      combined[bp] = { w, o, beh: specs[i][bp].beh ?? (bp === 'd' ? null : specs[i].d.beh) };
    });
    return { el: c, spec: combined };
  });
  const whole = out.every(({ spec: s }) => Object.values(s)
    .every((v) => Number.isInteger(v.w) && v.w > 0
    && (v.o === null || Number.isInteger(v.o))));
  return whole ? out : null;
}

/** An element the page hides (marked in onLoad from the live page's computed style). */
export const isHidden = (el) => el.getAttribute('data-corp-hidden') === 'true';

/**
 * Marks the elements the live page does not show (display: none at the import viewport) with
 * data-corp-hidden, for the builder to skip them (hideComponent, empty panels, modals).
 * Run in the import script's onLoad, on the live document. Inactive tab panes are not
 * marked, nor collapsed accordion panels: their content is the tab's / panel's.
 * Also keeps what the live page knows of each Marketo form (the forms2 script it loads and
 * the captcha), as data attributes on the form component.
 */
export function markLivePage(document) {
  const root = document.querySelector('#aem-specific-data') || document.body;
  root.querySelectorAll('*').forEach((el) => {
    // inactive tab panes and collapsed accordion panels hold content the user opens
    if (NOT_CONTENT.has(el.tagName) || el.matches('.tab-content, .panel-collapse')) return;
    const view = el.ownerDocument.defaultView;
    if (view && view.getComputedStyle(el).display === 'none') el.setAttribute('data-corp-hidden', 'true');
  });
  // a rich-text blank line (a paragraph of &nbsp; or line breaks only: one line on the live
  // page) is written as [[Blank line]] here: the Helix importer's preProcess drops a paragraph
  // whose text is one &nbsp; before the transform runs (ankle-truss-system: 3 in a white box
  // above "First of its kind…"; about 1000 on 226 product pages). Space-only paragraphs
  // take no room on the page and stay out
  // the product intro (.c-page-short-description, white-space: pre-wrap) ends its title with a
  // line break and its copy with an empty paragraph: on live each is a line of space (bone-vac
  // "Capture the gold": 45px title, 49px under the copy; 159 product pages)
  root.querySelectorAll('.c-page-short-description').forEach((box) => {
    box.querySelectorAll('h3, h2').forEach((h) => {
      const last = [...h.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim()).pop();
      if (last && last.nodeName === 'BR') {
        const p = h.ownerDocument.createElement('p');
        p.textContent = BLANK_LINE;
        h.after(p);
      }
    });
    box.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, br')) p.textContent = BLANK_LINE;
    });
  });
  root.querySelectorAll('.c-rich-text-editor p').forEach((p) => {
    if (p.closest('li, td, th') || p.querySelector('img, picture, iframe, video, input, svg')) return;
    const t = p.textContent;
    if (t.replace(/[\s\u00a0\u200b]/g, '') || !(t.includes('\u00a0') || p.querySelector('br'))) return;
    p.textContent = BLANK_LINE;
  });
  root.querySelectorAll('.c-marketo-form').forEach((form) => {
    const script = form.querySelector('script[src*="forms2"]');
    const m = script && script.getAttribute('src').match(/^((?:https?:)?\/\/[^/]+)/);
    if (m) form.setAttribute('data-corp-marketo-base', m[1]);
    const captcha = form.querySelector('altcha-widget[challengeurl]');
    if (captcha) form.setAttribute('data-corp-captcha', captcha.getAttribute('challengeurl'));
  });
}

/**
 * @param {object} options
 * @param {Document} options.doc the import document
 * @param {object} options.handlers { components: wrapper class (or #id) → handler(el, ctx),
 *   row(columns, widths, ctx): a responsive-grid row, fallback(el, ctx): unhandled components }
 * @param {string} options.source the source page path / URL, or the XF path (XF import)
 * @param {object} [options.facts] the page's page facts (data/page-facts/<template>.js)
 * @returns {object} ctx: collect(container) → items, place(items), render() → nodes, report
 */
export function createBuilder({
  doc, handlers, source, facts = null,
}) {
  const report = { unhandled: [], notes: [], hidden: 0 };
  const ctx = {
    doc, source, facts, report, handlers,
  };

  const { components } = handlers;
  const componentName = (el) => {
    if (el.id && components[`#${el.id}`]) return `#${el.id}`;
    const name = [...el.classList].find((c) => components[c]);
    if (name) return name;
    // column controls of any split (cols2_1-4_3-4 …) share the column-control handler
    return [...el.classList].some((c) => /^cols\d/.test(c)) ? 'cols*' : null;
  };
  // an AEM component nobody handles: its wrapper is a parbase, or it is a c-* component root
  const isComponent = (el) => [...el.classList].some((c) => c === 'parbase' || /^c-/.test(c));
  // a section title stays an anchor when hidden
  const keepHidden = (el) => el.matches('.section-title') || !!el.querySelector(':scope > .c-section-title[id]');

  ctx.unknown = (el, why = 'no handler') => {
    const label = `${String(el.className).trim().split(/\s+/)[0] || el.tagName.toLowerCase()}: ${text(el).slice(0, 50)}`;
    report.unhandled.push(`${label} (${why})`);
    return handlers.fallback ? handlers.fallback(el, ctx) : [];
  };

  const collectOne = (el) => {
    if (NOT_CONTENT.has(el.tagName)) return [];
    if (isHidden(el) && !keepHidden(el)) {
      report.hidden += 1;
      return [];
    }
    const name = componentName(el);
    if (name) {
      // (a handler that fails keeps its component as default content, reported, instead of
      // leaving the whole page to the cleanup's plain body)
      try {
        return components[name === 'cols*' ? 'cols' : name](el, ctx) || [];
      } catch (e) {
        return ctx.unknown(el, `handler failed: ${String(e && e.message).slice(0, 60)}`);
      }
    }
    if (isComponent(el)) return ctx.unknown(el);
    // content authored straight in a layout wrapper (rare): kept, reported
    if (/^(P|H[1-6]|UL|OL|TABLE|IMG|A)$/.test(el.tagName) && text(el)) return ctx.unknown(el, 'loose content');
    // a layout wrapper: its children (ctx.collect, defined below)
    return ctx.collect(el);
  };

  /**
   * The items of a container, in order. In a responsive grid of N columns (12, or a nested
   * grid's column width), columns narrower than N fill lines the AEM way (width + offset up
   * to N; a newline column starts a new line; columns hidden on the page take no room). Two
   * or more columns on a line are one row (e.g. image 4 + text 8, or 4 + 6 with 2 left
   * empty): handlers.row (the column-control rules) decides what they become, with each
   * column's layout at every breakpoint (gridSpec).
   */
  /**
   * The source component box of an element: the stryker.com .page-section it is (a column
   * control, a table …) or sits in, null outside any. Components in the same box (or both
   * outside any) stack flush on the source (only their lines' 15px); a new box starts with the
   * 20 / 30px component gap.
   */
  const boxOf = (el) => (el.classList.contains('page-section') ? el
    : el.querySelector(':scope > .page-section') || el.closest('.page-section') || null);
  const boxed = (items, el) => {
    const box = boxOf(el);
    items.forEach((it) => {
      if (it && typeof it === 'object' && !('box' in it)) it.box = box;
    });
    return items;
  };

  ctx.collect = function collect(container) {
    const out = [];
    const total = gridTotal(container);
    let run = [];
    let used = 0;
    const flush = () => {
      // a column alone on its line keeps its width and place too (going-the-distance-for-
      // front-line-heroes: the article text at 8/12 after 2): the row rules give it its
      // column styles. Only in a 12-column grid: in a nested grid (a column's own grid) a lone
      // column stays plain content of its cell, so the outer row keeps its columns (the Insignia
      // size-specific-collar XF: a 2/6 image in a 6/12 building block next to a 6/12 text)
      if ((run.length > 1 || (run.length && total === 12)) && handlers.row) {
        out.push(...boxed(handlers.row(
          run.map((r) => boxed(collectOne(r.el), r.el)),
          run.map((r) => r.spec.d.w),
          ctx,
          { specs: run.map((r) => r.spec), total },
        ), run[0].el));
      } else {
        run.forEach((r) => out.push(...boxed(collectOne(r.el), r.el)));
      }
      run = [];
      used = 0;
    };
    [...container.children].forEach((child) => {
      const spec = gridSpec(child);
      if (spec && spec.d.w < total) {
        if (isHidden(child) && !keepHidden(child)) {
          report.hidden += 1;
          return;
        }
        // (a building block: its nested grid's columns take its place in this row)
        const parts = total === 12 ? nestedColumns(child, spec) : null;
        (parts || [{ el: child, spec }]).forEach((part, k) => {
          const room = (part.spec.d.o || 0) + part.spec.d.w;
          const newline = k === 0 && spec.d.beh === 'newline';
          if (run.length && (used + room > total || newline)) flush();
          run.push(part);
          used += room;
          if (used >= total) flush();
        });
        return;
      }
      flush();
      out.push(...boxed(collectOne(child), child));
    });
    flush();
    return out;
  };
  ctx.collectOne = collectOne;

  /* ---------- placement ---------- */
  const sections = [];
  let current = null;
  let pendingIds = [];
  let pendingStyles = [];
  const context = [];

  const start = (kind, styles = []) => {
    const all = [...context, ...pendingStyles, ...styles].filter(Boolean);
    current = {
      kind, styles: [...new Set(all)], id: pendingIds[0] || null, nodes: [],
    };
    if (pendingIds.length > 1) report.notes.push(`anchors without content of their own, dropped: #${pendingIds.slice(1).join(', #')}`);
    pendingIds = [];
    pendingStyles = [];
    sections.push(current);
    return current;
  };
  const close = () => { current = null; };
  ctx.close = close;

  /** The section styles of a default-content node (copy size and font, box, alignment). */
  const nodeStyles = (node, item) => [
    item.centred ? 'center' : '',
    ...String(node.copyStyle || '').split(',').map((s) => s.trim()),
    node.boldBody ? 'bold-body' : '',
    ...(item.styles || []),
    ...(item.spacing || []),
  ].filter(Boolean);
  let spacedBoxes = 0;

  function placeFlow(item) {
    // blank lines (a blank-only text in a column control with other content) join the text
    // they follow
    if (item.role === 'blank' && current && current.key) {
      current.nodes.push(...item.nodes);
      return;
    }
    // an image (or image button) joins the default content it follows, whatever its copy style
    if ((item.role === 'image' || item.role === 'cta') && current && current.key && !current.spaced && !item.own) {
      current.nodes.push(...item.nodes);
      return;
    }
    // a box with its own padding / margin (spacing tokens), or an item marked own (a bordered
    // image, coloured buttons: their section style applies to them only), is a section of its own
    if (((item.spacing || []).length || item.own) && !item.spacedBox) {
      spacedBoxes += 1;
      item.spacedBox = spacedBoxes;
    }
    item.nodes.forEach((node) => {
      const styles = nodeStyles(node, item);
      const key = `flow:${styles.join(',')}${item.spacedBox ? `#${item.spacedBox}` : ''}`;
      // an Egyptienne h2 / h3 adds h-serif to its section; a Futura one after it starts a new
      // one. Likewise an h2 / h3 authored larger adds its size style (h-1-25 / h-1-5); one of
      // another size after it starts a new section
      let font = null;
      let size = null;
      if (/^H[23]$/.test(node.tagName)) {
        font = node.serifHeading ? 'serif' : 'futura';
        size = node.headingSize || 'plain';
      }
      if (!current || current.key !== key || (font && current.font && current.font !== font)
        || (size && current.headingSize && current.headingSize !== size)) {
        // a section split off the same source component (its copy changes style), or the next
        // component in the same source box (two text components in one column control),
        // continues it: no component gap before it (section style continued, approved 2026-10-31)
        // (components outside any box, e.g. the news article column's text, stack flush too)
        const sameBox = !!current && 'box' in item && current.box === item.box;
        const continues = !!current && (current.item === item || sameBox);
        start('flow', continues ? [...styles, 'continued'] : styles).key = key;
        current.spaced = !!item.spacedBox;
        current.item = item;
        current.box = item.box;
      }
      if (font) {
        if (font === 'serif' && current.font !== 'serif') current.styles.push('h-serif');
        current.font = font;
      }
      if (size) {
        if (size !== 'plain' && current.headingSize !== size) current.styles.push(size);
        current.headingSize = size;
      }
      current.nodes.push(node);
    });
  }

  function place(items) {
    items.forEach((item) => {
      switch (item.type) {
        case 'anchor':
          if (!pendingIds.includes(item.id)) pendingIds.push(item.id);
          close();
          break;
        case 'separator':
          pendingStyles.push('divider');
          close();
          break;
        case 'boundary':
          close();
          break;
        case 'spacer': {
          // empty component slots in a row (anchors between them too): one spacer section;
          // the anchors and pending styles stay for the next section with content
          close();
          const last = sections[sections.length - 1];
          if (last && last.kind === 'spacer') {
            last.slots += item.slots;
            last.lines += item.lines || 0;
          } else {
            // text and accordions outside any component box have no component gap of their
            // own on the source: the content before the slots ends flush (spacer, continued;
            // aed-pad-placement-guide: article text, an empty column control, the FAQs
            // accordion, another, Related: 15 + 31px and 0 + 31px)
            const flush = !!last && last.box === null && (!!last.key || last.kind === 'accordion');
            sections.push({
              kind: 'spacer', styles: [], id: null, nodes: [], slots: item.slots, lines: item.lines || 0, continued: flush,
            });
          }
          break;
        }
        case 'flow':
          placeFlow(item);
          break;
        case 'block':
          if (!current || !current.key) start('flow').key = 'flow:';
          current.nodes.push(item.block);
          break;
        case 'group':
          close();
          context.push(...item.styles);
          place(item.items);
          item.styles.forEach(() => context.pop());
          close();
          break;
        case 'own':
        case 'fragment':
        case 'form':
          start(item.kind || item.type, item.styles).nodes.push(...item.nodes);
          if ('box' in item) current.box = item.box;
          close();
          break;
        default:
          report.notes.push(`item of unknown type ${item.type} dropped`);
      }
    });
  }
  ctx.place = place;

  /** Appends a section built outside the walk (e.g. the page disclaimer). */
  ctx.addSection = (kind, styles, nodes) => {
    close();
    start(kind, styles).nodes.push(...nodes);
    close();
  };

  /** The sections as <hr>-separated content with their Section Metadata. */
  ctx.render = () => {
    if (pendingIds.length) report.notes.push(`anchors at the end without a section: #${pendingIds.join(', #')}`);
    if (pendingStyles.length) report.notes.push(`trailing ${pendingStyles.join(', ')} without a section after it, dropped`);
    const out = [];
    // a spacer section per up to 4 empty slots: spacer, spacer + large / xlarge / xxlarge
    // (1 to 4 component gaps), no-gap for blank lines alone; the first one also holds the
    // blank lines, lines-<n> (up to 8; styles-corp.css)
    const SPACER_SIZES = ['', 'large', 'xlarge', 'xxlarge'];
    const expanded = sections.flatMap((s) => {
      if (s.kind !== 'spacer') return [s];
      const parts = [];
      for (let left = s.slots; left > 0 || !parts.length; left -= 4) {
        const size = left > 0 ? SPACER_SIZES[Math.min(left, 4) - 1] : 'no-gap';
        const first = !parts.length;
        const lines = first && s.lines ? `lines-${Math.min(s.lines, 8)}` : '';
        if (first && s.lines > 8) report.notes.push(`${s.lines} blank lines in a row: 8 kept`);
        parts.push({ ...s, styles: ['spacer', size, lines, first && s.continued ? 'continued' : ''].filter(Boolean) });
      }
      return parts;
    });
    // a stripe (an empty coloured band) and a spacer are sections without content
    expanded.filter((s) => s.nodes.length || s.kind === 'stripe' || s.kind === 'spacer').forEach((section, i) => {
      if (i > 0) out.push(doc.createElement('hr'));
      // run sizes / fonts the section styles do not give → bracket tags (corp-richtext.js)
      finishRuns(section.nodes, section.styles);
      out.push(...section.nodes);
      const cells = {};
      if (section.styles.length) cells.style = section.styles.join(', ');
      if (section.id) cells.id = section.id;
      if (Object.keys(cells).length) {
        out.push(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells }));
      }
    });
    return out;
  };
  ctx.sections = sections;
  return ctx;
}
