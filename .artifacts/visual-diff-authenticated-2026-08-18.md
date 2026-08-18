# Authenticated visual diff diagnostics

These are normalized board-level diagnostics. The authoritative boards are composite design sets, not one-to-one viewport screenshots; therefore the numerical difference is evidence for drift and not a pass/fail pixel score.

## Checkout
- Rendered artifact: `.artifacts/auth-cart-1280x720.png` (1280×995)
- Reference board: `/home/ubuntu/kurukoo-design/kurukoo-checkout-screen-set.png` (2560×1440)
- Normalized comparison canvas: 1280×720
- Mean absolute pixel error: 20.28/255
- Root mean square error: 49.83/255
- Pixels with mean channel delta > 16: 14.71%

## Confirmation
- Rendered artifact: `.artifacts/auth-confirmation-1280x720.png` (1280×1216)
- Reference board: `/home/ubuntu/kurukoo-design/kurukoo-confirmations-screen-set.png` (2560×1440)
- Normalized comparison canvas: 1280×720
- Mean absolute pixel error: 20.10/255
- Root mean square error: 49.63/255
- Pixels with mean channel delta > 16: 14.44%

## Tasks
- Rendered artifact: `.artifacts/auth-tasks-1280x720.png` (1280×1211)
- Reference board: `/home/ubuntu/kurukoo-design/kurukoo-operations-screen-set.png` (1600×920)
- Normalized comparison canvas: 1280×720
- Mean absolute pixel error: 17.97/255
- Root mean square error: 43.30/255
- Pixels with mean channel delta > 16: 12.13%

## Connect
- Rendered artifact: `.artifacts/auth-connect-1280x720.png` (1280×1408)
- Reference board: `/home/ubuntu/kurukoo-design/kurukoo-operations-screen-set.png` (1600×920)
- Normalized comparison canvas: 1280×720
- Mean absolute pixel error: 20.42/255
- Root mean square error: 49.62/255
- Pixels with mean channel delta > 16: 14.83%

