from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/upload/pasted_file_Hpq4At_image.png')
OUT_DIR = Path('/home/ubuntu/kurukoo-git/.logo-work')
OUT_DIR.mkdir(exist_ok=True)

image = Image.open(SOURCE).convert('RGBA')
pixels = image.load()
# The supplied image has a light background. Preserve the terracotta mark and
# create alpha only for pixels that materially differ from the background.
mask = Image.new('L', image.size, 0)
mp = mask.load()
for y in range(image.height):
    for x in range(image.width):
        r, g, b, a = pixels[x, y]
        # Terracotta strokes have a strong red-vs-green/blue chroma gap;
        # the warm off-white background does not.
        chroma = max(0, (r - g) * 3 + (r - b) * 2 - 24)
        # Background chroma clusters below 80; retain the logo and its
        # anti-aliased boundary with a soft ramp from 80 to 260.
        mp[x, y] = max(0, min(255, int((chroma - 80) * 1.42)))

bbox = mask.getbbox()
if not bbox:
    raise SystemExit('No foreground logo pixels detected')
# Keep a small transparent safety margin while retaining the original aspect.
pad = 2
bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(image.width, bbox[2]+pad), min(image.height, bbox[3]+pad))
source_crop = image.crop(bbox)
mask_crop = mask.crop(bbox)
rgba = Image.new('RGBA', source_crop.size, (0, 0, 0, 0))
rgba.paste(source_crop, (0, 0), mask_crop)
rgba.save(OUT_DIR / 'kurukoo-authoritative-logo.png', optimize=True)
# Also provide a high-resolution nearest-neighbour source-controlled copy for app assets.
rgba.resize((rgba.width * 8, rgba.height * 8), Image.Resampling.NEAREST).save(OUT_DIR / 'kurukoo-authoritative-logo-8x.png', optimize=True)
print({'source_size': image.size, 'detected_bbox': bbox, 'output_size': rgba.size, 'output': str(OUT_DIR / 'kurukoo-authoritative-logo.png')})
