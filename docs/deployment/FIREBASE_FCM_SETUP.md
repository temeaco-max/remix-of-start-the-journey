# Firebase / FCM delivery setup

Kurukoo's notification path is one canonical queue:

```text
Client device
  -> notification permission
  -> FCM registration token
  -> POST /api/fcm/register
  -> canonical notification queue
  -> FCM HTTP v1
  -> provider acceptance
  -> device notification
```

The product distinguishes provider acceptance from actual device display. The Admin Control Room therefore reports configuration and registered-device counts separately from real delivery evidence.

## Server credentials

Configure the Firebase service account through managed deployment secrets. Supported server variables are:

- `FCM_SERVICE_ACCOUNT_PATH`
- `FCM_SERVICE_ACCOUNT_JSON`
- `KURUKOO_FCM_PROJECT_ID`
- `KURUKOO_FCM_CLIENT_EMAIL`
- `KURUKOO_FCM_PRIVATE_KEY`

Do not commit the service-account JSON or private key.

## Web / PWA client configuration

Firebase Web configuration is client-visible configuration and is safe to return from `GET /api/fcm/config`. Configure:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `KURUKOO_FCM_VAPID_KEY`

`FIREBASE_VAPID_KEY` is accepted as a compatibility fallback for the VAPID public key.

The Web/PWA client loads Firebase JS SDK 12.17.0, registers `/firebase-messaging-sw.js`, requests notification permission only after an explicit user action, obtains the FCM registration token with the configured VAPID key, and registers that token against the authenticated Kurukoo identity. The Firebase Web documentation recommends using a VAPID key for Web Push and a root `firebase-messaging-sw.js` or explicitly supplied service worker registration. citeturn350681search1turn350681search5

## Native clients

Android uses `expo-notifications.getDevicePushTokenAsync()` and only registers a native token when the provider reports `fcm`. iOS is deliberately not treated as FCM when Expo exposes an APNs token; Firebase native iOS messaging must be configured before an APNs token can be represented as an FCM token.

The native registration call uses the existing authenticated `/api/fcm/register` boundary and stores a device-scoped identifier in SecureStore.

## Validation sequence

1. Configure the managed server secrets.
2. Configure the Firebase Web public variables and VAPID public key.
3. Deploy the application.
4. Sign into Kurukoo on a supported browser.
5. Use **Enable notifications** in the application shell.
6. Confirm the Control Room reports Firebase server configuration, Web configuration, and at least one registered device.
7. Trigger a normal Kurukoo notification through an existing canonical notification path.
8. Confirm the queue records provider acceptance and the target device actually displays the notification.
9. If FCM returns an `UNREGISTERED` or equivalent invalid-token response, Kurukoo dead-letters that notification and clears the stale stored device token so it can be re-registered cleanly.

## Important boundaries

Credentials are never returned by `/api/fcm/config`. Device tokens are never returned by `/api/fcm/register`. A successful FCM HTTP response means Firebase accepted the message; it is not proof that the device rendered it. Physical-device delivery therefore remains a runtime validation step.
