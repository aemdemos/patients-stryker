/* global WebImporter */
import marketoFormParser from '../parsers/news-detail/marketo-form.js';
import { xfToFragmentPath } from '../xf-fragment-path.js';

/**
 * Transformer: www.stryker.com division "Contact us" pages (template contact-division, #509).
 *
 * beforeTransform rebuilds <body> from the page's own parts, in source order:
 *   1. the page title (.h1-title h1; without one, the <title> minus " | Stryker"), the
 *      contact heading (underlined Heading 2: the grey rule, authoring conventions) and a
 *      `Columns (columns-50-50)` block: cell 1 the addresses, labels (Heading 4), phone
 *      numbers, email addresses and links; cell 2 a Google Maps link to the address.
 *   2. the Customizable Area: section titles (underlined Heading 2, the title's id as the
 *      section id), rich text, Marketo forms (`Marketo Form` block), the division contact
 *      form's heading and description (the AEM form itself is not migrated), a shared
 *      Experience Fragment as a `Fragment` block. A form beside text in a 1/3 + 2/3 column
 *      row is a `flex, flex-33-67` (or `flex, flex-67-33`) section; text above or below the
 *      form in the form's column goes into the sections before / after it.
 *   3. document numbers (.c-disclaimer, a small-print line under a form) in a closing
 *      `disclaimer` section.
 * Phone links get a clean `tel:+1XXXXXXXXXX` href built from the number; fax numbers, hours
 * and other words are plain text; an email address in a phone line is a mailto: link.
 * Every rewrite is recorded in payload.contactReport for the import report.
 */

const TEMPLATE = 'contact-division';

// Experience Fragments shown in the pages' Customizable Area. The page HTML carries the
// XF's content but not its path, so the slot is mapped per page (source path → XF path).
const PAGE_XFS = {
  '/us/en/smart-care/contact': '/content/experience-fragments/stryker/smart_care/en/business_unit/footer-links/master',
};

// phone keypad letters of the digits 2-9 (a vanity number such as 800-STRYKER)
const KEYPAD = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const VANITY = /\b\d{3}-[A-Z]{7}\b/;

const text = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');

function sourcePath(payload) {
  const url = (payload.params && payload.params.originalURL) || payload.url || '';
  try {
    return new URL(url).pathname.replace(/\.html?$/, '');
  } catch (e) {
    return '';
  }
}

function el(doc, tag, ...children) {
  const node = doc.createElement(tag);
  node.append(...children);
  return node;
}

function link(doc, href, label) {
  const a = el(doc, 'a', label);
  a.setAttribute('href', href);
  return a;
}

const underlined = (doc, tag, label) => el(doc, tag, el(doc, 'u', label));

/** The rich text of a source component, without its spans, styles and empty lines. */
function richNodes(container, doc) {
  const root = container.querySelector('.left-to-right') || container;
  const clone = root.cloneNode(true);
  // a standalone link (uppercase teal with a chevron): a bold + underlined link
  clone.querySelectorAll('a').forEach((a) => {
    if (!a.querySelector('.standalone-link')) return;
    a.replaceChildren(el(doc, 'u', text(a)));
    if (!a.closest('.futura-bold')) a.replaceWith(el(doc, 'strong', a.cloneNode(true)));
  });
  // Futura bold: corp <strong>
  clone.querySelectorAll('span.futura-bold').forEach((span) => {
    if (span.querySelector('strong') || span.closest('strong')) span.replaceWith(...span.childNodes);
    else span.replaceWith(el(doc, 'strong', ...span.childNodes));
  });
  clone.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
  clone.querySelectorAll('*').forEach((node) => {
    ['style', 'class', 'target', 'rel', 'id'].forEach((name) => node.removeAttribute(name));
  });
  clone.querySelectorAll('p > br:last-child').forEach((br) => br.remove());
  return [...clone.children].filter((node) => text(node) || node.querySelector('img'));
}

/** A doc number: a text component that is only small print (span.fontsize-8em). */
function isDocNumber(component) {
  const small = [...component.querySelectorAll('span.fontsize-8em')].map(text).join(' ');
  return !!small && small === text(component);
}

