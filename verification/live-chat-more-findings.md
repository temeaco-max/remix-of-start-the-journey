# Live Chat More-menu red-team finding

Date: 2026-08-15

The live `/chat/` shell rendered the secondary sidebar utility links (Top up, Subscription, Memory, Safety & check-ins, Settings, Topics, Appearance, Log out) even though `#sidebar-more-items` had `hidden=true` and `#sidebar-more-toggle` had `aria-expanded="false"`. Browser DOM inspection showed `getComputedStyle(#sidebar-more-items).display === "flex"` and a non-zero height of approximately 384px. The root cause was the shared `.sidebar-bottom { display: ... }` rule overriding the native hidden attribute. The repair adds `.sidebar-bottom[hidden]{display:none!important}` to the canonical Chat stylesheet. Rebuild and browser replay remain required before commit.


## Replay result

After rebuilding and restarting the local runtime, the initial state had `aria-expanded="false"`, `hidden=true`, computed `display="none"`, and zero layout height for `#sidebar-more-items`; the secondary links were absent from the rendered viewport. After clicking More, the live DOM changed to `aria-expanded="true"`, `hidden=false`, `display="flex"`, and exposed all eight expected utility labels. No browser console errors were observed during the replay.


## Adjacent workspace replay

Discover replaced the central conversation surface, changed the header context to Discover, and populated a Discover-specific right panel including Suggested next steps and Happening now. Its Ask CTA focused the shared `#message-input` without creating a parallel composer flow. Tasks likewise replaced the central surface, changed the header context to Tasks, kept the shared Ask CTA and composer, and showed a conversation-first identity gate because the protected task workspace requires authentication. The right panel truthfully reported that tasks were unavailable and showed no active reminders; no duplicate page navigation or browser console errors were observed.


## Tasks identity-gate replay

The Tasks surface remains inside the central Chat shell and presents the conversation-first identity form rather than redirecting to a standalone dashboard. The first browser input attempt targeted the visible label instead of the text field, leaving the form unchanged; this is a test interaction targeting issue, not a product failure. The actual input is `#auth-name` and the next replay will target that field directly.
