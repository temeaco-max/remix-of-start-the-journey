# Kurukoo Homepage Copy — Marketing Reference

**Version:** 2.2
**Date:** 2026-08-15
**Status:** Aligned with the revised verified homepage implementation, preserved live sections, and no-fabrication preview policy
**Owner:** Kurukoo Brand  
**Blueprint reference:** `BLUEPRINT.md` v5.66, `CHAT_SURFACE_CONTRACT.md`

---

## Overview

This document records the current homepage copy reference for `kurukoo.ai.studio`. Future material brand changes require review; implementation must not present invented providers, distances, availability, activity, transactions, or social proof as live data.

**Positioning:** Kurukoo is a multi-sided utility product that uses conversational AI to deliver on-demand SaaS tools straight to the informal economy. It is built around the warm, highly personal positioning of a trusted neighbor who knows everyone in the area and is always ready to assist.

**Tone:** Bold, warm, human, neighborly. No engineering jargon. No "loyalty tokens." Avoid overly corporate SaaS speak, while clearly communicating that under the hood, Kurukoo is a powerful multi-sided utility.

---

## Header / Navigation

> **Aligned with the live `nav.ejs` partial and `publicRoutes.ts`.** The public header preserves the route-backed public navigation, lightweight dropdowns for Network and Resources, a Web Chat CTA, and a phone-auth account entry. No unsupported WhatsApp, USSD, SMS, App Store, or platform-mega-dropdown claim belongs in this reference.

| Item | Label | Live destination |
|---|---|---|
| Logo | Kurukoo | `/` |
| Nav link 1 | How it works | `/how-it-works` |
| Nav link 2 | What you can ask | `/explore` |
| Nav link 3 | Discover | `/discover` |
| Nav link 4 | Network | `/network` with Providers & businesses, Partners, Agents & contributors dropdown entries |
| Nav link 5 | Channels | `/channels` |
| Nav link 6 | Resources | `/resources` with Help, Blog & Media, Developers, and Safety, privacy & legal dropdown entries |
| Nav link 7 | About | `/about` |
| Right side | User account | `/login` |
| CTA button | Start chatting | `/chat` |

> **Developer note:** The public navigation is route-backed and uses shared stylesheet classes. Web Chat is the active conversational channel in this deployment; other channels remain unavailable until their adapters are configured.

---

## Hero Section

**Eyebrow:**
Your everyday, sorted.

**Headline:**
Tell Kurukoo what you need. It works out who or what can fulfil it.

**Subhead:**
Start with a conversation. Kurukoo can help directly, capture a request, organise a reminder, surface relevant options, or coordinate people and services when a fulfilment path is available.

**Primary CTA:**
[Start chatting] (links to `/chat`)

**Secondary CTA:**
[How it works] (links to `/how-it-works`)

**Trust line (small, under CTAs):**
⭐ Built for everyday coordination • Web Chat is available in this deployment • Privacy first

---

## Role Priming Section (3 Cards)

**Section headline:**
Useful whether you need help, offer it, or grow around it.

**Section intro:**
Kurukoo brings different pathways into one conversational surface instead of sending people to disconnected dashboards.

---

### Card 1 — Consumer

**Headline:**
Request a service

**Body:**  
Need a ride, repair, delivery, food, a worker, or something else? Tell Kurukoo what you need and let the conversation fill in the details.

**CTA button:**
Ask for help

**Pre-filled chat prompt (on click):**
> "Hi, I need help with [tell me what you need]"

---

### Card 2 — Provider

**Headline:**
Offer your skills

**Body:**  
Ride, repair, cook, build, deliver, design, teach, sell or help. List your skills once and let Kurukoo help people find you.

**CTA button:**
Offer a skill

**Pre-filled chat prompt (on click):**
> "Hi, I want to offer my skills. I do [your skill]"

---

### Card 3 — Business

**Headline:**
Grow my business

**Body:**  
Turn your products and services into a discoverable local offering without forcing you into a complicated dashboard.

**CTA button:**
Review business options

**Pre-filled chat prompt (on click):**
> "Hi, I want to grow my business on Kurukoo"

---

## Process Strip

