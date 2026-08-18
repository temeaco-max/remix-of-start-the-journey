# PWA offline and reconnect verification

The local Chat PWA route `/chat/` returned successfully and rendered the canonical Chat shell with the existing guest-first onboarding, workspace navigation, composer, inspector, and channel readiness cards.

The browser console reported:

| State | Value |
|---|---|
| Service-worker controller | Present |
| `document.documentElement.dataset.pwaState` | `registered` |
| `document.documentElement.dataset.pwaOnline` | `true` |
| PWA status region | Empty after the transient online notice expired |

The PWA controller listens for online/offline transitions, reports cached-shell availability without claiming that new messages can send offline, refreshes the service worker when the app returns to the foreground, and offers an explicit update action when a new worker is installed.

## Safe offline message continuity

When the user attempts to send a plain-text Chat message while the browser is offline, the PWA controller now saves the message locally (bounded to ten pending messages) and tells the user explicitly that nothing was sent automatically. Composer send/Enter and quick-action prompts are intercepted only while offline. Once connectivity returns, each saved message has an explicit **Retry** action; choosing Retry places the message back into the existing canonical Chat composer and invokes the existing send path. No background worker or service worker automatically executes a previously unsent user request.

Attachment uploads are not queued: they still require the existing authenticated HTTP upload boundary. This avoids retaining binary user data in an ad-hoc offline queue.

The service worker caches the PWA controller itself and matches versioned static asset requests with `ignoreSearch: true`, preventing query-string cache busting from breaking the offline shell.

The permanent contract is `npm run test:pwa-contract`, which now checks the offline pending-message queue, explicit manual retry boundary and non-automatic send behavior alongside the existing standalone shell/update/offline invariants.
