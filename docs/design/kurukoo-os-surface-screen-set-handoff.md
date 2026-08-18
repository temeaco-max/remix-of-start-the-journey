# Kurukoo OS Surface Screen-Set Handoff

This document maps the high-fidelity visual boards to the repository’s canonical surfaces and identifies the shared implementation owner for each set.

| Design set | Primary repository surface | Shared implementation owner |
|---|---|---|
| Frontend website | `views/index.ejs`, public Explore, Channels, About and Help routes | `site.css`, shared public templates and `publicRoutes.ts` |
| Admin | `public/admin/*.html`, admin route APIs | `admin-pages/admin-base.css`, admin route/service authorities |
| Web Chat | `public/chat/index.html`, `kurukoo-primary-chat.js` | `kurukoo-chat.css`, `kurukoo-workspace.css`, canonical Chat services |
| Partners | provider/profile, opportunities, contributor and business workspace surfaces | provider entity, opportunity, trust, evidence and workspace authorities |
| Agents | admin agent console, agent directory, goal queue and runtime detail | `aiAgentService`, `agentRuntime`, agent control policy and admin surfaces |
| Checkout | Chat cart, sourced offer, request review and payment boundary | cart, economic request, order, payment and execution boundaries |
| Confirmations | Chat action proposal, notification center and continuation surfaces | interaction policy, canonical executor, notification queue and evidence |
| Nearby Radar | Discover map/list, Radar status, Go Live and opportunity invitation | discovery network, location consent, presence/radar and opportunity owners |

## Implementation rules

All sets use the same tokens and component semantics. A `Card`, `StatusPill`, `Ask`, `WorkspaceHeader`, `NotificationCard`, `ContextCard`, `OfferCard`, `EvidenceRow`, `BottomSheet` and `NavigationItem` must not be recreated separately for each role or platform. The same canonical state determines the visual variant.

The UI must communicate truth through explicit labels. `Accepted internally`, `Waiting for provider confirmation`, `Not delivered`, `Verified`, `Price pending confirmation`, `Source attributed`, `Not a Kurukoo provider yet`, `Needs activation` and `Paused` are different states and must never share one generic success treatment.

Partners, agents and administrators receive denser information architecture, but they still use the same brand, spacing, border, status, focus and responsive rules as consumer Chat. Checkout remains a request and confirmation flow until payment and seller/provider evidence are independently available. Nearby Radar shows approximate, source-attributed discovery and explicit location consent; the map is only a presentation layer.

## Pixel-accuracy acceptance

The implementation is accepted when each surface uses the shared Inter/Space Grotesk typography, warm cream/white/charcoal/terracotta palette, 4px spacing rhythm, 44px interaction targets, 12–16px card radii, visible focus states, reduced-motion support and the correct status semantics. Desktop layouts must collapse without horizontal overflow at tablet widths and mobile layouts must preserve the composer, primary action and back-to-conversation path.
