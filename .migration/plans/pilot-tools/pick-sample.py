# Picks a QA sample of imported pages: every feature (block / section style) at least `min`
# times, then business units spread evenly, up to `size` pages. Deterministic (sorted input).
# usage: python3 -I pick-sample.py <content dir> <pages.tsv> <size> [min per feature] [exclude.tsv …]
# (exclude: earlier samples, whose pages are not picked again)
# prints "source path<TAB>eds path" lines
import collections
import os
import re
import sys

content, tsv, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
per_feature = int(sys.argv[4]) if len(sys.argv) > 4 else 3
excluded = set()
for f in sys.argv[5:]:
    excluded.update(line.split('\t')[1].strip() for line in open(f) if '\t' in line)

FEATURES = {
    'tabs': r'<div>style</div><div>[^<]*\btabbed\b',
    'accordion': r'class="accordion\b',
    'accordion-open': r'class="accordion[^"]*">(?:(?!</div></div></div>).)*?<p><strong>',
    'nested-accordion': r'\baccordion-panel\b',
    'statistics': r'class="statistics\b',
    'carousel': r'<div>style</div><div>carousel\b',
    'marketo-form': r'class="marketo-form\b',
    'video': r'class="video\b',
    'cards-teaser': r'class="cards-corp teaser',
    'cards-resources': r'class="cards-corp resources',
    'gallery': r'class="gallery-corp\b',
    'table': r'class="table\b',
    'related-categories': r'class="related-categories\b',
    'local-nav': r'class="sticky-nav local',
    'jump-bar': r'class="sticky-nav"',
    'flex': r'<div>style</div><div>[^<]*\bflex\b',
    'columns': r'class="columns\b',
    'fragment': r'class="fragment\b',
    'modal-tile': r'/modals/',
}

pages = []
for line in open(tsv):
    parts = line.rstrip('\n').split('\t')
    if len(parts) < 2:
        continue
    src, eds = parts[0], parts[1]
    if eds in excluded:
        continue
    f = os.path.join(content, eds.lstrip('/') + '.plain.html')
    if not os.path.exists(f):
        continue
    html = open(f, errors='ignore').read()
    feats = {k for k, rx in FEATURES.items() if re.search(rx, html, re.S)}
    unit = eds.split('/')[3] if len(eds.split('/')) > 3 else ''
    pages.append((src, eds, unit, feats))
pages.sort(key=lambda p: p[1])

chosen = []
counts = collections.Counter()
units = collections.Counter()


def take(p):
    chosen.append(p)
    counts.update(p[3])
    units[p[2]] += 1


# 1. features: rarest first, the pages adding the most missing features
for feat in sorted(FEATURES, key=lambda k: sum(k in p[3] for p in pages)):
    while counts[feat] < per_feature and len(chosen) < size:
        cands = [p for p in pages if feat in p[3] and p not in chosen]
        if not cands:
            break
        cands.sort(key=lambda p: (-sum(1 for f in p[3] if counts[f] < per_feature), units[p[2]], p[1]))
        take(cands[0])
# 2. business units: the least covered unit next, round robin
while len(chosen) < size:
    rest = [p for p in pages if p not in chosen]
    if not rest:
        break
    rest.sort(key=lambda p: (units[p[2]], -len(p[3]), p[1]))
    take(rest[0])

for p in chosen:
    print(f'{p[0]}\t{p[1]}')
print(f'# {len(chosen)} pages, {len(units)} business units: {dict(units)}', file=sys.stderr)
print(f'# features: {dict(counts)}', file=sys.stderr)
print(f'# available: { {k: sum(k in p[3] for p in pages) for k in FEATURES} }', file=sys.stderr)
