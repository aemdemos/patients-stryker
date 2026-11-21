"""Authoring conventions of the standard corp pages: a draft document for the authors
(<content>/std/drafts/authoring-conventions), each rule with how to author it and its live result
(the page is on the standard: corp, type-scale standard), and one sample section per text set.
usage: python3 -I conventions.py <content dir>"""
import os
import sys

content = sys.argv[1].rstrip('/')
OUT = f'{content}/std/drafts/authoring-conventions.plain.html'


def row(*cells):
    return '<div>' + ''.join(f'<div>{c}</div>' for c in cells) + '</div>'


rules = [
    ('<p><strong>Gold text</strong>: Bold + Italic</p>',
     '<p>Copy with a <strong><em>gold phrase</em></strong> inside it.</p>'),
    ('<p><strong>Gold heading</strong>: a heading wholly in Bold + Italic</p>',
     '<h3><strong><em>A gold heading</em></strong></h3>'),
    ('<p><strong>Accent heading</strong>: a heading wholly in Italic (the light serif at the section\'s '
     'accent size; it stays a heading)</p>',
     '<h3><em>Are you a patient looking for more information?</em></h3>'),
    ('<p><strong>Accent line</strong>: a paragraph wholly in Italic</p>',
     '<p><em>An accent line in the light serif.</em></p>'),
    ('<p><strong>Heading with a rule below</strong>: a heading underlined</p>',
     '<h3><u>A heading with a rule</u></h3>'),
    ('<p><strong>Primary button</strong>: a Bold link alone on its line</p>',
     '<p><strong><a href="#">Request information</a></strong></p>'),
    ('<p><strong>Secondary button</strong>: an Italic link alone on its line</p>',
     '<p><em><a href="#">Learn more</a></em></p>'),
    ('<p><strong>Gold button</strong>: a Bold + Italic link alone on its line</p>',
     '<p><strong><em><a href="#">Contact us</a></em></strong></p>'),
    ('<p><strong>Text link with an arrow</strong>: a Bold + Underline link alone on its line</p>',
     '<p><strong><a href="#"><u>View product resources</u></a></strong></p>'),
    ('<p><strong>Bold link</strong>: a Bold link in a list, a sentence or a heading (never a button there)</p>',
     '<ul><li><strong><a href="#">Operative technique</a></strong></li><li><a href="#">Brochure</a></li></ul>'),
    ('<p><strong>Gold link</strong>: a Bold + Italic link in a sentence</p>',
     '<p>For the full study, <strong><em><a href="#">click here</a></em></strong>.</p>'),
    ('<p><strong>Opens in a new tab</strong>: add #_blank at the end of the link address</p>',
     '<p><a href="https://www.stryker.com/#_blank">stryker.com</a></p>'),
    ('<p><strong>Label</strong>: a line wholly in Bold</p>',
     '<p><strong>Key benefits</strong></p>'),
]
sets = [
    ('text-large', 'Large: Humanist 17.5, accent line Egyptienne 24.5 (e.g. the Contact us panel)'),
    ('text-x-large', 'Extra large: Humanist 21, accent line Egyptienne 28'),
    ('text-serif', 'Serif: Egyptienne Light 21, accent line Egyptienne 28'),
    ('text-serif-subtitle', 'Serif subtitle: Egyptienne Light 24.5, accent line Egyptienne 35'),
    ('text-serif-title', 'Serif title: Egyptienne Light 28, accent line Egyptienne 35 (product intros)'),
]
SAMPLE = ('Implant sizing and alignment are determined using the patient\'s unobstructed anatomic '
          'landmarks and the surgeon\'s preferences.')
sets = [
    ('text-large', 'Large: Humanist 17.5, accent line Egyptienne 24.5 (e.g. the Contact us panel)'),
    ('text-x-large', 'Extra large: Humanist 21, accent line Egyptienne 28'),
    ('text-serif', 'Serif: Egyptienne Light 21, accent line Egyptienne 28'),
    ('text-serif-subtitle', 'Serif subtitle: Egyptienne Light 24.5, accent line Egyptienne 35'),
    ('text-serif-title', 'Serif title: Egyptienne Light 28, accent line Egyptienne 35 (product intros)'),
]
SAMPLE = ('Implant sizing and alignment are determined using the patient\'s unobstructed anatomic '
          'landmarks and the surgeon\'s preferences.')
parts = [
    '<div><h1>Authoring conventions: standard pages</h1>'
    '<p>On the standard pages, the look comes from plain formatting: heading levels, Bold, Italic, '
    'Underline, a link alone on its line, and a few section styles. No sizes, fonts or colours are '
    'set by hand.</p>'
    '<div class="table">' + row('<p><strong>How to author it</strong></p>', '<p><strong>Result</strong></p>')
    + ''.join(row(a, b) for a, b in rules) + '</div></div>',
    '<div><h2>Text styles (a section style)</h2>'
    '<p>A section\'s own text (not its blocks) can take a text style, set as the section\'s style in '
    'Section Metadata. In every text style Bold is Futura bold at its size, Bold + Italic is gold, and a '
    'paragraph or heading wholly in Italic is its accent line. Without a text style the text is Humanist 14 '
    'with an Egyptienne 24.5 accent line.</p></div>',
]
# every rule a section of default content (a block such as Table keeps its own type, so the
# section rules would not show there): its name, how to author it, its live result
parts = [
    '<div><h1>Authoring conventions: standard pages</h1>'
    '<p>On the standard pages, the look comes from plain formatting: heading levels, Bold, Italic, '
    'Underline, a link alone on its line, and a few section styles. No sizes, fonts or colours are '
    'set by hand. Each rule below: how to author it, then the result.</p></div>',
]
for how, result in rules:
    parts.append(f'<div>{how}{result}<div class="section-metadata"><div><div>style</div><div>divider</div></div></div></div>')
parts.append(
    '<div><h2>Text styles (a section style)</h2>'
    '<p>A section\'s own text (not its blocks) can take a text style, set as the section\'s style in '
    'Section Metadata. In every text style Bold is Futura bold at its size, Bold + Italic is gold, and a '
    'paragraph or heading wholly in Italic is its accent line. Without a text style the text is Humanist 14 '
    'with an Egyptienne 24.5 accent line.</p></div>')
for cls, label in sets:
    parts.append(
        f'<div><p><strong>{cls}</strong> · {label}</p><p>{SAMPLE}</p><p><em>The accent line of this text style.</em></p>'
        f'<div class="section-metadata"><div><div>style</div><div>{cls}</div></div></div></div>')
parts.append(
    '<div><h2>Hidden heading (a section style)</h2>'
    '<p>A section with the style visually-hidden is read by screen readers and search engines but not '
    'shown: for the page title (Heading 1) when a banner hero shows the visible title. The section holds '
    'only that heading.</p></div>')
meta = [('title', 'Authoring conventions: standard pages'), ('site', 'corp'), ('template', 'product-detail'),
        ('type-scale', 'standard'), ('robots', 'noindex, nofollow')]
parts.append('<div><div class="metadata">' + ''.join(row(k, v) for k, v in meta) + '</div></div>')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf8').write('\n'.join(parts) + '\n')
print('→', os.path.relpath(OUT, content))
