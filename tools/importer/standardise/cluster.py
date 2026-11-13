# Standardise pilot, step 1: block instances (inventory.mjs) → clusters of the same look.
# Signature, three levels:
#   1 structure: cells and the kind of content in each (media / text / media+text / empty)
#   2 layout: column widths, grid (phone behaviour), named options (large-headline, media-pair …)
#   3 design options: cell colour family, image border, section colour, serif (names, kept by a
#     standard); measured values (text-box padding, size tags, Box lines) are listed per
#     cluster as what standardising would drop
# Instances with the same levels 1 + 2 form a group; within it, the same level 3 is a cluster.
# Clusters under --min instances are the tail of their group.
# usage: python3 -I cluster.py <instances.jsonl> <out dir> [--block columns] [--min 3]
import collections
import json
import os
import re
import sys

src, out_dir = sys.argv[1:3]
opts = sys.argv[3:]
block = opts[opts.index('--block') + 1] if '--block' in opts else 'columns'
minimum = int(opts[opts.index('--min') + 1]) if '--min' in opts else 3
BASE = 'https://standardise-v3--stryker-com--strykerenterprise.aem.page'
RS = 'https://readable-settings-v3--stryker-com--strykerenterprise.aem.page'

instances = [json.loads(line) for line in open(src) if line.strip()]
instances = [i for i in instances if i['name'] == block]

MEDIA = {'image', 'video'}
TEXT = {'text', 'heading', 'list', 'button', 'link'}


def cell_kind(kinds):
    k = set(kinds)
    media, text = bool(k & MEDIA), bool(k & TEXT)
    if media and text:
        return 'media+text'
    if media:
        return 'media'
    if text:
        return 'text'
    if 'fragment' in k:
        return 'fragment'
    return 'empty'


# the options that are part of the layout (named variants), not a number
LAYOUT_OPTIONS = {'large-headline', 'media-pair', 'boxed-last', 'gold-first', 'gray-lead', 'related-links',
                  'link-groups', 'page-intro', 'border-bottom', 'center', 'flex'}


def widths(i):
    w = i['settings'].get('Column widths')
    if not w:
        return 'equal'
    parts = [p for p in re.sub(r'\s+', '', w).replace('%', '').split('/') if p]
    return 'equal' if len(set(parts)) == 1 else '/'.join(parts)


def grid(i):
    g = i['settings'].get('Grid', '')
    phone = re.search(r'phone:\s*([^·]+)', g)
    desktop = re.search(r'desktop:\s*([^·]+)', g)
    parts = []
    if desktop:
        parts.append('d:' + re.sub(r'\s+', '', desktop.group(1)))
    if phone:
        cells = [c.strip() for c in phone.group(1).split(',')]
        parts.append('phone:' + ('stack' if all(c == '12' for c in cells) else 'grid'))
    return ' '.join(parts) or '-'


def colour_family(value):
    v = value.lower()
    if 'dark' in v or 'gradient' in v or re.search(r'\b(blue|purple|teal)\b', v):
        return 'dark'
    return 'light'


def treatment(i):
    t = []
    cc = i['settings'].get('Cell colours')
    if cc:
        t.append('cell-colour:' + '+'.join(sorted({colour_family(x.split(':')[-1]) for x in cc.split(',')})))
    tb = i['settings'].get('Text box')
    if tb:
        t.append('text-box:' + ('boxed' if tb.strip() == 'boxed' else 'custom'))
    if i['settings'].get('Image borders'):
        t.append('image-border')
    if any(k in ('N×', 'Nvw') for k in i['tags']):
        t.append('sized-text')
    if any(k == 'Box' for k in i['tags']) or any('box' in c for c in i['cellKinds'] for c in c):
        t.append('box-lines')
    bg = [s for s in i['styles'] if s.startswith('bg-') or s == 'dark']
    if bg:
        t.append('section-bg:' + colour_family(bg[0]))
    if 'serif' in i['styles']:
        t.append('serif')
    return tuple(t)


# treatment that is a design name (kept as an option of a standard) vs a measured number (what
# standardising drops)
NAMED = ('cell-colour', 'image-border', 'section-bg', 'serif')


