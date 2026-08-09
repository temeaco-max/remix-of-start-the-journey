# Kurukoo Homepage Copy — Marketing Reference

**Version:** 2.0  
**Date:** 2026-08-01  
**Status:** Updated to match live site + new page architecture  
**Owner:** Kurukoo Brand  
**Blueprint reference:** §32.6 (v5.55), FRONTEND_PAGES.md

---

## Overview

This document contains the complete homepage copy for `utilityapp.ai.studio`. It is the single source of truth for all homepage messaging. Do not modify without brand review.

**Positioning:** Kurukoo is a multi-sided utility product that uses conversational AI to deliver on-demand SaaS tools straight to the informal economy. It is built around the warm, highly personal positioning of a trusted neighbor who knows everyone in the area and is always ready to assist.

**Tone:** Bold, warm, human, neighborly. No engineering jargon. No "loyalty tokens." Avoid overly corporate SaaS speak, while clearly communicating that under the hood, Kurukoo is a powerful multi-sided utility.

---

## Header / Navigation

> **Updated to match live `nav.ejs`.** The previous version had an outdated 3-link nav. The live site uses a 7-item nav with a Platform mega-dropdown.

| Item | Label | Notes |
|---|---|---|
| Logo | Kurukoo | Wordmark + icon |
| Nav link 1 | Platform ▼ | Mega-dropdown: Conversational Core, Earning & Skills, Safety & Trust, Ecosystem Features |
| Nav link 2 | Discover | Nearby map — live providers, AI agents, deals, emergency services |
| Nav link 3 | For You | User type chooser — Consumer, Provider, Business, Agent, Contributor |
| Nav link 4 | Pricing | Direct link to pricing page |
| Nav link 5 | Resources | Educational content library (guides, API docs, legal, blog) |
| Nav link 6 | Explore | 45-category card grid |
| Nav link 7 | Help | Support desk (FAQ, disputes, contact) |
| Right side | 🌐 Globe | Country/locale switcher (NG, GH, GB) |
| CTA button | Open Chat | Primary action. Opens WhatsApp or PWA chat. |

> **Developer note:** The `nav.ejs` currently contains ~30 inline `style="..."` declarations. These MUST be refactored to CSS classes per the Responsive Design Mandate (FRONTEND_PAGES.md §Responsive Design Mandate). No inline styles in production code.

---

## Hero Section

**Headline:**  
The trusted neighbor who knows everyone.

**Subhead:**  
Meet Kurukoo — a multi-sided utility powered by conversational AI that delivers on-demand SaaS tools straight to the informal economy. Think of it as a deeply connected local friend who is always ready to assist: learning who you are, finding trusted helpers, listing your skills, and serving up proactive neighborhood opportunities.

**Primary CTA:**  
[Start on WhatsApp]

