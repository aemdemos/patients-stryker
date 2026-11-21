# Standardise pilot: the pages to pilot on, greedy cover of the clusters of the largest groups
# (every cluster of the top N structure + layout groups at least once, then filled up to the
# page budget with the pages that add the most instances of those groups).
# usage: python3 -I pick-pilot.py <clusters-<block>.json> <instances.jsonl> <out list>
#          [--groups 10] [--pages 30]
import collections
import json
import sys

clusters_file, instances_file, out = sys.argv[1:4]
opts = sys.argv[4:]
top = int(opts[opts.index('--groups') + 1]) if '--groups' in opts else 10
budget = int(opts[opts.index('--pages') + 1]) if '--pages' in opts else 30

clusters = json.load(open(clusters_file))
instances = {json.loads(line)['id']: json.loads(line) for line in open(instances_file) if line.strip()}
groups = sorted({(c['structure'], c['layout']): c['group'] for c in clusters}.items(), key=lambda kv: -kv[1])
keep = {g for g, _ in groups[:top]}
wanted = [c for c in clusters if (c['structure'], c['layout']) in keep]
# the product intro (page-intro) is the template's own: every page has it, no need to cover it
pages_of = collections.defaultdict(set)
weight = collections.Counter()
for c in wanted:
    for m in c['members']:
        for p in instances[m]['pages']:
            pages_of[p].add(c['id'])
            weight[p] += 1
left = {c['id'] for c in wanted}
picked = []
while left and len(picked) < budget:
    best = max(pages_of, key=lambda p: (len(pages_of[p] & left), weight[p]))
    if not pages_of[best] & left:
        break
    picked.append(best)
    left -= pages_of[best]
for p in sorted(pages_of, key=lambda p: -weight[p]):
    if len(picked) >= budget:
        break
    if p not in picked:
        picked.append(p)
open(out, 'w').write('\n'.join(picked) + '\n')
covered = {c for p in picked for c in pages_of[p]}
print(f'{len(picked)} pages; clusters of the top {top} groups covered: {len(covered)} of {len(wanted)}; '
      f'instances on them: {sum(weight[p] for p in picked)}')
