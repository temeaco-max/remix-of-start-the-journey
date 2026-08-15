# Live Chat More-menu red-team finding

Date: 2026-08-15

The live `/chat/` shell rendered the secondary sidebar utility links (Top up, Subscription, Memory, Safety & check-ins, Settings, Topics, Appearance, Log out) even though `#sidebar-more-items` had `hidden=true` and `#sidebar-more-toggle` had `aria-expanded="false"`. Browser DOM inspection showed `getComputedStyle(#sidebar-more-items).display === "flex"` and a non-zero height of approximately 384px. The root cause was the shared `.sidebar-bottom { display: ... }` rule overriding the native hidden attribute. The repair adds `.sidebar-bottom[hidden]{display:none!important}` to the canonical Chat stylesheet. Rebuild and browser replay remain required before commit.


## Replay result

After rebuilding and restarting the local runtime, the initial state had `aria-expanded="false"`, `hidden=true`, computed `display="none"`, and zero layout height for `#sidebar-more-items`; the secondary links were absent from the rendered viewport. After clicking More, the live DOM changed to `aria-expanded="true"`, `hidden=false`, `display="flex"`, and exposed all eight expected utility labels. No browser console errors were observed during the replay.
