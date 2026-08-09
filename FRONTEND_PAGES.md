# Kurukoo Frontend Page Registry — Complete Architecture

**Version:** 1.0  
**Date:** 2026-08-01  
**Status:** Developer-ready spec  
**Blueprint reference:** §32.6 (updated v5.55)

---

## Overview

This document is the **single source of truth** for every page and surface in the Kurukoo ecosystem. It covers the public marketing site (`utilityapp.ai.studio`), the PWA application, and the admin console. Each entry includes its route, purpose, status, key components, and responsive design notes.

**Design principle — no inline styles:** All pages MUST use semantic CSS classes from shared stylesheets (`/css/main.css`, `/css/admin.css`, per-page CSS files). Inline `style="..."` attributes are prohibited in production code. The current `nav.ejs` and several admin pages contain inline styles that must be refactored to class-based CSS as part of the responsive audit.

---

## Responsive Design Mandate

> **Developer note (v5.55):** A responsiveness, UI, and UX audit must be conducted across the entire ecosystem. The following rules apply to ALL pages — public, PWA, and admin:

1. **No inline styles.** Every visual property must come from a CSS class. Inline `style="..."` attributes are prohibited. The current `nav.ejs` (which has ~30 inline style declarations), `index.ejs`, and all admin HTML pages must be refactored.
2. **Mobile-first.** Every page is designed for a 360px viewport first, then enhanced for tablet (768px) and desktop (1024px+). Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
3. **Touch targets.** Minimum 44×44px tap targets (WCAG 2.1 AA). No hover-dependent functionality on mobile.
4. **Images.** Use `<img>` with `loading="lazy"`, `width`/`height` attributes (prevent CLS), `srcset` for responsive sizes, and WebP/AVIF formats. All `alt` text must be present (auto-generated via §53.2.3 if missing).
5. **No horizontal scroll.** All content must fit within the viewport without horizontal scrolling at any breakpoint.
6. **Consistent header/footer.** Shared via `views/_partials/nav.ejs` and `views/_partials/footer.ejs`. No page may override the header or footer layout.
7. **CSS variables.** Use the design system variables from §31.1.1 (`--terracotta`, `--electric-blue`, `--cream`, `--charcoal`, etc.). No hardcoded hex colors in page-level CSS.
8. **Font loading.** Space Grotesk (headings) and Inter (body) loaded via `font-display: swap` to prevent FOIT.

---

## A. Public Marketing Pages

### A1. Homepage
| Field | Value |
|---|---|
| **Route** | `/:country` (redirects `/` → `/ng`) |
| **Template** | `views/index.ejs` |
| **Purpose** | Hero, role priming (3 cards), Living Profile (3 cards), Nearby Pulse map preview, "What can you do on Kurukoo?" scrollable cards, "Your Day with Kurukoo" timeline, How It Works (3 steps), social proof, final CTA |
| **Status** | ✅ Exists (needs section additions — see homepage_copy.md v2.0) |
| **Responsive** | Mobile-first. Hero stacks vertically on mobile. Cards become horizontal scroll on mobile, grid on desktop. Timeline becomes vertical on mobile. |

### A2. Pricing
| Field | Value |
|---|---|
| **Route** | `/:country/pricing` |
| **Template** | `views/pricing.ejs` |
| **Purpose** | 3-tier subscription (Base/Plus/Business), Points explanation, feature comparison table, FAQ |

---

## B. Discovery Pages

### B1. Explore Hub
| Field | Value |
|---|---|
| **Route** | `/:country/explore` |
| **Template** | `views/explore/index.ejs` |
| **Purpose** | 45-category card grid. Every 6th card is a sponsored placement. Trending strip, Nearby (Pulse-active providers), Daily Picks card. |
| **Status** | ✅ Exists |
| **Responsive** | Cards: 1-column on mobile, 2-column on tablet, 3-4 column on desktop. Sponsored cards maintain consistent sizing. |

### B2. Category Page
| Field | Value |
|---|---|
| **Route** | `/:country/explore/:slug` |
| **Template** | `views/explore/category.ejs` |
| **Purpose** | Category detail with embedded live hybrid chat (phone mockup hero), dynamically calculated trust metrics (verified provider count, completed jobs, avg ratings), ad slots, sub-category navigation |
| **Status** | ✅ Exists |

