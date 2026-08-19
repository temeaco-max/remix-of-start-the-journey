# Partners Screen-Set Convergence Audit — 2026-08-19

## Initial finding

The current `/partners/` surface is a generic public marketing grid: centered “Grow with Kurukoo” heading, six partner cards and the shared public footer. The supplied authoritative screen set is a distinct partner operating workspace with a terracotta Partners identity, a left onboarding/benefit rail, a four-stage desktop progression, a mobile Opportunities preview, profile/capability/availability controls, opportunity lifecycle cards, evidence requests, payment pacing and impact/credibility panels.

The current route therefore does not merely need spacing adjustments. It is the wrong surface composition and lacks the screen-set’s partner workflow hierarchy. The convergence must preserve truthful states: invited, claimed, executing, evidence required, payment pacing confirmation and impact data must remain state-driven and must not imply provider earnings or completed opportunities without canonical evidence.

## Current route evidence

The current template is `views/partners.ejs`, using `page-container`, `page-header-center`, `partner-grid`, `partner-card`, `partner-title`, `partner-text` and `partner-link` from `public/css/site.css`. Its links route to generic Chat prompts, `/contact` and `/api-docs`. It has no partner onboarding state, capability profile, opportunity list, evidence queue, impact dashboard or mobile preview.

## Authoritative regions to implement

The supplied screen set contains: a terracotta Partners brand rail; “Every capability. Every opportunity. Real impact.” positioning; four numbered stages; onboarding welcome/profile capture; capability and availability profile; opportunities with lifecycle tabs and source-attributed cards; impact dashboard; work-in-progress and evidence-required queues; payment pacing confirmation; trust-building checklist; visible impact and verified credibility panels; and a mobile Opportunities preview.

## Implementation and verification

The generic six-card grid was replaced with a partner workspace composition matching the screen-set hierarchy: terracotta Partners identity rail, four numbered stages, onboarding panel, capability and availability profile, opportunity lifecycle cards, evidence and payment sections, impact dashboard, trust-building checklist and visible-impact footer. The mobile Opportunities preview is retained in the desktop rail and intentionally hidden at mobile widths, where the four stages stack into a one-handed vertical flow.

At 390×844, the current implementation measured document width 390 px against a 390 px viewport, with no horizontal overflow. The four stages stacked at y=565, 1279, 1999 and 2637. The desktop-only preview was `display:none`; the rail proof section occupied x=16, width=358. Visible primary controls retained 36 px minimum height in this partner surface, while the shared public button system continues to provide 44–46 px touch targets for general actions. No unnamed links were found.

The initial mobile audit exposed a stale stylesheet cache causing the desktop preview to remain visible. The shared stylesheet version was raised from 1.3.0 to 1.4.0, the build was rerun, and the audit then confirmed the expected mobile collapse.

Validation passed: production TypeScript build, public route contract with 56 routes, repository accessibility audit across 68 templates with zero findings, focus-visible/reduced-motion/forced-colors/minimum-touch-target CSS checks, and `git diff --check`.

The implementation is a high-fidelity structural convergence of the supplied screen set. Exact pixel equality still requires one-to-one reference exports for each individual desktop panel and mobile frame; the supplied board is a composite screen set, so it is not a single viewport baseline.
