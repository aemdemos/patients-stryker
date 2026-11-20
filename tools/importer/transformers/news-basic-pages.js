/**
 * News-detail pages on the `basic` theme (templates/news-detail/news-detail-themes.css), with
 * "Stryker expands Mako robotics portfolio with full market release of Mako RPS"
 * (/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio) as the representative.
 * news-representative-normalise.js lists the pages (group `basic`: the theme, no text
 * rewrite) and news-detail-sections.js calls the two functions below on the page's sections
 * ({ kind, style, background, nodes }) before it writes them:
 *
 * - basicRules: the representative's markup, for every page in the group
 *   - the Egyptienne subtitle under the lead image (a `p-1-25, serif` paragraph) is an
 *     italic Heading 4 (Egyptienne in the template), e.g. "New handheld robotic technology
 *     expands the Mako platform…"
 *   - a bold label alone on its line in a `separator` section ("About Stryker", "Media
 *     contact") opens the paragraph after it, after a line break
 * - basicPageCorrections: what each page's authors changed in DA after the import (spacers,
 *   moved contacts, the Vocera labels and link), so a re-import gives the reviewed page
 *
 * The `full-width, basic` theme pair pages (EMS powered products, AED buying guide, the Sage
 * transfer article) use the same corrections table. Paths are the source pages'
 * (lowercased), as in news-representative-normalise.js.
 */

const NEWS = /^\/us\/en\/(about\/news|emergency-care\/news|sage\/news)\//;

const text = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();
const styles = (section) => (section.style || '').split(', ').filter(Boolean);
const setStyles = (section, list) => { section.style = list.join(', ') || undefined; };
const elements = (section) => section.nodes.filter((node) => node.nodeType === 1);
const spacer = (style = 'spacer') => ({ kind: 'spacer', style, nodes: [] });

/** A section holding only the lead image (a Dynamic Media image link or a picture). */
function isImageSection(section) {
  const els = elements(section);
  return els.length > 0 && !section.nodes.some((n) => n.nodeType === 3 && n.textContent.trim())
    && els.every((el) => el.matches('picture, img, a[href*="/is/image/"]')
      || (el.matches('p') && !text(el).replace(/^\S+$/, '') && el.querySelector('picture, img, a[href*="/is/image/"]')));
}

/** The first section whose elements include one matching `test`. */
function sectionWith(sections, test) {
  return sections.find((s) => elements(s).some(test));
}

const startsWith = (prefix) => (el) => text(el).startsWith(prefix);

/** Drops leading line breaks and spaces of an element. */
function trimStart(el) {
  while (el.firstChild && (el.firstChild.nodeName === 'BR' || (el.firstChild.nodeType === 3 && !el.firstChild.textContent.trim()))) el.firstChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^[\s\u00a0]+/, '');
}

/** Drops trailing line breaks and spaces of an element. */
function trimEnd(el) {
  while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) el.lastChild.remove();
}

/** The section's nodes from the element matching `test` on go to a new section after it. */
function splitAt(sections, section, test, rest = {}) {
  const at = section.nodes.findIndex((n) => n.nodeType === 1 && test(n));
  const moved = { kind: section.kind, ...rest, nodes: section.nodes.splice(at) };
  sections.splice(sections.indexOf(section) + 1, 0, moved);
  return moved;
}

/** No spacer above the lead image and no image width style: the image as on the representative. */
function plainLeadImage(sections) {
  const i = sections.findIndex(isImageSection);
  if (i < 0) return;
  setStyles(sections[i], styles(sections[i]).filter((s) => !/^image-/.test(s)));
  if (i > 0 && sections[i - 1].kind === 'spacer') sections.splice(i - 1, 1);
}

/** Moves a paragraph's bold label `label` (and what follows it) into a paragraph of its own. */
function splitParagraphAt(p, label, doc) {
  const strong = [...p.querySelectorAll('strong')].find((s) => text(s) === label);
  if (!strong || strong.parentElement !== p) return null;
  const next = doc.createElement('p');
  let node = strong;
  while (node) {
    const following = node.nextSibling;
    next.append(node);
    node = following;
  }
  trimEnd(p);
  next.normalize();
  [...next.childNodes].forEach((n) => {
    if (n.nodeType === 3 && n.previousSibling && n.previousSibling.nodeName === 'BR') n.textContent = n.textContent.replace(/^[\s\u00a0]+/, '');
  });
  p.after(next);
  return next;
}

