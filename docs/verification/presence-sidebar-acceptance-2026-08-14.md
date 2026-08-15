# Presence and Sidebar Acceptance — 2026-08-14

The live Chat at `http://127.0.0.1:3100/chat/?polish=presence` rendered the requested hierarchy. Conversation appears as the parent navigation item, with Requests, Tasks, Discover, Connect, and Topics directly nested beneath it. The old standalone Connect block and the old More menu are absent from the left navigation.

The left sidebar now contains Recent conversations, Your presence, Your Kurukoo context, and utility actions. Your presence shows Presence Available, Memory In use, Connected Web, and a Nearby radar control. The radar starts Inactive and, after activation in the browser, changes to Active and persists through the client state.

The right context rail now contains the Sponsored advert module and Daily Pick card above notifications and current context. The header connected state contains a compact pulse marker; after the radar toggle is activated, the pulse receives the active animation class while the connection label remains connected.

Build, TypeScript lint, Chat DOM-safety regression, and whitespace checks passed before the live browser run. The live server remained development-auth/sandbox-only.
