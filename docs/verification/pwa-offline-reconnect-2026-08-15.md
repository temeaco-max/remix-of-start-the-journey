# PWA offline and reconnect verification

The local Chat PWA route `/chat/` returned successfully and rendered the canonical Chat shell with the existing guest-first onboarding, workspace navigation, composer, inspector, and channel readiness cards.

The browser console reported:

| State | Value |
|---|---|
| Service-worker controller | Present |
| `document.documentElement.dataset.pwaState` | `registered` |
| `document.documentElement.dataset.pwaOnline` | `true` |
| PWA status region | Empty after the transient online notice expired |

The visible Chat page displayed the transient truthful message `Back online. Kurukoo can continue your conversation.` during load. The new controller now listens for online/offline transitions, reports cached-shell availability without claiming that new messages can send offline, refreshes the service worker when the app returns to the foreground, and offers an explicit update action when a new worker is installed.

The service worker now caches the PWA controller itself and matches versioned static asset requests with `ignoreSearch: true`, preventing query-string cache busting from breaking the offline shell.
