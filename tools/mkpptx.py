#!/usr/bin/env python3
"""Notfall-PowerPoint aus den Screenshots von tools/fallback.js.

  python3 tools/mkpptx.py fb/ dist/Notfallversion_<Name>.pptx

Jede Folie = ein Vollbild-Screenshot, Notizen = Sprechnotizen mit Soll-Zeit.
Videoszenen werden als eingebettetes Video übernommen (Startbild per ffmpeg, falls vorhanden).
"""
import json, os, shutil, subprocess, sys
from pptx import Presentation
from pptx.util import Emu
from PIL import Image

d, out = sys.argv[1], sys.argv[2]
L = json.load(open(os.path.join(d, 'list.json'), encoding='utf-8'))
prs = Presentation()
prs.slide_width, prs.slide_height = Emu(12192000), Emu(6858000)
W, H = prs.slide_width, prs.slide_height
blank = prs.slide_layouts[6]
for it in L:
    s = prs.slides.add_slide(blank)
    note = it['note']
    if it.get('video'):
        poster = it['video'].replace('.mp4', '_poster.png')
        if shutil.which('ffmpeg'):
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '1', '-i', it['video'], '-frames:v', '1', poster])
        if not os.path.exists(poster):
            Image.new('RGB', (1920, 1080), '#0C0C0E').save(poster)
        s.shapes.add_movie(it['video'], 0, 0, W, H, poster_frame_image=poster, mime_type='video/mp4')
        note = 'Video anklicken oder mit dem Klicker starten.\n\n' + note
    else:
        jpg = it['file'].replace('.png', '.jpg')
        Image.open(it['file']).convert('RGB').save(jpg, quality=92)
        s.shapes.add_picture(jpg, 0, 0, W, H)
    s.notes_slide.notes_text_frame.text = note
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
prs.save(out)
print(out, len(L), 'Folien')
