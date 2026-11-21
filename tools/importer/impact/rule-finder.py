# Rule finder: has another template solved this already? Given an AEM component (`contactus`,
# `columncontrol/cols2`), a source class (`fontsize-1-5-vw`, `aem-GridColumn`) or a word, it
# lists what the corp rule library and the decision tables know about it:
#   - the decision (decisions/component-map.json: status, outcome, note, templates using it)
#   - the library handler for it (tools/importer/corp/corp-component-handlers.js COMPONENTS),
#     with its doc comment, and the other lines of the library that mention it
#   - the pages per AEM template that use the component (data/catalog/site.json) and the
#     template samples that cover it (impact/samples/), so a library change is checked on them
# usage: python3 -I rule-finder.py <query> [more lines]
import json
import os
import re
import sys

H = os.path.dirname(os.path.abspath(__file__))
I = os.path.dirname(H)
query = sys.argv[1]
more = int(sys.argv[2]) if len(sys.argv) > 2 else 12
q = query.lower()

print(f'# {query}\n')

# 1. decision
cmap = json.load(open(os.path.join(I, 'decisions', 'component-map.json'), encoding='utf8'))
rows = [r for r in cmap['rows'] if q in r['component'].lower()]
print('## Decision (decisions/component-map.json)')
for r in rows or []:
    print(f"- {r['component']}: {r['status']} → {r.get('outcome', '')} ({r.get('count', '?')} uses; templates {', '.join(r.get('templates', []))})")
    if r.get('note'):
        print(f"  note: {r['note'][:300]}")
if not rows:
    print('- no component of that name')

# 2. library
lib = os.path.join(I, 'corp')
handlers = open(os.path.join(lib, 'corp-component-handlers.js'), encoding='utf8').read().split('\n')
start = next((i for i, l in enumerate(handlers) if re.match(r'^(export )?const COMPONENTS\b', l)), None)
registry = {}
if start is not None:
    for l in handlers[start + 1:]:
        if l.startswith('};'):
            break
        entry = re.match(r"^\s*'?([\w/*-]+)'?\s*:\s*(\w+)", l) or re.match(r'^\s*(\w+),', l)
        if entry:
            registry[entry.group(1)] = entry.group(2) if entry.lastindex > 1 else entry.group(1)


def doc_comment(fn):
    at = next((i for i, l in enumerate(handlers) if re.match(rf'^(export )?function {fn}\b', l)), None)
    if at is None:
        return None, []
    j, lines = at - 1, []
    while j >= 0 and re.match(r'^\s*(/\*\*|\*|//|\*/)', handlers[j]):
        lines.insert(0, handlers[j].strip())
        j -= 1
    return at + 1, lines


print('\n## Library (tools/importer/corp/)')
matches = [(k, fn) for k, fn in registry.items() if q in k.lower()]
for key, fn in matches:
    line, comment = doc_comment(fn)
    print(f'- handler `{key}` → {fn}() corp-component-handlers.js:{line}')
    for c in comment[:8]:
        print(f'    {c}')
if not matches:
    print('- no handler keyed by it')
mentions = []
for d, _, files in os.walk(lib):
    for f in sorted(files):
        if not f.endswith('.js'):
            continue
        for n, l in enumerate(open(os.path.join(d, f), encoding='utf8'), 1):
            if q in l.lower():
                mentions.append(f'{os.path.relpath(os.path.join(d, f), lib)}:{n}: {l.strip()[:150]}')
family = None
if not mentions and re.search(r'\d', q):
    # a class with numbers (fontsize-1-5-vw): the library handles its family by pattern
    head, tail = re.split(r'\d', q, maxsplit=1)[0], re.split(r'\d(?!.*\d)', q)[-1]
    family = (head, tail.strip('-'))
    for d, _, files in os.walk(lib):
        for f in sorted(files):
            if f.endswith('.js'):
                for n, l in enumerate(open(os.path.join(d, f), encoding='utf8'), 1):
                    low = l.lower()
                    if family[0] and family[0] in low and (not family[1] or family[1] in low):
                        mentions.append(f'{os.path.relpath(os.path.join(d, f), lib)}:{n}: {l.strip()[:150]}')
label = f"its family ({family[0]}…{family[1]}) on" if family else 'mentioned on'
print(f'- {label} {len(mentions)} lines' + (':' if mentions else ''))
for m in mentions[:more]:
    print(f'    {m}')

# 3. pages
site = json.load(open(os.path.join(I, 'data', 'catalog', 'site.json'), encoding='utf8'))['pages']
using = {}
for path, v in site.items():
    if any(q in c.lower() for c in v['components']):
        using.setdefault(v['template'], []).append(path)
print('\n## Pages using it (data/catalog/site.json)')
for t, paths in sorted(using.items(), key=lambda x: -len(x[1])):
    print(f'- {t}: {len(paths)} pages, e.g. {paths[0]}')
if not using:
    print('- no page has a component of that name (a class or word: see the library lines above)')
templates = json.load(open(os.path.join(H, 'templates.json'), encoding='utf8'))
print('\n## Samples that cover it (impact/samples/)')
covered = False
for t in templates:
    sample = [l.strip() for l in open(os.path.join(H, 'samples', f'{t}.txt'), encoding='utf8') if l.strip()]
    hit = [p for p in sample if p in site and any(q in c.lower() for c in site[p]['components'])]
    if hit:
        covered = True
        print(f'- {t}: {len(hit)} of {len(sample)} sample pages, e.g. {hit[0]}')
if not covered:
    print('- none: add a page that uses it to a sample before changing its rule')
