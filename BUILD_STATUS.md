# Kurukoo v5.52.2 — Build Status

**Status:** Security audit continuation + billing route extraction (ChatGPT share plan)
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.52.2**
**Date:** 2026-08-11

## Verification
- Entry point: `index.ts` → `src/index.ts` + background workers.
- Identity remains single `memory_profiles` (Tight Integration Mandate).
- Run `npm run wire:security` (also on `prebuild`) to mount routers and neutralize legacy handlers.

## v5.52.2 — ChatGPT conversation continuation

Source: https://chatgpt.com/share/6a7acdf5-f8d0-83eb-ba39-363716ce07f8

### Shipped in this pass
- `src/services/subscriptionService.ts` — tier changes only after validated plan + confirmed payment
- `src/routes/pricingRoutes.ts` — public + admin pricing (existing `pricingService`)
- `src/routes/subscriptionRoutes.ts` — JWT-only upgrade / provider subscribe (no body.phone trust)
- `src/routes/paymentRoutes.ts` — points/credits top-up with auth + `payment_ref` outside sandbox
- Wire script neutralizes:
  - unauthenticated `POST /api/subscription/upgrade` (client-trusted phone/plan)
  - unauthenticated `POST /api/provider/subscribe`
  - client-settable `subscription_tier` on `/api/profile/update`
- Prior v5.52.1: OTP auth, rate limits, WebRTC auth, WhatsApp HMAC

### Correct flow (audit mandate)
```
✗ POST { phone, plan }          // removed
✓ authenticated session
  → memory profile (JWT phone)
  → validated entitlement (pricing plan)
  → confirmed payment (PSP ref or fail-closed wallet)
  → subscription state
```

## Still open vs Blueprint v5.62
- PSP-backed bill payments & regulated cross-border rails (OPay/Moniepoint adapters)
- Embedding-based MMR (keyword only at launch)
- Redis / PostgreSQL at multi-instance scale
- Full UK life-admin skill seeding completeness
- IoT bridge beyond MQTT stub
- Universal vendor ordering depth (§55.4)
- Finish splitting remaining admin/economic routes out of `src/index.ts`

## Env knobs
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Required ≥32 chars |
| `WHATSAPP_APP_SECRET` | Meta webhook HMAC |
| `OTP_LEGACY_LOGIN` | Dev-only bare-phone login |
| `OTP_DEBUG` | Expose OTP in non-prod responses |
| `KURUKOO_PAY_PROVIDER` | `sandbox` (fail-closed) or future PSP |
| `FORCE_SANDBOX_SUBSCRIPTION` | Local QA only — grants tiers without PSP |
| `KURUKOO_WORKERS` | `0` disables background workers |
| `AI_QUOTA_*` | AI budgets |
