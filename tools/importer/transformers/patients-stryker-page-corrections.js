/* eslint-disable */
/* global WebImporter */
// Persisted content edits (excat-persist-content-edit). Page corrections run on the page body for
// their URL; fragment corrections run on a fragment the import splits out, whichever page writes it.
// Keep `export default` the only export: the transformer save hook loads this file as a classic script.

// ---- helpers for the text-only news pages (import-text-only.js) -------------------------
// The DOM here is the importer's: section breaks are <hr>, Section Metadata is a <table>.
// Every helper finds its target by text and does nothing when it is missing or already done.

const txt = (el) => (el ? el.textContent : '').replace(/[\s ]+/g, ' ').trim();

/** The next / previous sibling node, skipping whitespace-only text. */
const isBlank = (n) => n && n.nodeType === 3 && !n.textContent.trim();
function nextOf(n) {
  let x = n && n.nextSibling;
  while (isBlank(x)) x = x.nextSibling;
  return x;
}
function prevOf(n) {
  let x = n && n.previousSibling;
  while (isBlank(x)) x = x.previousSibling;
  return x;
}

/** The first `sel` element whose text starts with `start`. */
const find = (main, sel, start) => [...main.querySelectorAll(sel)].find((el) => txt(el).startsWith(start));

/** The top-level child of `main` holding `el`. */
function topOf(main, el) {
  let node = el;
  while (node && node.parentElement !== main) node = node.parentElement;
  return node;
}

/** The top-level elements of the section holding `el` (between <hr> markers). */
function sectionOf(main, el) {
  const kids = [...main.children];
  const i = kids.indexOf(topOf(main, el));
  if (i < 0) return [];
  let s = i;
  while (s > 0 && kids[s - 1].tagName !== 'HR') s -= 1;
  let e = i;
  while (e < kids.length - 1 && kids[e + 1].tagName !== 'HR') e += 1;
  return kids.slice(s, e + 1);
}

const isSectionMetadata = (el) => el && el.tagName === 'TABLE'
  && txt(el.querySelector('th, td')).toLowerCase() === 'section metadata';

/** Sets (or, with `value` null, removes) the style of the section holding `el`. */
function style(main, doc, el, value) {
  if (!el) return;
  const section = sectionOf(main, el);
  const table = section.find(isSectionMetadata);
  if (!value) {
    if (table) table.remove();
    return;
  }
  if (table) {
    const row = [...table.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
    if (row) { row.cells[1].textContent = value; return; }
    table.remove();
  }
  section[section.length - 1].after(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: value } }));
}

/** Starts a new section at `el`, with style `value` (or none); the part before keeps its style. */
function breakBefore(main, doc, el, value) {
  if (!el) return;
  const top = topOf(main, el);
  if (top.previousElementSibling?.tagName === 'HR') { style(main, doc, el, value); return; }
  const table = sectionOf(main, el).find(isSectionMetadata);
  const hr = doc.createElement('hr');
  top.before(hr);
  if (table) hr.before(table);
  if (value) style(main, doc, el, value);
}

/** Ends the section after `el`; the section style stays below, or with `el` (`keepStyle`). */
function breakAfter(main, doc, el, { keepStyle = false } = {}) {
  if (!el) return;
  const top = topOf(main, el);
  if (top.nextElementSibling?.tagName === 'HR') return;
  const table = sectionOf(main, el).find(isSectionMetadata);
  const hr = doc.createElement('hr');
  top.after(hr);
  if (keepStyle && table) hr.before(table);
}

/** Joins the section holding `el` to the one before it (its own style goes). */
function mergeWithPrevious(main, el) {
  if (!el) return;
  const section = sectionOf(main, el);
  const hr = section[0].previousElementSibling;
  if (!hr || hr.tagName !== 'HR') return;
  section.filter(isSectionMetadata).forEach((t) => t.remove());
  const before = hr.previousElementSibling;
  hr.remove();
  const rest = sectionOf(main, section.find((n) => n.isConnected) || before);
  if (isSectionMetadata(before)) rest[rest.length - 1].after(before);
}

/** Replaces `el` with a `tag` element holding its content. */
function retag(main, doc, el, tag) {
  if (!el || el.tagName.toLowerCase() === tag) return el;
  const out = doc.createElement(tag);
  out.append(...el.childNodes);
  el.replaceWith(out);
  return out;
}

/** The subtitle under the title: an italic Heading 3 in a section of its own. */
function subtitle(main, doc, el, { em = false, split = true } = {}) {
  const h3 = retag(main, doc, el, 'h3');
  if (!h3) return;
  if (em && !h3.querySelector('em')) {
    const i = doc.createElement('em');
    i.append(...h3.childNodes);
    h3.append(i);
  }
  if (split) breakAfter(main, doc, h3);
}

