# Live Chat Verification Findings

Date: 2026-08-14/15 UTC

The built production server served `/chat/` with HTTP 200. The rendered shell preserved the `Agent` header, protected composer, unified left navigation, More toggle, points/cart/notification controls, contextual inspector, truthful guest state, and channel readiness labels (`Web Chat: Ready now`, `WhatsApp: Setup required`, `Telegram: Setup required`). The welcome copy is conversational and asks for the user's name.

The browser console returned no JavaScript errors during initial load. The More control was present and interactive in the live page. The guest page correctly did not expose authenticated autonomous-goal controls because `/api/agent/timeline` is auth-gated; authenticated users now receive pause/resume controls from the goal card and the router exposes owner-scoped endpoints.

The first attempt to start production without `JWT_SECRET` failed closed, as required. A second isolated start with an ephemeral 256-bit secret reached initialization but found port 3000 already occupied by the first server process; the existing listener served the verified page successfully.
