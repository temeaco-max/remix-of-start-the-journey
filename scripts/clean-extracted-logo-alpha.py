from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/kurukoo-exact-loop-logo-transparent.png')
targets = [
    Path('/home/ubuntu/webdev-static-assets/kurukoo-exact-loop-logo-alpha.png'),
]
im = Image.open(source).convert('RGB')
out = Image.new('RGBA', im.size, (0, 0, 0, 0))
pix = im.load()
out_pix = out.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b = pix[x, y]
        chroma = max(r, g, b) - min(r, g, b)
        red_bias = r - (g * 0.72 + b * 0.28)
        if red_bias <= 12 or chroma <= 18:
            continue
        alpha = min(255, max(0, int(red_bias * 2.2)))
        out_pix[x, y] = (r, g, b, alpha)
for target in targets:
    out.save(target)
