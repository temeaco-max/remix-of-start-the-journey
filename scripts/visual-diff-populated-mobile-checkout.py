from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

root = Path(__file__).resolve().parents[1]
artifacts = root / '.artifacts'
reference_pairs = {
    'cart': 'checkout-review-mobile-reference.png',
    'confirmation': 'checkout-confirm-mobile-reference.png',
}
viewports = {
    'iphone-se': (375, 667),
    'pixel7': (412, 915),
}

lines = [
    '# Populated mobile Checkout and Confirmation visual comparison',
    '',
    'The live routes use an opt-in development-only populated visual-QA fixture. Each reference is an individual frame extracted from the supplied Checkout board and normalized to the live viewport for directional diagnostics.',
    '',
]

for device, size in viewports.items():
    lines.extend([f'## {device} ({size[0]}×{size[1]})', ''])
    for surface, reference_name in reference_pairs.items():
        live_name = f'populated-{surface}-{device}-{size[0]}x{size[1]}.png'
        live_path = artifacts / live_name
        ref_path = artifacts / reference_name
        live = Image.open(live_path).convert('RGB').resize(size, Image.Resampling.LANCZOS)
        ref = Image.open(ref_path).convert('RGB').resize(size, Image.Resampling.LANCZOS)
        a = np.asarray(live, dtype=np.float32)
        b = np.asarray(ref, dtype=np.float32)
        delta = np.abs(a - b)
        mae = float(delta.mean())
        rmse = float(np.sqrt(((a - b) ** 2).mean()))
        changed = float((delta.mean(axis=2) > 16).mean() * 100)
        diff = ImageChops.difference(live, ref)
        ImageEnhance.Contrast(diff).enhance(2.0).save(artifacts / f'visual-diff-populated-{surface}-{device}.png')
        lines.extend([
            f'### {surface.title()}',
            f'- Live source: `.artifacts/{live_name}`',
            f'- Reference source: `.artifacts/{reference_name}`',
            f'- Mean absolute pixel error: {mae:.2f}/255',
            f'- Root mean square error: {rmse:.2f}/255',
            f'- Pixels with mean channel delta > 16: {changed:.2f}%',
            '',
        ])

lines.append('These figures remain directional: the reference frames are design-board crops and the fixture adds truthful application state, while typography rasterization and surrounding shell composition can differ from the source board.')
(artifacts / 'visual-diff-populated-mobile-checkout-2026-08-18.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
