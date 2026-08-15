# Kurukoo v5.41 — Changes & Implementation Report

Summary of additions, corrections, and enhancements implemented against the Kurukoo Blueprint v5.41.

## 1. First-Class AI Agents (§21a)
- `ai_agents` SQLite table + `src/services/aiAgentService.ts` (seed, CRUD, clone, execute, find-by-skill, delegate).
- `/api/admin/ai-agents` REST endpoints + `public/admin/ai-agents.html` visual command center.
- Agents mirrored into `memory_profiles` + `skills` and wired to Points, Ratings, Trust Score, Proactive Engine.

## 2. Points Economy (§7)
- Renamed `creditEngine.ts` → `pointsEngine.ts`; `CREDIT_COMPLIANCE.md` → `POINTS_COMPLIANCE.md`.
- Added `memory_profiles.points_balance` (migrated from `wallet_balance_minor`) and `grace_leads`.
- Implemented the §7 awards/costs table, 3-lead provider grace cap, transaction history, spend helpers,
  awarders (daily +1, referral +200, job +1–5, star +1), and a leaderboard.

## 3. Verified Artist Booking (§43)
- `src/services/artistBookingService.ts`: verification request (stores manager contact), admin
  approve/reject/list, booking escrow in `cooling_off` state, cancel-without-penalty during cooling-off,
  release-to-completed after 24h, and `transitionConfirmedBookings()` cron helper.
- Uses real `skills.verified_artist` / `skills.source` columns on approval.

## 4. Privacy Bridge (§41)
- Added `privacy_bridge` table (`real_phone`, `proxy_phone` UNIQUE, `context`, `status`, `released_at`).
- `src/services/privacyBridge.ts`: proxy-number allocation, real-number resolution (routing only),
  active-proxy lookup, release, and rotate. Display masking via `maskPhoneNumber()`.

## 5. Skill-Flow Engine (§4 / §35.2.2)
- `src/services/skillFlows.ts`: `getSkillFlow` (used by the intent router), `listSkillFlows`,
  `upsertSkillFlow` (SQLite UPSERT), `deleteSkillFlow`, `resolveSkillAlias`.
- ONE generic `find_worker` handler; `src/ussd/menus.ts` is the sole USSD module (no per-category files).

## 6. Repository Hygiene
- Deleted 10 orphaned root scratch/patch scripts and stale fabricated test artifacts.
- Deleted duplicate `scripts/copyAssets.mjs` and 4 empty `public/audio/*.mp3` placeholders.
- Rebranded stale "Xentrix"/"Credits" references to Kurukoo/Points across docs and `metadata.json`.

## 7. Build & Type-Check
- `npm run lint` (`tsc --noEmit`): **PASS — 0 errors** (strict, NodeNext).
- `npm run build`: `tsc && npm run copy:public` (copies `public/`, `views/`, `locales/` into `dist/`).

## 8. Unified Onboarding Gateway & Channels Update (§3, §23)
- **Unified Onboarding Gateway Modal (`views/_partials/onboarding-modal.ejs`):**
  - Integrated the **First 1,000 Users Promo** campaign banner with real-time remaining slot counts.
  - Added **Alternative Free Chat Bots** selection panel supporting zero-messaging-fee channels: Telegram, Facebook Messenger, Instagram DM, and TikTok Chat.
  - Implemented the **FCM Keep-Alive Explanation Panel** for the WhatsApp channel, demonstrating the automated 15-hour push keep-alive trigger.
- **Custom Business Self-Hosted WhatsApp API:**
  - Added customizable inputs for Business sellers: WhatsApp Number, Meta App ID, and Permanent System Access Token.
  - Created optional **Assisted Storefront Activation** (₦5,000) that triggers a contributor-assisted setup, recorded as a `setup_fee` transaction in `credit_transactions`.
- **Backend Infrastructure & Status API (`src/index.ts`):**
  - Added endpoint `POST /api/onboard/self-hosted-whatsapp` to securely process, validate, and store custom Meta API configurations in the user's memory profile preferences.
  - Added endpoint `GET /api/onboard/keep-alive-status` to expose real-time status and next scheduled push times for the Keep-Alive FCM/webhook interceptor subsystem.

## 9. Bug Fixes & UI/UX Polish (August 2026)
- **Reference & Runtime Error Fixes:**
  - Resolved `channelsExpanded` ReferenceError in navigation scripts by properly guarding elements.
  - Fixed SQLite query execution issues with `better-sqlite3` vs raw driver by updating queries in `src/index.ts` to use `.prepare()`, `.bind()`, `.step()`, `.getAsObject()`, and `.free()`.
- **CSS Audit & Relocation:**
  - Audited inline styles in navigation and hero sections, moving them cleanly to `public/css/site.css`.
  - Relocated the country selector globe from the header navigation bar to the footer (right of the copyright area), with `.footer-globe-content` configured to pop up upwards cleanly.
- **Navigation Anchor Link Fix:**
  - Updated navigation dropdown toggle links ("Meet Kurukoo", "How It Works", "Earn") from legacy `#features` and `#` hash links to proper routing paths (`/explore`, `/how-it-works`, `/pricing`), resolving unwanted `/ng/#features` jump/default link behavior on load.
- **Header User Icon & Login Trigger Reassignment:**
  - Moved the user SVG icon from the primary header button to where the globe previously resided in the header navigation bar.
  - Configured the user icon button with `.nav-user-icon-btn` (borderless and boxless styling) to trigger the account login popover dropdown, reserving the adjacent header button for future action assignment.
- **Hero Section Padding & Rhythm Polish:**
  - Removed destructive `padding-top: 0; padding-bottom: 0;` override on `.hero-container` and corrected `.hero` shorthand padding to explicit `padding-top: 72px; padding-bottom: 80px;` (desktop), `padding-top: 56px; padding-bottom: 64px;` (tablet), and `padding-top: 40px; padding-bottom: 48px;` (mobile).
  - Preserved `.container` responsive horizontal outer padding (20px mobile / 40px tablet / 60px desktop) across the hero section.


