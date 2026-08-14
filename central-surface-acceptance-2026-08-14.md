# Central Chat Surface Acceptance — 2026-08-14

- Rebuilt Chat loaded successfully at `http://127.0.0.1:3100/chat/`.
- Sidebar now shows Recent conversations, Connect channel doors, Your presence, Your Kurukoo context, Sponsored placement, Daily Pick, and utility actions.
- Points header action opened a central Points surface showing the live 30-point balance.
- Cart header action opened a central Cart surface containing the server-rendered Cart workspace content without leaving Chat.
- Notification header badge showed 1 unread notification. Clicking it opened the notification inspector with the durable internal notification and Mark read action.
- Overflow menu retained Delete, Pin, Saved & offers, and Reminders actions. The dedicated Pinned references inspector card is removed.
- Pin action was triggered through the live DOM; recent conversation rows are implemented to show a pin icon when conversation-scoped pin storage contains entries.
- Build, TypeScript lint, Chat DOM-safety regression, and git diff check passed before the browser run.
- Live sandbox remained development-auth/test-only; no external channel activation or payment operation was performed.
- Follow-up needed: inspect/retest the pinned row after a full refresh and ensure all server-rendered workspace links inside central surfaces are wired after mapping.