/** `<p><strong>Label</strong></p><p>text</p>` → `<p><strong>Label</strong><br>text</p>`. */
function joinLabel(main, doc, label) {
  [...main.querySelectorAll('p')].filter((p) => txt(p) === label && txt(p.querySelector('strong')) === label).forEach((p) => {
    const next = p.nextElementSibling;
    if (!next || next.tagName !== 'P') return;
    p.append(doc.createElement('br'), ...next.childNodes);
    next.remove();
  });
}

/** Joins paragraph `p` onto the paragraph before it, after `breaks` line breaks. */
function joinParagraph(doc, p, breaks = 2) {
  const prev = p && p.previousElementSibling;
  if (!prev || prev.tagName !== 'P') return;
  for (let i = 0; i < breaks; i += 1) prev.append(doc.createElement('br'));
  prev.append(...p.childNodes);
  p.remove();
}

/** Makes the whole of `el` bold. */
function boldAll(main, doc, el) {
  if (!el || (el.children.length === 1 && el.firstElementChild.tagName === 'STRONG' && txt(el) === txt(el.firstElementChild))) return;
  const b = doc.createElement('strong');
  b.append(...el.childNodes);
  el.append(b);
}

/** A bold run with line breaks inside → one bold run per line, the breaks between them. */
function boldPerLine(strong, doc) {
  if (!strong || !strong.querySelector('br')) return;
  const parts = [[]];
  [...strong.childNodes].forEach((n) => (n.nodeName === 'BR' ? parts.push([]) : parts[parts.length - 1].push(n)));
  const out = [];
  parts.forEach((nodes, i) => {
    if (i) out.push(doc.createElement('br'));
    const b = doc.createElement('strong');
    b.append(...nodes);
    out.push(b);
  });
  strong.replaceWith(...out);
}

/** A line break opening a bold label moves in front of it (`<strong><br>X` → `<br><strong>X`). */
function brBeforeLabel(p) {
  const b = p && p.querySelector('strong');
  if (b && b.firstChild?.nodeName === 'BR') b.before(b.firstChild);
}

/** Opens the links to these addresses in a new tab (`#_blank`, scripts.js). */
function newTab(main, hrefs) {
  hrefs.forEach((h) => main.querySelectorAll(`a[href="${h}"]`).forEach((a) => a.setAttribute('href', `${h}#_blank`)));
}

/** The DA `tags` metadata (not on the source page): import-text-only.js writes `data-meta-*`. */
function tags(main, value) {
  main.setAttribute('data-meta-tags', value);
}

/**
 * Numbered reference paragraphs ("1. …<br><br>2. …", "3. …") from `first` on → an
 * ordered list in a `disclaimer` section, after a `spacer` section.
 */
function footnotesToList(main, doc, first) {
  if (!first) return;
  const paras = [];
  for (let p = first; p && p.tagName === 'P' && /^\d+\./.test(txt(p)); p = p.nextElementSibling) paras.push(p);
  const ol = doc.createElement('ol');
  paras.forEach((p) => {
    let item = [];
    const flush = () => {
      if (!item.length) return;
      const li = doc.createElement('li');
      li.append(...item);
      if (li.firstChild?.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s*\d+\.\s*/, '');
      ol.append(li);
      item = [];
    };
    [...p.childNodes].forEach((n) => {
      if (n.nodeName === 'BR' && nextOf(n)?.nodeName === 'BR') { flush(); return; }
      if (n.nodeName === 'BR' && prevOf(n)?.nodeName === 'BR') return;
      if (isBlank(n) && (nextOf(n)?.nodeName === 'BR' || prevOf(n)?.nodeName === 'BR') && !item.length) return;
      item.push(n);
    });
    flush();
  });
  const last = paras[paras.length - 1];
  const hr1 = doc.createElement('hr');
  const hr2 = doc.createElement('hr');
  last.after(hr1, WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: 'spacer' } }), hr2, ol);
  paras.forEach((p) => p.remove());
  ol.after(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: 'disclaimer' } }));
}

