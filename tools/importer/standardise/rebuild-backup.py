"""Rebuilds the documents as they were before standardisation (the apply backup) from the /rs
originals, with copy-pilot.py's fragment-link rewrite (/rs/…/fragments/ → /std/…/fragments/).
For when the local backup is lost (a restart wipes /tmp); checks itself against an archived
backup when one is given.
usage: python3 -I rebuild-backup.py <content dir> <backup dir> [<archived backup dir>]"""
import os
import re
import sys

content, backup = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/')
archive = sys.argv[3].rstrip('/') if len(sys.argv) > 3 else None
std_root = os.path.join(content, 'std')


def to_std(html):
    out = re.sub(r'href="/rs/([^"#?]*/fragments/)', r'href="/std/\1', html)
    return re.sub(r'>/rs/([^<]*/fragments/)', r'>/std/\1', out)


written = checked = mismatch = 0
for d, _, fs in os.walk(std_root):
    if '/drafts' in d or '/.da' in d:
        continue
    for f in fs:
        if not f.endswith('.plain.html'):
            continue
        rel = os.path.relpath(os.path.join(d, f), content)  # std/…
        src = os.path.join(content, 'rs', os.path.relpath(rel, 'std'))
        if not os.path.exists(src):
            print('no /rs original:', rel)
            continue
        html = to_std(open(src, encoding='utf8').read())
        if archive and os.path.exists(os.path.join(archive, rel)):
            checked += 1
            if open(os.path.join(archive, rel), encoding='utf8').read() != html:
                mismatch += 1
                print('differs from the archive:', rel)
        out = os.path.join(backup, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf8').write(html)
        written += 1
print(f'{written} documents rebuilt → {backup}; checked against the archive: {checked}, differing: {mismatch}')
