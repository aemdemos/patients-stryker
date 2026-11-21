# Compares a template's sample import with its accepted baseline: per document same, changed,
# new or missing; for a changed one its first differences as tag-level hunks (the HTML split at
# tags). Heading ids and whitespace between tags don't count (EDS derives the ids when it
# renders; the runner numbers repeated headings). Also lists fragment links that point to no
# document of the import (every fragment the sample uses is imported with it).
# usage: python3 -I compare.py <baseline dir> <import content dir> [hunks per document]
import difflib
import os
import re
import sys

base_dir, out_dir = sys.argv[1:3]
hunks = int(sys.argv[3]) if len(sys.argv) > 3 else 3


def documents(root):
    found = {}
    for d, _, files in os.walk(root):
        for f in files:
            if f.endswith('.plain.html'):
                path = '/' + os.path.relpath(os.path.join(d, f), root)[:-len('.plain.html')]
                found[path] = os.path.join(d, f)
    return found


def tokens(html):
    html = re.sub(r'(<h[1-6]) id="[^"]*"', r'\1', html)
    return [t.strip() for t in re.split(r'(?=<)', html) if t.strip()]


base, out = documents(base_dir), documents(out_dir)
same, changed = [], []
for path in sorted(set(base) & set(out)):
    a = tokens(open(base[path], encoding='utf8').read())
    b = tokens(open(out[path], encoding='utf8').read())
    if a == b:
        same.append(path)
        continue
    ops = [o for o in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if o[0] != 'equal']
    changed.append((path, [(''.join(a[i1:i2]), ''.join(b[j1:j2])) for _, i1, i2, j1, j2 in ops], len(ops)))
new = sorted(set(out) - set(base))
missing = sorted(set(base) - set(out))
broken = []
for path, file in sorted(out.items()):
    for href in re.findall(r'href="(/[^"#?]*)"', open(file, encoding='utf8').read()):
        if '/fragments/' in href and href not in out:
            broken.append(f'{path} → {href}')

print(f'documents {len(out)}: same {len(same)}, changed {len(changed)}, new {len(new)}, missing {len(missing)}; broken fragment links {len(broken)}')
for path, ops, n in changed:
    print(f'  changed {path} ({n} differences)')
    for old, now in ops[:hunks]:
        print(f'    - {old[:220]}')
        print(f'    + {now[:220]}')
for path in new:
    print(f'  new {path}')
for path in missing:
    print(f'  missing {path}')
for link in broken[:20]:
    print(f'  broken link {link}')
