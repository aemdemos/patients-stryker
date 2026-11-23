"""The .so files of a Debian package (.deb: an ar archive with data.tar.xz) into a folder.
usage: extract-deb-libs.py <deb> <out dir>"""
import io
import os
import sys
import tarfile

deb, out = sys.argv[1], sys.argv[2]
data = open(deb, 'rb').read()
assert data[:8] == b'!<arch>\n', 'not an ar archive'
pos = 8
os.makedirs(out, exist_ok=True)
while pos < len(data):
    head = data[pos:pos + 60]
    name = head[:16].decode().strip().rstrip('/')
    size = int(head[48:58].decode().strip())
    body = data[pos + 60:pos + 60 + size]
    pos += 60 + size + (size % 2)
    if name.startswith('data.tar'):
        with tarfile.open(fileobj=io.BytesIO(body)) as t:
            for m in t.getmembers():
                base = os.path.basename(m.name)
                if '.so' in base and (m.isfile() or m.issym()):
                    if m.issym():
                        target = os.path.basename(m.linkname)
                        src = t.extractfile(t.getmember(os.path.join(os.path.dirname(m.name), target)))
                    else:
                        src = t.extractfile(m)
                    open(os.path.join(out, base), 'wb').write(src.read())
                    print(base)
