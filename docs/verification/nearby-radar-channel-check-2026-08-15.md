# Nearby Radar and channel-management verification

The Chat shell was verified through the local `/chat/?v=13` route after clearing the old service-worker cache for the test browser.

The initial Chat sidebar now shows:

- **Nearby radar: Ready** by default.
- The control is `aria-pressed="true"` and is labelled `Nearby Radar ready`.
- The state is not presented as live broadcasting.
- A live state is reserved for an authenticated provider session returned by the canonical pulse-readiness boundary.

The controller now uses the following behavior:

| State | Meaning |
|---|---|
| Ready | Local discovery preference is enabled; no provider broadcast is claimed. |
| Live | The authenticated user has an active eligible provider Pulse session. |
| Off | The user explicitly disabled the local Radar preference. |

The controller calls `/api/pulse/readiness` for authenticated users and uses the existing Chat toast region for one session-safe nudge. Consumers are nudged toward local discovery; eligible providers are nudged that they may explicitly Go Live; no location is inferred and no external broadcast is claimed.

The authenticated Connect workspace now receives canonical provider-readiness values for WhatsApp and Telegram. Provider readiness remains distinct from a user’s owner-scoped linked-device session, so `READY` or `NOT_CONFIGURED` does not imply that a personal device is connected.

The browser initially displayed the prior `Inactive` state because the installed service-worker cache held the previous controller and local preference. After clearing that test cache, the current versioned controller rendered `Ready` correctly. This confirms that the asset version bump is required for installed clients and that the service-worker update path must be exercised during deployment validation.
