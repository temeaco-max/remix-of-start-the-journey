# Kurukoo live activation runbook

This runbook activates already-implemented external boundaries without changing canonical OS ownership.

## Mistral-first conversational runtime

Use the canonical provider controls already implemented in the repository:

```env
MISTRAL_API_KEY=...
MISTRAL_MODEL=mistral-small-latest
FF_HOSTED_MISTRAL=true
KURUKOO_AI_HOSTED_PROVIDER=mistral
KURUKOO_SMOLLM2_LOCAL=false
```

`FF_HOSTED_MISTRAL` is the activation gate. `KURUKOO_AI_HOSTED_PROVIDER=mistral` makes Mistral the first hosted conversational candidate. The canonical chat path already attempts an enabled hosted provider before the local SmolLM2 boundary. With `KURUKOO_SMOLLM2_LOCAL=false`, a failed Mistral request cannot silently become a local-model success; Kurukoo falls to its deterministic response boundary instead.

This is the intended **Mistral bypass of local SmolLM2 for conversational traffic**. The Student/local model remains available separately for development/training/runtime experiments and is not deleted or disabled globally by this setting.

Run:

```bash
npx tsx scripts/live-activation-smoke.ts
```

The smoke runner reports provider/model attribution and never prints API credentials.

## Google Drive user-owned artifact storage

Configure the exact registered OAuth callback:

```env
KURUKOO_GOOGLE_DRIVE_CLIENT_ID=...
KURUKOO_GOOGLE_DRIVE_CLIENT_SECRET=...
KURUKOO_GOOGLE_DRIVE_REDIRECT_URI=https://YOUR_DOMAIN/api/artifacts/drive/callback
FF_GOOGLE_DRIVE=true
KURUKOO_STORAGE_ENCRYPTION_KEY=...
KURUKOO_TEST_PHONE=+...
```

The owner starts OAuth from Connect or `/api/artifacts/drive/connect`. Kurukoo validates state and `drive.file`, stores encrypted credentials, and uses Drive as the durable user-owned location. A successful callback redirects to `/connect?drive=connected`.

The controlled proof sequence is:

```text
Connect Drive
→ upload a voice/image/document artifact
→ verify Drive file id
→ open from Kurukoo
→ list artifact history
→ reference-delete in Kurukoo
→ optionally request explicit external Drive deletion
→ revoke Google access
→ confirm subsequent upload fails closed
```

## Telegram linked device

The linked-device connector is a user-client path and is separate from the Telegram Bot API:

```env
TELEGRAM_API_ID=...
TELEGRAM_API_HASH=...
KURUKOO_TELEGRAM_LINKED_DEVICE_ENABLED=true
KURUKOO_TELEGRAM_LINKED_DEVICE_ALLOW=true
KURUKOO_TELEGRAM_LINKED_DEVICE_OWNER_PHONE=+...
```

If Telegram 2-step verification is enabled, supply the deployment secret rather than prompting through server logs:

```env
TELEGRAM_LINKED_DEVICE_2FA_PASSWORD=...
```

Run the smoke command, scan the generated Telegram QR with the owned device, then send an inbound message. The inbound message must enter `canonicalChatTurnService`, not a parallel Telegram chat engine. Verify revocation/log-out and resume behavior.

## WhatsApp linked device

For controlled linked-device testing:

```env
KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED=true
KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW=true
KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE=+...
```

Run the smoke command, scan the QR using the owned WhatsApp account, then send an inbound message to that account. Verify the message is processed by `canonicalChatTurnService`, the reply returns through the linked socket, evidence is recorded, and explicit logout clears the session.

This is the controlled linked-device rail. It must not be presented as equivalent to the official WhatsApp Business Cloud API rail. The official business adapter has its own credentials, webhook verification and feature flag.

## Evidence rule

A configured credential is not live evidence. The readiness lifecycle is:

`implemented → contract-tested → mock-verified → credential-ready → feature-enabled → live-verified → production-active`

Only an actual provider/device callback, receipt or generated artifact may advance the live-verification boundary.
