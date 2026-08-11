# Kurukoo v5.51 — Build Status

**Status:** Core engines landed + deferred request protocol closed-loop
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.51**
**Date:** 2026-08-11

## Verification
- Entry point: `index.ts` → `src/index.ts` + `startBackgroundWorkers()`.
- Identity remains single `memory_profiles` (Tight Integration Mandate).

## v5.51 Highlights

### Deferred Request Protocol (§4.1.3) — closed loop
- `processDueDeferred` now **resolves** open intentions when `find_worker` returns providers.
- Sends FCM push (“Kurukoo found a match”) so the user can reopen chat / WhatsApp and continue storefront.
- Still increments attempts + next_check when no match; nightly expire remains.
- Worker log: `checked / matched / notified`.

### Prior (v5.50)
- Living Memory Engine (§4.3) — tiers, keyword MMR, lifecycle, audit.
- Transaction Orchestration (§33.1.3) — match → quote → escrow → complete.
- Agentic Storefront (§55.6) — multi-stage cards in chat UI.
- Hard AI quotas + background workers (orchestration, deferred, memory, purge).

## Still open vs Blueprint v5.62
- PSP-backed bill payments & regulated cross-border rails
- Embedding-based MMR (keyword only at launch)
- Redis / PostgreSQL at multi-instance scale
- Full UK life-admin skill seeding completeness
- IoT bridge beyond MQTT stub
- Richer deferred → economic_request re-bind when user returns (storefront can still start fresh)

## Env knobs
| Variable | Purpose |
|----------|---------|
| `KURUKOO_WORKERS` | `0` disables background workers |
| `KURUKOO_ORCHESTRATION_INTERVAL_SEC` | Orchestration cadence |
| `KURUKOO_DEFERRED_INTERVAL_SEC` | Deferred re-check cadence (default 2h) |
| `AI_QUOTA_SIMPLE_PER_DAY` / `COMPLEX` / `TOKENS_PER_DAY` | AI budgets |
| `AI_QUOTA_HARD_BLOCK` | `false` soft-fails to template |
