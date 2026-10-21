"""Builds the approval contact sheet from the folder produced by board.js.
usage: python3 sheet.py board/ frames.png [--guides]
"""
import sys, json, glob, os
from PIL import Image, ImageDraw, ImageFont

d = sys.argv[1]; out = sys.argv[2]; pre = 'g_' if '--guides' in sys.argv else ''
names = json.load(open(os.path.join(d, 'names.json')))
files = sorted(f for f in glob.glob(os.path.join(d, pre + '[0-9]*.png')))
im0 = Image.open(files[0]); vert = im0.height > im0.width
w, h = (300, 533) if vert else (600, 338)
cols = 6 if vert else 3
rows = (len(files) + cols - 1) // cols
try: F = ImageFont.truetype('DejaVuSans-Bold.ttf', 22)
except OSError: F = ImageFont.load_default()
s = Image.new('RGB', (cols * (w + 10) + 10, rows * (h + 44) + 10), '#f5f5f5'); dr = ImageDraw.Draw(s)
for i, f in enumerate(files):
    x = 10 + (i % cols) * (w + 10); y = 10 + (i // cols) * (h + 44)
    s.paste(Image.open(f).convert('RGB').resize((w, h)), (x, y + 32))
    dr.text((x, y + 6), names[i] if i < len(names) else str(i), fill='black', font=F)
s.save(out); print(out, s.size)
