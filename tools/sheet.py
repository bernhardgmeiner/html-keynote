#!/usr/bin/env python3
"""Kontaktbogen aus gerenderten Schritten.

  python3 tools/sheet.py shots/ bogen.png [3,7,12]   (ohne Liste: alle PNGs im Ordner)
"""
import os, sys
from PIL import Image, ImageDraw

d, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
if len(sys.argv) > 3:
    want = {int(x) for x in sys.argv[3].split(',')}
    files = [f for f in files if int(f[:3]) in want]
cols, w, h, g = 3, 640, 360, 8
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (cols * w + (cols + 1) * g, rows * h + (rows + 1) * g), '#333')
dr = ImageDraw.Draw(S)
for k, f in enumerate(files):
    im = Image.open(os.path.join(d, f)).resize((w, h), Image.LANCZOS)
    x, y = g + (k % cols) * (w + g), g + (k // cols) * (h + g)
    S.paste(im, (x, y))
    dr.rectangle([x, y, x + 34, y + 20], fill='black')
    dr.text((x + 4, y + 4), str(int(f[:3])), fill='white')
S.save(out)
print(out, len(files), 'Bilder')
