"""Checks uploaded pages: the <main> of each Document Authoring document equals the local
content/<prefix><path>.plain.html (whitespace-normalised). Read only.
usage: python3 -I tools/review/da/verify.py <org/site> <paths file> [every n-th] [content prefix]"""
import os
import re
import subprocess
import sys

repo, paths_file = sys.argv[1:3]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
prefix = sys.argv[4] if len(sys.argv) > 4 else ''
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
paths = [line.strip() for line in open(paths_file, encoding='utf-8') if line.strip()][::step]


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


same = 0
for p in paths:
    res = subprocess.run(['curl', '-s', f'https://admin.da.live/source/{repo}{prefix}{p}.html'],
                         capture_output=True, text=True, timeout=60, check=False)
    m = re.search(r'<main>(.*)</main>', res.stdout, re.S)
    local = open(f'{R}/content{prefix}{p}.plain.html', encoding='utf-8').read()
    if m and norm(m.group(1)) == norm(local):
        same += 1
    else:
        print(f'DIFFERS {prefix}{p} (DA {len(res.stdout)} bytes)')
print(f'{same} of {len(paths)} identical to the local files')
