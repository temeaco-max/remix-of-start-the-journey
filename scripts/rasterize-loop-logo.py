from pathlib import Path
import cairosvg

svg = Path('/home/ubuntu/kurukoo-git/public/assets/brand/logo-icon.svg').read_bytes()
outputs = {
    '/home/ubuntu/kurukoo-mobile/assets/images/icon.png': 1024,
    '/home/ubuntu/kurukoo-mobile/assets/images/splash-icon.png': 1024,
    '/home/ubuntu/kurukoo-mobile/assets/images/favicon.png': 512,
    '/home/ubuntu/kurukoo-mobile/assets/images/android-icon-foreground.png': 1024,
}
for target, size in outputs.items():
    cairosvg.svg2png(bytestring=svg, write_to=target, output_width=size, output_height=size)
