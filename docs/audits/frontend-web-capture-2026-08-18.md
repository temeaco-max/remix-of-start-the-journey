# Frontend Web Capture Audit — 18 August 2026

## Initial homepage capture

The isolated local server at `http://127.0.0.1:3011/` returned HTTP 200 and rendered the page title **Kurukoo — Wake Up. Get Going.** in Playwright. An accessibility snapshot with bounding boxes was captured at the desktop browser viewport and saved by the browser session as `kurukoo-home-snapshot.md`.

The server started with sandbox payment boundaries, no WhatsApp/Telegram linked session, no production Stripe secret, and no fabricated delivery state. FCM configuration is present but runtime device registration and delivery evidence remain pending. This audit therefore treats configured credentials as readiness inputs, not proof of external activation.

## Discover capture

The canonical `/discover/` route rendered successfully with the same Kurukoo document title. A full-page desktop screenshot was captured as `kurukoo-discover.png` in the browser session. No route redirect or browser-level failure occurred; visual comparison remains pending against the authoritative Discover screen set.

## Channels capture

The merged `/channels` route rendered successfully at the local audit server and a full-page desktop screenshot was captured as `kurukoo-channels.png` in the browser session. The route remained available without authentication or external-provider claims; detailed section comparison remains part of the repair pass.

## About capture

The `/about` route rendered successfully and a full-page desktop screenshot was captured as `kurukoo-about.png` in the browser session. It remained a public route with no external activation implication; trust-content and visual hierarchy are queued for comparison against the frontend website authority.

## Help capture

The `/help` route rendered successfully and a full-page desktop screenshot was captured as `kurukoo-help.png` in the browser session. No public route failure or external capability claim was observed during navigation; support content and handoff actions remain subject to the visual and journey comparison pass.

## Public Chat capture

The `/chat/` route rendered with title **Chat with Kurukoo**, no console errors and two warnings on navigation. A full-page desktop screenshot was captured as `kurukoo-chat-public.png` in the browser session. The public Chat shell is available for visual comparison; warning details require a later console review before any code change.

## Chat warning recheck

The current server response for `kurukoo-primary-chat.js?v=17` contains the edited source with the dead authentication branches removed. The existing Playwright page still reported the old unreachable-code line numbers after reload, so the remaining warnings are treated as a stale browser-cache/session artifact pending a fresh browser context, not as evidence to change active Chat behavior further.

## Cache-busted Chat recheck

The source HTML now references `kurukoo-primary-chat.js?v=18`, but the running isolated server/browser still reported the previous `v=17` asset and its old unreachable-code warnings. This confirms the isolated server process is serving stale HTML from its startup snapshot and must be restarted before judging the cleanup. A separate PWA update-registration warning is expected on the loopback audit server where service-worker registration is unavailable.

## Post-restart Chat verification

After restarting the isolated server, the page served `kurukoo-primary-chat.js?v=18`. A fresh Playwright navigation to `/chat?fresh=3` produced zero console warnings and zero errors. The unreachable-code diagnostics were therefore stale-server/cache artifacts and are resolved by the source cleanup plus version bump.