const CORRECTIONS = {
  // text-only news pages (import-text-only.js): the edits authors made in DA after the
  // import, so a re-import gives the reviewed page; `tags` is the DA metadata row
  // stryker-announces-definitive-agreement-to-acquire-artelon--inc--
  'https://www.stryker.com/us/en/about/news/2024/stryker-announces-definitive-agreement-to-acquire-artelon--inc--.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-care-ai
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-care-ai.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad
  'https://www.stryker.com/us/en/about/news/2024/stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-nico-corporation--expanding-min
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-nico-corporation--expanding-min.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-molli-surgical
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-molli-surgical.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-artelon-inc
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-artelon-inc.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-serf-sas
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-serf-sas.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      style(m, d, find(m, 'p', 'Forward-looking statements'), null);
      ['About Menix', 'About SERF SAS', 'Media contact'].forEach((label) => joinLabel(m, d, label));
    },
  ],
  // stryker-expands-foot---ankle-portfolio-with-specialized-offering
  'https://www.stryker.com/us/en/about/news/2024/stryker-expands-foot---ankle-portfolio-with-specialized-offering.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      retag(m, d, find(m, 'h4', 'The company to feature new products'), 'h3');
    },
  ],
  // stryker-expands-prophecy-surgical-planning-system-to-include-the
  'https://www.stryker.com/us/en/about/news/2024/stryker-expands-prophecy-surgical-planning-system-to-include-the.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      boldAll(m, d, find(m, 'p', 'References:'));
    },
  ],
  // stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet
  'https://www.stryker.com/us/en/about/news/2023/stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Next advancement of Mako SmartRobotics'), { em: true });
      const about = find(m, 'p', 'About Stryker');
      breakBefore(m, d, about, 'separator');
      if (about && about.lastChild?.nodeName !== 'BR') about.append(d.createElement('br'));
      brBeforeLabel(find(m, 'p', 'Media contact'));
    },
  ],
  // stryker-s-pangea-systems-receive-fda-clearance
  'https://www.stryker.com/us/en/about/news/2023/stryker-s-pangea-systems-receive-fda-clearance.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'h2', 'Pangea to offer'));
    },
  ],
  // stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a
  'https://www.stryker.com/us/en/about/news/2022/stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Innovative planning and intraoperative'));
      ['About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
      style(m, d, find(m, 'p', 'Media contact'), 'separator');
    },
  ],
  // 2022-ana-innovation-award-winners-address-gaps-in-health-equity-
  'https://www.stryker.com/us/en/about/news/2022/2022-ana-innovation-award-winners-address-gaps-in-health-equity-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-announces-first-patient-case-using--new-tornier-perform-
  'https://www.stryker.com/us/en/about/news/2022/stryker-announces-first-patient-case-using--new-tornier-perform-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/events, stryker:content-type/news/in-the-news");
      breakAfter(m, d, find(m, 'p', 'Case to be Presented at 2022'));
    },
  ],
  // stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu
  'https://www.stryker.com/us/en/about/news/2022/stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      subtitle(m, d, find(m, 'h4', 'This season, the Official SmartRobotics'), { split: false });
      breakBefore(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-launches--free-your-feet--campaign-to-raise-awareness-ab
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches--free-your-feet--campaign-to-raise-awareness-ab.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      const more = find(m, 'p', 'More information about the campaign');
      mergeWithPrevious(m, more);
      joinParagraph(d, more, 2);
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-launches-prostep--mica-solo-guide--to-simplify-minimally
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-prostep--mica-solo-guide--to-simplify-minimally.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-
  'https://www.stryker.com/us/en/about/news/2022/stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Newly Launched Q Guidance System'), { em: true });
      mergeWithPrevious(m, find(m, 'p', 'QGS-MM-2_3426'));
      style(m, d, find(m, 'p', 'References:'), 'separator, disclaimer');
    },
  ],
  // stryker-launches-insignia--femoral-hip-stem-at-the-american-acad
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-insignia--femoral-hip-stem-at-the-american-acad.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      subtitle(m, d, find(m, 'p', 'Engineered to optimize fit and function'));
      joinLabel(m, d, 'About Stryker');
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-enters-national-partnership-with-minor-league-baseball-t
  'https://www.stryker.com/us/en/about/news/2021/stryker-enters-national-partnership-with-minor-league-baseball-t.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      const label = [...m.querySelectorAll('p > strong')].find((s) => txt(s) === 'The Nation Emerges from COVID-19');
      if (label && nextOf(label)?.nodeName === 'BR' && nextOf(nextOf(label))?.nodeName !== 'BR') label.after(d.createElement('br'));
    },
  ],
  // stryker-introduces-market-leading-tornier-shoulder-arthroplasty-
  'https://www.stryker.com/us/en/about/news/2021/stryker-introduces-market-leading-tornier-shoulder-arthroplasty-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      // the source's bold place and separately styled dash: the place bold, then ' — ' in the copy
      const date = [...m.querySelectorAll('p > strong, p > b')].find((s) => /^MAHWAH, N\.J\.—?$/.test(txt(s)));
      if (date) {
        const dash = nextOf(date);
        if (dash && dash.nodeType === 1 && txt(dash) === '—') dash.remove();
        if (txt(date).endsWith('—')) date.textContent = 'MAHWAH, N.J.';
        const rest = nextOf(date);
        if (rest && rest.nodeType === 3 && !rest.textContent.startsWith(' — ')) rest.textContent = ` — ${rest.textContent.replace(/^[\s—]+/, '')}`;
      }
      breakBefore(m, d, find(m, 'p', 'Media Contacts'), null);
    },
  ],
  // stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v
  'https://www.stryker.com/us/en/about/news/2021/stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/in-the-news");
      breakAfter(m, d, find(m, 'p', 'Stryker continues to work with United'), { keepStyle: true });
      const label = [...m.querySelectorAll('p > strong')].find((s) => txt(s) === 'About Stryker');
      if (label && nextOf(label)?.nodeName === 'BR' && nextOf(nextOf(label))?.nodeName === 'BR') nextOf(label).remove();
    },
  ],
  // awareness-campaign-launched-to-support-world-restart-a-heart-day
  'https://www.stryker.com/us/en/about/news/2020/awareness-campaign-launched-to-support-world-restart-a-heart-day.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      footnotesToList(m, d, find(m, 'p', '1. Cardiovascular diseases (CVDs)'));
    },
  ],
  // stryker-releases-emergency-relief-bed
  'https://www.stryker.com/us/en/about/news/2020/stryker-releases-emergency-relief-bed.html': [
    (m, d) => {
      tags(m, "stryker:Stryker-SEO-Tags/covid19, stryker:content-type/news, stryker:Stryker-SEO-Tags/coronavirus, stryker:Stryker-SEO-Tags/covid-19, stryker:content-type/news/product-bulletins, stryker:content-type/corporatenews, stryker:content-type/news/covid-19");
      const place = find(m, 'h5', 'Kalamazoo, MI, USA');
      if (place) { const p = d.createElement('p'); const b = d.createElement('strong'); b.append(...place.childNodes); p.append(b); place.replaceWith(p); }
      const h1 = m.querySelector('h1');
      if (h1 && !h1.querySelector('strong')) boldAll(m, d, h1);
      style(m, d, h1, null);
      retag(m, d, find(m, 'h4', 'Company aims to manufacture'), 'h3');
      ['About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      breakBefore(m, d, find(m, 'p', 'About Stryker'), 'separator');
      breakBefore(m, d, find(m, 'p', 'Media contact'), null);
    },
  ],
  // stryker-completes-acquisition-of-wright-medical
  'https://www.stryker.com/us/en/about/news/2020/stryker-completes-acquisition-of-wright-medical.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews");
    },
  ],
  // stryker-joins-leading-executives-and-employers-in-forming-oneten
  'https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/diversity-equity-inclusion");
      const sub = find(m, 'p', 'OneTen will create one million jobs');
      style(m, d, sub, null);
      subtitle(m, d, sub);
    },
  ],
  // urgent-11-vulnerabilities---wind-river-vxworks-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html': [
    (m, d) => {
      m.querySelectorAll('a[href="https://www.us-cert.gov/ics/advisories/icsa-19-211-01"]').forEach((a) => {
        const u = a.querySelector('u') || a;
        if (txt(u) === 'https://www.us-cert.gov/ics/advisories/icsa-19-211-01') u.textContent = u.textContent.toUpperCase();
      });
    },
  ],
  // microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html': [
    (m, d) => {
      newTab(m, ['https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708', 'https://support.microsoft.com/en-us/help/4500705/customer-guidance-for-cve-2019-0708']);
    },
  ],
  // ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html': [
    (m, d) => {
      newTab(m, ['https://us-cert.cisa.gov/ics/advisories/icsa-20-168-01']);
    },
  ],
  // -sweyntooth--ble-vulnerabilities--icsa--20-063-01-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html': [
    (m, d) => {
      newTab(m, ['https://us-cert.cisa.gov/ics/alerts/ics-alert-20-063-01']);
    },
  ],
  // vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html': [
    (m, d) => {
      boldPerLine([...m.querySelectorAll('p > strong')].find((s) => txt(s).startsWith('CVE-2022-46898 Arbitrary File Upload')), d);
      newTab(m, ['https://support.vocera.com/s/contactsupport', ...['46898', '46899', '46900', '46901', '46902'].map((n) => `https://cve.report/CVE-2022-${n}`)]);
    },
  ],
};

const FRAGMENT_CORRECTIONS = {
  // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
};

const pageKey = (u) => {
  try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
  catch { return u; }
};

// The fragment's document path as the import saves it: no `.`, empty or trailing segments.
const fragmentKey = (p) => String(p).replace(/\\/g, '/').replace(/\.plain\.html$/, '').split('/')
  .reduce((parts, part) => {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
    return parts;
  }, [])
  .join('/');

function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
  const { document, params } = payload || {};
  if (!document || !params) return;
  if (element === document.body) {
    if (!params.originalURL) return;
    (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
    return;
  }
  const fragment = (params.fragments || []).find((f) => f.element === element);
  if (!fragment || typeof fragment.path !== 'string') return;
  (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
}