**Secondary CTA:**  
[Dial *7000#]

**Trust line (small, under CTAs):**  
⭐ Trusted by thousands across Nigeria • No app download required • Your Privacy is First

---

## Role Priming Section (3 Cards)

**Section headline:**  
What do you want to do today?

**Section intro:**  
One conversation. Every role. No profile switching, no new apps. Kurukoo is like that reliable, connected neighbor who knows every plumber, okada rider, and shopkeeper in town — always ready to assist you or find you some good work.

---

### Card 1 — Consumer

**Headline:**  
Request a service

**Body:**  
Ask for anything. Need a quick ride, a reliable plumber, fresh produce, or a helper for errands? Just tell your trusted neighbor. We match you with verified locals instantly, hold your payments safely in escrow, and coordinate the details so you never have to worry.

**CTA button:**  
Request a service

**Pre-filled WhatsApp prompt (on click):**  
> "Hi, I need help with [tell me what you need]"

---

### Card 2 — Provider

**Headline:**  
Offer your skills

**Body:**  
Get found by your neighborhood. Whether you ride an okada, fix phones, sell food, or do repairs, list your skill once. Your neighborhood assistant finds clients who need you, manages matches, and routes payments straight to your wallet. You keep what you earn.

**CTA button:**  
Offer your skills

**Pre-filled WhatsApp prompt (on click):**  
> "Hi, I want to offer my skills. I do [your skill]"

---

### Card 3 — Business

**Headline:**  
Grow my business

**Body:**  
A digital storefront without the stress. Run a shop, kiosk, or restaurant? Kurukoo learns your products by importing your WhatsApp catalog and asking simple, friendly questions to keep stock updated. Your goods are recommended to neighbors searching for them — no dashboards, no tech setup, just natural chat.

**CTA button:**  
Grow my business

**Pre-filled WhatsApp prompt (on click):**  
> "Hi, I want to grow my business on Kurukoo"

---

## Living Profile Section (3 Cards)

**Section headline:**  
A helper who learns a little more every day.

**Subhead:**  
No forms. No questionnaires. Kurukoo learns from every conversation and gets smarter every time you come back.

---

### Card 1 — A Friend Who Remembers

**Headline:**  
Your profile lives and grows

**Body:**  
Whether you're ordering dinner, booking a carpenter, or offering your own skills, everything links to a single secure profile. It remembers your favorite spots, typical rates, and trusted people just like a real neighbor.

---

### Card 2 — Natural Conversations

**Headline:**  
Just talk. No menus. No buttons.

**Body:**  
Speak or type naturally in English, Pidgin, or local phrases. Your neighborhood guide understands your intent, coordinates deals, and handles the complicated math behind the scenes.

---

### Card 3 — Proactive Opportunities

**Headline:**  
Always looking out for you

**Body:**  
Always looking out for you. It surfaces timely alerts, nearby mobile vendors, and earning opportunities matching your skills — right when you need them.

---

## Nearby Pulse Section (Map Preview)

**Section headline:**  
See what's happening near you

**Subhead:**  
Live providers, AI agents, and deals on one map. Locations fuzzed to ~100m for privacy.

**Map preview element:**  
Interactive Leaflet.js map preview (half-height, non-scrollable on homepage — full experience on `/discover`).

**Mock pins visible in preview:**
- 🟢 Mama Nkechi — Selling fresh oranges, 150m away (mobile, live)
- 🔧 Sola Phone Repairs — Open now, 300m away (stationary)
- 🛵 Musa Keke Rider — Available, 200m away (mobile, live)
- 🤖 Kurukoo AI Agent — "Ask me about food delivery in Ikeja" (AI agent pin)

**CTA button below map:**  
[Explore the full map →] (links to `/:country/discover`)

**Privacy notice (small, below CTA):**  
Your exact location is never shared. Pins are fuzzed to ~100m. You control when you go live.

---

## "What Can You Do on Kurukoo?" Section (Scrollable Cards)

**Section headline:**  
Everything you need, one conversation away

**Subhead:**  
Swipe through what Kurukoo can do for you. Tap any card to start.

**Card design:**  
Horizontal scroll on mobile (swipeable, snap-scroll), grid on desktop (4-6 columns). Each card: emoji icon, title, subtle border, tap effect.

**Cards (grouped for scannability; rendered as one continuous scroll set):**

| # | Title | Icon | Links to | Group |
|---|---|---|---|---|
| 1 | Order Food | 🍜 | Explore: food ($55.4 flow) | Everyday Food |
| 2 | Get Groceries | 🛒 | Explore: groceries ($55.4 flow) | Everyday Food |
| 3 | Get Errands Done | 🏃 | Explore: errands | Everyday Home |
| 4 | Logistics & Delivery | 📦 | Explore: logistics | Everyday Home |
| 5 | Send Parcels | 📮 | Explore: logistics | Everyday Home |
| 6 | Fuel Delivered | ⛽ | Explore: errands | Everyday Home |
| 7 | Get a Ride / Mobility | 🛵 | Discover: mobility layer | Everyday Home |
| 8 | Home Services (plumbing, electrical, cleaning) | 🏠 | Explore: repairs-maintenance | Home & Repairs |
| 9 | Generator / Appliance Repairs | 🔧 | Explore: repairs-maintenance | Home & Repairs |
| 10 | Solar Installation | ☀️ | Explore: solar-energy | Home & Repairs |
| 11 | Auto Repair & Car Parts | 🚗 | Explore: automotive-mechanics | Home & Repairs |
| 12 | Access Health & Care | 🏥 | Explore: health-medical | Health, Money & Safety |
| 13 | Money Circle (Ajo/Esusu) | 💰 | Explore: finance-tax | Health, Money & Safety |
| 14 | Emergency Services / SOS | 🚨 | Explore: emergency-dispatch | Health, Money & Safety |
| 15 | Security & Close Protection | 🛡️ | Explore: emergency-dispatch (security) | Health, Money & Safety |
| 16 | Neighborhood Safety Alerts | 🚔 | Explore: community | Health, Money & Safety |
| 17 | Find Work / Gigs | 💼 | Explore: gigs | Earning, Building & Community |
| 18 | Sell Locally | 🏪 | Explore: classifieds ($55.4 flow) | Earning, Building & Community |
| 19 | Reach Customers / Advertise | 📢 | Explore: reach-reference | Earning, Building & Community |
| 20 | Cover Events / Get Paid | 🎥 | For You: Contributor | Earning, Building & Community |
| 21 | Sports, Matches & Clubs | ⚽ | Explore: sports-recreation | Earning, Building & Community |
| 22 | Community / Groups (Kuru Circles) | 👥 | Explore: events-entertainment | Earning, Building & Community |
| 23 | Get Price Alerts | 💲 | Explore: price-check | Info, Alerts & Entertainment |
| 24 | Check Key Services (NIN, CAC) | 📋 | Explore: government | Info, Alerts & Entertainment |
| 25 | Check Exam Results (JAMB/WAEC/NECO) | 🎓 | Explore: education-learning | Info, Alerts & Entertainment |
| 26 | Reload Airtime & Data | 📱 | Explore: communication | Info, Alerts & Entertainment |
| 27 | Universal Remote (TV/Devices) | 📺 | Resources guide | Info, Alerts & Entertainment |
| 28 | Know What's Happening / Events | 📅 | Discover: events layer | Info, Alerts & Entertainment |
| 29 | Hawkers Near You | 🥭 | Explore: cravings | Info, Alerts & Entertainment |
| 30 | Prayers & Spiritual | 🤲 | Explore: spiritual | Info, Alerts & Entertainment |

> **Developer note:** Cards are algorithmically ordered per user if logged in, based on `memory_profiles.inferred_roles` and `behavior_patterns`. For anonymous users, default order as listed above. Each card links to an Explore category page containing a chat UI that can onboard or assist the user.
>
> **Ordering-flow note:** The "Order Food", "Get Groceries", "Sell Locally", and parts/equipment cards all terminate in the **shared Universal Vendor Product Ordering Flow** (§55.4, BLUEPRINT) — extract (item+quantity+location) → `find_worker` match against `skills.business_products` → product card → escrow hold → optional `dispatch_rider` second leg → completion → escrow release → reorder signal. Cards must never be wired to a per-skill stub; the same flow serves suya vendors, bakeries, grocers, car-parts sellers, and storefronts.

---

## "Your Day with Kurukoo" Section (Timeline — replaces pricing)

**Section headline:**  
From morning move to evening chop — one conversation, all day long

**Subhead:**  
No apps to juggle. No tabs to switch. Just Kurukoo, from dawn to dusk.

**Timeline (6 moments, vertical on mobile, horizontal scroll on desktop):**

| Time | Moment | What Kurukoo does |
|---|---|---|
| 🌅 6:30 AM | Wake up | Morning nudge: "Ku Kurukoo! 3 okada riders near you. Need a lift?" |
| 🍲 12:00 PM | Lunch break | "Mama Nkechi is selling fresh oranges 150m away. Stop her or order?" |
| 🔧 2:00 PM | Get it fixed | "Your tap is leaking? I found a verified plumber in Ikeja. Book?" |
| 💰 4:00 PM | Hustle time | "New job: phone repair needed in Lekki. Accept? You'll earn ₦3,000." |
| 📦 6:00 PM | Send it | "Pick up package from Yaba, deliver to VI. ₦1,500. A rider is 200m away." |
| 🌙 9:00 PM | Wind down | "Tomorrow: 3 errands queued. I'll remind you. Sleep well." |

**CTA below timeline:**  
[Start your day with Kurukoo →]

> **Developer note:** This section replaces the previous pricing table on the homepage. The homepage's job is to sell the experience, not the price. The pricing page (`/:country/pricing`) remains accessible from the nav for users who want pricing details.

---

## How It Works Section (Teaser)

**Headline:**  
How Kurukoo works

**Subhead:**  
Three simple steps. No downloads. No complicated setup.

| Step | What happens | Visual |
|---|---|---|
| 1 | You send a message: "I need a plumber" | Phone → WhatsApp message |
| 2 | Kurukoo finds a trusted provider nearby, coordinates payment and delivery | Kurukoo matches + escrow |
| 3 | The job gets done. You confirm. Everyone gets paid. | Checkmark + payment release |

**CTA:**  
[See How It Works in detail →]

---

## Why Kurukoo Section (Brief)

**Headline:**  
Why Kurukoo?

**Body:**  
The world is moving to super apps — one app for everything. But in Africa, data is expensive, phones are basic, and downloading ten different apps is not an option. Kurukoo flips the model: one conversation replaces all of them. WhatsApp, USSD, or PWA — same conversation, same profile, same memory. Your payment is held in escrow until the job is done. 1 Point = ₦1. No expiry. Works on any phone.

> **Developer note:** The previous 5-differentiator cards (One Conversation, One Profile, Kurukoo Guarantee, Points That Matter, Works on Any Phone) have been absorbed into the Living Profile, Nearby Pulse, "What Can You Do?", and "Your Day with Kurukoo" sections above. This brief paragraph serves as a transition into Social Proof. If individual differentiator cards are still wanted, they can be added as a compact accordion below this paragraph.

---

## Social Proof Section

**Headline:**  
Trusted by thousands across Nigeria

**Body:**  
Kurukoo is live in Lagos, Abuja, Port Harcourt, Ibadan, and expanding. Providers are already earning. Customers are already saving time. Here's what they say.

---

### Provider Story (Agent Referral)

**Name:** Chinedu, Kuru Agent — Lagos  
**Story:**  
"I joined Kurukoo as an agent 3 months ago. I referred 12 providers to the platform and earned ₦45,000 in referral bonuses. Now I manage a network of 40+ active providers in my area."

---

### Consumer Story

**Name:** Aisha, Lagos  
**Story:**  
"I needed a plumber at 8pm on a Saturday. I sent a WhatsApp message to Kurukoo. Within 10 minutes, a verified plumber was on his way. Payment was held safely until he fixed the leak. No cash. No hassle."

---

### Live Activity Feed (Dynamic, via Nearby Pulse)

**Widget headline:**  
Happening now near you

**Content (auto-updated from backend):**  
> 🔧 3 plumbers active in Lagos Island  
> 🛵 12 okada riders available in Ikeja  
> 📦 5 delivery persons active in Victoria Island  
> 🍕 2 restaurants accepting orders in Yaba

*Numbers update in real time based on provider_presence data.*

---

## Final CTA Section

**Headline:**  
Ready to get going?

**Subhead:**  
Open WhatsApp. Send a message. That's it.

**Primary CTA:**  
[Open WhatsApp Chat]

**Secondary CTA:**  
[Try on USSD *7000#]

**Small print:**  
No download. No registration form. No credit card. Just start.

---

## Footer

| Column 1 | Column 2 | Column 3 |
|---|---|---|
| **Kurukoo** | **Discover** | **Resources** |
| Wake up. Get going. | Explore Categories | User Guides |
| utilityapp.ai.studio | Discover Map | Provider Guides |
| | For You | Business Guides |
| | Nearby Pulse | API Docs |

| Column 4 | Column 5 | Column 6 |
|---|---|---|
| **Product** | **Legal** | **Connect** |
| How It Works | Terms of Service | Contact Us |
| Pricing | Privacy Policy | Careers |
| Help Centre | Cookie Policy | Partners |
| | | Advertise |

| Column 7 |
|---|---|
| **Channels** |
| WhatsApp: 7000 |
| USSD: *7000# |
| PWA: kurukoo.com |

| Social | |
|---|---|
| Twitter / X | @kurukoo |
| Instagram | @kurukoo |
| LinkedIn | Kurukoo |

**Newsletter signup (optional):**  
> "Get updates about new features and provider stories."  
> [Email input] [Subscribe]

---

## Copy Guidelines

1. **Never use:** "loyalty tokens," "utility platform," "credit," "points system" as separate from Kurukoo.
2. **Always use:** "Points" with capital P. "Kurukoo Guarantee." "One profile. Every hustle."
3. **Tone:** Confident but not arrogant. Human but not slang-heavy. Clear but not dumbed-down.
4. **Length:** Headlines max 8 words. Body copy max 2 sentences per paragraph. Mobile-first.
5. **Accessibility:** All CTAs must work on feature phones (USSD) and smartphones (WhatsApp/PWA).
6. **No inline styles:** All visual styling must use CSS classes from shared stylesheets. No `style="..."` attributes in production HTML. See FRONTEND_PAGES.md §Responsive Design Mandate.
7. **Images:** All images must have `alt` text (auto-generated via §53.2.3 if missing), `loading="lazy"`, `width`/`height` attributes, and WebP/AVIF format with responsive `srcset`.
8. **Responsive:** All sections must work at 360px viewport first. Test at 360px, 768px, and 1024px breakpoints.

---

## File Structure

- `homepage_copy.md` — this document (v2.0)
- `how_it_works_copy.md` — detailed How It Works page content
- `FRONTEND_PAGES.md` — complete page registry for the entire ecosystem (all public, PWA, and admin pages)
- `pricing_copy.md` — pricing page content (to create)
- `explore_copy.md` — explore hub content (to create)
- `BLUEPRINT.md` — master technical blueprint (§32.6 for page architecture)

---

*Last updated: 2026-08-01 | Version 2.0 | Blueprint v5.55*