/** One contact line (a phone, email or link paragraph) as a paragraph. */
function contactLine(p, label, doc, report) {
  const a = p.querySelector('a');
  const value = text(p);
  if (!value) return null;
  const out = doc.createElement('p');
  const href = a ? a.getAttribute('href') || '' : '';
  const note = (to) => report.phones.push({
    text: value, href, to, label,
  });
  if (p.matches('.email-address, .link-item')) {
    out.append(link(doc, href, value));
    return out;
  }
  // phone-number lines
  if (/^[^\s@]+@[^\s@]+\.[a-z]+$/i.test(value)) {
    out.append(link(doc, `mailto:${value}`, value));
    note(`mailto:${value}`);
    return out;
  }
  const isFax = /\bfax\b/i.test(value) || /\bfax\b/i.test(label);
  let match = value.match(PHONE);
  let digits = match && match[0].replace(/\D/g, '');
  if (!match) {
    match = value.match(VANITY);
    digits = match && match[0].replace(/[A-Z]/g, (c) => KEYPAD.findIndex((keys) => keys.includes(c)) + 2).replace(/\D/g, '');
  }
  if (isFax || !match) {
    out.textContent = value;
    note(isFax && match ? 'plain text (fax)' : 'plain text');
    return out;
  }
  const number = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const telHref = `tel:${number}`;
  const before = value.slice(0, match.index);
  const after = value.slice(match.index + match[0].length);
  // a vanity number keeps its digits in brackets, e.g. "800-STRYKER (787-9537)": one link
  const vanity = !PHONE.test(value) && /^\s*\([\d-]+\)\s*$/.test(after);
  const linked = vanity ? `${match[0]}${after}` : match[0];
  if (before) out.append(before);
  out.append(link(doc, telHref, linked));
  if (after && !vanity) out.append(after);
  if (href !== telHref || linked !== value) note(telHref);
  return out;
}

/** The address paragraphs of a contact group as one paragraph with line breaks. */
function addressLines(holder, doc) {
  const lines = [];
  holder.querySelectorAll('p').forEach((p) => {
    let line = '';
    p.childNodes.forEach((node) => {
      if (node.nodeName === 'BR') {
        lines.push(line);
        line = '';
      } else {
        line += node.textContent;
      }
    });
    lines.push(line);
  });
  const clean = lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!clean.length) return null;
  const p = doc.createElement('p');
  clean.forEach((line, i) => {
    if (i) p.append(doc.createElement('br'));
    p.append(line);
  });
  return p;
}

