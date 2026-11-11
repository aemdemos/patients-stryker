# Standardisation: the Block Library of the standard (the converted /std pages). For every
# standard variant and section style, a real, short example from the /std documents plus its
# library-metadata (name, authoring rules, search tags), one document per block, and the
# blocks.json index (data + options sheets) in the shared library's format. Written under
# <content>/std/.da/library/ (local; it is not the shared /.da/library, whose blocks the main
# branch renders).
# usage: python3 -I library.py <content dir> [--org strykerenterprise --site stryker-com]
import json
import os
import re
import sys

content = sys.argv[1].rstrip('/')
opts = sys.argv[2:]
org = opts[opts.index('--org') + 1] if '--org' in opts else 'strykerenterprise'
site = opts[opts.index('--site') + 1] if '--site' in opts else 'stryker-com'
ROOT = f'{content}/std'
OUT = f'{ROOT}/.da/library'


def sections(s):
    depth, start, out = 0, 0, []
    for m in re.finditer(r'<(/?)div\b[^>]*>', s):
        if not m.group(1):
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(s[start:m.end()])
    return out


def balanced(s, start):
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', s[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return s[start:start + m.end()]
    return s[start:]


DOCS = []
for d, _, fs in os.walk(ROOT):
    if '/.da' in d or '/drafts' in d:
        continue
    for f in sorted(fs):
        if f.endswith('.plain.html'):
            DOCS.append(os.path.join(d, f))
DOCS.sort()
TEXT = {p: open(p, encoding='utf8').read() for p in DOCS}


def plain_len(h):
    return len(re.sub(r'<[^>]+>', '', h))


def block_example(cls, min_len=60, max_len=900, need=None):
    """the shortest real block with exactly this class list (and enough text)"""
    best = None
    for p, s in TEXT.items():
        if '/fragments/' in p:
            continue
        for m in re.finditer(rf'<div class="{re.escape(cls)}">', s):
            b = balanced(s, m.start())
            n = plain_len(b)
            if n < min_len or n > max_len or (need and not re.search(need, b)):
                continue
            if best is None or n < best[0]:
                best = (n, b, p)
    return best


def section_example(style, max_len=700, need=None):
    """a real section whose styles include `style`, text only (no blocks), short"""
    best = None
    for p, s in TEXT.items():
        for sec in sections(s):
            m = re.search(r'<div><div>style</div><div>([^<]*)</div></div>', sec)
            if not m or style not in [t.strip() for t in m.group(1).split(',')]:
                continue
            body = re.sub(r'<div class="section-metadata">.*', '', sec, flags=re.S)
            if re.search(r'<div class="(?!section-metadata)', body):
                continue
            n = plain_len(body)
            if n < 40 or n > max_len or (need and not re.search(need, sec)):
                continue
            if best is None or n < best[0]:
                best = (n, sec, p)
    return best


def meta(name, description, tags):
    cell = lambda t: f'<div>{t}</div>'
    row = lambda k, v: f'<div>{cell(k)}{cell(v)}</div>'
    return ('<div class="library-metadata">' + row('name', name) + row('description', description)
            + row('searchtags', tags) + '</div>')


def entry(sample, name, description, tags, section_style=None):
    sm = ''
    if section_style:
        sm = f'<div class="section-metadata"><div><div>style</div><div>{section_style}</div></div></div>'
    return f'<div>{sample}{meta(name, description, tags)}{sm}</div>'


COMMON = ('No sizes, fonts, colours, widths or boxes are authored: the variant owns the look. Use '
          'heading levels, Bold, Italic and links only (Bold + Italic = gold). Pages on the standard '
          'set the page metadata type-scale | standard.')
