"""Review tool: the snapshot facts (tiles, size, anchors) of every page, both widths in one file
per page (tools/review/snapshot-meta/<page>.json), for the branch preview, where the tiles come
from Document Authoring (/review-snapshots/…, upload-snapshots.sh).
usage: python3 -I tools/review/pack-snapshot-meta.py <snapshots dir> <out dir>"""
import json
import os
import sys

snap, out = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/')
pages = {}
for d, _, fs in os.walk(os.path.join(snap, 'us')):
    if 'meta.json' not in fs:
        continue
    rel = os.path.relpath(d, snap)  # us/en/…/<page>/<width>
    page, width = os.path.dirname(rel), os.path.basename(rel)
    meta = json.load(open(os.path.join(d, 'meta.json'), encoding='utf8'))
    pages.setdefault(page, {})[width] = meta
written = 0
for page, widths in pages.items():
    path = os.path.join(out, f'{page}.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(widths, open(path, 'w', encoding='utf8'), separators=(',', ':'))
    written += 1
print(f'{written} pages → {out}')
