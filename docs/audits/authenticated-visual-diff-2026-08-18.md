# Authenticated Visual Diff Audit — 18 August 2026

## Reference findings recorded

The authoritative Checkout board uses four narrow portrait Chat compositions inside a warm off-white desktop canvas. It consistently uses the compact terracotta loop-and-person mark, a slim Chat header, rounded white cards, small evidence rows, explicit seller/source/provenance fields, and a clear distinction between a request and an automatic purchase. The primary action is terracotta, with a full-width composer anchored at the bottom of each Chat frame. Payment is explicitly pending or not completed when external settlement has not occurred.

The authoritative Confirmation board uses four states: prepared action proposal, accepted internally, external-provider pending/unavailable, and notification center. The visual contract requires explicit state labels, evidence and request identifiers, a chronological progress indicator where relevant, strong but truthful provider-boundary language, and a direct “Continue in Chat” path. Status colors are semantic: terracotta for primary, pale green for accepted/verified, pale amber for pending, and pale red/orange for unavailable or not delivered.
## Authenticated capture conditions

A process-scoped development server was started on port 3013 with `KURUKOO_DEV_AUTH=true` and the configured test identity. The browser completed the canonical name → phone → test-code flow using the development-only code shown by the page; no production credential or external delivery claim was used.

The authenticated Cart state was captured at a 1280×720 desktop viewport. The authenticated Tasks state was then captured at the same viewport. The browser capture tool produced full-page PNG artifacts for both states. The artifacts are used as rendered evidence; exact reference-image diffing is only meaningful after normalizing viewport, scale and surface framing because the source boards combine multiple portrait compositions on a desktop contact board.
## Tasks and Connect capture findings

The authenticated Tasks DOM currently presents the general contributor-task surface: `Tasks`, `Contribute`, available-task cards and Chat links. It does not yet present the dedicated Tasks/reminders/notifications index hierarchy from the reference definition (`All`, `Due soon`, `Waiting`, `Completed`, exact object identity, due state and primary action). This is a confirmed content/structure drift, not a pixel-only variance.

The authenticated Connect route resolves to `/connect` and was captured at the same 1280×720 desktop viewport. It is the canonical channel-readiness surface and should be compared with the channel-directory contract: Web Chat, WhatsApp, Telegram, SMS/USSD and Push cards, ownership/privacy notes, and truthful readiness actions. The full-page capture artifact was produced successfully.
## Visual inspection findings

The saved Tasks capture renders a polished shared workspace shell, but the content is a contributor-task landing page with `Available`, `My tasks in Chat` and `Completed in Chat` links. It lacks the reference board’s task index model for reminders and delayed work, including state tabs, due dates and exact object identity. The lower “Topics you may care about” block also shows a loading state in the capture, increasing vertical density without advancing the requested Tasks contract.

The saved Connect capture is visually coherent and truthfully provider-gated. It preserves the shared sidebar/header, uses the warm cream/white/terracotta system, separates AI assistants from personal WhatsApp and Telegram linked-device cards, and explicitly labels WhatsApp as `NOT CONFIGURED`. It therefore aligns with the channel-directory truth model, although its exact composition differs from the narrower portrait reference framing.
## Cart and Confirmation findings

The authenticated Cart capture is visually aligned with the shared workspace grammar and truthfully says that the cart does not imply inventory, a confirmed quote or a separate payment flow. Its empty state is clear and the disabled Continue action is appropriate. However, it is an empty-cart workspace rather than the four-stage Checkout reference board, so item-level provenance, seller evidence, request confirmation and payment-status states could not be pixel-compared from this session.

The canonical `/confirmation` path was tested in the authenticated browser session and returned HTTP 404 with one console error. Repository route inspection confirms that only workspace routes (`/requests`, `/reminders`, `/cart`, `/tasks`, `/connect`, and related surfaces) are registered; there is no dedicated Confirmation route or template. This is a real route-coverage gap, not a visual mismatch.
## Confirmation route and capture

After restarting the isolated preview server, `/confirmation` was rechecked in an authenticated browser session and now resolves with HTTP 200 as `Confirmation · Kurukoo`. The full-page artifact is saved at `.artifacts/auth-confirmation-1280x720.png`.

The rendered surface uses the existing workspace shell and CSS authority. It presents three explicit truth states—`Accepted internally`, `Pending confirmation`, and `Not completed`—followed by request evidence rows and `Continue in Chat`. The capture is visually coherent and preserves the non-fabrication boundary. The reference board’s success/pending/evidence hierarchy is now represented, though a normalized crop-level pixel comparison remains necessary because the reference board is a composite of multiple portrait screens.
## Live Discover exact-context audit

At `http://127.0.0.1:3013/discover/?conversationId=conversation:visual-qa`, the rendered Discover cards exposed four exact Chat hrefs. Each href contained both the exact `discoveryEntityId` (`preview:lekki:repair`, `preview:ikeja:market`, `preview:lagos:community`, or `preview:vi:business`) and the originating `conversationId=conversation:visual-qa`. Each card rendered the action label `Open exact context in Chat` and the badges `Service/Place/Event/Business`, the lifecycle (`discovered`, `opportunity` or `candidate`) and `Preview example`.

The card copy also explicitly preserved the boundary that the business is “not yet a Kurukoo provider.” The page status was still `Finding useful context…` with `Waiting for location` after 1.2 seconds, while preview cards were already present. This confirms immediate preview rendering, but indicates the live status text can remain transient while the bounded location/network work proceeds. The existing five-second request timeout and final preview fallback remain the safety net.
