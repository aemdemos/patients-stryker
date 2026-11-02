"""Builds the corp Block Library document for Hero Corp from current imports (lift and shift
samples): each entry's block is taken from an imported page, its slide image rows that link
to slide fragments replaced by the fragment's own image / video link (the same row as an
author would write it), then a library-metadata table.
usage: python3 -I build-hero-corp.py <output .plain.html>"""
import html
import os
import re
import sys

ROOTS = ['/tmp/pilotPD/content', '/backups/aemdemos/patients-stryker/repo/content']
sys.path.insert(0, '/backups/aemdemos/patients-stryker/repo/.migration/plans/pilot-tools')

COMMON = ('Rows: the desktop image or video (a Dynamic Media link; the link text is the alt '
          'text), the mobile image (optional), then the text: one paragraph or heading per source '
          'line, buttons as a bold link alone on its line. ')
OPTIONS = ('top-/left-/right-/bottom-<n> place the text box over the image, in % of the image '
           '(7-5 = 7.5). ')

ENTRIES = [
    ('us/en/about/news/2022/features/tour-the-amsterdam-skills-centre-an-international-training-cent',
     'Hero Corp (image-slide) – Headline on the image, no box',
     'The stryker.com carousel slide hero (news features, campaign pages): the headline straight '
     'on the image, here at top-10, left-5, right-56, the title gold and bold, the subline in '
     'Egyptienne. ' + COMMON + OPTIONS + 'With a mobile image the headline stays over it on '
     'phones; text-below puts it under the image on phones.',
     'hero, image-slide, carousel slide, headline, no box, news'),
    ('us/en/emergency-care/news/2023/understanding-the-basics-of-a-lucas-chest-compression-system',
     'Hero Corp (image-slide, box-gold, text-below) – Gold headline box',
     'The headline in a gold box (box-gold) at top-15, left-5, right-50; margin-right-20 makes the '
     'box narrower (the source box margin, in % of the box column). text-below: on phones the box '
     'sits under the image. ' + COMMON,
     'hero, image-slide, gold box, box-gold, text-below, news'),
    ('us/en/about/news/features/packaging-for-a-better-planet',
     'Hero Corp (image-slide, box-white) – White box',
     'A white box (box-white) at top-40, left-9, right-42; padding-top-5 adds the source top '
     'padding (in % of the box). With a mobile image, the box stays over it on phones. ' + COMMON,
     'hero, image-slide, white box, box-white, padding'),
    ('us/en/about/news/2022/features/promoting-high-quality-inclusive-healthcare-in-latin-america',
     'Hero Corp (image-slide, box-white) – White box on the right',
     'A white box on the right half of the image (top-29, left-57, right-5). ' + COMMON,
     'hero, image-slide, white box, right, box-white'),
    ('us/en/about/news/features/stryker-donates-22-500-emergency-relief-bed-kits-to-project-c-u',
     'Hero Corp (image-slide, box-blue) – Blue box, white and gold text',
     'A blue box (box-blue) at top-25, left-32, right-10; the headline white with its last words '
     'gold (colour tags in the text). ' + COMMON,
     'hero, image-slide, blue box, box-blue, white text, gold text'),
    ('us/en/about/news/features/stryker-holds-diversity-equity-and-inclusion-summit',
     'Hero Corp (image-slide, box-light-gray) – Light grey box',
     'A light grey box (box-light-gray) on the right (top-46, left-55, right-5). ' + COMMON,
     'hero, image-slide, grey box, light gray, box-light-gray'),
    ('us/en/about/news/features/nurses-a-key-driver-in-advancing-global-health',
     'Hero Corp (image-slide, box-dark-gray, text-below) – Dark grey box, gold text',
     'A dark grey box (box-dark-gray) with a gold headline at top-32, left-5, right-60; under the '
     'image on phones (text-below). ' + COMMON,
     'hero, image-slide, dark box, box-dark-gray, gold text, text-below'),
    ('us/en/about/news/features/mako-smartrobotics-hits-500-000-procedures',
     'Hero Corp (image-slide, box-white, text-below) – Video slide',
     'Row 1 is a Dynamic Media video link (the -AVS .m3u8 with ?poster=): it plays muted on a loop, '
     'without controls, in the 3:1 frame. A white box on the right (top-28, left-50, right-5), '
     'under the video on phones (text-below). ' + COMMON,
     'hero, image-slide, video, background video, dynamic media, autoplay, loop'),
    ('us/en/communications/news/2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite',
     'Hero Corp (image-slide, text-below) – Video slide, two text sizes',
     'A video slide with no box: a large bold title and a subline in two vw sizes (size tags in '
     'the text), at top-17, left-5, right-30, padding-top-5. ' + COMMON,
     'hero, image-slide, video, large title, subline'),
    ('us/en/communications/news/2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite#2',
     'Hero Corp (image-slide, text-below) – Headline with a button',
     'A Heading 3 line and a teal button (a bold link alone on its line) over the image, at '
     'top-21, left-7, right-55; on phones both go under the image (text-below). ' + COMMON,
     'hero, image-slide, button, cta, call to action, banner'),
    ('us/en/surgical-technologies/news/technology-helps-improve-colonoscopy-safety-and-efficiency',
     'Hero Corp (image-slide, text-below) – Image-only banner',
     'Only the image rows and no text: a full-width banner (here the article hero). ' + COMMON,
     'hero, image-slide, banner, image only, full width image'),
    ('us/en/about/news/2026/features/what-everyone-should-know-about-arthritis',
     'Hero Corp (image-slide, box-white, text-below) – Mobile image, box under it',
     'text-below: on phones the mobile image shows first and the white box sits under it. From '
     '600px the box (margin-top-8 moves it down) is over the image at top-13, left-5, right-56. '
     + COMMON,
     'hero, image-slide, text-below, mobile image, white box, phone layout'),
    ('us/en/about/news/2024/features/stryker-is-doubling-down-in-the-fight-against-brain-tumors',
     'Hero Corp (image-slide, text-below) – Headline without a box, under the image on phones',
     'No box, the headline at top-35, left-5, right-60, margin-top-5; under the image on phones. '
     + COMMON,
     'hero, image-slide, text-below, no box, headline'),
    ('us/en/care-settings/asc',
     'Hero Corp (image-slide, text-below) – Landing page slide',
     'A landing page carousel slide (care settings): a gold title and grey sublines at top-10, '
     'left-5, right-50, under the image on phones. ' + COMMON,
     'hero, image-slide, landing page, care settings, carousel'),
    ('us/en/acute-care/products/surgistool',
     'Hero Corp (image-slide, text-below, image-right) – Product hero',
     'The stryker.com product page hero: the product image on the right half (image-right, the '
     'source slide image at grid offset 6), the text on the left at top-18, left-8, right-50: '
     'product name as a bold Heading 1 in gold, the subtitle as a Heading 2, a line of copy and '
     'the Contact button (a bold + italic link to #contact). margin-bottom-7 keeps the source '
     'space under the text. Under the image on phones. ' + COMMON,
     'hero, product hero, image-right, product page, contact an expert'),
    ('us/en/foot-and-ankle/products/incompass',
     'Hero Corp (image-slide, text-above, box-white) – Full-width image with a text box',
     'The stryker.com full-width image hero: text-above puts the text above the image on phones; '
     'from 600px it is a box over the image at its top-left, right-50 sets its width (a white box '
     'here, box-white). ' + COMMON,
     'hero, full width image, text-above, white box, banner'),
]


