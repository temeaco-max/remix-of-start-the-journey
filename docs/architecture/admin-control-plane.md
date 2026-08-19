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

All are behind `authenticateAdmin`.

The projection exposes:

- operational counts
- integration implementation/activation readiness
- notification queue state
- Web/PWA/native/Admin surface coverage
- admin module ownership
- pilot/readiness state
- the shared status-language contract

## Truth and activation

Admin must distinguish implementation from activation. A code path, credential or feature flag is not proof that an external provider/device is live.

The UI uses explicit states such as:

- Ready
- Pending
- Needs activation
- Needs device verification
- Verified
- Connected
- Not connected
- Unavailable
- Failed

External activation remains evidence-gated.

## Client convergence

`clientSurfaceRegistry` is the canonical inventory of client surfaces. The Admin Control Room consumes it directly so new Web, PWA or native surfaces become visible to operators without creating a second inventory.

Native surfaces are represented as device-verification work until actual device evidence exists. External integrations are represented separately from external activation.

## Visual contract

Admin follows the Kurukoo cross-platform design system:

- Inter for operational/body text
- Space Grotesk for headings and prominent values
- warm cream/white/charcoal/terracotta palette
- restrained cards and status chips
- accessible 44px-oriented controls
- responsive layout rather than a desktop-only dashboard
- truthful status language instead of decorative success claims

`public/css/admin-pages/admin-base.css` remains the shared admin stylesheet. The Control Room adds `admin-platform-convergence.css` for the cross-platform projection.

## Existing admin surfaces

The module registry intentionally points to existing admin pages for growth/content/platform functions while progressively converging their ownership and visual language. Those pages remain behind the shared admin authentication boundary.

The long-term direction is convergence, not wholesale duplication: existing admin capabilities should be moved onto the canonical platform projection and owning services as they are touched.
