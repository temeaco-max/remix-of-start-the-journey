# Kurukoo Brand Primitives

This is the site-wide source-of-truth contract for logos and icons.

## Logo

Use the canonical brand asset family from `public/assets/brand/`.

Context rules:
- Public header: wordmark + icon at one shared optical size.
- Authenticated Desk header: same brand family, smaller compact treatment.
- Chat: same compact brand treatment; never redraw the logo.
- Auth modal: centered compact brand lockup.
- Admin: canonical brand mark with operator-context treatment; no alternate logo.
- Footer: full wordmark where space permits.
- PWA/native launcher: app icon asset, not a browser header logo.

## Icon system

Use `public/icons/kurukoo-icons.svg` / the shared icon component family.

Context sizes:
- 16px: metadata/inline status.
- 18px: compact secondary actions.
- 20px: standard navigation/action.
- 24px: primary interactive/header icon.
- 28–32px: feature/category or prominent empty-state icon.
- 40px+: only for deliberate hero/empty-state composition.

Do not mix unrelated icon libraries or redraw existing Kurukoo icons at route level.

All interactive icons require accessible labels or visible text; decorative icons use `aria-hidden`.

## Consistency checks

A visual surface is considered brand-complete only when:
- the correct canonical asset is used;
- optical size is appropriate to its context;
- icon stroke/weight belongs to the shared family;
- hover/focus/disabled states use shared primitives;
- light/dark treatment is consistent;
- the same semantic feature uses the same icon everywhere possible.
