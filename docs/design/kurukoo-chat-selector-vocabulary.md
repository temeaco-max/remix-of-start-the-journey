# Kurukoo High-Fidelity Selector Vocabulary and Chat Compliance

This file is the implementation reference for agents working on the confirmed Kurukoo Web Chat screen set. These selectors already belong to the canonical public Chat/workspace styling authorities. Agents should reuse them rather than inventing parallel shells or CSS names.

## Shared shell and navigation

| Area | Reusable selectors |
|---|---|
| Global navigation and brand | `.navbar`, `.navbar-inner`, `.logo`, `.logo-icon`, `.logo-text`, `.nav-links`, `.nav-link`, `.nav-actions-right`, `.nav-user-btn`, `.nav-chat-btn`, `.mobile-toggle` |
| Workspace shell | `.workspace-shell`, `.workspace-sidebar`, `.workspace-main`, `.workspace-header`, `.workspace-header-copy`, `.workspace-header-actions`, `.workspace-content`, `.workspace-brand`, `.workspace-nav`, `.workspace-nav-icon`, `.workspace-account` |
| Chat template shell | `.chat-template-shell`, `.chat-sidebar`, `.chat-main`, `.chat-inspector`, `.chat-header`, `.chat-header-actions` |

## Conversation and composer

| Area | Reusable selectors |
|---|---|
| Message stream | `.chat-scroll`, `.message`, `.message-body`, `.message-actions`, `.message-action-btn`, `.message-capability-status`, `.message-arrived` |
| Composer | `.composer`, `.composer-wrap`, `.composer-footer`, `.composer-quick-actions`, `.composer-btn`, `.ask-cta`, `.ask-mark` |
| Attachment and voice affordances | `.attachment-btn`, `.voice-btn`, `.send-btn`, `.stop-generation-btn`, `.k-icon` |
| Conversation state | `.typing-indicator`, `.streaming-message`, `.empty-state`, `.error-state`, `.retry-btn`, `.notification-popover` |

## Context inspector and workspace panels

| Area | Reusable selectors |
|---|---|
| Inspector | `.inspector`, `.inspector-header`, `.inspector-label`, `.inspector-card`, `.inspector-note`, `.inspector-list`, `.inspector-menu-link`, `.inspector-link-icon`, `.inspector-link-copy`, `.inspector-link-chevron` |
| Context surfaces | `.context-intro`, `.context-card`, `.task-context-card`, `.task-context-list`, `.memory-context-card`, `.nearby-context-card`, `.connect-context-card`, `.proactive-context-list`, `.agent-goal-card` |
| Workspace content | `.workspace-hero-card`, `.workspace-grid`, `.metric-card`, `.balance-card`, `.workspace-panel`, `.panel-heading`, `.status-pill`, `.empty-workspace`, `.empty-icon`, `.workspace-data-list`, `.workspace-data-card`, `.workspace-data-card-footer` |
| Cart / checkout-like state | `.cart-panel`, `.cart-summary`, `.workspace-button`, `.workspace-text-action`, `.workspace-notice`, `.confirmation-card`, `.payment-status`, `.evidence-summary` |

## Discovery, task and operational cards

| Area | Reusable selectors |
|---|---|
| Tasks | `.task-context-card`, `.task-context-list`, `.task-card`, `.task-status`, `.task-actions`, `.workspace-tabs` |
| Discovery | `.discover-intro-cards`, `.discover-intro-card`, `.discover-layout`, `.discover-map-box`, `.discover-network-list`, `.layer-chips-bar`, `.layer-chip`, `.radar-list` |
| Cards and status | `.network-card`, `.capability-card`, `.status-pill`, `.badge`, `.sponsored-badge`, `.workspace-eyebrow`, `.workspace-kicker`, `.inspector-label` |
| Admin/agents | `.header-bar`, `.container`, `.card`, `.table`, `.badge-active`, `.badge-paused`, `.runtime-readiness-card`, `.runtime-state`, `.runtime-readiness-grid`, `.agent-avatar`, `.agent-actions` |

## Icon and typography rules

The only shared icon primitive is the canonical SVG sprite at `/icons/kurukoo-icons.svg`, rendered through `.k-icon` and, for compact controls, `.k-icon--sm`. Approved symbols include `chat`, `request`, `discover`, `reminder`, `safety`, `channels`, `saved`, `settings`, `help`, `points`, `package`, `ride`, `food`, `work`, `alert`, `mic`, `send`, `attach`, `copy`, `retry`, `more`, `edit`, `trash`, `stop`, `close`, `chevron-left`, `menu` and `plus`.

Use the existing shared typography tokens: Inter for body and interface copy, Space Grotesk for headings and strong labels. Use the established warm cream, white, charcoal and terracotta tokens. Do not add emoji or Unicode glyphs as replacement icons.

## Main Chat compliance checklist

The canonical Chat implementation passes the current structural checks when it retains the left navigation/sidebar, central message stream and composer, right Context inspector, canonical SVG icons, accessible controls, stop-generation path, attachment affordances, responsive overflow protections, and exact-context surface routing. Agents must preserve `.chat-template-shell` and the existing Chat DOM/data attributes when refining presentation.

The Chat implementation must remain a conversation-first surface. Workspace views may be loaded into the central area, but must return to the same conversation and exact canonical object. Natural language stays natural; explicit protocol actions preserve exact object identity. No visual change may claim external payment, provider availability, delivery, verification, channel connection, notification delivery or fulfilment without canonical evidence.

## Forbidden implementation drift

Agents must not create a second Chat component, router, memory system, request lifecycle, discovery authority, checkout engine or notification authority. They must not replace truthful states such as `Setup required`, `Not connected`, `Pending`, `Sandbox` or `Ready for activation` with `Live`, `Connected`, `Verified`, `Delivered` or `Complete` unless independently proven. They must not introduce inline styles, one-off page CSS, random gradients, generic dashboard shells or oversized title treatments.


## Remaining high-fidelity surface pass

The next implementation slice targets the existing `.cart-panel`, `.cart-summary`, `.storefront-execution-evidence` and `.storefront-quote` commerce/confirmation owners in the Chat and workspace styles, the `.workspace-header`, `.workspace-hero-card`, `.workspace-panel`, `.panel-heading` and `.status-pill` workspace owners, and the existing `.card`, `.admin-card`, `.runtime-readiness-card`, `.badge`, `.header-bar`, `.k-card` and `.k-icon` operational owners. Partner and agent surfaces must reuse these established card, status and icon authorities rather than creating new dashboards or commerce engines.

The visual goal is a quieter high-fidelity hierarchy: one clear title and state, one evidence or context band, one primary action group, and restrained supporting copy. Checkout and confirmation visuals remain state mirrors; loading a panel must never imply a payment, quote, inventory, provider, delivery or fulfillment success.
