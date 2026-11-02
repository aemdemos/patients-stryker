"""Which pages / XFs of an import run the grid layouts change: those with a responsive-grid
row (two or more columns on a line, AEM line filling) that is not one of the split widths
(6|6, 8|4, 4|8, 4|4|4, 3|3|3|3) stacked on phones with no tablet setting, or that is in a
nested grid. Reads the exports in .corp-exports.
usage: python3 -I grid-affected.py <run dir>   → <run dir>/grid-pages.txt, grid-xfs.txt"""
import json
import os
import sys

R = '/backups/aemdemos/patients-stryker/repo'
EXPORTS = f'{R}/.corp-exports'
SPLITS = {'6,6', '8,4', '4,8', '4,4,4', '3,3,3,3'}
run = sys.argv[1]


def rw(v, bp):
    d = (v.get('cq:responsive') or {}).get(bp) or {}
    w = d.get('width')
    o = d.get('offset')
    return (int(w) if str(w).isdigit() else None, int(o) if str(o).isdigit() else None, d.get('behavior'))


def changed(node, total=12):
    if not isinstance(node, dict):
        return False
    kids = [v for v in node.values() if isinstance(v, dict) and 'sling:resourceType' in v]
    sized = [v for v in kids if rw(v, 'default')[0] and rw(v, 'default')[0] < total]
    if len(sized) > 1:
        rows, row, used = [], [], 0
        for v in kids:
            w, o, beh = rw(v, 'default')
            if not w or w >= total:
                rows.append(row)
                row, used = [], 0
                continue
            if beh == 'hide':
                continue
            if row and (used + w + (o or 0) > total or beh == 'newline'):
                rows.append(row)
                row, used = [], 0
            row.append(v)
            used += w + (o or 0)
        rows.append(row)
        for r in rows:
            if len(r) < 2:
                continue
            widths = ','.join(str(rw(v, 'default')[0]) for v in r)
            offsets = any(rw(v, 'default')[1] for v in r)
            tablet = any(rw(v, 'tablet')[0] or rw(v, 'tablet')[1] or rw(v, 'tablet')[2] not in (None, 'none') for v in r)
            phone_stacked = all(rw(v, 'phone')[0] == 12 and not rw(v, 'phone')[1] and rw(v, 'phone')[2] != 'hide' for v in r)
            if total != 12 or offsets or widths not in SPLITS or tablet or not phone_stacked:
                return True
    for v in node.values():
        if isinstance(v, dict):
            w = rw(v, 'default')[0] if 'sling:resourceType' in v else None
            if changed(v, w if w and w < total else total):
                return True
    return False


def check(urls, to_file, out):
    hits = []
    for url in open(urls).read().split():
        f = to_file(url)
        if f and os.path.exists(f):
            try:
                if changed(json.load(open(f))):
                    hits.append(url)
            except ValueError:
                pass
    open(out, 'w').write(''.join(f'{u}\n' for u in hits))
    return len(hits)


page = lambda u: f"{EXPORTS}/xf-mapping{u.split('stryker.com', 1)[1][:-5]}.json"
xf = lambda u: f"{EXPORTS}/xf-content/{u.split('/content/experience-fragments/', 1)[1].split('?')[0][:-5]}.json"
n_pages = check(f'{run}/urls.txt', page, f'{run}/grid-pages.txt')
n_xfs = check(f'{run}/xf-urls.txt', xf, f'{run}/grid-xfs.txt')
print(f'pages: {n_pages}, XFs: {n_xfs}')
