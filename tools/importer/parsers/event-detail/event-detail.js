/* global WebImporter */

/**
 * Event detail page (www.stryker.com /global-events/**): rebuilds the body from the
 * AEM event component (.c-event-detail-component) and the Customizable Area below it.
 *
 * Output: the event title as H1; the visible fields as text in Columns (columns-67-33)
 * (main cell: meeting time, location, country, contact, details, disclaimer, registration;
 * sidebar cell: the "Related links"); then, on the few pages that have them, the
 * Customizable Area extras (Contact Us list, PDF downloads) as default content.
 * PRINT, the map and the commented-out Directions / ADD TO CALENDAR are not migrated.
 * Also returns the event facts for the page metadata.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/;

const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

// moment.js 'dddd MMMM DD, YYYY' of the wall-clock ISO value, as the source renders it
// (the live page has already formatted it: then the text is kept)
function formatDate(iso) {
  const m = iso.match(ISO);
  if (!m) return iso;
  const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
  return `${DAYS[day]} ${MONTHS[+m[2] - 1]} ${m[3]}, ${m[1]}`;
}

// moment.js 'h:mm a'
function formatTime(iso) {
  const m = iso.match(ISO);
  if (!m) return iso;
  const h = +m[4];
  return `${h % 12 || 12}:${m[5]} ${h < 12 ? 'am' : 'pm'}`;
}

const textOf = (el) => (el ? clean(el.textContent) : '');

/**
 * The ISO wall-clock date-time (YYYY-MM-DDTHH:mm:00) of a source date and time, ISO or as
 * rendered.
 */
function toIso(date, time) {
  const iso = date.match(ISO) || time.match(ISO);
  let ymd;
  if (date.match(ISO)) ymd = date.slice(0, 10);
  else {
    const d = date.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
    if (!d || !MONTHS.includes(d[1])) return '';
    ymd = `${d[3]}-${String(MONTHS.indexOf(d[1]) + 1).padStart(2, '0')}-${d[2].padStart(2, '0')}`;
  }
  if (time.match(ISO)) return `${ymd}T${time.match(ISO)[4]}:${time.match(ISO)[5]}:00`;
  const t = time.match(/(\d{1,2}):(\d{2})\s*([ap])m/i);
  if (!t) return iso ? `${ymd}T${iso[4]}:${iso[5]}:00` : ymd;
  const h = (+t[1] % 12) + (t[3].toLowerCase() === 'p' ? 12 : 0);
  return `${ymd}T${String(h).padStart(2, '0')}:${t[2]}:00`;
}

const isBlank = (el) => !clean(el.textContent) && !el.querySelector('img, a');

/** Splits a node's content on <br> into lines of cloned inline nodes (empty lines dropped). */
function lines(el) {
  const out = [[]];
  [...el.childNodes].forEach((n) => {
    if (n.nodeName === 'BR') out.push([]);
    else out[out.length - 1].push(n.cloneNode(true));
  });
  return out.filter((l) => l.some((n) => clean(n.textContent)));
}

function para(doc, nodes) {
  const p = doc.createElement('p');
  (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => p.append(n));
  const first = p.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = p.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return p;
}

function heading(doc, text, level = 'h5') {
  const h = doc.createElement(level);
  h.textContent = text;
  return h;
}

/** Heading fully underlined: the authoring convention for a heading with a bottom border. */
function dividerHeading(doc, text) {
  const h = doc.createElement('h5');
  const u = doc.createElement('u');
  u.textContent = text;
  h.append(u);
  return h;
}

