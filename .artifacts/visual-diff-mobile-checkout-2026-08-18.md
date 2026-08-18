# Mobile Checkout and Confirmation pixel comparison

The live routes were captured at 390×844. Individual reference frames were extracted from the existing Checkout board without reopening attached images. The reference frames are board crops and are normalized to the mobile viewport for diagnostics; they are not one-to-one source captures.

## Cart
- Live source: `.artifacts/auth-cart-mobile-390x844.png`
- Reference source: `.artifacts/checkout-review-mobile-reference.png`
- Mean absolute pixel error: 25.01/255
- Root mean square error: 59.06/255
- Pixels with mean channel delta > 16: 21.65%

## Confirmation
- Live source: `.artifacts/auth-confirmation-mobile-390x844.png`
- Reference source: `.artifacts/checkout-confirm-mobile-reference.png`
- Mean absolute pixel error: 29.12/255
- Root mean square error: 63.19/255
- Pixels with mean channel delta > 16: 24.86%

The comparison values are directional because the live authenticated routes intentionally use empty/pending truthful state content while the reference frames contain populated review content and board-specific copy.
