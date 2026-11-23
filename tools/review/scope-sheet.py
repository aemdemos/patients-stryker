"""Review tool: the first content of the migration scope sheet (Document Authoring
/review/migration-scope): one row per source page of the migration catalog
(tools/importer/data/catalog/site.json: source path, AEM template), with its EDS path by the
importer's rule (each segment lowercase, every run of other characters one '-', no '-' at the
ends; .../index -> .../). Known pairs (eds -> source URL, e.g. the first shots' map) win over the
rule. Written once; after that the AOE team edits the sheet in DA.
usage: python3 -I tools/review/scope-sheet.py <site.json> <known pairs map.json> <out.json>"""
import json
import re
import sys

site_file, pairs_file, out = sys.argv[1:4]
site = json.load(open(site_file))['pages']
pairs = json.load(open(pairs_file))  # eds path -> https://www.stryker.com/<source>.html


def clean(seg):
    return re.sub(r'[^a-z0-9]+', '-', seg.lower()).strip('-')


def eds_of(src):
    segs = [clean(s) for s in src.strip('/').split('/')]
    if segs and segs[-1] == 'index':
        return '/' + '/'.join(segs[:-1]) + '/'
    return '/' + '/'.join(segs)


known = {u[len('https://www.stryker.com'):-len('.html')]: eds for eds, u in pairs.items()}
rows = []
for src, info in site.items():
    rows.append({
        'source': f'https://www.stryker.com{src}.html',
        'eds': known.get(src) or eds_of(src),
        'template': info.get('template') or '',
    })
missing = [eds for eds, u in pairs.items() if u[len('https://www.stryker.com'):-len('.html')] not in site]
for eds in missing:
    rows.append({'source': pairs[eds], 'eds': eds, 'template': ''})
rows.sort(key=lambda r: (r['eds'], r['source']))
json.dump({'total': len(rows), 'limit': len(rows), 'offset': 0, 'data': rows, ':colWidths': [520, 520, 160], ':sheetname': 'data', ':type': 'sheet'}, open(out, 'w'))
eds_count = {}
for r in rows:
    eds_count[r['eds']] = eds_count.get(r['eds'], 0) + 1
print(f"{len(rows)} rows, {len(known)} known pairs, {len(missing)} known pairs not in the catalog, "
      f"{sum(1 for v in eds_count.values() if v > 1)} EDS paths in two rows")
