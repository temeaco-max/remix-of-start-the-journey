# Mobile Checkout and Confirmation responsive audit

The authenticated `/cart` and `/confirmation` routes were captured at a 390×844 viewport. Individual Review-cart and Confirm-request reference frames were extracted from the existing reference crop using deterministic coordinates, without reopening the attached images in the file viewer.

## Pixel diagnostics

| Surface | Mean absolute error | RMSE | Pixels over delta threshold |
|---|---:|---:|---:|
| Cart | 25.01 / 255 | 59.06 / 255 | 21.65% |
| Confirmation | 29.12 / 255 | 63.19 / 255 | 24.86% |

These values are directional only. The reference frames are board crops and depict populated review content, while the live authenticated routes intentionally render empty-cart and pending-confirmation content.

## Responsive behavior

Both routes reported a 390 px document width and 390 px client width, with no horizontal overflow. The mobile workspace uses a fixed off-canvas sidebar at approximately 292 px wide. The sidebar collapse interaction reduced it to a 72 px rail while keeping the document width at 390 px and `overflow-x: hidden` on both body and document. The mobile-only navigation trigger remains present in the workspace header.

The Cart content uses 16 px mobile page padding and the primary empty-cart action is 306 px wide with 35 px side margins, which is suitable for one-handed use. Its Continue control is not sticky; it appears below the initial viewport at approximately y=942 and is reachable through normal vertical body scrolling. The Confirmation route similarly uses normal document flow rather than a fixed bottom action bar. No action was added because the current routes are truthfully empty/pending states and the reference frames contain different populated content; adding a sticky action from this evidence alone would be speculative.

The browser measurements showed no horizontal overflow, no clipped mobile sidebar, and no confirmed one-handed spacing defect. The remaining visual gap is state-specific reference matching: a populated seeded Cart/Confirmation fixture must be rendered before a binary mobile pixel pass can be claimed.
