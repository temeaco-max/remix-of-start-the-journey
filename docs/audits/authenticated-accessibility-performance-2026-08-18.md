# Authenticated accessibility and performance audit

## Checkout

The live authenticated `/cart` surface loaded with document title `Cart · Kurukoo`. The DOM audit found no visible images missing `alt`, no unnamed visible buttons, no unnamed visible links, no unlabeled visible fields and no duplicate IDs. The visible heading hierarchy contained `Cart`, `Review items before you request them.`, `Your cart is empty` and `Was your recent request resolved?`.

Navigation timing was 101 ms to DOMContentLoaded and 182.1 ms to load completion, with 10 resources and 78,042 transferred bytes. The document scroll height was 1,100 px at the 1280×720 viewport.

## Confirmation

The authenticated `/confirmation` surface had no visible images missing `alt`, unnamed visible buttons, unnamed visible links, unlabeled visible fields or duplicate IDs. Its visible headings were `Confirmation`, `Review and continue with confidence.`, `What happens next` and `Was your recent request resolved?`.

Navigation timing was 50.5 ms to DOMContentLoaded and 80.7 ms to load completion, with 10 resources. The browser reported zero transferred bytes for this repeat navigation because resources were served from cache. Scroll height was 1,100 px.

## Tasks

The authenticated `/tasks` surface had no visible images missing `alt`, unnamed visible buttons, unnamed visible links, unlabeled visible fields or duplicate IDs. Its visible headings were `Tasks`, `Small tasks can improve the network.`, `Verify a location`, `Update a price`, `Confirm an incident`, `Topics you may care about` and `Was your recent request resolved?`.

Navigation timing was 46.8 ms to DOMContentLoaded and 90.8 ms to load completion, with 10 resources and zero transferred bytes on the cached repeat navigation. Scroll height was 1,100 px.

## Connect

The authenticated Connect/channel-directory route was verified at `/channels`. It had no visible images missing `alt`, unnamed visible buttons, unnamed visible links, unlabeled visible fields or duplicate IDs. The visible heading tree covered the public channel directory, communication channels, connected sources and external-readiness subsections.

Navigation timing was 112 ms to DOMContentLoaded and 154.4 ms to load completion, with 11 resources, 48,529 transferred bytes and 3,631 px of document height. The route is materially longer than the authenticated workspace surfaces because it is the public channel-directory composition, not the compact central Chat Connect projection.

## Checkout diff-region inspection

The normalized Checkout diff is a composite-board comparison rather than a one-to-one screenshot comparison. The largest apparent differences cluster in four regions: the left navigation and Chat shell, the composite board’s multiple checkout stages, the empty-cart state rendered by the current route, and the lower sponsored/proactive area. These regions overlap because the authoritative board contains four separate product states while the live `/cart` capture contains one authenticated workspace state.

The artifact does not establish a confirmed CSS defect by itself. It does establish that a meaningful pixel-perfect score cannot be inferred from the current whole-board overlay. The concrete live-surface checks found a coherent Cart hierarchy, truthful empty-cart/payment state, accessible controls and no missing labels. The actionable remaining comparison is crop-level matching of the live Cart state against the corresponding Checkout board crop, not global whole-board thresholding.

## Repository accessibility contract

The initial static audit scanned 68 EJS/HTML templates and found four WCAG 1.3.1 findings in `views/discover.ejs`: the Services, Places, Events and Businesses layer checkboxes lacked explicit accessible-name hooks. Each checkbox now has an explicit `aria-label` while retaining the existing label wrapper and visual layout. The re-run reports zero findings, with focus-visible, reduced-motion, forced-colors and minimum touch-target checks all passing.

The production TypeScript build, public-asset copy, CSS optimization and whitespace validation also passed after the repair.

## Crop-level Checkout comparison and full integration suite

A crop-level comparison was generated between the live authenticated Cart workspace crop `(184, 0, 824, 720)` and the first review-stage crop of the authoritative Checkout board `(520, 0, 1800, 1440)` normalized to 640×720. The crop comparison measured 19.05/255 mean absolute error, 47.72/255 RMSE and 14.23% of pixels above the channel-delta threshold. The strongest diagnostic regions were concentrated in the lower action/sponsored area and the main content blocks. These results remain non-binary because the live Cart intentionally renders an empty cart while the reference crop depicts a populated sourced-item review. No CSS change was justified from the crop alone.

The first full route suite run exposed a real contract mismatch: `scripts/test-public-routes.ts` did not yet include the newly canonical `/confirmation` route. The expected route list was updated, and the complete `npm run test:routes` suite then completed successfully. It covered public routes, workspace, tasks, channels, auth entry and development auth, alongside the broader canonical service regressions. The log contains expected boundary warnings for unavailable external inference, FCM device registration and invalid/missing Telegram webhook secrets; the corresponding tests passed fail-closed.