BLOCKS = {
    'columns': [
        ('columns media-text', 'Columns (media-text) – Media + text',
         'Two cells: an image or video (a Dynamic Media link, its text = alt text) and text; the order of '
         'the cells puts the image left or right. Text cell: a Heading 2 or 3 title, paragraphs, a list, '
         'a link alone on its line as the button. Equal halves from 600px, stacked on phones.',
         'columns, media, image, video, text, side by side'),
        ('columns card-grid', 'Columns (card-grid) – Cards',
         '2 to 4 cells in a row, each an image above its text: a Heading 3 title, a short paragraph, a '
         'link. Two per row from 600px, all in a row from 900px.',
         'columns, cards, grid, features, image, three up, four up'),
        ('columns text-columns', 'Columns (text-columns) – Text columns',
         '2 to 4 text cells: a Heading 2 (section title) or Heading 3, paragraphs and lists. Two per row '
         'from 600px, all in a row from 900px.',
         'columns, text, two columns, at a glance'),
        ('columns feature-statement', 'Columns (feature-statement) – Feature statement',
         'A statement beside an image. Text cell: a Heading 2 statement (its Bold words in Futura bold, '
         'the other words in the light serif), a Heading 3 subhead, short serif copy. Image cell: a '
         'Dynamic Media link.', 'columns, statement, large headline, feature'),
        ('columns image-row', 'Columns (image-row) – Image row',
         '2 to 4 cells, each an image (Dynamic Media link) or video, no text. One per row on phones, two '
         'from 600px, all in a row from 900px.', 'columns, images, gallery, media pair'),
        ('columns page-intro', 'Columns (page-intro) – Product intro',
         'The product page opening under the hero: cell 1 a Bold + Italic Heading 1 (the gold product '
         'name), a Heading 2 subtitle, paragraphs; cell 2 the product image. Always with its grey rule.',
         'columns, product intro, page intro, hero'),
    ],
    'cards-corp': [
        ('cards-corp resources', 'Cards (resources) – Resources',
         'One row per document: cell 1 its thumbnail (image link), cell 2 a Heading 5 linked title. Six per '
         'row from 900px, four from 600px.', 'cards, resources, brochures, documents, downloads'),
        ('cards-corp teaser', 'Cards (teaser) – Teaser',
         'One row per card: cell 1 an image (or empty for a text card), cell 2 a Heading 3 linked title, a '
         'short paragraph, a Bold + Underline "Learn more" link. A row holding only a page link is filled '
         'from that page. Four per row from 600px.', 'cards, teaser, related products, learn more'),
    ],
    'hero-corp': [
        ('hero-corp image-slide product-hero', 'Hero (product-hero) – Product hero',
         'Row 1: the desktop image (or its image fragment); row 2 (optional): the phone image; last row: '
         'the text – a Bold + Italic Heading 1 (gold product name), a Heading 2 subtitle, a paragraph, a '
         'Bold + Italic link alone on its line (the gold button). Image in the right half, text over the '
         'left half; on phones the text comes under the image.', 'hero, product hero, banner, top'),
        ('hero-corp image-slide banner', 'Hero (banner) – Banner',
         'Rows as the product hero; the image runs across the page and the text sits over its left half '
         '(Heading 1 statement: Bold words Futura bold, other words the light serif; Heading 2; copy; '
         'button). For an image with room on the left; dark text. On phones the text comes under the '
         'image.', 'hero, banner, full width, carousel slide'),
        ('hero-corp image-slide banner-light', 'Hero (banner-light) – Banner (light text)',
         'As Banner, for a dark image: the text is light over a shade on the image side; gold stays '
         'gold.', 'hero, banner, dark image, light text'),
    ],
    'statistics': [
        ('statistics count-up count-once', 'Statistics – Figures',
         'One row per figure: cell 1 gold, cell 2 the figure (it counts up once when shown), cell 3 its '
         'text. Up to 3 figures in a row, centred.', 'statistics, figures, numbers, count up, facts'),
    ],
    'video': [
        ('video', 'Video – Video',
         'A YouTube or Dynamic Media video link alone in the block (its text = the video title); click to '
         'play, no border.', 'video, youtube, player'),
        ('video autoplay', 'Video (autoplay) – Autoplay video',
         'As Video, for a moving image: muted, looping, playing by itself.', 'video, autoplay, loop, background'),
    ],
    'accordion': [
        ('accordion', 'Accordion',
         'One row per item: cell 1 the question or label (plain text), cell 2 the answer (paragraphs, '
         'lists, links).', 'accordion, faq, questions, resources'),
    ],
}
SECTIONS = [
    ('grey-band', 'Section (grey-band) – Grey band',
     'A full-width light grey band around the section, with the standard band space above and below.',
     'section, background, grey, band'),
    ('gold-box', 'Section (gold-box) – Gold box',
     'A gold box in the page width around the section (often a "Connect with an expert" line).',
     'section, background, gold, box, call to action'),
    ('purple-band', 'Section (purple-band) – Purple band',
     'A full-width dark purple gradient band; its text and links are light.',
     'section, background, dark, purple, band'),
    ('blue-band', 'Section (blue-band) – Blue band',
     'A full-width dark blue gradient band; its text and links are light.',
     'section, background, dark, blue, band'),
    ('large-headline', 'Section (large-headline) – Statement',
     'A statement: its large lines as a Heading 2 (Bold words Futura bold, the others the light serif, '
     'at the Headline size), its other lines as paragraphs (the light serif).',
     'section, statement, large headline, two-tone'),
    ('divider', 'Section (divider) – Divider',
     'A thin full-width line above the section.', 'section, divider, line, separator'),
    ('disclaimer', 'Section (disclaimer) – Disclaimer',
     'Small print: references (a numbered list) and the document number.',
     'section, disclaimer, references, small print, legal'),
]

