# Kurukoo v5.52 — Build Status

**Status:** Deferred → storefront re-bind closed; core engines + quotas + workers stable
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.52**
**Date:** 2026-08-11

## Verification
- Entry point: `index.ts` → `src/index.ts` + `startBackgroundWorkers()`.
- Identity remains single `memory_profiles` (Tight Integration Mandate).

## v5.52 Highlights

### Deferred → economic_request re-bind (§4.1.3 / §55.6)
- `open_intentions.economic_request_id` links deferred rows to storefront sessions.
- On deferred match, worker **quotes** the linked `economic_request` (matched → quoted) so resume is not empty.
- `tryResumeStorefront` / `resumeStorefrontFromRequest` rebuild quote_review / fulfillment / deferred cards without creating a new request.
- Intent router:
  - Explicit resume phrases (“continue”, “found a match”, …)
  - Soft resume on short messages when an open matched request exists
  - `startStorefrontSession` prefers resume for the same skill over duplicate rows
- FCM copy nudges: “say continue to review the quote”.

### Prior (v5.51 / v5.50)
- Deferred closed-loop match + FCM notify
- Living Memory Engine, Transaction Orchestration, Agentic Storefront UI, AI quotas, workers

## Still open vs Blueprint v5.62
- PSP-backed bill payments & regulated cross-border rails
- Embedding-based MMR (keyword only at launch)
- Redis / PostgreSQL at multi-instance scale
- Full UK life-admin skill seeding completeness
- IoT bridge beyond MQTT stub
- Universal vendor ordering depth (§55.4 catalog / multi-vendor)

## Env knobs
| Variable | Purpose |
|----------|---------|
| `KURUKOO_WORKERS` | `0` disables background workers |
| `KURUKOO_ORCHESTRATION_INTERVAL_SEC` | Orchestration cadence |
| `KURUKOO_DEFERRED_INTERVAL_SEC` | Deferred re-check cadence (default 2h) |
| `AI_QUOTA_SIMPLE_PER_DAY` / `COMPLEX` / `TOKENS_PER_DAY` | AI budgets |
| `AI_QUOTA_HARD_BLOCK` | `false` soft-fails to template |