### B3. Discover (Nearby Map) — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/discover` |
| **Template** | `views/discover.ejs` |
| **Purpose** | Live interactive map showing nearby providers, AI agents, deals, emergency services. The visual counterpart to the conversational discovery engine. |
| **Status** | ✅ Done — template, backend route, and `/api/discover/map` API all implemented |
| **Map layers** | Toggleable filters: 🟢 Mobile providers (live via Pulse), 📍 Stationary providers (shops/workshops), 🤖 AI agents (assigned to LGAs/categories), 🔴 Emergency services (always visible), 🟡 Kurukoo physical agents (cash-in/out), 🔵 Active deals/requests (open marketplace), 🟣 Events/trending |
| **API** | `GET /api/discover/map?lat={lat}&lng={lng}&radius={m}&layers={csv}` → GeoJSON FeatureCollection. Cached via `cacheGet()` with 30s TTL. |
| **Additional elements** | Search bar with geolocation auto-detect, category quick-filter chips, "Happening now" activity feed, distance/sort controls, privacy notice ("Locations fuzzed to ~100m") |
| **Responsive** | Full-screen map on mobile with overlay panels (bottom sheet for pin details, top bar for filters). On desktop, sidebar with filters + list view alongside map. Leaflet.js + OpenStreetMap. |
| **Blueprint ref** | §9 (Nearby Pulse), §38 (Live Map) |

### B4. For You (User Type Chooser) — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/for-you` |
| **Template** | `views/for-you.ejs` |
| **Purpose** | Shows the 5 user types in the Kurukoo ecosystem with explanations of what each type gets and what they can do. Acts as a "who are you?" entry point that routes users to the right onboarding path. |
| **Status** | ✅ Done — template and backend route implemented |
| **User types** | 1. **Consumer** — Request any service, get matched with trusted providers, escrow protection, Daily Picks. 2. **Provider** — List skills, Work Toggle, Nearby Pulse (Go Live), Boost listings, earn. 3. **Business** — Verified storefront (chat-managed product inventory), catalogue import, analytics, team accounts, advertising. 4. **Physical Agent** — Cash-in/out, onboarding, walk-in assistance, earn commissions. 5. **Contributor** — Micro-tasks (update prices, confirm locations, incident alerts, security updates), earn airtime from Growth Fund, badge progression. |
| **Design** | 5 cards in a responsive grid. Each card: icon, type name, 3-bullet "what you get", 3-bullet "what you can do", CTA button → pre-filled WhatsApp prompt or PWA onboarding with role pre-selected. |
| **Responsive** | Cards: 1-column on mobile (stacked), 2-column on tablet, 3-column on desktop. |
| **Blueprint ref** | §40 (Pick a Role), §C Contributor model below |

### B5. Provider Dynamic Display — **NEW (no dedicated page)**
| Field | Value |
|---|---|
| **Route** | No fixed route. Providers are surfaced dynamically through: (a) sponsored Explore cards, (b) Daily Picks cards, (c) Discover map pins, (d) chat-suggested provider cards, (e) boosted listing cards. |
| **Purpose** | Show provider information when the provider has taken an action that benefits Kurukoo (boosted a listing, created an advert, performed a task). NOT a public profile page — Kurukoo is not a business listing directory. |
| **Display mechanism** | Inline cards within the chat thread, Explore grid, Daily Picks, and Discover map. Each card shows: provider name, skill, rating, badge(s), proximity, and a CTA ("Chat with this provider"). Boosted/advertised cards have a "Sponsored" label. |
| **Storefront info** | When a provider has a storefront (Business tier), product cards from their `skills.business_products` appear in Daily Picks or in response to user requests. Products are NOT browseable in a directory — they surface conversationally. |
| **Why no dedicated page** | Many providers already have profiles on Jiji, Instagram, WhatsApp Business, etc. Kurukoo's value is conversation-first discovery, not being another directory. |
| **Blueprint ref** | §32.6 storefront clarification, §9 catalog scraper, §33.1.6 Daily Picks |
| **Status** | ✅ Exists |

### A3. About
| Field | Value |
|---|---|
| **Route** | `/:country/about` |
| **Template** | `views/about.ejs` |
| **Purpose** | Company story, mission, team, investors, press |
| **Status** | ✅ Exists |

### A4. Contact
| Field | Value |
|---|---|
| **Route** | `/:country/contact` |
| **Template** | `views/contact.ejs` |
| **Purpose** | Contact form, office locations, WhatsApp/email/phone |
| **Status** | ✅ Exists |

### A5. Careers
| Field | Value |
|---|---|
| **Route** | `/:country/careers` |
| **Template** | `views/careers.ejs` |
| **Purpose** | Open roles, culture, application form |
| **Status** | ✅ Exists |

