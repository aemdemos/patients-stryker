"""Classifies the differences between two import runs (same pages, newer code / snapshot):
per file, which known changes explain it (grid options, ruled titles as <u>, metadata) and
what is left after removing them. usage: python3 -I diff-kinds.py <old run> <new run>"""
import difflib
import os
import re
import sys
from collections import Counter

old_dir, new_dir = (os.path.join(d, 'content') for d in sys.argv[1:3])
kinds = Counter()
unexplained = []


def lines(path):
    return re.sub(r'>\s*<', '>\n<', open(path).read()).split('\n')


for dp, _, ns in os.walk(new_dir):
    for n in ns:
        if not n.endswith('.plain.html'):
            continue
        new = os.path.join(dp, n)
        rel = os.path.relpath(new, new_dir)
        old = os.path.join(old_dir, rel)
        if not os.path.exists(old):
            kinds['new file'] += 1
            continue
        a, b = lines(old), lines(new)
        if a == b:
            kinds['same'] += 1
            continue
        changed = [l for l in difflib.unified_diff(a, b, lineterm='', n=0)
                   if l[:1] in '+-' and not l.startswith(('+++', '---'))]
        tags = set()
        rest = []
        for l in changed:
            if 'grid-' in l or 'Columns' in l:
                tags.add('grid / columns')
            elif '<u>' in l or '</u>' in l:
                tags.add('ruled title <u>')
            else:
                rest.append(l)
        if rest:
            tags.add('other')
            unexplained.append((rel, rest[:6]))
        kinds[' + '.join(sorted(tags))] += 1
for k, v in kinds.most_common():
    print(f'{v:5}  {k}')
print(f'\n{len(unexplained)} files with other changes; first ones:')
for rel, rest in unexplained[:25]:
    print('==', rel)
    for l in rest:
        print('   ', l[:180])
