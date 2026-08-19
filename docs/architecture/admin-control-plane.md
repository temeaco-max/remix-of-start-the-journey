# Kurukoo Admin Control Plane

## Purpose

The Admin area is the operator control plane for the same Kurukoo platform used by Web, PWA, iOS and Android. It is not a second application backend and it does not own a second copy of platform truth.

## Canonical flow

```text
Web / PWA / iOS / Android
          │
          ▼
     Canonical API
          │
          ├── identity / sessions
          ├── conversation / agent runtime
          ├── Economic Requests / orders / payment
          ├── providers / evidence / trust
          ├── notifications / channels
          ├── content / Topics / discovery
          └── clientSurfaceRegistry
          │
          ▼
    Admin Control Plane
```

Admin reads canonical state and invokes existing owning services for mutations. Admin must not create a parallel provider registry, conversation store, identity system, payment state, notification queue or fulfilment engine.

## Platform projection

Protected endpoints:

- `GET /api/admin/platform/overview`
- `GET /api/admin/platform/surfaces`
- `GET /api/admin/platform/modules`
- `GET /api/admin/platform/health`

All are behind `authenticateAdmin`.

The projection exposes operational counts, integration implementation/activation readiness, notification queue state, Web/PWA/native/Admin surface coverage, module ownership, pilot/readiness state and the shared status-language contract. The full canonical `pilotReadiness.categories` tree is exposed through the Admin overview so operators see the same deployment truth used by the platform itself.

The health endpoint only describes internal platform/admin health. It never upgrades a provider credential, device QR, payment configuration or integration implementation into external-live evidence.

## Mutation boundary

Admin mutation handlers must call canonical domain services rather than directly changing lifecycle-owned tables. The dispute console now follows this rule through `adminDisputeRoutes.ts` → `disputeResolution.ts` → `escrow.ts` and the Economic Request lifecycle. The canonical dispute router is mounted ahead of the legacy Admin router, so existing Admin URLs continue to work while mutations use the domain owners.

The same boundary applies to payment, provider, notification, channel, conversation and fulfilment operations: Admin is an operator interface over their canonical service, never a replacement owner.

## Truth and activation

Admin must distinguish implementation from activation. A code path, credential or feature flag is not proof that an external provider/device is live.

The UI uses explicit states such as Ready, Pending, Needs activation, Needs device verification, External dependency, Verified, Connected, Not connected, Unavailable and Failed.

External activation remains evidence-gated.

## Client convergence

`clientSurfaceRegistry` is the canonical inventory of client surfaces. The Admin Control Room consumes it directly so new Web, PWA or native surfaces become visible to operators without creating a second inventory.

Native surfaces are represented as device-verification work until actual device evidence exists. External integrations are represented separately from external activation.

## Shared Admin browser boundary

All existing `public/admin/*.html` pages load `public/admin/admin-auth.js`. That shared boundary:

1. forwards the Admin token to protected Admin API requests;
2. clears an expired/invalid token and returns the operator to Admin login;
3. injects one responsive Admin navigation/control shell across legacy and canonical Admin pages;
4. loads the shared Kurukoo Admin visual convergence stylesheet;
5. reports internal platform-health state without exposing credentials.

This avoids a second navigation, authentication or visual system for every older Admin page.

## Visual contract

Admin follows the Kurukoo cross-platform design system:

- Inter for operational/body text
- Space Grotesk for headings and prominent values
- warm cream/white/charcoal/terracotta palette
- restrained cards and status chips
- accessible 44px-oriented controls
- responsive layout rather than a desktop-only dashboard
- truthful status language instead of decorative success claims

`public/css/admin-pages/admin-base.css` remains the shared legacy Admin stylesheet. The Control Room adds `admin-platform-convergence.css`, while `admin-convergence-shell.css` provides the cross-page control-plane shell and dependency-readiness states.

## Existing admin surfaces

The module registry points to existing admin pages for growth/content/platform functions while progressively converging their ownership and visual language. Those pages remain behind the shared admin authentication boundary and now inherit the same operator navigation, health indicator and session-expiry handling.

The long-term direction is convergence, not wholesale duplication: existing Admin capabilities should be moved onto the canonical platform projection and owning services as they are touched.
