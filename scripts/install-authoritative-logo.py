from pathlib import Path
from PIL import Image
import base64

repo = Path('/home/ubuntu/kurukoo-git')
mobile = Path('/home/ubuntu/kurukoo-mobile')
source = repo / '.logo-work' / 'kurukoo-authoritative-logo.png'
logo = Image.open(source).convert('RGBA')

# Preserve the exact crop as a reusable web mark.
web_brand = repo / 'public/assets/brand/logo-icon.png'
web_brand.parent.mkdir(parents=True, exist_ok=True)
logo.save(web_brand, optimize=True)

# Make square app assets by scaling the exact mark, never redrawing it.
def square(size: int, background=(0, 0, 0, 0), height_ratio=0.76):
    canvas = Image.new('RGBA', (size, size), background)
    target_h = int(size * height_ratio)
    target_w = max(1, round(logo.width * target_h / logo.height))
    scaled = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, ((size-target_w)//2, (size-target_h)//2))
    return canvas

public_targets = {
    repo / 'public/assets/icons/favicon.png': square(64, (255, 248, 240, 255), 0.70),
    repo / 'public/assets/icons/icon-192.png': square(192, (255, 248, 240, 255), 0.72),
    repo / 'public/assets/icons/icon-512.png': square(512, (255, 248, 240, 255), 0.72),
}
for path, image in public_targets.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)

if mobile.exists():
    mobile_targets = {
        mobile / 'assets/images/icon.png': square(1024, (255, 248, 240, 255), 0.74),
        mobile / 'assets/images/splash-icon.png': square(1024, (0, 0, 0, 0), 0.62),
        mobile / 'assets/images/favicon.png': square(48, (255, 248, 240, 255), 0.72),
        mobile / 'assets/images/android-icon-foreground.png': square(1024, (0, 0, 0, 0), 0.72),
        mobile / 'assets/images/android-icon-monochrome.png': square(1024, (0, 0, 0, 0), 0.72),
    }
    for path, image in mobile_targets.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, optimize=True)

# Use the exact raster in SVG consumers as an embedded data URI, avoiding remote
# URLs and ensuring every surface resolves the same source pixels.
encoded = base64.b64encode(web_brand.read_bytes()).decode('ascii')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {logo.width} {logo.height}" role="img"><image href="data:image/png;base64,{encoded}" width="{logo.width}" height="{logo.height}"/></svg>\n'''
for path in [repo / 'public/assets/brand/logo-icon.svg', repo / 'public/assets/brand/favicon.svg', repo / 'public/favicon.svg']:
    path.write_text(svg)

print('installed exact logo from', source)
print('web brand:', web_brand)
print('mobile assets:', mobile.exists())
