# WhatsApp Linked-Device Connector

Kurukoo now contains an **optional local WhatsApp Web multi-device connector**. This is separate from the Meta WhatsApp Cloud API adapter.

The linked-device connector is intended for a user who wants to pair an existing WhatsApp account by scanning a QR code from **WhatsApp → Linked devices → Link a device**. It is not a WhatsApp Business API number, does not use the Meta webhook, and must not be described as the same integration.

> The connector is disabled by default and requires two explicit activation flags plus an owner phone binding. No personal WhatsApp session starts during ordinary Kurukoo server startup unless autostart is explicitly enabled.

## Local activation

Add the following values to the local `.env` file:

```dotenv
KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED=true
KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW=true
KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE=+2348012345678
KURUKOO_WHATSAPP_LINKED_DEVICE_AUTH_DIR=.data/whatsapp-linked-device
KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW_GROUPS=false
KURUKOO_WHATSAPP_LINKED_DEVICE_AUTOSTART=false
```

The owner phone must be the authenticated Kurukoo identity that is authorized to pair and control the session. The auth directory contains the WhatsApp multi-device credentials and is ignored by Git. It must be stored on persistent, access-controlled local or server storage.

For a local manual pairing session, run:

```bash
npm run whatsapp:linked-device
```

The command starts the connector, prints the QR code in the terminal, and keeps the process alive. On the owner phone, open WhatsApp, select **Linked devices**, select **Link a device**, and scan the displayed QR code. The command must remain running after pairing because the linked-device session is stateful.

## HTTP pairing boundary

The authenticated owner can use these routes:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/whatsapp-linked-device/status` | Read owner-scoped connection state |
| `POST` | `/api/whatsapp-linked-device/start` | Start an explicitly enabled pairing/session process |
| `GET` | `/api/whatsapp-linked-device/pairing-qr` | Read the current QR data URL while pairing |
| `POST` | `/api/whatsapp-linked-device/stop` | Stop the local session without deleting credentials |
| `POST` | `/api/whatsapp-linked-device/logout` | Log out and invalidate the linked session |

All routes require an authenticated Kurukoo user session. The configured owner phone is checked server-side; the client cannot select another phone identity. No QR is exposed before an explicit start request.

## Conversation routing

After pairing, inbound direct messages are passed into the existing canonical Chat service:

```text
linked WhatsApp message
→ owner/session channel adapter
→ canonical Chat turn
→ existing FastText and AI routing
→ canonical Kurukoo action or response
→ linked WhatsApp reply
```

Group messages are ignored by default. Enabling group processing requires the separate explicit flag `KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW_GROUPS=true` and should only be done after a consent, privacy, identity, and mention-routing decision.

The connector does not create a second Chat engine, memory engine, intent router, payment owner, or request owner. It is an adapter around the canonical Kurukoo flow.

## Operational boundary

This connector requires a persistent process and persistent auth storage. A temporary shell or sleeping development sandbox is not a reliable production host for an always-on personal WhatsApp session. For local testing, the user’s computer must remain online while the connector is expected to receive messages. For deployment, use a persistent single-process worker or an approved persistent hosting boundary.

The connector is not considered connected merely because the package is installed or the feature flags are set. Readiness is reported as pending until a session is actually paired and open. External message delivery is not claimed until the linked-device session reports a live connection and the send operation succeeds.

WhatsApp account ownership, user consent, provider terms, rate limits, session revocation, device security, and account restrictions remain external activation concerns. The auth directory must be treated as sensitive credential material and must never be committed, copied into public assets, or included in logs.

## Browser pairing page

When the local Kurukoo server is running and the authenticated owner visits `/whatsapp-linked-device`, the page presents the same practical scan sequence as WhatsApp Web: start pairing, display the current QR code, poll the connection state, and replace the QR state with a connected state after the session opens. The page is owner-authenticated and does not display a QR before explicit startup.

For an iPhone test, open the page in the local browser on a computer, select **Start pairing**, and scan the displayed QR from the iPhone’s WhatsApp Linked Devices screen. The browser page does not need to be on the iPhone; the iPhone camera scans the QR rendered by Kurukoo on the computer. The local connector process must remain running after the scan.

The QR is generated from the live multi-device session handshake, not from a static Kurukoo URL or a simulated code. A repository test can verify QR generation and pairing state transitions, but only a real phone scan can prove that a particular WhatsApp account was linked.