A compact dark process strip appears immediately below the hero: **Start with a need**, **Kurukoo organises it**, and **See the useful step**. It explains the experience in user language and does not claim that matching, payment, fulfilment, or external delivery has already occurred.

## Living Profile Section (3 Cards)

**Eyebrow:**
A helper that learns carefully

**Section headline:**  
Living memory, useful context, under your control.

**Subhead:**
When you choose to keep information connected to your profile, Kurukoo can use it to make future conversations more useful.

The section uses a split layout matching the approved reference: a lavender illustration panel on the left with a centered dark **Living memory** core, delicate orbit rings, and floating labels for **preferences**, **locations**, and **your control**. The illustration is decorative and does not imply that any memory is stored unless the user has explicitly chosen and can review it.

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

**Eyebrow:**
Discover

**Section headline:**  
Find useful things around you.

**Subhead:**
When location context is relevant and available, Kurukoo can help you explore services, opportunities, events and other useful activity without pretending that a provider is live or verified when it is not.

**Map preview element:**  
Illustrative, non-live map preview on the homepage; the full discovery experience is available at `/discover`.

**Illustrative request pins:**
- 🍊 Food request
- 🔧 Repair request
- 🛵 Ride request
- 🤖 Kurukoo guide

> The preview must be visibly labelled illustrative and must not present names, distances, availability, ratings, provider counts, transactions, or activity as live data without a real source.

**CTA button below map:**  
[Explore the full map →] (links to `/discover`)

**Privacy notice (small, below CTA):**  
Illustrative preview. When active, exact locations remain private and you control when you go live.

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
From morning move to evening chop

**Subhead:**
One conversation can help coordinate the day without asking you to juggle apps or tabs.

**Illustrative timeline (6 moments, vertical on mobile, horizontal scroll on desktop):**

| Time | Moment | Example prompt |
|---|---|---|
| 🌅 6:30 AM | Wake up | "Need a lift this morning? Tell me where you are heading." |
| 🍲 12:00 PM | Lunch break | "Looking for lunch? Tell me what you would like to order." |
| 🔧 2:00 PM | Get it fixed | "Describe the repair and your area. I can help start the search." |
| 💰 4:00 PM | Hustle time | "Want to offer a skill? Tell me what work you do." |
| 📦 6:00 PM | Send it | "Share the pickup and delivery areas to coordinate a parcel." |
| 🌙 9:00 PM | Wind down | "Set up tomorrow’s request whenever you are ready." |

**CTA below timeline:**  
[Start your day with Kurukoo →] (links to `/chat`)

> **Developer note:** This section replaces the previous pricing table on the homepage. The homepage's job is to sell the experience, not the price. The pricing page (`/pricing`) remains accessible from the nav for users who want pricing details.

---

## Managed Public Advertising and Daily Picks

The homepage may render a bounded Daily Picks rail beside the One relationship section, plus managed sponsored placements beside **What can you ask?** and within the illustrative day. These placements are read from `adManager.ts` only when the campaign is first-party or approved, active, time-valid, associated with an approved local asset, and carries a disclosure, destination, CTA, and advertiser identity. A missing or inactive campaign leaves the placement empty rather than showing a fabricated advertisement.

The homepage does not hard-code private-number sales, premium features, provider offers, prices, availability, or activation claims. Copy such as **Privacy Phone Number Sales** or **Kurukoo Premium Features** can only appear as an admin-approved campaign asset, with the destination and availability state controlled by the campaign record and external readiness rules.

## Illustrative Day and Channels Order

The implemented homepage places the six-card **Your Day with Kurukoo** timeline after **What can you ask?**. Immediately below it, the homepage places the horizontal **Channels** section titled **One Kurukoo relationship, different access points.** Web Chat is shown as available in the current deployment; WhatsApp, Telegram, SMS, and USSD remain visibly not connected until their adapters are configured. This ordering keeps the channels relationship at the bottom of the day narrative while preserving truthful activation state.

## How It Works Section (Teaser)

**Headline:**
How Kurukoo works

**Subhead:**
Three simple steps. No downloads. No complicated setup.

| Step | What happens | Visual |
|---|---|---|
| 1 | You send a message: "I need a plumber" | Web Chat message |
| 2 | Kurukoo finds a trusted provider nearby, coordinates payment and delivery | Kurukoo matches + escrow |
| 3 | The job gets done. You confirm. Everyone gets paid. | Checkmark + payment release |

