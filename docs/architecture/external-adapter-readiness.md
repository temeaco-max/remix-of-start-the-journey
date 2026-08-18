# Kurukoo External Adapter Readiness

This document records the canonical adapter boundary for each external dependency. A configured secret is never treated as proof that an external service is live; the existing readiness/verification services remain authoritative.

| Domain | Existing Kurukoo boundary | Required deployment inputs | Repository-side state |
|---|---|---|---|
| Payments | payment routes + economic payment adapter + webhook/idempotency tests | provider secret, signed webhook, production account/contract | Adapter boundary and sandbox tests present; live settlement requires provider activation |
| FCM | `firebaseCloudMessaging` + notification queue | Firebase project identity/service credentials | Internal notification persistence is present; external delivery requires configured provider and device evidence |
| Email | email channel + signed webhook boundary | Resend/API credentials, sender, webhook secret | Outbound/inbound boundaries exist and are readiness-gated |
| WhatsApp | canonical channel/webhook boundary | Cloud API credentials, phone number ID, verify token, app secret | Repository-ready; provider console activation and delivery evidence required |
| Telegram | bot channel/webhook boundary | bot token, webhook secret | Repository-ready; provider activation required |
| SMS/USSD | channel registry + carrier adapter boundary | carrier/API credentials, callbacks | Repository-ready boundary; external carrier activation required |
| Voice | Gemini Live / voice service | Gemini credentials, model/quotas | Browser Web Voice boundary exists; provider/account activation remains external |
| WebRTC | authenticated signalling boundary | production relay/ICE infrastructure | Signalling is implemented; production relay infrastructure remains deployment work |
| MQTT / IoT | existing MQTT bridge | broker URL/credentials, TLS policy | Adapter exists; production broker remains external |
| Verification/KYC | provider verification and KYC readiness services | verification/KYC credentials and contracts | Boundary exists; no provider is claimed verified until evidence exists |
| AI external clients | generic MCP app/OAuth boundary | public HTTPS issuer, OAuth client configuration | Generic MCP channel implemented; each AI client's own app/connector publication remains external |
| AI teacher providers | existing teacher pool | provider API keys/quotas | Gemini/Mistral/Groq/OpenRouter/Hugging Face/OpenAI pool exists with free-first preference |
| Object storage/malware | existing private attachment boundary | object store credentials + malware scanning provider | Owner binding/retention/expiry rules exist; external storage/scanning remains deployment-dependent |
| Affiliate | existing affiliate readiness boundary | affiliate provider credentials/contract | Routing/tracking boundary exists; external activation required |
| Private-number masking | existing privacy/number-routing boundary | provider credentials + regulated contract | Boundary exists; provider activation required |

## Activation rule

Adapters should be enabled only after the corresponding external contract, signed callback/webhook, credentials, test account/device, and evidence path are verified.

The application must not promote any of these states merely because an environment variable is present:

- payment received
- provider verified
- KYC passed
- message delivered
- FCM push received
- appointment booked
- inventory available
- dispatch completed
- external agent action completed.

The canonical Economic Request, execution, evidence, notification and continuation services remain authoritative.

## Operational verification

Before enabling an adapter in production:

1. Run `npm run pilot:readiness` and `node scripts/production-preflight.mjs`.
2. Run its domain contract test from `package.json`.
3. Perform one controlled real-provider smoke test with a disposable/test account where the provider permits it.
4. Verify the corresponding inbound webhook/callback reaches the canonical boundary.
5. Confirm idempotency and retry behavior.
6. Confirm the user-visible result distinguishes provider evidence from Kurukoo preparation.
