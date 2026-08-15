# WebRTC boundary verification

The authenticated WebRTC signalling routes now consult the canonical `getWebRTCStatus()` boundary before creating rooms, listing peers, accepting signals, or reading signals.

With `FF_WEBRTC`, `STUN_SERVERS`, `TURN_URL`, and `TURN_SERVER_URL` absent, the service reports:

| Field | Value |
|---|---|
| Signalling | `repository_ready` |
| Enabled | `false` |
| Available | `false` |
| Relay configured | `false` |

The route boundary returns HTTP `503` with a safe readiness payload instead of allowing signalling to appear usable. The payload contains no secret values and identifies the remaining activation requirement: an explicit feature flag, an approved relay prerequisite, security review, consent, and browser interoperability validation.

`npm run test:webrtc-boundary` and `npm run test:composition` passed. Anonymous callers continue to be rejected by authentication before any signalling operation is considered.
