"""The page list of the review tool (tools/review/pages.json): every standard page (/std, not
fragments, drafts or the library) with its title and business unit, sorted by unit and path.
usage: python3 -I review-pages.py <content dir> <out json>"""
import html
import json
import os
import re
import sys

content, out = sys.argv[1].rstrip('/'), sys.argv[2]
root = os.path.join(content, 'std')
pages = []
for d, _, fs in os.walk(root):
    if any(part in d for part in ('/fragments', '/drafts', '/.da')):
        continue
    for f in fs:
        if not f.endswith('.plain.html'):
            continue
        s = open(os.path.join(d, f), encoding='utf8').read()
        path = '/' + os.path.relpath(os.path.join(d, f), root)[:-len('.plain.html')]
        title = re.search(r'<div><div>title</div><div>(.*?)</div></div>', s, re.S)
        if not title:
            title = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
        text = html.unescape(re.sub(r'<[^>]+>', '', title.group(1))).strip() if title else path.rsplit('/', 1)[-1]
        text = re.sub(r'\s*\|\s*Stryker\s*$', '', re.sub(r'\s+', ' ', text))
        unit = path.split('/')[3] if path.count('/') >= 4 else ''
        pages.append({'path': path, 'title': text, 'unit': unit})
pages.sort(key=lambda p: (p['unit'], p['path']))
json.dump({'generated': 'from content/std by tools/importer/standardise/review-pages.py', 'pages': pages},
          open(out, 'w', encoding='utf8'), indent=0, ensure_ascii=False)
print(len(pages), 'pages →', out)
