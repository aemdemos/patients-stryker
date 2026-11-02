"""Finds the corp source pages whose authored content (page export or a referenced XF) holds
a text: the XF variations whose export contains it, then the pages that reference them
(tools/importer/data/xf-index.js PAGES, dumped to /tmp/xf-pages.json), and pages whose own export contains it.
usage: python3 -I find-text-pages.py "<text>" […]"""
import json
import os
import re
import sys

R = '/backups/aemdemos/patients-stryker/repo'
E = f'{R}/.corp-exports'
# PAGES of tools/importer/data/xf-index.js, dumped as JSON (node: import the module, write PAGES)
pages = json.load(open('/tmp/xf-pages.json'))


def files(root):
    for dp, _, ns in os.walk(root):
        for n in ns:
            if n.endswith('.json') and not n.startswith('_'):
                yield os.path.join(dp, n)


texts = sys.argv[1:]
xf_hits = {t: [] for t in texts}
page_hits = {t: [] for t in texts}
for f in files(f'{E}/xf-content'):
    s = open(f, errors='ignore').read()
    for t in texts:
        if t in s:
            xf_hits[t].append('/content/experience-fragments/' + os.path.relpath(f, f'{E}/xf-content')[:-5])
for f in files(f'{E}/xf-mapping'):
    s = open(f, errors='ignore').read()
    for t in texts:
        if t in s:
            page_hits[t].append('/' + os.path.relpath(f, f'{E}/xf-mapping')[:-5])
for t in texts:
    using = set()
    for xf in xf_hits[t]:
        for page, refs in pages.items():
            if xf in json.dumps(refs):
                using.add(page)
    print(t)
    print('   XFs:', xf_hits[t][:3])
    print('   pages via XF:', sorted(using)[:3], '| pages:', page_hits[t][:3])
