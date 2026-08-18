# Populated Mobile Checkout Fixture Audit — 2026-08-18

## Scope

This audit adds and exercises a provider-independent, development-only visual-QA fixture for the authenticated `/cart` and `/confirmation` routes. The fixture is activated only when `KURUKOO_VISUAL_QA=true`, the server is not running in production, and the request includes `visual_qa=populated`. Production defaults remain the truthful empty Cart and pending Confirmation states.

The fixture uses the existing workspace template and CSS authorities. It presents a source-attributed client-meeting preparation item, seller and provider evidence, provisional delivery, pending price confirmation and a not-completed payment state. It does not mutate the cart database, claim inventory, initiate payment or claim external fulfilment.

## Viewports and captures

| Device profile | Viewport | Cart capture | Confirmation capture |
|---|---:|---|---|
| iPhone SE | 375 × 667 | `.artifacts/populated-cart-iphone-se-375x667.png` | `.artifacts/populated-confirmation-iphone-se-375x667.png` |
| Pixel 7-style | 412 × 915 | `.artifacts/populated-cart-pixel7-412x915.png` | `.artifacts/populated-confirmation-pixel7-412x915.png` |

## Directional pixel comparison

Each live capture was normalized against its corresponding individual Checkout or Confirmation reference frame extracted from the existing design-board crop. These metrics are directional rather than binary because the reference frames are board crops, typography rasterization differs, and the live fixture includes application shell and truthful state copy.

| Device | Surface | Mean absolute error | RMSE | Pixels above mean delta 16 |
|---|---|---:|---:|---:|
| iPhone SE | Cart | 174.18 / 255 | 204.81 / 255 | 77.61% |
| iPhone SE | Confirmation | 183.49 / 255 | 209.77 / 255 | 81.35% |
| Pixel 7 | Cart | 145.80 / 255 | 186.17 / 255 | 67.04% |
| Pixel 7 | Confirmation | 160.39 / 255 | 195.07 / 255 | 72.79% |

The high values should not be interpreted as a confirmed layout regression. The comparison canvas contains different surrounding shell composition and the reference is not a one-to-one browser capture. The fixture does, however, provide the correct populated semantic state for subsequent crop-level refinement.

## Responsive measurements

| Device | Surface | Document width / viewport | Horizontal overflow | Sidebar position | Primary action geometry |
|---|---|---:|---|---|---|
| iPhone SE | Cart | 375 / 375 | None | Off-canvas at x=-298, width 292 | Confirm request: x=51, width 291, height 48; Cancel: width 291, height 50 |
| iPhone SE | Confirmation | 375 / 375 | None | Off-canvas at x=-298, width 292 | Continue in Chat: x=35, width 160, height 48 |
| Pixel 7 | Cart | 412 / 412 | None | Off-canvas at x=-298, width 292 | Confirm request: x=51, width 328, height 48; Cancel: width 328, height 50 |
| Pixel 7 | Confirmation | 412 / 412 | None | Off-canvas at x=-298, width 292 | Continue in Chat: x=35, width 160, height 48 |

The mobile navigation trigger remained present in all tested states. The sidebar did not expand the document width, and all measured primary actions remained reachable in normal document flow. No fixed bottom action bar was introduced because the existing workspace contract uses normal flow and the user-facing action remains accessible after vertical scrolling.

## Validation

The production TypeScript build passed. The public-route contract passed with 56 routes. The repository accessibility audit passed with 68 templates scanned, zero findings, and all focus-visible, reduced-motion, forced-colors and minimum-touch-target checks passing.

## Boundary decision

No production data, cart records, provider records, payment state or external integration was changed. No visual CSS rewrite was applied based solely on composite-board pixel differences. The new fixture is an isolated visual-QA seam for accurate populated-state comparison and remains disabled by default.