---

## C. Content & Resources

### C1. Resources Hub — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/resources` |
| **Template** | `views/resources/index.ejs` |
| **Purpose** | Educational content library (the "library"). Evergreen, searchable, SEO-optimized content that feeds into §53 programmatic SEO. |
| **Status** | ✅ Done — template, backend route, and `/api/resources` API all implemented |
| **Content sections** | User Guides, Provider Guides, Business Guides (storefront setup, catalogue import, analytics, team accounts), Diaspora & Relocation Guide (UK life-admin), API Documentation, Legal & Compliance, Blog & Insights |
| **Relationship to Help** | Resources = educational content library (learn how things work). Help = transactional support desk (something went wrong, fix it now). Clear split. |
| **API** | `GET /api/resources?category={slug}&page={n}` → paginated list (max 20/page). `GET /api/resources/:slug` → individual article. |
| **Responsive** | Article cards: 1-column mobile, 2-column tablet, 3-column desktop. Sidebar with category nav on desktop, collapsible on mobile. |

### C2. Resource Article — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/resources/:slug` |
| **Template** | `views/resources/article.ejs` |
| **Purpose** | Individual guide/article with TOC, reading progress, related articles |
| **Status** | ✅ Done — template, backend route, and `/api/resources/:slug` API all implemented |

### C3. Blog
| Field | Value |
|---|---|
| **Route** | `/:country/blog` |
| **Template** | `views/blog/index.ejs` |
| **Purpose** | Market intel, news, updates, provider stories |
| **Status** | ✅ Exists |

### C4. Blog Post
| Field | Value |
|---|---|
| **Route** | `/:country/blog/:slug` |
| **Template** | `views/blog/post.ejs` |
| **Purpose** | Individual blog article |
| **Status** | ✅ Exists |

### C5. API Docs
| Field | Value |
|---|---|
| **Route** | `/:country/api/docs` (also `/api/docs`) |
| **Purpose** | Developer integration guides, endpoint reference, authentication |
| **Status** | ✅ Exists |

### C6. Legal
| Field | Value |
|---|---|
| **Route** | `/:country/legal/:section` |
| **Purpose** | Terms of Service, Privacy Policy, Cookie Policy, NDPA compliance |
| **Status** | ✅ Exists |

---

## D. Support

### D1. Help Centre
| Field | Value |
|---|---|
| **Route** | `/:country/help` |
| **Template** | `views/help.ejs` |
| **Purpose** | Transactional support desk (the "help desk"). FAQ, dispute center, live chat (WhatsApp), report a problem, contact support, status page. |
| **Status** | ✅ Exists (needs refinement — educational content moves to Resources) |
| **Content to KEEP** | FAQ, Dispute Center (`/api/dispute/:id`), Live Chat → WhatsApp, Report a Problem, Contact Support, Status Page |
| **Content to MOVE to Resources** | Getting Started, How-To Guides, Privacy & Trust explainer, Earning Money guides |
| **SEO** | `noindex` for support-specific pages (not SEO targets). |

---

## E. Partnership & Advertising

### E1. Partners — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/partners` |
| **Template** | `views/partners.ejs` |
| **Purpose** | Public entry point for all partnership types. Partner type cards, commission structure, application form. |
| **Status** | ✅ Done — template and backend route implemented (admin `partnerships.html` + `/api/admin/partnerships` + `partnerships` table exist) |
| **Partner types** | 1. Kurukoo Agents (physical, cash-in/out, onboarding). 2. Agent Networks (organizations managing multiple agents). 3. Service Partners (businesses on Kurukoo). 4. Technology Partners (API, telco, payment providers). 5. Brand/Corporate Partners (advertising, city takeovers). 6. Community Partners (NGOs, community orgs). 7. Government Partners (LGA, NIN, government services). 8. Developer Partners (API/MCP builders). |
| **Application form** | POST to `/api/partner/apply` → creates row in `partnerships` table → admin review |
| **Blueprint ref** | §11 (Agent Network), §38 (Physical Agent Management) |

