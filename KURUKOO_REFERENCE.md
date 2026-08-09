# Kurukoo v5.41 — Technical Reference Guide

## Architecture Overview
- **Backend:** Node.js, Express 4, TypeScript (`src/index.ts`, `src/database.ts` → `kurukoo.sqlite` via `sql.js`).
- **Entry:** root `index.ts` validates env then bootstraps `src/index.js` (the Express app).
- **Frontend PWA:** Vanilla HTML/CSS/JS (`public/dashboard.html`, `public/js/kurukoo-chat.js`, `public/js/app.js`).
- **Public Website:** EJS templates (`views/index.ejs`, `views/pricing.ejs`, `views/explore/index.ejs`, `views/explore/category.ejs`, …) with shared partials (`views/_partials/*`).
- **AI Intent Pipeline:** Regex → FastText (`models/kurukoo_intent.bin`, `src/services/fastTextService.ts`) → Groq (`src/services/groqService.ts`, Llama-3.1-8B-Instant) → Template fallback (`src/services/intentRouter.ts`).
- **Environment Variables:** `KURUKOO_PAY_PROVIDER`, `CREDIT_ECONOMY_ENABLED`, `DB_PATH`, `GROQ_API_KEY`, `WHATSAPP_TOKEN`, etc. (see `.env.example`).
- **Unified Messaging:** all messages across WhatsApp, PWA, and USSD are logged to the `messages` table.

## Core Data Architecture (Blueprint §4 Tight Integration Mandate)
- `memory_profiles` — single source of truth per phone (name, location, country, Points balance, tier, encrypted preferences/behavior, trust_score, grace_leads, verified_provider).
- `skills` — multi-skill tags per profile (source explicit|inferred, operation_mode, verified_artist, booking_mode, rating, jobs_completed).
- `skill_flows` — per-skill question sets, post-match action, payment model, fulfilment instructions.
- `messages` — unified conversation history across channels.
- `provider_presence` / `user_behavior_signals` — real-time presence + learned signals.
- `ai_agents` — first-class AI agent users (mirrored into memory_profiles + skills).
- `privacy_bridge` — proxy-number mappings for number masking (§41).
- `escrow` — held funds with `created_at` for cooling-off timers (§43).
- **No legacy identity tables** (`providers`/`riders`/`agents` are gone; unified identity only).

## Key Internal vs External Terminology Mappings (v5.41)
| User-Facing (UI / Copy) | Internal (Code / DB) |
|---|---|
| Kurukoo App | PWA (`public/dashboard.html`) |
| Balance / Points & Top-ups | `memory_profiles.points_balance`, `pointsEngine.ts` |
| Kurukoo Circle | `money_circles`, `src/services/moneyCircle.ts` |
| Kurukoo Pulse / "Go Live" | `src/services/nearbyPulse.ts`, `pulse_sessions` |
| Kurukoo Pay | `wallet_balance_minor`, reload modal, `directWallet.ts` |
| Daily Picks | `src/services/dailyPicks.ts`, `success_stories` |
| Verified Artist | `skills.verified_artist`, `src/services/artistBookingService.ts` |
| AI Agents | `ai_agents`, `src/services/aiAgentService.ts` |
| Privacy Bridge | `privacy_bridge`, `src/services/privacyBridge.ts` |
| Work Toggle | `memory_profiles.is_available` |

## Admin Console (`public/admin/*`)
17 pages: `ai-agents`, `artists`, `celebrity`, `commissions`, `content`, `dashboard`, `future`, `login`, `marketing`, `partnerships`, `pricing`, `referrals`, `revenue`, `scam`, `social`, `users`, `analytics` — backed by `/api/admin/*` routes.

## Build
- `npm run dev` → `tsx index.ts`
- `npm run build` → `tsc && npm run copy:public` (copies `public/`, `views/`, `locales/` into `dist/`)
- `npm run lint` → `tsc --noEmit` (passes with 0 errors under strict/NodeNext)
