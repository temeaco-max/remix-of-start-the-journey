# Sharp Dependency Security Advisory

**Date:** 2026-08-29
**Status:** TRACKED — Owner action required
**Reference:** SECURITY_AUDIT_STATUS.md — Remaining Security Work, Item 2

## Issue

The production dependency audit (`npm audit --omit=dev`) reports two
high-severity advisory paths through:

```
@huggingface/transformers → sharp
```

The `sharp` package has known security advisories that affect the version
transitively resolved by `@huggingface/transformers` (^3.7.2).

## Current Mitigation

The repository currently pins `sharp` to `0.35.3` via npm `overrides`:

```json
"overrides": {
  "sharp": "0.35.3"
}
```

This override is in place but is **not** a permanent fix. It masks the
underlying advisories rather than resolving the root cause through a
compatible `@huggingface/transformers` release.

## Required Owner Actions

1. **Monitor `@huggingface/transformers` releases** — Watch for a version
   that natively depends on a fixed `sharp` version (≥ 0.35.3 or a
   patched 0.36.x). The current `^3.7.2` range may resolve to an
   unpatched version in some lockfile configurations.

2. **Verify compatibility** — When a compatible `transformers` release is
   available, update the dependency and remove the `overrides.sharp` pin
   only after confirming the full test suite passes:
   ```bash
   npm run lint
   npm run build
   npm run test:routes
   npm run audit:security
   ```

3. **Do NOT force an untested override** — Forcing a sharp version change
   without full compatibility testing may break image processing, CSS
   optimization, or artifact transcoding pipelines.

## Affected Areas

| Area | Impact | Notes |
|---|---|---|
| CSS optimization (`optimize-css.mjs`) | Low | May use sharp for image optimization |
| Artifact processing (voice notes, images) | Low | Uses sharp for format conversion |
| Build pipeline | Medium | CSS optimization step during `npm run build` |

## Tracking

This note will be removed once `@huggingface/transformers` releases a
version with a safe `sharp` dependency and the override is no longer
needed.