### E2. Advertise — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/advertise` |
| **Template** | `views/advertise.ejs` |
| **Purpose** | Public page for businesses/brands to advertise. Ad placement inventory, targeting, pricing, self-serve portal, enterprise contact. |
| **Status** | ✅ Done — template and backend route implemented (`/api/ads` endpoint + admin `marketing.html` + `revenue.html` exist) |
| **Ad placements** | Sponsored Explore cards, Sponsored Daily Picks, Nearby Pulse sponsorships (branded pins), Category takeovers, City takeovers, Provider spotlights, Blog sponsored content |
| **Targeting** | By location (LGA/city), category, user intent, language, user segment |
| **Pricing** | CPM, CPV, flat-rate takeovers |
| **Admin module** | Dedicated Ads Management module (see §H14) — separate from Content/CMS |
| **Blueprint ref** | §7, §33.1.6, §38 (Ads Management — to add) |

---

## F. Country/Locale Variants

| Country | Route | Currency | Status | Notes |
|---|---|---|---|---|
| Nigeria (default) | `/ng/` | NGN (₦) | ✅ | 45 categories, Pidgin/English, OPay/Moniepoint, USSD *7000# |
| Ghana | `/gh/` | GHS (₵) | ✅ Route | Local categories, MTN Mobile Money |
| UK | `/gb/` | GBP (£) | ✅ | Diaspora features, Stripe, community board, child safety, UK life-admin |

**Locale files:** `en`, `ha`, `yo`, `ig`, `pcm` (Nigerian Pidgin), `en-GB`.

---

## G. PWA Application

### G1. PWA Dashboard (Chat Interface)
| Field | Value |
|---|---|
| **Route** | `/dashboard.html` |
| **Template** | `public/dashboard.html` |
| **Purpose** | Full chat interface — the primary and only interface of the platform. Memory-driven: adapts based on user's profile. |
| **Status** | ✅ Exists (needs sidebar + discover/explore enhancement) |
| **Layout** | ChatGPT/Grok/Claude-style: **sidebar** (left) + **chat window** (center/right). Sidebar: conversation history, Balance, Activity, Settings, **Discover panel**. Chat window: single unified thread with inline cards. |
| **Discover panel (sidebar)** | NEW — discover/explore area showing: Daily Picks cards, activity feed ("3 plumbers active in your area"), intent-based suggestions ("Demand for delivery driver in your area", "Cheaper rice found — buy?", "{Business} serving hot pepper soup — book table or order?", "{Event} in {area} — attend?"). All personalized to user type via `memory_profiles.inferred_roles`. |
| **Monetization** | Sponsored cards in the Discover panel (labelled "Sponsored"), promoted provider spotlights, Daily Picks with CPM/CPV bids. High-engagement surface — visible every time user opens PWA. |
| **Inline cards** | Ride picker, Go Live/Pulse toggle, product cards (4 layouts), trade offer card, survey questions, provider cards (dynamic display), Daily Pick cards, event cards, price alert cards |
| **Responsive** | Mobile: sidebar collapses to drawer (hamburger), chat fills screen. Desktop: sidebar fixed 280px, chat fills remaining. Pull-down drawer for Balance/Activity/Settings. Emergency SOS always visible top-right. |
| **Blueprint ref** | §32.3, §32.9, §33 |

### G2. Login
| Field | Value |
|---|---|
| **Route** | Modal (no dedicated route) |
| **Purpose** | Phone + PIN authentication. SSO (Google/Apple) + email/password for UK (§1.5.2). |
| **Status** | ✅ Exists |

### G3. Unified Onboarding Gateway Modal
| Field | Value |
|---|---|
| **Route** | Modal (no dedicated route, embedded partial `onboarding-modal.ejs`) |
| **Template** | `views/_partials/onboarding-modal.ejs` |
| **Purpose** | High-conversion unified entry gateway that pre-registers users into memory profiles and routes them to their preferred messaging/PWA interface. |
| **Status** | ✅ Done — fully implemented and integrated across the landing and explore pages |
| **Components** | • **First 1,000 Users Promo Banner:** Highlights live campaign counts for lifetime free USSD/WhatsApp sessions.<br>• **Adaptive Channel Selectors:** Dynamic toggles for Web App (PWA), WhatsApp, Alternative Free Chat Bots (Telegram, FB Messenger, Instagram, TikTok), and USSD code.<br>• **Self-Hosted Custom Business WhatsApp API Panel:** Available for sellers. Supports Custom Number, Meta App ID, Meta System Access Token, and optional Assisted Activation (₦5,000 setup fee).<br>• **FCM Keep-Alive Standby Info:** Educational block explaining the automated 15-hour push keep-alive cycle. |
| **Responsive** | Mobile-first custom modal design with glassmorphism overlays and fluid adaptive layouts that fit perfectly on 360px viewports without horizontal scrolling. |

---

## H. Admin Console

