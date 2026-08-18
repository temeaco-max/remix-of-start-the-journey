# Populated mobile Checkout and Confirmation visual comparison

The live routes use an opt-in development-only populated visual-QA fixture. Each reference is an individual frame extracted from the supplied Checkout board and normalized to the live viewport for directional diagnostics.

## iphone-se (375×667)

### Cart
- Live source: `.artifacts/populated-cart-iphone-se-375x667.png`
- Reference source: `.artifacts/checkout-review-mobile-reference.png`
- Mean absolute pixel error: 174.18/255
- Root mean square error: 204.81/255
- Pixels with mean channel delta > 16: 77.61%

### Confirmation
- Live source: `.artifacts/populated-confirmation-iphone-se-375x667.png`
- Reference source: `.artifacts/checkout-confirm-mobile-reference.png`
- Mean absolute pixel error: 183.49/255
- Root mean square error: 209.77/255
- Pixels with mean channel delta > 16: 81.35%

## pixel7 (412×915)

### Cart
- Live source: `.artifacts/populated-cart-pixel7-412x915.png`
- Reference source: `.artifacts/checkout-review-mobile-reference.png`
- Mean absolute pixel error: 145.80/255
- Root mean square error: 186.17/255
- Pixels with mean channel delta > 16: 67.04%

### Confirmation
- Live source: `.artifacts/populated-confirmation-pixel7-412x915.png`
- Reference source: `.artifacts/checkout-confirm-mobile-reference.png`
- Mean absolute pixel error: 160.39/255
- Root mean square error: 195.07/255
- Pixels with mean channel delta > 16: 72.79%

These figures remain directional: the reference frames are design-board crops and the fixture adds truthful application state, while typography rasterization and surrounding shell composition can differ from the source board.
