# Checkout crop-level visual comparison

The live authenticated Cart capture was compared against the first review-stage crop of the authoritative Checkout board. This is a closer state comparison than the prior whole-board composite diagnostic, but the two artifacts still contain different sample content and navigation chrome.

- Live crop source: `.artifacts/auth-cart-1280x720.png`, crop `(184, 0, 824, 720)`
- Reference crop source: `/home/ubuntu/kurukoo-design/kurukoo-checkout-screen-set.png`, crop `(520, 0, 1800, 1440)`, then normalized to `640×720`
- Mean absolute pixel error: 19.05/255
- Root mean square error: 47.72/255
- Pixels with mean channel delta > 16: 14.23%

## Concentrated regions

- Grid row 6, column 3 at (240,540): mean channel delta 46.78/255
- Grid row 6, column 2 at (160,540): mean channel delta 46.77/255
- Grid row 6, column 6 at (480,540): mean channel delta 46.76/255
- Grid row 6, column 7 at (560,540): mean channel delta 46.76/255
- Grid row 6, column 5 at (400,540): mean channel delta 45.43/255
- Grid row 6, column 1 at (80,540): mean channel delta 44.47/255
- Grid row 5, column 6 at (480,450): mean channel delta 44.16/255
- Grid row 5, column 5 at (400,450): mean channel delta 41.28/255
- Grid row 2, column 2 at (160,180): mean channel delta 32.12/255
- Grid row 2, column 6 at (480,180): mean channel delta 30.75/255
- Grid row 7, column 3 at (240,630): mean channel delta 27.49/255
- Grid row 1, column 2 at (160,90): mean channel delta 26.63/255
- Grid row 3, column 3 at (240,270): mean channel delta 25.48/255
- Grid row 5, column 4 at (320,450): mean channel delta 23.91/255
- Grid row 7, column 4 at (320,630): mean channel delta 23.13/255
- Grid row 2, column 4 at (320,180): mean channel delta 22.96/255
- Grid row 0, column 2 at (160,0): mean channel delta 22.8/255
- Grid row 2, column 3 at (240,180): mean channel delta 22.21/255
- Grid row 6, column 4 at (320,540): mean channel delta 22.04/255
- Grid row 2, column 5 at (400,180): mean channel delta 21.96/255
- Grid row 5, column 7 at (560,450): mean channel delta 21.67/255
- Grid row 7, column 2 at (160,630): mean channel delta 21.02/255
- Grid row 5, column 2 at (160,450): mean channel delta 20.54/255
- Grid row 7, column 0 at (0,630): mean channel delta 19.28/255
- Grid row 2, column 7 at (560,180): mean channel delta 18.26/255

The crop result is diagnostic rather than a binary pass/fail because the live route intentionally renders an empty cart while the board crop depicts a populated sourced-item review. A confirmed regression requires matching the same state and content fixture; no CSS change is justified from this crop alone.
