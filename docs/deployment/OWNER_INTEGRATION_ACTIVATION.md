# Owner Integration Activation

This runbook activates the existing Kurukoo adapters; it does not create parallel integration paths.

## 1. Mistral as the conversational provider

Set in the local/deployment environment:

```env
MISTRAL_API_KEY=<real key>
MISTRAL_MODEL=mistral-small-latest
FF_HOSTED_MISTRAL=true
KURUKOO_AI_PRIMARY_PROVIDER=mistral
KURUKOO_AI_BYPASS_SMOLLM2=true
```

Both bypass switches mean the same product intent: prefer Mistral over the local SmolLM2 path for conversational generation. The existing feature flag remains authoritative, so a configured key alone cannot enable the provider. If Mistral is unavailable, Kurukoo follows the configured hosted-provider fallback chain and then the deterministic boundary; it does not silently pretend SmolLM2 succeeded.

Verify without exposing the key:

```bash
npx tsx scripts/verify-owner-activations.ts
```

Expected provider selection is `mistral` when the feature flag and credential are valid.

## 2. Google Drive — user-owned artifact storage

Configure the Google Cloud OAuth web application with the exact Kurukoo callback URI and `drive.file` scope, then set:

```env
KURUKOO_GOOGLE_DRIVE_CLIENT_ID=<client id>
KURUKOO_GOOGLE_DRIVE_CLIENT_SECRET=<client secret>
KURUKOO_GOOGLE_DRIVE_REDIRECT_URI=<exact registered callback>
KURUKOO_STORAGE_ENCRYPTION_KEY=<32+ character secret>
FF_GOOGLE_DRIVE=true
```

Then authenticate through Connect. The owner completes consent in the browser; Kurukoo stores encrypted provider refresh/access tokens, uploads artifacts into the owner's Drive, verifies the returned Drive file ID, and keeps only owner-scoped artifact metadata in Kurukoo.

The activation proof should include:

1. OAuth authorization and callback.
2. A real voice/image/document upload.
3. Returned Drive file ID and authorized open.
4. Reference-only deletion.
5. Explicit external deletion, when selected by the user.
6. Reauthorization/revocation and retry.

If Drive is unavailable, the existing managed fallback remains truthful and owner-scoped; it is not presented as Google Drive persistence.

## 3. Telegram linked device

Telegram linked-device QR login requires Telegram API credentials, not merely a bot token:

```env
KURUKOO_TELEGRAM_LINKED_DEVICE_ENABLED=true
KURUKOO_TELEGRAM_LINKED_DEVICE_ALLOW=true
KURUKOO_TELEGRAM_LINKED_DEVICE_OWNER_PHONE=<owner phone>
TELEGRAM_API_ID=<api id>
TELEGRAM_API_HASH=<api hash>
KURUKOO_TELEGRAM_LINKED_DEVICE_AUTH_DIR=.data/telegram-linked-device
```

Start the linked-device flow from Connect/operator tooling, scan the generated QR with the owner's Telegram application, then verify:

- connected state;
- persisted session;
- inbound Telegram message reaches canonical Chat;
- reply returns to Telegram;
- channel evidence is recorded;
- logout/revocation removes the local session;
- a second device cannot impersonate the owner.

Two-step verification must be supplied only through the deployment secret when required; it is never hardcoded or logged.

## 4. WhatsApp linked device

The linked-device path is separate from the official WhatsApp Business Platform adapter. For the controlled owner test:

```env
KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED=true
KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW=true
KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE=<owner phone>
KURUKOO_WHATSAPP_LINKED_DEVICE_AUTOSTART=false
KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW_GROUPS=false
```

Use the QR presented by Connect/operator tooling and scan it with the owner's WhatsApp application. Verify:

- pairing state becomes connected;
- inbound personal message enters canonical Chat;
- response is delivered back through the linked session;
- channel evidence is associated with the owner;
- device revocation/logout works;
- restart does not silently attach to a different owner.

This is a controlled linked-device/pilot connector. It is not the production WhatsApp Business Platform and must not be represented as such. The official Business API path is maintained separately.

## 5. Unified activation check

Run:

```bash
npx tsx scripts/verify-owner-activations.ts
```

The command reports:

- Mistral provider preference and readiness;
- Google Drive deployment/owner readiness;
- Telegram linked-device readiness;
- WhatsApp linked-device readiness.

It never prints secrets. It exits non-zero when an explicitly requested activation is incomplete.

## External evidence boundary

A configured credential is not a live-verified integration. Live verification requires the real provider/device response, callback, receipt or artifact. The readiness matrix must only move from configured/mock state to live-verified after that evidence exists.