export function basicRules(sections, doc) {
  sections.forEach((section) => {
    const s = styles(section);
    const els = elements(section);
    // the Egyptienne subtitle → an italic Heading 4
    if (s.includes('serif') && s.includes('p-1-25') && els.length === 1 && els[0].matches('p')) {
      const h4 = doc.createElement('h4');
      const em = doc.createElement('em');
      em.append(...els[0].childNodes);
      h4.append(em);
      section.nodes = [h4];
      setStyles(section, s.filter((x) => x !== 'serif' && x !== 'p-1-25'));
      // only a list split off it (the representative's bullet points) joins the subtitle's
      // section; the article text after it is a section of its own (e.g. Pangea, Sync Badge)
      const next = sections[sections.indexOf(section) + 1];
      if (next && styles(next).includes('join') && !elements(next).every((el) => el.matches('ul, ol'))) {
        setStyles(next, styles(next).filter((x) => x !== 'join'));
      }
    }
    // a bold label alone on its line opens the paragraph after it (About Stryker, Media contact)
    if (s.includes('separator')) {
      for (let i = section.nodes.length - 2; i >= 0; i -= 1) {
        const p = section.nodes[i];
        const next = section.nodes[i + 1];
        const label = p.nodeType === 1 && p.matches('p') && p.children.length === 1
          && p.firstElementChild.matches('strong') && text(p) === text(p.firstElementChild) && text(p);
        if (label && next.nodeType === 1 && next.matches('p') && !next.querySelector(':scope > strong:only-child')) {
          trimStart(next);
          p.append(doc.createElement('br'), ...next.childNodes);
          section.nodes.splice(i + 1, 1);
        }
      }
    }
  });
}

