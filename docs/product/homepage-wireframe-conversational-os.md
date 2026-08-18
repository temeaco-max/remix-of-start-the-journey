# Kurukoo Homepage Wireframe — Conversational Operating System Positioning

**Status:** Proposed and aligned with the current repository implementation
**Primary route:** `/`
**Primary audience:** People arriving with an everyday need, providers offering capability, businesses seeking discoverability and contributors participating in the network.

## Positioning statement

> **Kurukoo is a conversational operating system for coordinating everyday intentions with people, services, products, places and bounded agents.**

The Homepage should communicate the experience without claiming that every participant, provider, channel, payment rail or fulfilment path is active. The user should understand that Kurukoo can help directly, preserve context, discover options and coordinate supported requests, while external outcomes remain evidence-dependent.

## Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Kurukoo mark     Explore   Channels   About   Help      Sign in  Get started │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  YOUR EVERYDAY, SORTED.                    ┌──────────────────────────────┐ │
│  Tell Kurukoo                              │ Kurukoo                      │ │
│  what you need                             │ Your conversational assistant│ │
│                                             │                              │ │
│  Start with the conversation.              │ “I need a generator          │ │
│  Kurukoo helps make sense of what you      │  delivered tomorrow.”        │ │
│  need, keeps the context together and      │                              │ │
│  shows the next useful step — whether      │ “I can capture the request,  │ │
│  that is advice, a reminder, discovery or  │  check supported options     │ │
│  a supported request.                       │  and show what needs         │ │
│                                             │  confirmation.”               │ │
│  [Start with the conversation]             │                              │ │
│  [Explore sources]                         │ Useful next steps            │ │
│                                             │ Connected context             │ │
│  Conversational first   Connected context │ Ask Kurukoo anything…        │ │
│  Private by design                         └──────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ 01 Start with a need  →  02 Kurukoo organises it  →  03 See the useful step │
├──────────────────────────────────────────────────────────────────────────────┤
│ ONE CONVERSATION, EVERY ROLE                                                │
│ Useful whether you need help, offer it, or grow around it.                  │
│ [Request a service] [Offer your skills] [Grow your business]                │
├──────────────────────────────────────────────────────────────────────────────┤
│ AGENTIC STOREFRONT · DEMO                                                   │
│ Select scenario: [Find food] [Arrange a repair] [Plan a ride]               │
│ Conversation → request details → supported options → confirmation boundary  │
├──────────────────────────────────────────────────────────────────────────────┤
│ A HELPER THAT LEARNS CAREFULLY                                               │
│ [Living memory / preferences / locations / your control visual]             │
│ Living memory, useful context, under your control.                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ ONE KUROKOO RELATIONSHIP                                                     │
│ [Ask Kurukoo] [Keep life moving] [Use the network]       [Daily Picks]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ DISCOVER                                                                      │
│ Find useful things around you.                                               │
│ Approximate/source-attributed discovery preview → [Open Discover]           │
├──────────────────────────────────────────────────────────────────────────────┤
│ WHAT CAN YOU ASK?                                                            │
│ Start with the need, not a category.                                         │
│ [Food] [Getting somewhere] [Repairs] [Delivery] [Work] [Reminders] …         │
│ [Explore what you can ask]                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ AN ILLUSTRATIVE DAY WITH KURUKOO                                             │
│ Morning move → lunch → repair → hustle → parcel → tomorrow’s request         │
├──────────────────────────────────────────────────────────────────────────────┤
│ CHANNELS                                                                      │
│ One Kurukoo relationship, different access points.                           │
│ Web Chat · Available now | WhatsApp · Not connected | Telegram · Not connected│
├──────────────────────────────────────────────────────────────────────────────┤
│ Tell Kurukoo what you need. Start with the conversation.                     │
│ [Start chatting]                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mobile wireframe

The mobile layout remains one-handed and conversation-first. The hero keeps the mark, headline, one primary CTA and the concise positioning paragraph visible without requiring a desktop-style split. The illustrative Chat panel follows the CTA, then the process strip becomes a horizontal snap rail. Role cards, storefront demo, memory, Discover, capability rail, day timeline, channels and final CTA remain in the approved order, each using a single-column composition and 44px minimum actions.

## Refactor rules

The Homepage must not claim that Kurukoo has found a provider, confirmed stock, secured a price, completed payment, dispatched an item or delivered a message unless the canonical service has independently recorded that state. Illustrative examples must be labelled as previews or demos. Public pages should use consumer language; architecture terms such as Brain, agent runtime, Economic Request, orchestration and provider adapter belong in How it works, developer documentation or operations surfaces.

The existing homepage already contains the correct major sections and route-backed CTAs. The required change is therefore a **positioning and truth-alignment refactor**, not a replacement of the page. The shared public header, exact Kurukoo mark, warm palette, Inter/Space Grotesk typography, icon sprite, ad disclosure rules, channel states and footer remain authoritative.

## Implementation mapping

| Wireframe area | Current owner | Required action |
|---|---|---|
| Hero and Chat preview | `views/index.ejs`, `public/css/site-authority.css` | Updated positioning copy; preserve illustrative request boundary. |
| Process strip | `views/index.ejs` | Keep; language is already user-facing and truthful. |
| Role paths | `views/index.ejs` | Keep; ensure provider/business links remain route-backed. |
| Storefront demo | `views/index.ejs`, `public/js/kurukoo-home.js` | Keep as illustrative; never imply live inventory or payment. |
| Living memory | `views/index.ejs` | Keep “under your control” language and route to Memory/Settings from authenticated surfaces. |
| Discover/Pulse | `views/index.ejs`, `/discover` | Keep source attribution, approximate location and no-live-provider disclaimer. |
| What can you ask | `views/index.ejs`, `/explore` | Keep examples as conversation starters, not separate transaction engines. |
| Day and Channels | `views/index.ejs` | Keep order and explicit Web Chat versus setup-dependent channels. |
| Final CTA/footer | `views/index.ejs`, footer partial | Keep conversation-first return path. |

## Acceptance criteria

A Homepage update is accepted when the hero explains Kurukoo in user language, the page preserves the current approved content sections, every CTA resolves to a live route, illustrative states are visibly non-live, external channels remain truthfully labelled, ads remain disclosed, no inline CSS is introduced, and the public runtime/accessibility/CSS contracts pass.