def signature(i):
    kinds = [cell_kind(k) for k in i['cellKinds']]
    side = []
    # image + text in either order is one structure; the image side is a design option
    if sorted(kinds) == ['media', 'text']:
        side = ['image-' + ('left' if kinds[0] == 'media' else 'right')]
        kinds = ['media', 'text']
    l1 = f"{i['cells']} cells: " + ' | '.join(kinds)
    named = sorted(set(i['options']) & LAYOUT_OPTIONS)
    l2 = f"widths {widths(i)}, grid {grid(i)}" + (f", {' '.join(named)}" if named else '')
    t = treatment(i)
    i['numbers'] = [x for x in t if not x.startswith(NAMED)]
    return l1, l2, tuple(side + [x for x in t if x.startswith(NAMED)])


groups = collections.defaultdict(lambda: collections.defaultdict(list))
for i in instances:
    l1, l2, l3 = signature(i)
    i['signature'] = {'structure': l1, 'layout': l2, 'treatment': list(l3)}
    groups[(l1, l2)][l3].append(i)

clusters = []
for (l1, l2), sub in groups.items():
    size = sum(len(v) for v in sub.values())
    tail = []
    for l3, members in sorted(sub.items(), key=lambda kv: -len(kv[1])):
        if len(members) >= minimum:
            clusters.append({'structure': l1, 'layout': l2, 'treatment': list(l3), 'members': members, 'group': size})
        else:
            tail.extend(members)
    if tail:
        clusters.append({'structure': l1, 'layout': l2, 'treatment': ['(tail)'], 'members': tail, 'group': size, 'tail': True})

clusters.sort(key=lambda c: (-c['group'], c.get('tail', False), -len(c['members'])))
for n, c in enumerate(clusters, 1):
    c['id'] = f'{block}-{n:03}'
    pages = sorted({p for m in c['members'] for p in m['pages']})
    c['pages'] = len(pages)
    c['examples'] = [m['id'] for m in c['members'][:5]]

os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, f'clusters-{block}.json'), 'w') as f:
    json.dump([{k: (v if k != 'members' else [m['id'] for m in v]) for k, v in c.items()} for c in clusters], f, indent=1)

# the readable report: coverage of the top clusters, then each cluster
total = len(instances)
named = [c for c in clusters if not c.get('tail')]
by_size = sorted(clusters, key=lambda c: -len(c['members']))
lines = [f'# {block}: {total} instances on {len({p for i in instances for p in i["pages"]})} pages', '']
lines.append(f'{len(groups)} structure + layout groups, {len(named)} clusters of {minimum}+ and '
             f'{sum(len(c["members"]) for c in clusters if c.get("tail"))} instances in group tails.')
lines.append('')
lines.append('| top clusters | instances covered | share |')
lines.append('|---|---|---|')
for top in (1, 3, 5, 10, 20):
    n = sum(len(c['members']) for c in by_size[:top])
    lines.append(f'| {top} | {n} | {n * 100 // max(total, 1)}% |')
lines.append('')
group_sizes = sorted({(c['structure'], c['layout']): c['group'] for c in clusters}.items(), key=lambda kv: -kv[1])
lines.append('| top groups (structure + layout) | instances covered | share |')
lines.append('|---|---|---|')
for top in (1, 3, 5, 10):
    n = sum(s for _, s in group_sizes[:top])
    lines.append(f'| {top} | {n} | {n * 100 // max(total, 1)}% |')
lines.append('')
lines.append('## Groups (structure + layout), largest first')
lines.append('')
lines.append('| group | instances | pages | clusters |')
lines.append('|---|---|---|---|')
for (l1, l2), size in group_sizes[:25]:
    members = [c for c in clusters if c['structure'] == l1 and c['layout'] == l2]
    pages = len({p for c in members for m in c['members'] for p in m['pages']})
    lines.append(f'| {l1}; {l2} | {size} | {pages} | {len(members)} |')
lines.append('')
for c in clusters:
    lines.append(f"## {c['id']} · {len(c['members'])} instances on {c['pages']} pages{' (tail)' if c.get('tail') else ''}")
    lines.append(f"- structure: {c['structure']}")
    lines.append(f"- layout: {c['layout']}")
    lines.append(f"- design options: {', '.join(c['treatment']) or 'none'}")
    numbers = collections.Counter(x for m in c['members'] for x in m['numbers'])
    lines.append(f"- measured values standardising would drop: "
                 f"{', '.join(f'{k} ({v})' for k, v in numbers.most_common()) or 'none'}")
    examples = []
    for m in c['members'][:4]:
        page = m['pages'][0] if m['pages'] else m['doc']
        examples.append(f"[{page.split('/')[-1]}]({RS}{page})")
    lines.append(f"- examples: {', '.join(examples)}")
    lines.append('')
open(os.path.join(out_dir, f'clusters-{block}.md'), 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:24]))
