from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageStat
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / '.artifacts'
ARTIFACTS.mkdir(exist_ok=True)

pairs = {
    'checkout': (ARTIFACTS / 'auth-cart-1280x720.png', Path('/home/ubuntu/kurukoo-design/kurukoo-checkout-screen-set.png')),
    'confirmation': (ARTIFACTS / 'auth-confirmation-1280x720.png', Path('/home/ubuntu/kurukoo-design/kurukoo-confirmations-screen-set.png')),
    'tasks': (ARTIFACTS / 'auth-tasks-1280x720.png', Path('/home/ubuntu/kurukoo-design/kurukoo-operations-screen-set.png')),
    'connect': (ARTIFACTS / 'auth-connect-1280x720.png', Path('/home/ubuntu/kurukoo-design/kurukoo-operations-screen-set.png')),
}

TARGET = (1280, 720)
lines = ['# Authenticated visual diff diagnostics', '', 'These are normalized board-level diagnostics. The authoritative boards are composite design sets, not one-to-one viewport screenshots; therefore the numerical difference is evidence for drift and not a pass/fail pixel score.', '']
for name, (actual_path, reference_path) in pairs.items():
    actual = Image.open(actual_path).convert('RGB')
    reference = Image.open(reference_path).convert('RGB')
    actual_top = actual.crop((0, 0, min(actual.width, TARGET[0]), min(actual.height, TARGET[1])))
    actual_norm = actual_top.resize(TARGET, Image.Resampling.LANCZOS)
    reference_norm = reference.resize(TARGET, Image.Resampling.LANCZOS)
    a = np.asarray(actual_norm, dtype=np.float32)
    b = np.asarray(reference_norm, dtype=np.float32)
    delta = np.abs(a - b)
    mae = float(delta.mean())
    rmse = float(np.sqrt(((a - b) ** 2).mean()))
    changed = float((delta.mean(axis=2) > 16).mean() * 100)
    diff = ImageChops.difference(actual_norm, reference_norm)
    diff = ImageEnhance.Contrast(diff).enhance(2.0)
    diff.save(ARTIFACTS / f'visual-diff-{name}-normalized.png')
    lines.extend([
        f'## {name.title()}',
        f'- Rendered artifact: `{actual_path.relative_to(ROOT)}` ({actual.size[0]}×{actual.size[1]})',
        f'- Reference board: `{reference_path}` ({reference.size[0]}×{reference.size[1]})',
        f'- Normalized comparison canvas: {TARGET[0]}×{TARGET[1]}',
        f'- Mean absolute pixel error: {mae:.2f}/255',
        f'- Root mean square error: {rmse:.2f}/255',
        f'- Pixels with mean channel delta > 16: {changed:.2f}%',
        '',
    ])

(ARTIFACTS / 'visual-diff-authenticated-2026-08-18.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
