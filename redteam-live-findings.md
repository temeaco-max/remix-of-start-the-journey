
## Follow-up after proactive feed fix

After reloading the Chat shell, the right-rail Suggested next steps list correctly showed one Daily Engagement Bonus, one Lagos Rice Supply Alert, and one Back a local business card. The notification stack still showed three historical Daily Engagement Bonus entries, confirming that notification persistence lacks generic duplicate suppression even after proactive feed deduplication. The next hardening fix should deduplicate identical queued notifications by owner, title, body, and link within a bounded time window and make unread counts reflect unique notices.

## Notification hardening verification

The right rail now contains one Daily Engagement Bonus plus distinct campaign suggestions. The currently running browser still displayed historical duplicate toast entries from the pre-fix session, so the backend dedupe change must be validated with a fresh database/session or by querying the owner-scoped inbox after restart. The protected Chat layout remained unchanged.

## API-level duplicate finding

The stale local server returned eleven owner-scoped `Daily Engagement Bonus` notification rows plus one account-confirmation row. This confirmed historical duplicate persistence, not merely visual toast duplication. The local server was restarted afterward so the new grouped inbox query and bounded send dedupe can be verified against the current implementation.

## Fresh-server verification

After launching a new local process, the browser still received twelve notification rows, including eleven identical Daily Engagement Bonus entries. This indicates port 3000 is being served by another existing listener or the new process did not bind the active port. The code-level notification dedupe tests pass, but final browser verification must first identify the active listener and restart the correct process.

## Clean source-server browser verification

After stopping the stale listener and starting the source-based server, the Chat shell loaded in a clean guest state. The protected header, composer, central welcome surface, left navigation, right inspector, channel setup, proactive cards, and responsive layout remained intact. The notification badge was `0`, and unauthenticated `/api/notifications` correctly returned `401`. The source server exposed one Daily Engagement Bonus and distinct campaign suggestions in the right rail, with no duplicate notification stack.
