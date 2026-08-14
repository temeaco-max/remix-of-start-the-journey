# Kurukoo Controlled Pilot Deployment Profile

This document defines the repository-supported deployment profile for the controlled pilot. It is an operational profile, not a claim that external providers are active. The application reports `READY`, `NOT_CONFIGURED`, `DISABLED`, `EXTERNAL_DEPENDENCY`, or `PENDING` from the existing readiness authority.

## Release candidate

The controlled-pilot release candidate is the `develop` branch. Deploy the compiled application, not the TypeScript development server:

```sh
npm ci
npm run build
NODE_ENV=production npm start
```

Record the deployed Git commit, database backup identifier, deployment timestamp, and provider activation state before exposing traffic. Roll back by redeploying the previous known-good commit and restoring the corresponding database backup if a schema or data migration requires it.

## Required production environment

Create the deployment environment outside the repository. Never commit values for any of the variables below.

| Variable | Controlled-pilot requirement |
|---|---|
| `NODE_ENV` | `production`. |
| `JWT_SECRET` | Random secret of at least 32 characters. |
| `MEMORY_ENCRYPTION_KEY` | Deployment-managed encryption key when memory encryption is enabled by the deployment. |
| `QR_CONTEXT_SECRET` | Deployment-managed secret for signed QR context. |
| `DB_PATH` | Writable persistent SQLite/SQL.js database path, with backups and appropriate file permissions. |
| `KURUKOO_DEV_AUTH` | `false` or unset. Production rejects development OTP regardless of this value. |
| `KURUKOO_PAY_PROVIDER` | Omit for fail-closed payment, or set only to a configured supported provider. Never use `sandbox` in production. |
| `KURUKOO_WORKERS` | Keep enabled only when the deployment runs the required bounded background workers. |
| `KURUKOO_AGENT_ENABLED` | `false` by default; set `true` only after bounded agent policy, limits, and operator ownership are confirmed. |
| `KURUKOO_AGENT_AUTONOMOUS_LOW_RISK` | `false` by default; never use it to bypass confirmation, payment, verification, or provider evidence. |
| `KURUKOO_AGENT_MAX_ACTIONS_PER_CYCLE` | Explicit low integer limit. |
| `KURUKOO_AGENT_MAX_CONCURRENT_GOALS` | Explicit low integer limit. |
| `KURUKOO_VOICE_ENABLED` | `false` unless the configured realtime provider and quota are active. |
| `KURUKOO_VOICE_PROVIDER` / `KURUKOO_VOICE_MODEL` | Set only for the selected supported voice provider and model. |
| `FF_USSD` / `FF_CONTRIBUTOR_SYSTEM` / `FF_AFFILIATE_LINKS` | Enable only for the corresponding configured product boundaries. |
| `FF_POINTS_ENABLED` | Enable only if the operator intends to run the Points authority. |
| `FF_NIMC_KYC` | A feature flag does not activate KYC; provider credentials and evidence remain required. |
| `FF_EMAIL_REQUIRED` | Enable only when the email channel is configured and tested. |
| `ADVERTISING_ENABLED` | Enable only when campaigns, disclosure, targeting, and operator controls are configured. |

## First real external channel: WhatsApp

The existing provider-neutral WhatsApp adapter is the only activation path. Supply the following values through deployment secrets:

```text
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_WEBHOOK_URL=https://<pilot-host>/api/webhook/whatsapp
```

The exact callback URL must match `POST /api/webhook/whatsapp`. Meta-style verification uses `GET /api/webhook/whatsapp` with `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`; the route returns the challenge only when the deployment token matches. Verify the provider signature on POST and the challenge before sending any user traffic. Start with one controlled WhatsApp identity. Do not send marketing blasts, bulk messages, or re-engagement messages outside the provider’s permitted conversation window and approved template rules.

When credentials are absent, the correct state is `NOT_CONFIGURED` or `EXTERNAL_DEPENDENCY`; no test or fixture may be used to represent live delivery. The repository already covers identity normalization, canonical Chat routing, shared conversation state, channel usage, signature checks, and provider-failure behavior.

## Production safety gates

`KURUKOO_DEV_AUTH` is disabled in production. The deterministic development code `111111` is rejected in production, test-only reset paths remain protected by the existing admin/auth boundaries, and production payment execution remains fail-closed when provider configuration is absent. Use HTTPS, secure cookies, webhook signature verification, rate limits, owner checks, attachment protection, and security headers at the deployment edge.

## Pilot observability and cost measurement

Use the existing aggregate observability and channel-usage authorities. Track signups, active users, Chat sessions, outcomes, requests, deferred requests, opportunities, notifications, channel usage, provider interactions, product interactions, Topics, agent goals, AI usage, and errors without placing raw private message content in standard dashboards. Record actual provider references and costs when the provider supplies them; do not estimate or fabricate delivery or cost evidence.

## Deployment acceptance

After `npm run build` and `npm start`, verify `/`, `/chat`, `/discover`, `/topics`, `/resources`, `/workspace`, `/channels`, `/pricing`, `/admin`, `/robots.txt`, `/sitemap-topics.xml`, and `/health`. Check the compiled assets, database bootstrap, production authentication rejection, no accidental development UI, and no route-level 500 responses. Then test one controlled Web Chat user before activating one controlled WhatsApp identity.
