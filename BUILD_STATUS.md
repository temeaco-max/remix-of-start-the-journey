# Kurukoo v5.52.3 — Build Status

**Status:** ChatGPT security-audit route extraction continued (user / channel / system + full mount wire)
**Blueprint:** v5.62 target (`BLUEPRINT.md`); codebase milestone **v5.52.3**
**Date:** 2026-08-11
**Source conversation:** https://chatgpt.com/share/6a7acdf5-f8d0-83eb-ba39-363716ce07f8

## Approach (from shared audit agent)

```
Existing behaviour
      ↓
Extract exact handler (no invented services)
      ↓
Preserve dependencies
      ↓
Contract test where present
      ↓
Mount new router
      ↓
Neutralize / rename legacy handler
      ↓
CI / prebuild wire script
      ↓
Later: delete dead legacy bodies
```

Discovery remains a **projection of nearbyPulse presence** — not a second provider registry.

## Extracted route modules (`src/routes/`)

| Module | Boundary |
|--------|----------|
| `publicRoutes.ts` | Public EJS pages |
| `discoveryRoutes.ts` | `/api/discover/map` (fuzzed coords, Pulse-backed) |
| `presenceRoutes.ts` | Pulse activate/deactivate/status/providers |
| `contentRoutes.ts` | Blog API |
| `chatRouter.ts` | Canonical chat |
| `economicRequestRouter.ts` | Storefront + economic requests + memory lifecycle |
| `authRoutes.ts` | OTP-first phone auth |
| `webrtcRoutes.ts` | JWT-gated signalling |
| `pricingRoutes.ts` | Public + admin pricing |
| `subscriptionRoutes.ts` | JWT + payment_ref tier changes |
| `paymentRoutes.ts` | Points/credits top-up |
| `userRoutes.ts` | Profile, privacy export/delete, referrals, ratings |
| `channelRoutes.ts` | WhatsApp / Telegram / SMS / USSD webhooks |
| `systemRoutes.ts` | `/health`, API docs |

## Wire script

`npm run wire:security` (also `prebuild`) mounts all of the above and renames remaining monolith duplicates to `*-legacy` paths so authenticated routers win.

## Correct subscription flow (audit mandate)

```
✗ POST { phone, plan }          // neutralized
✓ authenticated session
  → memory profile (JWT phone)
  → validated entitlement (pricing plan)
  → confirmed payment (PSP ref or sandbox)
  → subscription state
```

## Still open vs Blueprint v5.62 / audit plan

1. **Admin routes extraction** — large `/api/admin/*` surface still in `index.ts`
2. **Delete dead legacy handler bodies** after CI green (currently path-renamed only)
3. Reduce `index.ts` to pure composition / startup
4. PSP bill payments + cross-border rails
5. Redis / PostgreSQL multi-instance
6. UK life-admin skill seeding completeness
7. IoT beyond MQTT stub; embedding MMR optional

## Env knobs

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Required ≥32 chars |
| `WHATSAPP_APP_SECRET` | Meta webhook HMAC |
| `OTP_LEGACY_LOGIN` | Dev-only bare-phone login |
| `KURUKOO_PAY_PROVIDER` | `sandbox` or future PSP |
| `FORCE_SANDBOX_SUBSCRIPTION` | Local QA only |
| `KURUKOO_WORKERS` | `0` disables background workers |
| `AI_QUOTA_*` | AI budgets |