All admin pages use separate JWT-based auth (roles: admin, moderator, finance, viewer). Served from `/admin/`.

### Existing Admin Pages
| Page | Route | Purpose | Status |
|---|---|---|---|
| Dashboard | `/admin/dashboard.html` | Real-time MAU, GTV, active providers, revenue | ✅ |
| Users | `/admin/users.html` | User management, search by phone | ✅ |
| Content | `/admin/content.html` | Blog, help, legal, resources CMS | ✅ (needs Resources type) |
| Partnerships | `/admin/partnerships.html` | Partner CRM | ✅ |
| Revenue | `/admin/revenue.html` | Monetisation dashboard | ✅ |
| Marketing | `/admin/marketing.html` | Marketing campaigns | ✅ |
| Pricing | `/admin/pricing.html` | Subscription tier management | ✅ |
| Commissions | `/admin/commissions.html` | Commission configuration | ✅ |
| Referrals | `/admin/referrals.html` | Referral stats, tracking | ✅ |
| Analytics | `/admin/analytics.html` | Demand heatmap, trends | ✅ |
| AI Agents | `/admin/ai-agents.html` | AI agent management | ✅ |
| Artists | `/admin/artists.html` | Verified artist booking | ✅ |
| Social | `/admin/social.html` | Social media scheduling | ✅ |
| Scam Reports | `/admin/scam.html` | Scam/complaint handling | ✅ |
| Celebrity | `/admin/celebrity.html` | Celebrity booking management | ✅ |
| Future Plans | `/admin/future.html` | Roadmap planning | ✅ |

### New Admin Pages
| Page | Route | Purpose | Status | Ref |
|---|---|---|---|---|
| **Ads** | `/admin/ads.html` | Ad campaign management (create, target, schedule, report). Separate from Content/CMS. | ❌ New | §38, §E2 |
| **SEO** | `/admin/seo.html` | SEO control plane (metadata, schema, sitemap, redirects, keywords, AI content, CWV dashboard) | ✅ Done | §53, PA-18/19/20 |
| **Providers** | `/admin/providers.html` | Provider approval/reject/suspend, rating review | ❌ New | §38, §32.1.4 |
| **Compliance** | `/admin/compliance.html` | Dispute/compliance review queue, flagged content | ❌ New | §32.1.4 |
| **Settings** | `/admin/settings.html` | Platform configuration, feature flags (§35), locale settings | ❌ New | §32.1.4 |

**Admin Ads module features:** Campaign creation wizard (placement → targeting → creative → budget → schedule), creative management (upload, AI-assisted copy via Groq through router), targeting engine (location, category, language, segment), scheduling & flight management, performance reporting (impressions, clicks, CTR, conversions, spend), billing & invoicing, approval workflow (§17 blocklist compliance), A/B testing. API: `GET/POST/PUT/DELETE /api/admin/ads` + `GET /api/admin/ads/:id/performance`.

---

## I. Programmatic SEO Pages

### I1. Category × City/LGA Landing Pages — ✅ Done
| Field | Value |
|---|---|
| **Route** | `/:country/:category/:city-or-lga` |
| **Template** | `views/programmatic.ejs` |
| **Purpose** | Auto-generated landing pages for SEO (e.g., `/ng/food/lagos`). Combines category info with location-specific provider counts, trust metrics, embedded chat. |
| **Status** | ✅ Done (PA-20, §53.2.4) — Route, template, dynamic sitemap, Service schema, auto-generated SEO meta |

### I2. Public Provider Profile Pages — ✅ Done (conditional)
| Field | Value |
|---|---|
| **Route** | `/:country/p/:provider-slug` |
| **Template** | `views/provider-profile.ejs` |
| **Purpose** | Auto-generated provider profile pages for SEO (LocalBusiness schema). ONLY generated for providers who have boosted a listing, created an advert, or explicitly opted in. NOT a public directory. |
| **Status** | ✅ Done (PA-20, §53.1) — Route, template, LocalBusiness schema, opt-in gate (verified_provider / public_profile_opt_in / paid subscription), auto-generated SEO meta |
| **Note** | This is the ONLY case where a provider gets a page — and only for SEO, generated automatically, with explicit opt-in or action-triggered creation. Users cannot browse a directory of providers. |

---

## J. Feature Visibility Matrix

Where key features appear in the public-facing ecosystem:

