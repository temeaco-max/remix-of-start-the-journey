# Kurukoo v5.50 — Build Status

**Status:** Core engines landed (Living Memory · Orchestration · Agentic Storefront · AI Quotas · Workers)
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.50**
**Date:** 2026-08-11

## Verification
- Entry point: `index.ts` → `src/index.ts` + `startBackgroundWorkers()`.
- Identity remains single `memory_profiles` (Tight Integration Mandate).

## v5.50 Highlights (this series of commits)

### Living Memory Engine (§4.3)
- `src/services/livingMemoryEngine.ts` — tiers (stable / episodic / open_intention / recent_tail), keyword MMR, token budgets, `ai_audit_log`, decay/prune/crystallize.
- Wired into `unifiedAiEngine` via `withMemoryContext` when `phone` is present.
- Chat messages tagged with `memory_tier` / `thread_id`.

### Transaction Orchestration (§33.1.3)
- `src/services/tradeEngine.ts` — match → quote → escrow lock → complete → cooling-off release against `economic_requests` FSM in `skillFlows.ts`.
- APIs: `POST .../orchestration/run`, `.../:id/escrow`, `.../:id/complete`.

### Agentic Storefront (§55.6 / §55.4)
- `src/services/agenticStorefront.ts` — multi-stage conversation cards.
- Intent router starts real sessions for ride / food / worker / security.
- Chat UI (`public/js/kurukoo-primary-chat.js`) renders fields, providers, quote, progress, action buttons → `storefront/:id/advance`.

### Hard AI quotas
- `src/services/aiQuotaService.ts` — per-user daily simple/complex/token budgets + global complex/min soft ceiling.
- Enforced in `unifiedAiEngine` with template fallback when exceeded.

### Background workers
- `src/services/backgroundWorkers.ts` — orchestration, deferred expiry, memory lifecycle, data purge.
- Disable with `KURUKOO_WORKERS=0`.

### Prior (v5.41) still in place
- Points economy (§7), Privacy Bridge, artist booking, AI agents admin, unified channels, SEO service.

## Still open vs Blueprint v5.62
- PSP-backed bill payments & regulated cross-border rails
- Embedding-based MMR (keyword only at launch)
- Redis / PostgreSQL at multi-instance scale
- Full UK life-admin skill seeding completeness
- IoT bridge beyond MQTT stub

## Env knobs
| Variable | Purpose |
|----------|---------|
| `KURUKOO_WORKERS` | `0` disables background workers |
| `KURUKOO_ORCHESTRATION_INTERVAL_SEC` | Orchestration cadence |
| `AI_QUOTA_SIMPLE_PER_DAY` / `COMPLEX` / `TOKENS_PER_DAY` | AI budgets |
| `AI_QUOTA_HARD_BLOCK` | `false` soft-fails to template |
