"""Checks the class tokens (block options, section styles) used in block library documents
against the code: tokens that no block / style file mentions are reported as stale.
usage: python3 -I library-check.py <library doc .html> […]"""
import glob
import re
import sys

R = '/backups/aemdemos/patients-stryker/repo'
code = ''.join(open(f).read() for f in glob.glob(f'{R}/blocks/*/*.css') + glob.glob(f'{R}/blocks/*/*.js')
               + glob.glob(f'{R}/styles/*.css') + glob.glob(f'{R}/scripts/*.js') + glob.glob(f'{R}/templates/*/*.css'))
# options the code reads by pattern (positions, spacing, grid, sizes)
PATTERNS = [r'^(top|left|right|bottom)-\d+$', r'^(padding|margin)-(top|bottom|left|right)-\d+$',
            r'^grid-', r'^cell-\d+-', r'^(size|copy-size|label|p|h)-[\d-]+$', r'^cols-\d$']
for doc in sys.argv[1:]:
    s = open(doc).read()
    tokens = set()
    for cls in re.findall(r'class="([^"]+)"', s):
        tokens.update(cls.split())
    for m in re.finditer(r'<div>style</div>\s*<div>(.*?)</div>', s):
        tokens.update(t.strip() for t in m.group(1).split(','))
    stale = sorted(t for t in tokens if t and not any(re.match(p, t) for p in PATTERNS)
                   and not re.search(rf'(?<![\w-]){re.escape(t)}(?![\w-])', code))
    print(doc.split('/')[-1], 'stale:', stale)
