"""Prints grid-measure.mjs output: per page and viewport, each row's columns."""
import json
import sys

d = json.load(open(sys.argv[1]))
for u, v in d.items():
    print(u)
    if 'error' in v:
        print('  ', v['error'])
        continue
    for w in ('375', '768', '1440'):
        print(' ', w)
        for r in v[w]:
            cols = ' || '.join(
                f"{c['cls'].replace('aem-GridColumn--', '')} x{c['x']} y{c['y']} w{c['w']} pad {c['pad']} {c['d']} [{c['t'][:15]}]"
                for c in r['cols'])
            print('    grid', r['grid'], cols)
