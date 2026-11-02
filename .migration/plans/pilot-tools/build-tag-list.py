"""The tag list sheet for the Related Categories block (Tag | Label | Link), from the corp
exports and the live boxes (tagcrumbs.mjs output):
  python3 -I build-tag-list.py <tagcrumbs.json> <sheet out.json> <catalog out.json>
- each tag's landing page: a portfolio / capability / specialty page under /us/en/portfolios
  (the page's own tag in its namespace), label = the page title, as stryker.com shows it
- links seen on live that are not such a page (Operating room, Surgery center, Mako): the
  namespace tag every page showing the link carries
- links as EDS paths (no .html)
Prints how many live boxes the list reproduces (portfolio → capability → specialty, the
page's tags in their order).
"""
import json
import os
import re
import sys
from collections import defaultdict

tagcrumbs, sheet_out, catalog_out = sys.argv[1:]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../xf-mapping')
NS = ['portfolio', 'capability', 'specialty']
strip = lambda t: t.split(':', 1)[-1]  # noqa: E731
data = json.load(open(tagcrumbs))

landing = {}
for dp, _, ns in os.walk(os.path.join(ROOT, 'us/en/portfolios')):
    for n in ns:
        d = json.load(open(os.path.join(dp, n)))
        tpl = (d.get('cq:template') or '').rsplit('/', 1)[-1]
        if tpl in NS:
            link = '/' + os.path.relpath(os.path.join(dp, n), ROOT)[:-5] + '.html'
            landing[link] = (tpl, ' '.join((d.get('jcr:title') or '').split()), [strip(t) for t in d.get('cq:tags', [])])

tags = {}
seen = defaultdict(lambda: defaultdict(int))
for r in data:
    ptags = {strip(t) for t in r['tags']}
    for g in r['groups'] or []:
        for it in g:
            lp = landing.get(it['link'])
            if lp:
                for t in lp[2]:
                    if t.split('/')[0] == lp[0] and t in ptags:
                        seen[it['link']][t] += 1
for link, counts in seen.items():
    tags[max(counts, key=counts.get)] = {'label': landing[link][1], 'link': link}
# a landing page that also stands for another tag of its namespace (arthroscopic-resection
# shows for specialty/fluid-management too): that tag too, unless it has a page of its own
for link, counts in seen.items():
    for t in counts:
        tags.setdefault(t, {'label': landing[link][1], 'link': link})
for link, (tpl, title, ptags) in landing.items():
    own = [t for t in ptags if t.split('/')[0] == tpl]
    name = link.rsplit('/', 1)[-1][:-5].lower()
    pick = [t for t in own if t.split('/')[-1].lower() == name] or (own if len(own) == 1 else [])
    if pick:
        tags.setdefault(pick[0], {'label': title, 'link': link})
known = {e['link'] for e in tags.values()}
for link in {i['link'] for r in data for g in (r['groups'] or []) for i in g} - known:
    pages = [r for r in data if any(i['link'] == link for g in (r['groups'] or []) for i in g)]
    common = None
    for r in pages:
        s = {strip(t) for t in r['tags'] if strip(t).split('/')[0] in NS}
        common = s if common is None else common & s
    cands = sorted(t for t in (common or set()) if t not in tags)
    if len(cands) == 1:
        label = next(i['label'] for r in pages for g in r['groups'] for i in g if i['link'] == link)
        tags[cands[0]] = {'label': label, 'link': link}

same = order = items = 0
for r in data:
    if r['groups'] is None:
        continue
    ptags = [strip(t) for t in r['tags']]
    built = [g for g in ([tags[t]['link'] for t in ptags if t.split('/')[0] == ns and t in tags] for ns in NS) if g]
    live = [[i['link'] for i in g] for g in r['groups'] if g]
    if built == live:
        same += 1
    elif [sorted(g) for g in built] == [sorted(g) for g in live]:
        order += 1
    else:
        items += 1
print(f'{len(tags)} tags; live boxes reproduced: {same}, order differs: {order}, items differ: {items}')

# EDS path: the cleaned-up AEM names (resolve.mjs edsName), no .html
eds = lambda link: '/'.join(re.sub(r'[^a-z0-9]+', '-', seg.lower()).strip('-') for seg in (link[:-5] if link.endswith('.html') else link).split('/'))  # noqa: E731
rows = [{'Tag': t, 'Label': e['label'], 'Link': eds(e['link'])} for t, e in sorted(tags.items())]
json.dump({'total': len(rows), 'offset': 0, 'limit': len(rows), 'data': rows, ':type': 'sheet'},
          open(sheet_out, 'w'), indent=1)
json.dump(rows, open(catalog_out, 'w'), indent=1)
