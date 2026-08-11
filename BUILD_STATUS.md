# Kurukoo v5.52.1 — Build Status

**Status:** Security audit continuation applied (OTP auth routes, WhatsApp HMAC, rate limits, WebRTC auth routes)
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.52.1**
**Date:** 2026-08-11

## Verification
- Entry point: `index.ts` → `src/index.ts` + `startBackgroundWorkers()`.
- Identity remains single `memory_profiles` (Tight Integration Mandate).
- Run `npm run wire:security` (also on `prebuild`) to mount new routers into `src/index.ts`.

## v5.52.1 Security continuation (ChatGPT audit plan)

See `SECURITY_AUDIT_STATUS.md` for full matrix.

### Shipped in this pass
- OTP auth service + `/api/auth/request-otp` + `/verify-otp` (JWT only after OTP)
- Hardened `/api/auth/login` (no bare-phone JWT unless `OTP_LEGACY_LOGIN=true`)
- WhatsApp `X-Hub-Signature-256` verification when `WHATSAPP_APP_SECRET` is set
- Shared rate limiters (auth / AI / webhook / payment)
- Authenticated WebRTC signalling router (`/api/webrtc/*`)
- Gitleaks CI already present; `.env.example` remains placeholder-only

### Prior (v5.52)
- Deferred → economic_request re-bind
- Living Memory Engine, Transaction Orchestration, Agentic Storefront, AI quotas, workers

## Still open vs Blueprint v5.62
- PSP-backed bill payments & regulated cross-border rails
- Embedding-based MMR (keyword only at launch)
- Redis / PostgreSQL at multi-instance scale
- Full UK life-admin skill seeding completeness
- IoT bridge beyond MQTT stub
- Universal vendor ordering depth (§55.4)
- Finish splitting monolithic `src/index.ts`

## Env knobs
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Required ≥32 chars |
| `WHATSAPP_APP_SECRET` | Meta webhook HMAC |
| `OTP_LEGACY_LOGIN` | Dev-only bare-phone login |
| `OTP_DEBUG` | Expose OTP in non-prod responses |
| `KURUKOO_WORKERS` | `0` disables background workers |
| `AI_QUOTA_*` | AI budgets |
