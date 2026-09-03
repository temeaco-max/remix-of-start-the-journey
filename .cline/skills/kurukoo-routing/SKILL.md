---
name: kurukoo-routing
description: Use when defining or modifying Kurukoo's route structure, surface maps, path-to-section assignments, Express route handlers, or middleware chains. Triggers on adding new routes, changing canonical path assignments, mapping sections to canonical surfaces, or debugging route-to-service ownership conflicts. Preserves unified routing architecture.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Routing Guide

Kurukoo uses a unified routing architecture where all surfaces map through `k-app-surface`. Each route has a canonical owner and path assignment.

## When to Use

- Adding new route handlers in `src/routes/`
- Modifying `appSurfaceRoutes.ts` surface map
- Changing canonical path assignments in route definitions
- Mapping user-facing screens to system sections
- Debugging route-to-service ownership conflicts

## Route Map Architecture

The `appSurfaceRoutes.ts` contains the canonical surface map:

```typescript
const surfaceMap = new Map([
  ['desk', { title: 'Home', eyebrow: 'What matters now', ... }],
  ['discover', { title: 'Explore', eyebrow: 'Find something useful', ... }],
  ['topics', { title: 'Topics', eyebrow: 'Community context', ... }],
  ['requests', { title: 'Activity', eyebrow: 'Work in motion', ... }],
  ['reminders', { title: 'Reminders', eyebrow: 'Keep life on track', ... }],
  ['saved', { title: 'Saved', eyebrow: 'Keep useful context close', ... }],
  ['cart', { title: 'Cart', eyebrow: 'Prepare an economic action', ... }],
  ['tasks', { title: 'Work', eyebrow: 'Work to finish', ... }],
  ['connect', { title: 'Connect', eyebrow: 'Bring tools together', ... }],
  ['opportunities', { title: 'Opportunities', eyebrow: 'Ways to participate', ... }],
  ['wallet', { title: 'Wallet', eyebrow: 'Economic layer', ... }],
  ['points', { title: 'Points', eyebrow: 'Kurukoo economy', ... }],
  ['top-up', { title: 'Top Up', eyebrow: 'Add value', ... }],
]);
```

## Path-to-Section Mapping

Each resource has a canonical path assignment:

| Resource | Route Path | Section | Notes |
|----------|-----------|---------|-------|
| requests | `/requests` | requests | Mapped to Activity screen |
| tasks | `/tasks` | tasks | Mapped to Work screen |
| reminders | `/reminders` | reminders | Calendar-style |
| opportunities | `/opportunities` | opportunities | Community paths |
| connections | `/connections` | connect | Device integration |

**Rule**: The path pattern is always `/{resource}` and the section is always the resource name (except `requests→Activity`, `tasks→Work`).

## Route Handler Pattern

All route handlers follow this canonical pattern:

```typescript
router.get('/{resource}/:id', optionalAuthenticateUser, (req, res) => {
  const authReq = req as AuthRequest;
  
  if (!authReq.user?.phone) {
    return res.redirect(302, '/login');
  }
  
  const section = resource === 'connections' ? 'connect' : resource;
  const selected = surfaceMap.get(section as string) ?? surfaceMap.get('desk')!;
  const canonicalPath = canonicalPathBySection[section] ?? `/${resource}`;
  
  return res.render('app', { section, canonicalPath, ... });
});
```

## Ownership Conflicts

When two services claim ownership:

1. Check `canonicalAuthenticatedScreenSetManifest.json` for screen definitions
2. Verify route imports in `src/index.ts`
3. Confirm `app.ejs` uses unified `k-app-surface`
4. Run test contracts to verify consistency
5. Clean up any orphan convergence files

## Migration Checklist

When adding or modifying routes:

- [ ] Update surfaceMap in appSurfaceRoutes.ts
- [ ] Define screen in manifest if new
- [ ] Update app.ejs to use k-app-surface
- [ ] Update route authentication
- [ ] Add test contracts for new routes
- [ ] Remove any section-specific files
- [ ] Verify no duplicate ownership