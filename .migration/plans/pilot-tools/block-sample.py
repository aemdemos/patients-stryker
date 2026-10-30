"""Prints the first block of a given class signature from imported .plain.html files, with the
section it sits in (its Section Metadata), for Block Library samples.
usage: python3 -I block-sample.py "<exact class attribute>" <file> […] [--max-chars N]"""
import sys
from html.parser import HTMLParser

args = sys.argv[1:]
limit = 6000
if '--max-chars' in args:
    i = args.index('--max-chars')
    limit = int(args[i + 1])
    del args[i:i + 2]
want, files = args[0], args[1:]


class Finder(HTMLParser):
    """Records the source span of the first div with class == want, and of section metadata."""

    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.depth = 0
        self.start = None
        self.found = None

    def handle_starttag(self, tag, attrs):
        if tag != 'div':
            return
        self.depth += 1
        if self.found is None and self.start is None and dict(attrs).get('class') == want:
            self.start = (self.getpos(), self.depth)

    def handle_endtag(self, tag):
        if tag != 'div':
            return
        if self.start and self.depth == self.start[1]:
            self.found = (self.start[0], self.getpos())
            self.start = None
        self.depth -= 1


def offset(src, pos):
    line, col = pos
    lines = src.split('\n')
    return sum(len(l) + 1 for l in lines[:line - 1]) + col


for f in files:
    src = open(f).read()
    p = Finder(src)
    p.feed(src)
    if p.found:
        a = offset(src, p.found[0])
        b = offset(src, p.found[1]) + len('</div>')
        print(f'<!-- {f.split("content/")[-1]} -->')
        print(src[a:b][:limit])
        break
