# Standardise pilot: copy the pilot pages and every fragment they link (recursively) from one
# content root to another (rs → std), rewriting the fragment links to the new root. Documents
# already in the target are overwritten (the target is the experiment's copy).
# usage: python3 -I copy-pilot.py <content dir> <page list> [--from rs] [--to std]
import os
import re
import sys

content, page_list = sys.argv[1:3]
opts = sys.argv[3:]
src = opts[opts.index('--from') + 1] if '--from' in opts else 'rs'
dst = opts[opts.index('--to') + 1] if '--to' in opts else 'std'

pages = [p.strip() for p in open(page_list) if p.strip()]
LINK = re.compile(rf'href="(/{src}/[^"#?]*/fragments/[^"#?]*)"')
todo = list(pages)
seen = set()
missing = []
while todo:
    doc = todo.pop().rstrip('/')
    if doc in seen:
        continue
    seen.add(doc)
    f = os.path.join(content, doc.lstrip('/') + '.plain.html')
    if not os.path.exists(f):
        missing.append(doc)
        continue
    html = open(f, encoding='utf8').read()
    todo.extend(LINK.findall(html))
    out = re.sub(rf'href="/{src}/([^"#?]*/fragments/)', rf'href="/{dst}/\1', html)
    out = re.sub(rf'>/{src}/([^<]*/fragments/)', rf'>/{dst}/\1', out)
    target = os.path.join(content, dst, doc[len(src) + 2:] + '.plain.html')
    os.makedirs(os.path.dirname(target), exist_ok=True)
    open(target, 'w', encoding='utf8').write(out)
print(f'{len(pages)} pages, {len(seen) - len(missing)} documents copied to /{dst}; missing: {missing}')
