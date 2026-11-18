#!/usr/bin/env node
/*
 * Base variants from measured looks: groups every instance of a block type by how it looks
 * (measure.mjs output). The fingerprint is the bucketed look, counts left out (three cards and four
 * cards in one style are one look):
 *   frame    width (full / wide / contained / narrow), its own and its section's background,
 *            border, shadow, rounded corners
 *   layout   how many units fit in a row (from the unit's width and the gap, not how many there
 *            are), the unit's surface (background, border, shadow, radius, inner spacing)
 *   image    where it sits against the text, its share of the unit, its shape (only when the
 *            design crops it to one: otherwise the shape is the picture's, not the design's)
 *   type     per role (title, body, link, button) the main styles: family, size (2 px steps, or
 *            with --sizes bands a size band: S up to 16, M up to 26, L up to 38, XL up to 56,
 *            XXL above; each group then lists the exact styles it holds), bold or regular,
 *            colour, capitals
 *   buttons  filled / outline and colour
 *   panels   (accordions) whether the items start closed or open (the panels are measured open)
 *   tabs     (tab bars) how the selected tab is marked against the others
 * A look that only lacks a part (no description, link or image) joins the largest group that
 * agrees on everything both have (its instances keep what they lack). Groups are sorted by size;
 * groups that differ in one part only are listed as "close to". Groups with the same frame, layout
 * and image form a layout family (the inspection page can show the groups by family).
 * usage: node tools/importer/standardise/looks/group.mjs <block type> [--sizes exact|bands]
 *   [--name <page name>] [--extra <groups file>] [--decisions <file>]
 *   (decisions: merges decided on inspection, default tools/looks/decisions/<type>.json)
 *   [--in /tmp/run-outputs/looks-v2]
 *   [--out tools/looks/data]
 */
import {
  readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync,
} from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const type = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const IN = opt('--in', '/tmp/run-outputs/looks-v2');
const OUT = opt('--out', 'tools/looks/data');
const SIZES = opt('--sizes', 'exact');
// (--name: the page's name when it holds more than the block, e.g. forms = Marketo + stryker.com
// forms; --extra: a file of groups measured elsewhere)
const NAME = opt('--name', type);
const EXTRA = opt('--extra', '');
if (!type) {
  console.error('usage: group.mjs <block type>');
  process.exit(2);
}
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
const titles = Object.fromEntries(pages.map((p) => [p.path, p.title]));
// the live stryker.com page of each page (the review tool's snapshot facts hold its URL)
const sourceOf = (path) => {
  try {
    const meta = JSON.parse(readFileSync(`tools/review/snapshot-meta${path}.json`, 'utf8'));
    return meta['1440']?.url || meta['375']?.url || null;
  } catch (e) {
    return null;
  }
};

const FAMILY = (f) => (f || '').replace(/ for stryker/, '').replace(/ 712/, '').trim();
const size2 = (s) => Math.round((s || 0) / 2) * 2;
const width = (w) => {
  if (w >= 0.95) return 'full';
  if (w >= 0.8) return 'wide';
  if (w >= 0.55) return 'contained';
  return 'narrow';
};
const share = (s) => {
  if (s >= 0.95) return 'full';
  if (s >= 0.7) return 'most';
  if (s >= 0.4) return 'half';
  return 'small';
};
const shape = (a) => {
  if (!a) return '';
  if (a > 1.6) return 'wide';
  if (a > 1.2) return 'landscape';
  if (a >= 0.8) return 'square';
  return 'portrait';
};
const padding = (p) => {
  const m = Math.max(...(p || [0]));
  if (m === 0) return 'none';
  return m <= 12 ? 'small' : 'large';
};
const surface = (s) => [s.bg !== 'transparent' ? `bg ${s.bg}` : '', s.bgImage ? 'bg image' : '', s.border ? 'border' : '',
  s.shadow ? 'shadow' : '', s.radius > 0 ? 'rounded' : ''].filter(Boolean).join(', ') || 'plain';
// (authored sizes differ by a few pixels from block to block: bands group what looks alike)
const band = (px) => {
  if (px <= 16) return 'S';
  if (px <= 26) return 'M';
  if (px <= 38) return 'L';
  if (px <= 56) return 'XL';
  return 'XXL';
};
const typeOf = (st, sizes = SIZES) => [
  FAMILY(st.family),
  sizes === 'bands' ? band(size2(st.size)) : size2(st.size),
  st.weight >= 600 ? 'bold' : 'regular',
  `${st.color}${st.upper ? ' caps' : ''}${st.italic ? ' italic' : ''}`,
].join(' ');
/** the role styles with their exact sizes (shown per group when sizes are grouped in bands) */
const ROLES = ['tab', 'title', 'body', 'link', 'button'];
const exactTypeOf = (b) => Object.fromEntries(ROLES
  .filter((r) => b.typography[r])
  .map((r) => [r, b.typography[r].styles.filter((x) => x.share >= 0.2).slice(0, 2)
    .map((x) => typeOf(x, 'exact')).sort()
    .join(' + ')]));

