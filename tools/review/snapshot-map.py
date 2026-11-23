"""EDS path -> source URL for the pages of the main branch query index (client review
snapshots). Source URLs come from the export file names (.migration/xf-mapping, letter case
kept), never from EDS paths; the EDS path is the importer's cleaned name of each segment
(lowercase, every run of other characters one '-', no '-' at the ends; index -> trailing slash
form kept as /index for matching).
usage: python3 -I tools/review/snapshot-map.py <query-index.json> <xf-mapping dir> <out.json>"""
import json
import os
import re
import sys

index_file, mapping_dir, out = sys.argv[1:4]
paths = [r['path'] for r in json.load(open(index_file))['data']]


def clean(seg):
    return re.sub(r'[^a-z0-9]+', '-', seg.lower()).strip('-')


eds_to_src = {}
for root, _dirs, files in os.walk(mapping_dir):
    for f in files:
        if not f.endswith('.json') or f.startswith('_'):
            continue
        rel = os.path.relpath(os.path.join(root, f), mapping_dir)[:-5]
        src = '/' + rel.replace(os.sep, '/')
        eds = '/' + '/'.join(clean(s) for s in src.strip('/').split('/'))
        eds_to_src.setdefault(eds, src)

result, missing = {}, []
for p in paths:
    key = p.rstrip('/') or '/'
    src = eds_to_src.get(key) or eds_to_src.get(key + '/index')
    if src:
        result[p] = f'https://www.stryker.com{src}.html'
    else:
        missing.append(p)
json.dump(result, open(out, 'w'), indent=1)
print(f'{len(result)} mapped, {len(missing)} without an export: {missing[:10]}')
