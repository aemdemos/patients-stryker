# A template's impact sample: the given hard pages, then greedily the pages that add the most AEM
# components not yet covered (data/catalog/site.json): up to <max> pages, stopping once every
# component is covered and the sample has 10 pages. Pages in the import page cache only; without a
# cache, from all pages.
# usage: python3 -I pick-sample.py <repo> <aem template> <max> <out list> [hard page path …]
import json, os, sys
R, t, n, out, *must = sys.argv[1:]
n = int(n)
site = json.load(open(f'{R}/tools/importer/data/catalog/site.json'))['pages']
P = os.path.join(R, '.migration/plans/pilot-tools/out/page-cache/pages')
cached = set()
for f in (os.listdir(P) if os.path.isdir(P) else []):
    if f.endswith('.json'):
        u = json.load(open(os.path.join(P, f))).get('url', '')
        cached.add(u.replace('https://www.stryker.com', '').removesuffix('.html'))
pages = {p: set(v['components']) for p, v in site.items() if v['template'] == t and (p in cached or not cached)}
pick, seen = [], set()
for m in must:
    if m in pages: pick.append(m); seen |= pages[m]
    else: print('not cached or not this template:', m)
while len(pick) < n:
    best = max((p for p in pages if p not in pick), key=lambda p: (len(pages[p] - seen), len(pages[p])), default=None)
    if not best or (len(pick) >= 10 and not pages[best] - seen): break
    pick.append(best); seen |= pages[best]
allc = set().union(*pages.values())
print(f'{t}: {len(pick)} pages cover {len(seen)} of {len(allc)} components used by its {len(pages)} cached pages; missing: {sorted(allc - seen)[:12]}')
open(out, 'w').write('\n'.join(pick) + '\n')
for p in pick: print('  ', p)
