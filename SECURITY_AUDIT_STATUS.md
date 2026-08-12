# Kurukoo Security Audit Status

**Date:** 2026-08-11  
**Blueprint:** `BLUEPRINT.md` v5.62  
**Current architecture:** canonical route boundaries under `src/routes/*`; `src/index.ts` is composition/startup only.

## 2026-08-11 convergence verification

**Candidate branch:** `fix/convergence-release-readiness`
**Integration target:** `integration/near-completion` — **not `main`**
**Verified commit:** `93ede899a46340ce027a84a574c25c88262a33b6`

The convergence candidate passed the final security, economic authorization, route/lifecycle, service, skills, messaging, chat DOM-safety, email-signature, build, and lint checks. It also removes `src/services/githubService.ts`, all `/api/admin/github/*` administrative workspace endpoints, their route test expectation, and obsolete maintenance-script mutations, leaving no tracked workspace service or endpoint signature.

The final public-runtime checks confirmed that homepage and Explore preview content does not use fabricated named providers, provider counts, ratings, distances, availability, or transaction activity. The homepage Education CTA was corrected to the registered `/explore/education` route, and a runtime regression test protects both that link and the truthful Explore index/category contract.

> **Security release posture:** This branch is safe to propose for integration into `integration/near-completion`; it does not satisfy the separate requirement for external PSP, provider verification, identity verification, notification, and owner-side credential-rotation readiness.

The non-strict CSS audit still reports 217 legacy inline-style findings across 13 files. The production `npm audit --omit=dev` reports two high-severity advisory paths through `@huggingface/transformers` → `sharp`; npm reports no safe automated fix. Both are recorded for follow-up rather than masked.

## Current status

| Area | Status | Current implementation |
|---|---|---|
| JWT authentication | ✅ | JWT secret is required; browser OTP flow keeps the token in an HttpOnly cookie rather than returning it to page JavaScript. |
| Header/phone auth bypass | ✅ | Authenticated routes use the canonical authenticated identity. |
| Admin authorization | ✅ | Admin surfaces use admin authentication rather than ordinary user identity. |
| Economic operational authorization | ✅ | Economic Request user-owned routes explicitly apply `authenticateUser`; orchestration and memory-lifecycle maintenance routes explicitly apply `authenticateAdmin`. The Economic Request audit performs HTTP checks for anonymous, ordinary-user, admin, and cross-user access. |
| Economic request ownership | ✅ | Customers can only access their own economic requests. |
| Provider delivery ownership | ✅ | The assigned provider’s authenticated phone is required to advance order-delivery status. Customer/unrelated callers receive an authorization failure, and invalid state jumps are conflicts rather than silent mutations. |
| Secret scanning | ✅/⚠️ | CI includes a Gitleaks scan and the current `.env.example` contains placeholders only. A historical environment-template exposure was identified; secret scanning cannot revoke historical values. |
| Historical credential remediation | ⚠️ | A reachable historical `.env.example` revision exposed GitHub, Gemini, Hugging Face, and Groq credential types. Values are not retained in the current tree. Provider-console revocation, rotation, and audit-log review remain required owner actions. |
| Webhook signatures | ✅ | Channel webhook validation is implemented where the provider supports it. |
| Client-side untrusted text | ✅ | Provider, opportunity, promotion, and optimistic chat rendering uses DOM construction and `textContent` rather than interpolating those values into HTML or inline event attributes. |
| Production dependency audit | ⚠️ | Unused `uuid` and deprecated unused `multer` were removed. The local SmolLM2 service actively uses `@huggingface/transformers`, whose current `sharp` dependency remains under a high-severity upstream advisory with no safe npm fix available. |
| Payment fail-closed behaviour | ✅ | Production cannot silently use the sandbox payment provider. |
| Sandbox mutation isolation | ✅ | Sandbox economic mutations are restricted to non-production use. |
| Demo provider isolation | ✅ | Demo provider seeding is development-only. |
| Economic lifecycle authorization | ✅ | Customer routes are restricted to customer-owned transitions; provider/system transitions remain in service orchestration. |
| Provider verification semantics | ✅/⚠️ | Matching requires an explicit verification flag. Real-world verification evidence/expiry/revocation adapters remain to be integrated. |
| Location matching | ✅/⚠️ | Provider matching applies the supplied location against stored service-area fields. Precise geospatial/radius matching requires real geocoding/presence data and is not fabricated. |
| Escrow semantics | ✅/⚠️ | The reusable ledger requires verified payment evidence with a non-empty reference. Direct client creation and the unreferenced legacy order-finalizer write are disabled; real regulated/PSP escrow remains an external integration. |
| Monetary quote semantics | ✅ | No fake/default monetary quote is generated. Provider-listed rates are labelled indicative; final quotes must be confirmed; deferred re-matching leaves an unpriced match partially matched rather than creating a fallback quote. |
| Completion Points integrity | ✅ | Released escrow events award the bounded canonical job-completion reward (1–5 Points), not the monetary escrow amount, with a release-event marker preventing duplicate awards. |
| Cross-channel economic identity | ✅ | The shared SMS/Telegram handler passes the channel-derived identity to the canonical intent router; SMS normalizes its phone key before message or Economic Request persistence. |
| Pulse statistics truthfulness | ✅ | `/api/stats/pulse` derives only generic active-provider signals from the shared presence service and does not fabricate matched, dispatched, payment, or escrow events. |
| Push delivery semantics | ⚠️ | The currently unconfigured FCM adapter fails closed and does not log device tokens or report a simulated delivery. A real adapter and channel fallback/receipt flow are still required. |
| Attachment security | ⚠️ | Authenticated, size-limited uploads exist; production object storage, malware scanning, signed access URLs and retention controls remain recommended before high-volume media use. |
| Single-instance persistence | ⚠️ | SQL.js remains the launch database. Exports now write to a same-directory temporary file and atomically replace the live file, but the model remains single-process and is not a multi-writer database. |
| Distributed rate limiting/presence | ⚠️ | Auth, AI, webhook, and payment limits use explicit process-local buckets. They are suitable only for the documented single-instance launch model; Redis becomes necessary when multi-instance coordination is introduced. |
| Database scale | ⚠️ | PostgreSQL is the production transition point when concurrent replicas, high availability, transactional recovery guarantees, or sustained marketplace-scale write volume are required. |
| Real PSP | ❌ | Production PSP credentials/contracts are still required. The code fails closed rather than pretending a payment succeeded. |
| External identity/provider verification | ❌ | Production verification adapters/evidence workflows still require external integrations. |