| Feature | Homepage | Explore | Discover | For You | PWA | Resources | Nav |
|---|---|---|---|---|---|---|---|
| Nearby Pulse (Go Live) | ✅ Section | — | ✅ Map layer | ✅ Provider card | ✅ Toggle + map | ✅ Guide | Platform dropdown |
| Daily Picks | — | ✅ Card | — | ✅ Business card | ✅ Sidebar panel | ✅ Guide | Platform dropdown |
| Price Checker | ✅ Scrollable card | ✅ Category | — | ✅ Consumer card | ✅ Inline card | ✅ Guide | — |
| Universal Remote | ✅ Scrollable card | ✅ Category | — | ✅ Consumer card | ✅ Smart Devices | ✅ Guide | — |
| Storefront | ✅ Business card | — | ✅ Map pin | ✅ Business card | ✅ Product cards | ✅ Guide | Platform dropdown |
| Money Circle (Ajo) | ✅ Scrollable card | ✅ Category | — | ✅ Consumer card | ✅ Inline card | ✅ Guide | Platform dropdown |
| Emergency SOS | ✅ Scrollable card | ✅ Category | ✅ Map layer | ✅ Consumer card | ✅ Red button | ✅ Guide | — |
| Contributors/Tasks | — | — | — | ✅ Contributor card | ✅ Tasks panel | ✅ Guide | — |
| National Events | ✅ Timeline | — | ✅ Events layer | — | ✅ Sidebar reminders | ✅ Guide | — |
| Advertising | ✅ Scrollable card | ✅ Sponsored | ✅ Branded pins | ✅ Business card | ✅ Sponsored cards | ✅ Guide | — |

---

## K. "What Can You Do on Kurukoo?" — Scrollable Cards

This section appears on the homepage and feeds into the Explore hub. Each card links to the corresponding Explore category page, which contains a chat UI that can onboard or assist the user.

| # | Card title | Icon | Links to | Group |
|---|---|---|---|---|---|
| 1 | Order Food | 🍜 | `/explore/food` (§55.4) | Everyday Food |
| 2 | Get Groceries | 🛒 | `/explore/groceries` (§55.4) | Everyday Food |
| 3 | Get Errands Done | 🏃 | `/explore/errands` | Everyday Home |
| 4 | Logistics & Delivery | 📦 | `/explore/logistics` | Everyday Home |
| 5 | Send Parcels | 📮 | `/explore/logistics` | Everyday Home |
| 6 | Fuel Delivered | ⛽ | `/explore/errands` | Everyday Home |
| 7 | Get a Ride / Mobility | 🛵 | `/discover` (mobility layer) | Everyday Home |
| 8 | Home Services | 🏠 | `/explore/repairs-maintenance` | Home & Repairs |
| 9 | Generator / Appliance Repairs | 🔧 | `/explore/repairs-maintenance` | Home & Repairs |
| 10 | Solar Installation | ☀️ | `/explore/solar-energy` | Home & Repairs |
| 11 | Auto Repair & Car Parts | 🚗 | `/explore/automotive-mechanics` | Home & Repairs |
| 12 | Access Health & Care | 🏥 | `/explore/health-medical` | Health, Money & Safety |
| 13 | Money Circle (Ajo/Esusu) | 💰 | `/explore/finance-tax` | Health, Money & Safety |
| 14 | Emergency Services / SOS | 🚨 | `/explore/emergency-dispatch` | Health, Money & Safety |
| 15 | Security & Close Protection | 🛡️ | `/explore/emergency-dispatch` (security) | Health, Money & Safety |
| 16 | Neighborhood Safety Alerts | 🚔 | `/explore/community` | Health, Money & Safety |
| 17 | Find Work / Gigs | 💼 | `/explore/gigs` | Earning, Building & Community |
| 18 | Sell Locally | 🏪 | `/explore/classifieds` (§55.4) | Earning, Building & Community |
| 19 | Reach Customers / Advertise | 📢 | `/explore/reach-reference` | Earning, Building & Community |
| 20 | Cover Events / Get Paid | 🎥 | `/for-you` (Contributor) | Earning, Building & Community |
| 21 | Sports, Matches & Clubs | ⚽ | `/explore/sports-recreation` | Earning, Building & Community |
| 22 | Community / Groups (Kuru Circles) | 👥 | `/explore/events-entertainment` | Earning, Building & Community |
| 23 | Get Price Alerts | 💲 | `/explore/price-check` | Info, Alerts & Entertainment |
| 24 | Check Key Services (NIN, CAC) | 📋 | `/explore/government` | Info, Alerts & Entertainment |
| 25 | Check Exam Results (JAMB/WAEC/NECO) | 🎓 | `/explore/education-learning` | Info, Alerts & Entertainment |
| 26 | Reload Airtime & Data | 📱 | `/explore/communication` | Info, Alerts & Entertainment |
| 27 | Universal Remote (TV/Devices) | 📺 | Resources guide | Info, Alerts & Entertainment |
| 28 | Know What's Happening / Events | 📅 | `/discover` (events layer) | Info, Alerts & Entertainment |
| 29 | Hawkers Near You | 🥭 | `/explore/cravings` | Info, Alerts & Entertainment |
| 30 | Prayers & Spiritual | 🤲 | `/explore/spiritual` | Info, Alerts & Entertainment |

