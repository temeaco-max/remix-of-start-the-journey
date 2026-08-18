from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / '.artifacts'
TARGET = (640, 720)
actual = Image.open(ARTIFACTS / 'auth-cart-1280x720.png').convert('RGB')
reference = Image.open('/home/ubuntu/kurukoo-design/kurukoo-checkout-screen-set.png').convert('RGB')

# The live capture has a 184px authenticated workspace rail. The reference board's
# first review-stage panel begins just after its 520px rail at 2x export scale.
actual_crop = actual.crop((184, 0, 824, 720))
reference_crop = reference.crop((520, 0, 1800, 1440)).resize(TARGET, Image.Resampling.LANCZOS)
actual_crop = actual_crop.resize(TARGET, Image.Resampling.LANCZOS)

a = np.asarray(actual_crop, dtype=np.float32)
b = np.asarray(reference_crop, dtype=np.float32)
delta = np.abs(a - b)
mae = float(delta.mean())
rmse = float(np.sqrt(((a - b) ** 2).mean()))
changed = float((delta.mean(axis=2) > 16).mean() * 100)

# Summarize 8x8 grid regions to identify concentrated drift without treating the
# entire composite board as a single viewport.
grid = []
for row in range(8):
    for col in range(8):
        y0, y1 = row * 90, (row + 1) * 90
        x0, x1 = col * 80, (col + 1) * 80
        region = delta[y0:y1, x0:x1]
        score = float(region.mean())
        if score >= 18:
            grid.append({'row': row, 'column': col, 'x': x0, 'y': y0, 'width': 80, 'height': 90, 'meanDelta': round(score, 2)})

diff = ImageChops.difference(actual_crop, reference_crop)
diff = ImageEnhance.Contrast(diff).enhance(2.0)
diff.save(ARTIFACTS / 'visual-diff-checkout-crop.png')
actual_crop.save(ARTIFACTS / 'checkout-live-crop.png')
reference_crop.save(ARTIFACTS / 'checkout-reference-crop.png')

report = [
    '# Checkout crop-level visual comparison',
    '',
    'The live authenticated Cart capture was compared against the first review-stage crop of the authoritative Checkout board. This is a closer state comparison than the prior whole-board composite diagnostic, but the two artifacts still contain different sample content and navigation chrome.',
    '',
    f'- Live crop source: `.artifacts/auth-cart-1280x720.png`, crop `(184, 0, 824, 720)`',
    f'- Reference crop source: `/home/ubuntu/kurukoo-design/kurukoo-checkout-screen-set.png`, crop `(520, 0, 1800, 1440)`, then normalized to `{TARGET[0]}×{TARGET[1]}`',
    f'- Mean absolute pixel error: {mae:.2f}/255',
    f'- Root mean square error: {rmse:.2f}/255',
    f'- Pixels with mean channel delta > 16: {changed:.2f}%',
    '',
    '## Concentrated regions',
    '',
]
report.extend(f"- Grid row {item['row']}, column {item['column']} at ({item['x']},{item['y']}): mean channel delta {item['meanDelta']}/255" for item in sorted(grid, key=lambda item: item['meanDelta'], reverse=True))
report.extend(['', 'The crop result is diagnostic rather than a binary pass/fail because the live route intentionally renders an empty cart while the board crop depicts a populated sourced-item review. A confirmed regression requires matching the same state and content fixture; no CSS change is justified from this crop alone.'])
(ARTIFACTS / 'visual-diff-checkout-crop-2026-08-18.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))
