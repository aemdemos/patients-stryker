/*
 * Standardise pilot: the block features of one document and the content hash of an instance,
 * shared by inventory.mjs (writes them) and apply.mjs (checks a block did not change since the
 * review). `features` runs in the browser (page.evaluate), so it uses nothing from outside.
 */
import { createHash } from 'crypto';

// (runs in the browser, on one document's html)
export function features(html) {
  const { body } = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const IMAGE = /\/is\/image\/|\/content\/dam\/.*\.(png|jpe?g|gif|webp|svg)|media-assets/i;
  const VIDEO = /\.m3u8|\/is\/content\/|youtube\.com|youtu\.be|vimeo\.com/i;
  const kindsOf = (cell) => {
    const kinds = new Set();
    cell.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(() => kinds.add('heading'));
    cell.querySelectorAll('ul, ol').forEach(() => kinds.add('list'));
    cell.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const title = a.getAttribute('title') || '';
      const alone = text(a) === text(a.closest('p, div'));
      if (VIDEO.test(href)) kinds.add('video');
      else if (/\/fragments\//.test(href)) kinds.add('fragment');
      else if (IMAGE.test(href) || IMAGE.test(title)) kinds.add('image');
      else if (alone && a.closest('strong, em')) kinds.add('button');
      else if (alone) kinds.add('link');
    });
    cell.querySelectorAll('img, picture').forEach(() => kinds.add('image'));
    cell.querySelectorAll('p').forEach((p) => {
      const t = text(p);
      if (t === '[[Blank line]]') kinds.add('blank');
      else if (/^box(:| end)/i.test(t)) kinds.add('box');
      else if (t === 'Column break') kinds.add('column-break');
      else if (t && !p.querySelector('a') && !/^\[\[[^\]]*\]\]$/.test(t)) kinds.add('text');
    });
    if (!kinds.size && text(cell)) kinds.add('text');
    return [...kinds].sort();
  };
  const tagsOf = (el) => {
    const tags = {};
    [...el.textContent.matchAll(/\[\[([^\]]+)\]/g)].forEach((m) => m[1].split(',').forEach((t) => {
      const k = t.trim().replace(/^[\d.]+×$/, 'N×').replace(/^[\d.]+vw$/, 'Nvw');
      tags[k] = (tags[k] || 0) + 1;
    }));
    return tags;
  };
  const found = [];
  [...body.children].forEach((section, si) => {
    const meta = section.querySelector(':scope > .section-metadata');
    const settings = {};
    if (meta) {
      [...meta.children].forEach((row) => {
        const [k, v] = [...row.children].map((c) => text(c));
        if (k) settings[k] = v || '';
      });
    }
    const styles = (settings.style || '').split(',').map((s) => s.trim()).filter(Boolean);
    delete settings.style;
    const blocks = [...section.querySelectorAll(':scope > div[class]')]
      .filter((b) => !b.classList.contains('section-metadata'));
    const nth = {};
    blocks.forEach((block, bi) => {
      const [name, ...options] = [...block.classList];
      nth[name] = (nth[name] || 0) + 1;
      const k = nth[name];
      // this block's settings: plain rows (first block, or shared) and its own `(k)` rows
      const own = {};
      Object.entries(settings).forEach(([key, v]) => {
        const m = key.match(/^(.*?) \((\d+)\)$/);
        if (m && Number(m[2]) === k) own[m[1]] = v;
        else if (!m && (k === 1 || /^(Column widths|Copy size|Label size|Heading size|Headings|Text|Padding|Margin)$/.test(key))) own[key] = v;
      });
      const rows = [...block.children].map((row) => [...row.children].map((cell) => ({
        kinds: kindsOf(cell),
        chars: text(cell).replace(/\[\[[^\]]*\]|\]/g, '').length,
      })));
      found.push({
        section: si,
        block: bi,
        name,
        options,
        styles,
        settings: own,
        sectionSettings: Object.keys(settings),
        rows: rows.length,
        cells: rows[0] ? rows[0].length : 0,
        cellKinds: rows[0] ? rows[0].map((c) => c.kinds) : [],
        cellChars: rows[0] ? rows[0].map((c) => c.chars) : [],
        tags: tagsOf(block),
        html: block.outerHTML,
      });
    });
  });
  return found;
}

// the content hash of one instance found by `features`
export const hashOf = (it) => createHash('sha1')
  .update(it.html + JSON.stringify(it.settings) + it.styles.join(','))
  .digest('hex').slice(0, 12);