const PLAYERS = { video: 'video player (Dynamic Media)', iframe: 'embedded player (YouTube)' };
const ratio = (a) => {
  if (!a) return '';
  if (a >= 1.7 && a <= 1.85) return '16:9';
  return a > 1.85 ? 'wider than 16:9' : 'taller than 16:9';
};

const tabMarkOf = ({ selected, other }) => {
  const o = other || {};
  const marks = [
    selected.underline && selected.underline !== o.underline ? `underline ${selected.underline}` : '',
    selected.overline && selected.overline !== o.overline ? `line above ${selected.overline}` : '',
    selected.bg !== (o.bg || 'transparent') ? `background ${selected.bg}` : '',
    selected.color !== (o.color || selected.color) ? `text ${selected.color}` : '',
    selected.weight !== (o.weight || selected.weight) ? 'bold' : '',
  ].filter(Boolean);
  return `selected tab: ${marks.join(', ') || 'not marked'}`;
};
const panelsOf = ({ count, openAtStart }) => {
  if (!openAtStart) return 'all start closed';
  if (openAtStart === count) return count > 1 ? 'all start open' : 'starts open';
  return openAtStart === 1 ? 'one starts open' : 'some start open';
};

/** the parts of an instance's look (each part a short text; together the fingerprint) */
/**
 * a table's look: its width, whether it has a bold header row, and the cells' main text style (a
 * header row holds little text: in a short table it would fall below the share the other blocks
 * count, so it is named on its own)
 */
function tablePartsOf(b) {
  const styles = b.typography.body?.styles || [];
  const cells = styles.find((x) => x.weight < 600) || styles[0];
  return {
    frame: `${width(b.frame.widthShare)}; ${surface(b.frame)}`,
    header: styles.some((x) => x.weight >= 600) ? 'bold header row' : 'no header row',
    'type body': cells ? typeOf(cells) : 'none',
  };
}

/**
 * a statistics block's look: how many per row, the alignment, the numbers' style (size in bands)
 * and colours, and the descriptions' style (numbers are the large text, 40 px and up; each number
 * may have its own colour, so the colours are a set)
 */
function statisticsPartsOf(b) {
  const styles = Object.values(b.typography).flatMap((r) => r.styles);
  const numbers = styles.filter((x) => x.size >= 40);
  // (footnote marks are small runs: only styles carrying a fifth of a role's text count)
  const texts = styles.filter((x) => x.size < 40 && x.share >= 0.2);
  const look = (x) => (x ? `${FAMILY(x.family)} ${band(size2(x.size))} ${x.weight >= 600 ? 'bold' : 'regular'}` : 'none');
  const u = b.units;
  const unitW = u.widthShare * b.box.width;
  const g = u.gap ?? u.gapCss ?? 0;
  const slots = Math.max(1, Math.round((b.box.width + g) / (Math.max(unitW, 1) + g)));
  return {
    frame: `${width(b.frame.widthShare)}; ${surface(b.frame)}${b.frame.section && b.frame.section.bg !== 'transparent' ? `; section ${b.frame.section.bg}` : ''}`,
    layout: `${Math.min(slots, 8)} per row; ${(numbers[0] || texts[0])?.align === 'left' ? 'left' : 'centred'}`,
    numbers: numbers.length ? look(numbers[0]) : 'none',
    // (no description: left out, so the block joins the same look with descriptions, tagged)
    ...(texts.length ? { 'type body': [...new Set(texts.map((x) => `${look(x)} ${x.color}`))].sort().join(' + ') } : {}),
  };
}

/** the colours of a statistics block's numbers (shown, not grouped: each number has its own) */
const numberColours = (b) => [...new Set(Object.values(b.typography).flatMap((r) => r.styles)
  .filter((x) => x.size >= 40).map((x) => x.color))].sort().join(' / ');

/**
 * a spacing box's look (the wrapper that carries authored padding and margins around default
 * content, scripts/corp-spacing.js): only the box, its width, background and padding; the text in
 * it is default content, listed per group but not grouped
 */
