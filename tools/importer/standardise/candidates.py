# Standardise pilot: the data the review overlay reads (data/candidates.json): per pilot page its
# live stryker.com URL and its Columns instances (in /std), with their cluster; per cluster a
# plain-words label and its instances on the pilot pages. Pre-selection results (preselect.mjs)
# are merged in when present.
# usage: python3 -I candidates.py <instances.jsonl> <clusters-columns.json> <pilot pages>
#          <site.json> <out candidates.json> [--preselect <preselect.json>]
import json
import re
import sys

inst_file, clusters_file, pages_file, site_file, out = sys.argv[1:6]
opts = sys.argv[6:]
pre = json.load(open(opts[opts.index('--preselect') + 1])) if '--preselect' in opts else {}

instances = [json.loads(line) for line in open(inst_file) if line.strip()]
clusters = json.load(open(clusters_file))
pilot = [p.strip() for p in open(pages_file) if p.strip()]
site = json.load(open(site_file))['pages']


def clean(segment):
    # WebImporter.FileUtils.sanitizeFilename: lowercase, other characters → one '-'
    return re.sub(r'[^a-z0-9]+', '-', segment.lower()).strip('-')


eds_to_aem = {'/'.join(clean(s) for s in k.split('/')): k for k in site}
cluster_of = {m: c for c in clusters for m in c['members']}


def label(c):
    s = c['structure'].split(': ', 1)[-1].replace('media', 'image').replace(' | ', ' + ')
    layout = c['layout'].replace('widths equal', 'equal widths').replace(', grid -', '')
    design = ', '.join(c['treatment']) if c['treatment'] and c['treatment'] != ['(tail)'] else ''
    return f"{c['structure'].split(':')[0]}: {s}; {layout}" + (f'; {design}' if design else '') \
        + (' (other looks of this layout)' if c.get('tail') else '')


to_std = lambda p: re.sub(r'^/rs/', '/std/', p)
pages = {}
for page in pilot:
    aem = eds_to_aem.get(page[len('/rs'):], page[len('/rs'):])
    pages[to_std(page)] = {'live': f'https://www.stryker.com{aem}.html', 'instances': []}
used = {}
for i in instances:
    if i['name'] != 'columns':
        continue
    for page in i['pages']:
        if page not in pilot:
            continue
        c = cluster_of.get(i['id'])
        sid = to_std(i['id'])
        entry = {
            'id': sid, 'doc': to_std(i['doc']), 'section': i['section'], 'block': i['block'],
            'hash': i['hash'], 'cluster': c['id'] if c else None, 'fragment': '/fragments/' in i['doc'],
        }
        if sid in pre:
            entry['eligible'] = pre[sid].get('eligible', [])
            if pre[sid].get('same'):
                entry['preselect'] = pre[sid]['same']
        pages[to_std(page)]['instances'].append(entry)
        if c:
            used.setdefault(c['id'], set()).add(sid)
data = {
    'pages': pages,
    'clusters': {c['id']: {'label': label(c), 'size': len(c['members']), 'pilot': sorted(used.get(c['id'], []))}
                 for c in clusters if c['id'] in used},
}
json.dump(data, open(out, 'w'), indent=1)
n = sum(len(p['instances']) for p in pages.values())
print(f"{len(pages)} pages, {n} Columns instances ({sum(1 for p in pages.values() for i in p['instances'] if i['fragment'])} in fragments), "
      f"{len(data['clusters'])} clusters → {out}")
