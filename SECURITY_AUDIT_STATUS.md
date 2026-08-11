# Security Audit Status (from ChatGPT share + follow-up)

**Source conversation:** https://chatgpt.com/share/6a7acdf5-f8d0-83eb-ba39-363716ce07f8  
**Repo milestone:** v5.52+ (post-hardening)

## Original priority list vs current state

| # | Finding | Status |
|---|---------|--------|
| 1 | Revoke exposed API keys + GitHub PAT | **Code fixed** — `.env.example` is placeholders only. **You must still revoke any historically committed real keys** in provider consoles. |
| 2 | Remove phone/header auth bypass | **Fixed** in `src/middleware/auth.ts` — JWT required, fail-closed. |
| 3 | Remove hard-coded JWT fallback | **Fixed** — `JWT_SECRET` min 32 chars or throw. |
| 4 | Audit GitHub pull/push endpoints | **Fixed** — admin-only (`authenticateAdmin`). |
| 5 | Admin routes cannot use normal user auth | **Fixed** — `authenticateAdmin` role check. |
| 6 | Request/schema validation | **Partial** — rating/points/IoT/disputes validated; expand with Zod over time. |
| 7 | Rate limiting | **Improved** — auth middleware limits + new `src/middleware/rateLimit.ts` (AI/webhook/payment). |
| 8 | Webhook signature validation | **Improved** — WhatsApp HMAC (`WHATSAPP_APP_SECRET`); Telegram secret token path exists. |
| 9 | Separate routes from `index.ts` | **Partial** — chat/auth/webrtc routers; monolith still large. |
| 10 | Secret scanning in CI | **Fixed** — gitleaks job in `.github/workflows/ci.yml`. |

## New work in this continuation pass

- `src/services/otpAuthService.ts` — OTP issue/verify (JWT only after OTP).
- `src/routes/authRoutes.ts` — `/api/auth/request-otp`, `/verify-otp`, hardened `/login`.
- `src/routes/webrtcRoutes.ts` — authenticated create/signal/leave.
- `src/middleware/rateLimit.ts` — shared limiters.
- WhatsApp `X-Hub-Signature-256` verification.
- `scripts/wire-security-routes.mjs` — mount routers into `index.ts`.

### Apply wiring

```bash
node scripts/wire-security-routes.mjs
npm run lint
```

### Env

```
JWT_SECRET=<32+ chars>
WHATSAPP_APP_SECRET=<Meta app secret>
OTP_LEGACY_LOGIN=false   # never true in production
OTP_DEBUG=true           # local only — exposes OTP in API response
```

## Still recommended (architecture pass)

1. Finish extracting economic/admin routes out of `src/index.ts`.
2. Remove remaining body-phone trust on pulse/orders/tasks where ownership is not enforced.
3. Redis-backed rate limits + presence before multi-instance.
4. PostgreSQL before multi-instance writes.
5. Cross-channel integration tests.

## Operator action (cannot be done in code)

If real keys were ever committed to Git history:

1. Rotate Gemini, Hugging Face, Groq, GitHub PAT immediately.
2. Search git history for those values.
3. Treat as compromise until rotation is confirmed.
