from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
artifacts = root / '.artifacts'
source = Image.open(artifacts / 'checkout-reference-crop.png').convert('RGB')

# Coordinates are based on the existing 640x720 reference crop: the supplied board
# shows the Review-cart frame at x=70..366 and Confirm-request at x=390..640.
frames = {
    'checkout-review-mobile-reference.png': (70, 92, 366, 690),
    'checkout-confirm-mobile-reference.png': (390, 92, 640, 690),
}
for name, box in frames.items():
    frame = source.crop(box)
    frame.save(artifacts / name)
    print(f'{name}: {frame.size[0]}x{frame.size[1]} from {box}')
