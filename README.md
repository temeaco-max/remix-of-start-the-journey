# Kurukoo v5.41 — Everyday Utility Platform

**Tagline:** Wake up. Get going.
**Shortcode:** `*7000#`  ·  **Voice/WhatsApp:** `7000`
**Previous working names:** Xentrix → **Kurukoo** (final)

Kurukoo is an AI-powered everyday utility platform that gives every user a single,
private number to **request anything**, **offer any skill**, and **earn from it** —
securely and privately, all inside one conversation. It works on WhatsApp, on a basic
feature phone via USSD, and through a lightweight PWA ("Kurukoo App").

> Kurukoo is not a chatbot. It is economic infrastructure that happens to use chat as one of its interfaces.

## Architecture
- **Backend:** Node.js · Express 4 · TypeScript (`src/index.ts`, `src/database.ts`)
- **Database:** `sql.js` (SQLite in-process) persisted to `kurukoo.sqlite` (override via `DB_PATH`)
- **Identity model:** single `memory_profiles` + `skills` tables — **no** legacy `users`/`riders`/`providers` silos (Blueprint §4 Tight Integration Mandate)
- **Unified skill-flow engine:** ONE generic handler (`find_worker`) reads `skill_flows` config; **1** USSD module (`src/ussd/menus.ts`) — no per-category USSD files
- **AI intent pipeline:** Regex → FastText (`models/kurukoo_intent.bin`) → Groq (Llama-3.1-8B-Instant) → Template fallback (`src/services/intentRouter.ts`)
- **Channels:** WhatsApp webhook (`src/channels/whatsapp.ts`), USSD (`src/ussd/menus.ts`), PWA (`public/dashboard.html` + `public/js/kurukoo-chat.js`)
- **Frontend:** EJS public site (`views/`) + vanilla JS PWA (`public/`)
- **Economy:** closed-loop Points (CBN compliant) — `pointsEngine.ts`; see `POINTS_COMPLIANCE.md`

## Quick Start
```bash
npm install        # installs deps; fasttext CLI is optional (auto fallback)
npm run dev        # tsx index.ts  →  http://localhost:3000
npm run lint       # tsc --noEmit  (type-check, currently passes with 0 errors)
npm run build      # tsc && npm run copy:public
```

## Key Docs
- `BLUEPRINT.md` — master specification (v5.41)
- `ECOSYSTEM.md` — authoritative 45-category taxonomy
- `MASTER_AUDIT_RESULTS.md` / `FINAL_AUDIT_REPORT.md` — verification against the blueprint
- `CACHING.md`, `DATA_RETENTION_POLICY.md`, `POINTS_COMPLIANCE.md`, `WHATSAPP_CONTINGENCY.md`

## Stack
`express` · `ejs` · `sql.js` · `mqtt` (Universal Remote/IoT) · `dotenv` · `tsx` · `typescript` (strict)
