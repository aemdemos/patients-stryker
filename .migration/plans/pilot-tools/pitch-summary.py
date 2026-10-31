"""Groups pitch.mjs output by tag, block and font size: the preview's line pitch against the
live one (median), how many blocks, and the live pitch as a ratio of the font size (the line
height that would give it). usage: python3 -I pitch-summary.py <pitch.jsonl> [min count]"""
import json
import statistics
import sys
from collections import defaultdict

rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
minimum = int(sys.argv[2]) if len(sys.argv) > 2 else 2
groups = defaultdict(list)
for r in rows:
    groups[(r['tag'], r['block'] or 'default', r['size'])].append(r)
print(f"{'tag':4} {'block':12} {'size':>6} {'n':>3} {'ours':>6} {'live':>6} {'diff':>6} {'live/size':>9} {'ours lh':>8}  styles")
for (tag, blk, size), rs in sorted(groups.items(), key=lambda x: (-len(x[1]))):
    if len(rs) < minimum:
        continue
    ours = statistics.median(r['pitch'] for r in rs)
    live = statistics.median(r['livePitch'] for r in rs)
    lh = statistics.median(r['lh'] for r in rs)
    styles = sorted({r['styles'] for r in rs})
    print(f"{tag:4} {blk[:12]:12} {size:6.2f} {len(rs):3} {ours:6.1f} {live:6.1f} {live - ours:6.1f} {live / size:9.3f} {lh / size:8.3f}  {', '.join(styles)[:60]}")