function spacingPartsOf(b) {
  const pad = Math.max(...(b.frame.padding || [0]));
  let room = 'large padding';
  if (pad === 0) room = 'no padding';
  else if (pad <= 12) room = 'small padding';
  return {
    frame: `${width(b.frame.widthShare)}; ${surface({ ...b.frame, padding: undefined })}${b.frame.section && b.frame.section.bg !== 'transparent' ? `; section ${b.frame.section.bg}` : ''}`,
    box: room,
  };
}

/**
 * a chart's look: its kind (column, the default, bar or pie: the block's variants) and width (it is
 * drawn as a graphic: its text is axis labels, not a look)
 */
function chartPartsOf(b) {
  const kind = ['bar', 'pie'].find((k) => b.classes.includes(k)) || 'column';
  return {
    frame: `${width(b.frame.widthShare)}; ${surface(b.frame)}`,
    chart: `${kind} chart`,
  };
}

function partsOf(b) {
  if (b.type === 'table') return tablePartsOf(b);
  if (b.type === 'chart-corp') return chartPartsOf(b);
  if (b.type === 'corp-spacing-box') return spacingPartsOf(b);
  if (b.type === 'statistics') return statisticsPartsOf(b);
  const u = b.units;
  // units per row the grid holds: (block width + gap) / (unit width + gap)
  const unitW = u.widthShare * b.box.width;
  const g = u.gap ?? u.gapCss ?? 0;
  const slots = Math.max(1, Math.round((b.box.width + g) / (Math.max(unitW, 1) + g)));
  // (a video player's own time display, "0:00 / 0:00", is the player's, not authored text)
  const playerOnly = b.image?.tag === 'video' && /^(\d+:\d+\s*\/\s*\d+:\d+\s*)?$/.test(b.text || '');
  const roles = playerOnly ? [] : ROLES.filter((r) => b.typography[r]);
  const styles = Object.fromEntries(roles.map((r) => {
    // (the order of a role's two main styles doesn't matter)
    const st = b.typography[r].styles.filter((x) => x.share >= 0.2).slice(0, 2);
    return [r, st.map((x) => typeOf(x)).sort().join(' + ')];
  }));
  const btn = b.buttons[0];
  return {
    frame: [
      `${width(b.frame.widthShare)}; ${surface(b.frame)}`,
      b.frame.section && b.frame.section.bg !== 'transparent' ? `; section ${b.frame.section.bg}` : '',
      b.frame.section?.bgImage ? '; section image' : '',
    ].join(''),
    layout: `${Math.min(slots, 8)} per row; unit ${surface(u)}, padding ${padding(u.padding)}`,
    // (an image shown at its own proportions has the shape of what it shows, not of the design:
    // only a design that crops images to a shape (cover / contain) makes the shape part of the
    // look)
    image: b.image ? [
      // (a video or an embed: the kind of player and its proportions; an image: where it sits)
      ...(PLAYERS[b.image.tag] ? [PLAYERS[b.image.tag], ratio(b.image.aspect)] : []),
      PLAYERS[b.image.tag] ? '' : b.image.place,
      `${share(b.image.share)} width`,
      !PLAYERS[b.image.tag] && ['cover', 'contain'].includes(b.image.fit) ? `${shape(b.image.aspect)} (cropped)` : '',
    ]
      .filter(Boolean).join(', ') : 'no image',
    ...Object.fromEntries(roles.map((r) => [`type ${r}`, styles[r]])),
    buttons: btn ? `${btn.kind} ${btn.kind === 'filled' ? btn.bg : btn.border}${btn.upper ? ' caps' : ''}` : 'none',
    // (an accordion: whether its items start closed or open; how many there are is content)
    ...(b.panels ? { panels: panelsOf(b.panels) } : {}),
    // (a tab bar: how the selected tab is marked)
    ...(b.tabs ? { tabs: tabMarkOf(b.tabs) } : {}),
  };
}

const instances = [];
readdirSync(join(IN, 'pages')).forEach((f) => {
  const d = JSON.parse(readFileSync(join(IN, 'pages', f), 'utf8'));
  d.blocks.filter((b) => b.type === type && !b.hidden).forEach((b) => instances.push({
    page: d.page,
    title: titles[d.page] || d.page,
    source: sourceOf(d.page),
    n: b.n,
    classes: b.classes,
    inFragment: b.inFragment,
    shot: b.shot,
    phoneShot: b.phone?.shot,
    counts: b.counts,
    text: b.text,
    parts: partsOf(b),
    exactType: exactTypeOf(b),
    ...(b.type === 'statistics' ? { colours: numberColours(b) } : {}),
  }));
});
const keyOf = (parts) => JSON.stringify(Object.entries(parts)
  .sort(([a], [c]) => a.localeCompare(c)));
