# Kurukoo v5.41 — Everyday Utility Platform

**Tagline:** Wake up. Get going.
**Shortcode:** `*7000#` · **Voice/WhatsApp:** `7000`
**Previous working names:** Xentrix → **Kurukoo** (final)

Kurukoo is a **conversational fulfilment network and personal assistance platform for everyday life and work**. Users tell Kurukoo what they need, and the platform provides bounded native assistance, coordinates canonical requests, or hands off through an authorised and independently verified channel when one is configured. Web Chat is the active first-party channel; WhatsApp, USSD, Telegram, SMS, FCM, Voice, payment, private-number routing, and other external capabilities remain repository-complete but deployment/provider-dependent until independently proven.

> Kurukoo is not defined as a marketplace or chatbot. It is a conversation-first coordination system whose product definition remains stable even when a channel or external provider is unavailable.

## Architecture

| Area | Current implementation |
|---|---|
| Composition root | `src/index.ts` performs startup and mounts canonical route boundaries. It must not regain a legacy catch-all route module. |
| HTTP boundaries | `src/routes/*` owns HTTP routes. `/health` belongs to `healthRoutes`; `/`, `/explore`, and `/p/:providerSlug` belong to `publicRoutes`; referral routes remain in `userRoutes`. |
| Services and skills | `src/services/*` owns business orchestration. `skillFlows.ts` is the canonical Economic Request skill, requirement, capability, and lifecycle catalogue. |
| Economy | A single economic lifecycle handles rides, food, repair, work, product sourcing, tickets, and artist/creator requests. Artist booking is not a privileged transaction architecture. |
| Identity | One `memory_profiles` and `skills` model; no legacy `users`, `riders`, or `providers` silos. |
| Authorization | User-owned Economic Request endpoints apply explicit `authenticateUser` middleware. Orchestration and memory-maintenance routes require explicit `authenticateAdmin` middleware. |
| Database | `sql.js` runs in-process and persists to `kurukoo.sqlite` (override with `DB_PATH`). Writes use a same-directory temporary file and atomic replacement, but the model remains single-process. |
| Rate limiting | In-memory process-local limits are appropriate only for the single-instance launch model. |
| Channels | Web Chat is active; WhatsApp, Telegram, SMS, USSD, Email, FCM, and Voice remain adapter boundaries whose readiness depends on truthful configuration. |
| Front end | EJS public pages (`views/`) and vanilla JavaScript PWA (`public/`). Dynamic provider, opportunity, promotion, and chat text is rendered with DOM nodes and `textContent`. |

## Quick Start

Kurukoo uses **npm 10.9.2** and commits `package-lock.json` for reproducible installs. Use Node.js 22.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run dev                 # tsx index.ts → http://localhost:3000
npm run lint                # TypeScript type-check
npm run build               # type-check + public asset copy + CSS optimization
npm run test:routes         # canonical route and ownership contracts
npm run audit:complete       # repository CSS/architecture duplicate audit
npm run audit:css:all       # shared CSS/token and server-template audit
npm run audit:security      # static safety invariants + HTTP authorization behavior
npm run pilot:readiness      # read-only readiness report; never prints secrets
npm run test:pilot-readiness # missing-credential and production/dev-auth regression
npm run test:pilot-production-guards # production rejects development OTP/test auth
npm run test:whatsapp-webhook-boundary # provider-independent WhatsApp challenge boundary
npm run test:fresh-database # fresh deployment schema and route bootstrap
```

When intentionally changing dependencies, use `npm install`, commit both `package.json` and `package-lock.json`, and run the validation suite before opening a pull request.

## Controlled development/test Chat

The verified canonical release branch is `main`, which is also the GitHub default branch. Historical development branches were removed after convergence. Kurukoo includes an explicit development/test authentication mode for exercising the real canonical Chat without a live OTP delivery provider. Enable it only outside production by setting `KURUKOO_DEV_AUTH=true`, `KURUKOO_TEST_PHONE` to the designated test identity, and optionally `KURUKOO_TEST_NAME`. The deterministic code `111111` is accepted only for that configured phone while `NODE_ENV` is not `production`; it is not stored as an OTP record, is never accepted in production, and does not bypass provider verification, payment, escrow, Economic Request ownership, or other execution boundaries.

The normal browser login page identifies when this mode is active. An authenticated admin can use **Open Test Chat** in the admin console, which issues the normal HttpOnly Kurukoo user session for the configured test identity and redirects to `/chat`. The Chat then uses the same conversation, Memory Profile, Living Memory, routing, skill, native-assistance, Economic Request, deferred-request, agent, notification, and response-persistence services as every other user. **Reset Test Chat** clears test conversation, reminder, behavioral, OTP, and agent state while preserving economic requests, orders, escrow, payments, and disputes.

## Production transition points

The current launch architecture is intentionally cost-effective but has clear boundaries. Do not run multiple application replicas against the `sql.js` file or assume process-local rate limits coordinate across replicas. Move to PostgreSQL and Redis when high availability, concurrent multi-instance writes, distributed rate limiting/presence, or sustained marketplace-scale traffic is required.

Payment, regulated escrow, real provider/identity verification, malware-scanned object storage, external FCM delivery, and provider-console credential rotation remain external operational requirements. Repository-side chat attachments are owner-bound, stored outside public static paths, expiry-cleaned, deletable, size/type validated, and inaccessible across users; binary malware scanning and object-storage activation remain deployment requirements. The application must not claim that a database record, indicative rate, sandbox payment, or profile is proof of an external financial, verification, or availability event.

## Security notes

Current CI includes build, test, custom audit, FastText, and secret-scan jobs. The current `.env.example` contains placeholders only. A historical environment-template exposure requires the repository owner to rotate affected provider credentials and review provider/GitHub audit logs; removing values from a later commit does not revoke them. See `SECURITY_AUDIT_STATUS.md` for the current status and residual risks.

## Key Docs

- `BLUEPRINT.md` — master specification and current product/architecture source of truth (v5.65).
- `BUILD_STATUS.md` — canonical route ownership and release verification status.
- `SECURITY_AUDIT_STATUS.md` — security posture, manual operator actions, and scale transition criteria.
- `ECOSYSTEM.md` — authoritative economic taxonomy.
- `CONTROLLED_PILOT.md` — exact production environment, release, rollback, and first WhatsApp activation profile.
- `CACHING.md`, `DATA_RETENTION_POLICY.md`, `POINTS_COMPLIANCE.md`, and `WHATSAPP_CONTINGENCY.md` — operating policies.

## Stack

`express` · `ejs` · `sql.js` · `mqtt` (Universal Remote/IoT) · `dotenv` · `tsx` · `typescript` (strict)