# what a good example shows (its content model): a title heading and copy
NEED = {
    'columns media-text': r'<h[23][^>]*>[^<]{4,}.*?</h[23]><p>[^<]{40,}',
    'columns card-grid': r'(<h3[^>]*>.*?){3}',
    'columns text-columns': r'<h[23][^>]*>[^<]{4,}.*?<p>[^<]{40,}',
    'cards-corp teaser': r'<img|/is/image/',
    'hero-corp image-slide product-hero': r'<h2',
    'grey-band': r'<h[23]',
    'blue-band': r'<p>[^<]{30,}',
    'purple-band': r'<p>[^<]{30,}',
}
os.makedirs(f'{OUT}/blocks', exist_ok=True)
index = []
report = {}
for block, variants in BLOCKS.items():
    parts = []
    for cls, name, desc, tags in variants:
        ex = block_example(cls, need=NEED.get(cls)) or block_example(cls) or block_example(cls, 1, 4000)
        if not ex:
            report[cls] = 'no example'
            continue
        _, sample, src = ex
        report[cls] = os.path.relpath(src, content)
        parts.append(entry(sample, name, f'{desc} {COMMON}', tags))
    if parts:
        open(f'{OUT}/blocks/{block}.plain.html', 'w', encoding='utf8').write('\n'.join(parts) + '\n')
        label = {'columns': 'Columns', 'cards-corp': 'Cards', 'hero-corp': 'Hero', 'statistics': 'Statistics',
                 'video': 'Video', 'accordion': 'Accordion'}[block]
        index.append({'name': label, 'path': f'https://content.da.live/{org}/{site}/std/.da/library/blocks/{block}'})
parts = []
for style, name, desc, tags in SECTIONS:
    ex = section_example(style, need=NEED.get(style)) or section_example(style)
    if not ex:
        report[style] = 'no example'
        continue
    _, sec, src = ex
    report[style] = os.path.relpath(src, content)
    inner = sec[len('<div>'):-len('</div>')]
    marker = '<div class="section-metadata">'
    inner = inner.replace(marker, meta(name, f'{desc} {COMMON}', tags) + marker, 1)
    parts.append(f'<div>{inner}</div>')
if parts:
    open(f'{OUT}/blocks/section-metadata.plain.html', 'w', encoding='utf8').write('\n'.join(parts) + '\n')
    index.append({'name': 'Section Metadata', 'path': f'https://content.da.live/{org}/{site}/std/.da/library/blocks/section-metadata'})
styles = ' | '.join(['grey-band', 'gold-box', 'purple-band', 'blue-band', 'large-headline', 'divider', 'disclaimer',
                     'divider, large-headline', 'flex', 'continued', 'tabbed', 'accordion-panel', 'contact-aside'])
sheet = {
    'data': {'total': len(index), 'offset': 0, 'limit': len(index), 'data': index},
    'options': {'total': 1, 'offset': 0, 'limit': 1, 'data': [{'key': 'style', 'blocks': 'section-metadata', 'values': styles}]},
    ':version': 3, ':names': ['data', 'options'], ':type': 'multi-sheet',
}
open(f'{OUT}/blocks.json', 'w', encoding='utf8').write(json.dumps(sheet, indent=1) + '\n')

# a review page with every entry (the local preview does not serve the /.da folder): a corp page
# on the standard (site corp, product-detail template, type-scale standard), one section per entry
review = []
for block in BLOCKS:
    f = f'{OUT}/blocks/{block}.plain.html'
    if os.path.exists(f):
        review.append(open(f, encoding='utf8').read().strip())
f = f'{OUT}/blocks/section-metadata.plain.html'
if os.path.exists(f):
    review.append(open(f, encoding='utf8').read().strip())
cells = [('title', 'Standard Block Library (review)'), ('site', 'corp'), ('template', 'product-detail'),
         ('type-scale', 'standard'), ('robots', 'noindex, nofollow')]
metadata = '<div><div class="metadata">' + ''.join(f'<div><div>{k}</div><div>{v}</div></div>' for k, v in cells) + '</div></div>'
os.makedirs(f'{ROOT}/drafts', exist_ok=True)
open(f'{ROOT}/drafts/standard-library.plain.html', 'w', encoding='utf8').write('\n'.join(review) + '\n' + metadata + '\n')
print('review page → std/drafts/standard-library')
print(json.dumps(report, indent=1))
print(len(index), 'blocks in the index →', os.path.relpath(OUT, content))