**CTA:**  
[See How It Works in detail →]

---

## Why Kurukoo Section (Brief)

**Headline:**
Why Kurukoo?

**Body:**  
Kurukoo keeps everyday coordination in one conversation. In this deployment, Web Chat is the supported conversational channel; the same profile and memory remain attached to the account. Eligible requests can follow the documented payment and escrow lifecycle when the required payment boundary is available. Points and provider settlement remain subject to the supported product and deployment configuration.

> **Developer note:** The previous 5-differentiator cards (One Conversation, One Profile, Kurukoo Guarantee, Points That Matter, Works on Any Phone) have been absorbed into the Living Profile, Nearby Pulse, "What Can You Do?", and "Your Day with Kurukoo" sections above. This brief paragraph serves as a transition into Social Proof. If individual differentiator cards are still wanted, they can be added as a compact accordion below this paragraph.

---

## Social Proof Section

**Status:** Not rendered on the current homepage.

> Do not add testimonials, customer counts, city coverage, earnings, response times, provider counts, ratings, or a “live activity” feed without verified source data, explicit consent where required, and a live rendering contract.

---

No testimonials, customer counts, city claims, earnings stories, response-time examples, or activity-feed copy is approved for the current homepage. Add any future social proof only after a verified source, rendering contract, consent review, and brand approval are documented.

---

## Final CTA Section

**Eyebrow:**
Ready when you are

**Headline:**
Tell Kurukoo what you need.

**Subhead:**
Start with the conversation. You do not need to know which service, provider or category should handle it.

**Primary CTA:**
[Start chatting] (links to `/chat`)

**Secondary CTA:**
[How it works] (links to `/how-it-works`)

**Small print:**
Web Chat is available in this deployment. Other channels remain unavailable until configured and independently verified.

---

## Footer

| Column 1 | Column 2 | Column 3 |
|---|---|---|
| **Kurukoo** | **Discover** | **Resources** |
| Wake up. Get going. | Explore Categories | User Guides |
| kurukoo.ai.studio | Discover Map | Provider Guides |
| | Web Chat | Business Guides |
| | Network | API Docs |

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
| Web Chat: `/chat` |
| Request Hub: `/web` |
| Other channels: unavailable in this deployment |

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
5. **Accessibility:** All CTAs must work with keyboard and touch input, preserve visible focus, and remain truthful about the active Web Chat channel. Do not claim feature-phone, WhatsApp, USSD, SMS, or app-store support without a configured adapter and runtime evidence.
6. **No inline styles:** All visual styling must use CSS classes from shared stylesheets. No `style="..."` attributes in production HTML. See FRONTEND_PAGES.md §Responsive Design Mandate.
7. **Images:** All images must have `alt` text (auto-generated via §53.2.3 if missing), `loading="lazy"`, `width`/`height` attributes, and WebP/AVIF format with responsive `srcset`.
8. **Responsive:** All sections must work at 360px viewport first. Test at 360px, 768px, and 1024px breakpoints.

---

## File Structure

- `homepage_copy.md` — this document (v2.1, reconciled with the live route and channel boundary)
- `how_it_works_copy.md` — detailed How It Works page content
- `FRONTEND_PAGES.md` — complete page registry for the entire ecosystem (all public, PWA, and admin pages)
- `pricing_copy.md` — pricing page content (to create)
- `explore_copy.md` — explore hub content (to create)
- `BLUEPRINT.md` — master technical blueprint (§32.6 for page architecture)

---

*Last updated: 2026-08-11 | Version 2.1 | Blueprint v5.55*


## Reusable Section Ownership Map

The homepage remains the concise entry point, while fuller versions of its reusable sections live on the page that owns the relevant behavior. **How it works** owns the three-step process summary and Capture/Coordinate/Confirm/Fulfil request boundaries. **Discover** owns the user-facing discovery cards and the privacy-aware map. **Network** owns the role pathways and evidence-before-fulfilment explanation. **Resources** owns the need-first examples and Living Memory/privacy guidance. **Advertise** owns campaign placement options and the approved-asset, disclosure, destination, and timing boundaries. **Channels** remains the owner of access-point readiness and activation requirements.
