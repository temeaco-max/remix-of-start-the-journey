---
name: kurukoo-release
description: Use when preparing Kurukoo releases, cleaning up deprecated convergence files, running test suites, or verifying unified visual system compliance. Triggers on convergence file cleanup, test suite execution, screen manifest verification, or release preparation tasks. Preserves release integrity and canonical service ownership.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Release Guide

Preparing Kurukoo releases requires verifying the unified visual system, running test contracts, and ensuring canonical service ownership.

## When to Use

- Cleaning up deprecated convergence files
- Running the full test suite before release
- Verifying no section-specific CSS/JS remains
- Checking screen manifest updates
- Preparing release notes for visual system migrations

## Pre-Release Checklist

### 1. Run All Test Contracts

```bash
node scripts/test-notifications-screen-convergence.mjs
node scripts/test-requests-screen-convergence.mjs
node scripts/test-task-routes.mjs
node scripts/test-memory-screen-convergence.mjs
node scripts/test-contacts-screen-convergence.mjs
node scripts/test-discover-surface.mjs
node scripts/test-html-escape-helpers.mjs
```

**Rule**: All tests must pass before release. Any failure blocks release.

### 2. Verify Unified Visual System

Check for section-specific artifacts:

```bash
grep -r "k-app-section-" views/
grep -r "kurukoo-*-convergence" views/
find public/css -name "*convergence*"
find public/js -name "*convergence*"
```

**Rule**: No section-specific patterns allowed in views. No convergence files in public/

### 3. Clean Up Deprecated Files

Remove these file types:

- `public/css/kurukoo-*-convergence.css`
- `public/js/kurukoo-*-convergence.js`
- `src/services/*convergence*`
- `scripts/test-*-convergence*` (unless actively used)

**Rule**: Run `find . -name "*convergence*" | grep -v node_modules | grep -v dist` to find all convergence files. Remove any not in active use.

### 4. Verify Screen Manifest

Screen names must be user-facing (Activity, Work). Section names are system-facing (requests, tasks).

### 5. Verify Route Mappings

`/work` is an alias for `/tasks`. Both map to the canonical `tasks` section.

### 6. Verify Test Contracts

Ensure test files reference the unified system:

```javascript
// Good - tests unified system
assert(template.includes('k-app-surface'), 'Uses unified app surface');
assert(!template.includes('kurukoo-tasks-convergence'), 'No section-specific CSS');
```

## Migration Notes

When migrating from section-specific to unified:

- Screen names change (Requests → Activity, Tasks → Work)
- Sections remain the same (requests, tasks)
- Routes stay the same (/requests, /tasks, /work)
- Visual system changes (k-app-surface replaces section-specific CSS)
- Test contracts update to verify unified system