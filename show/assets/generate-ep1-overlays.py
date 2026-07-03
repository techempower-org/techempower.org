#!/usr/bin/env python3
"""Regenerate Ep1 overlay PNGs (1920x1080 RGBA, transparent bg).

Geometry/colors measured off the June 29 originals so replacements are
drop-in for the Resolve project (which links these files by path via the
~/Videos/logo symlink). July 3 corrections: Shawna's lower third gains
her full name; the book card credits the verified author (Clara E.
Mattei — the June 29 render said Matthew Desmond, wrong author).

Usage: python3 generate-ep1-overlays.py [outdir]
Writes: lower_third_shawna.png, book_cover_frame.png
"""
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'logo/ep1-overlays'
SERIF_B = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SANS_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

TEAL_BOX = (29, 92, 92, 230)
AMBER = (212, 160, 60, 255)
CARD_FILL = (253, 246, 236, 240)
CARD_EDGE = (42, 127, 127, 180)
TEAL_TEXT = (42, 127, 127, 255)
BROWN = (74, 56, 40, 255)
INK = (90, 78, 66, 255)


def canvas():
    return Image.new('RGBA', (1920, 1080), (0, 0, 0, 0))


def tracked_text(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def lower_third(name, role, path):
    im = canvas()
    d = ImageDraw.Draw(im)
    d.rectangle([60, 920, 540, 992], fill=TEAL_BOX)
    d.rectangle([60, 920, 66, 992], fill=AMBER)
    d.text((82, 928), name, font=ImageFont.truetype(SERIF_B, 36),
           fill=(255, 255, 255, 255))
    d.text((82, 966), role, font=ImageFont.truetype(SANS, 19),
           fill=(226, 229, 226, 255))
    im.save(path)


def book_card(title_lines, author, tag, path):
    im = canvas()
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([1320, 660, 1840, 940], radius=10,
                        fill=CARD_FILL, outline=CARD_EDGE, width=2)
    tracked_text(d, (1345, 674), 'BOOK MENTIONED',
                 ImageFont.truetype(SANS_B, 16), TEAL_TEXT, tracking=2)
    d.line([1345, 707, 1815, 707], fill=(213, 205, 192, 255), width=2)
    serif = ImageFont.truetype(SERIF_B, 40)
    y = 724
    for line in title_lines:
        d.text((1345, y), line, font=serif, fill=BROWN)
        y += 44
    d.text((1345, y + 12), author, font=ImageFont.truetype(SANS, 24),
           fill=INK)
    d.text((1345, y + 56), tag, font=ImageFont.truetype(SANS, 19),
           fill=TEAL_TEXT)
    im.save(path)


lower_third('Shawna Hein', 'Co-host', f'{OUT}/lower_third_shawna.png')
book_card(['Escape from', 'Capitalism'], 'by Clara E. Mattei',
          'Free at your local library', f'{OUT}/book_cover_frame.png')
print('wrote lower_third_shawna.png + book_cover_frame.png ->', OUT)
