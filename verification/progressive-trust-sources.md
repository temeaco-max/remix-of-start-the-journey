# Progressive trust external references

- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging — registration-token-based cross-platform push delivery and delivery-state distinctions.
- W3C WebAuthn Level 3: https://www.w3.org/TR/webauthn-3/ — public-key credentials created by an authenticator with user consent.
- MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API — browser geolocation requires user permission.
- GSMA Mobile Connect: https://www.gsma.com/identity/mobile-connect — carrier/mobile identity service; availability and commercial activation are provider- and market-dependent.

## Telegram linked-device implementation sources

- GramJS TelegramClient reference: https://gram.js.org/beta/classes/TelegramClient.html
  - Documents `TelegramClient(new StringSession(...), apiId, apiHash, ...)`.
  - Documents `signInUserWithQrCode({ apiId, apiHash }, { qrCode, password, onError })`.
  - The QR callback receives a token that is embedded in a `tg://login?token=...` URI.
- GramJS authorization guide: https://painor.gitbook.io/gramjs/getting-started/authorization
  - States that API ID and API hash are obtained from https://my.telegram.org/.
  - States that the API hash is secret.
  - Documents `StringSession` persistence and `client.session.save()` after login.

These sources support repository implementation only. Real Telegram pairing remains externally dependent on Telegram API credentials, a real QR scan, any configured Telegram two-step password, and a real inbound/outbound message test.
