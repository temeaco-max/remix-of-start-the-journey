# Project TODO

Repository-side implementation and convergence ledger. External provider access is treated as a runtime dependency and is now wired into canonical activation paths; live provider/device evidence is an operational verification activity, not an unimplemented repository phase.

- [x] Canonical web/PWA/native/Admin surface convergence
- [x] Canonical Admin control plane, authentication shell and module registry
- [x] Canonical Admin dispute/escrow/Economic Request mutation path
- [x] Admin platform health, dependency readiness and scale-transition projection
- [x] Collapse legacy Admin dashboard into canonical Control Room
- [x] Canonical product truth and multi-agent activation roadmap alignment
- [x] Web secondary-surface visual convergence for pricing/contact/legal/developer surfaces
- [x] Discover, Checkout, Confirmation, Tasks, Connect and Partners convergence/regression work
- [x] Conversational identity/name plausibility guard
- [x] Capability Portfolio and bounded agent foundation
- [x] Prayer Companion repository-side capability and authentication boundaries
- [x] Guarded training/candidate curation pipeline and promotion boundary
- [x] Security cleanup for synthetic JWT fixtures
- [x] Push validated repository-side convergence milestones to main
- [x] Converged skill/execution authority propagated through runtime, outcome audit and ML training universe
- [x] Platform-wide convergence audit wired into CI
- [x] Durable DB-backed job queue with leases, retries, exponential backoff and dead-letter state
- [x] Background worker maintenance for FCM drain, provider-verification expiry, webhook-dedup retention and durable job lease recovery
- [x] Canonical provider verification lifecycle with reviewer/evidence/expiry semantics
- [x] Attachment security boundary with MIME/magic/hash checks and malware-scan handoff state
- [x] Artifact persistence gated through the attachment security boundary
- [x] Shared inbound channel webhook idempotency ledger applied to Telegram/WhatsApp
- [x] Verified/retryable outbound Telegram/WhatsApp delivery paths
- [x] External provider activation control plane for Telegram, WhatsApp, Stripe and Resend
- [x] Production boot auto-activation for configured external providers
- [x] Admin activation/probe endpoints for external provider operations
- [x] External activation contract wired into CI

## Operational verification runs

The implementation is complete for the repository/runtime boundary. The remaining work is executing live credentials/devices against the already-implemented paths and reviewing their observed evidence.

- [ ] Run the live external-provider activation probe against the deployed environment
- [ ] Confirm real device/provider delivery receipts across enabled channels
- [ ] Observe the latest main CI workflow result and keep the release line green

## Quality gates

- [x] Repository-side build/lint/route/security/PWA/accessibility/CSS/regression coverage where available
- [x] Truthful UI state semantics and fail-closed external claims
- [x] CI executes the platform-wide convergence gate on every main/PR build