> **Grouping note:** Cards are grouped into 5 visual bandings — **Everyday Food**, **Everyday Home**, **Home & Repairs**, **Health, Money & Safety**, **Earning, Building & Community**, **Info, Alerts & Entertainment** — rendered as one continuous scroll, label chips optional. The **new cards responding to recent verticals** are: **Auto Repair & Car Parts** (§55.1), **Security & Close Protection** (§55.2), **Sports, Matches & Clubs** (§55.3), **Get a Ride / Mobility** (Discover), and **Cover Events / Get Paid** (§36.1.3 Contributor).

> **Developer note (Universal Vendor Ordering):** The "Order Food", "Get Groceries", "Sell Locally", and sport/parts/equipment cards all terminate in the **shared Universal Vendor Product Ordering Flow** (§55.4, BLUEPRINT). Each links to an Explore category whose chat UI routes the request through: extract (item+quantity+location) → `find_worker` match against `skills.business_products` → product card → escrow hold → optional `dispatch_rider` second leg → completion → escrow release → reorder signal. These cards must **never** be wired to a per-skill stub — the same flow serves suya vendors, bakeries, grocers, car-parts sellers, and storefronts.

**Design:** Horizontal scroll on mobile (swipeable, snap-scroll), grid on desktop (4-6 columns). Each card: icon, title, subtle border, hover/tap effect. Algorithmically ordered per user if logged in (based on `memory_profiles.inferred_roles` and `behavior_patterns`).

---

## L. Navigation Structure (Live)

The current `nav.ejs` header (to be refactored — remove inline styles):

```
[Logo: Kurukoo]     [Platform ▼] [Discover] [For You ▼] [Pricing] [Resources] [Partners]     [Help] [🌐]
```

**Platform dropdown (mega-menu):**
- 💬 Conversational Core: Request Anything, Order Essentials, USSD Offline Portal
- ⚡ Earning & Skills: The Work Toggle, Offer Any Skill, Live Nearby Pulse
- ⭕ Safety & Trust: Neighbourhood Watch, P2P Money Circles (Soon)
- 🔌 Ecosystem Features: Nearby Pulse, Price Alerts, Universal Remote Controller, 

**Footer additions (new links):** Partners, Advertise, Resources

---

## M. Storefront Clarification (Per User Direction)

> **Developer note:** The storefront feature is NOT a public business listing directory. Many providers already have profiles on Jiji, Instagram, WhatsApp Business, etc. Kurukoo will not compete as another directory.

**What the storefront IS:**
1. **Chat-managed product inventory** — Kurukoo knows what products a Business-tier provider has by: (a) importing from their WhatsApp Business catalogue (catalog scraper, PA-17), and (b) asking the provider questions periodically ("You listed rice last week — is it still in stock? Has the price changed?"). This keeps inventory updated without the provider manually maintaining a dashboard.
2. **Products stored in `skills.business_products`** (JSON array) — product name, price, availability, image URL (optional), last_confirmed timestamp.
3. **Products surface conversationally** — NOT in a browseable directory. Products appear when: (a) a user requests something matching, (b) Daily Picks features a product, (c) the provider boosts a product or creates an advert.
4. **Future possibility** — a marketplace where users can browse and order from the overall storefront inventory. Explicitly FUTURE. Until then, products surface via conversation and Daily Picks only.

**What the storefront IS NOT:** NOT a public provider profile page, NOT a browseable product catalogue, NOT a Jiji/Amazon competitor, NOT visible to other providers.

**Business subscription clarity:** "Storefront: Kurukoo learns your products from your WhatsApp catalogue and keeps them updated by asking you questions. Your products appear to nearby customers when they search for what you sell. No dashboard to maintain — just chat."

---

## N. National Events & Cultural Calendar — **NEW**

