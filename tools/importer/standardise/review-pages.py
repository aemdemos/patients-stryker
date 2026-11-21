"""The page list of the review tool (tools/review/pages.json): every standard page (/std, not
fragments, drafts or the library) with its title, business unit and template (the AEM template
from the site catalog tools/importer/data/catalog/site.json, matched by the page's EDS name:
lowercase, every run of other characters one '-'), sorted by unit and path.
usage: python3 -I review-pages.py <content dir> <out json> [<site.json>]"""
import html
import json
import os
import re
import sys

content, out = sys.argv[1].rstrip('/'), sys.argv[2]
site_file = sys.argv[3] if len(sys.argv) > 3 else 'tools/importer/data/catalog/site.json'
root = os.path.join(content, 'std')


def eds_name(path):
    # WebImporter.FileUtils.sanitizePath, per segment
    return '/'.join(re.sub(r'[^a-z0-9]+', '-', seg.lower()).strip('-') for seg in path.split('/'))


TEMPLATES = {}
if os.path.exists(site_file):
    for aem_path, facts in json.load(open(site_file, encoding='utf8'))['pages'].items():
        TEMPLATES[eds_name(aem_path)] = facts.get('template', '')
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
        pages.append({'path': path, 'title': text, 'unit': unit, 'template': TEMPLATES.get(path, '')})
pages.sort(key=lambda p: (p['unit'], p['path']))
json.dump({'generated': 'from content/std by tools/importer/standardise/review-pages.py', 'pages': pages},
          open(out, 'w', encoding='utf8'), indent=0, ensure_ascii=False)
print(len(pages), 'pages →', out, '·', sum(1 for p in pages if p['template']), 'with a template')