const byKey = new Map();
instances.forEach((it) => {
  const k = keyOf(it.parts);
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(it);
});
// a look that only lacks a part (no description, no link, no image) is the same look with less
// content: it joins the largest group that agrees on everything both have; its instances keep
// what they lack, so the page can show it
const exact = [...byKey.values()].sort((a, c) => c.length - a.length);
const compatible = (big, small) => {
  const keys = new Set([...Object.keys(big), ...Object.keys(small)]);
  return [...keys].every((k) => {
    if (big[k] === small[k]) return true;
    if (k.startsWith('type ') && (!(k in big) || !(k in small))) return true;
    // (a role with fewer styles: e.g. titles as links but no "Learn more" link)
    if (k.startsWith('type ')) {
      const [x, y] = [big[k].split(' + '), small[k].split(' + ')];
      return y.every((st) => x.includes(st)) || x.every((st) => y.includes(st));
    }
    return k === 'image' && (big[k] === 'no image' || small[k] === 'no image');
  });
};
const lacking = (big, small) => Object.keys(big).filter((k) => !(k in small)
  || (k === 'image' && small[k] === 'no image' && big[k] !== 'no image')
  || (k.startsWith('type ') && small[k].split(' + ').length < big[k].split(' + ').length));
const merged = [];
exact.forEach((list) => {
  const [{ parts }] = list;
  const home = merged.find((g) => compatible(g.parts, parts) && g.list.length >= list.length);
  if (home) {
    const missing = lacking(home.parts, parts);
    // (and what it has that the group's look doesn't: a title or text the others lack)
    const extra = lacking(parts, home.parts);
    list.forEach((it) => home.list.push({ ...it, missing, extra }));
  } else merged.push({ parts, list: [...list] });
});
// merges decided while inspecting the looks (tools/looks/decisions/<type>.json): every group
// whose instances all have the rule's authored classes and whose look has the rule's parts joins
// the largest of them; the instances that move keep what differs (and what they lack or add)
const DECISIONS = opt('--decisions', join(OUT, '..', 'decisions', `${type}.json`));
let decisions = { merge: [] };
try {
  decisions = JSON.parse(readFileSync(DECISIONS, 'utf8'));
} catch (e) {
  decisions = { merge: [] };
}
/** the groups of `chosen` join the largest of them, which takes the decision's name and reason */
function mergeInto(chosen, decision) {
  const [home, ...rest] = [...chosen].sort((a, c) => c.list.length - a.list.length);
  rest.forEach((g) => {
    g.list.forEach((it) => {
      const lacks = lacking(home.parts, it.parts);
      const differs = Object.keys(home.parts)
        .filter((k) => k in it.parts && it.parts[k] !== home.parts[k] && !lacks.includes(k))
        .map((k) => [k, it.parts[k]]);
      home.list.push({
        ...it,
        missing: [...new Set([...(it.missing || []), ...lacks])],
        extra: [...new Set([...(it.extra || []), ...lacking(it.parts, home.parts)])],
        differs,
        decision: decision.name,
      });
    });
    merged.splice(merged.indexOf(g), 1);
  });
  home.decision = decision;
}
(decisions.merge || []).forEach((rule) => {
  // (by: one group per combination of the named parts, e.g. Hero by layout; names per combination)
  if (rule.by) {
    const keyOfParts = (g) => rule.by.map((k) => g.parts[k] || '').join(' | ');
    const keys = [...new Set(merged.map(keyOfParts))];
    keys.forEach((key) => {
      mergeInto(merged.filter((g) => keyOfParts(g) === key), {
        name: rule.names?.[key] || key, why: rule.why,
      });
    });
    return;
  }
  const fits = (g) => g.list.every((x) => x.classes.join(' ') === rule.match.classes)
    && Object.entries(rule.match.parts || {}).every(([k, v]) => g.parts[k] === v);
  const chosen = merged.filter(fits);
  if (chosen.length < 2) return;
  mergeInto(chosen, rule);
});
const groups = merged.map((g) => g.list).sort((a, c) => c.length - a.length).map((list, i) => ({
  id: i + 1,
  instances: list.length,
  pages: new Set(list.map((x) => x.page)).size,
  parts: (list.find((x) => !x.missing?.length && !x.differs?.length) || list[0]).parts,
  // (a merge decided by the user: its name and reason)
  decision: (merged.find((g) => g.list === list)?.decision) || undefined,
  classes: Object.entries(list.reduce((m, x) => {
    const c = x.classes.join(' ') || '(none)';
    return { ...m, [c]: (m[c] || 0) + 1 };
  }, {})).sort((a, c) => c[1] - a[1]),
  // (what the merged instances lack, counted)
  lacking: Object.entries(list.reduce((m, x) => {
    (x.missing || []).forEach((k) => { m[k] = (m[k] || 0) + 1; });
    return m;
  }, {})),
  // (with size bands: the exact styles behind each role, counted)
  exactTypes: SIZES === 'bands' || type === 'corp-spacing-box' ? Object.fromEntries(ROLES.map((r) => [r,
    Object.entries(list.reduce((m, x) => {
      const t = x.exactType[r];
      return t ? { ...m, [t]: (m[t] || 0) + 1 } : m;
    }, {})).sort((a, c) => c[1] - a[1])]).filter(([, v]) => v.length)) : undefined,
  extras: Object.entries(list.reduce((m, x) => {
    (x.extra || []).forEach((k) => { m[k] = (m[k] || 0) + 1; });
    return m;
  }, {})),
  // (statistics: the number colours the group's instances use)
  colours: list.some((x) => x.colours) ? Object.entries(list.reduce((m, x) => (x.colours
    ? { ...m, [x.colours]: (m[x.colours] || 0) + 1 } : m), {}))
    .sort((a, c) => c[1] - a[1]) : undefined,
  items: list.map(({ parts, exactType, ...rest }) => rest),
}));
// groups measured elsewhere (a form that is only on stryker.com, source-forms.mjs) join as they
// are, and all groups are numbered again by size
if (EXTRA) {
  groups.push(...JSON.parse(readFileSync(EXTRA, 'utf8')).groups.map((g) => ({ ...g, fromSource: true })));
  groups.sort((a, c) => c.instances - a.instances).forEach((g, i) => { g.id = i + 1; });
}
const total = groups.reduce((n, g) => n + g.instances, 0);
// groups that differ in one part only: candidates to merge
groups.forEach((g) => {
  g.close = groups.filter((o) => o !== g).map((o) => {
    const keys = new Set([...Object.keys(g.parts), ...Object.keys(o.parts)]);
    const diff = [...keys].filter((k) => g.parts[k] !== o.parts[k]);
    return diff.length === 1 ? { id: o.id, part: diff[0], theirs: o.parts[diff[0]] || '(none)' } : null;
  }).filter(Boolean).slice(0, 6);
});
// layout families: the groups that share frame, layout and image (they differ in text styles or
// buttons only), largest first
const LAYOUT_PARTS = ['frame', 'layout', 'image'];
const familyKey = (parts) => LAYOUT_PARTS.map((k) => parts[k]).join(' | ');
const families = [...groups.reduce((m, g) => {
  const k = familyKey(g.parts);
  if (!m.has(k)) {
    m.set(k, {
      parts: Object.fromEntries(LAYOUT_PARTS.map((x) => [x, g.parts[x]])), instances: 0, groups: [],
    });
  }
  const f = m.get(k);
  f.instances += g.instances;
  f.groups.push(g.id);
  return m;
}, new Map()).values()]
  .sort((a, c) => c.instances - a.instances)
  .map((f, i) => ({ id: i + 1, ...f }));
mkdirSync(OUT, { recursive: true });
const result = {
  type: NAME,
  blocks: [type],
  generated: new Date().toISOString(),
  sizes: SIZES,
  measuredPages: readdirSync(join(IN, 'pages')).length,
  instances: total,
  groups,
  families,
};
writeFileSync(join(OUT, `${NAME}.json`), JSON.stringify(result));
// the index of the block types grouped so far (the inspection page's menu)
let index = { types: [] };
try {
  index = JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8'));
} catch (e) {
  index = { types: [] };
}
index.types = [
  ...index.types.filter((t) => t.type !== NAME),
  { type: NAME, instances: total, groups: groups.length },
]
  .sort((a, c) => c.instances - a.instances);
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 1));
// the page's screenshots: a real copy next to the page (git-ignored), not a link to the measuring
// folder, which the review preview can't reach
cpSync(join(IN, 'shots', type), join(OUT, '..', 'shots', type), { recursive: true });
console.log(`${NAME}: ${total} instances on ${result.measuredPages} measured pages, ${groups.length} groups`);
groups.slice(0, 15).forEach((g) => console.log(`  #${g.id} ${g.instances} on ${g.pages} pages · ${Object.values(g.parts).join(' | ')}`));