/** Trimmed href; `Mailtoa@b.com` / `Mailto:` become `mailto:`, `Tel:` / spaced numbers `tel:`. */
export function normalizeHref(href) {
  const value = (href || '').trim();
  if (/^mailto:?[^/]*@/i.test(value)) return value.replace(/^mailto:?\s*/i, 'mailto:');
  if (/^tel:?\s*\+?[\d(]/i.test(value)) return `tel:${value.replace(/^tel:?/i, '').replace(/\s/g, '')}`;
  return value;
}

function link(doc, a, text) {
  const out = doc.createElement('a');
  out.href = normalizeHref(a.getAttribute('href'));
  out.textContent = text || clean(a.textContent);
  return out;
}

// <b> → <strong>, presentational <span> unwrapped
function tidy(doc, p) {
  p.querySelectorAll('span').forEach((s) => s.replaceWith(...s.childNodes));
  p.querySelectorAll('b').forEach((b) => {
    const s = doc.createElement('strong');
    s.append(...b.childNodes);
    b.replaceWith(s);
  });
  return p;
}

/** The paragraphs of a container: every <p>/<div> and every <br>-separated line is a <p>. */
function paragraphs(doc, container) {
  const out = [];
  let inline = [];
  const flush = () => {
    if (!inline.length) return;
    const holder = doc.createElement('div');
    holder.append(...inline);
    inline = [];
    lines(holder).forEach((l) => out.push(para(doc, l)));
  };
  [...container.childNodes].forEach((n) => {
    if (n.nodeType === 1 && /^(P|DIV)$/.test(n.nodeName)) {
      flush();
      if (n.querySelector('p, div, ul, ol')) out.push(...paragraphs(doc, n));
      else lines(n).forEach((l) => out.push(para(doc, l)));
    } else if (n.nodeType === 1 && /^(UL|OL)$/.test(n.nodeName)) {
      flush();
      out.push(n.cloneNode(true));
    } else if (n.nodeType === 1 && /^H[1-6]$/.test(n.nodeName)) {
      flush();
    } else {
      inline.push(n.cloneNode(true));
    }
  });
  flush();
  return out.map((p) => tidy(doc, p));
}

export default function parse(document) {
  const doc = document;
  const comp = doc.querySelector('.c-event-detail-component');
  if (!comp) return null;
  // the Directions / ADD TO CALENDAR links are HTML comments
  const walker = doc.createTreeWalker(comp, 128);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());

  const facts = { title: clean(comp.querySelector('h2')?.textContent) };
  const main = [];

  // meeting time: "<start date> - <end date>" / "<start time> to <end time> [time zone]"
  const dt = comp.querySelector('.event-datetime-wrap');
  if (dt) {
    const start = textOf(dt.querySelector('.eventStartDate-wrap'));
    const end = textOf(dt.querySelector('.eventEndDate-wrap'));
    const endTimeEl = dt.querySelector('.eventEndTime-wrap');
    const startTime = textOf(dt.querySelector('.eventStartTime-wrap')) || start;
    const endTime = textOf(endTimeEl) || end;
    let tz = '';
    for (let n = endTimeEl && endTimeEl.nextSibling; n; n = n.nextSibling) tz += n.textContent;
    tz = clean(tz);
    facts.start = toIso(start, startTime);
    facts.end = toIso(end, endTime);
    if (tz) facts.timezone = tz;
    main.push(heading(doc, clean(dt.querySelector('h5')?.textContent) || 'Meeting time'));
    const p = doc.createElement('p');
    p.append(
      `${formatDate(start)} - ${formatDate(end)}`,
      doc.createElement('br'),
      `${formatTime(startTime)} to ${formatTime(endTime)}${tz ? ` ${tz}` : ''}`,
    );
    main.push(p);
  }

  // location + country: each the <p> after its <h5>; address lines joined with ", "
  const loc = comp.querySelector('.event-location-wrap');
  if (loc) {
    loc.querySelectorAll('h5').forEach((h5) => {
      const label = clean(h5.textContent);
      let p = h5.nextElementSibling;
      while (p && p.nodeName !== 'P') p = p.nextElementSibling;
      if (!p) return;
      const value = lines(p).map((l) => clean(l.map((n) => n.textContent).join(''))).filter(Boolean).join(', ');
      if (!value) return;
      if (/^location$/i.test(label)) facts.location = value;
      if (/^country$/i.test(label)) facts.country = value;
      main.push(heading(doc, label), para(doc, value));
    });
  }

  // contact: name + mailto link
  const contact = comp.querySelector('.event-contact-wrap');
  if (contact) {
    const a = contact.querySelector('a[href]');
    const box = (a && a.closest('p')) || contact.querySelector('h5 ~ p');
    const rest = box ? box.cloneNode(true) : doc.createElement('p');
    rest.querySelectorAll('a').forEach((el) => el.remove());
    const name = clean(rest.textContent);
    if (name || a) {
      main.push(heading(doc, clean(contact.querySelector('h5')?.textContent) || 'Contact'));
      const p = doc.createElement('p');
      if (name) p.append(name);
      if (name && a) p.append(doc.createElement('br'));
      if (a) p.append(link(doc, a));
      main.push(p);
      if (name) facts.contactName = name;
      if (a) facts.contactEmail = normalizeHref(a.getAttribute('href')).replace(/^mailto:/, '');
    }
  }

  // details: underlined H5 (divider) + the paragraphs
  const details = comp.querySelector('.event-details-wrap');
  if (details) {
    const body = paragraphs(doc, details).filter((p) => p.nodeName !== 'P' || !isBlank(p));
    if (body.length) {
      main.push(dividerHeading(doc, clean(details.querySelector('h5')?.textContent) || 'Details'), ...body);
    }
  }

  // disclaimer: its paragraph(s), "Disclaimer:" bold as on the source
  const disclaimer = comp.querySelector('.event-disclaimer-wrap');
  if (disclaimer) main.push(...paragraphs(doc, disclaimer).filter((p) => !isBlank(p)));

  // registration: underlined H5 (divider) + the link alone on its line in bold (primary
  // button, source label) + any sentence below it
  const reg = comp.querySelector('.event-registration-wrap');
  if (reg) {
    const a = [...reg.querySelectorAll('a[href]')].find((el) => clean(el.textContent));
    if (a) reg.querySelectorAll('a[href]').forEach((el) => el.closest('div:not(.event-registration-wrap)')?.remove());
    const rest = paragraphs(doc, reg).filter((p) => p.nodeName !== 'P' || !isBlank(p));
    if (a || rest.length) {
      main.push(dividerHeading(doc, clean(reg.querySelector('h5')?.textContent) || 'Registration'));
      if (a) {
        facts.registration = a.getAttribute('href').trim();
        const strong = doc.createElement('strong');
        strong.append(link(doc, a));
        main.push(para(doc, strong));
      }
      main.push(...rest);
    }
  }

  // sidebar: "Related links" heading + its links (the map is not migrated)
  const side = [];
  comp.querySelectorAll('.event-sidebar h5').forEach((h5) => {
    const links = [...h5.parentElement.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));
    if (!links.length) return;
    side.push(heading(doc, clean(h5.textContent)));
    links.forEach((a) => side.push(para(doc, link(doc, a))));
  });

  // Customizable Area below the event component: title, rich text, PDF downloads
  const extras = [];
  [...doc.querySelectorAll('.c-title h2, .c-rich-text-editor, .c-resourcesanddownload .item')]
    // DOCUMENT_POSITION_FOLLOWING (4) is set, possibly with CONTAINED_BY (16)
    .filter((el) => comp.compareDocumentPosition(el) % 8 >= 4
      && !el.closest('footer, #footer, header, #header'))
    .forEach((el) => {
      if (el.matches('h2')) {
        extras.push(heading(doc, clean(el.textContent), 'h2'));
      } else if (el.matches('.item')) {
        const a = [...el.querySelectorAll('a[href]')].pop();
        const label = clean(a?.textContent) || clean(el.querySelector('img')?.getAttribute('alt'));
        if (a) extras.push(para(doc, link(doc, a, label)));
      } else {
        // a name ends with the <br> inside its bold: move it out so the email stays on its own line
        el.querySelectorAll('b br, strong br, span br').forEach((br) => {
          let host = br;
          const trailing = (n) => {
            for (let x = n.nextSibling; x; x = x.nextSibling) {
              if (clean(x.textContent)) return false;
            }
            return true;
          };
          const inline = (n) => /^(B|STRONG|SPAN)$/.test(n.parentElement?.nodeName);
          while (inline(host) && trailing(host)) host = host.parentElement;
          if (host !== br) host.after(br);
        });
        [...(el.querySelector(':scope > div') || el).querySelectorAll('p')].filter((p) => !isBlank(p)).forEach((src) => {
          const p = tidy(doc, src.cloneNode(true));
          while (p.lastChild && (p.lastChild.nodeName === 'BR' || (p.lastChild.nodeType === 3 && !clean(p.lastChild.textContent)))) p.lastChild.remove();
          extras.push(p);
        });
      }
    });

  const columns = WebImporter.Blocks.createBlock(doc, {
    name: 'Columns (columns-67-33)',
    cells: [[main, side.length ? side : '']],
  });

  return {
    facts,
    title: heading(doc, facts.title, 'h1'),
    columns,
    extras,
  };
}