## Economic truth rules

The following are non-negotiable:

1. A database escrow row is **not** proof that money is held.
2. A provider record is **not** proof that the provider is verified.
3. A provider profile is **not** proof of current availability.
4. A listed starting rate is **not** a confirmed quote.
5. A successful database transition is **not** proof that an external fulfilment event occurred.
6. A sandbox payment is never a production payment.

Artist, creator, and celebrity requests remain ordinary Economic Requests. Their representation, rider, travel, contract, and negotiation needs are requirements and capabilities in the shared economic skill/lifecycle model rather than a privileged route or transaction architecture.

The authenticated `/api` trust boundary derives buyer identity from the session, lists only the buyer’s escrow records, and rejects cross-user dispute attempts. Opening an idempotent dispute freezes the existing held escrow, records the linked Economic Request as `disputed` during its cooling-off period, and prevents further release while the escrow remains disputed. Generic Economic Request transition endpoints cannot bypass that freeze by setting `disputed` directly.

## Remaining security work

1. The repository owner must revoke and rotate the credential types exposed in the historical `.env.example` revision, then review relevant provider and GitHub audit logs. Do not test or reuse historical values.
2. Track a compatible `@huggingface/transformers` release that upgrades its `sharp` dependency to a fixed version. Do not force an unverified override merely to suppress the audit.
3. Protect the `main` branch with required passing CI checks, pull requests, and review before relying on CI as a release gate.
4. Integrate and certify a real PSP before enabling production payment/escrow claims.
5. Integrate a real FCM provider plus a channel fallback and receipt-confirmation workflow before operational notification delivery can be claimed.
6. Integrate provider/identity verification with auditable evidence, expiry and revocation.
7. Move chat media to protected object storage with malware/content scanning and signed access when production volume warrants it.
8. Expand cross-channel behavioural security tests from the SMS identity path to web, WhatsApp, Telegram, USSD and email.
9. Implement the Blueprint §15.1 trust-score recalculation and auditable `trust_ledger` entry after completion, dispute resolution, and the documented daily pass; the existing profile field does not yet prove a live reputation calculation.
10. Introduce Redis-backed distributed rate limiting/presence and PostgreSQL only when the documented multi-instance transition conditions are met.

## History-rewrite decision

The exposed values remain in reachable Git history even though the current tree is clean. Rotation and provider-side review are mandatory regardless of any rewrite. Rewriting public history can reduce casual discoverability but disrupts existing clones, forks, open pull requests, and references; it must be an owner-approved, coordinated decision and is not performed automatically by this repository change.

## Implementation rule

Before implementing a security or platform capability, inspect the current repository and confirm whether an existing canonical implementation already provides it. Extend the canonical implementation instead of creating a parallel service or route.
