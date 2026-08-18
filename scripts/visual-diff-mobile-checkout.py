from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

root = Path(__file__).resolve().parents[1]
artifacts = root / '.artifacts'
target = (390, 844)
pairs = {
    'cart': ('auth-cart-mobile-390x844.png', 'checkout-review-mobile-reference.png'),
    'confirmation': ('mobile-current.png', 'checkout-confirm-mobile-reference.png'),
}
# The Confirmation screenshot was saved before navigating back to Cart.
# It is copied under a stable name by the shell wrapper if present.
if not (artifacts / 'auth-confirmation-mobile-390x844.png').exists() and (artifacts / 'mobile-current.png').exists():
    (artifacts / 'mobile-current.png').replace(artifacts / 'auth-confirmation-mobile-390x844.png')
pairs['confirmation'] = ('auth-confirmation-mobile-390x844.png', 'checkout-confirm-mobile-reference.png')

lines = ['# Mobile Checkout and Confirmation pixel comparison', '', 'The live routes were captured at 390×844. Individual reference frames were extracted from the existing Checkout board without reopening attached images. The reference frames are board crops and are normalized to the mobile viewport for diagnostics; they are not one-to-one source captures.', '']
for name, (live_name, ref_name) in pairs.items():
    live = Image.open(artifacts / live_name).convert('RGB').resize(target, Image.Resampling.LANCZOS)
    ref = Image.open(artifacts / ref_name).convert('RGB').resize(target, Image.Resampling.LANCZOS)
    a = np.asarray(live, dtype=np.float32)
    b = np.asarray(ref, dtype=np.float32)
    delta = np.abs(a - b)
    mae = float(delta.mean())
    rmse = float(np.sqrt(((a - b) ** 2).mean()))
    changed = float((delta.mean(axis=2) > 16).mean() * 100)
    diff = ImageChops.difference(live, ref)
    diff = ImageEnhance.Contrast(diff).enhance(2.0)
    diff.save(artifacts / f'visual-diff-mobile-{name}.png')
    lines.extend([f'## {name.title()}', f'- Live source: `.artifacts/{live_name}`', f'- Reference source: `.artifacts/{ref_name}`', f'- Mean absolute pixel error: {mae:.2f}/255', f'- Root mean square error: {rmse:.2f}/255', f'- Pixels with mean channel delta > 16: {changed:.2f}%', ''])
lines.append('The comparison values are directional because the live authenticated routes intentionally use empty/pending truthful state content while the reference frames contain populated review content and board-specific copy.')
(artifacts / 'visual-diff-mobile-checkout-2026-08-18.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
