# Kurukoo Production Implementation Boundary

**Status:** Operational boundary guidance. This document is subordinate to `BLUEPRINT.md` and `docs/architecture/CURRENT_PRODUCT_TRUTH.md`.

The repository can prove code, ownership, buildability and deterministic contracts. Human/operator access is required for provider activation, credential rotation, cloud infrastructure, device testing, compliance and real-world outcome evidence.

## What repository work can establish

1. Explicit separation between repository, runtime and real-world verification.
2. Pilot readiness signals for attachment storage, object storage, multi-worker/scale transition and production-secret strength.
3. Fail-closed production defaults for autonomous/high-risk features and payments.
4. Ordered owner actions that cannot be performed honestly by source code alone.
5. Scale-transition readiness without pretending that PostgreSQL/Redis/object storage are active.

## What the repository cannot complete alone

| Action | Why it requires an operator/external system |
|---|---|
| Rotate historical provider/GitHub credentials | Provider console access and audit-log review |
| Enable GitHub branch protection and required reviews | Repository-owner settings access |
| Activate live WhatsApp/Meta Cloud API | Business verification, phone identity and signed webhook secrets |
| Activate live payment/settlement | Merchant account, KYC, webhook and compliance evidence |
| Provision production Postgres/Redis/object storage | Cloud project, networking, secrets and operations ownership |
| Prove real device push delivery | Firebase project, device tokens and field testing |
| Complete human curation for the student model | Human review of candidate trajectories |
| Perform real load/chaos testing | Deployed environment and controlled traffic |

## Non-negotiable truth rules

1. A database escrow row is **not** proof that money is held.
2. A configured secret is **not** proof that a provider is live.
3. A sandbox payment is **never** a production payment.
4. SQL.js remains single-process; multiple workers require an approved shared persistence/rate-limit boundary.
5. Chat and UI must never claim external fulfilment, verification or delivery without evidence.

## Owner P0 sequence

1. Rotate historically exposed credential types and review provider/GitHub audit logs.
2. Protect `main` with required CI, PRs and review.
3. Deploy one controlled production instance with persistent storage, HTTPS, strong authentication secrets and development-auth flags disabled.
4. Keep payments disabled or configure one real adapter with verified webhooks; never enable sandbox payment in production.
5. Activate one external channel only after its signature/challenge boundary is verified.
6. Run the canonical repository truth gate plus the deployed core-journey runtime suite; fix truthfulness regressions before inviting users.

## Scale transition criteria

Move beyond SQL.js + process-local limits only when concurrent multi-instance writes, sustained marketplace-scale traffic, distributed rate limiting/presence/agent workers, or stronger recovery/HA requirements justify it.

Until then, the single-instance launch architecture remains the intentional low-cost path.