> **Developer note (v5.55):** New system (§54 in blueprint) handling all national days, festivals, and key events across Nigeria, Ghana, and the UK. Includes a dedicated AI agent for reminders.

**Scope:**
- **Nigeria:** Independence Day (Oct 1), Democracy Day (June 12), Eid al-Fitr, Eid al-Adha, Christmas, Easter, New Yam Festival, Lagos Carnival, Calabar Carnival, Ojude Oba, Argungu Fishing Festival, Workers' Day (May 1)
- **Ghana:** Independence Day (March 6), Republic Day, Homowo, Aboakyir Festival, Panafest, Christmas, Easter
- **UK:** New Year, Good Friday, Easter Monday, May Day, Spring/Summer Bank Holidays, Christmas, Boxing Day, Bonfire Night, St George's Day, Diwali, Eid, Notting Hill Carnival

**System architecture:**
- `national_events` table: `id`, `country`, `name`, `type` (public_holiday/religious/cultural/festival/sporting), `date` or `date_rule` (lunar/variable), `description`, `image_url`, `is_recurring`, `locale_relevance` (JSON)
- **Cultural Calendar AI Agent** — dedicated AI agent (§38) that: (a) maintains events calendar, (b) generates contextual reminders ("Tomorrow is Eid al-Fitr — need help finding a butcher?"), (c) personalizes based on inferred religion/culture from `memory_profiles.behavior_patterns`, (d) suggests relevant services (Independence Day → event planners, caterers), (e) creates Daily Picks themed around events (Valentine's → flowers, gifts, restaurants)
- **Reminder delivery:** Daily Picks (themed), push notifications (FCM), WhatsApp messages, PWA Discover panel sidebar
- **Intent creation from frontend:** Website surfaces event-themed content ("Valentine's Day is coming — get ready with Kurukoo" → relevant categories). Creates latent intent without exposing other users' requests.

---

## O. Price Checker Visibility

The price checker (`price_check` category, `price_checker` skill) is currently invisible on the public site. It should be surfaced:

1. **Homepage scrollable cards** — "Get Price Alerts" card → `/explore/price-check`
2. **Explore Hub** — as a category card
3. **PWA** — inline price check cards when user asks "How much is rice?" → returns market prices from nearby providers' `skills.business_products`
4. **Daily Picks** — price alert cards ("Rice price dropped in your area — ₦3,200 at Mama Nkechi's")
5. **For You page** — Consumer card ("Get price alerts on essentials")
6. **Discover map** — price comparison pins (future)

**How it works:** User asks "How much is rice?" → intent router classifies as `price_check` → system queries `skills.business_products` for matching products from nearby providers → returns price comparison cards. Future: market price intelligence (aggregated trends).

---

## P. Universal Remote Placement

The Universal Remote & IoT Control (§32.12) appears in:

1. **Homepage scrollable cards** — "Universal Remote" card → Resources guide
2. **For You page** — Consumer card ("Control your devices from the same chat")
3. **PWA** — "Smart Devices" panel in pull-down drawer (appears when devices discovered)
4. **Resources** — setup and usage guide
5. **Business tier** — listed as a feature
6. **Explore** — category/explainer page for smart home services

---

## Summary — New Pages to Build

| # | Page | Route | Priority | Dependencies |
|---|---|---|---|---|
| 1 | Discover (Nearby Map) | `/:country/discover` | HIGH | Leaflet.js, `/api/discover/map` |
| 2 | For You (User Type Chooser) | `/:country/for-you` | HIGH | None (static + WhatsApp deep links) |
| 3 | Resources Hub | `/:country/resources` | HIGH | `/api/resources`, CMS content |
| 4 | Partners | `/:country/partners` | MEDIUM | `/api/partner/apply` |
| 5 | Advertise | `/:country/advertise` | MEDIUM | Admin ads module |
| 6 | Programmatic SEO Pages | `/:country/:category/:city` | MEDIUM | §53 SEO, PA-20 |
| 7 | Admin Ads | `/admin/ads.html` | MEDIUM | `/api/admin/ads` CRUD |
| 8 | Admin SEO | `/admin/seo.html` | MEDIUM | §53, PA-18/19/20 |
| 9 | Admin Providers | `/admin/providers.html` | LOW | Provider management APIs |
| 10 | Admin Compliance | `/admin/compliance.html` | LOW | Dispute/compliance APIs |
| 11 | Admin Settings | `/admin/settings.html` | LOW | Feature flag system (PA-3) |

---

*Last updated: 2026-08-01 | Blueprint v5.55*
