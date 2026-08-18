# Progressive identity (Kurukoo OS)

Branch: `feature/progressive-identity`

Additive authentication layer. Phone OTP (`otpAuthService`, `/request-otp`, `/verify-otp`) is **unchanged**.

## Model (phone-rooted)

```text
Presence (guest chat — no account required)
    → Account credential (email magic link; optional provisional em_*)
    → Channel proof (verified phone / linked WA|TG / channel evidence)
    → Kurukoo progressive trust (devices, push approval, evidence)
```

Email is an **attached credential**, not a replacement for phone as primary channel identity.

## Authoritative gates

`assertIdentityAllows(phone, capability)` gates economic request creation. Provisional `em_*` and guest `anon_*` cannot obtain economic_request, payment, escrow, provider_action, pulse_broadcast, sensitive_memory, external_channel_ownership, high_risk_autonomous, or agent_goal.

## Magic link security

Single-use token, HMAC hashed at rest, 10 minute TTL, attempt limit, purpose + email binding, `returnPath` allowlist, explicit `consumed_at` before session issue. Debug URLs only outside production with `KURUKOO_AUTH_CHALLENGE_DEBUG=true`.

## Push approval

Re-auth for an existing non-provisional phone with a registered device — not new-human identity creation.

## Routes

| Method | Path |
|--------|------|
| GET | `/api/auth/identity` |
| GET | `/api/auth/identity/me` |
| POST | `/api/auth/request-magic-link` |
| POST | `/api/auth/complete-challenge` |
| POST | `/api/auth/request-push-approval` |
| * | OTP routes unchanged |

## Config

```env
KURUKOO_MAGIC_LINK_AUTH=true
KURUKOO_PUBLIC_BASE_URL=https://your.domain
KURUKOO_AUTH_CHALLENGE_DEBUG=false
RESEND_API_KEY=
EMAIL_FROM=
```