/** The Google Maps link of the contact map (its data-address, one line). */
function mapLink(contactus, doc) {
  const map = contactus.querySelector('[data-address]');
  if (!map) return null;
  const lines = map.getAttribute('data-address')
    .split(/<br\s*\/?>|<\/p>/i)
    .map((line) => line.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const address = lines.join(', ');
  return el(doc, 'p', link(doc, `https://www.google.com/maps?q=${encodeURIComponent(address)}`, address));
}

/** The contact component: underlined heading + Columns (contact details | map link). */
function contactUs(contactus, doc, report) {
  const nodes = [];
  const heading = contactus.querySelector('h2.component-subheading');
  if (text(heading)) nodes.push(underlined(doc, 'h2', text(heading)));
  const details = [];
  const parts = contactus.querySelectorAll([
    '.info h3.component-subheading', '.info p.contact-description', '.info h4.contact-label',
    '.info .contact-group > div:not([class])', '.info p.phone-number', '.info p.email-address',
    '.info p.link-item',
  ].join(', '));
  parts.forEach((part) => {
    if (part.matches('h3, h4')) {
      if (text(part)) details.push(el(doc, part.tagName.toLowerCase(), text(part)));
    } else if (part.matches('p.contact-description')) {
      details.push(...richNodes(el(doc, 'div', part.cloneNode(true)), doc));
    } else if (part.matches('div')) {
      const address = addressLines(part, doc);
      if (address) details.push(address);
    } else {
      const subgroup = part.closest('.contact-subgroup');
      const label = text(subgroup && subgroup.querySelector('h4.contact-label'));
      const line = contactLine(part, label, doc, report);
      if (line) details.push(line);
    }
  });
  const map = mapLink(contactus, doc);
  if (details.length || map) {
    const cells = [[details, map ? [map] : '']];
    nodes.push(WebImporter.Blocks.createBlock(doc, { name: 'Columns (columns-50-50)', cells }));
  }
  return nodes;
}

function marketoBlock(component, doc) {
  const holder = el(doc, 'div', component.cloneNode(true));
  marketoFormParser(holder.firstElementChild, { document: doc });
  return holder.firstElementChild ? [holder.firstElementChild] : [];
}

function fragmentBlock(xf, doc) {
  const path = xfToFragmentPath(xf);
  if (!path) return [];
  return [WebImporter.Blocks.createBlock(doc, { name: 'Fragment', cells: [[link(doc, path, path)]] })];
}

/** A section title: underlined Heading 2, any subtitle as on the source, the title's id. */
function sectionTitle(component, doc) {
  const title = component.querySelector('.c-section-title');
  const nodes = [];
  title.querySelectorAll('.title-container > *').forEach((node) => {
    if (!text(node)) return;
    if (node.matches('h2')) nodes.push(underlined(doc, 'h2', text(node)));
    else nodes.push(el(doc, node.tagName.toLowerCase(), text(node)));
  });
  return { nodes, id: title.getAttribute('id') || '' };
}

/** The division contact form: its heading and description; the form is not migrated. */
function divisionContactUs(component, doc) {
  const form = component.querySelector('form');
  if (!form) return [];
  const nodes = [];
  const heading = form.querySelector('h2');
  if (text(heading)) nodes.push(underlined(doc, 'h2', text(heading)));
  const description = form.querySelector('.form-description');
  if (description) {
    const clone = description.cloneNode(true);
    clone.querySelectorAll('.form-control-asterix').forEach((star) => star.remove());
    if (text(clone)) nodes.push(el(doc, 'p', text(clone)));
  }
  return nodes;
}

/**
 * The parts of a component, in order: { nodes, style, id, own } (own: a section of its
 * own). Doc numbers go to `small`.
 */
function componentParts(component, doc, ctx) {
  const cls = component.classList;
  if (cls.contains('section-title')) {
    const { nodes, id } = sectionTitle(component, doc);
    return nodes.length ? [{ nodes, id }] : [];
  }
  if (cls.contains('text')) {
    if (isDocNumber(component)) {
      ctx.small.push(...richNodes(component, doc));
      return [];
    }
    const nodes = richNodes(component, doc);
    return nodes.length ? [{ nodes }] : [];
  }
  if (cls.contains('marketoform')) {
    const nodes = marketoBlock(component, doc);
    return nodes.length ? [{ nodes, form: true }] : [];
  }
  if (cls.contains('divisioncontactus')) {
    const nodes = divisionContactUs(component, doc);
    if (component.querySelector('form')) {
      ctx.report.notes.push(`AEM division contact form (${text(component.querySelector('form h2')) || 'no heading'}): heading and description kept if present, form not migrated`);
    }
    return nodes.length ? [{ nodes }] : [];
  }
  if (cls.contains('experiencefragment')) {
    if (!text(component)) return [];
    const xf = PAGE_XFS[ctx.path];
    if (!xf) {
      ctx.report.notes.push('Experience Fragment without a mapped XF path: not migrated');
      return [];
    }
    const nodes = fragmentBlock(xf, doc);
    ctx.report.fragments.push(nodes.length ? xfToFragmentPath(xf) : xf);
    return [{ nodes, own: true }];
  }
  if ([...cls].some((c) => /^cols/.test(c))) return ctx.columnRow(component, doc, ctx);
  if (cls.contains('fullWidthImage')) {
    ctx.report.notes.push('full-width decorative image (gold line) dropped');
    return [];
  }
  if (text(component)) ctx.report.notes.push(`unhandled component "${component.className}" dropped`);
  return [];
}

/** A column row (cols*): its components; a form beside text becomes a flex section. */
function columnRow(component, doc, ctx) {
  const columns = [...component.querySelectorAll(':scope > .colctrl > .row > [class*="col-"]')];
  const parts = (col) => {
    const inner = col.querySelector(':scope > .row') || col;
    return [...inner.children].flatMap((child) => componentParts(child, doc, ctx));
  };
  const formAt = columns.findIndex((col) => col.querySelector('.marketoform form[data-marketo-form-id]'));
  const columnParts = columns.map(parts);
  if (formAt < 0 || columns.length !== 2 || !columnParts[formAt].some((part) => part.form)) {
    return columnParts.flat();
  }
  const other = columnParts[1 - formAt];
  const own = columnParts[formAt];
  const formIndex = own.findIndex((part) => part.form);
  const above = own.slice(0, formIndex);
  const below = own.slice(formIndex + 1);
  const form = own[formIndex];
  if (!other.length) return [...above, form, ...below];
  const width = columns[formAt].className.match(/col-sm-(\d+)/);
  const formWide = width && Number(width[1]) > 6;
  const layout = formAt === 0 ? 'flex-67-33' : 'flex-33-67';
  const nodes = formAt === 0
    ? [...form.nodes, ...other.flatMap((part) => part.nodes)]
    : [...other.flatMap((part) => part.nodes), ...form.nodes];
  if (!formWide) ctx.report.notes.push(`form column is not the wide one (${columns[formAt].className})`);
  return [...above, { nodes, style: `flex, ${layout}`, own: true }, ...below];
}

function sectionMetadata(doc, section) {
  const cells = {};
  if (section.style) cells.style = section.style;
  if (section.id) cells.id = section.id;
  return Object.keys(cells).length
    ? [WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells })] : [];
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || payload.template.name !== TEMPLATE) return;
  const doc = element.ownerDocument;
  const report = payload.contactReport || {};
  ['phones', 'notes', 'fragments'].forEach((key) => { report[key] = report[key] || []; });
  const ctx = {
    path: sourcePath(payload), report, small: [], columnRow,
  };
  const main = doc.querySelector('div.main.content.row') || element;

  // 1. title + contact details
  const first = [];
  const h1 = main.querySelector('.h1-title h1');
  const title = text(h1) || doc.title.replace(/\s*\|\s*Stryker\s*$/i, '').trim();
  if (!text(h1)) report.notes.push(`no visible H1: H1 "${title}" from the page title`);
  if (title) first.push(el(doc, 'h1', title));
  const contactus = main.querySelector('.c-contactus');
  if (contactus) first.push(...contactUs(contactus, doc, report));

  // 2. the Customizable Area (the main row's children after the contact component)
  const areas = [...main.children].filter((child) => !child.querySelector('.h1-title, .c-contactus')
    && !child.matches('.h1-title, .c-contactus'));
  const parts = areas.flatMap((area) => [...area.children])
    .flatMap((component) => componentParts(component, doc, ctx));

  // consecutive plain parts share a section; a styled part or a fragment is its own
  const sections = [{ nodes: first }];
  parts.forEach((part) => {
    const last = sections[sections.length - 1];
    if (!part.own && !part.style && !last.own && !last.style && sections.length > 1
      && !(part.id && last.id)) {
      last.nodes.push(...part.nodes);
      if (part.id) last.id = part.id;
    } else {
      sections.push({ ...part, nodes: [...part.nodes] });
    }
  });

  // 3. document numbers
  doc.querySelectorAll('.c-disclaimer:not([data-widget])').forEach((disclaimer) => {
    ctx.small.push(...richNodes(disclaimer, doc));
  });
  if (ctx.small.length) sections.push({ nodes: ctx.small, style: 'disclaimer' });

  const out = [];
  sections.filter((section) => section.nodes.length).forEach((section, i) => {
    if (i > 0) out.push(doc.createElement('hr'));
    out.push(...section.nodes, ...sectionMetadata(doc, section));
  });
  element.replaceChildren(...out);
}
