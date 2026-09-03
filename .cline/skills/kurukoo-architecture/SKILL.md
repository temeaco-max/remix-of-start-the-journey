---
name: kurukoo-architecture
description: Use when making architectural decisions about Kurukoo's unified visual system, service boundaries, canonical data models, component ownership, convergence file migration, k-app-surface primitives, screen manifest changes, or route-to-service mappings. Triggers on route handler conflicts, new screen definitions, service ownership disputes, or legacy convergence file cleanup. Preserves the assistant-first experience.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Architecture Guide

Kurukoo is a service that helps people get things done. This skill governs architectural decisions that affect the unified experience across Chat, Home, Explore, Activity, and Work surfaces.

## When to Use

- Migrating from section-specific implementations to unified primitives (e.g., k-app-surface)
- Resolving conflicts between different route handlers or services
- Adding new screens or modifying the screen set manifest
- Cleaning up legacy convergence files or CSS/JS
- Determining component/service ownership

## Key Principles

### 1. Unified Visual System

**Single Source of Truth**: Use `k-app-surface` primitive instead of section-specific CSS/JS files. The pattern is:

```javascript
// BEFORE (deprecated)
<k-app-section-tasks class="k-app-section-tasks">

// AFTER (unified)
<k-app-surface section="tasks" state={state} surfaces={surfaces}>
```

**Rule**: Never introduce new section-specific CSS/JS files. All visual styling should come from shared primitives.

### 2. Screen Manifest Architecture

The `canonicalAuthenticatedScreenSetManifest.json` defines:

```json
{
  "screenName": "Activity",
  "section": "requests",
  "path": "/requests",
  "title": "Activity"
}
```

**Rule**: Screen names are user-facing (Activity, Work), sections are system-facing (requests, tasks).

### 3. Convergence File Cleanup

Convergence files are **deprecated**. If you find files matching:

- `kurukoo-*-convergence.css`
- `kurukoo-*-convergence.js`

Remove them and migrate to unified primitives. Verify with tests before and after.

### 4. Route-to-Service Ownership

Each route should have a single canonical owner:

| Route | Service Owner | Component Owner |
|-------|---------------|-----------------|
| `/tasks` | microTasks.ts | k-app-surface |
| `/requests` | calendarService.ts | k-app-surface |
| `/memory` | memoryProfile.ts | k-app-surface |
| `/contacts` | memoryRelationship.ts | k-app-surface |
| `/discover` | platformFeatureRegistry.ts | k-app-surface |

## Migration Checklist

When migrating from section-specific to unified:

- [ ] Update app.ejs to use single `k-app-surface` section
- [ ] Remove conditional section blocks from views
- [ ] Update route handlers to use unified service
- [ ] Remove section-specific CSS/JS files
- [ ] Update test contracts to verify absence of section-specific artifacts
- [ ] Update screen manifest if renaming screens