def find(path):
    for root in ROOTS:
        f = os.path.join(root, f'{path}.plain.html')
        if os.path.exists(f):
            return f
    raise FileNotFoundError(path)


def first_block(src, prefix, nth=1):
    """The nth <div class="hero-corp …"> … </div> of a page."""
    start = -1
    for _ in range(nth):
        start = src.index(f'<div class="{prefix}', start + 1)
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', src[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return src[start:start + m.end()]
    raise ValueError('unclosed block')


def resolve_fragments(block):
    """Cells holding only a link to a slide fragment → the fragment's first image / video link."""
    def repl(m):
        href = m.group(1)
        try:
            frag = open(find(href.lstrip('/'))).read()
        except FileNotFoundError:
            return m.group(0)
        link = re.search(r'<a href="(https://media-assets[^"]+)">([^<]*)</a>', frag)
        return f'<div><a href="{link.group(1)}">{link.group(2)}</a></div>' if link else m.group(0)
    return re.sub(r'<div><a href="(/us/en/fragments/[^"]+)">[^<]*</a></div>', repl, block)


def metadata(name, desc, tags):
    rows = ''.join(f'<div><div>{k}</div><div>{html.escape(v, quote=False)}</div></div>'
                   for k, v in (('name', name), ('description', desc), ('searchtags', tags)))
    return f'<div class="library-metadata">{rows}</div>'


out = []
for path, name, desc, tags in ENTRIES:
    path, _, nth = path.partition('#')
    block = resolve_fragments(first_block(open(find(path)).read(), 'hero-corp', int(nth or 1)))
    out.append(f'<div>{block}{metadata(name, desc, tags)}</div>')
open(sys.argv[1], 'w').write('\n'.join(out) + '\n')
print(len(out), 'entries')