const CORRECTIONS = {
  '2022/stryker-announces-definitive-agreement-to-acquire-vocera-communi': (sections, doc) => {
    // the contact labels are underlined (Humanist bold, authoring conventions)
    sections.forEach((s) => elements(s).forEach((el) => el.querySelectorAll('strong').forEach((strong) => {
      if (!/^For (investor|media) inquiries please contact:$/.test(text(strong))) return;
      const u = doc.createElement('u');
      u.append(...strong.childNodes);
      strong.replaceWith(u);
    })));
    // the teal "READ MORE…" link: a Bold + Underline link (no ►) closing the section above
    const link = sectionWith(sections, (el) => /^(\[\[color-teal\])?READ MORE ON OUR INVESTOR RELATIONS SITE HERE/.test(text(el)));
    const i = sections.indexOf(link);
    if (i < 1) return;
    const a = elements(link)[0].querySelector('a');
    const p = doc.createElement('p');
    const strong = doc.createElement('strong');
    const u = doc.createElement('u');
    u.textContent = text(a).replace(/\s*►\s*$/, '');
    a.textContent = '';
    a.append(u);
    strong.append(a);
    p.append(strong);
    sections[i - 1].nodes.push(p);
    setStyles(sections[i - 1], styles(sections[i - 1]).filter((x) => x !== 'ps-0'));
    sections.splice(i, 1);
  },
  '2023/cd-nxt-power-tool-system-empowers-surgeons-through-real-time-dep': (sections) => {
    const body = sectionWith(sections, startsWith('For more information'));
    if (!body) return;
    body.nodes.forEach((n) => n.nodeType === 1 && n.querySelectorAll('a').forEach((a) => {
      a.textContent = a.textContent.replace('stryker.com//', 'stryker.com/');
    }));
    const more = splitAt(sections, body, startsWith('For more information'));
    const about = splitAt(sections, more, startsWith('About Stryker'));
    const strong = elements(about)[0].querySelector('strong');
    if (strong) trimStart(strong);
    sections.splice(sections.indexOf(about), 0, spacer('spacer, small'));
  },
  '2023/cerus-endovascular': (sections, doc) => {
    const about = sectionWith(sections, startsWith('About Stryker'));
    if (!about) return;
    const p = elements(about).find(startsWith('About Stryker'));
    const contact = splitParagraphAt(p, 'Media contact', doc);
    if (contact) about.nodes.splice(about.nodes.indexOf(p) + 1, 0, contact);
    setStyles(about, [...styles(about), 'label-1-5']);
  },
  '2023/stryker-celebrates-wind-power-milestone-on-our-way-to-become-carbon-neutral': (sections) => {
    const note = sectionWith(sections, startsWith('*Based on 2022'));
    if (note) setStyles(note, styles(note).filter((s) => s !== 'references-body-lines'));
  },
  '2024/new-intermediate-nail-and-rc-lag-screw-expand-gamma4-portfolio-to-meet-the-needs-of-surgeons-and-their-patients': (sections) => {
    plainLeadImage(sections);
    const about = sectionWith(sections, startsWith('About Stryker'));
    if (!about) return;
    const contact = splitAt(sections, about, startsWith('Media contact'), { style: undefined });
    const at = sections.indexOf(contact);
    sections.splice(at, 0, spacer('spacer, small'));
    sections.splice(at + 2, 0, spacer('separator'), spacer('spacer, small'));
  },
  '2024/stryker-announces-launch-of-pangea-plating-system': (sections) => plainLeadImage(sections),
  '2024/stryker-receives-don-clifton-strengths-based-culture-award-for-f': (sections) => plainLeadImage(sections),
  '2025/inari-medical-stryker-launches-all-new-inthrill-thrombectomy-system': (sections) => {
    const about = sectionWith(sections, startsWith('About Stryker'));
    if (about) sections.splice(sections.indexOf(about) + 1, 0, spacer());
  },
  '2025/stryker-launches-surpass-elite-flow-diverter': (sections) => {
    const notes = sectionWith(sections, startsWith('AP-004954'));
    if (notes && elements(notes).length > 1) splitAt(sections, notes, startsWith('AP-004954'), { style: 'disclaimer' });
  },
  '2025/stryker-launches-sync-badge': (sections, doc) => {
    // the subtitle's empty second Heading 4 (the blank line under it in DA)
    const sub = sections.find((s) => elements(s).length === 1 && elements(s)[0].matches('h4'));
    if (sub) sub.nodes.push(doc.createElement('h4'));
  },
  '2025/stryker-unveils-new-intracranial-base-catheter': (sections) => plainLeadImage(sections),
  '2026/stryker-signs-definitive-agreement-to-acquire-zurimed-to-enhance': (sections, doc) => {
    const lead = sectionWith(sections, (el) => el.matches('ul'));
    if (lead && lead.nodes.some((n) => n.nodeType === 1 && !n.matches('ul'))) {
      const body = splitAt(sections, lead, (el) => !el.matches('ul'));
      sections.splice(sections.indexOf(body), 0, spacer());
    }
    // the two contacts are one paragraph, a blank line apart
    const contacts = sectionWith(sections, startsWith('Contacts'));
    if (!contacts) return;
    const p = elements(contacts).find(startsWith('Contacts'));
    const media = p && contacts.nodes[contacts.nodes.indexOf(p) + 1];
    if (media && media.nodeType === 1 && startsWith('For media inquiries')(media)) {
      p.append(doc.createElement('br'), doc.createElement('br'), ...media.childNodes);
      contacts.nodes.splice(contacts.nodes.indexOf(media), 1);
    }
  },
  'emergency-care/news/2024/ems-powered-products': (sections) => {
    // the title without its centring / date-above styles, a spacer under it
    const title = sectionWith(sections, (el) => el.matches('h1'));
    if (title) {
      setStyles(title, styles(title).filter((x) => x !== 'center' && x !== 'date-above'));
      sections.splice(sections.indexOf(title) + 1, 0, spacer());
    }
    // each product (its Heading 3 and copy) a `p-1-25` section of its own, as the intro (the
    // stair chair stays with the Power-PRO 2 cot)
    const body = sectionWith(sections, startsWith('3-minute read'));
    if (!body) return;
    setStyles(body, ['p-1-25']);
    // …without the 1.25x heading size its italic Heading 2 asks for (the theme pair sets it)
    elements(body).forEach((el) => [el, ...el.querySelectorAll('[data-section-style]')]
      .forEach((x) => x.removeAttribute('data-section-style')));
    let part = body;
    ['Power-PRO 2 powered ambulance cot', 'LUCAS 3, v3.1 chest compression system',
      'Power-LOAD powered cot fastener', 'Together, we save lives', 'Proven to save financial guarantee',
    ].forEach((heading) => {
      if (elements(part).some((el) => el.matches('h3') && text(el).startsWith(heading))) {
        part = splitAt(sections, part, (el) => el.matches('h3') && text(el).startsWith(heading), { style: 'p-1-25' });
      }
    });
    sections.splice(sections.indexOf(part) + 1, 0, spacer());
  },
};

/**
 * The DA corrections of one page, if it has any.
 * @param {Array} sections the page's sections
 * @param {string} path the source page path (lowercased)
 * @param {Document} doc the document
 */
export function basicPageCorrections(sections, path, doc) {
  const key = path.replace(NEWS, (m, area) => (area === 'about/news' ? '' : `${area}/`)).replace(/\.html$/, '')
    .replace(/--+/g, '-').replace(/-(?=\/|$)/g, '');
  const fix = CORRECTIONS[key];
  if (fix) fix(sections, doc);
}
