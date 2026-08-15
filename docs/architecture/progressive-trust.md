# Kurukoo Progressive Trust and Channel Evidence

## Purpose

Kurukoo keeps the phone number as the primary channel identity because WhatsApp, Telegram, SMS, IVR, USSD, safety contact, and phone-based routing depend on it. Authentication does not need to force every ordinary conversation through SMS, however. The repository now supports a progressive model in which account establishment, device trust, channel evidence, email evidence, social evidence, and phone ownership remain separate facts.

A user may begin as a guest, establish a durable account through the conversational flow, trust a device through authenticated registration or an independent push approval, connect a channel such as WhatsApp, and unlock only the capabilities that the recorded evidence supports. Kurukoo must not collapse these facts into one generic verified flag.

## Evidence states

| Evidence | Meaning | Does not prove |
|---|---|---|
| Guest session | A temporary conversation exists. | User identity or contact ownership. |
| Established account | Kurukoo has a durable profile and conversation identity. | Ownership of the supplied phone or email. |
| Trusted device | A device credential was registered through an authenticated session or independently approved challenge. | Phone-number ownership. |
| WhatsApp linked session | A personal WhatsApp session was paired and received a valid inbound message. | Ownership of every phone number supplied elsewhere. |
| Signed WhatsApp webhook | Meta webhook authentication passed and a sender number was received. | That the number is safe for every telephony action. |
| Telegram webhook | Telegram secret validation passed and a Telegram subject was received. | A phone number, because Telegram may expose only a synthetic user/chat identity. |
| Email webhook | A signed Resend/email webhook was linked to a canonical profile email. | Phone ownership. |
| Verified phone | A phone-provider or equivalent independent verification succeeded. | Trustworthiness of every future browser or channel. |
| Location consent | The user permitted a stated location purpose for a bounded period. | Identity or background location permission. |

## Device and push endpoints

The authenticated user route owns the following endpoints:

```text
POST /api/device/register
GET  /api/device/status
POST /api/device/challenge
POST /api/device/challenge/:id/approve
GET  /api/trust/progressive
```

`POST /api/device/register` accepts a client-generated device identifier, credential type, optional label, and push capability. The raw identifier is not stored in the database; it is HMAC-digested with the application secret. Registration is meaningful only after the request is authenticated.

`POST /api/device/challenge` creates a short-lived challenge for a target device. The target becomes trusted only if an already active trusted device approves the exact challenge. A notification may be queued through the existing FCM/internal notification boundary, but the API distinguishes internal queuing from provider delivery.

`POST /api/device/challenge/:id/approve` requires an already trusted approver device. A new browser cannot safely approve itself and thereby claim independent trust. Challenges expire after five minutes and cannot be reused after approval, denial, or expiry.

The current implementation does not request browser notification permission automatically. Permission and FCM token registration remain explicit client actions. The existing `/api/fcm/register` endpoint can bind a supplied FCM token to the authenticated device when a device identifier is supplied.

## Channel evidence

All canonical channel adapters continue to hand inbound messages to `canonicalChatTurnService`. The shared `BaseChannelHandler` records bounded evidence after the channel parser accepts the message and before canonical Chat runs. The direct Meta WhatsApp adapter and the personal Baileys linked-device adapter record their own verified evidence because they do not inherit the shared base handler. The email adapter records evidence only after webhook authentication succeeds and the sender email is linked to a canonical profile.

Evidence records contain channel, evidence type, bounded external subject, bounded source reference, consent state, and observed time. Raw message bodies and credentials are excluded. Evidence is an observation, not a fabricated provider assertion. Real delivery, account linking, and provider activation remain externally dependent.

## Personalized workspace behavior

The public and guest Chat surface remains conversation-first. Guest users can use public conversation and discovery, but private reminders, saved context, tasks, Points, account settings, and other profile-bound surfaces are hidden in the client and protected by authenticated server routes.

Authenticated users receive their own profile-linked context, private workspace navigation, recent conversations, notifications, channel connections, memory, tasks, and account controls. The central Chat template remains shared; personalization changes the available data and actions rather than creating a second frontend architecture.

## Location consent

Discover requests browser geolocation only when an authenticated user opens the Discover surface and the browser grants permission. The client rounds the coordinates to coarse precision before sending them to:

```text
POST /api/location/consent
```

The request includes a purpose and an expiry. The current Discover purpose is `nearby_discovery` with a 30-minute consent window. No background location claim is made. Guests receive a clear sign-in prompt instead of a location request. Users can alternatively provide an area manually through the conversation.

## Production activation

The following non-secret flags are explicit production gates:

```dotenv
KURUKOO_PROGRESSIVE_TRUST_ENABLED=false
KURUKOO_PUSH_APPROVAL_ENABLED=false
KURUKOO_CHANNEL_EVIDENCE_ENABLED=false
KURUKOO_LOCATION_CONSENT_ENABLED=false
```

Production operators must set them deliberately after reviewing privacy, notification, device-revocation, recovery, and provider requirements. The repository is complete for activation when the flags and provider prerequisites are supplied, but it does not claim that push, WhatsApp, Telegram, SMS, email, or location delivery is live without external evidence.

## Remaining activation requirements

| Capability | Repository state | External requirement |
|---|---|---|
| Trusted browser record | Implemented | Production secret, HTTPS, session review, device-revocation UX. |
| Push approval | Implemented behind flag | Firebase credentials, notification permission, real device token, provider acceptance, and real approval test. |
| WhatsApp | Canonical adapters and linked-device pairing surface exist | Meta credentials or personal linked-device QR pairing, real account test, and delivery evidence. |
| Telegram | Canonical webhook adapter exists | Bot token, webhook secret, HTTPS callback, and real message test. |
| SMS | Canonical inbound/outbound boundary exists | Africa’s Talking or another approved provider, sender configuration, callback validation, and delivery test. |
| Email | Resend boundary and email channel exist | Verified sending domain, Resend key, webhook configuration, inbox delivery test, and privacy decision. |
| Location | Consent and coarse persistence exist | Browser permission, privacy notice, retention policy, and product-specific purpose review. |

The acceptance standard is **repository-side complete → ready for external activation**. The system must not describe a queued notification as delivered, a linked adapter as connected, or observed channel evidence as universal identity verification.
